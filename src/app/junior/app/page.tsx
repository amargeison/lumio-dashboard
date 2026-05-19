'use client'

import SportsComingSoon from '@/components/sports-coming-soon/SportsComingSoon'

export default function JuniorAppPage() {
  return (
    <SportsComingSoon
      sport="junior"
      sportLabel="Lumio Junior Football"
      emoji="⚽"
      accentColor="#16a34a"
      demoHref="/junior/junior-demo"
    />
  )
}
