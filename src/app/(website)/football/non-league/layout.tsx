import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Lumio Football for Non-League clubs',
  description: 'Squad registration, matchday finance, volunteer roster, FA returns, and AI-drafted social posts for National League and Steps 1–6 clubs.',
  // Own canonical + og:url so a shared /football/non-league link previews as
  // Non-League — without these it inherits the parent /football (Pro) canonical.
  alternates: { canonical: '/football/non-league' },
  openGraph: {
    title: 'Lumio Football for Non-League clubs',
    description: 'One login for the whole season. Free tier for every non-league club.',
    type: 'website',
    url: 'https://lumiosports.com/football/non-league',
    siteName: 'Lumio Sports',
    images: [{ url: '/football_logo.png', alt: 'Lumio Football for Non-League' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lumio Football for Non-League clubs',
    description: 'One login for the whole season. Free tier for every non-league club.',
    images: ['/football_logo.png'],
  },
}

export default function FootballNonLeagueLayout({ children }: { children: React.ReactNode }) {
  return children
}
