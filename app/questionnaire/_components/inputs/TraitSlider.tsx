'use client'

import { useEffect, useRef } from 'react'
import { SLIDER_STEPS, type TraitSliderDef } from '@/lib/questionnaire/types'

export type SliderValue = { single?: number; today?: number; future?: number }

const pct = (v: number) => `${((v - 1) / (SLIDER_STEPS - 1)) * 100}%`

export default function TraitSlider({
  def, mode, value, onChange,
}: {
  def: TraitSliderDef
  mode: 'single' | 'dual'
  value: SliderValue
  onChange: (v: SliderValue) => void
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef<'single' | 'today' | 'future' | null>(null)
  // In-flight drag teardown — set while a pointer is down, cleared on
  // pointerup. Lets the unmount effect below cancel a drag interrupted by
  // navigation instead of leaking window listeners.
  const cleanupRef = useRef<(() => void) | null>(null)

  const positionFromPointer = (clientX: number) => {
    const el = trackRef.current
    if (!el) return 4
    const r = el.getBoundingClientRect()
    const t = Math.min(1, Math.max(0, (clientX - r.left) / r.width))
    return Math.round(t * (SLIDER_STEPS - 1)) + 1
  }

  const single = value.single ?? 4
  const today = value.today ?? 4
  const future = value.future ?? 4

  const grab = (clientX: number): 'single' | 'today' | 'future' => {
    if (mode === 'single') return 'single'
    const p = positionFromPointer(clientX)
    return Math.abs(p - today) <= Math.abs(p - future) ? 'today' : 'future'
  }

  const apply = (thumb: 'single' | 'today' | 'future', p: number) => {
    if (thumb === 'single') onChange({ single: p })
    else if (thumb === 'today') onChange({ today: p, future })
    else onChange({ today, future: p })
  }

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    const thumb = grab(e.clientX)
    draggingRef.current = thumb
    apply(thumb, positionFromPointer(e.clientX))
    const move = (ev: PointerEvent) => {
      if (draggingRef.current) apply(draggingRef.current, positionFromPointer(ev.clientX))
    }
    const up = () => {
      draggingRef.current = null
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      cleanupRef.current = null
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    cleanupRef.current = up
  }

  // Deviation from brief: the brief's pointerdown handler never tears down
  // its window listeners if the component unmounts mid-drag. QuestionnaireApp
  // remounts the input per screen (keyed motion.div), so navigating away
  // (e.g. a fast Back) while a thumb is held down would otherwise leave
  // pointermove/pointerup listeners attached to window indefinitely, firing
  // onChange against a gone component instance until the next stray
  // pointerup anywhere on the page. Cancel the drag on unmount instead.
  useEffect(() => {
    return () => {
      cleanupRef.current?.()
    }
  }, [])

  const onThumbKey = (thumb: 'single' | 'today' | 'future', current: number) => (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') apply(thumb, Math.max(1, current - 1))
    if (e.key === 'ArrowRight') apply(thumb, Math.min(SLIDER_STEPS, current + 1))
  }

  const thumbBase =
    'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full transition-[left] duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--hover-color)] touch-none'

  return (
    <div className="py-3">
      <div className="flex justify-between text-[0.85em] mb-2">
        <span>{def.left}</span>
        <span>{def.right}</span>
      </div>
      <div ref={trackRef} onPointerDown={onPointerDown} className="relative h-8 cursor-pointer touch-none">
        <div className="absolute top-1/2 left-0 right-0 h-px bg-[var(--hover-color)]" />
        {Array.from({ length: SLIDER_STEPS }, (_, i) => (
          <div key={i} className="absolute top-1/2 -translate-y-1/2 w-[3px] h-[3px] rounded-full bg-[var(--hover-color)]"
            style={{ left: pct(i + 1) }} />
        ))}
        {mode === 'single' ? (
          <div
            role="slider" tabIndex={0} aria-label={`${def.left} to ${def.right}`}
            aria-valuemin={1} aria-valuemax={SLIDER_STEPS} aria-valuenow={single}
            onKeyDown={onThumbKey('single', single)}
            className={`${thumbBase} bg-[var(--foreground)]`} style={{ left: pct(single) }} />
        ) : (
          <>
            <div
              role="slider" tabIndex={0} aria-label={`${def.left} to ${def.right} — today`}
              aria-valuemin={1} aria-valuemax={SLIDER_STEPS} aria-valuenow={today}
              onKeyDown={onThumbKey('today', today)}
              className={`${thumbBase} border-2 border-[var(--foreground)] bg-[var(--background)]`}
              style={{ left: pct(today) }} />
            <div
              role="slider" tabIndex={0} aria-label={`${def.left} to ${def.right} — where you want to be`}
              aria-valuemin={1} aria-valuemax={SLIDER_STEPS} aria-valuenow={future}
              onKeyDown={onThumbKey('future', future)}
              className={`${thumbBase} bg-[var(--foreground)]`} style={{ left: pct(future) }} />
          </>
        )}
      </div>
    </div>
  )
}
