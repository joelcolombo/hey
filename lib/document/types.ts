/** Inline rich text span as rendered from Notion annotations. */
export type Span = {
  text: string
  bold?: boolean
  italic?: boolean
  code?: boolean
  strike?: boolean
  underline?: boolean
  href?: string | null
}

export type DocBlock =
  | { kind: 'h1' | 'h2' | 'h3'; id: string; spans: Span[]; toggleable?: boolean; children?: DocBlock[] }
  | { kind: 'p'; spans: Span[] }
  | { kind: 'bullets' | 'numbered'; items: Array<{ spans: Span[]; children?: DocBlock[] }> }
  | { kind: 'quote'; spans: Span[]; children?: DocBlock[] }
  | { kind: 'callout'; icon: string | null; spans: Span[]; children?: DocBlock[] }
  | { kind: 'toggle'; spans: Span[]; children?: DocBlock[] }
  | { kind: 'divider' }
  | { kind: 'table'; headerRow: boolean; headerColumn: boolean; rows: Span[][][] }
  | { kind: 'columns'; columns: DocBlock[][] }
  | { kind: 'toc' }
  | { kind: 'image'; src: string; caption: Span[] }

export type HeadingBlock = Extract<DocBlock, { kind: 'h1' | 'h2' | 'h3' }>

export type NotionDocument = {
  pageId: string
  title: string
  icon: string | null
  /** ISO timestamp of the last Notion edit. */
  lastEdited: string
  blocks: DocBlock[]
}
