import type { Metadata } from 'next'
import BookingView from './BookingView'

// ─── PUBLIC SESSION BOOKING PAGE ────────────────────────────────────────────
// URL: /book/[token] — the link a coach sends to somebody who wants a lesson.
//
// Everything is loaded by the client from /api/book/[token], because the one
// thing this page shows — which times are free — is true only for as long as
// nobody else books them. A server-rendered, cached copy of a diary is a page
// that confidently offers a slot that went twenty minutes ago.

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Book a session',
  description: 'Pick a time that works for you.',
  robots: { index: false, follow: false },
}

export default async function BookPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return <BookingView token={token} />
}
