'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { Milestone } from '@/lib/proposal/types'

export default function ApproveBar({
  totalLabel,
  selectedMilestones,
  disabled,
  onApprove,
}: {
  totalLabel: string
  selectedMilestones: Milestone[]
  disabled: boolean
  onApprove: () => Promise<string | null> // resolves error message or null on success
}) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Lock the document scroll while the sheet is open.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const confirm = async () => {
    setBusy(true)
    setError(null)
    const err = await onApprove()
    setBusy(false)
    if (err) setError(err)
  }

  return (
    <>
      {/* Idle bar */}
      <div className="proposal-approve-bar fixed bottom-0 inset-x-0 bg-[var(--background)] border-t border-[var(--hover-color)]/30 py-4 z-[70]">
        <div className="max-w-3xl mx-auto px-6 flex items-center gap-6 max-md:pl-14">
          <p className="flex-1 text-[1.05em]">
            Total: <span className="font-medium">{totalLabel}</span>
          </p>
          <button onClick={() => setOpen(true)} disabled={disabled}
            className="border border-[var(--foreground)] rounded-full px-8 py-3 text-[1em] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors disabled:opacity-30 disabled:pointer-events-none">
            Review →
          </button>
        </div>
      </div>

      {/* Review sheet — the bar expanded over the document */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
            data-lenis-prevent
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            className="proposal-approve-bar fixed inset-0 z-[80] bg-[var(--background)] overflow-y-auto overscroll-contain"
          >
            <div className="max-w-3xl mx-auto px-6 min-h-dvh flex flex-col justify-center py-16">
              <h1 className="font-light text-[3em] leading-[1.1] mb-10 max-md:text-[2em] text-balance">
                Review Your Selection
              </h1>

              <div className="mb-2">
                {selectedMilestones.map((m) => (
                  <div key={m.name} className="flex items-baseline gap-4 py-2.5">
                    <span className="flex-none basis-[38%] max-md:basis-auto max-md:flex-1 text-[1.05em]">{m.name}</span>
                    <span className="flex-none basis-[18%] max-md:basis-auto text-[1.05em]">{m.priceLabel}</span>
                    <span className="text-[1.05em] text-[var(--hover-color)] max-md:hidden">{m.timeline}</span>
                  </div>
                ))}
                <div className="w-[calc(56%+1rem)] max-md:w-full border-t border-[var(--hover-color)]/30 mt-2" />
                <div className="flex items-baseline gap-4 py-2.5">
                  <span className="flex-none basis-[38%] max-md:basis-auto max-md:flex-1 text-[1.05em] font-medium">Total</span>
                  <span className="text-[1.05em] font-medium">{totalLabel}</span>
                </div>
              </div>

              <p className="text-[1.05em] leading-[1.6] text-[var(--hover-color)] mt-8 mb-12 max-w-xl">
                Approving sends this to Joel. The formal agreement will follow via
                DocuSign for signature. Nothing is binding until you sign there.
              </p>

              <div className="flex items-center gap-4">
                <button onClick={() => void confirm()} disabled={busy}
                  className="border border-[var(--foreground)] rounded-full px-8 py-3 text-[1.05em] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors disabled:opacity-30">
                  {busy ? 'Approving…' : error ? 'Retry' : 'Approve →'}
                </button>
                <button onClick={() => { setOpen(false); setError(null) }} disabled={busy}
                  className="px-4 py-3 text-[1.05em] text-[var(--hover-color)] hover:text-[var(--foreground)] transition-colors">
                  Back
                </button>
              </div>
              {error && <p className="text-[0.95em] text-[var(--hover-color)] mt-4">{error}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
