import type { Question, Template } from './types'

export interface TemplateOverrides {
  title?: string
  intro?: string
  removeQuestions?: string[]
  /** questionId -> new prompt */
  reword?: Record<string, string>
  /**
   * Full in-place replacements matched by question id: keeps the question's
   * position and (crucially) its Notion column key while changing its type,
   * prompt, hint, options, or sliders.
   */
  replaceQuestions?: Question[]
  addQuestions?: { sectionId: string; after?: string; question: Question }[]
}

export function applyOverrides(template: Template, o: TemplateOverrides): Template {
  const out: Template = structuredClone(template)
  if (o.title) out.title = o.title
  if (o.intro) out.intro = o.intro

  const removed = new Set(o.removeQuestions ?? [])
  const replacements = new Map((o.replaceQuestions ?? []).map((q) => [q.id, q]))
  for (const section of out.sections) {
    section.questions = section.questions
      .filter((q) => !removed.has(q.id))
      .map((q) => replacements.get(q.id) ?? q)
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
