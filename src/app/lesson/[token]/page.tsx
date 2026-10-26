import type { Metadata } from 'next'
import LessonLinkView from './LessonLinkView'

// ─── CONFIRM OR CANCEL A LESSON ─────────────────────────────────────────────
// URL: /lesson/[token] — the link in the day-before reminder. "I'll be there"
// ticks the lesson on the coach's calendar; "I can't make it" cancels it, after
// saying exactly what the coach's cancellation policy means for it.

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Your lesson',
  description: 'Confirm or cancel your lesson.',
  robots: { index: false, follow: false },
}

export default async function LessonLinkPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ a?: string }> }) {
  const { token } = await params
  const { a } = await searchParams
  return <LessonLinkView token={token} want={a === 'yes' ? 'confirm' : a === 'no' ? 'cancel' : null} />
}
