import { applyOverrides } from '../merge'
import { visualIdentityTemplate } from '../templates/visual-identity'
import type { ProjectConfig } from '../types'

/** Sandbox project for manual QA. Points at a throwaway Notion DB. */
export const testProject: ProjectConfig = {
  clientSlug: 'test',
  projectSlug: 'sandbox',
  clientName: 'Acme Co',
  projectTitle: 'Visual Identity (Test)',
  notionDatabaseId: '3eb31d76-5671-45c9-acdb-ddb6708ef513',
  template: applyOverrides(visualIdentityTemplate, {}),
}
