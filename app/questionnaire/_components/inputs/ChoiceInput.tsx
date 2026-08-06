'use client'

import { useEffect, useRef } from 'react'
import type { InputProps } from './index'

export default function ChoiceInput({ question, draft, setDraft, onSubmit }: InputProps) {
  if (question.type !== 'select' && question.type !== 'multiselect') return null
  const multi = question.type === 'multiselect'
  const selected = draft?.type === 'choice' ? draft.selected : []

  // Track pending timer to prevent race conditions on re-tap within 250ms
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  // Guard to prevent stale timers from calling onSubmit after unmount/question change
  const submittedRef = useRef(false)

  // Clean up timer on unmount or question change
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [question.id])

  const toggle = (option: string) => {
    if (!multi) {
      const next = { type: 'choice' as const, selected: [option] }
      setDraft(next)
      // Clear any existing timer (re-tap replaces, never stacks)
      if (timerRef.current) clearTimeout(timerRef.current)
      // Single select: advance right away — one tap, done. Pass the value as
      // an override: state won't have re-rendered inside this timeout's closure.
      timerRef.current = setTimeout(() => {
        // Guard against stale timers calling onSubmit on unmounted or changed component
        if (!submittedRef.current) {
          submittedRef.current = true
          onSubmit(next)
        }
      }, 250)
      return
    }
    const next = selected.includes(option) ? selected.filter((o) => o !== option) : [...selected, option]
    setDraft(next.length ? { type: 'choice', selected: next } : null)
  }

  return (
    <div className="flex flex-col gap-3" role={multi ? 'group' : 'radiogroup'} aria-label={question.prompt}>
      {question.options.map((option, i) => {
        const active = selected.includes(option)
        return (
          <button
            key={option}
            type="button"
            role={multi ? 'checkbox' : 'radio'}
            aria-checked={active}
            onClick={() => toggle(option)}
            className={`text-left border rounded-2xl px-6 py-4 text-[1.2em] transition-colors ${
              active
                ? 'border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]'
                : 'border-[var(--hover-color)] hover:border-[var(--foreground)]'
            }`}
          >
            <span className="text-[0.75em] mr-3 opacity-60">{String.fromCharCode(65 + i)}</span>
            {option}
          </button>
        )
      })}
    </div>
  )
}
