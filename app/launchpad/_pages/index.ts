import type { ComponentType } from 'react'

/**
 * Bespoke React pages served as Launchpad items of kind "Page". The Notion
 * item's Target is the key here. Content lives in the repo, not in Notion.
 */
export type LaunchpadPageProps = { launchpadHref?: string }

type Entry = { title: string; load: () => Promise<{ default: ComponentType<LaunchpadPageProps> }> }

export const launchpadPages: Record<string, Entry> = {
  'pro/discovery-synthesis': {
    title: 'Brand Discovery Analysis ✦ PRO',
    load: () => import('./pro-discovery-synthesis/Page'),
  },
}
