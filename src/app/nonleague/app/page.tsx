'use client'

import SportsComingSoon from '@/components/sports-coming-soon/SportsComingSoon'

export default function NonleagueAppPage() {
  return (
    <SportsComingSoon
      sport="nonleague"
      sportLabel="Lumio Non-League"
      emoji="⚽"
      accentColor="#f59e0b"
      demoHref="/nonleague/nonleague-demo"
    />
  )
}
