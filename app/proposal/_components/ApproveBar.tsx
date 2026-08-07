'use client'

import { useState } from 'react'

export default function ApproveBar({
  totalLabel,
  selectionLabel,
  disabled,
  onApprove,
}: {
  totalLabel: string
  selectionLabel: string
  disabled: boolean
  onApprove: () => Promise<string | null> // resolves error message or null on success
}) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confirm = async () => {
    setBusy(true)
    setError(null)
    const err = await onApprove()
    setBusy(false)
    if (err) setError(err)
  }

  return (
    <div className="proposal-approve-bar fixed bottom-0 inset-x-0 bg-[var(--background)] border-t border-[var(--hover-color)]/30 py-4">
      <div className="max-w-3xl mx-auto px-6 flex items-center gap-6 max-md:flex-col max-md:items-start max-md:gap-3 max-md:pl-10">
        {confirming ? (
          <>
            <p className="flex-1 text-[1.05em] text-balance">
              You&rsquo;re approving {selectionLabel} — {totalLabel}.
            </p>
            <div className="flex items-center gap-3">
              <button onClick={() => { setConfirming(false); setError(null) }} disabled={busy}
                className="px-6 py-3 text-[1em] text-[var(--hover-color)] hover:text-[var(--foreground)] transition-colors">
                Back
              </button>
              <button onClick={() => void confirm()} disabled={busy}
                className="border border-[var(--foreground)] rounded-full px-8 py-3 text-[1em] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors disabled:opacity-30">
                {busy ? 'Approving…' : error ? 'Retry' : 'Confirm approval'}
              </button>
            </div>
            {error && <p className="text-[0.9em] text-[var(--hover-color)] max-md:order-last">{error}</p>}
          </>
        ) : (
          <>
            <p className="flex-1 text-[1.05em]">
              Total: <span className="font-medium">{totalLabel}</span>
            </p>
            <button onClick={() => setConfirming(true)} disabled={disabled}
              className="border border-[var(--foreground)] rounded-full px-8 py-3 text-[1em] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors disabled:opacity-30 disabled:pointer-events-none">
              Approve →
            </button>
          </>
        )}
      </div>
    </div>
  )
}
