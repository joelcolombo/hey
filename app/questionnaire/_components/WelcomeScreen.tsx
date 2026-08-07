'use client'

import { useState } from 'react'
import type { ProjectConfig } from '@/lib/questionnaire/types'
import type { Questionnaire } from './useQuestionnaire'

export default function WelcomeScreen({
  config,
  q,
  lockedEmail,
}: {
  config: ProjectConfig
  q: Questionnaire
  /** Verified email from the launchpad session: skip asking for it. */
  lockedEmail?: string
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState(lockedEmail ?? '')
  const [website, setWebsite] = useState('') // honeypot
  const valid = name.trim().length > 1 && email.includes('@')

  return (
    <div className="max-w-3xl mx-auto px-6 min-h-dvh flex flex-col justify-center">
      <p className="text-[0.9em] text-[var(--hover-color)] mb-4">
        {config.clientName} · ~{config.template.estimatedMinutes} min
      </p>
      <h1 className="text-[3em] leading-[1.1] mb-6 max-md:text-[2em] text-balance">{config.template.title}</h1>
      <p className="text-[1.2em] leading-[1.4] text-[var(--hover-color)] mb-10">{config.template.intro}</p>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (valid && !q.starting) void q.start(name.trim(), email.trim(), website)
        }}
        className="flex flex-col gap-4 max-w-md"
      >
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
          autoComplete="name"
          className="bg-transparent border-b border-[var(--foreground)] py-3 text-[1.2em] outline-none placeholder:text-[var(--hover-color)]" />
        {!lockedEmail && (
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email"
            autoComplete="email"
            className="bg-transparent border-b border-[var(--foreground)] py-3 text-[1.2em] outline-none placeholder:text-[var(--hover-color)]" />
        )}
        {/* Honeypot — invisible to humans */}
        <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} name="website"
          tabIndex={-1} autoComplete="off" aria-hidden="true"
          className="absolute -left-[9999px] h-0 w-0 overflow-hidden" />
        <button type="submit" disabled={!valid || q.starting}
          className="self-start mt-4 border border-[var(--foreground)] rounded-full px-8 py-3 text-[1.1em] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors disabled:opacity-30 disabled:pointer-events-none">
          {q.starting ? 'Starting…' : 'Start →'}
        </button>
        {lockedEmail && (
          <p className="text-[0.8em] text-[var(--hover-color)]">Answering as {lockedEmail}</p>
        )}
        {q.startError && <p className="text-[0.9em] text-[var(--hover-color)]">{q.startError}</p>}
      </form>
    </div>
  )
}
