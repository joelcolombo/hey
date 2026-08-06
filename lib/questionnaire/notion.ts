import { Client } from '@notionhq/client'
import { columnsForQuestion, formatAnswer, parseAnswer, QUESTION_KEY_RE, type NotionPropValue } from './notion-format'
import type { Answer, Answers, Question, Template } from './types'

const notion = () => new Client({ auth: process.env.NOTION_API_KEY })

/** Notion rich_text items cap at 2000 chars; chunk below that. */
const chunkRichText = (s: string) => {
  const out: { text: { content: string } }[] = []
  for (let i = 0; i < s.length; i += 1900) out.push({ text: { content: s.slice(i, i + 1900) } })
  return out.length ? out : [{ text: { content: '' } }]
}

/** question key -> actual property name, resolved by [key] prefix. Cached 60s per DB. */
const propertyMapCache = new Map<string, { at: number; map: Map<string, string> }>()

export async function getPropertyMap(dbId: string): Promise<Map<string, string>> {
  const cached = propertyMapCache.get(dbId)
  if (cached && Date.now() - cached.at < 60_000) return cached.map
  const db = await notion().databases.retrieve({ database_id: dbId })
  const map = new Map<string, string>()
  for (const name of Object.keys((db as unknown as { properties: Record<string, unknown> }).properties)) {
    const m = name.match(QUESTION_KEY_RE)
    if (m) map.set(m[1], name)
  }
  propertyMapCache.set(dbId, { at: Date.now(), map })
  return map
}

type RawProp =
  | { type: 'rich_text'; rich_text: { plain_text: string }[] }
  | { type: 'select'; select: { name: string } | null }
  | { type: 'multi_select'; multi_select: { name: string }[] }
  | { type: string }

function toPropValue(raw: RawProp | undefined): NotionPropValue | undefined {
  if (!raw) return undefined
  if (raw.type === 'rich_text' && 'rich_text' in raw)
    return { type: 'rich_text', text: raw.rich_text.map((t) => t.plain_text).join('') }
  if (raw.type === 'select' && 'select' in raw)
    return { type: 'select', name: raw.select?.name ?? null }
  if (raw.type === 'multi_select' && 'multi_select' in raw)
    return { type: 'multi_select', names: raw.multi_select.map((o) => o.name) }
  return undefined
}

export async function findRow(dbId: string, email: string, template: Template) {
  const client = notion()
  const res = await client.request<{ results: Array<{ id: string; properties: Record<string, RawProp> }> }>({
    path: `/databases/${dbId}/query`,
    method: 'post',
    body: {
      filter: { property: 'Email', email: { equals: email.trim().toLowerCase() } },
      page_size: 1,
    },
  })
  const page = res.results[0]
  if (!page) return null

  const names = await getPropertyMap(dbId)
  const answers: Answers = {}
  for (const section of template.sections) {
    for (const q of section.questions) {
      const getProp = (key: string) => toPropValue(page.properties[names.get(key) ?? ''])
      const a = parseAnswer(q, getProp)
      if (a) answers[q.id] = a
    }
  }
  const status = toPropValue(page.properties['Status'])
  const completed = status?.type === 'select' && status.name === 'Completed'
  return { pageId: page.id, answers, completed }
}

export async function createRow(dbId: string, name: string, email: string): Promise<string> {
  const page = await notion().pages.create({
    parent: { database_id: dbId },
    properties: {
      Name: { title: [{ text: { content: name } }] },
      Email: { email: email.trim().toLowerCase() },
      Status: { select: { name: 'In progress' } },
    },
  })
  return page.id
}

export async function saveAnswer(dbId: string, pageId: string, q: Question, a: Answer): Promise<void> {
  const names = await getPropertyMap(dbId)
  const properties: Record<string, object> = {}
  const kinds = new Map(columnsForQuestion(q).map((c) => [c.key, c.kind]))
  for (const entry of formatAnswer(q, a)) {
    const name = names.get(entry.key)
    if (!name) {
      console.error(`[questionnaire] no Notion column for key "${entry.key}" — run setup --sync`)
      continue
    }
    const kind = kinds.get(entry.key)
    if (kind === 'multi_select') properties[name] = { multi_select: (entry.value as string[]).map((v) => ({ name: v })) }
    else if (kind === 'select') properties[name] = entry.value ? { select: { name: entry.value as string } } : { select: null }
    else properties[name] = { rich_text: chunkRichText(entry.value as string) }
  }
  if (Object.keys(properties).length === 0) return
  await notion().pages.update({ page_id: pageId, properties: properties as any })
}

export async function markCompleted(pageId: string): Promise<void> {
  await notion().pages.update({
    page_id: pageId,
    properties: { Status: { select: { name: 'Completed' } } },
  })
}
