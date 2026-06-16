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

import { useState, type CSSProperties, type ReactNode } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT, FONT_MONO } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { PLAYERS } from '../_lib/coach-data'
import { GPS_VIDEO_DATA, type GpsSession, type PlayerGpsData } from '../_lib/gps-video-data'

type Common = { T: ThemeTokens; accent: AccentTokens; density: Density }

// Semantic palette for multi-series charts (chrome uses the coach accent token).
const GREEN = '#22C55E', AMBER = '#F59E0B', RED = '#EF4444', PURPLE = '#A855F7'
const COURT_GREEN = '#0a3d1a'  // court surface — a court colour, not a brand hue

const recoveryColor = (T: ThemeTokens, r: GpsSession['recovery']) =>
  r === 'Good' ? T.good : r === 'Moderate' ? T.warn : T.bad

// ─── Foundational heatmap helpers (copied verbatim) ──────────────────────────

// Neutral green → red density ramp (data-viz scale, not brand).
const TENNIS_HEAT_STOPS = ['#0E7C3A', '#22C55E', '#FACC15', '#F59E0B', '#EF4444', '#7F1D1D']
const tennisHeatColor = (t: number) => {
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

const TENNIS_RALLY_ANCHORS = [
  { x: 0.5, y: 0.86, weight: 0.95 },
  { x: 0.32, y: 0.84, weight: 0.85 },
  { x: 0.68, y: 0.84, weight: 0.85 },
  { x: 0.5, y: 0.78, weight: 0.6 },
]
const TENNIS_NET_APPROACH_ANCHORS = [
  { x: 0.5, y: 0.62, weight: 0.95 },
  { x: 0.42, y: 0.58, weight: 0.7 },
  { x: 0.58, y: 0.58, weight: 0.7 },
]
const TENNIS_RECOVERY_ANCHORS = [
  { x: 0.5, y: 0.88, weight: 1.0 },
  { x: 0.5, y: 0.92, weight: 0.65 },
]

const TRAINING_SESSIONS = [
  'Service-box footwork (60 min)',
  'Cross-court rally patterns (60 min)',
  'Match simulation (75 min)',
  'Recovery + light hit (45 min)',
]
const SURFACES = [
  { name: 'Hard', color: '#3B82F6', emoji: '🔵' },
  { name: 'Clay', color: '#D97706', emoji: '🟠' },
  { name: 'Grass', color: '#16A34A', emoji: '🟢' },
] as const

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

function HeatLegend({ T }: { T: ThemeTokens }) {
  return (
    <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', border: `1px solid ${T.border}`, width: 220 }}>
      {TENNIS_HEAT_STOPS.map(c => <div key={c} style={{ flex: 1, background: c }} />)}
    </div>
  )
}

function CourtPositionalHeatmap({
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

function CourtCoverageGrid({ width, height, seed }: { width: number; height: number; seed: string }) {
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

function SprintInitiationMap({ width, height, seed }: { width: number; height: number; seed: string }) {
  const sprints = Array.from({ length: 12 }, (_, i) => {
    const sx = (0.15 + tennisHash(`${seed}-sp-${i}-x`, 61) * 0.7)
    const sy = (0.55 + tennisHash(`${seed}-sp-${i}-y`, 67) * 0.42)
    const dx = (tennisHash(`${seed}-sp-${i}-dx`, 71) - 0.5) * 0.5
    const dy = (tennisHash(`${seed}-sp-${i}-dy`, 73) - 0.55) * 0.38
    const speed = 0.5 + tennisHash(`${seed}-sp-${i}-s`, 79) * 0.5
    return {
      x1: sx * width, y1: sy * height,
      x2: Math.max(8, Math.min(width - 8, (sx + dx) * width)),
      y2: Math.max(8, Math.min(height - 8, (sy + dy) * height)),
      speed,
    }
  })
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ maxHeight: 360 }}>
      <TennisCourt width={width} height={height} />
      {sprints.map((s, i) => (
        <g key={i}>
          <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={tennisHeatColor(s.speed)} strokeWidth={2.4} strokeLinecap="round" opacity={0.85} />
          <circle cx={s.x1} cy={s.y1} r={3.5} fill="white" opacity={0.85} />
          <circle cx={s.x2} cy={s.y2} r={3} fill={tennisHeatColor(s.speed)} stroke="white" strokeWidth={1} />
        </g>
      ))}
    </svg>
  )
}

// 7-day load microcycle (generic academy week).
function WeeklyLoadCalendar({ T }: { T: ThemeTokens }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const labels = ['Recovery', 'Footwork', 'Match sim', 'S&C', 'Light hit', 'MATCH', 'Off']
  const intensities = [0.18, 0.62, 0.92, 0.45, 0.3, 1.0, 0.05]
  const distances = [2.8, 4.4, 5.2, 3.1, 2.6, 5.8, 0]
  return (
    <svg viewBox="0 0 700 200" width="100%" style={{ maxHeight: 220 }}>
      <rect width={700} height={200} fill={T.panel2} rx={8} />
      {days.map((d, i) => {
        const x = i * (700 / 7)
        const w = 700 / 7 - 6
        return (
          <g key={d}>
            <rect x={x + 3} y={28} width={w} height={150} rx={6}
              fill={tennisHeatColor(intensities[i])} opacity={0.18 + intensities[i] * 0.55} />
            <text x={x + (700 / 7) / 2} y={20} textAnchor="middle" fontSize={11} fontWeight={700} fill={T.text3}>{d}</text>
            <text x={x + (700 / 7) / 2} y={62} textAnchor="middle" fontSize={10} fill={T.text} opacity={0.9}>{labels[i]}</text>
            <text x={x + (700 / 7) / 2} y={110} textAnchor="middle" fontSize={26} fontWeight={800} fill={T.text}>
              {distances[i] > 0 ? distances[i].toFixed(1) : '—'}
            </text>
            <text x={x + (700 / 7) / 2} y={128} textAnchor="middle" fontSize={9} fill={T.text3}>km</text>
            <text x={x + (700 / 7) / 2} y={158} textAnchor="middle" fontSize={11} fontWeight={600} fill={T.text} opacity={0.9}>
              {Math.round(intensities[i] * 100)} AU
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── GPS stats helpers (folded in from the old GPS & Video view) ─────────────
function GpsCard({ T, density, title, sub, children }: Common & { title?: string; sub?: string; children: ReactNode }) {
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

function GpsSectionHead({ T, accent, n, title, sub }: Common & { n: number; title: string; sub?: string }) {
  return (
    <div style={{ paddingTop: 4 }}>
      <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: accent.hex }}>{n} · {title}</h2>
      {sub && <p style={{ margin: '2px 0 0', fontSize: 11, color: T.text3 }}>{sub}</p>}
    </div>
  )
}

function GpsLineChart({
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

// GPS analytics panel — owns the non-spatial movement/speed/HR metrics. The
// spatial coverage/sprint/recovery maps live in the Movement & Fitness tab.
function GpsStatsPanel({ T, accent, density, session, data }: Common & { session: GpsSession; data: PlayerGpsData }) {
  const totalDistance = session.distanceBySet.reduce((a, b) => a + b.km, 0)
  const avgPerSet = totalDistance / session.distanceBySet.length
  const phaseTotal = data.distanceByPhase.reduce((a, b) => a + b.km, 0)
  const maxSetKm = Math.max(...session.distanceBySet.map(s => s.km))
  const maxSprint = Math.max(...session.sprintsPerSet.map(s => s.n))
  const firstSpeed = session.topSpeedPerSet[0]?.kmh ?? 0
  const lastSpeed = session.topSpeedPerSet[session.topSpeedPerSet.length - 1]?.kmh ?? 0
  const setWord = session.distanceBySet.length > 1 ? 'block' : 'day'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: density.gap }}>
      {/* 1 · KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <GpsKpi T={T} label="Total distance" value={`${session.distance.toFixed(1)} km`} sub={`avg ${avgPerSet.toFixed(1)} km/${setWord}`} color={accent.hex} />
        <GpsKpi T={T} label="Max speed" value={session.topSpeed.toFixed(1)} sub="km/h" color={RED} />
        <GpsKpi T={T} label="Sprint count" value={session.sprintCount} sub="this session" color={AMBER} />
        <GpsKpi T={T} label="Load score" value={`${session.load} / 100`} sub={`ACWR ${session.acwr.toFixed(2)}`} color={session.load > 80 ? RED : session.load > 60 ? AMBER : T.good} />
        <GpsKpi T={T} label="Recovery" value={session.recovery} sub="between points" color={recoveryColor(T, session.recovery)} />
        <GpsKpi T={T} label="Court coverage" value={`${session.coverage}%`} sub="of own half" color={accent.hex} />
      </div>

      {/* 1 · Distance & Movement */}
      <GpsSectionHead T={T} accent={accent} density={density} n={1} title="Distance & Movement" sub="Per-set/block and by phase of play." />
      <div className="cm-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: density.gap }}>
        <GpsCard T={T} accent={accent} density={density} title={`Distance by ${setWord === 'block' ? 'Set / Block' : 'Day'}`} sub={`Total ${totalDistance.toFixed(1)} km · avg ${avgPerSet.toFixed(1)} km/${setWord}`}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 112 }}>
            {session.distanceBySet.map(s => (
              <div key={s.set} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: accent.hex }}>{s.km} km</div>
                <div style={{ width: '100%', borderRadius: '4px 4px 0 0', height: `${(s.km / maxSetKm) * 100}%`, minHeight: 8, background: `linear-gradient(180deg, ${accent.hex}, ${accent.hex}40)` }} />
                <div style={{ fontSize: 10, color: T.text3 }}>{s.set}</div>
                <div style={{ fontSize: 10, color: T.text4 }}>Load {s.load}</div>
              </div>
            ))}
          </div>
        </GpsCard>

        <GpsCard T={T} accent={accent} density={density} title="Distance by Phase" sub="What the player was doing when covering ground.">
          <div style={{ display: 'flex', height: 24, borderRadius: 6, overflow: 'hidden', marginBottom: 12 }}>
            {data.distanceByPhase.map(p => (
              <div key={p.phase} title={`${p.phase} ${((p.km / phaseTotal) * 100).toFixed(0)}%`} style={{ width: `${(p.km / phaseTotal) * 100}%`, background: p.c }} />
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.distanceByPhase.map(p => (
              <div key={p.phase} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: p.c }} />
                <span style={{ flex: 1, color: T.text2 }}>{p.phase}</span>
                <span style={{ fontWeight: 700, color: T.text }}>{p.km.toFixed(1)} km</span>
                <span style={{ color: T.text3 }}>{((p.km / phaseTotal) * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </GpsCard>
      </div>

      {/* 2 · Speed & Sprint */}
      <GpsSectionHead T={T} accent={accent} density={density} n={2} title="Speed & Sprint" sub="Time-in-zone, sprint count, and peak speed." />
      <GpsCard T={T} accent={accent} density={density} title="Speed Zone Breakdown" sub="Time spent in each speed band">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.speedZones.map(z => (
            <div key={z.zone} style={{ display: 'grid', gridTemplateColumns: '160px 1fr auto auto', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 11.5, color: T.text2 }}>{z.zone}</span>
              <div style={{ height: 14, borderRadius: 4, overflow: 'hidden', background: T.hover }}>
                <div style={{ height: 14, borderRadius: 4, width: `${Math.min(100, z.pct * 2.4)}%`, background: z.c, opacity: 0.85 }} />
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 700, width: 40, textAlign: 'right', color: z.c }}>{z.pct}%</span>
              <span style={{ fontSize: 10, fontFamily: FONT_MONO, width: 52, textAlign: 'right', color: T.text3 }}>{z.time}</span>
            </div>
          ))}
        </div>
      </GpsCard>

      <div className="cm-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: density.gap }}>
        <GpsCard T={T} accent={accent} density={density} title="Sprints" sub="Sprint count per set/block — pacing across the session">
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 112 }}>
            {session.sprintsPerSet.map(s => (
              <div key={s.set} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: AMBER }}>{s.n}</div>
                <div style={{ width: '100%', borderRadius: '4px 4px 0 0', height: `${(s.n / maxSprint) * 100}%`, minHeight: 8, background: `linear-gradient(180deg, ${AMBER}, ${AMBER}30)` }} />
                <div style={{ fontSize: 10, color: T.text3 }}>{s.set}</div>
              </div>
            ))}
          </div>
        </GpsCard>

        <GpsCard T={T} accent={accent} density={density} title="Top Speed" sub="Did peak speed hold, or drop late?">
          <GpsLineChart T={T} values={session.topSpeedPerSet.map(s => s.kmh)} labels={session.topSpeedPerSet.map(s => s.set)} max={32} min={16} valueFormat={v => v.toFixed(1)} colour={RED} height={150} width={400} />
          <div style={{ fontSize: 10, marginTop: 4, textAlign: 'center', color: T.text3 }}>
            Peak speed {firstSpeed >= lastSpeed ? 'dropped' : 'rose'} {Math.abs(firstSpeed - lastSpeed).toFixed(1)} km/h across the session{firstSpeed - lastSpeed > 2 ? ' — fatigue indicator' : ''}
          </div>
        </GpsCard>
      </div>

      {/* 3 · Heart Rate & Intensity */}
      <GpsSectionHead T={T} accent={accent} density={density} n={3} title="Heart Rate & Intensity" sub="Where effort was spent and how hard the player worked." />
      <GpsCard T={T} accent={accent} density={density} title="Heart Rate Zones" sub="Time-in-zone across the session">
        <div style={{ display: 'flex', height: 24, borderRadius: 6, overflow: 'hidden', marginBottom: 12 }}>
          {data.hrZones.map(z => <div key={z.zone} title={`${z.zone} ${z.pct}%`} style={{ width: `${z.pct}%`, background: z.color }} />)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {data.hrZones.map(z => (
            <div key={z.zone} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: z.color }} />
              <span style={{ flex: 1, color: T.text2 }}>{z.zone}</span>
              <span style={{ fontWeight: 700, color: z.color }}>{z.pct}%</span>
            </div>
          ))}
        </div>
      </GpsCard>

      <div className="cm-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: density.gap }}>
        <GpsCard T={T} accent={accent} density={density} title="HR by Set / Block" sub="Average HR — did intensity build?">
          <GpsLineChart T={T} values={session.hrBySet.map(s => s.avg)} labels={session.hrBySet.map(s => s.set)} max={180} min={120} valueFormat={v => `${v}`} colour={PURPLE} height={150} width={400} />
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${session.hrBySet.length}, 1fr)`, gap: 8, marginTop: 8 }}>
            {session.hrBySet.map(s => (
              <div key={s.set} style={{ borderRadius: 8, padding: 8, textAlign: 'center', background: T.panel2, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 9, color: T.text3 }}>{s.set}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: PURPLE }}>{s.avg}</div>
                <div style={{ fontSize: 9, color: T.text3 }}>peak {s.peak}</div>
              </div>
            ))}
          </div>
        </GpsCard>

        <GpsCard T={T} accent={accent} density={density} title="Start → Finish Drop-Off" sub="% change across the session — ideal: minimal drop">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { metric: 'Distance', s1: session.distanceBySet[0]?.km ?? 0, s3: session.distanceBySet[session.distanceBySet.length - 1]?.km ?? 0, unit: 'km' },
              { metric: 'Sprints', s1: session.sprintsPerSet[0]?.n ?? 0, s3: session.sprintsPerSet[session.sprintsPerSet.length - 1]?.n ?? 0, unit: '' },
              { metric: 'Top speed', s1: firstSpeed, s3: lastSpeed, unit: 'km/h' },
              { metric: 'HR avg', s1: session.hrBySet[0]?.avg ?? 0, s3: session.hrBySet[session.hrBySet.length - 1]?.avg ?? 0, unit: 'bpm', invert: true },
            ].map(m => {
              const delta = m.s1 ? ((m.s3 - m.s1) / m.s1) * 100 : 0
              const good = m.invert ? delta < 5 : delta > -25
              return (
                <div key={m.metric} style={{ borderRadius: 8, padding: 10, background: T.panel2, border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.metric}</div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 4 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{m.s1}{m.unit && ` ${m.unit}`}</div>
                      <div style={{ fontSize: 10, color: T.text3 }}>→ {m.s3}{m.unit && ` ${m.unit}`}</div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: good ? T.good : T.bad }}>{delta > 0 ? '+' : ''}{delta.toFixed(0)}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </GpsCard>
      </div>
    </div>
  )
}

function AiBriefPanel({ T, accent, session }: { T: ThemeTokens; accent: AccentTokens; session: GpsSession }) {
  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderLeft: `4px solid ${accent.hex}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="sparkles" size={14} stroke={1.6} style={{ color: accent.hex }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>AI Coaching Brief — GPS + Lumio Vision</span>
        </div>
        <span style={{ fontSize: 10, color: T.text3 }}>Generated: just now</span>
      </div>
      <div style={{ padding: '14px 16px', fontSize: 13, lineHeight: 1.6, color: T.text2, whiteSpace: 'pre-wrap' }}>{session.brief}</div>
    </div>
  )
}

type Tab = 'gps' | 'brief' | 'movement' | 'fitness' | 'comparison' | 'training'

// ─── Main view ───────────────────────────────────────────────────────────────
export function HeatmapsView({ T, accent, density }: Common) {
  const firstWithData = PLAYERS.find(p => GPS_VIDEO_DATA[p.id])?.id ?? PLAYERS[0].id
  const [playerId, setPlayerId] = useState(firstWithData)

  const data = GPS_VIDEO_DATA[playerId]
  const allSessions = (data?.sessions ?? []).slice().sort((a, b) => b.date.localeCompare(a.date))

  const catOf = (s: GpsSession) => (s.type === 'Camp' ? 'camp' : 'coaching')
  const [typeFilter, setTypeFilter] = useState<'all' | 'coaching' | 'camp'>('all')
  const sessions = typeFilter === 'all' ? allSessions : allSessions.filter(s => catOf(s) === typeFilter)

  const [matchId, setMatchId] = useState(allSessions[0]?.id ?? '')
  const [setSel, setSetSel] = useState<'full' | 'set1' | 'set2' | 'set3'>('full')
  const [doublesView, setDoublesView] = useState(false)
  const [movementMode, setMovementMode] = useState<'serve' | 'return' | 'rally' | 'net'>('rally')
  const [trainingIdx, setTrainingIdx] = useState(0)
  const [compareA, setCompareA] = useState(0)
  const [compareB, setCompareB] = useState(1)
  const [tab, setTab] = useState<Tab>('gps')

  const player = PLAYERS.find(p => p.id === playerId)
  const session = sessions.find(s => s.id === matchId) ?? sessions[0]
  const hasSets = session?.type === 'Match'   // only matches carry Set 1/2/3

  const onPlayer = (id: string) => {
    setPlayerId(id)
    const ns = (GPS_VIDEO_DATA[id]?.sessions ?? []).slice().sort((a, b) => b.date.localeCompare(a.date))
    const filtered = typeFilter === 'all' ? ns : ns.filter(s => catOf(s) === typeFilter)
    setMatchId((filtered[0] ?? ns[0])?.id ?? '')
    setCompareA(0)
    setCompareB(Math.min(1, ns.length - 1))
  }

  const onTypeFilter = (f: 'all' | 'coaching' | 'camp') => {
    setTypeFilter(f)
    const filtered = f === 'all' ? allSessions : allSessions.filter(s => catOf(s) === f)
    setMatchId(filtered[0]?.id ?? '')
    if (f === 'camp') setSetSel('full')
  }

  const selectStyle: CSSProperties = {
    appearance: 'none', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 9,
    color: T.text, fontSize: 13, padding: '9px 30px 9px 12px', fontFamily: FONT, outline: 'none', cursor: 'pointer', width: '100%',
    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(T.text3)}' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
  }
  const labelStyle: CSSProperties = { fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 4, display: 'block' }
  const seg = (on: boolean): CSSProperties => ({
    flex: 1, appearance: 'none', cursor: 'pointer', padding: '8px 8px', borderRadius: 8, fontSize: 11, fontWeight: 600,
    border: `1px solid ${on ? accent.border : T.border}`, background: on ? accent.dim : T.panel2, color: on ? accent.hex : T.text2,
  })

  const HCard = ({ title, sub, children }: { title?: string; sub?: string; children: ReactNode }) => (
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
  // Each heatmap section is its own tab — render only the active one.
  const Section = ({ id, n, title, sub, children }: { id: Tab; n: number; title: string; sub?: string; children: ReactNode }) => (
    tab !== id ? null : (
    <section style={{ display: 'flex', flexDirection: 'column', gap: density.gap }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: accent.hex }}>{n} · {title}</h2>
          {sub && <p style={{ margin: '2px 0 0', fontSize: 11, color: T.text3 }}>{sub}</p>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: T.text3 }}>
          <span style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>Heat scale</span>
          <HeatLegend T={T} />
          <span>low → high</span>
        </div>
      </div>
      {children}
    </section>
    )
  )
  const StatTile = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
    <div style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div className="tnum" style={{ fontSize: 24, fontWeight: 800, color: T.text, marginTop: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>{sub}</div>}
    </div>
  )

  const CW = 600, CH = 1100
  const matchOpt = (s: GpsSession) => `${s.date} · ${s.label}`

  const pickers = (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
      <div style={{ minWidth: 200 }}>
        <label style={labelStyle}>Player</label>
        <select style={selectStyle} value={playerId} onChange={e => onPlayer(e.target.value)}>
          {PLAYERS.map(p => <option key={p.id} value={p.id}>{p.name}{GPS_VIDEO_DATA[p.id] ? '' : ' — no data'}</option>)}
        </select>
      </div>
      <div style={{ minWidth: 260 }}>
        <label style={labelStyle}>Session</label>
        <select style={selectStyle} value={session?.id ?? ''} onChange={e => setMatchId(e.target.value)} disabled={sessions.length === 0}>
          {sessions.length === 0 && <option>—</option>}
          {sessions.map(s => <option key={s.id} value={s.id}>{matchOpt(s)}</option>)}
        </select>
      </div>
    </div>
  )

  const header = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center', background: accent.dim }}>
          <Icon name="flame" size={20} stroke={1.7} style={{ color: accent.hex }} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontFamily: FONT, fontSize: 24, fontWeight: 600, color: T.text, letterSpacing: '-0.02em' }}>GPS &amp; Heatmaps</h1>
          <p style={{ margin: '4px 0 0', fontSize: 12.5, color: T.text3 }}>Movement load, court coverage and GPS stats — per player, by session.</p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 9px', borderRadius: 999, background: accent.dim, color: accent.hex, border: `1px solid ${accent.border}` }}>10Hz GPS · Lumio Tracker</span>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 9px', borderRadius: 999, background: 'rgba(34,197,94,0.12)', color: T.good, border: `1px solid ${T.good}` }}>Synced 8 min ago</span>
      </div>
    </div>
  )

  if (!session || !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: density.gap }}>
        {header}
        {pickers}
        <div style={{ background: T.panel, border: `1px dashed ${T.border}`, borderRadius: density.radius, padding: '40px 20px', textAlign: 'center' }}>
          <Icon name="flame" size={26} stroke={1.4} style={{ color: T.text3 }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginTop: 10 }}>No {typeFilter === 'camp' ? 'camp ' : ''}session data for {player?.name ?? 'this player'} yet</div>
          <div style={{ fontSize: 12, color: T.text3, marginTop: 4 }}>Sessions appear once this player has trained or played with Lumio GPS Tracker + Lumio Vision.</div>
        </div>
      </div>
    )
  }

  // ─── derived headline numbers for the Court Movement section ───────────────
  const seed = `${playerId}-${session.id}-${setSel}`
  const pick = (key: string, salt: number, lo: number, hi: number) => lo + tennisHash(`${playerId}-${session.id}-${key}`, salt) * (hi - lo)
  const baselinePct = Math.round(session.courtZones.slice(0, 3).reduce((a, z) => a + z.pct, 0))
  const netPct = Math.round(session.courtZones.slice(3).reduce((a, z) => a + z.pct, 0))
  const netApproaches = Math.max(2, Math.round(netPct * 0.9))
  const netWonPct = Math.round(pick('netwon', 3, 58, 76))
  const lateral = (2 + session.distance * 0.3).toFixed(1)
  const movementAnchors = movementMode === 'rally'
    ? TENNIS_RALLY_ANCHORS
    : movementMode === 'net'
    ? TENNIS_NET_APPROACH_ANCHORS
    : movementMode === 'serve'
    ? [{ x: 0.5, y: 0.92, weight: 1 }, { x: 0.32, y: 0.92, weight: 0.7 }, { x: 0.68, y: 0.92, weight: 0.7 }]
    : TENNIS_RECOVERY_ANCHORS

  const matchSeed = `${playerId}-${session.id}-${setSel}`
  const periodLabel = setSel === 'full' ? 'Full session' : setSel.replace('set', 'Set ')

  const tabs: [Tab, string][] = [
    ['gps', 'GPS Stats'], ['brief', 'AI Brief'],
    ['movement', '1 · Court Movement'], ['fitness', '2 · Movement & Fitness'],
    ['comparison', '3 · Comparison'], ['training', '4 · Training'],
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: density.gap * 1.4 }}>
      {header}

      {/* Pickers + two-control selector */}
      <HCard>
        <div style={{ marginBottom: 12 }}>{pickers}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <div>
            <label style={labelStyle}>Session type</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {([['all', 'All'], ['coaching', 'Coaching'], ['camp', 'Camp']] as [typeof typeFilter, string][]).map(([v, lbl]) => (
                <button key={v} onClick={() => onTypeFilter(v)} style={seg(typeFilter === v)}>{lbl}</button>
              ))}
            </div>
          </div>
          {hasSets && (
            <div>
              <label style={labelStyle}>Period</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['full', 'set1', 'set2', 'set3'] as const).map(s => (
                  <button key={s} onClick={() => setSetSel(s)} style={seg(setSel === s)}>{s === 'full' ? 'Full' : s.replace('set', 'Set ')}</button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label style={labelStyle}>Court</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {([['Singles', false], ['Doubles', true]] as const).map(([lbl, val]) => (
                <button key={lbl} onClick={() => setDoublesView(val)} style={seg(doublesView === val)}>{lbl}</button>
              ))}
            </div>
          </div>
        </div>
      </HCard>

      {/* tab bar */}
      <div style={{ display: 'flex', gap: 4, padding: 3, background: T.hover, borderRadius: 9, width: 'fit-content', flexWrap: 'wrap' }}>
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ appearance: 'none', border: tab === id ? `1px solid ${accent.border}` : '1px solid transparent', padding: '6px 14px', borderRadius: 7, fontSize: 12, cursor: 'pointer', background: tab === id ? accent.dim : 'transparent', color: tab === id ? accent.hex : T.text2, fontWeight: tab === id ? 600 : 400 }}>
            {label}
          </button>
        ))}
      </div>

      {/* GPS STATS (folded in from the old GPS & Video view) */}
      {tab === 'gps' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: density.gap }}>
          <GpsCard T={T} accent={accent} density={density} title="Selected Session">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 14 }}>
              {[
                ['Date', `${session.date}`],
                ['Type', `${session.type} · ${session.surface}`],
                ['Duration', `${session.duration} min`],
                ['Coverage', `${session.distance.toFixed(1)} km · Load ${session.load}`],
                ['Clips', `${session.clips.length} tagged`],
              ].map(([l, v]) => (
                <div key={l}>
                  <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginTop: 3 }}>{v}</div>
                </div>
              ))}
            </div>
          </GpsCard>
          <GpsStatsPanel T={T} accent={accent} density={density} session={session} data={data} />
          <GpsCard T={T} accent={accent} density={density} title="Session History" sub={`${player?.name ?? ''} · recent tracked sessions`}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ color: T.text3, borderBottom: `1px solid ${T.border}` }}>
                    {['Date', 'Surface', 'Coverage', 'Load', 'Top speed', 'Outcome'].map((h, i) => (
                      <th key={h} style={{ textAlign: i > 1 ? 'right' : 'left', padding: '6px 8px', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.history.map((r, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '7px 8px', color: T.text2 }}>{r.date}</td>
                      <td style={{ padding: '7px 8px', color: T.text3 }}>{r.surface}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', color: T.text, fontWeight: 600 }}>{r.coverage}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', color: r.load > 80 ? T.bad : r.load > 60 ? T.warn : T.good }}>{r.load}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', color: T.text2 }}>{r.speed}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'right', color: r.win === true ? T.good : r.win === false ? T.bad : T.text3 }}>{r.outcome}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GpsCard>
        </div>
      )}

      {/* AI BRIEF */}
      {tab === 'brief' && <AiBriefPanel T={T} accent={accent} session={session} />}

      {/* 1 · COURT MOVEMENT */}
      <Section id="movement" n={1} title="Court Movement Heatmap" sub="Where the player held position, by phase. Toggle serve, return, rally, and net approach.">
        <HCard>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(['rally', 'serve', 'return', 'net'] as const).map(m => (
                <button key={m} onClick={() => setMovementMode(m)} style={{ ...seg(movementMode === m), flex: 'none', padding: '6px 12px' }}>
                  {m === 'serve' ? 'Serve positions' : m === 'return' ? 'Return positions' : m === 'rally' ? 'Rally movement' : 'Net approach'}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 10, color: T.text3 }}>{session.label} · {hasSets ? periodLabel : 'Full session'}</div>
          </div>
          <div className="cm-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: density.gap }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ maxWidth: 360, width: '100%' }}>
                <CourtPositionalHeatmap width={CW} height={CH} seed={`${seed}-${movementMode}`} doubles={doublesView} anchors={movementAnchors} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <StatTile label="Distance covered" value={`${session.distance.toFixed(1)} km`} sub={`${session.surface} · ${session.type.toLowerCase()}`} />
              <StatTile label="Time on baseline" value={`${baselinePct}%`} sub="Behind near baseline" />
              <StatTile label="Net approaches" value={`${netApproaches}`} sub={`${netWonPct}% won at net`} />
              <StatTile label="Lateral coverage" value={`±${lateral} m`} sub="From centre · rally width" />
            </div>
          </div>
        </HCard>
      </Section>

      {/* 2 · MOVEMENT & FITNESS — spatial maps only (analytics live in GPS Stats) */}
      <Section id="fitness" n={2} title="Movement &amp; Fitness Heatmap" sub="Court coverage, sprint pattern, and recovery position. (Distance/speed analytics are in the GPS Stats tab.)">
        <div className="cm-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: density.gap }}>
          <HCard title="Court Coverage (12 zones)" sub="% time spent in each of 12 zones on the player's half">
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ maxWidth: 360, width: '100%' }}><CourtCoverageGrid width={CW} height={CH} seed={`${matchSeed}-cov`} /></div>
            </div>
          </HCard>
          <HCard title="Sprint Initiation Map" sub="Where sprints started · colour = peak speed reached">
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ maxWidth: 300, width: '100%' }}><SprintInitiationMap width={CW} height={CH} seed={`${matchSeed}-sp`} /></div>
            </div>
          </HCard>
        </div>
        <HCard title="Recovery Position Heatmap" sub="Where the player returned to between points — ideal centre is just behind baseline">
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ maxWidth: 360, width: '100%' }}><CourtPositionalHeatmap width={CW} height={CH} seed={`${matchSeed}-recovery`} anchors={TENNIS_RECOVERY_ANCHORS} intensity={0.95} /></div>
          </div>
        </HCard>
      </Section>

      {/* 3 · SESSION-BY-SESSION COMPARISON */}
      <Section id="comparison" n={3} title="Session-by-Session Comparison" sub="Compare two of this player's sessions, season trend, and movement by surface.">
        <HCard title="Side-by-Side Court Heatmaps">
          <div className="cm-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <select style={selectStyle} value={compareA} onChange={e => setCompareA(Number(e.target.value))}>
              {allSessions.map((s, i) => <option key={s.id} value={i}>{matchOpt(s)}</option>)}
            </select>
            <select style={selectStyle} value={compareB} onChange={e => setCompareB(Number(e.target.value))}>
              {allSessions.map((s, i) => <option key={s.id} value={i}>{matchOpt(s)}</option>)}
            </select>
          </div>
          <div className="cm-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: density.gap }}>
            {[compareA, compareB].map((mIdx, slot) => {
              const cs = allSessions[mIdx]
              return (
                <div key={slot}>
                  <div style={{ fontSize: 11, color: T.text3, marginBottom: 4 }}>{cs ? matchOpt(cs) : '—'}</div>
                  <CourtPositionalHeatmap width={CW} height={CH} seed={`compare-${playerId}-${cs?.id ?? mIdx}-${slot}`}
                    anchors={mIdx % 2 === 0 ? TENNIS_RALLY_ANCHORS : [
                      { x: 0.5, y: 0.86, weight: 0.95 }, { x: 0.4, y: 0.78, weight: 0.65 }, { x: 0.6, y: 0.78, weight: 0.65 },
                    ]} />
                </div>
              )
            })}
          </div>
        </HCard>

        <HCard title="Rolling Coverage Trend" sub="Last 12 sessions · colour = relative coverage (km) · by surface">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 6, color: T.text3, fontWeight: 600 }}>Surface</th>
                  {Array.from({ length: 12 }).map((_, i) => <th key={i} style={{ padding: 6, color: T.text3, fontWeight: 600 }}>S{i + 1}</th>)}
                  <th style={{ padding: 6, color: T.text2, fontWeight: 600 }}>Avg</th>
                </tr>
              </thead>
              <tbody>
                {SURFACES.map(s => {
                  const cells = Array.from({ length: 12 }, (_, i) => {
                    const baseline = s.name === 'Clay' ? 0.7 : s.name === 'Grass' ? 0.4 : 0.55
                    return baseline + tennisHash(`${playerId}-${s.name}-rolling-${i}`, 109) * 0.3
                  })
                  const avg = cells.reduce((a, b) => a + b, 0) / cells.length
                  return (
                    <tr key={s.name} style={{ borderTop: `1px solid ${T.border}` }}>
                      <td style={{ padding: 6, color: T.text, whiteSpace: 'nowrap' }}>{s.emoji} {s.name}</td>
                      {cells.map((t, i) => (
                        <td key={i} style={{ padding: 2 }}>
                          <div style={{ borderRadius: 4, textAlign: 'center', fontWeight: 700, color: 'white', background: tennisHeatColor(t), opacity: 0.45 + t * 0.5, padding: '6px 0', minWidth: 26, fontSize: 10 }}>{(t * 5).toFixed(1)}</div>
                        </td>
                      ))}
                      <td style={{ padding: 2 }}>
                        <div style={{ borderRadius: 4, textAlign: 'center', fontWeight: 700, color: 'white', background: tennisHeatColor(avg), opacity: 0.6 + avg * 0.4, padding: '6px 0', minWidth: 34, fontSize: 10, border: '1px solid rgba(255,255,255,0.2)' }}>{(avg * 5).toFixed(1)}km</div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </HCard>

        <HCard title="Surface Comparison Heatmap" sub="How the player's movement footprint changes by surface">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {SURFACES.map(s => {
              const anchors = s.name === 'Clay' ? TENNIS_RALLY_ANCHORS
                : s.name === 'Grass' ? [{ x: 0.5, y: 0.7, weight: 0.95 }, { x: 0.42, y: 0.62, weight: 0.7 }, { x: 0.58, y: 0.62, weight: 0.7 }]
                : [{ x: 0.5, y: 0.82, weight: 0.95 }, { x: 0.36, y: 0.78, weight: 0.7 }, { x: 0.64, y: 0.78, weight: 0.7 }, { x: 0.5, y: 0.62, weight: 0.4 }]
              return (
                <div key={s.name}>
                  <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4, color: s.color }}>{s.emoji} {s.name}</div>
                  <CourtPositionalHeatmap width={CW} height={CH} seed={`surface-${playerId}-${s.name}`} anchors={anchors} intensity={0.9} />
                  <div style={{ fontSize: 10, color: T.text3, marginTop: 4, textAlign: 'center' }}>
                    {s.name === 'Clay' && 'Deepest baseline position · longest rallies'}
                    {s.name === 'Grass' && 'Forward platform · more net approach'}
                    {s.name === 'Hard' && 'Balanced — moves wider than clay'}
                  </div>
                </div>
              )
            })}
          </div>
        </HCard>
      </Section>

      {/* 4 · TRAINING SESSION */}
      <Section id="training" n={4} title="Training Session Heatmap" sub="Drill placement, footwork intensity, and weekly load microcycle.">
        <div style={{ maxWidth: 360 }}>
          <label style={labelStyle}>Training block</label>
          <select style={selectStyle} value={trainingIdx} onChange={e => setTrainingIdx(Number(e.target.value))}>
            {TRAINING_SESSIONS.map((t, i) => <option key={t} value={i}>{t}</option>)}
          </select>
        </div>
        <div className="cm-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: density.gap }}>
          <HCard title="Drill Zone Heatmap" sub={`${TRAINING_SESSIONS[trainingIdx]} — drill density on court`}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ maxWidth: 360, width: '100%' }}>
                <CourtPositionalHeatmap width={CW} height={CH} seed={`drill-${playerId}-${trainingIdx}`}
                  anchors={trainingIdx === 0
                    ? [{ x: 0.5, y: 0.78, weight: 0.95 }, { x: 0.32, y: 0.78, weight: 0.85 }, { x: 0.68, y: 0.78, weight: 0.85 }]
                    : trainingIdx === 1
                    ? [{ x: 0.18, y: 0.82, weight: 0.9 }, { x: 0.82, y: 0.82, weight: 0.9 }, { x: 0.5, y: 0.82, weight: 0.4 }]
                    : trainingIdx === 2
                    ? TENNIS_RALLY_ANCHORS
                    : [{ x: 0.5, y: 0.84, weight: 0.6 }, { x: 0.5, y: 0.62, weight: 0.4 }]} />
              </div>
            </div>
          </HCard>
          <HCard title="Footwork Intensity Overlay" sub="High-intensity footwork density — accelerations + cuts">
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ maxWidth: 360, width: '100%' }}>
                <CourtPositionalHeatmap width={CW} height={CH} seed={`footwork-${playerId}-${trainingIdx}`}
                  anchors={[{ x: 0.32, y: 0.84, weight: 0.95 }, { x: 0.68, y: 0.84, weight: 0.95 }, { x: 0.18, y: 0.78, weight: 0.65 }, { x: 0.82, y: 0.78, weight: 0.65 }]} intensity={0.92} />
              </div>
            </div>
          </HCard>
        </div>
        <HCard title="Weekly Load Calendar" sub="7-day microcycle · match-day Saturday">
          <WeeklyLoadCalendar T={T} />
        </HCard>
      </Section>

      <div style={{ fontSize: 10, color: T.text4, textAlign: 'center', paddingTop: 4 }}>
        GPS data from Lumio GPS Tracker · 10Hz sampling · Lumio Vision shot-tracking · Demo data shown
      </div>
    </div>
  )
}
