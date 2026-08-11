'use client'

import type { PricingTable } from '@/lib/proposal/types'

export default function PricingSection({
  pricing,
  selected,
  locked,
  onToggle,
}: {
  pricing: PricingTable
  selected: Set<string>
  locked: boolean
  onToggle: (name: string) => void
}) {
  return (
    <div className="my-6 flex flex-col">
      {pricing.milestones.map((m) => {
        const checked = selected.has(m.name)
        return (
          <label
            key={m.name}
            className={`proposal-pricing-row flex items-baseline gap-4 py-2.5 ${locked ? '' : 'cursor-pointer'}`}
          >
            <input
              type="checkbox"
              checked={checked}
              disabled={locked}
              onChange={() => onToggle(m.name)}
              className="proposal-checkbox"
            />
            <span className={`proposal-pricing-name flex-none basis-[38%] max-md:basis-auto max-md:flex-1 text-[1.05em] transition-opacity ${checked ? '' : 'opacity-40'}`}>{m.name}</span>
            <span className={`proposal-pricing-price flex-none basis-[24%] max-md:basis-auto text-[1.05em] transition-opacity ${checked ? '' : 'opacity-40'}`}>{m.priceLabel}</span>
            <span className={`proposal-timeline text-[1.05em] text-[var(--hover-color)] max-md:hidden transition-opacity ${checked ? '' : 'opacity-40'}`}>{m.timeline}</span>
          </label>
        )
      })}
    </div>
  )
}
