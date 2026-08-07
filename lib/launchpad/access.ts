import { createSessionToken, parseSessionToken } from '@/lib/proposal/access'

export const LAUNCHPAD_COOKIE = 'launchpad-session'

const subject = (accountSlug: string) => `lp:${accountSlug}`

export function createLaunchpadToken(accountSlug: string, email: string, secret: string): string {
  return createSessionToken(subject(accountSlug), email, secret)
}

/** Returns the session's account slug and email, or null. */
export function readLaunchpadSession(token: string, secret: string): { account: string; email: string } | null {
  const parsed = parseSessionToken(token, secret)
  if (!parsed || !parsed.id.startsWith('lp:')) return null
  return { account: parsed.id.slice(3), email: parsed.email }
}
