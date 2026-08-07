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

describe('question id and slider-column uniqueness', () => {
  it('has no duplicate question ids or sliders-group column keys within any config', () => {
    for (const cfg of listProjectConfigs()) {
      const keys: string[] = []
      for (const section of cfg.template.sections) {
        for (const q of section.questions) {
          keys.push(q.id)
          if (q.type === 'sliders-group') {
            for (const s of q.sliders) keys.push(`${q.id}.${s.id}`)
          }
        }
      }
      const seen = new Set<string>()
      const dupes = keys.filter((k) => (seen.has(k) ? true : (seen.add(k), false)))
      expect(dupes).toEqual([])
    }
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
