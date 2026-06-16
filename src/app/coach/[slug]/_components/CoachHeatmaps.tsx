'use client'

// ─── Coach portal — Heatmaps ─────────────────────────────────────────────────
// Ported from the tennis PLAYER portal's TennisGPSHeatmapsView. The SVG suite
// (court, positional heatmap, serve placement, return/winner/error maps, 12-zone
// coverage grid, sprint map, per-set bars, speed zones, weekly load) is copied
// VERBATIM in geometry — only colours and wrapping card styles are swapped onto
// the coach portal's T/accent/density tokens (no Tailwind, no #0d1117, no
// tennis-brand localStorage). Wired to the coach's per-player data
// (gps-video-data.ts): a player picker + the player's sessions drive the maps
// and the headline stat numbers. Demo only — procedural/canned, no devices.

import { useState, type CSSProperties, type ReactNode } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { PLAYERS } from '../_lib/coach-data'
import { GPS_VIDEO_DATA, type GpsSession } from '../_lib/gps-video-data'

type Common = { T: ThemeTokens; accent: AccentTokens; density: Density }

const AMBER = '#F59E0B'        // serve-dot / 2nd-serve accent (kept — not brand)
const COURT_GREEN = '#0a3d1a'  // court surface — a court colour, not a brand hue

// ─── Foundational helpers (copied verbatim from the source) ──────────────────

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

// Player position anchors for movement / recovery / drill density.
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

// Academy training blocks (generic — not pro tour).
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

// Court positional heatmap — movement / recovery / drill / footwork / surface.
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

function ServePlacementMap({
  width, height, seed, side, serveType, accentHex,
}: {
  width: number; height: number; seed: string; side: 'deuce' | 'ad'; serveType: 'first' | 'second'; accentHex: string
}) {
  const xLo = side === 'deuce' ? 0.5 : 0.0
  const xHi = side === 'deuce' ? 1.0 : 0.5
  const yLo = 0.0
  const yHi = 0.31
  const count = serveType === 'first' ? 22 : 14
  const dots = Array.from({ length: count }, (_, i) => {
    const fx = xLo + tennisHash(`${seed}-${side}-${serveType}-${i}-x`, 11) * (xHi - xLo)
    const fy = yLo + tennisHash(`${seed}-${side}-${serveType}-${i}-y`, 13) * (yHi - yLo)
    const tier = tennisHash(`${seed}-${side}-${serveType}-${i}-t`, 17)
    let x = fx, y = fy
    if (serveType === 'first') {
      if (tier < 0.4) {
        x = side === 'deuce' ? xHi - 0.06 - tier * 0.06 : xLo + 0.06 + tier * 0.06
      } else if (tier > 0.65) {
        x = (xLo + xHi) / 2 + (tier - 0.65) * 0.05
      }
    } else {
      x = (xLo + xHi) / 2 + (tier - 0.5) * 0.18
    }
    return {
      x: x * width,
      y: y * height,
      r: serveType === 'first' ? 5 + tennisHash(`${seed}-r-${i}`, 19) * 2.5 : 4 + tennisHash(`${seed}-r-${i}`, 19) * 1.5,
    }
  })
  const zoneW = (xHi - xLo) / 3
  const zones = [
    { key: side === 'deuce' ? 'T' : 'Wide', xMin: xLo, label: side === 'deuce' ? 'T' : 'Wide', winPct: side === 'deuce' ? 78 : 71 },
    { key: 'Body', xMin: xLo + zoneW, label: 'Body', winPct: 62 },
    { key: side === 'deuce' ? 'Wide' : 'T', xMin: xLo + zoneW * 2, label: side === 'deuce' ? 'Wide' : 'T', winPct: side === 'deuce' ? 73 : 76 },
  ]
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ maxHeight: 360 }}>
      <TennisCourt width={width} height={height} />
      {zones.map(z => (
        <g key={z.key + z.label}>
          <rect x={z.xMin * width} y={yLo * height} width={zoneW * width} height={(yHi - yLo) * height}
            fill={tennisHeatColor(z.winPct / 100)} opacity={0.15} stroke="rgba(255,255,255,0.35)" strokeDasharray="4 3" />
          <text x={(z.xMin + zoneW / 2) * width} y={(yHi / 2 + 0.05) * height}
            fontSize={11} fontWeight={700} fill="white" textAnchor="middle" opacity={0.7}>{z.label}</text>
          <text x={(z.xMin + zoneW / 2) * width} y={(yHi / 2 + 0.13) * height}
            fontSize={14} fontWeight={800} fill={tennisHeatColor(z.winPct / 100)} textAnchor="middle">{z.winPct}%</text>
        </g>
      ))}
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r}
          fill={serveType === 'first' ? accentHex : AMBER}
          stroke="white" strokeOpacity={0.4} strokeWidth={0.6} opacity={0.85} />
      ))}
    </svg>
  )
}

function ReturnMap({ width, height, seed, accentHex }: { width: number; height: number; seed: string; accentHex: string }) {
  const dots = Array.from({ length: 30 }, (_, i) => ({
    x: (0.15 + tennisHash(`${seed}-rtn-${i}-x`, 23) * 0.7) * width,
    y: (0.78 + tennisHash(`${seed}-rtn-${i}-y`, 29) * 0.18) * height,
    aggression: tennisHash(`${seed}-rtn-${i}-a`, 31),
  }))
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ maxHeight: 360 }}>
      <TennisCourt width={width} height={height} />
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={4 + d.aggression * 4}
          fill={tennisHeatColor(d.aggression)} stroke={accentHex} strokeOpacity={0.4} strokeWidth={0.6} opacity={0.85} />
      ))}
    </svg>
  )
}

function WinnerErrorMap({ width, height, seed, mode }: {
  width: number; height: number; seed: string; mode: 'winners' | 'errors'
}) {
  const count = mode === 'winners' ? 18 : 22
  const dots = Array.from({ length: count }, (_, i) => {
    if (mode === 'winners') {
      const cluster = tennisHash(`${seed}-w-${i}-c`, 37)
      const x = cluster < 0.5
        ? 0.1 + tennisHash(`${seed}-w-${i}-x`, 41) * 0.15
        : 0.75 + tennisHash(`${seed}-w-${i}-x`, 41) * 0.15
      const y = 0.05 + tennisHash(`${seed}-w-${i}-y`, 43) * 0.4
      return { x: x * width, y: y * height, ok: true }
    }
    return {
      x: (0.05 + tennisHash(`${seed}-e-${i}-x`, 47) * 0.9) * width,
      y: (0.0 + tennisHash(`${seed}-e-${i}-y`, 53) * 0.5) * height,
      ok: false,
    }
  })
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ maxHeight: 360 }}>
      <TennisCourt width={width} height={height} />
      {dots.map((d, i) => (
        <g key={i}>
          {d.ok ? (
            <circle cx={d.x} cy={d.y} r={6} fill="#22C55E" stroke="white" strokeOpacity={0.5} strokeWidth={0.8} opacity={0.9} />
          ) : (
            <g transform={`translate(${d.x},${d.y})`}>
              <line x1={-5} y1={-5} x2={5} y2={5} stroke="#EF4444" strokeWidth={2.2} strokeLinecap="round" />
              <line x1={5} y1={-5} x2={-5} y2={5} stroke="#EF4444" strokeWidth={2.2} strokeLinecap="round" />
            </g>
          )}
        </g>
      ))}
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

// Per-set distance bars — wired to the selected session's distanceBySet.
function DistanceBySetBars({ T, sets }: { T: ThemeTokens; sets: { set: string; km: number; load: number }[] }) {
  const maxKm = Math.max(...sets.map(s => s.km), 1)
  const slotW = 700 / Math.max(sets.length, 1)
  return (
    <svg viewBox="0 0 700 260" width="100%" style={{ maxHeight: 280 }}>
      <rect width={700} height={260} fill={T.panel2} rx={6} />
      {sets.map((s, i) => {
        const intensity = Math.min(1, s.load / 45)
        const x = i * slotW + 30
        const barW = slotW - 60
        const barH = (s.km / (maxKm * 1.15)) * 180
        return (
          <g key={s.set}>
            <text x={x + barW / 2} y={20} textAnchor="middle" fontSize={12} fontWeight={700} fill={T.text}>{s.set}</text>
            <rect x={x} y={220 - barH} width={barW} height={barH} rx={6}
              fill={tennisHeatColor(intensity)} opacity={0.35 + intensity * 0.55} />
            <rect x={x} y={220 - barH} width={barW} height={barH} rx={6}
              fill="none" stroke={tennisHeatColor(intensity)} strokeOpacity={0.7} strokeWidth={1} />
            <text x={x + barW / 2} y={220 - barH - 8} textAnchor="middle" fontSize={20} fontWeight={800} fill={T.text}>{s.km.toFixed(1)} km</text>
            <text x={x + barW / 2} y={240} textAnchor="middle" fontSize={10} fill={T.text3}>load {s.load} · intensity {(intensity * 100).toFixed(0)}%</text>
          </g>
        )
      })}
    </svg>
  )
}

// Speed-zone bars — wired to the player's speed profile.
function SpeedZoneBars({ T, zones }: { T: ThemeTokens; zones: { zone: string; pct: number }[] }) {
  const W = 700, BAR_H = 28, GAP = 12
  const totalH = zones.length * (BAR_H + GAP) + 16
  const maxPct = Math.max(...zones.map(z => z.pct), 1)
  return (
    <svg viewBox={`0 0 ${W} ${totalH}`} width="100%" style={{ maxHeight: totalH + 8 }}>
      {zones.map((z, i) => {
        const y = 8 + i * (BAR_H + GAP)
        const barW = (z.pct / maxPct) * (W - 260)
        return (
          <g key={z.zone}>
            <text x={4} y={y + BAR_H / 2 + 4} fontSize={11} fontWeight={600} fill={T.text2}>{z.zone}</text>
            <rect x={200} y={y} width={W - 260} height={BAR_H} rx={4} fill={T.hover} />
            <rect x={200} y={y} width={barW} height={BAR_H} rx={4} fill={TENNIS_HEAT_STOPS[i]} opacity={0.85} />
            <text x={200 + barW + 8} y={y + BAR_H / 2 + 4} fontSize={11} fontWeight={700} fill={T.text}>{z.pct.toFixed(0)}%</text>
          </g>
        )
      })}
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

// ─── Main view ───────────────────────────────────────────────────────────────
export function HeatmapsView({ T, accent, density }: Common) {
  const firstWithData = PLAYERS.find(p => GPS_VIDEO_DATA[p.id])?.id ?? PLAYERS[0].id
  const [playerId, setPlayerId] = useState(firstWithData)

  const data = GPS_VIDEO_DATA[playerId]
  const sessions = data?.sessions ?? []

  const [matchId, setMatchId] = useState(sessions[0]?.id ?? '')
  const [setSel, setSetSel] = useState<'full' | 'set1' | 'set2' | 'set3'>('full')
  const [doublesView, setDoublesView] = useState(false)
  const [movementMode, setMovementMode] = useState<'serve' | 'return' | 'rally' | 'net'>('rally')
  const [serveSide, setServeSide] = useState<'deuce' | 'ad'>('deuce')
  const [serveType, setServeType] = useState<'first' | 'second'>('first')
  const [trainingIdx, setTrainingIdx] = useState(0)
  const [compareA, setCompareA] = useState(0)
  const [compareB, setCompareB] = useState(1)
  const [tab, setTab] = useState(1)   // active heatmap section (1–6); player/session pickers stay above it

  const player = PLAYERS.find(p => p.id === playerId)
  const session = sessions.find(s => s.id === matchId) ?? sessions[0]

  const onPlayer = (id: string) => {
    setPlayerId(id)
    const ns = GPS_VIDEO_DATA[id]?.sessions ?? []
    setMatchId(ns[0]?.id ?? '')
    setCompareA(0)
    setCompareB(Math.min(1, ns.length - 1))
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
  // Each section is its own tab — render only the active one. (The pickers and
  // set/court controls live above the tab bar, so they apply to whichever tab is open.)
  const Section = ({ n, title, sub, children }: { n: number; title: string; sub?: string; children: ReactNode }) => (
    tab !== n ? null : (
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

  // Player + session pickers always visible.
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
        <select style={selectStyle} value={matchId} onChange={e => setMatchId(e.target.value)} disabled={sessions.length === 0}>
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
          <h1 style={{ margin: 0, fontFamily: FONT, fontSize: 24, fontWeight: 600, color: T.text, letterSpacing: '-0.02em' }}>Heatmaps</h1>
          <p style={{ margin: '4px 0 0', fontSize: 12.5, color: T.text3 }}>Court coverage, serve placement, return &amp; rally — per player, by session and surface.</p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 9px', borderRadius: 999, background: accent.dim, color: accent.hex, border: `1px solid ${accent.border}` }}>10Hz GPS · Lumio Vision</span>
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
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginTop: 10 }}>No session data logged for {player?.name ?? 'this player'} yet</div>
          <div style={{ fontSize: 12, color: T.text3, marginTop: 4 }}>Heatmaps appear once this player has trained or played with Lumio GPS Tracker + Lumio Vision.</div>
        </div>
      </div>
    )
  }

  // ─── derived, per-player headline numbers ─────────────────────────────────
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

  // Academy-appropriate serve speeds (NOT pro tour), scaled by group + age.
  const serveBase = player?.group === 'Performance' ? 130 : player?.group === 'Adult' ? 115 : 90
  const ageAdj = ((player?.age ?? 10) - 10) * 2
  const firstSpeed = Math.round(serveBase + ageAdj + pick('srv', 5, 0, 10))
  const secondSpeed = Math.round(firstSpeed * 0.74)
  const firstInPct = Math.round(pick('fin', 7, 58, 70))
  const secondInPct = Math.round(pick('sin', 11, 88, 95))
  const aces = Math.max(0, Math.round(session.sprintCount / 16))
  const dfs = 1 + Math.round(pick('df', 13, 0, 2))
  const wideTSplit = Math.round(pick('wts', 17, 46, 58))

  // rally-length splits (vary per player/session)
  const rShort = Math.round(pick('rshort', 19, 38, 48))
  const rMid = Math.round(pick('rmid', 23, 32, 40))
  const rLong = Math.max(8, 100 - rShort - rMid)

  const matchSeed = `${playerId}-${session.id}-${setSel}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: density.gap * 1.6 }}>
      {header}

      {/* Player + match/set/court controls */}
      <HCard>
        <div style={{ marginBottom: 12 }}>{pickers}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <div>
            <label style={labelStyle}>Set</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['full', 'set1', 'set2', 'set3'] as const).map(s => (
                <button key={s} onClick={() => setSetSel(s)} style={seg(setSel === s)}>{s === 'full' ? 'Full' : s.replace('set', 'Set ')}</button>
              ))}
            </div>
          </div>
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

      {/* section tabs — each heatmap section is its own screen */}
      <div style={{ display: 'flex', gap: 4, padding: 3, background: T.hover, borderRadius: 9, width: 'fit-content', flexWrap: 'wrap' }}>
        {([[1, '1 · Court Movement'], [2, '2 · Serve Placement'], [3, '3 · Returns & Rally'], [4, '4 · Movement & Fitness'], [5, '5 · Comparison'], [6, '6 · Training']] as [number, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ appearance: 'none', border: tab === id ? `1px solid ${accent.border}` : '1px solid transparent', padding: '6px 14px', borderRadius: 7, fontSize: 12, cursor: 'pointer', background: tab === id ? accent.dim : 'transparent', color: tab === id ? accent.hex : T.text2, fontWeight: tab === id ? 600 : 400 }}>
            {label}
          </button>
        ))}
      </div>

      {/* 1 · COURT MOVEMENT */}
      <Section n={1} title="Court Movement Heatmap" sub="Where the player held position, by phase. Toggle serve, return, rally, and net approach.">
        <HCard>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(['rally', 'serve', 'return', 'net'] as const).map(m => (
                <button key={m} onClick={() => setMovementMode(m)} style={{ ...seg(movementMode === m), flex: 'none', padding: '6px 12px' }}>
                  {m === 'serve' ? 'Serve positions' : m === 'return' ? 'Return positions' : m === 'rally' ? 'Rally movement' : 'Net approach'}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 10, color: T.text3 }}>{session.label} · {setSel === 'full' ? 'Full session' : setSel.replace('set', 'Set ')}</div>
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

      {/* 2 · SERVE PLACEMENT */}
      <Section n={2} title="Serve Placement Heatmap" sub="Service-box landing zones with win % per zone. Toggle deuce/ad and 1st/2nd serve.">
        <HCard>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['deuce', 'ad'] as const).map(s => (
                <button key={s} onClick={() => setServeSide(s)} style={{ ...seg(serveSide === s), flex: 'none', padding: '6px 12px', textTransform: 'capitalize' }}>{s} side</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['first', 'second'] as const).map(s => (
                <button key={s} onClick={() => setServeType(s)} style={{ ...seg(serveType === s), flex: 'none', padding: '6px 12px', textTransform: 'capitalize' }}>{s} serve</button>
              ))}
            </div>
          </div>
          <div className="cm-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: density.gap }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ maxWidth: 360, width: '100%' }}>
                <ServePlacementMap width={CW} height={CH} seed={`${matchSeed}-${serveSide}-${serveType}`} side={serveSide} serveType={serveType} accentHex={accent.hex} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <StatTile label={`${serveSide} · ${serveType === 'first' ? '1st' : '2nd'} serve`} value={`${serveType === 'first' ? firstInPct : secondInPct}%`} sub={`In-court rate · target ${serveType === 'first' ? firstInPct + 4 : Math.min(98, secondInPct + 3)}%`} />
              <div style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Wide vs T split</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <div style={{ flex: 1, height: 12, borderRadius: 999, background: T.hover }}>
                    <div style={{ height: 12, borderRadius: 999, width: `${wideTSplit}%`, background: accent.hex }} />
                  </div>
                  <span style={{ fontSize: 10, color: T.text, fontWeight: 700 }}>{wideTSplit} / {100 - wideTSplit}</span>
                </div>
                <div style={{ fontSize: 11, color: T.text3, marginTop: 4 }}>Slight bias to {serveSide === 'deuce' ? 'wide' : 'T'} on this side</div>
              </div>
              <StatTile label="Avg speed (km/h)" value={`${serveType === 'first' ? firstSpeed : secondSpeed}`} sub={serveType === 'first' ? `Top: ${firstSpeed + 8} km/h` : `Kick avg · top ${secondSpeed + 10} km/h`} />
              <StatTile label="Aces · Double faults" value={`${aces} · ${dfs}`} sub="This session" />
            </div>
          </div>
        </HCard>
      </Section>

      {/* 3 · RETURN & RALLY */}
      <Section n={3} title="Return &amp; Rally Heatmap" sub="Where returns were hit from, where winners landed, and where unforced errors went.">
        <div className="cm-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: density.gap }}>
          <HCard title="Return Positions" sub="Bigger / hotter dots = more aggressive return">
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ maxWidth: 300, width: '100%' }}>
                <ReturnMap width={CW} height={CH} seed={`${matchSeed}-rtn`} accentHex={accent.hex} />
              </div>
            </div>
          </HCard>
          <HCard title="Rally Length Heatmap" sub="Where points were won/lost — short rallies (≤3) vs long (8+)">
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ maxWidth: 300, width: '100%' }}>
                <CourtPositionalHeatmap width={CW} height={CH} seed={`${matchSeed}-rallylen`} anchors={[
                  { x: 0.4, y: 0.84, weight: 0.95 }, { x: 0.62, y: 0.84, weight: 0.85 }, { x: 0.5, y: 0.7, weight: 0.55 }, { x: 0.5, y: 0.5, weight: 0.35 },
                ]} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
              {[['Short (≤3)', rShort, T.good], ['Mid (4–7)', rMid, T.warn], ['Long (8+)', rLong, T.bad]].map(([lbl, v, c]) => (
                <div key={lbl as string} style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: T.text3 }}>{lbl}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{v}%</div>
                  <div style={{ fontSize: 10, color: c as string }}>won {Math.round((v as number) * 1.4)}%</div>
                </div>
              ))}
            </div>
          </HCard>
        </div>
        <div className="cm-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: density.gap }}>
          <HCard title="Winner Placement" sub="Where winners landed on the opponent's side">
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ maxWidth: 300, width: '100%' }}><WinnerErrorMap width={CW} height={CH} seed={`${matchSeed}-w`} mode="winners" /></div>
            </div>
          </HCard>
          <HCard title="Error Zones" sub="Where unforced errors were hit (✗ = error landing zone)">
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ maxWidth: 300, width: '100%' }}><WinnerErrorMap width={CW} height={CH} seed={`${matchSeed}-e`} mode="errors" /></div>
            </div>
          </HCard>
        </div>
      </Section>

      {/* 4 · MOVEMENT & FITNESS */}
      <Section n={4} title="Movement &amp; Fitness Heatmap" sub="Distance, court coverage, sprint pattern, recovery position, and speed-zone breakdown.">
        <div className="cm-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: density.gap }}>
          <HCard title="Distance Covered per Set" sub="Bar height = km · colour = average intensity">
            <DistanceBySetBars T={T} sets={session.distanceBySet} />
          </HCard>
          <HCard title="Distance by Speed Zone" sub="Time-share across speed bands">
            <SpeedZoneBars T={T} zones={data.speedZones} />
          </HCard>
        </div>
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

      {/* 5 · SESSION-BY-SESSION COMPARISON */}
      <Section n={5} title="Session-by-Session Comparison" sub="Compare two of this player's sessions, season trend, and movement by surface.">
        <HCard title="Side-by-Side Court Heatmaps">
          <div className="cm-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <select style={selectStyle} value={compareA} onChange={e => setCompareA(Number(e.target.value))}>
              {sessions.map((s, i) => <option key={s.id} value={i}>{matchOpt(s)}</option>)}
            </select>
            <select style={selectStyle} value={compareB} onChange={e => setCompareB(Number(e.target.value))}>
              {sessions.map((s, i) => <option key={s.id} value={i}>{matchOpt(s)}</option>)}
            </select>
          </div>
          <div className="cm-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: density.gap }}>
            {[compareA, compareB].map((mIdx, slot) => {
              const cs = sessions[mIdx]
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

      {/* 6 · TRAINING SESSION */}
      <Section n={6} title="Training Session Heatmap" sub="Drill placement, footwork intensity, and weekly load microcycle.">
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
