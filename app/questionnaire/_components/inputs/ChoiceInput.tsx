'use client'

import type { InputProps } from './index'

export default function ChoiceInput({ question, draft, setDraft, onSubmit }: InputProps) {
  if (question.type !== 'select' && question.type !== 'multiselect') return null
  const multi = question.type === 'multiselect'
  const selected = draft?.type === 'choice' ? draft.selected : []

  const toggle = (option: string) => {
    if (!multi) {
      const next = { type: 'choice' as const, selected: [option] }
      setDraft(next)
      // Single select: advance right away — one tap, done. Pass the value as
      // an override: state won't have re-rendered inside this timeout's closure.
      setTimeout(() => onSubmit(next), 250)
      return
    }
    const next = selected.includes(option) ? selected.filter((o) => o !== option) : [...selected, option]
    setDraft(next.length ? { type: 'choice', selected: next } : null)
  }

  return (
    <div className="flex flex-col gap-3" role={multi ? 'group' : 'radiogroup'}>
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
