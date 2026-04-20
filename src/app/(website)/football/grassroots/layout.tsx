import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Lumio Football for Grassroots & Youth clubs',
  description: 'Fixtures, RSVPs, subs, training attendance, tournaments, and match-day sharing for amateur, youth, and Sunday League clubs. Free for every club.',
  openGraph: {
    title: 'Lumio Football for Grassroots & Youth clubs',
    description: 'Replace the WhatsApp scroll. Free tier covers one team, unlimited players.',
    type: 'website',
  },
}

export default function FootballGrassrootsLayout({ children }: { children: React.ReactNode }) {
  return children
}
