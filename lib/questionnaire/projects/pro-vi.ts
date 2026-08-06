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
