import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { fetchDocument, pageIdFromRef } from '@/lib/document/notion'
import './document.css'
import DocumentApp from './_components/DocumentApp'

/**
 * Shared server implementation for Launchpad items of kind Document: a
 * read-only rendering of any Notion page the integration can see. Access is
 * decided by the caller (launchpad session + item allowlist).
 */
export async function documentMetadata(pageRef: string, label: string): Promise<Metadata> {
  const pageId = pageIdFromRef(pageRef)
  if (!pageId) return { robots: { index: false, follow: false } }
  try {
    const doc = await fetchDocument(pageId)
    return { title: `${doc.title || label} ✦ Joel Colombo`, robots: { index: false, follow: false } }
  } catch {
    return { title: `${label} ✦ Joel Colombo`, robots: { index: false, follow: false } }
  }
}

function Unavailable() {
  return (
    <div className="max-w-3xl mx-auto px-6 min-h-dvh flex flex-col justify-center">
      <p className="text-[1.2em] text-[var(--hover-color)]">This document is temporarily unavailable. Please try again in a minute.</p>
    </div>
  )
}

export async function DocumentPageBody({
  pageRef,
  eyebrow,
  launchpadHref,
}: {
  pageRef: string
  eyebrow?: string
  launchpadHref?: string
}) {
  const pageId = pageIdFromRef(pageRef)
  if (!pageId) notFound()
  let doc
  try {
    doc = await fetchDocument(pageId)
  } catch (err) {
    console.error('[document/page]', err)
    return <Unavailable />
  }
  return <DocumentApp doc={doc} eyebrow={eyebrow} launchpadHref={launchpadHref} />
}
