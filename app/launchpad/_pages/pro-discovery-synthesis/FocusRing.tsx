'use client'

import { useEffect } from 'react'

/**
 * Ported from formform.co: randomize where the focus ring's conic gradient
 * starts on every focus, so the animated mesh appears in a different palette
 * color each time. Only the seed angle changes; CSS keeps rotating from there.
 */
export default function FocusRing() {
  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      const el = e.target as HTMLElement | null
      if (!el) return
      el.style.setProperty('--focus-seed', `${Math.floor(Math.random() * 360)}deg`)
    }
    document.addEventListener('focusin', onFocusIn)
    return () => document.removeEventListener('focusin', onFocusIn)
  }, [])
  return null
}
