'use client'

// Live Court Planner — the venue-centric view: every site the coach works across,
// its contact + facilities, the courts there, and the coach's own confirmed
// lessons at that venue today (no third-party booking feed in v1). Coaches based
// at each venue come from coach_staff.home_venue. Venues/courts are managed in
// Settings → Venues (no Add-venue button here, by design).

import { useState, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { useCoachTable } from '../_lib/coach-db'

type Venue = { id: string; name: string; address?: string | null; contact_name?: string | null; contact_phone?: string | null; contact_email?: string | null; facilities?: string | null; access_note?: string | null; is_home?: boolean | null }
type Court = { id: string; venue_id?: string | null; name: string; surface?: string | null; status?: string | null; notes?: string | null }
type Booking = { player_name?: string | null; court?: string | null; booking_date?: string | null; start_time?: string | null; duration_min?: number | null; status?: string | null; type?: string | null }
type Staff = { id: string; name: string; role?: string | null; home_venue?: string | null }

const todayISO = () => new Date().toISOString().slice(0, 10)
const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?'
const toMins = (t?: string | null) => { if (!t) return null; const m = t.match(/(\d{1,2})\s*:\s*(\d{2})/) || t.match(/^(\d{1,2})(\d{2})$/); return m ? Math.min(23, +m[1]) * 60 + Math.min(59, +m[2]) : null }
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

export function LiveCourtPlanner({ T, accent, onNavigate }: { T: ThemeTokens; accent: AccentTokens; onNavigate?: (s: string) => void }) {
  const { rows: venues } = useCoachTable<Venue>('coach_venues')
  const { rows: courts } = useCoachTable<Court>('coach_courts')
  const { rows: bookings } = useCoachTable<Booking>('coach_bookings')
  const { rows: staff } = useCoachTable<Staff>('coach_staff')
  const [reqVenue, setReqVenue] = useState<Venue | null>(null)

  const today = todayISO()
  const todaysBookings = bookings.filter(b => b.booking_date === today && b.status !== 'cancelled')
  const lessonsToday = todaysBookings.length

  const tiles = [
    { label: 'Sites', value: venues.length },
    { label: 'Courts total', value: courts.length },
    { label: 'Your lessons today', value: lessonsToday },
    { label: 'Coaches', value: staff.length },
  ]

  return (
    <div style={{ fontFamily: FONT }}>
      <div style={{ marginBottom: 14 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.text }}>Court Planner</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: T.text3 }}>The sites you coach across — contacts, facilities and your lessons. Manage venues &amp; courts in <button onClick={() => onNavigate?.('settings')} style={{ appearance: 'none', border: 0, background: 'transparent', color: accent.hex, fontWeight: 600, cursor: 'pointer', padding: 0, fontSize: 13, fontFamily: FONT }}>Settings → Venues</button>. (Customer bookings live in the Booking Calendar.)</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
        {tiles.map(t => (
          <div key={t.label} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{t.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: accent.hex, marginTop: 4 }}>{t.value}</div>
          </div>
        ))}
      </div>

      {venues.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', background: T.panel, border: `1px dashed ${T.border}`, borderRadius: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>No venues yet</div>
          <div style={{ fontSize: 12.5, color: T.text3, marginTop: 4 }}>Add the sites you coach across in <button onClick={() => onNavigate?.('settings')} style={{ appearance: 'none', border: 0, background: 'transparent', color: accent.hex, fontWeight: 600, cursor: 'pointer', padding: 0, fontSize: 12.5, fontFamily: FONT }}>Settings → Venues</button>.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {venues.map(v => (
            <VenueCard key={v.id} T={T} accent={accent} venue={v}
              courts={courts.filter(c => c.venue_id === v.id)}
              todaysBookings={todaysBookings}
              coaches={staff.filter(s => (s.home_venue || '').trim().toLowerCase() === v.name.trim().toLowerCase())}
              onRequest={() => setReqVenue(v)} />
          ))}
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap', fontSize: 11, color: T.text3 }}>
        {[['Free', T.good], ['Your lesson', accent.hex], ['Booked', T.warn], ['Maintenance', T.bad]].map(([l, c]) => (
          <span key={l as string} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: c as string }} />{l}</span>
        ))}
      </div>

      {reqVenue && <RequestCourtsModal T={T} accent={accent} venue={reqVenue} onClose={() => setReqVenue(null)} />}
    </div>
  )
}

function VenueCard({ T, accent, venue, courts, todaysBookings, coaches, onRequest }: {
  T: ThemeTokens; accent: AccentTokens; venue: Venue; courts: Court[]; todaysBookings: Booking[]; coaches: Staff[]; onRequest: () => void
}) {
  const facilities = (venue.facilities || '').split(',').map(s => s.trim()).filter(Boolean)
  // A court shows "Your lesson" if there's a confirmed booking today whose court matches.
  const lessonFor = (court: Court) => todaysBookings.find(b => (b.court || '').trim().toLowerCase() === court.name.trim().toLowerCase())
  const courtState = (court: Court): { label: string; colour: string } => {
    const l = lessonFor(court)
    if (l) { const s = toMins(l.start_time); const end = s != null ? hhmm(s + (l.duration_min || 60)) : null; return { label: `Your lesson${end ? ` · til ${end}` : ''}`, colour: accent.hex } }
    const st = (court.status || 'free').toLowerCase()
    if (st.includes('book')) return { label: 'Booked', colour: T.warn }
    if (st.includes('maint')) return { label: 'Maintenance', colour: T.bad }
    return { label: 'Free', colour: T.good }
  }
  const cbtn: CSSProperties = { appearance: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 11px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, textDecoration: 'none' }

  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ fontSize: 16 }}>📍</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{venue.name}</span>
            {venue.is_home && <span style={{ fontSize: 9, fontWeight: 700, color: accent.hex, background: accent.dim, padding: '2px 7px', borderRadius: 5, textTransform: 'uppercase' }}>Home base</span>}
          </div>
          {venue.address && <div style={{ fontSize: 11.5, color: T.text3, marginTop: 2 }}>{venue.address}</div>}
          {(() => {
            const q = encodeURIComponent(venue.address || venue.name)
            const mapUrl = `https://www.google.com/maps/search/?api=1&query=${q}`
            return (
              <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
                <a href={mapUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11.5, fontWeight: 600, color: accent.hex, textDecoration: 'none' }}>🗺️ Directions ↗</a>
                <button onClick={() => { navigator.clipboard?.writeText(mapUrl).then(() => alert('Map link copied — paste it to players or parents.')).catch(() => {}) }} style={{ appearance: 'none', border: 0, background: 'transparent', color: T.text3, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>🔗 Copy link to share</button>
              </div>
            )
          })()}
        </div>
      </div>

      {/* Contact */}
      {(venue.contact_name || venue.contact_phone || venue.contact_email) && (
        <div style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, padding: 12, marginTop: 12 }}>
          <div style={{ fontSize: 9.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Site contact</div>
          {venue.contact_name && <div style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: '3px 0 8px' }}>{venue.contact_name}</div>}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {venue.contact_phone && <a href={`tel:${venue.contact_phone}`} style={{ ...cbtn, border: `1px solid ${accent.border}`, background: 'transparent', color: accent.hex }}>📞 Call</a>}
            {venue.contact_email && <a href={`mailto:${venue.contact_email}`} style={{ ...cbtn, border: `1px solid ${accent.border}`, background: 'transparent', color: accent.hex }}>✉️ Email</a>}
            <button onClick={onRequest} style={{ ...cbtn, border: 0, background: accent.hex, color: T.btnText }}>🎾 Request courts</button>
          </div>
        </div>
      )}

      {/* Facilities */}
      {facilities.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
          {facilities.map(f => <span key={f} style={{ fontSize: 10.5, color: T.text2, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 999, padding: '3px 9px' }}>{f}</span>)}
        </div>
      )}
      {venue.access_note && <div style={{ fontSize: 11, color: T.text3, marginTop: 8 }}>🛈 {venue.access_note}</div>}

      {/* Courts */}
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Courts · {courts.length}</div>
        {courts.length === 0 ? <div style={{ fontSize: 11.5, color: T.text3 }}>No courts added for this venue yet (add them in Settings → Venues).</div> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
            {courts.map(c => {
              const s = courtState(c)
              return (
                <div key={c.id} style={{ background: `${s.colour}14`, border: `1px solid ${s.colour}`, borderLeft: `3px solid ${s.colour}`, borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{c.name}</span>
                  </div>
                  <div style={{ fontSize: 9.5, color: T.text3 }}>{[c.surface, c.notes].filter(Boolean).join(' · ') || '—'}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: s.colour, marginTop: 4 }}>{s.label}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Coaches based here */}
      <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Coaches based here · {coaches.length}</div>
        {coaches.length === 0 ? <div style={{ fontSize: 11.5, color: T.text3 }}>No coaches based here yet.</div> : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {coaches.map(co => (
              <span key={co.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: T.text2, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 999, padding: '3px 9px' }}>
                <span style={{ width: 18, height: 18, borderRadius: '50%', background: accent.dim, color: accent.hex, display: 'grid', placeItems: 'center', fontSize: 8.5, fontWeight: 700 }}>{initials(co.name)}</span>{co.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Pre-written court-request email (date + time → mailto), like the demo.
function RequestCourtsModal({ T, accent, venue, onClose }: { T: ThemeTokens; accent: AccentTokens; venue: Venue; onClose: () => void }) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const field: CSSProperties = { background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 9, padding: '9px 11px', fontSize: 13, fontFamily: FONT, outline: 'none' }
  const send = () => {
    const when = [date && new Date(date).toLocaleDateString('en-GB'), time].filter(Boolean).join(' at ') || 'a date that suits'
    const subject = `Court request — ${venue.name}`
    const body = `Hi ${venue.contact_name || 'there'},\n\nI'd like to request court time at ${venue.name} on ${when}.\n\nPlease let me know what's available.\n\nMany thanks,`
    window.open(`mailto:${venue.contact_email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
    onClose()
  }
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, fontFamily: FONT, padding: 16 }}>
      <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, width: 380, maxWidth: '100%' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Request courts</div>
        <div style={{ fontSize: 12, color: T.text3, margin: '4px 0 14px' }}>{venue.name}{venue.contact_email ? ` · ${venue.contact_email}` : ''}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ fontSize: 11, color: T.text3, fontWeight: 600 }}>When would you like the courts?</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...field, flex: 1 }} />
            <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ ...field, flex: 1 }} />
          </div>
        </div>
        <div style={{ fontSize: 10.5, color: T.text3, marginTop: 10 }}>Opens your email to {venue.contact_email || 'the venue'} with the request pre-written.</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button onClick={onClose} style={{ appearance: 'none', padding: '8px 14px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
          <button onClick={send} style={{ appearance: 'none', border: 0, padding: '8px 16px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>Send email →</button>
        </div>
      </div>
    </div>
  )
}
