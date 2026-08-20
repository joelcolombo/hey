import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { LAUNCHPAD_COOKIE, readLaunchpadSession } from '@/lib/launchpad/access'
import { getItem, itemPermits } from '@/lib/launchpad/notion'
import { getProjectConfig, resolveConfig } from '@/lib/questionnaire/projects'
import QuestionnaireApp from '../../../questionnaire/_components/QuestionnaireApp'
import { ProposalPageBody, proposalMetadata } from '../../../proposal/proposal-page'
import { DocumentPageBody, documentMetadata } from '../../../document/document-page'
import { launchpadPages } from '../../_pages'

export const dynamic = 'force-dynamic'

type Params = Promise<{ client: string; item: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { client, item } = await params
  try {
    const entry = await getItem(client, item)
    if (!entry || !entry.enabled) return { robots: { index: false, follow: false } }
    if (entry.kind === 'proposal') return proposalMetadata(entry.target)
    if (entry.kind === 'document') return documentMetadata(entry.target, entry.label)
    if (entry.kind === 'page') {
      const reg = launchpadPages[entry.target]
      return { title: reg?.title ?? entry.label, robots: { index: false, follow: false } }
    }
    if (entry.kind === 'questionnaire') {
      const [qClient, qProject] = entry.target.split('/')
      const cfg = getProjectConfig(qClient, qProject)
      if (cfg) return { title: `${cfg.template.title} ✦ ${cfg.clientName}`, robots: { index: false, follow: false } }
    }
  } catch {
    // fall through
  }
  return { robots: { index: false, follow: false } }
}

export default async function LaunchpadItemPage({ params }: { params: Params }) {
  const { client, item } = await params
  const secret = process.env.PROPOSAL_SESSION_SECRET
  const token = (await cookies()).get(LAUNCHPAD_COOKIE)?.value
  const session = secret && token ? readLaunchpadSession(token, secret) : null
  if (!session || session.account !== client) redirect('/launchpad')

  const entry = await getItem(client, item)
  if (!entry || !entry.enabled || !itemPermits(entry, session.email)) notFound()

  if (entry.kind === 'proposal') {
    return <ProposalPageBody slug={entry.target} launchpadEmail={session.email} launchpadHref={`/launchpad/${client}`} />
  }

  if (entry.kind === 'page') {
    const reg = launchpadPages[entry.target]
    if (!reg) notFound()
    const { default: PageComponent } = await reg.load()
    return <PageComponent launchpadHref={`/launchpad/${client}`} />
  }

  if (entry.kind === 'document') {
    return <DocumentPageBody pageRef={entry.target} eyebrow="Document" launchpadHref={`/launchpad/${client}`} />
  }

  if (entry.kind === 'link') {
    if (!entry.target) notFound()
    redirect(entry.target)
  }

  const [qClient, qProject] = entry.target.split('/')
  const cfg = getProjectConfig(qClient, qProject)
  if (!cfg) notFound()
  if (!cfg.notionDatabaseId) {
    return (
      <div className="max-w-3xl mx-auto px-6 min-h-dvh flex flex-col justify-center">
        <p className="text-[1.2em] text-[var(--hover-color)]">This questionnaire isn&rsquo;t open yet.</p>
      </div>
    )
  }
  return (
    <QuestionnaireApp
      config={resolveConfig(cfg)}
      launchpadHref={`/launchpad/${client}`}
      launchpadEmail={session.email}
    />
  )
}
