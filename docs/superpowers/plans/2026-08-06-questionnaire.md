# Client Questionnaire Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Typeform-style progressive questionnaire at `joelcolombo.co/questionnaire/[client]/[project]` with per-answer autosave to a per-project Notion database, voice-to-text via Whisper, and an AI synthesis script.

**Architecture:** Question templates + per-project configs live in the repo (`lib/questionnaire/`). A server page resolves the config; a client app renders one question per screen and autosaves each answer through API routes into Notion (one DB per project, one row per stakeholder, columns keyed by stable question IDs). Local scripts create the Notion DB and generate an AI synthesis.

**Tech Stack:** Next.js 15 App Router (params are Promises), TypeScript strict, Tailwind, Framer Motion (installed), `@notionhq/client` (new), OpenAI Whisper API, Anthropic API, vitest (new, dev).

**Spec:** `docs/superpowers/specs/2026-08-06-questionnaire-design.md`

## Global Constraints

- Path alias `@/*` → repo root works in app code. **Scripts in `scripts/` must use relative imports** (tsx path-alias support is not guaranteed here).
- Styling: Tailwind + existing CSS vars `--background`, `--foreground`, `--hover-color`, `--selection-bg`. Font is inherited from `body` (PP Neue Montreal). Light/dark comes free via `[data-theme]` on `<html>` — never hardcode colors, always the vars.
- All questionnaire pages: `robots: { index: false, follow: false }`.
- UI copy in English.
- New dependencies allowed: `@notionhq/client` (runtime), `vitest` (dev). Nothing else.
- Env vars: `NOTION_API_KEY`, `NOTION_QUESTIONNAIRE_PARENT_PAGE_ID`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`. Add all four to `.env.example` (Task 5).
- Sliders have 7 discrete positions (1–7); 4 is neutral.
- Notion columns are keyed by a `[question-id]` name prefix — the code matches columns by that prefix, never by full name, so rewording prompts is safe.
- Honeypot sessions use the literal sessionId `'hp'` — API routes accept and silently drop them.
- Every question is skippable. Skipping records nothing in Notion.
- Commit messages end with: `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`
- Templates `branding.ts` / `website.ts` from the spec are deferred until a first project of that type exists (YAGNI) — this plan builds `visual-identity` only.

---

### Task 1: Core types, template merge, flow helpers (+ test tooling)

**Files:**
- Create: `lib/questionnaire/types.ts`
- Create: `lib/questionnaire/merge.ts`
- Create: `lib/questionnaire/flow.ts`
- Create: `vitest.config.ts`
- Modify: `package.json` (add vitest devDep + `test` script)
- Test: `lib/questionnaire/merge.test.ts`, `lib/questionnaire/flow.test.ts`

**Interfaces:**
- Consumes: nothing (first task)
- Produces: all types below; `applyOverrides(template, overrides): Template`; `buildScreens(template): Screen[]`; `questionCount(template): number`; `firstUnansweredScreen(screens, seenIds): number`; `summarizeAnswer(question, answer): string`

- [ ] **Step 1: Install tooling**

```bash
npm install @notionhq/client
npm install -D vitest
```

Add to `package.json` scripts: `"test": "vitest run"`.

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: { include: ['lib/**/*.test.ts'] },
  resolve: { alias: { '@': path.resolve(__dirname) } },
})
```

- [ ] **Step 3: Create `lib/questionnaire/types.ts`**

```ts
/** Discrete slider positions: 1..7, 4 = neutral. */
export const SLIDER_STEPS = 7

export interface TraitSliderDef {
  id: string
  left: string
  right: string
}

interface QuestionBase {
  /** Stable ID — Notion columns are keyed by it. Never change once live. */
  id: string
  prompt: string
  hint?: string
}

export type Question =
  | (QuestionBase & { type: 'text'; placeholder?: string })
  | (QuestionBase & { type: 'longtext'; placeholder?: string })
  | (QuestionBase & { type: 'select'; options: string[] })
  | (QuestionBase & { type: 'multiselect'; options: string[] })
  | (QuestionBase & { type: 'trait-slider'; slider: TraitSliderDef })
  | (QuestionBase & { type: 'dual-slider'; slider: TraitSliderDef })
  | (QuestionBase & { type: 'sliders-group'; mode: 'single' | 'dual'; sliders: TraitSliderDef[] })

export interface Section {
  id: string
  title: string
  intro?: string
  questions: Question[]
}

export interface Template {
  id: string
  title: string
  intro: string
  estimatedMinutes: number
  sections: Section[]
}

export type Answer =
  | { type: 'text'; text: string }
  | { type: 'choice'; selected: string[] }
  /** sliderId -> position (for trait-slider / dual-slider the key is the slider's id) */
  | { type: 'scale'; positions: Record<string, number> }
  | { type: 'dual-scale'; positions: Record<string, { today: number; future: number }> }

/** questionId -> Answer */
export type Answers = Record<string, Answer>

export interface ProjectConfig {
  clientSlug: string
  projectSlug: string
  clientName: string
  projectTitle: string
  /** null until `npm run questionnaire:setup` has been run and the ID pasted in */
  notionDatabaseId: string | null
  template: Template
}
```

- [ ] **Step 4: Write failing tests for `applyOverrides`** in `lib/questionnaire/merge.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { applyOverrides, type TemplateOverrides } from './merge'
import type { Template, Question } from './types'

const q = (id: string, prompt = `Prompt ${id}`): Question => ({ id, type: 'longtext', prompt })

const base: Template = {
  id: 'tpl',
  title: 'Base title',
  intro: 'Base intro',
  estimatedMinutes: 20,
  sections: [
    { id: 's1', title: 'One', questions: [q('a'), q('b')] },
    { id: 's2', title: 'Two', questions: [q('c')] },
  ],
}

describe('applyOverrides', () => {
  it('returns an equal template when overrides are empty', () => {
    const out = applyOverrides(base, {})
    expect(out).toEqual(base)
    expect(out).not.toBe(base) // must be a copy
  })

  it('removes questions by id', () => {
    const out = applyOverrides(base, { removeQuestions: ['b'] })
    expect(out.sections[0].questions.map((x) => x.id)).toEqual(['a'])
  })

  it('rewords prompts by id without touching the id', () => {
    const out = applyOverrides(base, { reword: { c: 'New prompt' } })
    expect(out.sections[1].questions[0]).toMatchObject({ id: 'c', prompt: 'New prompt' })
  })

  it('adds a question after a given question in a section', () => {
    const out = applyOverrides(base, {
      addQuestions: [{ sectionId: 's1', after: 'a', question: q('x') }],
    })
    expect(out.sections[0].questions.map((x) => x.id)).toEqual(['a', 'x', 'b'])
  })

  it('appends when `after` is omitted', () => {
    const out = applyOverrides(base, { addQuestions: [{ sectionId: 's2', question: q('y') }] })
    expect(out.sections[1].questions.map((x) => x.id)).toEqual(['c', 'y'])
  })

  it('overrides title and intro', () => {
    const out = applyOverrides(base, { title: 'T2', intro: 'I2' })
    expect(out.title).toBe('T2')
    expect(out.intro).toBe('I2')
  })
})
```

- [ ] **Step 5: Run tests — expect FAIL** (`merge.ts` does not exist)

```bash
npx vitest run lib/questionnaire/merge.test.ts
```

- [ ] **Step 6: Implement `lib/questionnaire/merge.ts`**

```ts
import type { Question, Template } from './types'

export interface TemplateOverrides {
  title?: string
  intro?: string
  removeQuestions?: string[]
  /** questionId -> new prompt */
  reword?: Record<string, string>
  addQuestions?: { sectionId: string; after?: string; question: Question }[]
}

export function applyOverrides(template: Template, o: TemplateOverrides): Template {
  const out: Template = structuredClone(template)
  if (o.title) out.title = o.title
  if (o.intro) out.intro = o.intro

  const removed = new Set(o.removeQuestions ?? [])
  for (const section of out.sections) {
    section.questions = section.questions.filter((q) => !removed.has(q.id))
    for (const q of section.questions) {
      const newPrompt = o.reword?.[q.id]
      if (newPrompt) q.prompt = newPrompt
    }
  }

  for (const add of o.addQuestions ?? []) {
    const section = out.sections.find((s) => s.id === add.sectionId)
    if (!section) continue
    const at = add.after ? section.questions.findIndex((q) => q.id === add.after) : -1
    if (at >= 0) section.questions.splice(at + 1, 0, add.question)
    else section.questions.push(add.question)
  }

  return out
}
```

- [ ] **Step 7: Write failing tests for flow helpers** in `lib/questionnaire/flow.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { buildScreens, questionCount, firstUnansweredScreen, summarizeAnswer } from './flow'
import type { Template, Question } from './types'

const q = (id: string): Question => ({ id, type: 'longtext', prompt: `P${id}` })

const tpl: Template = {
  id: 't',
  title: 'T',
  intro: 'I',
  estimatedMinutes: 10,
  sections: [
    { id: 's1', title: 'One', questions: [q('a'), q('b')] },
    { id: 's2', title: 'Two', questions: [q('c')] },
  ],
}

describe('buildScreens', () => {
  it('emits interlude before each section, then its questions', () => {
    const screens = buildScreens(tpl)
    expect(screens.map((s) => s.kind)).toEqual([
      'interlude', 'question', 'question', 'interlude', 'question',
    ])
  })

  it('numbers questions globally, 1-based', () => {
    const screens = buildScreens(tpl)
    const numbers = screens.filter((s) => s.kind === 'question').map((s) => s.kind === 'question' && s.number)
    expect(numbers).toEqual([1, 2, 3])
  })
})

describe('questionCount', () => {
  it('counts questions across sections', () => {
    expect(questionCount(tpl)).toBe(3)
  })
})

describe('firstUnansweredScreen', () => {
  const screens = buildScreens(tpl)
  it('returns 0 when nothing seen (first interlude)', () => {
    expect(firstUnansweredScreen(screens, new Set())).toBe(0)
  })
  it('returns the screen index of the first unseen question', () => {
    // 'a' seen -> first unseen question is 'b' at screen index 2 (mid-section: no interlude before it)
    expect(firstUnansweredScreen(screens, new Set(['a']))).toBe(2)
  })
  it('skips a fully seen section including its interlude', () => {
    expect(firstUnansweredScreen(screens, new Set(['a', 'b']))).toBe(3)
  })
  it('returns screens.length when everything is seen', () => {
    expect(firstUnansweredScreen(screens, new Set(['a', 'b', 'c']))).toBe(screens.length)
  })
})

describe('summarizeAnswer', () => {
  it('returns text as-is', () => {
    expect(summarizeAnswer(q('a'), { type: 'text', text: 'hello' })).toBe('hello')
  })
  it('joins choices', () => {
    const sel: Question = { id: 'x', type: 'multiselect', prompt: 'P', options: ['A', 'B'] }
    expect(summarizeAnswer(sel, { type: 'choice', selected: ['A', 'B'] })).toBe('A, B')
  })
  it('formats scale positions with pole labels', () => {
    const sl: Question = {
      id: 'y', type: 'trait-slider', prompt: 'P',
      slider: { id: 'y', left: 'Serious', right: 'Approachable' },
    }
    expect(summarizeAnswer(sl, { type: 'scale', positions: { y: 6 } })).toBe('6/7 → Approachable')
  })
  it('formats dual positions', () => {
    const sl: Question = {
      id: 'z', type: 'dual-slider', prompt: 'P',
      slider: { id: 'z', left: 'L', right: 'R' },
    }
    expect(summarizeAnswer(sl, { type: 'dual-scale', positions: { z: { today: 2, future: 6 } } }))
      .toBe('Today: 2/7 · Future: 6/7')
  })
})
```

- [ ] **Step 8: Run tests — expect FAIL** (`flow.ts` does not exist)

```bash
npx vitest run lib/questionnaire/flow.test.ts
```

- [ ] **Step 9: Implement `lib/questionnaire/flow.ts`**

```ts
import type { Answer, Question, Section, Template } from './types'

export type Screen =
  | { kind: 'interlude'; section: Section; sectionIndex: number }
  | { kind: 'question'; question: Question; section: Section; number: number }

export function buildScreens(template: Template): Screen[] {
  const screens: Screen[] = []
  let n = 0
  template.sections.forEach((section, sectionIndex) => {
    screens.push({ kind: 'interlude', section, sectionIndex })
    for (const question of section.questions) {
      n += 1
      screens.push({ kind: 'question', question, section, number: n })
    }
  })
  return screens
}

export function questionCount(template: Template): number {
  return template.sections.reduce((sum, s) => sum + s.questions.length, 0)
}

/**
 * Screen index to resume at: the first question screen whose question the
 * stakeholder hasn't answered or skipped yet ("seen"). Interludes before it
 * are skipped so resuming lands on the actual question. Returns
 * screens.length when everything is seen (caller goes to review).
 */
export function firstUnansweredScreen(screens: Screen[], seenIds: Set<string>): number {
  const index = screens.findIndex((s) => s.kind === 'question' && !seenIds.has(s.question.id))
  if (index === -1) return screens.length
  // Resuming at the first question of a section shows that section's
  // interlude first, so the stakeholder gets its context.
  return screens[index - 1]?.kind === 'interlude' ? index - 1 : index
}

export function formatScale(position: number, left: string, right: string): string {
  if (position === 4) return `4/7 · balanced`
  return position < 4 ? `${position}/7 ← ${left}` : `${position}/7 → ${right}`
}

export function formatDual(today: number, future: number): string {
  return `Today: ${today}/7 · Future: ${future}/7`
}

/** Human-readable one-liner for the review screen and Notion summaries. */
export function summarizeAnswer(question: Question, answer: Answer): string {
  switch (answer.type) {
    case 'text':
      return answer.text
    case 'choice':
      return answer.selected.join(', ')
    case 'scale': {
      const sliders = question.type === 'sliders-group' ? question.sliders
        : question.type === 'trait-slider' || question.type === 'dual-slider' ? [question.slider] : []
      return sliders
        .filter((s) => answer.positions[s.id] !== undefined)
        .map((s) => formatScale(answer.positions[s.id], s.left, s.right))
        .join(' · ')
    }
    case 'dual-scale': {
      const entries = Object.values(answer.positions)
      return entries.map((p) => formatDual(p.today, p.future)).join(' · ')
    }
  }
}
```

- [ ] **Step 10: Run all tests — expect PASS**

```bash
npm test
```

- [ ] **Step 11: Commit**

```bash
git add lib/questionnaire vitest.config.ts package.json package-lock.json
git commit -m "feat(questionnaire): core types, template overrides, flow helpers

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Visual-identity template, project registry, PRO + test configs

**Files:**
- Create: `lib/questionnaire/templates/visual-identity.ts`
- Create: `lib/questionnaire/projects/pro-vi.ts`
- Create: `lib/questionnaire/projects/test-project.ts`
- Create: `lib/questionnaire/projects/index.ts`
- Test: `lib/questionnaire/projects/index.test.ts`

**Interfaces:**
- Consumes: `Template`, `ProjectConfig`, `applyOverrides` (Task 1)
- Produces: `visualIdentityTemplate: Template`; `getProjectConfig(client: string, project: string): ProjectConfig | null`; `listProjectConfigs(): ProjectConfig[]`; `resolveConfig(cfg: ProjectConfig): ProjectConfig` (interpolates `{client}` into prompts/intros/title)

- [ ] **Step 1: Create `lib/questionnaire/templates/visual-identity.ts`**

Generic version of the DIV Fund questionnaire. `{client}` placeholders get replaced with the client name by `resolveConfig`. Brand personality traits use **dual sliders** (today vs future — the pattern from the reference video).

```ts
import type { Template } from '../types'

export const visualIdentityTemplate: Template = {
  id: 'visual-identity',
  title: 'Visual Identity Questionnaire',
  intro:
    'This questionnaire will help us align on the strategic and visual direction for the new visual identity of {client}. Answer freely — there are no right or wrong responses. The more context you share, the better we can shape a meaningful and distinctive identity.',
  estimatedMinutes: 25,
  sections: [
    {
      id: 'about',
      title: 'About the Project',
      questions: [
        { id: 'purpose', type: 'longtext', prompt: 'In your own words, how would you describe the purpose and role of {client} in one or two sentences?' },
        { id: 'key-message', type: 'longtext', prompt: 'What do you believe is most important for people to understand about {client}?' },
      ],
    },
    {
      id: 'audience',
      title: 'Audience',
      questions: [
        { id: 'audiences', type: 'longtext', prompt: 'Who are the primary audiences {client} needs to connect with?', hint: 'Describe each audience: roles, age range, familiarity with your field, motivations and expectations.' },
        { id: 'audience-priority', type: 'longtext', prompt: 'Of those audiences, which is the most strategically important to reach in the next 12–24 months?' },
        { id: 'audience-gaps', type: 'longtext', prompt: 'Are there audiences you struggle to connect with, or who misperceive {client}?' },
        { id: 'audience-channels', type: 'longtext', prompt: 'How do these audiences currently discover or interact with {client}?', hint: 'Conferences, publications, referrals, digital, etc.' },
        { id: 'internal-buyin', type: 'longtext', prompt: 'Are there internal audiences (staff, board, partners) whose buy-in is critical?' },
      ],
    },
    {
      id: 'personality',
      title: 'Brand Personality',
      questions: [
        { id: 'character', type: 'longtext', prompt: 'If {client} were a person, how would you describe their character and demeanor?', hint: 'e.g. insightful, pragmatic, visionary, approachable, rigorous, inspiring' },
        {
          id: 'traits',
          type: 'sliders-group',
          mode: 'dual',
          prompt: 'Where is {client} today — and where should the new identity take it?',
          hint: 'For each trait, set two markers: where you are now, and where you want to be.',
          sliders: [
            { id: 'academic-accessible', left: 'Academic', right: 'Accessible' },
            { id: 'conservative-experimental', left: 'Conservative', right: 'Experimental' },
            { id: 'data-human', left: 'Data-driven', right: 'Human-centered' },
            { id: 'established-emergent', left: 'Established', right: 'Emergent' },
            { id: 'global-regional', left: 'Global', right: 'Regionally grounded' },
            { id: 'institutional-progressive', left: 'Institutional', right: 'Progressive' },
            { id: 'serious-approachable', left: 'Serious', right: 'Approachable' },
            { id: 'technical-strategic', left: 'Technical', right: 'Strategic' },
            { id: 'leader-facilitator', left: 'Thought leader', right: 'Facilitator' },
            { id: 'urgent-patient', left: 'Urgent', right: 'Patient' },
          ],
        },
        { id: 'admired-orgs', type: 'longtext', prompt: 'Name 2 or 3 organizations (any sector) whose personality or tone you admire. What resonates?' },
        { id: 'avoid-traits', type: 'longtext', prompt: 'Are there personality traits {client} should explicitly avoid?', hint: 'e.g. "never bureaucratic", "not a Silicon Valley startup"' },
      ],
    },
    {
      id: 'visual-tone',
      title: 'Visual Tone & Atmosphere',
      questions: [
        { id: 'world', type: 'longtext', prompt: 'Which world should the brand lean closer to?', hint: 'e.g. evidence-based · innovation + design · collaboration + community' },
        { id: 'visual-feel', type: 'longtext', prompt: 'How should the overall visual language feel?', hint: 'Minimalist or expressive · reserved or bold · formal or contemporary · neutral or vibrant' },
        { id: 'imagery', type: 'longtext', prompt: 'How important is photography or imagery to the brand? What should it feature?', hint: 'People, data visualizations, abstract concepts, field-based imagery…' },
        { id: 'system-flex', type: 'select', prompt: 'Should the visual system feel unified and controlled, or flexible and modular?', options: ['Unified and controlled', 'Flexible and modular', 'Somewhere in between'] },
        { id: 'cliches', type: 'longtext', prompt: 'Are there visual clichés in your sector you want to consciously avoid?' },
      ],
    },
    {
      id: 'legacy',
      title: 'Identity & Legacy',
      questions: [
        { id: 'legacy-relation', type: 'select', prompt: 'How should the new identity relate to its origins?', options: ['Visually connected to our legacy', 'Fully independent and future-facing', 'Somewhere in between'] },
        { id: 'metaphors', type: 'longtext', prompt: 'Are there concepts, metaphors, or themes that feel meaningful to you?', hint: 'e.g. bridges, pathways, momentum, evidence, growth, systems, scale' },
        { id: 'visual-equity', type: 'longtext', prompt: 'Is there existing visual equity (colors, shapes, patterns) that holds meaning or recognition value?' },
        { id: 'stakeholder-feel', type: 'longtext', prompt: 'How should long-time stakeholders feel when they see the new identity?', hint: 'Continuity? Evolution? Fresh start?' },
        { id: 'legacy-constraints', type: 'longtext', prompt: 'Are there legal, political, or practical constraints we should know about?' },
        { id: 'transition-narrative', type: 'longtext', prompt: "What's the narrative you want to tell about this transition?", hint: 'e.g. graduation, evolution, new chapter, independence' },
      ],
    },
    {
      id: 'color-type',
      title: 'Color & Typography',
      questions: [
        { id: 'palette-mood', type: 'longtext', prompt: "Are there tones, moods, or palettes that feel aligned with {client}'s mission?", hint: 'e.g. grounded, optimistic, serious, hopeful, bold, restrained' },
        { id: 'type-feel', type: 'select', prompt: 'How should the typography feel?', options: ['Editorial / journalistic', 'Technical / scientific', 'Warm / humanistic', 'A mix — I’ll explain in the next question'] },
        { id: 'color-equity', type: 'longtext', prompt: 'Any existing brand colors with equity or meaning worth preserving or referencing?' },
        { id: 'color-avoid', type: 'longtext', prompt: 'Any colors strongly associated with competitors or peers that we should avoid?' },
      ],
    },
    {
      id: 'references',
      title: 'References & Inspiration',
      questions: [
        { id: 'references', type: 'longtext', prompt: 'Share 2 or 3 visual references that resonate with the direction you envision.', hint: 'Websites, identities, graphic systems — paste links if you have them.' },
        { id: 'references-like', type: 'longtext', prompt: 'What specifically do you like about them?' },
        { id: 'references-avoid', type: 'longtext', prompt: "Are there identities you actively dislike or don't want to resemble? What doesn't work?" },
      ],
    },
    {
      id: 'success',
      title: 'Success & Perception',
      questions: [
        { id: 'first-impression', type: 'longtext', prompt: 'When someone encounters the new identity for the first time, how should they feel?' },
        { id: 'practical-success', type: 'longtext', prompt: 'What would make this project a success in practical terms?', hint: 'e.g. increased applications, media recognition, easier partnerships, internal pride' },
        { id: 'year-later', type: 'longtext', prompt: 'A year from now, how will you know the new identity is working?' },
      ],
    },
    {
      id: 'verbal',
      title: 'Verbal Identity & Messaging',
      questions: [
        { id: 'key-phrases', type: 'longtext', prompt: 'Are there key phrases, terms, or vocabulary central to how {client} communicates?' },
        { id: 'voice', type: 'longtext', prompt: "How would you describe {client}'s voice?", hint: 'e.g. authoritative but warm, precise but inspiring' },
      ],
    },
    {
      id: 'final',
      title: 'Anything Else',
      questions: [
        { id: 'final-notes', type: 'longtext', prompt: 'Any context, concern, or idea you’d like to share that could help shape this project?' },
      ],
    },
  ],
}
```

- [ ] **Step 2: Create `lib/questionnaire/projects/pro-vi.ts`**

```ts
import { applyOverrides } from '../merge'
import { visualIdentityTemplate } from '../templates/visual-identity'
import type { ProjectConfig } from '../types'

/**
 * PRO (proimpact.tools) — Visual Identity.
 * Question overrides pending: Joel will tailor prompts once the proposal
 * closes and meeting context is available. Template runs as-is until then.
 */
export const proVi: ProjectConfig = {
  clientSlug: 'pro',
  projectSlug: 'visual-identity',
  clientName: 'PRO',
  projectTitle: 'Visual Identity',
  notionDatabaseId: null, // paste the ID printed by `npm run questionnaire:setup -- pro/visual-identity`
  template: applyOverrides(visualIdentityTemplate, {}),
}
```

- [ ] **Step 3: Create `lib/questionnaire/projects/test-project.ts`**

```ts
import { applyOverrides } from '../merge'
import { visualIdentityTemplate } from '../templates/visual-identity'
import type { ProjectConfig } from '../types'

/** Sandbox project for manual QA. Points at a throwaway Notion DB. */
export const testProject: ProjectConfig = {
  clientSlug: 'test',
  projectSlug: 'sandbox',
  clientName: 'Acme Co',
  projectTitle: 'Visual Identity (Test)',
  notionDatabaseId: null, // paste the ID printed by `npm run questionnaire:setup -- test/sandbox`
  template: applyOverrides(visualIdentityTemplate, {}),
}
```

- [ ] **Step 4: Write failing tests** in `lib/questionnaire/projects/index.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { getProjectConfig, listProjectConfigs, resolveConfig } from './index'

describe('getProjectConfig', () => {
  it('finds a project by client and project slugs', () => {
    const cfg = getProjectConfig('pro', 'visual-identity')
    expect(cfg?.clientName).toBe('PRO')
  })
  it('returns null for unknown slugs', () => {
    expect(getProjectConfig('nope', 'nothing')).toBeNull()
  })
})

describe('listProjectConfigs', () => {
  it('includes all registered projects', () => {
    const slugs = listProjectConfigs().map((c) => `${c.clientSlug}/${c.projectSlug}`)
    expect(slugs).toContain('pro/visual-identity')
    expect(slugs).toContain('test/sandbox')
  })
})

describe('resolveConfig', () => {
  it('replaces {client} with the client name in intro and prompts', () => {
    const cfg = resolveConfig(getProjectConfig('pro', 'visual-identity')!)
    expect(cfg.template.intro).toContain('PRO')
    expect(cfg.template.intro).not.toContain('{client}')
    const first = cfg.template.sections[0].questions[0]
    expect(first.prompt).toContain('PRO')
  })
  it('does not mutate the original config', () => {
    const original = getProjectConfig('pro', 'visual-identity')!
    resolveConfig(original)
    expect(original.template.intro).toContain('{client}')
  })
})
```

- [ ] **Step 5: Run tests — expect FAIL** (`index.ts` does not exist)

```bash
npx vitest run lib/questionnaire/projects/index.test.ts
```

- [ ] **Step 6: Implement `lib/questionnaire/projects/index.ts`**

```ts
import type { ProjectConfig } from '../types'
import { proVi } from './pro-vi'
import { testProject } from './test-project'

const registry: ProjectConfig[] = [proVi, testProject]

export function getProjectConfig(client: string, project: string): ProjectConfig | null {
  return registry.find((c) => c.clientSlug === client && c.projectSlug === project) ?? null
}

export function listProjectConfigs(): ProjectConfig[] {
  return [...registry]
}

/** Replaces `{client}` placeholders with the client name across all copy. */
export function resolveConfig(cfg: ProjectConfig): ProjectConfig {
  const out = structuredClone(cfg)
  const sub = (s: string) => s.replaceAll('{client}', cfg.clientName)
  out.template.title = sub(out.template.title)
  out.template.intro = sub(out.template.intro)
  for (const section of out.template.sections) {
    if (section.intro) section.intro = sub(section.intro)
    for (const q of section.questions) {
      q.prompt = sub(q.prompt)
      if (q.hint) q.hint = sub(q.hint)
    }
  }
  return out
}
```

- [ ] **Step 7: Run all tests — expect PASS**

```bash
npm test
```

- [ ] **Step 8: Commit**

```bash
git add lib/questionnaire
git commit -m "feat(questionnaire): visual-identity template, project registry, PRO config

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Notion column mapping + answer formatting/parsing

**Files:**
- Create: `lib/questionnaire/notion-format.ts`
- Test: `lib/questionnaire/notion-format.test.ts`

**Interfaces:**
- Consumes: `Question`, `Answer`, `Template` (Task 1); `formatScale`, `formatDual` (Task 1 `flow.ts`)
- Produces:
  - `type ColumnDef = { key: string; name: string; kind: 'rich_text' | 'select' | 'multi_select'; options?: string[] }`
  - `type FormattedEntry = { key: string; kind: ColumnDef['kind']; value: string | string[] }`
  - `columnsForQuestion(q: Question): ColumnDef[]`
  - `formatAnswer(q: Question, a: Answer): FormattedEntry[]`
  - `parseAnswer(q: Question, getProp: (key: string) => NotionPropValue | undefined): Answer | undefined`
  - `type NotionPropValue = { type: 'rich_text'; text: string } | { type: 'select'; name: string | null } | { type: 'multi_select'; names: string[] }`
  - `buildDatabaseProperties(template: Template): Record<string, object>` (Notion `databases.create` properties payload)
  - `QUESTION_KEY_RE = /^\[([^\]]+)\]/` (extracts the question key from a column name)

- [ ] **Step 1: Write failing tests** in `lib/questionnaire/notion-format.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import {
  columnsForQuestion, formatAnswer, parseAnswer, buildDatabaseProperties, QUESTION_KEY_RE,
  type NotionPropValue,
} from './notion-format'
import type { Question, Template } from './types'

const longtext: Question = { id: 'purpose', type: 'longtext', prompt: 'Describe the purpose of the org in your own words' }
const select: Question = { id: 'type-feel', type: 'select', prompt: 'How should the typography feel?', options: ['Editorial', 'Technical'] }
const multi: Question = { id: 'worlds', type: 'multiselect', prompt: 'Pick worlds', options: ['A', 'B', 'C'] }
const group: Question = {
  id: 'traits', type: 'sliders-group', mode: 'dual', prompt: 'Traits',
  sliders: [
    { id: 'serious-approachable', left: 'Serious', right: 'Approachable' },
    { id: 'urgent-patient', left: 'Urgent', right: 'Patient' },
  ],
}
const single: Question = { id: 'tone', type: 'trait-slider', prompt: 'Tone', slider: { id: 'tone', left: 'Quiet', right: 'Loud' } }

describe('columnsForQuestion', () => {
  it('prefixes column names with [question-id]', () => {
    const [col] = columnsForQuestion(longtext)
    expect(col.key).toBe('purpose')
    expect(col.name.startsWith('[purpose] ')).toBe(true)
    expect(col.kind).toBe('rich_text')
  })
  it('truncates long prompts in column names to 60 chars of prompt', () => {
    const [col] = columnsForQuestion(longtext)
    expect(col.name.length).toBeLessThanOrEqual('[purpose] '.length + 60)
  })
  it('maps select/multiselect kinds with options', () => {
    expect(columnsForQuestion(select)[0]).toMatchObject({ kind: 'select', options: ['Editorial', 'Technical'] })
    expect(columnsForQuestion(multi)[0]).toMatchObject({ kind: 'multi_select' })
  })
  it('emits one column per slider in a group, keyed questionId.sliderId', () => {
    const cols = columnsForQuestion(group)
    expect(cols.map((c) => c.key)).toEqual(['traits.serious-approachable', 'traits.urgent-patient'])
    expect(cols[0].name).toBe('[traits.serious-approachable] Serious / Approachable')
  })
})

describe('QUESTION_KEY_RE', () => {
  it('extracts the key from a column name', () => {
    expect('[traits.urgent-patient] Urgent / Patient'.match(QUESTION_KEY_RE)?.[1]).toBe('traits.urgent-patient')
  })
})

describe('formatAnswer / parseAnswer roundtrip', () => {
  const roundtrip = (q: Question, a: Parameters<typeof formatAnswer>[1]) => {
    const entries = formatAnswer(q, a)
    const byKey = new Map(entries.map((e) => [e.key, e]))
    const getProp = (key: string): NotionPropValue | undefined => {
      const e = byKey.get(key)
      if (!e) return undefined
      if (e.kind === 'rich_text') return { type: 'rich_text', text: e.value as string }
      if (e.kind === 'select') return { type: 'select', name: (e.value as string) || null }
      return { type: 'multi_select', names: e.value as string[] }
    }
    return parseAnswer(q, getProp)
  }

  it('text', () => {
    const a = { type: 'text' as const, text: 'Hello world' }
    expect(roundtrip(longtext, a)).toEqual(a)
  })
  it('select', () => {
    const a = { type: 'choice' as const, selected: ['Editorial'] }
    expect(roundtrip(select, a)).toEqual(a)
  })
  it('multiselect', () => {
    const a = { type: 'choice' as const, selected: ['A', 'C'] }
    expect(roundtrip(multi, a)).toEqual(a)
  })
  it('single scale', () => {
    const a = { type: 'scale' as const, positions: { tone: 5 } }
    expect(roundtrip(single, a)).toEqual(a)
    expect(formatAnswer(single, a)[0].value).toBe('5/7 → Loud')
  })
  it('dual scale group', () => {
    const a = { type: 'dual-scale' as const, positions: { 'serious-approachable': { today: 2, future: 6 }, 'urgent-patient': { today: 4, future: 4 } } }
    expect(roundtrip(group, a)).toEqual(a)
    expect(formatAnswer(group, a)[0].value).toBe('Today: 2/7 · Future: 6/7')
  })
  it('returns undefined for empty properties', () => {
    expect(parseAnswer(longtext, () => undefined)).toBeUndefined()
    expect(parseAnswer(longtext, () => ({ type: 'rich_text', text: '' }))).toBeUndefined()
  })
})

describe('buildDatabaseProperties', () => {
  const tpl: Template = {
    id: 't', title: 'T', intro: '', estimatedMinutes: 5,
    sections: [{ id: 's', title: 'S', questions: [longtext, select, group] }],
  }
  const props = buildDatabaseProperties(tpl)
  it('includes base columns', () => {
    expect(props['Name']).toEqual({ title: {} })
    expect(props['Email']).toEqual({ email: {} })
    expect(props['Status']).toEqual({ select: { options: [{ name: 'In progress' }, { name: 'Completed' }] } })
  })
  it('includes one property per question column with correct types', () => {
    const names = Object.keys(props)
    expect(names.some((n) => n.startsWith('[purpose]'))).toBe(true)
    expect(names.some((n) => n.startsWith('[traits.urgent-patient]'))).toBe(true)
    const selectName = names.find((n) => n.startsWith('[type-feel]'))!
    expect(props[selectName]).toEqual({ select: { options: [{ name: 'Editorial' }, { name: 'Technical' }] } })
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL** (`notion-format.ts` does not exist)

```bash
npx vitest run lib/questionnaire/notion-format.test.ts
```

- [ ] **Step 3: Implement `lib/questionnaire/notion-format.ts`**

```ts
import { formatDual, formatScale } from './flow'
import type { Answer, Question, Template, TraitSliderDef } from './types'

export const QUESTION_KEY_RE = /^\[([^\]]+)\]/

export type ColumnDef = {
  key: string
  name: string
  kind: 'rich_text' | 'select' | 'multi_select'
  options?: string[]
}

export type FormattedEntry = { key: string; kind: ColumnDef['kind']; value: string | string[] }

export type NotionPropValue =
  | { type: 'rich_text'; text: string }
  | { type: 'select'; name: string | null }
  | { type: 'multi_select'; names: string[] }

const truncate = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n - 1) + '…')

function slidersOf(q: Question): TraitSliderDef[] {
  if (q.type === 'sliders-group') return q.sliders
  if (q.type === 'trait-slider' || q.type === 'dual-slider') return [q.slider]
  return []
}

export function columnsForQuestion(q: Question): ColumnDef[] {
  switch (q.type) {
    case 'text':
    case 'longtext':
      return [{ key: q.id, name: `[${q.id}] ${truncate(q.prompt, 60)}`, kind: 'rich_text' }]
    case 'select':
      return [{ key: q.id, name: `[${q.id}] ${truncate(q.prompt, 60)}`, kind: 'select', options: q.options }]
    case 'multiselect':
      return [{ key: q.id, name: `[${q.id}] ${truncate(q.prompt, 60)}`, kind: 'multi_select', options: q.options }]
    case 'trait-slider':
    case 'dual-slider':
      return [{ key: q.id, name: `[${q.id}] ${q.slider.left} / ${q.slider.right}`, kind: 'rich_text' }]
    case 'sliders-group':
      return q.sliders.map((s) => ({
        key: `${q.id}.${s.id}`,
        name: `[${q.id}.${s.id}] ${s.left} / ${s.right}`,
        kind: 'rich_text' as const,
      }))
  }
}

export function formatAnswer(q: Question, a: Answer): FormattedEntry[] {
  switch (a.type) {
    case 'text':
      return [{ key: q.id, kind: 'rich_text', value: a.text }]
    case 'choice':
      if (q.type === 'multiselect') return [{ key: q.id, kind: 'multi_select', value: a.selected }]
      return [{ key: q.id, kind: 'select', value: a.selected[0] ?? '' }]
    case 'scale':
      return slidersOf(q)
        .filter((s) => a.positions[s.id] !== undefined)
        .map((s) => ({
          key: q.type === 'sliders-group' ? `${q.id}.${s.id}` : q.id,
          kind: 'rich_text' as const,
          value: formatScale(a.positions[s.id], s.left, s.right),
        }))
    case 'dual-scale':
      return slidersOf(q)
        .filter((s) => a.positions[s.id] !== undefined)
        .map((s) => ({
          key: q.type === 'sliders-group' ? `${q.id}.${s.id}` : q.id,
          kind: 'rich_text' as const,
          value: formatDual(a.positions[s.id].today, a.positions[s.id].future),
        }))
  }
}

const SCALE_RE = /^([1-7])\/7/
const DUAL_RE = /^Today: ([1-7])\/7 · Future: ([1-7])\/7$/

export function parseAnswer(
  q: Question,
  getProp: (key: string) => NotionPropValue | undefined
): Answer | undefined {
  switch (q.type) {
    case 'text':
    case 'longtext': {
      const p = getProp(q.id)
      if (p?.type !== 'rich_text' || !p.text) return undefined
      return { type: 'text', text: p.text }
    }
    case 'select': {
      const p = getProp(q.id)
      if (p?.type !== 'select' || !p.name) return undefined
      return { type: 'choice', selected: [p.name] }
    }
    case 'multiselect': {
      const p = getProp(q.id)
      if (p?.type !== 'multi_select' || p.names.length === 0) return undefined
      return { type: 'choice', selected: p.names }
    }
    case 'trait-slider':
    case 'dual-slider':
    case 'sliders-group': {
      const dual = q.type === 'dual-slider' || (q.type === 'sliders-group' && q.mode === 'dual')
      const scale: Record<string, number> = {}
      const dualScale: Record<string, { today: number; future: number }> = {}
      for (const s of slidersOf(q)) {
        const key = q.type === 'sliders-group' ? `${q.id}.${s.id}` : q.id
        const p = getProp(key)
        if (p?.type !== 'rich_text' || !p.text) continue
        if (dual) {
          const m = p.text.match(DUAL_RE)
          if (m) dualScale[s.id] = { today: Number(m[1]), future: Number(m[2]) }
        } else {
          const m = p.text.match(SCALE_RE)
          if (m) scale[s.id] = Number(m[1])
        }
      }
      if (dual) {
        return Object.keys(dualScale).length ? { type: 'dual-scale', positions: dualScale } : undefined
      }
      return Object.keys(scale).length ? { type: 'scale', positions: scale } : undefined
    }
  }
}

/** Properties payload for Notion `databases.create`. */
export function buildDatabaseProperties(template: Template): Record<string, object> {
  const props: Record<string, object> = {
    Name: { title: {} },
    Email: { email: {} },
    Status: { select: { options: [{ name: 'In progress' }, { name: 'Completed' }] } },
  }
  for (const section of template.sections) {
    for (const q of section.questions) {
      for (const col of columnsForQuestion(q)) {
        if (col.kind === 'rich_text') props[col.name] = { rich_text: {} }
        else if (col.kind === 'select') props[col.name] = { select: { options: (col.options ?? []).map((name) => ({ name })) } }
        else props[col.name] = { multi_select: { options: (col.options ?? []).map((name) => ({ name })) } }
      }
    }
  }
  return props
}
```

- [ ] **Step 4: Run all tests — expect PASS**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add lib/questionnaire
git commit -m "feat(questionnaire): Notion column mapping and answer format/parse

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Notion client operations

**Files:**
- Create: `lib/questionnaire/notion.ts`

**Interfaces:**
- Consumes: `columnsForQuestion`, `formatAnswer`, `parseAnswer`, `QUESTION_KEY_RE`, `NotionPropValue` (Task 3); types (Task 1)
- Produces:
  - `findRow(dbId: string, email: string, template: Template): Promise<{ pageId: string; answers: Answers; completed: boolean } | null>`
  - `createRow(dbId: string, name: string, email: string): Promise<string>` (returns pageId)
  - `saveAnswer(dbId: string, pageId: string, q: Question, a: Answer): Promise<void>`
  - `markCompleted(pageId: string): Promise<void>`
  - `getPropertyMap(dbId: string): Promise<Map<string, string>>` (question key → actual property name; cached 60s)

No unit tests (pure integration) — verified end-to-end in Tasks 5–6.

- [ ] **Step 1: Implement `lib/questionnaire/notion.ts`**

```ts
import { Client } from '@notionhq/client'
import { columnsForQuestion, formatAnswer, parseAnswer, QUESTION_KEY_RE, type NotionPropValue } from './notion-format'
import type { Answer, Answers, Question, Template } from './types'

const notion = () => new Client({ auth: process.env.NOTION_API_KEY })

/** Notion rich_text items cap at 2000 chars; chunk below that. */
const chunkRichText = (s: string) => {
  const out: { text: { content: string } }[] = []
  for (let i = 0; i < s.length; i += 1900) out.push({ text: { content: s.slice(i, i + 1900) } })
  return out.length ? out : [{ text: { content: '' } }]
}

/** question key -> actual property name, resolved by [key] prefix. Cached 60s per DB. */
const propertyMapCache = new Map<string, { at: number; map: Map<string, string> }>()

export async function getPropertyMap(dbId: string): Promise<Map<string, string>> {
  const cached = propertyMapCache.get(dbId)
  if (cached && Date.now() - cached.at < 60_000) return cached.map
  const db = await notion().databases.retrieve({ database_id: dbId })
  const map = new Map<string, string>()
  for (const name of Object.keys((db as { properties: Record<string, unknown> }).properties)) {
    const m = name.match(QUESTION_KEY_RE)
    if (m) map.set(m[1], name)
  }
  propertyMapCache.set(dbId, { at: Date.now(), map })
  return map
}

type RawProp =
  | { type: 'rich_text'; rich_text: { plain_text: string }[] }
  | { type: 'select'; select: { name: string } | null }
  | { type: 'multi_select'; multi_select: { name: string }[] }
  | { type: string }

function toPropValue(raw: RawProp | undefined): NotionPropValue | undefined {
  if (!raw) return undefined
  if (raw.type === 'rich_text' && 'rich_text' in raw)
    return { type: 'rich_text', text: raw.rich_text.map((t) => t.plain_text).join('') }
  if (raw.type === 'select' && 'select' in raw)
    return { type: 'select', name: raw.select?.name ?? null }
  if (raw.type === 'multi_select' && 'multi_select' in raw)
    return { type: 'multi_select', names: raw.multi_select.map((o) => o.name) }
  return undefined
}

export async function findRow(dbId: string, email: string, template: Template) {
  const res = await notion().databases.query({
    database_id: dbId,
    filter: { property: 'Email', email: { equals: email.trim().toLowerCase() } },
    page_size: 1,
  })
  const page = res.results[0] as { id: string; properties: Record<string, RawProp> } | undefined
  if (!page) return null

  const names = await getPropertyMap(dbId)
  const answers: Answers = {}
  for (const section of template.sections) {
    for (const q of section.questions) {
      const getProp = (key: string) => toPropValue(page.properties[names.get(key) ?? ''])
      const a = parseAnswer(q, getProp)
      if (a) answers[q.id] = a
    }
  }
  const status = toPropValue(page.properties['Status'])
  const completed = status?.type === 'select' && status.name === 'Completed'
  return { pageId: page.id, answers, completed }
}

export async function createRow(dbId: string, name: string, email: string): Promise<string> {
  const page = await notion().pages.create({
    parent: { database_id: dbId },
    properties: {
      Name: { title: [{ text: { content: name } }] },
      Email: { email: email.trim().toLowerCase() },
      Status: { select: { name: 'In progress' } },
    },
  })
  return page.id
}

export async function saveAnswer(dbId: string, pageId: string, q: Question, a: Answer): Promise<void> {
  const names = await getPropertyMap(dbId)
  const properties: Record<string, object> = {}
  const kinds = new Map(columnsForQuestion(q).map((c) => [c.key, c.kind]))
  for (const entry of formatAnswer(q, a)) {
    const name = names.get(entry.key)
    if (!name) {
      console.error(`[questionnaire] no Notion column for key "${entry.key}" — run setup --sync`)
      continue
    }
    const kind = kinds.get(entry.key)
    if (kind === 'multi_select') properties[name] = { multi_select: (entry.value as string[]).map((v) => ({ name: v })) }
    else if (kind === 'select') properties[name] = entry.value ? { select: { name: entry.value as string } } : { select: null }
    else properties[name] = { rich_text: chunkRichText(entry.value as string) }
  }
  if (Object.keys(properties).length === 0) return
  await notion().pages.update({ page_id: pageId, properties })
}

export async function markCompleted(pageId: string): Promise<void> {
  await notion().pages.update({
    page_id: pageId,
    properties: { Status: { select: { name: 'Completed' } } },
  })
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```
Expected: no errors in `lib/questionnaire/` (pre-existing errors elsewhere, if any, are out of scope).

- [ ] **Step 3: Commit**

```bash
git add lib/questionnaire/notion.ts
git commit -m "feat(questionnaire): Notion row operations

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Notion setup script + sandbox database

**Files:**
- Create: `scripts/questionnaire-setup.ts`
- Modify: `package.json` (add `questionnaire:setup` script)
- Modify: `.env.example` (document the four new env vars)

**Interfaces:**
- Consumes: `getProjectConfig`, `resolveConfig` (Task 2); `buildDatabaseProperties`, `columnsForQuestion`, `QUESTION_KEY_RE` (Task 3)
- Produces: CLI `npm run questionnaire:setup -- <client>/<project> [--sync]`

- [ ] **Step 1: One-time manual setup (Joel)**

1. Create a Notion internal integration at notion.so/my-integrations → copy the token.
2. Share the **Launchpad** page (or a dedicated "Questionnaires" page) with the integration.
3. Copy that parent page's ID from its URL (the 32-hex-char segment).
4. Add to `.env.local`:
   ```
   NOTION_API_KEY=secret_xxx
   NOTION_QUESTIONNAIRE_PARENT_PAGE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   OPENAI_API_KEY=sk-xxx        # copy from formform (Vercel dashboard → formform project → env vars)
   ANTHROPIC_API_KEY=sk-ant-xxx # only needed for the synthesize script
   ```
5. Add `NOTION_API_KEY` and `OPENAI_API_KEY` to the Vercel project (hey-portfolio) via dashboard → Settings → Environment Variables. (`NOTION_QUESTIONNAIRE_PARENT_PAGE_ID` and `ANTHROPIC_API_KEY` are script-only, not needed in Vercel.)

- [ ] **Step 2: Add to `.env.example`**

```
# Questionnaire
NOTION_API_KEY=
NOTION_QUESTIONNAIRE_PARENT_PAGE_ID=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
```

- [ ] **Step 3: Implement `scripts/questionnaire-setup.ts`** (relative imports — no `@/` in scripts)

```ts
import { config as loadEnv } from 'dotenv'
loadEnv({ path: '.env.local' })

import { Client } from '@notionhq/client'
import { getProjectConfig, resolveConfig } from '../lib/questionnaire/projects'
import { buildDatabaseProperties, columnsForQuestion, QUESTION_KEY_RE } from '../lib/questionnaire/notion-format'

async function main() {
  const [slugPair, flag] = process.argv.slice(2)
  const [client, project] = (slugPair ?? '').split('/')
  const raw = client && project ? getProjectConfig(client, project) : null
  if (!raw) {
    console.error('Usage: npm run questionnaire:setup -- <client>/<project> [--sync]')
    process.exit(1)
  }
  const cfg = resolveConfig(raw)
  const notion = new Client({ auth: process.env.NOTION_API_KEY })

  if (flag === '--sync') {
    if (!cfg.notionDatabaseId) {
      console.error('Config has no notionDatabaseId — run without --sync first.')
      process.exit(1)
    }
    const db = await notion.databases.retrieve({ database_id: cfg.notionDatabaseId })
    const existing = (db as { properties: Record<string, { id: string }> }).properties
    const byKey = new Map<string, { name: string; id: string }>()
    for (const [name, prop] of Object.entries(existing)) {
      const m = name.match(QUESTION_KEY_RE)
      if (m) byKey.set(m[1], { name, id: prop.id })
    }
    const wanted = buildDatabaseProperties(cfg.template)
    const patch: Record<string, object> = {}
    for (const [name, def] of Object.entries(wanted)) {
      const m = name.match(QUESTION_KEY_RE)
      if (!m) continue // base columns already exist
      const current = byKey.get(m[1])
      if (!current) patch[name] = def                        // new column
      else if (current.name !== name) patch[current.name] = { name } // reworded → rename in place
    }
    if (Object.keys(patch).length === 0) {
      console.log('Already in sync.')
      return
    }
    await notion.databases.update({ database_id: cfg.notionDatabaseId, properties: patch })
    console.log(`Synced ${Object.keys(patch).length} column(s).`)
    return
  }

  const parentId = process.env.NOTION_QUESTIONNAIRE_PARENT_PAGE_ID
  if (!parentId) {
    console.error('Missing NOTION_QUESTIONNAIRE_PARENT_PAGE_ID in .env.local')
    process.exit(1)
  }
  const db = await notion.databases.create({
    parent: { type: 'page_id', page_id: parentId },
    title: [{ text: { content: `${cfg.clientName} — ${cfg.projectTitle} (Responses)` } }],
    properties: buildDatabaseProperties(cfg.template) as never,
  })
  const count = cfg.template.sections.flatMap((s) => s.questions).flatMap(columnsForQuestion).length
  console.log(`\nCreated database with ${count} question columns.`)
  console.log(`\n  notionDatabaseId: '${db.id}'\n`)
  console.log(`Paste that into the notionDatabaseId of the ProjectConfig for ${slugPair} in lib/questionnaire/projects/.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

Add to `package.json` scripts: `"questionnaire:setup": "tsx scripts/questionnaire-setup.ts"`.

- [ ] **Step 4: Create the sandbox DB and wire it up**

```bash
npm run questionnaire:setup -- test/sandbox
```
Expected: prints a database ID and the DB appears in Notion under the parent page with `[question-id]`-prefixed columns. Paste the ID into `notionDatabaseId` in `lib/questionnaire/projects/test-project.ts`.

- [ ] **Step 5: Verify --sync is a no-op right after creation**

```bash
npm run questionnaire:setup -- test/sandbox --sync
```
Expected: `Already in sync.`

- [ ] **Step 6: Commit**

```bash
git add scripts/questionnaire-setup.ts package.json .env.example lib/questionnaire/projects/test-project.ts
git commit -m "feat(questionnaire): Notion database setup script

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Session & answer API routes

**Files:**
- Create: `app/api/questionnaire/session/route.ts`
- Create: `app/api/questionnaire/answer/route.ts`

**Interfaces:**
- Consumes: `getProjectConfig`, `resolveConfig` (Task 2); `findRow`, `createRow`, `saveAnswer`, `markCompleted` (Task 4)
- Produces:
  - `POST /api/questionnaire/session` body `{ client, project, name, email, website }` → `{ sessionId, answers, completed }` (honeypot `website` filled → `{ sessionId: 'hp', answers: {}, completed: false }`)
  - `POST /api/questionnaire/answer` body `{ client, project, sessionId, questionId | null, answer | null, complete? }` → `{ ok: true }` | 502 on Notion failure (client retries)

- [ ] **Step 1: Implement `app/api/questionnaire/session/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { getProjectConfig, resolveConfig } from '@/lib/questionnaire/projects'
import { createRow, findRow } from '@/lib/questionnaire/notion'

export async function POST(req: Request) {
  let body: { client?: string; project?: string; name?: string; email?: string; website?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }
  const { client, project, name, email, website } = body

  // Honeypot: pretend success, save nothing.
  if (website) return NextResponse.json({ sessionId: 'hp', answers: {}, completed: false })

  if (!client || !project || !name?.trim() || !email?.includes('@')) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }
  const cfg = getProjectConfig(client, project)
  if (!cfg?.notionDatabaseId) return NextResponse.json({ error: 'not found' }, { status: 404 })

  try {
    const template = resolveConfig(cfg).template
    const existing = await findRow(cfg.notionDatabaseId, email, template)
    if (existing) {
      return NextResponse.json({ sessionId: existing.pageId, answers: existing.answers, completed: existing.completed })
    }
    const pageId = await createRow(cfg.notionDatabaseId, name.trim(), email)
    return NextResponse.json({ sessionId: pageId, answers: {}, completed: false })
  } catch (err) {
    console.error('[questionnaire/session]', err)
    return NextResponse.json({ error: 'notion unavailable' }, { status: 502 })
  }
}
```

- [ ] **Step 2: Implement `app/api/questionnaire/answer/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { getProjectConfig, resolveConfig } from '@/lib/questionnaire/projects'
import { markCompleted, saveAnswer } from '@/lib/questionnaire/notion'
import type { Answer } from '@/lib/questionnaire/types'

export async function POST(req: Request) {
  let body: {
    client?: string; project?: string; sessionId?: string
    questionId?: string | null; answer?: Answer | null; complete?: boolean
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }
  const { client, project, sessionId, questionId, answer, complete } = body

  if (sessionId === 'hp') return NextResponse.json({ ok: true }) // honeypot session: drop silently

  if (!client || !project || !sessionId) return NextResponse.json({ error: 'bad request' }, { status: 400 })
  const cfg = getProjectConfig(client, project)
  if (!cfg?.notionDatabaseId) return NextResponse.json({ error: 'not found' }, { status: 404 })

  try {
    if (questionId && answer) {
      const question = resolveConfig(cfg)
        .template.sections.flatMap((s) => s.questions)
        .find((q) => q.id === questionId)
      if (!question) return NextResponse.json({ error: 'unknown question' }, { status: 400 })
      await saveAnswer(cfg.notionDatabaseId, sessionId, question, answer)
    }
    if (complete) await markCompleted(sessionId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[questionnaire/answer]', err)
    return NextResponse.json({ error: 'notion unavailable' }, { status: 502 })
  }
}
```

- [ ] **Step 3: Verify with curl against the sandbox DB**

```bash
npm run dev:http &
sleep 5
# Create session
curl -s -X POST localhost:3000/api/questionnaire/session \
  -H 'content-type: application/json' \
  -d '{"client":"test","project":"sandbox","name":"QA Tester","email":"qa@example.com"}'
# → {"sessionId":"<pageId>","answers":{},"completed":false}

# Save a text answer (use the sessionId from above)
curl -s -X POST localhost:3000/api/questionnaire/answer \
  -H 'content-type: application/json' \
  -d '{"client":"test","project":"sandbox","sessionId":"<pageId>","questionId":"purpose","answer":{"type":"text","text":"We make widgets."}}'
# → {"ok":true}

# Resume returns the saved answer
curl -s -X POST localhost:3000/api/questionnaire/session \
  -H 'content-type: application/json' \
  -d '{"client":"test","project":"sandbox","name":"QA Tester","email":"qa@example.com"}'
# → answers contains {"purpose":{"type":"text","text":"We make widgets."}}

# Honeypot
curl -s -X POST localhost:3000/api/questionnaire/session \
  -H 'content-type: application/json' \
  -d '{"client":"test","project":"sandbox","name":"Bot","email":"b@b.com","website":"spam.com"}'
# → {"sessionId":"hp",...}
```
Also check the row appears in the Notion sandbox DB with the "purpose" column filled and Status "In progress".

- [ ] **Step 4: Commit**

```bash
git add app/api/questionnaire
git commit -m "feat(questionnaire): session and answer API routes

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: Transcribe API route

**Files:**
- Create: `app/api/questionnaire/transcribe/route.ts`

**Interfaces:**
- Consumes: nothing internal (OpenAI Whisper HTTP API — same pattern as formform `api/partner-lead.ts`)
- Produces: `POST /api/questionnaire/transcribe` with `FormData { audio: File }` → `{ text: string }` | 422 (no/oversized audio) | 502 (Whisper failure)

- [ ] **Step 1: Implement `app/api/questionnaire/transcribe/route.ts`**

```ts
import { NextResponse } from 'next/server'

export const maxDuration = 60

const MAX_BYTES = 8 * 1024 * 1024 // ~180s of webm/opus is well under this

export async function POST(req: Request) {
  const key = process.env.OPENAI_API_KEY
  if (!key) return NextResponse.json({ error: 'transcription not configured' }, { status: 503 })

  let audio: File | null = null
  try {
    const form = await req.formData()
    const entry = form.get('audio')
    if (entry instanceof File) audio = entry
  } catch {
    /* fall through */
  }
  if (!audio || audio.size === 0) return NextResponse.json({ error: 'no audio' }, { status: 422 })
  if (audio.size > MAX_BYTES) return NextResponse.json({ error: 'audio too large' }, { status: 422 })

  const out = new FormData()
  const ext = audio.type.includes('mp4') ? 'mp4' : audio.type.includes('ogg') ? 'ogg' : 'webm'
  out.append('file', audio, `note.${ext}`)
  out.append('model', 'whisper-1')

  try {
    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: out,
    })
    if (!res.ok) {
      console.error('[questionnaire/transcribe] whisper failed', res.status)
      return NextResponse.json({ error: 'transcription failed' }, { status: 502 })
    }
    const data = (await res.json()) as { text?: string }
    return NextResponse.json({ text: data.text ?? '' })
  } catch (err) {
    console.error('[questionnaire/transcribe]', err)
    return NextResponse.json({ error: 'transcription failed' }, { status: 502 })
  }
}
```

- [ ] **Step 2: Verify with a real audio file**

Record a 3-second voice memo (or use any small audio file), then:

```bash
curl -s -X POST localhost:3000/api/questionnaire/transcribe -F 'audio=@/path/to/sample.m4a'
# → {"text":"...transcribed words..."}
curl -s -X POST localhost:3000/api/questionnaire/transcribe -F 'audio='
# → 422
```

- [ ] **Step 3: Commit**

```bash
git add app/api/questionnaire/transcribe
git commit -m "feat(questionnaire): Whisper transcription route

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: Page shell, state hook, welcome + interlude + progress

**Files:**
- Create: `app/questionnaire/[client]/[project]/page.tsx`
- Create: `app/questionnaire/_components/useQuestionnaire.ts`
- Create: `app/questionnaire/_components/QuestionnaireApp.tsx`
- Create: `app/questionnaire/_components/WelcomeScreen.tsx`
- Create: `app/questionnaire/_components/SectionInterlude.tsx`
- Create: `app/questionnaire/_components/QuestionScreen.tsx`
- Create: `app/questionnaire/_components/inputs/index.tsx` (text/longtext only for now)
- Create: `app/questionnaire/_components/ProgressBar.tsx`
- Create: `app/questionnaire/_components/SaveIndicator.tsx`

**Interfaces:**
- Consumes: `resolveConfig`, `getProjectConfig` (Task 2); `buildScreens`, `questionCount`, `firstUnansweredScreen`, `Screen` (Task 1); API routes (Task 6)
- Produces (used by Tasks 9–12):
  - Hook return: `{ phase: 'welcome' | 'flow' | 'review' | 'done'; screens: Screen[]; screenIndex: number; current: Screen | null; identity: { name: string; email: string; sessionId: string } | null; answers: Answers; saveState: 'idle' | 'saving' | 'pending'; starting: boolean; startError: string | null; progress: { answered: number; total: number }; start(name, email, website): Promise<void>; advance(): void; goBack(): void; submitAnswer(questionId: string, answer: Answer | null): void; goToQuestion(questionId: string): void; toReview(): void; complete(): Promise<void> }`
  - `renderInput(question, draft, setDraft, onSubmit)` from `inputs/index.tsx` — the single dispatch point Tasks 9–11 extend
  - `type Draft = Answer | null` — per-screen editing state

- [ ] **Step 1: Implement `app/questionnaire/_components/useQuestionnaire.ts`**

```ts
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buildScreens, firstUnansweredScreen, questionCount, type Screen } from '@/lib/questionnaire/flow'
import type { Answer, Answers, ProjectConfig } from '@/lib/questionnaire/types'

type Phase = 'welcome' | 'flow' | 'review' | 'done'
type SaveState = 'idle' | 'saving' | 'pending'

interface Stored {
  identity: { name: string; email: string; sessionId: string } | null
  answers: Answers
  seen: string[]
  phase: Phase
  screenIndex: number
}

export function useQuestionnaire(config: ProjectConfig) {
  const screens = useMemo(() => buildScreens(config.template), [config])
  const total = useMemo(() => questionCount(config.template), [config])
  const storageKey = `questionnaire:${config.clientSlug}:${config.projectSlug}`

  const [phase, setPhase] = useState<Phase>('welcome')
  const [screenIndex, setScreenIndex] = useState(0)
  const [identity, setIdentity] = useState<Stored['identity']>(null)
  const [answers, setAnswers] = useState<Answers>({})
  const [seen, setSeen] = useState<Set<string>>(new Set())
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)

  const pendingRef = useRef<Map<string, Answer>>(new Map())
  const flushingRef = useRef(false)

  // Restore local state on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return
      const s = JSON.parse(raw) as Stored
      if (s.identity) {
        setIdentity(s.identity)
        setAnswers(s.answers ?? {})
        setSeen(new Set(s.seen ?? []))
        setPhase(s.phase === 'welcome' ? 'flow' : s.phase)
        setScreenIndex(Math.min(s.screenIndex ?? 0, screens.length - 1))
      }
    } catch {
      /* corrupt storage — start fresh */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist on every relevant change.
  useEffect(() => {
    if (!identity) return
    const s: Stored = { identity, answers, seen: [...seen], phase, screenIndex }
    try {
      localStorage.setItem(storageKey, JSON.stringify(s))
    } catch {
      /* storage full/blocked — Notion still has the data */
    }
  }, [identity, answers, seen, phase, screenIndex, storageKey])

  /** Send all pending answers, 3 attempts each with backoff. */
  const flush = useCallback(async () => {
    if (flushingRef.current || !identity) return
    flushingRef.current = true
    setSaveState('saving')
    for (const [questionId, answer] of [...pendingRef.current]) {
      let ok = false
      for (let attempt = 0; attempt < 3 && !ok; attempt++) {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 400 * attempt))
        try {
          const res = await fetch('/api/questionnaire/answer', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              client: config.clientSlug, project: config.projectSlug,
              sessionId: identity.sessionId, questionId, answer,
            }),
          })
          ok = res.ok
        } catch {
          /* network error — retry */
        }
      }
      if (ok) pendingRef.current.delete(questionId)
    }
    flushingRef.current = false
    setSaveState(pendingRef.current.size ? 'pending' : 'idle')
  }, [config, identity])

  const start = useCallback(async (name: string, email: string, website: string) => {
    setStarting(true)
    setStartError(null)
    try {
      const res = await fetch('/api/questionnaire/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ client: config.clientSlug, project: config.projectSlug, name, email, website }),
      })
      if (!res.ok) throw new Error(String(res.status))
      const data = (await res.json()) as { sessionId: string; answers: Answers; completed: boolean }
      const merged: Answers = { ...data.answers, ...answers } // local wins: at least as fresh
      const mergedSeen = new Set([...seen, ...Object.keys(data.answers)])
      setIdentity({ name, email, sessionId: data.sessionId })
      setAnswers(merged)
      setSeen(mergedSeen)
      if (data.completed) {
        setPhase('done')
      } else {
        const at = firstUnansweredScreen(screens, mergedSeen)
        if (at >= screens.length) setPhase('review')
        else {
          setScreenIndex(at)
          setPhase('flow')
        }
      }
    } catch {
      setStartError("Couldn't start the questionnaire. Please check your connection and try again.")
    } finally {
      setStarting(false)
    }
  }, [answers, config, screens, seen])

  const advance = useCallback(() => {
    setScreenIndex((i) => {
      if (i + 1 >= screens.length) {
        setPhase('review')
        return i
      }
      return i + 1
    })
  }, [screens.length])

  const goBack = useCallback(() => {
    if (phase === 'review') {
      setPhase('flow')
      setScreenIndex(screens.length - 1)
      return
    }
    setScreenIndex((i) => Math.max(0, i - 1))
  }, [phase, screens.length])

  const submitAnswer = useCallback((questionId: string, answer: Answer | null) => {
    setSeen((prev) => new Set(prev).add(questionId))
    if (answer) {
      setAnswers((prev) => ({ ...prev, [questionId]: answer }))
      pendingRef.current.set(questionId, answer)
      void flush()
    }
    advance()
  }, [advance, flush])

  const goToQuestion = useCallback((questionId: string) => {
    const at = screens.findIndex((s) => s.kind === 'question' && s.question.id === questionId)
    if (at >= 0) {
      setScreenIndex(at)
      setPhase('flow')
    }
  }, [screens])

  const toReview = useCallback(() => setPhase('review'), [])

  const complete = useCallback(async () => {
    await flush()
    try {
      await fetch('/api/questionnaire/answer', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          client: config.clientSlug, project: config.projectSlug,
          sessionId: identity?.sessionId, complete: true,
        }),
      })
    } catch {
      /* row stays In progress; answers are already saved */
    }
    setPhase('done')
  }, [config, flush, identity])

  return {
    phase, screens, screenIndex,
    current: phase === 'flow' ? screens[screenIndex] ?? null : null,
    identity, answers, saveState, starting, startError,
    progress: { answered: seen.size, total },
    start, advance, goBack, submitAnswer, goToQuestion, toReview, complete,
  }
}

export type Questionnaire = ReturnType<typeof useQuestionnaire>
```

- [ ] **Step 2: Implement `app/questionnaire/_components/inputs/index.tsx`** (text + longtext; extended in Tasks 9–11)

```tsx
'use client'

import { useEffect, useRef } from 'react'
import type { Answer, Question } from '@/lib/questionnaire/types'

export type Draft = Answer | null

export interface InputProps {
  question: Question
  draft: Draft
  setDraft: (d: Draft) => void
  /**
   * Submit (Continue / Cmd+Enter). Pass an override when submitting in the
   * same tick as a setDraft — state hasn't re-rendered yet (e.g. select
   * auto-advance), so the parent would otherwise read a stale draft.
   */
  onSubmit: (override?: Draft) => void
}

function TextInput({ question, draft, setDraft, onSubmit }: InputProps) {
  const value = draft?.type === 'text' ? draft.text : ''
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => ref.current?.focus(), [question.id])
  return (
    <input
      ref={ref}
      type="text"
      value={value}
      placeholder={question.type === 'text' ? question.placeholder ?? 'Type your answer…' : 'Type your answer…'}
      onChange={(e) => setDraft(e.target.value ? { type: 'text', text: e.target.value } : null)}
      onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
      className="w-full bg-transparent border-b border-[var(--foreground)] py-3 text-[1.5em] outline-none placeholder:text-[var(--hover-color)]"
    />
  )
}

export function LongTextInput({ question, draft, setDraft, onSubmit }: InputProps) {
  const value = draft?.type === 'text' ? draft.text : ''
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => ref.current?.focus(), [question.id])
  // Auto-grow.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 320)}px`
  }, [value])
  return (
    <textarea
      ref={ref}
      value={value}
      rows={2}
      placeholder={question.type === 'longtext' ? question.placeholder ?? 'Type — or talk — your answer…' : ''}
      onChange={(e) => setDraft(e.target.value ? { type: 'text', text: e.target.value } : null)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onSubmit()
      }}
      className="w-full resize-none bg-transparent border-b border-[var(--foreground)] py-3 text-[1.5em] leading-[1.3] outline-none placeholder:text-[var(--hover-color)]"
    />
  )
}

/** Single dispatch point — Tasks 9–11 extend this switch. */
export function renderInput(props: InputProps) {
  switch (props.question.type) {
    case 'text':
      return <TextInput {...props} />
    case 'longtext':
      return <LongTextInput {...props} />
    default:
      // Remaining types land in Tasks 9–10; text entry keeps the flow unblocked meanwhile.
      return <TextInput {...props} />
  }
}
```

- [ ] **Step 3: Implement screens**

`app/questionnaire/_components/ProgressBar.tsx`:

```tsx
'use client'

export default function ProgressBar({ answered, total }: { answered: number; total: number }) {
  return (
    <>
      <div className="fixed top-0 left-0 h-[2px] bg-[var(--foreground)] transition-all duration-500 z-50"
        style={{ width: `${Math.round((answered / Math.max(total, 1)) * 100)}%` }} />
      <div className="fixed top-4 right-5 text-[0.8em] text-[var(--hover-color)] z-50">
        {answered} / {total}
      </div>
    </>
  )
}
```

`app/questionnaire/_components/SaveIndicator.tsx`:

```tsx
'use client'

export default function SaveIndicator({ state }: { state: 'idle' | 'saving' | 'pending' }) {
  const label = state === 'saving' ? 'Saving…' : state === 'pending' ? 'Offline — will retry' : 'Saved'
  return (
    <div className="fixed bottom-4 left-5 text-[0.75em] text-[var(--hover-color)] z-50" aria-live="polite">
      {label}
    </div>
  )
}
```

`app/questionnaire/_components/WelcomeScreen.tsx`:

```tsx
'use client'

import { useState } from 'react'
import type { ProjectConfig } from '@/lib/questionnaire/types'
import type { Questionnaire } from './useQuestionnaire'

export default function WelcomeScreen({ config, q }: { config: ProjectConfig; q: Questionnaire }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const valid = name.trim().length > 1 && email.includes('@')

  return (
    <div className="max-w-3xl mx-auto px-6 min-h-dvh flex flex-col justify-center">
      <p className="text-[0.9em] text-[var(--hover-color)] mb-4">
        {config.clientName} · ~{config.template.estimatedMinutes} min
      </p>
      <h1 className="text-[3em] leading-[1.1] mb-6 max-md:text-[2em]">{config.template.title}</h1>
      <p className="text-[1.2em] leading-[1.4] text-[var(--hover-color)] mb-10">{config.template.intro}</p>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (valid && !q.starting) void q.start(name.trim(), email.trim(), website)
        }}
        className="flex flex-col gap-4 max-w-md"
      >
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
          autoComplete="name"
          className="bg-transparent border-b border-[var(--foreground)] py-3 text-[1.2em] outline-none placeholder:text-[var(--hover-color)]" />
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email"
          autoComplete="email"
          className="bg-transparent border-b border-[var(--foreground)] py-3 text-[1.2em] outline-none placeholder:text-[var(--hover-color)]" />
        {/* Honeypot — invisible to humans */}
        <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} name="website"
          tabIndex={-1} autoComplete="off" aria-hidden="true"
          className="absolute -left-[9999px] h-0 w-0 overflow-hidden" />
        <button type="submit" disabled={!valid || q.starting}
          className="self-start mt-4 border border-[var(--foreground)] rounded-full px-8 py-3 text-[1.1em] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors disabled:opacity-30 disabled:pointer-events-none">
          {q.starting ? 'Starting…' : 'Start →'}
        </button>
        {q.startError && <p className="text-[0.9em] text-[var(--hover-color)]">{q.startError}</p>}
      </form>
    </div>
  )
}
```

`app/questionnaire/_components/SectionInterlude.tsx`:

```tsx
'use client'

import type { Section } from '@/lib/questionnaire/types'

export default function SectionInterlude({
  section, sectionIndex, onContinue,
}: { section: Section; sectionIndex: number; onContinue: () => void }) {
  return (
    <div className="max-w-3xl mx-auto px-6 min-h-dvh flex flex-col justify-center">
      <p className="text-[0.9em] text-[var(--hover-color)] mb-4">Section {sectionIndex + 1}</p>
      <h2 className="text-[3em] leading-[1.1] mb-8 max-md:text-[2em]">{section.title}</h2>
      {section.intro && <p className="text-[1.2em] text-[var(--hover-color)] mb-8">{section.intro}</p>}
      <button onClick={onContinue}
        className="self-start border border-[var(--foreground)] rounded-full px-8 py-3 text-[1.1em] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors">
        Continue →
      </button>
    </div>
  )
}
```

`app/questionnaire/_components/QuestionScreen.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import type { Question, Section } from '@/lib/questionnaire/types'
import { renderInput, type Draft } from './inputs'

export default function QuestionScreen({
  question, section, number, total, initial, onSubmit, onSkip,
}: {
  question: Question
  section: Section
  number: number
  total: number
  initial: Draft
  onSubmit: (draft: Draft) => void
  onSkip: () => void
}) {
  const [draft, setDraft] = useState<Draft>(initial)
  useEffect(() => setDraft(initial), [question.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const submit = (override?: Draft) => onSubmit(override !== undefined ? override : draft)

  return (
    <div className="max-w-3xl mx-auto px-6 min-h-dvh flex flex-col justify-center pb-24">
      <p className="text-[0.85em] text-[var(--hover-color)] mb-3">
        {number} / {total} · {section.title}
      </p>
      <h2 className="text-[2.2em] leading-[1.15] mb-3 max-md:text-[1.5em]">{question.prompt}</h2>
      {question.hint && <p className="text-[1em] text-[var(--hover-color)] mb-6">{question.hint}</p>}

      <div className="mb-10 mt-4">{renderInput({ question, draft, setDraft, onSubmit: submit })}</div>

      <div className="flex items-center gap-6">
        <button onClick={() => submit()} disabled={!draft}
          className="border border-[var(--foreground)] rounded-full px-8 py-3 text-[1.1em] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors disabled:opacity-30 disabled:pointer-events-none">
          OK →
        </button>
        <button onClick={onSkip} className="text-[0.9em] text-[var(--hover-color)] hover:text-[var(--foreground)] transition-colors">
          Skip
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Implement `app/questionnaire/_components/QuestionnaireApp.tsx`**

Review/Done render minimal inline stubs here; Task 12 replaces them with real components.

```tsx
'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import type { ProjectConfig } from '@/lib/questionnaire/types'
import ProgressBar from './ProgressBar'
import QuestionScreen from './QuestionScreen'
import SaveIndicator from './SaveIndicator'
import SectionInterlude from './SectionInterlude'
import WelcomeScreen from './WelcomeScreen'
import { useQuestionnaire } from './useQuestionnaire'

export default function QuestionnaireApp({ config }: { config: ProjectConfig }) {
  const q = useQuestionnaire(config)

  // Arrow-key navigation between screens.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (q.phase !== 'flow') return
      if (e.key === 'ArrowUp') q.goBack()
      if (e.key === 'ArrowDown') q.advance()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [q])

  const key =
    q.phase === 'flow'
      ? `flow-${q.screenIndex}`
      : q.phase

  return (
    <div className="w-full">
      {q.phase === 'flow' && <ProgressBar answered={q.progress.answered} total={q.progress.total} />}
      <AnimatePresence mode="wait">
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -24 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {q.phase === 'welcome' && <WelcomeScreen config={config} q={q} />}

          {q.phase === 'flow' && q.current?.kind === 'interlude' && (
            <SectionInterlude section={q.current.section} sectionIndex={q.current.sectionIndex} onContinue={q.advance} />
          )}

          {q.phase === 'flow' && q.current?.kind === 'question' && (
            <QuestionScreen
              question={q.current.question}
              section={q.current.section}
              number={q.current.number}
              total={q.progress.total}
              initial={q.answers[q.current.question.id] ?? null}
              onSubmit={(draft) => q.submitAnswer((q.current as { question: { id: string } }).question.id, draft)}
              onSkip={() => q.submitAnswer((q.current as { question: { id: string } }).question.id, null)}
            />
          )}

          {q.phase === 'review' && (
            <div className="max-w-3xl mx-auto px-6 min-h-dvh flex flex-col justify-center">
              <h2 className="text-[2.2em] mb-6">Review (full version in Task 12)</h2>
              <button onClick={() => void q.complete()}
                className="self-start border border-[var(--foreground)] rounded-full px-8 py-3">
                Submit →
              </button>
            </div>
          )}

          {q.phase === 'done' && (
            <div className="max-w-3xl mx-auto px-6 min-h-dvh flex flex-col justify-center">
              <h2 className="text-[2.2em]">Thank you.</h2>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      {q.phase === 'flow' && <SaveIndicator state={q.saveState} />}
    </div>
  )
}
```

- [ ] **Step 5: Implement `app/questionnaire/[client]/[project]/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProjectConfig, resolveConfig } from '@/lib/questionnaire/projects'
import QuestionnaireApp from '../../_components/QuestionnaireApp'

type Params = Promise<{ client: string; project: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { client, project } = await params
  const cfg = getProjectConfig(client, project)
  if (!cfg) return { robots: { index: false, follow: false } }
  return {
    title: `${cfg.projectTitle} · ${cfg.clientName}`,
    robots: { index: false, follow: false },
  }
}

export default async function QuestionnairePage({ params }: { params: Params }) {
  const { client, project } = await params
  const cfg = getProjectConfig(client, project)
  if (!cfg) notFound()
  return <QuestionnaireApp config={resolveConfig(cfg)} />
}
```

- [ ] **Step 6: Manual verification**

```bash
npm run dev:http
```
Open `http://localhost:3000/questionnaire/test/sandbox`:
1. Welcome shows title/intro/estimated time; Start disabled until name + valid email.
2. Start → first interlude ("Section 1 · About the Project") → Continue → first question.
3. Type an answer → OK → advances; "Saved" indicator bottom-left; row updates in the Notion sandbox DB.
4. Skip works; ↑ goes back; progress bar/counter advance.
5. Reload mid-flow → resumes at the same screen with answers intact.
6. Open the same URL in an incognito window, same email → resumes from Notion (answers present).
7. `http://localhost:3000/questionnaire/nope/nothing` → 404.

- [ ] **Step 7: Commit**

```bash
git add app/questionnaire
git commit -m "feat(questionnaire): page shell, state hook, welcome/interlude/question screens

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: Choice inputs (select / multiselect)

**Files:**
- Create: `app/questionnaire/_components/inputs/ChoiceInput.tsx`
- Modify: `app/questionnaire/_components/inputs/index.tsx` (extend `renderInput` switch)

**Interfaces:**
- Consumes: `InputProps`, `Draft` (Task 8)
- Produces: `ChoiceInput` handling both `select` and `multiselect`; select auto-submits on tap

- [ ] **Step 1: Implement `app/questionnaire/_components/inputs/ChoiceInput.tsx`**

```tsx
'use client'

import type { InputProps } from './index'

export default function ChoiceInput({ question, draft, setDraft, onSubmit }: InputProps) {
  if (question.type !== 'select' && question.type !== 'multiselect') return null
  const multi = question.type === 'multiselect'
  const selected = draft?.type === 'choice' ? draft.selected : []

  const toggle = (option: string) => {
    if (!multi) {
      const next = { type: 'choice' as const, selected: [option] }
      setDraft(next)
      // Single select: advance right away — one tap, done. Pass the value as
      // an override: state won't have re-rendered inside this timeout's closure.
      setTimeout(() => onSubmit(next), 250)
      return
    }
    const next = selected.includes(option) ? selected.filter((o) => o !== option) : [...selected, option]
    setDraft(next.length ? { type: 'choice', selected: next } : null)
  }

  return (
    <div className="flex flex-col gap-3" role={multi ? 'group' : 'radiogroup'}>
      {question.options.map((option, i) => {
        const active = selected.includes(option)
        return (
          <button
            key={option}
            type="button"
            role={multi ? 'checkbox' : 'radio'}
            aria-checked={active}
            onClick={() => toggle(option)}
            className={`text-left border rounded-2xl px-6 py-4 text-[1.2em] transition-colors ${
              active
                ? 'border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]'
                : 'border-[var(--hover-color)] hover:border-[var(--foreground)]'
            }`}
          >
            <span className="text-[0.75em] mr-3 opacity-60">{String.fromCharCode(65 + i)}</span>
            {option}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Extend the switch in `inputs/index.tsx`**

Add the import and cases (replacing the `default` fallthrough for these two types):

```tsx
import ChoiceInput from './ChoiceInput'
// inside renderInput's switch:
    case 'select':
    case 'multiselect':
      return <ChoiceInput {...props} />
```

- [ ] **Step 3: Manual verification**

In `/questionnaire/test/sandbox`, navigate to "Should the visual system feel unified…" (select):
1. Tap an option → it fills, auto-advances after a beat; Notion column `[system-flex]` shows the choice.
2. Go back (↑) → previous choice is highlighted; picking another replaces it.
3. On "How should the typography feel?" verify the same; multiselect (none in this template yet) is covered by the same component with checkboxes semantics.

- [ ] **Step 4: Commit**

```bash
git add app/questionnaire/_components/inputs
git commit -m "feat(questionnaire): select/multiselect choice input

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 10: Trait sliders (single + dual) and slider groups

**Files:**
- Create: `app/questionnaire/_components/inputs/TraitSlider.tsx`
- Create: `app/questionnaire/_components/inputs/SlidersInput.tsx`
- Modify: `app/questionnaire/_components/inputs/index.tsx` (extend `renderInput` switch)

**Interfaces:**
- Consumes: `InputProps`, `Draft` (Task 8); `SLIDER_STEPS`, `TraitSliderDef` (Task 1)
- Produces:
  - `TraitSlider` — one track; props `{ def: TraitSliderDef; mode: 'single' | 'dual'; value: SliderValue; onChange(v: SliderValue): void }` where `type SliderValue = { single?: number; today?: number; future?: number }`
  - `SlidersInput` — wraps `trait-slider`, `dual-slider`, `sliders-group`; builds `scale`/`dual-scale` answers; all sliders default to 4

- [ ] **Step 1: Implement `app/questionnaire/_components/inputs/TraitSlider.tsx`**

One horizontal track, 7 tick positions. Single mode: one thumb (filled). Dual mode: outline thumb = Today, filled thumb = Future; pointer-down grabs the nearest thumb. Keyboard accessible (focusable thumbs, ←/→ move).

```tsx
'use client'

import { useRef } from 'react'
import { SLIDER_STEPS, type TraitSliderDef } from '@/lib/questionnaire/types'

export type SliderValue = { single?: number; today?: number; future?: number }

const pct = (v: number) => `${((v - 1) / (SLIDER_STEPS - 1)) * 100}%`

export default function TraitSlider({
  def, mode, value, onChange,
}: {
  def: TraitSliderDef
  mode: 'single' | 'dual'
  value: SliderValue
  onChange: (v: SliderValue) => void
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef<'single' | 'today' | 'future' | null>(null)

  const positionFromPointer = (clientX: number) => {
    const el = trackRef.current
    if (!el) return 4
    const r = el.getBoundingClientRect()
    const t = Math.min(1, Math.max(0, (clientX - r.left) / r.width))
    return Math.round(t * (SLIDER_STEPS - 1)) + 1
  }

  const single = value.single ?? 4
  const today = value.today ?? 4
  const future = value.future ?? 4

  const grab = (clientX: number): 'single' | 'today' | 'future' => {
    if (mode === 'single') return 'single'
    const p = positionFromPointer(clientX)
    return Math.abs(p - today) <= Math.abs(p - future) ? 'today' : 'future'
  }

  const apply = (thumb: 'single' | 'today' | 'future', p: number) => {
    if (thumb === 'single') onChange({ single: p })
    else if (thumb === 'today') onChange({ today: p, future })
    else onChange({ today, future: p })
  }

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    const thumb = grab(e.clientX)
    draggingRef.current = thumb
    apply(thumb, positionFromPointer(e.clientX))
    const move = (ev: PointerEvent) => {
      if (draggingRef.current) apply(draggingRef.current, positionFromPointer(ev.clientX))
    }
    const up = () => {
      draggingRef.current = null
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const onThumbKey = (thumb: 'single' | 'today' | 'future', current: number) => (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') apply(thumb, Math.max(1, current - 1))
    if (e.key === 'ArrowRight') apply(thumb, Math.min(SLIDER_STEPS, current + 1))
  }

  const thumbBase =
    'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full transition-[left] duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--hover-color)] touch-none'

  return (
    <div className="py-3">
      <div className="flex justify-between text-[0.85em] mb-2">
        <span>{def.left}</span>
        <span>{def.right}</span>
      </div>
      <div ref={trackRef} onPointerDown={onPointerDown} className="relative h-8 cursor-pointer touch-none">
        <div className="absolute top-1/2 left-0 right-0 h-px bg-[var(--hover-color)]" />
        {Array.from({ length: SLIDER_STEPS }, (_, i) => (
          <div key={i} className="absolute top-1/2 -translate-y-1/2 w-[3px] h-[3px] rounded-full bg-[var(--hover-color)]"
            style={{ left: pct(i + 1) }} />
        ))}
        {mode === 'single' ? (
          <div
            role="slider" tabIndex={0} aria-label={`${def.left} to ${def.right}`}
            aria-valuemin={1} aria-valuemax={SLIDER_STEPS} aria-valuenow={single}
            onKeyDown={onThumbKey('single', single)}
            className={`${thumbBase} bg-[var(--foreground)]`} style={{ left: pct(single) }} />
        ) : (
          <>
            <div
              role="slider" tabIndex={0} aria-label={`${def.left} to ${def.right} — today`}
              aria-valuemin={1} aria-valuemax={SLIDER_STEPS} aria-valuenow={today}
              onKeyDown={onThumbKey('today', today)}
              className={`${thumbBase} border-2 border-[var(--foreground)] bg-[var(--background)]`}
              style={{ left: pct(today) }} />
            <div
              role="slider" tabIndex={0} aria-label={`${def.left} to ${def.right} — where you want to be`}
              aria-valuemin={1} aria-valuemax={SLIDER_STEPS} aria-valuenow={future}
              onKeyDown={onThumbKey('future', future)}
              className={`${thumbBase} bg-[var(--foreground)]`} style={{ left: pct(future) }} />
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Implement `app/questionnaire/_components/inputs/SlidersInput.tsx`**

```tsx
'use client'

import type { TraitSliderDef } from '@/lib/questionnaire/types'
import TraitSlider, { type SliderValue } from './TraitSlider'
import type { InputProps } from './index'

export default function SlidersInput({ question, draft, setDraft }: InputProps) {
  if (question.type !== 'trait-slider' && question.type !== 'dual-slider' && question.type !== 'sliders-group')
    return null

  const sliders: TraitSliderDef[] = question.type === 'sliders-group' ? question.sliders : [question.slider]
  const dual = question.type === 'dual-slider' || (question.type === 'sliders-group' && question.mode === 'dual')

  const valueFor = (id: string): SliderValue => {
    if (dual) {
      const p = draft?.type === 'dual-scale' ? draft.positions[id] : undefined
      return { today: p?.today ?? 4, future: p?.future ?? 4 }
    }
    return { single: draft?.type === 'scale' ? draft.positions[id] ?? 4 : 4 }
  }

  const update = (id: string, v: SliderValue) => {
    if (dual) {
      const positions = draft?.type === 'dual-scale' ? { ...draft.positions } : {}
      positions[id] = { today: v.today ?? 4, future: v.future ?? 4 }
      setDraft({ type: 'dual-scale', positions })
    } else {
      const positions = draft?.type === 'scale' ? { ...draft.positions } : {}
      positions[id] = v.single ?? 4
      setDraft({ type: 'scale', positions })
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {dual && (
        <div className="flex items-center gap-5 text-[0.8em] text-[var(--hover-color)] mb-2">
          <span className="inline-flex items-center gap-2">
            <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-[var(--foreground)]" /> Today
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-block w-3.5 h-3.5 rounded-full bg-[var(--foreground)]" /> Where you want to be
          </span>
        </div>
      )}
      {sliders.map((s) => (
        <TraitSlider key={s.id} def={s} mode={dual ? 'dual' : 'single'} value={valueFor(s.id)} onChange={(v) => update(s.id, v)} />
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Extend the switch in `inputs/index.tsx`**

```tsx
import SlidersInput from './SlidersInput'
// inside renderInput's switch:
    case 'trait-slider':
    case 'dual-slider':
    case 'sliders-group':
      return <SlidersInput {...props} />
```

The `default` branch is now unreachable — remove it and make the switch exhaustive.

- [ ] **Step 4: Manual verification**

In `/questionnaire/test/sandbox`, reach the "Where is Acme Co today…" screen (traits group):
1. Legend shows Today (outline) / Where you want to be (filled); 10 tracks render.
2. Drag near the outline thumb → it moves; drag near the filled one → it moves; both snap to 7 ticks.
3. Tap anywhere on a track on mobile-width viewport → nearest thumb jumps there.
4. Keyboard: Tab reaches thumbs, ←/→ adjust.
5. OK → Notion columns `[traits.serious-approachable]` etc. show `Today: n/7 · Future: n/7`.
6. Go back → thumb positions restore from the saved answer.

- [ ] **Step 5: Commit**

```bash
git add app/questionnaire/_components/inputs
git commit -m "feat(questionnaire): trait sliders — single, dual (today/future), groups

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 11: Voice input on longtext questions

**Files:**
- Create: `app/questionnaire/_components/inputs/VoiceInput.tsx`
- Modify: `app/questionnaire/_components/inputs/index.tsx` (`LongTextInput` renders `VoiceInput` under the textarea)

**Interfaces:**
- Consumes: `POST /api/questionnaire/transcribe` (Task 7)
- Produces: `VoiceInput` with props `{ onTranscript(text: string): void }` — records via MediaRecorder, posts to transcribe, hands back text

- [ ] **Step 1: Implement `app/questionnaire/_components/inputs/VoiceInput.tsx`**

Adapted from formform's `VoiceNoteRecorder` (MIME candidates, progressive enhancement, caps) but transcribe-and-discard instead of attach: stop → upload → text lands in the field.

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'

const MAX_SECONDS = 180
const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']

const supported = () =>
  typeof window !== 'undefined' &&
  typeof MediaRecorder !== 'undefined' &&
  !!navigator.mediaDevices?.getUserMedia

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

type State = 'idle' | 'recording' | 'transcribing' | 'error' | 'denied'

export default function VoiceInput({ onTranscript }: { onTranscript: (text: string) => void }) {
  const [available] = useState(supported)
  const [state, setState] = useState<State>('idle')
  const [elapsed, setElapsed] = useState(0)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const tickRef = useRef<number | undefined>(undefined)

  const stopTracks = () => recorderRef.current?.stream.getTracks().forEach((t) => t.stop())

  useEffect(
    () => () => {
      if (recorderRef.current?.state !== 'inactive') recorderRef.current?.stop()
      stopTracks()
      window.clearInterval(tickRef.current)
    },
    []
  )

  if (!available) return null

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime = MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m)) ?? ''
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      recorderRef.current = rec
      chunksRef.current = []
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data)
      rec.onstop = () => {
        stopTracks()
        window.clearInterval(tickRef.current)
        void transcribe(new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' }))
      }
      rec.start()
      setElapsed(0)
      setState('recording')
      const startedAt = Date.now()
      tickRef.current = window.setInterval(() => {
        const s = (Date.now() - startedAt) / 1000
        setElapsed(s)
        if (s >= MAX_SECONDS && rec.state === 'recording') rec.stop()
      }, 250)
    } catch {
      setState('denied')
    }
  }

  const stop = () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
  }

  const transcribe = async (blob: Blob) => {
    setState('transcribing')
    try {
      const form = new FormData()
      form.append('audio', new File([blob], 'note.webm', { type: blob.type }))
      const res = await fetch('/api/questionnaire/transcribe', { method: 'POST', body: form })
      if (!res.ok) throw new Error(String(res.status))
      const data = (await res.json()) as { text: string }
      if (data.text.trim()) onTranscript(data.text.trim())
      setState('idle')
    } catch {
      setState('error')
    }
  }

  if (state === 'denied')
    return <p className="text-[0.85em] text-[var(--hover-color)]">Microphone blocked — you can keep typing.</p>

  return (
    <div className="flex items-center gap-4 text-[0.9em]">
      {state === 'recording' ? (
        <button type="button" onClick={stop}
          className="inline-flex items-center gap-2 border border-[var(--foreground)] rounded-full px-5 py-2 hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          Stop · {fmt(elapsed)}
        </button>
      ) : (
        <button type="button" onClick={() => void start()} disabled={state === 'transcribing'}
          className="inline-flex items-center gap-2 border border-[var(--hover-color)] rounded-full px-5 py-2 hover:border-[var(--foreground)] transition-colors disabled:opacity-40">
          🎙 {state === 'transcribing' ? 'Transcribing…' : 'Answer with your voice'}
        </button>
      )}
      {state === 'error' && <span className="text-[var(--hover-color)]">Transcription failed — try again or type.</span>}
    </div>
  )
}
```

- [ ] **Step 2: Wire into `LongTextInput` in `inputs/index.tsx`**

Wrap the existing textarea and add `VoiceInput` below it. Transcript **appends** to whatever is typed (a space separator), so clients can mix talking and typing:

```tsx
import VoiceInput from './VoiceInput'
// LongTextInput return becomes:
  return (
    <div>
      <textarea /* …unchanged textarea props… */ />
      <div className="mt-4">
        <VoiceInput
          onTranscript={(text) =>
            setDraft({ type: 'text', text: value ? `${value.trim()} ${text}` : text })
          }
        />
      </div>
    </div>
  )
```

- [ ] **Step 3: Manual verification**

Voice requires a secure context on devices — use `npm run dev` (HTTPS custom server) for phone testing; `localhost` is fine on desktop.
1. On a longtext question, record a short answer → "Transcribing…" → text appears in the textarea.
2. Record again → new transcript appends after the existing text.
3. Block mic permission → one-line notice, typing still works.
4. Firefox: record → works (MediaRecorder path, no Web Speech dependency).

- [ ] **Step 4: Commit**

```bash
git add app/questionnaire/_components/inputs
git commit -m "feat(questionnaire): voice answers via Whisper transcription

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 12: Review + done screens, completion

**Files:**
- Create: `app/questionnaire/_components/ReviewScreen.tsx`
- Create: `app/questionnaire/_components/DoneScreen.tsx`
- Modify: `app/questionnaire/_components/QuestionnaireApp.tsx` (replace the inline review/done stubs)

**Interfaces:**
- Consumes: `summarizeAnswer` (Task 1); hook API (Task 8)
- Produces: final user-facing flow end

- [ ] **Step 1: Implement `app/questionnaire/_components/ReviewScreen.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { summarizeAnswer } from '@/lib/questionnaire/flow'
import type { ProjectConfig } from '@/lib/questionnaire/types'
import type { Questionnaire } from './useQuestionnaire'

export default function ReviewScreen({ config, q }: { config: ProjectConfig; q: Questionnaire }) {
  const [submitting, setSubmitting] = useState(false)

  return (
    <div className="max-w-3xl mx-auto px-6 py-24">
      <h2 className="text-[2.6em] leading-[1.1] mb-3 max-md:text-[1.8em]">Almost done.</h2>
      <p className="text-[1.1em] text-[var(--hover-color)] mb-12">
        Review your answers — tap any to edit. Everything is already saved.
      </p>

      <div className="flex flex-col gap-8 mb-16">
        {config.template.sections.map((section) => (
          <div key={section.id}>
            <h3 className="text-[0.85em] uppercase tracking-wide text-[var(--hover-color)] mb-3">{section.title}</h3>
            <div className="flex flex-col gap-4">
              {section.questions.map((question) => {
                const answer = q.answers[question.id]
                return (
                  <button key={question.id} onClick={() => q.goToQuestion(question.id)}
                    className="text-left group">
                    <p className="text-[1em] mb-1 group-hover:text-[var(--hover-color)] transition-colors">{question.prompt}</p>
                    <p className="text-[0.95em] text-[var(--hover-color)] whitespace-pre-wrap">
                      {answer ? summarizeAnswer(question, answer) : '— skipped'}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          setSubmitting(true)
          void q.complete()
        }}
        disabled={submitting}
        className="border border-[var(--foreground)] rounded-full px-10 py-4 text-[1.2em] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors disabled:opacity-40">
        {submitting ? 'Submitting…' : 'Submit questionnaire →'}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Implement `app/questionnaire/_components/DoneScreen.tsx`**

```tsx
'use client'

import type { ProjectConfig } from '@/lib/questionnaire/types'

export default function DoneScreen({ config, name }: { config: ProjectConfig; name: string | null }) {
  const first = name?.split(' ')[0]
  return (
    <div className="max-w-3xl mx-auto px-6 min-h-dvh flex flex-col justify-center">
      <h2 className="text-[3em] leading-[1.1] mb-6 max-md:text-[2em]">
        Thank you{first ? `, ${first}` : ''}.
      </h2>
      <p className="text-[1.2em] leading-[1.5] text-[var(--hover-color)] max-w-xl">
        Your answers are saved and will directly shape the direction of {config.clientName}&rsquo;s {config.projectTitle.toLowerCase()}.
        If anything else comes to mind, you can reopen this link and add to your answers anytime.
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Replace the stubs in `QuestionnaireApp.tsx`**

```tsx
import DoneScreen from './DoneScreen'
import ReviewScreen from './ReviewScreen'
// replace the review stub:
          {q.phase === 'review' && <ReviewScreen config={config} q={q} />}
// replace the done stub:
          {q.phase === 'done' && <DoneScreen config={config} name={q.identity?.name ?? null} />}
```

- [ ] **Step 4: Manual verification**

1. Answer through to the end → Review lists every section, answers summarized, skipped ones marked.
2. Tap an answer → jumps to that question with the draft prefilled → OK → returns forward through the flow (advance continues from there; reach review again via remaining questions).
3. Submit → Done screen greets by first name; Notion row Status flips to "Completed".
4. Reopen the URL, same email → session resumes into `done` (completed flag) — reopening to edit: `goToQuestion` from review is the edit path pre-submit; post-submit reopening shows Done. (Post-submit editing is out of scope v1.)

- [ ] **Step 5: Commit**

```bash
git add app/questionnaire/_components
git commit -m "feat(questionnaire): review and done screens, completion flow

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 13: AI synthesis script

**Files:**
- Create: `scripts/questionnaire-synthesize.ts`
- Modify: `package.json` (add `questionnaire:synthesize` script)

**Interfaces:**
- Consumes: `getProjectConfig`, `resolveConfig` (Task 2); `getPropertyMap` + Notion query pattern (Task 4 concepts — the script queries Notion directly); `summarizeAnswer` (Task 1)
- Produces: CLI `npm run questionnaire:synthesize -- <client>/<project>` → Notion page "Synthesis — {Client} {Project}"

- [ ] **Step 1: Implement `scripts/questionnaire-synthesize.ts`** (relative imports)

```ts
import { config as loadEnv } from 'dotenv'
loadEnv({ path: '.env.local' })

import { Client } from '@notionhq/client'
import { summarizeAnswer } from '../lib/questionnaire/flow'
import { findRow } from '../lib/questionnaire/notion'
import { getProjectConfig, resolveConfig } from '../lib/questionnaire/projects'

async function callClaude(prompt: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) throw new Error(`Anthropic API ${res.status}: ${await res.text()}`)
  const data = (await res.json()) as { content: { type: string; text?: string }[] }
  return data.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n')
}

/** Minimal markdown → Notion blocks: ## / ### headings, "- " bullets, paragraphs. */
function mdToBlocks(md: string): object[] {
  const rt = (s: string) => {
    const out: object[] = []
    for (let i = 0; i < s.length; i += 1900) out.push({ text: { content: s.slice(i, i + 1900) } })
    return out
  }
  return md
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      if (line.startsWith('### ')) return { heading_3: { rich_text: rt(line.slice(4)) } }
      if (line.startsWith('## ')) return { heading_2: { rich_text: rt(line.slice(3)) } }
      if (line.startsWith('# ')) return { heading_2: { rich_text: rt(line.slice(2)) } }
      if (line.startsWith('- ')) return { bulleted_list_item: { rich_text: rt(line.slice(2)) } }
      return { paragraph: { rich_text: rt(line) } }
    })
}

async function main() {
  const [slugPair] = process.argv.slice(2)
  const [client, project] = (slugPair ?? '').split('/')
  const raw = client && project ? getProjectConfig(client, project) : null
  if (!raw?.notionDatabaseId) {
    console.error('Usage: npm run questionnaire:synthesize -- <client>/<project> (config needs notionDatabaseId)')
    process.exit(1)
  }
  const cfg = resolveConfig(raw)
  const notion = new Client({ auth: process.env.NOTION_API_KEY })

  // Pull every stakeholder row.
  const pages = await notion.databases.query({ database_id: raw.notionDatabaseId, page_size: 100 })
  type Row = { name: string; email: string; completed: boolean }
  const rows: { row: Row; transcript: string }[] = []
  for (const page of pages.results as { id: string; properties: Record<string, unknown> }[]) {
    const props = page.properties as {
      Name?: { title?: { plain_text: string }[] }
      Email?: { email?: string }
      Status?: { select?: { name?: string } }
    }
    const email = props.Email?.email
    if (!email) continue
    const found = await findRow(raw.notionDatabaseId, email, cfg.template)
    if (!found) continue
    const name = props.Name?.title?.map((t) => t.plain_text).join('') || email
    const lines: string[] = []
    for (const section of cfg.template.sections) {
      for (const q of section.questions) {
        const a = found.answers[q.id]
        if (!a) continue
        lines.push(`Q: ${q.prompt}\nA: ${summarizeAnswer(q, a)}`)
      }
    }
    rows.push({
      row: { name, email, completed: found.completed },
      transcript: lines.join('\n\n'),
    })
  }
  if (rows.length === 0) {
    console.error('No responses found.')
    process.exit(1)
  }
  console.log(`Synthesizing ${rows.length} stakeholder response(s)…`)

  const prompt = [
    `You are helping a brand designer synthesize discovery-questionnaire responses for a ${cfg.projectTitle} project for the client "${cfg.clientName}".`,
    `${rows.length} stakeholder(s) answered the same questionnaire. Their responses:`,
    ...rows.map((r) => `\n=== ${r.row.name} (${r.row.email})${r.row.completed ? '' : ' — incomplete'} ===\n${r.transcript}`),
    `\nProduce a markdown synthesis with exactly these sections:`,
    `## Executive summary — 3-5 sentences capturing the project's strategic direction.`,
    `## Consensus — points where stakeholders clearly agree.`,
    `## Tensions — where stakeholders diverge (including divergent slider positions); name who leans where and why it matters for the design.`,
    `## Highlights — 3-6 short verbatim quotes worth keeping visible during design, with attribution.`,
    `## Watch-outs — constraints, sensitivities, or things to avoid that the designer must not miss.`,
    `Be specific and cite stakeholders by first name. Don't pad; if a section is thin, keep it thin.`,
  ].join('\n')

  const synthesis = await callClaude(prompt)

  const parentId = process.env.NOTION_QUESTIONNAIRE_PARENT_PAGE_ID
  if (!parentId) {
    console.error('Missing NOTION_QUESTIONNAIRE_PARENT_PAGE_ID — printing synthesis instead:\n')
    console.log(synthesis)
    return
  }
  const blocks = mdToBlocks(synthesis)
  const page = await notion.pages.create({
    parent: { type: 'page_id', page_id: parentId },
    properties: { title: [{ text: { content: `Synthesis — ${cfg.clientName} ${cfg.projectTitle}` } }] },
    children: blocks.slice(0, 100) as never,
  })
  // Notion caps children at 100 per request; append the rest.
  for (let i = 100; i < blocks.length; i += 100) {
    await notion.blocks.children.append({ block_id: page.id, children: blocks.slice(i, i + 100) as never })
  }
  console.log(`Created synthesis page: ${(page as { url?: string }).url ?? page.id}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

Add to `package.json` scripts: `"questionnaire:synthesize": "tsx scripts/questionnaire-synthesize.ts"`.

- [ ] **Step 2: Manual verification**

Fill the sandbox questionnaire as two different emails with a few contrasting answers (e.g. one wants "serious", the other "playful"), then:

```bash
npm run questionnaire:synthesize -- test/sandbox
```
Expected: prints progress, creates a "Synthesis — Acme Co Visual Identity (Test)" page in Notion with the five sections, and the Tensions section names the disagreement.

- [ ] **Step 3: Commit**

```bash
git add scripts/questionnaire-synthesize.ts package.json
git commit -m "feat(questionnaire): AI synthesis script (Claude -> Notion page)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 14: Full verification pass

**Files:** none created — fixes only, committed as found.

- [ ] **Step 1: Desktop pass (Chrome + Firefox + Safari), light and dark themes**

Full run of `/questionnaire/test/sandbox` in each: welcome → all sections → review → submit → done. Verify transitions, progress, autosave indicator, sliders, voice (Firefox included — Whisper path), select auto-advance, review edit-jump.

- [ ] **Step 2: Mobile pass (real phone over LAN HTTPS)**

```bash
npm run dev   # HTTPS server — mic needs secure context on devices
```
On the phone: typography scales down (`max-md` variants), touch targets comfortable, slider drag + tap works, voice recording works, keyboard doesn't cover inputs (dvh layout).

- [ ] **Step 3: Resilience pass**

1. DevTools → Network offline → answer a question → "Offline — will retry" → back online → next advance flushes, Notion catches up.
2. Kill the tab mid-flow → reopen → resumes at the same question.
3. Same email from a second browser → answers present (Notion resume).

- [ ] **Step 4: Build + tests green**

```bash
npm test && npm run build
```
Expected: all vitest suites pass; `next build` completes with `/questionnaire/[client]/[project]` as a dynamic route.

- [ ] **Step 5: Commit any fixes, push branch**

```bash
git push -u origin feature/questionnaire
```
Vercel builds a preview deployment — sanity-check the preview URL end-to-end (env vars must be set in Vercel first, Task 5 Step 1.5).

---

## Deferred (explicitly out of this plan)

- PRO question tailoring — waits on Joel's meeting context and proposal close; lands as `applyOverrides` edits in `lib/questionnaire/projects/pro-vi.ts` + `questionnaire:setup -- pro/visual-identity`.
- `branding` / `website` templates — created with the first real project of each type.
- Post-submit answer editing, completion email (Resend), live AI follow-ups, admin UI, Sheets export.

