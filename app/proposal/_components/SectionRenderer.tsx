import type { ReactNode } from 'react'
import type { PricingTable, Section } from '@/lib/proposal/types'

function PlainTable({ rows }: { rows: string[][] }) {
  if (rows.length === 0) return null
  return (
    <div className="overflow-x-auto my-6">
      <table className="w-full text-left text-[1em]">
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-[var(--hover-color)]/30">
              {row.map((cell, j) => (
                <td key={j} className="py-3 pr-6 align-top">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function SectionRenderer({
  section,
  pricingSlot,
}: {
  section: Section
  pricingSlot?: (pricing: PricingTable) => ReactNode
}) {
  return (
    <section className="proposal-section max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-[3em] leading-[1.1] mb-10 max-md:text-[2em] text-balance">{section.title}</h1>
      {section.blocks.map((block, i) => {
        switch (block.kind) {
          case 'h2':
            return <h2 key={i} className="text-[1.6em] leading-[1.2] mt-12 mb-4 text-[var(--hover-color)]">{block.text}</h2>
          case 'h3':
            return <h3 key={i} className="text-[1.15em] font-medium mt-8 mb-3">{block.text}</h3>
          case 'p':
            return <p key={i} className="text-[1.05em] leading-[1.6] mb-4">{block.text}</p>
          case 'bullets':
            return (
              <ul key={i} className="list-none mb-4 flex flex-col gap-2">
                {block.items.map((item, j) => (
                  <li key={j} className="text-[1.05em] leading-[1.6] pl-6 relative before:content-['–'] before:absolute before:left-0 before:text-[var(--hover-color)]">{item}</li>
                ))}
              </ul>
            )
          case 'numbered':
            return (
              <ol key={i} className="list-decimal list-inside mb-4 flex flex-col gap-2">
                {block.items.map((item, j) => (
                  <li key={j} className="text-[1.05em] leading-[1.6]">{item}</li>
                ))}
              </ol>
            )
          case 'divider':
            return <hr key={i} className="border-[var(--hover-color)]/30 my-10" />
          case 'table':
            return <PlainTable key={i} rows={block.rows} />
          case 'pricing':
            return (
              <div key={i}>
                {pricingSlot
                  ? pricingSlot(block.pricing)
                  : <PlainTable rows={block.pricing.milestones.map((m) => [m.name, m.priceLabel, m.timeline])} />}
              </div>
            )
        }
      })}
    </section>
  )
}
