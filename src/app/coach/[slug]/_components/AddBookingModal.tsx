'use client'

// Add Booking — creates a real booking on the Booking Calendar. Bookings are the
// schedule source of truth, so a confirmed, today-or-future, coachable booking
// also surfaces in the Session Planner as a buildable session. Mirrors the
// AddPlayerModal structure/styling. Demo only: persists to bookings-store
// (localStorage), no Supabase.

import { useState, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { PLAYERS, WEEK_START, TODAY, dateForDay, type Booking } from '../_lib/coach-data'
import { dayIndexForDate } from '../_lib/schedule'
import { addBooking, updateBooking, removeBooking } from '../_lib/bookings-store'

const TYPES: Booking['type'][] = ['Private', 'Group', 'Cardio', 'Match play', 'Block']
const COURTS = ['Court 1', 'Court 2', 'Court 3', 'Court 4', '—']
// Quarter-hour slots across the calendar's visible hours (08:00–19:00).
const TIMES = (() => {
  const out: string[] = []
  for (let h = 8; h <= 19; h++) for (const m of [0, 15, 30, 45]) {
    if (h === 19 && m > 0) break
    out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }
  return out
})()
// Types that aren't tied to a single roster player — a free-text label fits better.
const LABEL_TYPES: Booking['type'][] = ['Group', 'Cardio', 'Block']

export function AddBookingModal({ T, accent, onClose, editBooking }: { T: ThemeTokens; accent: AccentTokens; density: Density; onClose: () => void; editBooking?: Booking }) {
  const isEdit = !!editBooking
  const [type, setType] = useState<Booking['type']>(editBooking?.type ?? 'Private')
  const [player, setPlayer] = useState(editBooking?.player ?? '')
  const [court, setCourt] = useState(editBooking?.court ?? 'Court 1')
  const [date, setDate] = useState(editBooking?.date ?? TODAY)
  const [start, setStart] = useState(editBooking?.start ?? '09:00')
  const [end, setEnd] = useState(editBooking?.end ?? '10:00')
  const [status, setStatus] = useState<Booking['status']>(editBooking?.status ?? 'confirmed')

  const inputStyle: CSSProperties = { width: '100%', appearance: 'none', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 13, padding: '9px 11px', fontFamily: FONT, outline: 'none' }
  const labelStyle: CSSProperties = { fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 4, display: 'block' }

  const isLabel = LABEL_TYPES.includes(type)
  const canSave = player.trim().length > 0 && end > start && date.length === 10

  const save = () => {
    if (!canSave) return
    const fields = {
      day: dayIndexForDate(date),     // 0–6 within the demo week, -1 if outside it
      date,                           // already 'YYYY-MM-DD' from the date input
      start, end,
      player: player.trim(),
      type,
      court: type === 'Block' ? (court || '—') : court,
      status,
    }
    if (isEdit) {
      updateBooking(editBooking!.id, fields)
    } else {
      addBooking({ id: `book-${Date.now()}`, coachId: 'pete', ...fields })
    }
    onClose()
  }
  const del = () => { if (isEdit) { removeBooking(editBooking!.id); onClose() } }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '7vh 16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 480, background: T.panel, border: `1px solid ${T.borderHi}`, borderRadius: 14, boxShadow: '0 30px 80px -20px rgba(0,0,0,0.7)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: `1px solid ${T.border}` }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', background: accent.dim }}><Icon name="calendar" size={15} stroke={1.7} style={{ color: accent.hex }} /></div>
          <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: T.text }}>{isEdit ? 'Edit booking' : 'Add booking'}</div>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text3, cursor: 'pointer', width: 30, height: 30, fontSize: 18, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={labelStyle}>Type</label>
            <select value={type} onChange={e => setType(e.target.value as Booking['type'])} style={inputStyle}>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>{isLabel ? 'Label *' : 'Player *'}</label>
            <input value={player} onChange={e => setPlayer(e.target.value)} placeholder={isLabel ? 'e.g. Junior Squad, Cardio Tennis, Admin / Planning' : 'e.g. Mia Chen'} style={inputStyle} autoFocus />
            {!isLabel && (
              <select value="" onChange={e => { if (e.target.value) setPlayer(e.target.value) }} style={{ ...inputStyle, marginTop: 6, color: T.text3 }}>
                <option value="">Pick from roster…</option>
                {PLAYERS.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Court</label>
              <select value={court} onChange={e => setCourt(e.target.value)} style={inputStyle}>
                {COURTS.map(c => <option key={c} value={c}>{c === '—' ? '— (no court)' : c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as Booking['status'])} style={inputStyle}>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Date</label>
            <input type="date" value={date} min={WEEK_START} onChange={e => setDate(e.target.value)} style={inputStyle} />
            <div style={{ fontSize: 10, color: T.text3, marginTop: 4 }}>The week grid shows {dateForDay(0)} – {dateForDay(6)}; dates beyond it appear in the Month view.</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Start</label>
              <select value={start} onChange={e => setStart(e.target.value)} style={inputStyle}>
                {TIMES.slice(0, -1).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>End</label>
              <select value={end} onChange={e => setEnd(e.target.value)} style={inputStyle}>
                {TIMES.filter(t => t > start).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          {end <= start && <div style={{ fontSize: 10.5, color: T.warn }}>End time must be after the start time.</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={save} disabled={!canSave}
              style={{ flex: 1, appearance: 'none', border: 0, padding: '10px 14px', borderRadius: 9, background: canSave ? accent.hex : T.hover, color: canSave ? T.btnText : T.text3, fontSize: 13, fontWeight: 600, fontFamily: FONT, cursor: canSave ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              <Icon name={isEdit ? 'check' : 'plus'} size={14} stroke={2} /> {isEdit ? 'Save changes' : 'Add to calendar'}
            </button>
            {isEdit && (
              <button onClick={del} title="Delete booking" style={{ appearance: 'none', padding: '10px 14px', borderRadius: 9, background: 'transparent', color: T.bad, border: `1px solid ${T.bad}55`, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Delete</button>
            )}
            <button onClick={onClose} style={{ appearance: 'none', padding: '10px 16px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}
