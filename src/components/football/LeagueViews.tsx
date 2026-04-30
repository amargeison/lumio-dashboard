'use client'

import { useState, useEffect, useRef } from 'react'
import type { LeagueTable } from '@/lib/api-football'
import type { ClubTier } from '@/lib/feature-gates'
import ClubComparisonView from './ClubComparisonView'

const LEAGUE_IDS: Record<string, number> = { 'Premier League': 39, 'Championship': 40, 'League One': 41, 'League Two': 42, 'National League': 43 }

const TEAM_IDS: Record<string, number> = {
  'Arsenal': 42, 'Aston Villa': 66, 'Bournemouth': 35, 'Brentford': 55, 'Brighton & Hove Albion': 51, 'Chelsea': 49, 'Crystal Palace': 52, 'Everton': 45, 'Fulham': 36, 'Liverpool': 40, 'Manchester City': 50, 'Manchester United': 33, 'Newcastle United': 34, 'Nottingham Forest': 65, 'Tottenham Hotspur': 47, 'West Ham United': 48, 'Wolverhampton Wanderers': 39, 'Ipswich Town': 57, 'Leicester City': 46, 'Southampton': 41,
  'Blackburn Rovers': 69, 'Bristol City': 70, 'Burnley': 44, 'Cardiff City': 75, 'Coventry City': 71, 'Derby County': 76, 'Hull City': 80, 'Leeds United': 63, 'Luton Town': 1359, 'Middlesbrough': 25, 'Millwall': 81, 'Norwich City': 72, 'Oxford United': 2283, 'Plymouth Argyle': 3371, 'Preston North End': 1108, 'QPR': 67, 'Sheffield United': 62, 'Stoke City': 74, 'Swansea City': 78, 'Watford': 38, 'West Bromwich Albion': 60, 'Wrexham': 763,
  'AFC Wimbledon': 663, 'Barnsley': 750, 'Bolton Wanderers': 1107, 'Bristol Rovers': 775, 'Charlton Athletic': 68, 'Exeter City': 784, 'Lincoln City': 729, 'Northampton Town': 773, 'Peterborough United': 73, 'Reading': 777, 'Shrewsbury Town': 772, 'Stockport County': 769, 'Wigan Athletic': 87,
  'Accrington Stanley': 770, 'Bradford City': 749, 'Carlisle United': 752, 'Doncaster Rovers': 761, 'Fleetwood Town': 764, 'Gillingham': 766, 'Grimsby Town': 767, 'Newport County': 1387, 'Notts County': 798, 'Port Vale': 800, 'Salford City': 3723, 'Swindon Town': 803, 'Tranmere Rovers': 805, 'Walsall': 806,
}

const TIER_LEAGUES = [
  { tier: 1, name: 'Premier League', leagueId: 39, colour: 'purple' },
  { tier: 2, name: 'Championship', leagueId: 40, colour: 'blue' },
  { tier: 3, name: 'League One', leagueId: 41, colour: 'green' },
  { tier: 4, name: 'League Two', leagueId: 42, colour: 'pink' },
  { tier: 5, name: 'National League', leagueId: 43, colour: 'orange' },
]

const C = { card: '#0d0f1a', border: '#1F2937', text: '#F9FAFB', muted: '#6B7280', blue: '#003DA5', yellow: '#F1C40F', teal: '#0D9488' }

const colourMap: Record<string, string> = {
  purple: 'border-purple-600/40 bg-purple-900/10', blue: 'border-blue-600/40 bg-blue-900/10',
  green: 'border-green-600/40 bg-green-900/10', pink: 'border-pink-600/40 bg-pink-900/10',
  orange: 'border-orange-600/40 bg-orange-900/10', teal: 'border-teal-600/40 bg-teal-900/10',
}

const posColour = (pos: string) => pos === 'Goalkeeper' ? 'bg-yellow-600/20 text-yellow-400' : pos === 'Defender' ? 'bg-blue-600/20 text-blue-400' : pos === 'Midfielder' ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
const posShort = (pos: string) => pos === 'Goalkeeper' ? 'GK' : pos === 'Defender' ? 'DEF' : pos === 'Midfielder' ? 'MID' : 'FWD'

interface SBCompetition { competition_id: number; season_id: number; competition_name: string; season_name: string; country_name: string; competition_gender: string; match_updated: string }
interface SBMatch { match_id: number; match_date: string; home_team: { home_team_name: string }; away_team: { away_team_name: string }; home_score: number; away_score: number; competition_stage?: { name: string } }
interface SBEvent { id: string; type: { id: number; name: string }; minute: number; second: number; location?: number[]; shot?: { statsbomb_xg: number; outcome: { name: string }; end_location?: number[] }; pass?: { outcome?: { name: string } }; dribble?: { outcome?: { name: string } }; team: { name: string }; player?: { name: string }; possession_team?: { name: string } }

// Allowed Lumio Data competitions
const SB_ALLOWED_COMP_IDS = [2, 37, 16, 43, 11]

// ─── Shared: loading spinner ─────────────────────────────────────────────────
function Spinner({ text }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="w-6 h-6 border-2 rounded-full animate-spin mr-2" style={{ borderColor: C.border, borderTopColor: C.blue }} />
      <span className="text-sm" style={{ color: C.muted }}>{text || 'Loading...'}</span>
    </div>
  )
}

// ─── Shared: Lumio Data powered badge ─────────────────────────────────────────
function FootballDataBadge() {
  return (
    <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #1F2937' }}>
      <span style={{ fontSize: 11, color: '#6B7280' }}>Powered by <span style={{ fontWeight: 600, color: '#F9FAFB' }}>Lumio Data</span> Open Data · Free tier — historical competitions only</span>
    </div>
  )
}

// ─── Shared: fetch competitions (filtered to allowed list) ──────────────────
function useFootballLeagueCompetitions() {
  const [competitions, setCompetitions] = useState<SBCompetition[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch('/api/football/statsbomb?type=competitions')
      .then(r => r.json())
      .then((data: SBCompetition[]) => {
        const filtered = data.filter((c: SBCompetition) => SB_ALLOWED_COMP_IDS.includes(c.competition_id))
        const unique = filtered.reduce((acc: Map<string, SBCompetition>, c: SBCompetition) => {
          const key = `${c.competition_id}-${c.season_id}`
          if (!acc.has(key)) acc.set(key, c)
          return acc
        }, new Map<string, SBCompetition>())
        setCompetitions(Array.from(unique.values()).sort((a: SBCompetition, b: SBCompetition) => a.competition_name.localeCompare(b.competition_name) || b.season_name.localeCompare(a.season_name)))
      })
      .catch(() => setCompetitions([]))
      .finally(() => setLoading(false))
  }, [])

  return { competitions, loading }
}

// ─── Shared: Competition + Season selectors ─────────────────────────────────
function CompetitionSeasonSelector({ competitions, onSelect }: { competitions: SBCompetition[]; onSelect: (comp: SBCompetition) => void }) {
  const [selectedCompId, setSelectedCompId] = useState<number | null>(null)

  const compNames = Array.from(new Map(competitions.map(c => [c.competition_id, c.competition_name])).entries())
  const seasons = selectedCompId ? competitions.filter(c => c.competition_id === selectedCompId) : []

  return (
    <div className="space-y-3">
      <div>
        <div className="text-xs font-semibold mb-2" style={{ color: C.muted }}>Select Competition</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {compNames.map(([id, name]) => (
            <button key={id} onClick={() => setSelectedCompId(id)} className="p-3 rounded-xl border text-left transition-all hover:border-blue-600/40" style={{ backgroundColor: selectedCompId === id ? 'rgba(0,61,165,0.12)' : C.card, border: `1px solid ${selectedCompId === id ? 'rgba(0,61,165,0.3)' : C.border}` }}>
              <div className="text-sm font-semibold" style={{ color: C.text }}>{name}</div>
            </button>
          ))}
        </div>
      </div>
      {selectedCompId && (
        <div>
          <div className="text-xs font-semibold mb-2" style={{ color: C.muted }}>Select Season</div>
          <div className="flex flex-wrap gap-2">
            {seasons.map((comp, i) => (
              <button key={i} onClick={() => onSelect(comp)} className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:border-blue-600/40" style={{ backgroundColor: C.card, border: `1px solid ${C.border}`, color: C.text }}>
                {comp.season_name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── REUSABLE: Match Analytics Panel ────────────────────────────────────────
function MatchAnalyticsPanel({ match, events, onBack }: { match: SBMatch; events: SBEvent[]; onBack: () => void }) {
  const homeTeam = match.home_team?.home_team_name || ''
  const awayTeam = match.away_team?.away_team_name || ''

  // Shots
  const shots = events.filter((e: SBEvent) => e.type?.name === 'Shot')
  const homeShots = shots.filter((s: SBEvent) => s.team?.name === homeTeam)
  const awayShots = shots.filter((s: SBEvent) => s.team?.name === awayTeam)
  const homeXG = homeShots.reduce((t: number, s: SBEvent) => t + (s.shot?.statsbomb_xg || 0), 0)
  const awayXG = awayShots.reduce((t: number, s: SBEvent) => t + (s.shot?.statsbomb_xg || 0), 0)

  // Passes
  const passes = events.filter((e: SBEvent) => e.type?.name === 'Pass')
  const homePasses = passes.filter((p: SBEvent) => p.team?.name === homeTeam)
  const awayPasses = passes.filter((p: SBEvent) => p.team?.name === awayTeam)
  const homePassComp = homePasses.length > 0 ? Math.round((homePasses.filter((p: SBEvent) => !p.pass?.outcome).length / homePasses.length) * 100) : 0
  const awayPassComp = awayPasses.length > 0 ? Math.round((awayPasses.filter((p: SBEvent) => !p.pass?.outcome).length / awayPasses.length) * 100) : 0

  // Shots on target
  const homeShotsOnTarget = homeShots.filter((s: SBEvent) => s.shot?.outcome?.name === 'Saved' || s.shot?.outcome?.name === 'Goal').length
  const awayShotsOnTarget = awayShots.filter((s: SBEvent) => s.shot?.outcome?.name === 'Saved' || s.shot?.outcome?.name === 'Goal').length

  // Pressures
  const pressures = events.filter((e: SBEvent) => e.type?.name === 'Pressure')
  const homePressures = pressures.filter((p: SBEvent) => p.team?.name === homeTeam)
  const awayPressures = pressures.filter((p: SBEvent) => p.team?.name === awayTeam)

  // Dribbles
  const dribbles = events.filter((e: SBEvent) => e.type?.name === 'Dribble')
  const homeDribbles = dribbles.filter((d: SBEvent) => d.team?.name === homeTeam)
  const awayDribbles = dribbles.filter((d: SBEvent) => d.team?.name === awayTeam)
  const homeDribbleSuccess = homeDribbles.filter((d: SBEvent) => d.dribble?.outcome?.name === 'Complete').length
  const awayDribbleSuccess = awayDribbles.filter((d: SBEvent) => d.dribble?.outcome?.name === 'Complete').length

  // Possession
  const totalEvents = events.length || 1
  const homePossession = Math.round((events.filter((e: SBEvent) => e.possession_team?.name === homeTeam || e.team?.name === homeTeam).length / totalEvents) * 100)

  // xG timeline
  const maxMinute = events.length > 0 ? Math.max(...events.map(e => e.minute), 90) : 90
  const xgTimeline: { minute: number; homeXG: number; awayXG: number }[] = []
  let hCum = 0, aCum = 0
  for (let m = 0; m <= maxMinute; m++) {
    const mShots = shots.filter(s => s.minute === m)
    mShots.forEach(s => { if (s.team?.name === homeTeam) hCum += s.shot?.statsbomb_xg || 0; else aCum += s.shot?.statsbomb_xg || 0 })
    xgTimeline.push({ minute: m, homeXG: hCum, awayXG: aCum })
  }
  const maxXG = Math.max(homeXG, awayXG, 1) * 1.2

  // Top 5 players by touches (event count grouped by player & team)
  const touchMap = new Map<string, { name: string; team: string; count: number }>()
  events.forEach(e => {
    if (!e.player?.name) return
    const key = `${e.player.name}|${e.team?.name}`
    const existing = touchMap.get(key)
    if (existing) existing.count++
    else touchMap.set(key, { name: e.player.name, team: e.team?.name, count: 1 })
  })
  const topTouches = Array.from(touchMap.values()).sort((a, b) => b.count - a.count).slice(0, 5)

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-xs hover:underline" style={{ color: '#60A5FA' }}>← Back to matches</button>

      {/* Score header */}
      <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, rgba(0,61,165,0.12), rgba(0,0,0,0.1))', border: '1px solid rgba(0,61,165,0.25)' }}>
        <div className="flex items-center justify-center gap-4 mb-3">
          <div className="text-right flex-1"><div className="text-sm font-bold" style={{ color: C.text }}>{homeTeam}</div></div>
          <div className="text-2xl font-black" style={{ color: C.text }}>{match.home_score} – {match.away_score}</div>
          <div className="text-left flex-1"><div className="text-sm font-bold" style={{ color: C.text }}>{awayTeam}</div></div>
        </div>
        <div className="flex items-center justify-center gap-8 text-xs" style={{ color: C.muted }}>
          <span>xG: <span className="font-bold" style={{ color: '#60A5FA' }}>{homeXG.toFixed(2)}</span></span>
          <span>xG: <span className="font-bold" style={{ color: '#F87171' }}>{awayXG.toFixed(2)}</span></span>
        </div>
      </div>

      {/* a. xG Timeline */}
      <div className="rounded-xl p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
        <div className="text-xs font-semibold mb-3" style={{ color: C.text }}>Cumulative xG Timeline</div>
        <div className="flex items-center gap-4 mb-2 text-xs">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#60A5FA' }} />{homeTeam} ({homeXG.toFixed(2)})</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#F87171' }} />{awayTeam} ({awayXG.toFixed(2)})</span>
        </div>
        <div style={{ height: 200, position: 'relative' }}>
          <svg width={600} height={200} viewBox={`0 0 ${maxMinute} ${maxXG}`} style={{ width: '100%', height: '100%' }} preserveAspectRatio="none">
            {[0.5, 1, 1.5, 2, 2.5, 3].filter(v => v <= maxXG).map(v => (
              <line key={v} x1={0} y1={maxXG - v} x2={maxMinute} y2={maxXG - v} stroke="#1F2937" strokeWidth={0.3} />
            ))}
            <line x1={45} y1={0} x2={45} y2={maxXG} stroke="#374151" strokeWidth={0.3} strokeDasharray="2,2" />
            <polyline fill="none" stroke="#60A5FA" strokeWidth={0.8} points={xgTimeline.map(p => `${p.minute},${maxXG - p.homeXG}`).join(' ')} />
            <polyline fill="none" stroke="#F87171" strokeWidth={0.8} points={xgTimeline.map(p => `${p.minute},${maxXG - p.awayXG}`).join(' ')} />
            {shots.filter(s => s.shot?.outcome?.name === 'Goal').map((s, i) => {
              const isHome = s.team?.name === homeTeam
              const cumXG = xgTimeline.find(t => t.minute === s.minute)
              const y = cumXG ? (isHome ? cumXG.homeXG : cumXG.awayXG) : 0
              return <circle key={i} cx={s.minute} cy={maxXG - y} r={1.2} fill={isHome ? '#60A5FA' : '#F87171'} stroke="#fff" strokeWidth={0.3} />
            })}
          </svg>
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] px-1" style={{ color: C.muted }}>
            <span>0&apos;</span><span>45&apos;</span><span>{maxMinute}&apos;</span>
          </div>
        </div>
      </div>

      {/* b. Shot Map */}
      <div className="rounded-xl p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
        <div className="text-xs font-semibold mb-3" style={{ color: C.text }}>Shot Map</div>
        <div className="flex items-center gap-3 mb-2 text-xs">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#60A5FA' }} />{homeTeam}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#F87171' }} />{awayTeam}</span>
          <span className="flex items-center gap-1 ml-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#22C55E' }} />Goal</span>
        </div>
        <div style={{ position: 'relative', width: '100%', aspectRatio: '120/80', backgroundColor: '#1a472a', borderRadius: 8, overflow: 'hidden', border: '2px solid #2d5a3a' }}>
          <svg viewBox="0 0 120 80" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <rect x={1} y={1} width={118} height={78} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={0.5} />
            <line x1={60} y1={1} x2={60} y2={79} stroke="rgba(255,255,255,0.3)" strokeWidth={0.5} />
            <circle cx={60} cy={40} r={9.15} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={0.5} />
            <rect x={1} y={18} width={18} height={44} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={0.5} />
            <rect x={1} y={30} width={6} height={20} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={0.5} />
            <rect x={101} y={18} width={18} height={44} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={0.5} />
            <rect x={113} y={30} width={6} height={20} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={0.5} />
            <text x={10} y={4} fill="rgba(255,255,255,0.25)" fontSize={3} textAnchor="middle">{homeTeam}</text>
            <text x={110} y={4} fill="rgba(255,255,255,0.25)" fontSize={3} textAnchor="middle">{awayTeam}</text>
            {shots.map((s: SBEvent, i: number) => {
              if (!s.location) return null
              const isHome = s.team?.name === homeTeam
              const x = isHome ? s.location[0] : 120 - s.location[0]
              const y = s.location[1]
              const xg = s.shot?.statsbomb_xg || 0
              const isGoal = s.shot?.outcome?.name === 'Goal'
              const r = Math.max(3, Math.min(12, xg * 20)) * 0.3
              return <circle key={i} cx={x} cy={y} r={r} fill={isGoal ? 'rgba(34,197,94,0.7)' : isHome ? 'rgba(96,165,250,0.6)' : 'rgba(248,113,113,0.6)'} stroke={isGoal ? '#22C55E' : isHome ? '#60A5FA' : '#F87171'} strokeWidth={isGoal ? 0.8 : 0.4} />
            })}
          </svg>
        </div>
        <div className="text-xs mt-2 text-center" style={{ color: C.muted }}>Dot size = xG value. Green = goal scored.</div>
      </div>

      {/* c. Key Stats Table */}
      <div className="rounded-xl p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
        <div className="text-xs font-semibold mb-3" style={{ color: C.text }}>Key Stats</div>
        <div className="space-y-3">
          {[
            { label: 'Possession %', home: `${homePossession}%`, away: `${100 - homePossession}%`, homeVal: homePossession, awayVal: 100 - homePossession },
            { label: 'Pass Completion %', home: `${homePassComp}%`, away: `${awayPassComp}%`, homeVal: homePassComp, awayVal: awayPassComp },
            { label: 'Shots on Target', home: `${homeShotsOnTarget}`, away: `${awayShotsOnTarget}`, homeVal: homeShotsOnTarget, awayVal: awayShotsOnTarget },
            { label: 'Pressure Events', home: `${homePressures.length}`, away: `${awayPressures.length}`, homeVal: homePressures.length, awayVal: awayPressures.length },
            { label: 'Dribbles (Success)', home: `${homeDribbles.length} (${homeDribbleSuccess})`, away: `${awayDribbles.length} (${awayDribbleSuccess})`, homeVal: homeDribbles.length, awayVal: awayDribbles.length },
          ].map((row, i) => {
            const max = Math.max(row.homeVal, row.awayVal, 1)
            return (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1"><span style={{ color: '#60A5FA' }}>{row.home}</span><span style={{ color: C.muted }}>{row.label}</span><span style={{ color: '#F87171' }}>{row.away}</span></div>
                <div className="flex gap-1 h-2">
                  <div className="flex-1 rounded-l-full overflow-hidden flex justify-end" style={{ backgroundColor: '#1F2937' }}>
                    <div className="rounded-l-full" style={{ width: `${(row.homeVal / max) * 100}%`, backgroundColor: '#60A5FA' }} />
                  </div>
                  <div className="flex-1 rounded-r-full overflow-hidden" style={{ backgroundColor: '#1F2937' }}>
                    <div className="rounded-r-full" style={{ width: `${(row.awayVal / max) * 100}%`, backgroundColor: '#F87171' }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* d. Top 5 Players by Touches */}
      <div className="rounded-xl p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
        <div className="text-xs font-semibold mb-3" style={{ color: C.text }}>Top 5 Players by Touches</div>
        <div className="space-y-2">
          {topTouches.map((p, i) => {
            const maxCount = topTouches[0]?.count || 1
            const isHome = p.team === homeTeam
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs w-4 font-bold" style={{ color: C.muted }}>{i + 1}</span>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: isHome ? '#60A5FA' : '#F87171' }} />
                <span className="text-sm flex-1" style={{ color: C.text }}>{p.name}</span>
                <div className="w-24 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#1F2937' }}>
                  <div className="h-full rounded-full" style={{ width: `${(p.count / maxCount) * 100}%`, backgroundColor: isHome ? '#60A5FA' : '#F87171' }} />
                </div>
                <span className="text-xs font-mono w-10 text-right" style={{ color: C.text }}>{p.count}</span>
              </div>
            )
          })}
        </div>
      </div>

      <FootballDataBadge />
    </div>
  )
}

// ─── PLAYER PROFILE MODAL ───────────────────────────────────────────────────
export function PlayerProfileModal({ player, onClose, teamName }: { player: any; onClose: () => void; teamName?: string }) {
  const [ppTab, setPpTab] = useState<'season' | 'history' | 'career' | 'profile'>('season')
  const [profileData, setProfileData] = useState<any>(null)
  const [transferData, setTransferData] = useState<any[]>([])
  const [careerStats, setCareerStats] = useState<any[]>([])
  const [ppLoading, setPpLoading] = useState(false)
  const [aiData, setAiData] = useState<any>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const playerId = player?.player?.id || player?.id
  const ppStats = player?.statistics?.[0] || {}
  const pInfo = player?.player || player || {}

  useEffect(() => {
    if (!playerId) {
      const name = pInfo.name || ((pInfo.firstname || '') + ' ' + (pInfo.lastname || '')).trim()
      if (name) {
        setAiLoading(true)
        fetch('/api/ai/football-search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'player', query: `${name} ${teamName || ''}`.trim() }) })
          .then(r => r.json()).then(d => setAiData(d.result)).catch(() => {}).finally(() => setAiLoading(false))
      }
      return
    }
    setPpLoading(true)
    Promise.all([
      fetch(`/api/football/player?playerId=${playerId}&season=2025`).then(r => r.json()).catch(() => null),
      fetch(`/api/football/transfers?playerId=${playerId}`).then(r => r.json()).catch(() => null),
      ...[2025, 2024, 2023, 2022, 2021].map(s =>
        fetch(`/api/football/player?playerId=${playerId}&season=${s}`).then(r => r.json()).catch(() => null)
      )
    ]).then(([playerRes, transferRes, ...seasonResults]) => {
      if (playerRes?.response?.[0]) setProfileData(playerRes.response[0])
      if (transferRes?.response?.[0]?.transfers) setTransferData(transferRes.response[0].transfers)
      const career: any[] = []
      seasonResults.forEach((sr, idx) => {
        const p = sr?.response?.[0]
        if (p?.statistics) {
          p.statistics.forEach((cst: any) => {
            career.push({ season: `${2025 - idx}/${String(2026 - idx).slice(2)}`, club: cst.team?.name, clubLogo: cst.team?.logo, league: cst.league?.name, apps: cst.games?.appearences ?? 0, goals: cst.goals?.total ?? 0, assists: cst.goals?.assists ?? 0, rating: cst.games?.rating ? parseFloat(cst.games.rating).toFixed(1) : '—' })
          })
        }
      })
      setCareerStats(career)
    }).finally(() => setPpLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId])

  const pd = profileData || player
  const pi = pd?.player || pInfo
  const st = profileData?.statistics?.[0] || ppStats
  const gm = st?.games || {}
  const gl = st?.goals || {}
  const ps = st?.passes || {}
  const sh = st?.shots || {}
  const dr = st?.dribbles || {}
  const cd = st?.cards || {}
  const tm = st?.team || {}
  const pos = gm?.position || pInfo.position || ''
  const posCol = pos === 'Goalkeeper' ? { bg: 'rgba(234,179,8,0.15)', c: '#EAB308' } : pos === 'Defender' ? { bg: 'rgba(59,130,246,0.15)', c: '#3B82F6' } : pos === 'Midfielder' ? { bg: 'rgba(34,197,94,0.15)', c: '#22C55E' } : { bg: 'rgba(239,68,68,0.15)', c: '#EF4444' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#0F1117', border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 pb-4" style={{ background: 'linear-gradient(135deg, rgba(0,61,165,0.2), rgba(0,0,0,0.1))' }}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              {(pi.photo || pInfo.photo) && <img src={pi.photo || pInfo.photo} alt="" className="w-20 h-20 rounded-xl object-cover" style={{ border: '2px solid rgba(0,61,165,0.3)' }} />}
              <div>
                <div className="text-xl font-black" style={{ color: C.text }}>{pi.name || pInfo.name || `${pi.firstname || ''} ${pi.lastname || ''}`.trim()}</div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {tm.logo && <img src={tm.logo} alt="" className="w-5 h-5 object-contain" />}
                  {tm.name && <span className="text-sm" style={{ color: C.muted }}>{tm.name}</span>}
                  <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ backgroundColor: posCol.bg, color: posCol.c }}>{pos || pInfo.position || '—'}</span>
                  {(pi.age || pInfo.age) && <span className="text-xs" style={{ color: C.muted }}>Age {pi.age || pInfo.age}</span>}
                  {(pi.nationality || pInfo.nationality) && <span className="text-xs" style={{ color: C.muted }}>{pi.nationality || pInfo.nationality}</span>}
                </div>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {pInfo.number && <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(0,61,165,0.15)', color: C.yellow }}>#{pInfo.number}</span>}
                  {gm.rating && <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: parseFloat(gm.rating) >= 7 ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)', color: parseFloat(gm.rating) >= 7 ? '#22C55E' : '#F59E0B' }}>{parseFloat(gm.rating).toFixed(1)} avg</span>}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="text-sm px-3 py-1.5 rounded-lg" style={{ border: `1px solid ${C.border}`, color: C.muted }}>&#x2715;</button>
          </div>
        </div>

        {ppLoading && <Spinner text="Loading player profile..." />}
        {aiLoading && <Spinner text="Searching player data via AI..." />}

        {/* AI fallback (no API ID) */}
        {!playerId && aiData && !aiLoading && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {[{ l: 'Goals', v: aiData.goals }, { l: 'Assists', v: aiData.assists }, { l: 'Apps', v: aiData.apps }].map((s, i) => (
                <div key={i} className="rounded-lg p-3 text-center" style={{ backgroundColor: '#1A1D27' }}><div className="text-lg font-black" style={{ color: C.text }}>{s.v || '—'}</div><div className="text-xs" style={{ color: C.muted }}>{s.l}</div></div>
              ))}
            </div>
            <div className="rounded-xl p-4 space-y-2" style={{ backgroundColor: '#1A1D27' }}>
              {[{ l: 'Club', v: aiData.currentClub }, { l: 'League', v: aiData.league }, { l: 'Market Value', v: aiData.marketValue }, { l: 'Contract', v: aiData.contractUntil }, { l: 'Agent', v: aiData.agent || aiData.agencyName }, { l: 'Int. Caps', v: aiData.internationalCaps }, { l: 'Rating', v: aiData.rating }].filter(r => r.v).map((r, i) => (
                <div key={i} className="flex justify-between text-sm" style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 8, marginBottom: 4 }}><span style={{ color: C.muted }}>{r.l}</span><span className="font-semibold" style={{ color: C.text }}>{r.v}</span></div>
              ))}
            </div>
            {aiData.previousClubs?.length > 0 && (
              <div className="rounded-xl p-4" style={{ backgroundColor: '#1A1D27' }}>
                <div className="text-xs font-bold mb-2" style={{ color: C.muted }}>PREVIOUS CLUBS</div>
                <div className="flex flex-wrap gap-2">{aiData.previousClubs.map((c: string, i: number) => <span key={i} className="px-2 py-1 rounded-lg text-xs" style={{ backgroundColor: '#111318', color: C.text }}>{c}</span>)}</div>
              </div>
            )}
            {aiData.strengths?.length > 0 && (
              <div className="rounded-xl p-4" style={{ backgroundColor: '#1A1D27' }}>
                <div className="text-xs font-bold mb-2" style={{ color: C.muted }}>STRENGTHS</div>
                <div className="flex flex-wrap gap-2">{aiData.strengths.map((s: string, i: number) => <span key={i} className="px-2 py-1 rounded-lg text-xs" style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22C55E' }}>{s}</span>)}</div>
              </div>
            )}
            {aiData.summary && <div className="text-sm rounded-xl p-4" style={{ backgroundColor: '#1A1D27', color: C.muted }}>{aiData.summary}</div>}
            <div className="flex gap-2">
              <button className="px-4 py-2 rounded-lg text-xs font-bold" style={{ backgroundColor: 'rgba(0,61,165,0.15)', color: C.yellow, border: '1px solid rgba(0,61,165,0.3)' }}>Add to Scouting DB</button>
              <button className="px-4 py-2 rounded-lg text-xs font-bold" style={{ backgroundColor: 'rgba(0,61,165,0.15)', color: C.yellow, border: '1px solid rgba(0,61,165,0.3)' }}>Add to Transfer Pipeline</button>
            </div>
            <div className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', color: '#FBBF24' }}>Data sourced via Claude AI — verify before making decisions</div>
          </div>
        )}

        {/* Tabbed view with API data */}
        {playerId && !ppLoading && (
          <div className="p-6 pt-2 space-y-4">
            <div className="flex gap-2 flex-wrap">{(['season', 'history', 'career', 'profile'] as const).map(tab => (
              <button key={tab} onClick={() => setPpTab(tab)} className="px-4 py-2 rounded-lg text-xs font-semibold capitalize" style={{ backgroundColor: ppTab === tab ? 'rgba(0,61,165,0.15)' : '#111318', color: ppTab === tab ? C.yellow : C.muted, border: `1px solid ${ppTab === tab ? 'rgba(0,61,165,0.3)' : C.border}` }}>
                {tab === 'season' ? 'This Season' : tab === 'history' ? 'Club History' : tab === 'career' ? 'Career Stats' : 'Profile'}
              </button>
            ))}</div>

            {/* Tab 1: This Season */}
            {ppTab === 'season' && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  {[{ l: 'Apps', v: gm.appearences ?? '—' }, { l: 'Goals', v: gl.total ?? 0 }, { l: 'Assists', v: gl.assists ?? 0 }, { l: 'Minutes', v: gm.minutes ?? '—' }].map((s, i) => (
                    <div key={i} className="rounded-lg p-3 text-center" style={{ backgroundColor: '#1A1D27' }}><div className="text-lg font-black" style={{ color: C.text }}>{s.v}</div><div className="text-xs" style={{ color: C.muted }}>{s.l}</div></div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[{ l: 'Yellows', v: cd.yellow ?? 0, c: '#EAB308' }, { l: 'Reds', v: cd.red ?? 0, c: '#EF4444' }, { l: 'Rating', v: gm.rating ? parseFloat(gm.rating).toFixed(1) : '—', c: C.teal }].map((s, i) => (
                    <div key={i} className="rounded-lg p-3 text-center" style={{ backgroundColor: '#1A1D27' }}><div className="text-lg font-black" style={{ color: s.c }}>{s.v}</div><div className="text-xs" style={{ color: C.muted }}>{s.l}</div></div>
                  ))}
                </div>
                <div className="rounded-xl p-4" style={{ backgroundColor: '#1A1D27' }}>
                  <div className="text-xs font-bold mb-3" style={{ color: C.muted }}>DETAILED STATS</div>
                  <div className="space-y-2">
                    {[
                      { l: 'Goals per 90', v: gm.minutes && gl.total ? ((gl.total / gm.minutes) * 90).toFixed(2) : '—' },
                      { l: 'Assists per 90', v: gm.minutes && gl.assists ? ((gl.assists / gm.minutes) * 90).toFixed(2) : '—' },
                      { l: 'Pass accuracy', v: ps.accuracy ? `${ps.accuracy}%` : '—' },
                      { l: 'Shots per game', v: gm.appearences && sh.total ? (sh.total / gm.appearences).toFixed(1) : '—' },
                      { l: 'Dribbles per game', v: gm.appearences && dr.attempts ? (dr.attempts / gm.appearences).toFixed(1) : '—' },
                      { l: 'Key passes', v: ps.key ?? '—' },
                      { l: 'Tackles', v: st?.tackles?.total ?? '—' },
                      { l: 'Interceptions', v: st?.tackles?.interceptions ?? '—' },
                    ].map((r, i) => (
                      <div key={i} className="flex justify-between text-sm"><span style={{ color: C.muted }}>{r.l}</span><span className="font-semibold" style={{ color: C.text }}>{r.v}</span></div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Club History */}
            {ppTab === 'history' && (
              <div className="space-y-1">
                {transferData.length === 0 && <div className="text-sm text-center py-8" style={{ color: C.muted }}>No transfer history available</div>}
                {transferData.map((t: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 relative">
                    <div className="flex flex-col items-center" style={{ width: 20, minHeight: 60 }}>
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: i === 0 ? C.blue : '#374151', border: `2px solid ${i === 0 ? C.yellow : '#6B7280'}`, marginTop: 4 }} />
                      {i < transferData.length - 1 && <div className="w-0.5 flex-1" style={{ backgroundColor: '#374151' }} />}
                    </div>
                    <div className="flex-1 rounded-xl p-3 mb-2" style={{ backgroundColor: '#1A1D27' }}>
                      <div className="flex items-center gap-2 mb-1">
                        {t.teams?.out?.logo && <img src={t.teams.out.logo} alt="" className="w-5 h-5 object-contain" />}
                        <span className="text-xs" style={{ color: C.muted }}>{t.teams?.out?.name || '?'}</span>
                        <span className="text-xs" style={{ color: '#6B7280' }}>&rarr;</span>
                        {t.teams?.in?.logo && <img src={t.teams.in.logo} alt="" className="w-5 h-5 object-contain" />}
                        <span className="text-sm font-semibold" style={{ color: C.text }}>{t.teams?.in?.name || '?'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span style={{ color: C.muted }}>{t.date ? new Date(t.date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '—'}</span>
                        <span className="px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: t.type === 'Free' ? 'rgba(34,197,94,0.12)' : t.type === 'Loan' ? 'rgba(59,130,246,0.12)' : 'rgba(245,158,11,0.12)', color: t.type === 'Free' ? '#22C55E' : t.type === 'Loan' ? '#3B82F6' : '#F59E0B' }}>{t.type || 'Transfer'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 3: Career Stats */}
            {ppTab === 'career' && (
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#1A1D27', border: `1px solid ${C.border}` }}>
                {careerStats.length === 0 && <div className="text-sm text-center py-8" style={{ color: C.muted }}>No career data available</div>}
                {careerStats.length > 0 && (
                  <table className="w-full text-xs">
                    <thead><tr style={{ borderBottom: `1px solid ${C.border}`, color: C.muted }}><th className="text-left p-3">Season</th><th className="text-left p-3">Club</th><th className="text-left p-3">League</th><th className="text-center p-3">Apps</th><th className="text-center p-3">Goals</th><th className="text-center p-3">Assists</th><th className="text-center p-3">Rating</th></tr></thead>
                    <tbody>{careerStats.map((s, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td className="p-3 font-semibold" style={{ color: C.text }}>{s.season}</td>
                        <td className="p-3"><div className="flex items-center gap-2">{s.clubLogo && <img src={s.clubLogo} alt="" className="w-4 h-4 object-contain" />}<span style={{ color: C.text }}>{s.club}</span></div></td>
                        <td className="p-3" style={{ color: C.muted }}>{s.league}</td>
                        <td className="p-3 text-center" style={{ color: C.text }}>{s.apps}</td>
                        <td className="p-3 text-center font-bold" style={{ color: C.text }}>{s.goals}</td>
                        <td className="p-3 text-center" style={{ color: C.teal }}>{s.assists}</td>
                        <td className="p-3 text-center" style={{ color: parseFloat(s.rating) >= 7 ? '#22C55E' : C.muted }}>{s.rating}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                )}
              </div>
            )}

            {/* Tab 4: Profile */}
            {ppTab === 'profile' && (
              <div className="space-y-4">
                <div className="rounded-xl p-4" style={{ backgroundColor: '#1A1D27' }}>
                  <div className="text-xs font-bold mb-3" style={{ color: C.muted }}>PERSONAL INFO</div>
                  <div className="space-y-2">
                    {[
                      { l: 'Full Name', v: `${pi.firstname || ''} ${pi.lastname || ''}`.trim() || pi.name },
                      { l: 'Date of Birth', v: pi.birth?.date ? new Date(pi.birth.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
                      { l: 'Place of Birth', v: [pi.birth?.place, pi.birth?.country].filter(Boolean).join(', ') || '—' },
                      { l: 'Nationality', v: pi.nationality || '—' },
                      { l: 'Height', v: pi.height || '—' },
                      { l: 'Weight', v: pi.weight || '—' },
                    ].map((r, i) => (
                      <div key={i} className="flex justify-between text-sm" style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 6 }}><span style={{ color: C.muted }}>{r.l}</span><span className="font-semibold" style={{ color: C.text }}>{r.v}</span></div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl p-4" style={{ backgroundColor: '#1A1D27' }}>
                  <div className="text-xs font-bold mb-3" style={{ color: C.muted }}>SEASON DETAILS</div>
                  <div className="space-y-2">
                    {[
                      { l: 'Position', v: gm.position || pos || '—' },
                      { l: 'Shirt Number', v: gm.number ?? pInfo.number ?? '—' },
                      { l: 'Captain', v: gm.captain ? 'Yes' : 'No' },
                      { l: 'League', v: st?.league?.name || '—' },
                      { l: 'Minutes Played', v: gm.minutes ? gm.minutes.toLocaleString() : '—' },
                      { l: 'Lineups / Sub', v: `${gm.lineups ?? '—'} / ${(gm.appearences ?? 0) - (gm.lineups ?? 0)}` },
                    ].map((r, i) => (
                      <div key={i} className="flex justify-between text-sm" style={{ borderBottom: `1px solid ${C.border}`, paddingBottom: 6 }}><span style={{ color: C.muted }}>{r.l}</span><span className="font-semibold" style={{ color: C.text }}>{r.v}</span></div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button className="px-4 py-2 rounded-lg text-xs font-bold" style={{ backgroundColor: 'rgba(0,61,165,0.15)', color: C.yellow, border: '1px solid rgba(0,61,165,0.3)' }}>Add to Scouting DB</button>
                  <button className="px-4 py-2 rounded-lg text-xs font-bold" style={{ backgroundColor: 'rgba(0,61,165,0.15)', color: C.yellow, border: '1px solid rgba(0,61,165,0.3)' }}>Add to Transfer Pipeline</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── TEAMS VIEW ──────────────────────────────────────────────────────────────
export function TeamsView() {
  const [selectedLeague, setSelectedLeague] = useState<typeof TIER_LEAGUES[0] | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<any>(null)
  const [squadData, setSquadData] = useState<any[]>([])
  const [teamFixtures, setTeamFixtures] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [squadLoading, setSquadLoading] = useState(false)
  const [standingsData, setStandingsData] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'squad' | 'fixtures' | 'results' | 'lumio-data-pro' | 'injuries' | 'staff'>('squad')
  const [injuryData, setInjuryData] = useState<any[]>([])
  const [injuryLoading, setInjuryLoading] = useState(false)
  const [showInjuredOnly, setShowInjuredOnly] = useState(false)
  const [manualInjuries, setManualInjuries] = useState<any[]>([])
  const [showInjuryForm, setShowInjuryForm] = useState(false)
  const [injuryForm, setInjuryForm] = useState({ playerName: '', injuryType: '', dateInjured: new Date().toISOString().split('T')[0], expectedReturn: '', notes: '' })
  const [staffData, setStaffData] = useState<any>(null)
  const [coachData, setCoachData] = useState<any[]>([])
  const [staffLoading, setStaffLoading] = useState(false)
  const [staffLoaded, setStaffLoaded] = useState(false)
  const [profilePlayer, setProfilePlayer] = useState<any>(null)

  // Load manual injuries from localStorage
  useEffect(() => {
    try { const stored = localStorage.getItem('football_injuries'); if (stored) setManualInjuries(JSON.parse(stored)) } catch { /* */ }
  }, [])

  function saveManualInjury() {
    if (!injuryForm.playerName || !injuryForm.injuryType) return
    const entry = { ...injuryForm, id: Date.now().toString(), manual: true }
    const updated = [...manualInjuries, entry]
    setManualInjuries(updated)
    localStorage.setItem('football_injuries', JSON.stringify(updated))
    setInjuryForm({ playerName: '', injuryType: '', dateInjured: new Date().toISOString().split('T')[0], expectedReturn: '', notes: '' })
    setShowInjuryForm(false)
  }

  function markAsReturned(id: string) {
    const updated = manualInjuries.filter(m => m.id !== id)
    setManualInjuries(updated)
    localStorage.setItem('football_injuries', JSON.stringify(updated))
  }

  async function loadLeague(league: typeof TIER_LEAGUES[0]) {
    setSelectedLeague(league); setSelectedTeam(null); setSquadData([]); setLoading(true)
    try {
      const res = await fetch(`/api/football/standings?leagueId=${league.leagueId}&season=2025`)
      const data = await res.json()
      setStandingsData(data?.response?.[0]?.league?.standings?.[0] || [])
    } catch { setStandingsData([]) }
    setLoading(false)
  }

  async function loadTeam(team: any) {
    setSelectedTeam(team); setSquadLoading(true); setSquadData([]); setTeamFixtures([]); setInjuryData([]); setStaffData(null); setCoachData([]); setStaffLoaded(false)
    const teamId = team.team?.id || TEAM_IDS[team.team?.name]
    if (!teamId) { setSquadLoading(false); return }
    try {
      const [squadRes, fixtRes, lastRes] = await Promise.all([
        fetch(`/api/football/squad?teamId=${teamId}`),
        fetch(`/api/football/fixtures?teamId=${teamId}&season=2025&next=5`),
        fetch(`/api/football/fixtures?teamId=${teamId}&season=2025&last=5`),
      ])
      const [squadJson, fixtJson, lastJson] = await Promise.all([squadRes.json(), fixtRes.json(), lastRes.json()])
      setSquadData(squadJson?.response?.[0]?.players || [])
      setTeamFixtures([...(lastJson?.response || []).reverse(), ...(fixtJson?.response || [])])
    } catch { /* */ }
    // Fetch injuries + coach in parallel
    setInjuryLoading(true)
    try {
      const leagueId = selectedLeague?.leagueId || 41
      const [injRes, coachRes] = await Promise.all([
        fetch(`/api/football/injuries?teamId=${teamId}&season=2025&leagueId=${leagueId}`),
        fetch(`/api/football/coach?teamId=${teamId}`),
      ])
      const [injJson, coachJson] = await Promise.all([injRes.json(), coachRes.json()])
      setInjuryData(injJson?.response || [])
      setCoachData(coachJson?.response || [])
    } catch { setInjuryData([]) }
    setInjuryLoading(false)
    setSquadLoading(false)
  }

  async function loadStaff() {
    if (staffLoaded || !selectedTeam) return
    setStaffLoading(true)
    const teamId = selectedTeam.team?.id || TEAM_IDS[selectedTeam.team?.name]
    const clubName = selectedTeam.team?.name || ''
    const league = selectedLeague?.name || ''
    try {
      const [coachRes, aiRes] = await Promise.all([
        teamId ? fetch(`/api/football/coach?teamId=${teamId}`) : Promise.resolve(null),
        fetch('/api/ai/club-staff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clubName, league }) }),
      ])
      if (coachRes) { const cj = await coachRes.json(); setCoachData(cj?.response || []) }
      const aj = await aiRes.json()
      if (!aj.error) setStaffData(aj)
    } catch { /* */ }
    setStaffLoading(false)
    setStaffLoaded(true)
  }

  const filteredTeams = search ? standingsData.filter((t: any) => t.team?.name?.toLowerCase().includes(search.toLowerCase())) : standingsData

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6"><span className="text-xl">🏟️</span><h2 className="text-xl font-bold" style={{ color: C.text }}>Teams</h2><p className="text-sm ml-2" style={{ color: C.muted }}>Browse all clubs across the English football pyramid</p></div>

      {!selectedTeam && (<>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{TIER_LEAGUES.map((l, i) => (
          <button key={i} onClick={() => loadLeague(l)} className={`p-4 rounded-xl border text-left transition-all ${selectedLeague?.name === l.name ? colourMap[l.colour] : 'bg-[#0d0f1a] border-gray-800 hover:border-gray-600'}`}>
            <div className="text-sm font-semibold" style={{ color: C.text }}>{l.name}</div><div className="text-xs mt-0.5" style={{ color: C.muted }}>Tier {l.tier}</div>
          </button>
        ))}</div>
        {selectedLeague && <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${selectedLeague.name} clubs...`} className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: '#1F2937', border: `1px solid ${C.border}`, color: C.text }} />}
        {loading && <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 rounded-full animate-spin mr-3" style={{ borderColor: C.border, borderTopColor: C.blue }} /><span className="text-sm" style={{ color: C.muted }}>Loading clubs...</span></div>}
        {filteredTeams.length > 0 && <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{filteredTeams.map((t: any, i: number) => (
          <button key={i} onClick={() => loadTeam(t)} className="p-4 rounded-xl border text-left flex items-center gap-3 transition-all hover:border-blue-600/40" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
            {t.team?.logo && <img src={t.team.logo} alt="" className="w-8 h-8 object-contain" />}
            <div><div className="text-sm font-semibold" style={{ color: C.text }}>{t.team?.name}</div><div className="text-xs" style={{ color: C.muted }}>{t.rank}{t.rank === 1 ? 'st' : t.rank === 2 ? 'nd' : t.rank === 3 ? 'rd' : 'th'} · {t.points} pts</div></div>
          </button>
        ))}</div>}
      </>)}

      {selectedTeam && (
        <div className="space-y-4">
          <button onClick={() => { setSelectedTeam(null); setSquadData([]) }} className="text-xs" style={{ color: C.muted }}>← Back to {selectedLeague?.name}</button>
          <div className="rounded-xl p-5" style={{ background: 'linear-gradient(135deg, rgba(0,61,165,0.15), rgba(0,0,0,0.1))', border: '1px solid rgba(0,61,165,0.3)' }}>
            <div className="flex items-center gap-4 mb-4">
              {selectedTeam.team?.logo && <img src={selectedTeam.team.logo} alt="" className="w-16 h-16 object-contain" />}
              <div><h3 className="text-2xl font-black" style={{ color: C.text }}>{selectedTeam.team?.name}</h3><div className="text-sm" style={{ color: C.muted }}>{selectedLeague?.name} · 2025-26</div></div>
              <div className="ml-auto text-right"><div className="text-3xl font-black" style={{ color: C.text }}>{selectedTeam.rank}{selectedTeam.rank <= 3 ? ['st','nd','rd'][selectedTeam.rank-1] : 'th'}</div><div className="text-xs" style={{ color: C.muted }}>position</div></div>
            </div>
            <div className="grid grid-cols-5 gap-3">{[{ l: 'Played', v: selectedTeam.all?.played }, { l: 'Won', v: selectedTeam.all?.win }, { l: 'Drawn', v: selectedTeam.all?.draw }, { l: 'Lost', v: selectedTeam.all?.lose }, { l: 'Points', v: selectedTeam.points }].map((s, i) => (
              <div key={i} className="rounded-lg p-3 text-center" style={{ backgroundColor: '#0A0B10' }}><div className="text-lg font-bold" style={{ color: C.text }}>{s.v}</div><div className="text-xs" style={{ color: C.muted }}>{s.l}</div></div>
            ))}</div>
            {selectedTeam.form && <div className="flex items-center gap-1.5 mt-3"><span className="text-xs mr-1" style={{ color: C.muted }}>Form:</span>{selectedTeam.form.split('').slice(-5).map((r: string, i: number) => (<div key={i} className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: r === 'W' ? 'rgba(13,148,136,0.2)' : r === 'D' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)', color: r === 'W' ? C.teal : r === 'D' ? '#F59E0B' : '#EF4444' }}>{r}</div>))}</div>}
            {/* Manager Profile Card */}
            {coachData.length > 0 && (() => {
              const mgr = coachData[0]
              const currentCareer = mgr.career?.find((c: any) => c.team?.id === selectedTeam.team?.id)
              const prevClubs = mgr.career?.filter((c: any) => c.team?.id !== selectedTeam.team?.id).slice(0, 5) || []
              const w = currentCareer?.games?.win || 0; const d = currentCareer?.games?.draw || 0; const l = currentCareer?.games?.lose || 0
              return (
                <div className="mt-4 rounded-lg p-4 flex items-center gap-4 flex-wrap" style={{ backgroundColor: '#0A0B10', border: `1px solid ${C.border}` }}>
                  {mgr.photo && <img src={mgr.photo} alt="" className="w-14 h-14 rounded-full object-cover shrink-0" style={{ border: '2px solid rgba(0,61,165,0.4)' }} />}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold" style={{ color: C.text }}>{mgr.name}</div>
                    <div className="text-xs" style={{ color: C.muted }}>Manager{currentCareer?.start ? ` · In charge since ${currentCareer.start}` : ''}</div>
                    {(w > 0 || d > 0 || l > 0) && <div className="flex gap-3 mt-1">{[{l:'W',v:w,c:C.teal},{l:'D',v:d,c:'#F59E0B'},{l:'L',v:l,c:'#EF4444'}].map(s => <span key={s.l} className="text-xs font-semibold" style={{ color: s.c }}>{s.l} {s.v}</span>)}</div>}
                    {prevClubs.length > 0 && <div className="text-[11px] mt-1 truncate" style={{ color: C.muted }}>Previously: {prevClubs.map((c: any) => c.team?.name).filter(Boolean).join(', ')}</div>}
                  </div>
                </div>
              )
            })()}
          </div>
          <div className="flex gap-2 flex-wrap">{(['squad', 'fixtures', 'results', 'lumio-data-pro', 'injuries', 'staff'] as const).map(tab => (
            <button key={tab} onClick={() => { setActiveTab(tab); if (tab === 'staff') loadStaff() }} className="px-4 py-2 rounded-lg text-sm font-medium capitalize" style={{ backgroundColor: activeTab === tab ? 'rgba(0,61,165,0.15)' : C.card, color: activeTab === tab ? C.yellow : C.muted, border: `1px solid ${activeTab === tab ? 'rgba(0,61,165,0.3)' : C.border}` }}>{tab === 'fixtures' ? 'Upcoming' : tab === 'results' ? 'Results' : tab === 'lumio-data-pro' ? '\u{1F4CA} Lumio Data Pro' : tab === 'injuries' ? '\u{1F915} Injuries' : tab === 'staff' ? '\u{1F465} Staff & Board' : 'Squad'}</button>
          ))}</div>
          {squadLoading && <Spinner text="Loading..." />}
          {activeTab === 'squad' && !squadLoading && (
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
              <div className="p-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
                <div><div className="text-sm font-semibold" style={{ color: C.text }}>{selectedTeam.team?.name} — Squad ({squadData.length})</div><div className="text-xs mt-0.5" style={{ color: C.muted }}>Click a player for full profile</div></div>
                {squadData.length > 0 && (
                  <button onClick={() => setShowInjuredOnly(!showInjuredOnly)} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all" style={{ backgroundColor: showInjuredOnly ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)', color: showInjuredOnly ? '#EF4444' : C.muted, border: `1px solid ${showInjuredOnly ? 'rgba(239,68,68,0.3)' : C.border}` }}>
                    {showInjuredOnly ? '🔴 Injured only' : 'Show injured only'}
                  </button>
                )}
              </div>
              {squadData.length > 0 ? (
                <table className="w-full text-sm"><thead><tr className="text-xs" style={{ borderBottom: `1px solid ${C.border}`, color: C.muted }}><th className="text-left p-3">#</th><th className="text-left p-3">Player</th><th className="text-center p-3">Pos</th><th className="text-center p-3">Age</th><th className="text-left p-3">Nationality</th><th className="text-center p-3">Status</th></tr></thead>
                <tbody>{squadData.sort((a: any, b: any) => ['Goalkeeper','Defender','Midfielder','Attacker'].indexOf(a.position) - ['Goalkeeper','Defender','Midfielder','Attacker'].indexOf(b.position)).filter((p: any) => {
                  if (!showInjuredOnly) return true
                  return injuryData.some((inj: any) => inj.player?.name?.toLowerCase() === p.name?.toLowerCase())
                }).map((p: any, i: number) => {
                  const injury = injuryData.find((inj: any) => inj.player?.name?.toLowerCase() === p.name?.toLowerCase())
                  return (
                  <tr key={i} onClick={() => setProfilePlayer(p)} className="cursor-pointer hover:bg-white/[0.02] transition-colors" style={{ borderBottom: `1px solid ${C.border}` }}><td className="p-3 text-xs" style={{ color: C.muted }}>{p.number || '—'}</td><td className="p-3">{p.photo && <img src={p.photo} alt="" className="w-6 h-6 rounded-full inline mr-2 object-cover" />}<span className="font-medium" style={{ color: C.text }}>{p.name}</span></td><td className="p-3 text-center"><span className={`text-xs px-1.5 py-0.5 rounded ${posColour(p.position)}`}>{posShort(p.position)}</span></td><td className="p-3 text-center" style={{ color: C.muted }}>{p.age}</td><td className="p-3 text-sm" style={{ color: C.muted }}>{p.nationality}</td>
                  <td className="p-3 text-center">{injury ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>{injury.player?.reason || 'Injured'}</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#22C55E' }}>{'\u2713'} Fit</span>
                  )}</td></tr>
                )})}</tbody></table>
              ) : <div className="p-8 text-center text-sm" style={{ color: C.muted }}>Squad data not available — connect API-Football key</div>}
            </div>
          )}
          {(activeTab === 'fixtures' || activeTab === 'results') && !squadLoading && (
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
              <div className="p-4" style={{ borderBottom: `1px solid ${C.border}` }}><div className="text-sm font-semibold" style={{ color: C.text }}>{activeTab === 'fixtures' ? 'Upcoming' : 'Results'}</div></div>
              {teamFixtures.filter((f: any) => activeTab === 'fixtures' ? f.fixture?.status?.short === 'NS' : f.fixture?.status?.short !== 'NS').slice(0, 8).map((f: any, i: number) => {
                const isHome = f.teams?.home?.name === selectedTeam.team?.name; const opp = isHome ? f.teams?.away : f.teams?.home
                const h = f.goals?.home; const a = f.goals?.away; const s = isHome ? h : a; const c = isHome ? a : h
                const r = s !== null && c !== null ? (s > c ? 'W' : s < c ? 'L' : 'D') : null
                return (<div key={i} className="flex items-center gap-4 p-4" style={{ borderBottom: `1px solid ${C.border}` }}>
                  <div className="text-xs w-16" style={{ color: C.muted }}>{new Date(f.fixture?.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                  {r && <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: r === 'W' ? 'rgba(13,148,136,0.2)' : r === 'D' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)', color: r === 'W' ? C.teal : r === 'D' ? '#F59E0B' : '#EF4444' }}>{r}</div>}
                  <span className="text-xs w-8" style={{ color: C.muted }}>{isHome ? 'H' : 'A'}</span>
                  {opp?.logo && <img src={opp.logo} alt="" className="w-6 h-6 object-contain shrink-0" />}
                  <span className="text-sm flex-1" style={{ color: C.text }}>{opp?.name}</span>
                  {s !== null ? <span className="text-sm font-bold" style={{ color: C.text }}>{isHome ? `${h}–${a}` : `${a}–${h}`}</span> : <span className="text-xs" style={{ color: C.muted }}>{new Date(f.fixture?.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>}
                </div>)
              })}
              {teamFixtures.filter((f: any) => activeTab === 'fixtures' ? f.fixture?.status?.short === 'NS' : f.fixture?.status?.short !== 'NS').length === 0 && <div className="p-8 text-center text-sm" style={{ color: C.muted }}>No data — connect API-Football key</div>}
            </div>
          )}
          {activeTab === 'lumio-data-pro' && <FootballDataPanel teamName={selectedTeam.team?.name || ''} />}

          {activeTab === 'injuries' && !squadLoading && (
            <div className="space-y-4">
              {/* Summary strip */}
              {(() => {
                const apiInjured = injuryData.length
                const returningThisWeek = injuryData.filter((inj: any) => {
                  // Estimate from date if available
                  return false // API doesn't always provide return dates
                }).length
                const manualCount = manualInjuries.length
                const total = apiInjured + manualCount
                const longTerm = injuryData.filter((inj: any) => inj.player?.type === 'Missing Fixture').length
                return (
                  <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{total} player{total !== 1 ? 's' : ''} injured</span>
                      <span className="text-xs" style={{ color: '#6B7280' }}>&middot;</span>
                      <span className="text-xs" style={{ color: '#F59E0B' }}>{returningThisWeek} returning this week</span>
                      <span className="text-xs" style={{ color: '#6B7280' }}>&middot;</span>
                      <span className="text-xs" style={{ color: '#EF4444' }}>{longTerm} long-term</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full overflow-hidden flex" style={{ backgroundColor: '#1F2937' }}>
                      {total > 0 && <div className="h-full" style={{ width: `${Math.round((apiInjured / Math.max(total, 1)) * 100)}%`, backgroundColor: '#EF4444' }} />}
                      {manualCount > 0 && <div className="h-full" style={{ width: `${Math.round((manualCount / Math.max(total, 1)) * 100)}%`, backgroundColor: '#F59E0B' }} />}
                    </div>
                  </div>
                )
              })()}

              {/* Log Injury button */}
              <button onClick={() => setShowInjuryForm(!showInjuryForm)} className="px-4 py-2 rounded-xl text-sm font-bold" style={{ backgroundColor: 'rgba(0,61,165,0.15)', color: '#F1C40F', border: '1px solid rgba(0,61,165,0.3)' }}>
                {showInjuryForm ? 'Cancel' : '+ Log Injury'}
              </button>

              {/* Manual injury form */}
              {showInjuryForm && (
                <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <div className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Log Manual Injury</div>
                  <div>
                    <label className="text-xs block mb-1" style={{ color: '#6B7280' }}>Player</label>
                    <select value={injuryForm.playerName} onChange={e => setInjuryForm(f => ({ ...f, playerName: e.target.value }))} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB' }}>
                      <option value="">Select player...</option>
                      {squadData.map((p: any, i: number) => <option key={i} value={p.name}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs block mb-1" style={{ color: '#6B7280' }}>Injury Type</label>
                    <input value={injuryForm.injuryType} onChange={e => setInjuryForm(f => ({ ...f, injuryType: e.target.value }))} placeholder="e.g. Hamstring, Ankle ligament" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB' }} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs block mb-1" style={{ color: '#6B7280' }}>Date Injured</label>
                      <input type="date" value={injuryForm.dateInjured} onChange={e => setInjuryForm(f => ({ ...f, dateInjured: e.target.value }))} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB' }} />
                    </div>
                    <div>
                      <label className="text-xs block mb-1" style={{ color: '#6B7280' }}>Expected Return</label>
                      <input type="date" value={injuryForm.expectedReturn} onChange={e => setInjuryForm(f => ({ ...f, expectedReturn: e.target.value }))} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB' }} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs block mb-1" style={{ color: '#6B7280' }}>Notes (optional)</label>
                    <textarea value={injuryForm.notes} onChange={e => setInjuryForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={{ backgroundColor: '#1F2937', border: '1px solid #374151', color: '#F9FAFB' }} />
                  </div>
                  <button onClick={saveManualInjury} disabled={!injuryForm.playerName || !injuryForm.injuryType} className="px-4 py-2 rounded-lg text-sm font-bold" style={{ backgroundColor: injuryForm.playerName && injuryForm.injuryType ? '#003DA5' : '#1F2937', color: injuryForm.playerName && injuryForm.injuryType ? '#F1C40F' : '#6B7280' }}>Save Injury</button>
                </div>
              )}

              {/* Injury loading */}
              {injuryLoading && <Spinner text="Loading injury data..." />}

              {/* API injuries */}
              {!injuryLoading && injuryData.length === 0 && manualInjuries.length === 0 && (
                <div className="rounded-xl p-8 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <div className="text-3xl mb-2">{'\u2705'}</div>
                  <div className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>No injuries reported</div>
                  <div className="text-xs mt-1" style={{ color: '#6B7280' }}>Full squad available. Use &quot;Log Injury&quot; to add manual entries.</div>
                </div>
              )}

              {/* Injury cards - API */}
              {injuryData.map((inj: any, i: number) => {
                const reason = inj.player?.reason || 'Unknown'
                const injType = inj.player?.type || 'Unknown'
                // Severity: we don't have exact days from API, estimate from type
                const severityColor = injType === 'Missing Fixture' ? { bg: 'rgba(239,68,68,0.12)', color: '#EF4444', label: 'Serious' }
                  : injType === 'Questionable' ? { bg: 'rgba(249,115,22,0.12)', color: '#F97316', label: 'Moderate' }
                  : injType === 'Minor' || injType === 'Doubtful' ? { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B', label: 'Minor' }
                  : { bg: 'rgba(107,114,128,0.12)', color: '#6B7280', label: 'Unknown' }
                return (
                  <div key={i} className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{inj.player?.name || 'Unknown'}</div>
                        <div className="text-xs" style={{ color: '#6B7280' }}>{inj.player?.position || ''}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: severityColor.bg, color: severityColor.color }}>{severityColor.label}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs" style={{ color: '#EF4444' }}>{reason}</span>
                      <span className="text-xs" style={{ color: '#6B7280' }}>{injType}</span>
                      {inj.fixture?.date && <span className="text-xs" style={{ color: '#6B7280' }}>Since {new Date(inj.fixture.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>}
                    </div>
                  </div>
                )
              })}

              {/* Manual injuries */}
              {manualInjuries.map((inj: any) => {
                const daysOut = inj.dateInjured && inj.expectedReturn ? Math.round((new Date(inj.expectedReturn).getTime() - new Date(inj.dateInjured).getTime()) / 86400000) : null
                const severityColor = daysOut === null ? { bg: 'rgba(107,114,128,0.12)', color: '#6B7280', label: 'Unknown' }
                  : daysOut > 28 ? { bg: 'rgba(239,68,68,0.12)', color: '#EF4444', label: 'Serious' }
                  : daysOut >= 14 ? { bg: 'rgba(249,115,22,0.12)', color: '#F97316', label: 'Moderate' }
                  : { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B', label: 'Minor' }
                return (
                  <div key={inj.id} className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{inj.playerName}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: 'rgba(0,61,165,0.12)', color: '#60A5FA' }}>Manual</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: severityColor.bg, color: severityColor.color }}>{severityColor.label}</span>
                        <button onClick={() => markAsReturned(inj.id)} className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#22C55E' }}>Mark as Returned</button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs" style={{ color: '#EF4444' }}>{inj.injuryType}</span>
                      {inj.dateInjured && <span className="text-xs" style={{ color: '#6B7280' }}>Since {new Date(inj.dateInjured).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>}
                      {inj.expectedReturn && <span className="text-xs" style={{ color: '#6B7280' }}>Return: {new Date(inj.expectedReturn).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>}
                      {inj.notes && <span className="text-xs" style={{ color: '#9CA3AF' }}>{inj.notes}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="space-y-5">
              {staffLoading && <Spinner text="Loading staff & board..." />}
              {!staffLoading && !staffData && staffLoaded && (
                <div className="rounded-xl p-8 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                  <div className="text-3xl mb-2">{'\u{1F465}'}</div>
                  <div className="text-sm font-semibold" style={{ color: C.text }}>Staff data unavailable</div>
                  <div className="text-xs mt-1" style={{ color: C.muted }}>Could not load staff information for this club.</div>
                </div>
              )}
              {!staffLoading && staffData && (() => {
                const sections: { key: string; title: string; accent: string; accentBg: string; data: any[]; icon: string }[] = [
                  { key: 'coaching', title: 'Coaching Staff', accent: '#EF4444', accentBg: 'rgba(239,68,68,0.12)', data: staffData.coaching || [], icon: '\u{1F9E0}' },
                  { key: 'medical', title: 'Medical & Performance', accent: '#14B8A6', accentBg: 'rgba(20,184,166,0.12)', data: staffData.medical || [], icon: '\u{1FA7A}' },
                  { key: 'management', title: 'Football Operations', accent: '#3B82F6', accentBg: 'rgba(59,130,246,0.12)', data: staffData.management || [], icon: '\u{1F4CB}' },
                  { key: 'board', title: 'Board & Ownership', accent: '#A855F7', accentBg: 'rgba(168,85,247,0.12)', data: staffData.board || [], icon: '\u{1F3DB}\u{FE0F}' },
                  { key: 'commercial', title: 'Commercial & Admin', accent: '#6B7280', accentBg: 'rgba(107,114,128,0.12)', data: staffData.commercial || [], icon: '\u{1F4BC}' },
                ]

                const mgrCoach = coachData.length > 0 ? coachData[0] : null

                return (<>
                  {sections.map(sec => sec.data.length > 0 && (
                    <div key={sec.key} className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                      <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid #1F2937' }}>
                        <span>{sec.icon}</span>
                        <span className="text-sm font-bold" style={{ color: C.text }}>{sec.title}</span>
                        <span className="text-xs ml-auto" style={{ color: C.muted }}>{sec.data.length} staff</span>
                      </div>
                      <div className="p-4 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
                        {sec.data.map((person: any, i: number) => {
                          const isManager = sec.key === 'coaching' && i === 0 && mgrCoach
                          const photo = isManager && mgrCoach?.photo ? mgrCoach.photo : person.photo || null
                          return (
                            <div key={i} className={`rounded-lg p-4 ${isManager ? 'col-span-full' : ''}`} style={{ backgroundColor: '#0A0B10', border: `1px solid ${isManager ? sec.accent + '40' : '#1F2937'}` }}>
                              <div className="flex items-start gap-3">
                                {photo ? (
                                  <img src={photo} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" style={{ border: `2px solid ${sec.accent}40` }} />
                                ) : (
                                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold" style={{ backgroundColor: sec.accentBg, color: sec.accent }}>
                                    {person.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-bold truncate" style={{ color: C.text }}>{person.name}</div>
                                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-1" style={{ backgroundColor: sec.accentBg, color: sec.accent }}>{person.role}</span>
                                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                    {person.nationality && <span className="text-[11px]" style={{ color: C.muted }}>{person.nationality}</span>}
                                    {person.since && <span className="text-[11px]" style={{ color: C.muted }}>&middot; Since {person.since}</span>}
                                  </div>
                                  {(person as any).background && <div className="text-[11px] mt-1" style={{ color: C.muted }}>{(person as any).background}</div>}
                                  {isManager && mgrCoach && (() => {
                                    const cur = mgrCoach.career?.find((c: any) => c.team?.id === selectedTeam.team?.id)
                                    const w = cur?.games?.win || 0; const d = cur?.games?.draw || 0; const l = cur?.games?.lose || 0
                                    const prev = mgrCoach.career?.filter((c: any) => c.team?.id !== selectedTeam.team?.id).slice(0, 4) || []
                                    return (<>
                                      {(w > 0 || d > 0 || l > 0) && <div className="flex gap-3 mt-2">{[{lb:'W',v:w,c:C.teal},{lb:'D',v:d,c:'#F59E0B'},{lb:'L',v:l,c:'#EF4444'}].map(s => <span key={s.lb} className="text-xs font-semibold" style={{ color: s.c }}>{s.lb} {s.v}</span>)}</div>}
                                      {prev.length > 0 && <div className="text-[11px] mt-1" style={{ color: C.muted }}>Previously: {prev.map((c: any) => c.team?.name).filter(Boolean).join(', ')}</div>}
                                    </>)
                                  })()}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      {sec.key === 'board' && <div className="px-5 py-2 text-[10px]" style={{ color: C.muted, borderTop: '1px solid #1F2937' }}>Board information sourced from public records</div>}
                    </div>
                  ))}
                </>)
              })()}
            </div>
          )}
        </div>
      )}

      {/* Player Profile Modal */}
      {profilePlayer && <PlayerProfileModal player={profilePlayer} onClose={() => setProfilePlayer(null)} teamName={selectedTeam?.team?.name} />}
    </div>
  )
}

// ─── STATSBOMB PANEL (Club Profile — Step 3) ────────────────────────────────
function FootballDataPanel({ teamName }: { teamName: string }) {
  const { competitions, loading: compLoading } = useFootballLeagueCompetitions()
  const [selectedComp, setSelectedComp] = useState<SBCompetition | null>(null)
  const [matches, setMatches] = useState<SBMatch[]>([])
  const [filteredMatches, setFilteredMatches] = useState<SBMatch[]>([])
  const [selectedMatch, setSelectedMatch] = useState<SBMatch | null>(null)
  const [events, setEvents] = useState<SBEvent[]>([])
  const [loading, setLoading] = useState(false)

  async function handleCompSelect(comp: SBCompetition) {
    setSelectedComp(comp); setSelectedMatch(null); setEvents([]); setLoading(true)
    try {
      const res = await fetch(`/api/football/statsbomb?type=matches&compId=${comp.competition_id}&seasonId=${comp.season_id}`)
      const data: SBMatch[] = await res.json()
      const clubMatches = data.filter((m: SBMatch) =>
        m.home_team?.home_team_name?.toLowerCase().includes(teamName.toLowerCase()) ||
        m.away_team?.away_team_name?.toLowerCase().includes(teamName.toLowerCase())
      ).sort((a: SBMatch, b: SBMatch) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime())
      setMatches(data)
      setFilteredMatches(clubMatches)
    } catch { setMatches([]); setFilteredMatches([]) }
    setLoading(false)
  }

  async function loadEvents(match: SBMatch) {
    setSelectedMatch(match); setEvents([]); setLoading(true)
    try {
      const res = await fetch(`/api/football/statsbomb?type=events&matchId=${match.match_id}`)
      const data: SBEvent[] = await res.json()
      setEvents(data)
    } catch { setEvents([]) }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg w-fit" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
        <span className="text-xs font-semibold" style={{ color: '#F87171' }}>Powered by Lumio Data Open Data — available for selected competitions</span>
      </div>
      <div className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', color: '#FBBF24' }}>Lumio Data open data covers historical seasons of selected competitions. For current season data, a Lumio Data Pro licence is required.</div>

      {(compLoading || loading) && <Spinner />}

      {!selectedComp && !compLoading && !loading && (
        <div className="space-y-3">
          <div className="text-xs font-semibold mb-2" style={{ color: C.muted }}>Select a competition to find {teamName} matches</div>
          <CompetitionSeasonSelector competitions={competitions} onSelect={handleCompSelect} />
          {competitions.length === 0 && <div className="text-center py-6 text-sm" style={{ color: C.muted }}>No competitions available</div>}
        </div>
      )}

      {selectedComp && !selectedMatch && !loading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <button onClick={() => { setSelectedComp(null); setMatches([]); setFilteredMatches([]) }} className="text-xs hover:underline" style={{ color: '#60A5FA' }}>← Back to competitions</button>
            <span className="text-xs" style={{ color: C.muted }}>{selectedComp.competition_name} · {selectedComp.season_name}</span>
          </div>
          <div className="text-xs" style={{ color: C.muted }}>{filteredMatches.length} matches involving {teamName}</div>
          <div className="space-y-2" style={{ maxHeight: 400, overflowY: 'auto' }}>
            {filteredMatches.map((m, i) => (
              <button key={i} onClick={() => loadEvents(m)} className="w-full p-3 rounded-xl border text-left flex items-center gap-4 transition-all hover:border-blue-600/40" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
                <div className="text-xs w-16 shrink-0" style={{ color: C.muted }}>{new Date(m.match_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
                <span className="text-sm font-semibold flex-1" style={{ color: C.text }}>{m.home_team?.home_team_name}</span>
                <span className="text-sm font-black w-12 text-center" style={{ color: C.text }}>{m.home_score}–{m.away_score}</span>
                <span className="text-sm font-semibold flex-1" style={{ color: C.text }}>{m.away_team?.away_team_name}</span>
              </button>
            ))}
            {filteredMatches.length === 0 && <div className="text-center py-6 text-sm" style={{ color: C.muted }}>No matches found for {teamName} in this competition</div>}
          </div>
          <FootballDataBadge />
        </div>
      )}

      {selectedMatch && !loading && events.length > 0 && (
        <MatchAnalyticsPanel match={selectedMatch} events={events} onBack={() => { setSelectedMatch(null); setEvents([]) }} />
      )}

      {selectedMatch && !loading && events.length === 0 && (
        <div className="rounded-xl p-8 text-center" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
          <div className="text-3xl mb-2">📊</div>
          <div className="text-sm font-semibold" style={{ color: C.text }}>No event data available</div>
          <div className="text-xs mt-1" style={{ color: C.muted }}>This match may not have detailed event data in the Lumio Data open dataset</div>
        </div>
      )}
    </div>
  )
}

// ─── LEAGUES VIEW ────────────────────────────────────────────────────────────
export function LeaguesView({
  clubName = 'AFC Wimbledon',
  standings: standingsProp,
  clubId = null,
  clubTier = 'starter',
  leagueId = null,
  season = 2024,
  apiStandings = null,
  resolvedFixturesForRender = [],
  isDemo = false,
}: {
  clubName?: string
  standings?: LeagueTable[]
  clubId?: string | null
  clubTier?: ClubTier
  leagueId?: number | null
  season?: number
  apiStandings?: LeagueTable[] | null
  resolvedFixturesForRender?: any[]
  isDemo?: boolean
} = {}) {
  const [outerTab, setOuterTab] = useState<'standings' | 'comparison'>('standings')
  const [selectedLeague, setSelectedLeague] = useState<typeof TIER_LEAGUES[0] | null>(null)
  const [activeTab, setActiveTab] = useState<'table' | 'scorers' | 'assists' | 'advanced'>('table')
  const [standings, setStandings] = useState<any[]>([])
  const [scorers, setScorers] = useState<any[]>([])
  const [assists, setAssists] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null)

  const [liveStandings, setLiveStandings] = useState<any[]|null>(null)
  const [loadingStandings, setLoadingStandings] = useState(false)
  useEffect(() => {
    setLoadingStandings(true)
    fetch('/api/football/standings?leagueId=41&season=2025')
      .then(r => r.ok ? r.json() : null)
      .then(data => { const items = data?.response || data?.data || data; if (Array.isArray(items) && items.length > 0) setLiveStandings(items) })
      .catch(() => {})
      .finally(() => setLoadingStandings(false))
  }, [])

  async function loadLeagueData(league: typeof TIER_LEAGUES[0]) {
    setSelectedLeague(league); setLoading(true); setStandings([]); setScorers([]); setAssists([])
    try {
      const [stRes, scRes, asRes] = await Promise.all([
        fetch(`/api/football/standings?leagueId=${league.leagueId}&season=2025`),
        fetch(`/api/football/topscorers?leagueId=${league.leagueId}&season=2025`),
        fetch(`/api/football/topassists?leagueId=${league.leagueId}&season=2025`),
      ])
      const [stJson, scJson, asJson] = await Promise.all([stRes.json(), scRes.json(), asRes.json()])
      setStandings(stJson?.response?.[0]?.league?.standings?.[0] || [])
      setScorers(scJson?.response || [])
      setAssists(asJson?.response || [])
    } catch { /* */ }
    setLoading(false)
  }

  const tabStrip = (
    <div className="flex gap-1.5 mb-3">
      {(['standings', 'comparison'] as const).map((t) => (
        <button key={t} onClick={() => setOuterTab(t)} className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{
          backgroundColor: outerTab === t ? 'rgba(0,61,165,0.15)' : 'transparent',
          color: outerTab === t ? C.yellow : '#6B7280',
          border: `1px solid ${outerTab === t ? 'rgba(0,61,165,0.4)' : C.border}`,
        }}>{t === 'standings' ? '📋 Standings' : '📊 Club Comparison'}</button>
      ))}
    </div>
  )

  if (outerTab === 'comparison') {
    return (
      <div className="space-y-4">
        {tabStrip}
        <ClubComparisonView
          clubId={clubId}
          clubName={clubName}
          clubTier={clubTier}
          leagueId={leagueId}
          season={season}
          apiStandings={apiStandings}
          resolvedFixturesForRender={resolvedFixturesForRender}
          isDemo={isDemo}
        />
      </div>
    )
  }

  if (standingsProp && standingsProp.length > 0) {
    return (
      <div className="space-y-6">
        {tabStrip}
        <div className="flex items-center gap-2 mb-6"><span className="text-xl">🏆</span><h2 className="text-xl font-bold" style={{ color: C.text }}>Leagues & Tables</h2><p className="text-sm ml-2" style={{ color: C.muted }}>Live standings from API-Football</p></div>
        <div className="rounded-xl overflow-hidden mb-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
          <div className="p-4 flex items-center gap-2" style={{ borderBottom: `1px solid ${C.border}` }}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
            <div className="text-sm font-semibold" style={{ color: C.text }}>Your league — live</div>
          </div>
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-xs" style={{ borderBottom: `1px solid ${C.border}`, color: C.muted }}><th className="text-left p-3 w-8">#</th><th className="text-left p-3">Club</th><th className="text-center p-3">P</th><th className="text-center p-3">W</th><th className="text-center p-3">D</th><th className="text-center p-3">L</th><th className="text-center p-3">GD</th><th className="text-center p-3 font-bold">Pts</th><th className="text-center p-3">Form</th></tr></thead>
          <tbody>{standingsProp.map((t, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: t.teamName === clubName ? 'rgba(0,61,165,0.08)' : undefined }}>
              <td className="p-3"><span className="text-xs font-bold" style={{ color: C.muted }}>{t.rank}</span></td>
              <td className="p-3"><div className="flex items-center gap-2">{t.teamLogo && <img src={t.teamLogo} alt="" className="w-5 h-5 object-contain" />}<span className="font-medium" style={{ color: t.teamName === clubName ? '#60A5FA' : C.text }}>{t.teamName}</span>{t.teamName === clubName && <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(0,61,165,0.15)', color: C.yellow }}>You</span>}</div></td>
              <td className="p-3 text-center" style={{ color: C.muted }}>{t.played}</td>
              <td className="p-3 text-center" style={{ color: C.teal }}>{t.won}</td>
              <td className="p-3 text-center" style={{ color: '#F59E0B' }}>{t.drawn}</td>
              <td className="p-3 text-center" style={{ color: '#EF4444' }}>{t.lost}</td>
              <td className="p-3 text-center font-medium" style={{ color: t.gd > 0 ? C.teal : t.gd < 0 ? '#EF4444' : C.muted }}>{t.gd > 0 ? '+' : ''}{t.gd}</td>
              <td className="p-3 text-center font-bold" style={{ color: C.text }}>{t.points}</td>
              <td className="p-3"><div className="flex gap-0.5 justify-center">{(t.form || '').split('').slice(-5).map((r, j) => (<div key={j} className="w-4 h-4 rounded-sm flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: r === 'W' ? 'rgba(13,148,136,0.3)' : r === 'D' ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)', color: r === 'W' ? C.teal : r === 'D' ? '#F59E0B' : '#EF4444' }}>{r}</div>))}</div></td>
            </tr>
          ))}</tbody></table></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {tabStrip}
      <div className="flex items-center gap-2 mb-6"><span className="text-xl">🏆</span><h2 className="text-xl font-bold" style={{ color: C.text }}>Leagues & Tables</h2><p className="text-sm ml-2" style={{ color: C.muted }}>Live standings, top scorers and assists</p></div>
      {loadingStandings && (
        <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
          <div className="w-3 h-3 border border-gray-600 border-t-blue-500 rounded-full animate-spin"/>
          Loading live standings...
        </div>
      )}
      {liveStandings && (
        <div className="flex items-center gap-2 mb-3 text-xs text-emerald-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
          Live League One table from API-Football
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{TIER_LEAGUES.map((l, i) => (
        <button key={i} onClick={() => loadLeagueData(l)} className={`p-4 rounded-xl border text-left transition-all ${selectedLeague?.name === l.name ? colourMap[l.colour] : 'bg-[#0d0f1a] border-gray-800 hover:border-gray-600'}`}>
          <div className="text-sm font-semibold" style={{ color: C.text }}>{l.name}</div><div className="text-xs mt-0.5" style={{ color: C.muted }}>Tier {l.tier}</div>
        </button>
      ))}</div>
      {loading && <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 rounded-full animate-spin mr-3" style={{ borderColor: C.border, borderTopColor: C.blue }} /><span className="text-sm" style={{ color: C.muted }}>Loading {selectedLeague?.name}...</span></div>}
      {selectedLeague && !loading && (<>
        <div className="flex gap-2 flex-wrap">{(['table', 'scorers', 'assists', 'advanced'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className="px-4 py-2 rounded-lg text-sm font-medium capitalize" style={{ backgroundColor: activeTab === tab ? 'rgba(0,61,165,0.15)' : C.card, color: activeTab === tab ? C.yellow : C.muted, border: `1px solid ${activeTab === tab ? 'rgba(0,61,165,0.3)' : C.border}` }}>{tab === 'table' ? 'League Table' : tab === 'scorers' ? 'Top Scorers' : tab === 'assists' ? 'Top Assists' : '\u{1F4CA} Advanced Stats'}</button>
        ))}</div>
        {activeTab === 'table' && standings.length > 0 && (
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
            <div className="p-4" style={{ borderBottom: `1px solid ${C.border}` }}><div className="text-sm font-semibold" style={{ color: C.text }}>{selectedLeague.name} — 2025/26</div></div>
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-xs" style={{ borderBottom: `1px solid ${C.border}`, color: C.muted }}><th className="text-left p-3 w-8">#</th><th className="text-left p-3">Club</th><th className="text-center p-3">P</th><th className="text-center p-3">W</th><th className="text-center p-3">D</th><th className="text-center p-3">L</th><th className="text-center p-3">GF</th><th className="text-center p-3">GA</th><th className="text-center p-3">GD</th><th className="text-center p-3 font-bold">Pts</th><th className="text-center p-3">Form</th></tr></thead>
            <tbody>{standings.map((t: any, i: number) => (
              <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: t.team?.name === clubName ? 'rgba(0,61,165,0.08)' : undefined }}>
                <td className="p-3"><span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${i < 2 ? 'bg-teal-600/30 text-teal-400' : i < 6 ? 'bg-blue-600/30 text-blue-400' : i >= standings.length - 3 ? 'bg-red-600/30 text-red-400' : ''}`} style={{ color: i >= 6 && i < standings.length - 3 ? C.muted : undefined }}>{t.rank}</span></td>
                <td className="p-3"><div className="flex items-center gap-2">{t.team?.logo && <img src={t.team.logo} alt="" className="w-5 h-5 object-contain" />}<span className="font-medium" style={{ color: t.team?.name === clubName ? '#60A5FA' : C.text }}>{t.team?.name}</span>{t.team?.name === clubName && <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(0,61,165,0.15)', color: C.yellow }}>You</span>}</div></td>
                <td className="p-3 text-center" style={{ color: C.muted }}>{t.all?.played}</td><td className="p-3 text-center" style={{ color: C.teal }}>{t.all?.win}</td><td className="p-3 text-center" style={{ color: '#F59E0B' }}>{t.all?.draw}</td><td className="p-3 text-center" style={{ color: '#EF4444' }}>{t.all?.lose}</td>
                <td className="p-3 text-center" style={{ color: '#D1D5DB' }}>{t.all?.goals?.for}</td><td className="p-3 text-center" style={{ color: '#D1D5DB' }}>{t.all?.goals?.against}</td>
                <td className="p-3 text-center font-medium" style={{ color: (t.goalsDiff || 0) > 0 ? C.teal : (t.goalsDiff || 0) < 0 ? '#EF4444' : C.muted }}>{t.goalsDiff > 0 ? '+' : ''}{t.goalsDiff}</td>
                <td className="p-3 text-center font-bold" style={{ color: C.text }}>{t.points}</td>
                <td className="p-3"><div className="flex gap-0.5 justify-center">{(t.form || '').split('').slice(-5).map((r: string, j: number) => (<div key={j} className="w-4 h-4 rounded-sm flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: r === 'W' ? 'rgba(13,148,136,0.3)' : r === 'D' ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)', color: r === 'W' ? C.teal : r === 'D' ? '#F59E0B' : '#EF4444' }}>{r}</div>))}</div></td>
              </tr>
            ))}</tbody></table></div>
          </div>
        )}
        {activeTab === 'scorers' && scorers.length > 0 && (
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
            <div className="p-4" style={{ borderBottom: `1px solid ${C.border}` }}><div className="text-sm font-semibold" style={{ color: C.text }}>{selectedLeague.name} — Top Scorers</div><div className="text-xs mt-1" style={{ color: C.muted }}>Click a player for extended analytics</div></div>
            {scorers.slice(0, 20).map((s: any, i: number) => (
              <div key={i} onClick={() => setSelectedPlayer(s)} className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/[0.02] transition-colors" style={{ borderBottom: `1px solid ${C.border}` }}>
                <div className="font-bold w-6 text-center text-sm" style={{ color: C.muted }}>{i + 1}</div>
                {s.player?.photo && <img src={s.player.photo} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />}
                <div className="flex-1 min-w-0"><div className="text-sm font-semibold" style={{ color: C.text }}>{s.player?.name}</div><div className="flex items-center gap-2 mt-0.5">{s.statistics?.[0]?.team?.logo && <img src={s.statistics[0].team.logo} alt="" className="w-4 h-4 object-contain" />}<span className="text-xs" style={{ color: C.muted }}>{s.statistics?.[0]?.team?.name}</span></div></div>
                <div className="text-right"><div className="text-xl font-black" style={{ color: C.text }}>{s.statistics?.[0]?.goals?.total || 0}</div><div className="text-xs" style={{ color: C.muted }}>goals</div></div>
                <div className="text-right ml-4"><div className="text-sm font-bold" style={{ color: C.teal }}>{s.statistics?.[0]?.goals?.assists || 0}</div><div className="text-xs" style={{ color: C.muted }}>assists</div></div>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'assists' && assists.length > 0 && (
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
            <div className="p-4" style={{ borderBottom: `1px solid ${C.border}` }}><div className="text-sm font-semibold" style={{ color: C.text }}>{selectedLeague.name} — Top Assists</div><div className="text-xs mt-1" style={{ color: C.muted }}>Click a player for extended analytics</div></div>
            {assists.slice(0, 20).map((s: any, i: number) => (
              <div key={i} onClick={() => setSelectedPlayer(s)} className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/[0.02] transition-colors" style={{ borderBottom: `1px solid ${C.border}` }}>
                <div className="font-bold w-6 text-center text-sm" style={{ color: C.muted }}>{i + 1}</div>
                {s.player?.photo && <img src={s.player.photo} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />}
                <div className="flex-1 min-w-0"><div className="text-sm font-semibold" style={{ color: C.text }}>{s.player?.name}</div><div className="flex items-center gap-2 mt-0.5">{s.statistics?.[0]?.team?.logo && <img src={s.statistics[0].team.logo} alt="" className="w-4 h-4 object-contain" />}<span className="text-xs" style={{ color: C.muted }}>{s.statistics?.[0]?.team?.name}</span></div></div>
                <div className="text-right"><div className="text-xl font-black" style={{ color: C.teal }}>{s.statistics?.[0]?.goals?.assists || 0}</div><div className="text-xs" style={{ color: C.muted }}>assists</div></div>
                <div className="text-right ml-4"><div className="text-sm font-bold" style={{ color: C.text }}>{s.statistics?.[0]?.goals?.total || 0}</div><div className="text-xs" style={{ color: C.muted }}>goals</div></div>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'advanced' && <AdvancedStatsPanel />}
        {((activeTab === 'table' && standings.length === 0) || (activeTab === 'scorers' && scorers.length === 0) || (activeTab === 'assists' && assists.length === 0)) && !loading && (
          <div className="rounded-xl p-8 text-center" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}><div className="text-sm" style={{ color: C.muted }}>Connect API-Football key to see live data</div></div>
        )}
      </>)}

      {/* Player Profile Modal */}
      {selectedPlayer && <PlayerProfileModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} teamName={selectedPlayer?.statistics?.[0]?.team?.name} />}
    </div>
  )
}

// ─── ADVANCED STATS PANEL (League View — Step 2) ────────────────────────────
function AdvancedStatsPanel() {
  const { competitions, loading: compLoading } = useFootballLeagueCompetitions()
  const [selectedComp, setSelectedComp] = useState<SBCompetition | null>(null)
  const [matches, setMatches] = useState<SBMatch[]>([])
  const [selectedMatch, setSelectedMatch] = useState<SBMatch | null>(null)
  const [events, setEvents] = useState<SBEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [aggStats, setAggStats] = useState<{
    totalMatches: number; avgGoals: number; highestScoring: SBMatch | null; mostCommonScoreline: string
  } | null>(null)

  async function handleCompSelect(comp: SBCompetition) {
    setSelectedComp(comp); setSelectedMatch(null); setEvents([]); setMatches([]); setAggStats(null); setLoading(true)
    try {
      const res = await fetch(`/api/football/statsbomb?type=matches&compId=${comp.competition_id}&seasonId=${comp.season_id}`)
      const data: SBMatch[] = await res.json()
      setMatches(data.sort((a: SBMatch, b: SBMatch) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime()))

      // Aggregate stats
      const totalGoals = data.reduce((t: number, m: SBMatch) => t + (m.home_score || 0) + (m.away_score || 0), 0)
      const avgGoals = data.length > 0 ? totalGoals / data.length : 0

      // Highest scoring match
      let highestScoring: SBMatch | null = null
      let highestGoals = 0
      data.forEach((m: SBMatch) => {
        const total = (m.home_score || 0) + (m.away_score || 0)
        if (total > highestGoals) { highestGoals = total; highestScoring = m }
      })

      // Most common scoreline
      const scorelineMap = new Map<string, number>()
      data.forEach((m: SBMatch) => {
        const key = `${m.home_score}-${m.away_score}`
        scorelineMap.set(key, (scorelineMap.get(key) || 0) + 1)
      })
      let mostCommonScoreline = '—'
      let maxCount = 0
      scorelineMap.forEach((count, key) => {
        if (count > maxCount) { maxCount = count; mostCommonScoreline = key }
      })
      if (maxCount > 0) mostCommonScoreline = `${mostCommonScoreline} (${maxCount} times)`

      setAggStats({ totalMatches: data.length, avgGoals, highestScoring, mostCommonScoreline })
    } catch { setMatches([]); setAggStats(null) }
    setLoading(false)
  }

  async function loadEvents(match: SBMatch) {
    setSelectedMatch(match); setEvents([]); setLoading(true)
    try {
      const res = await fetch(`/api/football/statsbomb?type=events&matchId=${match.match_id}`)
      const data: SBEvent[] = await res.json()
      setEvents(data)
    } catch { setEvents([]) }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg w-fit" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
        <span className="text-xs font-semibold" style={{ color: '#F87171' }}>Powered by Lumio Data Open Data</span>
      </div>
      <div className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', color: '#FBBF24' }}>Lumio Data open data covers historical seasons of selected competitions. For current season data, a Lumio Data Pro licence is required.</div>

      {(compLoading || loading) && <Spinner />}

      {!selectedComp && !compLoading && !loading && (
        <div className="space-y-3">
          <div className="text-xs font-semibold mb-2" style={{ color: C.muted }}>Select a competition to view advanced stats</div>
          <CompetitionSeasonSelector competitions={competitions} onSelect={handleCompSelect} />
        </div>
      )}

      {selectedComp && !selectedMatch && !loading && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <button onClick={() => { setSelectedComp(null); setMatches([]); setAggStats(null) }} className="text-xs hover:underline" style={{ color: '#60A5FA' }}>← Back to competitions</button>
            <span className="text-xs" style={{ color: C.muted }}>{selectedComp.competition_name} · {selectedComp.season_name}</span>
          </div>

          {/* Aggregate stats card */}
          {aggStats && (
            <div className="rounded-xl p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
              <div className="text-xs font-semibold mb-3" style={{ color: C.text }}>Season Overview</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-lg p-3 text-center" style={{ backgroundColor: '#0A0B10' }}>
                  <div className="text-2xl font-black" style={{ color: C.text }}>{aggStats.totalMatches}</div>
                  <div className="text-xs mt-1" style={{ color: C.muted }}>Total Matches</div>
                </div>
                <div className="rounded-lg p-3 text-center" style={{ backgroundColor: '#0A0B10' }}>
                  <div className="text-2xl font-black" style={{ color: '#FBBF24' }}>{aggStats.avgGoals.toFixed(2)}</div>
                  <div className="text-xs mt-1" style={{ color: C.muted }}>Avg Goals/Match</div>
                </div>
                <div className="rounded-lg p-3 text-center" style={{ backgroundColor: '#0A0B10' }}>
                  {aggStats.highestScoring ? (
                    <>
                      <div className="text-lg font-black" style={{ color: '#60A5FA' }}>{aggStats.highestScoring.home_score}–{aggStats.highestScoring.away_score}</div>
                      <div className="text-xs mt-1 truncate" style={{ color: C.muted }}>{aggStats.highestScoring.home_team?.home_team_name} v {aggStats.highestScoring.away_team?.away_team_name}</div>
                    </>
                  ) : (
                    <div className="text-sm" style={{ color: C.muted }}>—</div>
                  )}
                  <div className="text-xs mt-1" style={{ color: C.muted }}>Highest Scoring</div>
                </div>
                <div className="rounded-lg p-3 text-center" style={{ backgroundColor: '#0A0B10' }}>
                  <div className="text-lg font-black" style={{ color: '#60A5FA' }}>{aggStats.mostCommonScoreline}</div>
                  <div className="text-xs mt-1" style={{ color: C.muted }}>Most Common Score</div>
                </div>
              </div>
            </div>
          )}

          {/* Matches table */}
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
            <div className="p-4" style={{ borderBottom: `1px solid ${C.border}` }}><div className="text-sm font-semibold" style={{ color: C.text }}>All Matches ({matches.length})</div></div>
            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
              {matches.map((m, i) => (
                <button key={i} onClick={() => loadEvents(m)} className="w-full flex items-center gap-4 p-3 text-left transition-all hover:bg-white/[0.02]" style={{ borderBottom: `1px solid ${C.border}` }}>
                  <div className="text-xs w-20 shrink-0" style={{ color: C.muted }}>{new Date(m.match_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  <span className="text-sm font-semibold text-right flex-1" style={{ color: C.text }}>{m.home_team?.home_team_name}</span>
                  <span className="text-sm font-black w-14 text-center" style={{ color: C.text }}>{m.home_score} – {m.away_score}</span>
                  <span className="text-sm font-semibold flex-1" style={{ color: C.text }}>{m.away_team?.away_team_name}</span>
                  {m.competition_stage?.name && <span className="text-xs shrink-0 px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(0,61,165,0.1)', color: '#60A5FA' }}>{m.competition_stage.name}</span>}
                </button>
              ))}
              {matches.length === 0 && <div className="p-8 text-center text-sm" style={{ color: C.muted }}>No matches found</div>}
            </div>
          </div>

          <FootballDataBadge />
        </div>
      )}

      {selectedMatch && !loading && events.length > 0 && (
        <MatchAnalyticsPanel match={selectedMatch} events={events} onBack={() => { setSelectedMatch(null); setEvents([]) }} />
      )}

      {selectedMatch && !loading && events.length === 0 && (
        <div className="rounded-xl p-8 text-center" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
          <div className="text-3xl mb-2">📊</div>
          <div className="text-sm font-semibold" style={{ color: C.text }}>No event data available</div>
          <div className="text-xs mt-1" style={{ color: C.muted }}>This match may not have detailed event data in the Lumio Data open dataset</div>
        </div>
      )}
    </div>
  )
}

// ─── FIXTURES VIEW ───────────────────────────────────────────────────────────
export function FixturesView() {
  const [selectedLeague, setSelectedLeague] = useState<typeof TIER_LEAGUES[0] | null>(null)
  const [activeTab, setActiveTab] = useState<'upcoming' | 'results'>('upcoming')
  const [fixtures, setFixtures] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [filterClub, setFilterClub] = useState('')

  const [liveFixtures, setLiveFixtures] = useState<any[]|null>(null)
  const [loadingFixtures, setLoadingFixtures] = useState(false)
  useEffect(() => {
    setLoadingFixtures(true)
    fetch('/api/football/fixtures?teamId=663&season=2025&next=10')
      .then(r => r.ok ? r.json() : null)
      .then(data => { const items = data?.response || data?.data || data; if (Array.isArray(items) && items.length > 0) setLiveFixtures(items) })
      .catch(() => {})
      .finally(() => setLoadingFixtures(false))
  }, [])

  async function loadFixtures(league: typeof TIER_LEAGUES[0], tab: 'upcoming' | 'results') {
    setSelectedLeague(league); setActiveTab(tab); setLoading(true); setFixtures([])
    try {
      const param = tab === 'upcoming' ? 'next=20' : 'last=20'
      const res = await fetch(`/api/football/fixtures?leagueId=${league.leagueId}&season=2025&${param}`)
      const data = await res.json()
      setFixtures(data?.response || [])
    } catch { /* */ }
    setLoading(false)
  }

  const filteredFixtures = filterClub ? fixtures.filter((f: any) => f.teams?.home?.name?.toLowerCase().includes(filterClub.toLowerCase()) || f.teams?.away?.name?.toLowerCase().includes(filterClub.toLowerCase())) : fixtures

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6"><span className="text-xl">📅</span><h2 className="text-xl font-bold" style={{ color: C.text }}>Fixtures & Results</h2><p className="text-sm ml-2" style={{ color: C.muted }}>Upcoming fixtures and recent results across all leagues</p></div>
      {loadingFixtures && (
        <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
          <div className="w-3 h-3 border border-gray-600 border-t-blue-500 rounded-full animate-spin"/>
          Loading live fixtures...
        </div>
      )}
      {liveFixtures && (
        <div className="flex items-center gap-2 mb-3 text-xs text-emerald-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
          Live fixtures from API-Football · {liveFixtures.length} upcoming loaded
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{TIER_LEAGUES.map((l, i) => (
        <button key={i} onClick={() => loadFixtures(l, activeTab)} className="p-3 rounded-xl border text-left transition-all" style={{ backgroundColor: selectedLeague?.name === l.name ? 'rgba(0,61,165,0.08)' : C.card, border: `1px solid ${selectedLeague?.name === l.name ? 'rgba(0,61,165,0.3)' : C.border}` }}>
          <div className="text-sm font-semibold" style={{ color: C.text }}>{l.name}</div><div className="text-xs" style={{ color: C.muted }}>Tier {l.tier}</div>
        </button>
      ))}</div>
      {selectedLeague && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-2">{(['upcoming', 'results'] as const).map(tab => (
            <button key={tab} onClick={() => loadFixtures(selectedLeague, tab)} className="px-4 py-2 rounded-lg text-sm font-medium capitalize" style={{ backgroundColor: activeTab === tab ? 'rgba(0,61,165,0.15)' : C.card, color: activeTab === tab ? C.yellow : C.muted, border: `1px solid ${activeTab === tab ? 'rgba(0,61,165,0.3)' : C.border}` }}>{tab === 'upcoming' ? 'Upcoming' : 'Results'}</button>
          ))}</div>
          <input value={filterClub} onChange={e => setFilterClub(e.target.value)} placeholder="Filter by club..." className="flex-1 min-w-40 rounded-lg px-3 py-2 text-sm outline-none" style={{ backgroundColor: '#1F2937', border: `1px solid ${C.border}`, color: C.text }} />
        </div>
      )}
      {loading && <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 rounded-full animate-spin mr-3" style={{ borderColor: C.border, borderTopColor: C.blue }} /><span className="text-sm" style={{ color: C.muted }}>Loading...</span></div>}
      {filteredFixtures.length > 0 && !loading && (
        <div className="space-y-2">{filteredFixtures.map((f: any, i: number) => {
          const date = new Date(f.fixture?.date); const isLive = ['1H','2H','HT'].includes(f.fixture?.status?.short); const isFT = f.fixture?.status?.short === 'FT'
          return (
            <div key={i} className="rounded-xl p-4 flex items-center gap-4" style={{ backgroundColor: C.card, border: `1px solid ${isLive ? 'rgba(34,197,94,0.3)' : C.border}` }}>
              <div className="w-20 text-xs text-center shrink-0" style={{ color: C.muted }}><div>{date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div><div className="font-medium">{date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div></div>
              <div className="flex-1 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 justify-end"><span className="text-sm font-semibold text-right" style={{ color: C.text }}>{f.teams?.home?.name}</span>{f.teams?.home?.logo && <img src={f.teams.home.logo} alt="" className="w-6 h-6 object-contain shrink-0" />}</div>
                <div className="text-center w-20 shrink-0">{isFT || isLive ? (<div className="text-lg font-black" style={{ color: isLive ? '#22C55E' : C.text }}>{f.goals?.home} – {f.goals?.away}</div>) : (<div className="text-sm font-medium" style={{ color: C.muted }}>vs</div>)}{isLive && <div className="text-xs animate-pulse" style={{ color: '#22C55E' }}>● LIVE {f.fixture?.status?.elapsed}&apos;</div>}{isFT && <div className="text-xs" style={{ color: C.muted }}>FT</div>}</div>
                <div className="flex items-center gap-2 flex-1">{f.teams?.away?.logo && <img src={f.teams.away.logo} alt="" className="w-6 h-6 object-contain shrink-0" />}<span className="text-sm font-semibold" style={{ color: C.text }}>{f.teams?.away?.name}</span></div>
              </div>
              <div className="w-24 text-xs text-right shrink-0" style={{ color: '#4B5563' }}>{f.fixture?.venue?.name}</div>
            </div>
          )
        })}</div>
      )}
      {!loading && filteredFixtures.length === 0 && selectedLeague && <div className="rounded-xl p-10 text-center" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}><div className="text-4xl mb-3">📅</div><div className="font-semibold mb-1" style={{ color: C.text }}>No fixtures found</div><div className="text-sm" style={{ color: C.muted }}>Connect API-Football key to load live data</div></div>}
      {!selectedLeague && <div className="rounded-xl p-10 text-center" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}><div className="text-4xl mb-3">📅</div><div className="font-semibold mb-2" style={{ color: C.text }}>Select a league above</div><div className="text-sm" style={{ color: C.muted }}>Choose any tier to load fixtures and results</div></div>}
    </div>
  )
}

// ─── STATSBOMB VIEW ─────────────────────────────────────────────────────────
export function FootballLeagueDataView() {
  const [competitions, setCompetitions] = useState<SBCompetition[]>([])
  const [selectedComp, setSelectedComp] = useState<SBCompetition | null>(null)
  const [matches, setMatches] = useState<SBMatch[]>([])
  const [selectedMatch, setSelectedMatch] = useState<SBMatch | null>(null)
  const [events, setEvents] = useState<SBEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [compSearch, setCompSearch] = useState('')
  const [matchSearch, setMatchSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'xg' | 'shots' | 'passing' | 'pressure'>('xg')
  const pitchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    fetch('/api/football/statsbomb?type=competitions')
      .then(r => r.json())
      .then((data: SBCompetition[]) => {
        const male = data.filter(c => c.competition_gender === 'male')
        const unique = male.reduce((acc, c) => {
          const key = `${c.competition_id}-${c.season_id}`
          if (!acc.has(key)) acc.set(key, c)
          return acc
        }, new Map<string, SBCompetition>())
        setCompetitions(Array.from(unique.values()).sort((a, b) => a.competition_name.localeCompare(b.competition_name) || b.season_name.localeCompare(a.season_name)))
      })
      .catch(() => setCompetitions([]))
      .finally(() => setLoading(false))
  }, [])

  async function loadMatches(comp: SBCompetition) {
    setSelectedComp(comp); setSelectedMatch(null); setEvents([]); setMatches([]); setLoading(true)
    try {
      const res = await fetch(`/api/football/statsbomb?type=matches&compId=${comp.competition_id}&seasonId=${comp.season_id}`)
      const data: SBMatch[] = await res.json()
      setMatches(data.sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime()))
    } catch { setMatches([]) }
    setLoading(false)
  }

  async function loadEvents(match: SBMatch) {
    setSelectedMatch(match); setEvents([]); setLoading(true); setActiveTab('xg')
    try {
      const res = await fetch(`/api/football/statsbomb?type=events&matchId=${match.match_id}`)
      const data: SBEvent[] = await res.json()
      setEvents(data)
    } catch { setEvents([]) }
    setLoading(false)
  }

  // Computed stats from events
  const homeTeam = selectedMatch?.home_team?.home_team_name || ''
  const awayTeam = selectedMatch?.away_team?.away_team_name || ''
  const shots = events.filter(e => e.type?.name === 'Shot')
  const homeShots = shots.filter(s => s.team?.name === homeTeam)
  const awayShots = shots.filter(s => s.team?.name === awayTeam)
  const homeXG = homeShots.reduce((t, s) => t + (s.shot?.statsbomb_xg || 0), 0)
  const awayXG = awayShots.reduce((t, s) => t + (s.shot?.statsbomb_xg || 0), 0)

  const passes = events.filter(e => e.type?.name === 'Pass')
  const homePasses = passes.filter(p => p.team?.name === homeTeam)
  const awayPasses = passes.filter(p => p.team?.name === awayTeam)
  const homePassComp = homePasses.length > 0 ? Math.round((homePasses.filter(p => !p.pass?.outcome).length / homePasses.length) * 100) : 0
  const awayPassComp = awayPasses.length > 0 ? Math.round((awayPasses.filter(p => !p.pass?.outcome).length / awayPasses.length) * 100) : 0

  const pressures = events.filter(e => e.type?.name === 'Pressure')
  const homePressures = pressures.filter(p => p.team?.name === homeTeam)
  const awayPressures = pressures.filter(p => p.team?.name === awayTeam)

  // xG timeline — build cumulative xG minute by minute
  const maxMinute = events.length > 0 ? Math.max(...events.map(e => e.minute), 90) : 90
  const xgTimeline: { minute: number; homeXG: number; awayXG: number }[] = []
  let hCum = 0, aCum = 0
  for (let m = 0; m <= maxMinute; m++) {
    const mShots = shots.filter(s => s.minute === m)
    mShots.forEach(s => { if (s.team?.name === homeTeam) hCum += s.shot?.statsbomb_xg || 0; else aCum += s.shot?.statsbomb_xg || 0 })
    xgTimeline.push({ minute: m, homeXG: hCum, awayXG: aCum })
  }

  const filteredComps = compSearch ? competitions.filter(c => c.competition_name.toLowerCase().includes(compSearch.toLowerCase()) || c.country_name.toLowerCase().includes(compSearch.toLowerCase()) || c.season_name.includes(compSearch)) : competitions
  const filteredMatches = matchSearch ? matches.filter(m => m.home_team?.home_team_name?.toLowerCase().includes(matchSearch.toLowerCase()) || m.away_team?.away_team_name?.toLowerCase().includes(matchSearch.toLowerCase())) : matches

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">📊</span>
        <h2 className="text-xl font-bold" style={{ color: C.text }}>Lumio Data Open Data</h2>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg w-fit" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
        <span className="text-xs font-semibold" style={{ color: '#F87171' }}>Powered by Lumio Data Open Data</span>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs" style={{ color: C.muted }}>
        <button onClick={() => { setSelectedComp(null); setSelectedMatch(null); setEvents([]) }} className="hover:underline" style={{ color: selectedComp ? '#60A5FA' : C.text }}>Competitions</button>
        {selectedComp && <><span>/</span><button onClick={() => { setSelectedMatch(null); setEvents([]) }} className="hover:underline" style={{ color: selectedMatch ? '#60A5FA' : C.text }}>{selectedComp.competition_name} {selectedComp.season_name}</button></>}
        {selectedMatch && <><span>/</span><span style={{ color: C.text }}>{homeTeam} vs {awayTeam}</span></>}
      </div>

      {loading && <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 rounded-full animate-spin mr-3" style={{ borderColor: C.border, borderTopColor: C.blue }} /><span className="text-sm" style={{ color: C.muted }}>Loading...</span></div>}

      {/* Competition list */}
      {!selectedComp && !loading && (<>
        <input value={compSearch} onChange={e => setCompSearch(e.target.value)} placeholder="Search competitions..." className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: '#1F2937', border: `1px solid ${C.border}`, color: C.text }} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3" style={{ maxHeight: 600, overflowY: 'auto' }}>
          {filteredComps.map((comp, i) => (
            <button key={i} onClick={() => loadMatches(comp)} className="p-4 rounded-xl border text-left transition-all hover:border-blue-600/40" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
              <div className="text-sm font-semibold" style={{ color: C.text }}>{comp.competition_name}</div>
              <div className="text-xs mt-0.5" style={{ color: C.muted }}>{comp.country_name} · {comp.season_name}</div>
            </button>
          ))}
        </div>
        {filteredComps.length === 0 && <div className="text-center py-8 text-sm" style={{ color: C.muted }}>No competitions found</div>}
      </>)}

      {/* Match list */}
      {selectedComp && !selectedMatch && !loading && (<>
        <input value={matchSearch} onChange={e => setMatchSearch(e.target.value)} placeholder="Search by team name..." className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: '#1F2937', border: `1px solid ${C.border}`, color: C.text }} />
        <div className="space-y-2" style={{ maxHeight: 600, overflowY: 'auto' }}>
          {filteredMatches.map((m, i) => (
            <button key={i} onClick={() => loadEvents(m)} className="w-full p-4 rounded-xl border text-left flex items-center gap-4 transition-all hover:border-blue-600/40" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
              <div className="text-xs w-20 shrink-0" style={{ color: C.muted }}>{new Date(m.match_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              <div className="flex-1 flex items-center gap-3">
                <span className="text-sm font-semibold text-right flex-1" style={{ color: C.text }}>{m.home_team?.home_team_name}</span>
                <span className="text-lg font-black w-16 text-center" style={{ color: C.text }}>{m.home_score} – {m.away_score}</span>
                <span className="text-sm font-semibold flex-1" style={{ color: C.text }}>{m.away_team?.away_team_name}</span>
              </div>
              {m.competition_stage?.name && <span className="text-xs shrink-0 px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(0,61,165,0.1)', color: '#60A5FA' }}>{m.competition_stage.name}</span>}
            </button>
          ))}
        </div>
        {filteredMatches.length === 0 && <div className="text-center py-8 text-sm" style={{ color: C.muted }}>No matches found</div>}
      </>)}

      {/* Match analysis */}
      {selectedMatch && !loading && events.length > 0 && (
        <div className="space-y-6">
          {/* Score header */}
          <div className="rounded-xl p-5" style={{ background: 'linear-gradient(135deg, rgba(0,61,165,0.12), rgba(0,0,0,0.1))', border: '1px solid rgba(0,61,165,0.25)' }}>
            <div className="flex items-center justify-center gap-6 mb-4">
              <div className="text-right flex-1"><div className="text-lg font-bold" style={{ color: C.text }}>{homeTeam}</div></div>
              <div className="text-3xl font-black" style={{ color: C.text }}>{selectedMatch.home_score} – {selectedMatch.away_score}</div>
              <div className="text-left flex-1"><div className="text-lg font-bold" style={{ color: C.text }}>{awayTeam}</div></div>
            </div>
            <div className="flex items-center justify-center gap-8 text-xs" style={{ color: C.muted }}>
              <span>xG: <span className="font-bold" style={{ color: '#60A5FA' }}>{homeXG.toFixed(2)}</span></span>
              <span>xG: <span className="font-bold" style={{ color: '#F87171' }}>{awayXG.toFixed(2)}</span></span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 flex-wrap">
            {([['xg', 'xG Timeline'], ['shots', 'Shot Map'], ['passing', 'Passing'], ['pressure', 'Pressure']] as const).map(([key, label]) => (
              <button key={key} onClick={() => setActiveTab(key as any)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: activeTab === key ? 'rgba(0,61,165,0.15)' : C.card, color: activeTab === key ? C.yellow : C.muted, border: `1px solid ${activeTab === key ? 'rgba(0,61,165,0.3)' : C.border}` }}>{label}</button>
            ))}
          </div>

          {/* xG Timeline */}
          {activeTab === 'xg' && (
            <div className="rounded-xl p-5" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
              <div className="text-sm font-semibold mb-4" style={{ color: C.text }}>Cumulative xG Timeline</div>
              <div className="flex items-center gap-4 mb-3 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#60A5FA' }} />{homeTeam} ({homeXG.toFixed(2)})</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#F87171' }} />{awayTeam} ({awayXG.toFixed(2)})</span>
              </div>
              <div style={{ height: 200, position: 'relative' }}>
                <svg viewBox={`0 0 ${maxMinute} ${Math.max(homeXG, awayXG, 1) * 1.2}`} style={{ width: '100%', height: '100%' }} preserveAspectRatio="none">
                  {/* Grid lines */}
                  {[0.5, 1, 1.5, 2, 2.5, 3].filter(v => v <= Math.max(homeXG, awayXG, 1) * 1.2).map(v => (
                    <line key={v} x1={0} y1={Math.max(homeXG, awayXG, 1) * 1.2 - v} x2={maxMinute} y2={Math.max(homeXG, awayXG, 1) * 1.2 - v} stroke="#1F2937" strokeWidth={0.3} />
                  ))}
                  {/* Half time line */}
                  <line x1={45} y1={0} x2={45} y2={Math.max(homeXG, awayXG, 1) * 1.2} stroke="#374151" strokeWidth={0.3} strokeDasharray="2,2" />
                  {/* Home xG line */}
                  <polyline fill="none" stroke="#60A5FA" strokeWidth={0.8} points={xgTimeline.map(p => `${p.minute},${Math.max(homeXG, awayXG, 1) * 1.2 - p.homeXG}`).join(' ')} />
                  {/* Away xG line */}
                  <polyline fill="none" stroke="#F87171" strokeWidth={0.8} points={xgTimeline.map(p => `${p.minute},${Math.max(homeXG, awayXG, 1) * 1.2 - p.awayXG}`).join(' ')} />
                  {/* Goal markers */}
                  {shots.filter(s => s.shot?.outcome?.name === 'Goal').map((s, i) => {
                    const isHome = s.team?.name === homeTeam
                    const cumXG = xgTimeline.find(t => t.minute === s.minute)
                    const y = cumXG ? (isHome ? cumXG.homeXG : cumXG.awayXG) : 0
                    return <circle key={i} cx={s.minute} cy={Math.max(homeXG, awayXG, 1) * 1.2 - y} r={1.2} fill={isHome ? '#60A5FA' : '#F87171'} stroke="#fff" strokeWidth={0.3} />
                  })}
                </svg>
                {/* Axis labels */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] px-1" style={{ color: C.muted }}>
                  <span>0&apos;</span><span>45&apos;</span><span>{maxMinute}&apos;</span>
                </div>
              </div>
            </div>
          )}

          {/* Shot Map */}
          {activeTab === 'shots' && (
            <div className="rounded-xl p-5" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
              <div className="text-sm font-semibold mb-4" style={{ color: C.text }}>Shot Map</div>
              <div className="flex items-center gap-4 mb-3 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#60A5FA' }} />{homeTeam} ({homeShots.length} shots)</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#F87171' }} />{awayTeam} ({awayShots.length} shots)</span>
                <span className="flex items-center gap-1.5 ml-2"><span className="w-2 h-2 rounded-full border-2" style={{ borderColor: '#22C55E' }} />Goal</span>
              </div>
              <div ref={pitchRef} style={{ position: 'relative', width: '100%', aspectRatio: '120/80', backgroundColor: '#1a472a', borderRadius: 8, overflow: 'hidden', border: '2px solid #2d5a3a' }}>
                {/* Pitch markings */}
                <svg viewBox="0 0 120 80" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                  {/* Outline */}
                  <rect x={1} y={1} width={118} height={78} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={0.5} />
                  {/* Centre line */}
                  <line x1={60} y1={1} x2={60} y2={79} stroke="rgba(255,255,255,0.3)" strokeWidth={0.5} />
                  {/* Centre circle */}
                  <circle cx={60} cy={40} r={9.15} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={0.5} />
                  {/* Left penalty area */}
                  <rect x={1} y={18} width={18} height={44} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={0.5} />
                  <rect x={1} y={30} width={6} height={20} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={0.5} />
                  {/* Right penalty area */}
                  <rect x={101} y={18} width={18} height={44} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={0.5} />
                  <rect x={113} y={30} width={6} height={20} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={0.5} />
                  {/* Penalty spots */}
                  <circle cx={12} cy={40} r={0.5} fill="rgba(255,255,255,0.4)" />
                  <circle cx={108} cy={40} r={0.5} fill="rgba(255,255,255,0.4)" />

                  {/* Shot dots */}
                  {shots.map((s, i) => {
                    if (!s.location) return null
                    const isHome = s.team?.name === homeTeam
                    const x = isHome ? s.location[0] : 120 - s.location[0]
                    const y = s.location[1]
                    const xg = s.shot?.statsbomb_xg || 0
                    const isGoal = s.shot?.outcome?.name === 'Goal'
                    const r = Math.max(1, Math.min(3.5, xg * 8))
                    return (
                      <circle key={i} cx={x} cy={y} r={r}
                        fill={isGoal ? 'rgba(34,197,94,0.7)' : isHome ? 'rgba(96,165,250,0.6)' : 'rgba(248,113,113,0.6)'}
                        stroke={isGoal ? '#22C55E' : isHome ? '#60A5FA' : '#F87171'}
                        strokeWidth={isGoal ? 0.8 : 0.4}
                      />
                    )
                  })}
                </svg>
              </div>
              <div className="text-xs mt-2 text-center" style={{ color: C.muted }}>Dot size = xG value. Green = goal scored.</div>

              {/* Shot list */}
              <div className="mt-4 space-y-1" style={{ maxHeight: 200, overflowY: 'auto' }}>
                {shots.sort((a, b) => (b.shot?.statsbomb_xg || 0) - (a.shot?.statsbomb_xg || 0)).map((s, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ backgroundColor: '#0A0B10' }}>
                    <span className="text-xs w-8" style={{ color: C.muted }}>{s.minute}&apos;</span>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.team?.name === homeTeam ? '#60A5FA' : '#F87171' }} />
                    <span className="text-xs flex-1" style={{ color: C.text }}>{s.player?.name}</span>
                    <span className="text-xs font-bold" style={{ color: s.shot?.outcome?.name === 'Goal' ? '#22C55E' : C.muted }}>{s.shot?.outcome?.name}</span>
                    <span className="text-xs font-mono w-12 text-right" style={{ color: '#FBBF24' }}>{(s.shot?.statsbomb_xg || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Passing */}
          {activeTab === 'passing' && (
            <div className="rounded-xl p-5" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
              <div className="text-sm font-semibold mb-4" style={{ color: C.text }}>Pass Completion</div>
              <div className="grid grid-cols-2 gap-6">
                {[{ team: homeTeam, total: homePasses.length, comp: homePassComp, colour: '#60A5FA' }, { team: awayTeam, total: awayPasses.length, comp: awayPassComp, colour: '#F87171' }].map((t, i) => (
                  <div key={i} className="text-center">
                    <div className="text-sm font-semibold mb-3" style={{ color: C.text }}>{t.team}</div>
                    {/* Donut */}
                    <div className="mx-auto mb-3" style={{ width: 100, height: 100 }}>
                      <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%' }}>
                        <circle cx={18} cy={18} r={15.9} fill="none" stroke="#1F2937" strokeWidth={3} />
                        <circle cx={18} cy={18} r={15.9} fill="none" stroke={t.colour} strokeWidth={3}
                          strokeDasharray={`${t.comp} ${100 - t.comp}`} strokeDashoffset={25}
                          strokeLinecap="round" />
                        <text x={18} y={18} textAnchor="middle" dominantBaseline="central" fill={C.text} fontSize={7} fontWeight="bold">{t.comp}%</text>
                      </svg>
                    </div>
                    <div className="text-xs" style={{ color: C.muted }}>{t.total} passes attempted</div>
                  </div>
                ))}
              </div>

              {/* Comparison bars */}
              <div className="mt-6 space-y-3">
                {[
                  { label: 'Total Passes', home: homePasses.length, away: awayPasses.length },
                  { label: 'Completed', home: homePasses.filter(p => !p.pass?.outcome).length, away: awayPasses.filter(p => !p.pass?.outcome).length },
                  { label: 'Failed', home: homePasses.filter(p => p.pass?.outcome).length, away: awayPasses.filter(p => p.pass?.outcome).length },
                ].map((row, i) => {
                  const max = Math.max(row.home, row.away, 1)
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1"><span style={{ color: '#60A5FA' }}>{row.home}</span><span style={{ color: C.muted }}>{row.label}</span><span style={{ color: '#F87171' }}>{row.away}</span></div>
                      <div className="flex gap-1 h-2">
                        <div className="flex-1 rounded-l-full overflow-hidden flex justify-end" style={{ backgroundColor: '#1F2937' }}>
                          <div className="rounded-l-full" style={{ width: `${(row.home / max) * 100}%`, backgroundColor: '#60A5FA' }} />
                        </div>
                        <div className="flex-1 rounded-r-full overflow-hidden" style={{ backgroundColor: '#1F2937' }}>
                          <div className="rounded-r-full" style={{ width: `${(row.away / max) * 100}%`, backgroundColor: '#F87171' }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Pressure */}
          {activeTab === 'pressure' && (
            <div className="rounded-xl p-5" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
              <div className="text-sm font-semibold mb-4" style={{ color: C.text }}>Pressure Events</div>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="rounded-xl p-4 text-center" style={{ backgroundColor: '#0A0B10' }}>
                  <div className="text-2xl font-black" style={{ color: '#60A5FA' }}>{homePressures.length}</div>
                  <div className="text-xs mt-1" style={{ color: C.muted }}>{homeTeam}</div>
                </div>
                <div className="rounded-xl p-4 text-center" style={{ backgroundColor: '#0A0B10' }}>
                  <div className="text-2xl font-black" style={{ color: '#F87171' }}>{awayPressures.length}</div>
                  <div className="text-xs mt-1" style={{ color: C.muted }}>{awayTeam}</div>
                </div>
              </div>

              {/* Pressure heatmap on pitch */}
              <div style={{ position: 'relative', width: '100%', aspectRatio: '120/80', backgroundColor: '#1a472a', borderRadius: 8, overflow: 'hidden', border: '2px solid #2d5a3a' }}>
                <svg viewBox="0 0 120 80" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                  <rect x={1} y={1} width={118} height={78} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={0.5} />
                  <line x1={60} y1={1} x2={60} y2={79} stroke="rgba(255,255,255,0.3)" strokeWidth={0.5} />
                  <circle cx={60} cy={40} r={9.15} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={0.5} />
                  <rect x={1} y={18} width={18} height={44} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={0.5} />
                  <rect x={101} y={18} width={18} height={44} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={0.5} />
                  {pressures.map((p, i) => {
                    if (!p.location) return null
                    const isHome = p.team?.name === homeTeam
                    const x = isHome ? p.location[0] : 120 - p.location[0]
                    const y = p.location[1]
                    return <circle key={i} cx={x} cy={y} r={0.8} fill={isHome ? 'rgba(96,165,250,0.35)' : 'rgba(248,113,113,0.35)'} />
                  })}
                </svg>
              </div>
              <div className="text-xs mt-2 text-center" style={{ color: C.muted }}>Each dot represents a pressure event location</div>

              {/* Pressure by 15-min buckets */}
              <div className="mt-4">
                <div className="text-xs font-semibold mb-2" style={{ color: C.text }}>Pressure by Period</div>
                <div className="space-y-2">
                  {[[0, 15], [15, 30], [30, 45], [45, 60], [60, 75], [75, 90]].map(([start, end], i) => {
                    const h = homePressures.filter(p => p.minute >= start && p.minute < end).length
                    const a = awayPressures.filter(p => p.minute >= start && p.minute < end).length
                    const max = Math.max(h, a, 1)
                    return (
                      <div key={i}>
                        <div className="flex justify-between text-xs mb-0.5"><span style={{ color: '#60A5FA' }}>{h}</span><span style={{ color: C.muted }}>{start}&apos;–{end}&apos;</span><span style={{ color: '#F87171' }}>{a}</span></div>
                        <div className="flex gap-1 h-1.5">
                          <div className="flex-1 rounded-l-full overflow-hidden flex justify-end" style={{ backgroundColor: '#1F2937' }}>
                            <div className="rounded-l-full" style={{ width: `${(h / max) * 100}%`, backgroundColor: '#60A5FA' }} />
                          </div>
                          <div className="flex-1 rounded-r-full overflow-hidden" style={{ backgroundColor: '#1F2937' }}>
                            <div className="rounded-r-full" style={{ width: `${(a / max) * 100}%`, backgroundColor: '#F87171' }} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedMatch && !loading && events.length === 0 && (
        <div className="rounded-xl p-10 text-center" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
          <div className="text-4xl mb-3">📊</div>
          <div className="font-semibold mb-1" style={{ color: C.text }}>No event data available</div>
          <div className="text-sm" style={{ color: C.muted }}>This match may not have detailed event data in the Lumio Data open dataset</div>
        </div>
      )}
    </div>
  )
}
