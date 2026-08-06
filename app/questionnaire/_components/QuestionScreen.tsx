'use client'

import { useEffect, useState } from 'react'
import type { Question, Section } from '@/lib/questionnaire/types'
import { renderInput, type Draft } from './inputs'

export default function QuestionScreen({
  question, section, number, total, initial, onSubmit, onSkip,
}: {
  question: Question
  section: Section
  number: number
  total: number
  initial: Draft
  onSubmit: (draft: Draft) => void
  onSkip: () => void
}) {
  const [draft, setDraft] = useState<Draft>(initial)
  useEffect(() => setDraft(initial), [question.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const submit = (override?: Draft) => onSubmit(override !== undefined ? override : draft)

  return (
    <div className="max-w-3xl mx-auto px-6 min-h-dvh flex flex-col justify-center pb-24">
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
  )
}
