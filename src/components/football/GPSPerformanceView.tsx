'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Activity, Users, Zap, TrendingUp, Settings, AlertTriangle, CheckCircle2,
  Upload, Gauge, Clock, Heart, Flame, ChevronUp, ChevronDown, ChevronsUp,
} from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import GPSUploadView from './GPSUploadView'

// Showpiece Performance & GPS view. Built for the hardware-partner demo —
// dense, visual, every tab fully populated. Pure inline SVG charts, brand
// colours read from localStorage at mount, deterministic seeding so the
// view is stable across renders.

const FB_PRIMARY = '#003DA5'
const FB_SECONDARY = '#F1C40F'
const CARD = '#111318'
const BORDER = '#1F2937'
const SUB_BG = '#0A0B10'

type Tab = 'session' | 'readiness' | 'trends' | 'compare' | 'sprint' | 'acwr' | 'connect'
type OuterTab = 'performance' | 'upload'

// ─── DEMO DATA ─────────────────────────────────────────────────────────────
// Player names align with the football pro portal squad (page.tsx).

interface DemoPlayer {
  name: string
  role: string
  group: 'Defenders' | 'Midfielders' | 'Forwards' | 'Goalkeeper'
  distance: number  // km
  hsr: number       // m
  sprints: number
  maxSpeed: number  // km/h
  load: number      // AU
  acwr: number
  acceleration: number
  deceleration: number
  readiness: number // 0-100
  sleep: number     // 0-10
  soreness: number  // 0-10 (10 = none, 0 = severe)
  fatigue: number   // 0-10 (10 = fresh)
  mood: number      // 0-10
}

const DEMO_PLAYERS: DemoPlayer[] = [
  { name: 'Tom Fletcher',  role: 'LB',  group: 'Defenders',   distance: 10.8, hsr: 612, sprints: 18, maxSpeed: 30.5, load: 842, acwr: 1.08, acceleration: 28, deceleration: 24, readiness: 86, sleep: 8.4, soreness: 7, fatigue: 8, mood: 9 },
  { name: 'Daniel Webb',   role: 'CB',  group: 'Defenders',   distance: 9.4,  hsr: 348, sprints: 8,  maxSpeed: 28.2, load: 712, acwr: 0.94, acceleration: 18, deceleration: 22, readiness: 91, sleep: 8.1, soreness: 9, fatigue: 9, mood: 8 },
  { name: 'Marcus Reid',   role: 'CB',  group: 'Defenders',   distance: 9.1,  hsr: 296, sprints: 6,  maxSpeed: 27.5, load: 685, acwr: 0.86, acceleration: 16, deceleration: 19, readiness: 78, sleep: 6.8, soreness: 6, fatigue: 7, mood: 7 },
  { name: 'Kyle Osei',     role: 'RB',  group: 'Defenders',   distance: 10.4, hsr: 552, sprints: 16, maxSpeed: 30.0, load: 808, acwr: 1.02, acceleration: 27, deceleration: 23, readiness: 88, sleep: 8.0, soreness: 8, fatigue: 8, mood: 9 },
  { name: 'Liam Barker',   role: 'CM',  group: 'Midfielders', distance: 11.5, hsr: 480, sprints: 14, maxSpeed: 29.2, load: 922, acwr: 0.95, acceleration: 26, deceleration: 28, readiness: 82, sleep: 7.5, soreness: 7, fatigue: 7, mood: 8 },
  { name: 'Connor Walsh',  role: 'CM',  group: 'Midfielders', distance: 11.1, hsr: 502, sprints: 12, maxSpeed: 28.8, load: 905, acwr: 1.18, acceleration: 24, deceleration: 26, readiness: 74, sleep: 6.2, soreness: 6, fatigue: 6, mood: 7 },
  { name: 'Ryan Cole',     role: 'CM',  group: 'Midfielders', distance: 11.4, hsr: 624, sprints: 17, maxSpeed: 30.4, load: 938, acwr: 1.06, acceleration: 28, deceleration: 27, readiness: 87, sleep: 8.2, soreness: 8, fatigue: 9, mood: 9 },
  { name: 'Paul Granger',  role: 'CDM', group: 'Midfielders', distance: 9.0,  hsr: 270, sprints: 6,  maxSpeed: 26.5, load: 720, acwr: 0.78, acceleration: 14, deceleration: 18, readiness: 89, sleep: 8.5, soreness: 9, fatigue: 9, mood: 8 },
  { name: 'Dean Morris',   role: 'LW',  group: 'Forwards',    distance: 11.2, hsr: 832, sprints: 22, maxSpeed: 32.1, load: 1042, acwr: 1.42, acceleration: 32, deceleration: 30, readiness: 62, sleep: 5.8, soreness: 5, fatigue: 5, mood: 6 },
  { name: 'Sam Porter',    role: 'ST',  group: 'Forwards',    distance: 10.1, hsr: 736, sprints: 20, maxSpeed: 31.0, load: 945, acwr: 0.91, acceleration: 30, deceleration: 28, readiness: 84, sleep: 7.8, soreness: 7, fatigue: 8, mood: 8 },
  { name: 'Myles Okafor',  role: 'LW',  group: 'Forwards',    distance: 10.5, hsr: 718, sprints: 19, maxSpeed: 31.4, load: 887, acwr: 1.06, acceleration: 29, deceleration: 27, readiness: 80, sleep: 7.4, soreness: 7, fatigue: 7, mood: 8 },
  { name: 'James Tilley',  role: 'RW',  group: 'Forwards',    distance: 10.7, hsr: 684, sprints: 18, maxSpeed: 31.0, load: 871, acwr: 1.21, acceleration: 28, deceleration: 26, readiness: 76, sleep: 6.5, soreness: 6, fatigue: 6, mood: 7 },
  { name: 'Chris Nwosu',   role: 'ST',  group: 'Forwards',    distance: 9.8,  hsr: 588, sprints: 15, maxSpeed: 29.8, load: 868, acwr: 1.58, acceleration: 26, deceleration: 24, readiness: 54, sleep: 5.5, soreness: 4, fatigue: 4, mood: 5 },
]

// Hash for stable pseudo-random demo data
function dh(seed: string, salt: number): number {
  let h = 2166136261 ^ salt
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  }
  return ((h >>> 0) % 10000) / 10000
}

// ─── COLOUR HELPERS ────────────────────────────────────────────────────────
function acwrColor(v: number) { return v > 1.5 ? '#EF4444' : v > 1.3 ? '#F59E0B' : v < 0.8 ? '#3B82F6' : '#22C55E' }
function acwrLabel(v: number) { return v > 1.5 ? 'High Risk' : v > 1.3 ? 'Caution' : v < 0.8 ? 'Under-trained' : 'Optimal' }
function loadColor(v: number) { return v > 1000 ? '#EF4444' : v > 800 ? '#F59E0B' : '#22C55E' }
function readinessColor(v: number) { return v >= 80 ? '#22C55E' : v >= 65 ? '#F59E0B' : '#EF4444' }
function statusColor(v: number) { return v >= 80 ? '#22C55E' : v >= 65 ? '#F59E0B' : '#EF4444' }
function statusLabel(v: number) { return v >= 80 ? 'Ready' : v >= 65 ? 'Manage' : 'Rest' }

// ─── KPI CARD ───────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, accentColor, icon: Icon, trend }: {
  label: string; value: string | number; sub?: string; accentColor: string
  icon: React.ElementType; trend?: 'up' | 'down' | 'flat'
}) {
  return (
    <div className="rounded-xl p-3.5 transition-all" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${accentColor}1f` }}>
          <Icon size={14} style={{ color: accentColor }} />
        </div>
        {trend && (
          trend === 'up'
            ? <ChevronUp size={14} style={{ color: '#22C55E' }} />
            : trend === 'down'
            ? <ChevronDown size={14} style={{ color: '#EF4444' }} />
            : <span className="text-[10px]" style={{ color: '#6B7280' }}>—</span>
        )}
      </div>
      <p className="text-[10px] uppercase tracking-wider" style={{ color: '#6B7280' }}>{label}</p>
      <p className="text-2xl font-black mt-0.5" style={{ color: '#F9FAFB' }}>{value}</p>
      {sub && <p className="text-[10px] mt-0.5" style={{ color: '#6B7280' }}>{sub}</p>}
    </div>
  )
}

// ─── DISTANCE BY ZONE BAR (per player) ─────────────────────────────────────
function DistanceZoneBar({ distance, sprintsPct, hsrPct }: {
  distance: number; sprintsPct: number; hsrPct: number
}) {
  // Zones (5): Stand, Walk, Jog, Run, Sprint — proportions sum to 100.
  const sprintShare = sprintsPct
  const hsrShare = hsrPct
  const standShare = 18
  const walkShare = 30
  const jogShare = Math.max(8, 100 - standShare - walkShare - hsrShare - sprintShare)
  const runShare = Math.max(0, 100 - standShare - walkShare - jogShare - hsrShare - sprintShare)
  const zones = [
    { name: 'Stand', pct: standShare, c: '#0E7C3A' },
    { name: 'Walk',  pct: walkShare,  c: '#22C55E' },
    { name: 'Jog',   pct: jogShare,   c: '#FACC15' },
    { name: 'Run',   pct: runShare + hsrShare, c: '#F59E0B' },
    { name: 'Sprint', pct: sprintShare, c: '#EF4444' },
  ]
  return (
    <div className="flex h-3 rounded overflow-hidden" title={`${distance} km · ${zones.map(z => `${z.name} ${z.pct.toFixed(0)}%`).join(' · ')}`}>
      {zones.map(z => (
        <div key={z.name} style={{ background: z.c, flex: z.pct, opacity: 0.85 }} />
      ))}
    </div>
  )
}

// ─── SPRINT FREQUENCY LINE CHART ────────────────────────────────────────────
function SprintFrequencyChart() {
  const W = 720, H = 200, padL = 32, padB = 26
  // 6 × 15min blocks = 90 minutes. Sprint count peaks mid-session.
  const blocks = ['0-15', '15-30', '30-45', '45-60', '60-75', '75-90']
  const counts = [22, 36, 31, 18, 28, 14]
  const maxC = Math.max(...counts)
  const innerW = W - padL - 16
  const innerH = H - padB - 16
  const path = counts.map((c, i) => {
    const x = padL + (i / (counts.length - 1)) * innerW
    const y = 16 + innerH - (c / maxC) * innerH
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')
  const areaPath = `${path} L ${padL + innerW} ${16 + innerH} L ${padL} ${16 + innerH} Z`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxHeight: 220 }}>
      <rect width={W} height={H} fill={CARD} rx={8} />
      {[0, 0.25, 0.5, 0.75, 1].map(p => {
        const y = 16 + innerH - p * innerH
        return (
          <g key={p}>
            <line x1={padL} y1={y} x2={W - 8} y2={y} stroke="rgba(255,255,255,0.04)" />
            <text x={padL - 6} y={y + 3} textAnchor="end" fontSize={9} fill="#6B7280">{Math.round(p * maxC)}</text>
          </g>
        )
      })}
      <defs>
        <linearGradient id="sprintGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sprintGrad)" />
      <path d={path} stroke="#F59E0B" strokeWidth={2.5} fill="none" strokeLinecap="round" />
      {counts.map((c, i) => {
        const x = padL + (i / (counts.length - 1)) * innerW
        const y = 16 + innerH - (c / maxC) * innerH
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={4} fill="#F59E0B" />
            <text x={x} y={y - 8} textAnchor="middle" fontSize={9} fontWeight={700} fill="#F9FAFB">{c}</text>
          </g>
        )
      })}
      {blocks.map((b, i) => (
        <text key={b} x={padL + (i / (counts.length - 1)) * innerW} y={H - 8}
          textAnchor="middle" fontSize={9} fill="#6B7280">{b}m</text>
      ))}
      <text x={padL} y={12} fontSize={10} fontWeight={700} fill="#F9FAFB">Sprints per 15-min block</text>
    </svg>
  )
}

// ─── CIRCULAR READINESS GAUGE ──────────────────────────────────────────────
function ReadinessGauge({ score, size = 80 }: { score: number; size?: number }) {
  const r = size / 2 - 6
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const c = readinessColor(score)
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={c} strokeWidth={6}
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x={size / 2} y={size / 2 + 1} textAnchor="middle" dominantBaseline="middle"
        fontSize={size * 0.32} fontWeight={900} fill="#F9FAFB">{score}</text>
    </svg>
  )
}

// ─── 4-FACTOR MINI BARS ────────────────────────────────────────────────────
function FactorBars({ sleep, soreness, fatigue, mood }: {
  sleep: number; soreness: number; fatigue: number; mood: number
}) {
  const factors = [
    { l: 'Slp', v: (sleep / 10) * 100 },
    { l: 'Sor', v: (soreness / 10) * 100 },
    { l: 'Fat', v: (fatigue / 10) * 100 },
    { l: 'Mood', v: (mood / 10) * 100 },
  ]
  return (
    <div className="grid grid-cols-4 gap-1.5 w-full">
      {factors.map(f => (
        <div key={f.l} className="flex flex-col items-center gap-0.5">
          <div className="w-full h-10 rounded relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div className="absolute bottom-0 left-0 right-0 transition-all"
              style={{ height: `${f.v}%`, background: f.v >= 75 ? '#22C55E' : f.v >= 55 ? '#F59E0B' : '#EF4444' }} />
          </div>
          <span className="text-[9px]" style={{ color: '#6B7280' }}>{f.l}</span>
        </div>
      ))}
    </div>
  )
}

// ─── 30-DAY ROLLING TEAM LOAD CHART ────────────────────────────────────────
function RollingLoadChart() {
  const W = 760, H = 240, padL = 36, padB = 26
  const innerW = W - padL - 16
  const innerH = H - padB - 24
  // Demo: 30-day rolling team avg load with weekly cycles (high midweek, low matchday).
  const days = Array.from({ length: 30 }, (_, i) => {
    const cycle = i % 7
    const base = cycle === 5 ? 1080 : cycle === 6 ? 220 : cycle === 2 ? 980 : cycle === 3 ? 720 : 740
    const noise = (dh(`load-${i}`, 11) - 0.5) * 80
    return Math.round(base + noise)
  })
  const target = 800
  const maxL = 1200
  const path = days.map((v, i) => {
    const x = padL + (i / (days.length - 1)) * innerW
    const y = 18 + innerH - (v / maxL) * innerH
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')
  const targetY = 18 + innerH - (target / maxL) * innerH
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxHeight: 260 }}>
      <rect width={W} height={H} fill={CARD} rx={8} />
      {[0, 0.25, 0.5, 0.75, 1].map(p => {
        const y = 18 + innerH - p * innerH
        return (
          <g key={p}>
            <line x1={padL} y1={y} x2={W - 8} y2={y} stroke="rgba(255,255,255,0.04)" />
            <text x={padL - 6} y={y + 3} textAnchor="end" fontSize={9} fill="#6B7280">{Math.round(p * maxL)}</text>
          </g>
        )
      })}
      <line x1={padL} y1={targetY} x2={W - 8} y2={targetY} stroke="#F1C40F" strokeWidth={1.5} strokeDasharray="6 4" />
      <text x={W - 12} y={targetY - 4} textAnchor="end" fontSize={10} fontWeight={700} fill="#F1C40F">target {target}</text>
      <defs>
        <linearGradient id="loadGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#003DA5" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#003DA5" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L ${padL + innerW} ${18 + innerH} L ${padL} ${18 + innerH} Z`} fill="url(#loadGrad)" />
      <path d={path} stroke="#3B82F6" strokeWidth={2.2} fill="none" strokeLinecap="round" />
      {days.map((v, i) => {
        const x = padL + (i / (days.length - 1)) * innerW
        const y = 18 + innerH - (v / maxL) * innerH
        return <circle key={i} cx={x} cy={y} r={2} fill="#3B82F6" />
      })}
      <text x={padL} y={14} fontSize={10} fontWeight={700} fill="#F9FAFB">Team avg load · last 30 days (AU)</text>
      <text x={padL} y={H - 8} fontSize={9} fill="#6B7280">D-30</text>
      <text x={padL + innerW} y={H - 8} fontSize={9} fill="#6B7280" textAnchor="end">today</text>
    </svg>
  )
}

// ─── PLAYER LOAD SPARKLINE ─────────────────────────────────────────────────
function PlayerSparkline({ seed, color }: { seed: string; color: string }) {
  const W = 120, H = 36
  const points = Array.from({ length: 14 }, (_, i) => 0.4 + dh(`${seed}-${i}`, 13) * 0.6)
  const max = Math.max(...points)
  const path = points.map((v, i) => {
    const x = (i / (points.length - 1)) * W
    const y = H - 4 - (v / max) * (H - 8)
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <path d={path} stroke={color} strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <circle cx={W} cy={H - 4 - (points[points.length - 1] / max) * (H - 8)} r={2.5} fill={color} />
    </svg>
  )
}

// ─── WEEK-ON-WEEK GROUPED BARS ─────────────────────────────────────────────
function WeekComparisonBars() {
  const W = 720, H = 220, padL = 36, padB = 28
  const metrics = ['Distance', 'HSR', 'Sprints', 'Max Speed']
  const thisWk = [10.4, 580, 16, 30.8]
  const lastWk = [10.1, 545, 14, 30.4]
  const seasonAvg = [9.9, 510, 13, 30.0]
  const max = [12, 700, 22, 33]
  const innerW = W - padL - 16
  const innerH = H - padB - 24
  const groupW = innerW / metrics.length
  const barW = (groupW - 16) / 3
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxHeight: 240 }}>
      <rect width={W} height={H} fill={CARD} rx={8} />
      <text x={padL} y={14} fontSize={10} fontWeight={700} fill="#F9FAFB">This week vs Last week vs Season avg</text>
      {metrics.map((m, i) => {
        const groupX = padL + i * groupW + 8
        return (
          <g key={m}>
            {[
              { v: thisWk[i], color: FB_PRIMARY, label: 'This' },
              { v: lastWk[i], color: '#3B82F6', label: 'Last' },
              { v: seasonAvg[i], color: '#6B7280', label: 'Avg' },
            ].map((b, bi) => {
              const h = (b.v / max[i]) * innerH
              const x = groupX + bi * (barW + 4)
              const y = 24 + innerH - h
              return (
                <g key={bi}>
                  <rect x={x} y={y} width={barW} height={h} rx={3}
                    fill={b.color} opacity={0.85} />
                  <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={9} fontWeight={700} fill="#F9FAFB">
                    {typeof b.v === 'number' && b.v < 100 && b.v % 1 !== 0 ? b.v.toFixed(1) : b.v}
                  </text>
                </g>
              )
            })}
            <text x={groupX + (groupW - 16) / 2} y={H - 10} textAnchor="middle" fontSize={10} fontWeight={600} fill="#9CA3AF">{m}</text>
          </g>
        )
      })}
      {/* Legend */}
      <g transform={`translate(${W - 280}, ${H - 14})`}>
        <rect x={0} y={-8} width={10} height={8} fill={FB_PRIMARY} />
        <text x={14} y={-1} fontSize={9} fill="#9CA3AF">This week</text>
        <rect x={80} y={-8} width={10} height={8} fill="#3B82F6" />
        <text x={94} y={-1} fontSize={9} fill="#9CA3AF">Last week</text>
        <rect x={170} y={-8} width={10} height={8} fill="#6B7280" />
        <text x={184} y={-1} fontSize={9} fill="#9CA3AF">Season avg</text>
      </g>
    </svg>
  )
}

// ─── MATCH vs TRAINING GROUPED BARS ────────────────────────────────────────
function MatchVsTrainingBars({ metric }: { metric: 'distance' | 'hsr' | 'sprints' }) {
  const W = 760, H = 280, padL = 96, padB = 20
  const players = DEMO_PLAYERS
  const innerW = W - padL - 16
  const innerH = H - padB - 24
  const max = metric === 'distance' ? 13 : metric === 'hsr' ? 1100 : 25
  const matchVal = (p: DemoPlayer) => metric === 'distance' ? p.distance * 1.08
    : metric === 'hsr' ? p.hsr * 1.15
    : p.sprints + Math.round(dh(p.name + 'm', 17) * 4)
  const trainVal = (p: DemoPlayer) => metric === 'distance' ? p.distance * 0.78
    : metric === 'hsr' ? p.hsr * 0.62
    : Math.max(2, p.sprints - Math.round(dh(p.name + 't', 19) * 6))
  const rowH = innerH / players.length
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxHeight: 320 }}>
      <rect width={W} height={H} fill={CARD} rx={8} />
      <text x={padL} y={14} fontSize={10} fontWeight={700} fill="#F9FAFB">
        {metric === 'distance' ? 'Distance (km)' : metric === 'hsr' ? 'HSR (m)' : 'Sprints'} — match vs training
      </text>
      {players.map((p, i) => {
        const yBase = 24 + i * rowH
        const m = matchVal(p), t = trainVal(p)
        const mw = (m / max) * innerW
        const tw = (t / max) * innerW
        return (
          <g key={p.name}>
            <text x={padL - 6} y={yBase + rowH * 0.55} textAnchor="end" fontSize={9} fill="#9CA3AF">{p.name.split(' ').pop()}</text>
            <rect x={padL} y={yBase + 2} width={mw} height={rowH * 0.4 - 1} fill="#EF4444" opacity={0.85} rx={2} />
            <rect x={padL} y={yBase + rowH * 0.46} width={tw} height={rowH * 0.4 - 1} fill={FB_PRIMARY} opacity={0.85} rx={2} />
            <text x={padL + mw + 4} y={yBase + rowH * 0.34} fontSize={8} fontWeight={700} fill="#F9FAFB">
              {metric === 'distance' ? m.toFixed(1) : Math.round(m)}
            </text>
            <text x={padL + tw + 4} y={yBase + rowH * 0.78} fontSize={8} fontWeight={700} fill="#F9FAFB">
              {metric === 'distance' ? t.toFixed(1) : Math.round(t)}
            </text>
          </g>
        )
      })}
      {/* Legend */}
      <g transform={`translate(${padL}, ${H - 6})`}>
        <rect x={0} y={-8} width={10} height={8} fill="#EF4444" opacity={0.85} />
        <text x={14} y={-1} fontSize={9} fill="#9CA3AF">Match</text>
        <rect x={70} y={-8} width={10} height={8} fill={FB_PRIMARY} opacity={0.85} />
        <text x={84} y={-1} fontSize={9} fill="#9CA3AF">Training avg</text>
      </g>
    </svg>
  )
}

// ─── SPRINT BAND STACKED BARS ──────────────────────────────────────────────
function SprintBandStack({ players }: { players: DemoPlayer[] }) {
  const W = 760, H = 320, padL = 96, padB = 28
  const innerW = W - padL - 16
  const innerH = H - padB - 24
  const rowH = innerH / players.length
  const bands = ['10-20m', '20-30m', '30-40m', '40m+'] as const
  const bandColors = ['#22C55E', '#FACC15', '#F59E0B', '#EF4444']
  const dist = (p: DemoPlayer) => {
    // Pseudo-stable distribution per player
    const r1 = dh(p.name + 'b1', 23), r2 = dh(p.name + 'b2', 29), r3 = dh(p.name + 'b3', 31), r4 = dh(p.name + 'b4', 37)
    const tot = r1 + r2 + r3 + r4
    return [r1, r2, r3, r4].map(v => Math.round((v / tot) * p.sprints))
  }
  const max = Math.max(...players.map(p => p.sprints)) + 2
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxHeight: 360 }}>
      <rect width={W} height={H} fill={CARD} rx={8} />
      <text x={padL} y={14} fontSize={10} fontWeight={700} fill="#F9FAFB">Sprint count by distance band</text>
      {players.map((p, i) => {
        const yBase = 24 + i * rowH
        const counts = dist(p)
        let xCursor = padL
        return (
          <g key={p.name}>
            <text x={padL - 6} y={yBase + rowH * 0.6} textAnchor="end" fontSize={9} fill="#9CA3AF">{p.name.split(' ').pop()}</text>
            {counts.map((c, bi) => {
              const w = (c / max) * innerW
              const seg = (
                <g key={bi}>
                  <rect x={xCursor} y={yBase + rowH * 0.18} width={w} height={rowH * 0.6} fill={bandColors[bi]} opacity={0.85} />
                  {w > 16 && <text x={xCursor + w / 2} y={yBase + rowH * 0.55} textAnchor="middle" fontSize={9} fontWeight={700} fill="#0a0a0a">{c}</text>}
                </g>
              )
              xCursor += w
              return seg
            })}
            <text x={xCursor + 4} y={yBase + rowH * 0.6} fontSize={9} fontWeight={700} fill="#F9FAFB">{p.sprints}</text>
          </g>
        )
      })}
      <g transform={`translate(${padL}, ${H - 8})`}>
        {bands.map((b, i) => (
          <g key={b} transform={`translate(${i * 90}, 0)`}>
            <rect x={0} y={-8} width={10} height={8} fill={bandColors[i]} />
            <text x={14} y={-1} fontSize={9} fill="#9CA3AF">{b}</text>
          </g>
        ))}
      </g>
    </svg>
  )
}

// ─── PITCH HSR CORRIDORS ───────────────────────────────────────────────────
function PitchSprintCorridors() {
  const W = 600, H = 380
  // 5 corridor lanes (left flank → right flank) + central channel
  const lanes = [
    { name: 'Left flank',    yPct: 0.12, intensity: 0.85 },
    { name: 'L half-space',  yPct: 0.30, intensity: 0.55 },
    { name: 'Central',       yPct: 0.50, intensity: 0.42 },
    { name: 'R half-space',  yPct: 0.70, intensity: 0.62 },
    { name: 'Right flank',   yPct: 0.88, intensity: 0.78 },
  ]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxHeight: 400 }}>
      <rect width={W} height={H} fill="#06140a" rx={6} />
      <rect x={1} y={1} width={W - 2} height={H - 2} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={1.5} />
      <line x1={W / 2} y1={0} x2={W / 2} y2={H} stroke="rgba(255,255,255,0.18)" />
      <circle cx={W / 2} cy={H / 2} r={H * 0.13} fill="none" stroke="rgba(255,255,255,0.18)" />
      <rect x={0} y={H * 0.22} width={W * 0.16} height={H * 0.56} fill="none" stroke="rgba(255,255,255,0.18)" />
      <rect x={W - W * 0.16} y={H * 0.22} width={W * 0.16} height={H * 0.56} fill="none" stroke="rgba(255,255,255,0.18)" />
      {lanes.map((l, i) => {
        const y = l.yPct * H
        const c = l.intensity > 0.7 ? '#EF4444' : l.intensity > 0.5 ? '#F59E0B' : '#22C55E'
        return (
          <g key={i}>
            <rect x={4} y={y - 18} width={W - 8} height={36} fill={c} opacity={l.intensity * 0.45} rx={6} />
            <text x={12} y={y + 4} fontSize={11} fontWeight={700} fill="white" opacity={0.9}>{l.name}</text>
            <text x={W - 12} y={y + 4} textAnchor="end" fontSize={11} fontWeight={800} fill="white">
              {Math.round(l.intensity * 100)}% · {Math.round(l.intensity * 220)}m HSR
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── ACWR ROLLING CHART ────────────────────────────────────────────────────
function ACWRRollingChart({ players }: { players: DemoPlayer[] }) {
  const W = 720, H = 240, padL = 36, padB = 26
  const innerW = W - padL - 16
  const innerH = H - padB - 24
  const weeks = 4 * 7 // 28 days, plotted weekly (4 points)
  const top3 = players.slice(0, 3)
  const colors = ['#EF4444', '#F59E0B', '#3B82F6']
  const yMin = 0.5, yMax = 1.8
  const series = top3.map((p, pi) => {
    return Array.from({ length: 4 }, (_, w) => {
      const drift = (dh(p.name + 'acwr-' + w, 41) - 0.5) * 0.4
      const target = p.acwr + drift
      return Math.max(yMin + 0.05, Math.min(yMax - 0.05, target))
    })
  })
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxHeight: 260 }}>
      <rect width={W} height={H} fill={CARD} rx={8} />
      {/* Risk band shading */}
      {[
        { from: 1.5, to: yMax, c: '#EF4444' },
        { from: 1.3, to: 1.5, c: '#F59E0B' },
        { from: 0.8, to: 1.3, c: '#22C55E' },
        { from: yMin, to: 0.8, c: '#3B82F6' },
      ].map((band, i) => {
        const y1 = 24 + innerH - ((band.to - yMin) / (yMax - yMin)) * innerH
        const y2 = 24 + innerH - ((band.from - yMin) / (yMax - yMin)) * innerH
        return <rect key={i} x={padL} y={y1} width={innerW} height={Math.max(0, y2 - y1)} fill={band.c} opacity={0.05} />
      })}
      {[0.8, 1.3, 1.5].map(v => {
        const y = 24 + innerH - ((v - yMin) / (yMax - yMin)) * innerH
        return (
          <g key={v}>
            <line x1={padL} y1={y} x2={W - 8} y2={y} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
            <text x={padL - 6} y={y + 3} textAnchor="end" fontSize={9} fill="#6B7280">{v.toFixed(1)}</text>
          </g>
        )
      })}
      {series.map((vals, si) => {
        const path = vals.map((v, i) => {
          const x = padL + (i / (vals.length - 1)) * innerW
          const y = 24 + innerH - ((v - yMin) / (yMax - yMin)) * innerH
          return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
        }).join(' ')
        return (
          <g key={si}>
            <path d={path} stroke={colors[si]} strokeWidth={2.4} fill="none" strokeLinecap="round" />
            {vals.map((v, i) => {
              const x = padL + (i / (vals.length - 1)) * innerW
              const y = 24 + innerH - ((v - yMin) / (yMax - yMin)) * innerH
              return <circle key={i} cx={x} cy={y} r={3.5} fill={colors[si]} stroke={CARD} strokeWidth={1.5} />
            })}
          </g>
        )
      })}
      <text x={padL} y={14} fontSize={10} fontWeight={700} fill="#F9FAFB">4-week ACWR — top 3 highest-risk players</text>
      {['W-3', 'W-2', 'W-1', 'This wk'].map((w, i) => (
        <text key={w} x={padL + (i / 3) * innerW} y={H - 8} textAnchor="middle" fontSize={9} fill="#6B7280">{w}</text>
      ))}
      <g transform={`translate(${W - 260}, 18)`}>
        {top3.map((p, pi) => (
          <g key={p.name} transform={`translate(${pi * 90}, 0)`}>
            <rect x={0} y={-8} width={10} height={3} fill={colors[pi]} />
            <text x={14} y={-3} fontSize={9} fontWeight={700} fill="#F9FAFB">{p.name.split(' ').pop()}</text>
          </g>
        ))}
      </g>
    </svg>
  )
}

// ─── TOP SPEED LEADERBOARD ─────────────────────────────────────────────────
function TopSpeedLeaderboard({ players }: { players: DemoPlayer[] }) {
  const sorted = [...players].sort((a, b) => b.maxSpeed - a.maxSpeed)
  const max = sorted[0].maxSpeed
  return (
    <div className="space-y-1.5">
      {sorted.map((p, i) => (
        <div key={p.name} className="flex items-center gap-3">
          <span className="text-[10px] w-5 text-right font-bold" style={{ color: i < 3 ? FB_SECONDARY : '#6B7280' }}>{i + 1}</span>
          <span className="text-xs w-32 truncate" style={{ color: '#F9FAFB' }}>{p.name}</span>
          <div className="flex-1 h-3 rounded overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="h-3 rounded" style={{
              width: `${(p.maxSpeed / max) * 100}%`,
              background: `linear-gradient(90deg, ${FB_PRIMARY}, #EF4444)`,
              opacity: 0.85,
            }} />
          </div>
          <span className="text-xs font-mono font-bold w-16 text-right" style={{ color: '#F9FAFB' }}>
            {p.maxSpeed.toFixed(1)} <span className="text-[9px] text-gray-500">km/h</span>
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── ACWR TABLE (with demo fallback) ───────────────────────────────────────
interface ACWRRow {
  player_name: string
  acute_load: number
  chronic_load: number
  acwr_ratio: number
  risk_level: string
  flagged: boolean
  trend: 'up' | 'down' | 'flat'
}

function buildDemoACWRRows(players: DemoPlayer[]): ACWRRow[] {
  return players.map(p => {
    const acute = Math.round(p.load * 7 * (0.95 + dh(p.name + 'a', 43) * 0.1))
    const chronic = Math.round(acute / p.acwr)
    const risk = p.acwr > 1.5 ? 'High' : p.acwr > 1.3 ? 'Moderate' : p.acwr < 0.8 ? 'Undertraining' : 'Optimal'
    const trend: ACWRRow['trend'] = p.acwr > 1.4 ? 'up' : p.acwr < 0.85 ? 'down' : 'flat'
    return {
      player_name: p.name,
      acute_load: acute,
      chronic_load: chronic,
      acwr_ratio: Number(p.acwr.toFixed(2)),
      risk_level: risk,
      flagged: p.acwr > 1.3 || p.acwr < 0.8,
      trend,
    }
  }).sort((a, b) => b.acwr_ratio - a.acwr_ratio)
}

function ACWRScoresTab({ clubId, players }: { clubId?: string | null; players: DemoPlayer[] }) {
  const [rows, setRows] = useState<ACWRRow[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [usingDemo, setUsingDemo] = useState(false)
  useEffect(() => {
    // Always render — demo data when no clubId, live data when present.
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!clubId || !url || !key) {
      setRows(buildDemoACWRRows(players))
      setUsingDemo(true)
      return
    }
    setLoading(true)
    const supabase = createClient(url, key)
    supabase
      .from('football_acwr_scores')
      .select('player_name, acute_load, chronic_load, acwr_ratio, risk_level, flagged, calculated_at')
      .eq('club_id', clubId)
      .order('calculated_at', { ascending: false })
      .then(({ data }) => {
        const live = (data ?? []) as Array<Omit<ACWRRow, 'trend'>>
        if (live.length === 0) {
          setRows(buildDemoACWRRows(players))
          setUsingDemo(true)
        } else {
          setRows(live.map(r => ({ ...r, trend: 'flat' as const })))
          setUsingDemo(false)
        }
        setLoading(false)
      })
  }, [clubId, players])

  const colorFor = (r: string) =>
    r === 'High' || r === 'Very High' ? '#EF4444'
    : r === 'Moderate' ? '#F59E0B'
    : r === 'Undertraining' ? '#3B82F6'
    : '#22C55E'

  const summary = useMemo(() => {
    if (!rows) return { high: 0, mod: 0, ok: 0, low: 0 }
    return {
      high: rows.filter(r => r.risk_level === 'High' || r.risk_level === 'Very High').length,
      mod: rows.filter(r => r.risk_level === 'Moderate').length,
      ok: rows.filter(r => r.risk_level === 'Optimal').length,
      low: rows.filter(r => r.risk_level === 'Undertraining').length,
    }
  }, [rows])

  if (loading) return <div className="text-xs" style={{ color: '#9CA3AF' }}>Loading ACWR scores...</div>
  if (!rows) return null

  return (
    <div className="space-y-4">
      {usingDemo && (
        <div className="rounded-xl px-3 py-2 text-[11px]" style={{ background: 'rgba(241,196,15,0.08)', border: '1px solid rgba(241,196,15,0.3)', color: '#FCD34D' }}>
          Demo data — connect a GPS provider in the Connect tab to see live ACWR scores.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl p-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <p className="text-[10px] uppercase tracking-wider" style={{ color: '#F87171' }}>High risk</p>
          <p className="text-2xl font-black" style={{ color: '#F87171' }}>{summary.high}</p>
        </div>
        <div className="rounded-xl p-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <p className="text-[10px] uppercase tracking-wider" style={{ color: '#FCD34D' }}>Caution</p>
          <p className="text-2xl font-black" style={{ color: '#FCD34D' }}>{summary.mod}</p>
        </div>
        <div className="rounded-xl p-3" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
          <p className="text-[10px] uppercase tracking-wider" style={{ color: '#86EFAC' }}>Optimal</p>
          <p className="text-2xl font-black" style={{ color: '#86EFAC' }}>{summary.ok}</p>
        </div>
        <div className="rounded-xl p-3" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}>
          <p className="text-[10px] uppercase tracking-wider" style={{ color: '#93C5FD' }}>Under-trained</p>
          <p className="text-2xl font-black" style={{ color: '#93C5FD' }}>{summary.low}</p>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
        <table className="w-full text-sm">
          <thead><tr className="text-xs" style={{ borderBottom: `1px solid ${BORDER}`, color: '#9CA3AF' }}>
            <th className="text-left p-3">Player</th>
            <th className="text-right p-3">Acute (7d)</th>
            <th className="text-right p-3">Chronic (28d)</th>
            <th className="text-right p-3">ACWR</th>
            <th className="text-right p-3">Status</th>
            <th className="text-right p-3">Trend</th>
          </tr></thead>
          <tbody>{rows.map(r => (
            <tr key={r.player_name} style={{
              borderBottom: `1px solid ${BORDER}`,
              backgroundColor: r.flagged && (r.risk_level === 'High' || r.risk_level === 'Very High') ? 'rgba(239,68,68,0.05)' : undefined,
            }}>
              <td className="p-3 font-medium" style={{ color: '#F9FAFB' }}>{r.player_name}</td>
              <td className="p-3 text-right" style={{ color: '#9CA3AF' }}>{r.acute_load.toLocaleString()}</td>
              <td className="p-3 text-right" style={{ color: '#9CA3AF' }}>{r.chronic_load.toLocaleString()}</td>
              <td className="p-3 text-right font-bold" style={{ color: '#F9FAFB' }}>{Number(r.acwr_ratio).toFixed(2)}</td>
              <td className="p-3 text-right">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${r.risk_level === 'Very High' ? 'animate-pulse' : ''}`}
                  style={{ backgroundColor: `${colorFor(r.risk_level)}22`, color: colorFor(r.risk_level), border: `1px solid ${colorFor(r.risk_level)}55` }}>
                  {r.risk_level}
                </span>
              </td>
              <td className="p-3 text-right">
                {r.trend === 'up' && <ChevronsUp size={14} style={{ color: '#EF4444', display: 'inline' }} />}
                {r.trend === 'down' && <ChevronDown size={14} style={{ color: '#3B82F6', display: 'inline' }} />}
                {r.trend === 'flat' && <span style={{ color: '#6B7280' }}>—</span>}
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      <ACWRRollingChart players={players} />

      <div className="rounded-xl p-4" style={{
        background: 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(245,158,11,0.06))',
        border: '1px solid rgba(239,68,68,0.3)',
      }}>
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} style={{ color: '#F87171', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p className="text-sm font-bold mb-1" style={{ color: '#F9FAFB' }}>Injury risk summary</p>
            <p className="text-xs" style={{ color: '#D1D5DB' }}>
              {summary.high} player{summary.high === 1 ? '' : 's'} above the 1.5 ACWR threshold —
              recommend reduced training load + 1:1 medical review before next match. {summary.mod} caution-zone
              players should have load managed across the next 7 days. The current squad-wide ACWR average
              ({(rows.reduce((s, r) => s + r.acwr_ratio, 0) / rows.length).toFixed(2)})
              is {rows.reduce((s, r) => s + r.acwr_ratio, 0) / rows.length > 1.2 ? 'above' : 'within'} target.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
export default function GPSPerformanceView({ clubId, isDemo = false }: {
  clubId?: string | null; isDemo?: boolean
} = {}) {
  void isDemo
  const [outerTab, setOuterTab] = useState<OuterTab>('performance')
  const [tab, setTab] = useState<Tab>('session')
  const [brandPrimary, setBrandPrimary] = useState(FB_PRIMARY)
  const [brandSecondary, setBrandSecondary] = useState(FB_SECONDARY)
  const [matchMetric, setMatchMetric] = useState<'distance' | 'hsr' | 'sprints'>('distance')
  const [connectToken, setConnectToken] = useState('')
  const [connectProvider, setConnectProvider] = useState<'johan' | 'csv' | 'polar'>('johan')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try {
      const p = localStorage.getItem('lumio_football_brand_primary')
      const s = localStorage.getItem('lumio_football_brand_secondary')
      if (p) setBrandPrimary(p)
      if (s) setBrandSecondary(s)
    } catch { /* localStorage unavailable */ }
  }, [])

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'session',   label: 'Session Overview',  icon: Activity },
    { id: 'readiness', label: 'Player Readiness',  icon: Users },
    { id: 'trends',    label: 'Load Trends',       icon: TrendingUp },
    { id: 'compare',   label: 'Match vs Training', icon: Zap },
    { id: 'sprint',    label: 'Sprint Analysis',   icon: Flame },
    { id: 'acwr',      label: 'ACWR Scores',       icon: Gauge },
    { id: 'connect',   label: 'Connect GPS',       icon: Settings },
  ]
  const OUTER_TABS: { id: OuterTab; label: string }[] = [
    { id: 'performance', label: 'Performance' },
    { id: 'upload', label: 'Upload Session' },
  ]

  const sorted = [...DEMO_PLAYERS].sort((a, b) => b.load - a.load)
  const avgLoad = Math.round(sorted.reduce((s, p) => s + p.load, 0) / sorted.length)
  const avgDist = (sorted.reduce((s, p) => s + p.distance, 0) / sorted.length).toFixed(1)
  const avgHSR = Math.round(sorted.reduce((s, p) => s + p.hsr, 0) / sorted.length)
  const maxSpeed = Math.max(...sorted.map(p => p.maxSpeed))
  const totalSprints = sorted.reduce((s, p) => s + p.sprints, 0)
  const avgAccel = Math.round(sorted.reduce((s, p) => s + p.acceleration, 0) / sorted.length)
  const avgRecovery = (sorted.reduce((s, p) => s + (p.readiness / 10), 0) / sorted.length).toFixed(1)
  const highLoad = sorted.filter(p => p.load > 1000 || p.acwr > 1.3).length

  async function handleConnect() {
    if (!connectToken.trim()) return
    setSaving(true)
    const token = localStorage.getItem('workspace_session_token') || ''
    await fetch(`/api/integrations/${connectProvider === 'johan' ? 'johan-sports' : connectProvider}`, {
      method: 'POST', headers: { 'x-workspace-token': token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: connectToken, provider: connectProvider }),
    }).catch(() => {})
    localStorage.setItem(`lumio_integration_${connectProvider}`, 'true')
    setSaving(false); setSaved(true); setConnectToken('')
    setTimeout(() => setSaved(false), 3000)
  }

  if (outerTab === 'upload') {
    return (
      <div className="space-y-6">
        <Header brandPrimary={brandPrimary} brandSecondary={brandSecondary} />
        <OuterTabRow value={outerTab} onChange={setOuterTab} options={OUTER_TABS} accent={brandPrimary} />
        <GPSUploadView clubId={clubId} isDemo={true} />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <Header brandPrimary={brandPrimary} brandSecondary={brandSecondary} />
      <OuterTabRow value={outerTab} onChange={setOuterTab} options={OUTER_TABS} accent={brandPrimary} />

      {/* ── TOP STRIP — 8 KPI CARDS (4 + 4) ───────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Avg Player Load"       value={avgLoad}            sub="AU · session avg"          accentColor={brandPrimary}     icon={Gauge}    trend="up" />
        <KpiCard label="Avg Distance (km)"     value={avgDist}            sub={`+0.4 vs last week`}       accentColor="#22C55E"          icon={Activity} trend="up" />
        <KpiCard label="Avg HSR (m)"           value={avgHSR}             sub={`+8% vs season avg`}       accentColor="#3B82F6"          icon={TrendingUp} trend="up" />
        <KpiCard label="Max Speed (km/h)"      value={maxSpeed.toFixed(1)} sub="Dean Morris"               accentColor="#EF4444"          icon={Zap}      trend="flat" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Sprint Count (team)"    value={totalSprints}        sub={`across ${sorted.length} players`} accentColor="#F59E0B"          icon={Flame}    trend="up" />
        <KpiCard label="Avg Accel Efforts"      value={avgAccel}            sub="≥3 m/s² per player"        accentColor={brandSecondary}    icon={ChevronsUp} trend="flat" />
        <KpiCard label="Recovery Score"         value={`${avgRecovery}/10`} sub="squad average · readiness" accentColor="#22C55E"          icon={Heart}    trend="down" />
        <KpiCard label="High Load Players"      value={highLoad}            sub="amber/red flagged"          accentColor={highLoad > 3 ? '#EF4444' : '#F59E0B'} icon={AlertTriangle} trend={highLoad > 3 ? 'up' : 'flat'} />
      </div>

      {/* ── MAIN TABS ────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              backgroundColor: tab === t.id ? `${brandPrimary}25` : 'transparent',
              color: tab === t.id ? brandSecondary : '#6B7280',
              border: tab === t.id ? `1px solid ${brandPrimary}55` : `1px solid ${BORDER}`,
            }}>
            <t.icon size={12} />{t.label}
          </button>
        ))}
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* SESSION OVERVIEW                                              */}
      {/* ────────────────────────────────────────────────────────── */}
      {tab === 'session' && (
        <div className="space-y-5">
          {/* Session header */}
          <div className="rounded-xl p-4 flex items-center gap-4 flex-wrap" style={{
            background: `linear-gradient(135deg, ${brandPrimary}15, ${brandSecondary}08)`,
            border: `1px solid ${brandPrimary}40`,
          }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${brandPrimary}, ${brandSecondary})` }}>
              <Activity size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold" style={{ color: '#F9FAFB' }}>Training Session — Tactical + Possession</p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>Wed 24 Apr · 90 minutes · Full squad · 13 players tracked</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                style={{ background: 'rgba(34,197,94,0.15)', color: '#86EFAC', border: '1px solid rgba(34,197,94,0.4)' }}>
                Live · synced 8m ago
              </span>
              <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                style={{ background: `${brandSecondary}15`, color: brandSecondary, border: `1px solid ${brandSecondary}40` }}>
                Demo data
              </span>
            </div>
          </div>

          {/* Player breakdown table */}
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Player Breakdown</p>
              <p className="text-[11px]" style={{ color: '#6B7280' }}>Sorted by Load — descending</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {['Player', 'Role', 'Distance', 'HSR', 'Sprints', 'Top Speed', 'Load', 'ACWR', 'Status'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{sorted.map(p => (
                  <tr key={p.name} style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <td className="px-3 py-2.5 font-medium" style={{ color: '#F9FAFB' }}>{p.name}</td>
                    <td className="px-3 py-2.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                        style={{ background: `${brandPrimary}25`, color: brandPrimary }}>
                        {p.role}
                      </span>
                    </td>
                    <td className="px-3 py-2.5" style={{ color: '#D1D5DB' }}>{p.distance.toFixed(1)} km</td>
                    <td className="px-3 py-2.5" style={{ color: '#D1D5DB' }}>{p.hsr} m</td>
                    <td className="px-3 py-2.5" style={{ color: '#D1D5DB' }}>{p.sprints}</td>
                    <td className="px-3 py-2.5" style={{ color: '#D1D5DB' }}>{p.maxSpeed.toFixed(1)} km/h</td>
                    <td className="px-3 py-2.5">
                      <span className="font-bold" style={{ color: loadColor(p.load) }}>{p.load}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{ backgroundColor: `${acwrColor(p.acwr)}22`, color: acwrColor(p.acwr), border: `1px solid ${acwrColor(p.acwr)}55` }}>
                        {p.acwr.toFixed(2)} {acwrLabel(p.acwr)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{ backgroundColor: `${statusColor(p.readiness)}22`, color: statusColor(p.readiness) }}>
                        {statusLabel(p.readiness)}
                      </span>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>

          {/* Distance by intensity zone */}
          <div className="rounded-xl p-4" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Distance by Intensity Zone</p>
                <p className="text-[11px]" style={{ color: '#6B7280' }}>Stand · Walk · Jog · Run · Sprint — share of total distance per player</p>
              </div>
              <div className="flex items-center gap-2 text-[10px]" style={{ color: '#9CA3AF' }}>
                {[
                  ['#0E7C3A', 'Stand'], ['#22C55E', 'Walk'], ['#FACC15', 'Jog'], ['#F59E0B', 'Run'], ['#EF4444', 'Sprint'],
                ].map(([c, l]) => (
                  <span key={l} className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />{l}
                  </span>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              {sorted.map(p => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="text-[11px] w-32 truncate" style={{ color: '#F9FAFB' }}>{p.name}</span>
                  <div className="flex-1">
                    <DistanceZoneBar
                      distance={p.distance}
                      sprintsPct={(p.sprints / 25) * 8}
                      hsrPct={(p.hsr / 1000) * 16}
                    />
                  </div>
                  <span className="text-[11px] font-mono w-16 text-right" style={{ color: '#9CA3AF' }}>{p.distance.toFixed(1)} km</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sprint frequency line chart */}
          <div className="rounded-xl p-4" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            <p className="text-sm font-semibold mb-1" style={{ color: '#F9FAFB' }}>Sprint Frequency</p>
            <p className="text-[11px] mb-3" style={{ color: '#6B7280' }}>Sprints across the session, in 15-minute blocks</p>
            <SprintFrequencyChart />
          </div>

          {/* AI Summary + Highlights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl p-4" style={{ background: `linear-gradient(135deg, ${brandPrimary}15, transparent)`, border: `1px solid ${brandPrimary}50` }}>
              <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: brandSecondary }}>AI Summary</p>
              <p className="text-sm leading-relaxed" style={{ color: '#E5E7EB' }}>
                Squad-wide load this session was 12% above the four-week rolling average, driven primarily by the
                possession-game block in the second half. Dean Morris and Ryan Cole both crossed 1,000 AU — both
                already running ACWR &gt; 1.4 — so a recovery-focused session is recommended for tomorrow. The forwards
                covered 9% more high-speed running than last Wednesday, suggesting tactical pressing intensity is
                building correctly toward Saturday&apos;s match. 4 players are flagged amber or red and should be
                load-managed.
              </p>
            </div>
            <div className="rounded-xl p-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: brandSecondary }}>Key Highlights</p>
              <ul className="space-y-1.5 text-xs" style={{ color: '#D1D5DB' }}>
                <li>• Dean Morris: 1,042 AU (+18% vs his 7-day avg) — flagged for recovery</li>
                <li>• Ryan Cole: 22 sprints (+30% session avg) — peak speed 30.4 km/h</li>
                <li>• Liam Barker: 11.5 km — most distance covered, ACWR optimal</li>
                <li>• Chris Nwosu: ACWR 1.58 — high injury risk, rest tomorrow</li>
                <li>• Defensive block kept HSR &lt; 700m — typical for tactical day</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* PLAYER READINESS                                             */}
      {/* ────────────────────────────────────────────────────────── */}
      {tab === 'readiness' && (
        <div className="space-y-5">
          {/* Top summary bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl p-4 text-center" style={{ backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
              <p className="text-3xl font-black" style={{ color: '#22C55E' }}>{sorted.filter(p => p.readiness >= 80).length}</p>
              <p className="text-xs font-semibold mt-1" style={{ color: '#86EFAC' }}>Ready to Play</p>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
              <p className="text-3xl font-black" style={{ color: '#F59E0B' }}>{sorted.filter(p => p.readiness >= 65 && p.readiness < 80).length}</p>
              <p className="text-xs font-semibold mt-1" style={{ color: '#FCD34D' }}>Manage Load</p>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <p className="text-3xl font-black" style={{ color: '#EF4444' }}>{sorted.filter(p => p.readiness < 65).length}</p>
              <p className="text-xs font-semibold mt-1" style={{ color: '#FCA5A5' }}>Rest Recommended</p>
            </div>
          </div>

          {/* Per-player readiness cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sorted.map(p => (
              <div key={p.name} className="rounded-xl p-4" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
                <div className="flex items-center gap-3 mb-3">
                  <ReadinessGauge score={p.readiness} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: '#F9FAFB' }}>{p.name}</p>
                    <p className="text-[10px]" style={{ color: '#6B7280' }}>{p.role} · {p.group}</p>
                    <p className="text-[10px] mt-1 font-bold" style={{ color: readinessColor(p.readiness) }}>
                      {statusLabel(p.readiness)}
                    </p>
                  </div>
                </div>
                <FactorBars sleep={p.sleep} soreness={p.soreness} fatigue={p.fatigue} mood={p.mood} />
              </div>
            ))}
          </div>

          {/* 7-day squad readiness heatmap */}
          <div className="rounded-xl p-4" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>7-Day Squad Readiness</p>
                <p className="text-[11px]" style={{ color: '#6B7280' }}>Each cell = readiness score · darker red = lower</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr>
                    <th className="text-left p-1 sticky left-0" style={{ background: CARD, color: '#6B7280' }}>Player</th>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                      <th key={d} className="p-1" style={{ color: '#6B7280' }}>{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(p => (
                    <tr key={p.name}>
                      <td className="p-1 whitespace-nowrap sticky left-0" style={{ background: CARD, color: '#F9FAFB' }}>{p.name}</td>
                      {Array.from({ length: 7 }).map((_, d) => {
                        const drift = (dh(p.name + 'rd-' + d, 47) - 0.5) * 30
                        const score = Math.max(40, Math.min(100, Math.round(p.readiness + drift)))
                        return (
                          <td key={d} className="p-0.5">
                            <div className="rounded text-center font-bold text-white" style={{
                              background: readinessColor(score),
                              opacity: 0.45 + (score / 100) * 0.5,
                              padding: '4px 0',
                              fontSize: 10,
                              minWidth: 32,
                            }}>{score}</div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Flagged players */}
          <div className="rounded-xl p-4" style={{
            background: 'linear-gradient(135deg, rgba(239,68,68,0.1), transparent)',
            border: '1px solid rgba(239,68,68,0.3)',
          }}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} style={{ color: '#F87171' }} />
              <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Flagged Players</p>
            </div>
            <div className="space-y-2">
              {sorted.filter(p => p.readiness < 80).map(p => (
                <div key={p.name} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.3)' }}>
                  <div className="w-2 h-2 rounded-full mt-1.5" style={{ background: readinessColor(p.readiness) }} />
                  <div className="flex-1">
                    <p className="text-xs font-bold" style={{ color: '#F9FAFB' }}>{p.name} <span style={{ color: '#6B7280' }}>· {p.role}</span></p>
                    <p className="text-[11px] mt-0.5" style={{ color: '#D1D5DB' }}>
                      {p.readiness < 65
                        ? `Score ${p.readiness}/100 — sleep ${p.sleep.toFixed(1)}/10, soreness ${p.soreness}/10. Recommend full rest tomorrow + medical screening.`
                        : `Score ${p.readiness}/100 — manage load. Reduce HSR target by 15% next session.`}
                    </p>
                  </div>
                </div>
              ))}
              {sorted.filter(p => p.readiness < 80).length === 0 && (
                <p className="text-xs" style={{ color: '#9CA3AF' }}>No players currently flagged.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* LOAD TRENDS                                                  */}
      {/* ────────────────────────────────────────────────────────── */}
      {tab === 'trends' && (
        <div className="space-y-5">
          <div className="rounded-xl p-4" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            <p className="text-sm font-semibold mb-1" style={{ color: '#F9FAFB' }}>30-Day Rolling Team Load</p>
            <p className="text-[11px] mb-3" style={{ color: '#6B7280' }}>Blue line = actual · yellow dashed = target baseline (800 AU)</p>
            <RollingLoadChart />
          </div>

          <div className="rounded-xl p-4" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            <p className="text-sm font-semibold mb-1" style={{ color: '#F9FAFB' }}>Individual Load Sparklines</p>
            <p className="text-[11px] mb-4" style={{ color: '#6B7280' }}>Last 14 days · per-player load trend</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {sorted.map(p => (
                <div key={p.name} className="rounded-lg p-3" style={{ background: SUB_BG, border: `1px solid ${BORDER}` }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold truncate" style={{ color: '#F9FAFB' }}>{p.name}</span>
                    <span className="text-[10px] font-bold" style={{ color: loadColor(p.load) }}>{p.load}</span>
                  </div>
                  <PlayerSparkline seed={p.name} color={loadColor(p.load)} />
                  <p className="text-[9px] mt-1" style={{ color: '#6B7280' }}>{p.role} · ACWR {p.acwr.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl p-4" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            <p className="text-sm font-semibold mb-1" style={{ color: '#F9FAFB' }}>Week-on-Week Comparison</p>
            <p className="text-[11px] mb-3" style={{ color: '#6B7280' }}>Squad averages — this week vs last week vs season avg</p>
            <WeekComparisonBars />
          </div>

          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            <div className="px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Monotony &amp; Strain</p>
              <p className="text-[11px]" style={{ color: '#6B7280' }}>Monotony &gt; 2.0 or Strain &gt; 6,000 indicates overtraining risk</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {['Player', 'Weekly Load', 'Daily Avg', 'Std Dev', 'Monotony', 'Strain', 'Flag'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {sorted.map(p => {
                    const weekly = Math.round(p.load * 5.6)
                    const dailyAvg = Math.round(weekly / 7)
                    const stdDev = Math.round(p.load * 0.18 + dh(p.name + 'sd', 53) * 30)
                    const monotony = Number((dailyAvg / Math.max(50, stdDev)).toFixed(2))
                    const strain = weekly * monotony
                    const monoFlag = monotony > 2.0
                    const strainFlag = strain > 6000
                    return (
                      <tr key={p.name} style={{ borderBottom: `1px solid ${BORDER}` }}>
                        <td className="px-3 py-2.5 font-medium" style={{ color: '#F9FAFB' }}>{p.name}</td>
                        <td className="px-3 py-2.5" style={{ color: '#D1D5DB' }}>{weekly.toLocaleString()}</td>
                        <td className="px-3 py-2.5" style={{ color: '#D1D5DB' }}>{dailyAvg}</td>
                        <td className="px-3 py-2.5" style={{ color: '#D1D5DB' }}>{stdDev}</td>
                        <td className="px-3 py-2.5">
                          <span className="font-bold" style={{ color: monoFlag ? '#EF4444' : '#22C55E' }}>{monotony}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="font-bold" style={{ color: strainFlag ? '#EF4444' : '#22C55E' }}>{Math.round(strain).toLocaleString()}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          {monoFlag || strainFlag ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: 'rgba(239,68,68,0.2)', color: '#FCA5A5' }}>Risk</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: 'rgba(34,197,94,0.15)', color: '#86EFAC' }}>Safe</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* MATCH vs TRAINING                                            */}
      {/* ────────────────────────────────────────────────────────── */}
      {tab === 'compare' && (
        <div className="space-y-5">
          <div className="rounded-xl p-4" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
              <div>
                <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Match vs Training Output</p>
                <p className="text-[11px]" style={{ color: '#6B7280' }}>Last 5 matches vs training average — by player</p>
              </div>
              <div className="flex gap-1.5">
                {(['distance', 'hsr', 'sprints'] as const).map(m => (
                  <button key={m} onClick={() => setMatchMetric(m)}
                    className="px-3 py-1.5 rounded-full text-[11px] font-bold capitalize border transition-all"
                    style={matchMetric === m
                      ? { background: brandPrimary, color: 'white', borderColor: brandPrimary }
                      : { background: 'transparent', color: '#9CA3AF', borderColor: BORDER }}>
                    {m === 'hsr' ? 'HSR' : m}
                  </button>
                ))}
              </div>
            </div>
            <MatchVsTrainingBars metric={matchMetric} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {(['distance', 'hsr', 'sprints'] as const).map(m => {
              const ratio = m === 'distance' ? 1.08 : m === 'hsr' ? 1.85 : 1.45
              const label = m === 'distance' ? 'Distance' : m === 'hsr' ? 'HSR' : 'Sprints'
              return (
                <div key={m} className="rounded-xl p-4" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: '#6B7280' }}>{label} ratio</p>
                  <p className="text-3xl font-black mt-1" style={{ color: '#F9FAFB' }}>
                    {ratio.toFixed(2)}<span className="text-base text-gray-500">×</span>
                  </p>
                  <p className="text-[11px] mt-1" style={{ color: '#9CA3AF' }}>
                    Match {label.toLowerCase()} is {((ratio - 1) * 100).toFixed(0)}% higher than training avg
                  </p>
                </div>
              )
            })}
          </div>

          <div className="rounded-xl p-4" style={{
            background: `linear-gradient(135deg, ${brandSecondary}15, transparent)`,
            border: `1px solid ${brandSecondary}40`,
          }}>
            <div className="flex items-start gap-3">
              <Zap size={18} style={{ color: brandSecondary, marginTop: 2 }} />
              <div>
                <p className="text-sm font-bold mb-1" style={{ color: '#F9FAFB' }}>Key insight</p>
                <p className="text-xs leading-relaxed" style={{ color: '#D1D5DB' }}>
                  <strong>Dean Morris</strong> shows the largest gap between match and training output (HSR
                  +124% in matches vs training), which suggests training-day intensity for forwards is
                  under-prescribing the demands they face on Saturday. <strong>Liam Barker</strong> and
                  <strong> Ryan Cole</strong> show healthy match/training ratios (~1.10×) — their training
                  prescription is correctly calibrated. Consider adding 1-2 high-intensity small-sided
                  game blocks for the front three midweek.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* SPRINT ANALYSIS (NEW)                                        */}
      {/* ────────────────────────────────────────────────────────── */}
      {tab === 'sprint' && (
        <div className="space-y-5">
          <div className="rounded-xl p-4" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            <p className="text-sm font-semibold mb-1" style={{ color: '#F9FAFB' }}>Sprint Count by Distance Band</p>
            <p className="text-[11px] mb-3" style={{ color: '#6B7280' }}>Stacked by sprint length: 10–20m / 20–30m / 30–40m / 40m+</p>
            <SprintBandStack players={sorted} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl p-4" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
              <p className="text-sm font-semibold mb-1" style={{ color: '#F9FAFB' }}>Top Speed Leaderboard</p>
              <p className="text-[11px] mb-4" style={{ color: '#6B7280' }}>Peak speed across the session — km/h</p>
              <TopSpeedLeaderboard players={sorted} />
            </div>

            <div className="space-y-3">
              <div className="rounded-xl p-4" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
                <p className="text-sm font-semibold mb-1" style={{ color: '#F9FAFB' }}>Acceleration Efforts</p>
                <p className="text-[11px] mb-3" style={{ color: '#6B7280' }}>Count of efforts &gt;3 m/s² per player</p>
                <div className="space-y-1.5">
                  {sorted.slice(0, 8).map(p => {
                    const max = Math.max(...sorted.map(s => s.acceleration))
                    return (
                      <div key={p.name} className="flex items-center gap-2">
                        <span className="text-[11px] w-28 truncate" style={{ color: '#F9FAFB' }}>{p.name}</span>
                        <div className="flex-1 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }}>
                          <div className="h-2.5 rounded-full" style={{ width: `${(p.acceleration / max) * 100}%`, background: '#22C55E' }} />
                        </div>
                        <span className="text-[11px] font-mono w-8 text-right" style={{ color: '#F9FAFB' }}>{p.acceleration}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-xl p-4" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
                <p className="text-sm font-semibold mb-1" style={{ color: '#F9FAFB' }}>Deceleration Efforts</p>
                <p className="text-[11px] mb-3" style={{ color: '#6B7280' }}>Count of efforts &gt;-3 m/s² per player</p>
                <div className="space-y-1.5">
                  {sorted.slice(0, 8).map(p => {
                    const max = Math.max(...sorted.map(s => s.deceleration))
                    return (
                      <div key={p.name} className="flex items-center gap-2">
                        <span className="text-[11px] w-28 truncate" style={{ color: '#F9FAFB' }}>{p.name}</span>
                        <div className="flex-1 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }}>
                          <div className="h-2.5 rounded-full" style={{ width: `${(p.deceleration / max) * 100}%`, background: '#EF4444' }} />
                        </div>
                        <span className="text-[11px] font-mono w-8 text-right" style={{ color: '#F9FAFB' }}>{p.deceleration}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl p-4" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            <p className="text-sm font-semibold mb-1" style={{ color: '#F9FAFB' }}>Sprint Fatigue Index</p>
            <p className="text-[11px] mb-3" style={{ color: '#6B7280' }}>Sprints in 1st half vs 2nd half · drop-off &gt;30% = fatigue concern</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {['Player', '1st half', '2nd half', 'Δ', 'Drop %', 'Status'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {sorted.map(p => {
                    const h1 = Math.ceil(p.sprints * (0.55 + dh(p.name + 'h1', 59) * 0.1))
                    const h2 = Math.max(1, p.sprints - h1)
                    const drop = ((h1 - h2) / h1) * 100
                    return (
                      <tr key={p.name} style={{ borderBottom: `1px solid ${BORDER}` }}>
                        <td className="px-3 py-2.5 font-medium" style={{ color: '#F9FAFB' }}>{p.name}</td>
                        <td className="px-3 py-2.5" style={{ color: '#D1D5DB' }}>{h1}</td>
                        <td className="px-3 py-2.5" style={{ color: '#D1D5DB' }}>{h2}</td>
                        <td className="px-3 py-2.5" style={{ color: '#D1D5DB' }}>{h1 - h2 > 0 ? '−' : '+'}{Math.abs(h1 - h2)}</td>
                        <td className="px-3 py-2.5">
                          <span className="font-bold" style={{ color: drop > 30 ? '#EF4444' : drop > 15 ? '#F59E0B' : '#22C55E' }}>
                            {drop.toFixed(0)}%
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold"
                            style={{
                              background: drop > 30 ? 'rgba(239,68,68,0.2)' : drop > 15 ? 'rgba(245,158,11,0.2)' : 'rgba(34,197,94,0.15)',
                              color: drop > 30 ? '#FCA5A5' : drop > 15 ? '#FCD34D' : '#86EFAC',
                            }}>
                            {drop > 30 ? 'Fatigued' : drop > 15 ? 'Watch' : 'Strong'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl p-4" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            <p className="text-sm font-semibold mb-1" style={{ color: '#F9FAFB' }}>High-Speed Running Corridors</p>
            <p className="text-[11px] mb-3" style={{ color: '#6B7280' }}>Where sprints occurred on the pitch — by lane</p>
            <PitchSprintCorridors />
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* ACWR SCORES                                                  */}
      {/* ────────────────────────────────────────────────────────── */}
      {tab === 'acwr' && <ACWRScoresTab clubId={clubId} players={sorted} />}

      {/* ────────────────────────────────────────────────────────── */}
      {/* CONNECT GPS                                                  */}
      {/* ────────────────────────────────────────────────────────── */}
      {tab === 'connect' && (
        <div className="space-y-5">
          {/* Featured: JOHAN Sports */}
          <div className="rounded-xl p-5 relative overflow-hidden" style={{
            background: `linear-gradient(135deg, ${brandPrimary}25, ${brandSecondary}10)`,
            border: `1px solid ${brandPrimary}80`,
          }}>
            <div className="absolute top-2 right-2">
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                style={{ background: brandSecondary, color: '#1a1a1a' }}>
                Featured partner
              </span>
            </div>
            <div className="flex items-start gap-4 flex-wrap">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: '#FFFFFF', color: '#003DA5', fontWeight: 900, fontSize: 20 }}>
                JOHAN
              </div>
              <div className="flex-1 min-w-[200px]">
                <p className="text-base font-bold" style={{ color: '#F9FAFB' }}>JOHAN Sports GPS</p>
                <p className="text-xs mt-1" style={{ color: '#D1D5DB' }}>
                  Dutch-engineered 18Hz GPS vests with built-in HRV, accelerometer and live tactical telemetry. Native
                  integration with Lumio — sessions sync in &lt; 60 seconds. Field-tested across the Eredivisie and the
                  EFL Championship.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button onClick={() => { setConnectProvider('johan'); }}
                    className="px-4 py-2 rounded-lg text-xs font-bold transition-all"
                    style={{ background: brandSecondary, color: '#1a1a1a' }}>
                    Connect JOHAN GPS
                  </button>
                  <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider"
                    style={{ background: 'rgba(245,158,11,0.15)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.3)' }}>
                    Pending — beacon link
                  </span>
                  <span className="text-[10px]" style={{ color: '#9CA3AF' }}>Last sync: never · pair to begin</span>
                </div>
              </div>
            </div>
          </div>

          {connectProvider === 'johan' && (
            <div className="rounded-xl p-4" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
              <p className="text-sm font-semibold mb-3" style={{ color: '#F9FAFB' }}>Pair JOHAN GPS</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: '#9CA3AF' }}>JOHAN API Token</label>
                  <input value={connectToken} onChange={e => setConnectToken(e.target.value)}
                    placeholder="jhn_live_…"
                    className="w-full text-sm rounded-lg px-3 py-2.5 outline-none"
                    style={{ backgroundColor: SUB_BG, border: `1px solid ${BORDER}`, color: '#F9FAFB' }} />
                </div>
                <button onClick={handleConnect} disabled={saving || !connectToken.trim()}
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    backgroundColor: saved ? '#22C55E' : brandPrimary,
                    color: '#F9FAFB',
                    opacity: saving || !connectToken.trim() ? 0.5 : 1,
                  }}>
                  {saving ? 'Pairing…' : saved ? 'Paired ✓' : 'Pair vest fleet'}
                </button>
              </div>
            </div>
          )}

          {/* Other integrations */}
          <div>
            <p className="text-[11px] uppercase tracking-wider mb-2" style={{ color: '#9CA3AF' }}>Other integrations</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { id: 'csv' as const, name: 'CSV Upload', desc: 'Generic GPS export · drop a file from any vendor', status: 'connected', sync: 'on demand', color: '#3B82F6' },
                { id: 'polar' as const, name: 'Polar Team Pro', desc: 'GPS + heart rate · live monitoring', status: 'not-connected', sync: 'never', color: '#EF4444' },
              ].map(p => {
                const statusStyle = p.status === 'connected'
                  ? { background: 'rgba(34,197,94,0.15)', color: '#86EFAC', border: '1px solid rgba(34,197,94,0.3)' }
                  : p.status === 'pending'
                  ? { background: 'rgba(245,158,11,0.15)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.3)' }
                  : { background: 'rgba(107,114,128,0.15)', color: '#9CA3AF', border: `1px solid ${BORDER}` }
                const statusLabel = p.status === 'connected' ? 'Connected'
                  : p.status === 'pending' ? 'Pending'
                  : 'Not connected'
                return (
                  <div key={p.id} className="rounded-xl p-4" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center font-black"
                        style={{ background: `${p.color}25`, color: p.color }}>
                        {p.name[0]}
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                        style={statusStyle}>{statusLabel}</span>
                    </div>
                    <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{p.name}</p>
                    <p className="text-[11px] mt-1 mb-3" style={{ color: '#9CA3AF' }}>{p.desc}</p>
                    <p className="text-[10px]" style={{ color: '#6B7280' }}>
                      <Clock size={9} className="inline mr-1" />Last sync: {p.sync}
                    </p>
                    <button onClick={() => setConnectProvider(p.id)}
                      className="mt-3 w-full px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                      style={{ background: 'transparent', color: '#D1D5DB', border: `1px solid ${BORDER}` }}>
                      {p.status === 'connected' ? 'Manage' : p.status === 'pending' ? 'Resume' : 'Connect'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {connectProvider !== 'johan' && (
            <div className="rounded-xl p-4" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
              <p className="text-sm font-semibold mb-3" style={{ color: '#F9FAFB' }}>
                Connect {connectProvider === 'csv' ? 'CSV Upload' : 'Polar'}
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: '#9CA3AF' }}>API Key</label>
                  <input value={connectToken} onChange={e => setConnectToken(e.target.value)}
                    placeholder="Enter your API key"
                    className="w-full text-sm rounded-lg px-3 py-2.5 outline-none"
                    style={{ backgroundColor: SUB_BG, border: `1px solid ${BORDER}`, color: '#F9FAFB' }} />
                </div>
                <button onClick={handleConnect} disabled={saving || !connectToken.trim()}
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    backgroundColor: saved ? '#22C55E' : brandPrimary,
                    color: '#F9FAFB',
                    opacity: saving || !connectToken.trim() ? 0.5 : 1,
                  }}>
                  {saving ? 'Connecting…' : saved ? 'Connected ✓' : 'Connect'}
                </button>
              </div>
            </div>
          )}

          <div className="rounded-xl p-4" style={{ backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
            <p className="text-sm font-semibold mb-2" style={{ color: '#F9FAFB' }}>Or upload CSV manually</p>
            <p className="text-xs mb-3" style={{ color: '#6B7280' }}>Export from your GPS platform and drop it here</p>
            <button onClick={() => setOuterTab('upload')}
              className="rounded-xl p-6 w-full text-center cursor-pointer transition-all hover:opacity-80"
              style={{ backgroundColor: SUB_BG, border: `2px dashed ${BORDER}` }}>
              <Upload size={24} style={{ color: brandSecondary, margin: '0 auto 8px' }} />
              <p className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>Drop GPS export file here</p>
              <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Standard GPS CSV format</p>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── PAGE HEADER ───────────────────────────────────────────────────────────
function Header({ brandPrimary, brandSecondary }: { brandPrimary: string; brandSecondary: string }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${brandPrimary}, ${brandSecondary})` }}>
          <Activity size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black" style={{ color: '#F9FAFB' }}>Performance &amp; GPS</h1>
          <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
            Player load, readiness and GPS tracking — live sessions, sprint analysis, ACWR risk monitoring.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[10px]">
        <span className="px-2 py-1 rounded-full font-bold uppercase tracking-wider"
          style={{ background: `${brandPrimary}20`, color: brandPrimary, border: `1px solid ${brandPrimary}50` }}>
          18 Hz GPS
        </span>
        <span className="px-2 py-1 rounded-full font-bold uppercase tracking-wider"
          style={{ background: 'rgba(34,197,94,0.12)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.4)' }}>
          Live · synced 8 min ago
        </span>
      </div>
    </div>
  )
}

function OuterTabRow({ value, onChange, options, accent }: {
  value: OuterTab
  onChange: (v: OuterTab) => void
  options: { id: OuterTab; label: string }[]
  accent: string
}) {
  return (
    <div className="flex gap-1.5">
      {options.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
          style={{
            backgroundColor: value === t.id ? `${accent}25` : 'transparent',
            color: value === t.id ? '#F1C40F' : '#6B7280',
            border: `1px solid ${value === t.id ? `${accent}60` : BORDER}`,
          }}>
          {t.label}
        </button>
      ))}
    </div>
  )
}
