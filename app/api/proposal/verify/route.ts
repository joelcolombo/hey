import { NextResponse } from 'next/server'
import { createSessionToken, isEmailAllowed, SESSION_COOKIE, SESSION_TTL_MS } from '@/lib/proposal/access'
import { findProposalBySlug, markViewed } from '@/lib/proposal/notion'

export async function POST(req: Request) {
  let body: { slug?: string; email?: string; website?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }
  const { slug, email, website } = body

  // Honeypot: pretend success, set nothing.
  if (website) return NextResponse.json({ ok: true })

  if (!slug || !email?.includes('@')) return NextResponse.json({ error: 'bad request' }, { status: 400 })
  const secret = process.env.PROPOSAL_SESSION_SECRET
  if (!secret) {
    console.error('[proposal/verify] Missing PROPOSAL_SESSION_SECRET')
    return NextResponse.json({ error: 'unavailable' }, { status: 502 })
  }

  try {
    const meta = await findProposalBySlug(slug)
    if (!meta || meta.status === 'Draft') return NextResponse.json({ error: 'not found' }, { status: 404 })
    if (!isEmailAllowed(email, meta.allowedEmails)) {
      return NextResponse.json({ error: 'not allowed' }, { status: 403 })
    }
    if (meta.status === 'Sent') {
      // First verified access: Sent → Viewed. Best-effort; never blocks entry.
      markViewed(meta.pageId).catch((err) => console.error('[proposal/verify] markViewed', err))
    }
    const res = NextResponse.json({ ok: true })
    res.cookies.set(SESSION_COOKIE, createSessionToken(meta.pageId, email, secret), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_TTL_MS / 1000,
    })
    return res
  } catch (err) {
    console.error('[proposal/verify]', err)
    return NextResponse.json({ error: 'notion unavailable' }, { status: 502 })
  }
}
