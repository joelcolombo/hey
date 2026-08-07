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
            className={`flex items-baseline gap-4 py-4 border-b border-[var(--hover-color)]/30 ${locked ? '' : 'cursor-pointer'}`}
          >
            <input
              type="checkbox"
              checked={checked}
              disabled={locked}
              onChange={() => onToggle(m.name)}
              className="accent-[var(--foreground)] w-4 h-4 translate-y-[2px]"
            />
            <span className={`flex-1 text-[1.05em] transition-opacity ${checked ? '' : 'opacity-40'}`}>{m.name}</span>
            <span className={`text-[1.05em] transition-opacity ${checked ? '' : 'opacity-40'}`}>{m.priceLabel}</span>
            <span className={`proposal-timeline text-[0.95em] text-[var(--hover-color)] w-24 text-right max-md:hidden transition-opacity ${checked ? '' : 'opacity-40'}`}>{m.timeline}</span>
          </label>
        )
      })}
    </div>
  )
}
