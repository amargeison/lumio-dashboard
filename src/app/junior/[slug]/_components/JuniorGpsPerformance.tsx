'use client'

// Junior Football — GPS & Performance (training load + physical data).
//
// DISTINCT from the existing 'performance' module (per-player match
// performance metrics). This is the training-load picture: distance
// covered, sprint counts, age-appropriate HR zones and 4-week load
// trends. Junior-conservative — no adult ACWR thresholds applied.
//
// Demo data is canned.

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
  accentDim:  'rgba(22,163,74,0.12)',
  good:       '#22C55E',
  warn:       '#F59E0B',
  bad:        '#EF4444',
  blue:       '#3B82F6',
  amber:      '#F59E0B',
} as const

interface PlayerLoad {
  name: string
  team: string
  ageBand: string
  /** Total weekly distance (km) — training + match. */
  distance: number
  /** Sprint count (>4 m/s for a junior threshold). */
  sprints: number
  /** Maximum speed reached this week (km/h). */
  topSpeed: number
  /** Time-in-zone — minutes in HR zone 4+5 (high-intensity). Age-conservative cap. */
  hrZone45: number
  /** 4-week weekly load (arbitrary units), oldest → newest. */
  loadTrend: number[]
  /** Coach status flag. */
  status: 'normal' | 'growth_monitor' | 'load_cap' | 'returning'
  note?: string
}

const PLAYERS: PlayerLoad[] = [
  { name: 'Jack Carter',     team: 'U11 Lions',   ageBand: 'U11', distance: 8.6,  sprints: 22, topSpeed: 19.2, hrZone45: 22, loadTrend: [62, 68, 71, 74], status: 'normal' },
  { name: 'Adam Sefer',      team: 'U11 Lions',   ageBand: 'U11', distance: 9.1,  sprints: 28, topSpeed: 20.4, hrZone45: 26, loadTrend: [58, 64, 72, 80], status: 'normal' },
  { name: 'Kai Linton',      team: 'U11 Lions',   ageBand: 'U11', distance: 5.2,  sprints: 9,  topSpeed: 17.1, hrZone45: 14, loadTrend: [70, 66, 48, 35], status: 'returning', note: 'Returning from school-fixture clash week — light load this week.' },
  { name: 'Mia Carter',      team: 'U13 Falcons', ageBand: 'U13', distance: 10.2, sprints: 24, topSpeed: 20.1, hrZone45: 30, loadTrend: [66, 71, 74, 78], status: 'normal' },
  { name: 'Sophie Mahan',    team: 'U13 Falcons', ageBand: 'U13', distance: 11.4, sprints: 31, topSpeed: 21.6, hrZone45: 34, loadTrend: [62, 69, 76, 84], status: 'normal' },
  { name: 'Ben Morley',      team: 'U14 Eagles',  ageBand: 'U14', distance: 7.9,  sprints: 17, topSpeed: 19.8, hrZone45: 20, loadTrend: [72, 70, 64, 58], status: 'growth_monitor', note: 'Growth-spurt monitor — load deliberately tapered. Re-screen Friday.' },
  { name: 'Toby Lockhart',   team: 'U14 Eagles',  ageBand: 'U14', distance: 11.8, sprints: 33, topSpeed: 22.3, hrZone45: 36, loadTrend: [70, 75, 80, 86], status: 'normal' },
  { name: 'Arjun Mehta',     team: 'U14 Eagles',  ageBand: 'U14', distance: 12.6, sprints: 36, topSpeed: 23.1, hrZone45: 40, loadTrend: [76, 82, 90, 98], status: 'load_cap', note: 'Approaching weekly cap — coach + parent agree no school-team midweek.' },
]

const STATUS_LABEL: Record<PlayerLoad['status'], { label: string; tone: { bg: string; fg: string } }> = {
  normal:          { label: 'Normal',          tone: { bg: 'rgba(34,197,94,0.18)',  fg: T.good } },
  growth_monitor:  { label: 'Growth monitor',  tone: { bg: 'rgba(245,158,11,0.18)', fg: T.warn } },
  load_cap:        { label: 'Approaching cap', tone: { bg: 'rgba(239,68,68,0.18)',  fg: T.bad } },
  returning:       { label: 'Returning',       tone: { bg: 'rgba(59,130,246,0.18)', fg: T.blue } },
}

interface Props {
  session: SportsDemoSession
  demoChild?: { name: string; ageBand: string; team: string }
}

export default function JuniorGpsPerformance({ session }: Props) {
  const [teamFilter, setTeamFilter] = useState<'all' | string>('all')
  const teams = Array.from(new Set(PLAYERS.map(p => p.team)))
  const filtered = teamFilter === 'all' ? PLAYERS : PLAYERS.filter(p => p.team === teamFilter)

  const totals = filtered.reduce(
    (acc, p) => {
      acc.distance += p.distance
      acc.sprints += p.sprints
      acc.flagged += p.status === 'load_cap' || p.status === 'growth_monitor' ? 1 : 0
      return acc
    },
    { distance: 0, sprints: 0, flagged: 0 },
  )

  return (
    <div className="space-y-4">
      <div
        className="rounded-xl p-5"
        style={{
          background: `linear-gradient(135deg, ${T.accentDim} 0%, rgba(22,101,52,0.04) 60%, transparent 100%)`,
          border: `1px solid ${T.accent}55`,
        }}
      >
        <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: T.accent }}>
          GPS &amp; Performance · Training load
        </p>
        <h2 className="text-lg font-bold" style={{ color: T.text }}>
          This week · {filtered.length} players · {totals.flagged} flagged for load review
        </h2>
        <p className="text-sm mt-1 leading-relaxed" style={{ color: T.text2 }}>
          Distance, sprints, top speeds and HR-zone time. Junior-conservative —
          we monitor growth spurts and weekly caps before adult ACWR thresholds
          even come into the conversation. Signed in as{' '}
          <span style={{ color: T.text }}>{session.userName || session.role}</span>.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTeamFilter('all')}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          style={{
            backgroundColor: teamFilter === 'all' ? T.accentDim : 'transparent',
            border: `1px solid ${teamFilter === 'all' ? T.accent : T.border}`,
            color: teamFilter === 'all' ? T.good : T.text3,
          }}
        >
          All teams
        </button>
        {teams.map(t => {
          const active = teamFilter === t
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTeamFilter(t)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{
                backgroundColor: active ? T.accentDim : 'transparent',
                border: `1px solid ${active ? T.accent : T.border}`,
                color: active ? T.good : T.text3,
              }}
            >
              {t}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile label="Total distance (km)" value={totals.distance.toFixed(1)} tone="good" />
        <KpiTile label="Total sprints" value={totals.sprints} tone="good" />
        <KpiTile label="Flagged for review" value={totals.flagged} tone={totals.flagged === 0 ? 'good' : 'warn'} />
        <KpiTile label="Players covered" value={`${filtered.length}/${PLAYERS.length}`} tone="neutral" />
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
        <table className="w-full text-xs">
          <thead style={{ backgroundColor: T.panelAlt, color: T.text3 }}>
            <tr className="text-left">
              <th className="px-3 py-2 font-semibold">Player</th>
              <th className="px-3 py-2 font-semibold">Team</th>
              <th className="px-3 py-2 font-semibold">Distance</th>
              <th className="px-3 py-2 font-semibold">Sprints</th>
              <th className="px-3 py-2 font-semibold">Top speed</th>
              <th className="px-3 py-2 font-semibold">HR Z4–5</th>
              <th className="px-3 py-2 font-semibold">4-week trend</th>
              <th className="px-3 py-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => {
              const s = STATUS_LABEL[p.status]
              return (
                <tr key={i} style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                  <td className="px-3 py-2" style={{ color: T.text }}>{p.name}</td>
                  <td className="px-3 py-2" style={{ color: T.text3 }}>{p.team}</td>
                  <td className="px-3 py-2 font-mono" style={{ color: T.text2 }}>{p.distance.toFixed(1)} km</td>
                  <td className="px-3 py-2 font-mono" style={{ color: T.text2 }}>{p.sprints}</td>
                  <td className="px-3 py-2 font-mono" style={{ color: T.text2 }}>{p.topSpeed} km/h</td>
                  <td className="px-3 py-2 font-mono" style={{ color: T.text2 }}>{p.hrZone45} min</td>
                  <td className="px-3 py-2"><MiniBars values={p.loadTrend} /></td>
                  <td className="px-3 py-2">
                    <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: s.tone.bg, color: s.tone.fg }}>
                      {s.label}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {filtered.some(p => p.note) && (
        <div className="rounded-xl p-4" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
          <p className="text-sm font-bold mb-2" style={{ color: T.text }}>Coach notes · this week</p>
          <ul className="space-y-1.5">
            {filtered.filter(p => p.note).map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px]" style={{ color: T.text2 }}>
                <span className="mt-0.5" style={{ color: T.warn }}>•</span>
                <span><span style={{ color: T.text, fontWeight: 600 }}>{p.name}</span> — {p.note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function MiniBars({ values }: { values: number[] }) {
  const max = Math.max(...values, 100)
  return (
    <div className="flex items-end gap-0.5 h-7">
      {values.map((v, i) => (
        <div
          key={i}
          style={{
            width: 6,
            height: `${(v / max) * 100}%`,
            backgroundColor: T.accent,
            opacity: 0.4 + (i / values.length) * 0.6,
            borderRadius: 1,
          }}
        />
      ))}
    </div>
  )
}

function KpiTile({ label, value, tone }: { label: string; value: string | number; tone: 'good' | 'warn' | 'bad' | 'neutral' }) {
  const colorMap: Record<typeof tone, string> = { good: T.good, warn: T.warn, bad: T.bad, neutral: T.text }
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
      <div className="text-2xl font-bold" style={{ color: colorMap[tone] }}>{value}</div>
      <div className="text-xs mt-0.5" style={{ color: T.text3 }}>{label}</div>
    </div>
  )
}
