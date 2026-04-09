'use client'

import { use } from 'react'
import LumioCricket, { CRICKET_ROLES } from '@/components/cricket/LumioCricket'
import { SportsDemoGate } from '@/components/sports-demo'
import type { SportsDemoSession } from '@/components/sports-demo'

export default function CricketPortalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  return (
    <SportsDemoGate
      sport="cricket"
      defaultClubName="Lumio Cricket Club"
      defaultSlug={slug}
      accentColor="#b45309"
      accentColorLight="#d97706"
      sportEmoji="🏏"
      sportLabel="Lumio Cricket"
      roles={CRICKET_ROLES}
    >
      {(session) => <LumioCricket session={session} />}
    </SportsDemoGate>
  )
}
