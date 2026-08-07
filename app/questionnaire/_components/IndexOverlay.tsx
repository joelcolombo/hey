'use client'

import { motion } from 'framer-motion'
import { useEffect } from 'react'
import type { Answers, ProjectConfig } from '@/lib/questionnaire/types'

/**
 * Full-screen question index, grouped by section. Lets a stakeholder jump to
 * any question mid-form instead of walking the whole flow. Status per
 * question: answered (✓), skipped (—), untouched (·).
 */
export default function IndexOverlay({
  config, answers, seen, currentId, onNavigate, onClose,
}: {
  config: ProjectConfig
  answers: Answers
  seen: Set<string>
  currentId: string | null
  onNavigate: (questionId: string) => void
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  let n = 0
  return (
    // data-lenis-prevent: the site-wide Lenis smooth-scroll hijacks wheel
    // events for the page body — without it this fixed overlay can't scroll.
    <motion.div
      id="q-index-overlay"
      data-lenis-prevent
      className="fixed inset-0 z-[60] bg-[var(--background)] overflow-y-auto"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-[1.8em]">Index</h2>
          <button onClick={onClose}
            className="label border border-[var(--hover-color)] rounded-full px-2.5 py-0.5 hover:bg-[var(--foreground)] hover:text-[var(--background)] hover:border-[var(--foreground)] transition-colors">
            Close
          </button>
        </div>

        {config.template.sections.map((section, si) => (
          <div key={section.id} className="mb-10">
            <p className="label text-[var(--hover-color)] mb-4">
              Section {si + 1} · {section.title}
            </p>
            <div className="flex flex-col gap-2">
              {section.questions.map((question) => {
                n += 1
                const number = n
                const answered = !!answers[question.id]
                const skipped = !answered && seen.has(question.id)
                const current = question.id === currentId
                return (
                  <button
                    key={question.id}
                    onClick={() => onNavigate(question.id)}
                    className={`flex items-baseline gap-3 text-left group ${
                      current ? 'text-[var(--foreground)]' : 'text-[var(--hover-color)] hover:text-[var(--foreground)]'
                    } transition-colors`}
                  >
                    <span className="text-[0.8em] tabular-nums w-7 shrink-0">{number}</span>
                    <span className="text-[1em] leading-[1.35] flex-1">{question.prompt}</span>
                    <span className="text-[0.8em] shrink-0" aria-label={answered ? 'answered' : skipped ? 'skipped' : 'unanswered'}>
                      {answered ? '✓' : skipped ? '—' : '·'}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
