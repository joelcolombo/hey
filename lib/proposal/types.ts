export type ProposalStatus = 'Draft' | 'Sent' | 'Viewed' | 'Approved'

/** Full metadata from the Notion row. Server-side only — contains the allowlist. */
export type ProposalMeta = {
  pageId: string
  slug: string
  title: string
  number: string
  client: string
  date: string
  version: string
  requestedBy: string
  allowedEmails: string[]
  status: ProposalStatus
  approvedBy: string | null
  approvedAt: string | null
  approvedMilestones: string | null
}

/** Safe subset serialized to the browser. */
export type ProposalPublicMeta = Omit<ProposalMeta, 'allowedEmails' | 'pageId'>

export type Milestone = {
  name: string
  /** Numeric amount parsed from the price cell; null when unparsable. */
  amount: number | null
  /** The price cell verbatim, e.g. "USD $1,500". */
  priceLabel: string
  timeline: string
}

export type PricingTable = { milestones: Milestone[] }

export type ContentBlock =
  | { kind: 'h2'; text: string }
  | { kind: 'h3'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'bullets'; items: string[] }
  | { kind: 'numbered'; items: string[] }
  | { kind: 'divider' }
  | { kind: 'table'; rows: string[][] }
  | { kind: 'pricing'; pricing: PricingTable }

/** A document section = one heading_1 and everything until the next one. */
export type Section = { title: string; blocks: ContentBlock[] }

/**
 * Loose shape of a Notion API block after fetching. `text` is the joined
 * plain_text of the block's rich_text; `cells` only for table_row children.
 */
export type NotionBlock = {
  type: string
  text?: string
  /** table blocks: their table_row children, each row = cell texts. */
  rows?: string[][]
}
