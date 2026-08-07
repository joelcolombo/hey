import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { LAUNCHPAD_COOKIE, readLaunchpadSession } from '@/lib/launchpad/access'
import LoginForm from './_components/LoginForm'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Launchpad ✦ Joel Colombo',
  robots: { index: false, follow: false },
}

export default async function LaunchpadLoginPage() {
  const secret = process.env.PROPOSAL_SESSION_SECRET
  const token = (await cookies()).get(LAUNCHPAD_COOKIE)?.value
  const session = secret && token ? readLaunchpadSession(token, secret) : null
  if (session) redirect(`/launchpad/${session.account}`)
  return <LoginForm />
}
