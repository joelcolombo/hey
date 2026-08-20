---
name: launchpad
description: Author and publish client proposals, Brand Discovery questionnaires, and client accounts on joelcolombo.co's Launchpad system (Notion-driven portal). Use this skill whenever Joel asks to create, draft, edit, or send a proposal ("propuesta") or questionnaire/discovery/survey for a client, onboard a new client or account to the launchpad, adjust proposal statuses or permissions, or work with the Proposals / Launchpad Accounts / Launchpad Items databases in Notion. Also use it when a new project is sold and needs its portal set up, or when debugging why something on /launchpad, /proposal or /questionnaire looks wrong.
---

# Launchpad: proposals, discovery, and client accounts

The Launchpad is Joel's client portal at joelcolombo.co/launchpad. Content lives in
Notion (zero deploys for new clients or proposals); the repo only holds the rendering
system and questionnaire definitions. This skill is the operating manual.

## System map

Everything sits under the **"Launchpad Hey!"** Notion page, shared with the
"Hey! Questionnaire" integration (`NOTION_API_KEY`).

| Database | Env var | One row is |
|---|---|---|
| Proposals | `NOTION_PROPOSALS_DB_ID` | a proposal (properties = metadata, page body = the document) |
| Launchpad Accounts | `NOTION_LAUNCHPAD_ACCOUNTS_DB_ID` | a client account (slug, access code, allowed emails, project page URL) |
| Launchpad Items | `NOTION_LAUNCHPAD_ITEMS_DB_ID` | one hub entry (kind Proposal/Questionnaire/Link/Document/Page, target, Enabled switch, optional per-item allowlist) |

Questionnaire responses get one database per project, created by
`npm run questionnaire:setup -- <client>/<project>` from the repo config in
`lib/questionnaire/projects/`.

Routes: `/launchpad` (login) → `/launchpad/<account>` (hub) → `/launchpad/<account>/<item-slug>`.
Direct routes `/proposal/<slug>` and `/questionnaire/<client>/<project>` also work, each
with its own gate. Env vars live in `.env.local` and Vercel production; adding a var to
Vercel: `printf '%s' "$VAL" | vercel env add NAME production --sensitive`.

## Conventions that must hold

- Proposal number `NNN-YYMMDD` (sequence + creation date, e.g. `016-260807`). The slug
  carries it: `016-260807-pro-visual-identity-refresh`.
- Milestone names in pricing tables: unique, and never containing `" — "` or `" + "`
  (they round-trip through the approval summary label).
- No em dashes anywhere in client-facing copy. Split sentences instead.
- The questionnaire presents as **Brand Discovery** (generic name). Mirror the client's
  own vocabulary in emails when they already call it something ("survey" for PRO).
- English for all client-facing content, Joel's voice: warm, direct, confident.
  Reuse phrases that resonated in calls with the client when drafting scope.

## Workflow: new client account

1. Generate an access code: `PRO`-style prefix + 6 chars, e.g.
   `$(openssl rand -base64 12 | tr -dc 'A-HJ-NP-Z2-9' | head -c 6)`. One code per account.
2. Add a row to **Launchpad Accounts**: Name, Slug (lowercase, the URL segment),
   Access code, Allowed emails (comma separated; always include Joel's), Project page
   (URL of the client's Notion page under Launchpad Hey!), Status `Active`.
3. Add rows to **Launchpad Items** per deliverable: Name (label shown), Account (slug),
   Kind, Item slug (URL segment, usually carrying the proposal number), Target
   (proposal slug / `client/project` pair / external URL), Enabled, Order.
4. Verify by logging in at `/launchpad` with Joel's email + the code.

Use the API script pattern in `references/notion-scripts.md` or add the rows by hand in
Notion; both are fine.

## Workflow: new proposal

1. **Gather inputs before drafting**: client and number, scope agreed (call transcripts
   are gold: extract the client's own framing and reuse it), a recent prior proposal as
   the structural reference, prices and timeline (prices are ALWAYS Joel's call: propose
   draft numbers grounded in comparable past proposals, flag them clearly for review),
   and any agreed schedule (include it verbatim as a dated list).
2. **Draft the document** following `references/proposal-template.md`, which carries the
   canonical section structure and the current legal boilerplate verbatim. Never reuse
   legals from an old proposal; the reference file is the source of truth (it tracks the
   most recent signed proposal).
3. **Create the Notion page** with the script pattern in `references/notion-scripts.md`:
   properties (Number, Client, Slug, Date, Version 1.0, Requested by, Allowed emails,
   Status) + the body blocks. Start `Allowed emails` with only Joel's email so he can
   review privately; the client's emails are added in Notion when he decides to share.
   Status `Sent` renders on the web; `Draft` 404s.
4. **Add the Launchpad Item row** (Kind Proposal, Target = proposal slug, Enabled).
5. **Verify**: authenticate via `/api/proposal/verify` with Joel's email and fetch the
   page; confirm sections, pricing checkboxes, and total render. If Joel viewed it,
   reset Status to `Sent` and clear `First viewed` before he shares it.
6. Remind Joel what stays manual: editing prices in the Notion table, adding client
   emails (account row, item row if restricted, and the proposal's own allowlist), and
   printing the PDF for DocuSign (Cmd+P from the approved page, background graphics on).

## Workflow: new Brand Discovery

1. Repo config: new file in `lib/questionnaire/projects/<client>-<project>.ts` choosing
   a template from `lib/questionnaire/templates/` and applying per-client overrides
   (add/remove/reword questions). Stable question ids; rewording never breaks data.
2. `npm run questionnaire:setup -- <client>/<project>` creates the responses database
   and writes its id into the config. Commit both.
3. Add the Launchpad Items row: Kind Questionnaire, Target `<client>/<project>`,
   Enabled per Joel's call (discovery can open before the proposal is approved; the
   Enabled checkbox is his manual switch).
4. Via launchpad the welcome asks only the name (email comes from the session); the
   direct link asks both and has no gate, useful for stakeholders outside the portal.

## Workflow: documents and bespoke pages

Two more item kinds exist for deliverables that are neither proposal nor questionnaire:

- **Document**: a read-only rendering of any Notion page the integration can see.
  Target = the page URL or id. Generic renderer in `app/document/` (headings, lists,
  quotes, callouts, toggles, tables, columns, TOC, images; inline bold/italic/links).
  Cached 2 minutes via Next's data cache (a page is dozens of Notion calls).
- **Page**: a bespoke React page in `app/launchpad/_pages/<key>/` registered in
  `app/launchpad/_pages/index.ts`. Target = the registry key (e.g.
  `pro/discovery-synthesis`). Content lives in the repo (a `data.ts` per page), so it
  is designed, not fetched. Use this when a document needs visual treatment beyond
  prose (tallies, sliders, bars, cards). Shared primitives live next to the page.

Both are gated by the launchpad session plus the item allowlist only.

## Status and permissions model

- Proposal lifecycle: `Draft` (hidden) → `Sent` → `Viewed` (auto on first access) →
  `Approved` (client approved on the web; frozen, idempotent) → `Signed` (Joel sets it
  manually after DocuSign). The hub shows Reviewing / Approved / Signed.
- Three permission layers, all Notion-editable: account allowlist (login), item
  allowlist (empty = whole account), and the proposal's own document allowlist.
  A user can have hub access yet see specific items Locked.
- Approving emails Joel via Resend (`PROPOSAL_NOTIFY_TO`; unverified Resend domains can
  only mail the account owner address).

## Sharp edges

- Notion API cannot move pages (drag by hand; IDs survive) and cannot create linked
  database views.
- Notion SDK v5 is data-source-centric: query via `dataSources.query`, schema via
  `initial_data_source` on create. Mirror `lib/questionnaire/notion.ts`.
- Tailwind v3 cannot alpha-modify var() colors (`border-[var(--x)]/30` silently breaks);
  use `var(--hairline)` for rules.
- Never run `npm run build` while the dev server runs (corrupts `.next`).
- Headless PDF checks (Playwright `page.pdf`) need `await document.fonts.ready`; font
  faces load only if used on screen.
- The print stylesheet (`app/proposal/proposal-print.css`) replicates Joel's Word
  proposal PDFs; if print fidelity questions come up, the theme values were extracted
  from the reference `.docx` XML (unzip it and read `word/document.xml` + `styles.xml`
  for exact sizes, in half-points, and margins, in twips).
