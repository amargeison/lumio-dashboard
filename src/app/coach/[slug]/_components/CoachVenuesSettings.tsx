'use client'

// Settings → Venues. Where coaches add the sites they work across (the Court
// Planner is the read/contact view; this is the management). Add/edit/delete a
// venue, manage its courts, and set the home base.

import { useState, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { useCoachTable } from '../_lib/coach-db'

type Venue = { id: string; name: string; address?: string | null; contact_name?: string | null; contact_phone?: string | null; contact_email?: string | null; facilities?: string | null; access_note?: string | null; is_home?: boolean | null }
type Court = { id: string; venue_id?: string | null; name: string; surface?: string | null; status?: string | null }
const STATUSES = ['Free', 'Booked', 'Maintenance']

export function CoachVenuesSettings({ T, accent }: { T: ThemeTokens; accent: AccentTokens }) {
  const venues = useCoachTable<Venue>('coach_venues')
  const courts = useCoachTable<Court>('coach_courts')
  const [editing, setEditing] = useState<Venue | 'new' | null>(null)

  const card: CSSProperties = { background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18, marginBottom: 16, fontFamily: FONT }

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.text }}>Venues</h3>
        <span style={{ fontSize: 11.5, color: T.text3 }}>The sites you coach across — these power the Court Planner.</span>
        <button onClick={() => setEditing('new')} style={{ marginLeft: 'auto', appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 9, padding: '8px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>+ Add venue</button>
      </div>

      {venues.rows.length === 0 ? (
        <div style={{ fontSize: 12.5, color: T.text3, padding: '8px 0' }}>No venues yet. Add the first site you coach at.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {venues.rows.map(v => (
            <div key={v.id} style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>{v.name}</span>
                {v.is_home && <span style={{ fontSize: 9, fontWeight: 700, color: accent.hex, background: accent.dim, padding: '2px 7px', borderRadius: 5, textTransform: 'uppercase' }}>Home base</span>}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                  {!v.is_home && <button onClick={() => venues.edit(v.id, { is_home: true })} style={ghost(T)}>Set as home</button>}
                  <button onClick={() => setEditing(v)} style={ghost(T)}>Edit</button>
                  <button onClick={async () => { if (confirm(`Delete ${v.name}?`)) venues.remove(v.id) }} style={{ ...ghost(T), color: T.bad }}>Delete</button>
                </div>
              </div>
              {v.address && <div style={{ fontSize: 11.5, color: T.text3, marginTop: 2 }}>{v.address}</div>}
              {(v.contact_name || v.contact_email || v.contact_phone) && <div style={{ fontSize: 11, color: T.text3, marginTop: 4 }}>{[v.contact_name, v.contact_phone, v.contact_email].filter(Boolean).join(' · ')}</div>}
              <CourtManager T={T} accent={accent} venue={v} courts={courts.rows.filter(c => c.venue_id === v.id)} add={courts.add} edit={courts.edit} remove={courts.remove} />
            </div>
          ))}
        </div>
      )}

      {editing && <VenueForm T={T} accent={accent} venue={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)}
        onSave={async (vals) => { if (editing === 'new') await venues.add(vals); else await venues.edit(editing.id, vals); setEditing(null) }} />}
    </div>
  )
}

function ghost(T: ThemeTokens): CSSProperties {
  return { appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 7, padding: '5px 10px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }
}

function CourtManager({ T, accent, venue, courts, add, edit, remove }: {
  T: ThemeTokens; accent: AccentTokens; venue: Venue; courts: Court[]
  add: (row: Record<string, any>) => Promise<void>; edit: (id: string, row: Record<string, any>) => Promise<void>; remove: (id: string) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [surface, setSurface] = useState('')
  const field: CSSProperties = { background: T.panel, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 9px', fontSize: 12, fontFamily: FONT, outline: 'none' }
  const addCourt = async () => { if (!name.trim()) return; await add({ venue_id: venue.id, name: name.trim(), surface: surface.trim() || null, status: 'Free' }); setName(''); setSurface('') }
  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Courts · {courts.length}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
        {courts.map(c => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: T.text, fontWeight: 600, minWidth: 70 }}>{c.name}</span>
            <span style={{ fontSize: 11, color: T.text3, flex: 1, minWidth: 60 }}>{c.surface || '—'}</span>
            <select value={c.status || 'Free'} onChange={e => edit(c.id, { status: e.target.value })} style={{ ...field, cursor: 'pointer' }}>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={() => remove(c.id)} style={{ appearance: 'none', border: 0, background: 'transparent', color: T.text3, cursor: 'pointer', fontSize: 15 }}>×</button>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Court name (e.g. Court 1)" style={{ ...field, flex: 1, minWidth: 120 }} />
        <input value={surface} onChange={e => setSurface(e.target.value)} placeholder="Surface (e.g. Hard · lights)" style={{ ...field, flex: 1, minWidth: 120 }} />
        <button onClick={addCourt} style={{ appearance: 'none', border: `1px solid ${accent.border}`, background: accent.dim, color: accent.hex, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>+ Add court</button>
      </div>
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

  const field: CSSProperties = { width: '100%', background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 9, padding: '9px 11px', fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }
  const lbl: CSSProperties = { display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: T.text3, margin: '0 0 5px' }
  const save = async () => {
    if (!name.trim() || saving) return
    setSaving(true)
    try { await onSave({ name: name.trim(), address, contact_name: cName, contact_phone: cPhone, contact_email: cEmail, facilities, access_note: access, is_home: isHome }) }
    finally { setSaving(false) }
  }
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, fontFamily: FONT, padding: '4vh 16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 460, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 14 }}>{venue ? 'Edit venue' : 'Add venue'}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><label style={lbl}>Venue name *</label><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Riverside Tennis Centre" style={field} /></div>
          <div><label style={lbl}>Address</label><input value={address} onChange={e => setAddress(e.target.value)} style={field} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={lbl}>Contact name</label><input value={cName} onChange={e => setCName(e.target.value)} style={field} /></div>
            <div><label style={lbl}>Contact phone</label><input value={cPhone} onChange={e => setCPhone(e.target.value)} style={field} /></div>
          </div>
          <div><label style={lbl}>Contact email</label><input value={cEmail} onChange={e => setCEmail(e.target.value)} style={field} /></div>
          <div><label style={lbl}>Facilities (comma separated)</label><input value={facilities} onChange={e => setFacilities(e.target.value)} placeholder="Café, Parking, Floodlights" style={field} /></div>
          <div><label style={lbl}>Access note</label><input value={access} onChange={e => setAccess(e.target.value)} placeholder="e.g. Coach fob entry · gate code after 6pm" style={field} /></div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: T.text2, cursor: 'pointer' }}>
            <input type="checkbox" checked={isHome} onChange={e => setIsHome(e.target.checked)} /> Set as home base
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
          <button onClick={onClose} style={{ appearance: 'none', padding: '8px 14px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
          <button onClick={save} disabled={!name.trim() || saving} style={{ appearance: 'none', border: 0, padding: '8px 16px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 600, cursor: name.trim() && !saving ? 'pointer' : 'not-allowed', opacity: name.trim() && !saving ? 1 : 0.5, fontFamily: FONT }}>{saving ? 'Saving…' : 'Save venue'}</button>
        </div>
      </div>
    </div>
  )
}
