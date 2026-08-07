'use client'

import type { ProposalPublicMeta, Section } from '@/lib/proposal/types'
import SectionRenderer from './SectionRenderer'
import SignatureBlocks from './SignatureBlocks'

export function formatDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function ProposalApp({ meta, sections }: { meta: ProposalPublicMeta; sections: Section[] }) {
  return (
    <main>
      {/* Cover — always black, both themes */}
      <div className="proposal-cover bg-black text-white min-h-dvh flex flex-col justify-between px-6 py-16 md:px-16">
        <h1 className="text-[4em] leading-[1.1] max-md:text-[2.4em] max-w-4xl mt-24 text-balance">
          Services Proposal for {meta.client}
        </h1>
        <p className="text-[1.1em]">Joel Colombo ✦ Creative Director &amp; Design Consultant</p>
      </div>

      {/* Title block */}
      <div className="proposal-section max-w-3xl mx-auto px-6 py-24">
        <h1 className="text-[3em] leading-[1.1] mb-4 max-md:text-[2em]">Services Proposal</h1>
        <p className="text-[1.2em] mb-2">{meta.title}</p>
        <p className="text-[1.2em] text-[var(--hover-color)] mb-16">{meta.number}</p>
        <div className="text-[0.95em] text-[var(--hover-color)] flex flex-col gap-1">
          {meta.requestedBy && <p>Requested by: {meta.requestedBy}</p>}
          {meta.date && <p>Date: {formatDate(meta.date)}</p>}
          {meta.version && <p>Version: {meta.version}</p>}
        </div>
      </div>

      {sections.map((section, i) => (
        <SectionRenderer key={`${i}-${section.title}`} section={section} />
      ))}

      <SignatureBlocks clientName={meta.client} />
    </main>
  )
}
