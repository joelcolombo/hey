import { config as loadEnv } from 'dotenv'
loadEnv({ path: '.env.local' })

import { Client } from '@notionhq/client'
import { summarizeAnswer } from '../lib/questionnaire/flow'
import { findRow } from '../lib/questionnaire/notion'
import { getProjectConfig, resolveConfig } from '../lib/questionnaire/projects'

async function callClaude(prompt: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) throw new Error(`Anthropic API ${res.status}: ${await res.text()}`)
  const data = (await res.json()) as { content: { type: string; text?: string }[] }
  return data.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n')
}

/** Minimal markdown → Notion blocks: ## / ### headings, "- " bullets, paragraphs. */
function mdToBlocks(md: string): object[] {
  const rt = (s: string) => {
    const out: object[] = []
    for (let i = 0; i < s.length; i += 1900) out.push({ text: { content: s.slice(i, i + 1900) } })
    return out
  }
  return md
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      if (line.startsWith('### ')) return { heading_3: { rich_text: rt(line.slice(4)) } }
      if (line.startsWith('## ')) return { heading_2: { rich_text: rt(line.slice(3)) } }
      if (line.startsWith('# ')) return { heading_2: { rich_text: rt(line.slice(2)) } }
      if (line.startsWith('- ')) return { bulleted_list_item: { rich_text: rt(line.slice(2)) } }
      return { paragraph: { rich_text: rt(line) } }
    })
}

async function main() {
  const [slugPair] = process.argv.slice(2)
  const [client, project] = (slugPair ?? '').split('/')
  const raw = client && project ? getProjectConfig(client, project) : null
  if (!raw?.notionDatabaseId) {
    console.error('Usage: npm run questionnaire:synthesize -- <client>/<project> (config needs notionDatabaseId)')
    process.exit(1)
  }

  if (!process.env.NOTION_API_KEY) {
    console.error('Missing NOTION_API_KEY in .env.local')
    process.exit(1)
  }

  const cfg = resolveConfig(raw)
  const notion = new Client({ auth: process.env.NOTION_API_KEY })

  // v5 (Notion-Version 2025-09-03) is data-source-centric: databases.query no longer exists.
  // Resolve the database's data source, then query that instead (same pattern as
  // lib/questionnaire/notion.ts's getDataSourceIdAndPropertyMap / findRow).
  const dbRes = await notion.databases.retrieve({ database_id: raw.notionDatabaseId })
  if (!('data_sources' in dbRes)) {
    console.error('Database response missing data_sources — check integration access.')
    process.exit(1)
  }
  const dataSourceId = dbRes.data_sources[0]?.id
  if (!dataSourceId) {
    console.error(`No data source found for database ${raw.notionDatabaseId}`)
    process.exit(1)
  }
  const pages = await notion.dataSources.query({ data_source_id: dataSourceId, page_size: 100 })

  type Row = { name: string; email: string; completed: boolean }
  const rows: { row: Row; transcript: string }[] = []
  for (const page of pages.results) {
    if (page.object !== 'page' || !('properties' in page)) continue
    const props = page.properties as {
      Name?: { title?: { plain_text: string }[] }
      Email?: { email?: string }
    }
    const email = props.Email?.email
    if (!email) continue
    const found = await findRow(raw.notionDatabaseId, email, cfg.template)
    if (!found) continue
    const name = props.Name?.title?.map((t) => t.plain_text).join('') || email
    const lines: string[] = []
    for (const section of cfg.template.sections) {
      for (const q of section.questions) {
        const a = found.answers[q.id]
        if (!a) continue
        lines.push(`Q: ${q.prompt}\nA: ${summarizeAnswer(q, a)}`)
      }
    }
    rows.push({
      row: { name, email, completed: found.completed },
      transcript: lines.join('\n\n'),
    })
  }
  if (rows.length === 0) {
    console.error('No responses found.')
    process.exit(1)
  }
  console.log(`Synthesizing ${rows.length} stakeholder response(s)…`)

  const prompt = [
    `You are helping a brand designer synthesize discovery-questionnaire responses for a ${cfg.projectTitle} project for the client "${cfg.clientName}".`,
    `${rows.length} stakeholder(s) answered the same questionnaire. Their responses:`,
    ...rows.map((r) => `\n=== ${r.row.name} (${r.row.email})${r.row.completed ? '' : ' — incomplete'} ===\n${r.transcript}`),
    `\nProduce a markdown synthesis with exactly these sections:`,
    `## Executive summary — 3-5 sentences capturing the project's strategic direction.`,
    `## Consensus — points where stakeholders clearly agree.`,
    `## Tensions — where stakeholders diverge (including divergent slider positions); name who leans where and why it matters for the design.`,
    `## Highlights — 3-6 short verbatim quotes worth keeping visible during design, with attribution.`,
    `## Watch-outs — constraints, sensitivities, or things to avoid that the designer must not miss.`,
    `Be specific and cite stakeholders by first name. Don't pad; if a section is thin, keep it thin.`,
  ].join('\n')

  const synthesis = await callClaude(prompt)

  const parentId = process.env.NOTION_QUESTIONNAIRE_PARENT_PAGE_ID
  if (!parentId) {
    console.error('Missing NOTION_QUESTIONNAIRE_PARENT_PAGE_ID — printing synthesis instead:\n')
    console.log(synthesis)
    return
  }
  const blocks = mdToBlocks(synthesis)
  const page = await notion.pages.create({
    parent: { type: 'page_id', page_id: parentId },
    properties: { title: { title: [{ text: { content: `Synthesis — ${cfg.clientName} ${cfg.projectTitle}` } }] } },
    children: blocks.slice(0, 100) as never,
  })
  // Notion caps children at 100 per request; append the rest.
  for (let i = 100; i < blocks.length; i += 100) {
    await notion.blocks.children.append({ block_id: page.id, children: blocks.slice(i, i + 100) as never })
  }
  console.log(`Created synthesis page: ${'url' in page ? page.url : page.id}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
