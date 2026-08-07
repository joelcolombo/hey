import { NextResponse } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/proposal/access'
import { computeApprovalSummary } from '@/lib/proposal/parse'
import { fetchProposalSections, findProposalBySlug, recordApproval } from '@/lib/proposal/notion'
import { notifyApproval } from '@/lib/proposal/notify'

export async function POST(req: Request) {
  let body: { slug?: string; selected?: string[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }
  const { slug, selected } = body
  if (!slug || !Array.isArray(selected)) return NextResponse.json({ error: 'bad request' }, { status: 400 })
  const secret = process.env.PROPOSAL_SESSION_SECRET
  if (!secret) return NextResponse.json({ error: 'unavailable' }, { status: 502 })

  try {
    const meta = await findProposalBySlug(slug)
    if (!meta || meta.status === 'Draft') return NextResponse.json({ error: 'not found' }, { status: 404 })

    const cookie = req.headers.get('cookie') ?? ''
    const token = cookie.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`))?.[1]
    const session = token ? verifySessionToken(decodeURIComponent(token), meta.pageId, secret) : null
    if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    // Idempotent: first approval wins; repeats return the existing record.
    if (meta.status === 'Approved') {
      return NextResponse.json({
        ok: true,
        alreadyApproved: true,
        approvedBy: meta.approvedBy,
        approvedAt: meta.approvedAt,
        summaryLabel: meta.approvedMilestones,
      })
    }

    // Recompute server-side from the live pricing table — never trust client totals.
    const sections = await fetchProposalSections(meta.pageId)
    const pricing = sections.flatMap((s) => s.blocks).find((b) => b.kind === 'pricing')
    if (!pricing || pricing.kind !== 'pricing') return NextResponse.json({ error: 'no pricing' }, { status: 400 })
    const summary = computeApprovalSummary(pricing.pricing, selected)
    if (!summary) return NextResponse.json({ error: 'empty selection' }, { status: 400 })

    await recordApproval(meta.pageId, session.email, summary.label)
    await notifyApproval({
      client: meta.client,
      title: meta.title,
      number: meta.number,
      approvedBy: session.email,
      summaryLabel: summary.label,
      pageId: meta.pageId,
    })
    return NextResponse.json({
      ok: true,
      alreadyApproved: false,
      approvedBy: session.email,
      approvedAt: new Date().toISOString(),
      summaryLabel: summary.label,
    })
  } catch (err) {
    console.error('[proposal/approve]', err)
    return NextResponse.json({ error: 'notion unavailable' }, { status: 502 })
  }
}
