'use client'

import { useState } from 'react'

const LEAGUE_IDS: Record<string, number> = { 'Premier League': 39, 'Championship': 40, 'League One': 41, 'League Two': 42, 'National League': 43 }

const TEAM_IDS: Record<string, number> = {
  'Arsenal': 42, 'Aston Villa': 66, 'Bournemouth': 35, 'Brentford': 55, 'Brighton & Hove Albion': 51, 'Chelsea': 49, 'Crystal Palace': 52, 'Everton': 45, 'Fulham': 36, 'Liverpool': 40, 'Manchester City': 50, 'Manchester United': 33, 'Newcastle United': 34, 'Nottingham Forest': 65, 'Tottenham Hotspur': 47, 'West Ham United': 48, 'Wolverhampton Wanderers': 39, 'Ipswich Town': 57, 'Leicester City': 46, 'Southampton': 41,
  'Blackburn Rovers': 69, 'Bristol City': 70, 'Burnley': 44, 'Cardiff City': 75, 'Coventry City': 71, 'Derby County': 76, 'Hull City': 80, 'Leeds United': 63, 'Luton Town': 1359, 'Middlesbrough': 25, 'Millwall': 81, 'Norwich City': 72, 'Oxford United': 2283, 'Plymouth Argyle': 3371, 'Preston North End': 1108, 'QPR': 67, 'Sheffield United': 62, 'Stoke City': 74, 'Swansea City': 78, 'Watford': 38, 'West Bromwich Albion': 60, 'Wrexham': 763,
  'AFC Wimbledon': 638, 'Barnsley': 750, 'Bolton Wanderers': 1107, 'Bristol Rovers': 775, 'Charlton Athletic': 68, 'Exeter City': 784, 'Lincoln City': 729, 'Northampton Town': 773, 'Peterborough United': 73, 'Reading': 777, 'Shrewsbury Town': 772, 'Stockport County': 769, 'Wigan Athletic': 87,
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
  const [activeTab, setActiveTab] = useState<'squad' | 'fixtures' | 'results'>('squad')

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
    setSelectedTeam(team); setSquadLoading(true); setSquadData([]); setTeamFixtures([])
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
    setSquadLoading(false)
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
          </div>
          <div className="flex gap-2">{(['squad', 'fixtures', 'results'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className="px-4 py-2 rounded-lg text-sm font-medium capitalize" style={{ backgroundColor: activeTab === tab ? 'rgba(0,61,165,0.15)' : C.card, color: activeTab === tab ? C.yellow : C.muted, border: `1px solid ${activeTab === tab ? 'rgba(0,61,165,0.3)' : C.border}` }}>{tab === 'fixtures' ? 'Upcoming' : tab === 'results' ? 'Results' : 'Squad'}</button>
          ))}</div>
          {squadLoading && <div className="flex items-center justify-center py-8"><div className="w-6 h-6 border-2 rounded-full animate-spin mr-2" style={{ borderColor: C.border, borderTopColor: C.blue }} /><span className="text-sm" style={{ color: C.muted }}>Loading...</span></div>}
          {activeTab === 'squad' && !squadLoading && (
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
              <div className="p-4" style={{ borderBottom: `1px solid ${C.border}` }}><div className="text-sm font-semibold" style={{ color: C.text }}>{selectedTeam.team?.name} — Squad ({squadData.length})</div></div>
              {squadData.length > 0 ? (
                <table className="w-full text-sm"><thead><tr className="text-xs" style={{ borderBottom: `1px solid ${C.border}`, color: C.muted }}><th className="text-left p-3">#</th><th className="text-left p-3">Player</th><th className="text-center p-3">Pos</th><th className="text-center p-3">Age</th><th className="text-left p-3">Nationality</th></tr></thead>
                <tbody>{squadData.sort((a: any, b: any) => ['Goalkeeper','Defender','Midfielder','Attacker'].indexOf(a.position) - ['Goalkeeper','Defender','Midfielder','Attacker'].indexOf(b.position)).map((p: any, i: number) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}><td className="p-3 text-xs" style={{ color: C.muted }}>{p.number || '—'}</td><td className="p-3">{p.photo && <img src={p.photo} alt="" className="w-6 h-6 rounded-full inline mr-2 object-cover" />}<span className="font-medium" style={{ color: C.text }}>{p.name}</span></td><td className="p-3 text-center"><span className={`text-xs px-1.5 py-0.5 rounded ${posColour(p.position)}`}>{posShort(p.position)}</span></td><td className="p-3 text-center" style={{ color: C.muted }}>{p.age}</td><td className="p-3 text-sm" style={{ color: C.muted }}>{p.nationality}</td></tr>
                ))}</tbody></table>
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
        </div>
      )}
    </div>
  )
}

// ─── LEAGUES VIEW ────────────────────────────────────────────────────────────
export function LeaguesView() {
  const [selectedLeague, setSelectedLeague] = useState<typeof TIER_LEAGUES[0] | null>(null)
  const [activeTab, setActiveTab] = useState<'table' | 'scorers' | 'assists'>('table')
  const [standings, setStandings] = useState<any[]>([])
  const [scorers, setScorers] = useState<any[]>([])
  const [assists, setAssists] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6"><span className="text-xl">🏆</span><h2 className="text-xl font-bold" style={{ color: C.text }}>Leagues & Tables</h2><p className="text-sm ml-2" style={{ color: C.muted }}>Live standings, top scorers and assists</p></div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{TIER_LEAGUES.map((l, i) => (
        <button key={i} onClick={() => loadLeagueData(l)} className={`p-4 rounded-xl border text-left transition-all ${selectedLeague?.name === l.name ? colourMap[l.colour] : 'bg-[#0d0f1a] border-gray-800 hover:border-gray-600'}`}>
          <div className="text-sm font-semibold" style={{ color: C.text }}>{l.name}</div><div className="text-xs mt-0.5" style={{ color: C.muted }}>Tier {l.tier}</div>
        </button>
      ))}</div>
      {loading && <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 rounded-full animate-spin mr-3" style={{ borderColor: C.border, borderTopColor: C.blue }} /><span className="text-sm" style={{ color: C.muted }}>Loading {selectedLeague?.name}...</span></div>}
      {selectedLeague && !loading && (<>
        <div className="flex gap-2">{(['table', 'scorers', 'assists'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className="px-4 py-2 rounded-lg text-sm font-medium capitalize" style={{ backgroundColor: activeTab === tab ? 'rgba(0,61,165,0.15)' : C.card, color: activeTab === tab ? C.yellow : C.muted, border: `1px solid ${activeTab === tab ? 'rgba(0,61,165,0.3)' : C.border}` }}>{tab === 'table' ? 'League Table' : tab === 'scorers' ? 'Top Scorers' : 'Top Assists'}</button>
        ))}</div>
        {activeTab === 'table' && standings.length > 0 && (
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
            <div className="p-4" style={{ borderBottom: `1px solid ${C.border}` }}><div className="text-sm font-semibold" style={{ color: C.text }}>{selectedLeague.name} — 2025/26</div></div>
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-xs" style={{ borderBottom: `1px solid ${C.border}`, color: C.muted }}><th className="text-left p-3 w-8">#</th><th className="text-left p-3">Club</th><th className="text-center p-3">P</th><th className="text-center p-3">W</th><th className="text-center p-3">D</th><th className="text-center p-3">L</th><th className="text-center p-3">GF</th><th className="text-center p-3">GA</th><th className="text-center p-3">GD</th><th className="text-center p-3 font-bold">Pts</th><th className="text-center p-3">Form</th></tr></thead>
            <tbody>{standings.map((t: any, i: number) => (
              <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: t.team?.name === 'AFC Wimbledon' ? 'rgba(0,61,165,0.08)' : undefined }}>
                <td className="p-3"><span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${i < 2 ? 'bg-teal-600/30 text-teal-400' : i < 6 ? 'bg-blue-600/30 text-blue-400' : i >= standings.length - 3 ? 'bg-red-600/30 text-red-400' : ''}`} style={{ color: i >= 6 && i < standings.length - 3 ? C.muted : undefined }}>{t.rank}</span></td>
                <td className="p-3"><div className="flex items-center gap-2">{t.team?.logo && <img src={t.team.logo} alt="" className="w-5 h-5 object-contain" />}<span className="font-medium" style={{ color: t.team?.name === 'AFC Wimbledon' ? '#60A5FA' : C.text }}>{t.team?.name}</span>{t.team?.name === 'AFC Wimbledon' && <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(0,61,165,0.15)', color: C.yellow }}>You</span>}</div></td>
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
            <div className="p-4" style={{ borderBottom: `1px solid ${C.border}` }}><div className="text-sm font-semibold" style={{ color: C.text }}>{selectedLeague.name} — Top Scorers</div></div>
            {scorers.slice(0, 20).map((s: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-4" style={{ borderBottom: `1px solid ${C.border}` }}>
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
            <div className="p-4" style={{ borderBottom: `1px solid ${C.border}` }}><div className="text-sm font-semibold" style={{ color: C.text }}>{selectedLeague.name} — Top Assists</div></div>
            {assists.slice(0, 20).map((s: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-4" style={{ borderBottom: `1px solid ${C.border}` }}>
                <div className="font-bold w-6 text-center text-sm" style={{ color: C.muted }}>{i + 1}</div>
                {s.player?.photo && <img src={s.player.photo} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />}
                <div className="flex-1 min-w-0"><div className="text-sm font-semibold" style={{ color: C.text }}>{s.player?.name}</div><div className="flex items-center gap-2 mt-0.5">{s.statistics?.[0]?.team?.logo && <img src={s.statistics[0].team.logo} alt="" className="w-4 h-4 object-contain" />}<span className="text-xs" style={{ color: C.muted }}>{s.statistics?.[0]?.team?.name}</span></div></div>
                <div className="text-right"><div className="text-xl font-black" style={{ color: C.teal }}>{s.statistics?.[0]?.goals?.assists || 0}</div><div className="text-xs" style={{ color: C.muted }}>assists</div></div>
                <div className="text-right ml-4"><div className="text-sm font-bold" style={{ color: C.text }}>{s.statistics?.[0]?.goals?.total || 0}</div><div className="text-xs" style={{ color: C.muted }}>goals</div></div>
              </div>
            ))}
          </div>
        )}
        {((activeTab === 'table' && standings.length === 0) || (activeTab === 'scorers' && scorers.length === 0) || (activeTab === 'assists' && assists.length === 0)) && !loading && (
          <div className="rounded-xl p-8 text-center" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}><div className="text-sm" style={{ color: C.muted }}>Connect API-Football key to see live data</div></div>
        )}
      </>)}
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
