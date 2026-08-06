'use client'

export default function SaveIndicator({ state }: { state: 'idle' | 'saving' | 'pending' }) {
  const label = state === 'saving' ? 'Saving…' : state === 'pending' ? 'Offline — will retry' : 'Saved'
  return (
    <div className="fixed bottom-4 left-5 text-[0.75em] text-[var(--hover-color)] z-50" aria-live="polite">
      {label}
    </div>
  )
}
