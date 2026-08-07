# Notion API script patterns (SDK v5)

Run one-off scripts from the scratchpad with env loaded from the repo:

```bash
set -a && source /Users/joelcolombo/Hey/.env.local && set +a && npx tsx <script>.ts
```

Import the SDK by absolute path (the scratchpad is outside the repo, so bare imports
fail): `import { Client } from '/Users/joelcolombo/Hey/node_modules/@notionhq/client/build/src/index.js'`.
Scripts must not use top-level await (tsx -e compiles CJS): wrap in `async function main()`.

## Shared helpers

```ts
const rt = (c: string) => ({ rich_text: [{ text: { content: c } }] })
const p = (c: string) => ({ paragraph: rt(c) })
const h1 = (c: string) => ({ heading_1: rt(c) })
const h2 = (c: string) => ({ heading_2: rt(c) })
const h3 = (c: string) => ({ heading_3: rt(c) })
const li = (c: string) => ({ bulleted_list_item: rt(c) })
const row = (cells: string[]) => ({
  type: 'table_row' as const,
  table_row: { cells: cells.map((c) => [{ type: 'text' as const, text: { content: c } }]) },
})
```

Query a database (v5 goes through its data source):

```ts
const db: any = await notion.databases.retrieve({ database_id: DB_ID })
const res = await notion.dataSources.query({
  data_source_id: db.data_sources[0].id,
  filter: { property: 'Slug', type: 'rich_text', rich_text: { equals: slug } } as any,
})
```

## Create a proposal page

```ts
await notion.pages.create({
  parent: { database_id: process.env.NOTION_PROPOSALS_DB_ID! },
  properties: {
    Name: { title: [{ text: { content: 'CLIENT Project Title' } }] },
    Number: rt('017-YYMMDD'),
    Client: rt('CLIENT'),
    Slug: rt('017-yymmdd-client-project'),
    Date: { date: { start: 'YYYY-MM-DD' } },
    Version: rt('1.0'),
    'Requested by': rt('Contact Name'),
    'Allowed emails': rt('hey@joelcolombo.co'), // Joel-only until he shares
    Status: { select: { name: 'Sent' } }, // Draft hides it from the web
  },
  children: [
    h1('Confidentiality Agreement'),
    p('...'),
    // ...body per references/proposal-template.md; pricing table:
    {
      table: {
        table_width: 3,
        has_column_header: true,
        children: [
          row(['Milestone', 'Price', 'Timeline']),
          row(['Milestone Name', 'USD $2,000', '3-4 weeks']),
        ],
      },
    },
  ] as any,
})
```

Update properties later (status reset, slug change, adding emails):

```ts
await notion.pages.update({ page_id, properties: {
  Status: { select: { name: 'Sent' } },
  'First viewed': { date: null },
} })
```

## Create account + items rows

Same `pages.create` with the respective parent database and properties:

- Accounts: `Name` (title), `Slug`, `Access code`, `Allowed emails`, `Project page`
  ({ url }), `Status` select `Active`.
- Items: `Name` (title, the hub label), `Account` (slug text), `Kind` (select
  Proposal/Questionnaire/Link), `Item slug`, `Target`, `Enabled` ({ checkbox }),
  `Order` ({ number }), optional `Allowed emails`.

## Verify a proposal end to end (local or prod)

```bash
JAR=$(mktemp)
curl -sk -c "$JAR" -X POST https://localhost:3000/api/proposal/verify \
  -H 'Content-Type: application/json' \
  -d '{"slug":"<slug>","email":"hey@joelcolombo.co"}'
curl -sk -b "$JAR" https://localhost:3000/proposal/<slug> | grep -o "Project Details"
```

Remember this marks the proposal `Viewed`; reset Status to `Sent` and clear
`First viewed` before Joel shares it.

## Reading a .docx for content or style reference

A .docx is a ZIP: `unzip -o -q file.docx` then read `word/document.xml` (content and
per-run formatting) and `word/styles.xml` (style definitions; sizes are half-points,
page margins in `sectPr` are twips, 20ths of a point). Extract paragraphs with their
`w:pStyle` to recover the heading structure.
