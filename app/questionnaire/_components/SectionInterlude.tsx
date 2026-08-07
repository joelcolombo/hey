'use client'

import { useEffect } from 'react'
import type { Section } from '@/lib/questionnaire/types'

export default function SectionInterlude({
  section, sectionIndex, onContinue,
}: { section: Section; sectionIndex: number; onContinue: () => void }) {
  // Enter advances past the section cover. Skip when a button has focus —
  // native Enter-on-button already fires the click.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return
      if (document.getElementById('q-index-overlay')) return
      const t = e.target as HTMLElement
      if (t.tagName === 'BUTTON' || t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return
      onContinue()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onContinue])

  return (
    <div className="max-w-3xl mx-auto px-6 min-h-dvh flex flex-col justify-center">
      <p className="text-[0.9em] text-[var(--hover-color)] mb-4">Section {sectionIndex + 1}</p>
      <h2 className="text-[3em] leading-[1.1] mb-8 max-md:text-[2em]">{section.title}</h2>
      {section.intro && <p className="text-[1.2em] text-[var(--hover-color)] mb-8">{section.intro}</p>}
      <button onClick={onContinue}
        className="self-start border border-[var(--foreground)] rounded-full px-8 py-3 text-[1.1em] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors">
        Continue →
      </button>
    </div>
  )
}
