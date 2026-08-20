import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import ThemeToggle from '@/components/ThemeToggle'
import { LAUNCHPAD_COOKIE, readLaunchpadSession } from '@/lib/launchpad/access'
import { getAccount, getItems, itemPermits, type LaunchpadItem } from '@/lib/launchpad/notion'
import { isEmailAllowed } from '@/lib/proposal/access'
import { findProposalBySlug } from '@/lib/proposal/notion'

export const dynamic = 'force-dynamic'

type Params = Promise<{ client: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { client } = await params
  return { title: `Launchpad ✦ ${client.toUpperCase()}`, robots: { index: false, follow: false } }
}

type ItemView = { state: string | null; permitted: boolean }

/** Client-facing state for a proposal item, read live from Notion. Users whose
 * email is not on the proposal's own allowlist see it locked, stateless. */
async function proposalView(item: LaunchpadItem, email: string): Promise<ItemView> {
  try {
    const meta = await findProposalBySlug(item.target)
    if (!meta) return { state: null, permitted: true }
    if (!isEmailAllowed(email, meta.allowedEmails)) return { state: null, permitted: false }
    const state = meta.status === 'Signed' ? 'Signed' : meta.status === 'Approved' ? 'Approved' : 'Reviewing'
    return { state, permitted: true }
  } catch {
    return { state: null, permitted: true }
  }
}

export default async function LaunchpadHubPage({ params }: { params: Params }) {
  const { client } = await params
  const secret = process.env.PROPOSAL_SESSION_SECRET
  const token = (await cookies()).get(LAUNCHPAD_COOKIE)?.value
  const session = secret && token ? readLaunchpadSession(token, secret) : null
  if (!session || session.account !== client) redirect('/launchpad')

  const account = await getAccount(client)
  if (!account) notFound()
  const items = await getItems(client)

  const views = await Promise.all(
    items.map((item): Promise<ItemView> => {
      if (!item.enabled) return Promise.resolve({ state: null, permitted: true })
      if (!itemPermits(item, session.email)) return Promise.resolve({ state: null, permitted: false })
      if (item.kind === 'proposal') return proposalView(item, session.email)
      if (item.state) return Promise.resolve({ state: item.state, permitted: true })
      if (item.kind === 'questionnaire') return Promise.resolve({ state: item.state ?? 'Pending', permitted: true })
      return Promise.resolve({ state: null, permitted: true })
    })
  )

  return (
    <main className="max-w-3xl mx-auto px-6 min-h-dvh flex flex-col justify-center">
      <p className="label text-[var(--hover-color)] mb-4">Launchpad</p>
      <h1 className="font-light text-[3em] leading-[1.1] mb-12 max-md:text-[2em]">{account.name}</h1>
      <ul className="flex flex-col">
        {items.map((item, i) => {
          const { state, permitted } = views[i]
          const open = item.enabled && permitted
          const row = (
            <>
              <span className="flex-1">{item.label}</span>
              {open && state && <span className="label text-[var(--hover-color)]">{state}</span>}
              {!open && <span className="label text-[var(--hover-color)]">Locked</span>}
              <span className={open ? 'transition-transform group-hover:translate-x-1' : 'text-[var(--hover-color)]'}>→</span>
            </>
          )
          return (
            <li key={item.slug} className="border-t border-[var(--hairline)] last:border-b">
              {open ? (
                <Link
                  href={`/launchpad/${client}/${item.slug}`}
                  className="group flex items-baseline gap-4 py-5 text-[1.2em] hover:text-[var(--hover-color)] transition-colors"
                >
                  {row}
                </Link>
              ) : (
                <div className="flex items-baseline gap-4 py-5 text-[1.2em] opacity-40 select-none" aria-disabled>
                  {row}
                </div>
              )}
            </li>
          )
        })}
      </ul>
      <div className="fixed bottom-4 left-5 z-50">
        <ThemeToggle />
      </div>
    </main>
  )
}
