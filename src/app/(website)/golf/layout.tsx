import type { Metadata } from 'next'

// Per-page share metadata so shared /golf links preview as the Golf product
// (not the generic root "Lumio" fallback).
export const metadata: Metadata = {
  metadataBase: new URL('https://lumiosports.com'),
  title: 'Lumio Golf — tour management for players, coaches & agents',
  description: 'OWGR & Race to Dubai tracking, strokes-gained analytics, AI round strategy, caddie sheets and financial dashboards — run your golf career in one platform.',
  alternates: { canonical: '/golf' },
  openGraph: {
    title: 'Lumio Golf — tour management in one platform',
    description: 'OWGR tracking, strokes-gained analytics, AI round strategy and caddie sheets.',
    type: 'website',
    url: 'https://lumiosports.com/golf',
    siteName: 'Lumio Sports',
    images: [{ url: '/golf_logo.png', alt: 'Lumio Golf' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lumio Golf',
    description: 'OWGR tracking, strokes-gained analytics, AI round strategy and caddie sheets.',
    images: ['/golf_logo.png'],
  },
}

export default function GolfMarketingLayout({ children }: { children: React.ReactNode }) {
  return children
}
