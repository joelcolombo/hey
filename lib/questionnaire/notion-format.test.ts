import { describe, it, expect } from 'vitest'
import {
  columnsForQuestion, formatAnswer, parseAnswer, buildDatabaseProperties, QUESTION_KEY_RE,
  type NotionPropValue,
} from './notion-format'
import type { Question, Template } from './types'

const longtext: Question = { id: 'purpose', type: 'longtext', prompt: 'Describe the purpose of the org in your own words' }
const select: Question = { id: 'type-feel', type: 'select', prompt: 'How should the typography feel?', options: ['Editorial', 'Technical'] }
const multi: Question = { id: 'worlds', type: 'multiselect', prompt: 'Pick worlds', options: ['A', 'B', 'C'] }
const group: Question = {
  id: 'traits', type: 'sliders-group', mode: 'dual', prompt: 'Traits',
  sliders: [
    { id: 'serious-approachable', left: 'Serious', right: 'Approachable' },
    { id: 'urgent-patient', left: 'Urgent', right: 'Patient' },
  ],
}
const single: Question = { id: 'tone', type: 'trait-slider', prompt: 'Tone', slider: { id: 'tone', left: 'Quiet', right: 'Loud' } }

describe('columnsForQuestion', () => {
  it('prefixes column names with [question-id]', () => {
    const [col] = columnsForQuestion(longtext)
    expect(col.key).toBe('purpose')
    expect(col.name.startsWith('[purpose] ')).toBe(true)
    expect(col.kind).toBe('rich_text')
  })
  it('truncates long prompts in column names to 60 chars of prompt', () => {
    const [col] = columnsForQuestion(longtext)
    expect(col.name.length).toBeLessThanOrEqual('[purpose] '.length + 60)
  })
  it('maps select/multiselect kinds with options', () => {
    expect(columnsForQuestion(select)[0]).toMatchObject({ kind: 'select', options: ['Editorial', 'Technical'] })
    expect(columnsForQuestion(multi)[0]).toMatchObject({ kind: 'multi_select' })
  })
  it('emits one column per slider in a group, keyed questionId.sliderId', () => {
    const cols = columnsForQuestion(group)
    expect(cols.map((c) => c.key)).toEqual(['traits.serious-approachable', 'traits.urgent-patient'])
    expect(cols[0].name).toBe('[traits.serious-approachable] Serious / Approachable')
  })
})

describe('QUESTION_KEY_RE', () => {
  it('extracts the key from a column name', () => {
    expect('[traits.urgent-patient] Urgent / Patient'.match(QUESTION_KEY_RE)?.[1]).toBe('traits.urgent-patient')
  })
})

describe('formatAnswer / parseAnswer roundtrip', () => {
  const roundtrip = (q: Question, a: Parameters<typeof formatAnswer>[1]) => {
    const entries = formatAnswer(q, a)
    const byKey = new Map(entries.map((e) => [e.key, e]))
    const getProp = (key: string): NotionPropValue | undefined => {
      const e = byKey.get(key)
      if (!e) return undefined
      if (e.kind === 'rich_text') return { type: 'rich_text', text: e.value as string }
      if (e.kind === 'select') return { type: 'select', name: (e.value as string) || null }
      return { type: 'multi_select', names: e.value as string[] }
    }
    return parseAnswer(q, getProp)
  }

  it('text', () => {
    const a = { type: 'text' as const, text: 'Hello world' }
    expect(roundtrip(longtext, a)).toEqual(a)
  })
  it('select', () => {
    const a = { type: 'choice' as const, selected: ['Editorial'] }
    expect(roundtrip(select, a)).toEqual(a)
  })
  it('multiselect', () => {
    const a = { type: 'choice' as const, selected: ['A', 'C'] }
    expect(roundtrip(multi, a)).toEqual(a)
  })
  it('single scale', () => {
    const a = { type: 'scale' as const, positions: { tone: 5 } }
    expect(roundtrip(single, a)).toEqual(a)
    expect(formatAnswer(single, a)[0].value).toBe('5/7 → Loud')
  })
  it('dual scale group', () => {
    const a = { type: 'dual-scale' as const, positions: { 'serious-approachable': { today: 2, future: 6 }, 'urgent-patient': { today: 4, future: 4 } } }
    expect(roundtrip(group, a)).toEqual(a)
    expect(formatAnswer(group, a)[0].value).toBe('Today: 2/7 · Future: 6/7')
  })
  it('returns undefined for empty properties', () => {
    expect(parseAnswer(longtext, () => undefined)).toBeUndefined()
    expect(parseAnswer(longtext, () => ({ type: 'rich_text', text: '' }))).toBeUndefined()
  })
})

describe('buildDatabaseProperties', () => {
  const tpl: Template = {
    id: 't', title: 'T', intro: '', estimatedMinutes: 5,
    sections: [{ id: 's', title: 'S', questions: [longtext, select, group] }],
  }
  const props = buildDatabaseProperties(tpl)
  it('includes base columns', () => {
    expect(props['Name']).toEqual({ title: {} })
    expect(props['Email']).toEqual({ email: {} })
    expect(props['Status']).toEqual({ select: { options: [{ name: 'In progress' }, { name: 'Completed' }] } })
  })
  it('includes one property per question column with correct types', () => {
    const names = Object.keys(props)
    expect(names.some((n) => n.startsWith('[purpose]'))).toBe(true)
    expect(names.some((n) => n.startsWith('[traits.urgent-patient]'))).toBe(true)
    const selectName = names.find((n) => n.startsWith('[type-feel]'))!
    expect(props[selectName]).toEqual({ select: { options: [{ name: 'Editorial' }, { name: 'Technical' }] } })
  })
})
