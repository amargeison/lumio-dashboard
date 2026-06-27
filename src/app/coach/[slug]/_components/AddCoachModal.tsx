'use client'

import { useState, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { COACH_ORG } from '../_lib/coach-data'
import { addCoach } from '../_lib/coaches-store'
import { ALL_PLAYERS, COACHES, coachById } from '../_lib/coaches-data'
import { assignPlayers, getAssignments } from '../_lib/player-assign-store'
import { getAddedCoaches } from '../_lib/coaches-store'
import type { Coach, CoachRole } from '../_lib/coaches-data'

const ROLES: CoachRole[] = ['Head', 'Senior', 'Coach', 'Assistant', 'Apprentice']
const HOME = COACH_ORG.venue.split(' · ')[0]

export function AddCoachModal({ T, accent, onClose }: { T: ThemeTokens; accent: AccentTokens; density: Density; onClose: () => void }) {
  const [name, setName] = useState('')
  const [role, setRole] = useState<CoachRole>('Coach')
  const [accreditation, setAccreditation] = useState('')
  const [specialisms, setSpecialisms] = useState('')
  const [availability, setAvailability] = useState('Mon–Fri · days')
  const [hours, setHours] = useState('24')
  const [status, setStatus] = useState<Coach['status']>('active')
  const [homeVenue, setHomeVenue] = useState(HOME)
  const [dbsNumber, setDbsNumber] = useState('')
  const [dbsExpiry, setDbsExpiry] = useState('')
  const [safeguardingTrained, setSafeguardingTrained] = useState(false)
  const [safeguardingDate, setSafeguardingDate] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [calendarProvider, setCalendarProvider] = useState('')
  const [assigned, setAssigned] = useState<string[]>([])

  // Current coach name per player (for the assign list), respecting overrides.
  const overrides = getAssignments()
  const allCoaches = [...COACHES, ...getAddedCoaches()]
  const coachName = (id: string) => allCoaches.find(c => c.id === id)?.name ?? coachById(id)?.name ?? '—'
  const toggleAssign = (id: string) => setAssigned(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

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
      accreditation: accreditation.trim() || 'Coach',
      specialisms: specialisms.split(',').map(s => s.trim()).filter(Boolean),
      availability: availability.trim() || 'By arrangement',
      hoursPerWeek: Number(hours) || 0,
      status,
      homeVenue: homeVenue.trim() || HOME,
      dbsNumber: dbsNumber.trim() || undefined,
      dbsExpiry: dbsExpiry || undefined,
      safeguardingTrained,
      safeguardingDate: safeguardingDate || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      calendarProvider: calendarProvider || undefined,
    }
    addCoach(coach)
    if (assigned.length) assignPlayers(assigned, coach.id)
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
            <input value={accreditation} onChange={e => setAccreditation(e.target.value)} placeholder="e.g. Qualified Coach, Level 3, LTA Accredited" style={input} />
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

          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12, marginTop: 2 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Contact &amp; calendar</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={label}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="coach@academy.com" style={input} />
              </div>
              <div>
                <label style={label}>Phone</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+44 7…" style={input} />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={label}>Calendar sync</label>
              <select value={calendarProvider} onChange={e => setCalendarProvider(e.target.value)} style={input}>
                <option value="">Not connected</option>
                <option value="google">Google Calendar</option>
                <option value="outlook">Outlook / Microsoft</option>
                <option value="apple">Apple Calendar</option>
              </select>
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12, marginTop: 2 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>DBS &amp; safeguarding</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr', gap: 12 }}>
              <div>
                <label style={label}>DBS number</label>
                <input value={dbsNumber} onChange={e => setDbsNumber(e.target.value)} placeholder="e.g. 0012 3456 7890" style={input} />
              </div>
              <div>
                <label style={label}>DBS expiry</label>
                <input type="date" value={dbsExpiry} onChange={e => setDbsExpiry(e.target.value)} style={input} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 12, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: T.text, cursor: 'pointer' }}>
                <input type="checkbox" checked={safeguardingTrained} onChange={e => setSafeguardingTrained(e.target.checked)} /> Safeguarding trained
              </label>
              <div style={{ flex: 1, minWidth: 150 }}>
                <label style={label}>Training date</label>
                <input type="date" value={safeguardingDate} onChange={e => setSafeguardingDate(e.target.value)} style={input} />
              </div>
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12, marginTop: 2 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Assign players <span style={{ color: T.text3, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></div>
              <span style={{ fontSize: 11, color: accent.hex, fontWeight: 600 }}>{assigned.length} selected</span>
            </div>
            <div style={{ maxHeight: 168, overflowY: 'auto', border: `1px solid ${T.border}`, borderRadius: 9, background: T.panel2 }}>
              {ALL_PLAYERS.map(p => {
                const on = assigned.includes(p.id)
                const current = coachName(overrides[p.id] ?? p.coachId)
                return (
                  <button key={p.id} onClick={() => toggleAssign(p.id)} type="button"
                    style={{ width: '100%', appearance: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 11px', background: on ? accent.dim : 'transparent', border: 'none', borderBottom: `1px solid ${T.border}` }}>
                    <span style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, border: `1px solid ${on ? accent.hex : T.border}`, background: on ? accent.hex : 'transparent', display: 'grid', placeItems: 'center', color: T.btnText, fontSize: 11 }}>{on ? '✓' : ''}</span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: T.text, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                    <span style={{ fontSize: 10.5, color: T.text3, flexShrink: 0 }}>{p.group} · now: {current}</span>
                  </button>
                )
              })}
            </div>
            <div style={{ fontSize: 10.5, color: T.text3, marginTop: 6 }}>Selected players move to this coach when you add them.</div>
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
