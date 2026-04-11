'use client'

import SportsComingSoon from '@/components/sports-coming-soon/SportsComingSoon'

export default function CricketAppPage() {
  return (
    <SportsComingSoon
      sport="cricket"
      sportLabel="Lumio Cricket"
      emoji="🏏"
      accentColor="#10b981"
      demoHref="/cricket/cricket-demo"
    />
  )
}
