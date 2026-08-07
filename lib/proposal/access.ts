import { createHmac, timingSafeEqual } from 'node:crypto'

export const SESSION_COOKIE = 'proposal-session'
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

export function parseAllowedEmails(raw: string): string[] {
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isEmailAllowed(email: string, allowed: string[]): boolean {
  return allowed.includes(email.trim().toLowerCase())
}

const sign = (payload: string, secret: string) =>
  createHmac('sha256', secret).update(payload).digest('base64url')

export function createSessionToken(pageId: string, email: string, secret: string, nowMs = Date.now()): string {
  const payload = Buffer.from(
    JSON.stringify({ p: pageId, e: email.trim().toLowerCase(), x: nowMs + SESSION_TTL_MS })
  ).toString('base64url')
  return `${payload}.${sign(payload, secret)}`
}

/** Verify signature and expiry, returning the token's subject id and email. */
export function parseSessionToken(
  token: string,
  secret: string,
  nowMs = Date.now()
): { id: string; email: string } | null {
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return null
  const expected = sign(payload, secret)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { p?: string; e?: string; x?: number }
    if (typeof data.p !== 'string' || typeof data.e !== 'string' || typeof data.x !== 'number') return null
    if (nowMs > data.x) return null
    return { id: data.p, email: data.e }
  } catch {
    return null
  }
}

export function verifySessionToken(
  token: string,
  pageId: string,
  secret: string,
  nowMs = Date.now()
): { email: string } | null {
  const parsed = parseSessionToken(token, secret, nowMs)
  if (!parsed || parsed.id !== pageId) return null
  return { email: parsed.email }
}
