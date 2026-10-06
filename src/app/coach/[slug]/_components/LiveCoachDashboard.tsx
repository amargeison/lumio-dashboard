'use client'

// Live coach dashboard — mirrors the demo dashboard (greeting hero, Today
// schedule, stat cards, Inbox / summary / Needs attention) wired to the coach's
// own data. Panels that depend on un-configured connections (email/calendar)
// show a "set up" state. Falls back to the onboarding grid when there's no data.

import { useEffect, useState } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT, FONT_MONO } from '@/app/cricket/[slug]/v2/_lib/theme'
import { dbInsert, dbUpdate, useCoachProfile, RACKET_STAGES, SKILLS_BY_STAGE, loadRows, cachedRows, latestRows, onRowsChanged, currentIdentity, type CoachTable } from '../_lib/coach-db'
import { ModuleSkeleton } from './ModuleSkeleton'
import { getSettings } from '../_lib/settings-store'
import { campSpans, campsBetween, campsOn, campDayLabel, CAMP_COLOUR } from '@/lib/coach/camp-dates'
import { campMoney } from '@/lib/coach/camp-money'
import { getFlags, subscribe as subscribeFeatures, NEW_ACCOUNT_TIER } from '../_lib/feature-flags'
import { EmptyCoachDashboard } from './EmptyCoachDashboard'
import { EmptyCoachHome } from './EmptyCoachHome'
import { LiveCoachSendMessage } from './LiveCoachSendMessage'
import { PayModal } from './LivePayments'
import { avatarSrc } from '@/lib/avatar'
import { V2_NOTES } from '@/lib/coach/v2'
import { GettingStarted, type StartStep } from './GettingStarted'
import { formatPounds, formatPennies, paymentOwedPennies } from '@/lib/coach/money'
import { useAskBeforeClose } from '../_lib/ask-before-close'
import { accentText } from '../_lib/theme'
import { playerLabels } from '../_lib/tell-apart'
import { ukDate, ukTime, ukWeek, addDaysIso, daysBetweenIso } from '@/lib/coach/uk-date'
import { stockState, stockNeedsAttention, STOCK_LABEL } from '../_lib/lumio-equipment'

type Common = { T: ThemeTokens; accent: AccentTokens; density: Density }

const fmtDate = (d?: string) => { if (!d) return ''; try { return new Date(d).toLocaleDateString('en-GB') } catch { return d } }
// A racket is "ready" when every skill at that stage is at 4 (Consistent) — the
// rule the Racket Progression page uses for its 100% and its award button. The
// dashboard used a lower mark, so it announced an assessment for a player the
// progression page showed at 0%.
const RACKET_READY_SCORE = 4
// What an inbox line shows of a message. The automatic notices carry links
// written as [label](address) for the player's app; here that is a wall of
// address, so only the label is kept.
const plainText = (t?: string | null) => String(t ?? '').replace(/\[([^\]]+)\]\((?:https?:|\/)[^)\s]*\)/g, '$1').replace(/\s*\n+\s*/g, ' · ')
// A message the coach wrote, as opposed to one Lumio sent for them (a booking
// or camp confirmation, a welcome note). The automatic ones carry a key in
// `channels`; see lib/coach/booking-notify.
const coachWrote = (m: { direction?: string | null; channels?: string | null }) => m.direction !== 'in' && !/^inapp:/.test(m.channels || '') && (m.channels || '') !== 'lumio'
// WMO weather code → short label (Open-Meteo current weather).
const wmo = (c: number): string => c === 0 ? 'clear' : c <= 3 ? 'cloudy' : c <= 48 ? 'fog' : c <= 67 ? 'rain' : c <= 77 ? 'snow' : c <= 82 ? 'showers' : c <= 86 ? 'snow' : 'storms'

// Everything the dashboard reads, in the order it destructures them.
const DASH_TABLES: CoachTable[] = ['coach_players', 'coach_bookings', 'coach_sessions', 'coach_payments', 'coach_attendance', 'coach_player_skills', 'coach_messages', 'coach_equipment', 'coach_staff', 'coach_venues', 'coach_camps', 'coach_camp_attendees', 'coach_session_plans']

export function LiveCoachDashboard({ T, accent, density, clubName, onNavigate, onStartWizard, asCoach, canNavigate }: Common & { clubName: string; onNavigate: (id: string) => void; onStartWizard?: () => void; asCoach?: { name: string; profileDone: boolean; staffId?: string | null } | null; canNavigate?: (id: string) => boolean }) {
  const profile = useCoachProfile()
  // Shared cache first: coming back to the dashboard from another page paints
  // straight away from what is already loaded, then refreshes underneath.
  const [raw, setD] = useState<{ players: any[]; bookings: any[]; lessons: any[]; payments: any[]; attendance: any[]; skills: any[]; messages: any[]; equipment: any[]; staff: any[]; venues: any[]; camps: any[]; campAttendees: any[]; plans: any[]; loading: boolean }>(() => {
    const got = DASH_TABLES.map(t => cachedRows(t))
    if (got.every(Boolean)) {
      const [players, bookings, lessons, payments, attendance, skills, messages, equipment, staff, venues, camps, campAttendees, plans] = got as unknown[][]
      return { players, bookings, lessons, payments, attendance, skills, messages, equipment, staff, venues, camps, campAttendees, plans, loading: false }
    }
    return { players: [], bookings: [], lessons: [], payments: [], attendance: [], skills: [], messages: [], equipment: [], staff: [], venues: [], camps: [], campAttendees: [], plans: [], loading: true }
  })
  const [weather, setWeather] = useState<{ temp: number; desc: string; wind: number } | null>(null)
  const [booking, setBooking] = useState(false)
  const [composer, setComposer] = useState<{ recipient?: string; playerId?: string; body?: string } | null>(null)
  const [inboxOpen, setInboxOpen] = useState<string | null>(null)
  // "Nothing booked" opens the list of exactly those players, here on the page.
  const [showUnbooked, setShowUnbooked] = useState(false)
  // "Take a payment" opens the Stripe checkout QR modal (same as the Payments page).
  const [pay, setPay] = useState<{ amount?: number; description?: string; player_name?: string; payment_id?: string } | null>(null)
  const [payConnected, setPayConnected] = useState<boolean | null>(null)
  // Which modules are live. The briefing has to KNOW this: a signal about
  // rackets is noise at an academy without the reward system, and switching the
  // module on has to change what Lumio Coach talks about without waiting for the
  // three-hour cache to lapse.
  const [feat, setFeat] = useState(() => getFlags(NEW_ACCOUNT_TIER))
  useEffect(() => { const r = () => setFeat(getFlags(NEW_ACCOUNT_TIER)); r(); return subscribeFeatures(r) }, [])
  useEffect(() => { fetch('/api/coach/pay/status').then(r => r.json()).then(d => setPayConnected(!!d.chargesEnabled)).catch(() => setPayConnected(false)) }, [])
  const reloadBookings = async () => { const bookings = await loadRows('coach_bookings', true); setD(v => ({ ...v, bookings })) }
  const reloadMessages = async () => { const messages = await loadRows('coach_messages', true); setD(v => ({ ...v, messages })) }
  const patchMsg = (id: string, patch: Record<string, any>) => setD(v => ({ ...v, messages: v.messages.map(m => m.id === id ? { ...m, ...patch } : m) }))

  // Live local weather for the banner (device location → Open-Meteo, keyless).
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(async pos => {
      try {
        const { latitude, longitude } = pos.coords
        const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m`)
        const j = await r.json()
        if (j.current) setWeather({ temp: Math.round(j.current.temperature_2m), desc: wmo(j.current.weather_code), wind: Math.round(j.current.wind_speed_10m) })
      } catch { /* ignore */ }
    }, () => { /* denied — no weather */ }, { timeout: 8000, maximumAge: 1800000 })
  }, [])

  // Everything the dashboard shows, fetched together. Also run after a bulk
  // import from the welcome page, so the imported academy appears straight away.
  const loadAll = async () => {
    const [players, bookings, lessons, payments, attendance, skills, messages, equipment, staff, venues, camps, campAttendees, plans] = await Promise.all(
      DASH_TABLES.map(t => loadRows(t).catch(() => cachedRows(t) ?? [])),
    )
    return { players, bookings, lessons, payments, attendance, skills, messages, equipment, staff, venues, camps, campAttendees, plans, loading: false }
  }
  const reloadAll = () => { loadAll().then(setD).catch(() => { /* keep what is shown */ }) }
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const next = await loadAll()
      if (!cancelled) setD(next)
    })()
    return () => { cancelled = true }
    // Re-read when the head coach switches whose view this is — the rows are
    // scoped to the coach being previewed, so the old ones are the wrong ones.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asCoach?.staffId])
  // Rows saved while this page is open — a booking, a payment, a message sent
  // from here — are taken from the data layer's one fresh read, the same rows
  // the right-hand rail is given, so the tiles and the rail cannot disagree.
  useEffect(() => onRowsChanged(t => {
    const keys = ['players', 'bookings', 'lessons', 'payments', 'attendance', 'skills', 'messages', 'equipment', 'staff', 'venues', 'camps', 'campAttendees', 'plans'] as const
    for (const table of t === null ? DASH_TABLES : DASH_TABLES.includes(t) ? [t] : []) {
      latestRows<any>(table).then(rows => setD(v => ({ ...v, [keys[DASH_TABLES.indexOf(table)]]: rows }))).catch(() => { /* keep what is shown */ })
    }
  }), [])

  // Inbound replies arrive via webhook; refresh the inbox every ~2 min so they show.
  useEffect(() => {
    const id = setInterval(() => reloadMessages(), 120000); return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Is a mailbox/calendar actually connected? Every other step here is a fact
  // read from the coach's own data; this one lives behind an API because the
  // tokens are server-side only, so it is fetched once rather than guessed from
  // a local setting.
  const [hasMailbox, setHasMailbox] = useState(true)   // assume yes until told otherwise, so the step never flashes up for a coach who has done it
  useEffect(() => {
    let off = false
    ;(async () => {
      try {
        const res = await fetch('/api/coach/integrations')
        if (!res.ok) return
        const j = await res.json()
        const live = (j.connections || []).some((c: { status?: string }) => c.status !== 'reauth')
        if (!off) setHasMailbox(live)
      } catch { /* offline — leave the step out rather than nagging wrongly */ }
    })()
    return () => { off = true }
  }, [])

  if (raw.loading) return <ModuleSkeleton T={T} variant="dashboard" />

  // ── Whose dashboard ─────────────────────────────────────────────────────────
  // When a coach is in the chair — signed in as themselves, or the head coach
  // using "View as coach" — everything below is that coach's: their players,
  // their bookings, their lessons, and the payments and messages of their
  // players. For a signed-in coach the database has already done this. For the
  // head coach's preview it had not: the header said "12 sessions today" and
  // the Today panel listed the whole academy, while the coach themselves saw 4.
  const myStaffId = asCoach?.staffId || null
  const mine = <R extends { staff_id?: string | null }>(rows: R[]) => myStaffId ? rows.filter(r => r.staff_id === myStaffId) : rows
  const d = (() => {
    if (!myStaffId) return raw
    const players = mine(raw.players)
    const ids = new Set(players.map(p => p.id))
    const theirs = (rows: any[]) => rows.filter(r => r.player_id && ids.has(r.player_id))
    return { ...raw, players, bookings: mine(raw.bookings), lessons: mine(raw.lessons), plans: mine(raw.plans), payments: theirs(raw.payments), messages: theirs(raw.messages) }
  })()

  // ── Getting started (worked out before the empty check: a brand-new
  // academy sees the same checklist on its welcome page) ────────────────────────────────────────────────────────
  // Each step is a FACT about their account, not a flag we set when they looked
  // at a screen. That is the whole reason this can be trusted: it cannot say
  // "done" for something they have not done, and it cannot nag about something
  // they have.
  const hasVenue = (d.venues || []).length > 0
  const hasPlayers = d.players.length > 0
  // A plan is a plan: a row in the Session Planner. It used to tick as soon as
  // there was a booking, which is the step before it.
  const hasPlan = (d.plans || []).length > 0
  const hasSummary = (d.lessons || []).length > 0
  // A message the coach sent — not the "Session booked" notice Lumio files
  // automatically, which ticked this step the moment a booking was added.
  const hasMessage = (d.messages || []).some(coachWrote)
  const hasBooking = (d.bookings || []).length > 0
  // Straight to the right panel in Settings, not to the top of the page.
  const openSettings = (panel: string) => () => { try { sessionStorage.setItem('lumio_open_settings', panel) } catch { /* ignore */ } onNavigate('settings') }
  const startSteps: StartStep[] = [
    { id: 'mailbox', label: 'Connect your calendar & email', why: 'Bookings land in the calendar on your phone, and confirmations, camp emails and lesson write-ups arrive from your own address instead of ours — which is the difference between a parent trusting the email and deleting it.', done: hasMailbox, action: openSettings('integrations'), cta: 'Connect' },
    { id: 'venue', label: 'Set your home court', why: 'Everything with an address on it — a confirmation email, the map link a player taps, free-slot suggestions — comes from your venue. Two minutes, once.', done: hasVenue, action: openSettings('venuescfg:new'), cta: 'Add it' },
    { id: 'players', label: 'Add the players you coach', why: 'A player record is what every booking, summary, payment and message hangs off. Add a handful to start — you do not need the whole roster today.', done: hasPlayers, nav: 'roster', cta: 'Add players' },
    { id: 'booking', label: 'Put a session in the diary', why: 'Book one lesson and you will see the confirmation, the calendar link and the player\u2019s own page all fill in behind it.', done: hasBooking, nav: 'calendar', cta: 'Open calendar' },
    { id: 'plan', label: 'Build a session plan', why: 'Open a booking in the Session Planner and Lumio Coach writes the plan and the run-sheet from that player\u2019s history. This is the bit coaches say they would pay for on its own.', done: hasPlan, nav: 'planner', cta: 'Plan one' },
    { id: 'summary', label: 'Write up a lesson', why: 'Record the hour, or tick what you covered when you finish. The write-up lands with the player and is the thing they value most.', done: hasSummary, nav: 'lessons', cta: 'Write one' },
    { id: 'message', label: 'Message a player or parent', why: 'Send one message and they get it in their app as well as their inbox \u2014 which is how conversations move off WhatsApp.', done: hasMessage, nav: 'messages', cta: 'Send one' },
  // A step whose page the coach has hidden from their menu is not asked of
  // them: its button could not open anything.
  ].filter(s => !s.nav || !canNavigate || canNavigate(s.nav))

  const total = d.players.length + d.bookings.length + d.lessons.length + d.payments.length
  // An assistant coach gets a different empty state: the head coach's setup grid
  // is a list of things they cannot do.
  if (total === 0 && asCoach) return <EmptyCoachHome T={T} accent={accent} coachName={asCoach.name} clubName={clubName} onNavigate={onNavigate} profileDone={asCoach.profileDone} />
  if (total === 0) return <EmptyCoachDashboard T={T} accent={accent} density={density} clubName={clubName} onNavigate={onNavigate} onStartWizard={onStartWizard}
    steps={startSteps} canNavigate={canNavigate} onImported={reloadAll} />

  // "Today" is the date in the UK, and "this week" is Monday to Sunday of the
  // week that contains it — the same week the calendar and the Session Planner
  // show, so the tile, the right-hand rail and the page the tile opens agree.
  const today = ukDate()
  const nowHM = ukTime()
  const week = ukWeek(today)
  const dk = (x?: string | null) => String(x ?? '').slice(0, 10) // tolerate timestamp-format dates
  const active = (b: any) => b.status !== 'cancelled'
  const byWhen = (a: any, b: any) => (dk(a.booking_date) + (a.start_time ?? '')).localeCompare(dk(b.booking_date) + (b.start_time ?? ''))
  const todays = d.bookings.filter(b => dk(b.booking_date) === today && active(b)).sort((a, b) => String(a.start_time ?? '').localeCompare(String(b.start_time ?? '')))
  const upcoming = d.bookings.filter(b => dk(b.booking_date) >= today && active(b)).sort(byWhen)
  // The next session is one that has not started yet. It used to be the first
  // booking dated today, so at three in the afternoon it still showed the 8am.
  // A booking today with no time cannot be placed before or after now, so it is
  // not offered as "next".
  const next = upcoming.find(b => dk(b.booking_date) > today || (!!b.start_time && String(b.start_time) >= nowHM))
  const thisWeek = d.bookings.filter(b => dk(b.booking_date) >= week.start && dk(b.booking_date) <= week.end && active(b))
  // The next seven days after today, for the Upcoming card (which says so).
  const weekAhead = addDaysIso(today, 7)
  // Highlight the next not-yet-started session in the Today timeline (demo style).
  const todayHighlightId = (todays.find(b => (b.start_time || '') >= nowHM) || todays[0])?.id
  // Money is added in pennies, and "how many players owe" counts players — one
  // family with three unpaid invoices is one conversation, not three.
  // "Owed" is the Payments page's own rule (a refunded or cancelled line is
  // never owed), so the two screens cannot disagree.
  const due = d.payments.filter(p => paymentOwedPennies(p) > 0)
  const duePennies = due.reduce((n, p) => n + paymentOwedPennies(p), 0)
  const dueText = formatPennies(duePennies)
  const duePlayers = new Set(due.map(p => p.player_id ? `id:${p.player_id}` : `name:${String(p.player_name || '').trim().toLowerCase()}`)).size

  // Skill map per player → rackets ready to advance (all stage skills consistent).
  const skillFor = (pid: string) => Object.fromEntries(d.skills.filter(s => s.player_id === pid).map(s => [s.skill, s.score]))
  // Only an academy on the Racket Progression module has "racket assessments"
  // to be due. Without it the colour ladder still exists, but there is no award
  // to book and nothing to hand over — so the headline, the Needs-attention
  // card and the briefing all have to stay silent about it, not just one of
  // them. Gating the list itself is what makes that true everywhere at once.
  const racketsReady = !feat.racket ? [] : d.players.filter(p => {
    const st = RACKET_STAGES.findIndex(s => s.id === p.racket_stage)
    if (st < 0) return false
    const list = SKILLS_BY_STAGE[RACKET_STAGES[st].id] || []
    if (!list.length) return false
    const m: any = skillFor(p.id)
    return list.every(s => (m[s] || 0) >= RACKET_READY_SCORE)
  })
  // Needs attention: low attendance or no upcoming booking.
  const attPct = (pid: string) => { const r = d.attendance.filter(a => a.player_id === pid); return r.length ? Math.round(r.filter(a => a.present).length / r.length * 100) : null }
  // By the player's id where the booking has one — two players can share a name.
  // An old booking that carries only a name counts for a player only when
  // nobody else on the roster has that name.
  const lower = (x?: string | null) => (x || '').trim().toLowerCase()
  const soleName = (n?: string | null) => !!lower(n) && d.players.filter(q => lower(q.name) === lower(n)).length === 1
  const hasUpcoming = (p: { id: string; name?: string | null }) => upcoming.some(b => b.player_id ? b.player_id === p.id : (soleName(p.name) && lower(b.player_name) === lower(p.name)))
  const needsAll = d.players.map(p => {
    const a = attPct(p.id)
    if (a !== null && a < 80) return { p, reason: `Attendance ${a}%` }
    if (!hasUpcoming(p)) return { p, reason: 'No upcoming session' }
    return null
  }).filter(Boolean) as { p: any; reason: string }[]
  const needs = needsAll.slice(0, 5)

  // Live inbox — the 5 most recent messages (mirrors the Messages section).
  const inbox = d.messages.filter(m => !m.dismissed).sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? ''))).slice(0, 5)
  // Tag a contact by matching their name against the roster / staff / venues.
  // Same rule as Messages: "Parent" only for a name that matches a guardian on
  // the roster, never as the fallback — an adult camp's chat is not a parent.
  const tagFor = (raw?: string | null, playerId?: string | null): string => {
    const key = (raw || '').trim()
    if (key.startsWith('camp:') || /^camp\s*·/i.test(key)) return 'Camp'
    // A message filed under a player is that player's, whatever name it carries.
    if (playerId && d.players.some((p: any) => p.id === playerId)) return 'Player'
    const n = key.split(',')[0].trim().toLowerCase()
    if (!n) return 'Contact'
    if (d.venues.some((v: any) => (v.name || '').trim().toLowerCase() === n)) return 'Venue'
    if (d.staff.some((s: any) => (s.name || '').trim().toLowerCase() === n)) return 'Coach'
    if (d.players.some((p: any) => (p.name || '').trim().toLowerCase() === n)) return 'Player'
    if (d.players.some((p: { parent_name?: string | null }) => (p.parent_name || '').trim().toLowerCase() === n)) return 'Parent'
    return 'Contact'
  }
  const REACTIONS = ['👍', '❤️', '😄', '✅']

  // Players with NOTHING in the diary. The earliest churn signal a coach gets —
  // a player drifts weeks before they say anything — and the number is itself
  // the call list. Replaces "Rackets due", which meant nothing to an academy
  // without the reward module and so was blank for most of them.
  const unbooked = d.players.filter(p => !hasUpcoming(p))
  const daysBetween = (a: string, b: string) => Math.max(0, daysBetweenIso(a, b))
  const campAttendeeCount = (campId: string) => (d.campAttendees || []).filter((a: any) => a.camp_id === campId && (a.status || 'confirmed') !== 'cancelled').length

  // Camps belong in Upcoming too. A camp IS the coach's week; leaving it out
  // made the emptiest-looking week the busiest one they have.
  const campList = campSpans(d.camps || [])
  const upcomingCamps = campsBetween(campList, today, weekAhead)
  const todayCamps = campsOn(campList, today)

  // ── The camp, on the dashboard ──────────────────────────────────────────────
  // A camp is the largest single thing in a coach's year — the most money, the
  // most logistics, the most parents asking questions — and it was visible only
  // if you went looking for it on the Camps page. The one running (or the one
  // coming) now sits directly under the coach card, because for the eight weeks
  // before it departs that is the first thing a head coach wants to know.
  const campFocus = (() => {
    const c = todayCamps[0] || campsBetween(campList, today, '9999-12-31')[0]
    if (!c) return null
    const row = (d.camps || []).find((x: any) => String(x.id) === String(c.id)) || {}
    const att = (d.campAttendees || []).filter((a: any) => a.camp_id === c.id && (a.status || 'confirmed') !== 'cancelled')
    const m = campMoney(row, att)
    const costs: { label?: string; amount?: number }[] = Array.isArray(row.costs) ? row.costs : []
    const totalCost = costs.reduce((n, x) => n + (Number(x.amount) || 0), 0)
    const dayNo = c.start <= today ? daysBetween(c.start, today) + 1 : 0
    const away = daysBetween(today, c.start)
    const coachCount = Array.isArray(row.coach_ids) ? (row.coach_ids as unknown[]).length : 0
    return { c, m, costs, totalCost, dayNo, away, coachCount, running: dayNo > 0 }
  })()

  // The signals. These are FACTS about the coach's week, not the briefing —
  // Lumio Coach turns them into the briefing (see the effect below). Anything
  // added here becomes something he can decide to lead with.
  //
  // WHOSE week, though. An assistant coach can read the whole academy (tier 2
  // RLS), so the numbers above are the club's, not theirs — and a briefing that
  // opens with a balance they cannot chase for a player they have never taught
  // is worse than no briefing. When a staff identity is in the chair, every
  // signal below is narrowed to rows carrying their staff_id, and the money
  // signal is dropped entirely: payments are academy-level by design (see
  // migration 165), so there is no honest per-coach version of it.
  const myPlayers = mine(d.players)
  const myTodays = mine(todays)
  const myNext = mine(upcoming)[0]
  const myLessonsThisWeek = mine(d.lessons).filter(l => dk(l.session_date) >= week.start && dk(l.session_date) <= week.end).length
  const myReady = mine(racketsReady)

  const lowAtt = myPlayers.map(p => ({ p, a: attPct(p.id) })).filter(x => x.a !== null && (x.a as number) < 80).sort((a, b) => (a.a as number) - (b.a as number))
  // Rackets, Retention, Schedule and Progress always appear (with live data +
  // zero-states) so the briefing reads the same on a fresh account as a busy
  // one; Payments joins them only for the person who can act on it.
  const briefing: { tag: string; pri: 'high' | 'med' | 'low'; text: string }[] = []
  // A coach hears only about their own players' balances — the rows are already
  // limited to those (migration 188), so the wording is what changes.
  if (myStaffId && duePennies > 0) briefing.push({ tag: 'payments', pri: 'med', text: `${duePlayers} of your players ${duePlayers > 1 ? 'have' : 'has'} an outstanding balance — ${dueText}. Worth collecting at their next session.` })
  if (!myStaffId) briefing.push({ tag: 'payments', pri: duePennies > 0 ? 'high' : 'low', text: duePennies > 0 ? `${duePlayers} player${duePlayers > 1 ? 's have' : ' has'} an outstanding balance — ${dueText} to collect.` : 'No outstanding balances on lessons and packages.' })
  if (feat.racket) briefing.push({ tag: 'rackets', pri: myReady.length ? 'high' : 'low', text: myReady.length ? `${myReady.length} player${myReady.length > 1 ? 's are' : ' is'} ready to move up a racket — book ${myReady.length > 1 ? 'assessments' : 'an assessment'}: ${myReady.slice(0, 3).map(p => p.name).join(', ')}.` : 'No players ready to move up a racket yet — keep logging skill progress.' })
  // A camp in the diary outranks almost everything else in the week, and the
  // briefing never knew camps existed.
  if (todayCamps.length) {
    const c = todayCamps[0]
    briefing.push({ tag: 'camps', pri: 'high', text: `${c.name} is running today — ${campDayLabel(c)}${c.where ? ` at ${c.where}` : ''}.` })
  } else if (upcomingCamps.length) {
    const c = upcomingCamps[0]
    const away = daysBetween(today, c.start)
    briefing.push({ tag: 'camps', pri: away <= 7 ? 'high' : 'med', text: `${c.name} starts ${away <= 1 ? 'tomorrow' : `in ${away} days`}${c.where ? ` at ${c.where}` : ''} — ${campAttendeeCount(c.id)} booked on.` })
  }
  briefing.push({ tag: 'retention', pri: lowAtt.length ? 'high' : 'low', text: lowAtt.length ? `${lowAtt[0].p.name} is at ${lowAtt[0].a}% attendance — worth a check-in.` : 'Attendance is healthy across your players.' })
  briefing.push({ tag: 'schedule', pri: myTodays.length ? 'med' : 'low', text: myTodays.length ? `${myTodays.length} session${myTodays.length > 1 ? 's' : ''} today${myTodays[0]?.start_time ? ` from ${myTodays[0].start_time}` : ''}.${myNext && dk(myNext.booking_date) > today ? ` Next after today: ${fmtDate(myNext.booking_date)} ${myNext.start_time || ''}.` : ''}` : (myNext ? `No sessions today — next is ${fmtDate(myNext.booking_date)} ${myNext.start_time || ''}.` : 'No upcoming sessions booked — add bookings in the calendar.') })
  briefing.push({ tag: 'progress', pri: 'low', text: myLessonsThisWeek ? `${myLessonsThisWeek} lesson summar${myLessonsThisWeek > 1 ? 'ies' : 'y'} written this week (Monday to Sunday) — keep sharing the wins with players.` : 'No lesson summaries yet this week — log one after your next session.' })

  // Extra row cards. Upcoming = the next 7 days EXCLUDING today (today already
  // has its own timeline in the hero), so this isn't duplicate content.
  const nextSessions = upcoming.filter(b => dk(b.booking_date) > today && dk(b.booking_date) <= weekAhead).slice(0, 5)
  const recentSummaries = [...d.lessons].sort((a, b) => dk(b.session_date).localeCompare(dk(a.session_date))).slice(0, 3)
  // The same rule the Equipment page uses (count first, then the coach's own
  // flag), so this card and that page's "Need attention" tile always agree — an
  // item with none left used to count as stocked here.
  const kitAttention = d.equipment.filter(stockNeedsAttention)
  const kitUncounted = d.equipment.filter(i => stockState(i) === 'uncounted').length

  // A page the coach has hidden from their menu cannot be opened from here
  // either, so its buttons are not shown: "Open calendar" with the calendar
  // hidden did nothing when pressed.
  const can = (id: string) => !canNavigate || canNavigate(id)
  // Open the calendar on the week that holds this booking. It used to open on
  // this week, where a booking for next Wednesday is not on screen.
  const openCalendarAt = (date?: string | null) => { try { if (date) sessionStorage.setItem('lumio_open_date', dk(date)) } catch { /* ignore */ } onNavigate('calendar') }
  // "Wed 7 Oct" — short enough to sit on one line with the time.
  const shortDay = (iso?: string | null) => iso ? new Date(`${dk(iso)}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).replace(',', '') : ''
  // Open a specific player's card on the roster (deep link).
  const openPlayer = (p: any) => { try { sessionStorage.setItem('lumio_open_player', p.id) } catch { /* ignore */ } onNavigate('roster') }

  // UK time, like every figure below it: on a device in another time zone the
  // header said Monday above Sunday's sessions.
  const hour = Number(ukTime().slice(0, 2))
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  // WHO is being greeted, not which club they work for.
  //
  // profile.display_name is the ACADEMY's profile — for an invited coach there
  // is no such row of their own, so it fell back to the club name and the line
  // read "Good morning, Penrith Tennis Club · Penrith Tennis Club". asCoach
  // carries the signed-in coach's own name and wins when present.
  const personName = (asCoach?.name || profile.display_name || '').trim()
  const firstName = personName.split(/\s+/)[0] || ''
  // If the only name we have IS the club, greet without a name rather than
  // saying it twice. "Good morning · Penrith Tennis Club" reads fine; the
  // duplicate reads like a bug, because it was one.
  const greetName = firstName && firstName.toLowerCase() !== (clubName || '').trim().toLowerCase().split(/\s+/)[0]
    ? firstName : ''
  // minWidth 0: every card here is a grid item, and a grid item will not shrink
  // below its longest unbroken line unless told it may. One long message
  // preview in the Inbox made the whole phone dashboard thousands of pixels wide.
  const card: React.CSSProperties = { background: T.panel, border: `1px solid ${T.border}`, borderRadius: density.radius, padding: density.pad, minWidth: 0 }
  // Match the demo SectionHead: white, sentence-case, 13/600 (not muted uppercase).
  const sectionTitle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: T.text, margin: '0 0 12px' }
  // Per-module section visibility — Settings → Dashboard → Sections.
  const sectOff = getSettings().sectionsOff?.dashboard || []
  const showSec = (k: string) => !sectOff.includes(k)



  return (
    <div style={{ fontFamily: FONT, display: 'flex', flexDirection: 'column', gap: density.gap }}>
      {/* Hero + Today */}
      <div className="cm-2" style={{ display: 'grid', gridTemplateColumns: showSec('today') ? '1.6fr 1fr' : '1fr', gap: density.gap }}>
        <div style={{ ...card, position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${accent.dim}, ${T.panel})` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
            <div style={{ fontSize: 12, color: T.text3 }}>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/London' })}</div>
            {weather && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.text2, flexWrap: 'wrap' }}>
                <span>🌤️ {weather.temp}° · {weather.desc} · {weather.wind} km/h</span>
                <span style={{ fontSize: 10.5, color: T.text3 }}>{/rain|snow|storm|shower/.test(weather.desc) ? 'Check court conditions' : 'Outdoor courts playable'}</span>
              </div>
            )}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: accentText(accent), textTransform: 'uppercase', letterSpacing: '0.12em' }}>{greeting}{greetName ? `, ${greetName}` : ''} · {clubName}</div>
          <h1 style={{ margin: '10px 0 0', fontSize: 24, fontWeight: 800, color: T.text }}>{myTodays.length} session{myTodays.length === 1 ? '' : 's'} today{racketsReady.length ? `, ${racketsReady.length} racket assessment${racketsReady.length === 1 ? '' : 's'} due` : ''}</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            <button onClick={() => setBooking(true)} style={btn(accent, T)}>+ Add booking</button>
            {/* Card payments are V2; the dashboard's shortcut says so rather than
                opening a modal that explains itself only once you are in it. */}
            <button onClick={() => setPay({})} style={btnGhost(T)} title={V2_NOTES.payments}>Take a payment</button>
            {can('lessons') && <button onClick={() => onNavigate('lessons')} style={btnGhost(T)}>Lesson Summaries</button>}
            {can('calendar') && <button onClick={() => onNavigate('calendar')} style={btnGhost(T)}>Open calendar</button>}
            <button onClick={() => setComposer({})} style={btnGhost(T)}>Send message</button>
          </div>
        </div>
        <div style={{ ...card, display: showSec('today') ? undefined : 'none' }}>
          <p style={sectionTitle}>Today</p>
          <div style={{ position: 'relative' }}>
            {todays.length > 0 && <div style={{ position: 'absolute', left: 49, top: 6, bottom: 6, width: 1, background: T.border }} />}
            {todays.length === 0 ? (
              <p style={{ color: T.text3, fontSize: 13, margin: 0 }}>No sessions today. <button onClick={() => (can('calendar') ? onNavigate('calendar') : setBooking(true))} style={linkBtn(accent)}>Add a booking →</button></p>
            ) : todays.map(b => {
              const hl = b.id === todayHighlightId
              return (
                <div key={b.id} style={{ position: 'relative', display: 'flex', gap: 14, padding: '6px 0' }}>
                  <div style={{ fontSize: 11, color: hl ? accent.hex : T.text3, width: 44, paddingTop: 2 }}>{b.start_time || '—'}</div>
                  <div style={{ position: 'absolute', left: 46, top: 9, width: 7, height: 7, borderRadius: '50%', background: hl ? accent.hex : T.panel, border: `1.5px solid ${hl ? accent.hex : T.border}` }} />
                  <div style={{ flex: 1, paddingLeft: 14, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, color: T.text, fontWeight: hl ? 600 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title || b.player_name || 'Session'}</div>
                    <div style={{ fontSize: 10.5, color: T.text3 }}>{[b.court, b.type].filter(Boolean).join(' · ')}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Getting started ────────────────────────────────────────────────── */}
      {/* Six things that make the portal work, ticked off from the data rather
          than from "have you seen this yet". It removes itself at six of six. */}
      {getSettings().gettingStarted !== false && !asCoach && (
        <GettingStarted T={T} accent={accent} steps={startSteps} onNavigate={onNavigate} />
      )}

      {/* ── Camp spotlight ─────────────────────────────────────────────────── */}
      {campFocus && (
        <button onClick={() => { try { sessionStorage.setItem('lumio_open_camp', campFocus.c.id) } catch { /* ignore */ } onNavigate('camps') }}
          style={{ ...card, textAlign: 'left', cursor: 'pointer', appearance: 'none', width: '100%', borderLeft: `3px solid ${CAMP_COLOUR}` }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: CAMP_COLOUR }}>
              {campFocus.running ? 'Camp running now' : 'Camp coming up'}
            </span>
            <span style={{ fontSize: 15, fontWeight: 800, color: T.text }}>{campFocus.c.name}</span>
            {!!campFocus.c.where && <span style={{ fontSize: 11.5, color: T.text3 }}>{campFocus.c.where}</span>}
            <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: campFocus.running ? T.good : (campFocus.away <= 14 ? T.warn : T.text2) }}>
              {campFocus.running
                ? `Day ${campFocus.dayNo} of ${campFocus.c.days}`
                : campFocus.away === 0 ? 'Starts today' : campFocus.away === 1 ? 'Starts tomorrow' : `${campFocus.away} days to go`}
            </span>
          </div>

          {/* How full it is, at a glance — the number that decides whether the
              camp makes money or is quietly cancelled. */}
          {campFocus.m.capacity > 0 && (
            <div style={{ display: 'flex', height: 6, borderRadius: 999, overflow: 'hidden', background: T.border, marginTop: 12 }}>
              <div style={{ width: `${Math.min(100, Math.round((campFocus.m.seats / campFocus.m.capacity) * 100))}%`, background: CAMP_COLOUR }} />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(118px, 1fr))', gap: 12, marginTop: 12 }}>
            {[
              { l: 'Booked', v: campFocus.m.capacity ? `${campFocus.m.seats}/${campFocus.m.capacity}` : String(campFocus.m.seats), c: T.text },
              { l: 'Coaches going', v: campFocus.coachCount || '—', c: campFocus.coachCount ? T.text : T.warn },
              { l: 'Collected', v: formatPounds(campFocus.m.collected), c: T.good },
              { l: 'Still owed', v: formatPounds(campFocus.m.outstanding), c: campFocus.m.outstanding > 0 ? T.warn : T.text3 },
              { l: campFocus.costs.length ? 'Margin' : 'Booked value', v: formatPounds(campFocus.costs.length ? campFocus.m.booked - campFocus.totalCost : campFocus.m.booked), c: campFocus.costs.length && campFocus.m.booked - campFocus.totalCost < 0 ? T.bad : T.text },
            ].map(x => (
              <div key={x.l}>
                <div style={{ fontSize: 10.5, color: T.text3 }}>{x.l}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: x.c, marginTop: 2 }}>{x.v}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 11, color: T.text3, marginTop: 10 }}>
            {campFocus.coachCount === 0
              ? 'No coaches assigned to this trip yet — open the camp and add them.'
              : campFocus.m.outstanding > 0
                ? `${formatPounds(campFocus.m.outstanding)} still to collect before you travel.`
                : campFocus.costs.length ? 'Everyone has paid. Costs are tracked on the Finance tab.' : 'Everyone has paid — add your costs to see the margin.'}
          </div>
        </button>
      )}

      {/* Stat cards */}
      <div className="cm-md" style={{ display: showSec('stats') ? 'grid' : 'none', gridTemplateColumns: 'repeat(5, 1fr)', gap: density.gap }}>
        {([
          // Monday to Sunday — the same seven days the calendar opens on.
          { l: 'This week', sub: 'Mon–Sun', v: thisWeek.length, nav: 'calendar' },
          // Opens the calendar on the week that session is in — next Monday's
          // lesson is not on this week's page.
          { l: 'Next session', v: next ? `${dk(next.booking_date) === today ? 'Today' : fmtDate(next.booking_date)}${next.start_time ? ' ' + next.start_time : ''}` : '—', nav: 'calendar', small: true, date: next?.booking_date },
          { l: 'Players', v: d.players.length, nav: 'roster' },
          // Opens the list of those players underneath, not the whole roster.
          { l: 'Nothing booked', v: unbooked.length, toggle: true },
          // A coach only ever has their own players' balances (migration 188).
          asCoach?.staffId
            ? { l: 'Due from my players', v: dueText, nav: 'payments' }
            : { l: 'Payments due', v: dueText, nav: 'payments' },
        ] as { l: string; sub?: string; v: string | number; nav?: string; small?: boolean; toggle?: boolean; date?: string | null }[]).map(s => (
          <button key={s.l} onClick={() => { if (s.toggle) setShowUnbooked(!showUnbooked); else if (s.date) openCalendarAt(s.date); else if (s.nav) onNavigate(s.nav) }} aria-expanded={s.toggle ? showUnbooked : undefined}
            style={{ ...card, textAlign: 'left', cursor: 'pointer', appearance: 'none', ...(s.toggle && showUnbooked ? { borderColor: accent.border } : {}) }}>
            <div style={{ fontSize: 11.5, color: T.text3 }}>{s.l}{s.sub ? <span style={{ opacity: 0.75 }}> · {s.sub}</span> : null}</div>
            <div style={{ fontSize: s.small || String(s.v).length > 9 ? 15 : 24, fontWeight: 800, color: T.text, marginTop: 4, overflowWrap: 'anywhere' }}>{s.v}</div>
          </button>
        ))}
      </div>

      {/* The players behind "Nothing booked" — the same ones the number counts. */}
      {showSec('stats') && showUnbooked && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 10 }}>
            <p style={{ ...sectionTitle, margin: 0 }}>Nothing booked <span style={{ fontWeight: 400, color: T.text3 }}>· {unbooked.length} player{unbooked.length === 1 ? '' : 's'} with no session from today on</span></p>
            <button onClick={() => setShowUnbooked(false)} style={{ ...linkBtn(accent), marginLeft: 'auto', fontSize: 11 }}>Close</button>
          </div>
          {unbooked.length === 0 ? <p style={{ fontSize: 12.5, color: T.text3, margin: 0 }}>Every player has a session booked.</p> : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {unbooked.map(p => (
                <button key={p.id} onClick={() => openPlayer(p)} style={{ appearance: 'none', cursor: 'pointer', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 600, color: T.text, fontFamily: FONT, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{playerLabels(d.players).get(p.id) || p.name}</button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Inbox / Coach AI briefing / Needs attention */}
      <div className="cm-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: density.gap }}>
        {/* Inbox — live, last 5 messages, synced with the Messages section */}
        <div style={{ ...card, display: showSec('inbox') ? undefined : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 12 }}>
            <p style={{ ...sectionTitle, margin: 0 }}>Inbox</p>
            {can('messages') && <button onClick={() => onNavigate('messages')} style={{ ...linkBtn(accent), marginLeft: 'auto', fontSize: 11 }}>All →</button>}
          </div>
          {inbox.length === 0 ? (
            <p style={{ fontSize: 12.5, color: T.text3, margin: 0 }}>No messages yet. <button onClick={() => setComposer({})} style={linkBtn(accent)}>Send one →</button></p>
          ) : inbox.map(m => {
            const open = inboxOpen === m.id
            // Only a message that came IN can be unread. The coach's own sent
            // messages default to read = false in the table and were all
            // showing the blue "unread" dot.
            const unread = m.direction === 'in' && !m.read
            const who = (m.recipients || 'Message').split(',')[0].trim()
            const preview = plainText(`${m.subject ? `${m.subject} — ` : ''}${m.body || ''}`)
            const tag = tagFor(m.recipients, m.player_id)
            const tagColour = tag === 'Venue' ? '#3A8EE0' : tag === 'Coach' ? accent.hex : tag === 'Player' ? T.good : T.text3
            const toggleReact = (e: React.MouseEvent, r: string) => { e.stopPropagation(); const next = m.reaction === r ? null : r; dbUpdate('coach_messages', m.id, { reaction: next }).then(() => patchMsg(m.id, { reaction: next })).catch(() => {}) }
            return (
              <div key={m.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                <div onClick={() => { const nowOpen = !open; setInboxOpen(nowOpen ? m.id : null); if (nowOpen && unread) dbUpdate('coach_messages', m.id, { read: true }).then(() => patchMsg(m.id, { read: true })).catch(() => {}) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', cursor: 'pointer' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: unread ? accent.hex : T.border }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, color: T.text, fontWeight: unread ? 700 : 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.direction === 'in' ? '↩ ' : 'To '}{who}</span>
                      <span style={{ fontSize: 8.5, fontWeight: 700, color: tagColour, background: `${tagColour}22`, padding: '1px 6px', borderRadius: 4, textTransform: 'uppercase', flexShrink: 0 }}>{tag}</span>
                      {m.reaction && <span style={{ fontSize: 11 }}>{m.reaction}</span>}
                      <span style={{ marginLeft: 'auto', fontSize: 10, color: T.text3, flexShrink: 0 }}>{m.created_at ? new Date(m.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : ''}</span>
                    </div>
                    <div style={{ fontSize: 11, color: T.text3, whiteSpace: open ? 'normal' : 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', overflowWrap: 'anywhere', marginTop: 1 }}>{preview}</div>
                  </div>
                </div>
                {open && (
                  <div style={{ padding: '0 0 10px' }}>
                    <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
                      {REACTIONS.map(r => <button key={r} onClick={e => toggleReact(e, r)} style={{ appearance: 'none', cursor: 'pointer', border: m.reaction === r ? `1px solid ${accent.hex}` : '1px solid transparent', background: m.reaction === r ? accent.dim : 'transparent', borderRadius: 6, padding: '2px 5px', fontSize: 13, opacity: m.reaction && m.reaction !== r ? 0.4 : 1 }}>{r}</button>)}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {/* By the player the message is filed under; the name is only a
                          fallback, and the wizard uses it only when one player has it. */}
                      <button onClick={() => setComposer({ recipient: who, playerId: m.player_id || undefined, body: '' })} style={msgAct(T)}>Reply</button>
                      <button onClick={() => setComposer({ recipient: '', body: plainText(m.body) })} style={msgAct(T)}>Forward</button>
                      <button onClick={() => { dbUpdate('coach_messages', m.id, { dismissed: true }).then(() => { patchMsg(m.id, { dismissed: true }); setInboxOpen(null) }).catch(() => {}) }} style={{ ...msgAct(T), color: T.bad }}>Dismiss</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Coach AI briefing. The panel only claims to be a briefing when Lumio
            Coach actually wrote one — if the call fails it shows the underlying
            numbers, plainly labelled as numbers. */}
        <div style={{ ...card, display: showSec('briefing') ? undefined : 'none' }}>
          <BriefingBody T={T} accent={accent} sectionTitle={sectionTitle} signals={briefing}
            todayCount={myTodays.length} role={myStaffId ? 'coach' : 'head'}
            scopeKey={`${myStaffId || 'head'}.${feat.racket ? 'r' : ''}${feat.effort ? 'e' : ''}${feat.video ? 'v' : ''}${feat.audio ? 'a' : ''}`} />
        </div>

        {/* Needs attention — boxed rows (matches demo) + racket assessments due */}
        <div style={{ ...card, display: showSec('needs') ? undefined : 'none' }}>
          <p style={sectionTitle}>Needs attention</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {needs.length === 0 && racketsReady.length === 0 && (
              <p style={{ fontSize: 12.5, color: T.text3, margin: 0 }}>Everyone&apos;s on track. 🎾</p>
            )}
            {needs.map(({ p, reason }) => (
              <button key={p.id} onClick={() => openPlayer(p)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', appearance: 'none', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 8px', cursor: 'pointer' }}>
                {p.avatar_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={avatarSrc(p.avatar_url)} alt={p.name} style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  : <span style={{ width: 26, height: 26, borderRadius: '50%', background: accent.dim, color: accentText(accent), display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{(p.name || '?').split(' ').map((w: string) => w[0]).slice(0, 2).join('')}</span>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: T.text, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                  <div style={{ fontSize: 10.5, color: T.text3 }}>{reason}</div>
                </div>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: T.warn, flexShrink: 0 }} />
              </button>
            ))}
            {needsAll.length > needs.length && (
              <button onClick={() => onNavigate('roster')} style={{ ...linkBtn(accent), fontSize: 11.5, textAlign: 'left' }}>+{needsAll.length - needs.length} more on the roster →</button>
            )}
            {racketsReady.length > 0 && (
              <button onClick={() => onNavigate('belts')} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', appearance: 'none', background: accent.dim, border: `1px solid ${accent.border}`, borderRadius: 8, padding: '7px 8px', cursor: 'pointer' }}>
                <span style={{ fontSize: 14 }}>🏆</span>
                <span style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{racketsReady.length} racket assessment{racketsReady.length === 1 ? '' : 's'} due</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Extra row — upcoming sessions / recent summaries / kit needing attention */}
      <div className="cm-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: density.gap }}>
        <div style={{ ...card, display: showSec('upcoming') ? undefined : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 12 }}>
            <p style={{ ...sectionTitle, margin: 0 }}>Upcoming <span style={{ fontWeight: 400, color: T.text3 }}>· next 7 days</span></p>
            {can('calendar') && <button onClick={() => onNavigate('calendar')} style={{ ...linkBtn(accent), marginLeft: 'auto', fontSize: 11 }}>Calendar →</button>}
          </div>
          {upcomingCamps.map(c => (
            <button key={c.id} onClick={() => { try { sessionStorage.setItem('lumio_open_camp', c.id) } catch { /* ignore */ } onNavigate('camps') }}
              style={{ display: 'flex', gap: 10, alignItems: 'center', width: '100%', textAlign: 'left', appearance: 'none', background: `${CAMP_COLOUR}14`, border: `1px solid ${CAMP_COLOUR}44`, borderRadius: 8, padding: '8px 10px', cursor: 'pointer', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: CAMP_COLOUR, fontWeight: 700, minWidth: 112, flexShrink: 0, whiteSpace: 'nowrap' }}>{shortDay(c.start)}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 12.5, color: T.text, fontWeight: 700, overflowWrap: 'anywhere' }}>{c.name}</span>
                <span style={{ display: 'block', fontSize: 10.5, color: T.text3 }}>{c.days > 1 ? `${c.days} days` : 'One day'}{c.where ? ` · ${c.where}` : ''}</span>
              </span>
              <span style={{ fontSize: 9, fontWeight: 700, color: CAMP_COLOUR, textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>Camp</span>
            </button>
          ))}
          {nextSessions.length === 0 && upcomingCamps.length === 0
            ? <p style={{ fontSize: 12.5, color: T.text3, margin: 0 }}>Nothing booked in the next 7 days.{can('calendar') && <> <button onClick={() => onNavigate('calendar')} style={linkBtn(accent)}>Open calendar →</button></>}</p>
            : nextSessions.map(b => {
            // The player's name, not just the title. "1:1" on four lines tells a
            // coach nothing about who is turning up.
            const who = (b.player_name || '').trim()
            const t = (b.title || '').trim()
            return (
            <button key={b.id} onClick={() => openCalendarAt(b.booking_date)} style={{ display: 'flex', gap: 10, width: '100%', textAlign: 'left', appearance: 'none', background: 'transparent', border: 'none', borderBottom: `1px solid ${T.border}`, padding: '8px 0', cursor: 'pointer' }}>
              <span style={{ fontSize: 11, color: accentText(accent), fontWeight: 600, minWidth: 112, flexShrink: 0, whiteSpace: 'nowrap' }}>{shortDay(b.booking_date)}{b.start_time ? ` ${b.start_time}` : ''}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 12.5, color: T.text, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{who || t || 'Session'}</span>
                {!!(who && t && t.toLowerCase() !== who.toLowerCase()) && (
                  <span style={{ display: 'block', fontSize: 10.5, color: T.text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t}{b.court ? ` · ${b.court}` : ''}</span>
                )}
              </span>
            </button>
          )})}
        </div>

        <div style={{ ...card, display: showSec('summaries') ? undefined : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 12 }}>
            <p style={{ ...sectionTitle, margin: 0 }}>Recent summaries</p>
            {can('lessons') && <button onClick={() => onNavigate('lessons')} style={{ ...linkBtn(accent), marginLeft: 'auto', fontSize: 11 }}>All →</button>}
          </div>
          {recentSummaries.length === 0 ? <p style={{ fontSize: 12.5, color: T.text3, margin: 0 }}>No summaries yet.</p> : recentSummaries.map(l => (
            <button key={l.id} onClick={() => onNavigate('lessons')} style={{ display: 'block', width: '100%', textAlign: 'left', appearance: 'none', background: 'transparent', border: 'none', borderBottom: `1px solid ${T.border}`, padding: '8px 0', cursor: 'pointer' }}>
              <div style={{ fontSize: 12.5, color: T.text, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.player_name || 'Session'}</div>
              <div style={{ fontSize: 11, color: T.text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fmtDate(l.session_date)}{l.focus ? ` · ${l.focus}` : ''}</div>
            </button>
          ))}
        </div>

        <div style={{ ...card, display: showSec('kit') ? undefined : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 12 }}>
            <p style={{ ...sectionTitle, margin: 0 }}>Kit needing attention{kitAttention.length > 0 ? ` · ${kitAttention.length}` : ''}</p>
            {can('equipment') && <button onClick={() => onNavigate('equipment')} style={{ ...linkBtn(accent), marginLeft: 'auto', fontSize: 11 }}>Equipment →</button>}
          </div>
          {/* "All stocked up" is only said when it is true: there is a list, and
              every item on it has been counted and is in stock. */}
          {kitAttention.length === 0 ? <p style={{ fontSize: 12.5, color: T.text3, margin: 0 }}>{d.equipment.length === 0 ? 'No kit list yet.' : kitUncounted > 0 ? `Nothing flagged. ${kitUncounted} item${kitUncounted === 1 ? ' has' : 's have'} not been counted yet.` : 'All stocked up. ✅'}</p> : kitAttention.slice(0, 5).map(i => { const st = stockState(i); return (
            <button key={i.id} onClick={() => { try { sessionStorage.setItem('lumio_equipment_filter', 'attention') } catch { /* ignore */ } onNavigate('equipment') }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', appearance: 'none', background: 'transparent', border: 'none', borderBottom: `1px solid ${T.border}`, padding: '8px 0', cursor: 'pointer' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: st === 'repair' || st === 'out' ? T.bad : st === 'order' ? '#3A8EE0' : T.warn, flexShrink: 0 }} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: T.text, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{i.item}</span>
              <span style={{ flexShrink: 0, fontSize: 10, color: T.text3, textTransform: 'uppercase' }}>{STOCK_LABEL[st]}</span>
            </button>
          ) })}
          {kitAttention.length > 5 && <button onClick={() => { try { sessionStorage.setItem('lumio_equipment_filter', 'attention') } catch { /* ignore */ } onNavigate('equipment') }} style={{ ...linkBtn(accent), fontSize: 11, marginTop: 8 }}>+{kitAttention.length - 5} more</button>}
        </div>
      </div>

      {booking && <QuickBookingModal T={T} accent={accent} players={d.players} onClose={() => setBooking(false)} onSaved={() => { setBooking(false); reloadBookings() }} />}
      {composer && <LiveCoachSendMessage T={T} accent={accent} players={d.players} coachName={profile.display_name || clubName} clubName={clubName} init={composer} onClose={() => setComposer(null)} onSent={() => { setComposer(null); reloadMessages() }} />}
      {pay && <PayModal T={T} accent={accent} connected={payConnected} init={pay} onClose={() => setPay(null)} />}
    </div>
  )
}

function msgAct(T: ThemeTokens): React.CSSProperties { return { appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 8, padding: '5px 11px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT } }

function QuickBookingModal({ T, accent, players, onClose, onSaved }: { T: ThemeTokens; accent: AccentTokens; players: any[]; onClose: () => void; onSaved: () => void }) {
  const today = ukDate()
  const [v, setV] = useState<Record<string, any>>({ player_id: '', booking_date: today, start_time: '', court: '', type: 'Private', duration_min: 60 })
  const [saving, setSaving] = useState(false)
  const [errs, setErrs] = useState<{ player?: string; time?: string; date?: string; save?: string }>({})
  const set = (k: string, val: any) => { setV(p => ({ ...p, [k]: val })); setErrs({}) }
  const field: React.CSSProperties = { width: '100%', background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 9, padding: '9px 11px', fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }
  const lab: React.CSSProperties = { display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: T.text3, margin: '0 0 5px' }
  const errStyle: React.CSSProperties = { fontSize: 11.5, color: T.bad, marginTop: 4, lineHeight: 1.4 }
  const save = async () => {
    if (saving) return
    // A booking with nobody in it and no time is not a booking: it sat at the
    // top of Today as "— Session" and sent a "Session booked" notice to
    // "your player". Who and when are asked for here; the calendar's own form
    // is the place for a block with no single player.
    const picked = players.find((p: any) => p.id === v.player_id) || null
    const next = {
      player: picked ? undefined : 'Choose who the session is for.',
      date: v.booking_date ? undefined : 'Choose a date.',
      time: v.start_time ? undefined : 'Choose a start time.',
    }
    if (next.player || next.date || next.time) { setErrs(next); return }
    setSaving(true)
    try {
      // Record WHICH player, not just the typed name — the confirmation email
      // resolves the family by id first, and a name that does not match a
      // roster row exactly means nobody is written to at all.
      await dbInsert('coach_bookings', { player_name: picked?.name || null, player_id: picked?.id ?? null, booking_date: v.booking_date, start_time: v.start_time || null, court: v.court || null, type: v.type, status: 'confirmed', duration_min: Number(v.duration_min) || 60 })
      onSaved()
    } catch (e) {
      const m = e instanceof Error ? e.message : ''
      setErrs({ save: /^That was not saved/.test(m) ? m : 'That booking could not be saved. Check the details and try again.' })
      setSaving(false)
    }
  }
  // A tap on the dark margin asks first once something has been filled in.
  const closeOutside = useAskBeforeClose(JSON.stringify(v), onClose)
  return (
    <div onClick={e => { if (e.target === e.currentTarget) closeOutside() }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, fontFamily: FONT, padding: '6vh 16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 440, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 14 }}>Add a booking</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><label style={lab}>Player *</label>
            {/* Chosen by id: two players can share a name. */}
            <select value={v.player_id} onChange={e => set('player_id', e.target.value)} style={{ ...field, cursor: 'pointer' }}>
              <option value="">Choose a player…</option>
              {players.map(p => <option key={p.id} value={p.id}>{p.name}{players.filter(q => (q.name || '').trim().toLowerCase() === (p.name || '').trim().toLowerCase()).length > 1 && p.parent_name ? ` — parent ${p.parent_name}` : ''}</option>)}
            </select>
            {errs.player && <div role="alert" style={errStyle}>{errs.player}</div>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={lab}>Date *</label><input type="date" value={v.booking_date} onChange={e => set('booking_date', e.target.value)} style={field} />{errs.date && <div role="alert" style={errStyle}>{errs.date}</div>}</div>
            <div><label style={lab}>Start time *</label><input type="time" value={v.start_time} onChange={e => set('start_time', e.target.value)} style={field} />{errs.time && <div role="alert" style={errStyle}>{errs.time}</div>}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={lab}>Type</label><select value={v.type} onChange={e => set('type', e.target.value)} style={{ ...field, cursor: 'pointer' }}>{['Private', 'Group', 'Cardio', 'Match play', 'Mini / red ball'].map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label style={lab}>Court</label><input value={v.court} onChange={e => set('court', e.target.value)} placeholder="e.g. Court 1" style={field} /></div>
          </div>
          <div><label style={lab}>Duration (mins)</label><input type="number" value={v.duration_min} onChange={e => set('duration_min', e.target.value)} style={field} /></div>
          {errs.save && <div role="alert" style={errStyle}>{errs.save}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18 }}>
          <button onClick={onClose} style={{ marginLeft: 'auto', appearance: 'none', padding: '8px 14px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ appearance: 'none', border: 0, padding: '8px 16px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.5 : 1, fontFamily: FONT }}>{saving ? 'Saving…' : 'Add booking'}</button>
        </div>
      </div>
    </div>
  )
}

function btn(accent: AccentTokens, T: ThemeTokens): React.CSSProperties { return { appearance: 'none', border: 0, cursor: 'pointer', padding: '8px 14px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 12.5, fontWeight: 700 } }
function btnGhost(T: ThemeTokens): React.CSSProperties { return { appearance: 'none', cursor: 'pointer', padding: '8px 14px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 12.5, fontWeight: 600 } }
// Links are words in the accent colour, so they use its text shade (4.5:1).
function linkBtn(accent: AccentTokens): React.CSSProperties { return { appearance: 'none', background: 'transparent', border: 0, color: accentText(accent), fontSize: 12.5, fontWeight: 700, cursor: 'pointer', padding: 0 } }

// ── Coach AI briefing ────────────────────────────────────────────────────────
// A child component ON PURPOSE. Its hooks used to live in LiveCoachDashboard,
// below two early returns (`if (d.loading)` and `if (total === 0)`), so the first
// render registered fewer hooks than the second and React threw #310 — the whole
// dashboard failed to load. Hooks in a child mount and unmount with the child,
// so an early return in the parent can never desynchronise them.
//
// Written ONCE A DAY for each person and kept in this browser until tomorrow,
// unless they press the refresh arrow. It used to be rewritten on every change
// to the numbers underneath it — and a coach marking six invoices paid is six
// changes — so the server's hourly limit refused it and every later visit to
// the dashboard logged an error. The numbers a coach needs live are still live:
// they are the tiles above and the "Also watching" chips below. The briefing is
// the morning read, stamped with the time it was written.
//
// The cache is keyed by WHO is reading — the signed-in person and whose view
// they are in. A head coach and their assistant share a browser at the desk
// more often than not, and a briefing about the academy's unpaid balances is
// not the assistant's briefing.
const BRIEF_RETRY_MS = 60 * 60 * 1000   // after a failed attempt, wait this long before asking again unprompted

type BriefItem = { tag: string; pri: 'high' | 'med' | 'low'; text: string }
type BriefCache = { day: string; at: string; items?: BriefItem[]; prose?: string; triedAt?: number }
// One request at a time per person: the panel can mount twice in quick
// succession (and always does in development), and both must share one ask.
const briefAsks = new Map<string, Promise<{ ok: boolean; d: any }>>()

function BriefingBody({ T, accent, sectionTitle, signals, todayCount, role, scopeKey }: {
  T: ThemeTokens; accent: AccentTokens
  sectionTitle: React.CSSProperties
  signals: BriefItem[]
  todayCount: number
  role: 'head' | 'coach'
  /** The staff id of whoever is signed in, or 'head'. Keys the cache. */
  scopeKey: string
}) {
  const [items, setItems] = useState<BriefItem[] | null>(null)
  const [prose, setProse] = useState('')
  const [at, setAt] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'failed'>('idle')
  // Bumped on a manual refresh and by the clock, so a dashboard left open on the
  // desk overnight writes tomorrow's briefing instead of showing yesterday's.
  const [tick, setTick] = useState(0)
  const [day, setDay] = useState(ukDate())
  // Who is signed in. Until this is known nothing is read or asked for, so one
  // person's briefing is never shown to the next person on the same browser.
  const [who, setWho] = useState<string | null>(null)
  useEffect(() => { let off = false; currentIdentity().then(me => { if (!off) setWho(`${me?.academyId || 'anon'}.${me?.staffId || 'head'}`) }).catch(() => { if (!off) setWho('anon.head') }); return () => { off = true } }, [])
  const ready = signals.length > 0
  const cacheKey = `lumio.brief.${who}.${scopeKey}`
  // The facts are read when the briefing is asked for (the effect below closes
  // over them); a change in them is deliberately NOT a reason to ask again.

  useEffect(() => {
    const id = setInterval(() => setDay(ukDate()), 5 * 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!ready || !who) return
    const remember = (c: BriefCache) => { try { localStorage.setItem(cacheKey, JSON.stringify(c)) } catch { /* nothing to do */ } }

    // Today's briefing, if this person already has one. A manual refresh
    // (tick > 0) skips this and asks again.
    let cached: BriefCache | null = null
    try { const rawc = localStorage.getItem(cacheKey); cached = rawc ? JSON.parse(rawc) : null } catch { /* private mode or corrupt entry — just fetch */ }
    if (cached && cached.day !== day) cached = null
    if (tick === 0 && cached) {
      if (cached.items?.length || cached.prose) { setItems(cached.items ?? null); setProse(cached.prose ?? ''); setAt(cached.at || ''); setState('idle'); return }
      // Asked earlier today and it could not be written: show the numbers, and
      // do not ask again on every visit.
      if (cached.triedAt && Date.now() - cached.triedAt < BRIEF_RETRY_MS) { setItems(null); setProse(''); setAt(''); setState('failed'); return }
    }

    let cancelled = false
    setState('loading')
    // Could not be written (or the server said "not again yet"). Whatever was
    // written earlier today stays, on screen and in the cache; otherwise the
    // panel shows the plain numbers. Either way the attempt is remembered.
    const had = cached && (cached.items?.length || cached.prose) ? cached : null
    const failed = () => { if (!cancelled) setState(had ? 'idle' : 'failed'); remember({ ...(had || { day, at: '' }), triedAt: Date.now() }) }
    const ask = briefAsks.get(cacheKey) || fetch('/api/coach/briefing', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signals: signals.map(b => ({ tag: b.tag, fact: b.text })), todayCount, role }),
    })
      .then(r => r.json().then(d => ({ ok: r.ok, d })))
      .finally(() => { briefAsks.delete(cacheKey) })
    briefAsks.set(cacheKey, ask)
    ask
      .then(({ ok, d }) => {
        const got: BriefItem[] | null = Array.isArray(d?.items) && d.items.length ? d.items : null
        if (!ok || (!got && !d?.briefing)) { failed(); return }
        const stamp = String(d.at || new Date().toISOString())
        remember({ day, at: stamp, items: got ?? undefined, prose: got ? undefined : String(d.briefing || '') })
        if (cancelled) return
        setItems(got); setProse(got ? '' : String(d.briefing || '')); setAt(stamp); setState('idle')
      })
      .catch(failed)
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, day, tick, cacheKey, role, who])

  const refresh = () => setTick(v => v + 1)

  // The stamp is when the briefing was WRITTEN, not when the page loaded —
  // that is the number that tells a coach whether they are reading something
  // from before their first lesson.
  const written = (() => {
    if (!at) return ''
    const d = new Date(at)
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  })()

  // Fallback rows carry the same priority colouring as a written briefing, so a
  // failed call still puts the urgent thing in red rather than flattening
  // everything into one grey list.
  const rows: BriefItem[] = items ?? (prose ? [] : signals)

  // ── Nothing is invisible ──────────────────────────────────────────────────
  // The briefing deliberately says three or four things: a list of everything
  // has prioritised nothing. But a coach who has just switched Racket
  // Progression on and never sees the word "rackets" reasonably concludes the
  // briefing cannot see it. So every subject the written briefing left out is
  // still here, as a chip — tap one and it tells you what it knows. The
  // briefing keeps deciding; the dashboard stops hiding.
  const [openTag, setOpenTag] = useState<string | null>(null)
  const mentioned = new Set(rows.map(r => r.tag))
  const rest = signals.filter(s => !mentioned.has(s.tag))

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
        <span style={{ color: accent.hex, fontSize: 13 }}>✦</span>
        <p style={{ ...sectionTitle, margin: 0 }}>Coach AI briefing</p>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {written && <span style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: T.text3 }}>{written}</span>}
          <button onClick={refresh} title="Rewrite the briefing now" aria-label="Rewrite the briefing now"
            style={{ appearance: 'none', background: 'transparent', border: 0, color: T.text3, cursor: 'pointer', fontSize: 12, padding: 0, lineHeight: 1 }}>↻</button>
        </span>
      </div>

      {state === 'loading' && !items && !prose && (
        <div style={{ fontSize: 11.5, color: T.text3, marginBottom: 8 }}>Lumio Coach is reading your week…</div>
      )}

      {prose
        ? <p style={{ fontSize: 12.5, color: T.text, lineHeight: 1.55, margin: 0, whiteSpace: 'pre-wrap' }}>{prose}</p>
        : rows.map((it, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderTop: i ? `1px solid ${T.border}` : 'none' }}>
            <span style={{ fontSize: 9.5, fontFamily: FONT_MONO, padding: '2px 6px', borderRadius: 4, whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0, color: it.pri === 'high' ? T.bad : T.text3, background: it.pri === 'high' ? 'rgba(199,90,90,0.10)' : T.panel2 }}>{it.tag}</span>
            <div style={{ flex: 1, fontSize: 12.5, color: T.text, lineHeight: 1.45 }}>{it.text}</div>
          </div>
        ))}

      {rest.length > 0 && (
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 9.5, color: T.text4, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Also watching</span>
            {rest.map(r => {
              const on = openTag === r.tag
              return (
                <button key={r.tag} onClick={() => setOpenTag(on ? null : r.tag)}
                  style={{ appearance: 'none', cursor: 'pointer', fontFamily: FONT_MONO, fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '2px 7px', borderRadius: 4, border: `1px solid ${on ? accent.border : T.border}`, background: on ? accent.dim : 'transparent', color: on ? accent.hex : T.text3 }}>
                  {r.tag}
                </button>
              )
            })}
          </div>
          {!!openTag && (
            <div style={{ fontSize: 12, color: T.text2, lineHeight: 1.5, marginTop: 8 }}>
              {rest.find(r => r.tag === openTag)?.text}
            </div>
          )}
        </div>
      )}

      {state === 'failed' && !items && !prose && (
        <div style={{ fontSize: 11, color: T.text3, marginTop: 8, lineHeight: 1.5 }}>
          These are your numbers — Lumio Coach couldn&rsquo;t write the briefing just now, so nothing here has been prioritised for you.
        </div>
      )}
    </>
  )
}
