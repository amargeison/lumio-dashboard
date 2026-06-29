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
  const [d, setD] = useState<{ players: any[]; bookings: any[]; lessons: any[]; payments: any[]; attendance: any[]; skills: any[]; messages: any[]; equipment: any[]; loading: boolean }>({ players: [], bookings: [], lessons: [], payments: [], attendance: [], skills: [], messages: [], equipment: [], loading: true })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [players, bookings, lessons, payments, attendance, skills, messages, equipment] = await Promise.all([
        dbList('coach_players'), dbList('coach_bookings'), dbList('coach_sessions'), dbList('coach_payments'), dbList('coach_attendance'), dbList('coach_player_skills'), dbList('coach_messages'), dbList('coach_equipment'),
      ])
      if (cancelled) return
      setD({ players, bookings, lessons, payments, attendance, skills, messages, equipment, loading: false })
    })()
    return () => { cancelled = true }
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
  const lessonsThisWeek = d.lessons.filter(l => dk(l.session_date) >= weekAgo).length
  const due = d.payments.filter(p => !p.paid && (Number(p.amount) || 0) > 0)
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

  // Live inbox — the 5 most recent messages (mirrors the Messages section).
  const inbox = [...d.messages].sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? ''))).slice(0, 5)

  // Live Coach AI briefing — composed from real signals, refreshed every load.
  const lowAtt = d.players.map(p => ({ p, a: attPct(p.id) })).filter(x => x.a !== null && (x.a as number) < 80).sort((a, b) => (a.a as number) - (b.a as number))
  const briefing: { tag: string; text: string }[] = []
  if (racketsReady.length) briefing.push({ tag: 'Rackets', text: `${racketsReady.length} player${racketsReady.length > 1 ? 's are' : ' is'} ready to move up a racket — book ${racketsReady.length > 1 ? 'assessments' : 'an assessment'}: ${racketsReady.slice(0, 3).map(p => p.name).join(', ')}.` })
  if (lowAtt.length) briefing.push({ tag: 'Retention', text: `${lowAtt[0].p.name} is at ${lowAtt[0].a}% attendance — worth a check-in with the family.` })
  briefing.push({ tag: 'Schedule', text: todays.length ? `${todays.length} session${todays.length > 1 ? 's' : ''} today${todays[0]?.start_time ? ` from ${todays[0].start_time}` : ''}.${next && dk(next.booking_date) > today ? ` Next after today: ${fmtDate(next.booking_date)} ${next.start_time || ''}.` : ''}` : (next ? `No sessions today — next is ${fmtDate(next.booking_date)} ${next.start_time || ''}.` : 'No upcoming sessions booked — add bookings in the calendar.') })
  if (dueTotal > 0) briefing.push({ tag: 'Payments', text: `${due.length} player${due.length > 1 ? 's have' : ' has'} an outstanding balance — £${dueTotal.toLocaleString()} to collect.` })
  briefing.push({ tag: 'Progress', text: lessonsThisWeek ? `${lessonsThisWeek} lesson summar${lessonsThisWeek > 1 ? 'ies' : 'y'} logged this week — keep sharing the wins with players.` : 'No lesson summaries yet this week — log one after your next session.' })

  // Extra row cards.
  const nextSessions = upcoming.slice(0, 3)
  const recentSummaries = [...d.lessons].sort((a, b) => dk(b.session_date).localeCompare(dk(a.session_date))).slice(0, 3)
  const kitAttention = d.equipment.filter(i => i.status === 'low' || i.status === 'order' || i.status === 'repair')

  // Open a specific player's card on the roster (deep link).
  const openPlayer = (p: any) => { try { sessionStorage.setItem('lumio_open_player', p.id) } catch { /* ignore */ } onNavigate('roster') }

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

      {/* Inbox / Coach AI briefing / Needs attention */}
      <div className="cm-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: density.gap }}>
        {/* Inbox — live, last 5 messages, synced with the Messages section */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 12 }}>
            <p style={{ ...sectionTitle, margin: 0 }}>Inbox</p>
            <button onClick={() => onNavigate('messages')} style={{ ...linkBtn(accent), marginLeft: 'auto', fontSize: 11 }}>All →</button>
          </div>
          {inbox.length === 0 ? (
            <p style={{ fontSize: 12.5, color: T.text3, margin: 0 }}>No messages yet. <button onClick={() => onNavigate('messages')} style={linkBtn(accent)}>Send one →</button></p>
          ) : inbox.map(m => (
            <button key={m.id} onClick={() => onNavigate('messages')} style={{ display: 'block', width: '100%', textAlign: 'left', appearance: 'none', background: 'transparent', border: 'none', borderBottom: `1px solid ${T.border}`, padding: '8px 0', cursor: 'pointer' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 12, color: T.text, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.recipients || 'Message'}</span>
                <span style={{ marginLeft: 'auto', fontSize: 10, color: T.text3, flexShrink: 0 }}>{m.created_at ? new Date(m.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : ''}</span>
              </div>
              <div style={{ fontSize: 11, color: T.text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.subject ? `${m.subject} — ` : ''}{m.body}</div>
            </button>
          ))}
        </div>

        {/* Coach AI briefing — live, derived from real signals */}
        <div style={card}>
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

        {/* Needs attention — opens the player's card */}
        <div style={card}>
          <p style={sectionTitle}>Needs attention</p>
          {needs.length === 0 ? (
            <p style={{ fontSize: 12.5, color: T.text3, margin: 0 }}>Everyone&apos;s on track. 🎾</p>
          ) : needs.map(({ p, reason }) => (
            <button key={p.id} onClick={() => openPlayer(p)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', appearance: 'none', background: 'transparent', border: 'none', borderBottom: `1px solid ${T.border}`, padding: '8px 0', cursor: 'pointer' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: T.warn, flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, color: T.text, fontWeight: 600 }}>{p.name}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: T.text3 }}>{reason}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Extra row — upcoming sessions / recent summaries / kit needing attention */}
      <div className="cm-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: density.gap }}>
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 12 }}>
            <p style={{ ...sectionTitle, margin: 0 }}>Upcoming sessions</p>
            <button onClick={() => onNavigate('planner')} style={{ ...linkBtn(accent), marginLeft: 'auto', fontSize: 11 }}>Planner →</button>
          </div>
          {nextSessions.length === 0 ? <p style={{ fontSize: 12.5, color: T.text3, margin: 0 }}>Nothing booked yet.</p> : nextSessions.map(b => (
            <button key={b.id} onClick={() => onNavigate('planner')} style={{ display: 'flex', gap: 10, width: '100%', textAlign: 'left', appearance: 'none', background: 'transparent', border: 'none', borderBottom: `1px solid ${T.border}`, padding: '8px 0', cursor: 'pointer' }}>
              <span style={{ fontSize: 11, color: accent.hex, fontWeight: 600, width: 96, flexShrink: 0 }}>{fmtDate(b.booking_date)}{b.start_time ? ` ${b.start_time}` : ''}</span>
              <span style={{ fontSize: 12.5, color: T.text, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title || b.player_name || 'Session'}</span>
            </button>
          ))}
        </div>

        <div style={card}>
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

        <div style={card}>
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
    </div>
  )
}

function btn(accent: AccentTokens, T: ThemeTokens): React.CSSProperties { return { appearance: 'none', border: 0, cursor: 'pointer', padding: '8px 14px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 12.5, fontWeight: 700 } }
function btnGhost(T: ThemeTokens): React.CSSProperties { return { appearance: 'none', cursor: 'pointer', padding: '8px 14px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 12.5, fontWeight: 600 } }
function linkBtn(accent: AccentTokens): React.CSSProperties { return { appearance: 'none', background: 'transparent', border: 0, color: accent.hex, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', padding: 0 } }
