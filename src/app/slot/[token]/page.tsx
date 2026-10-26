import type { Metadata } from 'next'
import SlotView from './SlotView'

// ─── FREE SLOT OFFER ────────────────────────────────────────────────────────
// URL: /slot/[token] — one client's link to a free slot their coach offered.
// Everything is loaded by the client from /api/slot/[token], because whether
// the slot is still free changes by the minute.

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'A free slot',
  description: 'Your coach has a free slot. Would you like it?',
  robots: { index: false, follow: false },
}

export default async function SlotPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return <SlotView token={token} />
}
