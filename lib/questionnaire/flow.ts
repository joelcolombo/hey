import type { Answer, Question, Section, Template, TraitSliderDef } from './types'

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

/** The trait slider(s) a question defines, regardless of single/group shape. */
function slidersOf(question: Question): TraitSliderDef[] {
  if (question.type === 'sliders-group') return question.sliders
  if (question.type === 'trait-slider' || question.type === 'dual-slider') return [question.slider]
  return []
}

/** Human-readable one-liner for the review screen and Notion summaries. */
export function summarizeAnswer(question: Question, answer: Answer): string {
  switch (answer.type) {
    case 'text':
      return answer.text
    case 'choice':
      return answer.selected.join(', ')
    case 'scale':
      return slidersOf(question)
        .filter((s) => answer.positions[s.id] !== undefined)
        .map((s) => formatScale(answer.positions[s.id], s.left, s.right))
        .join(' · ')
    case 'dual-scale':
      // One labeled line per trait so the review screen (whitespace-pre-wrap)
      // renders a readable list instead of a run-on string of numbers.
      return slidersOf(question)
        .filter((s) => answer.positions[s.id] !== undefined)
        .map((s) => {
          const p = answer.positions[s.id]
          return `${s.left} / ${s.right}: Today ${p.today}/7 · Future ${p.future}/7`
        })
        .join('\n')
  }
}
