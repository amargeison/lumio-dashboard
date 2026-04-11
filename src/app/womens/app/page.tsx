'use client'

import SportsComingSoon from '@/components/sports-coming-soon/SportsComingSoon'

export default function WomensAppPage() {
  return (
    <SportsComingSoon
      sport="womens"
      sportLabel="Lumio Women's FC"
      emoji="⚽"
      accentColor="#ec4899"
      demoHref="/womens/womens-demo"
    />
  )
}
