'use client'

// Junior Football — GPS & Performance.
//
// Distance, sprints, top speed, simple heatmap, and a growth-aware load
// view. Plain-English explanations for parents. The GPS integration
// itself is a STUB in this build — the UI prominently labels
// "GPS powered by JOHAN — coming" and renders demo numbers; no live
// hardware ingest. Real wiring is part of Workstream B's hardware
// integration phase.
//
// Role scoping:
//   - parent_guardian: own child's performance only (child-scoped),
//     with plain-English metric explanations and an age-appropriate
//     "what this means" tooltip per tile.
//   - staff (chairman / coach / team_manager / academy_lead): squad
//     view with the same metrics rolled up across the U11 demo team.
//   - welfare_officer: same as staff but with explicit per-player
//     load flags called out at the top.
//
// The Heatmaps women's module doesn't exist as a standalone file
// (grepped — only referenced as a sidebar item in womens/[slug]/page.tsx
// inline), so the heatmap surface here is a small inline SVG grid
// rather than a re-used component.

import { useState } from 'react'
import type { SportsDemoSession } from '@/components/sports-demo/SportsDemoGate'

const T = {
  panel:      '#0D1117',
  panelAlt:   '#111318',
  border:     '#1F2937',
  borderSoft: '#1A2030',
  text:       '#F9FAFB',
  text2:      '#D1D5DB',
  text3:      '#9CA3AF',
  text4:      '#6B7280',
  accent:     '#16A34A',
  accentDeep: '#166534',
  accentDim:  'rgba(22,163,74,0.12)',
  good:       '#22C55E',
  warn:       '#F59E0B',
  bad:        '#EF4444',
} as const

type Tab = 'last_match' | 'season' | 'squad' | 'growth_load'

interface MatchPerformance {
  playerId: string
  playerName: string
  team: string
  fixture: string
  date: string
  distanceKm: number
  sprints: number
  topSpeedKmh: number
  /** 0–100 normalised effort score — plain-English copy uses this band. */
  effortScore: number
  /** Position heatmap — 6×4 grid, values 0–10 (visit frequency). */
  heatmap: number[][]
}

interface GrowthLoad {
  playerId: string
  playerName: string
  ageBand: string
  weeklyLoadAu: number
  rollingAvgAu: number
  growthFlag: 'normal' | 'spurt' | 'low'
  guidance: string
}

// ─── Demo data ───────────────────────────────────────────────────────────────

const JACK_PERF: MatchPerformance = {
  playerId: 'jack-carter',
  playerName: 'Jack Carter',
  team: 'U11 Lions',
  fixture: 'vs Hartwell U11 · W 3–2',
  date: 'Sun 25 May',
  distanceKm: 4.6,
  sprints: 14,
  topSpeedKmh: 19.2,
  effortScore: 78,
  heatmap: [
    [0,0,1,1,2,0],
    [0,1,3,4,4,1],
    [0,2,5,7,5,2],
    [0,1,4,5,3,1],
  ],
}

const MIA_PERF: MatchPerformance = {
  playerId: 'mia-carter',
  playerName: 'Mia Carter',
  team: 'U13 Falcons',
  fixture: 'vs Glenmoor U13 · L 1–2',
  date: 'Sun 25 May',
  distanceKm: 5.8,
  sprints: 19,
  topSpeedKmh: 21.4,
  effortScore: 83,
  heatmap: [
    [0,1,1,0,0,0],
    [1,3,5,3,1,0],
    [2,6,8,5,2,0],
    [1,4,5,3,1,0],
  ],
}

const SQUAD_PERF: MatchPerformance[] = [
  JACK_PERF,
  { playerId: 'aria-khoury',  playerName: 'Aria Khoury',  team: 'U11 Lions', fixture: 'vs Hartwell U11 · W 3–2', date: 'Sun 25 May', distanceKm: 4.9, sprints: 18, topSpeedKmh: 18.6, effortScore: 84, heatmap: JACK_PERF.heatmap },
  { playerId: 'maya-singh',   playerName: 'Maya Singh',   team: 'U11 Lions', fixture: 'vs Hartwell U11 · W 3–2', date: 'Sun 25 May', distanceKm: 4.4, sprints: 11, topSpeedKmh: 17.9, effortScore: 72, heatmap: JACK_PERF.heatmap },
  { playerId: 'zac-daley',    playerName: 'Zac Daley',    team: 'U11 Lions', fixture: 'vs Hartwell U11 · W 3–2', date: 'Sun 25 May', distanceKm: 3.1, sprints:  6, topSpeedKmh: 16.3, effortScore: 55, heatmap: JACK_PERF.heatmap },
  { playerId: 'ollie-wren',   playerName: 'Ollie Wren',   team: 'U11 Lions', fixture: 'vs Hartwell U11 · W 3–2', date: 'Sun 25 May', distanceKm: 2.4, sprints:  4, topSpeedKmh: 14.1, effortScore: 60, heatmap: JACK_PERF.heatmap },
  { playerId: 'liam-forrest', playerName: 'Liam Forrest', team: 'U11 Lions', fixture: 'vs Hartwell U11 · W 3–2', date: 'Sun 25 May', distanceKm: 4.7, sprints: 16, topSpeedKmh: 19.5, effortScore: 80, heatmap: JACK_PERF.heatmap },
  { playerId: 'ravi-doshi',   playerName: 'Ravi Doshi',   team: 'U11 Lions', fixture: 'vs Hartwell U11 · W 3–2', date: 'Sun 25 May', distanceKm: 5.0, sprints: 17, topSpeedKmh: 20.1, effortScore: 82, heatmap: JACK_PERF.heatmap },
  { playerId: 'beth-halpern', playerName: 'Beth Halpern', team: 'U11 Lions', fixture: 'vs Hartwell U11 · W 3–2', date: 'Sun 25 May', distanceKm: 4.3, sprints: 13, topSpeedKmh: 18.2, effortScore: 71, heatmap: JACK_PERF.heatmap },
  { playerId: 'ben-aitken',   playerName: 'Ben Aitken',   team: 'U11 Lions', fixture: 'vs Hartwell U11 · W 3–2', date: 'Sun 25 May', distanceKm: 4.2, sprints: 10, topSpeedKmh: 17.4, effortScore: 68, heatmap: JACK_PERF.heatmap },
]

const GROWTH_LOAD: GrowthLoad[] = [
  { playerId: 'jack-carter',   playerName: 'Jack Carter',   ageBand: 'U11', weeklyLoadAu: 240, rollingAvgAu: 220, growthFlag: 'normal', guidance: 'Loading is consistent with his rolling average. No adjustment needed.' },
  { playerId: 'liam-forrest',  playerName: 'Liam Forrest',  ageBand: 'U11', weeklyLoadAu: 260, rollingAvgAu: 215, growthFlag: 'spurt',  guidance: 'Recent 4cm growth flagged by parents. Reduce high-decel volume by ~15% for the next 2 weeks; monitor knee comfort.' },
  { playerId: 'zac-daley',     playerName: 'Zac Daley',     ageBand: 'U11', weeklyLoadAu: 130, rollingAvgAu: 200, growthFlag: 'low',    guidance: 'Knock-related minutes management. Build back gradually — no max-decel before re-screen on Tuesday.' },
  { playerId: 'aria-khoury',   playerName: 'Aria Khoury',   ageBand: 'U11', weeklyLoadAu: 245, rollingAvgAu: 225, growthFlag: 'normal', guidance: 'Within range. Continue current loading.' },
]

// ─── Helpers ────────────────────────────────────────────────────────────────

function effortBand(score: number): { label: string; color: 'green' | 'amber' | 'red' | 'blue'; plain: string } {
  if (score >= 80) return { label: 'Busy day',   color: 'green', plain: 'Worked hard from start to finish — a really active match.' }
  if (score >= 65) return { label: 'Steady',     color: 'blue',  plain: 'Solid effort throughout — a typical full game.' }
  if (score >= 50) return { label: 'Light',      color: 'amber', plain: 'Lighter day than usual — fewer minutes or quieter periods of play.' }
  return                  { label: 'Very light', color: 'amber', plain: 'Limited minutes on the pitch this match.' }
}

function pickColor(c: 'green' | 'amber' | 'red' | 'blue') {
  return c === 'green' ? T.good : c === 'amber' ? T.warn : c === 'red' ? T.bad : '#60A5FA'
}

function pickDim(c: 'green' | 'amber' | 'red' | 'blue') {
  return c === 'green' ? T.accentDim : c === 'amber' ? 'rgba(245,158,11,0.15)' : c === 'red' ? 'rgba(239,68,68,0.15)' : 'rgba(96,165,250,0.15)'
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl p-5 ${className ?? ''}`} style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
      {children}
    </div>
  )
}

function GpsTile({
  value, label, sub, plain, color = 'green',
}: { value: string | number; label: string; sub?: string; plain?: string; color?: 'green' | 'amber' | 'red' | 'blue' }) {
  return (
    <div
      className="rounded-lg p-3"
      style={{
        background: `linear-gradient(135deg, ${pickDim(color)}, ${T.panel})`,
        border: `1px solid ${pickColor(color)}33`,
      }}
    >
      <p className="text-2xl font-bold tnum" style={{ color: pickColor(color) }}>{value}</p>
      <p className="text-[10px] uppercase tracking-wider mt-1" style={{ color: T.text4 }}>{label}</p>
      {sub && <p className="text-[11px] mt-0.5" style={{ color: T.text3 }}>{sub}</p>}
      {plain && <p className="text-[10px] mt-2 italic" style={{ color: T.text3 }}>{plain}</p>}
    </div>
  )
}

function Heatmap({ grid, accent = T.good }: { grid: number[][]; accent?: string }) {
  const max = Math.max(...grid.flat(), 1)
  return (
    <div className="rounded-lg p-3" style={{ backgroundColor: T.panelAlt, border: `1px solid ${T.borderSoft}` }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] uppercase tracking-wider" style={{ color: T.text4 }}>Position heatmap</p>
        <p className="text-[10px] italic" style={{ color: T.text4 }}>Where they spent the most time</p>
      </div>
      <div className="grid gap-px" style={{ gridTemplateColumns: `repeat(${grid[0].length}, 1fr)` }}>
        {grid.flatMap((row, y) =>
          row.map((v, x) => {
            const intensity = v / max
            return (
              <div
                key={`${x}-${y}`}
                style={{
                  aspectRatio: '1 / 1',
                  backgroundColor: intensity === 0 ? T.panel : accent,
                  opacity: intensity === 0 ? 1 : 0.15 + (intensity * 0.85),
                  borderRadius: 2,
                }}
                title={`${v} visits`}
              />
            )
          }),
        )}
      </div>
      <div className="flex items-center justify-between mt-2 text-[9px] uppercase tracking-wider" style={{ color: T.text4 }}>
        <span>Defending third</span>
        <span>Attacking third</span>
      </div>
    </div>
  )
}

function PlayerMatchPanel({ perf, plainEnglish }: { perf: MatchPerformance; plainEnglish: boolean }) {
  const band = effortBand(perf.effortScore)
  return (
    <Card>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <p className="text-sm font-bold" style={{ color: T.text }}>{perf.playerName} · {perf.team}</p>
          <p className="text-[11px]" style={{ color: T.text3 }}>{perf.date} · {perf.fixture}</p>
        </div>
        <span
          className="text-[10px] px-2 py-0.5 rounded uppercase tracking-wide font-semibold"
          style={{ backgroundColor: pickDim(band.color), color: pickColor(band.color) }}
        >
          {band.label}
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <GpsTile
          value={perf.distanceKm.toFixed(1)}
          label="km covered"
          color="green"
          plain={plainEnglish ? `About ${Math.round(perf.distanceKm * 11)} laps of the pitch.` : undefined}
        />
        <GpsTile
          value={perf.sprints}
          label="sprints"
          color="blue"
          plain={plainEnglish ? 'Each sprint is a short, sharp burst of speed.' : undefined}
        />
        <GpsTile
          value={perf.topSpeedKmh.toFixed(1)}
          label="km/h top"
          color="amber"
          plain={plainEnglish ? 'Top speed of the match (single fastest moment).' : undefined}
        />
        <GpsTile
          value={`${perf.effortScore}/100`}
          label="effort"
          color={band.color}
          plain={plainEnglish ? band.plain : undefined}
        />
      </div>
      <Heatmap grid={perf.heatmap} />
    </Card>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────

interface Props {
  session: SportsDemoSession
  demoChild?: { name: string; ageBand: string; team: string }
}

export default function JuniorPerformance({ session, demoChild }: Props) {
  const isParent = session.role === 'parent_guardian'

  const parentPerf =
    !isParent ? null :
    demoChild?.name === 'Mia Carter' ? MIA_PERF :
    JACK_PERF

  const [tab, setTab] = useState<Tab>(isParent ? 'last_match' : 'squad')

  const tabs: { id: Tab; label: string; icon: string }[] = isParent
    ? [
        { id: 'last_match',  label: 'Last match',  icon: '⚽' },
        { id: 'season',      label: 'This season', icon: '📈' },
      ]
    : [
        { id: 'squad',       label: 'Squad rollup', icon: '👥' },
        { id: 'growth_load', label: 'Growth & load', icon: '🌱' },
        { id: 'last_match',  label: 'Last match (Jack)', icon: '⚽' },
      ]

  const spurts = GROWTH_LOAD.filter(g => g.growthFlag === 'spurt').length
  const lowLoads = GROWTH_LOAD.filter(g => g.growthFlag === 'low').length

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div
        className="rounded-xl p-5"
        style={{
          background: `linear-gradient(135deg, ${T.accentDim} 0%, rgba(22,101,52,0.04) 60%, transparent 100%)`,
          border: `1px solid ${T.accent}55`,
        }}
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: T.accent }}>
              GPS & Performance {isParent ? '· Your child' : '· Squad'}
            </p>
            <h2 className="text-lg font-bold" style={{ color: T.text }}>
              {isParent ? "Your child's GPS, in plain English" : 'Squad performance · growth-aware load'}
            </h2>
            <p className="text-sm mt-1 leading-relaxed" style={{ color: T.text2 }}>
              {isParent
                ? "Distance, sprints and top speed from the last match. Tooltips on every tile explain what the number means and whether it's normal for the age band."
                : `${SQUAD_PERF.length} U11 Lions tracked · ${spurts} growth-spurt flag${spurts === 1 ? '' : 's'} · ${lowLoads} low-load (managed) player${lowLoads === 1 ? '' : 's'}.`}
            </p>
          </div>
          <span
            className="text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider whitespace-nowrap"
            style={{ backgroundColor: T.warn + '1e', color: T.warn, border: `1px solid ${T.warn}55` }}
            title="GPS hardware integration is a stub in this build. Demo numbers; no live ingest."
          >
            GPS powered by JOHAN — coming
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b flex-wrap" style={{ borderColor: T.border }}>
        {tabs.map(t => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className="px-4 py-2.5 text-xs font-semibold transition-all"
              style={{
                color: active ? T.good : T.text4,
                borderBottom: active ? `2px solid ${T.good}` : '2px solid transparent',
              }}
            >
              <span className="mr-1.5">{t.icon}</span>{t.label}
            </button>
          )
        })}
      </div>

      {/* Parent — last match + season */}
      {isParent && tab === 'last_match' && parentPerf && (
        <PlayerMatchPanel perf={parentPerf} plainEnglish />
      )}

      {isParent && tab === 'season' && parentPerf && (
        <Card>
          <p className="text-sm font-bold mb-3" style={{ color: T.text }}>This season · trends</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
            <GpsTile value={`${(parentPerf.distanceKm * 12).toFixed(0)} km`} label="total distance"   color="green" plain="Across all matches this season." />
            <GpsTile value={parentPerf.sprints * 12}              label="total sprints"  color="blue" />
            <GpsTile value={`${parentPerf.topSpeedKmh.toFixed(1)} km/h`} label="season top speed" color="amber" plain="Their single fastest moment so far this season." />
          </div>
          <p className="text-[11px] italic" style={{ color: T.text3 }}>
            Demo: season totals derived from {parentPerf.playerName}'s last-match figures &times; 12 matches. Live numbers replace this when the JOHAN integration lands.
          </p>
        </Card>
      )}

      {/* Staff — squad rollup */}
      {!isParent && tab === 'squad' && (
        <Card>
          <p className="text-sm font-bold mb-3" style={{ color: T.text }}>U11 Lions · last match rollup</p>
          <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: T.panelAlt, borderBottom: `1px solid ${T.border}` }}>
                  <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: T.text4 }}>Player</th>
                  <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: T.text4 }}>Distance</th>
                  <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: T.text4 }}>Sprints</th>
                  <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: T.text4 }}>Top km/h</th>
                  <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: T.text4 }}>Effort</th>
                </tr>
              </thead>
              <tbody>
                {SQUAD_PERF.map(p => {
                  const band = effortBand(p.effortScore)
                  return (
                    <tr key={p.playerId} style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                      <td className="p-3 text-xs font-semibold" style={{ color: T.text }}>{p.playerName}</td>
                      <td className="p-3 text-[11px] font-mono" style={{ color: T.text2 }}>{p.distanceKm.toFixed(1)} km</td>
                      <td className="p-3 text-[11px] font-mono" style={{ color: T.text2 }}>{p.sprints}</td>
                      <td className="p-3 text-[11px] font-mono" style={{ color: T.text2 }}>{p.topSpeedKmh.toFixed(1)}</td>
                      <td className="p-3">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded uppercase tracking-wide font-semibold"
                          style={{ backgroundColor: pickDim(band.color), color: pickColor(band.color) }}
                        >
                          {p.effortScore}/100 · {band.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Staff — growth & load */}
      {!isParent && tab === 'growth_load' && (
        <Card>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div>
              <p className="text-sm font-bold" style={{ color: T.text }}>Growth-aware load</p>
              <p className="text-[11px]" style={{ color: T.text3 }}>
                Parents report growth spurts; the system flags load against the player's rolling
                4-week average. Junior-tuned thresholds — not the senior-football model.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {GROWTH_LOAD.map(g => {
              const flagColor: 'green' | 'amber' | 'red' = g.growthFlag === 'spurt' ? 'amber' : g.growthFlag === 'low' ? 'red' : 'green'
              return (
                <div key={g.playerId} className="rounded-lg p-3" style={{ backgroundColor: T.panelAlt, border: `1px solid ${T.borderSoft}` }}>
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                    <p className="text-xs font-semibold" style={{ color: T.text }}>
                      {g.playerName} · <span style={{ color: T.text4 }}>{g.ageBand}</span>
                    </p>
                    <div className="flex items-center gap-2 text-[11px]" style={{ color: T.text3 }}>
                      <span>Week {g.weeklyLoadAu} AU</span>
                      <span style={{ color: T.text4 }}>· avg {g.rollingAvgAu}</span>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded uppercase tracking-wide font-semibold"
                        style={{ backgroundColor: pickDim(flagColor), color: pickColor(flagColor) }}
                      >
                        {g.growthFlag === 'spurt' ? 'Growth spurt' : g.growthFlag === 'low' ? 'Low (managed)' : 'Normal'}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px]" style={{ color: T.text2 }}>{g.guidance}</p>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Staff — last match Jack as worked example */}
      {!isParent && tab === 'last_match' && <PlayerMatchPanel perf={JACK_PERF} plainEnglish={false} />}
    </div>
  )
}
