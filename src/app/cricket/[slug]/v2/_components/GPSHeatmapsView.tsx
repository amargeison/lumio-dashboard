'use client'

import { useState, type ReactNode } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '../_lib/theme'
import { FONT, FONT_MONO } from '../_lib/theme'
import { Icon } from './Icon'
import { Card, SectionHead } from './Modules'

// ─── Types & helpers ───────────────────────────────────────────────────

type Common = { T: ThemeTokens; accent: AccentTokens; density: Density }

// Green → amber → red heat scale. v ∈ [0,1].
function heat(v: number): string {
  const c = Math.max(0, Math.min(1, v))
  const hue = 130 - c * 130
  const sat = 60 + c * 18
  const lig = 46 - c * 6
  return `hsl(${hue}, ${sat}%, ${lig}%)`
}

function heatGlow(v: number): string {
  const c = Math.max(0, Math.min(1, v))
  const hue = 130 - c * 130
  return `hsla(${hue}, 80%, 55%, ${0.2 + c * 0.5})`
}

// ─── Mock domain data ──────────────────────────────────────────────────

const FIELDERS = [
  { id: 'patel',     name: 'K. Patel',     role: 'Cover'        },
  { id: 'reed',      name: 'A. Reed',      role: 'Mid-off'      },
  { id: 'whitlock',  name: 'J. Whitlock',  role: 'Square leg'   },
  { id: 'hartley',   name: 'D. Hartley',   role: 'Slip'         },
  { id: 'odoherty',  name: 'R. O’Doherty', role: 'Mid-on'  },
  { id: 'foster',    name: 'T. Foster',    role: 'Third man'    },
  { id: 'marsh',     name: 'L. Marsh',     role: 'Fine leg'     },
] as const

type FielderId = typeof FIELDERS[number]['id']

const MATCHES = [
  { id: 'm5', vs: 'Loxwood',     date: '26 Apr', state: 'live'   },
  { id: 'm4', vs: 'Easthaven CCC',  date: '21 Apr', state: 'recent' },
  { id: 'm3', vs: 'Aldermount County', date: '19 Apr', state: 'recent' },
  { id: 'm2', vs: 'Tideford County',date: '16 Apr', state: 'recent' },
  { id: 'm1', vs: 'Calderbrook CCC', date: '12 Apr', state: 'recent' },
] as const

// Standard fielding positions on a right-hand-batter oval. cx/cy in viewBox units.
type Pos = { id: string; label: string; cx: number; cy: number }
const POSITIONS: Pos[] = [
  { id: 'wk',     label: 'Wkt-keeper',  cx: 320, cy: 372 },
  { id: 'slip1',  label: '1st Slip',    cx: 358, cy: 372 },
  { id: 'slip2',  label: '2nd Slip',    cx: 388, cy: 374 },
  { id: 'gully',  label: 'Gully',       cx: 420, cy: 360 },
  { id: 'point',  label: 'Point',       cx: 470, cy: 318 },
  { id: 'cover',  label: 'Cover',       cx: 460, cy: 252 },
  { id: 'mid-off',label: 'Mid-off',     cx: 380, cy: 200 },
  { id: 'long-off',label: 'Long-off',   cx: 360, cy: 90  },
  { id: 'mid-on', label: 'Mid-on',      cx: 260, cy: 200 },
  { id: 'mid-wkt',label: 'Mid-wicket',  cx: 200, cy: 254 },
  { id: 'square', label: 'Square leg',  cx: 170, cy: 318 },
  { id: 'fine',   label: 'Fine leg',    cx: 200, cy: 380 },
  { id: 'third',  label: 'Third man',   cx: 460, cy: 408 },
  { id: 'long-on',label: 'Long-on',     cx: 280, cy: 90  },
  { id: 'deep-sq',label: 'Deep sq leg', cx: 90,  cy: 320 },
]

// Heat values per fielder per position (0 = rarely there, 1 = primary zone).
const FIELDER_HEAT: Record<FielderId, Record<string, number>> = {
  patel:    { cover: 1.00, point: 0.62, 'mid-off': 0.55, 'long-off': 0.18, gully: 0.10, 'mid-on': 0.22, 'mid-wkt': 0.08 },
  reed:     { 'mid-off': 1.00, 'long-off': 0.74, cover: 0.40, 'mid-on': 0.36, 'long-on': 0.50, point: 0.18 },
  whitlock: { square: 1.00, fine: 0.66, 'deep-sq': 0.78, 'mid-wkt': 0.45, 'mid-on': 0.20, third: 0.12 },
  hartley:  { slip1: 1.00, slip2: 0.88, gully: 0.62, wk: 0.10, point: 0.34 },
  odoherty: { 'mid-on': 1.00, 'long-on': 0.72, 'mid-wkt': 0.46, 'mid-off': 0.38, square: 0.20 },
  foster:   { third: 1.00, fine: 0.58, 'deep-sq': 0.32, point: 0.46, gully: 0.22 },
  marsh:    { fine: 1.00, 'deep-sq': 0.74, square: 0.52, third: 0.40, 'mid-wkt': 0.18 },
}

// 11 squad players (rows of the squad GPS grid).
const SQUAD = [
  'K. Patel', 'A. Reed', 'J. Whitlock', 'D. Hartley', 'R. O’Doherty',
  'T. Foster', 'L. Marsh', 'M. Trescott', 'B. Reynolds', 'N. Bose', 'E. Pierce',
]

const SQUAD_LOAD: number[][] = SQUAD.map((_, r) => {
  return Array.from({ length: 10 }).map((__, c) => {
    const seed = (r * 31 + c * 13 + 7) % 23
    const base = 0.35 + (seed / 23) * 0.55
    const spike = (r === 4 && c === 7) || (r === 7 && c === 5) ? 0.18 : 0
    return Math.max(0, Math.min(1, base + spike))
  })
})

// Bowlers × overs for the bowling load grid (rows × 20 overs of T20 demo).
const BOWLERS = ['Reed', 'Patel', 'Foster', 'Bose', 'Pierce']
const BOWL_GRID: (number | null)[][] = [
  [0.40, 0.55, null, null, 0.62, null, null, null, 0.78, null, null, 0.84, null, null, null, null, 0.92, null, 0.95, null],
  [null, null, 0.48, 0.52, null, 0.60, null, 0.66, null, 0.71, null, null, 0.74, null, null, 0.80, null, null, null, 0.88],
  [null, null, null, null, null, null, 0.42, null, null, null, 0.55, null, null, 0.62, 0.68, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 0.72, null, 0.86],
  [null, null, null, null, null, null, null, 0.38, null, 0.46, null, null, null, null, 0.55, null, null, null, null, null],
]

// Delivery zone heat (length down the pitch × line across the pitch).
// 6 length bands (full → short) × 5 line bands (wide-off → leg).
const DELIVERY_GRID: number[][] = [
  [0.10, 0.22, 0.18, 0.12, 0.06], // full toss / yorker
  [0.32, 0.62, 0.78, 0.48, 0.18], // full
  [0.40, 0.82, 0.94, 0.66, 0.24], // good length
  [0.34, 0.70, 0.86, 0.55, 0.22], // back-of-length
  [0.20, 0.42, 0.50, 0.35, 0.12], // short
  [0.08, 0.16, 0.18, 0.12, 0.04], // bouncer
]

// 28-day ACWR (acute:chronic workload ratio). Safe band 0.8–1.3, danger > 1.5.
const ACWR_28: { d: number; v: number }[] = Array.from({ length: 28 }).map((_, i) => {
  const wave = Math.sin(i / 4) * 0.32
  const drift = i / 60
  const v = 0.85 + wave + drift + (i === 22 ? 0.42 : 0) + (i === 25 ? 0.55 : 0)
  return { d: i, v: Math.max(0.5, Math.min(1.95, v)) }
})

// Wagon wheel: 8 segments of run-count.
const WAGON: { angle: number; runs: number; label: string }[] = [
  { angle: -90,  runs: 32, label: 'Straight' },
  { angle: -45,  runs: 14, label: 'Cover' },
  { angle:   0,  runs: 22, label: 'Point' },
  { angle:  45,  runs:  8, label: 'Third man' },
  { angle:  90,  runs:  4, label: 'Fine leg' },
  { angle: 135,  runs: 18, label: 'Square leg' },
  { angle: 180,  runs: 26, label: 'Mid-wicket' },
  { angle: 225,  runs: 12, label: 'Mid-on' },
]

// Crease-to-crease running intensity (12 deliveries).
const RUN_INTENSITY: number[] = [0.10, 0.85, 0.60, 0.20, 0.95, 0.40, 0.20, 0.75, 0.55, 0.10, 0.92, 0.30]

// Distance by intensity zone (m), session A vs session B.
const ZONES = [
  { label: 'Stand', a: 1840, b: 1620, color: 0.05 },
  { label: 'Walk',  a: 2260, b: 1980, color: 0.20 },
  { label: 'Jog',   a: 1640, b: 1880, color: 0.45 },
  { label: 'Run',   a:  920, b: 1240, color: 0.75 },
  { label: 'Sprint',a:  280, b:  410, color: 0.98 },
]

// Home / Away comparison: per-position heat for "Cover" fielder.
const HOME_AWAY = {
  home: { cover: 1.00, point: 0.55, 'mid-off': 0.40, gully: 0.10 },
  away: { cover: 0.78, point: 0.85, 'mid-off': 0.62, gully: 0.30, 'long-off': 0.22 },
}

// ─── Sub-components ────────────────────────────────────────────────────

function Pill({ T, accent, active, onClick, children }: {
  T: ThemeTokens; accent: AccentTokens; active?: boolean; onClick?: () => void; children: ReactNode
}) {
  return (
    <button onClick={onClick}
      style={{
        appearance: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 11.5,
        padding: '5px 11px', borderRadius: 999,
        border: `1px solid ${active ? accent.border : T.border}`,
        background: active ? accent.dim : 'transparent',
        color: active ? accent.hex : T.text2, fontWeight: active ? 600 : 500,
        transition: 'background .12s, color .12s, border-color .12s',
      }}>
      {children}
    </button>
  )
}

function Legend({ T, label, low, high }: { T: ThemeTokens; label: string; low: string; high: string }) {
  const stops = Array.from({ length: 24 }).map((_, i) => heat(i / 23))
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, color: T.text3, fontFamily: FONT_MONO, letterSpacing: '0.06em' }}>
      <span style={{ textTransform: 'uppercase' }}>{label}</span>
      <span>{low}</span>
      <div style={{ display: 'flex', height: 6, width: 130, borderRadius: 3, overflow: 'hidden', border: `1px solid ${T.border}` }}>
        {stops.map((s, i) => <div key={i} style={{ flex: 1, background: s }} />)}
      </div>
      <span>{high}</span>
    </div>
  )
}

// ─── 1. FIELDING POSITION HEATMAP (HERO) ───────────────────────────────

function FieldingHero({ T, accent, density }: Common) {
  const [fid, setFid] = useState<FielderId>('patel')
  const [mid, setMid] = useState<typeof MATCHES[number]['id']>('m5')
  const [hover, setHover] = useState<string | null>(null)

  const fielder = FIELDERS.find(f => f.id === fid)!
  const match = MATCHES.find(m => m.id === mid)!
  const heatMap = FIELDER_HEAT[fid] || {}

  // Drift per match (deterministic, gentle).
  const matchOffset = MATCHES.findIndex(m => m.id === mid) * 0.04

  const positions = POSITIONS.map(p => {
    const v = (heatMap[p.id] ?? 0) - matchOffset
    return { ...p, v: Math.max(0, Math.min(1, v)) }
  })

  const primary = positions.reduce((acc, p) => p.v > acc.v ? p : acc, positions[0])

  return (
    <Card T={T} density={density} style={{ gridColumn: '1 / -1', padding: density.pad + 6 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ fontSize: 10, color: accent.hex, letterSpacing: '0.18em', fontWeight: 700, textTransform: 'uppercase', fontFamily: FONT_MONO, marginBottom: 6 }}>
            Hero · Fielding Position Heatmap
          </div>
          <h2 style={{ margin: 0, fontFamily: FONT, fontSize: density.h1, fontWeight: 600, color: T.text, letterSpacing: '-0.02em', lineHeight: 1.05 }}>
            Where {fielder.name.split(' ')[1]} stood
          </h2>
          <div style={{ marginTop: 6, fontSize: 12.5, color: T.text2 }}>
            Primary zone <span style={{ color: T.text, fontWeight: 600 }}>{primary.label}</span>
            <span style={{ color: T.text3 }}> · drift across {match.vs}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
          <Legend T={T} label="Heat" low="rare" high="primary" />
          <div className="tnum" style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: T.text3, display: 'flex', gap: 10 }}>
            <span>POSITIONS <span style={{ color: T.text }}>{positions.filter(p => p.v > 0.05).length}</span></span>
            <span>·</span>
            <span>OVERS <span style={{ color: T.text }}>50.0</span></span>
            <span>·</span>
            <span>DIST <span style={{ color: T.text }}>9.4 km</span></span>
          </div>
        </div>
      </div>

      {/* Player tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {FIELDERS.map(f => (
          <Pill key={f.id} T={T} accent={accent} active={f.id === fid} onClick={() => setFid(f.id)}>
            {f.name} <span style={{ color: T.text3, marginLeft: 6 }}>{f.role}</span>
          </Pill>
        ))}
      </div>

      {/* Match selector */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {MATCHES.map(m => (
          <Pill key={m.id} T={T} accent={accent} active={m.id === mid} onClick={() => setMid(m.id)}>
            <span style={{ fontFamily: FONT_MONO, marginRight: 6 }}>{m.date}</span>
            vs {m.vs}
            {m.state === 'live' && <span style={{ marginLeft: 6, fontSize: 9, padding: '1px 5px', borderRadius: 3, background: T.bad, color: '#fff', fontWeight: 700, letterSpacing: '0.04em' }}>LIVE</span>}
          </Pill>
        ))}
      </div>

      {/* Field SVG */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '12 / 7', background: T.panel2, borderRadius: density.radius, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
        <svg viewBox="0 0 540 460" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id="fld-grass" cx="50%" cy="50%" r="60%">
              <stop offset="0%"   stopColor="#1a2a1f" />
              <stop offset="100%" stopColor="#0d1812" />
            </radialGradient>
            <pattern id="fld-stripes" x="0" y="0" width="44" height="44" patternUnits="userSpaceOnUse">
              <rect width="44" height="44" fill="rgba(255,255,255,0.012)" />
              <rect width="22" height="44" fill="rgba(255,255,255,0.03)" />
            </pattern>
            {positions.map(p => (
              <radialGradient key={p.id} id={`heat-${p.id}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%"  stopColor={heat(p.v)} stopOpacity={0.7 + p.v * 0.3} />
                <stop offset="55%" stopColor={heat(p.v)} stopOpacity={0.18 + p.v * 0.25} />
                <stop offset="100%"stopColor={heat(p.v)} stopOpacity={0} />
              </radialGradient>
            ))}
            <filter id="fld-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>

          {/* Outfield oval (grass) */}
          <ellipse cx="270" cy="230" rx="248" ry="200" fill="url(#fld-grass)" />
          <ellipse cx="270" cy="230" rx="248" ry="200" fill="url(#fld-stripes)" />
          {/* Boundary rope */}
          <ellipse cx="270" cy="230" rx="248" ry="200" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" />
          {/* 30-yard inner ring */}
          <ellipse cx="270" cy="230" rx="138" ry="108" fill="none" stroke="rgba(255,255,255,0.10)" strokeDasharray="3 3" strokeWidth="1" />

          {/* Pitch strip */}
          <g>
            <rect x="258" y="200" width="24" height="60" fill="#7a6a3a" stroke="rgba(255,255,255,0.18)" strokeWidth="0.8" rx="1" />
            <rect x="258" y="200" width="24" height="60" fill="rgba(255,255,255,0.04)" />
            {/* Crease lines */}
            <line x1="256" y1="208" x2="284" y2="208" stroke="rgba(255,255,255,0.55)" strokeWidth="0.8" />
            <line x1="256" y1="252" x2="284" y2="252" stroke="rgba(255,255,255,0.55)" strokeWidth="0.8" />
            {/* Stumps */}
            <g fill="#d8c89a">
              <rect x="266" y="204" width="1.2" height="4" />
              <rect x="269.4" y="204" width="1.2" height="4" />
              <rect x="272.8" y="204" width="1.2" height="4" />
              <rect x="266" y="252" width="1.2" height="4" />
              <rect x="269.4" y="252" width="1.2" height="4" />
              <rect x="272.8" y="252" width="1.2" height="4" />
            </g>
          </g>

          {/* Heat blobs (large, blurred) */}
          <g filter="url(#fld-glow)">
            {positions.filter(p => p.v > 0.04).map(p => {
              const r = 28 + p.v * 36
              return <circle key={`blob-${p.id}`} cx={p.cx} cy={p.cy} r={r} fill={`url(#heat-${p.id})`} />
            })}
          </g>

          {/* Position markers */}
          {positions.map(p => {
            const isHover = hover === p.id
            const isPrimary = p.id === primary.id && p.v > 0.5
            return (
              <g key={`mk-${p.id}`} onMouseEnter={() => setHover(p.id)} onMouseLeave={() => setHover(null)} style={{ cursor: 'pointer' }}>
                {isPrimary && (
                  <circle cx={p.cx} cy={p.cy} r={10}
                    fill="none" stroke={heat(p.v)} strokeWidth="1.4" opacity="0.9">
                    <animate attributeName="r" values="9;15;9" dur="2.4s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.9;0.2;0.9" dur="2.4s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle cx={p.cx} cy={p.cy} r={p.v > 0.05 ? 4.5 + p.v * 2 : 2.5}
                  fill={p.v > 0.05 ? heat(p.v) : 'rgba(255,255,255,0.18)'}
                  stroke={isHover ? '#fff' : 'rgba(255,255,255,0.4)'} strokeWidth={isHover ? 1.5 : 0.6} />
                <text x={p.cx} y={p.cy - 9} textAnchor="middle"
                  fontFamily={FONT_MONO} fontSize="7.2"
                  fill={p.v > 0.4 ? '#fff' : 'rgba(255,255,255,0.45)'}
                  letterSpacing="0.04em">
                  {p.label.toUpperCase()}
                </text>
                {p.v > 0.05 && (
                  <text x={p.cx} y={p.cy + 14} textAnchor="middle"
                    fontFamily={FONT_MONO} fontSize="6.8"
                    fill={heat(p.v)} fontWeight="700">
                    {Math.round(p.v * 100)}%
                  </text>
                )}
              </g>
            )
          })}

          {/* Compass / orientation */}
          <g transform="translate(40, 40)" opacity="0.5">
            <circle r="14" fill="none" stroke="rgba(255,255,255,0.2)" />
            <text textAnchor="middle" y="-16" fontSize="8" fill="rgba(255,255,255,0.5)" fontFamily={FONT_MONO}>OFF</text>
            <text textAnchor="middle" y="22" fontSize="8" fill="rgba(255,255,255,0.5)" fontFamily={FONT_MONO}>LEG</text>
          </g>
        </svg>

        {/* Hover tooltip */}
        {hover && (() => {
          const p = positions.find(x => x.id === hover)!
          return (
            <div style={{
              position: 'absolute', bottom: 12, right: 12,
              background: 'rgba(11,14,20,0.92)', border: `1px solid ${accent.border}`,
              borderRadius: 8, padding: '8px 12px', fontSize: 11.5, color: T.text,
              backdropFilter: 'blur(6px)', minWidth: 140,
            }}>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>{p.label}</div>
              <div style={{ color: T.text3, fontFamily: FONT_MONO, fontSize: 10 }}>
                heat <span style={{ color: heat(p.v) }}>{Math.round(p.v * 100)}%</span>
              </div>
            </div>
          )
        })()}
      </div>

      {/* Stat strip below */}
      <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {[
          { k: 'Primary zone',   v: primary.label,                    s: `${Math.round(primary.v * 100)}% of innings` },
          { k: 'Distance',       v: '9.4 km',                          s: '+0.3 vs avg' },
          { k: 'Sprints',        v: '32',                              s: '4 high-speed efforts' },
          { k: 'Catches taken',  v: fid === 'hartley' ? '3' : '1',     s: 'incl. 1 outside ring' },
        ].map(s => (
          <div key={s.k} style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: density.radius, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, color: T.text3, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: FONT_MONO }}>{s.k}</div>
            <div className="tnum" style={{ fontSize: 17, color: T.text, fontWeight: 600, marginTop: 2 }}>{s.v}</div>
            <div style={{ fontSize: 10.5, color: T.text2 }}>{s.s}</div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ─── 2. BATTING MOVEMENT HEATMAP ───────────────────────────────────────

function BattingPitchStrip({ T, accent }: Common) {
  // 24 positions across the strip showing batter movement intensity.
  const moves = Array.from({ length: 24 }).map((_, i) => {
    const seed = (i * 37 + 11) % 100
    return Math.max(0.05, Math.min(1, 0.3 + Math.sin(i / 3) * 0.3 + seed / 240))
  })
  return (
    <div style={{ width: '100%' }}>
      <svg viewBox="0 0 320 110" width="100%">
        <defs>
          <linearGradient id="bat-pitch" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7a6a3a" />
            <stop offset="100%" stopColor="#574826" />
          </linearGradient>
        </defs>
        <rect x="20" y="30" width="280" height="50" fill="url(#bat-pitch)" stroke="rgba(255,255,255,0.16)" rx="2" />
        {/* crease lines */}
        <line x1="38" y1="28" x2="38" y2="82" stroke="rgba(255,255,255,0.4)" />
        <line x1="282" y1="28" x2="282" y2="82" stroke="rgba(255,255,255,0.4)" />
        {/* Stumps */}
        <g fill="#d8c89a">
          <rect x="32" y="48" width="1.4" height="14" />
          <rect x="35" y="48" width="1.4" height="14" />
          <rect x="38" y="48" width="1.4" height="14" />
          <rect x="278" y="48" width="1.4" height="14" />
          <rect x="281" y="48" width="1.4" height="14" />
          <rect x="284" y="48" width="1.4" height="14" />
        </g>
        {/* Heat trail */}
        {moves.map((v, i) => (
          <circle key={i} cx={20 + (i + 0.5) * (280 / moves.length)} cy={55} r={3 + v * 8}
            fill={heat(v)} fillOpacity={0.18 + v * 0.4} />
        ))}
        {/* Path of running */}
        <path
          d={moves.map((v, i) => `${i === 0 ? 'M' : 'L'} ${20 + (i + 0.5) * (280 / moves.length)} ${55 - (v - 0.5) * 16}`).join(' ')}
          fill="none" stroke={accent.hex} strokeWidth="1.4" opacity="0.85" />
        {/* End labels */}
        <text x="20" y="100" fontSize="8.5" fill={T.text3} fontFamily={FONT_MONO}>NON-STRIKER</text>
        <text x="300" y="100" textAnchor="end" fontSize="8.5" fill={T.text3} fontFamily={FONT_MONO}>STRIKER</text>
      </svg>
    </div>
  )
}

function WagonWheel({ T, accent, density }: Common) {
  const max = Math.max(...WAGON.map(w => w.runs))
  const cx = 130, cy = 130, R = 110
  return (
    <svg viewBox="0 0 260 260" width="100%">
      <defs>
        <radialGradient id="ww-grass" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1a2a1f" />
          <stop offset="100%" stopColor="#0d1812" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={R} fill="url(#ww-grass)" stroke="rgba(255,255,255,0.18)" />
      <circle cx={cx} cy={cy} r={R * 0.45} fill="none" stroke="rgba(255,255,255,0.08)" strokeDasharray="2 3" />
      {/* Segments */}
      {WAGON.map((w, i) => {
        const intensity = w.runs / max
        const a0 = (w.angle - 22.5) * Math.PI / 180
        const a1 = (w.angle + 22.5) * Math.PI / 180
        const r1 = R * (0.3 + intensity * 0.65)
        const x0 = cx + Math.cos(a0) * r1
        const y0 = cy + Math.sin(a0) * r1
        const x1 = cx + Math.cos(a1) * r1
        const y1 = cy + Math.sin(a1) * r1
        const path = `M ${cx} ${cy} L ${x0} ${y0} A ${r1} ${r1} 0 0 1 ${x1} ${y1} Z`
        return <path key={i} d={path} fill={heat(intensity)} fillOpacity={0.55} stroke={heat(intensity)} strokeWidth="1" />
      })}
      {/* Run lines (rays) */}
      {WAGON.map((w, i) => {
        const a = w.angle * Math.PI / 180
        const r = R * (0.3 + (w.runs / max) * 0.65)
        return (
          <g key={`r-${i}`}>
            <line x1={cx} y1={cy} x2={cx + Math.cos(a) * r} y2={cy + Math.sin(a) * r}
              stroke={heat(w.runs / max)} strokeWidth="1.4" opacity="0.9" />
            <text x={cx + Math.cos(a) * (R + 8)} y={cy + Math.sin(a) * (R + 8) + 3}
              textAnchor="middle" fontSize="8" fill={T.text3} fontFamily={FONT_MONO}>
              {w.runs}
            </text>
          </g>
        )
      })}
      {/* Centre */}
      <circle cx={cx} cy={cy} r="3" fill={accent.hex} />
    </svg>
  )
}

function BattingMovement({ T, accent, density }: Common) {
  const totalRuns = WAGON.reduce((s, w) => s + w.runs, 0)
  return (
    <Card T={T} density={density} style={{ gridColumn: '1 / -1' }}>
      <SectionHead T={T} title="Batting Movement Heatmap"
        right={<><Icon name="bars" size={11} /> <span>K. Patel · 136 (88) vs Easthaven CCC</span></>} />
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 14 }}>
        <div>
          <div style={{ fontSize: 10.5, color: T.text3, fontFamily: FONT_MONO, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
            Crease-to-crease movement
          </div>
          <BattingPitchStrip T={T} accent={accent} density={density} />
          <div style={{ marginTop: 8, fontSize: 11, color: T.text2, lineHeight: 1.5 }}>
            Heat trail tracks bat positioning during the innings — denser zones show where Patel guarded the crease vs ran for runs.
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10.5, color: T.text3, fontFamily: FONT_MONO, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
            Shot zones (wagon wheel)
          </div>
          <WagonWheel T={T} accent={accent} density={density} />
          <div className="tnum" style={{ marginTop: 8, fontSize: 11, color: T.text2, display: 'flex', justifyContent: 'space-between' }}>
            <span>Total runs <span style={{ color: T.text, fontWeight: 600 }}>{totalRuns}</span></span>
            <span>Boundaries <span style={{ color: accent.hex, fontWeight: 600 }}>14</span></span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10.5, color: T.text3, fontFamily: FONT_MONO, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
            Between-wickets running
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {RUN_INTENSITY.map((v, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 9, color: T.text3, fontFamily: FONT_MONO, width: 18 }}>{String(i + 1).padStart(2, '0')}</span>
                <div style={{ flex: 1, height: 10, background: T.panel2, borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
                  <div style={{ width: `${v * 100}%`, height: '100%', background: heat(v), boxShadow: v > 0.7 ? `0 0 8px ${heatGlow(v)}` : 'none' }} />
                </div>
                <span className="tnum" style={{ fontSize: 9.5, color: T.text2, fontFamily: FONT_MONO, width: 32, textAlign: 'right' }}>
                  {v > 0.85 ? 'sprint' : v > 0.55 ? 'run' : v > 0.25 ? 'jog' : 'walk'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

// ─── 3. BOWLING LOAD HEATMAP ───────────────────────────────────────────

function BowlingOverGrid({ T, accent, density }: Common) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: T.text3, fontFamily: FONT_MONO, marginBottom: 6 }}>
        <span style={{ width: 56 }} />
        {Array.from({ length: 20 }).map((_, i) => (
          <span key={i} style={{ flex: 1, textAlign: 'center' }}>{i + 1}</span>
        ))}
      </div>
      {BOWLERS.map((name, r) => (
        <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
          <span style={{ width: 56, fontSize: 11, color: T.text2 }}>{name}</span>
          {BOWL_GRID[r].map((v, c) => (
            <div key={c} style={{
              flex: 1, aspectRatio: '1', borderRadius: 3,
              background: v == null ? 'transparent' : heat(v),
              border: `1px solid ${v == null ? T.border : 'transparent'}`,
              boxShadow: v != null && v > 0.8 ? `0 0 6px ${heatGlow(v)}` : 'none',
              display: 'grid', placeItems: 'center',
              fontSize: 8.5, color: v != null && v > 0.5 ? '#fff' : T.text3, fontFamily: FONT_MONO,
            }}>
              {v != null ? Math.round(v * 10) : ''}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function DeliveryZone({ T, accent }: { T: ThemeTokens; accent: AccentTokens }) {
  const lengths = ['Yorker', 'Full', 'Good', 'Back', 'Short', 'Bouncer']
  const lines = ['Wide', 'Off', 'Mid', 'Leg', 'Wide L']
  return (
    <div>
      <svg viewBox="0 0 220 280" width="100%">
        <defs>
          <linearGradient id="dz-pitch" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7a6a3a" />
            <stop offset="100%" stopColor="#3f3320" />
          </linearGradient>
        </defs>
        <rect x="40" y="20" width="140" height="240" fill="url(#dz-pitch)" stroke="rgba(255,255,255,0.18)" rx="2" />
        {/* Heat cells */}
        {DELIVERY_GRID.map((row, ri) =>
          row.map((v, ci) => (
            <rect key={`${ri}-${ci}`}
              x={40 + ci * (140 / 5)} y={20 + ri * (240 / 6)}
              width={140 / 5} height={240 / 6}
              fill={heat(v)} fillOpacity={0.15 + v * 0.65}
              stroke="rgba(255,255,255,0.06)" strokeWidth="0.4" />
          ))
        )}
        {/* Crease */}
        <line x1="40" y1="245" x2="180" y2="245" stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
        <g fill="#d8c89a">
          <rect x="106" y="248" width="1.6" height="6" />
          <rect x="110" y="248" width="1.6" height="6" />
          <rect x="114" y="248" width="1.6" height="6" />
        </g>
        {/* Length labels */}
        {lengths.map((l, i) => (
          <text key={l} x="34" y={20 + (i + 0.6) * (240 / 6)} textAnchor="end" fontSize="8" fill={T.text3} fontFamily={FONT_MONO}>{l.toUpperCase()}</text>
        ))}
        {/* Line labels */}
        {lines.map((l, i) => (
          <text key={l} x={40 + (i + 0.5) * (140 / 5)} y={14} textAnchor="middle" fontSize="7.5" fill={T.text3} fontFamily={FONT_MONO}>{l.toUpperCase()}</text>
        ))}
      </svg>
    </div>
  )
}

function ACWRCalendar({ T, accent }: { T: ThemeTokens; accent: AccentTokens }) {
  const SAFE_HI = 1.3
  const DANGER  = 1.5
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10.5, color: T.text3, fontFamily: FONT_MONO, marginBottom: 8 }}>
        <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span>
        <span style={{ marginLeft: 'auto', color: T.text2 }}>safe 0.8–1.3 · danger &gt;1.5</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {ACWR_28.map(({ d, v }) => {
          const danger = v >= DANGER
          const warn   = v > SAFE_HI && !danger
          // Map ACWR 0.5–1.95 → 0–1 scale for colour.
          const c = Math.max(0, Math.min(1, (v - 0.5) / 1.5))
          return (
            <div key={d} style={{
              aspectRatio: '1', borderRadius: 5,
              background: heat(c), padding: 4,
              border: `1px solid ${danger ? '#ff5a4d' : warn ? T.borderHi : 'transparent'}`,
              boxShadow: danger ? `0 0 0 1px #ff5a4d, 0 0 12px rgba(255,90,77,0.6)` : 'none',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              position: 'relative',
            }}>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', fontFamily: FONT_MONO }}>{d + 1}</span>
              <span className="tnum" style={{ fontSize: 11, color: '#fff', fontWeight: 700, fontFamily: FONT_MONO, textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
                {v.toFixed(2)}
              </span>
              {danger && (
                <span style={{ position: 'absolute', top: 3, right: 4, fontSize: 8, color: '#fff', fontWeight: 800, fontFamily: FONT_MONO }}>!</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function BowlingLoad({ T, accent, density }: Common) {
  const flagged = ACWR_28.filter(d => d.v >= 1.5).length
  return (
    <Card T={T} density={density} style={{ gridColumn: '1 / -1' }}>
      <SectionHead T={T} title="Bowling Load Heatmap"
        right={
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {flagged > 0 && (
              <span style={{ padding: '2px 7px', borderRadius: 4, background: 'rgba(255,90,77,0.16)', color: '#ff5a4d', fontWeight: 700, fontSize: 10, letterSpacing: '0.06em' }}>
                {flagged} ACWR FLAG{flagged === 1 ? '' : 'S'}
              </span>
            )}
            <Icon name="flame" size={11} />
          </span>
        } />
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14 }}>
        <div>
          <div style={{ fontSize: 10.5, color: T.text3, fontFamily: FONT_MONO, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
            Over-by-over load · vs Loxwood (1st innings)
          </div>
          <BowlingOverGrid T={T} accent={accent} density={density} />
        </div>
        <div>
          <div style={{ fontSize: 10.5, color: T.text3, fontFamily: FONT_MONO, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
            Delivery zone · A. Reed
          </div>
          <DeliveryZone T={T} accent={accent} />
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 10.5, color: T.text3, fontFamily: FONT_MONO, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>ACWR · rolling 28 days · A. Reed</span>
          <span style={{ flex: 1, height: 1, background: T.border }} />
        </div>
        <ACWRCalendar T={T} accent={accent} />
      </div>
    </Card>
  )
}

// ─── 4. SESSION MOVEMENT HEATMAP ───────────────────────────────────────

function MiniOval({ T, accent, intensity, label, total }: {
  T: ThemeTokens; accent: AccentTokens; intensity: number[]; label: string; total: string
}) {
  const cx = 140, cy = 100
  return (
    <div>
      <div style={{ fontSize: 10.5, color: T.text3, fontFamily: FONT_MONO, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
        {label} <span style={{ color: T.text, marginLeft: 6 }}>{total}</span>
      </div>
      <svg viewBox="0 0 280 200" width="100%">
        <defs>
          <radialGradient id={`mo-${label}`} cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#1a2a1f" />
            <stop offset="100%" stopColor="#0d1812" />
          </radialGradient>
          <filter id={`mo-glow-${label}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.4" />
          </filter>
        </defs>
        <ellipse cx={cx} cy={cy} rx="130" ry="90" fill={`url(#mo-${label})`} stroke="rgba(255,255,255,0.16)" />
        <ellipse cx={cx} cy={cy} rx="64" ry="44" fill="none" stroke="rgba(255,255,255,0.08)" strokeDasharray="2 3" />
        {/* Heat cluster */}
        <g filter={`url(#mo-glow-${label})`}>
          {intensity.map((v, i) => {
            const angle = (i / intensity.length) * Math.PI * 2
            const r = 40 + (i % 3) * 18
            const x = cx + Math.cos(angle) * r
            const y = cy + Math.sin(angle) * r * 0.7
            return <circle key={i} cx={x} cy={y} r={6 + v * 18} fill={heat(v)} fillOpacity={0.4 + v * 0.4} />
          })}
        </g>
      </svg>
    </div>
  )
}

function SessionMovement({ T, accent, density }: Common) {
  const sessA = [0.8, 0.5, 0.92, 0.4, 0.7, 0.55, 0.3, 0.85, 0.6, 0.45, 0.78, 0.32]
  const sessB = [0.55, 0.7, 0.42, 0.8, 0.5, 0.65, 0.9, 0.4, 0.72, 0.6, 0.48, 0.85]
  const totalA = ZONES.reduce((s, z) => s + z.a, 0)
  const totalB = ZONES.reduce((s, z) => s + z.b, 0)
  return (
    <Card T={T} density={density} style={{ gridColumn: '1 / -1' }}>
      <SectionHead T={T} title="Session Movement Heatmap"
        right={<span style={{ color: T.text3 }}>Training · Oakridge Park · 24 Apr</span>} />
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr', gap: 14 }}>
        <div>
          <MiniOval T={T} accent={accent} intensity={sessA} label="Session A" total="6.94 km" />
        </div>
        <div>
          <div style={{ fontSize: 10.5, color: T.text3, fontFamily: FONT_MONO, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
            Distance by intensity
          </div>
          {ZONES.map(z => {
            const tot = z.a + z.b
            const aPct = (z.a / tot) * 100
            return (
              <div key={z.label} style={{ marginBottom: 9 }}>
                <div className="tnum" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.text2, marginBottom: 3, fontFamily: FONT_MONO }}>
                  <span style={{ color: T.text }}>{z.label}</span>
                  <span><span style={{ color: heat(z.color) }}>{z.a}</span> · <span style={{ color: T.text3 }}>{z.b} m</span></span>
                </div>
                <div style={{ display: 'flex', height: 8, borderRadius: 3, overflow: 'hidden', background: T.panel2 }}>
                  <div style={{ width: `${aPct}%`, background: heat(z.color), boxShadow: z.color > 0.7 ? `0 0 6px ${heatGlow(z.color)}` : 'none' }} />
                  <div style={{ width: `${100 - aPct}%`, background: heat(z.color), opacity: 0.3 }} />
                </div>
              </div>
            )
          })}
          <div className="tnum" style={{ marginTop: 10, fontSize: 11, color: T.text3, fontFamily: FONT_MONO, display: 'flex', justifyContent: 'space-between' }}>
            <span>A total <span style={{ color: T.text }}>{totalA.toLocaleString()} m</span></span>
            <span>B total <span style={{ color: T.text }}>{totalB.toLocaleString()} m</span></span>
          </div>
        </div>
        <div>
          <MiniOval T={T} accent={accent} intensity={sessB} label="Session B" total="7.14 km" />
        </div>
      </div>
    </Card>
  )
}

// ─── 5. SQUAD GPS OVERVIEW ─────────────────────────────────────────────

function SquadGrid({ T, accent }: { T: ThemeTokens; accent: AccentTokens }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: T.text3, fontFamily: FONT_MONO, marginBottom: 6 }}>
        <span style={{ width: 110 }} />
        {Array.from({ length: 10 }).map((_, i) => (
          <span key={i} style={{ flex: 1, textAlign: 'center' }}>M{i + 1}</span>
        ))}
      </div>
      {SQUAD.map((name, r) => (
        <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
          <span style={{ width: 110, fontSize: 11, color: T.text2 }}>{name}</span>
          {SQUAD_LOAD[r].map((v, c) => (
            <div key={c} title={`${name} · M${c + 1} · load ${Math.round(v * 100)}`}
              style={{
                flex: 1, height: 18, borderRadius: 3,
                background: heat(v),
                boxShadow: v > 0.85 ? `0 0 8px ${heatGlow(v)}` : 'none',
                border: v > 0.85 ? `1px solid #ff5a4d` : 'none',
              }} />
          ))}
        </div>
      ))}
    </div>
  )
}

function HomeAwayOval({ T, label, data }: { T: ThemeTokens; label: string; data: Record<string, number> }) {
  const positions = POSITIONS.map(p => ({ ...p, v: data[p.id] ?? 0 }))
  return (
    <div>
      <div style={{ fontSize: 10.5, color: T.text3, fontFamily: FONT_MONO, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </div>
      <svg viewBox="0 0 540 460" width="100%">
        <defs>
          <radialGradient id={`ha-${label}`} cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#1a2a1f" />
            <stop offset="100%" stopColor="#0d1812" />
          </radialGradient>
          <filter id={`ha-glow-${label}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>
        <ellipse cx="270" cy="230" rx="248" ry="200" fill={`url(#ha-${label})`} stroke="rgba(255,255,255,0.18)" />
        <ellipse cx="270" cy="230" rx="138" ry="108" fill="none" stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
        <rect x="258" y="200" width="24" height="60" fill="#7a6a3a" stroke="rgba(255,255,255,0.18)" strokeWidth="0.6" />
        <g filter={`url(#ha-glow-${label})`}>
          {positions.filter(p => p.v > 0.05).map(p => (
            <circle key={p.id} cx={p.cx} cy={p.cy} r={20 + p.v * 30}
              fill={heat(p.v)} fillOpacity={0.35 + p.v * 0.35} />
          ))}
        </g>
        {positions.filter(p => p.v > 0.05).map(p => (
          <g key={`d-${p.id}`}>
            <circle cx={p.cx} cy={p.cy} r={3 + p.v * 2} fill={heat(p.v)} stroke="rgba(255,255,255,0.4)" strokeWidth="0.6" />
            <text x={p.cx} y={p.cy - 8} textAnchor="middle" fontSize="8" fill={T.text2} fontFamily={FONT_MONO}>
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

function SquadOverview({ T, accent, density }: Common) {
  return (
    <Card T={T} density={density} style={{ gridColumn: '1 / -1' }}>
      <SectionHead T={T} title="Squad GPS Overview"
        right={<span style={{ color: T.text3 }}>Rolling 10 matches · all formats</span>} />
      <div style={{ marginBottom: 14 }}>
        <SquadGrid T={T} accent={accent} />
      </div>
      <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
        <div style={{ fontSize: 10.5, color: T.text3, fontFamily: FONT_MONO, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
          Home vs Away · Cover fielder positioning drift
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <HomeAwayOval T={T} label="Home · Oakridge Park" data={HOME_AWAY.home} />
          <HomeAwayOval T={T} label="Away · Crown Park Cricket Ground" data={HOME_AWAY.away} />
        </div>
      </div>
    </Card>
  )
}

// ─── Top-level view ────────────────────────────────────────────────────

export function GPSHeatmapsView({ T, accent, density }: Common) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: density.gap }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, paddingBottom: 4 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: accent.hex, letterSpacing: '0.18em', fontWeight: 700, textTransform: 'uppercase', fontFamily: FONT_MONO }}>
            GPS &amp; Load · Heatmaps
          </div>
          <h1 style={{ margin: '4px 0 0', fontFamily: FONT, fontSize: density.h1 - 2, fontWeight: 600, color: T.text, letterSpacing: '-0.02em' }}>
            Movement &amp; load intelligence
          </h1>
        </div>
        <div style={{ fontSize: 11, color: T.text3, fontFamily: FONT_MONO, letterSpacing: '0.06em' }}>
          DATA · JOHAN SPORTS · LAST 5 MATCHES
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: density.gap }}>
        <FieldingHero    T={T} accent={accent} density={density} />
        <BattingMovement T={T} accent={accent} density={density} />
        <BowlingLoad     T={T} accent={accent} density={density} />
        <SessionMovement T={T} accent={accent} density={density} />
        <SquadOverview   T={T} accent={accent} density={density} />
      </div>
    </div>
  )
}
