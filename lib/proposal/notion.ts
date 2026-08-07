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
