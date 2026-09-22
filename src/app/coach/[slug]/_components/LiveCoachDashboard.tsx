'use client'

// Live coach dashboard — mirrors the demo dashboard (greeting hero, Today
// schedule, stat cards, Inbox / summary / Needs attention) wired to the coach's
// own data. Panels that depend on un-configured connections (email/calendar)
// show a "set up" state. Falls back to the onboarding grid when there's no data.

import { useEffect, useState } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT, FONT_MONO } from '@/app/cricket/[slug]/v2/_lib/theme'
import { dbList, dbInsert, dbUpdate, useCoachProfile, RACKET_STAGES, SKILLS_BY_STAGE } from '../_lib/coach-db'
import { getSettings } from '../_lib/settings-store'
import { campSpans, campsBetween, campsOn, campDayLabel, CAMP_COLOUR } from '@/lib/coach/camp-dates'
import { getFlags, subscribe as subscribeFeatures } from '../_lib/feature-flags'
import { EmptyCoachDashboard } from './EmptyCoachDashboard'
import { EmptyCoachHome } from './EmptyCoachHome'
import { LiveCoachSendMessage } from './LiveCoachSendMessage'
import { PayModal } from './LivePayments'
import { avatarSrc } from '@/lib/avatar'

type Common = { T: ThemeTokens; accent: AccentTokens; density: Density }

const fmtDate = (d?: string) => { if (!d) return ''; try { return new Date(d).toLocaleDateString('en-GB') } catch { return d } }
// WMO weather code → short label (Open-Meteo current weather).
const wmo = (c: number): string => c === 0 ? 'clear' : c <= 3 ? 'cloudy' : c <= 48 ? 'fog' : c <= 67 ? 'rain' : c <= 77 ? 'snow' : c <= 82 ? 'showers' : c <= 86 ? 'snow' : 'storms'

export function LiveCoachDashboard({ T, accent, density, clubName, onNavigate, onStartWizard, asCoach }: Common & { clubName: string; onNavigate: (id: string) => void; onStartWizard?: () => void; asCoach?: { name: string; profileDone: boolean; staffId?: string | null } | null }) {
  const profile = useCoachProfile()
  const [d, setD] = useState<{ players: any[]; bookings: any[]; lessons: any[]; payments: any[]; attendance: any[]; skills: any[]; messages: any[]; equipment: any[]; staff: any[]; venues: any[]; camps: any[]; campAttendees: any[]; loading: boolean }>({ players: [], bookings: [], lessons: [], payments: [], attendance: [], skills: [], messages: [], equipment: [], staff: [], venues: [], camps: [], campAttendees: [], loading: true })
  const [weather, setWeather] = useState<{ temp: number; desc: string; wind: number } | null>(null)
  const [booking, setBooking] = useState(false)
  const [composer, setComposer] = useState<{ recipient?: string; body?: string } | null>(null)
  const [inboxOpen, setInboxOpen] = useState<string | null>(null)
  // "Take a payment" opens the Stripe checkout QR modal (same as the Payments page).
  const [pay, setPay] = useState<{ amount?: number; description?: string; player_name?: string; payment_id?: string } | null>(null)
  const [payConnected, setPayConnected] = useState<boolean | null>(null)
  // Which modules are live. The briefing has to KNOW this: a signal about
  // rackets is noise at an academy without the reward system, and switching the
  // module on has to change what Lumio Coach talks about without waiting for the
  // three-hour cache to lapse.
  const [feat, setFeat] = useState(() => getFlags('prolite'))
  useEffect(() => { const r = () => setFeat(getFlags('prolite')); r(); return subscribeFeatures(r) }, [])
  useEffect(() => { fetch('/api/coach/pay/status').then(r => r.json()).then(d => setPayConnected(!!d.chargesEnabled)).catch(() => setPayConnected(false)) }, [])
  const reloadBookings = async () => { const bookings = await dbList('coach_bookings'); setD(v => ({ ...v, bookings })) }
  const reloadMessages = async () => { const messages = await dbList('coach_messages'); setD(v => ({ ...v, messages })) }
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

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [players, bookings, lessons, payments, attendance, skills, messages, equipment, staff, venues, camps, campAttendees] = await Promise.all([
        dbList('coach_players'), dbList('coach_bookings'), dbList('coach_sessions'), dbList('coach_payments'), dbList('coach_attendance'), dbList('coach_player_skills'), dbList('coach_messages'), dbList('coach_equipment'), dbList('coach_staff'), dbList('coach_venues'), dbList('coach_camps'), dbList('coach_camp_attendees'),
      ])
      if (cancelled) return
      setD({ players, bookings, lessons, payments, attendance, skills, messages, equipment, staff, venues, camps, campAttendees, loading: false })
    })()
    return () => { cancelled = true }
  }, [])

  // Inbound replies arrive via webhook; refresh the inbox every ~2 min so they show.
  useEffect(() => {
    const id = setInterval(() => reloadMessages(), 120000); return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (d.loading) return <div style={{ fontFamily: FONT, color: T.text3, fontSize: 13, padding: '60px 0', textAlign: 'center' }}>Loading your portal…</div>

  const total = d.players.length + d.bookings.length + d.lessons.length + d.payments.length
  // An assistant coach gets a different empty state: the head coach's setup grid
  // is a list of things they cannot do.
  if (total === 0 && asCoach) return <EmptyCoachHome T={T} accent={accent} coachName={asCoach.name} clubName={clubName} onNavigate={onNavigate} profileDone={asCoach.profileDone} />
  if (total === 0) return <EmptyCoachDashboard T={T} accent={accent} density={density} clubName={clubName} onNavigate={onNavigate} onStartWizard={onStartWizard} />

  const today = new Date().toLocaleDateString('en-CA') // local YYYY-MM-DD
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
  const dk = (x?: string | null) => String(x ?? '').slice(0, 10) // tolerate timestamp-format dates
  const active = (b: any) => b.status !== 'cancelled'
  const todays = d.bookings.filter(b => dk(b.booking_date) === today && active(b)).sort((a, b) => String(a.start_time ?? '').localeCompare(String(b.start_time ?? '')))
  const upcoming = d.bookings.filter(b => dk(b.booking_date) >= today && active(b)).sort((a, b) => (dk(a.booking_date) + (a.start_time ?? '')).localeCompare(dk(b.booking_date) + (b.start_time ?? '')))
  const next = upcoming[0]
  // "This week" stat card = bookings in the next 7 days.
  const weekAhead = new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-CA')
  const thisWeek = upcoming.filter(b => dk(b.booking_date) <= weekAhead)
  // Highlight the next not-yet-started session in the Today timeline (demo style).
  const nowHM = new Date().toTimeString().slice(0, 5)
  const todayHighlightId = (todays.find(b => (b.start_time || '') >= nowHM) || todays[0])?.id
  const due = d.payments.filter(p => !p.paid && (Number(p.amount) || 0) > 0)
  const dueTotal = due.reduce((s, p) => s + (Number(p.amount) || 0), 0)

  // Skill map per player → rackets ready to advance (all stage skills consistent).
  const skillFor = (pid: string) => Object.fromEntries(d.skills.filter(s => s.player_id === pid).map(s => [s.skill, s.score]))
  const awardThreshold = getSettings().awardThreshold  // 3 = Consistent, 4 = Mastered
  const racketsReady = d.players.filter(p => {
    const st = RACKET_STAGES.findIndex(s => s.id === p.racket_stage)
    if (st < 0) return false
    const list = SKILLS_BY_STAGE[RACKET_STAGES[st].id] || []
    if (!list.length) return false
    const m: any = skillFor(p.id)
    return list.every(s => (m[s] || 0) >= awardThreshold)
  })
  // Needs attention: low attendance or no upcoming booking.
  const attPct = (pid: string) => { const r = d.attendance.filter(a => a.player_id === pid); return r.length ? Math.round(r.filter(a => a.present).length / r.length * 100) : null }
  const hasUpcoming = (name: string) => upcoming.some(b => (b.player_name || '').toLowerCase() === (name || '').toLowerCase())
  const needs = d.players.map(p => {
    const a = attPct(p.id)
    if (a !== null && a < 80) return { p, reason: `Attendance ${a}%` }
    if (!hasUpcoming(p.name)) return { p, reason: 'No upcoming session' }
    return null
  }).filter(Boolean).slice(0, 5) as { p: any; reason: string }[]

  // Live inbox — the 5 most recent messages (mirrors the Messages section).
  const inbox = d.messages.filter(m => !m.dismissed).sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? ''))).slice(0, 5)
  // Tag a contact by matching their name against the roster / staff / venues.
  const tagFor = (raw?: string | null): string => {
    const n = (raw || '').split(',')[0].trim().toLowerCase()
    if (!n) return 'Contact'
    if (d.venues.some((v: any) => (v.name || '').trim().toLowerCase() === n)) return 'Venue'
    if (d.staff.some((s: any) => (s.name || '').trim().toLowerCase() === n)) return 'Coach'
    if (d.players.some((p: any) => (p.name || '').trim().toLowerCase() === n)) return 'Player'
    return 'Parent'
  }
  const REACTIONS = ['👍', '❤️', '😄', '✅']

  // Players with NOTHING in the diary. The earliest churn signal a coach gets —
  // a player drifts weeks before they say anything — and the number is itself
  // the call list. Replaces "Rackets due", which meant nothing to an academy
  // without the reward module and so was blank for most of them.
  const unbooked = d.players.filter(p => !hasUpcoming(p.name))
  const daysBetween = (a: string, b: string) => Math.max(0, Math.round((new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime()) / 86400000))
  const campAttendeeCount = (campId: string) => (d.campAttendees || []).filter((a: any) => a.camp_id === campId && (a.status || 'confirmed') !== 'cancelled').length

  // Camps belong in Upcoming too. A camp IS the coach's week; leaving it out
  // made the emptiest-looking week the busiest one they have.
  const campList = campSpans(d.camps || [])
  const upcomingCamps = campsBetween(campList, today, weekAhead)
  const todayCamps = campsOn(campList, today)

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
  const myStaffId = asCoach?.staffId || null
  const mine = <R extends { staff_id?: string | null }>(rows: R[]) => myStaffId ? rows.filter(r => r.staff_id === myStaffId) : rows
  const myPlayers = mine(d.players)
  const myTodays = mine(todays)
  const myNext = mine(upcoming)[0]
  const myLessonsThisWeek = mine(d.lessons).filter(l => dk(l.session_date) >= weekAgo).length
  const myReady = mine(racketsReady)

  const lowAtt = myPlayers.map(p => ({ p, a: attPct(p.id) })).filter(x => x.a !== null && (x.a as number) < 80).sort((a, b) => (a.a as number) - (b.a as number))
  // Rackets, Retention, Schedule and Progress always appear (with live data +
  // zero-states) so the briefing reads the same on a fresh account as a busy
  // one; Payments joins them only for the person who can act on it.
  const briefing: { tag: string; pri: 'high' | 'med' | 'low'; text: string }[] = []
  if (!myStaffId) briefing.push({ tag: 'payments', pri: dueTotal > 0 ? 'high' : 'low', text: dueTotal > 0 ? `${due.length} player${due.length > 1 ? 's have' : ' has'} an outstanding balance — £${dueTotal.toLocaleString()} to collect.` : 'No outstanding balances — payments are up to date.' })
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
  briefing.push({ tag: 'retention', pri: lowAtt.length ? 'high' : 'low', text: lowAtt.length ? `${lowAtt[0].p.name} is at ${lowAtt[0].a}% attendance — worth a check-in with the family.` : 'Attendance is healthy across your players.' })
  briefing.push({ tag: 'schedule', pri: myTodays.length ? 'med' : 'low', text: myTodays.length ? `${myTodays.length} session${myTodays.length > 1 ? 's' : ''} today${myTodays[0]?.start_time ? ` from ${myTodays[0].start_time}` : ''}.${myNext && dk(myNext.booking_date) > today ? ` Next after today: ${fmtDate(myNext.booking_date)} ${myNext.start_time || ''}.` : ''}` : (myNext ? `No sessions today — next is ${fmtDate(myNext.booking_date)} ${myNext.start_time || ''}.` : 'No upcoming sessions booked — add bookings in the calendar.') })
  briefing.push({ tag: 'progress', pri: 'low', text: myLessonsThisWeek ? `${myLessonsThisWeek} lesson summar${myLessonsThisWeek > 1 ? 'ies' : 'y'} logged this week — keep sharing the wins with players.` : 'No lesson summaries yet this week — log one after your next session.' })

  // Extra row cards. Upcoming = the next 7 days EXCLUDING today (today already
  // has its own timeline in the hero), so this isn't duplicate content.
  const nextSessions = upcoming.filter(b => dk(b.booking_date) > today && dk(b.booking_date) <= weekAhead).slice(0, 5)
  const recentSummaries = [...d.lessons].sort((a, b) => dk(b.session_date).localeCompare(dk(a.session_date))).slice(0, 3)
  const kitAttention = d.equipment.filter(i => i.status === 'low' || i.status === 'order' || i.status === 'repair')

  // Open a specific player's card on the roster (deep link).
  const openPlayer = (p: any) => { try { sessionStorage.setItem('lumio_open_player', p.id) } catch { /* ignore */ } onNavigate('roster') }

  const hour = new Date().getHours()
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
  const card: React.CSSProperties = { background: T.panel, border: `1px solid ${T.border}`, borderRadius: density.radius, padding: density.pad }
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
            <div style={{ fontSize: 12, color: T.text3 }}>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
            {weather && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.text2, flexWrap: 'wrap' }}>
                <span>🌤️ {weather.temp}° · {weather.desc} · {weather.wind} km/h</span>
                <span style={{ fontSize: 10.5, color: T.text3 }}>{/rain|snow|storm|shower/.test(weather.desc) ? 'Check court conditions' : 'Outdoor courts playable'}</span>
              </div>
            )}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{greeting}{greetName ? `, ${greetName}` : ''} · {clubName}</div>
          <h1 style={{ margin: '10px 0 0', fontSize: 24, fontWeight: 800, color: T.text }}>{todays.length} session{todays.length === 1 ? '' : 's'} today{racketsReady.length ? `, ${racketsReady.length} racket assessment${racketsReady.length === 1 ? '' : 's'} due` : ''}</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            <button onClick={() => setBooking(true)} style={btn(accent, T)}>+ Add booking</button>
            <button onClick={() => setPay({})} style={btnGhost(T)}>Take a payment</button>
            <button onClick={() => onNavigate('lessons')} style={btnGhost(T)}>Lesson Summaries</button>
            <button onClick={() => onNavigate('calendar')} style={btnGhost(T)}>Open calendar</button>
            <button onClick={() => setComposer({})} style={btnGhost(T)}>Send message</button>
          </div>
        </div>
        <div style={{ ...card, display: showSec('today') ? undefined : 'none' }}>
          <p style={sectionTitle}>Today</p>
          <div style={{ position: 'relative' }}>
            {todays.length > 0 && <div style={{ position: 'absolute', left: 49, top: 6, bottom: 6, width: 1, background: T.border }} />}
            {todays.length === 0 ? (
              <p style={{ color: T.text3, fontSize: 13, margin: 0 }}>No sessions today. <button onClick={() => onNavigate('calendar')} style={linkBtn(accent)}>Add a booking →</button></p>
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

      {/* Stat cards */}
      <div className="cm-md" style={{ display: showSec('stats') ? 'grid' : 'none', gridTemplateColumns: 'repeat(5, 1fr)', gap: density.gap }}>
        {[
          { l: 'This week', v: thisWeek.length, nav: 'calendar' },
          { l: 'Next session', v: next ? `${fmtDate(next.booking_date)}${next.start_time ? ' ' + next.start_time : ''}` : '—', nav: 'calendar', small: true },
          { l: 'Players', v: d.players.length, nav: 'roster' },
          { l: 'Nothing booked', v: unbooked.length, nav: 'roster' },
          { l: 'Payments due', v: `£${dueTotal.toLocaleString()}`, nav: 'payments' },
        ].map(s => (
          <button key={s.l} onClick={() => onNavigate(s.nav)} style={{ ...card, textAlign: 'left', cursor: 'pointer', appearance: 'none' }}>
            <div style={{ fontSize: 11.5, color: T.text3 }}>{s.l}</div>
            <div style={{ fontSize: s.small ? 15 : 24, fontWeight: 800, color: T.text, marginTop: 4 }}>{s.v}</div>
          </button>
        ))}
      </div>

      {/* Inbox / Coach AI briefing / Needs attention */}
      <div className="cm-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: density.gap }}>
        {/* Inbox — live, last 5 messages, synced with the Messages section */}
        <div style={{ ...card, display: showSec('inbox') ? undefined : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 12 }}>
            <p style={{ ...sectionTitle, margin: 0 }}>Inbox</p>
            <button onClick={() => onNavigate('messages')} style={{ ...linkBtn(accent), marginLeft: 'auto', fontSize: 11 }}>All →</button>
          </div>
          {inbox.length === 0 ? (
            <p style={{ fontSize: 12.5, color: T.text3, margin: 0 }}>No messages yet. <button onClick={() => setComposer({})} style={linkBtn(accent)}>Send one →</button></p>
          ) : inbox.map(m => {
            const open = inboxOpen === m.id
            const unread = !m.read
            const who = (m.recipients || 'Message').split(',')[0].trim()
            const tag = tagFor(m.recipients)
            const tagColour = tag === 'Venue' ? '#3A8EE0' : tag === 'Coach' ? accent.hex : tag === 'Player' ? T.good : T.text3
            const toggleReact = (e: React.MouseEvent, r: string) => { e.stopPropagation(); const next = m.reaction === r ? null : r; dbUpdate('coach_messages', m.id, { reaction: next }).then(() => patchMsg(m.id, { reaction: next })).catch(() => {}) }
            return (
              <div key={m.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                <div onClick={() => { const nowOpen = !open; setInboxOpen(nowOpen ? m.id : null); if (nowOpen && unread) dbUpdate('coach_messages', m.id, { read: true }).then(() => patchMsg(m.id, { read: true })).catch(() => {}) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', cursor: 'pointer' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: unread ? accent.hex : T.border }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, color: T.text, fontWeight: unread ? 700 : 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.direction === 'in' ? '↩ ' : ''}{who}</span>
                      <span style={{ fontSize: 8.5, fontWeight: 700, color: tagColour, background: `${tagColour}22`, padding: '1px 6px', borderRadius: 4, textTransform: 'uppercase', flexShrink: 0 }}>{tag}</span>
                      {m.reaction && <span style={{ fontSize: 11 }}>{m.reaction}</span>}
                      <span style={{ marginLeft: 'auto', fontSize: 10, color: T.text3, flexShrink: 0 }}>{m.created_at ? new Date(m.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : ''}</span>
                    </div>
                    <div style={{ fontSize: 11, color: T.text3, whiteSpace: open ? 'normal' : 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>{m.subject ? `${m.subject} — ` : ''}{m.body}</div>
                  </div>
                </div>
                {open && (
                  <div style={{ padding: '0 0 10px' }}>
                    <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
                      {REACTIONS.map(r => <button key={r} onClick={e => toggleReact(e, r)} style={{ appearance: 'none', cursor: 'pointer', border: m.reaction === r ? `1px solid ${accent.hex}` : '1px solid transparent', background: m.reaction === r ? accent.dim : 'transparent', borderRadius: 6, padding: '2px 5px', fontSize: 13, opacity: m.reaction && m.reaction !== r ? 0.4 : 1 }}>{r}</button>)}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button onClick={() => setComposer({ recipient: who, body: '' })} style={msgAct(T)}>Reply</button>
                      <button onClick={() => setComposer({ recipient: '', body: m.body })} style={msgAct(T)}>Forward</button>
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
                  : <span style={{ width: 26, height: 26, borderRadius: '50%', background: accent.dim, color: accent.hex, display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{(p.name || '?').split(' ').map((w: string) => w[0]).slice(0, 2).join('')}</span>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: T.text, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                  <div style={{ fontSize: 10.5, color: T.text3 }}>{reason}</div>
                </div>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: T.warn, flexShrink: 0 }} />
              </button>
            ))}
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
            <button onClick={() => onNavigate('calendar')} style={{ ...linkBtn(accent), marginLeft: 'auto', fontSize: 11 }}>Calendar →</button>
          </div>
          {upcomingCamps.map(c => (
            <button key={c.id} onClick={() => { try { sessionStorage.setItem('lumio_open_camp', c.id) } catch { /* ignore */ } onNavigate('camps') }}
              style={{ display: 'flex', gap: 10, alignItems: 'center', width: '100%', textAlign: 'left', appearance: 'none', background: `${CAMP_COLOUR}14`, border: `1px solid ${CAMP_COLOUR}44`, borderRadius: 8, padding: '8px 10px', cursor: 'pointer', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: CAMP_COLOUR, fontWeight: 700, width: 92, flexShrink: 0 }}>{fmtDate(c.start)}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 12.5, color: T.text, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                <span style={{ display: 'block', fontSize: 10.5, color: T.text3 }}>{c.days > 1 ? `${c.days} days` : 'One day'}{c.where ? ` · ${c.where}` : ''}</span>
              </span>
              <span style={{ fontSize: 9, fontWeight: 700, color: CAMP_COLOUR, textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>Camp</span>
            </button>
          ))}
          {nextSessions.length === 0 && upcomingCamps.length === 0
            ? <p style={{ fontSize: 12.5, color: T.text3, margin: 0 }}>Nothing booked in the next 7 days. <button onClick={() => onNavigate('calendar')} style={linkBtn(accent)}>Open calendar →</button></p>
            : nextSessions.map(b => {
            // The player's name, not just the title. "1:1" on four lines tells a
            // coach nothing about who is turning up.
            const who = (b.player_name || '').trim()
            const t = (b.title || '').trim()
            return (
            <button key={b.id} onClick={() => onNavigate('calendar')} style={{ display: 'flex', gap: 10, width: '100%', textAlign: 'left', appearance: 'none', background: 'transparent', border: 'none', borderBottom: `1px solid ${T.border}`, padding: '8px 0', cursor: 'pointer' }}>
              <span style={{ fontSize: 11, color: accent.hex, fontWeight: 600, width: 96, flexShrink: 0 }}>{fmtDate(b.booking_date)}{b.start_time ? ` ${b.start_time}` : ''}</span>
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
            <button onClick={() => onNavigate('lessons')} style={{ ...linkBtn(accent), marginLeft: 'auto', fontSize: 11 }}>All →</button>
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
            <p style={{ ...sectionTitle, margin: 0 }}>Kit needing attention</p>
            <button onClick={() => onNavigate('equipment')} style={{ ...linkBtn(accent), marginLeft: 'auto', fontSize: 11 }}>Equipment →</button>
          </div>
          {kitAttention.length === 0 ? <p style={{ fontSize: 12.5, color: T.text3, margin: 0 }}>All stocked up. ✅</p> : kitAttention.slice(0, 5).map(i => (
            <button key={i.id} onClick={() => onNavigate('equipment')} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', appearance: 'none', background: 'transparent', border: 'none', borderBottom: `1px solid ${T.border}`, padding: '8px 0', cursor: 'pointer' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: i.status === 'repair' ? T.bad : i.status === 'order' ? '#3A8EE0' : T.warn, flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, color: T.text, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{i.item}</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: T.text3, textTransform: 'uppercase' }}>{i.status === 'order' ? 'To order' : i.status === 'repair' ? 'Repair' : 'Low'}</span>
            </button>
          ))}
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
  const today = new Date().toLocaleDateString('en-CA')
  const [v, setV] = useState<Record<string, any>>({ player_name: '', booking_date: today, start_time: '', court: '', type: 'Private', duration_min: 60 })
  const [saving, setSaving] = useState(false)
  const set = (k: string, val: any) => setV(p => ({ ...p, [k]: val }))
  const field: React.CSSProperties = { width: '100%', background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 9, padding: '9px 11px', fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }
  const lab: React.CSSProperties = { display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: T.text3, margin: '0 0 5px' }
  const save = async () => {
    if (!v.booking_date || saving) return
    setSaving(true)
    try {
      // Record WHICH player, not just the typed name — the confirmation email
      // resolves the family by id first, and a name that does not match a
      // roster row exactly means nobody is written to at all.
      const picked = players.find((p: any) => (p.name || '') === v.player_name) || null
      await dbInsert('coach_bookings', { player_name: v.player_name || null, player_id: picked?.id ?? null, booking_date: v.booking_date, start_time: v.start_time || null, court: v.court || null, type: v.type, status: 'confirmed', duration_min: Number(v.duration_min) || 60 })
      onSaved()
    } catch { setSaving(false) }
  }
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, fontFamily: FONT, padding: '6vh 16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 440, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 14 }}>Add a booking</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><label style={lab}>Player</label>
            <select value={v.player_name} onChange={e => set('player_name', e.target.value)} style={{ ...field, cursor: 'pointer' }}>
              <option value="">— Select player (optional) —</option>
              {players.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={lab}>Date</label><input type="date" value={v.booking_date} onChange={e => set('booking_date', e.target.value)} style={field} /></div>
            <div><label style={lab}>Start time</label><input type="time" value={v.start_time} onChange={e => set('start_time', e.target.value)} style={field} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={lab}>Type</label><select value={v.type} onChange={e => set('type', e.target.value)} style={{ ...field, cursor: 'pointer' }}>{['Private', 'Group', 'Cardio', 'Match play', 'Mini / red ball'].map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label style={lab}>Court</label><input value={v.court} onChange={e => set('court', e.target.value)} placeholder="e.g. Court 1" style={field} /></div>
          </div>
          <div><label style={lab}>Duration (mins)</label><input type="number" value={v.duration_min} onChange={e => set('duration_min', e.target.value)} style={field} /></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18 }}>
          <button onClick={onClose} style={{ marginLeft: 'auto', appearance: 'none', padding: '8px 14px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
          <button onClick={save} disabled={!v.booking_date || saving} style={{ appearance: 'none', border: 0, padding: '8px 16px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: !v.booking_date || saving ? 0.5 : 1, fontFamily: FONT }}>{saving ? 'Saving…' : 'Add booking'}</button>
        </div>
      </div>
    </div>
  )
}

function btn(accent: AccentTokens, T: ThemeTokens): React.CSSProperties { return { appearance: 'none', border: 0, cursor: 'pointer', padding: '8px 14px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 12.5, fontWeight: 700 } }
function btnGhost(T: ThemeTokens): React.CSSProperties { return { appearance: 'none', cursor: 'pointer', padding: '8px 14px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 12.5, fontWeight: 600 } }
function linkBtn(accent: AccentTokens): React.CSSProperties { return { appearance: 'none', background: 'transparent', border: 0, color: accent.hex, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', padding: 0 } }

// ── Coach AI briefing ────────────────────────────────────────────────────────
// A child component ON PURPOSE. Its hooks used to live in LiveCoachDashboard,
// below two early returns (`if (d.loading)` and `if (total === 0)`), so the first
// render registered fewer hooks than the second and React threw #310 — the whole
// dashboard failed to load. Hooks in a child mount and unmount with the child,
// so an early return in the parent can never desynchronise them.
//
// Written once every three hours and kept in localStorage until then. A coach
// opens this dashboard a dozen times a day; before, every mount either re-read a
// per-day cache that had gone stale by lunchtime or spent another agent call
// saying the same thing. Three hours is roughly the rhythm of a coaching day —
// morning block, afternoon block, evening block — so the briefing is fresh when
// they come off court without being rewritten because they changed tab.
//
// The cache is keyed by WHO is reading. A head coach and their assistant share a
// browser at the desk more often than not, and a briefing about the academy's
// unpaid balances is not the assistant's briefing.
const BRIEF_WINDOW_MS = 3 * 60 * 60 * 1000
const briefBucket = () => Math.floor(Date.now() / BRIEF_WINDOW_MS)

type BriefItem = { tag: string; pri: 'high' | 'med' | 'low'; text: string }
type BriefCache = { bucket: number; hash: number; at: string; items?: BriefItem[]; prose?: string }

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
  // desk all day rewrites itself at the next three-hour mark instead of showing
  // this morning's briefing at six in the evening.
  const [tick, setTick] = useState(0)
  const [bucket, setBucket] = useState(briefBucket())
  const signalKey = signals.map(b => `${b.tag}:${b.text}`).join('|')
  const cacheKey = `lumio.brief.${scopeKey}`

  useEffect(() => {
    const id = setInterval(() => setBucket(briefBucket()), 5 * 60_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!signalKey) return
    let hash = 0
    for (let i = 0; i < signalKey.length; i++) { hash = (hash * 31 + signalKey.charCodeAt(i)) | 0 }

    // Reuse within the window — unless the facts themselves moved. A payment
    // landing or a player being marked absent is exactly when the briefing
    // should stop agreeing with itself.
    if (tick === 0) {
      try {
        const raw = localStorage.getItem(cacheKey)
        const c: BriefCache | null = raw ? JSON.parse(raw) : null
        if (c && c.bucket === bucket && c.hash === hash && (c.items?.length || c.prose)) {
          setItems(c.items ?? null); setProse(c.prose ?? ''); setAt(c.at || ''); setState('idle')
          return
        }
      } catch { /* private mode or corrupt entry — just fetch */ }
    }

    let cancelled = false
    setState('loading')
    fetch('/api/coach/briefing', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signals: signals.map(b => ({ tag: b.tag, fact: b.text })), todayCount, role }),
    })
      .then(r => r.json().then(d => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (cancelled) return
        const got: BriefItem[] | null = Array.isArray(d?.items) && d.items.length ? d.items : null
        if (!ok || (!got && !d?.briefing)) { setState('failed'); return }
        const stamp = String(d.at || new Date().toISOString())
        setItems(got); setProse(got ? '' : String(d.briefing || '')); setAt(stamp); setState('idle')
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            bucket, hash, at: stamp, items: got ?? undefined, prose: got ? undefined : String(d.briefing || ''),
          } satisfies BriefCache))
        } catch { /* nothing to do */ }
      })
      .catch(() => { if (!cancelled) setState('failed') })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signalKey, bucket, tick, cacheKey, role])

  const refresh = () => {
    try { localStorage.removeItem(cacheKey) } catch { /* nothing to do */ }
    setTick(v => v + 1)
  }

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

      {state === 'failed' && !items && !prose && (
        <div style={{ fontSize: 11, color: T.text3, marginTop: 8, lineHeight: 1.5 }}>
          These are your numbers — Lumio Coach couldn&rsquo;t write the briefing just now, so nothing here has been prioritised for you.
        </div>
      )}
    </>
  )
}
