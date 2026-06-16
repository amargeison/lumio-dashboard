'use client'

// ─── Coach portal — GPS & Video ──────────────────────────────────────────────
// Ported from the tennis PLAYER portal's GPSVideoView (single-subject) and
// reshaped for a coach: a player picker → a session picker → that session's GPS
// metrics, court coverage, Lumio Vision clips and an AI brief. Renderers (KPI
// strip, distance/speed/HR charts, 6-zone court-coverage heatmap, clip grid,
// session-history table, AI brief) are copied from the source and re-themed onto
// the coach portal's T/accent/density tokens — no hardcoded cyan, no Tailwind.
// Demo only: canned data from gps-video-data.ts, no devices, no API.

import { useState, type CSSProperties, type ReactNode } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT, FONT_MONO } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { PLAYERS } from '../_lib/coach-data'
import { GPS_VIDEO_DATA, type GpsSession, type PlayerGpsData } from '../_lib/gps-video-data'

type Common = { T: ThemeTokens; accent: AccentTokens; density: Density }

// Non-cyan semantic palette for multi-series charts (chrome uses accent.hex).
const GREEN = '#22C55E', AMBER = '#F59E0B', RED = '#EF4444', PURPLE = '#A855F7'
const COURT_SURFACE = '#b45309'   // clay — a court colour, not a brand accent

// Green → red heat ramp for the coverage map (data-viz scale, not brand).
const HEAT_STOPS = ['#0E7C3A', '#22C55E', '#FACC15', '#F59E0B', '#EF4444']
const heatColor = (t: number) => {
  const c = Math.max(0, Math.min(1, t))
  return HEAT_STOPS[Math.min(HEAT_STOPS.length - 1, Math.floor(c * (HEAT_STOPS.length - 1)))]
}

const recoveryColor = (T: ThemeTokens, r: GpsSession['recovery']) =>
  r === 'Good' ? T.good : r === 'Moderate' ? T.warn : T.bad

// ─── Namespaced primitives (avoid colliding with CoachModules' Card/SectionHead)

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

// Inline-SVG line chart — copied from the source LineChartSvg, re-themed.
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

// Tennis court outline — copied from the source CourtBase (clay surface).
function CourtBase() {
  return (
    <>
      <rect x="0" y="0" width="300" height="540" rx="4" fill={COURT_SURFACE} />
      <line x1="10" y1="10" x2="10" y2="530" stroke="white" strokeWidth="1.5" />
      <line x1="290" y1="10" x2="290" y2="530" stroke="white" strokeWidth="1.5" />
      <line x1="40" y1="10" x2="40" y2="530" stroke="white" strokeWidth="1" />
      <line x1="260" y1="10" x2="260" y2="530" stroke="white" strokeWidth="1" />
      <line x1="10" y1="10" x2="290" y2="10" stroke="white" strokeWidth="2" />
      <line x1="10" y1="530" x2="290" y2="530" stroke="white" strokeWidth="2" />
      <line x1="0" y1="270" x2="300" y2="270" stroke="white" strokeWidth="3" />
      <line x1="40" y1="140" x2="260" y2="140" stroke="white" strokeWidth="1" />
      <line x1="40" y1="400" x2="260" y2="400" stroke="white" strokeWidth="1" />
      <line x1="150" y1="140" x2="150" y2="270" stroke="white" strokeWidth="1" />
      <line x1="150" y1="270" x2="150" y2="400" stroke="white" strokeWidth="1" />
    </>
  )
}

// ─── GPS Stats panel (sections 2–5 of the source, per session) ───────────────
function GpsStatsPanel({ T, accent, density, session, data }: Common & { session: GpsSession; data: PlayerGpsData }) {
  const totalDistance = session.distanceBySet.reduce((a, b) => a + b.km, 0)
  const avgPerSet = totalDistance / session.distanceBySet.length
  const phaseTotal = data.distanceByPhase.reduce((a, b) => a + b.km, 0)
  const maxSetKm = Math.max(...session.distanceBySet.map(s => s.km))
  const maxSprint = Math.max(...session.sprintsPerSet.map(s => s.n))
  const maxZonePct = Math.max(...session.courtZones.map(z => z.pct))
  const firstSpeed = session.topSpeedPerSet[0]?.kmh ?? 0
  const lastSpeed = session.topSpeedPerSet[session.topSpeedPerSet.length - 1]?.kmh ?? 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: density.gap }}>
      {/* 1 · KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <GpsKpi T={T} label="Total distance" value={`${session.distance.toFixed(1)} km`} sub={`avg ${avgPerSet.toFixed(1)} km/set`} color={accent.hex} />
        <GpsKpi T={T} label="Max speed" value={session.topSpeed.toFixed(1)} sub="km/h" color={RED} />
        <GpsKpi T={T} label="Sprint count" value={session.sprintCount} sub="this session" color={AMBER} />
        <GpsKpi T={T} label="Load score" value={`${session.load} / 100`} sub={`ACWR ${session.acwr.toFixed(2)}`} color={session.load > 80 ? RED : session.load > 60 ? AMBER : T.good} />
        <GpsKpi T={T} label="Recovery" value={session.recovery} sub="between points" color={recoveryColor(T, session.recovery)} />
        <GpsKpi T={T} label="Court coverage" value={`${session.coverage}%`} sub="of own half" color={accent.hex} />
      </div>

      {/* 2 · Distance & Movement */}
      <GpsSectionHead T={T} accent={accent} density={density} n={2} title="Distance & Movement" sub="Per-set, by phase, and where time was spent on court." />
      <div className="cm-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: density.gap }}>
        <GpsCard T={T} accent={accent} density={density} title="Distance by Set" sub={`Total ${totalDistance.toFixed(1)} km · avg ${avgPerSet.toFixed(1)} km/set`}>
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

      <GpsCard T={T} accent={accent} density={density} title="Court Coverage — 6 Zones" sub="% of court time in each zone of the player's half · darker = more time">
        <div className="cm-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: density.gap, alignItems: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <svg viewBox="0 0 300 540" style={{ width: '100%', maxWidth: 240, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.35))' }}>
              <CourtBase />
              {session.courtZones.map((z, i) => {
                const t = z.pct / maxZonePct
                return (
                  <g key={i}>
                    <rect x={z.x * 300} y={z.y * 540} width={z.w * 300} height={z.h * 540} fill={heatColor(t)} opacity={0.35 + t * 0.5} />
                    <text x={(z.x + z.w / 2) * 300} y={(z.y + z.h / 2) * 540} textAnchor="middle" dominantBaseline="middle" fontSize="22" fontWeight="900" fill="white">{z.pct}%</text>
                  </g>
                )
              })}
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {session.courtZones.map(z => (
              <div key={z.label} style={{ display: 'flex', alignItems: 'center', gap: 10, borderRadius: 8, padding: '7px 10px', background: T.panel2, border: `1px solid ${T.border}` }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: heatColor(z.pct / maxZonePct) }} />
                <span style={{ flex: 1, fontSize: 11.5, color: T.text2 }}>{z.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{z.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </GpsCard>

      {/* 3 · Speed & Sprint */}
      <GpsSectionHead T={T} accent={accent} density={density} n={3} title="Speed & Sprint" sub="Time-in-zone, sprint count per set, and peak speed." />
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
        <GpsCard T={T} accent={accent} density={density} title="Sprints by Set" sub="Sprint count per set — pacing across the session">
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

        <GpsCard T={T} accent={accent} density={density} title="Top Speed by Set" sub="Did peak speed hold, or drop late?">
          <GpsLineChart T={T} values={session.topSpeedPerSet.map(s => s.kmh)} labels={session.topSpeedPerSet.map(s => s.set)} max={32} min={16} valueFormat={v => v.toFixed(1)} colour={RED} height={150} width={400} />
          <div style={{ fontSize: 10, marginTop: 4, textAlign: 'center', color: T.text3 }}>
            Peak speed {firstSpeed >= lastSpeed ? 'dropped' : 'rose'} {Math.abs(firstSpeed - lastSpeed).toFixed(1)} km/h across the session{firstSpeed - lastSpeed > 2 ? ' — fatigue indicator' : ''}
          </div>
        </GpsCard>
      </div>

      {/* 4 · Heart Rate & Intensity */}
      <GpsSectionHead T={T} accent={accent} density={density} n={4} title="Heart Rate & Intensity" sub="Where effort was spent and how hard the player worked." />
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
        <GpsCard T={T} accent={accent} density={density} title="HR by Set" sub="Average HR per set — did intensity build?">
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

        <GpsCard T={T} accent={accent} density={density} title="Set 1 → Final Drop-Off" sub="% change across the session — ideal: minimal drop">
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

// ─── AI brief (coach-voiced, per session) ────────────────────────────────────
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

// ─── Connected-device status header (static, brand-correct Lumio names) ───────
function DeviceStatus({ T }: { T: ThemeTokens }) {
  const card = (icon: string, name: string, meta: string) => (
    <div style={{ flex: '1 1 240px', display: 'flex', alignItems: 'center', gap: 10, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: '10px 12px' }}>
      <Icon name={icon} size={16} stroke={1.7} style={{ color: T.text2 }} />
      <span style={{ fontSize: 12.5, fontWeight: 600, color: T.text }}>{name}</span>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: T.good }} />
      <span style={{ fontSize: 11, color: T.good }}>Connected</span>
      <span style={{ marginLeft: 'auto', fontSize: 10.5, color: T.text3 }}>{meta}</span>
    </div>
  )
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {card('crosshair', 'Lumio GPS Tracker', 'Battery 87% · synced 2m ago')}
      {card('eye', 'Lumio Vision', '127 shots logged')}
    </div>
  )
}

// ─── Main view ───────────────────────────────────────────────────────────────
export function GpsVideoView({ T, accent, density }: Common) {
  // Default to the first player who has data, then their latest session.
  const firstWithData = PLAYERS.find(p => GPS_VIDEO_DATA[p.id])?.id ?? PLAYERS[0].id
  const [playerId, setPlayerId] = useState(firstWithData)
  const [sessionId, setSessionId] = useState(GPS_VIDEO_DATA[firstWithData]?.sessions[0]?.id ?? '')
  const [tab, setTab] = useState<'overview' | 'gps' | 'videos' | 'brief'>('overview')

  const data = GPS_VIDEO_DATA[playerId]
  const sessions = data?.sessions ?? []
  const session = sessions.find(s => s.id === sessionId) ?? sessions[0]
  const player = PLAYERS.find(p => p.id === playerId)

  const onPlayer = (id: string) => {
    setPlayerId(id)
    setSessionId(GPS_VIDEO_DATA[id]?.sessions[0]?.id ?? '')
  }

  const selectStyle: CSSProperties = {
    appearance: 'none', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 9,
    color: T.text, fontSize: 13, padding: '9px 30px 9px 12px', fontFamily: FONT, outline: 'none', cursor: 'pointer',
    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(T.text3)}' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
  }
  const labelStyle: CSSProperties = { fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 4, display: 'block' }

  const tabs: ReadonlyArray<readonly ['overview' | 'gps' | 'videos' | 'brief', string]> = [
    ['overview', 'Overview'], ['gps', 'GPS Stats'], ['videos', 'Videos'], ['brief', 'AI Brief'],
  ]

  const kpiStrip = session && (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
      <GpsKpi T={T} label="Court coverage" value={`${session.distance.toFixed(1)} km`} sub="distance covered" color={accent.hex} />
      <GpsKpi T={T} label="Top speed" value={`${session.topSpeed.toFixed(1)}`} sub="km/h" color={accent.hex} />
      <GpsKpi T={T} label="Sprints" value={session.sprintCount} sub="this session" color={accent.hex} />
      <GpsKpi T={T} label="Load score" value={`${session.load} / 100`} sub={`ACWR ${session.acwr.toFixed(2)}`} color={session.load > 80 ? RED : session.load > 60 ? AMBER : T.good} />
      <GpsKpi T={T} label="Recovery" value={session.recovery} sub="index" color={recoveryColor(T, session.recovery)} />
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: density.gap }}>
      {/* Header */}
      <div>
        <h1 style={{ margin: 0, fontFamily: FONT, fontSize: 24, fontWeight: 600, color: T.text, letterSpacing: '-0.02em' }}>GPS &amp; Video</h1>
        <p style={{ margin: '4px 0 0', fontSize: 12.5, color: T.text3 }}>Court coverage, movement load and Lumio Vision clip review — per player, per session.</p>
      </div>

      <DeviceStatus T={T} />

      {/* Player + session picker */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ minWidth: 200 }}>
          <label style={labelStyle}>Player</label>
          <select style={{ ...selectStyle, width: '100%' }} value={playerId} onChange={e => onPlayer(e.target.value)}>
            {PLAYERS.map(p => (
              <option key={p.id} value={p.id}>{p.name}{GPS_VIDEO_DATA[p.id] ? '' : ' — no data'}</option>
            ))}
          </select>
        </div>
        <div style={{ minWidth: 240 }}>
          <label style={labelStyle}>Session</label>
          <select style={{ ...selectStyle, width: '100%' }} value={sessionId} onChange={e => setSessionId(e.target.value)} disabled={sessions.length === 0}>
            {sessions.length === 0 && <option>—</option>}
            {sessions.map(s => (
              <option key={s.id} value={s.id}>{s.date} · {s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {!session ? (
        // Empty state — coach assumes data may not exist yet; NOT a device gate.
        <div style={{ background: T.panel, border: `1px dashed ${T.border}`, borderRadius: density.radius, padding: '40px 20px', textAlign: 'center' }}>
          <Icon name="crosshair" size={26} stroke={1.4} style={{ color: T.text3 }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginTop: 10 }}>No GPS session logged for {player?.name ?? 'this player'} yet</div>
          <div style={{ fontSize: 12, color: T.text3, marginTop: 4 }}>Sessions appear here once this player has trained or played with Lumio GPS Tracker + Lumio Vision.</div>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, padding: 3, background: T.hover, borderRadius: 9, width: 'fit-content' }}>
            {tabs.map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)}
                style={{ appearance: 'none', border: tab === id ? `1px solid ${accent.border}` : '1px solid transparent', padding: '6px 14px', borderRadius: 7, fontSize: 12, cursor: 'pointer', background: tab === id ? accent.dim : 'transparent', color: tab === id ? accent.hex : T.text2, fontWeight: tab === id ? 600 : 400 }}>
                {label}
              </button>
            ))}
          </div>

          {/* Overview */}
          {tab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: density.gap }}>
              {kpiStrip}
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
              <AiBriefPanel T={T} accent={accent} session={session} />
              {/* Session history */}
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

          {/* GPS Stats */}
          {tab === 'gps' && <GpsStatsPanel T={T} accent={accent} density={density} session={session} data={data} />}

          {/* Videos */}
          {tab === 'videos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: density.gap }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Highlight Clips</div>
                  <div style={{ fontSize: 11, color: T.text3 }}>Lumio Vision auto-tagged moments from this session.</div>
                </div>
                <span style={{ fontSize: 11, color: accent.hex, fontWeight: 600 }}>{session.clips.length} clips</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: density.gap }}>
                {session.clips.map((v, i) => (
                  <div key={i} style={{ borderRadius: 12, overflow: 'hidden', background: T.panel, border: `1px solid ${T.border}` }}>
                    <div style={{ padding: '7px 12px', borderBottom: `1px solid ${T.border}`, fontSize: 11, color: T.text2 }}>{v.ctx}</div>
                    <div style={{ position: 'relative', aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: `linear-gradient(135deg, ${v.tint}55, ${v.tint}11)` }}>
                      <svg viewBox="0 0 300 540" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.2 }}>
                        <CourtBase />
                      </svg>
                      <div style={{ position: 'relative', width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="play" size={18} stroke={1.8} style={{ color: '#fff' }} />
                      </div>
                      <span style={{ position: 'absolute', bottom: 8, left: 8, fontSize: 10, fontFamily: FONT_MONO, padding: '1px 6px', borderRadius: 4, background: 'rgba(0,0,0,0.7)', color: '#fff' }}>{v.time}</span>
                      <span style={{ position: 'absolute', bottom: 8, right: 8, fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: accent.dim, color: accent.hex, border: `1px solid ${accent.border}` }}>{v.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Brief */}
          {tab === 'brief' && <AiBriefPanel T={T} accent={accent} session={session} />}
        </>
      )}
    </div>
  )
}
