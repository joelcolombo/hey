'use client'

import { useEffect, useRef, useState } from 'react'
import type { Question, Section } from '@/lib/questionnaire/types'
import { renderInput, type Draft } from './inputs'

export default function QuestionScreen({
  question, section, number, total, initial, onSubmit, onSkip, onBackToReview,
}: {
  question: Question
  section: Section
  number: number
  total: number
  initial: Draft
  onSubmit: (draft: Draft) => void
  onSkip: () => void
  /** Present when this question was reached by tapping it on the review screen. */
  onBackToReview?: () => void
}) {
  const [draft, setDraft] = useState<Draft>(initial)
  useEffect(() => setDraft(initial), [question.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const submit = (override?: Draft) => onSubmit(override !== undefined ? override : draft)

  // Enter submits on screens whose input doesn't consume it (sliders,
  // selects). Text inputs handle Enter themselves; textarea keeps Enter for
  // newlines (Cmd/Ctrl+Enter submits); focused buttons already click on Enter.
  const submitRef = useRef(() => {})
  submitRef.current = () => {
    if (draft) submit()
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return
      const t = e.target as HTMLElement
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'BUTTON' || t.isContentEditable) return
      submitRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    // `my-auto` on the inner wrapper centers short screens but — unlike
    // `justify-center` — collapses gracefully when content is taller than the
    // viewport (e.g. the 10-slider Brand Personality group), keeping the title
    // reachable with consistent top padding.
    <div className="max-w-3xl mx-auto px-6 min-h-dvh flex flex-col">
      <div className="my-auto pt-20 pb-24">
        {onBackToReview && (
          <button onClick={onBackToReview}
            className="text-[0.85em] text-[var(--hover-color)] hover:text-[var(--foreground)] transition-colors mb-6 block">
            ← Back to review
          </button>
        )}
        <p className="text-[0.85em] text-[var(--hover-color)] mb-3">
          {number} / {total} · {section.title}
        </p>
        <h2 className="text-[2.2em] leading-[1.15] mb-3 max-md:text-[1.5em]">{question.prompt}</h2>
        {question.hint && <p className="text-[1em] text-[var(--hover-color)] mb-6">{question.hint}</p>}

        <div className="mb-10 mt-4">{renderInput({ question, draft, setDraft, onSubmit: submit })}</div>

        <div className="flex items-center gap-6">
          <button onClick={() => submit()} disabled={!draft}
            className="border border-[var(--foreground)] rounded-full px-8 py-3 text-[1.1em] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors disabled:opacity-30 disabled:pointer-events-none">
            OK →
          </button>
          <button onClick={onSkip} className="text-[0.9em] text-[var(--hover-color)] hover:text-[var(--foreground)] transition-colors">
            Skip
          </button>
        </div>
      </div>
    </div>
  )
}
