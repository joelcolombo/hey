/**
 * Internal approval notification via Resend. Best-effort: failures are logged,
 * never thrown — Notion is the source of truth for approvals.
 */
export async function notifyApproval(input: {
  client: string
  title: string
  number: string
  approvedBy: string
  summaryLabel: string
  pageId: string
}): Promise<void> {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.error('[proposal/notify] RESEND_API_KEY not set — skipping email')
    return
  }
  const notionUrl = `https://notion.so/${input.pageId.replace(/-/g, '')}`
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.PROPOSAL_NOTIFY_FROM ?? 'Proposals <onboarding@resend.dev>',
        to: [process.env.PROPOSAL_NOTIFY_TO ?? 'hey@joelcolombo.co'],
        subject: `Proposal approved ✦ ${input.client} — ${input.title}`,
        text: [
          `${input.number} — ${input.title}`,
          `Client: ${input.client}`,
          `Approved by: ${input.approvedBy}`,
          `Selection: ${input.summaryLabel}`,
          '',
          `Notion: ${notionUrl}`,
          '',
          'Next step: print the proposal page to PDF and send it via DocuSign.',
        ].join('\n'),
      }),
    })
    if (!res.ok) console.error('[proposal/notify] Resend responded', res.status, await res.text())
  } catch (err) {
    console.error('[proposal/notify]', err)
  }
}
