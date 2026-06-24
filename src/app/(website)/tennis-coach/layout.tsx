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
    images: [{ url: '/tennis_coach_logo.png', alt: 'Lumio Tennis Coach' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lumio Tennis Coach',
    description: 'One platform. Two revenue streams. Built for tennis coaches and academies.',
    images: ['/tennis_coach_logo.png'],
  },
}

export default function TennisCoachLayout({ children }: { children: React.ReactNode }) {
  return children
}
