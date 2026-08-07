import type { ProjectConfig } from '../types'
import { proVi } from './pro-vi'
import { testProject } from './test-project'

// The sandbox project points at a throwaway Notion DB and exists purely for
// manual QA — never expose it in production.
const registry: ProjectConfig[] = [proVi, ...(process.env.NODE_ENV !== 'production' ? [testProject] : [])]

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
