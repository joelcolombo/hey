# Client Proposals on the Web — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Present commercial proposals as gated pages on joelcolombo.co, authored in Notion, with milestone selection and an Approve flow that records to Notion and emails Joel; the same page prints to the PDF sent via DocuSign.

**Architecture:** Notion "Proposals" database is the source of truth (properties = metadata, page body = document). A server-rendered `/proposal/[slug]` route resolves the proposal, gates it behind an email allowlist (signed HMAC cookie), parses Notion blocks into a typed section model, and renders it in the site's aesthetic. Approve writes back to Notion and notifies via Resend. Print stylesheet produces the DocuSign PDF.

**Tech Stack:** Next.js 15 App Router, TypeScript, `@notionhq/client` v5 (data-source API), vitest, Tailwind with site CSS vars, Resend via plain `fetch`, `node:crypto` HMAC.

**Spec:** `docs/superpowers/specs/2026-08-07-proposal-design.md`

## Global Constraints

- Work on branch `feature/proposals`.
- Notion env var is `NOTION_API_KEY` (already in `.env.local` — same integration as the questionnaire). New env vars: `NOTION_PROPOSALS_DB_ID`, `NOTION_PROPOSALS_PARENT_PAGE_ID` (setup only), `RESEND_API_KEY`, `PROPOSAL_SESSION_SECRET`.
- Notion SDK v5 is data-source-centric: schema lives on `dataSources`, queries use `notion.dataSources.query`, creation uses `initial_data_source`. Mirror `lib/questionnaire/notion.ts` and `scripts/questionnaire-setup.ts` exactly.
- All client-facing copy in English. Neutral rejection message: `This email doesn't have access to this proposal.`
- Never send `Allowed emails` (or any non-public property) to the browser.
- Status lifecycle: `Draft` (404) → `Sent` → `Viewed` (auto on first verified access) → `Approved` (frozen, idempotent).
- Styling: site CSS vars (`--foreground`, `--background`, `--hover-color`), Tailwind arbitrary values, patterns copied from `app/questionnaire/_components/`. Cover is always black (`bg-black text-white`) in both themes.
- Client errors are never raw: approve failures show inline retry; page-load Notion failures show a minimal unavailable state.
- Tests: vitest, colocated `*.test.ts` next to the module (questionnaire convention). Run with `npx vitest run <file>`.

---

### Task 1: Domain types and Notion block parser

**Files:**
- Create: `lib/proposal/types.ts`
- Create: `lib/proposal/parse.ts`
- Test: `lib/proposal/parse.test.ts`

**Interfaces:**
- Consumes: nothing (pure module).
- Produces (used by Tasks 3, 5, 6, 7):
  - Types: `ProposalMeta`, `ProposalPublicMeta`, `ProposalStatus`, `Section`, `ContentBlock`, `PricingTable`, `Milestone`, `NotionBlock`
  - `parseSections(blocks: NotionBlock[]): Section[]`
  - `parsePriceCell(cell: string): { amount: number | null; label: string }`
  - `computeApprovalSummary(pricing: PricingTable, selectedNames: string[]): { names: string[]; total: number; label: string } | null`
  - `toPublicMeta(meta: ProposalMeta): ProposalPublicMeta`

- [ ] **Step 1: Create branch**

```bash
git checkout -b feature/proposals
```

- [ ] **Step 2: Write `lib/proposal/types.ts`**

```ts
export type ProposalStatus = 'Draft' | 'Sent' | 'Viewed' | 'Approved'

/** Full metadata from the Notion row. Server-side only — contains the allowlist. */
export type ProposalMeta = {
  pageId: string
  slug: string
  title: string
  number: string
  client: string
  date: string
  version: string
  requestedBy: string
  allowedEmails: string[]
  status: ProposalStatus
  approvedBy: string | null
  approvedAt: string | null
  approvedMilestones: string | null
}

/** Safe subset serialized to the browser. */
export type ProposalPublicMeta = Omit<ProposalMeta, 'allowedEmails' | 'pageId'>

export type Milestone = {
  name: string
  /** Numeric amount parsed from the price cell; null when unparsable. */
  amount: number | null
  /** The price cell verbatim, e.g. "USD $1,500". */
  priceLabel: string
  timeline: string
}

export type PricingTable = { milestones: Milestone[] }

export type ContentBlock =
  | { kind: 'h2'; text: string }
  | { kind: 'h3'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'bullets'; items: string[] }
  | { kind: 'numbered'; items: string[] }
  | { kind: 'divider' }
  | { kind: 'table'; rows: string[][] }
  | { kind: 'pricing'; pricing: PricingTable }

/** A document section = one heading_1 and everything until the next one. */
export type Section = { title: string; blocks: ContentBlock[] }

/**
 * Loose shape of a Notion API block after fetching. `text` is the joined
 * plain_text of the block's rich_text; `cells` only for table_row children.
 */
export type NotionBlock = {
  type: string
  text?: string
  /** table blocks: their table_row children, each row = cell texts. */
  rows?: string[][]
}
```

- [ ] **Step 3: Write the failing tests in `lib/proposal/parse.test.ts`**

```ts
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
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `npx vitest run lib/proposal/parse.test.ts`
Expected: FAIL — `Cannot find module './parse'` (or missing exports).

- [ ] **Step 5: Write `lib/proposal/parse.ts`**

```ts
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
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run lib/proposal/parse.test.ts`
Expected: PASS (all).

- [ ] **Step 7: Commit**

```bash
git add lib/proposal/types.ts lib/proposal/parse.ts lib/proposal/parse.test.ts
git commit -m "Proposal domain types and Notion block parser"
```

---

### Task 2: Access control — allowlist matching and signed session tokens

**Files:**
- Create: `lib/proposal/access.ts`
- Test: `lib/proposal/access.test.ts`

**Interfaces:**
- Consumes: nothing (pure module, `node:crypto` only).
- Produces (used by Tasks 5, 6):
  - `parseAllowedEmails(raw: string): string[]`
  - `isEmailAllowed(email: string, allowed: string[]): boolean`
  - `createSessionToken(pageId: string, email: string, secret: string, nowMs?: number): string`
  - `verifySessionToken(token: string, pageId: string, secret: string, nowMs?: number): { email: string } | null`
  - `SESSION_COOKIE` (constant: `'proposal-session'`), `SESSION_TTL_MS` (30 days)

- [ ] **Step 1: Write the failing tests in `lib/proposal/access.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { createSessionToken, isEmailAllowed, parseAllowedEmails, verifySessionToken } from './access'

describe('parseAllowedEmails', () => {
  it('splits on commas, trims, lowercases, drops empties', () => {
    expect(parseAllowedEmails(' Anne@Recoding.us ,, bob@x.co\n')).toEqual(['anne@recoding.us', 'bob@x.co'])
  })
  it('returns empty array for empty input', () => {
    expect(parseAllowedEmails('')).toEqual([])
  })
})

describe('isEmailAllowed', () => {
  const allowed = parseAllowedEmails('anne@recoding.us, bob@x.co')
  it('matches case- and whitespace-insensitively', () => {
    expect(isEmailAllowed(' ANNE@recoding.US ', allowed)).toBe(true)
  })
  it('rejects unknown emails', () => {
    expect(isEmailAllowed('eve@evil.com', allowed)).toBe(false)
  })
})

describe('session tokens', () => {
  const secret = 'test-secret'
  const now = 1_700_000_000_000

  it('round-trips a valid token', () => {
    const token = createSessionToken('page-1', 'anne@recoding.us', secret, now)
    expect(verifySessionToken(token, 'page-1', secret, now + 1000)).toEqual({ email: 'anne@recoding.us' })
  })

  it('rejects a token for a different proposal', () => {
    const token = createSessionToken('page-1', 'anne@recoding.us', secret, now)
    expect(verifySessionToken(token, 'page-2', secret, now)).toBeNull()
  })

  it('rejects a tampered token', () => {
    const token = createSessionToken('page-1', 'anne@recoding.us', secret, now)
    const [payload] = token.split('.')
    expect(verifySessionToken(`${payload}.forged`, 'page-1', secret, now)).toBeNull()
  })

  it('rejects a wrong secret and an expired token', () => {
    const token = createSessionToken('page-1', 'a@b.c', secret, now)
    expect(verifySessionToken(token, 'page-1', 'other', now)).toBeNull()
    expect(verifySessionToken(token, 'page-1', secret, now + 31 * 24 * 60 * 60 * 1000)).toBeNull()
  })

  it('rejects garbage', () => {
    expect(verifySessionToken('not-a-token', 'page-1', secret, now)).toBeNull()
    expect(verifySessionToken('', 'page-1', secret, now)).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/proposal/access.test.ts`
Expected: FAIL — `Cannot find module './access'`.

- [ ] **Step 3: Write `lib/proposal/access.ts`**

```ts
import { createHmac, timingSafeEqual } from 'node:crypto'

export const SESSION_COOKIE = 'proposal-session'
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

export function parseAllowedEmails(raw: string): string[] {
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isEmailAllowed(email: string, allowed: string[]): boolean {
  return allowed.includes(email.trim().toLowerCase())
}

const sign = (payload: string, secret: string) =>
  createHmac('sha256', secret).update(payload).digest('base64url')

export function createSessionToken(pageId: string, email: string, secret: string, nowMs = Date.now()): string {
  const payload = Buffer.from(
    JSON.stringify({ p: pageId, e: email.trim().toLowerCase(), x: nowMs + SESSION_TTL_MS })
  ).toString('base64url')
  return `${payload}.${sign(payload, secret)}`
}

export function verifySessionToken(
  token: string,
  pageId: string,
  secret: string,
  nowMs = Date.now()
): { email: string } | null {
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return null
  const expected = sign(payload, secret)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { p?: string; e?: string; x?: number }
    if (data.p !== pageId || typeof data.e !== 'string' || typeof data.x !== 'number') return null
    if (nowMs > data.x) return null
    return { email: data.e }
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/proposal/access.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/proposal/access.ts lib/proposal/access.test.ts
git commit -m "Proposal access control: allowlist matching and HMAC session tokens"
```

---

### Task 3: Notion data layer and Resend notification

**Files:**
- Create: `lib/proposal/notion.ts`
- Create: `lib/proposal/notify.ts`

**Interfaces:**
- Consumes: `parseSections`, `parseAllowedEmails` (Tasks 1–2); types from Task 1.
- Produces (used by Tasks 5, 6):
  - `findProposalBySlug(slug: string): Promise<ProposalMeta | null>`
  - `fetchProposalSections(pageId: string): Promise<Section[]>`
  - `markViewed(pageId: string): Promise<void>`
  - `recordApproval(pageId: string, email: string, summaryLabel: string): Promise<void>`
  - `notifyApproval(input: { client: string; title: string; number: string; approvedBy: string; summaryLabel: string; pageId: string }): Promise<void>`

No unit tests — this module is a thin API adapter (questionnaire convention: `lib/questionnaire/notion.ts` is untested; logic lives in the tested pure modules). Verified by type-check here and end-to-end in Task 8.

- [ ] **Step 1: Write `lib/proposal/notion.ts`**

```ts
import { Client } from '@notionhq/client'
import { parseAllowedEmails } from './access'
import { parseSections } from './parse'
import type { NotionBlock, ProposalMeta, ProposalStatus, Section } from './types'

const notion = () => new Client({ auth: process.env.NOTION_API_KEY })

/** dbId -> dataSourceId, cached 60s (mirrors lib/questionnaire/notion.ts). */
let dsCache: { at: number; id: string } | null = null

async function getDataSourceId(): Promise<string> {
  if (dsCache && Date.now() - dsCache.at < 60_000) return dsCache.id
  const dbId = process.env.NOTION_PROPOSALS_DB_ID
  if (!dbId) throw new Error('Missing NOTION_PROPOSALS_DB_ID')
  const db = await notion().databases.retrieve({ database_id: dbId })
  const id = (db as { data_sources?: Array<{ id: string }> }).data_sources?.[0]?.id
  if (!id) throw new Error(`No data source found for database ${dbId}`)
  dsCache = { at: Date.now(), id }
  return id
}

type RawProps = Record<string, any>
const text = (p: RawProps, name: string): string =>
  (p[name]?.rich_text ?? p[name]?.title ?? []).map((t: { plain_text: string }) => t.plain_text).join('')
const date = (p: RawProps, name: string): string | null => p[name]?.date?.start ?? null

export async function findProposalBySlug(slug: string): Promise<ProposalMeta | null> {
  const res = await notion().dataSources.query({
    data_source_id: await getDataSourceId(),
    filter: { property: 'Slug', type: 'rich_text', rich_text: { equals: slug } } as any,
    page_size: 1,
  })
  const page = res.results[0]
  if (!page || page.object !== 'page') return null
  const p = (page as any).properties as RawProps
  return {
    pageId: page.id,
    slug,
    title: text(p, 'Name'),
    number: text(p, 'Number'),
    client: text(p, 'Client'),
    date: date(p, 'Date') ?? '',
    version: text(p, 'Version'),
    requestedBy: text(p, 'Requested by'),
    allowedEmails: parseAllowedEmails(text(p, 'Allowed emails')),
    status: (p['Status']?.select?.name ?? 'Draft') as ProposalStatus,
    approvedBy: text(p, 'Approved by') || null,
    approvedAt: date(p, 'Approved at'),
    approvedMilestones: text(p, 'Approved milestones') || null,
  }
}

/** Fetch all top-level blocks (paginated); expand table blocks into row cells. */
export async function fetchProposalSections(pageId: string): Promise<Section[]> {
  const blocks: NotionBlock[] = []
  let cursor: string | undefined
  do {
    const res = await notion().blocks.children.list({ block_id: pageId, start_cursor: cursor, page_size: 100 })
    for (const raw of res.results as any[]) {
      const type = raw.type as string
      if (type === 'table') {
        const rows: string[][] = []
        let rowCursor: string | undefined
        do {
          const rowRes = await notion().blocks.children.list({ block_id: raw.id, start_cursor: rowCursor, page_size: 100 })
          for (const rowRaw of rowRes.results as any[]) {
            if (rowRaw.type !== 'table_row') continue
            rows.push(
              rowRaw.table_row.cells.map((cell: Array<{ plain_text: string }>) =>
                cell.map((t) => t.plain_text).join('')
              )
            )
          }
          rowCursor = rowRes.has_more ? (rowRes.next_cursor ?? undefined) : undefined
        } while (rowCursor)
        blocks.push({ type, rows })
      } else {
        const rich = raw[type]?.rich_text as Array<{ plain_text: string }> | undefined
        blocks.push({ type, text: rich?.map((t) => t.plain_text).join('') })
      }
    }
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined
  } while (cursor)
  return parseSections(blocks)
}

export async function markViewed(pageId: string): Promise<void> {
  await notion().pages.update({
    page_id: pageId,
    properties: {
      Status: { select: { name: 'Viewed' } },
      'First viewed': { date: { start: new Date().toISOString() } },
    },
  })
}

export async function recordApproval(pageId: string, email: string, summaryLabel: string): Promise<void> {
  await notion().pages.update({
    page_id: pageId,
    properties: {
      Status: { select: { name: 'Approved' } },
      'Approved by': { rich_text: [{ text: { content: email } }] },
      'Approved at': { date: { start: new Date().toISOString() } },
      'Approved milestones': { rich_text: [{ text: { content: summaryLabel } }] },
    },
  })
}
```

- [ ] **Step 2: Write `lib/proposal/notify.ts`**

```ts
/**
 * Internal approval notification via Resend. Best-effort: failures are logged,
 * never thrown — Notion is the source of truth for approvals.
 */
export async function notifyApproval(input: {
  client: string
  title: string
  number: string
  approvedBy: string
  summaryLabel: string
  pageId: string
}): Promise<void> {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.error('[proposal/notify] RESEND_API_KEY not set — skipping email')
    return
  }
  const notionUrl = `https://notion.so/${input.pageId.replace(/-/g, '')}`
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.PROPOSAL_NOTIFY_FROM ?? 'Proposals <onboarding@resend.dev>',
        to: ['hey@joelcolombo.co'],
        subject: `Proposal approved ✦ ${input.client} — ${input.title}`,
        text: [
          `${input.number} — ${input.title}`,
          `Client: ${input.client}`,
          `Approved by: ${input.approvedBy}`,
          `Selection: ${input.summaryLabel}`,
          '',
          `Notion: ${notionUrl}`,
          '',
          'Next step: print the proposal page to PDF and send it via DocuSign.',
        ].join('\n'),
      }),
    })
    if (!res.ok) console.error('[proposal/notify] Resend responded', res.status, await res.text())
  } catch (err) {
    console.error('[proposal/notify]', err)
  }
}
```

- [ ] **Step 3: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no new errors (pre-existing warnings unrelated to `lib/proposal/` are fine).

- [ ] **Step 4: Commit**

```bash
git add lib/proposal/notion.ts lib/proposal/notify.ts
git commit -m "Proposal Notion data layer and Resend approval notification"
```

---

### Task 4: Setup script and env plumbing

**Files:**
- Create: `scripts/proposals-setup.ts`
- Modify: `package.json` (add script `"proposals:setup": "tsx scripts/proposals-setup.ts"`)

**Interfaces:**
- Consumes: nothing from other tasks (standalone script, mirrors `scripts/questionnaire-setup.ts`).
- Produces: the Notion "Proposals" database; prints `NOTION_PROPOSALS_DB_ID` for `.env.local` and Vercel.

- [ ] **Step 1: Write `scripts/proposals-setup.ts`**

```ts
import { config as loadEnv } from 'dotenv'
loadEnv({ path: '.env.local' })

import { Client } from '@notionhq/client'
import type { CreateDataSourceParameters } from '@notionhq/client'

type PropertyConfig = CreateDataSourceParameters['properties'][string]

/**
 * One-time creation of the Proposals database. Idempotence is manual: if you
 * already have NOTION_PROPOSALS_DB_ID set, this script refuses to run.
 *
 * Authoring model (page body of each row):
 *   heading_1  → major sections (Confidentiality, Project Details, Project Agreement, Acceptance)
 *   heading_2  → subsections ("Pricing & Timelines" hosts the pricing table)
 *   heading_3, paragraphs, bullet/numbered lists, dividers
 *   table      → under the Pricing heading: columns Milestone | Price | Timeline
 */
async function main() {
  if (!process.env.NOTION_API_KEY) {
    console.error('Missing NOTION_API_KEY in .env.local')
    process.exit(1)
  }
  if (process.env.NOTION_PROPOSALS_DB_ID) {
    console.error('NOTION_PROPOSALS_DB_ID is already set — the Proposals database exists. Nothing to do.')
    process.exit(1)
  }
  const parentId = process.env.NOTION_PROPOSALS_PARENT_PAGE_ID
  if (!parentId) {
    console.error('Missing NOTION_PROPOSALS_PARENT_PAGE_ID in .env.local (page the integration can access)')
    process.exit(1)
  }

  const properties: Record<string, PropertyConfig> = {
    Name: { title: {} },
    Number: { rich_text: {} },
    Client: { rich_text: {} },
    Slug: { rich_text: {} },
    Date: { date: {} },
    Version: { rich_text: {} },
    'Requested by': { rich_text: {} },
    'Allowed emails': { rich_text: {} },
    Status: {
      select: {
        options: [
          { name: 'Draft', color: 'gray' },
          { name: 'Sent', color: 'blue' },
          { name: 'Viewed', color: 'yellow' },
          { name: 'Approved', color: 'green' },
        ],
      },
    },
    'First viewed': { date: {} },
    'Approved by': { rich_text: {} },
    'Approved at': { date: {} },
    'Approved milestones': { rich_text: {} },
  }

  const notion = new Client({ auth: process.env.NOTION_API_KEY })
  const db = await notion.databases.create({
    parent: { type: 'page_id', page_id: parentId },
    title: [{ text: { content: 'Proposals' } }],
    initial_data_source: { properties },
  })

  console.log('\nProposals database created.')
  console.log('\nAdd to .env.local and to Vercel env vars:\n')
  console.log(`  NOTION_PROPOSALS_DB_ID=${db.id}\n`)
  console.log('Also set (if not yet): RESEND_API_KEY, PROPOSAL_SESSION_SECRET (any long random string).')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

- [ ] **Step 2: Add the npm script**

In `package.json` scripts, after `"questionnaire:synthesize"`, add:

```json
"proposals:setup": "tsx scripts/proposals-setup.ts"
```

- [ ] **Step 3: Verify it fails safely without env, and type-checks**

Run: `npx tsc --noEmit && NOTION_API_KEY= npm run proposals:setup`
Expected: type-check clean; script exits 1 with `Missing NOTION_API_KEY` (loadEnv may repopulate it — if it instead complains about `NOTION_PROPOSALS_PARENT_PAGE_ID` or refuses because the DB exists, that is also a safe exit; the point is: no crash, clear message).

- [ ] **Step 4: Commit**

```bash
git add scripts/proposals-setup.ts package.json
git commit -m "Proposals database setup script"
```

---

### Task 5: API routes — verify (email gate) and approve

**Files:**
- Create: `app/api/proposal/verify/route.ts`
- Create: `app/api/proposal/approve/route.ts`

**Interfaces:**
- Consumes: `findProposalBySlug`, `fetchProposalSections`, `markViewed`, `recordApproval`, `notifyApproval` (Task 3); `isEmailAllowed`, `createSessionToken`, `verifySessionToken`, `SESSION_COOKIE`, `SESSION_TTL_MS` (Task 2); `computeApprovalSummary` (Task 1).
- Produces (used by Tasks 6, 7):
  - `POST /api/proposal/verify` body `{ slug, email, website? }` → 200 `{ ok: true }` + cookie; 403 `{ error: 'not allowed' }`; 404; 400; 502.
  - `POST /api/proposal/approve` body `{ slug, selected: string[] }` → 200 `{ ok: true, approvedBy, approvedAt, summaryLabel, alreadyApproved: boolean }`; 401 (no/invalid session); 400 (bad selection); 404; 502.

- [ ] **Step 1: Write `app/api/proposal/verify/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { createSessionToken, isEmailAllowed, SESSION_COOKIE, SESSION_TTL_MS } from '@/lib/proposal/access'
import { findProposalBySlug, markViewed } from '@/lib/proposal/notion'

export async function POST(req: Request) {
  let body: { slug?: string; email?: string; website?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }
  const { slug, email, website } = body

  // Honeypot: pretend success, set nothing.
  if (website) return NextResponse.json({ ok: true })

  if (!slug || !email?.includes('@')) return NextResponse.json({ error: 'bad request' }, { status: 400 })
  const secret = process.env.PROPOSAL_SESSION_SECRET
  if (!secret) {
    console.error('[proposal/verify] Missing PROPOSAL_SESSION_SECRET')
    return NextResponse.json({ error: 'unavailable' }, { status: 502 })
  }

  try {
    const meta = await findProposalBySlug(slug)
    if (!meta || meta.status === 'Draft') return NextResponse.json({ error: 'not found' }, { status: 404 })
    if (!isEmailAllowed(email, meta.allowedEmails)) {
      return NextResponse.json({ error: 'not allowed' }, { status: 403 })
    }
    if (meta.status === 'Sent') {
      // First verified access: Sent → Viewed. Best-effort; never blocks entry.
      markViewed(meta.pageId).catch((err) => console.error('[proposal/verify] markViewed', err))
    }
    const res = NextResponse.json({ ok: true })
    res.cookies.set(SESSION_COOKIE, createSessionToken(meta.pageId, email, secret), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_TTL_MS / 1000,
    })
    return res
  } catch (err) {
    console.error('[proposal/verify]', err)
    return NextResponse.json({ error: 'notion unavailable' }, { status: 502 })
  }
}
```

- [ ] **Step 2: Write `app/api/proposal/approve/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/proposal/access'
import { computeApprovalSummary } from '@/lib/proposal/parse'
import { fetchProposalSections, findProposalBySlug, recordApproval } from '@/lib/proposal/notion'
import { notifyApproval } from '@/lib/proposal/notify'

export async function POST(req: Request) {
  let body: { slug?: string; selected?: string[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }
  const { slug, selected } = body
  if (!slug || !Array.isArray(selected)) return NextResponse.json({ error: 'bad request' }, { status: 400 })
  const secret = process.env.PROPOSAL_SESSION_SECRET
  if (!secret) return NextResponse.json({ error: 'unavailable' }, { status: 502 })

  try {
    const meta = await findProposalBySlug(slug)
    if (!meta || meta.status === 'Draft') return NextResponse.json({ error: 'not found' }, { status: 404 })

    const cookie = req.headers.get('cookie') ?? ''
    const token = cookie.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`))?.[1]
    const session = token ? verifySessionToken(decodeURIComponent(token), meta.pageId, secret) : null
    if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    // Idempotent: first approval wins; repeats return the existing record.
    if (meta.status === 'Approved') {
      return NextResponse.json({
        ok: true,
        alreadyApproved: true,
        approvedBy: meta.approvedBy,
        approvedAt: meta.approvedAt,
        summaryLabel: meta.approvedMilestones,
      })
    }

    // Recompute server-side from the live pricing table — never trust client totals.
    const sections = await fetchProposalSections(meta.pageId)
    const pricing = sections.flatMap((s) => s.blocks).find((b) => b.kind === 'pricing')
    if (!pricing || pricing.kind !== 'pricing') return NextResponse.json({ error: 'no pricing' }, { status: 400 })
    const summary = computeApprovalSummary(pricing.pricing, selected)
    if (!summary) return NextResponse.json({ error: 'empty selection' }, { status: 400 })

    await recordApproval(meta.pageId, session.email, summary.label)
    await notifyApproval({
      client: meta.client,
      title: meta.title,
      number: meta.number,
      approvedBy: session.email,
      summaryLabel: summary.label,
      pageId: meta.pageId,
    })
    return NextResponse.json({
      ok: true,
      alreadyApproved: false,
      approvedBy: session.email,
      approvedAt: new Date().toISOString(),
      summaryLabel: summary.label,
    })
  } catch (err) {
    console.error('[proposal/approve]', err)
    return NextResponse.json({ error: 'notion unavailable' }, { status: 502 })
  }
}
```

- [ ] **Step 3: Type-check and run all proposal tests**

Run: `npx tsc --noEmit && npx vitest run lib/proposal`
Expected: clean type-check; all tests pass.

- [ ] **Step 4: Commit**

```bash
git add app/api/proposal
git commit -m "Proposal API routes: email gate and idempotent approve"
```

---

### Task 6: Page route, email gate, and document rendering

**Files:**
- Create: `app/proposal/[slug]/page.tsx`
- Create: `app/proposal/_components/EmailGate.tsx`
- Create: `app/proposal/_components/ProposalApp.tsx`
- Create: `app/proposal/_components/SectionRenderer.tsx`
- Create: `app/proposal/_components/SignatureBlocks.tsx`

**Interfaces:**
- Consumes: Task 1 types + `toPublicMeta`; Task 2 `SESSION_COOKIE`, `verifySessionToken`; Task 3 `findProposalBySlug`, `fetchProposalSections`; Task 5 `POST /api/proposal/verify`.
- Produces (used by Task 7): `ProposalApp` client component with props `{ meta: ProposalPublicMeta; sections: Section[] }`; `SectionRenderer` with props `{ section: Section; pricingSlot?: (pricing: PricingTable) => ReactNode }`. Task 7 fills the pricing slot and approve UI inside `ProposalApp` — in this task, pricing renders as a static (non-interactive) table via the same slot mechanism.

- [ ] **Step 1: Write `app/proposal/[slug]/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/proposal/access'
import { fetchProposalSections, findProposalBySlug } from '@/lib/proposal/notion'
import { toPublicMeta } from '@/lib/proposal/parse'
import EmailGate from '../_components/EmailGate'
import ProposalApp from '../_components/ProposalApp'

export const dynamic = 'force-dynamic'

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  try {
    const meta = await findProposalBySlug(slug)
    if (!meta || meta.status === 'Draft') return { robots: { index: false, follow: false } }
    return { title: `Services Proposal ✦ ${meta.client}`, robots: { index: false, follow: false } }
  } catch {
    return { robots: { index: false, follow: false } }
  }
}

export default async function ProposalPage({ params }: { params: Params }) {
  const { slug } = await params
  let meta
  try {
    meta = await findProposalBySlug(slug)
  } catch (err) {
    console.error('[proposal/page]', err)
    return (
      <div className="max-w-3xl mx-auto px-6 min-h-dvh flex flex-col justify-center">
        <p className="text-[1.2em] text-[var(--hover-color)]">This proposal is temporarily unavailable. Please try again in a minute.</p>
      </div>
    )
  }
  if (!meta || meta.status === 'Draft') notFound()

  const secret = process.env.PROPOSAL_SESSION_SECRET
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  const session = secret && token ? verifySessionToken(token, meta.pageId, secret) : null
  if (!session) {
    return <EmailGate slug={slug} clientName={meta.client} number={meta.number} />
  }

  const sections = await fetchProposalSections(meta.pageId)
  return <ProposalApp meta={toPublicMeta(meta)} sections={sections} />
}
```

- [ ] **Step 2: Write `app/proposal/_components/EmailGate.tsx`**

Confidential content never reaches the browser here — only client name and number.

```tsx
'use client'

import { useState } from 'react'

export default function EmailGate({ slug, clientName, number }: { slug: string; clientName: string; number: string }) {
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const valid = email.includes('@')

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/proposal/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, email: email.trim(), website }),
      })
      if (res.ok) {
        window.location.reload()
        return
      }
      setError(
        res.status === 403
          ? "This email doesn't have access to this proposal."
          : 'Something went wrong. Please try again.'
      )
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setBusy(false)
  }

  return (
    <div className="max-w-3xl mx-auto px-6 min-h-dvh flex flex-col justify-center">
      <p className="text-[0.9em] text-[var(--hover-color)] mb-4">{number} · {clientName}</p>
      <h1 className="text-[3em] leading-[1.1] mb-6 max-md:text-[2em] text-balance">Services Proposal</h1>
      <p className="text-[1.2em] leading-[1.4] text-[var(--hover-color)] mb-10">
        Enter your email to view this proposal.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (valid && !busy) void submit()
        }}
        className="flex flex-col gap-4 max-w-md"
      >
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email"
          autoComplete="email"
          className="bg-transparent border-b border-[var(--foreground)] py-3 text-[1.2em] outline-none placeholder:text-[var(--hover-color)]" />
        {/* Honeypot — invisible to humans */}
        <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} name="website"
          tabIndex={-1} autoComplete="off" aria-hidden="true"
          className="absolute -left-[9999px] h-0 w-0 overflow-hidden" />
        <button type="submit" disabled={!valid || busy}
          className="self-start mt-4 border border-[var(--foreground)] rounded-full px-8 py-3 text-[1.1em] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors disabled:opacity-30 disabled:pointer-events-none">
          {busy ? 'Checking…' : 'View proposal →'}
        </button>
        {error && <p className="text-[0.9em] text-[var(--hover-color)]">{error}</p>}
      </form>
    </div>
  )
}
```

- [ ] **Step 3: Write `app/proposal/_components/SectionRenderer.tsx`**

```tsx
import type { ReactNode } from 'react'
import type { PricingTable, Section } from '@/lib/proposal/types'

function PlainTable({ rows }: { rows: string[][] }) {
  if (rows.length === 0) return null
  return (
    <div className="overflow-x-auto my-6">
      <table className="w-full text-left text-[1em]">
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-[var(--hover-color)]/30">
              {row.map((cell, j) => (
                <td key={j} className="py-3 pr-6 align-top">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function SectionRenderer({
  section,
  pricingSlot,
}: {
  section: Section
  pricingSlot?: (pricing: PricingTable) => ReactNode
}) {
  return (
    <section className="proposal-section max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-[3em] leading-[1.1] mb-10 max-md:text-[2em] text-balance">{section.title}</h1>
      {section.blocks.map((block, i) => {
        switch (block.kind) {
          case 'h2':
            return <h2 key={i} className="text-[1.6em] leading-[1.2] mt-12 mb-4 text-[var(--hover-color)]">{block.text}</h2>
          case 'h3':
            return <h3 key={i} className="text-[1.15em] font-medium mt-8 mb-3">{block.text}</h3>
          case 'p':
            return <p key={i} className="text-[1.05em] leading-[1.6] mb-4">{block.text}</p>
          case 'bullets':
            return (
              <ul key={i} className="list-none mb-4 flex flex-col gap-2">
                {block.items.map((item, j) => (
                  <li key={j} className="text-[1.05em] leading-[1.6] pl-6 relative before:content-['–'] before:absolute before:left-0 before:text-[var(--hover-color)]">{item}</li>
                ))}
              </ul>
            )
          case 'numbered':
            return (
              <ol key={i} className="list-decimal list-inside mb-4 flex flex-col gap-2">
                {block.items.map((item, j) => (
                  <li key={j} className="text-[1.05em] leading-[1.6]">{item}</li>
                ))}
              </ol>
            )
          case 'divider':
            return <hr key={i} className="border-[var(--hover-color)]/30 my-10" />
          case 'table':
            return <PlainTable key={i} rows={block.rows} />
          case 'pricing':
            return (
              <div key={i}>
                {pricingSlot
                  ? pricingSlot(block.pricing)
                  : <PlainTable rows={block.pricing.milestones.map((m) => [m.name, m.priceLabel, m.timeline])} />}
              </div>
            )
        }
      })}
    </section>
  )
}
```

- [ ] **Step 4: Write `app/proposal/_components/SignatureBlocks.tsx`**

The Acceptance signature grid from the PDFs — always rendered at the end of the document (Notion body supplies the Acceptance heading and intro sentence).

```tsx
function SignatureRow({ party }: { party: string }) {
  return (
    <div className="mb-12">
      <p className="font-medium mb-8">{party}</p>
      <div className="flex gap-8 max-md:flex-col text-[0.95em] text-[var(--hover-color)]">
        <span className="flex-[2] border-b border-[var(--hover-color)] pb-1">Signature</span>
        <span className="flex-[2] border-b border-[var(--hover-color)] pb-1">Name</span>
        <span className="flex-1 border-b border-[var(--hover-color)] pb-1">Date</span>
      </div>
    </div>
  )
}

export default function SignatureBlocks({ clientName }: { clientName: string }) {
  return (
    <div className="proposal-section max-w-3xl mx-auto px-6 pb-24">
      <SignatureRow party="Joel Colombo" />
      <SignatureRow party={clientName} />
    </div>
  )
}
```

- [ ] **Step 5: Write `app/proposal/_components/ProposalApp.tsx`**

Client shell. In this task pricing renders static (no `pricingSlot`); Task 7 adds interactivity.

```tsx
'use client'

import type { ProposalPublicMeta, Section } from '@/lib/proposal/types'
import SectionRenderer from './SectionRenderer'
import SignatureBlocks from './SignatureBlocks'

export function formatDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function ProposalApp({ meta, sections }: { meta: ProposalPublicMeta; sections: Section[] }) {
  return (
    <main>
      {/* Cover — always black, both themes */}
      <div className="proposal-cover bg-black text-white min-h-dvh flex flex-col justify-between px-6 py-16 md:px-16">
        <h1 className="text-[4em] leading-[1.1] max-md:text-[2.4em] max-w-4xl mt-24 text-balance">
          Services Proposal for {meta.client}
        </h1>
        <p className="text-[1.1em]">Joel Colombo ✦ Creative Director &amp; Design Consultant</p>
      </div>

      {/* Title block */}
      <div className="proposal-section max-w-3xl mx-auto px-6 py-24">
        <h1 className="text-[3em] leading-[1.1] mb-4 max-md:text-[2em]">Services Proposal</h1>
        <p className="text-[1.2em] mb-2">{meta.title}</p>
        <p className="text-[1.2em] text-[var(--hover-color)] mb-16">{meta.number}</p>
        <div className="text-[0.95em] text-[var(--hover-color)] flex flex-col gap-1">
          {meta.requestedBy && <p>Requested by: {meta.requestedBy}</p>}
          {meta.date && <p>Date: {formatDate(meta.date)}</p>}
          {meta.version && <p>Version: {meta.version}</p>}
        </div>
      </div>

      {sections.map((section) => (
        <SectionRenderer key={section.title} section={section} />
      ))}

      <SignatureBlocks clientName={meta.client} />
    </main>
  )
}
```

- [ ] **Step 6: Type-check, lint, and verify in the browser**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean.

Manual check (needs `NOTION_PROPOSALS_DB_ID` + a `Sent` test row; if not yet available, defer the visual pass to Task 8 and only verify the 404 path): `npm run dev`, open `/proposal/nonexistent` → site 404; open a real slug → email gate; wrong email → neutral message; allowed email → document renders.

- [ ] **Step 7: Commit**

```bash
git add app/proposal
git commit -m "Proposal page: gated server rendering with Notion-backed document"
```

---

### Task 7: Pricing interactivity and approve flow

**Files:**
- Modify: `app/proposal/_components/ProposalApp.tsx` (add state + pricing slot + approve UI)
- Create: `app/proposal/_components/PricingSection.tsx`
- Create: `app/proposal/_components/ApproveBar.tsx`

**Interfaces:**
- Consumes: `POST /api/proposal/approve` (Task 5); `computeApprovalSummary` (Task 1); `SectionRenderer`'s `pricingSlot` (Task 6); `ProposalPublicMeta.status/approvedBy/approvedAt/approvedMilestones`.
- Produces: complete approve UX (select milestones → confirm → approved state; frozen state on revisit).

- [ ] **Step 1: Write `app/proposal/_components/PricingSection.tsx`**

```tsx
'use client'

import type { PricingTable } from '@/lib/proposal/types'

export default function PricingSection({
  pricing,
  selected,
  locked,
  onToggle,
}: {
  pricing: PricingTable
  selected: Set<string>
  locked: boolean
  onToggle: (name: string) => void
}) {
  return (
    <div className="my-6 flex flex-col">
      {pricing.milestones.map((m) => {
        const checked = selected.has(m.name)
        return (
          <label
            key={m.name}
            className={`flex items-baseline gap-4 py-4 border-b border-[var(--hover-color)]/30 ${locked ? '' : 'cursor-pointer'}`}
          >
            <input
              type="checkbox"
              checked={checked}
              disabled={locked}
              onChange={() => onToggle(m.name)}
              className="accent-[var(--foreground)] w-4 h-4 translate-y-[2px]"
            />
            <span className={`flex-1 text-[1.05em] transition-opacity ${checked ? '' : 'opacity-40'}`}>{m.name}</span>
            <span className={`text-[1.05em] transition-opacity ${checked ? '' : 'opacity-40'}`}>{m.priceLabel}</span>
            <span className={`text-[0.95em] text-[var(--hover-color)] w-24 text-right max-md:hidden transition-opacity ${checked ? '' : 'opacity-40'}`}>{m.timeline}</span>
          </label>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Write `app/proposal/_components/ApproveBar.tsx`**

Fixed bottom bar + inline confirm step (no separate modal component: the bar swaps to its confirm state, questionnaire-style minimalism). Includes error + retry.

```tsx
'use client'

import { useState } from 'react'

export default function ApproveBar({
  totalLabel,
  selectionLabel,
  disabled,
  onApprove,
}: {
  totalLabel: string
  selectionLabel: string
  disabled: boolean
  onApprove: () => Promise<string | null> // resolves error message or null on success
}) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confirm = async () => {
    setBusy(true)
    setError(null)
    const err = await onApprove()
    setBusy(false)
    if (err) setError(err)
  }

  return (
    <div className="proposal-approve-bar fixed bottom-0 inset-x-0 bg-[var(--background)] border-t border-[var(--hover-color)]/30 px-6 py-4">
      <div className="max-w-3xl mx-auto flex items-center gap-6 max-md:flex-col max-md:items-start max-md:gap-3">
        {confirming ? (
          <>
            <p className="flex-1 text-[1.05em] text-balance">
              You&rsquo;re approving {selectionLabel} — {totalLabel}.
            </p>
            <div className="flex items-center gap-3">
              <button onClick={() => { setConfirming(false); setError(null) }} disabled={busy}
                className="px-6 py-3 text-[1em] text-[var(--hover-color)] hover:text-[var(--foreground)] transition-colors">
                Back
              </button>
              <button onClick={() => void confirm()} disabled={busy}
                className="border border-[var(--foreground)] rounded-full px-8 py-3 text-[1em] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors disabled:opacity-30">
                {busy ? 'Approving…' : error ? 'Retry' : 'Confirm approval'}
              </button>
            </div>
            {error && <p className="text-[0.9em] text-[var(--hover-color)] max-md:order-last">{error}</p>}
          </>
        ) : (
          <>
            <p className="flex-1 text-[1.05em]">
              Total: <span className="font-medium">{totalLabel}</span>
            </p>
            <button onClick={() => setConfirming(true)} disabled={disabled}
              className="border border-[var(--foreground)] rounded-full px-8 py-3 text-[1em] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors disabled:opacity-30 disabled:pointer-events-none">
              Approve →
            </button>
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Rewrite `app/proposal/_components/ProposalApp.tsx` with approval state**

Replace the whole file:

```tsx
'use client'

import { useMemo, useState } from 'react'
import { computeApprovalSummary } from '@/lib/proposal/parse'
import type { PricingTable, ProposalPublicMeta, Section } from '@/lib/proposal/types'
import ApproveBar from './ApproveBar'
import PricingSection from './PricingSection'
import SectionRenderer from './SectionRenderer'
import SignatureBlocks from './SignatureBlocks'

export function formatDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

type Approval = { approvedBy: string; approvedAt: string; summaryLabel: string }

/** Recover the approved milestone names from the stored summary label ("A + B — USD $7,500"). */
export function namesFromSummaryLabel(label: string): string[] {
  return (label.split(' — ')[0] ?? '').split(' + ').map((s) => s.trim()).filter(Boolean)
}

export default function ProposalApp({ meta, sections }: { meta: ProposalPublicMeta; sections: Section[] }) {
  const pricing: PricingTable | null = useMemo(() => {
    const block = sections.flatMap((s) => s.blocks).find((b) => b.kind === 'pricing')
    return block?.kind === 'pricing' ? block.pricing : null
  }, [sections])

  const [approval, setApproval] = useState<Approval | null>(
    meta.status === 'Approved' && meta.approvedBy && meta.approvedAt && meta.approvedMilestones
      ? { approvedBy: meta.approvedBy, approvedAt: meta.approvedAt, summaryLabel: meta.approvedMilestones }
      : null
  )
  const [selected, setSelected] = useState<Set<string>>(() => {
    if (approval) return new Set(namesFromSummaryLabel(approval.summaryLabel))
    return new Set(pricing?.milestones.map((m) => m.name) ?? []) // all preselected
  })

  const summary = pricing ? computeApprovalSummary(pricing, [...selected]) : null

  const approve = async (): Promise<string | null> => {
    try {
      const res = await fetch('/api/proposal/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: meta.slug, selected: [...selected] }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) return 'Could not save your approval. Please try again.'
      setApproval({ approvedBy: data.approvedBy, approvedAt: data.approvedAt, summaryLabel: data.summaryLabel })
      if (data.alreadyApproved) setSelected(new Set(namesFromSummaryLabel(data.summaryLabel ?? '')))
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return null
    } catch {
      return 'Could not save your approval. Please try again.'
    }
  }

  return (
    <main className={approval ? '' : 'pb-28'}>
      {approval && (
        <div className="max-w-3xl mx-auto px-6 pt-10">
          <div className="border border-[var(--foreground)] rounded-2xl px-6 py-5 text-[1.05em] leading-[1.5]">
            <p className="font-medium mb-1">Proposal approved ✦</p>
            <p className="text-[var(--hover-color)]">
              {approval.summaryLabel} — approved by {approval.approvedBy} on {formatDate(approval.approvedAt)}.
              You&rsquo;ll receive the document via DocuSign shortly.
            </p>
          </div>
        </div>
      )}

      {/* Cover — always black, both themes */}
      <div className="proposal-cover bg-black text-white min-h-dvh flex flex-col justify-between px-6 py-16 md:px-16">
        <h1 className="text-[4em] leading-[1.1] max-md:text-[2.4em] max-w-4xl mt-24 text-balance">
          Services Proposal for {meta.client}
        </h1>
        <p className="text-[1.1em]">Joel Colombo ✦ Creative Director &amp; Design Consultant</p>
      </div>

      {/* Title block */}
      <div className="proposal-section max-w-3xl mx-auto px-6 py-24">
        <h1 className="text-[3em] leading-[1.1] mb-4 max-md:text-[2em]">Services Proposal</h1>
        <p className="text-[1.2em] mb-2">{meta.title}</p>
        <p className="text-[1.2em] text-[var(--hover-color)] mb-16">{meta.number}</p>
        <div className="text-[0.95em] text-[var(--hover-color)] flex flex-col gap-1">
          {meta.requestedBy && <p>Requested by: {meta.requestedBy}</p>}
          {meta.date && <p>Date: {formatDate(meta.date)}</p>}
          {meta.version && <p>Version: {meta.version}</p>}
        </div>
      </div>

      {sections.map((section) => (
        <SectionRenderer
          key={section.title}
          section={section}
          pricingSlot={(p) => (
            <PricingSection
              pricing={p}
              selected={selected}
              locked={approval !== null}
              onToggle={(name) =>
                setSelected((prev) => {
                  const next = new Set(prev)
                  if (next.has(name)) next.delete(name)
                  else next.add(name)
                  return next
                })
              }
            />
          )}
        />
      ))}

      <SignatureBlocks clientName={meta.client} />

      {!approval && pricing && (
        <ApproveBar
          totalLabel={summary ? summary.label.split(' — ')[1] : '—'}
          selectionLabel={summary ? summary.names.join(' + ') : ''}
          disabled={!summary}
          onApprove={approve}
        />
      )}
    </main>
  )
}
```

- [ ] **Step 4: Write the failing test for `namesFromSummaryLabel`**

Add to `lib/proposal/parse.test.ts` — move the function there first? No: keep UI helpers near UI, but this one is pure and round-trips with `computeApprovalSummary`, so it belongs in `lib/proposal/parse.ts`. Move it: export `namesFromSummaryLabel` from `lib/proposal/parse.ts`, import it in `ProposalApp.tsx` (delete the local copy), and add this test to `lib/proposal/parse.test.ts`:

```ts
describe('namesFromSummaryLabel', () => {
  it('round-trips with computeApprovalSummary labels', () => {
    const pricing: PricingTable = {
      milestones: [
        { name: 'Visual Assets', amount: 1500, priceLabel: 'USD $1,500', timeline: '1 week' },
        { name: 'Website Redesign', amount: 6000, priceLabel: 'USD $6,000', timeline: '6-7 weeks' },
      ],
    }
    const s = computeApprovalSummary(pricing, ['Visual Assets', 'Website Redesign'])
    expect(namesFromSummaryLabel(s!.label)).toEqual(['Visual Assets', 'Website Redesign'])
  })
  it('returns empty for empty/garbage labels', () => {
    expect(namesFromSummaryLabel('')).toEqual([])
  })
})
```

The implementation in `lib/proposal/parse.ts`:

```ts
/** Recover approved milestone names from a stored summary label ("A + B — USD $7,500"). */
export function namesFromSummaryLabel(label: string): string[] {
  return (label.split(' — ')[0] ?? '').split(' + ').map((s) => s.trim()).filter(Boolean)
}
```

- [ ] **Step 5: Run tests, type-check, lint**

Run: `npx vitest run lib/proposal && npx tsc --noEmit && npm run lint`
Expected: all pass, clean.

- [ ] **Step 6: Manual browser check**

With a `Sent` test proposal (if the DB exists; else defer to Task 8): toggle milestones → total updates; zero selected → Approve disabled; Approve → confirm copy shows names + total; Confirm → approved banner, checkboxes locked; reload → still approved (server state); second browser/incognito with the other allowed email → sees frozen approved state.

- [ ] **Step 7: Commit**

```bash
git add app/proposal lib/proposal/parse.ts lib/proposal/parse.test.ts
git commit -m "Proposal approve flow: milestone selection, confirm, frozen approved state"
```

---

### Task 8: Print stylesheet, end-to-end pass, and ship

**Files:**
- Create: `app/proposal/proposal-print.css`
- Modify: `app/proposal/[slug]/page.tsx` (import the stylesheet)

**Interfaces:**
- Consumes: class hooks from Tasks 6–7: `.proposal-cover`, `.proposal-section`, `.proposal-approve-bar`.
- Produces: Cmd+P → landscape PDF matching the current proposal PDFs; the verified feature on `main`.

- [ ] **Step 1: Write `app/proposal/proposal-print.css`**

```css
@media print {
  @page {
    size: A4 landscape;
    margin: 14mm 18mm;
  }

  body {
    background: #fff !important;
    color: #000 !important;
  }

  /* Chrome that must not print */
  .proposal-approve-bar,
  .theme-toggle,
  .custom-cursor {
    display: none !important;
  }

  /* Black cover page, like the PDFs */
  .proposal-cover {
    background: #000 !important;
    color: #fff !important;
    min-height: auto;
    height: 90vh;
    break-after: page;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* One section per page */
  .proposal-section {
    break-before: page;
    padding-top: 0;
    padding-bottom: 0;
  }
  .proposal-cover + .proposal-section {
    break-before: auto;
  }

  /* Keep checkbox marks visible in print */
  input[type='checkbox'] {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  a {
    text-decoration: none;
    color: inherit;
  }
}
```

- [ ] **Step 2: Import it in `app/proposal/[slug]/page.tsx`**

Add at the top of the file:

```ts
import '../proposal-print.css'
```

Check the class names against the real DOM: if the site's theme toggle / cursor use different class names than `.theme-toggle` / `.custom-cursor`, adjust the selectors to whatever `app/layout.tsx` actually renders (inspect and fix — do not leave dead selectors).

- [ ] **Step 3: One-time environment setup (with Joel)**

1. `.env.local`: add `NOTION_PROPOSALS_PARENT_PAGE_ID` (a page shared with the existing Notion integration), `PROPOSAL_SESSION_SECRET` (e.g. `openssl rand -hex 32`), `RESEND_API_KEY` (from resend.com — free tier; the default `onboarding@resend.dev` sender can email the account owner, which is all we need).
2. Run: `npm run proposals:setup` → add the printed `NOTION_PROPOSALS_DB_ID` to `.env.local`.
3. Create the test proposal in Notion: replicate `012-260306 Recoding America` — properties (Number `012-260306`, Client `Recoding America`, Slug `recoding-america-visual-assets`, Date, Version `1.1`, Requested by `Anne Healy`, Allowed emails with Joel's own email, Status `Sent`) and body (H1 Confidentiality → paragraph; H1 Project Details → H2s/H3s/paragraphs/bullets from the PDF; H1 Project Agreement → including H2 `Pricing & Timelines` with a 3-column table `Milestone | Price | Timeline` + two rows; H1 Acceptance → intro sentence).
4. Add the same env vars in Vercel (Production).

- [ ] **Step 4: Full end-to-end pass (manual, against the test proposal)**

- `/proposal/wrong-slug` → 404. Notion row set to `Draft` → 404. Back to `Sent`.
- Gate: unauthorized email → neutral message; authorized → document; Notion row now `Viewed` with `First viewed`.
- Document fidelity: compare side-by-side with the PDF — sections, headings, lists, pricing rows all present; cover black in both site themes.
- Approve: deselect one milestone → total drops; approve → confirm → banner; Notion row `Approved` with by/at/milestones; email arrives at hey@joelcolombo.co.
- Idempotence: approve again from a second session → returns the first approval unchanged, no second email.
- Print: Cmd+P on the approved page → landscape, cover page black, one section per page, approve bar absent, checked milestones visible. Save the PDF and eyeball it against `012-260306 … .pdf`.
- Mobile viewport: gate, document, pricing, and approve bar usable at 390px width.

Fix anything that fails; commit fixes individually with descriptive messages.

- [ ] **Step 5: Run the full test suite and build**

Run: `npm run test && npm run build`
Expected: all tests pass; production build succeeds.

- [ ] **Step 6: Commit and merge**

```bash
git add app/proposal
git commit -m "Proposal print stylesheet: landscape PDF matching the document format"
```

Then use superpowers:finishing-a-development-branch to merge `feature/proposals` into `main` (Vercel auto-deploys from git).

---

## Self-Review Notes

- **Spec coverage:** Notion DB + body authoring (T4, T3), slug lookup + 404 + Draft hidden (T3, T6), email gate + allowlist + honeypot + neutral rejection (T2, T5, T6), Viewed marking (T5), section rendering in site aesthetic (T6), pricing checkboxes + live total + all-preselected default (T7), confirm + approve + idempotence + Resend notification + inline retry (T5, T7), frozen approved state (T7), print stylesheet/PDF (T8), noindex (T6), env vars (T4, T8), tests for parser/allowlist/summary/session (T1, T2, T7), Notion-down states on page load and approve (T6, T5). Slug restructure freedom: identity is `pageId` throughout; slug only appears in lookup and cookie-free route params.
- **Type consistency:** `ProposalMeta`/`ProposalPublicMeta`/`Section`/`ContentBlock`/`PricingTable`/`Milestone` defined once in T1 and imported everywhere; `summaryLabel` is the canonical name across API responses and components; `SESSION_COOKIE` shared constant.
- **Known judgment calls:** single shared cookie (`proposal-session`) bound to one pageId — visiting a second proposal re-gates (acceptable; noted). Approved-milestone names recovered from the label via `namesFromSummaryLabel` (round-trip tested). Notify is fire-and-forget after `recordApproval` succeeds.
