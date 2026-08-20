import type { DocBlock, Span } from '@/lib/document/types'
import RichText from './RichText'

const plain = (spans: Span[]) => spans.map((s) => s.text).join('')
export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/** Anchor ids for headings: stable, derived from the text. */
export const headingId = (spans: Span[]) => slugify(plain(spans)) || 'section'

function Table({ block }: { block: Extract<DocBlock, { kind: 'table' }> }) {
  if (block.rows.length === 0) return null
  return (
    <div className="overflow-x-auto my-6 -mx-6 px-6">
      <table className="w-full text-left text-[0.95em] leading-[1.5]">
        <tbody>
          {block.rows.map((row, i) => {
            const isHeader = block.headerRow && i === 0
            return (
              <tr key={i} className={`border-b border-[var(--hairline)] ${isHeader ? 'border-b-[var(--foreground)]' : ''}`}>
                {row.map((cell, j) => {
                  const head = isHeader || (block.headerColumn && j === 0)
                  const Tag = head ? 'th' : 'td'
                  return (
                    <Tag
                      key={j}
                      scope={isHeader ? 'col' : block.headerColumn && j === 0 ? 'row' : undefined}
                      className={`py-3 pr-5 align-top font-normal ${isHeader ? 'label text-[var(--hover-color)] whitespace-nowrap' : ''} ${!isHeader && head ? 'font-medium' : ''}`}
                    >
                      <RichText spans={cell} />
                    </Tag>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ListItems({ items, kind, depth }: { items: Array<{ spans: Span[]; children?: DocBlock[] }>; kind: 'bullets' | 'numbered'; depth: number }) {
  const shared = 'text-[1.05em] leading-[1.6]'
  if (kind === 'numbered') {
    return (
      <ol className="doc-ol mb-4 flex flex-col gap-2 pl-7">
        {items.map((item, i) => (
          <li key={i} className={`${shared} relative`}>
            <RichText spans={item.spans} />
            {item.children && <div className="mt-2"><Blocks blocks={item.children} depth={depth + 1} /></div>}
          </li>
        ))}
      </ol>
    )
  }
  return (
    <ul className="list-none mb-4 flex flex-col gap-2">
      {items.map((item, i) => (
        <li key={i} className={`${shared} pl-6 relative before:content-['–'] before:absolute before:left-0 before:text-[var(--hover-color)]`}>
          <RichText spans={item.spans} />
          {item.children && <div className="mt-2"><Blocks blocks={item.children} depth={depth + 1} /></div>}
        </li>
      ))}
    </ul>
  )
}

export default function Blocks({ blocks, depth = 0, toc }: { blocks: DocBlock[]; depth?: number; toc?: Array<{ id: string; text: string }> }) {
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.kind) {
          case 'h1': {
            const id = headingId(block.spans)
            const heading = (
              <h1 id={id} className="font-light text-[2.4em] leading-[1.1] mt-20 mb-8 max-md:text-[1.8em] text-balance scroll-mt-24 first:mt-0">
                <RichText spans={block.spans} />
              </h1>
            )
            if (block.toggleable) return <Toggle key={i} summary={heading} children={block.children} />
            return <div key={i}>{heading}{block.children && <Blocks blocks={block.children} depth={depth + 1} />}</div>
          }
          case 'h2': {
            const id = headingId(block.spans)
            const heading = (
              <h2 id={id} className="text-[1.5em] leading-[1.25] mt-12 mb-4 text-[var(--hover-color)] scroll-mt-24">
                <RichText spans={block.spans} />
              </h2>
            )
            if (block.toggleable) return <Toggle key={i} summary={heading} children={block.children} />
            return <div key={i}>{heading}{block.children && <Blocks blocks={block.children} depth={depth + 1} />}</div>
          }
          case 'h3': {
            const heading = (
              <h3 className="text-[1.15em] font-medium mt-8 mb-3">
                <RichText spans={block.spans} />
              </h3>
            )
            if (block.toggleable) return <Toggle key={i} summary={heading} children={block.children} />
            return <div key={i}>{heading}{block.children && <Blocks blocks={block.children} depth={depth + 1} />}</div>
          }
          case 'p':
            return (
              <p key={i} className="text-[1.05em] leading-[1.6] mb-4">
                <RichText spans={block.spans} />
              </p>
            )
          case 'bullets':
          case 'numbered':
            return <ListItems key={i} items={block.items} kind={block.kind} depth={depth} />
          case 'quote':
            return (
              <blockquote key={i} className="border-l border-[var(--foreground)] pl-5 my-6 text-[1.05em] leading-[1.6]">
                <RichText spans={block.spans} />
                {block.children && <div className="mt-2"><Blocks blocks={block.children} depth={depth + 1} /></div>}
              </blockquote>
            )
          case 'callout':
            return (
              <aside key={i} className="border border-[var(--foreground)] rounded-2xl px-6 py-5 my-8 text-[1.05em] leading-[1.6] doc-callout">
                <div className="flex gap-4">
                  {block.icon && <span className="flex-none select-none" aria-hidden>{block.icon}</span>}
                  <div className="min-w-0 flex-1">
                    {block.spans.length > 0 && <p className="mb-3 last:mb-0"><RichText spans={block.spans} /></p>}
                    {block.children && <Blocks blocks={block.children} depth={depth + 1} />}
                  </div>
                </div>
              </aside>
            )
          case 'toggle':
            return (
              <Toggle
                key={i}
                summary={<span className="text-[1.05em] leading-[1.6]"><RichText spans={block.spans} /></span>}
                children={block.children}
              />
            )
          case 'divider':
            return <hr key={i} className="border-[var(--hairline)] my-12" />
          case 'table':
            return <Table key={i} block={block} />
          case 'columns':
            return (
              <div key={i} className="doc-columns-grid grid gap-x-10 gap-y-6 my-6" style={{ gridTemplateColumns: `repeat(${block.columns.length}, minmax(0, 1fr))` }}>
                {block.columns.map((col, j) => (
                  <div key={j} className="min-w-0 doc-column"><Blocks blocks={col} depth={depth + 1} /></div>
                ))}
              </div>
            )
          case 'toc':
            if (!toc || toc.length === 0) return null
            return (
              <nav key={i} aria-label="Contents" className="my-8 border-t border-b border-[var(--hairline)] py-5">
                <p className="label text-[var(--hover-color)] mb-3">Contents</p>
                <ol className="flex flex-col gap-1.5">
                  {toc.map((t) => (
                    <li key={t.id}>
                      <a href={`#${t.id}`} className="text-[1.05em] hover:text-[var(--hover-color)] transition-colors">{t.text}</a>
                    </li>
                  ))}
                </ol>
              </nav>
            )
          case 'image':
            return (
              <figure key={i} className="my-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={block.src} alt={plain(block.caption)} className="w-full h-auto rounded-lg" />
                {block.caption.length > 0 && <figcaption className="mt-2 text-[0.9em] text-[var(--hover-color)]"><RichText spans={block.caption} /></figcaption>}
              </figure>
            )
        }
      })}
    </>
  )
}

function Toggle({ summary, children }: { summary: React.ReactNode; children?: DocBlock[] }) {
  return (
    <details className="doc-toggle group border-t border-[var(--hairline)] last:border-b py-1">
      <summary className="flex items-baseline gap-3 py-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:text-[var(--hover-color)] transition-colors">
        <span className="flex-none w-4 text-[var(--hover-color)] transition-transform group-open:rotate-90 inline-block">→</span>
        <span className="flex-1 min-w-0">{summary}</span>
      </summary>
      {children && <div className="pl-7 pb-4"><Blocks blocks={children} depth={1} /></div>}
    </details>
  )
}
