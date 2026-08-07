import { formatDual, formatScale } from './flow'
import type { Answer, Question, Template, TraitSliderDef } from './types'

export const QUESTION_KEY_RE = /^\[([^\]]+)\]/

export type ColumnDef = {
  key: string
  name: string
  kind: 'rich_text' | 'select' | 'multi_select'
  options?: string[]
}

export type FormattedEntry = { key: string; kind: ColumnDef['kind']; value: string | string[] }

export type NotionPropValue =
  | { type: 'rich_text'; text: string }
  | { type: 'select'; name: string | null }
  | { type: 'multi_select'; names: string[] }

const truncate = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n - 1) + '…')

function slidersOf(q: Question): TraitSliderDef[] {
  if (q.type === 'sliders-group') return q.sliders
  if (q.type === 'trait-slider' || q.type === 'dual-slider') return [q.slider]
  return []
}

export function columnsForQuestion(q: Question): ColumnDef[] {
  switch (q.type) {
    case 'text':
    case 'longtext':
      return [{ key: q.id, name: `[${q.id}] ${truncate(q.prompt, 60)}`, kind: 'rich_text' }]
    case 'select':
      return [{ key: q.id, name: `[${q.id}] ${truncate(q.prompt, 60)}`, kind: 'select', options: q.options }]
    case 'multiselect':
      return [{ key: q.id, name: `[${q.id}] ${truncate(q.prompt, 60)}`, kind: 'multi_select', options: q.options }]
    case 'trait-slider':
    case 'dual-slider':
      return [{ key: q.id, name: `[${q.id}] ${q.slider.left} / ${q.slider.right}`, kind: 'rich_text' }]
    case 'sliders-group':
      return q.sliders.map((s) => ({
        key: `${q.id}.${s.id}`,
        name: `[${q.id}.${s.id}] ${s.left} / ${s.right}`,
        kind: 'rich_text' as const,
      }))
  }
}

export function formatAnswer(q: Question, a: Answer): FormattedEntry[] {
  switch (a.type) {
    case 'text':
      return [{ key: q.id, kind: 'rich_text', value: a.text }]
    case 'choice':
      if (q.type === 'multiselect') return [{ key: q.id, kind: 'multi_select', value: a.selected }]
      return [{ key: q.id, kind: 'select', value: a.selected[0] ?? '' }]
    case 'scale':
      return slidersOf(q)
        .filter((s) => a.positions[s.id] !== undefined)
        .map((s) => ({
          key: q.type === 'sliders-group' ? `${q.id}.${s.id}` : q.id,
          kind: 'rich_text' as const,
          value: formatScale(a.positions[s.id], s.left, s.right),
        }))
    case 'dual-scale':
      return slidersOf(q)
        .filter((s) => a.positions[s.id] !== undefined)
        .map((s) => ({
          key: q.type === 'sliders-group' ? `${q.id}.${s.id}` : q.id,
          kind: 'rich_text' as const,
          value: formatDual(a.positions[s.id].today, a.positions[s.id].future),
        }))
  }
}

const SCALE_RE = /^([1-7])\/7/
const DUAL_RE = /^Today: ([1-7])\/7 · Future: ([1-7])\/7$/

export function parseAnswer(
  q: Question,
  getProp: (key: string) => NotionPropValue | undefined
): Answer | undefined {
  switch (q.type) {
    case 'text':
    case 'longtext': {
      const p = getProp(q.id)
      if (p?.type !== 'rich_text' || !p.text) return undefined
      return { type: 'text', text: p.text }
    }
    case 'select': {
      const p = getProp(q.id)
      if (p?.type !== 'select' || !p.name) return undefined
      return { type: 'choice', selected: [p.name] }
    }
    case 'multiselect': {
      const p = getProp(q.id)
      if (p?.type !== 'multi_select' || p.names.length === 0) return undefined
      return { type: 'choice', selected: p.names }
    }
    case 'trait-slider':
    case 'dual-slider':
    case 'sliders-group': {
      const dual = q.type === 'dual-slider' || (q.type === 'sliders-group' && q.mode === 'dual')
      const scale: Record<string, number> = {}
      const dualScale: Record<string, { today: number; future: number }> = {}
      for (const s of slidersOf(q)) {
        const key = q.type === 'sliders-group' ? `${q.id}.${s.id}` : q.id
        const p = getProp(key)
        if (p?.type !== 'rich_text' || !p.text) continue
        if (dual) {
          const m = p.text.match(DUAL_RE)
          if (m) dualScale[s.id] = { today: Number(m[1]), future: Number(m[2]) }
        } else {
          const m = p.text.match(SCALE_RE)
          if (m) scale[s.id] = Number(m[1])
        }
      }
      if (dual) {
        return Object.keys(dualScale).length ? { type: 'dual-scale', positions: dualScale } : undefined
      }
      return Object.keys(scale).length ? { type: 'scale', positions: scale } : undefined
    }
  }
}

/** Properties payload for Notion `databases.create`. */
export function buildDatabaseProperties(template: Template): Record<string, object> {
  const props: Record<string, object> = {
    Name: { title: {} },
    Email: { email: {} },
    Status: { select: { options: [{ name: 'In progress' }, { name: 'Completed' }] } },
  }
  for (const section of template.sections) {
    for (const q of section.questions) {
      for (const col of columnsForQuestion(q)) {
        if (col.kind === 'rich_text') props[col.name] = { rich_text: {} }
        else if (col.kind === 'select') props[col.name] = { select: { options: (col.options ?? []).map((name) => ({ name })) } }
        else props[col.name] = { multi_select: { options: (col.options ?? []).map((name) => ({ name })) } }
      }
    }
  }
  return props
}
