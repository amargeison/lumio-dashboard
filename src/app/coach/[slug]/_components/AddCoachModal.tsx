'use client'

import { useState, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { COACH_ORG } from '../_lib/coach-data'
import { addCoach } from '../_lib/coaches-store'
import type { Coach, CoachRole } from '../_lib/coaches-data'

const ROLES: CoachRole[] = ['Head', 'Senior', 'Coach', 'Assistant', 'Apprentice']
const HOME = COACH_ORG.venue.split(' · ')[0]

export function AddCoachModal({ T, accent, onClose }: { T: ThemeTokens; accent: AccentTokens; density: Density; onClose: () => void }) {
  const [name, setName] = useState('')
  const [role, setRole] = useState<CoachRole>('Coach')
  const [accreditation, setAccreditation] = useState('LTA Accredited Coach')
  const [specialisms, setSpecialisms] = useState('')
  const [availability, setAvailability] = useState('Mon–Fri · days')
  const [hours, setHours] = useState('24')
  const [status, setStatus] = useState<Coach['status']>('active')
  const [homeVenue, setHomeVenue] = useState(HOME)

  const input: CSSProperties = { width: '100%', appearance: 'none', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 13, padding: '9px 11px', fontFamily: FONT, outline: 'none' }
  const label: CSSProperties = { fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 4, display: 'block' }

  const canSave = name.trim().length > 0
  const save = () => {
    if (!canSave) return
    const initials = name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'C'
    const coach: Coach = {
      id: `coach-${Date.now()}`,
      name: name.trim(),
      initials,
      role,
      accreditation: accreditation.trim() || 'LTA Accredited Coach',
      specialisms: specialisms.split(',').map(s => s.trim()).filter(Boolean),
      availability: availability.trim() || 'By arrangement',
      hoursPerWeek: Number(hours) || 0,
      status,
      homeVenue: homeVenue.trim() || HOME,
    }
    addCoach(coach)
    onClose()
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '7vh 16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 480, background: T.panel, border: `1px solid ${T.borderHi}`, borderRadius: 14, boxShadow: '0 30px 80px -20px rgba(0,0,0,0.7)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderBottom: `1px solid ${T.border}` }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', background: accent.dim }}><Icon name="people" size={15} stroke={1.7} style={{ color: accent.hex }} /></div>
          <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: T.text }}>Add coach</div>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text3, cursor: 'pointer', width: 30, height: 30, fontSize: 18, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={label}>Full name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Jordan Avery" style={input} autoFocus />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={label}>Role</label>
              <select value={role} onChange={e => setRole(e.target.value as CoachRole)} style={input}>{ROLES.map(r => <option key={r} value={r}>{r}</option>)}</select>
            </div>
            <div>
              <label style={label}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as Coach['status'])} style={input}><option value="active">Active</option><option value="leave">On leave</option></select>
            </div>
          </div>
          <div>
            <label style={label}>Accreditation</label>
            <input value={accreditation} onChange={e => setAccreditation(e.target.value)} placeholder="LTA Accredited Coach" style={input} />
          </div>
          <div>
            <label style={label}>Specialisms (comma-separated)</label>
            <input value={specialisms} onChange={e => setSpecialisms(e.target.value)} placeholder="Performance, Cardio, Adult" style={input} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr', gap: 12 }}>
            <div>
              <label style={label}>Availability</label>
              <input value={availability} onChange={e => setAvailability(e.target.value)} placeholder="Mon–Fri · days" style={input} />
            </div>
            <div>
              <label style={label}>Hours / week</label>
              <input value={hours} onChange={e => setHours(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="24" style={input} />
            </div>
          </div>
          <div>
            <label style={label}>Home venue</label>
            <input value={homeVenue} onChange={e => setHomeVenue(e.target.value)} style={input} />
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={save} disabled={!canSave}
              style={{ flex: 1, appearance: 'none', border: 0, padding: '10px 14px', borderRadius: 9, background: canSave ? accent.hex : T.hover, color: canSave ? T.btnText : T.text3, fontSize: 13, fontWeight: 600, fontFamily: FONT, cursor: canSave ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              <Icon name="plus" size={14} stroke={2} /> Add coach
            </button>
            <button onClick={onClose} style={{ appearance: 'none', padding: '10px 16px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}
