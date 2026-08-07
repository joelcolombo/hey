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
  | (QuestionBase & {
      type: 'longtext'
      placeholder?: string
      /** Tappable helper pills that append to the answer (e.g. "Minimalist"). */
      suggestions?: string[]
    })
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
