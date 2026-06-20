'use client'

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { VENUES, type CourtStatus, type Venue } from '../_lib/coach-data'
import { getAddedVenues, subscribe as subscribeVenues } from '../_lib/venues-store'
import { COACHES, type Coach } from '../_lib/coaches-data'
import { getAddedCoaches, subscribe as subscribeCoaches } from '../_lib/coaches-store'
import { useCoachSettings } from '../_lib/use-settings'
import { setSettings } from '../_lib/settings-store'
import { AddVenueModal } from './AddVenueModal'

type Common = { T: ThemeTokens; accent: AccentTokens; density: Density }

function Card({ T, density, children, style }: { T: ThemeTokens; density: Density; children: ReactNode; style?: CSSProperties }) {
  return <div style={{ position: 'relative', background: T.panel, border: `1px solid ${T.border}`, borderRadius: density.radius, padding: density.pad, boxShadow: T.cardShadow, ...style }}>{children}</div>
}

export function CourtPlannerView({ T, accent, density }: Common) {
  const s = useCoachSettings()
  const statusColour = (st: CourtStatus) => st === 'free' ? T.good : st === 'lesson' ? accent.hex : st === 'booked' ? T.warn : T.bad
  const statusLabel = (st: CourtStatus) => st === 'free' ? 'Free' : st === 'lesson' ? 'Your lesson' : st === 'booked' ? 'Booked' : 'Maintenance'

  const [addedVenues, setAddedVenues] = useState<Venue[]>([])
  const [addedCoaches, setAddedCoaches] = useState<Coach[]>([])
  const [addOpen, setAddOpen] = useState(false)
  const [req, setReq] = useState<{ venueId: string; date: string; time: string } | null>(null)
  useEffect(() => { const r = () => setAddedVenues(getAddedVenues()); r(); return subscribeVenues(r) }, [])
  useEffect(() => { const r = () => setAddedCoaches(getAddedCoaches()); r(); return subscribeCoaches(r) }, [])

  const venues = [...VENUES, ...addedVenues]
  const allCoaches = [...COACHES, ...addedCoaches]
  const synced = (id: string) => (s.syncedVenues || []).includes(id)
  const isPrimary = (v: Venue) => s.primaryVenueId ? v.id === s.primaryVenueId : !!v.primary
  const setHome = (id: string) => setSettings({ primaryVenueId: id })
  const toggleSync = (id: string) => setSettings({ syncedVenues: synced(id) ? (s.syncedVenues || []).filter(x => x !== id) : [...new Set([...(s.syncedVenues || []), id])] })

  // Summary: free courts only counted at calendar-synced sites.
  const syncedCourts = venues.filter(v => synced(v.id)).flatMap(v => v.courts)
  const freeNow = syncedCourts.filter(c => c.status === 'free').length
  const yours = venues.flatMap(v => v.courts).filter(c => c.status === 'lesson').length

  const sendBooking = (v: Venue) => {
    const when = [req?.date, req?.time].filter(Boolean).join(' at ') || 'a date and time to confirm'
    const subject = `Court booking request — ${s.coach}`
    const body = `Hi ${v.manager},\n\nCould I book a court at ${v.name} on ${when}?\n\nMany thanks,\n${s.coach}\n${s.academy}`
    if (typeof window !== 'undefined') window.location.href = `mailto:${v.managerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    setReq(null)
  }

  const btn = (color: string, fill = false): CSSProperties => ({ appearance: 'none', cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, padding: '6px 11px', borderRadius: 8, border: `1px solid ${color}`, background: fill ? color : 'transparent', color: fill ? T.btnText : color })
  const miniInput: CSSProperties = { background: T.panel, border: `1px solid ${T.border}`, borderRadius: 7, color: T.text, fontSize: 12, padding: '6px 8px', outline: 'none' }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: FONT, fontSize: 24, fontWeight: 600, color: T.text, letterSpacing: '-0.02em' }}>Court Planner</h1>
          <p style={{ margin: '4px 0 0', fontSize: 12.5, color: T.text3 }}>The sites you coach across — contacts, facilities and live court availability. (Customer bookings live in the Booking Calendar.)</p>
        </div>
        <button onClick={() => setAddOpen(true)} style={{ marginLeft: 'auto', appearance: 'none', border: 0, padding: '8px 14px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 12.5, fontWeight: 600, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <Icon name="plus" size={14} stroke={2} /> Add venue
        </button>
      </div>

      {/* summary */}
      <div style={{ display: 'flex', gap: density.gap, marginBottom: density.gap, flexWrap: 'wrap' }}>
        {[
          { l: 'Sites', v: venues.length, c: T.text },
          { l: 'Courts total', v: venues.flatMap(x => x.courts).length, c: T.text },
          { l: 'Free now (synced)', v: freeNow, c: T.good },
          { l: 'Your lessons on', v: yours, c: accent.hex },
        ].map((m, i) => (
          <Card key={i} T={T} density={density} style={{ flex: '1 1 140px' }}>
            <div style={{ fontSize: 10.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m.l}</div>
            <div className="tnum" style={{ fontSize: 24, fontWeight: 500, color: m.c, marginTop: 4 }}>{m.v}</div>
          </Card>
        ))}
      </div>

      {/* venues */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: density.gap }} className="cm-venues">
        {venues.map(v => {
          const home = isPrimary(v)
          const isSynced = synced(v.id)
          const freeHere = v.courts.filter(c => c.status === 'free').length
          const siteCoaches = allCoaches.filter(c => c.homeVenue === v.name)
          const reqOpen = req?.venueId === v.id
          return (
          <Card key={v.id} T={T} density={density}>
            {/* header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 9, display: 'grid', placeItems: 'center', background: accent.dim, flexShrink: 0 }}>
                <Icon name="pin" size={18} stroke={1.7} style={{ color: accent.hex }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14.5, fontWeight: 600, color: T.text }}>{v.name}</span>
                  {home
                    ? <span style={{ fontSize: 8.5, fontWeight: 700, color: accent.hex, background: accent.dim, padding: '1px 6px', borderRadius: 4, letterSpacing: '0.05em' }}>HOME BASE</span>
                    : <button onClick={() => setHome(v.id)} style={{ ...btn(T.border), padding: '2px 8px', fontSize: 9.5, color: T.text3 }}>Set as home base</button>}
                </div>
                <div style={{ fontSize: 11, color: T.text3 }}>{v.type} · {v.distance}</div>
                <div style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>{v.address}</div>
              </div>
            </div>

            {/* contact + actions */}
            <div style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 11px', marginBottom: 12 }}>
              <div style={{ fontSize: 9.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Site contact</div>
              <div style={{ fontSize: 12.5, color: T.text, fontWeight: 600, marginTop: 2 }}>{v.manager}</div>
              <div style={{ display: 'flex', gap: 7, marginTop: 8, flexWrap: 'wrap' }}>
                <a href={`tel:${v.managerPhone.replace(/\s/g, '')}`} style={btn(accent.hex)}><Icon name="phone" size={12} stroke={1.9} /> Call</a>
                <a href={`mailto:${v.managerEmail}`} style={btn(accent.hex)}><Icon name="megaphone" size={12} stroke={1.9} /> Email</a>
                <button onClick={() => setReq(reqOpen ? null : { venueId: v.id, date: '', time: '' })} style={btn(accent.hex, !reqOpen)}><Icon name="calendar" size={12} stroke={1.9} /> Request courts</button>
              </div>
              {reqOpen && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 11, color: T.text3, marginBottom: 6 }}>When would you like the courts?</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <input type="date" value={req?.date ?? ''} onChange={e => setReq(r => r ? { ...r, date: e.target.value } : r)} style={miniInput} />
                    <input type="time" value={req?.time ?? ''} onChange={e => setReq(r => r ? { ...r, time: e.target.value } : r)} style={miniInput} />
                    <button onClick={() => sendBooking(v)} style={btn(accent.hex, true)}>Send email →</button>
                  </div>
                  <div style={{ fontSize: 10, color: T.text3, marginTop: 6 }}>Opens your email to {v.managerEmail} with the request pre-written.</div>
                </div>
              )}
            </div>

            {/* facilities */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
              {v.facilities.map((f, i) => <span key={i} style={{ fontSize: 10.5, color: T.text2, padding: '3px 8px', borderRadius: 6, background: T.hover, border: `1px solid ${T.border}` }}>{f}</span>)}
            </div>

            {/* access */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 11, color: T.text3, marginBottom: 12 }}>
              <Icon name="shield" size={12} stroke={1.7} style={{ color: T.text3, flexShrink: 0, marginTop: 1 }} />
              <span>{v.access}</span>
            </div>

            {/* court status — gated on calendar sync */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {isSynced ? <>Courts today · {freeHere} free</> : 'Court availability'}
              </div>
              <button onClick={() => toggleSync(v.id)} style={{ ...btn(isSynced ? T.good : T.border), marginLeft: 'auto', padding: '3px 9px', fontSize: 10, color: isSynced ? T.good : T.text3 }}>
                {isSynced ? '✓ Calendar synced' : 'Connect calendar'}
              </button>
            </div>
            {isSynced ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 7 }}>
                {v.courts.length === 0 && <div style={{ fontSize: 11, color: T.text3 }}>No courts on file yet.</div>}
                {v.courts.map((c, i) => {
                  const col = statusColour(c.status)
                  return (
                    <div key={i} style={{ background: `${col}14`, border: `1px solid ${col}55`, borderLeft: `3px solid ${col}`, borderRadius: 7, padding: '7px 9px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{c.name}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 8.5, fontWeight: 700, color: col, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{statusLabel(c.status)}</span>
                      </div>
                      <div style={{ fontSize: 9.5, color: T.text3, marginTop: 2 }}>{c.surface}{c.indoor ? ' · indoor' : ''}{c.lights ? ' · lights' : ''}</div>
                      {(c.until || c.who) && <div style={{ fontSize: 9.5, color: T.text3, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.who}{c.until ? ` · til ${c.until}` : ''}</div>}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ border: `1px dashed ${T.border}`, borderRadius: 8, padding: '12px 14px', fontSize: 11.5, color: T.text3, lineHeight: 1.5 }}>
                Connect this site&apos;s calendar to see which courts are free in real time. <button onClick={() => toggleSync(v.id)} style={{ appearance: 'none', border: 0, background: 'transparent', color: accent.hex, fontWeight: 700, cursor: 'pointer', padding: 0 }}>Connect calendar →</button>
              </div>
            )}

            {/* coaches based here */}
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 9.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Coaches based here · {siteCoaches.length}</div>
              {siteCoaches.length ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {siteCoaches.map(c => (
                    <span key={c.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: T.text2, padding: '3px 8px', borderRadius: 999, background: T.hover, border: `1px solid ${T.border}` }}>
                      <span style={{ width: 18, height: 18, borderRadius: '50%', display: 'grid', placeItems: 'center', background: accent.dim, color: accent.hex, fontSize: 8.5, fontWeight: 700 }}>{c.initials}</span>{c.name}
                    </span>
                  ))}
                </div>
              ) : <div style={{ fontSize: 11, color: T.text3 }}>No coaches based here yet.</div>}
            </div>
          </Card>
          )
        })}
      </div>

      {/* legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 14, flexWrap: 'wrap', fontSize: 10.5, color: T.text3 }}>
        {(['free', 'lesson', 'booked', 'maintenance'] as CourtStatus[]).map(st => (
          <span key={st} style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: statusColour(st) }} />{statusLabel(st)}</span>
        ))}
      </div>

      {addOpen && <AddVenueModal T={T} accent={accent} density={density} onClose={() => setAddOpen(false)} />}
    </div>
  )
}
