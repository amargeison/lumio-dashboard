import type { Metadata } from 'next'
import GroupView from './GroupView'

// ─── WEEKLY GROUP: ARE YOU COMING? ──────────────────────────────────────────
// URL: /group/[token] — one person's link for one week of a weekly group.
// Everything is loaded by the client from /api/group/[token], because places
// and payments change by the minute.

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Are you coming?',
  description: 'Your weekly group: say whether you are coming this week.',
  robots: { index: false, follow: false },
}

export default async function GroupPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return <GroupView token={token} />
}
