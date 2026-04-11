'use client'

import SportsComingSoon from '@/components/sports-coming-soon/SportsComingSoon'

export default function RugbyAppPage() {
  return (
    <SportsComingSoon
      sport="rugby"
      sportLabel="Lumio Rugby"
      emoji="🏉"
      accentColor="#f97316"
      demoHref="/rugby/rugby-demo"
    />
  )
}
