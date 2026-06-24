import type { Metadata } from 'next'

// Per-page share metadata so shared /tennis links preview as the Tennis product
// (not the generic root "Lumio" fallback).
export const metadata: Metadata = {
  metadataBase: new URL('https://lumiosports.com'),
  title: 'Lumio Tennis — the management platform for players, clubs & academies',
  description: 'Live ATP/WTA rankings, match prep, AI briefings, performance analytics and a full team hub — run your tennis career or club like a business.',
  alternates: { canonical: '/tennis' },
  openGraph: {
    title: 'Lumio Tennis — run your tennis career like a business',
    description: 'Rankings, match prep, AI briefings, performance analytics and a team hub — all in one portal.',
    type: 'website',
    url: 'https://lumiosports.com/tennis',
    siteName: 'Lumio Sports',
    images: [{ url: '/tennis_logo.png', alt: 'Lumio Tennis' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lumio Tennis',
    description: 'Rankings, match prep, AI briefings and performance analytics — in one portal.',
    images: ['/tennis_logo.png'],
  },
}

export default function TennisLayout({ children }: { children: React.ReactNode }) {
  return children
}
