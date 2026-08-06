import { NextResponse } from 'next/server'
import { getProjectConfig, resolveConfig } from '@/lib/questionnaire/projects'
import { createRow, findRow } from '@/lib/questionnaire/notion'

export async function POST(req: Request) {
  let body: { client?: string; project?: string; name?: string; email?: string; website?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }
  const { client, project, name, email, website } = body

  // Honeypot: pretend success, save nothing.
  if (website) return NextResponse.json({ sessionId: 'hp', answers: {}, completed: false })

  if (!client || !project || !name?.trim() || !email?.includes('@')) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }
  const cfg = getProjectConfig(client, project)
  if (!cfg?.notionDatabaseId) return NextResponse.json({ error: 'not found' }, { status: 404 })

  try {
    const template = resolveConfig(cfg).template
    const existing = await findRow(cfg.notionDatabaseId, email, template)
    if (existing) {
      return NextResponse.json({ sessionId: existing.pageId, answers: existing.answers, completed: existing.completed })
    }
    const pageId = await createRow(cfg.notionDatabaseId, name.trim(), email)
    return NextResponse.json({ sessionId: pageId, answers: {}, completed: false })
  } catch (err) {
    console.error('[questionnaire/session]', err)
    return NextResponse.json({ error: 'notion unavailable' }, { status: 502 })
  }
}
