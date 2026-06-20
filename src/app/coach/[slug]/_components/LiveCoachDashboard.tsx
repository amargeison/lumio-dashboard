'use client'

// Live coach dashboard — mirrors the demo dashboard (greeting hero, Today
// schedule, stat cards, Inbox / summary / Needs attention) wired to the coach's
// own data. Panels that depend on un-configured connections (email/calendar)
// show a "set up" state. Falls back to the onboarding grid when there's no data.

import { useEffect, useState } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { dbList, useCoachProfile, RACKET_STAGES, SKILLS_BY_STAGE } from '../_lib/coach-db'
import { EmptyCoachDashboard } from './EmptyCoachDashboard'

type Common = { T: ThemeTokens; accent: AccentTokens; density: Density }

const fmtDate = (d?: string) => { if (!d) return ''; try { return new Date(d).toLocaleDateString('en-GB') } catch { return d } }

export function LiveCoachDashboard({ T, accent, density, clubName, onNavigate, onStartWizard }: Common & { clubName: string; onNavigate: (id: string) => void; onStartWizard?: () => void }) {
  const profile = useCoachProfile()
  const [d, setD] = useState<{ players: any[]; bookings: any[]; lessons: any[]; payments: any[]; attendance: any[]; skills: any[]; loading: boolean }>({ players: [], bookings: [], lessons: [], payments: [], attendance: [], skills: [], loading: true })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [players, bookings, lessons, payments, attendance, skills] = await Promise.all([
        dbList('coach_players'), dbList('coach_bookings'), dbList('coach_sessions'), dbList('coach_payments'), dbList('coach_attendance'), dbList('coach_player_skills'),
      ])
      if (cancelled) return
      setD({ players, bookings, lessons, payments, attendance, skills, loading: false })
    })()
    return () => { cancelled = true }
  }, [])

  if (d.loading) return <div style={{ fontFamily: FONT, color: T.text3, fontSize: 13, padding: '60px 0', textAlign: 'center' }}>Loading your portal…</div>

  const total = d.players.length + d.bookings.length + d.lessons.length + d.payments.length
  if (total === 0) return <EmptyCoachDashboard T={T} accent={accent} density={density} clubName={clubName} onNavigate={onNavigate} onStartWizard={onStartWizard} />

  const today = new Date().toISOString().slice(0, 10)
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
  const todays = d.bookings.filter(b => b.booking_date === today).sort((a, b) => String(a.start_time ?? '').localeCompare(String(b.start_time ?? '')))
  const upcoming = d.bookings.filter(b => (b.booking_date ?? '') >= today).sort((a, b) => (String(a.booking_date) + (a.start_time ?? '')).localeCompare(String(b.booking_date) + (b.start_time ?? '')))
  const next = upcoming[0]
  const lessonsThisWeek = d.lessons.filter(l => (l.session_date ?? '') >= weekAgo).length
  const due = d.payments.filter(p => p.status === 'due' || p.status === 'overdue')
  const dueTotal = due.reduce((s, p) => s + (Number(p.amount) || 0), 0)

  // Skill map per player → rackets ready to advance (all stage skills consistent).
  const skillFor = (pid: string) => Object.fromEntries(d.skills.filter(s => s.player_id === pid).map(s => [s.skill, s.score]))
  const racketsReady = d.players.filter(p => {
    const st = RACKET_STAGES.findIndex(s => s.id === p.racket_stage)
    if (st < 0) return false
    const list = SKILLS_BY_STAGE[RACKET_STAGES[st].id] || []
    if (!list.length) return false
    const m: any = skillFor(p.id)
    return list.every(s => (m[s] || 0) >= 4)
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

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const firstName = (profile.display_name || '').split(' ')[0] || clubName
  const card: React.CSSProperties = { background: T.panel, border: `1px solid ${T.border}`, borderRadius: density.radius, padding: density.pad }
  const sectionTitle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }

  return (
    <div style={{ fontFamily: FONT, display: 'flex', flexDirection: 'column', gap: density.gap }}>
      {/* Hero + Today */}
      <div className="cm-2" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: density.gap }}>
        <div style={{ ...card, position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${accent.dim}, ${T.panel})` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{greeting}, {firstName} · {clubName}</div>
          <div style={{ fontSize: 12, color: T.text3, marginTop: 2 }}>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          <h1 style={{ margin: '10px 0 0', fontSize: 24, fontWeight: 800, color: T.text }}>{todays.length} session{todays.length === 1 ? '' : 's'} today{racketsReady.length ? `, ${racketsReady.length} racket assessment${racketsReady.length === 1 ? '' : 's'} due` : ''}</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            <button onClick={() => onNavigate('lessons')} style={btn(accent, T)}>Lesson Summaries</button>
            <button onClick={() => onNavigate('calendar')} style={btnGhost(T)}>Open calendar</button>
            <button onClick={() => onNavigate('messages')} style={btnGhost(T)}>Send message</button>
          </div>
        </div>
        <div style={card}>
          <p style={sectionTitle}>Today</p>
          {todays.length === 0 ? (
            <p style={{ color: T.text3, fontSize: 13, margin: 0 }}>No sessions today. <button onClick={() => onNavigate('calendar')} style={linkBtn(accent)}>Add a booking →</button></p>
          ) : todays.map(b => (
            <div key={b.id} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 12, color: accent.hex, fontWeight: 600, width: 52, flexShrink: 0 }}>{b.start_time || '—'}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, color: T.text, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title || b.player_name || 'Session'}</div>
                <div style={{ fontSize: 11, color: T.text3 }}>{[b.court, b.player_name].filter(Boolean).join(' · ')}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="cm-md" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: density.gap }}>
        {[
          { l: 'Sessions today', v: todays.length, nav: 'calendar' },
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

      {/* Inbox / Summary / Needs attention */}
      <div className="cm-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: density.gap }}>
        {/* Inbox — set-up state until email/calendar connected */}
        <div style={card}>
          <p style={sectionTitle}>Inbox</p>
          {!profile.contact_email ? (
            <div style={{ textAlign: 'center', padding: '14px 0' }}>
              <p style={{ fontSize: 12.5, color: T.text3, lineHeight: 1.5, margin: '0 0 12px' }}>Connect your email to receive and reply to messages from parents and players here.</p>
              <button onClick={() => onNavigate('settings')} style={btn(accent, T)}>Set up email →</button>
            </div>
          ) : (
            <p style={{ fontSize: 12.5, color: T.text3, margin: 0 }}>No new messages. <button onClick={() => onNavigate('messages')} style={linkBtn(accent)}>Send one →</button></p>
          )}
        </div>

        {/* Today's summary (derived from live data) */}
        <div style={card}>
          <p style={sectionTitle}>Today&apos;s summary</p>
          {[
            ['Sessions today', `${todays.length}`],
            ['Lessons this week', `${lessonsThisWeek}`],
            ['Rackets ready to advance', `${racketsReady.length}`],
            ['Outstanding payments', `£${dueTotal.toLocaleString()}`],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '4px 0' }}>
              <span style={{ color: T.text3 }}>{k}</span><span style={{ color: T.text, fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Needs attention */}
        <div style={card}>
          <p style={sectionTitle}>Needs attention</p>
          {needs.length === 0 ? (
            <p style={{ fontSize: 12.5, color: T.text3, margin: 0 }}>Everyone&apos;s on track. 🎾</p>
          ) : needs.map(({ p, reason }) => (
            <button key={p.id} onClick={() => onNavigate('roster')} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', appearance: 'none', background: 'transparent', border: 'none', borderBottom: `1px solid ${T.border}`, padding: '8px 0', cursor: 'pointer' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: T.warn, flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, color: T.text, fontWeight: 600 }}>{p.name}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: T.text3 }}>{reason}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function btn(accent: AccentTokens, T: ThemeTokens): React.CSSProperties { return { appearance: 'none', border: 0, cursor: 'pointer', padding: '8px 14px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 12.5, fontWeight: 700 } }
function btnGhost(T: ThemeTokens): React.CSSProperties { return { appearance: 'none', cursor: 'pointer', padding: '8px 14px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 12.5, fontWeight: 600 } }
function linkBtn(accent: AccentTokens): React.CSSProperties { return { appearance: 'none', background: 'transparent', border: 0, color: accent.hex, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', padding: 0 } }
