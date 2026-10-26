import type { Metadata } from 'next'
import BalanceView from './BalanceView'

// ─── PAY A CAMP OR HOLIDAY BALANCE ──────────────────────────────────────────
// URL: /pay-balance/[token] — a family's private link to pay what is left on a
// camp or trip. Loaded from /api/camp/balance/[token].

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Pay your balance',
  description: 'Pay the balance for your camp or holiday.',
  robots: { index: false, follow: false },
}

export default async function PayBalancePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return <BalanceView token={token} />
}
