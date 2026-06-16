'use client'

// New camp modal — mirrors NewSession.tsx. Collects the camp fields and writes
// to the camps-store (localStorage) so the new camp appears live in the Training
// Camps list and survives reload. Demo only — no API, no real booking.

import { useState, type CSSProperties, type ReactNode } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { COACH_ORG, type Camp } from '../_lib/coach-data'
import { addCamp } from '../_lib/camps-store'

export function NewCampModal({ T, accent, onClose, onCreated }: { T: ThemeTokens; accent: AccentTokens; density: Density; onClose: () => void; onCreated: (id: string) => void }) {
  const [name, setName] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [ageGroup, setAgeGroup] = useState('Ages 6–14 · all levels')
  const [capacity, setCapacity] = useState('24')
  const [price, setPrice] = useState('220')
  const [venue, setVenue] = useState<string>(COACH_ORG.venue)
  const [coach, setCoach] = useState<string>(COACH_ORG.coach)

  const input: CSSProperties = { width: '100%', appearance: 'none', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 13, padding: '9px 11px', fontFamily: FONT, outline: 'none' }
  const labelStyle: CSSProperties = { fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: 4, display: 'block' }
  const Field = ({ label, children }: { label: string; children: ReactNode }) => (
    <div style={{ marginBottom: 12 }}><label style={labelStyle}>{label}</label>{children}</div>
  )

  const cap = Number(capacity) || 0
  const canSave = name.trim().length > 0 && cap > 0

  const save = () => {
    if (!canSave) return
    const v = venue.trim() || COACH_ORG.venue
    const camp: Camp = {
      id: `camp-new-${Date.now()}`,
      name: name.trim(),
      country: 'England',
      location: v,
      resort: v,
      flag: '🇬🇧',
      start: start.trim() || 'TBC',
      end: end.trim() || 'TBC',
      days: 5,
      status: 'upcoming',
      capacity: cap,
      booked: 0,
      pricePerHead: Number(price) || 0,
      deposit: Math.max(0, Math.round((Number(price) || 0) * 0.2)),
      surfaces: 'Indoor & outdoor hard',
      courts: 4,
      summary: `${ageGroup.trim() || 'All ages'} camp at ${v}. Coached by ${coach.trim() || COACH_ORG.coach}.`,
    }
    addCamp(camp)
    onCreated(camp.id)
    onClose()
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.84)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '5vh 16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 520, background: T.panel, border: `1px solid ${T.borderHi}`, borderRadius: 16, boxShadow: '0 30px 80px -20px rgba(0,0,0,0.7)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: `1px solid ${T.border}` }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', background: accent.dim }}><Icon name="sun" size={15} stroke={1.7} style={{ color: accent.hex }} /></div>
          <div style={{ flex: 1, fontSize: 15, fontWeight: 700, color: T.text }}>New camp</div>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text3, cursor: 'pointer', width: 30, height: 30, fontSize: 16 }}>✕</button>
        </div>

        <div style={{ padding: 20 }}>
          <Field label="Camp name *"><input style={input} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. February Half-Term Tennis Camp" autoFocus /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Start date"><input style={input} value={start} onChange={e => setStart(e.target.value)} placeholder="16 Feb 2027" /></Field>
            <Field label="End date"><input style={input} value={end} onChange={e => setEnd(e.target.value)} placeholder="20 Feb 2027" /></Field>
          </div>
          <Field label="Ages / group"><input style={input} value={ageGroup} onChange={e => setAgeGroup(e.target.value)} placeholder="e.g. Ages 6–14 · all levels" /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Capacity *"><input style={input} inputMode="numeric" value={capacity} onChange={e => setCapacity(e.target.value.replace(/\D/g, ''))} placeholder="24" /></Field>
            <Field label="Price per head (£)"><input style={input} inputMode="numeric" value={price} onChange={e => setPrice(e.target.value.replace(/\D/g, ''))} placeholder="220" /></Field>
          </div>
          <Field label="Venue"><input style={input} value={venue} onChange={e => setVenue(e.target.value)} placeholder={COACH_ORG.venue} /></Field>
          <Field label="Lead coach"><input style={input} value={coach} onChange={e => setCoach(e.target.value)} placeholder={COACH_ORG.coach} /></Field>

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={save} disabled={!canSave}
              style={{ flex: 1, appearance: 'none', border: 0, padding: '11px 14px', borderRadius: 9, background: canSave ? accent.hex : T.hover, color: canSave ? T.btnText : T.text3, fontSize: 13, fontWeight: 600, fontFamily: FONT, cursor: canSave ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              <Icon name="plus" size={14} stroke={2} /> Add camp
            </button>
            <button onClick={onClose} style={{ appearance: 'none', padding: '11px 16px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          </div>
          <div style={{ fontSize: 10.5, color: T.text3, marginTop: 10, textAlign: 'center' }}>Demo — saved locally; appears in your camps list and persists on this device.</div>
        </div>
      </div>
    </div>
  )
}
