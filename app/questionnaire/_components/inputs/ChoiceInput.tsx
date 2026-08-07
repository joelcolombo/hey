'use client'

import type { InputProps } from './index'

export default function ChoiceInput({ question, draft, setDraft }: InputProps) {
  if (question.type !== 'select' && question.type !== 'multiselect') return null
  const multi = question.type === 'multiselect'
  const selected = draft?.type === 'choice' ? draft.selected : []

  // Selecting only marks the choice — advancing is always an explicit
  // "Next →" click (or Enter), so a mis-tap never skips the screen.
  const toggle = (option: string) => {
    if (!multi) {
      setDraft({ type: 'choice', selected: [option] })
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
