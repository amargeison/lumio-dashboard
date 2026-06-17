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

import { useState } from 'react'
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
import {
  CourtPositionalHeatmap, CourtCoverageGrid, HeatLegend, TENNIS_RALLY_ANCHORS,
} from './CoachHeatmaps'

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
function Avatar({ accent, initials, size = 44 }: { accent: AccentTokens; initials: string; size?: number }) {
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

export function StudentView({ T, accent, density, playerId }: Props) {
  // The picker lets a head coach demoing "view as student" switch which child's
  // view they see. Defaults to the playerId handed in (Mia Chen / p1).
  const [selId, setSelId] = useState(playerId)
  const [playing, setPlaying] = useState<Recording | null>(null)
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Avatar accent={accent} initials={player.initials} size={58} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: T.text3 }}>👋 Good to see you — here&apos;s how {first} is getting on</div>
            <h1 style={{ margin: '2px 0 0', fontFamily: FONT, fontSize: 26, fontWeight: 700, color: T.text, letterSpacing: '-0.02em' }}>{first}&apos;s progress</h1>
            <div style={{ fontSize: 12.5, color: T.text2, marginTop: 4, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span>{player.group} · Age {player.age}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 18, height: 11, borderRadius: 3, background: belt.colour, border: '1px solid rgba(128,128,128,0.4)' }} />
                {belt.name} racket
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'center', background: T.panel, border: `1px solid ${accent.border}`, borderRadius: 14, padding: '10px 16px' }}>
            <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Goal</div>
            <div style={{ fontSize: 12.5, color: T.text, fontWeight: 600, marginTop: 2, maxWidth: 160 }}>🎯 {player.goal}</div>
          </div>
        </div>
      </PCard>

      {/* ════ THE DIFFERENTIATED TRIO — lead with these ════════════════════════ */}

      {/* 1 · HIGHLIGHTS */}
      <PCard T={T} density={density}>
        <PSection T={T} accent={accent} icon="play" title={`${first}'s session highlights`} sub="Clips your coach saved from recent sessions" lead />
        {videoRecs.length === 0 ? (
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
        )}
        {audioRecs.length > 0 && (
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

      {/* 2 · GPS STATS */}
      <PCard T={T} density={density}>
        <PSection T={T} accent={accent} icon="flame" title={`How hard ${first} worked`} sub={gpsSession ? `Latest session · ${gpsSession.date} · ${gpsSession.surface} court` : 'Movement & effort from Lumio GPS'} lead />
        {gpsSession ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
            <Tile T={T} label="Distance" value={`${gpsSession.distance.toFixed(1)} km`} sub="covered on court" color={accent.hex} />
            <Tile T={T} label="Court coverage" value={`${gpsSession.coverage}%`} sub="of their half" color={accent.hex} />
            <Tile T={T} label="Top speed" value={gpsSession.topSpeed.toFixed(1)} sub="km/h" color={T.text} />
            <Tile T={T} label="Effort" value={`${gpsSession.load}`} sub="load score /100" color={gpsSession.load > 80 ? T.bad : gpsSession.load > 60 ? T.warn : T.good} />
            <Tile T={T} label="Recovery" value={gpsSession.recovery} sub="between points" color={recoveryColour(T, gpsSession.recovery)} />
          </div>
        ) : (
          <EmptyHint T={T} accent={accent} icon="flame" title={`No GPS sessions for ${first} yet`} sub="Stats appear after a session tracked with Lumio GPS." />
        )}
      </PCard>

      {/* 3 · HEATMAPS */}
      <PCard T={T} density={density}>
        <PSection T={T} accent={accent} icon="grid" title={`Where ${first} plays`} sub="Movement & court coverage from their latest session" lead />
        {gpsSession ? (
          <>
            <div style={twoCol}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 6 }}>Rally movement</div>
                <div style={{ maxWidth: 320, margin: '0 auto' }}>
                  <CourtPositionalHeatmap width={CW} height={CH} seed={`${player.id}-${gpsSession.id}-rally`} anchors={TENNIS_RALLY_ANCHORS} />
                </div>
                <div style={{ fontSize: 11, color: T.text3, marginTop: 6, textAlign: 'center' }}>Mostly around the baseline, building rallies — exactly where we want them at this level.</div>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 6 }}>Court coverage</div>
                <div style={{ maxWidth: 320, margin: '0 auto' }}>
                  <CourtCoverageGrid width={CW} height={CH} seed={`${player.id}-${gpsSession.id}-cov`} />
                </div>
                <div style={{ fontSize: 11, color: T.text3, marginTop: 6, textAlign: 'center' }}>How {first} covers their side of the court across the session.</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 12, fontSize: 10, color: T.text3 }}>
              <span style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>Less</span><HeatLegend T={T} /><span style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>More</span>
            </div>
          </>
        ) : (
          <EmptyHint T={T} accent={accent} icon="grid" title={`No movement maps for ${first} yet`} sub="Heatmaps appear after a GPS-tracked session." />
        )}
      </PCard>

      {/* ════ SUPPORTING CAST ══════════════════════════════════════════════════ */}

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
          <div style={{ padding: '14px 16px', borderRadius: 14, background: accent.dim, border: `1px solid ${accent.border}`, fontSize: 14, fontWeight: 700, color: T.text }}>🏆 {first} has reached the top racket — {belt.name}!</div>
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
