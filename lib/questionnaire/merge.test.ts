import { describe, it, expect } from 'vitest'
import { applyOverrides, type TemplateOverrides } from './merge'
import type { Template, Question } from './types'

const q = (id: string, prompt = `Prompt ${id}`): Question => ({ id, type: 'longtext', prompt })

const base: Template = {
  id: 'tpl',
  title: 'Base title',
  intro: 'Base intro',
  estimatedMinutes: 20,
  sections: [
    { id: 's1', title: 'One', questions: [q('a'), q('b')] },
    { id: 's2', title: 'Two', questions: [q('c')] },
  ],
}

describe('applyOverrides', () => {
  it('returns an equal template when overrides are empty', () => {
    const out = applyOverrides(base, {})
    expect(out).toEqual(base)
    expect(out).not.toBe(base) // must be a copy
  })

  it('removes questions by id', () => {
    const out = applyOverrides(base, { removeQuestions: ['b'] })
    expect(out.sections[0].questions.map((x) => x.id)).toEqual(['a'])
  })

  it('rewords prompts by id without touching the id', () => {
    const out = applyOverrides(base, { reword: { c: 'New prompt' } })
    expect(out.sections[1].questions[0]).toMatchObject({ id: 'c', prompt: 'New prompt' })
  })

  it('adds a question after a given question in a section', () => {
    const out = applyOverrides(base, {
      addQuestions: [{ sectionId: 's1', after: 'a', question: q('x') }],
    })
    expect(out.sections[0].questions.map((x) => x.id)).toEqual(['a', 'x', 'b'])
  })

  it('appends when `after` is omitted', () => {
    const out = applyOverrides(base, { addQuestions: [{ sectionId: 's2', question: q('y') }] })
    expect(out.sections[1].questions.map((x) => x.id)).toEqual(['c', 'y'])
  })

  it('replaces a question in place, keeping id and position', () => {
    const replacement: Question = {
      id: 'b', type: 'select', prompt: 'New select prompt', options: ['One', 'Two'],
    }
    const out = applyOverrides(base, { replaceQuestions: [replacement] })
    expect(out.sections[0].questions.map((x) => x.id)).toEqual(['a', 'b'])
    expect(out.sections[0].questions[1]).toEqual(replacement)
  })

  it('overrides title and intro', () => {
    const out = applyOverrides(base, { title: 'T2', intro: 'I2' })
    expect(out.title).toBe('T2')
    expect(out.intro).toBe('I2')
  })
})
