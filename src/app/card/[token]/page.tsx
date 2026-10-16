import type { Metadata } from 'next'
import CardView from './CardView'

// ─── SAVE YOUR CARD ─────────────────────────────────────────────────────────
// URL: /card/[token] — the link a coach sends so a client can save a card (or
// a Direct Debit) and agree to the cancellation policy. No account needed.
// Everything is loaded by the client from /api/card/[token].

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Save your payment details',
  description: 'Save a card with your coach and see their cancellation policy.',
  robots: { index: false, follow: false },
}

export default async function CardPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return <CardView token={token} />
}
