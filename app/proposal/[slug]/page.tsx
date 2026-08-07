import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/proposal/access'
import { fetchProposalSections, findProposalBySlug } from '@/lib/proposal/notion'
import { toPublicMeta } from '@/lib/proposal/parse'
import '../proposal-print.css'
import EmailGate from '../_components/EmailGate'
import ProposalApp from '../_components/ProposalApp'

export const dynamic = 'force-dynamic'

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  try {
    const meta = await findProposalBySlug(slug)
    if (!meta || meta.status === 'Draft') return { robots: { index: false, follow: false } }
    return { title: `Services Proposal ✦ ${meta.client}`, robots: { index: false, follow: false } }
  } catch {
    return { robots: { index: false, follow: false } }
  }
}

export default async function ProposalPage({ params }: { params: Params }) {
  const { slug } = await params
  let meta
  try {
    meta = await findProposalBySlug(slug)
  } catch (err) {
    console.error('[proposal/page]', err)
    return (
      <div className="max-w-3xl mx-auto px-6 min-h-dvh flex flex-col justify-center">
        <p className="text-[1.2em] text-[var(--hover-color)]">This proposal is temporarily unavailable. Please try again in a minute.</p>
      </div>
    )
  }
  if (!meta || meta.status === 'Draft') notFound()

  const secret = process.env.PROPOSAL_SESSION_SECRET
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  const session = secret && token ? verifySessionToken(token, meta.pageId, secret) : null
  if (!session) {
    return <EmailGate slug={slug} clientName={meta.client} number={meta.number} />
  }

  let sections
  try {
    sections = await fetchProposalSections(meta.pageId)
  } catch (err) {
    console.error('[proposal/page]', err)
    return (
      <div className="max-w-3xl mx-auto px-6 min-h-dvh flex flex-col justify-center">
        <p className="text-[1.2em] text-[var(--hover-color)]">This proposal is temporarily unavailable. Please try again in a minute.</p>
      </div>
    )
  }
  return <ProposalApp meta={toPublicMeta(meta)} sections={sections} />
}
