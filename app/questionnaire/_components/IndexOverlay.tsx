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

  const overlayVariants = {
    hidden: { opacity: 0, y: 12, transition: { duration: 0.18, ease: 'easeIn' as const, staggerChildren: 0.015, staggerDirection: -1 } },
    show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' as const, staggerChildren: 0.045, delayChildren: 0.05 } },
  }
  const sectionVariants = {
    hidden: { opacity: 0, y: 8, transition: { duration: 0.12 } },
    show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' as const } },
  }

  let n = 0
  return (
    // The site-wide Lenis smooth-scroll (root mode) hijacks wheel/touch on
    // window — this old version ignores data-lenis-prevent, so stop the
    // events from bubbling out of the overlay and let it scroll natively.
    <motion.div
      id="q-index-overlay"
      data-lenis-prevent
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      className="fixed inset-0 z-[60] bg-[var(--background)] overflow-y-auto overscroll-contain"
      variants={overlayVariants}
      initial="hidden"
      animate="show"
      exit="hidden"
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
          <motion.div key={section.id} variants={sectionVariants} className="mb-10">
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
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
