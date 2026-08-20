import type { CSSProperties, ReactNode } from 'react'
import InView from './InView'
import InfoTip from './InfoTip'

/* Shared building blocks for the synthesis page. Monochrome, editorial,
   data-ink only: the visual interest comes from structure, not decoration. */

export function Section({ title, intro, children, id }: { title: string; intro?: string; children: ReactNode; id: string }) {
  return (
    <section id={id} className="syn-section max-w-4xl mx-auto px-6 py-24 scroll-mt-20 border-t border-[var(--hairline)]">
      <div className="mb-16">
        <h2 className="font-light text-[2.4em] leading-[1.1] max-md:text-[1.8em] text-balance">{title}</h2>
        {intro && <p className="mt-5 text-[1.15em] leading-[1.55] text-[var(--hover-color)] max-w-2xl text-pretty">{intro}</p>}
      </div>
      {children}
    </section>
  )
}

export function Sub({ children }: { children: ReactNode }) {
  return <h3 className="label text-[var(--hover-color)] mt-20 mb-6 first:mt-0">{children}</h3>
}

export function Lede({ children }: { children: ReactNode }) {
  return <p className="text-[1.25em] leading-[1.5] mb-8 text-pretty">{children}</p>
}

export function Body({ children }: { children: ReactNode }) {
  return <p className="text-[1.05em] leading-[1.6] mb-4 text-pretty">{children}</p>
}

/** A reading note that follows a visual block. */
export function Note({ children }: { children: ReactNode }) {
  return <p className="text-[1.05em] leading-[1.6] syn-muted mt-10 max-w-2xl text-pretty">{children}</p>
}

export function Muted({ children }: { children: ReactNode }) {
  return <span className="syn-muted">{children}</span>
}

/** Big quotation, attributed. */
export function Quote({ text, who, compact }: { text: string; who?: string; compact?: boolean }) {
  return (
    <figure className={`syn-quote border-l border-[var(--foreground)] pl-5 ${compact ? 'py-1' : 'py-2'}`}>
      <blockquote className={`${compact ? 'text-[1.05em]' : 'text-[1.25em]'} leading-[1.5] text-pretty`}>{text}</blockquote>
      {who && <figcaption className="label text-[var(--hover-color)] mt-3">{who}</figcaption>}
    </figure>
  )
}

/** Vote tally as a dot row: filled for votes, hollow for the rest of the team. */
export function Tally({ rows, total }: { rows: ReadonlyArray<{ option: string; count: number; who: string }>; total: number }) {
  return (
    <ul className="flex flex-col">
      {rows.map((r) => (
        <InView as="li" key={r.option} className="border-t border-[var(--hairline)] last:border-b py-4">
          <div className="flex items-baseline justify-between gap-4">
            <span className={`text-[1.05em] leading-[1.35] ${r.count === 0 ? 'text-[var(--hover-color)]' : ''}`}>{r.option}</span>
            <span className="label text-[var(--hover-color)] flex-none">{r.count}<span className="opacity-60">/{total}</span></span>
          </div>
          <div className="flex items-baseline justify-between gap-4 mt-2">
            <span className="syn-dots" aria-label={`${r.count} of ${total}`}>
              {Array.from({ length: total }, (_, i) => (
                <i key={i} className={i < r.count ? 'on' : ''} style={{ ['--i' as string]: i }} />
              ))}
            </span>
            {r.who && <span className="label text-[var(--hover-color)] text-right">{r.who}</span>}
          </div>
        </InView>
      ))}
    </ul>
  )
}

/** Horizontal frequency bars in units of respondents. */
export function Bars({ rows, total }: { rows: ReadonlyArray<{ word: string; count: number; who?: string; detail?: string }>; total: number }) {
  return (
    <ul className="flex flex-col gap-5">
      {rows.map((r, i) => (
        <InView as="li" key={r.word} className="grid grid-cols-[8rem_1fr] md:grid-cols-[11rem_1fr] gap-x-5 items-start" style={{ ['--i' as string]: i } as CSSProperties}>
          <span className="text-[1.05em] leading-[1.3] pt-0.5">{r.word}</span>
          <div>
            <div className="syn-bar" style={{ ['--w' as string]: `${(r.count / total) * 100}%` }}>
              <span className="label">{r.count}<span className="text-[var(--hover-color)]">/{total}</span></span>
            </div>
            {(r.who || r.detail) && <p className="text-[0.9em] syn-muted mt-1.5 leading-[1.45]">{r.who ?? r.detail}</p>}
          </div>
        </InView>
      ))}
    </ul>
  )
}

/** Two-pole slider: hollow marker = today, filled = future, a line between.
    Track on the left, reading on the right, so each note belongs to its axis. */
export function Slider({ left, right, n, today, future, range, read }: { left: string; right: string; n: number; today: number; future: number; range: readonly [number, number]; read: string }) {
  const pct = (v: number) => ((v - 1) / 6) * 100
  const a = pct(today), b = pct(future)
  const lo = Math.min(a, b), hi = Math.max(a, b)
  return (
    <InView as="li" className="syn-slider border-t border-[var(--hairline)] last:border-b py-8">
      <div>
        <div className="flex items-baseline justify-between gap-4 text-[1.05em]">
          <span>{left}</span>
          <span className="inline-flex items-center gap-2.5">
            <span className="label text-[var(--hover-color)]">n={n}</span>
            <InfoTip text={read} />
          </span>
          <span className="text-right">{right}</span>
        </div>
        <div
          className="syn-track"
          aria-label={`${left} to ${right}: today ${today}, future ${future}`}
          style={{ ['--a' as string]: `${a}%`, ['--b' as string]: `${b}%`, ['--lo' as string]: `${lo}%`, ['--w' as string]: `${hi - lo}%` }}
        >
          <span className="syn-range" style={{ left: `${pct(range[0])}%`, width: `${pct(range[1]) - pct(range[0])}%` }} />
          <span className="syn-shift" />
          <span className="syn-today"><b>{today.toFixed(1)}</b></span>
          <span className="syn-future"><b>{future.toFixed(1)}</b></span>
        </div>
      </div>
    </InView>
  )
}

/** The slider list. Each axis observes its own viewport entry. */
export function Sliders({ children }: { children: ReactNode }) {
  return <ul className="flex flex-col">{children}</ul>
}

export function Chips({ items, tone = 'default' }: { items: ReadonlyArray<string>; tone?: 'default' | 'muted' | 'strike' }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((w) => (
        <li
          key={w}
          className={`border px-3.5 py-1.5 text-[0.95em] leading-none ${
            tone === 'strike'
              ? 'border-[var(--hairline)] text-[var(--hover-color)] line-through decoration-[var(--hover-color)]'
              : tone === 'muted'
                ? 'border-[var(--hairline)] text-[var(--hover-color)]'
                : 'border-[var(--foreground)]'
          }`}
        >
          {w}
        </li>
      ))}
    </ul>
  )
}

/** Words sized by how many people used them. */
export function WordScale({ rows, max }: { rows: ReadonlyArray<{ word: string; count: number }>; max: number }) {
  return (
    <ul className="flex flex-wrap items-baseline gap-x-7 gap-y-3 mb-8">
      {rows.map((r) => {
        const t = r.count / max
        const size = 1 + t * 2.6 // 1em to 3.6em
        return (
          <li key={r.word} className="flex items-baseline gap-2" style={{ fontSize: `${size}em`, lineHeight: 1.05 }}>
            <span className={t < 0.3 ? 'text-[var(--hover-color)]' : 'font-light'}>{r.word}</span>
            <span className="label text-[var(--hover-color)]" style={{ fontSize: '0.8rem' }}>{r.count}</span>
          </li>
        )
      })}
    </ul>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`border border-[var(--hairline)] p-6 ${className}`}>{children}</div>
}

/** Thin geometric check: hairline stroke, square caps and miter joins. */
export function Check() {
  return (
    <svg viewBox="0 0 14 14" aria-hidden className="w-[0.85em] h-[0.85em] flex-none">
      <path d="M1.5 7.5 5.5 11.5 12.5 2.5" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="butt" strokeLinejoin="miter" />
    </svg>
  )
}

export function Rule() {
  return <hr className="border-[var(--hairline)] my-10" />
}
