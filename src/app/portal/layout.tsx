import type { Metadata } from 'next'

// The player and parent app. Its page is a client component, so the link
// preview copy lives here rather than falling back to the root layout's.
const title = 'Your coaching — Lumio Tennis Coach'
const description = 'Sessions, lesson summaries, progress and messages from your coach.'

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, siteName: 'Lumio Tennis Coach', type: 'website', images: [{ url: 'https://www.lumiosports.com/tennis_coach_logo.png' }] },
  twitter: { card: 'summary', title, description },
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return children
}
