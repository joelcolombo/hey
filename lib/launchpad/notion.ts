import { Client } from '@notionhq/client'
import { timingSafeEqual } from 'node:crypto'

/**
 * Notion-driven launchpad: accounts and items live in two databases under
 * the "Launchpad Hey!" page, so a new client is rows in Notion, not a deploy.
 *
 * "Launchpad Accounts": Name (title) · Slug · Access code · Allowed emails ·
 *   Project page (url) · Status (Active/Archived)
 * "Launchpad Items": Name (title, the label) · Account (slug) · Kind
 *   (Proposal/Questionnaire/Link/Document/Page) · Item slug · Target · Enabled (checkbox) ·
 *   Order (number) · State (optional label shown on the hub, e.g. "Completed")
 */

export type LaunchpadAccount = {
  name: string
  slug: string
  allowedEmails: string[]
  projectPage: string | null
}

export type LaunchpadItem = {
  label: string
  slug: string
  /** Document = a read-only Notion page (Target = page URL or id).
   *  Page = a bespoke React page from app/launchpad/_pages (Target = registry key). */
  kind: 'proposal' | 'questionnaire' | 'link' | 'document' | 'page'
  target: string
  enabled: boolean
  order: number
  /** Per-item permission list. Empty = every account member. */
  allowedEmails: string[]
  /** Optional hub label set in Notion (e.g. "Completed"); overrides the default. */
  state: string | null
}

/** Empty item allowlist means the whole account may access it. */
export function itemPermits(item: LaunchpadItem, email: string): boolean {
  if (item.allowedEmails.length === 0) return true
  return item.allowedEmails.includes(email.trim().toLowerCase())
}

const notion = () => new Client({ auth: process.env.NOTION_API_KEY })

const dsCache = new Map<string, { at: number; id: string }>()

async function getDataSourceId(envVar: 'NOTION_LAUNCHPAD_ACCOUNTS_DB_ID' | 'NOTION_LAUNCHPAD_ITEMS_DB_ID'): Promise<string> {
  const dbId = process.env[envVar]
  if (!dbId) throw new Error(`Missing ${envVar}`)
  const cached = dsCache.get(dbId)
  if (cached && Date.now() - cached.at < 60_000) return cached.id
  const db = await notion().databases.retrieve({ database_id: dbId })
  const id = (db as { data_sources?: Array<{ id: string }> }).data_sources?.[0]?.id
  if (!id) throw new Error(`No data source found for database ${dbId}`)
  dsCache.set(dbId, { at: Date.now(), id })
  return id
}

type RawProps = Record<string, any>
const text = (p: RawProps, name: string): string =>
  (p[name]?.rich_text ?? p[name]?.title ?? []).map((t: { plain_text: string }) => t.plain_text).join('')

const parseEmails = (raw: string): string[] =>
  raw.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)

function toAccount(page: any): LaunchpadAccount & { accessCode: string } {
  const p = page.properties as RawProps
  return {
    name: text(p, 'Name'),
    slug: text(p, 'Slug').trim(),
    accessCode: text(p, 'Access code').trim(),
    allowedEmails: parseEmails(text(p, 'Allowed emails')),
    projectPage: p['Project page']?.url ?? null,
  }
}

async function activeAccounts(): Promise<Array<LaunchpadAccount & { accessCode: string }>> {
  const res = await notion().dataSources.query({
    data_source_id: await getDataSourceId('NOTION_LAUNCHPAD_ACCOUNTS_DB_ID'),
    filter: { property: 'Status', type: 'select', select: { equals: 'Active' } } as any,
    page_size: 100,
  })
  return res.results.filter((r: any) => r.object === 'page').map(toAccount)
}

/** Login check: email must be on the account's list and the code must match. */
export async function verifyLogin(email: string, code: string): Promise<LaunchpadAccount | null> {
  const wanted = email.trim().toLowerCase()
  const codeBuf = Buffer.from(code.trim())
  for (const account of await activeAccounts()) {
    const accountCode = Buffer.from(account.accessCode)
    const codeMatches =
      accountCode.length === codeBuf.length && accountCode.length > 0 && timingSafeEqual(accountCode, codeBuf)
    if (codeMatches && account.allowedEmails.includes(wanted)) {
      const { accessCode: _accessCode, ...pub } = account
      return pub
    }
  }
  return null
}

export async function getAccount(slug: string): Promise<LaunchpadAccount | null> {
  const account = (await activeAccounts()).find((a) => a.slug === slug)
  if (!account) return null
  const { accessCode: _accessCode, ...pub } = account
  return pub
}

export async function getItems(accountSlug: string): Promise<LaunchpadItem[]> {
  const res = await notion().dataSources.query({
    data_source_id: await getDataSourceId('NOTION_LAUNCHPAD_ITEMS_DB_ID'),
    filter: { property: 'Account', type: 'rich_text', rich_text: { equals: accountSlug } } as any,
    page_size: 100,
  })
  const items: LaunchpadItem[] = []
  for (const page of res.results as any[]) {
    if (page.object !== 'page') continue
    const p = page.properties as RawProps
    const kind = (p['Kind']?.select?.name ?? '').toLowerCase()
    if (kind !== 'proposal' && kind !== 'questionnaire' && kind !== 'link' && kind !== 'document' && kind !== 'page') continue
    items.push({
      label: text(p, 'Name'),
      slug: text(p, 'Item slug').trim(),
      kind,
      target: text(p, 'Target').trim(),
      enabled: p['Enabled']?.checkbox ?? false,
      order: p['Order']?.number ?? 99,
      allowedEmails: parseEmails(text(p, 'Allowed emails')),
      state: text(p, 'State').trim() || null,
    })
  }
  return items.sort((a, b) => a.order - b.order)
}

export async function getItem(accountSlug: string, itemSlug: string): Promise<LaunchpadItem | null> {
  return (await getItems(accountSlug)).find((i) => i.slug === itemSlug) ?? null
}
