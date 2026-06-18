import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://lumiosports.com'),
  title: 'Lumio Rugby — Championship Rugby Club OS | GPS · Cap · AI · Franchise',
  description: 'Salary cap management, GPS heatmaps, AI Halftime Brief, and franchise readiness tracking for Championship and Premiership rugby clubs. Powered by Claude API and Johan Sports.',
  alternates: { canonical: '/rugby' },
  openGraph: {
    title: 'Lumio Rugby — Championship Rugby Club OS',
    description: 'Salary cap management, GPS heatmaps, AI half-time briefs and franchise readiness tracking.',
    type: 'website',
    url: 'https://lumiosports.com/rugby',
    siteName: 'Lumio Sports',
    images: [{ url: '/rugby_logo.png', alt: 'Lumio Rugby' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lumio Rugby',
    description: 'Salary cap, GPS heatmaps, AI half-time briefs and franchise readiness.',
    images: ['/rugby_logo.png'],
  },
}

export default function RugbyMarketingLayout({ children }: { children: React.ReactNode }) {
  return children
}
