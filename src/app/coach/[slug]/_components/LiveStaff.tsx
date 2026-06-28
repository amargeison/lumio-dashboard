'use client'

// Coaching staff with a DBS / safeguarding register. Shows DBS status (valid /
// expiring / expired / missing) per staff member, warns about anything lapsed
// or due within 90 days, and captures DBS + safeguarding-training details.

import { useState } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { useCoachTable, dbInsert, dbUpdate, dbRemove, useCoachProfile } from '../_lib/coach-db'

type Common = { T: ThemeTokens; accent: AccentTokens; density: Density }
const DAY = 86400000

function dbsState(expiry?: string | null): { label: string; colour: string } {
  if (!expiry) return { label: 'No DBS on file', colour: '#EF4444' }
  const days = Math.floor((new Date(expiry).getTime() - Date.now()) / DAY)
  if (days < 0) return { label: 'Expired', colour: '#EF4444' }
  if (days <= 90) return { label: `Expires in ${days}d`, colour: '#F59E0B' }
  return { label: 'Valid', colour: '#22C55E' }
}

export function LiveStaff({ T, accent }: Common) {
  const staff = useCoachTable<any>('coach_staff')
  const profile = useCoachProfile()
  const players = useCoachTable<any>('coach_players')
  const [editing, setEditing] = useState<any | null | undefined>(undefined)
  const [role, setRole] = useState('All')

  const flagged = staff.rows.filter(s => { const st = dbsState(s.dbs_expiry); return st.label === 'Expired' || st.label.startsWith('Expires') || st.label.startsWith('No DBS') })
  // The head coach (the signed-in account) is always shown — so a solo coach
  // sees themselves as the one coach. Their card carries no DBS row.
  const head = { id: '__head__', name: profile.display_name || 'Head Coach', role: 'Head', email: profile.contact_email, phone: profile.contact_phone, qualifications: 'Head Coach', home_venue: null, isHead: true }
  const everyone = [head, ...staff.rows]
  const ROLES = ['All', 'Head', 'Senior', 'Coach', 'Assistant', 'Apprentice']
  const inRole = (s: any) => role === 'All' || (s.role || '').toLowerCase().includes(role.toLowerCase())
  const shown = everyone.filter(inRole)
  const dbsValid = staff.rows.filter(s => dbsState(s.dbs_expiry).label === 'Valid').length
  const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w: string) => w[0]?.toUpperCase()).join('') || '?'

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ color: T.text, fontSize: 22, fontWeight: 700, margin: 0 }}>Coaches</h2>
          <p style={{ color: T.text3, fontSize: 13, margin: '4px 0 0' }}>Your coaching team at a glance — roles, accreditations, DBS and contact.</p>
        </div>
        <button onClick={() => setEditing(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: 'none', background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <Icon name="plus" size={14} /> Add coach
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
        {([['Coaches', everyone.length, T.text], ['Players', players.rows.length, '#3A8EE0'], ['DBS valid', `${dbsValid}/${staff.rows.length}`, T.good], ['DBS attention', flagged.length, flagged.length ? T.warn : T.text3]] as const).map(([l, v, c]) => (
          <div key={l} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{l}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: c, marginTop: 4 }}>{v}</div>
          </div>
        ))}
      </div>

      {flagged.length > 0 && (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#F59E0B', marginBottom: 4 }}>⚠ DBS &amp; safeguarding attention needed</div>
          <div style={{ fontSize: 12, color: T.text2, lineHeight: 1.5 }}>{flagged.map(s => `${s.name} (${dbsState(s.dbs_expiry).label})`).join(', ')}</div>
        </div>
      )}

      {/* Role filter */}
      <div style={{ display: 'flex', gap: 0, padding: 2, background: T.hover, borderRadius: 9, marginBottom: 16, width: 'fit-content', flexWrap: 'wrap' }}>
        {ROLES.map(r => <button key={r} onClick={() => setRole(r)} style={{ appearance: 'none', border: 0, padding: '5px 13px', borderRadius: 7, fontSize: 12, cursor: 'pointer', background: role === r ? T.panel : 'transparent', color: role === r ? T.text : T.text2, fontWeight: role === r ? 600 : 400, boxShadow: role === r ? `0 0 0 1px ${T.border}` : 'none' }}>{r}</button>)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {shown.map(s => {
          const st = s.isHead ? null : dbsState(s.dbs_expiry)
          const specialisms = (s.qualifications || '').split(',').map((x: string) => x.trim()).filter(Boolean)
          return (
            <div key={s.id} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 34, height: 34, borderRadius: '50%', background: accent.dim, color: accent.hex, display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700 }}>{initials(s.name)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.role || 'Coach'}</div>
                </div>
                {st && <span style={{ fontSize: 9, fontWeight: 700, color: st.colour, background: `${st.colour}1a`, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase' }}>{st.label === 'Valid' ? 'DBS valid' : st.label}</span>}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                {s.phone && <a href={`tel:${s.phone}`} style={{ flex: 1, textAlign: 'center', textDecoration: 'none', border: `1px solid ${accent.border}`, background: 'transparent', color: accent.hex, borderRadius: 8, padding: '6px', fontSize: 12, fontWeight: 600 }}>📞 Call</a>}
                {s.email && <a href={`mailto:${s.email}`} style={{ flex: 1, textAlign: 'center', textDecoration: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 8, padding: '6px', fontSize: 12, fontWeight: 700 }}>✉️ Contact</a>}
              </div>
              {specialisms.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>{specialisms.map((sp: string) => <span key={sp} style={{ fontSize: 10.5, color: T.text2, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 999, padding: '2px 8px' }}>{sp}</span>)}</div>}
              {s.home_venue && <div style={{ fontSize: 10.5, color: T.text3, marginTop: 8 }}>📍 {s.home_venue}</div>}
              {!s.isHead && <div style={{ display: 'flex', gap: 6, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
                <button onClick={() => setEditing(s)} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, padding: '5px 11px', color: T.text2, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Edit</button>
                <button onClick={() => { if (confirm(`Delete ${s.name}?`)) { dbRemove('coach_staff', s.id).then(() => staff.reload()) } }} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, padding: '5px 11px', color: '#EF4444', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Delete</button>
              </div>}
              {s.isHead && <div style={{ fontSize: 10.5, color: T.text3, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>That’s you — edit your profile in Settings → Head coach profile.</div>}
            </div>
          )
        })}
      </div>

      {editing !== undefined && <StaffForm T={T} accent={accent} initial={editing} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); staff.reload() }} />}
    </div>
  )
}

function StaffForm({ T, accent, initial, onClose, onSaved }: { T: ThemeTokens; accent: AccentTokens; initial: any | null; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState<Record<string, any>>(initial ?? {})
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const { rows: venues } = useCoachTable<{ id: string; name: string }>('coach_venues')
  const set = (k: string, v: any) => setD(p => ({ ...p, [k]: v }))
  const input: React.CSSProperties = { width: '100%', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 9, padding: '9px 11px', color: T.text, fontSize: 13, boxSizing: 'border-box', outline: 'none', marginTop: 5 }
  const lbl: React.CSSProperties = { display: 'block', color: T.text3, fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }
  const fld = (k: string, label: string, type = 'text', ph?: string) => <div><label style={lbl}>{label}</label><input type={type} value={d[k] ?? ''} onChange={e => set(k, e.target.value)} placeholder={ph} style={input} /></div>

  const save = async () => {
    if (!String(d.name ?? '').trim()) { setErr('Name is required'); return }
    setSaving(true); setErr('')
    try {
      const row = { name: d.name, role: d.role || null, email: d.email || null, phone: d.phone || null, qualifications: d.qualifications || null, home_venue: d.home_venue || null, notes: d.notes || null, dbs_number: d.dbs_number || null, dbs_issued: d.dbs_issued || null, dbs_expiry: d.dbs_expiry || null, safeguarding_trained: !!d.safeguarding_trained, safeguarding_date: d.safeguarding_date || null }
      if (initial?.id) await dbUpdate('coach_staff', initial.id, row); else await dbInsert('coach_staff', row)
      onSaved()
    } catch (e) { setErr(e instanceof Error ? e.message : 'Save failed'); setSaving(false) }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '5vh 16px', overflowY: 'auto' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 560, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24 }}>
        <h3 style={{ color: T.text, fontSize: 18, fontWeight: 700, margin: '0 0 16px' }}>{initial?.id ? 'Edit staff member' : 'Add staff member'}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {fld('name', 'Name')}
          {fld('role', 'Role', 'text', 'e.g. Assistant Coach')}
          {fld('qualifications', 'Qualifications', 'text', 'e.g. Level 3')}
          <div><label style={lbl}>Home venue</label>
            <select value={d.home_venue ?? ''} onChange={e => set('home_venue', e.target.value)} style={input}>
              <option value="">{venues.length ? '— Select venue —' : 'Add venues in Settings → Venues'}</option>
              {venues.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
            </select>
          </div>
          {fld('email', 'Email')}
          {fld('phone', 'Phone')}
        </div>
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>DBS &amp; safeguarding</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {fld('dbs_number', 'DBS number')}
            {fld('dbs_issued', 'Issued', 'date')}
            {fld('dbs_expiry', 'Expiry', 'date')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: T.text, cursor: 'pointer' }}><input type="checkbox" checked={!!d.safeguarding_trained} onChange={e => set('safeguarding_trained', e.target.checked)} /> Safeguarding trained</label>
            <div style={{ flex: 1, minWidth: 160 }}>{fld('safeguarding_date', 'Training date', 'date')}</div>
          </div>
        </div>
        {err && <p style={{ color: '#EF4444', fontSize: 12, marginTop: 10 }}>{err}</p>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
          <button onClick={onClose} style={{ padding: '10px 16px', borderRadius: 10, border: `1px solid ${T.border}`, background: 'transparent', color: T.text3, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  )
}
