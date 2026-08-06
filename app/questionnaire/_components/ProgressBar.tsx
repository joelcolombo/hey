'use client'

export default function ProgressBar({ answered, total }: { answered: number; total: number }) {
  return (
    <>
      <div className="fixed top-0 left-0 h-[2px] bg-[var(--foreground)] transition-all duration-500 z-50"
        style={{ width: `${Math.round((answered / Math.max(total, 1)) * 100)}%` }} />
      <div className="fixed top-4 right-5 text-[0.8em] text-[var(--hover-color)] z-50">
        {answered} / {total}
      </div>
    </>
  )
}
