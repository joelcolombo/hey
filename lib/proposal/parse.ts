import type { ContentBlock, Milestone, NotionBlock, PricingTable, ProposalMeta, ProposalPublicMeta, Section } from './types'

export function toPublicMeta(meta: ProposalMeta): ProposalPublicMeta {
  const { pageId: _pageId, allowedEmails: _allowedEmails, ...pub } = meta
  return pub
}

export function parsePriceCell(cell: string): { amount: number | null; label: string } {
  const m = cell.match(/\d[\d,]*(?:\.\d+)?/)
  if (!m) return { amount: null, label: cell }
  return { amount: Number(m[0].replace(/,/g, '')), label: cell }
}

const isHeaderRow = (row: string[]) => !row.some((cell) => /\d/.test(cell))

function buildPricing(rows: string[][]): PricingTable {
  const body = rows.length && isHeaderRow(rows[0]) ? rows.slice(1) : rows
  const milestones: Milestone[] = body
    .filter((r) => (r[0] ?? '').trim().length > 0)
    .map((r) => {
      const { amount, label } = parsePriceCell(r[1] ?? '')
      return { name: r[0].trim(), amount, priceLabel: label, timeline: (r[2] ?? '').trim() }
    })
  return { milestones }
}

/**
 * Groups a flat Notion block list into Sections (split on heading_1).
 * The first table under a heading_2 matching /pricing/i becomes the
 * interactive pricing block; any other table renders as a plain table.
 */
export function parseSections(blocks: NotionBlock[]): Section[] {
  const sections: Section[] = []
  let current: Section | null = null
  let inPricing = false
  let pricingFound = false
  let list: { kind: 'bullets' | 'numbered'; items: string[] } | null = null

  const flushList = () => {
    if (list && current) current.blocks.push(list)
    list = null
  }

  for (const b of blocks) {
    const text = (b.text ?? '').trim()
    if (b.type === 'heading_1') {
      flushList()
      current = { title: text, blocks: [] }
      sections.push(current)
      inPricing = false
      continue
    }
    if (!current) continue

    if (b.type === 'bulleted_list_item' || b.type === 'numbered_list_item') {
      const kind = b.type === 'bulleted_list_item' ? 'bullets' : 'numbered'
      if (!list || list.kind !== kind) {
        flushList()
        list = { kind, items: [] }
      }
      list.items.push(text)
      continue
    }
    flushList()

    if (b.type === 'heading_2') {
      inPricing = /pricing/i.test(text)
      current.blocks.push({ kind: 'h2', text })
    } else if (b.type === 'heading_3') {
      current.blocks.push({ kind: 'h3', text })
    } else if (b.type === 'divider') {
      current.blocks.push({ kind: 'divider' })
    } else if (b.type === 'table') {
      const rows = b.rows ?? []
      if (inPricing && !pricingFound) {
        pricingFound = true
        current.blocks.push({ kind: 'pricing', pricing: buildPricing(rows) })
      } else {
        current.blocks.push({ kind: 'table', rows })
      }
    } else if (text) {
      // paragraph and any unknown block type with text → paragraph fallback
      current.blocks.push({ kind: 'p', text })
    }
  }
  flushList()
  return sections
}

const formatTotal = (milestones: Milestone[], total: number): string => {
  const currency = milestones.find((m) => m.amount !== null)?.priceLabel.match(/^[A-Z]{3}/)?.[0]
  return `${currency ? `${currency} ` : ''}$${total.toLocaleString('en-US')}`
}

export function computeApprovalSummary(
  pricing: PricingTable,
  selectedNames: string[]
): { names: string[]; total: number; label: string } | null {
  const wanted = new Set(selectedNames)
  const selected = pricing.milestones.filter((m) => wanted.has(m.name))
  if (selected.length === 0) return null
  const total = selected.reduce((sum, m) => sum + (m.amount ?? 0), 0)
  const names = selected.map((m) => m.name)
  return { names, total, label: `${names.join(' + ')} — ${formatTotal(selected, total)}` }
}
