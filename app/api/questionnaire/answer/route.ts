import { NextResponse } from 'next/server'
import { getProjectConfig, resolveConfig } from '@/lib/questionnaire/projects'
import { markCompleted, saveAnswer } from '@/lib/questionnaire/notion'
import type { Answer } from '@/lib/questionnaire/types'

export async function POST(req: Request) {
  let body: {
    client?: string; project?: string; sessionId?: string
    questionId?: string | null; answer?: Answer | null; complete?: boolean
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }
  const { client, project, sessionId, questionId, answer, complete } = body

  if (sessionId === 'hp') return NextResponse.json({ ok: true }) // honeypot session: drop silently

  if (!client || !project || !sessionId) return NextResponse.json({ error: 'bad request' }, { status: 400 })
  if ((questionId != null) !== (answer != null)) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }
  const cfg = getProjectConfig(client, project)
  if (!cfg?.notionDatabaseId) return NextResponse.json({ error: 'not found' }, { status: 404 })

  try {
    if (questionId && answer) {
      const question = resolveConfig(cfg)
        .template.sections.flatMap((s) => s.questions)
        .find((q) => q.id === questionId)
      if (!question) return NextResponse.json({ error: 'unknown question' }, { status: 400 })
      await saveAnswer(cfg.notionDatabaseId, sessionId, question, answer)
    }
    if (complete) await markCompleted(sessionId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[questionnaire/answer]', err)
    return NextResponse.json({ error: 'notion unavailable' }, { status: 502 })
  }
}
