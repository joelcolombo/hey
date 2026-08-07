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
 *   Milestone names must be unique and must not contain " — " or " + "
 *   (they round-trip through the approval summary label). Header row optional.
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
