'use client'

/** Inline autosave status; the parent decides where it sits on screen. */
export default function SaveIndicator({ state }: { state: 'idle' | 'saving' | 'pending' }) {
  const label = state === 'saving' ? 'Saving…' : state === 'pending' ? 'Offline, will retry' : 'Saved'
  return (
    <span className="text-[0.75em] text-[var(--hover-color)]" aria-live="polite">
      {label}
    </span>
  )
}
