import { describe, expect, it } from 'vitest'
import { createSessionToken, isEmailAllowed, parseAllowedEmails, verifySessionToken } from './access'

describe('parseAllowedEmails', () => {
  it('splits on commas, trims, lowercases, drops empties', () => {
    expect(parseAllowedEmails(' Anne@Recoding.us ,, bob@x.co\n')).toEqual(['anne@recoding.us', 'bob@x.co'])
  })
  it('returns empty array for empty input', () => {
    expect(parseAllowedEmails('')).toEqual([])
  })
})

describe('isEmailAllowed', () => {
  const allowed = parseAllowedEmails('anne@recoding.us, bob@x.co')
  it('matches case- and whitespace-insensitively', () => {
    expect(isEmailAllowed(' ANNE@recoding.US ', allowed)).toBe(true)
  })
  it('rejects unknown emails', () => {
    expect(isEmailAllowed('eve@evil.com', allowed)).toBe(false)
  })
})

describe('session tokens', () => {
  const secret = 'test-secret'
  const now = 1_700_000_000_000

  it('round-trips a valid token', () => {
    const token = createSessionToken('page-1', 'anne@recoding.us', secret, now)
    expect(verifySessionToken(token, 'page-1', secret, now + 1000)).toEqual({ email: 'anne@recoding.us' })
  })

  it('rejects a token for a different proposal', () => {
    const token = createSessionToken('page-1', 'anne@recoding.us', secret, now)
    expect(verifySessionToken(token, 'page-2', secret, now)).toBeNull()
  })

  it('rejects a tampered token', () => {
    const token = createSessionToken('page-1', 'anne@recoding.us', secret, now)
    const [payload] = token.split('.')
    expect(verifySessionToken(`${payload}.forged`, 'page-1', secret, now)).toBeNull()
  })

  it('rejects a wrong secret and an expired token', () => {
    const token = createSessionToken('page-1', 'a@b.c', secret, now)
    expect(verifySessionToken(token, 'page-1', 'other', now)).toBeNull()
    expect(verifySessionToken(token, 'page-1', secret, now + 31 * 24 * 60 * 60 * 1000)).toBeNull()
  })

  it('rejects garbage', () => {
    expect(verifySessionToken('not-a-token', 'page-1', secret, now)).toBeNull()
    expect(verifySessionToken('', 'page-1', secret, now)).toBeNull()
  })
})
