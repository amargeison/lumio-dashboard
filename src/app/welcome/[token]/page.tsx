import type { Metadata } from 'next'
import WelcomeView from './WelcomeView'

// ─── WELCOME LINK ───────────────────────────────────────────────────────────
// URL: /welcome/[token] — one client's welcome: the questionnaire, their card
// or Direct Debit (with the cancellation policy) and their monthly plan.
// Everything is loaded by the client from /api/welcome/[token].

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Welcome',
  description: 'A few questions from your coach, and your payment details.',
  robots: { index: false, follow: false },
}

export default async function WelcomePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return <WelcomeView token={token} />
}
