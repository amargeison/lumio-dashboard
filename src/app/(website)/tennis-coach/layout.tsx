import type { Metadata } from 'next'

// Per-page share metadata. Without this the tennis-coach marketing page fell
// back to the root layout's generic "Lumio / business" title + description, so
// shared links previewed as the business product. This scopes the Open Graph /
// Twitter card to the Tennis Coach product with a tennis image.
export const metadata: Metadata = {
  metadataBase: new URL('https://lumiosports.com'),
  title: 'Lumio Tennis Coach — the all-in-one platform for tennis coaches',
  description: 'One platform, two revenue streams: session planning, AI session reviews, video & audio, and the Racket Progression reward system — everything a tennis coach or academy needs.',
  alternates: { canonical: '/tennis-coach' },
  openGraph: {
    title: 'Lumio Tennis Coach — the all-in-one platform for tennis coaches',
    description: 'One platform. Two revenue streams. Session planning, AI reviews, video & audio, and the Racket Progression reward system.',
    type: 'website',
    url: 'https://lumiosports.com/tennis-coach',
    siteName: 'Lumio Sports',
    // The 1200×630 card (logo kept small, words on it) — a bare logo filled the
    // whole preview in Trello and WhatsApp with nothing saying what the link was.
    images: [{ url: 'https://www.lumiosports.com/api/og?page=tennis-coach', width: 1200, height: 630, alt: 'Lumio Tennis Coach' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lumio Tennis Coach',
    description: 'One platform. Two revenue streams. Built for tennis coaches and academies.',
    images: ['https://www.lumiosports.com/api/og?page=tennis-coach'],
  },
}

export default function TennisCoachLayout({ children }: { children: React.ReactNode }) {
  return children
}
