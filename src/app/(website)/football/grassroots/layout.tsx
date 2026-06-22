import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Lumio Football for Grassroots & Youth clubs',
  description: 'Fixtures, RSVPs, subs, training attendance, tournaments, and match-day sharing for amateur, youth, and Sunday League clubs. Free for every club.',
  // Own canonical + og:url so a shared /football/grassroots link previews as
  // Grassroots — without these it inherits the parent /football (Pro) canonical.
  alternates: { canonical: '/football/grassroots' },
  openGraph: {
    title: 'Lumio Football for Grassroots & Youth clubs',
    description: 'Replace the WhatsApp scroll. Free tier covers one team, unlimited players.',
    type: 'website',
    url: 'https://lumiosports.com/football/grassroots',
    siteName: 'Lumio Sports',
    images: [{ url: '/football_logo.png', alt: 'Lumio Football for Grassroots' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lumio Football for Grassroots & Youth clubs',
    description: 'Replace the WhatsApp scroll. Free tier covers one team, unlimited players.',
    images: ['/football_logo.png'],
  },
}

export default function FootballGrassrootsLayout({ children }: { children: React.ReactNode }) {
  return children
}
