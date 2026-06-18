import type { Metadata } from 'next'

// Per-page share metadata so shared /darts links preview as the Darts product
// (not the generic root "Lumio" fallback).
export const metadata: Metadata = {
  metadataBase: new URL('https://lumiosports.com'),
  title: 'Lumio Darts — PDC management for players & managers',
  description: 'Order of Merit tracking, match prep, checkout analytics, nine-dart logs, sponsorship and appearance management — the all-in-one platform for darts.',
  alternates: { canonical: '/darts' },
  openGraph: {
    title: 'Lumio Darts — the all-in-one platform for darts',
    description: 'Order of Merit, match prep, checkout analytics, nine-dart logs and sponsorship management.',
    type: 'website',
    url: 'https://lumiosports.com/darts',
    siteName: 'Lumio Sports',
    images: [{ url: '/darts_logo.png', alt: 'Lumio Darts' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lumio Darts',
    description: 'Order of Merit, match prep, checkout analytics, nine-dart logs and sponsorship management.',
    images: ['/darts_logo.png'],
  },
}

export default function DartsMarketingLayout({ children }: { children: React.ReactNode }) {
  return children
}
