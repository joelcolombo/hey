'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const valid = email.includes('@') && code.trim().length > 0

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/launchpad/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: code.trim(), website }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.ok) {
        router.push(`/launchpad/${data.account}`)
        return
      }
      setError(
        res.status === 403
          ? 'Check your email or access code.'
          : 'Something went wrong. Please try again.'
      )
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setBusy(false)
  }

  return (
    <main className="max-w-3xl mx-auto px-6 min-h-dvh flex flex-col justify-center">
      <p className="label text-[var(--hover-color)] mb-4">Launchpad</p>
      <h1 className="font-light text-[3em] leading-[1.1] mb-6 max-md:text-[2em]">Sign In</h1>
      <p className="text-[1.2em] leading-[1.4] text-[var(--hover-color)] mb-10">
        Enter your email and the access code you received.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (valid && !busy) void submit()
        }}
        className="flex flex-col gap-4 max-w-md"
      >
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email"
          autoComplete="email"
          className="bg-transparent border-b border-[var(--foreground)] py-3 text-[1.2em] outline-none placeholder:text-[var(--hover-color)]" />
        <input type="password" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Access code"
          autoComplete="current-password"
          className="bg-transparent border-b border-[var(--foreground)] py-3 text-[1.2em] outline-none placeholder:text-[var(--hover-color)]" />
        {/* Honeypot — invisible to humans */}
        <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} name="website"
          tabIndex={-1} autoComplete="off" aria-hidden="true"
          className="absolute -left-[9999px] h-0 w-0 overflow-hidden" />
        <button type="submit" disabled={!valid || busy}
          className="self-start mt-4 border border-[var(--foreground)] rounded-full px-8 py-3 text-[1.1em] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors disabled:opacity-30 disabled:pointer-events-none">
          {busy ? 'Signing in…' : 'Enter →'}
        </button>
        {error && <p className="text-[0.9em] text-[var(--hover-color)]" role="alert">{error}</p>}
      </form>
    </main>
  )
}
