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
