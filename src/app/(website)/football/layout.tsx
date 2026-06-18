import type { Metadata } from 'next'

// Per-page share metadata so shared /football links preview as the Football
// product (not the generic root "Lumio" fallback).
export const metadata: Metadata = {
  metadataBase: new URL('https://lumiosports.com'),
  title: 'Lumio Football — club management for professional & academy football',
  description: 'PSR compliance, GPS load monitoring, the world-first AI half-time brief, Directors Suite and transfer intelligence — the complete platform for football clubs.',
  alternates: { canonical: '/football' },
  openGraph: {
    title: 'Lumio Football — the complete platform for football clubs',
    description: 'PSR compliance, GPS load, AI half-time briefs, Directors Suite and transfer intelligence.',
    type: 'website',
    url: 'https://lumiosports.com/football',
    siteName: 'Lumio Sports',
    images: [{ url: '/football_logo.png', alt: 'Lumio Football' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lumio Football',
    description: 'PSR, GPS load, AI half-time briefs and transfer intelligence — in one platform.',
    images: ['/football_logo.png'],
  },
}

export default function FootballMarketingLayout({ children }: { children: React.ReactNode }) {
  return children
}
