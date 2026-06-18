import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://lumiosports.com'),
  title: "Lumio Women's FC — Club OS for WSL & WSL 2 | Cycle Tracking · FSR · ACL Intelligence · AI Performance Brief",
  description: "The only women's football platform combining GPS, menstrual cycle tracking, ACL composite risk scoring, FSR compliance, Karen Carney Review standards, and AI-powered coaching briefs. Built for WSL and WSL 2 clubs.",
  keywords: "WSL management software, women's football platform, FSR compliance tool, Karen Carney Review, ACL risk women's football, menstrual cycle GPS training, women's football club OS",
  alternates: { canonical: '/womens-football' },
  openGraph: {
    title: "Lumio Women's FC — Club OS for WSL & WSL 2",
    description: "GPS, menstrual cycle tracking, ACL risk scoring, FSR compliance and AI coaching briefs — built for WSL and WSL 2 clubs.",
    type: 'website',
    url: 'https://lumiosports.com/womens-football',
    siteName: 'Lumio Sports',
    images: [{ url: '/womens_fc_logo.png', alt: "Lumio Women's FC" }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Lumio Women's FC",
    description: "GPS, cycle tracking, ACL risk scoring, FSR compliance and AI coaching briefs.",
    images: ['/womens_fc_logo.png'],
  },
}

export default function WomensFootballLayout({ children }: { children: React.ReactNode }) {
  return children
}
