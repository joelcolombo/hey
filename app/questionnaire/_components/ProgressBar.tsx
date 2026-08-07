'use client'

/**
 * Thin position hairline at the top of the viewport. The numeric counter
 * lives on each question screen ("1 / 35 · Section") — single source, no
 * duplicate counts.
 */
export default function ProgressBar({ fraction }: { fraction: number }) {
  return (
    <div
      className="fixed top-0 left-0 h-[2px] bg-[var(--foreground)] transition-all duration-500 z-50"
      style={{ width: `${Math.round(Math.min(1, Math.max(0, fraction)) * 100)}%` }}
    />
  )
}
