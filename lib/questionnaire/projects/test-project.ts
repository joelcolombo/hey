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
