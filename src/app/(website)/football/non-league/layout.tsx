import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Lumio Football for Non-League clubs',
  description: 'Squad registration, matchday finance, volunteer roster, FA returns, and AI-drafted social posts for National League and Steps 1–6 clubs.',
  openGraph: {
    title: 'Lumio Football for Non-League clubs',
    description: 'One login for the whole season. Free tier for every non-league club.',
    type: 'website',
  },
}

export default function FootballNonLeagueLayout({ children }: { children: React.ReactNode }) {
  return children
}
