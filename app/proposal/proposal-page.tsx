import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { isEmailAllowed, SESSION_COOKIE, verifySessionToken } from '@/lib/proposal/access'
import { fetchProposalSections, findProposalBySlug, markViewed } from '@/lib/proposal/notion'
import { toPublicMeta } from '@/lib/proposal/parse'
import './proposal.css'
import './proposal-print.css'
import EmailGate from './_components/EmailGate'
import ProposalApp from './_components/ProposalApp'

/**
 * Shared server implementation of the proposal document page, used by both
 * /proposal/[slug] and /launchpad/[client]/[item].
 */
export async function proposalMetadata(slug: string): Promise<Metadata> {
  try {
    const meta = await findProposalBySlug(slug)
    if (!meta || meta.status === 'Draft') return { robots: { index: false, follow: false } }
    return { title: `Services Proposal ✦ ${meta.client}`, robots: { index: false, follow: false } }
  } catch {
    return { robots: { index: false, follow: false } }
  }
}

function Unavailable() {
  return (
    <div className="max-w-3xl mx-auto px-6 min-h-dvh flex flex-col justify-center">
      <p className="text-[1.2em] text-[var(--hover-color)]">This proposal is temporarily unavailable. Please try again in a minute.</p>
    </div>
  )
}

export async function ProposalPageBody({
  slug,
  launchpadEmail,
  launchpadHref,
}: {
  slug: string
  launchpadEmail?: string
  launchpadHref?: string
}) {
  let meta
  try {
    meta = await findProposalBySlug(slug)
  } catch (err) {
    console.error('[proposal/page]', err)
    return <Unavailable />
  }
  if (!meta || meta.status === 'Draft') notFound()

  const secret = process.env.PROPOSAL_SESSION_SECRET
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  let session = secret && token ? verifySessionToken(token, meta.pageId, secret) : null
  // A launchpad session whose email is on this proposal's allowlist passes
  // the gate without re-entering the email.
  if (!session && launchpadEmail && isEmailAllowed(launchpadEmail, meta.allowedEmails)) {
    session = { email: launchpadEmail.trim().toLowerCase() }
    if (meta.status === 'Sent') {
      markViewed(meta.pageId).catch((err) => console.error('[proposal/page] markViewed', err))
    }
  }
  if (!session) {
    return <EmailGate slug={slug} clientName={meta.client} number={meta.number} />
  }

  let sections
  try {
    sections = await fetchProposalSections(meta.pageId)
  } catch (err) {
    console.error('[proposal/page]', err)
    return <Unavailable />
  }
  return <ProposalApp meta={toPublicMeta(meta)} sections={sections} launchpadHref={launchpadHref} />
}
