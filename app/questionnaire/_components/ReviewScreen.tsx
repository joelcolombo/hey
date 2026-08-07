'use client'

import { useState } from 'react'
import { summarizeAnswer } from '@/lib/questionnaire/flow'
import type { ProjectConfig } from '@/lib/questionnaire/types'
import type { Questionnaire } from './useQuestionnaire'

export default function ReviewScreen({ config, q }: { config: ProjectConfig; q: Questionnaire }) {
  const [submitting, setSubmitting] = useState(false)

  return (
    <div className="max-w-3xl mx-auto px-6 py-24">
      <h2 className="text-[2.6em] leading-[1.1] mb-3 max-md:text-[1.8em]">Almost done.</h2>
      <p className="text-[1.1em] text-[var(--hover-color)] mb-12">
        Review your answers — tap any to edit. Everything is already saved.
      </p>

      <div className="flex flex-col gap-8 mb-16">
        {config.template.sections.map((section) => (
          <div key={section.id}>
            <h3 className="text-[0.85em] uppercase tracking-wide text-[var(--hover-color)] mb-3">{section.title}</h3>
            <div className="flex flex-col gap-4">
              {section.questions.map((question) => {
                const answer = q.answers[question.id]
                return (
                  <button key={question.id} onClick={() => q.goToQuestion(question.id)}
                    className="text-left group">
                    <p className="text-[1em] mb-1 group-hover:text-[var(--hover-color)] transition-colors">{question.prompt}</p>
                    <p className="text-[0.95em] text-[var(--hover-color)] whitespace-pre-wrap">
                      {answer ? summarizeAnswer(question, answer) : '— skipped'}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          setSubmitting(true)
          void q.complete()
        }}
        disabled={submitting}
        className="border border-[var(--foreground)] rounded-full px-10 py-4 text-[1.2em] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors disabled:opacity-40">
        {submitting ? 'Submitting…' : 'Submit questionnaire →'}
      </button>
    </div>
  )
}
