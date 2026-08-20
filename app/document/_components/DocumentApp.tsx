import type { HeadingBlock, NotionDocument } from '@/lib/document/types'
import Blocks, { headingId } from './Blocks'

function formatDate(iso: string): string {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function DocumentApp({
  doc,
  eyebrow,
  launchpadHref,
}: {
  doc: NotionDocument
  eyebrow?: string
  launchpadHref?: string
}) {
  const toc = doc.blocks
    .filter((b): b is HeadingBlock => b.kind === 'h1')
    .map((b) => ({ id: headingId(b.spans), text: b.spans.map((s) => s.text).join('') }))
  const updated = formatDate(doc.lastEdited)

  return (
    <main className="pb-32">
      {launchpadHref && (
        <a
          href={launchpadHref}
          className="fixed top-4 left-5 z-[70] bg-[var(--background)] border border-[var(--hairline)] rounded-full px-2.5 py-0.5 label text-[color-mix(in_srgb,var(--foreground)_80%,transparent)] hover:border-[var(--foreground)] hover:text-[var(--foreground)] transition-colors print:hidden"
        >
          Launchpad
        </a>
      )}
      <article className="max-w-3xl mx-auto px-6 pt-24">
        <header className="mb-16">
          {eyebrow && <p className="label text-[var(--hover-color)] mb-4">{eyebrow}</p>}
          <h1 className="font-light text-[3em] leading-[1.1] mb-6 max-md:text-[2em] text-balance">{doc.title}</h1>
          {updated && <p className="text-[0.95em] text-[var(--hover-color)]">Last updated: {updated}</p>}
        </header>
        <Blocks blocks={doc.blocks} toc={toc} />
      </article>
    </main>
  )
}
