import type { Span } from '@/lib/document/types'

export default function RichText({ spans }: { spans: Span[] }) {
  return (
    <>
      {spans.map((s, i) => {
        let node: React.ReactNode = s.text
        if (s.code) node = <code className="font-mono text-[0.9em] px-1 py-0.5 rounded bg-[var(--selection-bg)]">{node}</code>
        if (s.bold) node = <strong className="font-medium">{node}</strong>
        if (s.italic) node = <em>{node}</em>
        if (s.strike) node = <s>{node}</s>
        if (s.underline) node = <u>{node}</u>
        if (s.href) {
          node = (
            <a href={s.href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 decoration-[var(--hover-color)] hover:decoration-[var(--foreground)] transition-colors">
              {node}
            </a>
          )
        }
        return <span key={i}>{node}</span>
      })}
    </>
  )
}
