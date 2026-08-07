/**
 * Launchpad: one hub per account at /launchpad/[client], linking every
 * document that account has (proposals, questionnaires, and whatever comes
 * next). The future client login/portal grows from here; for now items are
 * plain links and each destination keeps its own access gate.
 */
export type LaunchpadItem =
  | { kind: 'proposal'; slug: string; label: string }
  | { kind: 'questionnaire'; slug: string; label: string; client: string; project: string }

export type LaunchpadAccount = {
  name: string
  items: LaunchpadItem[]
}

const accounts: Record<string, LaunchpadAccount> = {
  pro: {
    name: 'PRO',
    items: [
      {
        kind: 'proposal',
        slug: '016-260807-pro-visual-identity-refresh',
        label: 'Services Proposal',
      },
      {
        kind: 'questionnaire',
        slug: '016-260807-questionnaire-visual-identity',
        label: 'Brand Questionnaire',
        client: 'pro',
        project: 'visual-identity',
      },
    ],
  },
}

export function getAccount(client: string): LaunchpadAccount | null {
  return accounts[client] ?? null
}

export function getItem(client: string, slug: string): LaunchpadItem | null {
  return getAccount(client)?.items.find((i) => i.slug === slug) ?? null
}
