import type { Metadata } from 'next'
import { ProposalPageBody, proposalMetadata } from '../proposal-page'

export const dynamic = 'force-dynamic'

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  return proposalMetadata(slug)
}

export default async function ProposalPage({ params }: { params: Params }) {
  const { slug } = await params
  return <ProposalPageBody slug={slug} />
}
