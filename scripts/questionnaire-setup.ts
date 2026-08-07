import { config as loadEnv } from 'dotenv'
loadEnv({ path: '.env.local' })

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { Client } from '@notionhq/client'
import type { CreateDataSourceParameters, UpdateDataSourceParameters } from '@notionhq/client'
import { getProjectConfig, resolveConfig } from '../lib/questionnaire/projects'
import { buildDatabaseProperties, columnsForQuestion, QUESTION_KEY_RE } from '../lib/questionnaire/notion-format'

/**
 * Write the freshly created database ID straight into the project's config
 * file (replacing `notionDatabaseId: null`), so setup is one command with no
 * manual paste. Finds the config by its slug pair; falls back to printing
 * the ID if anything about the file is unexpected.
 */
function writeDatabaseId(clientSlug: string, projectSlug: string, dbId: string): boolean {
  const dir = join(__dirname, '..', 'lib', 'questionnaire', 'projects')
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.ts') || file === 'index.ts' || file.endsWith('.test.ts')) continue
    const path = join(dir, file)
    const src = readFileSync(path, 'utf8')
    if (!src.includes(`clientSlug: '${clientSlug}'`) || !src.includes(`projectSlug: '${projectSlug}'`)) continue
    if (!/notionDatabaseId:\s*null/.test(src)) {
      console.error(`Config ${file} already has a notionDatabaseId. Not overwriting it.`)
      return false
    }
    writeFileSync(path, src.replace(/notionDatabaseId:\s*null,?[^\n]*/, `notionDatabaseId: '${dbId}',`))
    console.log(`Wrote notionDatabaseId into lib/questionnaire/projects/${file}`)
    return true
  }
  return false
}

/**
 * SDK v5 (Notion-Version 2025-09-03) is data-source-centric: a database's schema lives on
 * its data source, not on the database object itself. These aliases pull the exact property
 * shapes the SDK expects straight from its exported `*Parameters` types instead of reaching
 * into internal build paths, so `buildDatabaseProperties`'s loosely-typed `Record<string, object>`
 * output can be narrowed to what `databases.create` / `dataSources.update` actually require.
 */
type PropertyConfig = CreateDataSourceParameters['properties'][string]
type PropertyPatchValue = NonNullable<UpdateDataSourceParameters['properties']>[string]

async function main() {
  const [slugPair, flag] = process.argv.slice(2)
  const [client, project] = (slugPair ?? '').split('/')
  const raw = client && project ? getProjectConfig(client, project) : null
  if (!raw) {
    console.error('Usage: npm run questionnaire:setup -- <client>/<project> [--sync]')
    process.exit(1)
  }

  if (!process.env.NOTION_API_KEY) {
    console.error('Missing NOTION_API_KEY in .env.local')
    process.exit(1)
  }

  const cfg = resolveConfig(raw)
  const notion = new Client({ auth: process.env.NOTION_API_KEY })

  if (flag === '--sync') {
    if (!cfg.notionDatabaseId) {
      console.error('Config has no notionDatabaseId — run without --sync first.')
      process.exit(1)
    }

    // v5: databases.retrieve no longer returns `.properties` — resolve the data source first.
    const dbRes = await notion.databases.retrieve({ database_id: cfg.notionDatabaseId })
    if (!('data_sources' in dbRes)) {
      console.error('Database response missing data_sources — check integration access.')
      process.exit(1)
    }
    const dataSourceId = dbRes.data_sources[0]?.id
    if (!dataSourceId) {
      console.error(`No data source found for database ${cfg.notionDatabaseId}`)
      process.exit(1)
    }

    const dataSource = await notion.dataSources.retrieve({ data_source_id: dataSourceId })
    const byKey = new Map<string, string>() // question key -> current Notion property name
    for (const name of Object.keys(dataSource.properties)) {
      const m = name.match(QUESTION_KEY_RE)
      if (m) byKey.set(m[1], name)
    }

    const wanted = buildDatabaseProperties(cfg.template)
    const patch: Record<string, PropertyPatchValue> = {}
    for (const [name, def] of Object.entries(wanted)) {
      const m = name.match(QUESTION_KEY_RE)
      if (!m) continue // base columns already exist
      const currentName = byKey.get(m[1])
      if (!currentName) patch[name] = def as PropertyPatchValue // new column
      else if (currentName !== name) patch[currentName] = { name } // reworded → rename in place
    }
    if (Object.keys(patch).length === 0) {
      console.log('Already in sync.')
      return
    }

    // v5: property create/rename is a data-source operation, not databases.update
    // (UpdateDatabaseParameters has no `properties` field in the 2025-09-03 API).
    await notion.dataSources.update({ data_source_id: dataSourceId, properties: patch })
    console.log(`Synced ${Object.keys(patch).length} column(s).`)
    return
  }

  const parentId = process.env.NOTION_QUESTIONNAIRE_PARENT_PAGE_ID
  if (!parentId) {
    console.error('Missing NOTION_QUESTIONNAIRE_PARENT_PAGE_ID in .env.local')
    process.exit(1)
  }

  // v5: initial schema is passed via `initial_data_source`, not top-level `properties`.
  const db = await notion.databases.create({
    parent: { type: 'page_id', page_id: parentId },
    title: [{ text: { content: `${cfg.clientName} — ${cfg.projectTitle} (Responses)` } }],
    initial_data_source: { properties: buildDatabaseProperties(cfg.template) as Record<string, PropertyConfig> },
  })
  const count = cfg.template.sections.flatMap((s) => s.questions).flatMap(columnsForQuestion).length
  console.log(`\nCreated database with ${count} question columns.`)
  if (!writeDatabaseId(client, project, db.id)) {
    console.log(`\n  notionDatabaseId: '${db.id}'\n`)
    console.log(`Couldn't update the config automatically. Paste that into the ProjectConfig for ${slugPair} in lib/questionnaire/projects/.`)
  } else {
    console.log(`\n${slugPair} is live. The questionnaire URL is /questionnaire/${client}/${project}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
