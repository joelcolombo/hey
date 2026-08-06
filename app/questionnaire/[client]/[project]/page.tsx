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
  return <QuestionnaireApp config={resolveConfig(cfg)} />
}
