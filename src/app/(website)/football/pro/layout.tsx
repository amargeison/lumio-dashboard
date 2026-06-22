import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Lumio Football Pro — EFL & Premier League club management',
  description: 'The complete platform for professional football clubs. PSR compliance, GPS load monitoring, Directors Suite, AI transfer intelligence, and a world-first AI half-time brief.',
  // Own canonical + og:url so a shared /football/pro link resolves to the Pro
  // page specifically (not the generic /football hub it would otherwise inherit).
  alternates: { canonical: '/football/pro' },
  openGraph: {
    title: 'Lumio Football Pro — EFL & Premier League club management',
    description: 'Squad management, PSR tracker, GPS vest data, Directors Suite — in one platform.',
    type: 'website',
    url: 'https://lumiosports.com/football/pro',
    siteName: 'Lumio Sports',
    images: [{ url: '/football_logo.png', alt: 'Lumio Football Pro' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lumio Football Pro — EFL & Premier League club management',
    description: 'Squad management, PSR tracker, GPS vest data, Directors Suite — in one platform.',
    images: ['/football_logo.png'],
  },
}

export default function FootballProLayout({ children }: { children: React.ReactNode }) {
  return children
}
