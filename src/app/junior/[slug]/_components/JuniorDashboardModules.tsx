'use client'

// Junior dashboard modules — extracted from the Today view in
// src/app/junior/[slug]/page.tsx. Mirrors the Women's portal pattern
// (per-section component, dismissible AI brief, two-column dashboard
// layout) adapted for grassroots Junior football scale and the Junior
// green accent (#16A34A / #15803D).
//
// All components consume hardcoded demo data from ../_lib/junior-dashboard-data.
// JuniorStatTiles / JuniorFixturesPanel / JuniorSquadSummary stay on
// Tailwind classes — they're standalone full-width cards that don't
// share a row with theme-token siblings. JuniorRecents was re-skinned
// to theme tokens when it moved into the Row B 3-col layout so the
// row reads as a unified visual band with its AI / Performance
// siblings. Future live-data swap is a data-layer concern, not a
// component-layer concern.

import type { CSSProperties, ReactNode } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT_MONO } from '@/app/cricket/[slug]/v2/_lib/theme'
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
// Re-skinned to theme tokens when it moved into Row B (3-col row alongside
// JuniorAIBriefingBox / JuniorThisWeek / JuniorPerformanceSignals). Card
// + SectionHead primitives inlined locally — same pattern as the other
// theme-token Junior components.

function ThemeCard({ T, density, children, style }: { T: ThemeTokens; density: Density; children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        position: 'relative',
        background: T.panel,
        border: `1px solid ${T.border}`,
        borderRadius: density.radius,
        padding: density.pad,
        boxShadow: T.cardShadow,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function ThemeSectionHead({ T, title, right }: { T: ThemeTokens; title: ReactNode; right?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 10, gap: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{title}</div>
      <div style={{ marginLeft: 'auto', fontSize: 11, color: T.text3, display: 'flex', alignItems: 'center', gap: 4 }}>{right}</div>
    </div>
  )
}

// Result tint matches the cricket / NL / Women's resTint pattern.
const resTint = (T: ThemeTokens, r: 'W' | 'D' | 'L') => {
  if (r === 'W') return { bg: 'rgba(58,171,133,0.14)', fg: T.good }
  if (r === 'L') return { bg: 'rgba(199,90,90,0.12)',  fg: T.bad }
  return { bg: T.hover, fg: T.text2 }
}

interface JuniorRecentsProps {
  T: ThemeTokens
  accent: AccentTokens
  density: Density
  style?: CSSProperties
}

export function JuniorRecents({ T, accent, density, style }: JuniorRecentsProps) {
  return (
    <ThemeCard T={T} density={density} style={style}>
      <ThemeSectionHead
        T={T}
        title="Recent results"
        right={
          <div style={{ display: 'flex', gap: 4 }}>
            {JUNIOR_RECENTS.map((r, i) => {
              const t = resTint(T, r.res)
              return (
                <span
                  key={i}
                  style={{
                    width: 18, height: 18, borderRadius: 4,
                    fontSize: 9.5, fontWeight: 700,
                    display: 'grid', placeItems: 'center',
                    background: t.bg, color: t.fg,
                  }}
                >
                  {r.res}
                </span>
              )
            })}
          </div>
        }
      />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {JUNIOR_RECENTS.map((r, i) => {
          const t = resTint(T, r.res)
          return (
            <div
              key={r.id}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 10,
                padding: '8px 0',
                borderTop: i ? `1px solid ${T.border}` : 'none',
              }}
            >
              <span
                style={{
                  width: 16, height: 16, borderRadius: 4,
                  fontSize: 9.5, fontWeight: 700,
                  display: 'grid', placeItems: 'center',
                  background: t.bg, color: t.fg,
                  flexShrink: 0,
                }}
              >
                {r.res}
              </span>
              <span
                style={{
                  fontSize: 9.5, fontWeight: 700,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  color: accent.hex,
                  width: 32, flexShrink: 0,
                  fontFamily: FONT_MONO,
                }}
              >
                {r.ageBand}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12, color: T.text, fontWeight: 500,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}
                >
                  {r.vs}
                </div>
                <div style={{ fontSize: 10, color: T.text3 }}>
                  {r.comp} · {r.date}
                </div>
              </div>
              <span
                className="tnum"
                style={{
                  fontSize: 12.5, fontWeight: 600,
                  color: T.text, fontFamily: FONT_MONO,
                  flexShrink: 0,
                }}
              >
                {r.score}
              </span>
            </div>
          )
        })}
      </div>
    </ThemeCard>
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
