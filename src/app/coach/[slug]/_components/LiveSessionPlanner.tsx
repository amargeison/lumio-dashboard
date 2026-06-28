'use client'

// Live Session Planner — mirrors the demo's New Session creator (player from
// roster, type/court/time/duration, racket + standard, session focus, AI assist
// to draft focus points & drills) and the auto-generated timed run-sheet, wired
// to coach_session_plans.

import { useState, useEffect } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { useCoachTable, dbInsert, dbRemove, RACKET_STAGES, RACKET_SKILLS, logSessionAttendance } from '../_lib/coach-db'
import { MediaCaptureModal } from './MediaCaptureModal'

type Common = { T: ThemeTokens; accent: AccentTokens; density: Density }

// ── Date helpers for the overview + week calendar ───────────────────────────
const pad2 = (n: number) => String(n).padStart(2, '0')
const isoD = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
const addD = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const mondayOfD = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); const wd = (x.getDay() + 6) % 7; x.setDate(x.getDate() - wd); return x }
const toMins = (t: string | null) => { if (!t) return null; const m = t.match(/(\d{1,2})\s*:\s*(\d{2})/) || t.match(/^(\d{1,2})(\d{2})$/); if (m) return Math.min(23, +m[1]) * 60 + Math.min(59, +m[2]); const h = t.match(/^(\d{1,2})$/); return h ? +h[1] * 60 : null }
const hhmm = (m: number) => `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`
const WD3 = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const typeCol = (T: ThemeTokens, accent: AccentTokens, t: string | null) => t === 'Group' ? '#3A8EE0' : t === 'Cardio' ? T.warn : t === 'Match play' ? T.good : t === 'Block' ? T.text3 : accent.hex
const HRS = Array.from({ length: 14 }, (_, i) => 7 + i) // 07:00–20:00
const TYPES = ['Private', 'Group', 'Cardio', 'Match play', 'Mini / red ball'] as const
type SType = typeof TYPES[number]

// ── Run-sheet generator (ported from the demo) ──────────────────────────────
const TEMPLATES: Record<SType, { phase: string; pct: number; d: (f: string) => string }[]> = {
  'Private': [
    { phase: 'Warm-up & movement', pct: 0.15, d: () => 'Dynamic prep, split-step reactions, mini-tennis to find the timing.' },
    { phase: 'Technical block', pct: 0.30, d: f => `Re-groove ${f} with controlled feeds and one clear cue.` },
    { phase: 'Constraint drill', pct: 0.25, d: () => 'Targeted drill with a success target before progressing.' },
    { phase: 'Live points', pct: 0.20, d: f => `Carry ${f} into live points and patterns.` },
    { phase: 'Review & homework', pct: 0.10, d: () => 'Score-based game, quick video review, set the homework.' },
  ],
  'Group': [
    { phase: 'Warm-up & dynamic games', pct: 0.15, d: () => 'Movement games to raise the pulse and get them sharp.' },
    { phase: 'Skill stations', pct: 0.35, d: f => `Rotate stations on ${f} — short reps, lots of balls.` },
    { phase: 'Match games', pct: 0.30, d: () => 'Cooperative-to-competitive games applying the skill.' },
    { phase: 'Mini-tournament', pct: 0.15, d: () => 'Round-robin points — keep it fun and competitive.' },
    { phase: 'Cool-down & feedback', pct: 0.05, d: () => 'Stretch, one win each, quick group feedback.' },
  ],
  'Cardio': [
    { phase: 'Warm-up & pulse-raiser', pct: 0.15, d: () => 'Footwork ladder, dynamic stretch, easy rally.' },
    { phase: 'High-tempo feeds', pct: 0.40, d: () => 'Continuous feeding circuits — heart rate up, technique honest.' },
    { phase: 'Live rally games', pct: 0.35, d: f => `Fast live games built around ${f}.` },
    { phase: 'Cool-down & stretch', pct: 0.10, d: () => 'Bring the heart rate down, mobility work.' },
  ],
  'Match play': [
    { phase: 'Warm-up & serve routine', pct: 0.15, d: () => 'Full warm-up incl. serves; settle the routine.' },
    { phase: 'Pattern rehearsal', pct: 0.20, d: f => `Rehearse ${f} before competing.` },
    { phase: 'Competitive sets', pct: 0.55, d: () => 'Play out sets; coach observes, minimal interruption.' },
    { phase: 'Debrief & notes', pct: 0.10, d: () => 'What worked, what to adjust, log for the report.' },
  ],
  'Mini / red ball': [
    { phase: 'Warm-up games', pct: 0.20, d: () => 'Fun coordination and ball-skill games.' },
    { phase: 'Skill of the day', pct: 0.30, d: f => `Introduce / build ${f} through play.` },
    { phase: 'Challenge games', pct: 0.35, d: () => 'Target and team games applying the skill.' },
    { phase: 'Rewards & racket check', pct: 0.15, d: () => 'Stickers, racket-skill check, celebrate the wins.' },
  ],
}
const KIT_BY_TYPE: Record<SType, string[]> = {
  'Private': ['Ball basket', 'Target cones', 'Video tripod'],
  'Group': ['2 ball baskets', 'Cones ×12', 'Throwdown lines', 'Bibs'],
  'Cardio': ['Ball machine', 'Heart-rate band', 'Cones'],
  'Match play': ['Match balls', 'Scorecards', 'Net gauge'],
  'Mini / red ball': ['Red balls', 'Mini nets', 'Stickers', 'Throwdowns'],
}
function runSheet(type: SType, focus: string, mins: number) {
  const tpl = TEMPLATES[type] || TEMPLATES.Private
  const f = (focus || 'the focus').toLowerCase()
  let used = 0
  return tpl.map((p, i) => { const m = i === tpl.length - 1 ? mins - used : Math.round(mins * p.pct); used += m; return { phase: p.phase, mins: m, detail: p.d(f) } })
}

export function LiveSessionPlanner({ T, accent, density, onNavigate }: Common & { onNavigate?: (s: string) => void }) {
  const plans = useCoachTable<any>('coach_session_plans')
  const players = useCoachTable<any>('coach_players')
  const bookings = useCoachTable<any>('coach_bookings')
  const skills = useCoachTable<any>('coach_player_skills')
  const [tab, setTab] = useState<'overview' | 'today' | 'week' | 'month'>('overview')
  const [open, setOpen] = useState(false)
  const [prefill, setPrefill] = useState<any | null>(null)
  const [sel, setSel] = useState<any | null>(null)

  const today = new Date()
  const todayISO = isoD(today)
  const weekStart = mondayOfD(today)
  const weekDays = Array.from({ length: 7 }, (_, i) => addD(weekStart, i))
  const weekEndISO = isoD(addD(weekStart, 7))

  // A booking "has a plan" if a session plan matches its player + date.
  const planFor = (b: any) => plans.rows.find(pl => (pl.group_name || '').trim().toLowerCase() === (b.player_name || '').trim().toLowerCase() && pl.session_date === b.booking_date)
  const sortByTime = (a: any, b: any) => (toMins(a.start_time) ?? 9999) - (toMins(b.start_time) ?? 9999)
  const upcoming = bookings.rows.filter(b => (b.booking_date || '') >= todayISO && b.status !== 'cancelled')
    .sort((a, b) => (a.booking_date || '').localeCompare(b.booking_date || '') || sortByTime(a, b))
  const nextUp = upcoming[0] || null
  const needsPlan = upcoming.filter(b => !planFor(b)).slice(0, 8)
  // Plans created (e.g. from a lesson's "Add to next session plan") that aren't
  // tied to a booking yet — they wait here until the session is booked.
  const unbookedPlans = plans.rows.filter((pl: any) => !pl.session_date)
  const assignPlanToBooking = async (planId: string, b: any) => {
    await plans.edit(planId, { session_date: b.booking_date, start_time: b.start_time || null, court: b.court || null, session_type: b.type || 'Private', group_name: b.player_name || null })
  }
  const todays = bookings.rows.filter(b => b.booking_date === todayISO && b.status !== 'cancelled').sort(sortByTime)
  const weekStartISO = isoD(weekStart)
  const weekCount = bookings.rows.filter(b => (b.booking_date || '') >= weekStartISO && (b.booking_date || '') < weekEndISO && b.status !== 'cancelled').length
  const pending = bookings.rows.filter(b => b.status === 'pending').length

  // Rackets due = players sitting at 100% on their current racket (ready to award).
  const skillMap: Record<string, Record<string, number>> = {}
  for (const r of skills.rows) { (skillMap[r.player_id] ||= {})[r.skill] = r.score }
  const racketsDue = players.rows.filter(p => {
    const st = RACKET_STAGES.find(s => s.id === p.racket_stage); if (!st) return false
    const sk = RACKET_SKILLS[st.id] || []; if (!sk.length) return false
    const sm = skillMap[p.id] || {}
    return sk.every(s => (sm[s.name] || 0) >= 4)
  }).length

  const buildFrom = (b: any) => { setPrefill(b); setOpen(true) }
  const openBooking = (b: any) => { const pl = planFor(b); if (pl) setSel(pl); else buildFrom(b) }

  const stat = (label: string, value: number, colour: string) => (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: colour, marginTop: 4 }}>{value}</div>
    </div>
  )
  const TABS: { id: typeof tab; label: string }[] = [{ id: 'overview', label: 'Overview' }, { id: 'today', label: 'Today' }, { id: 'week', label: 'This week' }, { id: 'month', label: 'This month' }]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ color: T.text, fontSize: 22, fontWeight: 700, margin: 0 }}>Session Planner</h2>
          <p style={{ color: T.text3, fontSize: 13, margin: '4px 0 0' }}>Everything you need for the session you’re about to run — tap a session to load its plan.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { setPrefill(null); setOpen(true) }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: 'none', background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}><Icon name="plus" size={14} /> New session</button>
          <button onClick={() => printRunSheets(plans.rows.filter(p => p.session_date === todayISO))} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>🖨️ Print run-sheet</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, padding: 2, background: T.hover, borderRadius: 9, marginBottom: 16, width: 'fit-content' }}>
        {TABS.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={{ appearance: 'none', border: 0, padding: '6px 16px', borderRadius: 7, fontSize: 12, cursor: 'pointer', background: tab === t.id ? T.panel : 'transparent', color: tab === t.id ? T.text : T.text2, fontWeight: tab === t.id ? 600 : 400, boxShadow: tab === t.id ? `0 0 0 1px ${T.border}` : 'none' }}>{t.label}</button>)}
      </div>

      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
            {/* Next up */}
            <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 10 }}>Next up</div>
              {nextUp ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 17, fontWeight: 700, color: T.text }}>{nextUp.title || nextUp.player_name || 'Session'}</div>
                    <div style={{ fontSize: 12, color: T.text3, marginTop: 3 }}>{[nextUp.booking_date && new Date(nextUp.booking_date).toLocaleDateString('en-GB'), nextUp.start_time, nextUp.type, nextUp.court].filter(Boolean).join(' · ')}</div>
                    {planFor(nextUp)?.focus && <div style={{ fontSize: 12.5, color: T.text2, marginTop: 8 }}>🎯 {planFor(nextUp)?.focus}</div>}
                  </div>
                  <button onClick={() => openBooking(nextUp)} style={{ appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 9, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{planFor(nextUp) ? 'Open' : 'Build session'}</button>
                </div>
              ) : <div style={{ fontSize: 13, color: T.text3 }}>No upcoming bookings. Add bookings in the Booking Calendar and they’ll appear here.</div>}
            </div>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {stat('Sessions today', todays.length, accent.hex)}
              {stat('This week', weekCount, accent.hex)}
              {stat('Rackets due', racketsDue, T.warn)}
              {stat('Pending bookings', pending, '#3A8EE0')}
            </div>
          </div>

          {/* Needs a plan */}
          <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Needs a plan</div>
              <div style={{ marginLeft: 'auto', fontSize: 11, color: T.text3 }}>{needsPlan.length}</div>
            </div>
            {needsPlan.length === 0 ? <div style={{ fontSize: 12.5, color: T.text3 }}>Every upcoming session has a plan. 🎾</div> : needsPlan.map(b => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: `1px solid ${T.border}` }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: typeCol(T, accent, b.type), flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: T.text, fontWeight: 600 }}>{b.title || b.player_name || 'Session'}</div>
                  <div style={{ fontSize: 11, color: T.text3 }}>{[b.booking_date && new Date(b.booking_date).toLocaleDateString('en-GB'), b.start_time, b.type, b.court].filter(Boolean).join(' · ')}</div>
                </div>
                <button onClick={() => buildFrom(b)} style={{ appearance: 'none', border: `1px solid ${accent.border}`, background: accent.dim, color: accent.hex, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>+ Build session</button>
              </div>
            ))}
          </div>

          {/* Needs a booking — plans waiting for a session to be booked */}
          {unbookedPlans.length > 0 && (
            <div style={{ background: T.panel, border: `1px solid ${accent.border}`, borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Needs a booking</div>
                <div style={{ marginLeft: 'auto', fontSize: 11, color: T.text3 }}>{unbookedPlans.length}</div>
              </div>
              <div style={{ fontSize: 11, color: T.text3, marginBottom: 8 }}>Plans ready to go — book the session, then assign the plan to it.</div>
              {unbookedPlans.map((pl: any) => (
                <div key={pl.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: `1px solid ${T.border}`, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <div style={{ fontSize: 12.5, color: T.text, fontWeight: 600 }}>{pl.group_name || pl.title || 'Session plan'}</div>
                    {pl.focus && <div style={{ fontSize: 11, color: T.text3 }}>🎯 {pl.focus}</div>}
                  </div>
                  <button onClick={() => setSel(pl)} style={{ appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 8, padding: '6px 10px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>View plan</button>
                  {upcoming.length > 0 ? (
                    <select defaultValue="" onChange={e => { const b = upcoming.find(x => x.id === e.target.value); if (b) assignPlanToBooking(pl.id, b) }} style={{ background: T.panel2, color: T.text2, border: `1px solid ${accent.border}`, borderRadius: 8, padding: '6px 9px', fontSize: 11.5, cursor: 'pointer', fontFamily: FONT }}>
                      <option value="">Assign to booking…</option>
                      {upcoming.map(b => <option key={b.id} value={b.id}>{[b.player_name || b.title, b.booking_date && new Date(b.booking_date).toLocaleDateString('en-GB'), b.start_time].filter(Boolean).join(' · ')}</option>)}
                    </select>
                  ) : <span style={{ fontSize: 11, color: T.text3 }}>No bookings yet — add one in the Booking Calendar</span>}
                </div>
              ))}
            </div>
          )}

          {/* This week's calendar (synced from bookings) */}
          <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', padding: '14px 16px 0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>This week’s calendar</div>
              <div style={{ marginLeft: 'auto', fontSize: 10.5, color: T.text3 }}>synced from Booking Calendar</div>
            </div>
            <WeekGrid T={T} accent={accent} days={weekDays} today={today} bookings={bookings.rows} onOpen={openBooking} />
          </div>
        </div>
      )}

      {tab === 'today' && (() => {
        // Show the selected session's full plan inline below the cards (like the demo);
        // default to the first session today that has a plan.
        const selPlan = (sel && todays.some(b => planFor(b)?.id === sel.id)) ? sel : (todays.map(planFor).find(Boolean) || null)
        return (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Today · {todays.length} session{todays.length === 1 ? '' : 's'}</div>
          {todays.length === 0 ? <div style={{ fontSize: 13, color: T.text3, padding: '20px 0' }}>No sessions today.</div> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {todays.map(b => {
                const pl = planFor(b)
                const isSel = !!(pl && selPlan && pl.id === selPlan.id)
                return (
                  <button key={b.id} onClick={() => pl ? setSel(pl) : openBooking(b)} style={{ textAlign: 'left', appearance: 'none', cursor: 'pointer', background: isSel ? accent.dim : T.panel, border: `1px solid ${isSel ? accent.hex : (pl ? T.border : accent.border)}`, borderLeft: `3px solid ${typeCol(T, accent, b.type)}`, borderRadius: 10, padding: 14, boxShadow: isSel ? `0 0 0 1px ${accent.hex}` : 'none' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{b.start_time || '—'} · {b.title || b.player_name || 'Session'}</div>
                    <div style={{ fontSize: 11, color: T.text3, marginTop: 3 }}>{[b.type, b.court, b.duration_min ? `${b.duration_min}m` : ''].filter(Boolean).join(' · ')}</div>
                    <div style={{ fontSize: 11, color: pl ? T.good : accent.hex, fontWeight: 600, marginTop: 8 }}>{pl ? (isSel ? '✓ Plan — shown below' : '✓ Plan ready — view') : '+ Build session'}</div>
                  </button>
                )
              })}
            </div>
          )}
          {selPlan && <SessionRunSheet T={T} accent={accent} density={density} plan={selPlan} players={players.rows} onNavigate={onNavigate} inline
            onCompleted={() => { setSel(null); plans.reload() }}
            onClose={() => setSel(null)}
            onDelete={async () => { if (confirm('Delete this session?')) { await dbRemove('coach_session_plans', selPlan.id); setSel(null); plans.reload() } }} />}
        </div>
        )
      })()}

      {tab === 'week' && (
        <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <WeekGrid T={T} accent={accent} days={weekDays} today={today} bookings={bookings.rows} onOpen={openBooking} />
        </div>
      )}

      {tab === 'month' && (
        <MonthAgenda T={T} accent={accent} bookings={bookings.rows} fromISO={todayISO} onOpen={openBooking} />
      )}

      {open && <NewSession T={T} accent={accent} density={density} players={players.rows} prefill={prefill}
        onClose={() => { setOpen(false); setPrefill(null) }} onSaved={() => { setOpen(false); setPrefill(null); plans.reload() }} />}
      {sel && tab !== 'today' && <SessionRunSheet T={T} accent={accent} density={density} plan={sel} players={players.rows} onNavigate={onNavigate}
        onCompleted={() => { setSel(null); plans.reload() }}
        onClose={() => setSel(null)}
        onDelete={async () => { if (confirm('Delete this session?')) { await dbRemove('coach_session_plans', sel.id); setSel(null); plans.reload() } }} />}
    </div>
  )
}

// ── This-week grid (read-only mirror of the Booking Calendar) ───────────────
function WeekGrid({ T, accent, days, today, bookings, onOpen }: { T: ThemeTokens; accent: AccentTokens; days: Date[]; today: Date; bookings: any[]; onOpen: (b: any) => void }) {
  const ROW = 42, START = HRS[0]
  const yFor = (mins: number) => Math.max(0, Math.min((mins / 60 - START) * ROW, HRS.length * ROW))
  return (
    <div style={{ overflowX: 'auto', padding: 12 }}>
      <div style={{ minWidth: 700 }}>
        <div style={{ display: 'grid', gridTemplateColumns: `48px repeat(7, 1fr)`, borderBottom: `1px solid ${T.border}` }}>
          <div />
          {days.map((d, i) => {
            const isToday = isoD(d) === isoD(today)
            return <div key={i} style={{ padding: '8px 4px', textAlign: 'center', borderLeft: `1px solid ${T.border}`, background: isToday ? accent.dim : 'transparent' }}>
              <div style={{ fontSize: 10.5, color: isToday ? accent.hex : T.text2, fontWeight: 600 }}>{WD3[i]}</div>
              <div style={{ fontSize: 15, color: isToday ? accent.hex : T.text, fontWeight: 600 }}>{d.getDate()}</div>
            </div>
          })}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `48px repeat(7, 1fr)` }}>
          <div>{HRS.map(h => <div key={h} style={{ height: ROW, fontSize: 9.5, color: T.text3, padding: '2px 5px', textAlign: 'right' }}>{pad2(h)}:00</div>)}</div>
          {days.map((d, di) => {
            const dayB = bookings.filter(b => b.booking_date === isoD(d) && b.status !== 'cancelled')
            return (
              <div key={di} style={{ position: 'relative', borderLeft: `1px solid ${T.border}` }}>
                {HRS.map(h => <div key={h} style={{ height: ROW, borderTop: `1px solid ${T.border}` }} />)}
                {dayB.map(b => {
                  const s = toMins(b.start_time); if (s == null) return null
                  const dur = b.duration_min || 60
                  const top = yFor(s), h = Math.max(yFor(s + dur) - top - 2, 18)
                  const c = typeCol(T, accent, b.type)
                  return (
                    <div key={b.id} onClick={() => onOpen(b)} title={b.title || b.player_name || ''} style={{ position: 'absolute', left: 3, right: 3, top: top + 1, height: h, background: `${c}26`, border: `1px solid ${c}`, borderLeft: `3px solid ${c}`, borderRadius: 6, padding: '2px 5px', overflow: 'hidden', cursor: 'pointer' }}>
                      <div style={{ fontSize: 10, color: T.text, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title || b.player_name || 'Session'}</div>
                      <div style={{ fontSize: 8.5, color: T.text2 }}>{hhmm(s)}{b.court ? ` · ${b.court}` : ''}</div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function MonthAgenda({ T, accent, bookings, fromISO, onOpen }: { T: ThemeTokens; accent: AccentTokens; bookings: any[]; fromISO: string; onOpen: (b: any) => void }) {
  const end = isoD(addD(new Date(fromISO + 'T00:00:00'), 31))
  const inRange = bookings.filter(b => (b.booking_date || '') >= fromISO && (b.booking_date || '') < end && b.status !== 'cancelled')
  const dates = Array.from(new Set(inRange.map(b => b.booking_date))).sort()
  if (!dates.length) return <div style={{ fontSize: 12.5, color: T.text3, fontStyle: 'italic', padding: '18px 4px' }}>No bookings in the next 30 days.</div>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {dates.map(dt => {
        const items = inRange.filter(b => b.booking_date === dt).sort((a, b) => (toMins(a.start_time) ?? 0) - (toMins(b.start_time) ?? 0))
        return (
          <div key={dt} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: T.text3, marginBottom: 10 }}>{new Date(dt + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {items.map(b => (
                <button key={b.id} onClick={() => onOpen(b)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 11px', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, textAlign: 'left', width: '100%', cursor: 'pointer' }}>
                  <span style={{ fontSize: 11.5, color: T.text2, width: 50, flexShrink: 0 }}>{b.start_time || '—'}</span>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: typeCol(T, accent, b.type), flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: T.text, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title || b.player_name || 'Session'}</span>
                  <span style={{ fontSize: 11, color: T.text3 }}>{[b.type, b.court].filter(Boolean).join(' · ')}</span>
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Print today's run-sheets (one page) — the demo's "Print run-sheet".
function printRunSheets(todayPlans: any[]) {
  if (typeof window === 'undefined') return
  const esc = (s: string) => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!))
  if (!todayPlans.length) { alert('No planned sessions for today to print.'); return }
  const blocks = todayPlans.map(p => {
    const sheet = runSheet((p.session_type as SType) || 'Private', p.focus || '', p.duration_min || 60)
    const rows = sheet.map(ph => `<tr><td style="width:50px;color:#1f6fd6;font-weight:700">${ph.mins}m</td><td><b>${esc(ph.phase)}</b><div style="color:#555;font-size:12px">${esc(ph.detail)}</div></td></tr>`).join('')
    const kit = (KIT_BY_TYPE[(p.session_type as SType) || 'Private'] || []).map(k => `<span style="display:inline-block;border:1px solid #ccc;border-radius:20px;padding:2px 10px;margin:0 4px 6px;font-size:12px">${esc(k)}</span>`).join('')
    return `<div style="page-break-inside:avoid;margin-bottom:28px"><h2 style="margin:0">${esc(p.title || 'Session')}</h2><div style="color:#555;font-size:13px;margin:2px 0 6px">${esc([p.session_type, p.start_time, p.court, (p.duration_min || 60) + ' mins'].filter(Boolean).join(' · '))}</div>${p.focus ? `<div style="background:#eef3fb;border-radius:6px;padding:8px 10px;font-weight:600;margin-bottom:8px">${esc(p.focus)}</div>` : ''}<table style="width:100%;border-collapse:collapse">${rows}</table><div style="margin-top:10px"><b style="font-size:12px;color:#555">Kit:</b><br/>${kit}</div></div>`
  }).join('')
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Run-sheet — ${new Date().toLocaleDateString('en-GB')}</title><style>body{font-family:-apple-system,Segoe UI,Arial,sans-serif;max-width:720px;margin:32px auto;color:#111;padding:0 20px}td{padding:6px 4px;vertical-align:top;border-top:1px solid #eee}</style></head><body><h1>Today’s run-sheet · ${new Date().toLocaleDateString('en-GB')}</h1>${blocks}</body></html>`
  const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 300) }
}

// ── New Session modal ────────────────────────────────────────────────────────
function NewSession({ T, accent, density, players, prefill, onClose, onSaved }: Common & { players: any[]; prefill?: any; onClose: () => void; onSaved: () => void }) {
  const pfType = (TYPES as readonly string[]).includes(prefill?.type) ? prefill.type as SType : 'Private'
  const pfPlayer = prefill?.player_name || ''
  const pfKnown = players.some(p => p.name === pfPlayer)
  const [mode, setMode] = useState<'roster' | 'new'>(pfPlayer && !pfKnown ? 'new' : 'roster')
  const [player, setPlayer] = useState(pfPlayer)
  const [type, setType] = useState<SType>(pfType)
  const [court, setCourt] = useState(prefill?.court || '')
  const [date, setDate] = useState(prefill?.booking_date || '')
  const [time, setTime] = useState(prefill?.start_time || '')
  const [duration, setDuration] = useState(Number(prefill?.duration_min) || 60)
  const [racket, setRacket] = useState(players.find(p => p.name === pfPlayer)?.racket_stage || '')
  const [standard, setStandard] = useState('')
  const [focus, setFocus] = useState('')
  const [note, setNote] = useState('')
  const [focusPoints, setFocusPoints] = useState('')
  const [drills, setDrills] = useState('')
  const [drafting, setDrafting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  // The player's last lesson summary → its "next focus" is what this session should
  // pick up from, so the coach doesn't retype it.
  const sessions = useCoachTable<any>('coach_sessions')
  const lastFocusFor = (name: string) => {
    if (!name) return ''
    const last = sessions.rows
      .filter((s: any) => (s.player_name || '').trim().toLowerCase() === name.trim().toLowerCase())
      .sort((a: any, b: any) => (b.session_date || '').localeCompare(a.session_date || ''))[0]
    return last ? (last.review_json?.nextFocus || last.focus || '') : ''
  }

  // On open with a known player, seed the focus from their last summary (if blank).
  useEffect(() => {
    if (!focus.trim() && player) { const f = lastFocusFor(player); if (f) setFocus(f) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions.rows])

  // Prefill racket + last-session focus from the chosen roster player.
  const onPickPlayer = (name: string) => { setPlayer(name); const p = players.find(x => x.name === name); if (p?.racket_stage) setRacket(p.racket_stage); const f = lastFocusFor(name); if (f) setFocus(f) }

  const draft = async () => {
    // Fall back to the player's last "next focus" if the coach hasn't typed one.
    let useFocus = focus.trim()
    if (!useFocus) { useFocus = lastFocusFor(player); if (useFocus) setFocus(useFocus) }
    if (!useFocus) { setErr('Add a session focus first (or pick a player with a previous summary).'); return }
    setDrafting(true); setErr('')
    try {
      const res = await fetch('/api/coach/session-draft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, focus: useFocus, racket: RACKET_STAGES.find(s => s.id === racket)?.name, standard, duration, note, player }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Draft failed')
      setFocusPoints((data.focus_points || []).join('\n'))
      setDrills((data.drills || []).join('\n'))
    } catch (e) { setErr(e instanceof Error ? e.message : 'Draft failed') }
    setDrafting(false)
  }

  const save = async () => {
    if (!focus.trim()) { setErr('Session focus is required'); return }
    setSaving(true); setErr('')
    try {
      await dbInsert('coach_session_plans', {
        title: `${player || type}${focus ? ' — ' + focus : ''}`.slice(0, 120),
        session_date: date || null, start_time: time || null, session_type: type, court: court || null,
        group_name: player || null, focus, duration_min: duration || null, racket_stage: racket || null,
        standard: standard || null, focus_points: focusPoints || null, drills: drills || null, notes: note || null,
      })
      onSaved()
    } catch (e) { setErr(e instanceof Error ? e.message : 'Save failed'); setSaving(false) }
  }

  const input: React.CSSProperties = { width: '100%', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 9, padding: '9px 11px', color: T.text, fontSize: 13, boxSizing: 'border-box', outline: 'none', marginTop: 5 }
  const lbl: React.CSSProperties = { display: 'block', color: T.text3, fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }
  const sheet = runSheet(type, focus, duration || 60)

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '4vh 16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 760, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Icon name="flag" size={16} style={{ color: accent.hex }} />
          <h3 style={{ color: T.text, fontSize: 18, fontWeight: 700, margin: 0 }}>New session</h3>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text3, cursor: 'pointer', width: 30, height: 30, fontSize: 17 }}>×</button>
        </div>

        <div className="cm-2" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 18 }}>
          <div>
            {/* Player */}
            <label style={lbl}>Player</label>
            <div style={{ display: 'flex', gap: 6, margin: '6px 0' }}>
              {(['roster', 'new'] as const).map(m => <button key={m} onClick={() => setMode(m)} style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${mode === m ? accent.hex : T.border}`, background: mode === m ? accent.dim : 'transparent', color: mode === m ? accent.hex : T.text2, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{m === 'roster' ? 'From roster' : 'New player'}</button>)}
            </div>
            {mode === 'roster' ? (
              <select value={player} onChange={e => onPickPlayer(e.target.value)} style={{ ...input, marginTop: 0 }}>
                <option value="">Select a player…</option>
                {players.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            ) : (
              <input value={player} onChange={e => setPlayer(e.target.value)} placeholder="Player or group name" style={{ ...input, marginTop: 0 }} />
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
              <div><label style={lbl}>Type</label><select value={type} onChange={e => setType(e.target.value as SType)} style={input}>{TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><label style={lbl}>Court</label><input value={court} onChange={e => setCourt(e.target.value)} placeholder="e.g. Court 1" style={input} /></div>
              <div><label style={lbl}>Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} style={input} /></div>
              <div><label style={lbl}>Start time</label><input value={time} onChange={e => setTime(e.target.value)} placeholder="e.g. 16:00" style={input} /></div>
              <div><label style={lbl}>Duration (mins)</label><input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} style={input} /></div>
              <div><label style={lbl}>Racket</label><select value={racket} onChange={e => setRacket(e.target.value)} style={input}><option value="">—</option>{RACKET_STAGES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            </div>
            <div style={{ marginTop: 12 }}><label style={lbl}>Standard</label><input value={standard} onChange={e => setStandard(e.target.value)} placeholder="e.g. LTA Youth · Orange" style={input} /></div>
            <div style={{ marginTop: 12 }}><label style={lbl}>Session focus *</label><input value={focus} onChange={e => setFocus(e.target.value)} placeholder="e.g. Forehand volley — punch & firm wrist" style={input} /></div>

            {/* AI assist */}
            <div style={{ marginTop: 14, background: accent.dim, border: `1px solid ${accent.hex}55`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: accent.hex, marginBottom: 6 }}>✨ AI assist — draft the focus points &amp; drills</div>
              <input value={note} onChange={e => setNote(e.target.value)} placeholder="Optional note — what do you want from this session?" style={{ ...input, marginTop: 0 }} />
              <button onClick={draft} disabled={drafting} style={{ marginTop: 8, padding: '8px 14px', borderRadius: 9, border: 'none', background: accent.hex, color: T.btnText, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', opacity: drafting ? 0.6 : 1 }}>{drafting ? 'Drafting…' : 'Draft with AI'}</button>
            </div>

            <div style={{ marginTop: 12 }}><label style={lbl}>Focus points (one per line)</label><textarea value={focusPoints} onChange={e => setFocusPoints(e.target.value)} rows={3} style={{ ...input, resize: 'vertical' }} /></div>
            <div style={{ marginTop: 12 }}><label style={lbl}>Drills (one per line)</label><textarea value={drills} onChange={e => setDrills(e.target.value)} rows={3} style={{ ...input, resize: 'vertical' }} /></div>
          </div>

          {/* Run-sheet preview */}
          <div>
            <label style={lbl}>Run-sheet ({duration || 60} mins)</label>
            <div style={{ marginTop: 6, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, padding: 12 }}>
              {sheet.map((ph, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: i < sheet.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                  <span style={{ fontSize: 11, color: accent.hex, fontWeight: 700, width: 34, flexShrink: 0 }}>{ph.mins}m</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{ph.phase}</div>
                    <div style={{ fontSize: 10.5, color: T.text3, lineHeight: 1.4 }}>{ph.detail}</div>
                  </div>
                </div>
              ))}
            </div>
            <label style={{ ...lbl, marginTop: 14, display: 'block' }}>Kit list</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
              {KIT_BY_TYPE[type].map(k => <span key={k} style={{ fontSize: 11, color: T.text2, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 999, padding: '3px 10px' }}>{k}</span>)}
            </div>
            <p style={{ fontSize: 10.5, color: T.text3, marginTop: 10 }}>The run-sheet and kit list are generated automatically for the session type.</p>
          </div>
        </div>

        {err && <p style={{ color: '#EF4444', fontSize: 12, marginTop: 12 }}>{err}</p>}
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button onClick={save} disabled={saving} style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: accent.hex, color: T.btnText, fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving…' : '✓ Add session'}</button>
          <button onClick={onClose} style={{ padding: '12px 18px', borderRadius: 10, border: `1px solid ${T.border}`, background: 'transparent', color: T.text3, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── Saved session run-sheet ──────────────────────────────────────────────────
function SessionRunSheet({ T, accent, density, plan, players, onNavigate, onCompleted, onClose, onDelete, inline }: Common & { plan: any; players: any[]; onNavigate?: (s: string) => void; onCompleted: () => void; onClose: () => void; onDelete: () => void; inline?: boolean }) {
  const sheet = runSheet((plan.session_type as SType) || 'Private', plan.focus || '', plan.duration_min || 60)
  const fp = (plan.focus_points || '').split('\n').filter(Boolean)
  const dr = (plan.drills || '').split('\n').filter(Boolean)
  const [mediaOpen, setMediaOpen] = useState(false)
  const [completing, setCompleting] = useState(false)
  // "Session completed" → logs a Lesson Summary stub (coach_sessions) the coach can
  // enrich or record audio into — the same flow as the demo.
  const complete = async () => {
    if (completing) return
    setCompleting(true)
    try {
      const when = new Date().toISOString().slice(0, 10)
      await dbInsert('coach_sessions', { player_name: plan.group_name || plan.title, session_date: when, focus: plan.focus || plan.title || 'Session', rating: null, summary: plan.notes || '', ai_review: '' })
      logSessionAttendance(plan.group_name, when)
      onCompleted(); onNavigate?.('lessons')
    } catch { setCompleting(false) }
  }
  const act = (bg: string, color: string, border?: string): React.CSSProperties => ({ appearance: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, border: border || 'none', background: bg, color, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' })
  const body = (
      <>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ color: T.text, fontSize: 18, fontWeight: 700, margin: 0 }}>{plan.title}</h3>
            <div style={{ fontSize: 12, color: T.text3, marginTop: 3 }}>{[plan.session_type, plan.session_date && new Date(plan.session_date).toLocaleDateString('en-GB'), plan.start_time, plan.court, `${plan.duration_min || 60} mins`].filter(Boolean).join(' · ')}</div>
          </div>
          {!inline && <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text3, cursor: 'pointer', width: 30, height: 30, fontSize: 17 }}>×</button>}
        </div>

        {/* Session actions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
          <button onClick={complete} disabled={completing} style={act(`${T.good}22`, T.good, `1px solid ${T.good}55`)}>✓ {completing ? 'Saving…' : 'Session completed'}</button>
          <button onClick={() => { onNavigate?.('lessons'); onClose() }} style={act('transparent', T.text2, `1px solid ${T.border}`)}>📝 Review session</button>
          <button onClick={() => setMediaOpen(true)} style={act('transparent', T.text2, `1px solid ${T.border}`)}>🎙️ Record audio</button>
          <button onClick={() => { onNavigate?.('messages'); onClose() }} style={act('transparent', T.text2, `1px solid ${T.border}`)}>📣 Message</button>
          <button onClick={() => { onNavigate?.('development'); onClose() }} style={act('transparent', T.text2, `1px solid ${T.border}`)}>↗ Player</button>
          <button onClick={onDelete} style={act('transparent', T.bad, `1px solid ${T.border}`)}>✕ Delete</button>
        </div>

        {plan.focus && <div style={{ background: accent.dim, border: `1px solid ${accent.hex}55`, borderRadius: 8, padding: '8px 12px', marginTop: 14, fontSize: 12.5, color: T.text }}>🎯 {plan.focus}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: fp.length || dr.length ? '1fr 1fr' : '1fr', gap: 16, marginTop: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Run-sheet</div>
            {sheet.map((ph, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: i < sheet.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                <span style={{ fontSize: 11, color: accent.hex, fontWeight: 700, width: 34, flexShrink: 0 }}>{ph.mins}m</span>
                <div><div style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{ph.phase}</div><div style={{ fontSize: 10.5, color: T.text3 }}>{ph.detail}</div></div>
              </div>
            ))}
          </div>
          {(fp.length > 0 || dr.length > 0) && (
            <div>
              {fp.length > 0 && <><div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Focus points</div><ul style={{ margin: '0 0 14px', paddingLeft: 16 }}>{fp.map((x: string, i: number) => <li key={i} style={{ fontSize: 12, color: T.text2, marginBottom: 4 }}>{x}</li>)}</ul></>}
              {dr.length > 0 && <><div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Drills</div><ul style={{ margin: 0, paddingLeft: 16 }}>{dr.map((x: string, i: number) => <li key={i} style={{ fontSize: 12, color: T.text2, marginBottom: 4 }}>{x}</li>)}</ul></>}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 16 }}>
          {KIT_BY_TYPE[(plan.session_type as SType) || 'Private'].map(k => <span key={k} style={{ fontSize: 11, color: T.text2, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 999, padding: '3px 10px' }}>{k}</span>)}
        </div>
        {mediaOpen && <MediaCaptureModal T={T} accent={accent} defaultKind="audio" players={players} playerName={plan.group_name || undefined}
          onClose={() => setMediaOpen(false)} onSummary={() => { setMediaOpen(false); onCompleted() }} />}
      </>
  )
  // Inline (Today view) — render as a panel under the session cards, like the demo.
  if (inline) return <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18, marginTop: 14 }}>{body}</div>
  // Default — modal.
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '5vh 16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 620, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24 }}>{body}</div>
    </div>
  )
}
