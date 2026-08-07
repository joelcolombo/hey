import { describe, expect, it } from 'vitest'
import { computeApprovalSummary, parsePriceCell, parseSections, toPublicMeta } from './parse'
import type { NotionBlock, PricingTable, ProposalMeta } from './types'

const h1 = (text: string): NotionBlock => ({ type: 'heading_1', text })
const h2 = (text: string): NotionBlock => ({ type: 'heading_2', text })
const p = (text: string): NotionBlock => ({ type: 'paragraph', text })
const li = (text: string): NotionBlock => ({ type: 'bulleted_list_item', text })

const pricingRows = [
  ['Milestone', 'Price', 'Timeline'],
  ['Visual Assets', 'USD $1,500', '1 week'],
  ['Website Redesign', 'USD $6,000', '6-7 weeks'],
]

describe('parseSections', () => {
  it('groups blocks into sections by heading_1', () => {
    const sections = parseSections([
      h1('Project Details'), h2('Background'), p('Intro.'), li('One'), li('Two'),
      h1('Project Agreement'), p('Terms.'),
    ])
    expect(sections.map((s) => s.title)).toEqual(['Project Details', 'Project Agreement'])
    expect(sections[0].blocks).toEqual([
      { kind: 'h2', text: 'Background' },
      { kind: 'p', text: 'Intro.' },
      { kind: 'bullets', items: ['One', 'Two'] },
    ])
  })

  it('collects consecutive list items into one block, split by interruptions', () => {
    const sections = parseSections([h1('S'), li('a'), li('b'), p('x'), li('c')])
    expect(sections[0].blocks).toEqual([
      { kind: 'bullets', items: ['a', 'b'] },
      { kind: 'p', text: 'x' },
      { kind: 'bullets', items: ['c'] },
    ])
  })

  it('ignores content before the first heading_1 and skips empty paragraphs', () => {
    const sections = parseSections([p('stray'), h1('S'), p(''), p('kept')])
    expect(sections).toHaveLength(1)
    expect(sections[0].blocks).toEqual([{ kind: 'p', text: 'kept' }])
  })

  it('turns a table under a Pricing heading into a pricing block', () => {
    const sections = parseSections([
      h1('Project Agreement'), h2('Pricing & Timelines'),
      { type: 'table', rows: pricingRows },
    ])
    const block = sections[0].blocks[1]
    expect(block.kind).toBe('pricing')
    if (block.kind !== 'pricing') return
    expect(block.pricing.milestones).toEqual([
      { name: 'Visual Assets', amount: 1500, priceLabel: 'USD $1,500', timeline: '1 week' },
      { name: 'Website Redesign', amount: 6000, priceLabel: 'USD $6,000', timeline: '6-7 weeks' },
    ])
  })

  it('renders tables outside Pricing sections as plain tables', () => {
    const sections = parseSections([h1('S'), h2('Other'), { type: 'table', rows: pricingRows }])
    expect(sections[0].blocks[1].kind).toBe('table')
  })

  it('drops the header row only when it has no digits', () => {
    const sections = parseSections([
      h1('S'), h2('Pricing'),
      { type: 'table', rows: [['Thing A', 'USD $100', '1 week']] },
    ])
    const block = sections[0].blocks[1]
    if (block.kind !== 'pricing') throw new Error('expected pricing')
    expect(block.pricing.milestones).toHaveLength(1)
  })

  it('falls back to a paragraph for unknown block types with text', () => {
    const sections = parseSections([h1('S'), { type: 'callout', text: 'Note' }, { type: 'unsupported' }])
    expect(sections[0].blocks).toEqual([{ kind: 'p', text: 'Note' }])
  })
})

describe('parsePriceCell', () => {
  it('parses "USD $1,500"', () => {
    expect(parsePriceCell('USD $1,500')).toEqual({ amount: 1500, label: 'USD $1,500' })
  })
  it('parses bare numbers and decimals', () => {
    expect(parsePriceCell('$7,500.50').amount).toBe(7500.5)
  })
  it('returns null amount for unparsable cells', () => {
    expect(parsePriceCell('TBD')).toEqual({ amount: null, label: 'TBD' })
  })
})

describe('computeApprovalSummary', () => {
  const pricing: PricingTable = {
    milestones: [
      { name: 'Visual Assets', amount: 1500, priceLabel: 'USD $1,500', timeline: '1 week' },
      { name: 'Website Redesign', amount: 6000, priceLabel: 'USD $6,000', timeline: '6-7 weeks' },
      { name: 'Extra', amount: null, priceLabel: 'TBD', timeline: '—' },
    ],
  }

  it('sums selected parseable milestones and builds the label', () => {
    const s = computeApprovalSummary(pricing, ['Visual Assets', 'Website Redesign'])
    expect(s).toEqual({
      names: ['Visual Assets', 'Website Redesign'],
      total: 7500,
      label: 'Visual Assets + Website Redesign — USD $7,500',
    })
  })

  it('ignores unknown names and preserves pricing-table order', () => {
    const s = computeApprovalSummary(pricing, ['Website Redesign', 'Nope', 'Visual Assets'])
    expect(s?.names).toEqual(['Visual Assets', 'Website Redesign'])
  })

  it('returns null when nothing valid is selected', () => {
    expect(computeApprovalSummary(pricing, [])).toBeNull()
    expect(computeApprovalSummary(pricing, ['Nope'])).toBeNull()
  })

  it('includes unpriced milestones in the label without breaking the total', () => {
    const s = computeApprovalSummary(pricing, ['Visual Assets', 'Extra'])
    expect(s?.total).toBe(1500)
    expect(s?.label).toBe('Visual Assets + Extra — USD $1,500')
  })
})

describe('toPublicMeta', () => {
  it('strips pageId and allowedEmails', () => {
    const meta: ProposalMeta = {
      pageId: 'x', slug: 's', title: 'T', number: '012', client: 'C', date: '2026-03-10',
      version: '1.1', requestedBy: 'Anne', allowedEmails: ['a@b.c'], status: 'Sent',
      approvedBy: null, approvedAt: null, approvedMilestones: null,
    }
    const pub = toPublicMeta(meta) as Record<string, unknown>
    expect(pub.pageId).toBeUndefined()
    expect(pub.allowedEmails).toBeUndefined()
    expect(pub.slug).toBe('s')
  })
})
