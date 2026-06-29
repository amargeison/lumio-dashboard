'use client'

// ─── Coach portal — STUDENT VIEW (Phase 2) ───────────────────────────────────
// The player/parent-facing surface: the future paid student/parent tier and the
// student-app foundation. Reached via the role switcher when role=student — it
// SWAPS the whole dashboard (it is NOT the coach portal filtered). It ASSEMBLES
// existing per-player data (no new capture, no Supabase, no AI):
//   • profile + racket level     ← PLAYERS / BELTS
//   • highlights (video/audio)   ← RECORDINGS_SEED.filter(playerId)
//   • GPS stats + heatmaps       ← GPS_VIDEO_DATA[playerId]  (reuses CoachHeatmaps renderers)
//   • homework / next focus       ← LESSONS.filter(playerId)
//   • racket progression          ← skillScore (per-player derivation)
//   • resources                   ← RESOURCES by current belt (belt-filtered stand-in)
//
// Persona = PARENT, not coach: warm, celebratory, progress-focused, app-like and
// phone-friendly (single-column, auto-fit grids). Leads with the differentiated
// trio — highlights · GPS · heatmaps — then the supporting cast.

import { useState, useEffect } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT, FONT_MONO } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import {
  PLAYERS, BELTS, LESSONS, RESOURCES, MASTERY_LABELS, skillScore,
  type Lesson, type Resource,
} from '../_lib/coach-data'
import { RECORDINGS_SEED, type Recording } from '../_lib/recordings-data'
import { GPS_VIDEO_DATA, type GpsSession } from '../_lib/gps-video-data'
import { getSettings } from '../_lib/settings-store'
import { GpsLineChart } from './CoachHeatmaps'
import { scoreGpsSession, levelFor, bandLabel } from '../_lib/effort-rewards'
import { getFlags as getFeatureFlags, subscribe as subscribeFeatures, type FeatureFlags } from '../_lib/feature-flags'
import { WatchConnectPanel } from './WatchConnectPanel'

type Props = { T: ThemeTokens; accent: AccentTokens; density: Density; playerId: string }

// ─── parent-themed primitives (soft, roomy — not the dense coach UI) ─────────
function PCard({ T, density, children, style }: { T: ThemeTokens; density: Density; children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: Math.max(density.radius, 16), padding: density.pad + 4, boxShadow: T.cardShadow, ...style }}>{children}</div>
}
function PSection({ T, accent, icon, title, sub, lead }: { T: ThemeTokens; accent: AccentTokens; icon: string; title: string; sub?: string; lead?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <span style={{ width: 30, height: 30, borderRadius: 9, display: 'grid', placeItems: 'center', background: accent.dim, border: `1px solid ${accent.border}`, flexShrink: 0 }}>
        <Icon name={icon} size={16} stroke={1.8} style={{ color: accent.hex }} />
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h2 style={{ margin: 0, fontFamily: FONT, fontSize: lead ? 18 : 16, fontWeight: 700, color: T.text, letterSpacing: '-0.01em' }}>{title}</h2>
          {lead && <span style={{ fontSize: 8.5, fontWeight: 700, color: accent.hex, background: accent.dim, padding: '2px 6px', borderRadius: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Highlight</span>}
        </div>
        {sub && <div style={{ fontSize: 12, color: T.text3, marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  )
}
function Tile({ T, label, value, sub, color }: { T: ThemeTokens; label: string; value: React.ReactNode; sub?: string; color?: string }) {
  return (
    <div style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px 14px' }}>
      <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div className="tnum" style={{ fontSize: 22, fontWeight: 800, color: color ?? T.text, marginTop: 3 }}>{value}</div>
      {sub && <div style={{ fontSize: 10.5, color: T.text3, marginTop: 1 }}>{sub}</div>}
    </div>
  )
}
function Avatar({ accent, initials, size = 44, seed }: { accent: AccentTokens; initials: string; size?: number; seed?: string }) {
  if (seed) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`https://i.pravatar.cc/120?u=${encodeURIComponent(seed)}`} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  }
  return <div style={{ width: size, height: size, borderRadius: '50%', display: 'grid', placeItems: 'center', background: accent.dim, color: accent.hex, fontSize: size * 0.36, fontWeight: 800, fontFamily: FONT_MONO, flexShrink: 0 }}>{initials}</div>
}
function EmptyHint({ T, accent, icon, title, sub }: { T: ThemeTokens; accent: AccentTokens; icon: string; title: string; sub?: string }) {
  return (
    <div style={{ background: T.panel2, border: `1px dashed ${T.border}`, borderRadius: 14, padding: '28px 20px', textAlign: 'center' }}>
      <Icon name={icon} size={24} stroke={1.4} style={{ color: accent.hex, opacity: 0.7 }} />
      <div style={{ fontSize: 13.5, fontWeight: 600, color: T.text, marginTop: 8 }}>{title}</div>
      {sub && <div style={{ fontSize: 11.5, color: T.text3, marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

const recoveryColour = (T: ThemeTokens, r: GpsSession['recovery']) => r === 'Good' ? T.good : r === 'Moderate' ? T.warn : T.bad

// ─── GPS report — parent-friendly building blocks (tabbed, so no endless scroll) ──
type GpsTabKey = 'overview' | 'distance' | 'speed' | 'heart' | 'maps'

function GpsTabBar({ T, accent, tab, setTab }: { T: ThemeTokens; accent: AccentTokens; tab: GpsTabKey; setTab: (t: GpsTabKey) => void }) {
  const tabs: { key: GpsTabKey; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'distance', label: 'Distance & movement' },
    { key: 'speed', label: 'Speed & sprint' },
    { key: 'heart', label: 'Heart rate' },
  ]
  return (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 14, WebkitOverflowScrolling: 'touch' }}>
      {tabs.map(t => {
        const on = t.key === tab
        return (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ appearance: 'none', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: FONT, fontSize: 12.5, fontWeight: 700,
              padding: '8px 14px', borderRadius: 999, border: `1px solid ${on ? accent.border : T.border}`,
              background: on ? accent.dim : T.panel2, color: on ? accent.hex : T.text2 }}>
            {t.label}
          </button>
        )
      })}
    </div>
  )
}

// Vertical bar chart for per-block series (distance / sprints).
function VBars({ T, items, color, fmt }: { T: ThemeTokens; items: { label: string; value: number; sub?: string }[]; color: string; fmt?: (v: number) => string }) {
  const max = Math.max(...items.map(i => i.value)) || 1
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 124 }}>
      {items.map(s => (
        <div key={s.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color }}>{fmt ? fmt(s.value) : s.value}</div>
          <div style={{ width: '100%', borderRadius: '4px 4px 0 0', height: `${(s.value / max) * 100}%`, minHeight: 8, background: `linear-gradient(180deg, ${color}, ${color}40)` }} />
          <div style={{ fontSize: 10, color: T.text3, textAlign: 'center' }}>{s.label}</div>
          {s.sub && <div style={{ fontSize: 10, color: T.text4 }}>{s.sub}</div>}
        </div>
      ))}
    </div>
  )
}

// Stacked proportion bar + legend rows (distance-by-phase, HR zones).
function StackedBar({ T, segments }: { T: ThemeTokens; segments: { label: string; pct: number; colour: string; right?: string }[] }) {
  return (
    <>
      <div style={{ display: 'flex', height: 24, borderRadius: 6, overflow: 'hidden', marginBottom: 12 }}>
        {segments.map(s => <div key={s.label} title={`${s.label} ${s.pct.toFixed(0)}%`} style={{ width: `${s.pct}%`, background: s.colour }} />)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {segments.map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: s.colour }} />
            <span style={{ flex: 1, color: T.text2 }}>{s.label}</span>
            {s.right && <span style={{ fontWeight: 700, color: T.text }}>{s.right}</span>}
            <span style={{ color: T.text3, width: 40, textAlign: 'right' }}>{s.pct.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </>
  )
}

function SubCard({ T, title, sub, children }: { T: ThemeTokens; title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: T.text }}>{title}</div>
      {sub && <div style={{ fontSize: 11, color: T.text3, marginTop: 2, lineHeight: 1.4 }}>{sub}</div>}
      <div style={{ marginTop: 12 }}>{children}</div>
    </div>
  )
}

export function StudentView({ T, accent, density, playerId }: Props) {
  // The picker lets a head coach demoing "view as student" switch which child's
  // view they see. Defaults to the playerId handed in (Mia Chen / p1).
  const [selId, setSelId] = useState(playerId)
  const [playing, setPlaying] = useState<Recording | null>(null)
  const [gpsTab, setGpsTab] = useState<GpsTabKey>('overview')
  const [feat, setFeat] = useState<FeatureFlags>(getFeatureFlags())
  useEffect(() => { const r = () => setFeat(getFeatureFlags()); r(); return subscribeFeatures(r) }, [])
  const player = PLAYERS.find(p => p.id === selId) ?? PLAYERS[0]
  const first = player.name.split(' ')[0]

  // ─── assembled data (all already player-keyed) ─────────────────────────────
  const belt = BELTS[player.beltIndex]
  const isTop = player.beltIndex >= BELTS.length - 1
  const nextBelt = BELTS[Math.min(player.beltIndex + 1, BELTS.length - 1)]
  const threshold = getSettings().awardThreshold
  const skillScores = belt.skills.map((_s, si) => skillScore(player.seed, player.beltIndex, si, player.beltIndex))
  const skillsRemaining = skillScores.filter(v => v < threshold).length
  const progressPct = Math.round(((belt.skills.length - skillsRemaining) / belt.skills.length) * 100)

  const videoRecs = RECORDINGS_SEED.filter(r => r.kind === 'video' && r.playerId === player.id)
  const audioRecs = RECORDINGS_SEED.filter(r => r.kind === 'audio' && r.playerId === player.id)

  const gps = GPS_VIDEO_DATA[player.id]
  const gpsSession = (gps?.sessions ?? []).slice().sort((a, b) => b.date.localeCompare(a.date))[0]
  // derived GPS report values (safe when no session)
  const phaseTotal = (gps?.distanceByPhase ?? []).reduce((a, b) => a + b.km, 0) || 1
  const blockWord = gpsSession && gpsSession.distanceBySet.length > 1 ? 'block' : 'day'
  const tsFirst = gpsSession?.topSpeedPerSet[0]?.kmh ?? 0
  const tsLast = gpsSession?.topSpeedPerSet[gpsSession.topSpeedPerSet.length - 1]?.kmh ?? 0

  const playerLessons = LESSONS.filter(l => l.playerId === player.id)
  const latestLesson: Lesson | undefined = playerLessons[playerLessons.length - 1]

  const recommended: Resource[] = RESOURCES.filter(r => r.belt === belt.id)

  // ─── responsive helpers (no media queries — auto-fit collapses on a phone) ──
  const twoCol: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: density.gap }
  const CW = 600, CH = 1100

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: density.gap, fontFamily: FONT }}>
      <style>{`.tnum{font-variant-numeric:tabular-nums}`}</style>

      {/* ── Player picker + warm parent header ─────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: FONT_MONO }}>Parent &amp; player view</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11.5, color: T.text3 }}>Viewing</span>
          <select value={selId} onChange={e => { setSelId(e.target.value); setPlaying(null) }}
            style={{ appearance: 'none', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, fontSize: 13, fontWeight: 600, padding: '8px 30px 8px 12px', fontFamily: FONT, cursor: 'pointer',
              backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(T.text3)}' stroke-width='2'><polyline points='6 9 12 15 18 9'/></svg>")`,
              backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}>
            {PLAYERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      <PCard T={T} density={density} style={{ background: `linear-gradient(135deg, ${accent.dim}, ${T.panel})`, borderColor: accent.border }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Avatar accent={accent} initials={player.initials} size={56} seed={player.name} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: T.text3 }}>👋 Good to see you — here&apos;s how {first} is getting on</div>
            <h1 style={{ margin: '2px 0 0', fontFamily: FONT, fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: '-0.02em', lineHeight: 1.15 }}>{first}&apos;s progress</h1>
            <div style={{ fontSize: 12.5, color: T.text2, marginTop: 6, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span>{player.group} · Age {player.age}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 18, height: 11, borderRadius: 3, background: belt.colour, border: '1px solid rgba(128,128,128,0.4)' }} />
                {belt.name} racket
              </span>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10, background: T.panel, border: `1px solid ${accent.border}`, borderRadius: 14, padding: '10px 14px' }}>
          <span style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, flexShrink: 0 }}>Goal</span>
          <span style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>🎯 {player.goal}</span>
        </div>
      </PCard>

      {/* Connect a watch — earn XP from your own smartwatch */}
      <WatchConnectPanel
        T={T} accent={accent}
        token={`demo-${player.seed}-lumio-watch-sample-token`}
        playerName={first}
        consentOk
      />

      {/* ════ THE DIFFERENTIATED TRIO — lead with these ════════════════════════ */}

      {/* 1 · HIGHLIGHTS */}
      {(feat.video || feat.audio) && (
      <PCard T={T} density={density}>
        <PSection T={T} accent={accent} icon="play" title={`${first}'s session highlights`} sub="Clips your coach saved from recent sessions" lead />
        {feat.video && (videoRecs.length === 0 ? (
          <EmptyHint T={T} accent={accent} icon="play" title={`No highlight clips for ${first} yet`} sub="Clips appear here after a session your coach records with Lumio Vision." />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: density.gap }}>
            {videoRecs.map(v => (
              <button key={v.id} onClick={() => setPlaying(v)} style={{ appearance: 'none', textAlign: 'left', cursor: 'pointer', padding: 0, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden', background: T.panel }}>
                <div style={{ position: 'relative', aspectRatio: '16 / 9', display: 'grid', placeItems: 'center', background: `linear-gradient(135deg, ${v.tint ?? accent.hex}66, ${v.tint ?? accent.hex}18)` }}>
                  <span style={{ width: 46, height: 46, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', display: 'grid', placeItems: 'center' }}><Icon name="play" size={18} stroke={1.9} style={{ color: '#fff' }} /></span>
                  {v.clipTime && <span style={{ position: 'absolute', bottom: 8, left: 8, fontSize: 10, fontFamily: FONT_MONO, padding: '1px 6px', borderRadius: 4, background: 'rgba(0,0,0,0.7)', color: '#fff' }}>{v.clipTime}</span>}
                </div>
                <div style={{ padding: '9px 11px' }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.label}</div>
                  <div style={{ fontSize: 10.5, color: T.text3, marginTop: 1 }}>{v.ctx ?? v.date}</div>
                </div>
              </button>
            ))}
          </div>
        ))}
        {feat.audio && audioRecs.length > 0 && (
          <div style={{ marginTop: density.gap }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Coach voice notes</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {audioRecs.map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10 }}>
                  <span style={{ width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', background: accent.dim, flexShrink: 0 }}><Icon name="mic" size={15} stroke={1.7} style={{ color: accent.hex }} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: T.text }}>{a.label}</div>
                    <div style={{ fontSize: 10.5, color: T.text3 }}>{a.date} · {a.durationMins} min</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </PCard>
      )}

      {feat.effort && (<>
      {/* 2 · EFFORT REPORT — session effort detail, tabbed so it's not endless scroll */}
      <PCard T={T} density={density}>
        <PSection T={T} accent={accent} icon="flame" title={`${first}'s session report`} sub={gpsSession ? `Latest session · ${gpsSession.date} · ${gpsSession.surface} court · ${gpsSession.duration} min` : 'Movement & effort from Lumio GPS'} lead />
        {gpsSession ? (
          <>
            <GpsTabBar T={T} accent={accent} tab={gpsTab} setTab={setGpsTab} />

            {/* ── OVERVIEW ── */}
            {gpsTab === 'overview' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
                  <Tile T={T} label="Distance" value={`${gpsSession.distance.toFixed(1)} km`} sub="covered on court" color={accent.hex} />
                  <Tile T={T} label="Court coverage" value={`${gpsSession.coverage}%`} sub="of their half" color={accent.hex} />
                  <Tile T={T} label="Top speed" value={gpsSession.topSpeed.toFixed(1)} sub="km/h" color={T.text} />
                  <Tile T={T} label="Sprints" value={gpsSession.sprintCount} sub="bursts of pace" color={T.text} />
                  <Tile T={T} label="Effort" value={`${gpsSession.load}`} sub="load score /100" color={gpsSession.load > 80 ? T.bad : gpsSession.load > 60 ? T.warn : T.good} />
                  <Tile T={T} label="Recovery" value={gpsSession.recovery} sub="between points" color={recoveryColour(T, gpsSession.recovery)} />
                </div>
                <div style={{ marginTop: 12, fontSize: 12, color: T.text2, lineHeight: 1.55, background: accent.dim, border: `1px solid ${accent.border}`, borderRadius: 12, padding: '12px 14px' }}>
                  {first} covered <strong style={{ color: T.text }}>{gpsSession.distance.toFixed(1)} km</strong> over {gpsSession.duration} minutes, hit a top speed of <strong style={{ color: T.text }}>{gpsSession.topSpeed.toFixed(1)} km/h</strong>, and finished with <strong style={{ color: T.text }}>{gpsSession.recovery.toLowerCase()}</strong> recovery. Tap the tabs above for the full breakdown.
                </div>
              </>
            )}

            {/* ── DISTANCE & MOVEMENT ── */}
            {gpsTab === 'distance' && (
              <div style={twoCol}>
                <SubCard T={T} title={`Distance by ${blockWord === 'block' ? 'block' : 'day'}`} sub={`Total ${gpsSession.distance.toFixed(1)} km across the session`}>
                  <VBars T={T} color={accent.hex} fmt={v => `${v} km`} items={gpsSession.distanceBySet.map(s => ({ label: s.set, value: s.km, sub: `Load ${s.load}` }))} />
                </SubCard>
                <SubCard T={T} title="What the movement was" sub="Where the running happened during play">
                  <StackedBar T={T} segments={(gps?.distanceByPhase ?? []).map(p => ({ label: p.phase, pct: (p.km / phaseTotal) * 100, colour: p.c, right: `${p.km.toFixed(1)} km` }))} />
                </SubCard>
              </div>
            )}

            {/* ── SPEED & SPRINT ── */}
            {gpsTab === 'speed' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: density.gap }}>
                <SubCard T={T} title="Speed zones" sub="How much time was spent walking, jogging, running and sprinting">
                  {(gps?.speedZones ?? []).map(z => (
                    <div key={z.zone} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: T.text2, marginBottom: 4 }}>
                        <span>{z.zone}</span>
                        <span style={{ color: z.c, fontWeight: 700 }}>{z.pct}% · {z.time}</span>
                      </div>
                      <div style={{ height: 12, borderRadius: 4, background: T.hover, overflow: 'hidden' }}>
                        <div style={{ height: 12, width: `${Math.min(100, z.pct * 2.4)}%`, background: z.c, opacity: 0.85, borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                </SubCard>
                <div style={twoCol}>
                  <SubCard T={T} title="Sprints" sub="Bursts of pace across the session">
                    <VBars T={T} color={T.warn} items={gpsSession.sprintsPerSet.map(s => ({ label: s.set, value: s.n }))} />
                  </SubCard>
                  <SubCard T={T} title="Top speed" sub={`Peak speed ${tsFirst >= tsLast ? 'eased off' : 'rose'} ${Math.abs(tsFirst - tsLast).toFixed(1)} km/h through the session`}>
                    <GpsLineChart T={T} values={gpsSession.topSpeedPerSet.map(s => s.kmh)} labels={gpsSession.topSpeedPerSet.map(s => s.set)} max={32} min={16} valueFormat={v => v.toFixed(1)} colour={T.bad} height={150} width={400} />
                  </SubCard>
                </div>
              </div>
            )}

            {/* ── HEART RATE ── */}
            {gpsTab === 'heart' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: density.gap }}>
                <SubCard T={T} title="Heart-rate zones" sub="How hard the heart was working across the session">
                  <StackedBar T={T} segments={(gps?.hrZones ?? []).map(z => ({ label: z.zone, pct: z.pct, colour: z.color }))} />
                </SubCard>
                <SubCard T={T} title={`Effort by ${blockWord}`} sub="Average heart rate — did the intensity build?">
                  <GpsLineChart T={T} values={gpsSession.hrBySet.map(s => s.avg)} labels={gpsSession.hrBySet.map(s => s.set)} max={180} min={120} valueFormat={v => `${v}`} colour={accent.hex} height={150} width={400} />
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${gpsSession.hrBySet.length}, 1fr)`, gap: 8, marginTop: 10 }}>
                    {gpsSession.hrBySet.map(s => (
                      <div key={s.set} style={{ borderRadius: 8, padding: 8, textAlign: 'center', background: T.panel, border: `1px solid ${T.border}` }}>
                        <div style={{ fontSize: 9, color: T.text3 }}>{s.set}</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: accent.hex }}>{s.avg}</div>
                        <div style={{ fontSize: 9, color: T.text3 }}>peak {s.peak}</div>
                      </div>
                    ))}
                  </div>
                </SubCard>
              </div>
            )}

          </>
        ) : (
          <EmptyHint T={T} accent={accent} icon="flame" title={`No GPS sessions for ${first} yet`} sub="Stats appear after a session tracked with Lumio GPS." />
        )}
      </PCard>

      {/* EFFORT REWARDS — XP from their own watch (separate from Racket Progression) */}
      <PCard T={T} density={density}>
        <PSection T={T} accent={accent} icon="trophy" title={`${first}'s effort rewards`} sub="XP earned from sessions on their own smartwatch" lead />
        {(() => {
          const es = (gps?.sessions ?? []).map(s => ({ s, sc: scoreGpsSession(s, player.age) }))
          if (!es.length) return <EmptyHint T={T} accent={accent} icon="trophy" title={`No watch sessions for ${first} yet`} sub="Connect a watch to start earning XP each session." />
          const xpTotal = es.reduce((a, x) => a + x.sc.xp, 0)
          const lvl = levelFor(xpTotal)
          const latest = es[0]
          const tone = (n: number) => n >= 70 ? T.good : n >= 40 ? T.warn : T.bad
          return (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 14 }}>
                <div style={{ minWidth: 110 }}>
                  <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total XP</div>
                  <div className="tnum" style={{ fontSize: 32, fontWeight: 800, color: accent.hex, lineHeight: 1.1 }}>{xpTotal.toLocaleString()}</div>
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                    <span style={{ color: T.text2, fontWeight: 700 }}>🏅 Level {lvl.idx + 1} · {lvl.cur.name}</span>
                    <span style={{ color: T.text3 }}>{lvl.next ? `Next: ${lvl.next.name}` : 'Max level'}</span>
                  </div>
                  <div style={{ height: 12, borderRadius: 999, background: T.hover, overflow: 'hidden', border: `1px solid ${T.border}` }}>
                    <div style={{ width: `${lvl.pct}%`, height: '100%', background: accent.hex }} />
                  </div>
                  <div style={{ fontSize: 11, color: T.text3, marginTop: 5 }}>{lvl.next ? `${(lvl.next.min - xpTotal).toLocaleString()} XP to ${lvl.next.name}` : 'Top level reached'} · {es.length} session{es.length === 1 ? '' : 's'}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10 }}>
                {([['Effort', latest.sc.effort], ['Movement', latest.sc.movement], ['Consistency', latest.sc.consistency]] as const).map(([l, n]) => (
                  <div key={l} style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 12, padding: '11px 13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</span>
                      <span style={{ fontSize: 9.5, fontWeight: 800, color: tone(n) }}>{bandLabel(n)}</span>
                    </div>
                    <div className="tnum" style={{ fontSize: 22, fontWeight: 800, color: T.text, marginTop: 2 }}>{n}<span style={{ fontSize: 11, color: T.text3 }}>/100</span></div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: T.text3, lineHeight: 1.5, margin: '12px 0 0' }}>
                Estimated smartwatch effort — it builds XP and effort levels, stays separate from racket progression, and never tracks court position.
              </p>
            </>
          )
        })()}
      </PCard>
      </>)}

      {/* ════ SUPPORTING CAST ══════════════════════════════════════════════════ */}

      {feat.racket && (<>
      {/* RACKET PROGRESSION — framed as a reward to earn */}
      <PCard T={T} density={density}>
        <PSection T={T} accent={accent} icon="trophy" title="Racket progression" sub="Earn the next racket by mastering every skill" />
        {!isTop ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 14, background: accent.dim, border: `1px solid ${accent.border}`, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 30 }}>🏆</span>
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>
                {skillsRemaining === 0 ? `${first} is ready for their ${nextBelt.name} racket!` : `${first} is ${skillsRemaining} skill${skillsRemaining === 1 ? '' : 's'} from their ${nextBelt.name} racket`}
              </div>
              <div style={{ fontSize: 11.5, color: T.text2, marginTop: 2 }}>Master every {belt.name} skill to earn the next racket — and a certificate to keep.</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 26, height: 16, borderRadius: 4, background: belt.colour, border: '1px solid rgba(128,128,128,0.4)' }} title={`${belt.name} (now)`} />
              <Icon name="chevron-right" size={16} stroke={2} style={{ color: T.text3 }} />
              <span style={{ width: 26, height: 16, borderRadius: 4, background: nextBelt.colour, border: '1px solid rgba(128,128,128,0.4)', opacity: 0.85 }} title={`${nextBelt.name} (next)`} />
            </div>
          </div>
        ) : (
          <div style={{ padding: '14px 16px', borderRadius: 14, background: accent.dim, border: `1px solid ${accent.border}`, fontSize: 14, fontWeight: 700, color: T.text }}>🏆 {first} has reached {belt.name} — the top racket — and earned the Lumio trophy!</div>
        )}

        {/* progress + the journey ahead */}
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11.5, color: T.text2, fontWeight: 600 }}>{belt.name} racket · {belt.theme}</span>
            <span className="tnum" style={{ fontSize: 11.5, color: accent.hex, fontFamily: FONT_MONO, fontWeight: 700 }}>{progressPct}% mastered</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: T.hover, overflow: 'hidden' }}>
            <div style={{ width: `${progressPct}%`, height: '100%', background: accent.hex }} />
          </div>
        </div>

        {/* the ladder — where they are, and what's ahead */}
        <div style={{ display: 'flex', gap: 5, marginTop: 14, flexWrap: 'wrap' }}>
          {BELTS.map((b, bi) => {
            const state = bi < player.beltIndex ? 'done' : bi === player.beltIndex ? 'now' : 'next'
            return (
              <div key={b.id} style={{ flex: '1 1 64px', textAlign: 'center', opacity: state === 'next' ? 0.5 : 1 }}>
                <div style={{ height: 16, borderRadius: 4, background: b.colour, border: `1px solid ${state === 'now' ? accent.hex : 'rgba(128,128,128,0.4)'}`, boxShadow: state === 'now' ? `0 0 0 2px ${accent.dim}` : 'none' }} />
                <div style={{ fontSize: 9, color: state === 'now' ? accent.hex : T.text3, fontWeight: state === 'now' ? 700 : 500, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</div>
                {state === 'done' && <Icon name="check" size={11} stroke={2.4} style={{ color: T.good }} />}
                {state === 'now' && <span style={{ fontSize: 8, fontWeight: 700, color: accent.hex }}>NOW</span>}
              </div>
            )
          })}
        </div>

        {/* current-racket skills */}
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 9 }}>
          {belt.skills.map((s, si) => {
            const score = skillScores[si]
            const done = score >= threshold
            return (
              <div key={s.id}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 12.5, color: T.text, fontWeight: 500 }}>{done ? '✅ ' : ''}{s.name}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 10.5, color: done ? T.good : T.text3, fontFamily: FONT_MONO, fontWeight: 600 }}>{MASTERY_LABELS[score]}</span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[1, 2, 3, 4].map(lv => <div key={lv} style={{ flex: 1, height: 5, borderRadius: 3, background: lv <= score ? (done ? T.good : accent.hex) : T.hover }} />)}
                </div>
              </div>
            )
          })}
        </div>
      </PCard>
      </>)}

      {/* HOMEWORK + NEXT FOCUS */}
      <PCard T={T} density={density}>
        <PSection T={T} accent={accent} icon="home" title="Homework & what's next" sub="What to practise before the next session" />
        {latestLesson ? (
          <div style={twoCol}>
            <div style={{ background: accent.dim, border: `1px solid ${accent.border}`, borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Practice at home</div>
              <div style={{ fontSize: 13, color: T.text, marginTop: 4, lineHeight: 1.5 }}>{latestLesson.homework || 'No homework set this time — just keep enjoying it!'}</div>
            </div>
            <div style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Next session focus</div>
              <div style={{ fontSize: 13, color: T.text, marginTop: 4, lineHeight: 1.5 }}>{latestLesson.nextFocus}</div>
            </div>
          </div>
        ) : (
          <EmptyHint T={T} accent={accent} icon="home" title="No homework yet" sub="Practice tips appear after a lesson summary." />
        )}
      </PCard>

      {/* LESSON HISTORY */}
      <PCard T={T} density={density}>
        <PSection T={T} accent={accent} icon="note" title="Recent lessons" sub="What you worked on, and your coach's notes" />
        {playerLessons.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {playerLessons.slice().reverse().map(l => (
              <div key={l.id} style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{l.focus}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 10.5, color: T.text3, fontFamily: FONT_MONO }}>{l.date} · {l.type}</span>
                  <span style={{ display: 'flex', gap: 1 }}>{Array.from({ length: 5 }).map((_, i) => <span key={i} style={{ color: i < l.rating ? accent.hex : T.text4, fontSize: 12 }}>★</span>)}</span>
                </div>
                {l.takeaways[0] && <div style={{ fontSize: 12, color: T.text2, marginTop: 6, lineHeight: 1.5 }}>“{l.takeaways[0]}”</div>}
                {l.coachNote && <div style={{ fontSize: 11.5, color: T.text3, marginTop: 6, fontStyle: 'italic', display: 'flex', gap: 6 }}><Icon name="megaphone" size={12} stroke={1.7} style={{ color: accent.hex, flexShrink: 0, marginTop: 2 }} />Coach: {l.coachNote}</div>}
              </div>
            ))}
          </div>
        ) : (
          <EmptyHint T={T} accent={accent} icon="note" title="No lesson summaries yet" sub="Your coach's summaries will show here after each lesson." />
        )}
      </PCard>

      {/* RESOURCES — belt-filtered, framed for this player */}
      <PCard T={T} density={density}>
        <PSection T={T} accent={accent} icon="newspaper" title={`Recommended for ${first}'s level`} sub={`Drills & guides matched to the ${belt.name} racket`} />
        {recommended.length ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: density.gap }}>
            {recommended.map(r => (
              <div key={r.id} style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', background: accent.dim, flexShrink: 0 }}><Icon name={r.format === 'Video' ? 'play' : 'note'} size={15} stroke={1.7} style={{ color: accent.hex }} /></span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: T.text, lineHeight: 1.3 }}>{r.title}</div>
                    <div style={{ fontSize: 10, color: T.text3 }}>{r.category} · {r.format}</div>
                  </div>
                </div>
                <div style={{ fontSize: 11.5, color: T.text2, marginTop: 8, lineHeight: 1.45 }}>{r.desc}</div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyHint T={T} accent={accent} icon="newspaper" title="No resources for this level yet" sub="Your coach can recommend drills and guides here." />
        )}
      </PCard>

      <div style={{ textAlign: 'center', fontSize: 10.5, color: T.text4, padding: '4px 0 8px' }}>Lumio · player &amp; parent view · demo data shown</div>

      {/* ── In-place highlight player (demo — no real file) ─────────────────── */}
      {playing && (
        <div onClick={e => { if (e.target === e.currentTarget) setPlaying(null) }}
          style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5vh 16px' }}>
          <div style={{ width: '100%', maxWidth: 640, background: T.panel, border: `1px solid ${T.borderHi}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 30px 80px -20px rgba(0,0,0,0.7)' }}>
            <div style={{ position: 'relative', aspectRatio: '16 / 9', display: 'grid', placeItems: 'center', background: `linear-gradient(135deg, ${playing.tint ?? accent.hex}66, ${playing.tint ?? accent.hex}18)` }}>
              <span style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', display: 'grid', placeItems: 'center' }}><Icon name="play" size={24} stroke={1.9} style={{ color: '#fff' }} /></span>
              <span style={{ position: 'absolute', bottom: 10, left: 12, fontSize: 11, color: 'rgba(255,255,255,0.85)' }}>Highlight clip · demo preview</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: T.text }}>{playing.label}</div>
                <div style={{ fontSize: 11.5, color: T.text3 }}>{playing.ctx ?? playing.date}{playing.clipTime ? ` · ${playing.clipTime}` : ''}</div>
              </div>
              <button onClick={() => setPlaying(null)} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text3, cursor: 'pointer', width: 32, height: 32, fontSize: 18, lineHeight: 1 }}>×</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
