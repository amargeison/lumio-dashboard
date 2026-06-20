'use client'

import { useState, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import type { Venue } from '../_lib/coach-data'
import { addVenue } from '../_lib/venues-store'
import { setSettings, getSettings } from '../_lib/settings-store'

export function AddVenueModal({ T, accent, onClose }: { T: ThemeTokens; accent: AccentTokens; density: Density; onClose: () => void }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('LTA-registered tennis centre')
  const [address, setAddress] = useState('')
  const [distance, setDistance] = useState('')
  const [manager, setManager] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [access, setAccess] = useState('')
  const [facilities, setFacilities] = useState('')
  const [homeBase, setHomeBase] = useState(false)
  const [calSync, setCalSync] = useState(false)

  const input: CSSProperties = { width: '100%', appearance: 'none', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 13, padding: '9px 11px', fontFamily: FONT, outline: 'none' }
  const label: CSSProperties = { fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 4, display: 'block' }

  const canSave = name.trim().length > 0
  const save = () => {
    if (!canSave) return
    const venue: Venue = {
      id: `venue-${Date.now()}`,
      name: name.trim(),
      type: type.trim() || 'Tennis venue',
      address: address.trim() || 'Address to confirm',
      distance: distance.trim() || '—',
      manager: manager.trim() || 'To confirm',
      managerPhone: phone.trim() || '—',
      managerEmail: email.trim() || '—',
      access: access.trim() || 'Access details to confirm',
      facilities: facilities.split(',').map(s => s.trim()).filter(Boolean),
      courts: [],
    }
    addVenue(venue)
    const cur = getSettings()
    if (homeBase) setSettings({ primaryVenueId: venue.id })
    if (calSync) setSettings({ syncedVenues: [...new Set([...(cur.syncedVenues || []), venue.id])] })
    onClose()
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '7vh 16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 480, background: T.panel, border: `1px solid ${T.borderHi}`, borderRadius: 14, boxShadow: '0 30px 80px -20px rgba(0,0,0,0.7)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: `1px solid ${T.border}` }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', background: accent.dim }}><Icon name="pin" size={15} stroke={1.7} style={{ color: accent.hex }} /></div>
          <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: T.text }}>Add venue</div>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text3, cursor: 'pointer', width: 30, height: 30, fontSize: 18, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={label}>Venue name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Parkside Lawn Tennis Club" style={input} autoFocus />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr', gap: 12 }}>
            <div>
              <label style={label}>Type</label>
              <input value={type} onChange={e => setType(e.target.value)} style={input} />
            </div>
            <div>
              <label style={label}>Distance</label>
              <input value={distance} onChange={e => setDistance(e.target.value)} placeholder="12 min" style={input} />
            </div>
          </div>
          <div>
            <label style={label}>Address</label>
            <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Street, town, postcode" style={input} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={label}>Site contact</label>
              <input value={manager} onChange={e => setManager(e.target.value)} placeholder="Manager name" style={input} />
            </div>
            <div>
              <label style={label}>Phone</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="01632 …" style={input} />
            </div>
          </div>
          <div>
            <label style={label}>Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="contact@venue.example.com" style={input} />
          </div>
          <div>
            <label style={label}>Access notes</label>
            <input value={access} onChange={e => setAccess(e.target.value)} placeholder="Fob entry · gate code …" style={input} />
          </div>
          <div>
            <label style={label}>Facilities (comma-separated)</label>
            <input value={facilities} onChange={e => setFacilities(e.target.value)} placeholder="Café, Parking, Floodlights" style={input} />
          </div>
          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 12.5, color: T.text, cursor: 'pointer' }}>
              <input type="checkbox" checked={homeBase} onChange={e => setHomeBase(e.target.checked)} /> Make this my home / main site
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 12.5, color: T.text, cursor: 'pointer' }}>
              <input type="checkbox" checked={calSync} onChange={e => setCalSync(e.target.checked)} /> Connect this site&apos;s calendar <span style={{ color: T.text3, fontSize: 11 }}>(shows which courts are free)</span>
            </label>
          </div>
          <div style={{ fontSize: 10.5, color: T.text3 }}>Courts can be added on the venue once it&apos;s saved.</div>

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={save} disabled={!canSave}
              style={{ flex: 1, appearance: 'none', border: 0, padding: '10px 14px', borderRadius: 9, background: canSave ? accent.hex : T.hover, color: canSave ? T.btnText : T.text3, fontSize: 13, fontWeight: 600, fontFamily: FONT, cursor: canSave ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              <Icon name="plus" size={14} stroke={2} /> Add venue
            </button>
            <button onClick={onClose} style={{ appearance: 'none', padding: '10px 16px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}
