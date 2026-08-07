import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { LAUNCHPAD_COOKIE, readLaunchpadSession } from '@/lib/launchpad/access'
import { getAccount, getItems, type LaunchpadItem } from '@/lib/launchpad/notion'
import { findProposalBySlug } from '@/lib/proposal/notion'

export const dynamic = 'force-dynamic'

type Params = Promise<{ client: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { client } = await params
  return { title: `Launchpad ✦ ${client.toUpperCase()}`, robots: { index: false, follow: false } }
}

/** Client-facing state for a proposal item, read live from Notion. */
async function proposalState(item: LaunchpadItem): Promise<string | null> {
  try {
    const meta = await findProposalBySlug(item.target)
    if (!meta) return null
    if (meta.status === 'Signed') return 'Signed'
    if (meta.status === 'Approved') return 'Approved'
    return 'Reviewing'
  } catch {
    return null
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

  const states = await Promise.all(
    items.map((item) => (item.kind === 'proposal' && item.enabled ? proposalState(item) : Promise.resolve(null)))
  )

  return (
    <main className="max-w-3xl mx-auto px-6 min-h-dvh flex flex-col justify-center">
      <p className="label text-[var(--hover-color)] mb-4">Launchpad</p>
      <h1 className="font-light text-[3em] leading-[1.1] mb-12 max-md:text-[2em]">{account.name}</h1>
      <ul className="flex flex-col">
        {items.map((item, i) => {
          const state = states[i]
          const row = (
            <>
              <span className="flex-1">{item.label}</span>
              {state && <span className="label text-[var(--hover-color)]">{state}</span>}
              {!item.enabled && <span className="label text-[var(--hover-color)]">Locked</span>}
              <span className={item.enabled ? 'transition-transform group-hover:translate-x-1' : 'opacity-0'}>→</span>
            </>
          )
          return (
            <li key={item.slug} className="border-t border-[var(--hover-color)]/30 last:border-b">
              {item.enabled ? (
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
    </main>
  )
}
