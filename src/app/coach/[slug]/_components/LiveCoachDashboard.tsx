'use client'

// Live home dashboard for a real coach portal. Shows a summary built from the
// coach's own data (RLS-scoped). If the coach has no data at all yet, it falls
// back to the onboarding setup grid (EmptyCoachDashboard).

import { useEffect, useState } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { dbList, RACKET_STAGES } from '../_lib/coach-db'
import { EmptyCoachDashboard } from './EmptyCoachDashboard'

type Common = { T: ThemeTokens; accent: AccentTokens; density: Density }

export function LiveCoachDashboard({ T, accent, density, clubName, onNavigate, onStartWizard }: Common & { clubName: string; onNavigate: (id: string) => void; onStartWizard?: () => void }) {
  const [loading, setLoading] = useState(true)
  const [players, setPlayers] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [lessons, setLessons] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [p, b, l, pay] = await Promise.all([
        dbList('coach_players'), dbList('coach_bookings'), dbList('coach_sessions'), dbList('coach_payments'),
      ])
      if (cancelled) return
      setPlayers(p); setBookings(b); setLessons(l); setPayments(pay); setLoading(false)
    })()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return <div style={{ fontFamily: FONT, color: T.text3, fontSize: 13, padding: '60px 0', textAlign: 'center' }}>Loading your portal…</div>
  }

  const total = players.length + bookings.length + lessons.length + payments.length
  if (total === 0) {
    // Nothing added yet — show the onboarding setup grid.
    return <EmptyCoachDashboard T={T} accent={accent} density={density} clubName={clubName} onNavigate={onNavigate} onStartWizard={onStartWizard} />
  }

  const today = new Date().toISOString().slice(0, 10)
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
  const upcoming = bookings
    .filter(b => (b.booking_date ?? '') >= today)
    .sort((a, b) => String(a.booking_date).localeCompare(String(b.booking_date)))
    .slice(0, 5)
  const recentLessons = [...lessons]
    .sort((a, b) => String(b.session_date ?? '').localeCompare(String(a.session_date ?? '')))
    .slice(0, 5)
  const lessonsThisWeek = lessons.filter(l => (l.session_date ?? '') >= weekAgo).length
  const due = payments.filter(p => p.status === 'due' || p.status === 'overdue')
  const dueTotal = due.reduce((s, p) => s + (Number(p.amount) || 0), 0)
  const stageCounts = RACKET_STAGES.map(s => players.filter(p => p.racket_stage === s.id).length)

  const card: React.CSSProperties = { background: T.panel, border: `1px solid ${T.border}`, borderRadius: density.radius, padding: density.pad }
  const sectionTitle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }

  return (
    <div style={{ fontFamily: FONT, display: 'flex', flexDirection: 'column', gap: density.gap }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.14em' }}>Dashboard</div>
        <h1 style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 800, color: T.text, letterSpacing: '-0.02em' }}>{clubName}</h1>
      </div>

      {/* Stat tiles */}
      <div className="cm-md" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: density.gap }}>
        {[
          { label: 'Players', value: players.length, nav: 'roster' },
          { label: 'Lessons this week', value: lessonsThisWeek, nav: 'lessons' },
          { label: 'Upcoming bookings', value: upcoming.length, nav: 'calendar' },
          { label: 'Payments due', value: `£${dueTotal.toLocaleString()}`, nav: 'payments' },
        ].map(s => (
          <button key={s.label} onClick={() => onNavigate(s.nav)} style={{ ...card, textAlign: 'left', cursor: 'pointer', appearance: 'none' }}>
            <div style={{ fontSize: 12, color: T.text3 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: T.text, marginTop: 4 }}>{s.value}</div>
          </button>
        ))}
      </div>

      <div className="cm-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: density.gap }}>
        {/* Upcoming bookings */}
        <div style={card}>
          <p style={sectionTitle}>Upcoming bookings</p>
          {upcoming.length === 0 ? (
            <p style={{ color: T.text3, fontSize: 13, margin: 0 }}>No upcoming bookings. <button onClick={() => onNavigate('calendar')} style={linkBtn(accent)}>Add one →</button></p>
          ) : upcoming.map(b => (
            <Row key={b.id} T={T} left={b.title || b.player_name || 'Booking'} sub={[b.court, b.start_time].filter(Boolean).join(' · ')} right={fmtDate(b.booking_date)} />
          ))}
        </div>

        {/* Recent lessons */}
        <div style={card}>
          <p style={sectionTitle}>Recent lessons</p>
          {recentLessons.length === 0 ? (
            <p style={{ color: T.text3, fontSize: 13, margin: 0 }}>No lessons logged. <button onClick={() => onNavigate('lessons')} style={linkBtn(accent)}>Log one →</button></p>
          ) : recentLessons.map(l => (
            <Row key={l.id} T={T} left={l.player_name || 'Lesson'} sub={l.focus || ''} right={fmtDate(l.session_date)} />
          ))}
        </div>

        {/* Payments due */}
        <div style={card}>
          <p style={sectionTitle}>Payments due</p>
          {due.length === 0 ? (
            <p style={{ color: T.text3, fontSize: 13, margin: 0 }}>Nothing outstanding.</p>
          ) : due.slice(0, 5).map(p => (
            <Row key={p.id} T={T} left={p.player_name || 'Payment'} sub={p.item || ''} right={`£${(Number(p.amount) || 0).toLocaleString()}`} rightColor={p.status === 'overdue' ? '#EF4444' : T.text} />
          ))}
        </div>

        {/* Racket distribution */}
        <div style={card}>
          <p style={sectionTitle}>Racket distribution</p>
          {players.length === 0 ? (
            <p style={{ color: T.text3, fontSize: 13, margin: 0 }}>Add players to track progression.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {RACKET_STAGES.map((s, i) => stageCounts[i] > 0 && (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 999, padding: '4px 10px' }}>
                  <span style={{ width: 11, height: 11, borderRadius: 3, background: s.colour, border: '1px solid rgba(128,128,128,0.4)' }} />
                  <span style={{ color: T.text2, fontSize: 12 }}>{s.name}</span>
                  <span style={{ color: T.text, fontSize: 12, fontWeight: 700 }}>{stageCounts[i]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ T, left, sub, right, rightColor }: { T: ThemeTokens; left: string; sub?: string; right?: string; rightColor?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '8px 0', borderBottom: `1px solid ${T.border}` }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ color: T.text, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{left}</div>
        {sub ? <div style={{ color: T.text3, fontSize: 12 }}>{sub}</div> : null}
      </div>
      {right ? <div style={{ color: rightColor || T.text2, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>{right}</div> : null}
    </div>
  )
}

function linkBtn(accent: AccentTokens): React.CSSProperties {
  return { appearance: 'none', background: 'transparent', border: 0, color: accent.hex, fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: 0 }
}
function fmtDate(d?: string) { if (!d) return ''; try { return new Date(d).toLocaleDateString('en-GB') } catch { return d } }
