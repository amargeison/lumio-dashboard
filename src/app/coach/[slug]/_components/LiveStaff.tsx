'use client'

// Coaching staff with a DBS / safeguarding register. Shows DBS status (valid /
// expiring / expired / missing) per staff member, warns about anything lapsed
// or due within 90 days, and captures DBS + safeguarding-training details.

import { useState, useEffect } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { useCoachTable, dbInsert, dbUpdate, dbRemove, useCoachProfile } from '../_lib/coach-db'
import { getSettings, setSettings, subscribe } from '../_lib/settings-store'
import { fileToAvatarDataUrl, uploadAvatar, avatarSrc } from '@/lib/avatar'

type Common = { T: ThemeTokens; accent: AccentTokens; density: Density }
const DAY = 86400000

function dbsState(expiry?: string | null): { label: string; colour: string } {
  if (!expiry) return { label: 'No DBS on file', colour: '#EF4444' }
  const days = Math.floor((new Date(expiry).getTime() - Date.now()) / DAY)
  if (days < 0) return { label: 'Expired', colour: '#EF4444' }
  if (days <= 90) return { label: `Expires in ${days}d`, colour: '#F59E0B' }
  return { label: 'Valid', colour: '#22C55E' }
}

// ── Date / calendar helpers ─────────────────────────────────────────────────
const pad2 = (n: number) => String(n).padStart(2, '0')
const isoD = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
const addD = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const mondayOf = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); const wd = (x.getDay() + 6) % 7; x.setDate(x.getDate() - wd); return x }
const toMins = (t?: string | null) => { if (!t) return null; const m = t.match(/(\d{1,2})\s*:\s*(\d{2})/) || t.match(/^(\d{1,2})(\d{2})$/); return m ? Math.min(23, +m[1]) * 60 + Math.min(59, +m[2]) : null }
const hhmm = (m: number) => `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`
const WD3 = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const HRS = Array.from({ length: 14 }, (_, i) => 7 + i)
const initialsOf = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?'

export function LiveStaff({ T, accent }: Common) {
  const staff = useCoachTable<any>('coach_staff')
  const profile = useCoachProfile()
  const players = useCoachTable<any>('coach_players')
  const bookings = useCoachTable<any>('coach_bookings')
  const [editing, setEditing] = useState<any | null | undefined>(undefined)
  const [role, setRole] = useState('All')
  const [sel, setSel] = useState<any | null>(null)
  // The head coach's own contact + DBS record (the account owner), kept live.
  const [headS, setHeadS] = useState(() => getSettings().head)
  useEffect(() => subscribe(() => setHeadS(getSettings().head)), [])
  // Invite a coach to their own scoped portal login.
  const [inviteMsg, setInviteMsg] = useState('')
  const inviteToPortal = async (c: any) => {
    if (!c.email) { setInviteMsg('Add an email for this coach first.'); return }
    setInviteMsg('Sending…')
    try {
      const r = await fetch('/api/portal/invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: c.email, role: 'coach', scopeCoachName: c.name, name: c.name }) })
      setInviteMsg(r.ok ? `✓ Portal invite sent to ${c.email}` : 'Could not send invite.')
    } catch { setInviteMsg('Could not send invite.') }
  }
  // Coach profile photo upload (head → settings; sub-coach → coach_staff).
  const onCoachPhoto = async (c: any, file?: File | null) => {
    if (!file) return
    try {
      const dataUrl = await fileToAvatarDataUrl(file)
      const url = await uploadAvatar('/api/coach/staff-avatar', c.isHead ? { head: true, dataUrl } : { staffId: c.id, dataUrl })
      if (!url) return
      if (c.isHead) setSettings({ head: { ...getSettings().head, avatarUrl: url } }); else staff.reload()
    } catch { /* ignore */ }
  }

  // Per-coach work: bookings/players assigned to this coach (head coach also owns
  // anything unassigned), and the live stats derived from them.
  const todayISO = isoD(new Date())
  const weekStart = mondayOf(new Date()), weekStartISO = isoD(weekStart), weekEndISO = isoD(addD(weekStart, 7))
  const weekDays = Array.from({ length: 7 }, (_, i) => addD(weekStart, i))
  const coachBookings = (c: any) => bookings.rows.filter((b: any) => b.status !== 'cancelled' && (b.assigned_coach === c.name || (c.isHead && !b.assigned_coach)))
  const coachPlayers = (c: any) => players.rows.filter((p: any) => p.assigned_coach === c.name || (c.isHead && !p.assigned_coach))
  const statsFor = (c: any) => {
    const bk = coachBookings(c)
    const weekBk = bk.filter((b: any) => (b.booking_date || '') >= weekStartISO && (b.booking_date || '') < weekEndISO)
    const hours = Math.round(weekBk.reduce((s: number, b: any) => s + (b.duration_min || 60), 0) / 60)
    return { today: bk.filter((b: any) => b.booking_date === todayISO).length, week: weekBk.length, players: coachPlayers(c).length, hours, util: c.contracted_hours ? Math.round(hours / c.contracted_hours * 100) : null }
  }

  // The head coach (the signed-in account) is a first-class coach: their own
  // contact + DBS / safeguarding record lives in settings (empty until recorded,
  // so they're correctly flagged like anyone else).
  const head = { id: '__head__', name: profile.display_name || 'Head Coach', role: 'Head', email: headS.email || profile.contact_email, phone: headS.phone || profile.contact_phone, qualifications: 'Head Coach', home_venue: null, isHead: true, avatar_url: headS.avatarUrl, contracted_hours: headS.contractedHours, dbs_number: headS.dbsNumber, dbs_issued: headS.dbsIssued, dbs_expiry: headS.dbsExpiry, safeguarding_trained: headS.safeguardingTrained, safeguarding_date: headS.safeguardingDate }
  const everyone = [head, ...staff.rows]
  const flagged = everyone.filter(s => { const st = dbsState(s.dbs_expiry); return st.label === 'Expired' || st.label.startsWith('Expires') || st.label.startsWith('No DBS') })
  const ROLES = ['All', 'Head', 'Senior', 'Coach', 'Assistant', 'Apprentice']
  const inRole = (s: any) => role === 'All' || (s.role || '').toLowerCase().includes(role.toLowerCase())
  const shown = everyone.filter(inRole)
  const dbsValid = everyone.filter(s => dbsState(s.dbs_expiry).label === 'Valid').length
  const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w: string) => w[0]?.toUpperCase()).join('') || '?'

  // ── Coach detail ──────────────────────────────────────────────────────────
  if (sel) {
    const st = dbsState(sel.dbs_expiry)
    const s2 = statsFor(sel)
    const myBookings = coachBookings(sel)
    const myPlayers = coachPlayers(sel)
    const specialisms = (sel.qualifications || '').split(',').map((x: string) => x.trim()).filter(Boolean)
    const reassign = async (playerId: string, name: string) => { await dbUpdate('coach_players', playerId, { assigned_coach: name }); players.reload() }
    const ROW = 40, yFor = (m: number) => Math.max(0, Math.min((m / 60 - HRS[0]) * ROW, HRS.length * ROW))
    const box: React.CSSProperties = { background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px' }
    const statTiles: [string, string | number][] = [['Today', s2.today], ['This week', s2.week], ['Players', s2.players], ['Hours booked', `${s2.hours}h`], ['Utilisation', s2.util == null ? '—' : `${s2.util}%`]]
    return (
      <div>
        <button onClick={() => setSel(null)} style={{ appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 8, padding: '6px 12px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', marginBottom: 14 }}>← All coaches</button>

        {/* Header */}
        <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
            <label title="Change photo" style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
              {sel.avatar_url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={avatarSrc(sel.avatar_url)} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                : <span style={{ width: 44, height: 44, borderRadius: '50%', background: accent.dim, color: accent.hex, display: 'grid', placeItems: 'center', fontSize: 15, fontWeight: 700 }}>{initialsOf(sel.name)}</span>}
              <span style={{ position: 'absolute', right: -2, bottom: -2, width: 18, height: 18, borderRadius: '50%', background: accent.hex, color: T.btnText, fontSize: 10, display: 'grid', placeItems: 'center', border: `2px solid ${T.panel}` }}>✎</span>
              <input type="file" accept="image/*" onChange={e => onCoachPhoto(sel, e.target.files?.[0])} style={{ display: 'none' }} />
            </label>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 19, fontWeight: 700, color: T.text }}>{sel.name}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: accent.hex, background: accent.dim, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase' }}>{sel.role || 'Coach'}</span>
                <span style={{ fontSize: 11, color: T.good }}>● Active</span>
              </div>
              <div style={{ fontSize: 12, color: T.text3, marginTop: 3 }}>{[sel.qualifications, sel.contracted_hours ? `${sel.contracted_hours}h/wk` : null, sel.home_venue].filter(Boolean).join(' · ') || 'Coach'}</div>
              <div style={{ fontSize: 12, color: T.text2, marginTop: 6, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                {sel.phone && <span>📞 {sel.phone}</span>}{sel.email && <span>✉️ {sel.email}</span>}
              </div>
              {specialisms.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>{specialisms.map((sp: string) => <span key={sp} style={{ fontSize: 10.5, color: T.text2, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 999, padding: '2px 8px' }}>{sp}</span>)}</div>}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {sel.phone && <a href={`tel:${sel.phone}`} style={{ textDecoration: 'none', border: `1px solid ${accent.border}`, background: 'transparent', color: accent.hex, borderRadius: 8, padding: '8px 14px', fontSize: 12.5, fontWeight: 600 }}>📞 Call</a>}
              {sel.email && <a href={`mailto:${sel.email}`} style={{ textDecoration: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 8, padding: '8px 14px', fontSize: 12.5, fontWeight: 700 }}>✉️ Contact</a>}
              {!sel.isHead && <button onClick={() => inviteToPortal(sel)} style={{ appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 8, padding: '8px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>🔑 Invite to portal</button>}
            </div>
            {inviteMsg && <div style={{ flexBasis: '100%', width: '100%', fontSize: 11.5, color: inviteMsg.startsWith('✓') ? T.good : T.text3, marginTop: 6 }}>{inviteMsg}</div>}
          </div>
          <div style={{ display: 'flex', gap: 26, flexWrap: 'wrap', marginTop: 14 }}>
            {statTiles.map(([l, v]) => <div key={l}><div style={{ fontSize: 19, fontWeight: 700, color: T.text }}>{v}</div><div style={{ fontSize: 9.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</div></div>)}
          </div>
        </div>

        {/* DBS & safeguarding */}
        {st && (
          <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: T.text }}>DBS &amp; safeguarding{sel.isHead ? ' (you)' : ''}</div>
              <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: st.colour }}>{st.label}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
              <div style={box}><div style={{ fontSize: 9.5, color: T.text3, textTransform: 'uppercase' }}>DBS status</div><div style={{ fontSize: 12.5, fontWeight: 700, color: st.colour, marginTop: 3 }}>{st.label}</div></div>
              <div style={box}><div style={{ fontSize: 9.5, color: T.text3, textTransform: 'uppercase' }}>DBS number</div><div style={{ fontSize: 12.5, color: T.text, marginTop: 3 }}>{sel.dbs_number || '—'}</div></div>
              <div style={box}><div style={{ fontSize: 9.5, color: T.text3, textTransform: 'uppercase' }}>Issued</div><div style={{ fontSize: 12.5, color: T.text, marginTop: 3 }}>{sel.dbs_issued ? new Date(sel.dbs_issued).toLocaleDateString('en-GB') : '—'}</div></div>
              <div style={box}><div style={{ fontSize: 9.5, color: T.text3, textTransform: 'uppercase' }}>Expiry</div><div style={{ fontSize: 12.5, color: T.text, marginTop: 3 }}>{sel.dbs_expiry ? new Date(sel.dbs_expiry).toLocaleDateString('en-GB') : '—'}</div></div>
              <div style={box}><div style={{ fontSize: 9.5, color: T.text3, textTransform: 'uppercase' }}>Safeguarding</div><div style={{ fontSize: 12.5, color: sel.safeguarding_trained ? T.good : T.warn, marginTop: 3 }}>{sel.safeguarding_trained ? `✓ ${sel.safeguarding_date ? new Date(sel.safeguarding_date).toLocaleDateString('en-GB') : 'Trained'}` : 'Not recorded'}</div></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
              <button onClick={() => setEditing(sel)} style={{ appearance: 'none', border: `1px solid ${accent.border}`, background: accent.dim, color: accent.hex, borderRadius: 8, padding: '7px 13px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Record update</button>
              <a href="https://www.gov.uk/dbs-update-service" target="_blank" rel="noopener noreferrer" style={{ fontSize: 11.5, fontWeight: 600, color: T.text3, textDecoration: 'none' }}>Verify on the DBS Update Service ↗</a>
            </div>
            <div style={{ fontSize: 10.5, color: T.text3, marginTop: 8, lineHeight: 1.5 }}>Lumio tracks DBS by expiry date and flags anything expired, due within 90 days or missing. A live status check is only possible via the official DBS Update Service (with the certificate number and the person’s consent).</div>
          </div>
        )}

        {/* This week */}
        <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 0, overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ padding: '14px 16px 0', fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>This week</div>
          <div style={{ overflowX: 'auto', padding: 12 }}>
            <div style={{ minWidth: 680 }}>
              <div style={{ display: 'grid', gridTemplateColumns: `48px repeat(7, 1fr)`, borderBottom: `1px solid ${T.border}` }}>
                <div />{weekDays.map((d, i) => { const isT = isoD(d) === todayISO; return <div key={i} style={{ padding: '8px 4px', textAlign: 'center', borderLeft: `1px solid ${T.border}`, background: isT ? accent.dim : 'transparent' }}><div style={{ fontSize: 10.5, color: isT ? accent.hex : T.text2, fontWeight: 600 }}>{WD3[i]}</div><div style={{ fontSize: 15, color: isT ? accent.hex : T.text, fontWeight: 600 }}>{d.getDate()}</div></div> })}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: `48px repeat(7, 1fr)` }}>
                <div>{HRS.map(h => <div key={h} style={{ height: ROW, fontSize: 9.5, color: T.text3, padding: '2px 5px', textAlign: 'right' }}>{pad2(h)}:00</div>)}</div>
                {weekDays.map((d, di) => {
                  const dayB = myBookings.filter((b: any) => b.booking_date === isoD(d))
                  return (
                    <div key={di} style={{ position: 'relative', borderLeft: `1px solid ${T.border}` }}>
                      {HRS.map(h => <div key={h} style={{ height: ROW, borderTop: `1px solid ${T.border}` }} />)}
                      {dayB.map((b: any) => { const sm = toMins(b.start_time); if (sm == null) return null; const top = yFor(sm), h = Math.max(yFor(sm + (b.duration_min || 60)) - top - 2, 18); return (
                        <div key={b.id} title={b.title || b.player_name || ''} style={{ position: 'absolute', left: 3, right: 3, top: top + 1, height: h, background: `${accent.hex}26`, border: `1px solid ${accent.hex}`, borderLeft: `3px solid ${accent.hex}`, borderRadius: 6, padding: '2px 5px', overflow: 'hidden' }}>
                          <div style={{ fontSize: 10, color: T.text, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title || b.player_name || 'Session'}</div>
                          <div style={{ fontSize: 8.5, color: T.text2 }}>{hhmm(sm)}{b.court ? ` · ${b.court}` : ''}</div>
                        </div>) })}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Assigned players */}
        <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Assigned players · {myPlayers.length}</div>
          {myPlayers.length === 0 ? <div style={{ fontSize: 12.5, color: T.text3 }}>No players assigned to this coach yet. Use “Move to coach…” on another coach, or set a player’s coach in the Roster.</div> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
              {myPlayers.map((p: any) => (
                <div key={p.id} style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, padding: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {p.avatar_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={avatarSrc(p.avatar_url)} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      : <span style={{ width: 28, height: 28, borderRadius: '50%', background: accent.dim, color: accent.hex, display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700 }}>{initialsOf(p.name)}</span>}
                    <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12.5, fontWeight: 600, color: T.text }}>{p.name}</div><div style={{ fontSize: 10.5, color: T.text3 }}>{[p.category || p.level, p.age ? `Age ${p.age}` : ''].filter(Boolean).join(' · ')}</div></div>
                  </div>
                  {p.goal && <div style={{ fontSize: 11, color: T.text2, marginTop: 8 }}>⚑ {p.goal}</div>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
                    <span style={{ fontSize: 9.5, color: T.text3, textTransform: 'uppercase' }}>Reassign</span>
                    <select value="" onChange={e => { if (e.target.value) reassign(p.id, e.target.value) }} style={{ flex: 1, background: T.panel, color: T.text2, border: `1px solid ${T.border}`, borderRadius: 7, padding: '5px 8px', fontSize: 11.5, cursor: 'pointer' }}>
                      <option value="">Move to coach…</option>
                      {everyone.filter(c => c.name !== sel.name).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {editing !== undefined && <StaffForm T={T} accent={accent} initial={editing} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); staff.reload() }} />}
      </div>
    )
  }

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
        {([['Coaches', everyone.length, T.text], ['Players', players.rows.length, '#3A8EE0'], ['DBS valid', `${dbsValid}/${everyone.length}`, T.good], ['DBS attention', flagged.length, flagged.length ? T.warn : T.text3]] as const).map(([l, v, c]) => (
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
          const st = dbsState(s.dbs_expiry)
          const specialisms = (s.qualifications || '').split(',').map((x: string) => x.trim()).filter(Boolean)
          return (
            <div key={s.id} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {s.avatar_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={avatarSrc(s.avatar_url)} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  : <span style={{ width: 34, height: 34, borderRadius: '50%', background: accent.dim, color: accent.hex, display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700 }}>{initials(s.name)}</span>}
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
              {(() => { const cs = statsFor(s); return (
                <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                  {(([['Today', cs.today], ['Week', cs.week], ['Players', cs.players], ['Util', cs.util == null ? '—' : `${cs.util}%`]]) as [string, string | number][]).map(([l, v]) => <div key={l}><div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{v}</div><div style={{ fontSize: 9, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{l}</div></div>)}
                </div>
              ) })()}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
                <button onClick={() => setEditing(s)} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, padding: '5px 11px', color: T.text2, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>{s.isHead ? 'Edit your details' : 'Edit'}</button>
                {!s.isHead && <button onClick={() => { if (confirm(`Delete ${s.name}?`)) { dbRemove('coach_staff', s.id).then(() => staff.reload()) } }} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, padding: '5px 11px', color: '#EF4444', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Delete</button>}
                <button onClick={() => setSel(s)} style={{ marginLeft: 'auto', appearance: 'none', border: 0, background: 'transparent', color: accent.hex, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>View →</button>
              </div>
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
  const isHead = !!initial?.isHead
  const { rows: venues } = useCoachTable<{ id: string; name: string }>('coach_venues')
  const set = (k: string, v: any) => setD(p => ({ ...p, [k]: v }))
  const input: React.CSSProperties = { width: '100%', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 9, padding: '9px 11px', color: T.text, fontSize: 13, boxSizing: 'border-box', outline: 'none', marginTop: 5 }
  const lbl: React.CSSProperties = { display: 'block', color: T.text3, fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }
  const fld = (k: string, label: string, type = 'text', ph?: string) => <div><label style={lbl}>{label}</label><input type={type} value={d[k] ?? ''} onChange={e => set(k, e.target.value)} placeholder={ph} style={input} /></div>

  const save = async () => {
    if (!String(d.name ?? '').trim()) { setErr('Name is required'); return }
    setSaving(true); setErr('')
    try {
      // The head coach (you) — store contact + DBS / safeguarding in settings.
      if (initial?.isHead) {
        setSettings({ head: { phone: d.phone || '', email: d.email || '', contractedHours: Number(d.contracted_hours) || null, dbsNumber: d.dbs_number || '', dbsIssued: d.dbs_issued || '', dbsExpiry: d.dbs_expiry || '', safeguardingTrained: !!d.safeguarding_trained, safeguardingDate: d.safeguarding_date || '', avatarUrl: d.avatar_url || '' } })
        onSaved(); return
      }
      const row = { name: d.name, role: d.role || null, email: d.email || null, phone: d.phone || null, qualifications: d.qualifications || null, home_venue: d.home_venue || null, contracted_hours: Number(d.contracted_hours) || null, notes: d.notes || null, dbs_number: d.dbs_number || null, dbs_issued: d.dbs_issued || null, dbs_expiry: d.dbs_expiry || null, safeguarding_trained: !!d.safeguarding_trained, safeguarding_date: d.safeguarding_date || null }
      if (initial?.id) await dbUpdate('coach_staff', initial.id, row); else await dbInsert('coach_staff', row)
      onSaved()
    } catch (e) { setErr(e instanceof Error ? e.message : 'Save failed'); setSaving(false) }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '5vh 16px', overflowY: 'auto' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 560, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24 }}>
        <h3 style={{ color: T.text, fontSize: 18, fontWeight: 700, margin: '0 0 16px' }}>{isHead ? 'Your details (head coach)' : initial?.id ? 'Edit staff member' : 'Add staff member'}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {isHead
            ? <div><label style={lbl}>Name</label><input value={d.name ?? ''} readOnly title="Set under Settings → Head coach profile" style={{ ...input, opacity: 0.65, cursor: 'not-allowed' }} /></div>
            : fld('name', 'Name')}
          {isHead
            ? <div><label style={lbl}>Role</label><input value={d.role ?? 'Head Coach'} readOnly style={{ ...input, opacity: 0.65, cursor: 'not-allowed' }} /></div>
            : fld('role', 'Role', 'text', 'e.g. Assistant Coach')}
          {fld('qualifications', 'Qualifications', 'text', 'e.g. Level 3')}
          <div><label style={lbl}>Home venue</label>
            <select value={d.home_venue ?? ''} onChange={e => set('home_venue', e.target.value)} style={input}>
              <option value="">{venues.length ? '— Select venue —' : 'Add venues in Settings → Venues'}</option>
              {venues.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
            </select>
          </div>
          {fld('contracted_hours', 'Contracted h/wk', 'number', 'e.g. 24')}
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
