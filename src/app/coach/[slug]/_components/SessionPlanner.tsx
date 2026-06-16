'use client'

// Session Planner — the coach's pre-session command centre. Opens to today's
// sessions; pick one and get everything to run it: a timed run-sheet, the
// player's context (belt, goal, last lesson), the kit needed, and quick
// actions. Plans saved from lesson AI briefs land at the bottom.

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT, FONT_MONO } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import {
  TODAY_SESSIONS, PLAYERS, LESSONS, BELTS, SESSION_KITS, skillScore, COACH_ORG,
  BOOKINGS, COACH_TOP_STATS, TODAY, WEEK_DAYS, DAY_DATES,
  type TodaySession, type Booking,
} from '../_lib/coach-data'
import { getSettings } from '../_lib/settings-store'
import { getPlans, removePlan, toggleDone, subscribe, type PlannedSession } from '../_lib/session-plan'
import { getReviews, getReview, subscribe as subscribeReviews } from '../_lib/session-review'
import { upsertLesson, removeLesson, lessonFromSession, sessionLessonId } from '../_lib/lessons-store'
import { SessionReviewPanel } from './SessionReviewPanel'
import { MediaFieldRecorder } from './MediaFieldRecorder'
import { getAddedSessions, getStatusOverrides, getHiddenSessions, setStatus, clearStatus, deleteSession, subscribe as subscribeSessions } from '../_lib/sessions-store'
import { useAllPlayers } from '../_lib/use-roster'
import { NewSessionModal } from './NewSession'
import { getCalendarItems, getNeedsPlan, dayIndexForDate, mapBookingType, type CalItem } from '../_lib/schedule'
import { WeekCalendarGrid, bookingTypeColour } from './WeekCalendar'
import { getAddedBookings, subscribe as subscribeBookings } from '../_lib/bookings-store'

type Common = { T: ThemeTokens; accent: AccentTokens; density: Density }

// ─── primitives ──────────────────────────────────────────────────────────────
function Card({ T, density, children, style }: { T: ThemeTokens; density: Density; children: ReactNode; style?: CSSProperties }) {
  return <div style={{ position: 'relative', background: T.panel, border: `1px solid ${T.border}`, borderRadius: density.radius, padding: density.pad, boxShadow: T.cardShadow, ...style }}>{children}</div>
}
function SectionHead({ T, title, right }: { T: ThemeTokens; title: ReactNode; right?: ReactNode }) {
  return <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 10, gap: 8 }}><div style={{ fontSize: 12.5, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</div><div style={{ marginLeft: 'auto', fontSize: 11, color: T.text3, fontFamily: FONT_MONO }}>{right}</div></div>
}
function Avatar({ accent, initials, size = 38 }: { accent: AccentTokens; initials: string; size?: number }) {
  return <div style={{ width: size, height: size, borderRadius: '50%', display: 'grid', placeItems: 'center', background: accent.dim, color: accent.hex, fontSize: size * 0.36, fontWeight: 700, fontFamily: FONT_MONO, flexShrink: 0 }}>{initials}</div>
}
const initialsOf = (name: string) => name.replace(/\(.*\)/, '').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
function beltProgress(seed: number, beltIndex: number) {
  const th = getSettings().awardThreshold
  const belt = BELTS[beltIndex]
  const done = belt.skills.filter((_s, si) => skillScore(seed, beltIndex, si, beltIndex) >= th).length
  return Math.round((done / belt.skills.length) * 100)
}

// ─── run-sheet generator ─────────────────────────────────────────────────────
type Phase = { phase: string; mins: number; detail: string; tone: 'warm' | 'tech' | 'drill' | 'live' | 'review' }
const TEMPLATES: Record<TodaySession['type'], { phase: string; pct: number; tone: Phase['tone']; d: (f: string) => string }[]> = {
  'Private': [
    { phase: 'Warm-up & movement', pct: 0.15, tone: 'warm', d: () => 'Dynamic prep, split-step reactions, mini-tennis to find the timing.' },
    { phase: 'Technical block', pct: 0.30, tone: 'tech', d: f => `Re-groove ${f} with controlled feeds and one clear cue.` },
    { phase: 'Constraint drill', pct: 0.25, tone: 'drill', d: () => 'Targeted drill with a success target before progressing.' },
    { phase: 'Live points', pct: 0.20, tone: 'live', d: f => `Carry ${f} into live points and patterns.` },
    { phase: 'Review & homework', pct: 0.10, tone: 'review', d: () => 'Score-based game, 2-minute video review, set the homework.' },
  ],
  'Group': [
    { phase: 'Warm-up & dynamic games', pct: 0.15, tone: 'warm', d: () => 'Movement games to raise the pulse and get them sharp.' },
    { phase: 'Skill stations', pct: 0.35, tone: 'tech', d: f => `Rotate stations on ${f} — short reps, lots of balls.` },
    { phase: 'Match games', pct: 0.30, tone: 'live', d: () => 'Cooperative-to-competitive games applying the skill.' },
    { phase: 'Mini-tournament', pct: 0.15, tone: 'live', d: () => 'Round-robin points — keep it fun and competitive.' },
    { phase: 'Cool-down & feedback', pct: 0.05, tone: 'review', d: () => 'Stretch, one win each, quick group feedback.' },
  ],
  'Cardio': [
    { phase: 'Warm-up & pulse-raiser', pct: 0.15, tone: 'warm', d: () => 'Footwork ladder, dynamic stretch, easy rally.' },
    { phase: 'High-tempo feeds', pct: 0.40, tone: 'tech', d: () => 'Continuous feeding circuits — heart rate up, technique honest.' },
    { phase: 'Live rally games', pct: 0.35, tone: 'live', d: f => `Fast live games built around ${f}.` },
    { phase: 'Cool-down & stretch', pct: 0.10, tone: 'review', d: () => 'Bring the heart rate down, mobility work.' },
  ],
  'Match play': [
    { phase: 'Warm-up & serve routine', pct: 0.15, tone: 'warm', d: () => 'Full warm-up incl. serves; settle the routine.' },
    { phase: 'Pattern rehearsal', pct: 0.20, tone: 'tech', d: f => `Rehearse ${f} before competing.` },
    { phase: 'Competitive sets', pct: 0.55, tone: 'live', d: () => 'Play out sets; coach observes, minimal interruption.' },
    { phase: 'Debrief & notes', pct: 0.10, tone: 'review', d: () => 'What worked, what to adjust, log for the match report.' },
  ],
  'Mini / red ball': [
    { phase: 'Warm-up games', pct: 0.20, tone: 'warm', d: () => 'Fun coordination and ball-skill games.' },
    { phase: 'Skill of the day', pct: 0.30, tone: 'tech', d: f => `Introduce / build ${f} through play.` },
    { phase: 'Challenge games', pct: 0.35, tone: 'live', d: () => 'Target and team games applying the skill.' },
    { phase: 'Rewards & racket check', pct: 0.15, tone: 'review', d: () => 'Stickers, racket-skill check, celebrate the wins.' },
  ],
}
function runSheet(s: TodaySession): Phase[] {
  const tpl = TEMPLATES[s.type]
  const f = s.focus.toLowerCase()
  let used = 0
  return tpl.map((p, i) => {
    const mins = i === tpl.length - 1 ? s.mins - used : Math.round(s.mins * p.pct)
    used += mins
    return { phase: p.phase, mins, detail: p.d(f), tone: p.tone }
  })
}
const kitFor = (type: TodaySession['type']) => {
  const map: Record<TodaySession['type'], string> = { 'Private': 'Private lesson', 'Group': 'Group / squad', 'Cardio': 'Cardio Tennis', 'Match play': 'Match play', 'Mini / red ball': 'Mini / red ball' }
  return SESSION_KITS.find(k => k.type === map[type])?.items ?? []
}

// ════════════════════════════════════════════════════════════════════════════
export function SessionPlannerView({ T, accent, density, onNavigate }: Common & { onNavigate?: (s: string) => void }) {
  const rosterPlayers = useAllPlayers()
  const [plans, setPlans] = useState<PlannedSession[]>([])
  const [added, setAdded] = useState<TodaySession[]>([])
  const [overrides, setOverrides] = useState<Record<string, TodaySession['status']>>({})
  const [hidden, setHidden] = useState<string[]>([])
  const [newOpen, setNewOpen] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [showRecord, setShowRecord] = useState(false)
  const [reviewedIds, setReviewedIds] = useState<string[]>([])
  const [tab, setTab] = useState<'overview' | 'today' | 'week' | 'month'>('overview')
  const [seedBooking, setSeedBooking] = useState<Booking | null>(null)
  useEffect(() => { const r = () => setPlans(getPlans()); r(); return subscribe(r) }, [])
  useEffect(() => { const r = () => setReviewedIds(getReviews().map(x => x.sessionId)); r(); return subscribeReviews(r) }, [])
  useEffect(() => {
    const r = () => { setAdded(getAddedSessions()); setOverrides(getStatusOverrides()); setHidden(getHiddenSessions()) }
    r(); return subscribeSessions(r)
  }, [])
  // Bookings added via "Add booking" — merged into the schedule so they appear
  // here as buildable sessions too (bookings are the schedule source of truth).
  const [addedBookings, setAddedBookings] = useState<Booking[]>([])
  useEffect(() => { const r = () => setAddedBookings(getAddedBookings()); r(); return subscribeBookings(r) }, [])
  const allSessions = [...added, ...TODAY_SESSIONS]
    .filter(s => !hidden.includes(s.id))
    .map(s => overrides[s.id] ? { ...s, status: overrides[s.id] } : s)

  const defaultId = (TODAY_SESSIONS.find(s => s.status === 'now') ?? TODAY_SESSIONS.find(s => s.status === 'upcoming') ?? TODAY_SESSIONS[0]).id
  const [selId, setSelId] = useState(defaultId)
  const sel = allSessions.find(s => s.id === selId) ?? allSessions[0]
  const isDone = sel.status === 'done'
  const reviewed = reviewedIds.includes(sel.id)
  useEffect(() => { setShowReview(false); setShowRecord(false) }, [selId])

  const markDone = () => {
    if (isDone) {
      clearStatus(sel.id)
      removeLesson(sessionLessonId(sel.id))   // un-marking removes the entry it created
    } else {
      setStatus(sel.id, 'done')
      upsertLesson(lessonFromSession(sel, getReview(sel.id)?.review))  // auto-populate from the AI review if present
    }
  }
  const onDelete = () => {
    const next = allSessions.find(s => s.id !== sel.id)
    deleteSession(sel.id)
    if (next) setSelId(next.id)
  }
  const sheet = runSheet(sel)
  const kit = kitFor(sel.type)
  const player = sel.playerId ? PLAYERS.find(p => p.id === sel.playerId) : undefined
  const belt = player ? BELTS[player.beltIndex] : undefined
  const prog = player ? beltProgress(player.seed, player.beltIndex) : 0
  const lastLesson = sel.playerId ? LESSONS.filter(l => l.playerId === sel.playerId).slice(-1)[0] : undefined
  // Saved briefs for THIS player only, and the focus points for this session.
  const playerPlans = plans.filter(p => p.player === sel.player)
  const savedForPlayer = playerPlans[0]
  const focusPoints: string[] = sel.focusPoints ?? savedForPlayer?.workOn ?? (lastLesson
    ? [`Build on: ${lastLesson.nextFocus}`, `Tidy from last time: ${lastLesson.takeaways[lastLesson.takeaways.length - 1]}`, `Keep grooving ${lastLesson.focus.toLowerCase()}`]
    : [`Work on: ${sel.focus}`, 'Lots of ball contacts and clear targets', 'Finish with competitive games'])
  const focusDrills: string[] = sel.drills ?? savedForPlayer?.drills ?? lastLesson?.drills ?? []

  const toneColour = (t: Phase['tone']) => t === 'warm' ? '#3A8EE0' : t === 'tech' ? accent.hex : t === 'drill' ? T.warn : t === 'live' ? T.good : T.text3
  const statusBadge = (s: TodaySession) => s.status === 'now'
    ? { t: 'On court now', c: accent.hex, bg: accent.dim }
    : s.status === 'done' ? { t: 'Completed', c: T.text3, bg: T.hover } : { t: 'Up next', c: '#3A8EE0', bg: 'rgba(58,142,224,0.14)' }

  const Action = ({ icon, label, to }: { icon: string; label: string; to: string }) => (
    <button onClick={() => onNavigate?.(to)} style={{ appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 9, padding: '7px 11px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
      <Icon name={icon} size={13} stroke={1.8} style={{ color: accent.hex }} /> {label}
    </button>
  )

  // ─── multi-view data — all derived from the one dated dataset ──────────────
  const allBookings = [...BOOKINGS, ...addedBookings]
  const todaySessions = allSessions.filter(s => s.date === TODAY)
  const calItems = getCalendarItems(added, undefined, addedBookings)
  const needsPlan = getNeedsPlan(added, undefined, addedBookings)
  const nextUp = allSessions.filter(s => s.status !== 'done')
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0]
  const counts = {
    today: todaySessions.length,
    week: allSessions.filter(s => dayIndexForDate(s.date) >= 0).length,
    pending: allBookings.filter(b => b.status === 'pending').length,
    rackets: COACH_TOP_STATS.find(s => s.label === 'Rackets due')?.value ?? 0,
  }
  const tabs: { id: typeof tab; label: string }[] = [
    { id: 'overview', label: 'Overview' }, { id: 'today', label: 'Today' },
    { id: 'week', label: 'This week' }, { id: 'month', label: 'This month' },
  ]
  const dayLabel = (date: string) => { const i = dayIndexForDate(date); return i >= 0 ? `${WEEK_DAYS[i]} ${DAY_DATES[i]}` : date }
  const openWizard = (b: Booking | null) => { setSeedBooking(b); setNewOpen(true) }
  const selectSession = (id: string) => { setSelId(id); setTab('today') }
  const onCalItemClick = (it: CalItem) => {
    if (it.sessionId) selectSession(it.sessionId)
    else if (it.bookingId) { const b = allBookings.find(x => x.id === it.bookingId); if (b && mapBookingType(b.type)) openWizard(b) }
  }
  // Month agenda — calendar items grouped by date (the June demo week).
  const monthGroups = Array.from(new Set(calItems.map(it => it.date))).sort()
    .map(date => ({ date, items: calItems.filter(it => it.date === date).sort((a, b) => a.start.localeCompare(b.start)) }))

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: FONT, fontSize: 24, fontWeight: 600, color: T.text, letterSpacing: '-0.02em' }}>Session Planner</h1>
          <p style={{ margin: '4px 0 0', fontSize: 12.5, color: T.text3 }}>Everything you need for the session you&apos;re about to run — tap a session to load its plan.</p>
        </div>
        <button onClick={() => openWizard(null)} style={{ marginLeft: 'auto', appearance: 'none', border: 0, padding: '8px 14px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 12.5, fontWeight: 600, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <Icon name="plus" size={14} stroke={2} /> New session
        </button>
        <button onClick={() => printRunSheet(sel, sheet, kit)} style={{ appearance: 'none', padding: '8px 14px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 12.5, fontWeight: 600, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <Icon name="note" size={14} stroke={1.8} /> Print run-sheet
        </button>
      </div>

      {/* view tabs */}
      <div style={{ display: 'flex', gap: 0, padding: 2, background: T.hover, borderRadius: 9, marginBottom: 16, width: 'fit-content' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ appearance: 'none', border: 0, padding: '6px 14px', borderRadius: 7, fontSize: 12, cursor: 'pointer', background: tab === t.id ? T.panel : 'transparent', color: tab === t.id ? T.text : T.text2, fontWeight: tab === t.id ? 600 : 400, boxShadow: tab === t.id ? `0 0 0 1px ${T.border}` : 'none' }}>{t.label}</button>
        ))}
      </div>

      {/* ══ OVERVIEW ══ */}
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: density.gap }}>
          <div className="cm-md" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: density.gap }}>
            <Card T={T} density={density}>
              <SectionHead T={T} title="Next up" right={nextUp ? dayLabel(nextUp.date) : ''} />
              {nextUp ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <Avatar accent={accent} initials={initialsOf(nextUp.player)} size={44} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: T.text }}>{nextUp.player}</div>
                    <div className="tnum" style={{ fontSize: 12, color: T.text3, fontFamily: FONT_MONO }}>{nextUp.time}–{nextUp.end} · {nextUp.type} · {nextUp.court}</div>
                    <div style={{ fontSize: 12, color: T.text2, marginTop: 4 }}>{nextUp.focus}</div>
                  </div>
                  <button onClick={() => selectSession(nextUp.id)} style={{ appearance: 'none', border: 0, padding: '8px 14px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 12, fontWeight: 600, fontFamily: FONT, cursor: 'pointer' }}>Open</button>
                </div>
              ) : <div style={{ fontSize: 12, color: T.text3 }}>No upcoming sessions.</div>}
            </Card>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: density.gap }}>
              {[
                { l: 'Sessions today', v: counts.today, c: accent.hex },
                { l: 'This week', v: counts.week, c: T.text },
                { l: 'Rackets due', v: counts.rackets, c: T.warn },
                { l: 'Pending bookings', v: counts.pending, c: '#3A8EE0' },
              ].map((m, i) => (
                <Card key={i} T={T} density={density}>
                  <div style={{ fontSize: 10.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m.l}</div>
                  <div className="tnum" style={{ fontSize: 24, fontWeight: 500, color: m.c, marginTop: 4 }}>{m.v}</div>
                </Card>
              ))}
            </div>
          </div>

          <Card T={T} density={density}>
            <SectionHead T={T} title="Needs a plan" right={`${needsPlan.length}`} />
            {needsPlan.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {needsPlan.map(b => (
                  <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, flexWrap: 'wrap' }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: bookingTypeColour(T, accent, b.type), flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, color: T.text, fontWeight: 600 }}>{b.player}</div>
                      <div className="tnum" style={{ fontSize: 10.5, color: T.text3, fontFamily: FONT_MONO }}>{dayLabel(b.date)} · {b.start}–{b.end} · {b.type} · {b.court}</div>
                    </div>
                    <button onClick={() => openWizard(b)} style={{ appearance: 'none', border: 0, padding: '7px 12px', borderRadius: 8, background: accent.hex, color: T.btnText, fontSize: 11.5, fontWeight: 600, fontFamily: FONT, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="plus" size={12} stroke={2} /> Build session</button>
                  </div>
                ))}
              </div>
            ) : <div style={{ fontSize: 12, color: T.text3 }}>Every confirmed booking has a session. Nice.</div>}
          </Card>

          <div>
            <SectionHead T={T} title="This week’s calendar" right="synced from Booking Calendar" />
            <Card T={T} density={density} style={{ padding: 0, overflowX: 'auto' }}>
              <WeekCalendarGrid T={T} accent={accent} density={density} items={calItems} onItemClick={onCalItemClick} />
            </Card>
          </div>
        </div>
      )}

      {/* ══ TODAY (the original single-day planner) ══ */}
      {tab === 'today' && (
        <>

      {/* today's sessions */}
      <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Today · {todaySessions.length} sessions</div>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6, marginBottom: density.gap }}>
        {todaySessions.map(s => {
          const on = s.id === selId; const b = statusBadge(s)
          return (
            <button key={s.id} onClick={() => setSelId(s.id)} style={{ appearance: 'none', textAlign: 'left', cursor: 'pointer', flexShrink: 0, width: 190, padding: 12, borderRadius: 12, background: on ? accent.dim : T.panel, border: `1px solid ${on ? accent.border : T.border}`, opacity: s.status === 'done' && !on ? 0.6 : 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                <span className="tnum" style={{ fontSize: 13, fontWeight: 700, color: on ? accent.hex : T.text, fontFamily: FONT_MONO }}>{s.time}</span>
                <span style={{ marginLeft: 'auto', fontSize: 8.5, fontWeight: 700, color: b.c, background: b.bg, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{b.t}</span>
              </div>
              <div style={{ fontSize: 12.5, color: T.text, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.player}</div>
              <div style={{ fontSize: 10.5, color: T.text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.type} · {s.court} · {s.mins}m</div>
            </button>
          )
        })}
      </div>

      {/* selected session */}
      <Card T={T} density={density} style={{ marginBottom: density.gap, padding: density.pad + 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 14 }}>
          <Avatar accent={accent} initials={initialsOf(sel.player)} size={46} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 18, fontWeight: 600, color: T.text }}>{sel.player}</span>
              {belt && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 16, height: 10, borderRadius: 2, background: belt.colour, border: '1px solid rgba(128,128,128,0.4)' }} /><span style={{ fontSize: 11.5, color: T.text2, fontWeight: 600 }}>{belt.name}</span></span>}
            </div>
            <div className="tnum" style={{ fontSize: 12, color: T.text3, fontFamily: FONT_MONO }}>{sel.time}–{sel.end} · {sel.type} · {sel.court} · {sel.mins} min</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            <button onClick={markDone} style={{ appearance: 'none', borderRadius: 9, padding: '7px 12px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: FONT, border: `1px solid ${isDone ? T.good : T.border}`, background: isDone ? T.good : 'transparent', color: isDone ? '#fff' : T.text2 }}>
              <Icon name="check" size={13} stroke={2} style={{ color: isDone ? '#fff' : T.good }} /> {isDone ? 'Session completed' : 'Mark session done'}
            </button>
            <button onClick={() => setShowReview(v => !v)} style={{ appearance: 'none', borderRadius: 9, padding: '7px 12px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: FONT, border: `1px solid ${showReview ? accent.border : T.border}`, background: showReview ? accent.dim : 'transparent', color: showReview ? accent.hex : T.text2 }}>
              <Icon name="sparkles" size={13} stroke={1.8} style={{ color: accent.hex }} /> {showReview ? 'Hide review' : 'Review session'}
              {reviewed && <span style={{ fontSize: 8.5, fontWeight: 700, color: T.good, background: 'rgba(111,168,138,0.18)', padding: '2px 5px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Reviewed</span>}
            </button>
            <button onClick={() => setShowRecord(v => !v)} style={{ appearance: 'none', borderRadius: 9, padding: '7px 12px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: FONT, border: `1px solid ${showRecord ? accent.border : T.border}`, background: showRecord ? accent.dim : 'transparent', color: showRecord ? accent.hex : T.text2 }}>
              <Icon name="mic" size={13} stroke={1.8} style={{ color: accent.hex }} /> {showRecord ? 'Hide recorder' : 'Record audio'}
            </button>
            <Action icon="megaphone" label="Message" to="messages" />
            {player && <Action icon="arrow-up-right" label="Player" to="development" />}
            <button onClick={onDelete} title="Delete session" style={{ appearance: 'none', borderRadius: 9, padding: '7px 12px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: FONT, border: `1px solid ${T.border}`, background: 'transparent', color: T.text3 }}>
              <span style={{ fontSize: 13, lineHeight: 1, color: '#d9534f' }}>✕</span> Delete
            </button>
          </div>
        </div>

        <div style={{ background: accent.dim, border: `1px solid ${accent.border}`, borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Session focus</div>
          <div style={{ fontSize: 15, color: T.text, fontWeight: 600, marginTop: 2 }}>{sel.focus}</div>
        </div>

        {/* what to work on */}
        <div style={{ marginBottom: 16 }}>
          <SectionHead T={T} title="What to work on" right={savedForPlayer ? 'from saved plan' : lastLesson ? 'from last lesson' : 'session goals'} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 8 }}>
            {focusPoints.map((w, i) => (
              <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', padding: '9px 11px', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8 }}>
                <span style={{ width: 18, height: 18, borderRadius: 5, background: accent.dim, color: accent.hex, display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                <span style={{ fontSize: 12, color: T.text, lineHeight: 1.4 }}>{w}</span>
              </div>
            ))}
          </div>
          {focusDrills.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 10.5, color: T.text3 }}>Drills:</span>
              {focusDrills.map((d, i) => <span key={i} style={{ fontSize: 11, color: T.text2, padding: '3px 8px', borderRadius: 6, background: T.panel2, border: `1px solid ${T.border}` }}>{d}</span>)}
            </div>
          )}
        </div>

        <div className="cm-md" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18 }}>
          {/* run sheet */}
          <div>
            <SectionHead T={T} title="Run-sheet" right={`${sel.mins} min`} />
            {/* time bar */}
            <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
              {sheet.map((p, i) => <div key={i} title={`${p.phase} · ${p.mins}m`} style={{ width: `${(p.mins / sel.mins) * 100}%`, background: toneColour(p.tone) }} />)}
            </div>
            {sheet.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '8px 0', borderTop: i ? `1px solid ${T.border}` : 'none' }}>
                <span className="tnum" style={{ fontSize: 12, color: toneColour(p.tone), fontFamily: FONT_MONO, fontWeight: 700, width: 34, flexShrink: 0, paddingTop: 1 }}>{p.mins}m</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{p.phase}</div>
                  <div style={{ fontSize: 11.5, color: T.text3, lineHeight: 1.45 }}>{p.detail}</div>
                </div>
              </div>
            ))}
          </div>

          {/* right column: player + kit */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: density.gap }}>
            {player && belt ? (
              <div style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14 }}>
                <SectionHead T={T} title="Player snapshot" right={`${prog}% to next`} />
                <div style={{ height: 5, borderRadius: 3, background: T.hover, overflow: 'hidden', marginBottom: 10 }}>
                  <div style={{ width: `${prog}%`, height: '100%', background: accent.hex }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.text2, marginBottom: 8 }}>
                  <Icon name="flag" size={12} stroke={1.8} style={{ color: accent.hex }} /><span style={{ color: T.text }}>{player.goal}</span>
                </div>
                {lastLesson && (
                  <div style={{ fontSize: 11.5, color: T.text3, lineHeight: 1.5 }}>
                    <strong style={{ color: T.text2 }}>Last lesson ({lastLesson.date}):</strong> {lastLesson.focus}. {lastLesson.takeaways[lastLesson.takeaways.length - 1]}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.border}`, fontSize: 11, color: T.text2 }}>
                  <span><span style={{ color: T.text3 }}>Attendance</span> {player.attendance}%</span>
                  <span>{player.trend === 'up' ? '↑ improving' : player.trend === 'down' ? '↓ watch' : '→ steady'}</span>
                </div>
              </div>
            ) : (
              <div style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14 }}>
                <SectionHead T={T} title="Group session" />
                <div style={{ fontSize: 11.5, color: T.text3, lineHeight: 1.5 }}>Mixed group — keep it active, lots of ball contacts, and finish with competitive games. Check the register on arrival.</div>
              </div>
            )}

            <div style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14 }}>
              <SectionHead T={T} title={<><Icon name="wrench" size={12} stroke={1.7} style={{ color: accent.hex, marginRight: 5, verticalAlign: -2 }} />Kit to bring</>} right={`${kit.length}`} />
              {kit.map((it, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: T.text2, padding: '3px 0' }}>
                  <span style={{ width: 14, height: 14, borderRadius: 4, border: `1.5px solid ${T.border}`, flexShrink: 0 }} />{it}
                </div>
              ))}
            </div>
          </div>
        </div>

        {showReview && <SessionReviewPanel T={T} accent={accent} density={density} session={sel} />}
        {showRecord && <div style={{ marginTop: 14 }}><MediaFieldRecorder T={T} accent={accent} density={density} sessionLabel={`${sel.player} ${sel.time}`} /></div>}
      </Card>

      {/* saved from lesson briefs — for the selected player only */}
      {playerPlans.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '4px 0 8px' }}>Saved plans for {sel.player} · {playerPlans.length}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: density.gap }}>
            {playerPlans.map(p => <PlanCard key={p.id} T={T} accent={accent} density={density} p={p} />)}
          </div>
        </>
      )}
        </>
      )}

      {/* ══ THIS WEEK ══ */}
      {tab === 'week' && (
        <Card T={T} density={density} style={{ padding: 0, overflowX: 'auto' }}>
          <WeekCalendarGrid T={T} accent={accent} density={density} items={calItems} onItemClick={onCalItemClick} />
        </Card>
      )}

      {/* ══ THIS MONTH (agenda) ══ */}
      {tab === 'month' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: density.gap }}>
          {monthGroups.map(g => (
            <Card key={g.date} T={T} density={density}>
              <SectionHead T={T} title={dayLabel(g.date)} right={`${g.items.length}`} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {g.items.map(it => (
                  <button key={it.key} onClick={() => onCalItemClick(it)} style={{ appearance: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 11px', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8 }}>
                    <span className="tnum" style={{ fontSize: 11.5, color: T.text2, fontFamily: FONT_MONO, width: 92, flexShrink: 0 }}>{it.start}–{it.end}</span>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: bookingTypeColour(T, accent, it.type), flexShrink: 0 }} />
                    <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: T.text, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.player}</span>
                    <span style={{ fontSize: 11, color: T.text3 }}>{it.type} · {it.court}</span>
                    {!it.sessionId && it.bookingId && mapBookingType(it.type as Booking['type']) && <span style={{ fontSize: 9, fontWeight: 700, color: accent.hex, background: accent.dim, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase' }}>Build</span>}
                  </button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {newOpen && <NewSessionModal T={T} accent={accent} density={density} players={rosterPlayers} seedBooking={seedBooking ?? undefined} onClose={() => { setNewOpen(false); setSeedBooking(null) }} onCreated={id => { selectSession(id); setSeedBooking(null) }} />}
    </div>
  )
}

function PlanCard({ T, accent, density, p }: Common & { p: PlannedSession }) {
  const total = p.plan.reduce((s, x) => s + x.mins, 0)
  return (
    <Card T={T} density={density} style={{ opacity: p.done ? 0.6 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: T.text, textDecoration: p.done ? 'line-through' : 'none' }}>{p.player}</span>
            <span style={{ fontSize: 9.5, fontFamily: FONT_MONO, padding: '2px 6px', borderRadius: 4, background: accent.dim, color: accent.hex }}>{total} min</span>
            <span style={{ fontSize: 10.5, color: T.text3 }}>{p.source}</span>
          </div>
          <div style={{ fontSize: 12.5, color: T.text2, marginTop: 3 }}>Focus: {p.focus}</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => toggleDone(p.id)} style={{ appearance: 'none', border: `1px solid ${p.done ? T.border : accent.border}`, background: p.done ? 'transparent' : accent.dim, color: p.done ? T.text3 : accent.hex, borderRadius: 8, padding: '6px 11px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>{p.done ? 'Done' : 'Mark done'}</button>
          <button onClick={() => removePlan(p.id)} title="Remove" style={{ appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text3, borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 15 }}>×</button>
        </div>
      </div>
      <div className="cm-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Focus points</div>
          {p.workOn.map((w, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '4px 0', fontSize: 12, color: T.text, lineHeight: 1.45 }}><span style={{ color: accent.hex, fontWeight: 700 }}>{i + 1}</span>{w}</div>
          ))}
          {p.drills.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>{p.drills.map((d, i) => <span key={i} style={{ fontSize: 10.5, color: T.text2, padding: '3px 7px', borderRadius: 6, background: T.panel2, border: `1px solid ${T.border}` }}>{d}</span>)}</div>}
        </div>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Plan</div>
          {p.plan.map((ph, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '5px 0', borderTop: i ? `1px solid ${T.border}` : 'none' }}>
              <span className="tnum" style={{ fontSize: 10.5, color: accent.hex, fontFamily: FONT_MONO, fontWeight: 700, width: 32, flexShrink: 0, paddingTop: 1 }}>{ph.mins}m</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11.5, color: T.text, fontWeight: 600 }}>{ph.phase}</div>
                <div style={{ fontSize: 10.5, color: T.text3, lineHeight: 1.4 }}>{ph.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

// ─── print ───────────────────────────────────────────────────────────────────
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
function printRunSheet(s: TodaySession, sheet: Phase[], kit: string[]) {
  if (typeof window === 'undefined') return
  const rows = sheet.map(p => `<tr><td style="white-space:nowrap;font-weight:700;color:#7c3aed;width:50px">${p.mins} min</td><td><strong>${esc(p.phase)}</strong><br><span style="font-size:10px;color:#666">${esc(p.detail)}</span></td></tr>`).join('')
  const kitHtml = kit.map(k => `<li>${esc(k)}</li>`).join('')
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Run-sheet — ${esc(s.player)}</title>
  <style>*{box-sizing:border-box}body{margin:0;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1d29;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{width:210mm;min-height:296mm;padding:18mm 16mm;margin:0 auto;position:relative}
  td{font-size:12px;padding:7px 8px;border-bottom:1px solid #f0f1f6;vertical-align:top}
  h2{font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:#7c3aed;margin:18px 0 8px;border-bottom:2px solid #ecedf2;padding-bottom:5px}
  ul{margin:0;padding-left:18px}li{font-size:12px;margin-bottom:4px}
  @page{size:A4;margin:0}</style></head><body>
  <div class="page">
    <div style="background:linear-gradient(120deg,#7c3aed,#a855f7);color:#fff;border-radius:14px;padding:20px 24px">
      <div style="font-size:11px;letter-spacing:.3em;text-transform:uppercase;opacity:.85">Session Run-sheet</div>
      <div style="font-size:28px;font-weight:800;margin-top:4px">${esc(s.player)}</div>
      <div style="opacity:.9;margin-top:4px">${esc(s.time)}–${esc(s.end)} · ${esc(s.type)} · ${esc(s.court)} · ${s.mins} min</div>
    </div>
    <div style="background:#f7f4ff;border-left:4px solid #a855f7;border-radius:0 8px 8px 0;padding:12px 16px;margin-top:16px"><strong>Focus:</strong> ${esc(s.focus)}</div>
    <h2>Run-sheet</h2><table style="width:100%;border-collapse:collapse">${rows}</table>
    <h2>Kit to bring</h2><ul>${kitHtml}</ul>
    <div style="position:absolute;bottom:12mm;left:16mm;right:16mm;display:flex;justify-content:space-between;font-size:9px;color:#aab;border-top:1px solid #eee;padding-top:8px"><span>${esc(COACH_ORG.academy)} · ${esc(COACH_ORG.coach)}</span><span>Lumio Coach · Session Planner</span></div>
  </div></body></html>`
  const w = window.open('', '_blank', 'width=920,height=1040')
  if (!w) { alert('Please allow pop-ups to print the run-sheet.'); return }
  w.document.write(html); w.document.close(); w.focus()
  setTimeout(() => { try { w.print() } catch { /* manual */ } }, 350)
}
