import { describe, it, expect } from 'vitest'
import { buildScreens, questionCount, firstUnansweredScreen, summarizeAnswer } from './flow'
import type { Template, Question } from './types'

const q = (id: string): Question => ({ id, type: 'longtext', prompt: `P${id}` })

const tpl: Template = {
  id: 't',
  title: 'T',
  intro: 'I',
  estimatedMinutes: 10,
  sections: [
    { id: 's1', title: 'One', questions: [q('a'), q('b')] },
    { id: 's2', title: 'Two', questions: [q('c')] },
  ],
}

describe('buildScreens', () => {
  it('emits interlude before each section, then its questions', () => {
    const screens = buildScreens(tpl)
    expect(screens.map((s) => s.kind)).toEqual([
      'interlude', 'question', 'question', 'interlude', 'question',
    ])
  })

  it('numbers questions globally, 1-based', () => {
    const screens = buildScreens(tpl)
    const numbers = screens.filter((s) => s.kind === 'question').map((s) => s.kind === 'question' && s.number)
    expect(numbers).toEqual([1, 2, 3])
  })
})

describe('questionCount', () => {
  it('counts questions across sections', () => {
    expect(questionCount(tpl)).toBe(3)
  })
})

describe('firstUnansweredScreen', () => {
  const screens = buildScreens(tpl)
  it('returns 0 when nothing seen (first interlude)', () => {
    expect(firstUnansweredScreen(screens, new Set())).toBe(0)
  })
  it('returns the screen index of the first unseen question', () => {
    // 'a' seen -> first unseen question is 'b' at screen index 2 (mid-section: no interlude before it)
    expect(firstUnansweredScreen(screens, new Set(['a']))).toBe(2)
  })
  it('skips a fully seen section including its interlude', () => {
    expect(firstUnansweredScreen(screens, new Set(['a', 'b']))).toBe(3)
  })
  it('returns screens.length when everything is seen', () => {
    expect(firstUnansweredScreen(screens, new Set(['a', 'b', 'c']))).toBe(screens.length)
  })
})

describe('summarizeAnswer', () => {
  it('returns text as-is', () => {
    expect(summarizeAnswer(q('a'), { type: 'text', text: 'hello' })).toBe('hello')
  })
  it('joins choices', () => {
    const sel: Question = { id: 'x', type: 'multiselect', prompt: 'P', options: ['A', 'B'] }
    expect(summarizeAnswer(sel, { type: 'choice', selected: ['A', 'B'] })).toBe('A, B')
  })
  it('formats scale positions with pole labels', () => {
    const sl: Question = {
      id: 'y', type: 'trait-slider', prompt: 'P',
      slider: { id: 'y', left: 'Serious', right: 'Approachable' },
    }
    expect(summarizeAnswer(sl, { type: 'scale', positions: { y: 6 } })).toBe('6/7 → Approachable')
  })
  it('formats dual positions', () => {
    const sl: Question = {
      id: 'z', type: 'dual-slider', prompt: 'P',
      slider: { id: 'z', left: 'L', right: 'R' },
    }
    expect(summarizeAnswer(sl, { type: 'dual-scale', positions: { z: { today: 2, future: 6 } } }))
      .toBe('Today: 2/7 · Future: 6/7')
  })
})
