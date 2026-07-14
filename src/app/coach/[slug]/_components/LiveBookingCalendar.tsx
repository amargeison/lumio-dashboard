'use client'

// Live (founder portal) Booking Calendar — the real, date-aware version of the
// demo calendar. Unlike the demo (pinned to a fixed sample week), this computes
// the actual current week/month from today, so a coach who signs up in October
// lands on October. Week + Month views, a clear "Month YYYY" heading with prev /
// next / Today, colour-coded blocks by type, and Add/Edit/Delete that write to
// coach_bookings — which auto-sync to the coach's connected Google / Microsoft
// calendar via the Phase 2 engine (coach-db → /api/coach/calendar/event).

import { useState, useEffect, useMemo, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT, FONT_MONO } from '@/app/cricket/[slug]/v2/_lib/theme'
import { useCoachTable, dbInsert, dbUpdate, dbRemove, useCoachProfile } from '../_lib/coach-db'
import { getSettings } from '../_lib/settings-store'

type Booking = {
  id: string; title: string | null; player_name: string | null; court: string | null
  booking_date: string | null; start_time: string | null; duration_min: number | null
  status: string | null; type: string | null; notes: string | null
}
const TYPES = ['Private', 'Group', 'Cardio', 'Match play', 'Block'] as const

// ── Date helpers ──────────────────────────────────────────────────────────────
const pad = (n: number) => String(n).padStart(2, '0')
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const mondayOf = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); const wd = (x.getDay() + 6) % 7; x.setDate(x.getDate() - wd); return x }
const sameDay = (a: Date, b: Date) => iso(a) === iso(b)
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
// Parse a stored start time ("16:00", "1600", "9:30") → minutes since midnight.
const parseMins = (t: string | null): number | null => {
  if (!t) return null
  const m = t.match(/(\d{1,2})\s*:\s*(\d{2})/) || t.match(/^(\d{1,2})(\d{2})$/)
  if (m) return Math.min(23, +m[1]) * 60 + Math.min(59, +m[2])
  const h = t.match(/^(\d{1,2})$/); return h ? +h[1] * 60 : null
}
const minsToHHMM = (mins: number) => `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`

const HOUR_START = 7, HOUR_END = 21, ROW_H = 44
const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i)

export function LiveBookingCalendar({ T, accent, onNavigate }: {
  T: ThemeTokens; accent: AccentTokens; onNavigate?: (section: string) => void
}) {
  const { rows, add, edit, remove, reload } = useCoachTable<Booking>('coach_bookings')
  const { rows: playerRows } = useCoachTable<{ id: string; name: string }>('coach_players')
  const players = playerRows.map(p => ({ id: p.id, name: p.name }))
  const { rows: staffRows } = useCoachTable<{ id: string; name: string }>('coach_staff')
  const profile = useCoachProfile()
  const coaches = [profile.display_name || 'Head Coach', ...staffRows.map(s => s.name)]

  const [view, setView] = useState<'week' | 'month'>('week')
  const [cursor, setCursor] = useState(() => new Date())
  const [editing, setEditing] = useState<Booking | 'new' | null>(null)
  const [connected, setConnected] = useState<string[] | null>(null)
  const [busy, setBusy] = useState<{ date: string; start: number; end: number }[]>([])

  const today = new Date()
  const weekStart = useMemo(() => mondayOf(cursor), [cursor])
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])

  const TYPE_COLOUR = (t: string | null): string => {
    switch (t) {
      case 'Group': return '#3A8EE0'; case 'Cardio': return T.warn
      case 'Match play': return T.good; case 'Block': return T.text3; default: return accent.hex
    }
  }

  // Heading: "June 2026" (month view, or a week within one month) or "Jun – Jul 2026".
  const heading = useMemo(() => {
    if (view === 'month') return `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`
    const a = weekDays[0], b = weekDays[6]
    if (a.getMonth() === b.getMonth()) return `${MONTHS[a.getMonth()]} ${a.getFullYear()}`
    const ay = a.getFullYear(), by = b.getFullYear()
    return `${MONTHS[a.getMonth()].slice(0, 3)} ${ay !== by ? ay + ' ' : ''}– ${MONTHS[b.getMonth()].slice(0, 3)} ${by}`
  }, [view, cursor, weekDays])

  const step = (dir: number) => setCursor(c => view === 'month' ? new Date(c.getFullYear(), c.getMonth() + dir, 1) : addDays(c, dir * 7))

  // Connected calendars (for the sync banner).
  useEffect(() => {
    fetch('/api/coach/integrations').then(r => r.ok ? r.json() : null).then(j => {
      setConnected(Array.isArray(j?.connections) ? j.connections.map((c: any) => c.provider) : [])
    }).catch(() => setConnected([]))
  }, [])

  // Busy blocks from the connected calendar, for the visible week (week view only).
  useEffect(() => {
    if (view !== 'week') return
    const from = new Date(weekStart); const to = addDays(weekStart, 7)
    fetch(`/api/coach/calendar/availability?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`)
      .then(r => r.ok ? r.json() : { busy: [] })
      .then(j => setBusy((Array.isArray(j.busy) ? j.busy : []).map((iv: { start: string; end: string }) => {
        const s = new Date(iv.start), e = new Date(iv.end)
        const sMin = s.getHours() * 60 + s.getMinutes()
        const eMin = sameDay(s, e) ? e.getHours() * 60 + e.getMinutes() : 24 * 60
        return { date: iso(s), start: sMin, end: eMin }
      })))
      .catch(() => setBusy([]))
  }, [view, weekStart])

  const bookingsOn = (d: Date) => rows.filter(b => b.booking_date === iso(d))
  const calProvider = connected && connected.length ? connected[0] : null
  const provLabel = (p: string) => p === 'google' ? 'Google Calendar' : p === 'microsoft' ? 'Microsoft / Outlook' : p === 'icloud' ? 'iCloud' : p

  const modals = editing && (
    <BookingFormModal T={T} accent={accent} players={players} coaches={coaches} typeColour={TYPE_COLOUR}
      booking={editing === 'new' ? null : editing}
      defaultDate={iso(cursor)}
      onClose={() => setEditing(null)}
      onDelete={editing !== 'new' ? async () => { await remove(editing.id); setEditing(null); reload() } : undefined}
      onSave={async (vals, newPlayer) => {
        if (newPlayer) await dbInsert('coach_players', { name: newPlayer }).catch(() => {})
        if (editing === 'new') await add(vals); else await edit(editing.id, vals)
        setEditing(null); reload()
      }} />
  )

  const sectOff = getSettings().sectionsOff?.calendar || []
  const showSec = (k: string) => !sectOff.includes(k)

  return (
    <div style={{ fontFamily: FONT }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 14 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.text }}>Booking Calendar</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: T.text3 }}>Your week across all courts — private lessons, group squads, cardio and match play.</p>
        </div>
        <button onClick={() => setEditing('new')} style={{ appearance: 'none', border: 0, padding: '9px 15px', borderRadius: 10, background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 600, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>＋ Add booking</button>
      </div>

      {/* Toolbar: month heading + nav, Week/Month switch */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <NavBtn T={T} onClick={() => step(-1)}>‹</NavBtn>
          <div style={{ fontSize: 17, fontWeight: 700, color: T.text, minWidth: 168, textAlign: 'center' }}>{heading}</div>
          <NavBtn T={T} onClick={() => step(1)}>›</NavBtn>
          <button onClick={() => setCursor(new Date())} style={{ marginLeft: 6, appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>Today</button>
        </div>
        <div style={{ display: 'flex', gap: 0, padding: 2, background: T.hover, borderRadius: 9, marginLeft: 'auto', width: 'fit-content' }}>
          {(['week', 'month'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{ appearance: 'none', border: 0, padding: '6px 16px', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: FONT, textTransform: 'capitalize', background: view === v ? T.panel : 'transparent', color: view === v ? T.text : T.text2, fontWeight: view === v ? 600 : 400, boxShadow: view === v ? `0 0 0 1px ${T.border}` : 'none' }}>{v}</button>
          ))}
        </div>
      </div>

      {/* Calendar sync banner */}
      {connected !== null && showSec('syncbanner') && (
        calProvider ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12, padding: '9px 13px', borderRadius: 10, background: 'rgba(58,142,224,0.08)', border: '1px solid rgba(58,142,224,0.25)', fontSize: 11.5, color: T.text2 }}>
            <span style={{ fontWeight: 700, color: '#3A8EE0' }}>📅 Synced</span>
            <span>Bookings sync to your {provLabel(calProvider)}{busy.length ? ` · ${busy.length} busy ${busy.length === 1 ? 'block' : 'blocks'} this week shown striped` : ''}.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12, padding: '9px 13px', borderRadius: 10, background: accent.dim, border: `1px solid ${accent.border}`, fontSize: 11.5, color: T.text2 }}>
            <span style={{ fontWeight: 700, color: accent.hex }}>🔗 Connect your calendar</span>
            <span>Sync bookings two-way with Google or Microsoft so your court diary stays in step.</span>
            <button onClick={() => onNavigate?.('settings')} style={{ marginLeft: 'auto', appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 8, padding: '5px 12px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>Connect in Settings →</button>
          </div>
        )
      )}

      {view === 'week'
        ? <WeekGrid T={T} accent={accent} days={weekDays} today={today} bookings={rows} busy={busy} typeColour={TYPE_COLOUR} onOpen={b => setEditing(b)} />
        : <MonthGrid T={T} accent={accent} cursor={cursor} today={today} bookingsOn={bookingsOn} typeColour={TYPE_COLOUR} onOpen={b => setEditing(b)} onDay={d => { setCursor(d); setView('week') }} />}

      {/* Legend */}
      <div style={{ display: showSec('legend') ? 'flex' : 'none', gap: 14, marginTop: 12, flexWrap: 'wrap', fontSize: 11, color: T.text3 }}>
        {TYPES.map(t => <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: TYPE_COLOUR(t) }} />{t}</span>)}
        <span style={{ marginLeft: 'auto' }}>{view === 'week' ? 'Faint fill = pending confirmation' : 'Click a day to open its week'}</span>
      </div>

      {modals}
    </div>
  )
}

function NavBtn({ T, onClick, children }: { T: ThemeTokens; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} style={{ appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 8, width: 30, height: 30, fontSize: 18, lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</button>
}

// ── Week grid ─────────────────────────────────────────────────────────────────
function WeekGrid({ T, accent, days, today, bookings, busy, typeColour, onOpen }: {
  T: ThemeTokens; accent: AccentTokens; days: Date[]; today: Date
  bookings: Booking[]; busy: { date: string; start: number; end: number }[]
  typeColour: (t: string | null) => string; onOpen: (b: Booking) => void
}) {
  const yFor = (mins: number) => Math.max(0, Math.min((mins / 60 - HOUR_START) * ROW_H, HOURS.length * ROW_H))
  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 0, overflowX: 'auto' }}>
      <div style={{ minWidth: 720 }}>
        {/* header */}
        <div style={{ display: 'grid', gridTemplateColumns: `56px repeat(7, 1fr)`, borderBottom: `1px solid ${T.border}` }}>
          <div />
          {days.map((d, i) => {
            const isToday = sameDay(d, today)
            return (
              <div key={i} style={{ padding: '9px 6px', textAlign: 'center', borderLeft: `1px solid ${T.border}`, background: isToday ? accent.dim : 'transparent' }}>
                <div style={{ fontSize: 11, color: isToday ? accent.hex : T.text2, fontWeight: 600 }}>{WD[i]}</div>
                <div style={{ fontSize: 16, color: isToday ? accent.hex : T.text, fontWeight: 600 }}>{d.getDate()}</div>
              </div>
            )
          })}
        </div>
        {/* grid */}
        <div style={{ display: 'grid', gridTemplateColumns: `56px repeat(7, 1fr)` }}>
          <div>{HOURS.map(h => <div key={h} style={{ height: ROW_H, fontSize: 10, color: T.text3, fontFamily: FONT_MONO, padding: '2px 6px', textAlign: 'right' }}>{pad(h)}:00</div>)}</div>
          {days.map((d, di) => {
            const dayKey = iso(d)
            const dayBusy = busy.filter(b => b.date === dayKey)
            const dayBookings = bookings.filter(b => b.booking_date === dayKey)
            return (
              <div key={di} style={{ position: 'relative', borderLeft: `1px solid ${T.border}` }}>
                {HOURS.map(h => <div key={h} style={{ height: ROW_H, borderTop: `1px solid ${T.border}` }} />)}
                {dayBusy.map((b, bi) => {
                  const top = yFor(b.start), h = yFor(b.end) - top
                  if (h <= 0) return null
                  return <div key={`busy-${bi}`} title="Busy in your connected calendar" style={{ position: 'absolute', left: 0, right: 0, top, height: h, background: `repeating-linear-gradient(45deg, ${T.text3}1f, ${T.text3}1f 5px, transparent 5px, transparent 10px)`, borderTop: `1px solid ${T.text3}33`, borderBottom: `1px solid ${T.text3}33`, pointerEvents: 'none', zIndex: 0 }} />
                })}
                {dayBookings.map(b => {
                  const startM = parseMins(b.start_time); if (startM == null) return null
                  const dur = b.duration_min || 60
                  const top = yFor(startM), height = Math.max(yFor(startM + dur) - top - 2, 20)
                  const c = typeColour(b.type)
                  return (
                    <div key={b.id} onClick={() => onOpen(b)} title={`${b.title || b.player_name || 'Booking'} · ${minsToHHMM(startM)}`}
                      style={{ position: 'absolute', left: 3, right: 3, top: top + 1, height, background: b.status === 'pending' ? `${c}14` : `${c}26`, border: `1px solid ${c}`, borderLeft: `3px solid ${c}`, borderRadius: 6, padding: '3px 6px', overflow: 'hidden', opacity: b.status === 'cancelled' ? 0.45 : 1, cursor: 'pointer', zIndex: 1 }}>
                      <div style={{ fontSize: 10.5, color: T.text, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title || b.player_name || 'Booking'}</div>
                      <div style={{ fontSize: 9, color: T.text2, fontFamily: FONT_MONO }}>{minsToHHMM(startM)}{b.court ? ` · ${b.court}` : ''}</div>
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

// ── Month grid ────────────────────────────────────────────────────────────────
function MonthGrid({ T, accent, cursor, today, bookingsOn, typeColour, onOpen, onDay }: {
  T: ThemeTokens; accent: AccentTokens; cursor: Date; today: Date
  bookingsOn: (d: Date) => Booking[]; typeColour: (t: string | null) => string
  onOpen: (b: Booking) => void; onDay: (d: Date) => void
}) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  const gridStart = mondayOf(first)
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
  const month = cursor.getMonth()
  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: `1px solid ${T.border}` }}>
        {WD.map(d => <div key={d} style={{ padding: '8px 6px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: T.text3 }}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {cells.map((d, i) => {
          const inMonth = d.getMonth() === month
          const isToday = sameDay(d, today)
          const items = bookingsOn(d).slice().sort((a, b) => (parseMins(a.start_time) ?? 0) - (parseMins(b.start_time) ?? 0))
          return (
            <div key={i} onClick={() => onDay(d)} style={{ minHeight: 96, borderLeft: i % 7 ? `1px solid ${T.border}` : 'none', borderTop: i >= 7 ? `1px solid ${T.border}` : 'none', padding: 5, background: inMonth ? 'transparent' : T.hover, cursor: 'pointer', opacity: inMonth ? 1 : 0.55 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 12, fontWeight: isToday ? 700 : 500, color: isToday ? T.btnText : T.text2, background: isToday ? accent.hex : 'transparent', borderRadius: 999, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{d.getDate()}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
                {items.slice(0, 3).map(b => {
                  const c = typeColour(b.type)
                  return (
                    <div key={b.id} onClick={e => { e.stopPropagation(); onOpen(b) }} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: T.text, background: `${c}22`, borderLeft: `2px solid ${c}`, borderRadius: 4, padding: '1px 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: b.status === 'cancelled' ? 0.45 : 1 }}>
                      <span style={{ fontFamily: FONT_MONO, color: T.text3, fontSize: 9 }}>{(() => { const m = parseMins(b.start_time); return m == null ? '' : minsToHHMM(m) })()}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title || b.player_name || 'Booking'}</span>
                    </div>
                  )
                })}
                {items.length > 3 && <div style={{ fontSize: 9.5, color: T.text3, paddingLeft: 4 }}>+{items.length - 3} more</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Add / Edit booking modal ──────────────────────────────────────────────────
function BookingFormModal({ T, accent, players, coaches, typeColour, booking, defaultDate, onClose, onSave, onDelete }: {
  T: ThemeTokens; accent: AccentTokens; players: { id: string; name: string }[]; coaches: string[]
  typeColour: (t: string | null) => string
  booking: Booking | null; defaultDate: string
  onClose: () => void
  onSave: (vals: Record<string, any>, newPlayer: string | null) => Promise<void>
  onDelete?: () => Promise<void>
}) {
  const known = players.some(p => p.name === booking?.player_name)
  const [title, setTitle] = useState(booking?.title || '')
  const [playerSel, setPlayerSel] = useState(booking ? (known ? booking.player_name || '' : (booking.player_name ? '__new__' : '')) : '')
  const [newPlayer, setNewPlayer] = useState(booking && !known ? booking.player_name || '' : '')
  const [court, setCourt] = useState(booking?.court || '')
  const [date, setDate] = useState(booking?.booking_date || defaultDate)
  const [start, setStart] = useState(() => { const m = parseMins(booking?.start_time ?? null); return m == null ? '16:00' : minsToHHMM(m) })
  const [dur, setDur] = useState(String(booking?.duration_min ?? 60))
  const [type, setType] = useState(booking?.type || 'Private')
  const [status, setStatus] = useState(booking?.status || 'confirmed')
  const [coach, setCoach] = useState((booking as any)?.assigned_coach || '')
  const [notes, setNotes] = useState(booking?.notes || '')
  const [saving, setSaving] = useState(false)

  const who = (playerSel === '__new__' ? newPlayer : playerSel).trim()
  const field: CSSProperties = { width: '100%', background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 9, padding: '9px 11px', fontSize: 13, fontFamily: FONT, boxSizing: 'border-box' }
  const lbl: CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: T.text3, margin: '0 0 6px' }
  const canSave = (!!title.trim() || !!who) && !saving

  const save = async () => {
    if (!canSave) return
    setSaving(true)
    const isNewPlayer = playerSel === '__new__' && who && !players.some(p => p.name.toLowerCase() === who.toLowerCase())
    try {
      await onSave({
        title: title.trim() || who, player_name: who || null, court: court.trim() || null,
        booking_date: date, start_time: start, duration_min: Number(dur) || 60,
        type, status, assigned_coach: coach || null, notes: notes.trim() || null,
      }, isNewPlayer ? who : null)
    } finally { setSaving(false) }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, fontFamily: FONT, padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, width: 460, maxWidth: '100%', maxHeight: '92vh', overflow: 'auto' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 14 }}>{booking ? 'Edit booking' : 'Add booking'}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><label style={lbl}>Title</label><input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. 1:1 with Sam, Junior Squad" style={field} /></div>
          <div>
            <label style={lbl}>Player</label>
            <select value={playerSel} onChange={e => setPlayerSel(e.target.value)} style={{ ...field, cursor: 'pointer' }}>
              <option value="">— (optional)</option>
              {players.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              <option value="__new__">+ New player…</option>
            </select>
            {playerSel === '__new__' && <input value={newPlayer} onChange={e => setNewPlayer(e.target.value)} placeholder="New player's name" style={{ ...field, marginTop: 8 }} />}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={lbl}>Type</label>
              <select value={type} onChange={e => setType(e.target.value)} style={{ ...field, cursor: 'pointer' }}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Court</label><input value={court} onChange={e => setCourt(e.target.value)} placeholder="e.g. Court 1" style={field} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div><label style={lbl}>Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} style={field} /></div>
            <div><label style={lbl}>Start</label><input type="time" value={start} onChange={e => setStart(e.target.value)} style={field} /></div>
            <div><label style={lbl}>Mins</label><input type="number" min={15} step={15} value={dur} onChange={e => setDur(e.target.value)} style={field} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={lbl}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} style={{ ...field, cursor: 'pointer' }}>
                <option value="confirmed">Confirmed</option><option value="pending">Pending</option><option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div><label style={lbl}>Coach</label>
              <select value={coach} onChange={e => setCoach(e.target.value)} style={{ ...field, cursor: 'pointer' }}>
                <option value="">Head coach (you)</option>
                {coaches.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div><label style={lbl}>Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ ...field, resize: 'vertical' }} /></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18 }}>
          {onDelete && <button onClick={async () => { if (confirm('Delete this booking?')) await onDelete() }} style={{ appearance: 'none', padding: '8px 12px', borderRadius: 9, background: 'transparent', color: T.bad, border: `1px solid ${T.border}`, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>Delete</button>}
          <button onClick={onClose} style={{ marginLeft: 'auto', appearance: 'none', padding: '8px 14px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
          <button onClick={save} disabled={!canSave} style={{ appearance: 'none', border: 0, padding: '8px 16px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 600, cursor: canSave ? 'pointer' : 'not-allowed', opacity: canSave ? 1 : 0.5, fontFamily: FONT }}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  )
}
