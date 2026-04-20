import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Lumio Football Pro — EFL & Premier League club management',
  description: 'The complete platform for professional football clubs. PSR compliance, GPS load monitoring, Directors Suite, AI transfer intelligence, and a world-first AI half-time brief.',
  openGraph: {
    title: 'Lumio Football Pro — EFL & Premier League club management',
    description: 'Squad management, PSR tracker, GPS vest data, Directors Suite — in one platform.',
    type: 'website',
  },
}

export default function FootballProLayout({ children }: { children: React.ReactNode }) {
  return children
}
