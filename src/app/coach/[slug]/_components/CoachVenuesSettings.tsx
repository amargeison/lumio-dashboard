'use client'

// Settings → Venues. Where coaches add the sites they work across (the Court
// Planner is the read/contact view; this is the management). Add/edit/delete a
// venue, manage its courts, and set the home base.

import { useState, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { useCoachTable, sb } from '../_lib/coach-db'
import { ukDate } from '@/lib/coach/uk-date'
import { useAskBeforeClose } from '../_lib/ask-before-close'

type Venue = { id: string; name: string; address?: string | null; contact_name?: string | null; contact_phone?: string | null; contact_email?: string | null; facilities?: string | null; access_note?: string | null; is_home?: boolean | null }
type Court = { id: string; venue_id?: string | null; name: string; surface?: string | null; status?: string | null }
type BookingLite = { id: string; venue_id?: string | null; court_id?: string | null; booking_date?: string | null; status?: string | null }
const STATUSES = ['Free', 'Booked', 'Maintenance']
const lc = (x?: string | null) => (x || '').trim().toLowerCase()
const n = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`

export function CoachVenuesSettings({ T, accent, addNew }: { T: ThemeTokens; accent: AccentTokens; /** Open straight on the add-venue form (the checklist's "Add it"). */ addNew?: boolean }) {
  const venues = useCoachTable<Venue>('coach_venues')
  const courts = useCoachTable<Court>('coach_courts')
  const bookings = useCoachTable<BookingLite>('coach_bookings')
  const [editing, setEditing] = useState<Venue | 'new' | null>(addNew ? 'new' : null)
  const [msg, setMsg] = useState('')

  // Upcoming bookings that would be affected, so a delete can say so first.
  const upcomingAt = (test: (b: BookingLite) => boolean) => {
    const today = ukDate()
    return bookings.rows.filter(b => b.status !== 'cancelled' && (b.booking_date || '') >= today && test(b)).length
  }

  // ONE home base. Making a venue the home takes the flag off the others first
  // — "Set as home" and the form's tick-box both only ever switched it ON, so an
  // academy could end up with three. (The database now enforces the same rule,
  // migration 198; this keeps the screen right even before that has run.)
  const makeHome = async (id: string) => {
    for (const o of venues.rows) if (o.is_home && o.id !== id) await venues.edit(o.id, { is_home: false })
  }
  const setHome = async (v: Venue) => {
    setMsg('')
    try { await makeHome(v.id); await venues.edit(v.id, { is_home: true }) }
    catch { setMsg('The home base could not be changed. Please try again.'); venues.reload() }
  }

  // Deleting a venue takes its courts with it and un-assigns the coaches based
  // there — so it says exactly that, with the numbers, before anything happens.
  // The prompt used to be only "Delete <name>?", and the courts were left behind
  // with no venue: shown nowhere, impossible to remove, and still counted.
  const deleteVenue = async (v: Venue) => {
    setMsg('')
    const own = courts.rows.filter(c => c.venue_id === v.id)
    const ownIds = new Set(own.map(c => c.id))
    let coaches = 0
    try {
      const { data } = await sb().from('coach_staff_venues').select('staff_id').eq('venue_id', v.id)
      coaches = (data || []).length
    } catch { /* the count is for the warning only */ }
    const booked = upcomingAt(b => b.venue_id === v.id || (!!b.court_id && ownIds.has(b.court_id)))
    const lines = [
      own.length ? `• ${n(own.length, 'court')} at this venue will be deleted` : '',
      coaches ? `• ${n(coaches, 'coach', 'coaches')} will no longer be assigned here` : '',
      booked ? `• ${n(booked, 'upcoming booking')} here will keep ${booked === 1 ? 'its' : 'their'} court name but lose the venue` : '',
    ].filter(Boolean)
    if (!confirm(`Delete ${v.name}?${lines.length ? `\n\n${lines.join('\n')}` : ''}\n\nThis cannot be undone.`)) return
    try {
      // Courts first, then the venue — so nothing is left without a venue even
      // on a database where migration 198 (courts go with their venue) has not run.
      for (const c of own) await courts.remove(c.id)
      await venues.remove(v.id)
    } catch { setMsg(`${v.name} could not be deleted. Please try again.`); venues.reload(); courts.reload() }
  }

  const card: CSSProperties = { background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18, marginBottom: 16, fontFamily: FONT }

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.text }}>Venues</h3>
        <span style={{ fontSize: 11.5, color: T.text3 }}>The sites you coach across — these power the Court Planner.</span>
        <button onClick={() => setEditing('new')} style={{ marginLeft: 'auto', appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 9, padding: '8px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>+ Add venue</button>
      </div>

      {msg && <div role="alert" style={{ fontSize: 12, color: T.bad, marginBottom: 10 }}>{msg}</div>}
      {venues.rows.length === 0 ? (
        <div style={{ fontSize: 12.5, color: T.text3, padding: '8px 0' }}>No venues yet. Add the first site you coach at.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {venues.rows.map(v => (
            <div key={v.id} style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>{v.name}</span>
                {v.is_home && <span style={{ fontSize: 9, fontWeight: 700, color: accent.hex, background: accent.dim, padding: '2px 7px', borderRadius: 5, textTransform: 'uppercase' }}>Home base</span>}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {!v.is_home && <button onClick={() => setHome(v)} style={ghost(T)}>Set as home</button>}
                  <button onClick={() => setEditing(v)} style={ghost(T)}>Edit</button>
                  <button onClick={() => deleteVenue(v)} style={{ ...ghost(T), color: T.bad }}>Delete</button>
                </div>
              </div>
              {v.address && <div style={{ fontSize: 11.5, color: T.text3, marginTop: 2 }}>{v.address}</div>}
              {(v.contact_name || v.contact_email || v.contact_phone) && <div style={{ fontSize: 11, color: T.text3, marginTop: 4 }}>{[v.contact_name, v.contact_phone, v.contact_email].filter(Boolean).join(' · ')}</div>}
              <CourtManager T={T} accent={accent} venue={v} courts={courts.rows.filter(c => c.venue_id === v.id)} add={courts.add} edit={courts.edit} remove={courts.remove}
                bookedOn={courtId => upcomingAt(b => b.court_id === courtId)} />
            </div>
          ))}
        </div>
      )}

      {editing && <VenueForm T={T} accent={accent} venue={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)}
        onSave={async (vals) => {
          // Ticking "home base" here moves it, like the button does.
          if (vals.is_home) await makeHome(editing === 'new' ? '' : editing.id)
          if (editing === 'new') await venues.add(vals); else await venues.edit(editing.id, vals)
          setEditing(null)
        }} />}
    </div>
  )
}

function ghost(T: ThemeTokens): CSSProperties {
  return { appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 7, padding: '0 10px', minHeight: 36, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }
}

function CourtManager({ T, accent, venue, courts, add, edit, remove, bookedOn }: {
  T: ThemeTokens; accent: AccentTokens; venue: Venue; courts: Court[]
  add: (row: Record<string, any>) => Promise<void>; edit: (id: string, row: Record<string, any>) => Promise<void>; remove: (id: string) => Promise<void>
  /** How many upcoming bookings are on this court. */
  bookedOn: (courtId: string) => number
}) {
  const [name, setName] = useState('')
  const [surface, setSurface] = useState('')
  const [err, setErr] = useState('')
  // The court being renamed, and what has been typed for it.
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null)
  const field: CSSProperties = { minWidth: 0, background: T.panel, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 9px', fontSize: 12, fontFamily: FONT, outline: 'none' }
  // Two courts with the same name at one venue cannot be told apart on a
  // booking or in the Court Planner, so the second is refused.
  const taken = (nm: string, exceptId?: string) => courts.some(c => c.id !== exceptId && lc(c.name) === lc(nm))
  const addCourt = async () => {
    const nm = name.trim()
    if (!nm) return
    if (taken(nm)) { setErr(`${venue.name} already has a court called ${nm}. Give this one a different name.`); return }
    setErr('')
    try { await add({ venue_id: venue.id, name: nm, surface: surface.trim() || null, status: 'Free' }); setName(''); setSurface('') }
    catch { setErr('The court could not be added. Please try again.') }
  }
  const saveRename = async () => {
    if (!renaming) return
    const nm = renaming.name.trim()
    if (!nm) { setErr('Give the court a name.'); return }
    if (taken(nm, renaming.id)) { setErr(`${venue.name} already has a court called ${nm}.`); return }
    setErr('')
    try { await edit(renaming.id, { name: nm }); setRenaming(null) }
    catch { setErr('The court could not be renamed. Please try again.') }
  }
  const removeCourt = async (c: Court) => {
    const booked = bookedOn(c.id)
    const extra = booked ? `\n\n${n(booked, 'upcoming booking')} on it will keep the court name but no longer be linked to this court.` : ''
    if (!confirm(`Delete ${c.name} at ${venue.name}?${extra}`)) return
    setErr('')
    try { await remove(c.id) } catch { setErr('The court could not be deleted. Please try again.') }
  }
  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Courts · {courts.length}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
        {courts.map(c => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {renaming?.id === c.id ? (
              <>
                <input autoFocus aria-label="Court name" value={renaming.name} onChange={e => setRenaming({ id: c.id, name: e.target.value })}
                  onKeyDown={e => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') { setRenaming(null); setErr('') } }}
                  style={{ ...field, flex: 1, minWidth: 110 }} />
                <button onClick={saveRename} style={{ ...ghost(T), color: accent.hex, borderColor: accent.border }}>Save</button>
                <button onClick={() => { setRenaming(null); setErr('') }} style={ghost(T)}>Cancel</button>
              </>
            ) : (
              <>
                <span style={{ fontSize: 12, color: T.text, fontWeight: 600, minWidth: 70 }}>{c.name}</span>
                <span style={{ fontSize: 11, color: T.text3, flex: 1, minWidth: 60 }}>{c.surface || '—'}</span>
                <button onClick={() => { setErr(''); setRenaming({ id: c.id, name: c.name }) }} style={ghost(T)}>Rename</button>
                <select aria-label={`Status of ${c.name}`} value={c.status || 'Free'} onChange={e => edit(c.id, { status: e.target.value })} style={{ ...field, cursor: 'pointer' }}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={() => removeCourt(c)} aria-label={`Delete ${c.name}`} title={`Delete ${c.name}`} style={{ appearance: 'none', border: `1px solid ${T.border}`, borderRadius: 7, background: 'transparent', color: T.text3, cursor: 'pointer', fontSize: 15, width: 36, height: 36, flexShrink: 0 }}>×</button>
              </>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Court name (e.g. Court 1)" style={{ ...field, flex: 1, minWidth: 120 }} />
        <input value={surface} onChange={e => setSurface(e.target.value)} placeholder="Surface (e.g. Hard · lights)" style={{ ...field, flex: 1, minWidth: 120 }} />
        <button onClick={addCourt} style={{ appearance: 'none', border: `1px solid ${accent.border}`, background: accent.dim, color: accent.hex, borderRadius: 8, padding: '0 12px', minHeight: 36, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>+ Add court</button>
      </div>
      {err && <div role="alert" style={{ fontSize: 11.5, color: T.bad, marginTop: 6 }}>{err}</div>}
    </div>
  )
}

function VenueForm({ T, accent, venue, onClose, onSave }: {
  T: ThemeTokens; accent: AccentTokens; venue: Venue | null; onClose: () => void; onSave: (vals: Record<string, any>) => Promise<void>
}) {
  const [name, setName] = useState(venue?.name || '')
  const [address, setAddress] = useState(venue?.address || '')
  const [cName, setCName] = useState(venue?.contact_name || '')
  const [cPhone, setCPhone] = useState(venue?.contact_phone || '')
  const [cEmail, setCEmail] = useState(venue?.contact_email || '')
  const [facilities, setFacilities] = useState(venue?.facilities || '')
  const [access, setAccess] = useState(venue?.access_note || '')
  const [isHome, setIsHome] = useState(!!venue?.is_home)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const closeOutside = useAskBeforeClose(JSON.stringify([name, address, cName, cPhone, cEmail, facilities, access, isHome]), onClose)

  const field: CSSProperties = { width: '100%', minWidth: 0, background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 9, padding: '9px 11px', fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }
  const lbl: CSSProperties = { display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: T.text3, margin: '0 0 5px' }
  const save = async () => {
    if (!name.trim() || saving) return
    // The contact email is what "Request courts" writes to, so it has to be one.
    if (cEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cEmail.trim())) { setErr('That contact email does not look right. Check it, or leave it empty.'); return }
    setSaving(true); setErr('')
    try { await onSave({ name: name.trim(), address, contact_name: cName, contact_phone: cPhone, contact_email: cEmail.trim(), facilities, access_note: access, is_home: isHome }) }
    catch { setErr('The venue could not be saved. Please try again.') }
    finally { setSaving(false) }
  }
  return (
    <div onClick={e => { if (e.target === e.currentTarget) closeOutside() }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, fontFamily: FONT, padding: '4vh 16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 460, boxSizing: 'border-box', background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 14 }}>{venue ? 'Edit venue' : 'Add venue'}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><label style={lbl}>Venue name *</label><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Riverside Tennis Centre" style={field} /></div>
          <div><label style={lbl}>Address</label><input value={address} onChange={e => setAddress(e.target.value)} style={field} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
            <div><label style={lbl}>Contact name</label><input value={cName} onChange={e => setCName(e.target.value)} style={field} /></div>
            <div><label style={lbl}>Contact phone</label><input value={cPhone} onChange={e => setCPhone(e.target.value)} style={field} /></div>
          </div>
          <div><label style={lbl}>Contact email</label><input value={cEmail} onChange={e => setCEmail(e.target.value)} style={field} /></div>
          <div><label style={lbl}>Facilities (comma separated)</label><input value={facilities} onChange={e => setFacilities(e.target.value)} placeholder="Café, Parking, Floodlights" style={field} /></div>
          <div><label style={lbl}>Access note</label><input value={access} onChange={e => setAccess(e.target.value)} placeholder="e.g. Coach fob entry · gate code after 6pm" style={field} /></div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: T.text2, cursor: 'pointer' }}>
            <input type="checkbox" checked={isHome} onChange={e => setIsHome(e.target.checked)} style={{ width: 18, height: 18 }} /> Set as home base
          </label>
          <div style={{ fontSize: 11, color: T.text3, marginTop: -6 }}>You have one home base. Ticking this moves it here from any other venue.</div>
        </div>
        {err && <div role="alert" style={{ fontSize: 12, color: T.bad, marginTop: 12 }}>{err}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
          <button onClick={onClose} style={{ appearance: 'none', padding: '8px 14px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
          <button onClick={save} disabled={!name.trim() || saving} style={{ appearance: 'none', border: 0, padding: '8px 16px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 600, cursor: name.trim() && !saving ? 'pointer' : 'not-allowed', opacity: name.trim() && !saving ? 1 : 0.5, fontFamily: FONT }}>{saving ? 'Saving…' : 'Save venue'}</button>
        </div>
      </div>
    </div>
  )
}
