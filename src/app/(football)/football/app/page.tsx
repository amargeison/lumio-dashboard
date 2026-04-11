'use client'

import SportsComingSoon from '@/components/sports-coming-soon/SportsComingSoon'

export default function FootballAppPage() {
  return (
    <SportsComingSoon
      sport="football"
      sportLabel="Lumio Football Pro"
      emoji="⚽"
      accentColor="#2563eb"
      demoHref="/football/football-demo"
    />
  )
}
