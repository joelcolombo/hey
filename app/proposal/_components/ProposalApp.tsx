'use client'

import { useMemo, useState } from 'react'
import { computeApprovalSummary, namesFromSummaryLabel } from '@/lib/proposal/parse'
import type { PricingTable, ProposalPublicMeta, Section } from '@/lib/proposal/types'
import ThemeToggle from '@/components/ThemeToggle'
import ApproveBar from './ApproveBar'
import PricingSection from './PricingSection'
import SectionRenderer from './SectionRenderer'
import SignatureBlocks from './SignatureBlocks'

export function formatDate(iso: string): string {
  if (!iso) return ''
  // Date-only strings (2026-03-10) must not shift with the viewer's timezone.
  const dateOnly = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  const d = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(iso)
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

type Approval = { approvedBy: string; approvedAt: string; summaryLabel: string }

export default function ProposalApp({ meta, sections }: { meta: ProposalPublicMeta; sections: Section[] }) {
  const pricing: PricingTable | null = useMemo(() => {
    const block = sections.flatMap((s) => s.blocks).find((b) => b.kind === 'pricing')
    return block?.kind === 'pricing' ? block.pricing : null
  }, [sections])

  const [approval, setApproval] = useState<Approval | null>(
    meta.status === 'Approved' && meta.approvedBy && meta.approvedAt && meta.approvedMilestones
      ? { approvedBy: meta.approvedBy, approvedAt: meta.approvedAt, summaryLabel: meta.approvedMilestones }
      : null
  )
  const [selected, setSelected] = useState<Set<string>>(() => {
    if (approval) return new Set(namesFromSummaryLabel(approval.summaryLabel))
    return new Set(pricing?.milestones.map((m) => m.name) ?? []) // all preselected
  })

  const summary = pricing ? computeApprovalSummary(pricing, [...selected]) : null

  const approve = async (): Promise<string | null> => {
    try {
      const res = await fetch('/api/proposal/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: meta.slug, selected: [...selected] }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) return 'Could not save your approval. Please try again.'
      setApproval({ approvedBy: data.approvedBy, approvedAt: data.approvedAt, summaryLabel: data.summaryLabel })
      if (data.alreadyApproved) setSelected(new Set(namesFromSummaryLabel(data.summaryLabel ?? '')))
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return null
    } catch {
      return 'Could not save your approval. Please try again.'
    }
  }

  return (
    <main className={approval ? '' : 'pb-28'}>
      {approval && (
        <div className="proposal-approved-banner max-w-3xl mx-auto px-6 pt-10">
          <div className="border border-[var(--foreground)] rounded-2xl px-6 py-5 text-[1.05em] leading-[1.5]">
            <p className="mb-2 flex items-baseline gap-2">
              <span className="label">Proposal approved</span>
              <span>✦</span>
            </p>
            <p className="text-[var(--hover-color)]">
              {approval.summaryLabel} — approved by {approval.approvedBy} on {formatDate(approval.approvedAt)}.
              You&rsquo;ll receive the document via DocuSign shortly.
            </p>
          </div>
        </div>
      )}

      {/* Cover — print only; on screen the document starts at the title block */}
      <div className="proposal-cover bg-black text-white min-h-dvh hidden print:flex flex-col justify-between px-6 py-16 md:px-16">
        <h1 className="font-light text-[4em] leading-[1.1] max-md:text-[2.4em] max-w-4xl mt-24 text-balance">
          Services Proposal for {meta.client}
        </h1>
        <p className="text-[1.1em]">Joel Colombo ✦ Creative Director &amp; Design Consultant</p>
      </div>

      {/* Title block */}
      <div className="proposal-section proposal-titleblock max-w-3xl mx-auto px-6 pt-24 pb-8">
        <h1 className="font-light text-[3em] leading-[1.1] mb-4 max-md:text-[2em]">Services Proposal</h1>
        <p className="text-[1.2em] mb-2">{meta.title}</p>
        <p className="text-[1.2em] text-[var(--hover-color)] mb-8">{meta.number}</p>
        <div className="proposal-meta text-[0.95em] text-[var(--hover-color)] flex flex-col gap-1">
          {meta.requestedBy && <p>Requested by: {meta.requestedBy}</p>}
          {meta.date && <p>Date: {formatDate(meta.date)}</p>}
          {meta.version && <p>Version: {meta.version}</p>}
        </div>
      </div>

      {sections.map((section, i) => (
        <SectionRenderer
          key={`${i}-${section.title}`}
          section={section}
          pricingSlot={(p) => (
            <PricingSection
              pricing={p}
              selected={selected}
              locked={approval !== null}
              onToggle={(name) =>
                setSelected((prev) => {
                  const next = new Set(prev)
                  if (next.has(name)) next.delete(name)
                  else next.add(name)
                  return next
                })
              }
            />
          )}
        />
      ))}

      <SignatureBlocks clientName={meta.client} />

      {/* Same theme control as the site footer, bottom-left. Defaults to the system scheme. */}
      <div className="fixed bottom-4 left-5 z-[60] print:hidden">
        <ThemeToggle />
      </div>

      {!approval && pricing && (
        <ApproveBar
          totalLabel={summary ? summary.label.split(' — ')[1] : '—'}
          selectionLabel={summary ? summary.names.join(' + ') : ''}
          disabled={!summary}
          onApprove={approve}
        />
      )}
    </main>
  )
}
