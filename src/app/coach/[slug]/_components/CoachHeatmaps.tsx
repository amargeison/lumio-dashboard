'use client'

// ─── Coach portal — GPS & Heatmaps department ────────────────────────────────
// The single GPS home. Folds the old GPS & Video GPS-side content (GPS stats,
// AI brief, KPI strip, session history) together with the GPS-honest heatmap
// suite, simplified to four spatial visuals (the shot-data-dependent Serve
// Placement and Returns & Rally sections were dropped — GPS can't produce them).
//
// Overlap reconciliation (distance/coverage/speed could appear twice): the
// GPS STATS tab owns the non-spatial analytics (KPI strip, distance-by-set,
// distance-by-phase, speed-zone breakdown, sprints, top-speed, HR, drop-off).
// The MOVEMENT & FITNESS heatmap tab owns only the spatial maps (12-zone court
// coverage, sprint-initiation map, recovery-position heatmap) — its duplicate
// distance-by-set and speed-zone cards were removed. One clear home per metric.
//
// Selector: a SESSION TYPE filter (All · Coaching session · Camp) scopes the
// session picker; the period segment (Full · Set 1-3) only shows for match
// sessions (camp/practice have no sets). Demo only — procedural/canned data.

import { useState, type ReactNode } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT, FONT_MONO } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { PLAYERS } from '../_lib/coach-data'
import { GPS_VIDEO_DATA, type GpsSession } from '../_lib/gps-video-data'

type Common = { T: ThemeTokens; accent: AccentTokens; density: Density }

// Semantic palette for multi-series charts (chrome uses the coach accent token).
const AMBER = '#F59E0B', RED = '#EF4444'
const COURT_GREEN = '#0a3d1a'  // court surface — a court colour, not a brand hue

// ─── Foundational heatmap helpers (still used by the student view's demo map) ─

// Neutral green → red density ramp (data-viz scale, not brand).
const TENNIS_HEAT_STOPS = ['#0E7C3A', '#22C55E', '#FACC15', '#F59E0B', '#EF4444', '#7F1D1D']
export const tennisHeatColor = (t: number) => {
  const c = Math.max(0, Math.min(1, t))
  const idx = Math.min(TENNIS_HEAT_STOPS.length - 1, Math.floor(c * (TENNIS_HEAT_STOPS.length - 1)))
  return TENNIS_HEAT_STOPS[idx]
}

// Deterministic PRNG so the same seed string always yields the same map.
function tennisHash(str: string, salt: number): number {
  let h = 2166136261 ^ salt
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619)
  }
  return ((h >>> 0) % 10000) / 10000
}

export const TENNIS_RALLY_ANCHORS = [
  { x: 0.5, y: 0.86, weight: 0.95 },
  { x: 0.32, y: 0.84, weight: 0.85 },
  { x: 0.68, y: 0.84, weight: 0.85 },
  { x: 0.5, y: 0.78, weight: 0.6 },
]
export const TENNIS_RECOVERY_ANCHORS = [
  { x: 0.5, y: 0.88, weight: 1.0 },
  { x: 0.5, y: 0.92, weight: 0.65 },
]

// ─── Court SVG (600×1100 reference frame — geometry copied verbatim) ──────────
function TennisCourt({ width, height, doubles = false, lineCol = 'rgba(255,255,255,0.85)' }: {
  width: number; height: number; doubles?: boolean; lineCol?: string
}) {
  const W = width, H = height
  const singlesL = doubles ? W * 0.125 : 0
  const singlesR = doubles ? W - W * 0.125 : W
  const serveTop = H * 0.31
  const serveBot = H * 0.69
  const net = H * 0.5
  return (
    <g>
      <rect x={0} y={0} width={W} height={H} rx={6} fill={COURT_GREEN} />
      <rect x={1} y={1} width={W - 2} height={H - 2} fill="none" stroke={lineCol} strokeWidth={2} />
      <line x1={singlesL} y1={0} x2={singlesL} y2={H} stroke={lineCol} strokeWidth={doubles ? 1.2 : 2} />
      <line x1={singlesR} y1={0} x2={singlesR} y2={H} stroke={lineCol} strokeWidth={doubles ? 1.2 : 2} />
      <line x1={0} y1={net} x2={W} y2={net} stroke="white" strokeWidth={4} />
      <rect x={0} y={net - 1.5} width={W} height={3} fill="rgba(255,255,255,0.5)" />
      <line x1={singlesL} y1={serveTop} x2={singlesR} y2={serveTop} stroke={lineCol} strokeWidth={1.5} />
      <line x1={singlesL} y1={serveBot} x2={singlesR} y2={serveBot} stroke={lineCol} strokeWidth={1.5} />
      <line x1={W / 2} y1={serveTop} x2={W / 2} y2={serveBot} stroke={lineCol} strokeWidth={1.5} />
      <line x1={W / 2} y1={0} x2={W / 2} y2={14} stroke={lineCol} strokeWidth={1.5} />
      <line x1={W / 2} y1={H - 14} x2={W / 2} y2={H} stroke={lineCol} strokeWidth={1.5} />
    </g>
  )
}

export function HeatLegend({ T }: { T: ThemeTokens }) {
  return (
    <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', border: `1px solid ${T.border}`, width: 220 }}>
      {TENNIS_HEAT_STOPS.map(c => <div key={c} style={{ flex: 1, background: c }} />)}
    </div>
  )
}

export function CourtPositionalHeatmap({
  width, height, seed, doubles = false, anchors, intensity = 1,
}: {
  width: number; height: number; seed: string; doubles?: boolean
  anchors: { x: number; y: number; weight: number }[]; intensity?: number
}) {
  const cols = 14, rows = 22
  const cellW = width / cols, cellH = height / rows
  const cells: { x: number; y: number; t: number }[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = (c + 0.5) / cols
      const cy = (r + 0.5) / rows
      let combined = 0
      for (const a of anchors) {
        const dx = cx - a.x
        const dy = cy - a.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        combined = Math.max(combined, Math.max(0, 1 - dist * 2.6) * a.weight)
      }
      const noise = tennisHash(`${seed}-${r}-${c}`, 7) * 0.4
      const t = Math.min(1, (combined + noise * 0.5) * intensity)
      if (t > 0.1) cells.push({ x: c * cellW, y: r * cellH, t })
    }
  }
  const filterId = `tennis-blur-${seed.replace(/[^a-z0-9]/gi, '')}`
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ maxHeight: 420 }}>
      <defs>
        <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>
      <TennisCourt width={width} height={height} doubles={doubles} />
      <g filter={`url(#${filterId})`} opacity={0.85}>
        {cells.map((cell, i) => (
          <rect key={i} x={cell.x} y={cell.y} width={cellW + 2} height={cellH + 2}
            fill={tennisHeatColor(cell.t)} opacity={0.4 + cell.t * 0.55} />
        ))}
      </g>
    </svg>
  )
}

export function CourtCoverageGrid({ width, height, seed }: { width: number; height: number; seed: string }) {
  const COLS = 4, ROWS = 3
  const baseDist: number[] = [
    8, 6, 6, 8,
    14, 18, 16, 14,
    1, 4, 4, 1,
  ]
  const total = baseDist.reduce((a, b) => a + b, 0)
  const cells = baseDist.map((v, i) => {
    const noise = (tennisHash(`${seed}-cc-${i}`, 59) - 0.5) * 4
    return Math.max(0.5, v + noise)
  })
  const cellTotal = cells.reduce((a, b) => a + b, 0)
  const pct = cells.map(v => Math.round((v / cellTotal) * 100))
  const cellW = width / COLS, cellH = height / ROWS
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ maxHeight: 420 }}>
      <TennisCourt width={width} height={height} />
      {pct.map((p, i) => {
        const r = Math.floor(i / COLS)
        const c = i % COLS
        const x = c * cellW
        const y = r * cellH + height * 0.5 // bottom half (player's side)
        return (
          <g key={i}>
            <rect x={x + 2} y={y * 0 + (r * cellH * 0.5 + height * 0.5)} width={cellW - 4} height={cellH * 0.5 - 4}
              fill={tennisHeatColor(p / Math.max(...pct))} opacity={0.35 + (p / Math.max(...pct)) * 0.45}
              stroke="rgba(255,255,255,0.25)" strokeWidth={1} rx={3} />
            <text x={x + cellW / 2} y={r * cellH * 0.5 + height * 0.5 + cellH * 0.25 + 4}
              fontSize={14} fontWeight={800} fill="white" textAnchor="middle" opacity={0.9}>{p}%</text>
          </g>
        )
      })}
      <text x={width / 2} y={height * 0.5 - 8} fontSize={9} fill="white" opacity={0.5} textAnchor="middle">PLAYER&apos;S HALF</text>
      <text x={width / 2} y={height * 0.96} fontSize={9} fill="white" opacity={0.5} textAnchor="middle">Sums to coverage of their side · {total}u baseline</text>
    </svg>
  )
}

// ─── GPS stats helpers (folded in from the old GPS & Video view) ─────────────
function GpsCard({ T, density, title, sub, children }: Pick<Common, 'T' | 'density'> & { title?: string; sub?: string; children: ReactNode }) {
  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: density.radius, padding: density.pad, boxShadow: T.cardShadow }}>
      {(title || sub) && (
        <div style={{ marginBottom: 12 }}>
          {title && <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{title}</div>}
          {sub && <div style={{ fontSize: 11, color: T.text3, marginTop: 2, lineHeight: 1.4 }}>{sub}</div>}
        </div>
      )}
      {children}
    </div>
  )
}

function GpsKpi({ T, label, value, sub, color }: { T: ThemeTokens; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px 14px' }}>
      <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div className="tnum" style={{ fontSize: 22, fontWeight: 800, color, marginTop: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: T.text3, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

export function GpsLineChart({
  T, values, max, min = 0, labels, valueFormat, colour, area = true, height = 150, width = 400, target,
}: {
  T: ThemeTokens; values: number[]; max: number; min?: number; labels?: string[]
  valueFormat?: (v: number) => string; colour: string; area?: boolean
  height?: number; width?: number; target?: number
}) {
  const padX = 32, padY = 22
  const innerW = width - padX * 2, innerH = height - padY * 2
  const xy = (i: number, v: number): [number, number] => [
    padX + (i / (values.length - 1 || 1)) * innerW,
    padY + (1 - (v - min) / (max - min)) * innerH,
  ]
  const pts = values.map((v, i) => xy(i, v).join(',')).join(' ')
  const baseY = padY + innerH
  const areaPts = `${padX},${baseY} ${pts} ${padX + innerW},${baseY}`
  const gid = `gpsln-${colour.replace('#', '')}`
  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', maxHeight: height + 4 }}>
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={colour} stopOpacity="0.40" />
          <stop offset="100%" stopColor={colour} stopOpacity="0.04" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map(p => {
        const y = padY + p * innerH
        return <line key={p} x1={padX} y1={y} x2={padX + innerW} y2={y} stroke={T.border} />
      })}
      {target !== undefined && (() => {
        const ty = padY + (1 - (target - min) / (max - min)) * innerH
        return <line x1={padX} y1={ty} x2={padX + innerW} y2={ty} stroke={AMBER} strokeWidth="1" strokeDasharray="6 4" />
      })()}
      {area && <polygon points={areaPts} fill={`url(#${gid})`} />}
      <polyline fill="none" stroke={colour} strokeWidth="2.4" strokeLinecap="round" points={pts} />
      {values.map((v, i) => {
        const [x, y] = xy(i, v)
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={3.2} fill={colour} stroke={T.panel} strokeWidth={1.2} />
            <text x={x} y={y - 8} textAnchor="middle" fontSize="9" fontWeight="700" fill={T.text}>{valueFormat ? valueFormat(v) : v}</text>
          </g>
        )
      })}
      {labels && labels.map((l, i) => {
        const [x] = xy(i, values[i])
        return <text key={l + i} x={x} y={height - 4} textAnchor="middle" fontSize="9" fill={T.text3}>{l}</text>
      })}
    </svg>
  )
}

// ─── Effort & Rewards ────────────────────────────────────────────────────────
// The smartwatch reward system. Each session a player records on their OWN watch
// becomes Effort / Movement / Consistency scores and XP toward their next racket.
// Honest by design: estimated effort only — NO court position or heatmaps, because
// consumer-watch GPS can't place a player on court (see
// docs/watch-gps-reward-concept-review.md). Demo derives scores from the same
// fields a real watch summary provides (distance, duration, heart rate, intensity).

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
// Effort levels are this system's OWN ladder — deliberately separate from the
// Racket Progression pathway (which the coach assesses against the LTA Youth
// framework). XP is a motivation currency; it never advances a racket.
const EFFORT_LEVELS = [
  { name: 'Rookie', min: 0 },
  { name: 'Mover', min: 300 },
  { name: 'Grinder', min: 800 },
  { name: 'Competitor', min: 1500 },
  { name: 'Athlete', min: 2500 },
  { name: 'Elite', min: 4000 },
]
function levelFor(xp: number) {
  let idx = 0
  for (let i = 0; i < EFFORT_LEVELS.length; i++) if (xp >= EFFORT_LEVELS[i].min) idx = i
  const cur = EFFORT_LEVELS[idx], next = EFFORT_LEVELS[idx + 1]
  const pct = next ? Math.round(((xp - cur.min) / (next.min - cur.min)) * 100) : 100
  return { idx, cur, next, pct }
}

type EffortScore = { effort: number; movement: number; consistency: number; xp: number; avgHr: number | null; distKm: number; dur: number; sprints: number }
function scoreSession(s: GpsSession, age: number): EffortScore {
  const distM = s.distance * 1000
  const dur = s.duration
  const hrs = (s.hrBySet ?? []).map(h => h.avg).filter(Boolean)
  const avgHr = hrs.length ? Math.round(hrs.reduce((a, b) => a + b, 0) / hrs.length) : null
  const estMax = age ? 220 - age : 200
  const hrInt = avgHr ? clamp01((avgHr / estMax - 0.5) / 0.4) : null   // ~50%→0, ~90%→1
  const loadComp = clamp01(s.load / 100)
  const effort = Math.round(100 * (hrInt != null ? 0.6 * hrInt + 0.4 * loadComp : loadComp))
  const mPerMin = dur ? distM / dur : 0
  const movement = Math.round(100 * clamp01((Math.min(mPerMin, 90) - 15) / 60))  // 15→0, 75→1 m/min
  const consistency = Math.round(100 * clamp01(dur / 60))
  const xp = Math.min(120, Math.round(0.5 * effort + 0.3 * movement + 0.2 * consistency))
  return { effort, movement, consistency, xp, avgHr, distKm: s.distance, dur, sprints: s.sprintCount }
}

const lvlOf = (T: ThemeTokens, n: number) => n >= 70 ? { label: 'High', c: T.good } : n >= 40 ? { label: 'Medium', c: AMBER } : { label: 'Low', c: RED }

export function HeatmapsView({ T, accent, density }: Common) {
  // Build per-player XP from their watch sessions; rank for the squad board.
  const totals = PLAYERS
    .filter(p => GPS_VIDEO_DATA[p.id]?.sessions?.length)
    .map(p => {
      const scored = GPS_VIDEO_DATA[p.id].sessions.map(s => ({ s, sc: scoreSession(s, p.age) }))
      return { p, scored, xp: scored.reduce((a, x) => a + x.sc.xp, 0) }
    })
    .sort((a, b) => b.xp - a.xp)

  const [selId, setSelId] = useState(totals[0]?.p.id ?? '')
  const sel = totals.find(t => t.p.id === selId) ?? totals[0]

  const honest = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 10.5, fontWeight: 700, color: accent.hex, background: accent.dim, border: `1px solid ${accent.border}`, borderRadius: 999, padding: '4px 11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      ⌚ Smartwatch effort · estimated · no court tracking
    </span>
  )

  const header = (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center', background: accent.dim }}>
          <Icon name="trophy" size={20} stroke={1.7} style={{ color: accent.hex }} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontFamily: FONT, fontSize: 24, fontWeight: 600, color: T.text, letterSpacing: '-0.02em' }}>Effort &amp; Rewards</h1>
          <p style={{ margin: '4px 0 0', fontSize: 12.5, color: T.text3 }}>Every session a player records on their own smartwatch becomes XP towards their next racket.</p>
        </div>
      </div>
      {honest}
    </div>
  )

  if (!sel) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: density.gap }}>
        {header}
        <GpsCard T={T} density={density}>
          <div style={{ textAlign: 'center', padding: '30px 10px', color: T.text3, fontSize: 13 }}>
            No watch sessions logged yet. Players connect a watch from their player page, then finished sessions appear here as XP.
          </div>
        </GpsCard>
      </div>
    )
  }

  const latest = sel.scored[0]
  const lvl = levelFor(sel.xp)
  const ordered = sel.scored.slice().reverse()
  const effortTrend = ordered.map(x => x.sc.effort)
  const trendLabels = ordered.map(x => new Date(x.s.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }))

  const scoreTile = (label: string, n: number) => {
    const lv = lvlOf(T, n)
    return (
      <div style={{ flex: 1, minWidth: 150, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
          <span style={{ fontSize: 9.5, fontWeight: 800, color: lv.c, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{lv.label}</span>
        </div>
        <div className="tnum" style={{ fontSize: 26, fontWeight: 800, color: T.text, marginTop: 2 }}>{n}<span style={{ fontSize: 12, color: T.text3, fontWeight: 600 }}>/100</span></div>
        <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
          {[0, 1, 2, 3].map(i => <div key={i} style={{ flex: 1, height: 5, borderRadius: 3, background: (n / 100) * 4 > i ? lv.c : T.hover }} />)}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: density.gap }}>
      {header}

      {/* Squad leaderboard */}
      <GpsCard T={T} density={density} title="Squad leaderboard" sub="Ranked by total XP earned from watch sessions">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {totals.map((t, i) => {
            const on = t.p.id === sel.p.id
            return (
              <button key={t.p.id} onClick={() => setSelId(t.p.id)}
                style={{ appearance: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 10px', borderRadius: 10, border: `1px solid ${on ? accent.border : 'transparent'}`, background: on ? accent.dim : 'transparent', marginBottom: 2 }}>
                <span className="tnum" style={{ width: 22, textAlign: 'center', fontSize: 13, fontWeight: 800, color: i === 0 ? '#F5C518' : i === 1 ? '#C0C5CE' : i === 2 ? '#CD7F32' : T.text3 }}>{i + 1}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`https://i.pravatar.cc/120?u=${encodeURIComponent(t.p.name)}`} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.p.name}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: T.text3 }}>
                    🏅 {levelFor(t.xp).cur.name}
                  </span>
                </span>
                <span className="tnum" style={{ fontSize: 15, fontWeight: 800, color: accent.hex }}>{t.xp.toLocaleString()} <span style={{ fontSize: 10, color: T.text3, fontWeight: 600 }}>XP</span></span>
              </button>
            )
          })}
        </div>
      </GpsCard>

      {/* Player picker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11.5, color: T.text3 }}>Player</span>
        <select value={sel.p.id} onChange={e => setSelId(e.target.value)}
          style={{ appearance: 'none', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, fontSize: 13, fontWeight: 600, padding: '9px 30px 9px 12px', fontFamily: FONT, cursor: 'pointer', minWidth: 200,
            backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(T.text3)}' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>")`,
            backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}>
          {totals.map(t => <option key={t.p.id} value={t.p.id}>{t.p.name}</option>)}
        </select>
      </div>

      {/* XP hero + effort level (a separate ladder from Racket Progression) */}
      <GpsCard T={T} density={density}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 130 }}>
            <div style={{ fontSize: 10.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total XP</div>
            <div className="tnum" style={{ fontSize: 34, fontWeight: 800, color: accent.hex, lineHeight: 1.1 }}>{sel.xp.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: T.text3 }}>{sel.scored.length} session{sel.scored.length === 1 ? '' : 's'} logged</div>
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: T.text2, fontWeight: 700 }}>
                <span style={{ fontSize: 14 }}>🏅</span>Effort level {lvl.idx + 1} · {lvl.cur.name}
              </span>
              <span style={{ color: T.text3 }}>{lvl.next ? `Next: ${lvl.next.name}` : 'Max level'}</span>
            </div>
            <div style={{ height: 12, borderRadius: 999, background: T.hover, overflow: 'hidden', border: `1px solid ${T.border}` }}>
              <div style={{ width: `${lvl.pct}%`, height: '100%', background: accent.hex }} />
            </div>
            <div style={{ fontSize: 11, color: T.text3, marginTop: 5 }}>{lvl.next ? `${(lvl.next.min - sel.xp).toLocaleString()} XP to ${lvl.next.name}` : 'Top effort level reached'}{latest ? ` · +${latest.sc.xp} XP last session` : ''}</div>
          </div>
        </div>
      </GpsCard>

      {/* Latest session scores */}
      {latest && (
        <GpsCard T={T} density={density} title={`Latest session · ${latest.s.label}`} sub={`${new Date(latest.s.date).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })} · ${latest.s.type} · ${latest.s.surface} court`}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            {scoreTile('Effort', latest.sc.effort)}
            {scoreTile('Movement', latest.sc.movement)}
            {scoreTile('Consistency', latest.sc.consistency)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
            <GpsKpi T={T} label="Duration" value={`${latest.sc.dur}m`} color={T.text} />
            <GpsKpi T={T} label="Distance" value={`${latest.sc.distKm.toFixed(1)}km`} color={T.text} />
            <GpsKpi T={T} label="Avg heart rate" value={latest.sc.avgHr ? `${latest.sc.avgHr}` : '—'} sub={latest.sc.avgHr ? 'bpm' : 'estimated'} color={T.text} />
            <GpsKpi T={T} label="XP earned" value={`+${latest.sc.xp}`} color={accent.hex} />
          </div>
        </GpsCard>
      )}

      {/* Effort trend */}
      {effortTrend.length > 1 && (
        <GpsCard T={T} density={density} title="Effort trend" sub="Effort score across recent sessions">
          <GpsLineChart T={T} values={effortTrend} max={100} min={0} labels={trendLabels} colour={accent.hex} height={150} width={460} target={70} valueFormat={v => `${v}`} />
        </GpsCard>
      )}

      {/* Session history */}
      <GpsCard T={T} density={density} title="Session history" sub="Every recorded session and the XP it earned">
        <div>
          {sel.scored.map(({ s, sc }, i) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: i ? `1px solid ${T.border}` : 'none' }}>
              <div style={{ width: 86, flexShrink: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{new Date(s.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                <div style={{ fontSize: 10.5, color: T.text3 }}>{s.type}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, color: T.text2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.label}</div>
                <div style={{ display: 'flex', gap: 10, marginTop: 3, flexWrap: 'wrap' }}>
                  {([['E', sc.effort], ['M', sc.movement], ['C', sc.consistency]] as const).map(([k, n]) => {
                    const lv = lvlOf(T, n)
                    return <span key={k} style={{ fontSize: 10.5, color: T.text3 }}>{k} <b style={{ color: lv.c }}>{n}</b></span>
                  })}
                </div>
              </div>
              <span className="tnum" style={{ fontSize: 14, fontWeight: 800, color: accent.hex, flexShrink: 0 }}>+{sc.xp} XP</span>
            </div>
          ))}
        </div>
      </GpsCard>

      {/* How XP works + honesty note */}
      <GpsCard T={T} density={density} title="How XP works">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {[
            ['Effort', 'Heart-rate intensity and how hard they worked through the session.'],
            ['Movement', 'How much ground they covered — distance per minute on court.'],
            ['Consistency', 'Showing up and putting in a full session, every time.'],
          ].map(([h, d]) => (
            <div key={h} style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: T.text }}>{h}</div>
              <div style={{ fontSize: 11.5, color: T.text3, marginTop: 3, lineHeight: 1.5 }}>{d}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11.5, color: T.text3, lineHeight: 1.6, margin: '14px 0 0' }}>
          XP builds the effort level and streak shown above. It is a motivation layer, kept separate from Racket Progression, which the coach assesses against the LTA Youth pathway each session. Effort rewards never advance a racket. Short sessions are ignored, XP is capped per session, and a coach can void anything odd. This is estimated smartwatch effort (heart rate, distance, duration) and never tracks court position.
        </p>
      </GpsCard>
    </div>
  )
}

