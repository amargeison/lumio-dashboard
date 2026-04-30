'use client'

import React, { useEffect, useState } from 'react'

// ─── Shared SVG building blocks for the GPS Heatmaps view ───────────────────
// Used by non-league and Women's FC portals (Football Pro keeps its own
// inline copy for now). Pure SVG, deterministic seed-hashing for stable
// renders, green→red heat scale.

export const HEAT_STOPS = ['#0E7C3A', '#22C55E', '#FACC15', '#F59E0B', '#EF4444', '#7F1D1D']
export const heatColor = (intensity: number) => {
  const t = Math.max(0, Math.min(1, intensity))
  const idx = Math.min(HEAT_STOPS.length - 1, Math.floor(t * (HEAT_STOPS.length - 1)))
  return HEAT_STOPS[idx]
}

// FNV-1a-ish hash → number in [0,1). Stable across renders so heat clouds
// don't shimmer on every re-paint.
export function hashAt(str: string, salt: number): number {
  let h = 2166136261 ^ salt
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619)
  }
  return ((h >>> 0) % 10000) / 10000
}

export interface HMPlayer {
  name: string
  position: string
  group: 'Defenders' | 'Midfielders' | 'Forwards' | 'Goalkeeper'
}

const POSITION_ANCHORS: Record<string, { x: number; y: number }> = {
  GK: { x: 0.06, y: 0.5 },
  LB: { x: 0.18, y: 0.22 }, LWB: { x: 0.2, y: 0.22 },
  RB: { x: 0.18, y: 0.78 }, RWB: { x: 0.2, y: 0.78 },
  CB: { x: 0.22, y: 0.5 },
  CDM: { x: 0.36, y: 0.5 }, DM: { x: 0.36, y: 0.5 },
  CM: { x: 0.5, y: 0.5 },
  CAM: { x: 0.62, y: 0.5 }, AM: { x: 0.62, y: 0.5 },
  LW: { x: 0.78, y: 0.22 },
  RW: { x: 0.78, y: 0.78 },
  ST: { x: 0.82, y: 0.5 }, CF: { x: 0.82, y: 0.5 }, FW: { x: 0.82, y: 0.5 },
}

export function FootballPitch({ width, height, lineCol = 'rgba(255,255,255,0.18)' }: {
  width: number; height: number; lineCol?: string
}) {
  const W = width, H = height
  return (
    <g>
      <rect width={W} height={H} fill="#06140a" rx={6} />
      <rect x={1} y={1} width={W - 2} height={H - 2} fill="none" stroke={lineCol} strokeWidth={1.5} />
      <line x1={W / 2} y1={0} x2={W / 2} y2={H} stroke={lineCol} strokeWidth={1.2} />
      <circle cx={W / 2} cy={H / 2} r={H * 0.13} fill="none" stroke={lineCol} strokeWidth={1} />
      <circle cx={W / 2} cy={H / 2} r={2.5} fill={lineCol} />
      <rect x={0} y={H * 0.22} width={W * 0.16} height={H * 0.56} fill="none" stroke={lineCol} strokeWidth={1} />
      <rect x={W - W * 0.16} y={H * 0.22} width={W * 0.16} height={H * 0.56} fill="none" stroke={lineCol} strokeWidth={1} />
      <rect x={0} y={H * 0.36} width={W * 0.06} height={H * 0.28} fill="none" stroke={lineCol} strokeWidth={1} />
      <rect x={W - W * 0.06} y={H * 0.36} width={W * 0.06} height={H * 0.28} fill="none" stroke={lineCol} strokeWidth={1} />
      <line x1={0} y1={H * 0.44} x2={0} y2={H * 0.56} stroke="rgba(255,255,255,0.55)" strokeWidth={3} />
      <line x1={W} y1={H * 0.44} x2={W} y2={H * 0.56} stroke="rgba(255,255,255,0.55)" strokeWidth={3} />
    </g>
  )
}

export function PositionalHeatmap({ width, height, player, sessionIdx, position, intensity = 1 }: {
  width: number; height: number; player: string; sessionIdx: number; position: string; intensity?: number
}) {
  const W = width, H = height
  const anchor = POSITION_ANCHORS[position] || { x: 0.5, y: 0.5 }
  const cols = 14, rows = 9
  const cellW = W / cols, cellH = H / rows
  const cells: { x: number; y: number; t: number }[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = (c + 0.5) / cols
      const cy = (r + 0.5) / rows
      const dx = cx - anchor.x
      const dy = cy - anchor.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const noise = hashAt(`${player}-${sessionIdx}-${r}-${c}`, 7) * 0.45
      const base = Math.max(0, 1 - dist * 1.9) + noise * 0.5
      const t = Math.min(1, base * intensity)
      if (t > 0.08) cells.push({ x: c * cellW, y: r * cellH, t })
    }
  }
  const filterId = `blur-${player.replace(/[^a-z0-9]/gi, '')}-${sessionIdx}`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxHeight: 360 }}>
      <defs>
        <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      <FootballPitch width={W} height={H} />
      <g filter={`url(#${filterId})`} opacity={0.85}>
        {cells.map((cell, i) => (
          <rect key={i} x={cell.x} y={cell.y} width={cellW + 2} height={cellH + 2}
            fill={heatColor(cell.t)} opacity={0.35 + cell.t * 0.55} />
        ))}
      </g>
    </svg>
  )
}

export function TouchMap({ width, height, player, sessionIdx, position, brandPrimary }: {
  width: number; height: number; player: string; sessionIdx: number; position: string; brandPrimary: string
}) {
  const anchor = POSITION_ANCHORS[position] || { x: 0.5, y: 0.5 }
  const spread = 0.18
  const dots = Array.from({ length: 48 }, (_, i) => {
    const a = hashAt(`${player}-tm-${sessionIdx}-${i}-a`, 11) * Math.PI * 2
    const r = hashAt(`${player}-tm-${sessionIdx}-${i}-r`, 13) * spread
    return {
      x: (anchor.x + Math.cos(a) * r) * width,
      y: (anchor.y + Math.sin(a) * r) * height,
      r: 2.5 + hashAt(`${player}-tm-${sessionIdx}-${i}-s`, 19) * 2.5,
    }
  })
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ maxHeight: 360 }}>
      <FootballPitch width={width} height={height} />
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={brandPrimary} opacity={0.75}
          stroke="white" strokeOpacity={0.35} strokeWidth={0.6} />
      ))}
    </svg>
  )
}

export function ZoneThirdsMap({ width, height, player, sessionIdx, group }: {
  width: number; height: number; player: string; sessionIdx: number; group: HMPlayer['group']
}) {
  const baseDef = group === 'Defenders' ? 58 : group === 'Midfielders' ? 32 : group === 'Goalkeeper' ? 80 : 12
  const baseAtt = group === 'Forwards' ? 56 : group === 'Midfielders' ? 30 : group === 'Goalkeeper' ? 4 : 10
  const noise = Math.round((hashAt(`${player}-zt-${sessionIdx}`, 23) - 0.5) * 8)
  const def = Math.max(5, Math.min(85, baseDef + noise))
  const att = Math.max(2, Math.min(75, baseAtt - noise))
  const mid = Math.max(5, 100 - def - att)
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ maxHeight: 320 }}>
      <FootballPitch width={width} height={height} />
      <rect x={0} y={0} width={width / 3} height={height} fill={heatColor(def / 80)} opacity={0.45} />
      <rect x={width / 3} y={0} width={width / 3} height={height} fill={heatColor(mid / 80)} opacity={0.45} />
      <rect x={(width / 3) * 2} y={0} width={width / 3} height={height} fill={heatColor(att / 80)} opacity={0.45} />
      <text x={width / 6} y={height / 2 + 6} textAnchor="middle" fontSize={28} fontWeight={800} fill="white" opacity={0.92}>{def}%</text>
      <text x={width / 2} y={height / 2 + 6} textAnchor="middle" fontSize={28} fontWeight={800} fill="white" opacity={0.92}>{mid}%</text>
      <text x={(width / 6) * 5} y={height / 2 + 6} textAnchor="middle" fontSize={28} fontWeight={800} fill="white" opacity={0.92}>{att}%</text>
      <text x={width / 6} y={height - 10} textAnchor="middle" fontSize={9} fill="white" opacity={0.55}>DEFENSIVE</text>
      <text x={width / 2} y={height - 10} textAnchor="middle" fontSize={9} fill="white" opacity={0.55}>MIDDLE</text>
      <text x={(width / 6) * 5} y={height - 10} textAnchor="middle" fontSize={9} fill="white" opacity={0.55}>ATTACKING</text>
    </svg>
  )
}

export function SprintPathOverlay({ width, height, player, sessionIdx, brandSecondary }: {
  width: number; height: number; player: string; sessionIdx: number; brandSecondary: string
}) {
  const sprintCount = 8 + Math.floor(hashAt(`${player}-sp-${sessionIdx}`, 29) * 6)
  const sprints = Array.from({ length: sprintCount }, (_, i) => {
    const sx = hashAt(`${player}-sp-${sessionIdx}-${i}-x`, 31)
    const sy = hashAt(`${player}-sp-${sessionIdx}-${i}-y`, 37)
    const ex = sx + (hashAt(`${player}-sp-${sessionIdx}-${i}-dx`, 41) - 0.5) * 0.5
    const ey = sy + (hashAt(`${player}-sp-${sessionIdx}-${i}-dy`, 43) - 0.5) * 0.4
    return {
      x1: sx * width,
      y1: sy * height,
      x2: Math.max(8, Math.min(width - 8, ex * width)),
      y2: Math.max(8, Math.min(height - 8, ey * height)),
      speed: 0.5 + hashAt(`${player}-sp-${sessionIdx}-${i}-s`, 47) * 0.5,
    }
  })
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ maxHeight: 320 }}>
      <FootballPitch width={width} height={height} />
      {sprints.map((s, i) => (
        <g key={i}>
          <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={heatColor(s.speed)} strokeWidth={2.2} strokeLinecap="round" opacity={0.85} />
          <circle cx={s.x2} cy={s.y2} r={3.2} fill={brandSecondary} stroke={heatColor(s.speed)} strokeWidth={1.5} />
        </g>
      ))}
    </svg>
  )
}

export function HighIntensityZones({ width, height, sessionIdx }: { width: number; height: number; sessionIdx: number }) {
  const blobs = Array.from({ length: 16 }, (_, i) => ({
    cx: hashAt(`hi-${sessionIdx}-${i}-x`, 53) * width,
    cy: hashAt(`hi-${sessionIdx}-${i}-y`, 59) * height,
    r: 18 + hashAt(`hi-${sessionIdx}-${i}-r`, 61) * 38,
    t: 0.4 + hashAt(`hi-${sessionIdx}-${i}-t`, 67) * 0.6,
  }))
  const filterId = `hi-blur-${sessionIdx}`
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ maxHeight: 320 }}>
      <defs>
        <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>
      <FootballPitch width={width} height={height} />
      <g filter={`url(#${filterId})`}>
        {blobs.map((b, i) => (
          <circle key={i} cx={b.cx} cy={b.cy} r={b.r} fill={heatColor(b.t)} opacity={0.45} />
        ))}
      </g>
    </svg>
  )
}

export function WeeklyLoadCalendar({ matchDayLabel = 'MATCH' }: { matchDayLabel?: string }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const labels = ['Recovery', 'Tactical', 'High Intensity', 'S&C', "Captain's Run", matchDayLabel, 'Off']
  const intensities = [0.18, 0.62, 0.92, 0.45, 0.3, 1.0, 0.05]
  const distances = [3.2, 7.4, 9.8, 5.1, 4.0, 11.2, 0]
  const loads = [320, 740, 1140, 560, 420, 1410, 0]
  return (
    <svg viewBox="0 0 700 200" width="100%" style={{ maxHeight: 220 }}>
      <rect width={700} height={200} fill="#0d1117" rx={8} />
      {days.map((d, i) => {
        const x = i * (700 / 7)
        const w = 700 / 7 - 6
        return (
          <g key={d}>
            <rect x={x + 3} y={28} width={w} height={150} rx={6}
              fill={heatColor(intensities[i])} opacity={0.18 + intensities[i] * 0.55} />
            <rect x={x + 3} y={28} width={w} height={150} rx={6}
              fill="none" stroke={heatColor(intensities[i])} strokeOpacity={0.6} strokeWidth={1} />
            <text x={x + (700 / 7) / 2} y={20} textAnchor="middle" fontSize={11} fontWeight={700} fill="rgba(255,255,255,0.7)">{d}</text>
            <text x={x + (700 / 7) / 2} y={62} textAnchor="middle" fontSize={10} fill="white" opacity={0.85}>{labels[i]}</text>
            <text x={x + (700 / 7) / 2} y={110} textAnchor="middle" fontSize={26} fontWeight={800} fill="white">{loads[i]}</text>
            <text x={x + (700 / 7) / 2} y={128} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.6)">AU load</text>
            <text x={x + (700 / 7) / 2} y={158} textAnchor="middle" fontSize={11} fontWeight={600} fill="white" opacity={0.9}>{distances[i] > 0 ? `${distances[i]} km` : '—'}</text>
          </g>
        )
      })}
      <text x={4} y={195} fontSize={9} fill="rgba(255,255,255,0.4)">Squad average · 7-day rolling intensity</text>
      <text x={696} y={195} textAnchor="end" fontSize={9} fill="rgba(255,255,255,0.4)">Cell colour = relative session intensity</text>
    </svg>
  )
}

export function SpeedZoneBars({ player, group }: { player: string; group: HMPlayer['group'] }) {
  const base = group === 'Forwards' ? [10, 22, 28, 24, 16]
    : group === 'Defenders' ? [16, 30, 28, 18, 8]
    : group === 'Goalkeeper' ? [50, 32, 12, 4, 2]
    : [12, 26, 30, 20, 12]
  const noise = (i: number) => Math.round((hashAt(`${player}-sz-${i}`, 71) - 0.5) * 6)
  const dist = base.map((v, i) => Math.max(2, v + noise(i)))
  const total = dist.reduce((a, b) => a + b, 0)
  const pct = dist.map(v => (v / total) * 100)
  const labels = ['Stand 0–2 km/h', 'Walk 2–7', 'Jog 7–14', 'Run 14–20', 'Sprint 20+']
  const colors = [HEAT_STOPS[0], HEAT_STOPS[1], HEAT_STOPS[2], HEAT_STOPS[3], HEAT_STOPS[4]]
  const W = 700, BAR_H = 30, GAP = 14
  const totalH = labels.length * (BAR_H + GAP) + 16
  return (
    <svg viewBox={`0 0 ${W} ${totalH}`} width="100%" style={{ maxHeight: totalH + 8 }}>
      {labels.map((label, i) => {
        const y = 8 + i * (BAR_H + GAP)
        const barW = (pct[i] / 100) * (W - 220)
        return (
          <g key={label}>
            <text x={4} y={y + BAR_H / 2 + 4} fontSize={11} fontWeight={600} fill="rgba(255,255,255,0.85)">{label}</text>
            <rect x={150} y={y} width={W - 220} height={BAR_H} rx={4} fill="rgba(255,255,255,0.04)" />
            <rect x={150} y={y} width={barW} height={BAR_H} rx={4} fill={colors[i]} opacity={0.85} />
            <text x={150 + barW + 8} y={y + BAR_H / 2 + 4} fontSize={11} fontWeight={700} fill="white">
              {pct[i].toFixed(1)}% · {(dist[i] * 0.13).toFixed(2)} km
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export function TopSpeedScatter({ players, brandPrimary }: { players: HMPlayer[]; brandPrimary: string }) {
  const W = 700, H = 240, padL = 36, padB = 28
  const minSpeed = 22, maxSpeed = 32
  const points = players.flatMap((p, pi) =>
    Array.from({ length: 6 }, (_, si) => {
      const baseSpeed = p.group === 'Forwards' ? 29 : p.group === 'Midfielders' ? 27 : p.group === 'Goalkeeper' ? 23 : 26.5
      const v = baseSpeed + (hashAt(`${p.name}-ts-${si}`, 79) - 0.5) * 4
      const clamped = Math.max(minSpeed, Math.min(maxSpeed, v))
      const x = padL + (si / 5) * (W - padL - 16)
      const y = H - padB - ((clamped - minSpeed) / (maxSpeed - minSpeed)) * (H - padB - 16)
      return { x, y, v: clamped, pi, si }
    })
  )
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxHeight: 280 }}>
      <rect width={W} height={H} fill="#0d1117" rx={6} />
      {[22, 24, 26, 28, 30, 32].map(v => {
        const y = H - padB - ((v - minSpeed) / (maxSpeed - minSpeed)) * (H - padB - 16)
        return (
          <g key={v}>
            <line x1={padL} y1={y} x2={W - 8} y2={y} stroke="rgba(255,255,255,0.06)" />
            <text x={padL - 6} y={y + 3} textAnchor="end" fontSize={9} fill="rgba(255,255,255,0.45)">{v}</text>
          </g>
        )
      })}
      {['S1', 'S2', 'S3', 'S4', 'S5', 'S6'].map((s, i) => {
        const x = padL + (i / 5) * (W - padL - 16)
        return <text key={s} x={x} y={H - 8} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.5)">{s}</text>
      })}
      <text x={padL - 30} y={14} fontSize={10} fill="rgba(255,255,255,0.6)" fontWeight={700}>km/h</text>
      {points.map((p, i) => {
        const norm = (p.v - minSpeed) / (maxSpeed - minSpeed)
        return (
          <circle key={i} cx={p.x + (p.pi % 5) * 1.2 - 3} cy={p.y} r={3.6}
            fill={heatColor(norm)} stroke={brandPrimary} strokeOpacity={0.4} strokeWidth={0.6} opacity={0.85} />
        )
      })}
    </svg>
  )
}

export function AccelDecelMap({ width, height }: { width: number; height: number }) {
  const events = Array.from({ length: 24 }, (_, i) => ({
    x: hashAt(`accel-${i}-x`, 83) * width,
    y: hashAt(`accel-${i}-y`, 89) * height,
    accel: hashAt(`accel-${i}-a`, 97) > 0.5,
    intensity: 0.4 + hashAt(`accel-${i}-int`, 101) * 0.6,
  }))
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ maxHeight: 320 }}>
      <FootballPitch width={width} height={height} />
      {events.map((e, i) => (
        <g key={i}>
          <circle cx={e.x} cy={e.y} r={6 + e.intensity * 6} fill={heatColor(e.intensity)} opacity={0.25} />
          <polygon
            points={e.accel
              ? `${e.x},${e.y - 5} ${e.x - 4},${e.y + 4} ${e.x + 4},${e.y + 4}`
              : `${e.x},${e.y + 5} ${e.x - 4},${e.y - 4} ${e.x + 4},${e.y - 4}`}
            fill={e.accel ? '#22C55E' : '#EF4444'} stroke="white" strokeOpacity={0.3} strokeWidth={0.6} />
        </g>
      ))}
    </svg>
  )
}

export function HeatScaleLegend({ width = 220 }: { width?: number }) {
  return (
    <div className="flex h-2 rounded overflow-hidden border border-gray-800" style={{ width }}>
      {HEAT_STOPS.map(c => <div key={c} style={{ flex: 1, background: c }} />)}
    </div>
  )
}

export interface GPSHeatmapsViewProps {
  sportLabel: string
  brandPrimaryKey: string
  brandSecondaryKey: string
  defaultPrimary: string
  defaultSecondary: string
  players: HMPlayer[]
  matches: string[]
  trainingSessions: string[]
  matchDayLabel?: string
  comparisonMode?: 'four' | 'eleven'
  includeWelfareSection?: boolean
  welfareLabel?: string
}

// ─── 5+1 section heatmap view, configurable per sport ──────────────────────
export function GPSHeatmapsView({
  sportLabel,
  brandPrimaryKey,
  brandSecondaryKey,
  defaultPrimary,
  defaultSecondary,
  players,
  matches,
  trainingSessions,
  matchDayLabel = 'MATCH',
  comparisonMode = 'four',
  includeWelfareSection = false,
  welfareLabel = 'Welfare & Load Monitoring',
}: GPSHeatmapsViewProps) {
  const [brandPrimary, setBrandPrimary] = useState(defaultPrimary)
  const [brandSecondary, setBrandSecondary] = useState(defaultSecondary)
  const [matchIdx, setMatchIdx] = useState(0)
  const [selectedPlayer, setSelectedPlayer] = useState(players[0]?.name ?? '')
  const [trainingIdx, setTrainingIdx] = useState(0)
  const [compareSessionA, setCompareSessionA] = useState(0)
  const [compareSessionB, setCompareSessionB] = useState(Math.min(1, trainingSessions.length - 1))
  const initialCompare = comparisonMode === 'eleven'
    ? players.slice(0, Math.min(11, players.length)).map(p => p.name)
    : [players[0]?.name, players[Math.min(4, players.length - 1)]?.name, players[Math.min(8, players.length - 1)]?.name, players[Math.min(9, players.length - 1)]?.name].filter(Boolean) as string[]
  const [comparePlayers, setComparePlayers] = useState<string[]>(initialCompare)

  useEffect(() => {
    try {
      const p = localStorage.getItem(brandPrimaryKey)
      const s = localStorage.getItem(brandSecondaryKey)
      if (p) setBrandPrimary(p)
      if (s) setBrandSecondary(s)
    } catch { /* localStorage may not exist */ }
  }, [brandPrimaryKey, brandSecondaryKey])

  const PW = 600, PH = 380
  const PW_S = 360, PH_S = 230

  const selectedPlayerMeta = players.find(p => p.name === selectedPlayer) || players[0]

  const Section = ({ title, subtitle, children, accentColor }: { title: string; subtitle?: string; children: React.ReactNode; accentColor?: string }) => (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold" style={{ color: accentColor || brandPrimary }}>{title}</h2>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className="hidden md:flex items-center gap-3 text-[10px] text-gray-500">
          <span className="uppercase tracking-wider">Heat scale</span>
          <HeatScaleLegend />
          <span className="text-gray-500">low → high</span>
        </div>
      </div>
      {children}
    </section>
  )

  const HCard = ({ title, subtitle, children }: { title?: string; subtitle?: string; children: React.ReactNode }) => (
    <div className="rounded-xl p-4 border" style={{ background: '#0d1117', borderColor: '#1F2937' }}>
      {(title || subtitle) && (
        <div className="mb-3">
          {title && <div className="text-sm font-semibold text-white">{title}</div>}
          {subtitle && <div className="text-[11px] text-gray-500 mt-0.5">{subtitle}</div>}
        </div>
      )}
      {children}
    </div>
  )

  return (
    <div className="space-y-10">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
            style={{ background: `linear-gradient(135deg, ${brandPrimary}, ${brandSecondary})` }}>
            🔥
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">GPS Heatmaps</h1>
            <p className="text-xs text-gray-400 mt-0.5">{sportLabel} · spatial movement analysis across matches, training, and the season.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="px-2 py-1 rounded-full font-bold uppercase tracking-wider"
            style={{ background: `${brandPrimary}20`, color: brandPrimary, border: `1px solid ${brandPrimary}50` }}>
            10Hz GPS
          </span>
          <span className="px-2 py-1 rounded-full font-bold uppercase tracking-wider"
            style={{ background: 'rgba(34,197,94,0.12)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.4)' }}>
            Live · synced 12 min ago
          </span>
        </div>
      </div>

      {/* ─── 1. MATCH HEATMAPS ─────────────────────────────────────── */}
      <Section title="1 · Match Heatmaps" subtitle="Match-day positional intelligence — who covered which space, where they touched the ball, and what they did under load.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 block">Player</label>
            <div className="flex flex-wrap gap-1">
              {players.map(p => (
                <button key={p.name} onClick={() => setSelectedPlayer(p.name)}
                  className="px-2.5 py-1 rounded text-[11px] font-medium transition-all border"
                  style={selectedPlayer === p.name
                    ? { background: brandPrimary, color: 'white', borderColor: brandPrimary }
                    : { background: '#0d1117', color: '#9CA3AF', borderColor: '#1F2937' }}>
                  {p.name} <span className="opacity-60">· {p.position}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 block">Match</label>
            <select value={matchIdx} onChange={e => setMatchIdx(Number(e.target.value))}
              className="w-full bg-[#0d1117] border rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
              style={{ borderColor: '#1F2937' }}>
              {matches.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <HCard title="Positional Heatmap" subtitle={`${selectedPlayer} — full pitch density`}>
            <PositionalHeatmap width={PW} height={PH} player={selectedPlayer}
              sessionIdx={matchIdx} position={selectedPlayerMeta?.position ?? 'CM'} />
          </HCard>
          <HCard title="Touch Map" subtitle="Every ball touch logged by GPS-synced event data">
            <TouchMap width={PW} height={PH} player={selectedPlayer}
              sessionIdx={matchIdx} position={selectedPlayerMeta?.position ?? 'CM'} brandPrimary={brandPrimary} />
          </HCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <HCard title="Defensive vs Attacking Thirds" subtitle="% of total time spent in each third of the pitch">
            <ZoneThirdsMap width={PW} height={PH * 0.8} player={selectedPlayer}
              sessionIdx={matchIdx} group={selectedPlayerMeta?.group ?? 'Midfielders'} />
          </HCard>
          <HCard title="Sprint Path Overlay" subtitle="High-speed runs (>20 km/h) — colour = peak speed">
            <SprintPathOverlay width={PW} height={PH * 0.8} player={selectedPlayer}
              sessionIdx={matchIdx} brandSecondary={brandSecondary} />
          </HCard>
        </div>
      </Section>

      {/* ─── 2. TRAINING HEATMAPS ──────────────────────────────────── */}
      <Section title="2 · Training Heatmaps" subtitle="Session-level distribution and weekly load microcycle." accentColor={brandSecondary}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 block">Session</label>
            <select value={trainingIdx} onChange={e => setTrainingIdx(Number(e.target.value))}
              className="w-full bg-[#0d1117] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white">
              {trainingSessions.map((t, i) => <option key={t} value={i}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <HCard title="Session Movement Heatmap" subtitle={`${trainingSessions[trainingIdx] ?? ''} — squad aggregate`}>
            <PositionalHeatmap width={PW} height={PH} player="squad-agg"
              sessionIdx={trainingIdx + 100} position="CM" intensity={0.85} />
          </HCard>
          <HCard title="High-Intensity Zones" subtitle="Sprints + accelerations density (≥3 m/s²)">
            <HighIntensityZones width={PW} height={PH} sessionIdx={trainingIdx} />
          </HCard>
        </div>

        <HCard title="Session vs Session Comparison" subtitle="Side-by-side movement footprint">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <select value={compareSessionA} onChange={e => setCompareSessionA(Number(e.target.value))}
              className="w-full bg-[#0a0c12] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white">
              {trainingSessions.map((t, i) => <option key={t} value={i}>{t}</option>)}
            </select>
            <select value={compareSessionB} onChange={e => setCompareSessionB(Number(e.target.value))}
              className="w-full bg-[#0a0c12] border border-gray-800 rounded-lg px-3 py-2 text-xs text-white">
              {trainingSessions.map((t, i) => <option key={t} value={i}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-[11px] text-gray-500 mb-1">{trainingSessions[compareSessionA]}</div>
              <PositionalHeatmap width={PW_S} height={PH_S} player="cmp-a"
                sessionIdx={compareSessionA + 200} position="CM" intensity={0.85} />
            </div>
            <div>
              <div className="text-[11px] text-gray-500 mb-1">{trainingSessions[compareSessionB]}</div>
              <PositionalHeatmap width={PW_S} height={PH_S} player="cmp-b"
                sessionIdx={compareSessionB + 200} position="CM" intensity={0.85} />
            </div>
          </div>
        </HCard>

        <HCard title="Weekly Load Calendar" subtitle="7-day microcycle">
          <WeeklyLoadCalendar matchDayLabel={matchDayLabel} />
        </HCard>
      </Section>

      {/* ─── 3. SPEED & INTENSITY ZONES ────────────────────────────── */}
      <Section title="3 · Speed & Intensity Zones" subtitle="How distance, speed and accel/decel events distribute across the squad.">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <HCard title="Distance by Speed Zone" subtitle={`${selectedPlayer} — match average across last 5`}>
            <SpeedZoneBars player={selectedPlayer} group={selectedPlayerMeta?.group ?? 'Midfielders'} />
          </HCard>
          <HCard title="Top Speed Distribution" subtitle="All squad members across last 6 sessions">
            <TopSpeedScatter players={players} brandPrimary={brandPrimary} />
          </HCard>
        </div>
        <HCard title="Acceleration & Deceleration Map" subtitle="Where high-magnitude accel (▲ green) and decel (▼ red) events happen">
          <AccelDecelMap width={PW} height={PH * 0.7} />
        </HCard>
      </Section>

      {/* ─── 4. SQUAD COMPARISON ───────────────────────────────────── */}
      <Section title="4 · Squad Comparison" subtitle={comparisonMode === 'eleven' ? 'Starting XI side-by-side — limited squad size.' : 'Up to 4 players side-by-side — grouped by role.'}>
        <HCard>
          <div className="mb-3">
            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">
              Comparing {comparePlayers.length} player{comparePlayers.length === 1 ? '' : 's'} (click a slot to change)
            </div>
            <div className={comparisonMode === 'eleven' ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2' : 'grid grid-cols-2 md:grid-cols-4 gap-2'}>
              {comparePlayers.map((p, slot) => (
                <select key={slot} value={p}
                  onChange={e => {
                    const next = [...comparePlayers]
                    next[slot] = e.target.value
                    setComparePlayers(next)
                  }}
                  className="w-full bg-[#0a0c12] border border-gray-800 rounded-lg px-2 py-1.5 text-[11px] text-white">
                  {players.map(pl => <option key={pl.name} value={pl.name}>{pl.name} · {pl.position}</option>)}
                </select>
              ))}
            </div>
          </div>
          <div className={comparisonMode === 'eleven' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3' : 'grid grid-cols-2 md:grid-cols-4 gap-3'}>
            {comparePlayers.map((p, slot) => {
              const meta = players.find(pl => pl.name === p)
              return (
                <div key={`${p}-${slot}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-white truncate">{p}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                      style={{ background: `${brandPrimary}25`, color: brandPrimary }}>
                      {meta?.position}
                    </span>
                  </div>
                  <div className="text-[9px] text-gray-500 mb-1">{meta?.group}</div>
                  <PositionalHeatmap width={300} height={190} player={p}
                    sessionIdx={matchIdx} position={meta?.position ?? 'CM'} />
                </div>
              )
            })}
          </div>
        </HCard>

        <HCard title="Position Group Aggregates" subtitle="Combined heat for each role group">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(['Defenders', 'Midfielders', 'Forwards'] as const).map(group => {
              const groupAnchor = players.find(p => p.group === group) ?? players[0]
              return (
                <div key={group}>
                  <div className="text-[11px] font-bold mb-1" style={{ color: brandSecondary }}>{group}</div>
                  <PositionalHeatmap width={400} height={250} player={`group-${group}`}
                    sessionIdx={matchIdx + 1000} position={groupAnchor?.position ?? 'CM'} intensity={0.95} />
                </div>
              )
            })}
          </div>
        </HCard>
      </Section>

      {/* ─── 5. SEASON OVERVIEW ────────────────────────────────────── */}
      <Section title="5 · Season Overview" subtitle="Trend grids and home/away differentials across the campaign.">
        <HCard title="Rolling 10-Match Load Grid" subtitle="Rows = players · columns = last 10 matches · cell colour = relative load (AU)">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr>
                  <th className="text-left p-1.5 text-gray-500 font-semibold">Player</th>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <th key={i} className="p-1.5 text-gray-500 font-semibold">M{i + 1}</th>
                  ))}
                  <th className="p-1.5 text-gray-400 font-semibold">Avg</th>
                </tr>
              </thead>
              <tbody>
                {players.map(p => {
                  const cells = Array.from({ length: 10 }, (_, i) => {
                    const baseRange = p.group === 'Forwards' ? [0.55, 0.95]
                      : p.group === 'Midfielders' ? [0.6, 0.98]
                      : p.group === 'Goalkeeper' ? [0.2, 0.45]
                      : [0.5, 0.85]
                    const t = baseRange[0] + hashAt(`${p.name}-rolling-${i}`, 103) * (baseRange[1] - baseRange[0])
                    return t
                  })
                  const avg = cells.reduce((a, b) => a + b, 0) / cells.length
                  return (
                    <tr key={p.name} className="border-t border-gray-900">
                      <td className="p-1.5 text-white whitespace-nowrap">
                        {p.name} <span className="text-gray-600">· {p.position}</span>
                      </td>
                      {cells.map((t, i) => (
                        <td key={i} className="p-0.5">
                          <div className="rounded text-center font-bold text-white"
                            style={{ background: heatColor(t), opacity: 0.45 + t * 0.5, padding: '6px 0', minWidth: 28, fontSize: 10 }}>
                            {Math.round(800 + t * 800)}
                          </div>
                        </td>
                      ))}
                      <td className="p-0.5">
                        <div className="rounded text-center font-bold text-white"
                          style={{ background: heatColor(avg), opacity: 0.6 + avg * 0.4, padding: '6px 0', minWidth: 36, fontSize: 10, border: '1px solid rgba(255,255,255,0.2)' }}>
                          {Math.round(800 + avg * 800)}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </HCard>

        <HCard title="Home vs Away Positional Difference" subtitle="Δ density — which zones each side of the squad covers more away vs home">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-[11px] mb-1 font-semibold" style={{ color: brandPrimary }}>Home — squad average</div>
              <PositionalHeatmap width={PW_S + 60} height={PH_S + 30} player="ha-home"
                sessionIdx={500} position="CM" intensity={0.95} />
            </div>
            <div>
              <div className="text-[11px] mb-1 font-semibold" style={{ color: brandSecondary }}>Away — squad average</div>
              <PositionalHeatmap width={PW_S + 60} height={PH_S + 30} player="ha-away"
                sessionIdx={501} position="CM" intensity={0.78} />
            </div>
          </div>
          <div className="grid grid-cols-3 mt-4 gap-3 text-[11px]">
            <div className="rounded-lg p-3 border" style={{ borderColor: '#1F2937', background: '#0a0c12' }}>
              <div className="text-gray-500 uppercase tracking-wider text-[9px]">Home territory</div>
              <div className="text-white text-xl font-black">+8.4%</div>
              <div className="text-gray-400">more time in opp half at home</div>
            </div>
            <div className="rounded-lg p-3 border" style={{ borderColor: '#1F2937', background: '#0a0c12' }}>
              <div className="text-gray-500 uppercase tracking-wider text-[9px]">Defensive shape (away)</div>
              <div className="text-white text-xl font-black">−12 m</div>
              <div className="text-gray-400">deeper defensive line away</div>
            </div>
            <div className="rounded-lg p-3 border" style={{ borderColor: '#1F2937', background: '#0a0c12' }}>
              <div className="text-gray-500 uppercase tracking-wider text-[9px]">Sprint volume</div>
              <div className="text-white text-xl font-black">+14%</div>
              <div className="text-gray-400">higher away (more transitions)</div>
            </div>
          </div>
        </HCard>
      </Section>

      {/* ─── 6. WELFARE & LOAD MONITORING (optional) ───────────────── */}
      {includeWelfareSection && (
        <Section title={`6 · ${welfareLabel}`}
          subtitle="28-day rolling load grid with threshold flags. Cells exceeding the recommended weekly load cap (Karen Carney Review compliance context) are highlighted." accentColor="#EC4899">
          <HCard title="28-Day Rolling Load" subtitle="Rows = player · columns = day · cell = AU load · 🚩 cells exceed weekly cap">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[10px]">
                <thead>
                  <tr>
                    <th className="text-left p-1 text-gray-500 font-semibold sticky left-0 bg-[#0d1117]">Player</th>
                    {Array.from({ length: 28 }).map((_, i) => (
                      <th key={i} className={`p-0.5 text-gray-500 font-semibold ${i % 7 === 5 ? 'border-l-2 border-pink-700/30' : ''}`}>{i + 1}</th>
                    ))}
                    <th className="p-1 text-gray-400 font-semibold">Rest</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map(p => {
                    let restDays = 0
                    let weekRunning = 0
                    let weekFlagged = false
                    const cells = Array.from({ length: 28 }, (_, i) => {
                      const dayOfWeek = i % 7
                      const isMatchDay = dayOfWeek === 5
                      const isRestDay = dayOfWeek === 6
                      const baseRange = p.group === 'Forwards' ? [0.5, 0.95]
                        : p.group === 'Midfielders' ? [0.55, 0.98]
                        : p.group === 'Goalkeeper' ? [0.15, 0.4]
                        : [0.45, 0.85]
                      const r = hashAt(`${p.name}-w28-${i}`, 109)
                      let t = isRestDay ? 0.05 : isMatchDay ? 0.92 + r * 0.08 : baseRange[0] + r * (baseRange[1] - baseRange[0])
                      if (isRestDay) restDays++
                      // Reset weekly cap at start of each week
                      if (dayOfWeek === 0) { weekRunning = 0; weekFlagged = false }
                      weekRunning += t
                      const overCap = weekRunning > 4.6 // ≈ 6 days × 0.77 average — over this is high weekly load
                      if (overCap) weekFlagged = true
                      return { t, isRestDay, isMatchDay, overCap, weekFlagged }
                    })
                    return (
                      <tr key={p.name} className="border-t border-gray-900">
                        <td className="p-1 text-white whitespace-nowrap sticky left-0 bg-[#0d1117]">
                          {p.name} <span className="text-gray-600">· {p.position}</span>
                        </td>
                        {cells.map((c, i) => (
                          <td key={i} className={`p-0.5 ${i % 7 === 5 ? 'border-l-2 border-pink-700/30' : ''}`}>
                            <div className="rounded text-center font-bold text-white relative"
                              style={{
                                background: c.isRestDay ? '#0a0c12' : heatColor(c.t),
                                opacity: c.isRestDay ? 0.5 : 0.4 + c.t * 0.55,
                                padding: '4px 0',
                                minWidth: 16,
                                fontSize: 8,
                                border: c.overCap ? '1.5px solid #EC4899' : c.isRestDay ? '1px dashed rgba(255,255,255,0.15)' : 'none',
                              }}>
                              {c.isRestDay ? 'R' : Math.round(600 + c.t * 800)}
                              {c.overCap && (
                                <span style={{ position: 'absolute', top: -4, right: -2, fontSize: 8 }}>🚩</span>
                              )}
                            </div>
                          </td>
                        ))}
                        <td className="p-1 text-center font-bold" style={{ color: '#22C55E' }}>{restDays}d</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap gap-3 mt-3 text-[10px] text-gray-400">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: HEAT_STOPS[1] }} />Optimal load</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: HEAT_STOPS[3] }} />Match-day (peak)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-pink-500" />Weekly cap exceeded — Carney threshold</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-dashed border-gray-500" />Rest day</span>
            </div>
          </HCard>

          <HCard title="Rest Day Compliance" subtitle="Required minimum: 1 full rest day every 7 days. Visual confirms each player's weekly recovery is logged.">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {players.map(p => {
                const weeks = [0, 1, 2, 3]
                const compliance = weeks.map(w => {
                  // Stable per-player compliance — most weeks compliant, occasional miss
                  return hashAt(`${p.name}-rest-${w}`, 113) > 0.15
                })
                const okCount = compliance.filter(Boolean).length
                return (
                  <div key={p.name} className="rounded-lg p-2 border"
                    style={{ background: '#0a0c12', borderColor: okCount === 4 ? 'rgba(34,197,94,0.25)' : 'rgba(236,72,153,0.4)' }}>
                    <div className="text-[10px] font-bold text-white truncate">{p.name}</div>
                    <div className="text-[9px] text-gray-500 mb-1.5">{p.position}</div>
                    <div className="flex gap-1">
                      {compliance.map((ok, w) => (
                        <div key={w} className="flex-1 h-2 rounded" title={`Week ${w + 1}`}
                          style={{ background: ok ? '#22C55E' : '#EC4899' }} />
                      ))}
                    </div>
                    <div className="text-[9px] mt-1.5 font-semibold"
                      style={{ color: okCount === 4 ? '#22C55E' : '#EC4899' }}>
                      {okCount}/4 weeks compliant
                    </div>
                  </div>
                )
              })}
            </div>
          </HCard>
        </Section>
      )}

      <div className="text-[10px] text-gray-700 text-center pt-2">
        GPS data sourced from Lumio GPS · 10Hz sampling · Demo data shown — connect Johan Sports or import via CSV for live feed
      </div>
    </div>
  )
}
