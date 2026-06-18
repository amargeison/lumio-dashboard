import type { Metadata } from 'next'

// Per-page share metadata so shared /boxing links preview as the Boxing product
// (not the generic root "Lumio" fallback).
export const metadata: Metadata = {
  metadataBase: new URL('https://lumiosports.com'),
  title: 'Lumio Boxing — fight-camp & career management',
  description: 'Camp dashboards, GPS ring heatmaps, weight-cut tracking, world-ranking and mandatory trackers, purse modelling and BBBofC compliance — the platform for boxing.',
  alternates: { canonical: '/boxing' },
  openGraph: {
    title: 'Lumio Boxing — fight-camp & career management',
    description: 'Camp dashboards, GPS ring heatmaps, weight-cut tracking, rankings and purse modelling.',
    type: 'website',
    url: 'https://lumiosports.com/boxing',
    siteName: 'Lumio Sports',
    images: [{ url: '/boxing_logo.png', alt: 'Lumio Boxing' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lumio Boxing',
    description: 'Camp dashboards, GPS ring heatmaps, weight-cut tracking, rankings and purse modelling.',
    images: ['/boxing_logo.png'],
  },
}

export default function BoxingMarketingLayout({ children }: { children: React.ReactNode }) {
  return children
}
