import type { Metadata } from 'next'

// Per-page share metadata so shared /cricket links preview as the Cricket
// product (not the generic root "Lumio" fallback).
export const metadata: Metadata = {
  metadataBase: new URL('https://lumiosports.com'),
  title: 'Lumio Cricket — the club OS for professional cricket',
  description: 'Multi-format squad management, GPS bowling-load models, AI opposition scouting, D/L tools and ECB compliance — built for first-class and county cricket.',
  alternates: { canonical: '/cricket' },
  openGraph: {
    title: 'Lumio Cricket — the club OS for professional cricket',
    description: 'Multi-format squads, GPS bowling load, AI opposition scouting and ECB compliance.',
    type: 'website',
    url: 'https://lumiosports.com/cricket',
    siteName: 'Lumio Sports',
    images: [{ url: '/cricket_logo.png', alt: 'Lumio Cricket' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lumio Cricket',
    description: 'Multi-format squads, GPS bowling load, AI opposition scouting and ECB compliance.',
    images: ['/cricket_logo.png'],
  },
}

export default function CricketMarketingLayout({ children }: { children: React.ReactNode }) {
  return children
}
