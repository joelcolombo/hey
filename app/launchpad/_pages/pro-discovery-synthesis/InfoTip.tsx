'use client'

import { useEffect, useRef, useState } from 'react'

/** A small "i" that reveals a reading note on hover or tap. */
export default function InfoTip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  return (
    <span ref={ref} className="relative inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-expanded={open}
        aria-label="How to read this"
        onClick={() => setOpen((v) => !v)}
        className={`label w-[1.15rem] h-[1.15rem] inline-flex items-center justify-center border transition-colors ${
          open ? 'border-[var(--foreground)] text-[var(--foreground)]' : 'border-[var(--hover-color)] text-[var(--hover-color)]'
        }`}
        style={{ borderRadius: '50%', fontSize: '0.62rem', lineHeight: 1 }}
      >
        ?
      </button>
      {open && (
        <span
          role="note"
          className="absolute left-1/2 top-full z-30 mt-2 w-[19rem] max-w-[74vw] -translate-x-1/2 border border-[var(--hairline)] bg-[var(--background)] px-4 py-3 text-left text-[0.9rem] leading-[1.5] syn-muted text-pretty shadow-[0_8px_28px_rgba(0,0,0,0.18)]"
        >
          {text}
        </span>
      )}
    </span>
  )
}
