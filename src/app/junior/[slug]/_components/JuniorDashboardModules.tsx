'use client'

// Junior dashboard modules — extracted from the Today view in
// src/app/junior/[slug]/page.tsx. Mirrors the Women's portal pattern
// (per-section component, dismissible AI brief, two-column dashboard
// layout) adapted for grassroots Junior football scale and the Junior
// green accent (#16A34A / #15803D).
//
// All components consume hardcoded demo data from ../_lib/junior-dashboard-data.
// No Cricket v2 theme imports, no shared portal theme tokens — Tailwind
// classes + inline style only. Future live-data swap is a data-layer
// concern, not a component-layer concern.

import {
  JUNIOR_TOP_STATS,
  JUNIOR_FIXTURES,
  JUNIOR_RECENTS,
  JUNIOR_SQUAD_SUMMARY,
  type JuniorStatTone,
} from '../_lib/junior-dashboard-data'

// ─── Shared tone palette ────────────────────────────────────────────────────

const TONE: Record<JuniorStatTone, { bg: string; border: string; value: string; sub: string }> = {
  urgent: { bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.40)',  value: '#FCA5A5', sub: '#FCA5A5' },
  warn:   { bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.40)', value: '#FCD34D', sub: '#FCD34D' },
  ok:     { bg: 'rgba(22,163,74,0.10)',  border: 'rgba(22,163,74,0.40)',  value: '#22C55E', sub: '#86EFAC' },
  accent: { bg: 'rgba(21,128,61,0.14)',  border: 'rgba(21,128,61,0.50)',  value: '#22C55E', sub: '#86EFAC' },
  info:   { bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.40)', value: '#93C5FD', sub: '#93C5FD' },
}

const CARD_CLASS = 'bg-[#0D1117] border border-gray-800 rounded-xl p-5'

// ─── JuniorStatTiles — 5 stat cards row ─────────────────────────────────────

export default function JuniorStatTiles() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      {JUNIOR_TOP_STATS.map(stat => {
        const t = TONE[stat.tone]
        return (
          <div
            key={stat.label}
            className="rounded-xl p-4"
            style={{ backgroundColor: t.bg, border: `1px solid ${t.border}` }}
          >
            <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{stat.label}</div>
            <div className="text-2xl font-bold mb-1" style={{ color: t.value }}>{stat.value}</div>
            <div className="text-[10px]" style={{ color: t.sub }}>{stat.sub}</div>
          </div>
        )
      })}
    </div>
  )
}

// ─── JuniorFixtures — 4 upcoming fixture cards ──────────────────────────────

export function JuniorFixturesPanel() {
  return (
    <div className={CARD_CLASS}>
      <h3 className="text-sm font-bold text-white mb-3">Upcoming fixtures</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {JUNIOR_FIXTURES.map(f => (
          <div
            key={f.id}
            className="rounded-lg p-3"
            style={{ backgroundColor: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.25)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#86EFAC' }}>{f.ageBand}</span>
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: f.venue === 'H' ? 'rgba(22,163,74,0.18)' : 'rgba(245,158,11,0.18)',
                  color:           f.venue === 'H' ? '#86EFAC' : '#FCD34D',
                }}
              >
                {f.venue === 'H' ? 'HOME' : 'AWAY'}
              </span>
            </div>
            <p className="text-xs font-semibold text-white leading-tight mb-0.5">{f.homeTeam}</p>
            <p className="text-[10px] text-gray-500 mb-0.5">vs</p>
            <p className="text-xs font-semibold text-white leading-tight mb-2">{f.awayTeam}</p>
            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span>{f.date} · {f.time}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] text-gray-500">
              <span className="truncate">{f.ground}</span>
              <span className="shrink-0 ml-2">{f.competition}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── JuniorRecents — recent results ─────────────────────────────────────────

const RESULT_TINT: Record<'W' | 'D' | 'L', { bg: string; color: string }> = {
  W: { bg: 'rgba(22,163,74,0.18)',  color: '#86EFAC' },
  D: { bg: 'rgba(245,158,11,0.18)', color: '#FCD34D' },
  L: { bg: 'rgba(239,68,68,0.18)',  color: '#FCA5A5' },
}

export function JuniorRecents() {
  return (
    <div className={CARD_CLASS}>
      <h3 className="text-sm font-bold text-white mb-3">Recent results</h3>
      <ul className="space-y-2">
        {JUNIOR_RECENTS.map(r => {
          const tint = RESULT_TINT[r.res]
          return (
            <li key={r.id} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
              <span
                className="shrink-0 text-[10px] font-bold w-6 h-6 rounded flex items-center justify-center"
                style={{ backgroundColor: tint.bg, color: tint.color }}
              >
                {r.res}
              </span>
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider w-9 text-emerald-400">{r.ageBand}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{r.vs}</p>
                <p className="text-[10px] text-gray-500">{r.comp} · {r.date}</p>
              </div>
              <span className="shrink-0 text-sm font-bold text-white">{r.score}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// ─── JuniorSquadSummary — aggregate availability tile ───────────────────────

export function JuniorSquadSummary() {
  const s = JUNIOR_SQUAD_SUMMARY
  return (
    <div className={CARD_CLASS}>
      <h3 className="text-sm font-bold text-white mb-3">Squad availability</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-gray-500">Registered</div>
          <div className="text-2xl font-bold text-white">{s.registered}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-gray-500">Out</div>
          <div className="text-2xl font-bold text-amber-400">{s.out}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-gray-500">DBS pending</div>
          <div className="text-2xl font-bold text-red-400">{s.dbsPending}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-gray-500">Consents</div>
          <div className="text-2xl font-bold text-emerald-400">{s.consents}</div>
        </div>
      </div>
    </div>
  )
}
