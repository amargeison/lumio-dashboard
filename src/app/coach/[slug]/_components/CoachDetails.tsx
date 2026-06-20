'use client'

// Two add-ons, kept in their own self-contained file:
//  • LessonAiBrief   — an AI-style coaching brief generated from a lesson
//                      (what to work on + a suggested next-session plan).
//  • PlayerDetailModal — full player detail/stats popover for the roster.

import { useState, useEffect, type CSSProperties, type ReactNode } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT, FONT_MONO } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import {
  BELTS, ALL_SKILLS, MASTERY_LABELS, skillScore, PLAYER_CONTACTS, COACH_ORG, playerLessons,
  type Player, type Lesson,
} from '../_lib/coach-data'
import { addPlan, hasPlan } from '../_lib/session-plan'
import { getSettings } from '../_lib/settings-store'
import { requestOpenLesson } from '../_lib/lessons-store'
import { currentBeltOf, skillScoreFor, beltProgressFor, skillsEarnedFor, setGrade, setBelt, subscribe as subscribeGrades } from '../_lib/racket-grade-store'
import { WatchConnectPanel } from './WatchConnectPanel'

type Common = { T: ThemeTokens; accent: AccentTokens; density: Density }

// ─── local primitives ───────────────────────────────────────────────────────
function Card({ T, density, children, style }: { T: ThemeTokens; density: Density; children: ReactNode; style?: CSSProperties }) {
  return <div style={{ position: 'relative', background: T.panel, border: `1px solid ${T.border}`, borderRadius: density.radius, padding: density.pad, boxShadow: T.cardShadow, ...style }}>{children}</div>
}
function SectionHead({ T, title, right }: { T: ThemeTokens; title: ReactNode; right?: ReactNode }) {
  return <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 10, gap: 8 }}><div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{title}</div><div style={{ marginLeft: 'auto', fontSize: 11, color: T.text3, display: 'flex', alignItems: 'center', gap: 4 }}>{right}</div></div>
}
function Pill({ T, children, color, bg }: { T: ThemeTokens; children: ReactNode; color?: string; bg?: string }) {
  return <span style={{ fontSize: 9.5, fontFamily: FONT_MONO, padding: '2px 6px', borderRadius: 4, background: bg ?? T.hover, color: color ?? T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{children}</span>
}
function Avatar({ accent, initials, size = 30 }: { accent: AccentTokens; initials: string; size?: number }) {
  return <div style={{ width: size, height: size, borderRadius: '50%', display: 'grid', placeItems: 'center', background: accent.dim, color: accent.hex, fontSize: size * 0.34, fontWeight: 700, fontFamily: FONT_MONO, flexShrink: 0 }}>{initials}</div>
}
function BeltChip({ beltIndex, size = 18 }: { beltIndex: number; size?: number }) {
  const b = BELTS[beltIndex]
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: size, height: size * 0.62, borderRadius: 3, background: b.colour, border: '1px solid rgba(128,128,128,0.4)' }} /><span style={{ fontSize: 12, fontWeight: 600 }}>{b.name}</span></span>
}
const statusDot = (T: ThemeTokens, s: 'green' | 'amber' | 'red') => s === 'green' ? T.good : s === 'amber' ? T.warn : T.bad
const masteryColor = (T: ThemeTokens, accent: AccentTokens, score: number) => [T.text4, T.warn, '#3A8EE0', T.good, accent.hex][score] ?? T.text4
function beltProgress(p: Player, beltIndex: number) {
  const threshold = getSettings().awardThreshold
  const belt = BELTS[beltIndex]
  const done = belt.skills.filter((_s, si) => skillScoreFor(p, beltIndex, si) >= threshold).length
  return Math.round((done / belt.skills.length) * 100)
}

// ════════════════════════════════════════════════════════════════════════════
// LESSON AI BRIEF  (generated from the lesson)
// ════════════════════════════════════════════════════════════════════════════
function buildBrief(lesson: Lesson) {
  const skillNames = lesson.skillsWorked.map(id => ALL_SKILLS.find(s => s.id === id)?.name ?? id)
  const issue = lesson.takeaways[lesson.takeaways.length - 1] ?? lesson.focus
  const workOn = [
    `Lock in the next step — ${lesson.nextFocus}`,
    `Tidy the loose end from today: ${issue.toLowerCase()}`,
    skillNames.length ? `Keep reinforcing ${skillNames.join(', ').toLowerCase()}` : `Keep grooving ${lesson.focus.toLowerCase()}`,
  ]
  const plan = [
    { phase: 'Warm-up & movement', mins: 8, detail: 'Dynamic prep, split-step reactions, easy mini-tennis to find the timing.' },
    { phase: 'Technical', mins: 15, detail: `Re-groove ${lesson.focus.toLowerCase()} — ${lesson.drills[0] ?? 'controlled feeds with a clear cue'}.` },
    { phase: 'Constraint drill', mins: 12, detail: `${lesson.drills[1] ?? 'Target drill'} with a success target before progressing.` },
    { phase: 'Tactical / live', mins: 15, detail: `Carry "${lesson.nextFocus.toLowerCase()}" into live points and patterns.` },
    { phase: 'Match-play & review', mins: 10, detail: 'Score-based games, then a 2-minute video review and set the next homework.' },
  ]
  const drills = [
    ...lesson.drills.slice(0, 2),
    `Pressure rep: ${lesson.nextFocus.toLowerCase()} on every 3rd ball`,
  ]
  const parentTip = `Encourage 10 minutes a day at home: ${lesson.homework}`
  return { workOn, plan, drills, parentTip }
}

export function LessonAiBrief({ T, accent, density, lesson }: Common & { lesson: Lesson }) {
  const brief = buildBrief(lesson)
  const totalMins = brief.plan.reduce((s, p) => s + p.mins, 0)
  const planId = `lesson-${lesson.id}`
  const [added, setAdded] = useState(false)
  useEffect(() => { setAdded(hasPlan(planId)) }, [planId])
  const onAddPlan = () => {
    addPlan({ id: planId, player: lesson.player, focus: lesson.nextFocus, source: `from lesson ${lesson.date}`, createdAt: Date.now(), workOn: brief.workOn, plan: brief.plan, drills: brief.drills })
    setAdded(true)
  }
  return (
    <Card T={T} density={density} style={{ marginTop: density.gap, borderColor: accent.border, background: `linear-gradient(180deg, ${accent.dim}, transparent 60%)` }}>
      <SectionHead T={T}
        title={<><Icon name="sparkles" size={14} stroke={1.6} style={{ color: accent.hex, marginRight: 6, verticalAlign: -2 }} />Coach AI brief</>}
        right={<span style={{ fontFamily: FONT_MONO }}>from this session</span>}
      />
      <div className="cm-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* work on */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>What to work on next</div>
          {brief.workOn.map((w, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '5px 0', fontSize: 12.5, color: T.text, lineHeight: 1.45 }}>
              <span style={{ color: accent.hex, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>{w}
            </div>
          ))}
          <div style={{ marginTop: 12, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 11px' }}>
            <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Parent tip</div>
            <div style={{ fontSize: 12, color: T.text2, marginTop: 3 }}>{brief.parentTip}</div>
          </div>
        </div>
        {/* next session plan */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Suggested next session</div>
            <span className="tnum" style={{ marginLeft: 'auto', fontSize: 10.5, color: T.text3, fontFamily: FONT_MONO }}>{totalMins} min</span>
          </div>
          {brief.plan.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '6px 0', borderTop: i ? `1px solid ${T.border}` : 'none' }}>
              <span className="tnum" style={{ fontSize: 10.5, color: accent.hex, fontFamily: FONT_MONO, fontWeight: 700, width: 34, flexShrink: 0, paddingTop: 1 }}>{p.mins}m</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{p.phase}</div>
                <div style={{ fontSize: 11, color: T.text3, lineHeight: 1.4 }}>{p.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14, alignItems: 'center' }}>
        <span style={{ fontSize: 10.5, color: T.text3, marginRight: 4 }}>Suggested drills:</span>
        {brief.drills.map((d, i) => <span key={i} style={{ fontSize: 11, color: T.text2, padding: '4px 8px', borderRadius: 6, background: T.panel2, border: `1px solid ${T.border}` }}>{d}</span>)}
        <button onClick={onAddPlan} disabled={added}
          style={{ marginLeft: 'auto', appearance: 'none', border: added ? `1px solid ${T.good}` : 0, padding: '8px 14px', borderRadius: 9, background: added ? 'transparent' : accent.hex, color: added ? T.good : T.btnText, fontSize: 12.5, fontWeight: 600, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 7, cursor: added ? 'default' : 'pointer' }}>
          <Icon name={added ? 'check' : 'calendar'} size={13} stroke={1.9} /> {added ? 'Added to planner' : 'Add to next session plan'}
        </button>
      </div>
    </Card>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// PLAYER DETAIL MODAL
// ════════════════════════════════════════════════════════════════════════════
export function PlayerDetailModal({ T, accent, density, player, onClose, onNavigate }: Common & { player: Player; onClose: () => void; onNavigate?: (s: string) => void }) {
  // Open the full summary for a history row on the Lesson Summaries page. The
  // history id is `r-<lessonId>`; strip the prefix to match the real record.
  const openFullSummary = (histId: string) => {
    requestOpenLesson(histId.replace(/^r-/, ''))
    onNavigate?.('lessons')
    onClose()
  }
  const [, forceGrade] = useState(0)
  useEffect(() => subscribeGrades(() => forceGrade(x => x + 1)), [])
  const cb = currentBeltOf(player)
  const belt = BELTS[cb]
  const prog = beltProgressFor(player, cb)
  const totalSkills = ALL_SKILLS.length
  const earned = skillsEarnedFor(player)
  const [tab, setTab] = useState<'dev' | 'contact' | 'lessons' | 'consent'>('dev')
  const history = playerLessons(player)

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '5vh 16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 780, background: T.panel, border: `1px solid ${T.borderHi}`, borderRadius: 16, boxShadow: '0 30px 80px -20px rgba(0,0,0,0.7)' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: `${density.pad + 2}px ${density.pad + 4}px`, borderBottom: `1px solid ${T.border}`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -50, top: -50, width: 180, height: 180, borderRadius: '50%', background: `radial-gradient(circle, ${accent.dim}, transparent 65%)`, pointerEvents: 'none' }} />
          <Avatar accent={accent} initials={player.initials} size={50} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 19, fontWeight: 600, color: T.text }}>{player.name}</span>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: statusDot(T, player.status) }} />
              <span style={{ fontSize: 12 }}>{player.trend === 'up' ? '↑' : player.trend === 'down' ? '↓' : '→'}</span>
            </div>
            <div style={{ fontSize: 12, color: T.text3 }}>{player.group} · Age {player.age}{player.parent ? ` · Parent: ${player.parent}` : ''}</div>
          </div>
          <button onClick={onClose} style={{ marginLeft: 'auto', position: 'relative', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text3, cursor: 'pointer', width: 30, height: 30, fontSize: 18, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: `${density.pad}px ${density.pad + 4}px ${density.pad + 4}px` }}>
          {/* stat row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, marginBottom: 14 }}>
            {[
              { l: 'Current racket', v: <BeltChip beltIndex={cb} />, raw: true },
              { l: 'Racket progress', v: `${prog}%`, c: accent.hex },
              { l: 'Attendance', v: `${player.attendance}%`, c: player.attendance >= 90 ? T.good : player.attendance >= 80 ? T.warn : T.bad },
              { l: 'Skills earned', v: `${earned}/${totalSkills}` },
              { l: 'Next session', v: player.nextSession, small: true },
            ].map((m, i) => (
              <div key={i} style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 11px' }}>
                <div style={{ fontSize: 9.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.l}</div>
                <div className="tnum" style={{ fontSize: m.small ? 12.5 : 15, fontWeight: 600, color: m.c ?? T.text, marginTop: 3 }}>{m.v}</div>
              </div>
            ))}
          </div>

          {/* goal */}
          <div style={{ background: accent.dim, border: `1px solid ${accent.border}`, borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Icon name="flag" size={13} stroke={1.8} style={{ color: accent.hex }} />
            <span style={{ fontSize: 10, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Goal</span>
            <span style={{ fontSize: 12.5, color: T.text }}>{player.goal}</span>
          </div>

          {/* tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 14, padding: 2, background: T.hover, borderRadius: 9, width: 'fit-content' }}>
            {([['dev', 'Development'], ['contact', 'Contact'], ['lessons', `Lessons · ${history.length}`], ['consent', 'Consent']] as const).map(([id, lbl]) => (
              <button key={id} onClick={() => setTab(id)} style={{ appearance: 'none', border: 0, padding: '6px 16px', borderRadius: 7, fontSize: 12, cursor: 'pointer', background: tab === id ? T.panel : 'transparent', color: tab === id ? T.text : T.text2, fontWeight: tab === id ? 600 : 400, boxShadow: tab === id ? `0 0 0 1px ${T.border}` : 'none' }}>{lbl}</button>
            ))}
          </div>

          {tab === 'contact' && <ContactPanel T={T} accent={accent} player={player} />}

          {tab === 'consent' && <ConsentPanel T={T} accent={accent} player={player} />}

          {tab === 'dev' && (
          <div className="cm-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* working belt skills */}
            <div>
              <SectionHead T={T} title={`Working racket · ${belt.name}`} right={<span style={{ fontFamily: FONT_MONO }}>{prog}%</span>} />
              {belt.skills.map((s, si) => {
                const score = skillScoreFor(player, cb, si)
                return (
                  <div key={s.id} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: T.text }}>{s.name}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 10, color: masteryColor(T, accent, score), fontFamily: FONT_MONO, fontWeight: 600 }}>{MASTERY_LABELS[score]}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[1, 2, 3, 4].map(lv => (
                        <button key={lv} onClick={() => setGrade(player, cb, si, lv === score ? lv - 1 : lv)} title={`Mark ${MASTERY_LABELS[lv]}`}
                          style={{ flex: 1, height: 9, borderRadius: 3, border: 0, padding: 0, cursor: 'pointer', background: lv <= score ? masteryColor(T, accent, score) : T.hover }} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
            {/* belt journey + lessons */}
            <div>
              <SectionHead T={T} title="Racket journey" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
                {BELTS.map((b, bi) => {
                  const state = bi < cb ? 'done' : bi === cb ? 'current' : 'locked'
                  return (
                    <button key={b.id} onClick={() => setBelt(player, bi)} title={`Set working racket to ${b.name}`}
                      style={{ appearance: 'none', border: 0, background: 'transparent', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 9, padding: '2px 0', opacity: state === 'locked' ? 0.5 : 1 }}>
                      <span style={{ width: 20, height: 12, borderRadius: 3, background: b.colour, border: '1px solid rgba(128,128,128,0.4)' }} />
                      <span style={{ fontSize: 11.5, color: T.text, fontWeight: state === 'current' ? 700 : 500, flex: 1 }}>{b.name}</span>
                      {state === 'done' && <Icon name="check" size={12} stroke={2.2} style={{ color: T.good }} />}
                      {state === 'current' && <Pill T={T} color={accent.hex} bg={accent.dim}>now</Pill>}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          )}

          {tab === 'lessons' && (
          <div>
            <SectionHead T={T} title="Lesson history" right={<span style={{ fontFamily: FONT_MONO }}>{history.length} logged</span>} />
            {history.map((l, i) => (
              <div key={l.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderTop: i ? `1px solid ${T.border}` : 'none' }}>
                <div className="tnum" style={{ fontSize: 10.5, color: T.text3, fontFamily: FONT_MONO, width: 78, flexShrink: 0, paddingTop: 2 }}>{l.date}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12.5, color: T.text, fontWeight: 600 }}>{l.focus}</span>
                    <span style={{ fontSize: 9, fontFamily: FONT_MONO, color: T.text3, padding: '1px 5px', borderRadius: 3, background: T.hover }}>{l.type} · {l.mins}m</span>
                    {l.detailed && <Pill T={T} color={accent.hex} bg={accent.dim}>full summary</Pill>}
                  </div>
                  <div style={{ fontSize: 11.5, color: T.text2, marginTop: 3 }}>{l.takeaway}</div>
                  {l.homework && <div style={{ fontSize: 10.5, color: T.text3, marginTop: 2 }}>🏠 {l.homework}</div>}
                  {l.detailed && onNavigate && (
                    <button onClick={() => openFullSummary(l.id)}
                      style={{ marginTop: 5, appearance: 'none', border: 0, background: 'transparent', color: accent.hex, fontSize: 11, fontWeight: 600, fontFamily: FONT, cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      View full summary →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Contact tab ─────────────────────────────────────────────────────────────
function ContactPanel({ T, accent, player }: { T: ThemeTokens; accent: AccentTokens; player: Player }) {
  const c = PLAYER_CONTACTS[player.id]
  if (!c) return <div style={{ fontSize: 12.5, color: T.text3, padding: '8px 0' }}>No contact details on file for {player.name}.</div>
  const primaryEmail = c.parentEmail ?? c.playerEmail
  const primaryPhone = c.parentPhone ?? c.playerPhone

  const Row = ({ label, value, href }: { label: string; value?: string; href?: string }) => {
    if (!value) return null
    return (
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '7px 0', borderTop: `1px solid ${T.border}` }}>
        <span style={{ fontSize: 10.5, color: T.text3, width: 92, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
        {href
          ? <a href={href} style={{ fontSize: 12.5, color: accent.hex, textDecoration: 'none', wordBreak: 'break-word' }}>{value}</a>
          : <span style={{ fontSize: 12.5, color: T.text, wordBreak: 'break-word' }}>{value}</span>}
      </div>
    )
  }

  return (
    <div>
      <div className="cm-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <SectionHead T={T} title={c.parentName ? 'Parent / guardian' : 'Player'} />
          {c.parentName && <Row label="Name" value={c.parentName} />}
          <Row label="Email" value={c.parentEmail ?? c.playerEmail} href={(c.parentEmail ?? c.playerEmail) ? `mailto:${c.parentEmail ?? c.playerEmail}` : undefined} />
          <Row label="Phone" value={c.parentPhone ?? c.playerPhone} href={(c.parentPhone ?? c.playerPhone) ? `tel:${(c.parentPhone ?? c.playerPhone)!.replace(/\s/g, '')}` : undefined} />
          {c.parentName && c.playerEmail && <Row label="Player email" value={c.playerEmail} href={`mailto:${c.playerEmail}`} />}
          {c.parentName && c.playerPhone && <Row label="Player phone" value={c.playerPhone} href={`tel:${c.playerPhone.replace(/\s/g, '')}`} />}
          <Row label="Comms" value={c.comms} />
        </div>
        <div>
          <SectionHead T={T} title="Emergency & logistics" />
          <Row label="Emergency" value={c.emergencyName} />
          <Row label="Emerg. tel" value={c.emergencyPhone} href={`tel:${c.emergencyPhone.replace(/\s/g, '')}`} />
          <Row label="Address" value={c.address} />
          <Row label="Medical" value={c.medical} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
        {primaryEmail && <a href={`mailto:${primaryEmail}`} style={{ appearance: 'none', textDecoration: 'none', border: 0, padding: '8px 14px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 12.5, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 7 }}><Icon name="megaphone" size={13} stroke={1.9} /> Email {c.parentName ? 'parent' : 'player'}</a>}
        {primaryPhone && <a href={`tel:${primaryPhone.replace(/\s/g, '')}`} style={{ appearance: 'none', textDecoration: 'none', padding: '8px 14px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 12.5, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 7 }}>Call</a>}
      </div>
    </div>
  )
}

// ─── Consent tab (GDPR) ──────────────────────────────────────────────────────
// Per-player consent record (data / photo-video / medical), mirroring the live
// portal's consent capture. Demo values are derived from the player's seed so
// each player shows a consistent, varied picture (some without photo or medical
// consent, so the gating story is visible).
function ConsentPanel({ T, accent, player }: { T: ThemeTokens; accent: AccentTokens; player: Player }) {
  const dc = {
    data: true,
    photo: player.seed % 4 !== 0,
    medical: player.seed % 3 !== 0,
    wearable: player.seed % 5 !== 0,
  }
  const by = player.parent || `${player.name}'s parent/guardian`
  const dateNum = 1 + (player.seed % 27)
  const consentDate = `${String(dateNum).padStart(2, '0')}/03/2026`
  const medicalNotes = dc.medical
    ? (player.seed % 2 === 0 ? 'Mild asthma — inhaler in kit bag.' : 'No known medical conditions or allergies.')
    : null

  const Row = ({ label, desc, given }: { label: string; desc: string; given: boolean }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '11px 0', borderTop: `1px solid ${T.border}` }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, color: T.text, fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 11, color: T.text3, marginTop: 2, lineHeight: 1.45 }}>{desc}</div>
      </div>
      <span style={{ flexShrink: 0, fontSize: 10.5, fontWeight: 700, color: given ? T.good : T.warn, background: given ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)', padding: '4px 10px', borderRadius: 999, whiteSpace: 'nowrap' }}>
        {given ? '✓ Given' : 'Not given'}
      </span>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Consent &amp; data permissions</span>
        <span style={{ marginLeft: 'auto', fontSize: 10.5, color: T.text3 }}>Recorded by {by} · {consentDate}</span>
      </div>

      <Row label="Data processing" desc="Store and process this player's details to coach them, run sessions and manage payments." given={dc.data} />
      <Row label="Photo & video" desc="Capture photos and video (incl. GPS/match footage) for coaching and progress reviews." given={dc.photo} />
      <Row label="Medical & emergency" desc="Hold medical and emergency information to keep this player safe on court." given={dc.medical} />
      <Row label="Wearable / heart-rate" desc="Process smartwatch heart-rate and effort data to award XP through the Racket Progression rewards." given={dc.wearable} />

      {!dc.wearable && (
        <div style={{ marginTop: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 10, padding: '10px 13px', fontSize: 11.5, color: T.text2, lineHeight: 1.5 }}>
          ⚠ No wearable/heart-rate consent — smartwatch effort tracking is blocked for this player until a parent records consent.
        </div>
      )}

      {!dc.photo && (
        <div style={{ marginTop: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 10, padding: '10px 13px', fontSize: 11.5, color: T.text2, lineHeight: 1.5 }}>
          ⚠ No photo/video consent — this player is excluded from GPS and video capture until consent is recorded.
        </div>
      )}

      {medicalNotes && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Medical notes</div>
          <div style={{ fontSize: 12, color: T.text2, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 11px', lineHeight: 1.5 }}>{medicalNotes}</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
        <button style={{ appearance: 'none', border: 0, padding: '8px 14px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 12.5, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
          <Icon name="check" size={13} stroke={1.9} /> Update consent
        </button>
        <button style={{ appearance: 'none', padding: '8px 14px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>Send consent form to parent</button>
      </div>

      <div style={{ marginTop: 16 }}>
        <WatchConnectPanel
          T={T} accent={accent}
          token={`demo-${player.seed}-lumio-watch-sample-token`}
          playerName={player.name.split(' ')[0]}
          consentOk={dc.wearable}
        />
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// EXPORT PDF — player-facing lesson report (no coach AI brief, no private note)
// ════════════════════════════════════════════════════════════════════════════
const escR = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function printLessonReport(lesson: Lesson) {
  if (typeof window === 'undefined') return
  const skillNames = lesson.skillsWorked.map(id => ALL_SKILLS.find(s => s.id === id)?.name ?? id)
  const share = getSettings()
  const covered = lesson.covered.map(c => `<li>${escR(c)}</li>`).join('')
  const takeaways = lesson.takeaways.map(t => `<li>${escR(t)}</li>`).join('')
  const chips = (arr: string[]) => arr.map(x => `<span class="chip">${escR(x)}</span>`).join('')
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Lesson Summary — ${escR(lesson.player)}</title>
  <style>
    *{box-sizing:border-box}
    body{margin:0;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1d29;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .page{width:210mm;min-height:296mm;padding:18mm 16mm;margin:0 auto;position:relative}
    .band{background:linear-gradient(120deg,#7c3aed,#a855f7);color:#fff;border-radius:14px;padding:20px 24px}
    .meta{display:flex;gap:18px;flex-wrap:wrap;margin-top:8px;font-size:11px;opacity:.92}
    h2{font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:#7c3aed;margin:22px 0 8px;border-bottom:2px solid #ecedf2;padding-bottom:5px}
    .focus{background:#f7f4ff;border:1px solid #ead9ff;border-left:4px solid #a855f7;border-radius:0 10px 10px 0;padding:12px 16px;margin-top:16px}
    .focus b{font-size:16px}
    ul{margin:0;padding-left:20px}li{font-size:12.5px;line-height:1.7;color:#374151}
    .chip{display:inline-block;font-size:11px;background:#faf7ff;border:1px solid #ead9ff;color:#5b21b6;border-radius:7px;padding:4px 9px;margin:0 6px 6px 0}
    .box{border:1px solid #ecedf2;border-radius:10px;padding:12px 16px;background:#fafafe;font-size:12.5px;color:#374151;line-height:1.6}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
    .foot{position:absolute;bottom:12mm;left:16mm;right:16mm;display:flex;justify-content:space-between;font-size:9px;color:#aab;border-top:1px solid #eee;padding-top:8px}
    @page{size:A4;margin:0}
  </style></head><body>
  <div class="page">
    <div class="band">
      <div style="font-size:11px;letter-spacing:.3em;text-transform:uppercase;opacity:.85">Lesson Summary</div>
      <div style="font-size:28px;font-weight:800;margin-top:4px">${escR(lesson.player)}</div>
      <div class="meta">
        <span>${escR(lesson.date)} · ${escR(lesson.time)}</span>
        <span>${lesson.duration} min · ${escR(lesson.type)}</span>
        <span>${escR(lesson.court)}</span>
        <span>Coach: ${escR(COACH_ORG.coach)}</span>
      </div>
    </div>

    <div class="focus"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#a855f7;font-weight:700">Session focus</div><b>${escR(lesson.focus)}</b></div>

    <div class="grid">
      <div>
        <h2>What we covered</h2>
        <ul>${covered}</ul>
        <h2>Key takeaways</h2>
        <ul>${takeaways}</ul>
      </div>
      <div>
        <h2>Drills used</h2>
        <div>${chips(lesson.drills)}</div>
        <h2>Skills worked on</h2>
        <div>${chips(skillNames)}</div>
        ${share.shareHomework ? `<h2>Homework</h2><div class="box">${escR(lesson.homework)}</div>` : ''}
      </div>
    </div>

    ${share.shareNextFocus ? `<h2>Focus for next session</h2><div class="box" style="border-left:4px solid #a855f7">${escR(lesson.nextFocus)}</div>` : ''}
    ${share.shareCoachNote ? `<h2>Coach note</h2><div class="box">${escR(lesson.coachNote)}</div>` : ''}

    <div class="foot"><span>${escR(share.academy)} · ${escR(share.cert)}</span><span>Keep it up — see you on court 🎾</span></div>
  </div>
  </body></html>`

  const w = window.open('', '_blank', 'width=920,height=1040')
  if (!w) { alert('Please allow pop-ups to export the report.'); return }
  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => { try { w.print() } catch { /* manual print */ } }, 350)
}
