'use client'

import { useState, useEffect, useMemo } from 'react'
import type { LeagueTable } from '@/lib/api-football'
import { buildComparisonReport, getRadarScores, type ComparisonReport } from '@/lib/club-comparison'
import { FeatureGate, UpgradePrompt } from './FeatureGate'
import type { ClubTier } from '@/lib/feature-gates'

const C = {
  bg: '#07080F', card: '#111318', border: '#1F2937',
  text: '#F9FAFB', muted: '#9CA3AF', yellow: '#F1C40F',
  green: '#22C55E', amber: '#F59E0B', red: '#EF4444',
  blue: '#3B82F6', purple: '#8B5CF6', pink: '#EC4899', cyan: '#06B6D4',
}

const COMPARE_COLOURS = [C.purple, C.cyan, C.pink]

interface ComparisonRow {
  id?: string
  compared_team_id: number
  compared_team_name: string
  compared_team_logo: string | null
  rank: number | null
  points: number | null
  played: number | null
  won: number | null
  drawn: number | null
  lost: number | null
  goals_for: number | null
  goals_against: number | null
  goal_difference: number | null
  form: string | null
  home_won: number | null
  away_won: number | null
  clean_sheets: number | null
  fetched_at: string
}

interface Benchmarks {
  league_id: number
  season: number
  division_name: string | null
  avg_goals_scored: number | null
  avg_goals_conceded: number | null
  avg_points_per_game: number | null
  avg_home_wins_pct: number | null
  avg_away_wins_pct: number | null
  playoff_cutoff_points: number | null
  promotion_cutoff_points: number | null
  relegation_cutoff_points: number | null
}

interface Props {
  clubId: string | null
  clubName: string
  clubTier: ClubTier
  leagueId: number | null
  season: number
  apiStandings: LeagueTable[] | null
  resolvedFixturesForRender: any[]
  isDemo?: boolean
}

interface AIResult {
  summary: string
  keyAdvantages: string[]
  keyThreats: string[]
  tacticalRecommendation: string
  predictionNextMeeting: string
}

// ─── Mini SVG charts ─────────────────────────────────────────────────────────

function PointsBarChart({ items, average }: { items: { label: string; value: number; color: string }[]; average: number | null }) {
  if (items.length === 0) return null
  const max = Math.max(1, ...items.map((i) => i.value), average ?? 0)
  const w = 320, h = 130
  const bw = (w - 40) / items.length - 12
  const avgY = average != null ? h - 20 - (average / max) * (h - 40) : null
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      {avgY != null && (
        <>
          <line x1={10} y1={avgY} x2={w - 10} y2={avgY} stroke={C.amber} strokeWidth={1} strokeDasharray="3,3" />
          <text x={w - 12} y={avgY - 3} fill={C.amber} fontSize="7" textAnchor="end">avg {Math.round(average ?? 0)}</text>
        </>
      )}
      {items.map((item, i) => {
        const x = 20 + i * (bw + 12)
        const bh = (item.value / max) * (h - 40)
        const y = h - 20 - bh
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={bh} fill={item.color} rx={2} />
            <text x={x + bw / 2} y={y - 3} fill={C.text} fontSize="9" fontWeight="bold" textAnchor="middle">{item.value}</text>
            <text x={x + bw / 2} y={h - 5} fill={C.muted} fontSize="7" textAnchor="middle">{item.label.slice(0, 12)}</text>
          </g>
        )
      })}
    </svg>
  )
}

function GoalsGroupedBar({ items, avgFor, avgAgainst }: { items: { label: string; goalsFor: number; goalsAgainst: number }[]; avgFor: number | null; avgAgainst: number | null }) {
  if (items.length === 0) return null
  const max = Math.max(1, ...items.flatMap((i) => [i.goalsFor, i.goalsAgainst]))
  const w = 320, h = 140
  const groupW = (w - 40) / items.length
  const bw = (groupW - 14) / 2
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      {items.map((item, i) => {
        const gx = 20 + i * groupW
        const fH = (item.goalsFor / max) * (h - 40)
        const aH = (item.goalsAgainst / max) * (h - 40)
        return (
          <g key={i}>
            <rect x={gx} y={h - 20 - fH} width={bw} height={fH} fill={C.green} rx={2} />
            <text x={gx + bw / 2} y={h - 22 - fH} fill={C.green} fontSize="8" fontWeight="bold" textAnchor="middle">{item.goalsFor}</text>
            <rect x={gx + bw + 4} y={h - 20 - aH} width={bw} height={aH} fill={C.red} rx={2} />
            <text x={gx + bw + 4 + bw / 2} y={h - 22 - aH} fill={C.red} fontSize="8" fontWeight="bold" textAnchor="middle">{item.goalsAgainst}</text>
            <text x={gx + groupW / 2 - 4} y={h - 5} fill={C.muted} fontSize="7" textAnchor="middle">{item.label.slice(0, 12)}</text>
          </g>
        )
      })}
      {avgFor != null && (
        <text x={10} y={12} fill={C.green} fontSize="7">avg GF {Math.round(avgFor)}</text>
      )}
      {avgAgainst != null && (
        <text x={70} y={12} fill={C.red} fontSize="7">avg GA {Math.round(avgAgainst)}</text>
      )}
    </svg>
  )
}

function FormWheel({ form, points, label, color }: { form: string; points: number | null; label: string; color: string }) {
  const segments = (form || '').slice(-5).split('')
  const w = 90, h = 90
  const cx = w / 2, cy = h / 2, r = 32
  const segCount = Math.max(1, segments.length)
  const segAngle = (Math.PI * 2) / segCount
  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
        {segments.length === 0 && <circle cx={cx} cy={cy} r={r} fill="#1F2937" />}
        {segments.map((s, i) => {
          const a1 = i * segAngle - Math.PI / 2
          const a2 = (i + 1) * segAngle - Math.PI / 2
          const x1 = cx + r * Math.cos(a1)
          const y1 = cy + r * Math.sin(a1)
          const x2 = cx + r * Math.cos(a2)
          const y2 = cy + r * Math.sin(a2)
          const fill = s === 'W' ? C.green : s === 'D' ? C.amber : C.red
          return <path key={i} d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 0 1 ${x2},${y2} Z`} fill={fill} stroke={C.bg} strokeWidth={1} />
        })}
        <circle cx={cx} cy={cy} r={r * 0.55} fill={C.bg} />
        <text x={cx} y={cy + 3} fill={C.text} fontSize="11" textAnchor="middle" fontWeight="bold">{points ?? '—'}</text>
      </svg>
      <div className="text-[9px] mt-1 font-semibold" style={{ color }}>{label.slice(0, 14)}</div>
    </div>
  )
}

function RadarChart({ datasets, axes }: { datasets: { label: string; color: string; values: Record<string, number> }[]; axes: string[] }) {
  const w = 280, h = 280
  const cx = w / 2, cy = h / 2
  const rMax = 100
  const angleFor = (i: number) => (i / axes.length) * Math.PI * 2 - Math.PI / 2
  const point = (axis: string, value: number, i: number) => {
    const ratio = Math.max(0, Math.min(100, value)) / 100
    const a = angleFor(i)
    return [cx + rMax * ratio * Math.cos(a), cy + rMax * ratio * Math.sin(a)] as [number, number]
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      {/* Grid rings */}
      {[25, 50, 75, 100].map((pct) => (
        <polygon
          key={pct}
          points={axes.map((_, i) => {
            const a = angleFor(i)
            return `${cx + rMax * (pct / 100) * Math.cos(a)},${cy + rMax * (pct / 100) * Math.sin(a)}`
          }).join(' ')}
          fill="none"
          stroke="#1F2937"
          strokeWidth={0.5}
        />
      ))}
      {/* Axis lines */}
      {axes.map((_, i) => {
        const a = angleFor(i)
        return <line key={i} x1={cx} y1={cy} x2={cx + rMax * Math.cos(a)} y2={cy + rMax * Math.sin(a)} stroke="#1F2937" strokeWidth={0.5} />
      })}
      {/* Datasets */}
      {datasets.map((ds, di) => {
        const points = axes.map((ax, i) => point(ax, ds.values[ax] ?? 50, i))
        return (
          <g key={di}>
            <polygon
              points={points.map((p) => p.join(',')).join(' ')}
              fill={ds.color}
              fillOpacity={di === 0 ? 0.3 : 0.2}
              stroke={ds.color}
              strokeWidth={2}
            />
            {points.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={2.5} fill={ds.color} />)}
          </g>
        )
      })}
      {/* Axis labels */}
      {axes.map((ax, i) => {
        const a = angleFor(i)
        const x = cx + (rMax + 14) * Math.cos(a)
        const y = cy + (rMax + 14) * Math.sin(a)
        return <text key={i} x={x} y={y} fill={C.muted} fontSize="9" textAnchor="middle" dominantBaseline="middle">{ax}</text>
      })}
    </svg>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function ClubComparisonView({ clubId, clubName, clubTier, leagueId, season, apiStandings, resolvedFixturesForRender, isDemo = false }: Props) {
  const [benchmarks, setBenchmarks] = useState<Benchmarks | null>(null)
  const [comparisons, setComparisons] = useState<ComparisonRow[]>([])
  const [standings, setStandings] = useState<LeagueTable[] | null>(apiStandings ?? null)
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [aiResult, setAiResult] = useState<AIResult | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Find our club in standings (by name match)
  const ourStats = useMemo(() => (standings ?? apiStandings ?? []).find((s) => s.teamName === clubName) ?? null, [standings, apiStandings, clubName])

  useEffect(() => {
    if (!clubId) return
    let cancelled = false
    setLoading(true)
    fetch(`/api/football/comparison?clubId=${clubId}&leagueId=${leagueId ?? 40}&season=${season}`)
      .then((r) => r.ok ? r.json() : null)
      .then((j) => {
        if (cancelled || !j) { setLoading(false); return }
        setBenchmarks(j.benchmarks)
        setComparisons(j.comparisons ?? [])
        if (Array.isArray(j.standings) && j.standings.length > 0) setStandings(j.standings)
        setLoading(false)
      })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [clubId, leagueId, season])

  async function addComparison(teamId: number, teamName: string) {
    if (!clubId || comparisons.length >= 3) return
    setAdding(true)
    try {
      const res = await fetch('/api/football/comparison', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clubId, teamId, teamName, leagueId: leagueId ?? 40, season }),
      })
      const j = await res.json()
      if (j.success && j.comparisonData) setComparisons((cs) => [...cs.filter((c) => c.compared_team_id !== teamId), j.comparisonData])
    } catch { /* swallow */ }
    setAdding(false)
    setSearchQuery('')
  }

  async function removeComparison(teamId: number) {
    if (!clubId) return
    try {
      await fetch('/api/football/comparison', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clubId, comparedTeamId: teamId }),
      })
      setComparisons((cs) => cs.filter((c) => c.compared_team_id !== teamId))
    } catch { /* swallow */ }
  }

  async function generateAi() {
    if (!ourStats || comparisons.length === 0) return
    setAiLoading(true)
    setAiResult(null)
    try {
      const res = await fetch('/api/football/comparison/ai-analysis', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ourClub: clubName,
          comparedClub: comparisons[0].compared_team_name,
          division: benchmarks?.division_name ?? 'EFL League One',
          ourStats,
          comparedStats: comparisons[0],
          benchmarks,
        }),
      })
      const j = await res.json()
      if (!j.error) setAiResult(j as AIResult)
    } catch { /* swallow */ }
    setAiLoading(false)
  }

  // Build per-comparison reports
  const reports: ComparisonReport[] = useMemo(
    () => comparisons.map((c) => buildComparisonReport(ourStats, c, benchmarks, clubName)),
    [comparisons, ourStats, benchmarks, clubName]
  )

  // H2H — find fixtures whose opponent matches first comparison
  const h2hFixtures = useMemo(() => {
    if (comparisons.length === 0) return []
    const target = comparisons[0].compared_team_name.toLowerCase()
    return (resolvedFixturesForRender ?? []).filter((f: any) => {
      const op = String(f.opponent ?? '').toLowerCase()
      return op.includes(target.split(' ')[0]) || target.includes(op.split(' ')[0])
    })
  }, [comparisons, resolvedFixturesForRender])

  // Searchable team list (from standings, excluding our club + already-added)
  const searchableTeams = useMemo(() => {
    const used = new Set([clubName, ...comparisons.map((c) => c.compared_team_name)])
    return (standings ?? apiStandings ?? []).filter((s) => !used.has(s.teamName))
  }, [standings, apiStandings, clubName, comparisons])

  const filteredTeams = useMemo(() => {
    if (!searchQuery) return searchableTeams.slice(0, 8)
    const q = searchQuery.toLowerCase()
    return searchableTeams.filter((t) => t.teamName.toLowerCase().includes(q)).slice(0, 8)
  }, [searchableTeams, searchQuery])

  // Combined list for charts (us + comparisons)
  const allClubs = useMemo(() => {
    const us = ourStats ? [{ label: clubName, color: C.yellow, value: ourStats.points, gf: ourStats.goalsFor, ga: ourStats.goalsAgainst, form: ourStats.form, raw: ourStats }] : []
    const others = comparisons.map((c, i) => ({ label: c.compared_team_name, color: COMPARE_COLOURS[i % COMPARE_COLOURS.length], value: c.points ?? 0, gf: c.goals_for ?? 0, ga: c.goals_against ?? 0, form: c.form ?? '', raw: c }))
    return [...us, ...others]
  }, [ourStats, comparisons, clubName])

  // Radar datasets
  const radarAxes = ['Attack', 'Defence', 'HomeForm', 'AwayForm', 'Consistency', 'Form']
  const radarDatasets = useMemo(() => {
    const us = ourStats ? [{ label: clubName, color: C.yellow, values: getRadarScores(ourStats, benchmarks) }] : []
    const others = comparisons.map((c, i) => ({ label: c.compared_team_name, color: COMPARE_COLOURS[i % COMPARE_COLOURS.length], values: getRadarScores(c, benchmarks) }))
    return [...us, ...others]
  }, [ourStats, comparisons, benchmarks, clubName])

  const ppgFor = (s: any): number | null => {
    const p = Number(s?.points)
    const pl = Number(s?.played)
    if (!Number.isFinite(p) || !Number.isFinite(pl) || pl === 0) return null
    return Math.round((p / pl) * 100) / 100
  }

  const benchmarkAverageEntry = benchmarks ? {
    label: 'Division Avg',
    rank: '—',
    points: '—',
    ppg: benchmarks.avg_points_per_game ?? '—',
    played: '—', won: '—', drawn: '—', lost: '—',
    gf: benchmarks.avg_goals_scored ?? '—',
    ga: benchmarks.avg_goals_conceded ?? '—',
    gd: '—',
    homeWins: benchmarks.avg_home_wins_pct != null ? `${benchmarks.avg_home_wins_pct}%` : '—',
    awayWins: benchmarks.avg_away_wins_pct != null ? `${benchmarks.avg_away_wins_pct}%` : '—',
    form: '—',
    cleanSheets: '—',
  } : null

  if (clubTier !== 'elite' && clubTier !== 'enterprise') {
    return (
      <div className="space-y-4">
        <div className="opacity-30 pointer-events-none">
          <div className="rounded-xl p-6" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
            <h3 className="text-lg font-bold" style={{ color: C.text }}>📊 Club Comparison</h3>
            <p className="text-xs mt-1" style={{ color: C.muted }}>Compare your club against rivals and division benchmarks</p>
          </div>
        </div>
        <UpgradePrompt featureKey="club_comparison" featureName="Club Comparison Tool" requiredTier="elite" />
      </div>
    )
  }

  return (
    <FeatureGate featureKey="club_comparison" clubTier={clubTier} featureName="Club Comparison">
      <div className="space-y-5">
        {/* HEADER */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-xl font-black flex items-center gap-2" style={{ color: C.text }}>📊 Club Comparison</h2>
            <p className="text-xs mt-0.5" style={{ color: C.muted }}>Season {season}/{season + 1} · {benchmarks?.division_name ?? 'League'}</p>
          </div>
          <div className="flex items-center gap-2">
            {isDemo && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(245,158,11,0.10)', color: C.amber, border: `1px solid ${C.amber}33` }}>⚡ Live comparison data</span>}
            <button disabled title="PDF export coming soon" className="text-xs px-3 py-1.5 rounded-lg cursor-not-allowed" style={{ backgroundColor: '#1F2937', color: C.muted, border: `1px solid ${C.border}`, opacity: 0.5 }}>📄 Export Comparison</button>
          </div>
        </div>

        {loading && <div className="text-xs" style={{ color: C.muted }}>Loading comparison data...</div>}

        {/* OUR CLUB STATS STRIP */}
        {ourStats && (
          <div className="rounded-xl p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.yellow}55` }}>
            <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: C.yellow }}>{clubName} — Current Stats</div>
            <div className="grid grid-cols-3 md:grid-cols-7 gap-3 text-xs">
              {[
                { l: 'Rank', v: ourStats.rank },
                { l: 'Points', v: ourStats.points },
                { l: 'PPG', v: ppgFor(ourStats) ?? '—' },
                { l: 'GF', v: ourStats.goalsFor },
                { l: 'GA', v: ourStats.goalsAgainst },
                { l: 'GD', v: ourStats.gd },
                { l: 'Form', v: ourStats.form?.slice(-5) ?? '—' },
              ].map((m) => (
                <div key={m.l}>
                  <div style={{ color: C.muted }}>{m.l}</div>
                  <div className="font-bold text-sm" style={{ color: C.text }}>{m.v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TEAM SELECTOR */}
        <div className="rounded-xl p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold" style={{ color: C.text }}>Comparison Clubs ({comparisons.length}/3)</h3>
            <span className="text-[10px]" style={{ color: C.muted }}>Search standings to add</span>
          </div>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type a team name..."
            disabled={comparisons.length >= 3}
            className="w-full text-xs rounded-lg px-3 py-2 mb-2"
            style={{ backgroundColor: '#0A0B10', color: C.text, border: `1px solid ${C.border}` }}
          />
          {searchQuery && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {filteredTeams.map((t) => (
                <button key={t.teamId} disabled={adding} onClick={() => addComparison(t.teamId, t.teamName)} className="text-[10px] px-2 py-1 rounded-full" style={{ backgroundColor: '#1F2937', color: C.text, border: `1px solid ${C.border}` }}>+ {t.teamName}</button>
              ))}
              {filteredTeams.length === 0 && <span className="text-[10px]" style={{ color: C.muted }}>No matches</span>}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {comparisons.map((c, i) => (
              <div key={c.compared_team_id} className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-2" style={{ backgroundColor: '#0A0B10', border: `1px solid ${COMPARE_COLOURS[i % COMPARE_COLOURS.length]}55`, color: COMPARE_COLOURS[i % COMPARE_COLOURS.length] }}>
                <span className="font-semibold">{c.compared_team_name}</span>
                <button onClick={() => removeComparison(c.compared_team_id)} className="text-[14px] leading-none" style={{ color: C.muted }}>×</button>
              </div>
            ))}
            {benchmarks && <div className="text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#0A0B10', border: `1px solid ${C.border}`, color: C.muted }}>Division Average</div>}
          </div>
        </div>

        {/* COMPARISON TABLE */}
        {ourStats && (comparisons.length > 0 || benchmarkAverageEntry) && (
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="text-[10px]" style={{ color: C.muted, borderBottom: `1px solid ${C.border}` }}>
                  <th className="text-left p-2">Metric</th>
                  <th className="text-right p-2" style={{ color: C.yellow }}>{clubName}</th>
                  {comparisons.map((c, i) => (
                    <th key={c.compared_team_id} className="text-right p-2" style={{ color: COMPARE_COLOURS[i % COMPARE_COLOURS.length] }}>{c.compared_team_name}</th>
                  ))}
                  {benchmarkAverageEntry && <th className="text-right p-2" style={{ color: C.muted }}>Avg</th>}
                </tr></thead>
                <tbody>
                  {[
                    { k: 'Position', us: ourStats.rank, them: comparisons.map((c) => c.rank), bench: '—', higherIsBetter: false },
                    { k: 'Points', us: ourStats.points, them: comparisons.map((c) => c.points), bench: '—', higherIsBetter: true },
                    { k: 'PPG', us: ppgFor(ourStats), them: comparisons.map((c) => ppgFor(c)), bench: benchmarkAverageEntry?.ppg ?? '—', higherIsBetter: true },
                    { k: 'Played', us: ourStats.played, them: comparisons.map((c) => c.played), bench: '—', higherIsBetter: true },
                    { k: 'W', us: ourStats.won, them: comparisons.map((c) => c.won), bench: '—', higherIsBetter: true },
                    { k: 'D', us: ourStats.drawn, them: comparisons.map((c) => c.drawn), bench: '—', higherIsBetter: false },
                    { k: 'L', us: ourStats.lost, them: comparisons.map((c) => c.lost), bench: '—', higherIsBetter: false },
                    { k: 'GF', us: ourStats.goalsFor, them: comparisons.map((c) => c.goals_for), bench: benchmarkAverageEntry?.gf ?? '—', higherIsBetter: true },
                    { k: 'GA', us: ourStats.goalsAgainst, them: comparisons.map((c) => c.goals_against), bench: benchmarkAverageEntry?.ga ?? '—', higherIsBetter: false },
                    { k: 'GD', us: ourStats.gd, them: comparisons.map((c) => c.goal_difference), bench: '—', higherIsBetter: true },
                    { k: 'Home W', us: ourStats.homeWon, them: comparisons.map((c) => c.home_won), bench: benchmarkAverageEntry?.homeWins ?? '—', higherIsBetter: true },
                    { k: 'Away W', us: ourStats.awayWon, them: comparisons.map((c) => c.away_won), bench: benchmarkAverageEntry?.awayWins ?? '—', higherIsBetter: true },
                    { k: 'Form', us: (ourStats.form ?? '').slice(-5), them: comparisons.map((c) => (c.form ?? '').slice(-5)), bench: '—', higherIsBetter: true },
                  ].map((row) => {
                    const allNums = [Number(row.us), ...row.them.map((v) => Number(v))].filter((n) => Number.isFinite(n))
                    const best = allNums.length > 0 ? (row.higherIsBetter ? Math.max(...allNums) : Math.min(...allNums)) : null
                    return (
                      <tr key={row.k} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td className="p-2" style={{ color: C.text }}>{row.k}</td>
                        <td className="p-2 text-right font-bold" style={{ color: best != null && Number(row.us) === best ? C.yellow : C.text }}>{row.us ?? '—'}</td>
                        {row.them.map((v, i) => (
                          <td key={i} className="p-2 text-right" style={{ color: best != null && Number(v) === best ? COMPARE_COLOURS[i % COMPARE_COLOURS.length] : C.muted, fontWeight: best != null && Number(v) === best ? 700 : 400 }}>{v ?? '—'}</td>
                        ))}
                        {benchmarkAverageEntry && <td className="p-2 text-right" style={{ color: C.muted }}>{row.bench}</td>}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CHARTS GRID */}
        {allClubs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Points Bar */}
            <div className="rounded-xl p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
              <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: C.muted }}>Points</div>
              <PointsBarChart
                items={allClubs.map((c) => ({ label: c.label, value: c.value, color: c.color }))}
                average={benchmarks?.avg_points_per_game != null && ourStats?.played ? benchmarks.avg_points_per_game * (ourStats.played) : null}
              />
            </div>
            {/* Goals Grouped */}
            <div className="rounded-xl p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
              <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: C.muted }}>Goals For / Against</div>
              <GoalsGroupedBar
                items={allClubs.map((c) => ({ label: c.label, goalsFor: c.gf, goalsAgainst: c.ga }))}
                avgFor={benchmarks?.avg_goals_scored != null && ourStats?.played ? benchmarks.avg_goals_scored * ourStats.played : null}
                avgAgainst={benchmarks?.avg_goals_conceded != null && ourStats?.played ? benchmarks.avg_goals_conceded * ourStats.played : null}
              />
            </div>
            {/* Form Wheels */}
            <div className="rounded-xl p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
              <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: C.muted }}>Form (last 5)</div>
              <div className="flex flex-wrap gap-3 justify-around">
                {allClubs.map((c, i) => (
                  <FormWheel key={i} form={c.form} points={c.value} label={c.label} color={c.color} />
                ))}
              </div>
            </div>
            {/* Radar */}
            <div className="rounded-xl p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
              <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: C.muted }}>Performance Radar</div>
              <RadarChart datasets={radarDatasets} axes={radarAxes} />
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {radarDatasets.map((d, i) => (
                  <span key={i} className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${d.color}22`, color: d.color, border: `1px solid ${d.color}55` }}>{d.label}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STRENGTH / WEAKNESS */}
        {reports.length > 0 && reports[0].metrics.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.green}55` }}>
              <h3 className="text-sm font-bold mb-2" style={{ color: C.green }}>Our Advantages vs {reports[0].comparedClub}</h3>
              <div className="space-y-1">
                {reports[0].metrics.filter((m) => {
                  if (m.ourValue == null || m.comparedValue == null) return false
                  return m.higherIsBetter ? m.ourValue > m.comparedValue : m.ourValue < m.comparedValue
                }).slice(0, 6).map((m) => (
                  <div key={m.key} className="text-xs flex justify-between" style={{ color: '#D1D5DB' }}>
                    <span>{m.label}</span>
                    <span style={{ color: C.green }}>{m.ourValue} <span style={{ color: C.muted }}>vs {m.comparedValue}</span></span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.red}55` }}>
              <h3 className="text-sm font-bold mb-2" style={{ color: C.red }}>Areas to Improve</h3>
              <div className="space-y-1">
                {reports[0].metrics.filter((m) => {
                  if (m.ourValue == null || m.comparedValue == null) return false
                  return m.higherIsBetter ? m.ourValue < m.comparedValue : m.ourValue > m.comparedValue
                }).slice(0, 6).map((m) => (
                  <div key={m.key} className="text-xs flex justify-between" style={{ color: '#D1D5DB' }}>
                    <span>{m.label}</span>
                    <span style={{ color: C.red }}>{m.ourValue} <span style={{ color: C.muted }}>vs {m.comparedValue}</span></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* HEAD-TO-HEAD */}
        {comparisons.length > 0 && (
          <div className="rounded-xl p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
            <h3 className="text-sm font-bold mb-2" style={{ color: C.text }}>Head-to-Head — {comparisons[0].compared_team_name}</h3>
            {h2hFixtures.length === 0 ? (
              <div className="text-[10px]" style={{ color: C.muted }}>No head-to-head fixtures recorded this season</div>
            ) : (
              <table className="w-full text-xs">
                <thead><tr className="text-[10px]" style={{ color: C.muted, borderBottom: `1px solid ${C.border}` }}>
                  <th className="text-left p-2">Date</th><th className="text-left p-2">Venue</th><th className="text-right p-2">Score</th><th className="text-right p-2">Result</th>
                </tr></thead>
                <tbody>
                  {h2hFixtures.slice(0, 5).map((f: any, i: number) => {
                    const parts = String(f.result ?? '').split('-').map(Number)
                    const ours = f.venue === 'Away' ? parts[1] : parts[0]
                    const theirs = f.venue === 'Away' ? parts[0] : parts[1]
                    const res = ours > theirs ? 'W' : ours < theirs ? 'L' : 'D'
                    const resColor = res === 'W' ? C.green : res === 'D' ? C.amber : C.red
                    return (
                      <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td className="p-2" style={{ color: C.muted }}>{f.date}</td>
                        <td className="p-2" style={{ color: C.muted }}>{f.venue}</td>
                        <td className="p-2 text-right" style={{ color: C.text }}>{f.result ?? '—'}</td>
                        <td className="p-2 text-right font-bold" style={{ color: resColor }}>{res}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* AI SUMMARY */}
        <div className="rounded-xl p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold" style={{ color: C.text }}>🧠 AI Comparison Analysis</h3>
            <button onClick={generateAi} disabled={aiLoading || comparisons.length === 0} className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ backgroundColor: C.purple, color: '#fff', opacity: aiLoading || comparisons.length === 0 ? 0.5 : 1 }}>{aiLoading ? '🔍 Analysing matchup...' : 'Generate AI Analysis'}</button>
          </div>
          {aiResult && (
            <div className="space-y-3 mt-3">
              <p className="text-xs" style={{ color: '#D1D5DB' }}>{aiResult.summary}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-lg p-3" style={{ backgroundColor: '#0A0B10', border: `1px solid ${C.green}55` }}>
                  <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: C.green }}>Advantages</div>
                  {aiResult.keyAdvantages.map((a, i) => <div key={i} className="text-xs" style={{ color: '#D1D5DB' }}>• {a}</div>)}
                </div>
                <div className="rounded-lg p-3" style={{ backgroundColor: '#0A0B10', border: `1px solid ${C.red}55` }}>
                  <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: C.red }}>Threats</div>
                  {aiResult.keyThreats.map((t, i) => <div key={i} className="text-xs" style={{ color: '#D1D5DB' }}>• {t}</div>)}
                </div>
              </div>
              <div className="rounded-lg p-3" style={{ backgroundColor: '#0A0B10', border: `1px solid ${C.amber}55` }}>
                <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: C.amber }}>Tactical Recommendation</div>
                <p className="text-xs" style={{ color: '#D1D5DB' }}>{aiResult.tacticalRecommendation}</p>
              </div>
              {aiResult.predictionNextMeeting && (
                <div className="rounded-lg p-3" style={{ backgroundColor: '#0A0B10', border: `1px solid ${C.purple}55` }}>
                  <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: C.purple }}>Next Meeting Prediction</div>
                  <p className="text-xs" style={{ color: '#D1D5DB' }}>{aiResult.predictionNextMeeting}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SAVED COMPARISONS */}
        {comparisons.length > 0 && (
          <details className="rounded-xl" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
            <summary className="text-xs font-semibold p-3 cursor-pointer" style={{ color: C.muted }}>Saved Comparisons ({comparisons.length})</summary>
            <div className="px-3 pb-3 space-y-1">
              {comparisons.map((c) => (
                <div key={c.compared_team_id} className="flex items-center justify-between text-xs py-1.5 px-2 rounded" style={{ backgroundColor: '#0A0B10' }}>
                  <span style={{ color: C.text }}>{c.compared_team_name}</span>
                  <span style={{ color: C.muted }}>Pts: {c.points} · GD: {c.goal_difference}</span>
                  <button onClick={() => removeComparison(c.compared_team_id)} className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: '#1F2937', color: C.red }}>Remove</button>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </FeatureGate>
  )
}
