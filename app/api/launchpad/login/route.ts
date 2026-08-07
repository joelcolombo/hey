import { NextResponse } from 'next/server'
import { SESSION_TTL_MS } from '@/lib/proposal/access'
import { createLaunchpadToken, LAUNCHPAD_COOKIE } from '@/lib/launchpad/access'
import { verifyLogin } from '@/lib/launchpad/notion'

export async function POST(req: Request) {
  let body: { email?: string; code?: string; website?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }
  const { email, code, website } = body

  // Honeypot: pretend success, set nothing.
  if (website) return NextResponse.json({ ok: true, account: 'hp' })

  if (!email?.includes('@') || !code?.trim()) {
    return NextResponse.json({ error: 'bad request' }, { status: 400 })
  }
  const secret = process.env.PROPOSAL_SESSION_SECRET
  if (!secret) {
    console.error('[launchpad/login] Missing PROPOSAL_SESSION_SECRET')
    return NextResponse.json({ error: 'unavailable' }, { status: 502 })
  }

  try {
    const account = await verifyLogin(email, code)
    if (!account) return NextResponse.json({ error: 'not allowed' }, { status: 403 })
    const res = NextResponse.json({ ok: true, account: account.slug })
    res.cookies.set(LAUNCHPAD_COOKIE, createLaunchpadToken(account.slug, email, secret), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_TTL_MS / 1000,
    })
    return res
  } catch (err) {
    console.error('[launchpad/login]', err)
    return NextResponse.json({ error: 'notion unavailable' }, { status: 502 })
  }
}
