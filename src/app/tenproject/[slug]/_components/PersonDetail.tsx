'use client'

// Coach / TENOR profile page — mapped from the Lumio Tennis Coach "coach view":
// header with Call/Contact, stat row, DBS & Safeguarding panel, THIS WEEK
// calendar, and Assigned schools/venues (instead of assigned players).
// Plus the live Add-coach modal.

import React, { useState } from 'react'
import { ArrowLeft, Phone, Mail, School, MapPin, X, UserPlus } from 'lucide-react'
import { Card, SectionTitle, Pill } from './ui'
import UpcomingCalendar from './UpcomingCalendar'
import { TP_RED, TP_DARK, type TpCoach, type TpPersonDetail } from '@/data/tenproject/demo-data'

const DBS_TONE: Record<string, 'green' | 'amber' | 'red' | 'grey'> = {
  valid: 'green', 'due-soon': 'amber', expired: 'red', missing: 'red', pending: 'amber', 'n/a': 'grey',
}

function initials(name: string) { return name.split(' ').map(w => w[0]).slice(0, 2).join('') }

export function PersonDetailView({ person, detail, kind, onBack }: {
  person: { name: string; role?: string; qual?: string; specialisms?: string[]; dbs: string; online?: boolean; sessionsWeek?: number; childrenCovered?: number; sessionsCovered?: number; inducted?: boolean }
  detail: TpPersonDetail
  kind: 'coach' | 'tenor'
  onBack: () => void
}) {
  const stats: [string | number, string][] = kind === 'coach'
    ? [[person.sessionsWeek ?? 0, 'THIS WEEK'], [person.childrenCovered ?? 0, 'CHILDREN'], [detail.assignments.length, 'ASSIGNMENTS'], [detail.availability, 'AVAILABILITY']]
    : [[person.sessionsCovered ?? 0, 'SESSIONS COVERED'], [detail.assignments.length, 'VENUE'], [person.inducted ? 'YES' : 'PENDING', 'INDUCTED'], [detail.availability, 'AVAILABILITY']]

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#fff', color: TP_DARK, border: '1px solid #E7E2DC', borderRadius: 9, padding: '8px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer', width: 'fit-content' }}>
        <ArrowLeft size={14} /> All {kind === 'coach' ? 'coaches' : 'TENORs'}
      </button>

      {/* Header */}
      <Card>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: 54, height: 54, borderRadius: '50%', background: TP_DARK, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, fontWeight: 900 }}>{initials(person.name)}</div>
            {person.online && <div style={{ position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: '50%', background: '#22C55E', border: '2px solid #fff' }} />}
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: TP_DARK }}>
              {person.name} {person.role && <Pill tone={person.role === 'Lead' ? 'red' : 'grey'}>{person.role.toUpperCase()}</Pill>} {person.online && <span style={{ fontSize: 11, color: '#187A3C', fontWeight: 800 }}>● Active</span>}
            </div>
            <div style={{ fontSize: 12.5, color: '#6B6560', marginTop: 3 }}>
              {kind === 'coach' ? person.qual : 'Volunteer parent (TENOR)'} · {detail.availability}
            </div>
            <div style={{ fontSize: 12.5, color: '#6B6560', marginTop: 5 }}>
              <Phone size={12} style={{ verticalAlign: '-1px', marginRight: 5 }} />{detail.phone}
              <span style={{ margin: '0 10px', color: '#D9D3CC' }}>|</span>
              <Mail size={12} style={{ verticalAlign: '-1px', marginRight: 5 }} />{detail.email}
            </div>
            {person.specialisms && (
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {person.specialisms.map(s => <Pill key={s} tone="grey">{s}</Pill>)}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href={`tel:${detail.phone.replace(/\s/g, '')}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: TP_RED, color: '#fff', borderRadius: 9, padding: '9px 15px', fontSize: 12.5, fontWeight: 800, textDecoration: 'none' }}>
              <Phone size={14} /> Call
            </a>
            <a href={`mailto:${detail.email}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: TP_DARK, color: '#fff', borderRadius: 9, padding: '9px 15px', fontSize: 12.5, fontWeight: 800, textDecoration: 'none' }}>
              <Mail size={14} /> Contact
            </a>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 26, marginTop: 16, borderTop: '1px solid #F0EBE5', paddingTop: 14, flexWrap: 'wrap' }}>
          {stats.map(([v, l]) => (
            <div key={l}>
              <div style={{ fontSize: 17, fontWeight: 900, color: TP_RED }}>{v}</div>
              <div style={{ fontSize: 9, color: '#8A847E', fontWeight: 800, letterSpacing: 0.6 }}>{l}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* DBS & Safeguarding */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <SectionTitle>DBS & Safeguarding</SectionTitle>
          <Pill tone={DBS_TONE[person.dbs] ?? 'grey'}>{person.dbs === 'valid' ? 'VALID' : person.dbs.toUpperCase().replace('-', ' ')}</Pill>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, background: '#F7F5F2', borderRadius: 12, padding: '13px 15px' }}>
          {([
            ['DBS NUMBER', detail.dbsNumber ?? '—'],
            ['ISSUED', detail.dbsIssued ?? '—'],
            ['EXPIRY', detail.dbsExpiry ?? '—'],
            ['SAFEGUARDING', detail.safeguardingDate ?? '—'],
            ...(kind === 'coach' ? [['FIRST AID', detail.firstAid ?? '—'], ['INSURANCE', detail.insurance ?? '—']] as [string, string][] : []),
          ] as [string, string][]).map(([l, v]) => (
            <div key={l}>
              <div style={{ fontSize: 9, color: '#8A847E', fontWeight: 800, letterSpacing: 0.6 }}>{l}</div>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: v.includes('⚠') ? '#9A6A0B' : TP_DARK, marginTop: 3 }}>{v}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Week calendar */}
      <UpcomingCalendar events={detail.cal} title="This week" sub="Synced from their Google / Microsoft 365 calendar" />

      {/* Assignments */}
      <Card>
        <SectionTitle sub={kind === 'coach' ? 'The schools and weekend venues this coach delivers' : 'The venue this TENOR covers'}>
          Assigned {kind === 'coach' ? 'schools & venues' : 'venue'}
        </SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
          {detail.assignments.map(a => (
            <div key={a.name} style={{ background: '#F7F5F2', borderRadius: 12, padding: '13px 15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 13.5, fontWeight: 900, color: TP_DARK }}>
                  {a.kind === 'school' ? <School size={14} style={{ verticalAlign: '-2px', marginRight: 6, color: TP_RED }} /> : <MapPin size={14} style={{ verticalAlign: '-2px', marginRight: 6, color: TP_RED }} />}
                  {a.name}
                </div>
                {a.status && <Pill tone={a.status === 'RUNNING' ? 'green' : a.status === 'TRAINING' || a.status === 'PENDING' ? 'amber' : 'grey'}>{a.status}</Pill>}
              </div>
              <div style={{ fontSize: 12, color: '#5B554F', marginTop: 6, lineHeight: 1.5 }}>{a.detail}</div>
              <button style={{ marginTop: 10, background: '#fff', color: TP_DARK, border: '1px solid #E7E2DC', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>
                Reassign…
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ─── Add coach modal (live — appends to the roster) ─────────────────────────
export function AddCoachModal({ onAdd, onClose }: {
  onAdd: (coach: TpCoach) => void
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [role, setRole] = useState<TpCoach['role']>('Coach')
  const [qual, setQual] = useState('LTA Level 2')
  const [specialisms, setSpecialisms] = useState('Mini/Red')
  const [schools, setSchools] = useState('Unassigned')

  function submit() {
    if (!name.trim()) return
    onAdd({
      id: `new-${Date.now()}`,
      name: name.trim(),
      role, qual,
      dbs: 'missing',
      dbsNote: 'invite sent — DBS to be verified at onboarding',
      firstAid: 'to be verified',
      specialisms: specialisms.split(',').map(s => s.trim()).filter(Boolean),
      schools,
      sessionsWeek: 0,
      childrenCovered: 0,
    })
    onClose()
  }

  const field = { width: '100%', border: '1px solid #E7E2DC', borderRadius: 9, padding: '10px 12px', fontSize: 13, outline: 'none', background: '#F7F5F2' } as const
  const label = { fontSize: 10.5, fontWeight: 800, color: '#8A847E', letterSpacing: 0.5, marginBottom: 4, display: 'block' } as const

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#00000066', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 16 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 22, maxWidth: 460, width: '100%' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: TP_DARK }}>
            <UserPlus size={16} style={{ verticalAlign: '-2px', marginRight: 7, color: TP_RED }} />Add coach
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B6560' }}><X size={18} /></button>
        </div>
        <div style={{ display: 'grid', gap: 11 }}>
          <div>
            <span style={label}>FULL NAME</span>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sam Porter" style={field} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <span style={label}>ROLE</span>
              <select value={role} onChange={e => setRole(e.target.value as TpCoach['role'])} style={field}>
                {['Lead', 'Coach', 'Assistant', 'Apprentice'].map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <span style={label}>QUALIFICATION</span>
              <select value={qual} onChange={e => setQual(e.target.value)} style={field}>
                {['LTA Level 3', 'LTA Level 2', 'LTA Assistant', 'In training'].map(q => <option key={q}>{q}</option>)}
              </select>
            </div>
          </div>
          <div>
            <span style={label}>SPECIALISMS (COMMA-SEPARATED)</span>
            <input value={specialisms} onChange={e => setSpecialisms(e.target.value)} style={field} />
          </div>
          <div>
            <span style={label}>INITIAL ASSIGNMENT</span>
            <select value={schools} onChange={e => setSchools(e.target.value)} style={field}>
              {['Unassigned', 'Oakridge Primary', 'Meridian Park Primary (Sept)', 'Kingsmead Rec Ground (Sat)', 'Bramley Green Courts (Sat)', 'Elmwood Park Courts (Sun)'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div style={{ fontSize: 11, color: '#8A847E', marginTop: 12, background: '#F7F5F2', borderRadius: 9, padding: '9px 11px' }}>
          They’ll get an invite to complete onboarding — DBS, safeguarding training, First Aid and insurance are verified before they can deliver unsupervised.
        </div>
        <button onClick={submit} disabled={!name.trim()} style={{ marginTop: 14, width: '100%', background: name.trim() ? TP_RED : '#D9D3CC', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 16px', fontSize: 13.5, fontWeight: 900, cursor: name.trim() ? 'pointer' : 'not-allowed' }}>
          Send invite & add to roster
        </button>
      </div>
    </div>
  )
}
