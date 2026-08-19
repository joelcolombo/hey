'use client'

import { createElement, useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from 'react'

/**
 * Marks itself with data-in once it scrolls into view; CSS does the rest.
 * Renders as `as` (default div) so rows and list items can each observe
 * their own entry instead of animating as one block.
 */
export default function InView({
  as = 'div',
  children,
  className = '',
  style,
}: {
  as?: ElementType
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      el.dataset.in = 'true'
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.dataset.in = 'true'
            io.disconnect()
          }
        }
      },
      { threshold: 0.3, rootMargin: '0px 0px -6% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return createElement(as, { ref, className, style }, children)
}
