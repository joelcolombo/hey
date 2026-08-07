# Client Questionnaire — Design Spec

**Date:** 2026-08-06
**Status:** Approved pending final review
**Branch:** `feature/questionnaire`

## Purpose

A progressive, Typeform-style questionnaire hosted on joelcolombo.co that Joel shares with clients at project kickoff. Replaces the current Notion-based questionnaire (clients found Notion unfamiliar and clunky). Multiple stakeholders per project answer the same questionnaire; answers autosave to a per-project Notion database for easy processing.

First real project: **PRO** (proimpact.tools — Project Resource Optimization, humanitarian aid funding). The DIV Fund Visual Identity questionnaire serves as the structural reference for the base template. PRO-specific questions will be tailored later, once Joel shares meeting context and closes the proposal.

## Architecture

### Routes & files

```
app/questionnaire/
├── [client]/[project]/page.tsx      → resolves project config server-side, renders form (404 if unknown slug)
└── _components/                     → QuestionScreen, TraitSlider, DualSlider, VoiceInput,
                                       WelcomeScreen, SectionInterlude, ReviewScreen, DoneScreen, etc.

app/api/questionnaire/
├── answer/route.ts                  → upsert one answer into the stakeholder's Notion row (autosave)
├── session/route.ts                 → lookup by email; returns prior answers for resume
└── transcribe/route.ts              → audio blob → OpenAI Whisper → text

lib/questionnaire/
├── templates/
│   ├── visual-identity.ts           → base template (10 sections, from the DIV Fund questionnaire)
│   ├── branding.ts
│   └── website.ts
├── projects/
│   └── pro-vi.ts                    → per-project config: client, project, slugs, notionDatabaseId,
│                                      template + overrides (add/remove/edit questions)
├── types.ts                         → Question/Section/Template/ProjectConfig types
└── notion.ts                        → Notion client (row upsert, session lookup)

scripts/
├── questionnaire-setup.ts           → `npm run questionnaire:setup <project>` — creates the Notion DB
│                                      from config, prints the database ID to paste into the config
└── questionnaire-synthesize.ts      → `npm run questionnaire:synthesize <project>` — AI synthesis (see below)
```

### Authoring model

- **Templates** define the shared question structure per project type (visual identity, branding, website).
- **Project configs** pick a template and apply overrides: add, remove, or reword questions per client (as done manually for DIV Fund). Edited in the repo with Claude Code; versioned in git; deployed via Vercel's git auto-deploy.
- Every question has a **stable `id`**. Notion columns are keyed by question ID, so rewording a question never breaks stored data; adding a question adds a column.

### Data model (Notion)

- One **database per project** (same shape as the DIV Fund responses DB): one row per stakeholder, one column per question, plus `Name`, `Email`, `Status` (In progress / Completed), and timestamps. Row title: stakeholder name.
- Created by the setup script from the project config. Requires a Notion integration token with access to the Launchpad workspace page.
- Slider answers stored as readable values (e.g. `"5/7 → Accessible"`; dual sliders as `"Today: 2/7 · Future: 6/7"`).

### Data flow

1. Stakeholder opens `/questionnaire/pro/visual-identity` → server resolves config → welcome screen.
2. Welcome screen collects name + email → `POST /api/questionnaire/session` → if a row with that email exists, prior answers return and the form resumes at the first unanswered question. Otherwise a new row is created.
3. Each answer, on advance → `POST /api/questionnaire/answer` → upsert into the stakeholder's row. Retries with backoff (3 attempts); answers mirror to localStorage and unsent ones retry on the next advance. The client never sees a blocking error — only a persistent "Saving…" indicator.
4. Review screen → final "Done" marks `Status: Completed`.

Notion is the source of truth; resume works from any device via email lookup. Same email on two devices: last write wins per field (no merging).

## UX

Typeform-style, one question per screen, mobile-first. Look & feel of joelcolombo.co: PP Neue Montreal, pure black/white, light/dark via the site's existing `data-theme`, large question typography (hero-scale), custom ellipse cursor, no unnecessary chrome. Framer Motion transitions between screens.

**Screens:**
1. **Welcome** — Joel branding, project title ("Visual Identity — PRO"), short intro, estimated time, name + email fields, "Start →". Includes a honeypot field (bot protection, no CAPTCHA).
2. **Questions** — one per screen. Thin progress bar + "12 / 34" counter + current section label. Navigation: Continue button, Enter key, ↑↓ arrows to move back/forward through answered questions. Mobile: large touch targets.
3. **Section interludes** — brief transition screens between sections ("Section 4 — Visual Tone & Atmosphere").
4. **Review** — compact list of all answers; tapping one jumps back to that question.
5. **Done** — thank-you screen; row marked Completed.

Every question is skippable via a discreet "Skip" link (observed in real DIV Fund responses: partial answers beat abandonment).

An unobtrusive "Saved" micro-indicator (Notion-style) builds trust that closing the tab is safe.

### Question types

| Type | UI |
|---|---|
| `longtext` | Auto-growing textarea + mic button (record → Whisper → editable text in the field) |
| `text` | Single-line input |
| `select` | Large tappable cards/pills (no dropdowns) |
| `multiselect` | Same, multi-toggle |
| `trait-slider` | Two labeled poles (Academic ←→ Accessible), 7 discrete positions, draggable + tappable thumb |
| `dual-slider` | Two thumbs per track — "Today" (muted) and "Where you want to be" (accent) — for brand-positioning questions |
| `sliders-group` | Several trait/dual sliders stacked on one screen |

Slider accent color: minimal, consistent with site (`--hover-color` family; exact accent for the "future" thumb decided during implementation).

### Voice input

Reuses formform's proven pattern (`VoiceNoteRecorder` + Whisper transcription from `api/partner-lead.ts`):
- Mic button on `longtext` questions → MediaRecorder → blob → `POST /api/questionnaire/transcribe` → OpenAI `whisper-1` → transcript lands in the textarea, editable before continuing.
- Whisper chosen over live Web Speech dictation: works in all browsers (incl. Firefox), better accuracy, handles any language.
- Progressive enhancement: button hidden when MediaRecorder/getUserMedia unsupported; one-line notice if mic is blocked; typing always available.
- Caps: ~180s / 3.5MB per recording (Vercel body limit headroom).

## AI synthesis (post-completion)

- Manually triggered: `npm run questionnaire:synthesize pro-vi` (local script, not exposed on the site).
- Reads all rows from the project DB → Claude API (`claude-sonnet-5`) → generates: executive summary, points of consensus, **stakeholder tensions** (e.g. divergent slider positions), and quotable highlights.
- Output saved as a Notion page next to the project's response DB.

## Error handling

| Case | Behavior |
|---|---|
| Notion down / request fails | Retry ×3 with backoff → localStorage fallback → retry on next advance; non-blocking UI |
| Unknown client/project slug | Site 404 |
| Whisper failure / mic blocked | Voice button hides or shows one-line notice; typing unaffected |
| Recording too long/large | Same caps as formform (180s / 3.5MB) |
| Bots | Honeypot on welcome screen; silent drop |
| Config edited post-launch | Question-ID-keyed columns: additions create columns, rewording is safe |

## Environment variables

| Var | Use |
|---|---|
| `NOTION_API_KEY` | Notion integration token (server routes + scripts). One-time setup: create integration, share with Launchpad page |
| `OPENAI_API_KEY` | Whisper transcription (copy from formform) |
| `ANTHROPIC_API_KEY` | Synthesis script only (local; not used by the site) |

## Testing

- **Unit tests:** template + project-config merge logic (overrides produce the expected question list); config→Notion column mapping.
- **Manual verification:** a `test-project` config pointed at a sandbox Notion DB for UI, autosave, resume, and voice flows against the dev server.

## Out of scope (v1)

- Live AI follow-up questions during the form
- Admin UI for authoring questionnaires
- Google Sheets export (Notion CSV export covers it)
- Per-stakeholder tokenized links or passwords
- Completion email notification (can be added later using formform's Resend pattern)
