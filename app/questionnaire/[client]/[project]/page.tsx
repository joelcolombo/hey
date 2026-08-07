import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProjectConfig, resolveConfig } from '@/lib/questionnaire/projects'
import QuestionnaireApp from '../../_components/QuestionnaireApp'

type Params = Promise<{ client: string; project: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { client, project } = await params
  const cfg = getProjectConfig(client, project)
  if (!cfg) return { robots: { index: false, follow: false } }
  return {
    title: `${cfg.projectTitle} · ${cfg.clientName}`,
    robots: { index: false, follow: false },
  }
}

export default async function QuestionnairePage({ params }: { params: Params }) {
  const { client, project } = await params
  const cfg = getProjectConfig(client, project)
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
