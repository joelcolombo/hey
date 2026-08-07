import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAccount } from '@/lib/launchpad/config'

type Params = Promise<{ client: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { client } = await params
  const account = getAccount(client)
  if (!account) return { robots: { index: false, follow: false } }
  return { title: `Launchpad ✦ ${account.name}`, robots: { index: false, follow: false } }
}

export default async function LaunchpadPage({ params }: { params: Params }) {
  const { client } = await params
  const account = getAccount(client)
  if (!account) notFound()

  return (
    <main className="max-w-3xl mx-auto px-6 min-h-dvh flex flex-col justify-center">
      <p className="label text-[var(--hover-color)] mb-4">Launchpad</p>
      <h1 className="font-light text-[3em] leading-[1.1] mb-12 max-md:text-[2em]">{account.name}</h1>
      <ul className="flex flex-col">
        {account.items.map((item) => (
          <li key={item.slug} className="border-t border-[var(--hover-color)]/30 last:border-b">
            <Link
              href={`/launchpad/${client}/${item.slug}`}
              className="group flex items-baseline gap-4 py-5 text-[1.2em] hover:text-[var(--hover-color)] transition-colors"
            >
              <span className="flex-1">{item.label}</span>
              <span className="text-[0.8em] text-[var(--hover-color)]">{item.slug.slice(0, 10)}</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
