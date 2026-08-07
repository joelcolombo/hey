'use client'

import type { TraitSliderDef } from '@/lib/questionnaire/types'
import TraitSlider, { type SliderValue } from './TraitSlider'
import type { InputProps } from './index'

export default function SlidersInput({ question, draft, setDraft }: InputProps) {
  if (question.type !== 'trait-slider' && question.type !== 'dual-slider' && question.type !== 'sliders-group')
    return null

  const sliders: TraitSliderDef[] = question.type === 'sliders-group' ? question.sliders : [question.slider]
  const dual = question.type === 'dual-slider' || (question.type === 'sliders-group' && question.mode === 'dual')

  const valueFor = (id: string): SliderValue => {
    if (dual) {
      const p = draft?.type === 'dual-scale' ? draft.positions[id] : undefined
      return { today: p?.today ?? 4, future: p?.future ?? 4 }
    }
    return { single: draft?.type === 'scale' ? draft.positions[id] ?? 4 : 4 }
  }

  const update = (id: string, v: SliderValue) => {
    if (dual) {
      const positions = draft?.type === 'dual-scale' ? { ...draft.positions } : {}
      positions[id] = { today: v.today ?? 4, future: v.future ?? 4 }
      setDraft({ type: 'dual-scale', positions })
    } else {
      const positions = draft?.type === 'scale' ? { ...draft.positions } : {}
      positions[id] = v.single ?? 4
      setDraft({ type: 'scale', positions })
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {dual && (
        <div className="flex items-center gap-5 text-[0.8em] text-[var(--hover-color)] mb-2">
          <span className="inline-flex items-center gap-2">
            <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-[var(--foreground)]" /> Today
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-block w-3.5 h-3.5 rounded-full bg-[var(--foreground)]" /> Where you want to be
          </span>
        </div>
      )}
      {sliders.map((s) => (
        <TraitSlider key={s.id} def={s} mode={dual ? 'dual' : 'single'} value={valueFor(s.id)} onChange={(v) => update(s.id, v)} />
      ))}
    </div>
  )
}
