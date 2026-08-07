# Client Proposals on the Web — Design Spec

**Date:** 2026-08-07
**Status:** Approved pending final review
**Branch:** `feature/proposals` (to be created)

## Purpose

Present commercial proposals as pages on joelcolombo.co instead of PDF attachments, with an Approve button. Replaces the current flow's presentation layer (Word → PDF → email) while keeping DocuSign signing manual on Joel's existing basic plan (no DocuSign API — deliberately avoided, it requires a separate ~USD 50/mo API plan).

Reference proposals: `012-260306 Recoding America — Visual Assets & Website Redesign` and `005-251111 The DIV Fund Rebranding`. Both share the same anatomy: black cover → title page (number, requested by, date, version) → Confidentiality → Project Details (background, goals, scope, milestones) → Project Agreement (collaboration terms, pricing per milestone with checkboxes, payment terms, legals) → Acceptance with signature blocks.

## The full flow

1. Joel writes the proposal in **Notion** (a "Proposals" database; the page body is the document).
2. Client receives `joelcolombo.co/proposal/<slug>`.
3. Client enters their email; validated against that proposal's allowlist; first access marks the proposal `Viewed`.
4. Client reads the proposal in the site's aesthetic, checks the milestones they want in Pricing (live total), taps **Approve**.
5. Approval is recorded in Notion (who, when, which milestones) and Joel gets an email via Resend. Client sees "Proposal approved — you'll receive the document via DocuSign shortly."
6. Joel prints the same page to PDF (print stylesheet) and sends it for signature from his existing DocuSign account, manually. The signed PDF is the frozen legal artifact, as today.

No new costs: Notion API and Resend free tiers cover this volume.

## Architecture

### Routes & files

```
app/proposal/
├── [slug]/page.tsx            → server-side: resolve proposal in Notion by slug; noindex;
│                                404 if unknown or Status = Draft
└── _components/               → EmailGate, ProposalCover, SectionRenderer, PricingTable,
                                 ApproveBar, ApprovedState, ConfirmDialog

app/api/proposal/
├── verify/route.ts            → POST email → check allowlist → set signed session cookie;
│                                marks Status: Viewed + First viewed on first access
└── approve/route.ts           → POST selected milestones → update Notion (Status: Approved,
                                 Approved by/at/milestones) + Resend email to Joel; idempotent

lib/proposal/
├── notion.ts                  → Proposals DB queries (by slug), block fetching, status updates
├── parse.ts                   → Notion blocks → typed section model; pricing-table detection
├── types.ts                   → Proposal, Section, Block, Milestone types
└── session.ts                 → signed cookie helpers (HMAC with a server secret)

scripts/
└── proposals-setup.ts         → `npm run proposals:setup` — one-time creation of the
                                 Proposals database; prints the database ID for env config
```

Follows the questionnaire's established patterns: Notion as backing store, per-feature `lib/` module with vitest tests, setup script, server-side config resolution.

### Notion data model

**"Proposals" database** — one row per proposal. Properties:

- Authored by Joel: `Name` (title, e.g. "Recoding America — Visual Assets & Website Redesign"), `Number` (012-260306), `Client`, `Slug`, `Date`, `Version`, `Requested by`, `Allowed emails` (comma-separated), `Status` (select: Draft / Sent / Viewed / Approved).
- Written by the system: `First viewed` (date), `Approved by` (email), `Approved at` (date), `Approved milestones` (text).

**Page body = the document**, using a constrained block vocabulary matching the existing proposals:

- `heading_1` → major sections (Project Details, Project Agreement, Acceptance)
- `heading_2` → subsections (Background and Objectives, Pricing & Timelines, …)
- `heading_3` → sub-subsections (Milestone 1: …, Platform, …)
- `paragraph`, `bulleted_list_item`, `numbered_list_item`, `divider`
- **Pricing**: a Notion simple `table` block (columns: Milestone | Price | Timeline) placed under the "Pricing & Timelines" heading. The parser detects the first table in that section and renders it as the interactive milestone checkboxes. Price cells hold plain numbers with currency (e.g. `USD $1,500`); the total is computed by parsing the numeric value.

Unknown/unsupported block types render as plain text fallback (never crash the page).

The proposal's identity is its **Notion page ID** — the slug is only a lookup property. URL structure can be reorganized later (e.g. a future `/clients/<account>/proposals/<slug>` portal) without touching stored data; old links survive via Next.js redirects.

### Lifecycle

- `Draft` — not visible on the web (404).
- `Sent` — visible behind the email gate. Joel sets this manually when sharing the link.
- `Viewed` — set automatically on first successful email verification.
- `Approved` — set by the approve endpoint. The page then renders the frozen approved state: checkboxes locked to the recorded selection, approve bar replaced by an approved banner (who approved, when). Content edits after approval are out of scope — the signed PDF is the frozen artifact; version discipline (1.1, 1.2) governs pre-approval edits, as today.

## UX

Look & feel of joelcolombo.co and the existing PDFs, which already share DNA: PP Neue Montreal, pure black/white, the site's light/dark `data-theme`, generous whitespace, custom ellipse cursor. One continuous scrolling page (no pagination).

1. **Email gate** — minimal screen in the questionnaire welcome style: proposal number + client name visible (no confidential content), email field, honeypot for bots. Wrong email → neutral "This email doesn't have access to this proposal."
2. **Cover** — full-viewport black hero: "Services Proposal for Recoding America", byline "Joel Colombo ✦ Creative Director & Design Consultant".
3. **Title block** — number, requested by, date, version; then the Confidentiality note.
4. **Document sections** — rendered from Notion blocks with site typography. Section spacing mirrors the PDF's page rhythm.
5. **Pricing & Timelines** — interactive: checkbox per milestone with price and timeline, running total. At least one milestone required to approve.
6. **Approve bar** — discreet fixed bar (mirroring the questionnaire's fixed-control pattern) with the total and the Approve button. Tapping opens a confirmation: "You're approving Visual Assets + Website Redesign — USD $7,500." Confirm → success state.
7. **Approved state** — on revisit, the banner + locked selection; the document remains readable.

## Approve endpoint behavior

- Validates the session cookie and that the proposal is in `Sent`/`Viewed`.
- Writes approval fields + `Status: Approved` to Notion; sends the notification email (Resend) to hey@joelcolombo.co with client, selection, total, and a link to the Notion page.
- Idempotent: a second approval attempt (double-tap, retry, second stakeholder) returns the already-approved state and does not overwrite the first record or re-send email.
- If the Notion write fails, the client sees an inline retry on the button — never a raw error (questionnaire criterion). Email failure does not block the approval (Notion status is the source of truth; email is best-effort).

## PDF for DocuSign

`@media print` stylesheet on the same page: landscape pages, page breaks per major section, forced black-on-white, gate/approve chrome hidden, checkboxes rendered checked per the approved selection, Acceptance section with the signature blocks (as in the PDFs) for DocuSign anchoring. Joel: open approved proposal → Cmd+P → PDF → upload to DocuSign as today. One source of truth: what the client saw, approved, and signs is the same content.

## Env & services

- `NOTION_TOKEN` — exists (questionnaire). Same integration needs access to the Proposals DB.
- `NOTION_PROPOSALS_DB_ID` — from the setup script.
- `RESEND_API_KEY` — new; Resend free tier, internal notifications only.
- `PROPOSAL_SESSION_SECRET` — for signed cookies.

## Error handling summary

- Unknown slug or Draft → 404 (site's NotFound).
- Email not on allowlist → neutral message, no information leak.
- Notion API down on page load → minimal "temporarily unavailable" state.
- Approve write failure → inline retry; approval never silently lost.
- Malformed pricing table (missing/unparsable price) → milestone renders without checkbox math; approve still works with parseable rows; parser tested against real proposal structures.

## Testing

Vitest (existing setup), following `lib/questionnaire` conventions:

- `parse.test.ts` — block parsing, section grouping, pricing-table detection, price extraction, unknown-block fallback.
- `allowlist.test.ts` — email matching (case/whitespace-insensitive), neutral rejection.
- `approve.test.ts` — total computation, idempotency logic, status transitions.

Manual e2e against a real Notion "Recoding America" replica before first client use.

## Out of scope (deliberate)

- DocuSign API / embedded signing (option C chosen; base is ready for Documenso or a DocuSign API plan later).
- Client portal, accounts, multi-proposal dashboards (future; this design keeps identity in Notion page IDs so URLs can be restructured freely).
- Automated PDF generation service (print stylesheet suffices).
- Email verification codes / magic links (allowlist chosen for now; the gate UI stays the same if upgraded later).
- Editing/negotiation features on the web (handled by email + Notion versioning, as today).
