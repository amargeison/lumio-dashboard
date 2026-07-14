'use client'

// Live coach dashboard — mirrors the demo dashboard (greeting hero, Today
// schedule, stat cards, Inbox / summary / Needs attention) wired to the coach's
// own data. Panels that depend on un-configured connections (email/calendar)
// show a "set up" state. Falls back to the onboarding grid when there's no data.

import { useEffect, useState } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { dbList, dbInsert, dbUpdate, useCoachProfile, RACKET_STAGES, SKILLS_BY_STAGE } from '../_lib/coach-db'
import { getSettings } from '../_lib/settings-store'
import { EmptyCoachDashboard } from './EmptyCoachDashboard'
import { LiveCoachSendMessage } from './LiveCoachSendMessage'
import { PayModal } from './LivePayments'
import { avatarSrc } from '@/lib/avatar'

type Common = { T: ThemeTokens; accent: AccentTokens; density: Density }

const fmtDate = (d?: string) => { if (!d) return ''; try { return new Date(d).toLocaleDateString('en-GB') } catch { return d } }
// WMO weather code → short label (Open-Meteo current weather).
const wmo = (c: number): string => c === 0 ? 'clear' : c <= 3 ? 'cloudy' : c <= 48 ? 'fog' : c <= 67 ? 'rain' : c <= 77 ? 'snow' : c <= 82 ? 'showers' : c <= 86 ? 'snow' : 'storms'

export function LiveCoachDashboard({ T, accent, density, clubName, onNavigate, onStartWizard }: Common & { clubName: string; onNavigate: (id: string) => void; onStartWizard?: () => void }) {
  const profile = useCoachProfile()
  const [d, setD] = useState<{ players: any[]; bookings: any[]; lessons: any[]; payments: any[]; attendance: any[]; skills: any[]; messages: any[]; equipment: any[]; staff: any[]; venues: any[]; loading: boolean }>({ players: [], bookings: [], lessons: [], payments: [], attendance: [], skills: [], messages: [], equipment: [], staff: [], venues: [], loading: true })
  const [weather, setWeather] = useState<{ temp: number; desc: string; wind: number } | null>(null)
  const [booking, setBooking] = useState(false)
  const [composer, setComposer] = useState<{ recipient?: string; body?: string } | null>(null)
  const [inboxOpen, setInboxOpen] = useState<string | null>(null)
  // "Take a payment" opens the Stripe checkout QR modal (same as the Payments page).
  const [pay, setPay] = useState<{ amount?: number; description?: string; player_name?: string; payment_id?: string } | null>(null)
  const [payConnected, setPayConnected] = useState<boolean | null>(null)
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
      const [players, bookings, lessons, payments, attendance, skills, messages, equipment, staff, venues] = await Promise.all([
        dbList('coach_players'), dbList('coach_bookings'), dbList('coach_sessions'), dbList('coach_payments'), dbList('coach_attendance'), dbList('coach_player_skills'), dbList('coach_messages'), dbList('coach_equipment'), dbList('coach_staff'), dbList('coach_venues'),
      ])
      if (cancelled) return
      setD({ players, bookings, lessons, payments, attendance, skills, messages, equipment, staff, venues, loading: false })
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
  const lessonsThisWeek = d.lessons.filter(l => dk(l.session_date) >= weekAgo).length
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

  // Live Coach AI briefing — composed from real signals, refreshed every load.
  const lowAtt = d.players.map(p => ({ p, a: attPct(p.id) })).filter(x => x.a !== null && (x.a as number) < 80).sort((a, b) => (a.a as number) - (b.a as number))
  // Always show Payments, Rackets and Retention (with live data + zero-states) so
  // the briefing reads the same on a fresh account as a busy one.
  const briefing: { tag: string; text: string }[] = []
  briefing.push({ tag: 'Payments', text: dueTotal > 0 ? `${due.length} player${due.length > 1 ? 's have' : ' has'} an outstanding balance — £${dueTotal.toLocaleString()} to collect.` : 'No outstanding balances — payments are up to date.' })
  briefing.push({ tag: 'Rackets', text: racketsReady.length ? `${racketsReady.length} player${racketsReady.length > 1 ? 's are' : ' is'} ready to move up a racket — book ${racketsReady.length > 1 ? 'assessments' : 'an assessment'}: ${racketsReady.slice(0, 3).map(p => p.name).join(', ')}.` : 'No players ready to move up a racket yet — keep logging skill progress.' })
  briefing.push({ tag: 'Retention', text: lowAtt.length ? `${lowAtt[0].p.name} is at ${lowAtt[0].a}% attendance — worth a check-in with the family.` : 'Attendance is healthy across your players.' })
  briefing.push({ tag: 'Schedule', text: todays.length ? `${todays.length} session${todays.length > 1 ? 's' : ''} today${todays[0]?.start_time ? ` from ${todays[0].start_time}` : ''}.${next && dk(next.booking_date) > today ? ` Next after today: ${fmtDate(next.booking_date)} ${next.start_time || ''}.` : ''}` : (next ? `No sessions today — next is ${fmtDate(next.booking_date)} ${next.start_time || ''}.` : 'No upcoming sessions booked — add bookings in the calendar.') })
  briefing.push({ tag: 'Progress', text: lessonsThisWeek ? `${lessonsThisWeek} lesson summar${lessonsThisWeek > 1 ? 'ies' : 'y'} logged this week — keep sharing the wins with players.` : 'No lesson summaries yet this week — log one after your next session.' })

  // Extra row cards. Upcoming = the next 7 days EXCLUDING today (today already
  // has its own timeline in the hero), so this isn't duplicate content.
  const nextSessions = upcoming.filter(b => dk(b.booking_date) > today && dk(b.booking_date) <= weekAhead).slice(0, 5)
  const recentSummaries = [...d.lessons].sort((a, b) => dk(b.session_date).localeCompare(dk(a.session_date))).slice(0, 3)
  const kitAttention = d.equipment.filter(i => i.status === 'low' || i.status === 'order' || i.status === 'repair')

  // Open a specific player's card on the roster (deep link).
  const openPlayer = (p: any) => { try { sessionStorage.setItem('lumio_open_player', p.id) } catch { /* ignore */ } onNavigate('roster') }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const firstName = (profile.display_name || '').split(' ')[0] || clubName
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
          <div style={{ fontSize: 11, fontWeight: 700, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{greeting}, {firstName} · {clubName}</div>
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
          { l: 'Rackets due', v: racketsReady.length, nav: 'belts' },
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

        {/* Coach AI briefing — live, derived from real signals */}
        <div style={{ ...card, display: showSec('briefing') ? undefined : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
            <span style={{ color: accent.hex }}>✦</span>
            <p style={{ ...sectionTitle, margin: 0 }}>Coach AI briefing</p>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: T.text3 }}>live</span>
          </div>
          {briefing.map((b, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '7px 0', borderTop: i ? `1px solid ${T.border}` : 'none' }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.05em', width: 64, flexShrink: 0, paddingTop: 2 }}>{b.tag}</span>
              <span style={{ fontSize: 12, color: T.text2, lineHeight: 1.45 }}>{b.text}</span>
            </div>
          ))}
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
          {nextSessions.length === 0 ? <p style={{ fontSize: 12.5, color: T.text3, margin: 0 }}>Nothing booked in the next 7 days. <button onClick={() => onNavigate('calendar')} style={linkBtn(accent)}>Open calendar →</button></p> : nextSessions.map(b => (
            <button key={b.id} onClick={() => onNavigate('calendar')} style={{ display: 'flex', gap: 10, width: '100%', textAlign: 'left', appearance: 'none', background: 'transparent', border: 'none', borderBottom: `1px solid ${T.border}`, padding: '8px 0', cursor: 'pointer' }}>
              <span style={{ fontSize: 11, color: accent.hex, fontWeight: 600, width: 96, flexShrink: 0 }}>{fmtDate(b.booking_date)}{b.start_time ? ` ${b.start_time}` : ''}</span>
              <span style={{ fontSize: 12.5, color: T.text, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title || b.player_name || 'Session'}</span>
            </button>
          ))}
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
      await dbInsert('coach_bookings', { player_name: v.player_name || null, booking_date: v.booking_date, start_time: v.start_time || null, court: v.court || null, type: v.type, status: 'confirmed', duration_min: Number(v.duration_min) || 60 })
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
