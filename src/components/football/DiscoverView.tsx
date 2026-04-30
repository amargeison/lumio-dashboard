'use client'

import { useState } from 'react'
import { Users, Trophy, Calendar, BarChart3, Search, Target } from 'lucide-react'
import { TeamsView, LeaguesView, FixturesView } from './LeagueViews'
import { FindClubView, FindPlayerView, FootballPyramidView } from './IntegrationViews'

const C = { card: '#0D1017', border: '#1F2937', text: '#F9FAFB', muted: '#6B7280', gold: '#F1C40F' } as const

type Tab = 'teams' | 'leagues' | 'fixtures' | 'pyramid' | 'find-club' | 'find-player'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'teams',       label: 'Teams',              icon: Users },
  { id: 'leagues',     label: 'Leagues & Tables',   icon: Trophy },
  { id: 'fixtures',    label: 'Fixtures & Results', icon: Calendar },
  { id: 'pyramid',     label: 'All Leagues',        icon: BarChart3 },
  { id: 'find-club',   label: 'Find Club',          icon: Search },
  { id: 'find-player', label: 'Find Player',        icon: Target },
]

export default function DiscoverView() {
  const [tab, setTab] = useState<Tab>('teams')

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold" style={{ color: C.text }}>Discover</h2>
        <p className="text-sm mt-1" style={{ color: C.muted }}>Search the football pyramid — teams, tables, fixtures, clubs and players.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5"
            style={{ backgroundColor: tab === t.id ? C.gold : '#111318', color: tab === t.id ? '#000' : C.muted, border: tab === t.id ? 'none' : `1px solid ${C.border}` }}>
            <t.icon size={13} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'teams'       && <TeamsView />}
      {tab === 'leagues'     && <LeaguesView />}
      {tab === 'fixtures'    && <FixturesView />}
      {tab === 'pyramid'     && <FootballPyramidView />}
      {tab === 'find-club'   && <FindClubView />}
      {tab === 'find-player' && <FindPlayerView />}
    </div>
  )
}
