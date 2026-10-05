'use client'

// Live Court Planner — the venue-centric view: every site the coach works across,
// its contact + facilities, the courts there, and the coach's own confirmed
// lessons at that venue today (no third-party booking feed in v1). Coaches based
// at each venue come from coach_staff.home_venue. Venues/courts are managed in
// Settings → Venues (no Add-venue button here, by design).

import { useState, useEffect, useRef, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { useCoachTable, useCoachProfile, sb, currentIdentity, type CoachIdentity } from '../_lib/coach-db'
import { getSettings } from '../_lib/settings-store'
import { ukDate, ukTime } from '@/lib/coach/uk-date'
import { useAskBeforeClose } from '../_lib/ask-before-close'

type Venue = { id: string; name: string; address?: string | null; contact_name?: string | null; contact_phone?: string | null; contact_email?: string | null; facilities?: string | null; access_note?: string | null; is_home?: boolean | null }
type Court = { id: string; venue_id?: string | null; name: string; surface?: string | null; status?: string | null; notes?: string | null }
type Booking = { id: string; title?: string | null; player_name?: string | null; court?: string | null; court_id?: string | null; venue_id?: string | null; staff_id?: string | null; assigned_coach?: string | null; booking_date?: string | null; start_time?: string | null; duration_min?: number | null; status?: string | null; type?: string | null }
type Staff = { id: string; name: string; role?: string | null; home_venue?: string | null; is_head?: boolean | null }

// Today in the UK (ukDate), not the UTC date: between midnight and 1am in
// summer the UTC date is still yesterday, and the planner showed yesterday's
// lessons.
const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map(w => Array.from(w)[0]?.toUpperCase()).join('') || '?'
const toMins = (t?: string | null) => { if (!t) return null; const m = t.match(/(\d{1,2})\s*:\s*(\d{2})/) || t.match(/^(\d{1,2})(\d{2})$/); return m ? Math.min(23, +m[1]) * 60 + Math.min(59, +m[2]) : null }
const hhmm = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
const lc = (x?: string | null) => (x || '').trim().toLowerCase()

// "Settings → Venues" has to land on Venues & courts, not at the top of the
// Settings page — SettingsPanel opens the panel named here.
function openVenueSettings(onNavigate?: (s: string) => void) {
  try { sessionStorage.setItem('lumio_open_settings', 'venuescfg') } catch { /* ignore */ }
  onNavigate?.('settings')
}

export function LiveCourtPlanner({ T, accent, onNavigate }: { T: ThemeTokens; accent: AccentTokens; onNavigate?: (s: string) => void }) {
  const { rows: venues } = useCoachTable<Venue>('coach_venues')
  const { rows: courts } = useCoachTable<Court>('coach_courts')
  const { rows: bookings } = useCoachTable<Booking>('coach_bookings')
  const { rows: staff } = useCoachTable<Staff>('coach_staff')
  const [reqVenue, setReqVenue] = useState<Venue | null>(null)

  // Venue assignment (migration 169). Two things hang off it:
  //   · which venue cards an assistant coach sees at all
  //   · which coaches are listed on each card
  // Both used to key off coach_staff.home_venue — a single venue, matched by
  // NAME. A coach working two sites could only ever appear at one of them.
  const [links, setLinks] = useState<{ staff_id: string; venue_id: string }[] | null>(null)
  const [me, setMe] = useState<CoachIdentity | null | undefined>(undefined)
  useEffect(() => {
    let alive = true
    ;(async () => {
      const [who, { data }] = await Promise.all([
        currentIdentity(),
        sb().from('coach_staff_venues').select('staff_id, venue_id'),
      ])
      if (!alive) return
      setMe(who); setLinks(data || [])
    })()
    return () => { alive = false }
  }, [])

  const coachesAt = (venueId: string) => {
    const ids = new Set((links || []).filter(l => l.venue_id === venueId).map(l => l.staff_id))
    return staff.filter(s => ids.has(s.id))
  }

  // ── The head coach is based at their own home base ──────────────────────────
  // Onboarding asks for a home court and writes coach_venues.is_home, but it
  // never wrote the assignment row that says WHO works there — so the head coach
  // set up their academy, opened the Court Planner and read "No coaches based
  // here yet" about the club they run. Assistants got assigned on the Coaches
  // page; the head never went through that form because they were never added
  // by anyone.
  //
  // Rather than only fixing the wizard (which does nothing for an academy that
  // has already onboarded — Pete's, for one), the link is written the first time
  // the head opens this page and finds it missing. coach_id must be the signed-in
  // user's own id: the RLS check on coach_staff_venues is literally
  // `coach_id = auth.uid()`.
  const headStaff = staff.find(st => st.is_head) || null
  const homeVenue = venues.find(v => v.is_home) || null
  const healed = useRef(false)
  useEffect(() => {
    if (healed.current || !me?.isHead || !links || !headStaff || !homeVenue) return
    if (links.some(l => l.staff_id === headStaff.id && l.venue_id === homeVenue.id)) return
    healed.current = true
    ;(async () => {
      const { data: authData } = await sb().auth.getUser()
      const uid = authData.user?.id
      if (!uid) return
      const { error } = await sb().from('coach_staff_venues')
        .insert({ coach_id: uid, staff_id: headStaff.id, venue_id: homeVenue.id, is_primary: true })
      if (error) { console.error('[court-planner] could not assign the head coach to the home base', error); return }
      setLinks(prev => [...(prev || []), { staff_id: headStaff.id, venue_id: homeVenue.id }])
      // Keep the name-string copy in step, because the Coaches page still shows it.
      if (!(headStaff.home_venue || '').trim()) {
        await sb().from('coach_staff').update({ home_venue: homeVenue.name }).eq('id', headStaff.id)
      }
    })()
  }, [me, links, headStaff, homeVenue])

  // A head coach sees every site. An assistant sees the ones they work at —
  // anything else would be a card with no courts under it, because RLS has
  // already withheld those courts.
  const mine = me && !me.isHead && links
    ? venues.filter(v => (links || []).some(l => l.venue_id === v.id && l.staff_id === me.staffId))
    : venues
  const unassigned = !!me && !me.isHead && !!links && mine.length === 0 && venues.length > 0

  const sectOff = getSettings().sectionsOff?.venues || []
  const showSec = (k: string) => !sectOff.includes(k)

  const today = ukDate()
  const todaysBookings = bookings.filter(b => b.booking_date === today && b.status !== 'cancelled')
  // "Your lessons": the ones this coach is taking. A head coach's list holds the
  // whole academy's bookings, so the tile was counting everyone's. An unassigned
  // booking is the head coach's (the same rule as the Coaches page).
  const isMine = (b: Booking) => b.staff_id ? b.staff_id === me?.staffId : !!me?.isHead
  const lessonsToday = todaysBookings.filter(isMine).length

  // ── Which court a booking is on ─────────────────────────────────────────────
  // By the court's id, which the booking form now records. A lesson used to be
  // matched on the court's NAME alone, so one booking on "Court 1" lit up every
  // court called "Court 1" at every venue. Bookings made before the id existed
  // (and ones where the court was typed by hand) are placed by venue + name,
  // or by name when only one court in the academy has it; a name shared by two
  // venues with nothing to say which goes to the home venue, never to both.
  const placed = courts.filter(c => !!c.venue_id)
  const courtOf = (b: Booking): Court | null => {
    if (b.court_id) return placed.find(c => c.id === b.court_id) || null
    const named = lc(b.court) ? placed.filter(c => lc(c.name) === lc(b.court)) : []
    if (b.venue_id) return named.find(c => c.venue_id === b.venue_id) || null
    if (named.length <= 1) return named[0] || null
    return named.find(c => c.venue_id === homeVenue?.id) || null
  }
  const lessonsOn = (court: Court) => todaysBookings.filter(b => courtOf(b)?.id === court.id)

  // Only courts on the venue cards below are counted. A court whose venue was
  // deleted is on no card, and used to make this number larger than what the
  // coach could see.
  const shownIds = new Set(mine.map(v => v.id))
  const tiles = [
    { label: 'Sites', value: mine.length },
    { label: 'Courts total', value: courts.filter(c => !!c.venue_id && shownIds.has(c.venue_id)).length },
    { label: 'Your lessons today', value: lessonsToday },
    { label: 'Coaches', value: staff.length },
  ]

  return (
    <div style={{ fontFamily: FONT }}>
      <div style={{ marginBottom: 14 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.text }}>Court Planner</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: T.text3 }}>The sites you coach across — contacts, facilities and your lessons. Manage venues &amp; courts in <button onClick={() => openVenueSettings(onNavigate)} style={{ appearance: 'none', border: 0, background: 'transparent', color: accent.hex, fontWeight: 600, cursor: 'pointer', padding: 0, fontSize: 13, fontFamily: FONT }}>Settings → Venues</button>. (Customer bookings live in the Booking Calendar.)</p>
      </div>

      {/* Stats */}
      <div style={{ display: showSec('stats') ? 'grid' : 'none', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
        {tiles.map(t => (
          <div key={t.label} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{t.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: accent.hex, marginTop: 4 }}>{t.value}</div>
          </div>
        ))}
      </div>

      {unassigned ? (
        // Says the true thing. "No venues yet" would be a lie an assistant coach
        // cannot act on — the venues exist, they are just not assigned to any.
        <div style={{ textAlign: 'center', padding: '48px 20px', background: T.panel, border: `1px dashed ${T.border}`, borderRadius: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>You&rsquo;re not assigned to a venue yet</div>
          <div style={{ fontSize: 12.5, color: T.text3, marginTop: 4, lineHeight: 1.6 }}>Your head coach sets which sites you work at, and the courts here follow from that.<br />Ask them to add you on the Coaches page and it&rsquo;ll appear straight away.</div>
        </div>
      ) : mine.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', background: T.panel, border: `1px dashed ${T.border}`, borderRadius: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>No venues yet</div>
          <div style={{ fontSize: 12.5, color: T.text3, marginTop: 4 }}>Add the sites you coach across in <button onClick={() => openVenueSettings(onNavigate)} style={{ appearance: 'none', border: 0, background: 'transparent', color: accent.hex, fontWeight: 600, cursor: 'pointer', padding: 0, fontSize: 12.5, fontFamily: FONT }}>Settings → Venues</button>.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', gap: 16 }}>
          {mine.map(v => (
            <VenueCard key={v.id} T={T} accent={accent} venue={v} showSec={showSec}
              courts={courts.filter(c => c.venue_id === v.id)}
              lessonsOn={lessonsOn} isMine={isMine}
              coaches={coachesAt(v.id)}
              onRequest={() => setReqVenue(v)} />
          ))}
        </div>
      )}

      {/* Legend */}
      <div style={{ display: showSec('legend') ? 'flex' : 'none', gap: 14, marginTop: 14, flexWrap: 'wrap', fontSize: 11, color: T.text3 }}>
        {[['Free', T.good], ['Your lesson', accent.hex], ['Booked', T.warn], ['Maintenance', T.bad]].map(([l, c]) => (
          <span key={l as string} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: c as string }} />{l}</span>
        ))}
      </div>

      {reqVenue && <RequestCourtsModal T={T} accent={accent} venue={reqVenue} onClose={() => setReqVenue(null)} />}
    </div>
  )
}

function VenueCard({ T, accent, venue, courts, lessonsOn, isMine, coaches, onRequest, showSec }: {
  T: ThemeTokens; accent: AccentTokens; venue: Venue; courts: Court[]
  lessonsOn: (c: Court) => Booking[]; isMine: (b: Booking) => boolean
  coaches: Staff[]; onRequest: () => void; showSec: (k: string) => boolean
}) {
  const facilities = (venue.facilities || '').split(',').map(s => s.trim()).filter(Boolean)
  // What a court is doing NOW. A lesson colours the court only while it is on;
  // one later today is named underneath ("Next: 19:00"), and one that has ended
  // is not shown at all. It used to read "Your lesson" from midnight for a
  // lesson at seven in the evening.
  const nowT = toMins(ukTime()) ?? 0
  const courtState = (court: Court): { label: string; colour: string; next?: string } => {
    const timed = lessonsOn(court)
      .map(b => { const s = toMins(b.start_time); return s == null ? null : { b, s, e: s + (b.duration_min || 60) } })
      .filter(Boolean) as { b: Booking; s: number; e: number }[]
    timed.sort((a, b) => a.s - b.s)
    const on = timed.find(x => x.s <= nowT && nowT < x.e)
    const later = timed.find(x => x.s > nowT)
    const whose = (b: Booking) => isMine(b) ? 'Your lesson' : `${b.assigned_coach || 'Another coach'}’s lesson`
    const next = later ? `Next: ${whose(later.b).replace(/^Your lesson$/, 'your lesson')} ${hhmm(later.s)}–${hhmm(later.e)}` : undefined
    if (on) return { label: `${whose(on.b)} · until ${hhmm(on.e)}`, colour: isMine(on.b) ? accent.hex : T.warn, next }
    const st = (court.status || 'free').toLowerCase()
    if (st.includes('book')) return { label: 'Booked', colour: T.warn, next }
    if (st.includes('maint')) return { label: 'Maintenance', colour: T.bad, next }
    return { label: 'Free', colour: T.good, next }
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
            {venue.contact_phone && <a href={`tel:${venue.contact_phone}`} style={{ ...cbtn, minHeight: 38, boxSizing: 'border-box', border: `1px solid ${accent.border}`, background: 'transparent', color: accent.hex }}>📞 Call</a>}
            {venue.contact_email && <a href={`mailto:${venue.contact_email}`} style={{ ...cbtn, minHeight: 38, boxSizing: 'border-box', border: `1px solid ${accent.border}`, background: 'transparent', color: accent.hex }}>✉️ Email</a>}
            <button onClick={onRequest} style={{ ...cbtn, minHeight: 38, border: 0, background: accent.hex, color: T.btnText }}>🎾 Request courts</button>
          </div>
        </div>
      )}

      {/* Facilities */}
      {showSec('facilities') && facilities.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
          {facilities.map(f => <span key={f} style={{ fontSize: 10.5, color: T.text2, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 999, padding: '3px 9px' }}>{f}</span>)}
        </div>
      )}
      {venue.access_note && <div style={{ fontSize: 11, color: T.text3, marginTop: 8 }}>🛈 {venue.access_note}</div>}

      {/* Courts */}
      <div style={{ display: showSec('courts') ? undefined : 'none', marginTop: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Courts · {courts.length}</div>
        {courts.length === 0 ? <div style={{ fontSize: 11.5, color: T.text3 }}>No courts added for this venue yet (add them in Settings → Venues).</div> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
            {courts.map(c => {
              const s = courtState(c)
              return (
                <div key={c.id} style={{ background: `${s.colour}14`, border: `1px solid ${s.colour}`, borderLeft: `3px solid ${s.colour}`, borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{c.name}</span>
                  </div>
                  <div style={{ fontSize: 9.5, color: T.text3 }}>{[c.surface, c.notes].filter(Boolean).join(' · ') || '—'}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: s.colour, marginTop: 4 }}>{s.label}</div>
                  {s.next && <div style={{ fontSize: 9.5, color: T.text3, marginTop: 2 }}>{s.next}</div>}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Coaches based here */}
      <div style={{ display: showSec('coaches') ? undefined : 'none', marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
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
  const profile = useCoachProfile()
  const closeOutside = useAskBeforeClose(JSON.stringify([date, time]), onClose)
  const field: CSSProperties = { minWidth: 0, background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 9, padding: '9px 11px', fontSize: 13, fontFamily: FONT, outline: 'none' }
  const send = () => {
    const when = [date && new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), time].filter(Boolean).join(' at ') || 'a date that suits'
    const subject = `Court request — ${venue.name}`
    // Signed. The email used to end "Many thanks," and nothing after it.
    const from = [profile.display_name, profile.brand_name].filter(Boolean).join('\n')
    const body = `Hi ${venue.contact_name || 'there'},\n\nI'd like to request court time at ${venue.name} on ${when}.\n\nPlease let me know what's available.\n\nMany thanks,${from ? `\n${from}` : ''}`
    window.open(`mailto:${venue.contact_email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
    onClose()
  }
  return (
    <div onClick={e => { if (e.target === e.currentTarget) closeOutside() }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, fontFamily: FONT, padding: 16 }}>
      <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, width: 380, maxWidth: '100%', boxSizing: 'border-box' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Request courts</div>
        <div style={{ fontSize: 12, color: T.text3, margin: '4px 0 14px' }}>{venue.name}{venue.contact_email ? ` · ${venue.contact_email}` : ''}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ fontSize: 11, color: T.text3, fontWeight: 600 }}>When would you like the courts?</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input type="date" aria-label="Date" value={date} onChange={e => setDate(e.target.value)} style={{ ...field, flex: '1 1 130px' }} />
            <input type="time" aria-label="Time" value={time} onChange={e => setTime(e.target.value)} style={{ ...field, flex: '1 1 110px' }} />
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
