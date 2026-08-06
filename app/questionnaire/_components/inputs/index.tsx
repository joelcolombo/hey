'use client'

import { useEffect, useRef } from 'react'
import type { Answer, Question } from '@/lib/questionnaire/types'
import ChoiceInput from './ChoiceInput'
import SlidersInput from './SlidersInput'
import VoiceInput from './VoiceInput'

export type Draft = Answer | null

export interface InputProps {
  question: Question
  draft: Draft
  setDraft: (d: Draft) => void
  /**
   * Submit (Continue / Cmd+Enter). Pass an override when submitting in the
   * same tick as a setDraft — state hasn't re-rendered yet (e.g. select
   * auto-advance), so the parent would otherwise read a stale draft.
   */
  onSubmit: (override?: Draft) => void
}

function TextInput({ question, draft, setDraft, onSubmit }: InputProps) {
  const value = draft?.type === 'text' ? draft.text : ''
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => ref.current?.focus(), [question.id])
  return (
    <input
      ref={ref}
      type="text"
      value={value}
      placeholder={question.type === 'text' ? question.placeholder ?? 'Type your answer…' : 'Type your answer…'}
      onChange={(e) => setDraft(e.target.value ? { type: 'text', text: e.target.value } : null)}
      onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
      className="w-full bg-transparent border-b border-[var(--foreground)] py-3 text-[1.5em] outline-none placeholder:text-[var(--hover-color)]"
    />
  )
}

export function LongTextInput({ question, draft, setDraft, onSubmit }: InputProps) {
  const value = draft?.type === 'text' ? draft.text : ''
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => ref.current?.focus(), [question.id])
  // Auto-grow.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 320)}px`
  }, [value])
  return (
    <div>
      <textarea
        ref={ref}
        value={value}
        rows={2}
        placeholder={question.type === 'longtext' ? question.placeholder ?? 'Type — or talk — your answer…' : ''}
        onChange={(e) => setDraft(e.target.value ? { type: 'text', text: e.target.value } : null)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onSubmit()
        }}
        className="w-full resize-none bg-transparent border-b border-[var(--foreground)] py-3 text-[1.5em] leading-[1.3] outline-none placeholder:text-[var(--hover-color)]"
      />
      <div className="mt-4">
        <VoiceInput
          onTranscript={(text) =>
            setDraft({ type: 'text', text: value ? `${value.trim()} ${text}` : text })
          }
        />
      </div>
    </div>
  )
}

/** Single dispatch point — exhaustive over Question['type']. */
export function renderInput(props: InputProps) {
  switch (props.question.type) {
    case 'text':
      return <TextInput {...props} />
    case 'longtext':
      return <LongTextInput {...props} />
    case 'select':
    case 'multiselect':
      return <ChoiceInput {...props} />
    case 'trait-slider':
    case 'dual-slider':
    case 'sliders-group':
      return <SlidersInput {...props} />
  }
}
