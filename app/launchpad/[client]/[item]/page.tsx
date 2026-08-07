import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getItem } from '@/lib/launchpad/config'
import { getProjectConfig, resolveConfig } from '@/lib/questionnaire/projects'
import QuestionnaireApp from '../../../questionnaire/_components/QuestionnaireApp'
import { ProposalPageBody, proposalMetadata } from '../../../proposal/proposal-page'

export const dynamic = 'force-dynamic'

type Params = Promise<{ client: string; item: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { client, item } = await params
  const entry = getItem(client, item)
  if (!entry) return { robots: { index: false, follow: false } }
  if (entry.kind === 'proposal') return proposalMetadata(entry.slug)
  const cfg = getProjectConfig(entry.client, entry.project)
  if (!cfg) return { robots: { index: false, follow: false } }
  return {
    title: `${cfg.template.title} ✦ ${cfg.clientName}`,
    robots: { index: false, follow: false },
  }
}

export default async function LaunchpadItemPage({ params }: { params: Params }) {
  const { client, item } = await params
  const entry = getItem(client, item)
  if (!entry) notFound()

  if (entry.kind === 'proposal') {
    return <ProposalPageBody slug={entry.slug} />
  }

  const cfg = getProjectConfig(entry.client, entry.project)
  if (!cfg) notFound()
  if (!cfg.notionDatabaseId) {
    return (
      <div className="max-w-3xl mx-auto px-6 min-h-dvh flex flex-col justify-center">
        <p className="text-[1.2em] text-[var(--hover-color)]">This questionnaire isn&rsquo;t open yet.</p>
      </div>
    )
  }
  return <QuestionnaireApp config={resolveConfig(cfg)} />
}
