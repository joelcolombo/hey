import { Client } from '@notionhq/client'
import { unstable_cache } from 'next/cache'
import type { DocBlock, NotionDocument, Span } from './types'

/**
 * Generic Notion page → block tree, for Launchpad items of kind Document.
 * Supports the blocks a written document uses: headings (incl. toggle
 * headings), paragraphs, lists (nested), quotes, callouts, toggles, dividers,
 * tables, column lists, table of contents, images. Everything else with text
 * falls back to a paragraph; the rest is skipped.
 */

const notion = () => new Client({ auth: process.env.NOTION_API_KEY })

/** Accepts a Notion URL or a raw id (dashed or not). */
export function pageIdFromRef(ref: string): string | null {
  const m = ref.trim().match(/([0-9a-f]{32})(?:[^0-9a-f]|$)/i) ?? ref.trim().match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i)
  if (!m) return null
  const hex = m[1].replace(/-/g, '').toLowerCase()
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

type RawRich = Array<{
  plain_text: string
  href?: string | null
  annotations?: { bold?: boolean; italic?: boolean; code?: boolean; strikethrough?: boolean; underline?: boolean }
}>

const spans = (rich: RawRich | undefined): Span[] =>
  (rich ?? []).map((t) => ({
    text: t.plain_text,
    bold: t.annotations?.bold || undefined,
    italic: t.annotations?.italic || undefined,
    code: t.annotations?.code || undefined,
    strike: t.annotations?.strikethrough || undefined,
    underline: t.annotations?.underline || undefined,
    href: t.href ?? null,
  }))

async function listChildren(blockId: string): Promise<any[]> {
  const out: any[] = []
  let cursor: string | undefined
  do {
    const res = await notion().blocks.children.list({ block_id: blockId, start_cursor: cursor, page_size: 100 })
    out.push(...res.results)
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined
  } while (cursor)
  return out
}

/** Bounded concurrency so deep pages stay under Notion's ~3 req/s. */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

async function toBlocks(raws: any[]): Promise<DocBlock[]> {
  // Fetch children for every block that has them, in parallel (bounded).
  const childLists = await mapLimit(raws, 4, async (raw): Promise<DocBlock[] | undefined> => {
    if (!raw.has_children) return undefined
    if (raw.type === 'table') return undefined // rows handled below
    if (raw.type === 'column_list') return undefined // columns handled below
    return toBlocks(await listChildren(raw.id))
  })

  const blocks: DocBlock[] = []
  for (let i = 0; i < raws.length; i++) {
    const raw = raws[i]
    const type = raw.type as string
    const body = raw[type] ?? {}
    const children = childLists[i]
    const rich = spans(body.rich_text)

    switch (type) {
      case 'heading_1':
      case 'heading_2':
      case 'heading_3': {
        const kind = type === 'heading_1' ? 'h1' : type === 'heading_2' ? 'h2' : 'h3'
        blocks.push({ kind, id: raw.id, spans: rich, toggleable: !!body.is_toggleable, children })
        break
      }
      case 'paragraph':
        if (rich.some((s) => s.text.trim())) blocks.push({ kind: 'p', spans: rich })
        if (children) blocks.push(...children)
        break
      case 'bulleted_list_item':
      case 'numbered_list_item': {
        const kind = type === 'bulleted_list_item' ? 'bullets' : 'numbered'
        const last = blocks[blocks.length - 1]
        const item = { spans: rich, children }
        if (last && last.kind === kind) last.items.push(item)
        else blocks.push({ kind, items: [item] })
        break
      }
      case 'quote':
        blocks.push({ kind: 'quote', spans: rich, children })
        break
      case 'callout': {
        const icon = body.icon?.type === 'emoji' ? (body.icon.emoji as string) : null
        blocks.push({ kind: 'callout', icon, spans: rich, children })
        break
      }
      case 'toggle':
        blocks.push({ kind: 'toggle', spans: rich, children })
        break
      case 'divider':
        blocks.push({ kind: 'divider' })
        break
      case 'table_of_contents':
        blocks.push({ kind: 'toc' })
        break
      case 'table': {
        const rows = (await listChildren(raw.id))
          .filter((r) => r.type === 'table_row')
          .map((r) => (r.table_row.cells as RawRich[]).map((cell) => spans(cell)))
        blocks.push({ kind: 'table', headerRow: !!body.has_column_header, headerColumn: !!body.has_row_header, rows })
        break
      }
      case 'column_list': {
        const cols = (await listChildren(raw.id)).filter((c) => c.type === 'column')
        const columns = await mapLimit(cols, 3, async (c) => toBlocks(await listChildren(c.id)))
        blocks.push({ kind: 'columns', columns })
        break
      }
      case 'image': {
        const src = body.type === 'external' ? body.external?.url : body.file?.url
        if (src) blocks.push({ kind: 'image', src, caption: spans(body.caption) })
        break
      }
      default:
        if (rich.some((s) => s.text.trim())) blocks.push({ kind: 'p', spans: rich })
        if (children) blocks.push(...children)
    }
  }
  return blocks
}

async function loadDocument(pageId: string): Promise<NotionDocument> {
  const page = (await notion().pages.retrieve({ page_id: pageId })) as any
  const titleProp = Object.values(page.properties ?? {}).find((p: any) => p.type === 'title') as any
  const title = (titleProp?.title ?? []).map((t: { plain_text: string }) => t.plain_text).join('')
  const icon = page.icon?.type === 'emoji' ? (page.icon.emoji as string) : null
  const blocks = await toBlocks(await listChildren(pageId))
  return { pageId, title, icon, lastEdited: page.last_edited_time ?? '', blocks }
}

/**
 * A full document is dozens of Notion calls (every toggle, table and column
 * is its own request), so it goes through Next's data cache: fresh for two
 * minutes, then served stale while it revalidates in the background.
 */
export const fetchDocument = (pageId: string): Promise<NotionDocument> =>
  unstable_cache(() => loadDocument(pageId), ['launchpad-document', pageId], { revalidate: 120, tags: [`document:${pageId}`] })()
