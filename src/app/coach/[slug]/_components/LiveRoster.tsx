'use client'

// Live Player Roster — mirrors the demo roster (cards, filters, Welcome pack)
// and the player detail modal (stat tiles, goal, Development / Contact / Lessons
// tabs, racket journey) but wired to the coach's own data. Fields not yet
// captured show a clear placeholder.

import { useState, useEffect, useCallback } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { useCoachTable, dbInsert, dbUpdate, dbRemove, dbList, RACKET_STAGES, RACKET_SKILLS, SKILLS_BY_STAGE, SKILL_LEVELS, skillLevelColour, setSkillScore, useCoachProfile } from '../_lib/coach-db'
import { WatchConnectPanel } from './WatchConnectPanel'
import { fileToAvatarDataUrl, uploadAvatar, avatarSrc } from '@/lib/avatar'

// v1: Effort & Rewards is manual-only — smartwatch QR pairing is hidden until v2.
const SHOW_WATCH_PAIRING: boolean = false

// Generate a fresh opaque watch token client-side (matches the DB default shape).
function newWatchToken() {
  const r = () => (crypto.randomUUID?.() || Math.random().toString(36).slice(2)).replace(/-/g, '')
  return (r() + r()).slice(0, 64)
}

type Common = { T: ThemeTokens; accent: AccentTokens; density: Density }
const CATEGORIES = ['Junior', 'Performance', 'Adult'] as const

const initials = (n: string) => (n || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
function stageOf(id?: string | null) {
  const idx = RACKET_STAGES.findIndex(s => s.id === id)
  return { idx, stage: idx >= 0 ? RACKET_STAGES[idx] : null, pct: idx >= 0 ? Math.round(((idx + 1) / RACKET_STAGES.length) * 100) : 0 }
}

function Avatar({ accent, name, size = 40, url }: { accent: AccentTokens; name: string; size?: number; url?: string | null }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatarSrc(url)} alt={name} style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, objectFit: 'cover', background: accent.dim }} />
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: accent.dim, color: accent.hex, display: 'grid', placeItems: 'center', fontSize: size * 0.36, fontWeight: 700 }}>
      {initials(name)}
    </div>
  )
}
function RacketChip({ stage, T }: { stage: { name: string; colour: string } | null; T: ThemeTokens }) {
  if (!stage) return <span style={{ fontSize: 11, color: T.text3 }}>No stage</span>
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: T.text }}>
      <span style={{ width: 18, height: 11, borderRadius: 3, background: stage.colour, border: '1px solid rgba(128,128,128,0.4)' }} />
      {stage.name}
    </span>
  )
}

export function LiveRoster({ T, accent, density }: Common) {
  const players = useCoachTable<any>('coach_players')
  const skills = useCoachTable<any>('coach_player_skills')
  const attendance = useCoachTable<any>('coach_attendance')
  const wpProfile = useCoachProfile()
  const wpOrg = { academy: wpProfile.brand_name || 'Lumio Tennis Academy', coach: wpProfile.display_name || 'Your Coach' }
  const [group, setGroup] = useState<'All' | typeof CATEGORIES[number]>('All')
  const [sel, setSel] = useState<any | null>(null)
  const [editing, setEditing] = useState<any | null | undefined>(undefined) // undefined = closed

  // Deep-link: another screen (e.g. dashboard "Needs attention") can ask the roster
  // to open straight onto a specific player's card.
  useEffect(() => {
    if (players.loading) return
    let id: string | null = null
    try { id = sessionStorage.getItem('lumio_open_player') } catch { /* ignore */ }
    if (!id) return
    try { sessionStorage.removeItem('lumio_open_player') } catch { /* ignore */ }
    const p = players.rows.find(x => x.id === id)
    if (p) setSel(p)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players.loading])

  const list = group === 'All' ? players.rows : players.rows.filter(p => p.category === group)
  const tabs = ['All', ...CATEGORIES] as const

  const skillMapFor = (pid: string) => Object.fromEntries(skills.rows.filter(s => s.player_id === pid).map(s => [s.skill, s.score])) as Record<string, number>
  const progressFor = (p: any) => {
    const st = stageOf(p.racket_stage); if (st.idx < 0) return 0
    const list = SKILLS_BY_STAGE[st.stage!.id] || []; if (!list.length) return 0
    const m = skillMapFor(p.id)
    return Math.round(list.filter(s => (m[s] || 0) >= 4).length / list.length * 100)
  }
  const attendanceFor = (pid: string): number | null => {
    const recs = attendance.rows.filter(a => a.player_id === pid)
    if (!recs.length) return null
    return Math.round(recs.filter(a => a.present).length / recs.length * 100)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <div>
          <h2 style={{ color: T.text, fontSize: 22, fontWeight: 700, margin: 0 }}>Player Roster</h2>
          <p style={{ color: T.text3, fontSize: 13, margin: '4px 0 0' }}>Everyone you coach, at a glance.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', padding: 2, background: T.hover, borderRadius: 8 }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setGroup(t)} style={{ appearance: 'none', border: 0, padding: '5px 12px', borderRadius: 6, fontSize: 11.5, cursor: 'pointer', background: group === t ? T.panel : 'transparent', color: group === t ? T.text : T.text2, fontWeight: group === t ? 600 : 400 }}>{t}</button>
            ))}
          </div>
          <button onClick={() => setEditing(null)} style={{ appearance: 'none', border: 0, padding: '8px 14px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 12.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
            <Icon name="plus" size={14} stroke={2} /> Add player
          </button>
        </div>
      </div>

      {players.loading ? (
        <p style={{ color: T.text3, fontSize: 13, padding: '40px 0', textAlign: 'center' }}>Loading…</p>
      ) : list.length === 0 ? (
        <div style={{ border: `1px dashed ${T.border}`, borderRadius: 14, padding: 40, textAlign: 'center' }}>
          <p style={{ color: T.text2, fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>No players yet</p>
          <p style={{ color: T.text3, fontSize: 13, margin: '0 0 16px' }}>Add the players you coach and they appear here as cards.</p>
          <button onClick={() => setEditing(null)} style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Add your first player</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: density.gap }}>
          {list.map(p => {
            const s = stageOf(p.racket_stage)
            const prog = progressFor(p)
            const att = attendanceFor(p.id)
            return (
              <div key={p.id} onClick={() => setSel(p)} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: density.radius, padding: density.pad, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar accent={accent} name={p.name} size={40} url={p.avatar_url} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: T.text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.category || p.level || 'Player'}{p.age ? ` · Age ${p.age}` : ''}{p.assigned_coach ? ` · 🧑‍🏫 ${p.assigned_coach}` : ''}</div>
                  </div>
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: accent.hex }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                  <RacketChip stage={s.stage} T={T} />
                  <span style={{ marginLeft: 'auto', fontSize: 10.5, color: T.text3 }}>{prog}% to next</span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: T.hover, marginTop: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${prog}%`, height: '100%', background: accent.hex }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 11, color: T.text2 }}>
                  <span><span style={{ color: T.text3 }}>Attendance</span> {att !== null ? `${att}%` : '—'}</span>
                  <span><span style={{ color: T.text3 }}>Stage</span> {s.idx >= 0 ? `${s.idx + 1}/${RACKET_STAGES.length}` : '—'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.text3, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
                  <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>🎯 {p.goal || 'No goal set'}</span>
                  <span style={{ color: accent.hex, fontWeight: 600, whiteSpace: 'nowrap' }}>View →</span>
                </div>
                {!p.consent_photo && <div style={{ fontSize: 10.5, color: '#EF4444', marginTop: 6 }}>⚠ No photo/video consent</div>}
                <button onClick={e => { e.stopPropagation(); printWelcomePack(p, wpOrg) }} style={{ width: '100%', marginTop: 8, appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 8, padding: '7px 10px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <Icon name="note" size={13} stroke={1.8} style={{ color: accent.hex }} /> Welcome pack
                </button>
              </div>
            )
          })}
        </div>
      )}

      {sel && (
        <PlayerDetail T={T} accent={accent} density={density} player={sel}
          skillMap={skillMapFor(sel.id)}
          attendanceRows={attendance.rows.filter(a => a.player_id === sel.id)}
          onSkillChange={async (skill, score) => { await setSkillScore(sel.id, skill, score); skills.reload() }}
          onAttendanceAdd={async (date, present) => { await dbInsert('coach_attendance', { player_id: sel.id, session_date: date || null, present }); attendance.reload() }}
          onAttendanceRemove={async (id) => { await dbRemove('coach_attendance', id); attendance.reload() }}
          onClose={() => setSel(null)}
          onEdit={() => { setEditing(sel); setSel(null) }}
          onDelete={async () => { if (confirm(`Delete ${sel.name}?`)) { await dbRemove('coach_players', sel.id); setSel(null); players.reload() } }} />
      )}
      {editing !== undefined && (
        <PlayerForm T={T} accent={accent} initial={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => { setEditing(undefined); players.reload() }} />
      )}
    </div>
  )
}

// ── Add / edit form ─────────────────────────────────────────────────────────
function PlayerForm({ T, accent, initial, onClose, onSaved }: { T: ThemeTokens; accent: AccentTokens; initial: any | null; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState<Record<string, any>>(initial ?? {})
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [photo, setPhoto] = useState<string | null>(null) // newly-picked data URL (uploaded on save)
  const preview = photo || initial?.avatar_url || null
  const pickPhoto = async (file?: File | null) => { if (!file) return; try { setPhoto(await fileToAvatarDataUrl(file)) } catch { /* ignore */ } }
  const set = (k: string, v: any) => setD(p => ({ ...p, [k]: v }))
  const profile = useCoachProfile()
  const { rows: staffRows } = useCoachTable<{ id: string; name: string }>('coach_staff')
  const coaches = [profile.display_name || 'Head Coach', ...staffRows.map(s => s.name)]

  const save = async () => {
    if (!String(d.name ?? '').trim()) { setErr('Name is required'); return }
    setSaving(true); setErr('')
    try {
      const row = {
        name: d.name, category: d.category || null, age: d.age || null, parent_name: d.parent_name || null, racket_stage: d.racket_stage || null, assigned_coach: d.assigned_coach || null, goal: d.goal || null, level: d.level || null, email: d.email || null, phone: d.phone || null, notes: d.notes || null,
        consent_data: !!d.consent_data, consent_photo: !!d.consent_photo, consent_medical: !!d.consent_medical, consent_wearable: !!d.consent_wearable, consent_by: d.consent_by || null, consent_date: d.consent_date || null, medical_notes: d.medical_notes || null,
      }
      let playerId = initial?.id as string | undefined
      if (initial?.id) await dbUpdate('coach_players', initial.id, row)
      else { const created = await dbInsert('coach_players', row); playerId = created?.id }
      if (photo && playerId) { try { await uploadAvatar('/api/coach/avatar', { playerId, dataUrl: photo }) } catch { /* ignore */ } }
      onSaved()
    } catch (e) { setErr(e instanceof Error ? e.message : 'Save failed'); setSaving(false) }
  }

  const input: React.CSSProperties = { width: '100%', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 12px', color: T.text, fontSize: 13, boxSizing: 'border-box', outline: 'none', marginTop: 5 }
  const lbl: React.CSSProperties = { display: 'block', color: T.text3, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }
  const field = (k: string, label: string, type = 'text', ph?: string) => (
    <div><label style={lbl}>{label}</label><input type={type} value={d[k] ?? ''} onChange={e => set(k, e.target.value)} placeholder={ph} style={input} /></div>
  )

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '5vh 16px', overflowY: 'auto' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 560, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24 }}>
        <h3 style={{ color: T.text, fontSize: 18, fontWeight: 700, margin: '0 0 16px' }}>{initial?.id ? 'Edit player' : 'Add player'}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <label title="Add a photo" style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
            {preview
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={preview} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }} />
              : <div style={{ width: 56, height: 56, borderRadius: '50%', background: accent.dim, color: accent.hex, display: 'grid', placeItems: 'center', fontSize: 20 }}>📷</div>}
            <span style={{ position: 'absolute', right: -2, bottom: -2, width: 20, height: 20, borderRadius: '50%', background: accent.hex, color: T.btnText, fontSize: 11, display: 'grid', placeItems: 'center', border: `2px solid ${T.panel}` }}>✎</span>
            <input type="file" accept="image/*" onChange={e => pickPhoto(e.target.files?.[0])} style={{ display: 'none' }} />
          </label>
          <div style={{ fontSize: 12, color: T.text3 }}>{preview ? 'Photo added — saved with the player.' : 'Add a profile photo (optional).'}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {field('name', 'Name', 'text', 'Player name')}
          <div><label style={lbl}>Category</label><select value={d.category ?? ''} onChange={e => set('category', e.target.value)} style={input}><option value="">—</option>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          {field('age', 'Age', 'number')}
          {field('parent_name', 'Parent / guardian')}
          <div><label style={lbl}>Racket stage</label><select value={d.racket_stage ?? ''} onChange={e => set('racket_stage', e.target.value)} style={input}><option value="">—</option>{RACKET_STAGES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <div><label style={lbl}>Coach</label><select value={d.assigned_coach ?? ''} onChange={e => set('assigned_coach', e.target.value)} style={input}><option value="">Head coach (you)</option>{coaches.slice(1).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          {field('level', 'Level', 'text', 'e.g. Red ball')}
          {field('email', 'Email')}
          {field('phone', 'Phone')}
        </div>
        <div style={{ marginTop: 12 }}>{field('goal', 'Goal', 'text', 'e.g. First serve over the net consistently')}</div>
        <div style={{ marginTop: 12 }}><label style={lbl}>Notes</label><textarea value={d.notes ?? ''} onChange={e => set('notes', e.target.value)} rows={2} style={{ ...input, resize: 'vertical' }} /></div>

        {/* Consent & medical (GDPR) */}
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Consent &amp; medical</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 10 }}>
            {([['consent_data', 'Data processing'], ['consent_photo', 'Photo / video'], ['consent_medical', 'Hold medical info'], ['consent_wearable', 'Wearable / heart-rate']] as const).map(([k, label]) => (
              <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: T.text, cursor: 'pointer' }}>
                <input type="checkbox" checked={!!d[k]} onChange={e => set(k, e.target.checked)} /> {label}
              </label>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {field('consent_by', 'Consent given by', 'text', 'Parent / guardian name')}
            {field('consent_date', 'Consent date', 'date')}
          </div>
          <div style={{ marginTop: 12 }}><label style={lbl}>Medical / emergency notes</label><textarea value={d.medical_notes ?? ''} onChange={e => set('medical_notes', e.target.value)} rows={2} placeholder="Allergies, conditions, emergency contact…" style={{ ...input, resize: 'vertical' }} /></div>
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

// ── Player detail modal ──────────────────────────────────────────────────────
function PlayerDetail({ T, accent, density, player, skillMap, attendanceRows, onSkillChange, onAttendanceAdd, onAttendanceRemove, onClose, onEdit, onDelete }: Common & {
  player: any; skillMap: Record<string, number>; attendanceRows: any[]
  onSkillChange: (skill: string, score: number) => Promise<void>
  onAttendanceAdd: (date: string, present: boolean) => Promise<void>
  onAttendanceRemove: (id: string) => Promise<void>
  onClose: () => void; onEdit: () => void; onDelete: () => void
}) {
  const [tab, setTab] = useState<'dev' | 'contact' | 'lessons' | 'attendance' | 'consent'>('dev')
  const [lessons, setLessons] = useState<any[]>([])
  const [nextSession, setNextSession] = useState<string>('—')
  const [attDate, setAttDate] = useState('')
  const [inviteMsg, setInviteMsg] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(player.avatar_url || null)
  const [photoBusy, setPhotoBusy] = useState(false)
  const onPhoto = async (file?: File | null) => {
    if (!file || photoBusy) return
    setPhotoBusy(true)
    try { const data = await fileToAvatarDataUrl(file); const url = await uploadAvatar('/api/coach/avatar', { playerId: player.id, dataUrl: data }); if (url) setAvatarUrl(url) } catch { /* ignore */ } finally { setPhotoBusy(false) }
  }
  const inviteEmail = player.email || player.parent_email
  const invitePortal = async () => {
    if (!inviteEmail) { setInviteMsg('Add an email on the Contact tab first.'); return }
    setInviteMsg('Sending…')
    try {
      const r = await fetch('/api/portal/invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: inviteEmail, role: 'parent', scopePlayerId: player.id, name: player.parent_name || player.name }) })
      setInviteMsg(r.ok ? `✓ Invite sent to ${inviteEmail}` : 'Could not send invite.')
    } catch { setInviteMsg('Could not send invite.') }
  }
  const s = stageOf(player.racket_stage)
  const stageSkills = s.stage ? (SKILLS_BY_STAGE[s.stage.id] || []) : []
  const racketProgress = stageSkills.length ? Math.round(stageSkills.filter(sk => (skillMap[sk] || 0) >= 4).length / stageSkills.length * 100) : 0
  const attPct = attendanceRows.length ? Math.round(attendanceRows.filter(a => a.present).length / attendanceRows.length * 100) : null

  const load = useCallback(async () => {
    const [sess, books] = await Promise.all([dbList('coach_sessions'), dbList('coach_bookings')])
    const mine = (rows: any[]) => rows.filter(r => (r.player_name || '').trim().toLowerCase() === (player.name || '').trim().toLowerCase())
    setLessons(mine(sess).sort((a, b) => String(b.session_date ?? '').localeCompare(String(a.session_date ?? ''))))
    const today = new Date().toISOString().slice(0, 10)
    const up = mine(books).filter(b => (b.booking_date ?? '') >= today).sort((a, b) => String(a.booking_date).localeCompare(String(b.booking_date)))[0]
    setNextSession(up ? `${new Date(up.booking_date).toLocaleDateString('en-GB')}${up.start_time ? ' ' + up.start_time : ''}` : '—')
  }, [player.name])
  useEffect(() => { load() }, [load])

  const tile = (label: string, value: React.ReactNode, color?: string, small?: boolean) => (
    <div style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 11px' }}>
      <div style={{ fontSize: 9.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: small ? 12.5 : 15, fontWeight: 600, color: color ?? T.text, marginTop: 3 }}>{value}</div>
    </div>
  )

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '5vh 16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 780, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 16 }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: `${density.pad + 2}px ${density.pad + 4}px`, borderBottom: `1px solid ${T.border}` }}>
          <label title="Change photo" style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
            <Avatar accent={accent} name={player.name} size={50} url={avatarUrl} />
            <span style={{ position: 'absolute', right: -2, bottom: -2, width: 18, height: 18, borderRadius: '50%', background: accent.hex, color: T.btnText, fontSize: 10, display: 'grid', placeItems: 'center', border: `2px solid ${T.panel}` }}>{photoBusy ? '…' : '✎'}</span>
            <input type="file" accept="image/*" onChange={e => onPhoto(e.target.files?.[0])} style={{ display: 'none' }} />
          </label>
          <div>
            <div style={{ fontSize: 19, fontWeight: 600, color: T.text }}>{player.name}</div>
            <div style={{ fontSize: 12, color: T.text3 }}>{player.category || player.level || 'Player'}{player.age ? ` · Age ${player.age}` : ''}{player.parent_name ? ` · Parent: ${player.parent_name}` : ''}</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            {inviteMsg && <span style={{ fontSize: 11, color: inviteMsg.startsWith('✓') ? T.good : T.text3 }}>{inviteMsg}</span>}
            <button onClick={invitePortal} title="Invite the parent to a read-only portal for this player" style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text2, cursor: 'pointer', padding: '6px 12px', fontSize: 12, fontWeight: 600 }}>🔑 Invite parent</button>
            <button onClick={onEdit} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text2, cursor: 'pointer', padding: '6px 12px', fontSize: 12, fontWeight: 600 }}>Edit</button>
            <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text3, cursor: 'pointer', width: 32, height: 32, fontSize: 18, lineHeight: 1 }}>×</button>
          </div>
        </div>

        <div style={{ padding: `${density.pad}px ${density.pad + 4}px ${density.pad + 4}px` }}>
          {/* stat tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, marginBottom: 14 }}>
            {tile('Current racket', <RacketChip stage={s.stage} T={T} />)}
            {tile('Racket progress', `${racketProgress}%`, accent.hex)}
            {tile('Attendance', attPct !== null ? `${attPct}%` : '—', attPct === null ? T.text3 : attPct >= 90 ? T.good : attPct >= 80 ? T.warn : T.bad, attPct === null)}
            {tile('Lessons', String(lessons.length))}
            {tile('Next session', nextSession, undefined, true)}
          </div>

          {/* goal */}
          <div style={{ background: accent.dim, border: `1px solid ${accent.border}`, borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Icon name="flag" size={13} stroke={1.8} style={{ color: accent.hex }} />
            <span style={{ fontSize: 10, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Goal</span>
            <span style={{ fontSize: 12.5, color: T.text }}>{player.goal || 'No goal set yet — add one when you edit this player.'}</span>
          </div>

          {/* tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 14, padding: 2, background: T.hover, borderRadius: 9, width: 'fit-content' }}>
            {([['dev', 'Development'], ['contact', 'Contact'], ['lessons', `Lessons · ${lessons.length}`], ['attendance', `Attendance · ${attendanceRows.length}`], ['consent', 'Consent']] as const).map(([id, l]) => (
              <button key={id} onClick={() => setTab(id)} style={{ appearance: 'none', border: 0, padding: '6px 16px', borderRadius: 7, fontSize: 12, cursor: 'pointer', background: tab === id ? T.panel : 'transparent', color: tab === id ? T.text : T.text2, fontWeight: tab === id ? 600 : 400 }}>{l}</button>
            ))}
          </div>

          {tab === 'dev' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Working racket · {s.stage ? s.stage.name : '—'}</span>
                  <span style={{ fontSize: 11, color: accent.hex, fontWeight: 600 }}>{racketProgress}%</span>
                </div>
                {stageSkills.length === 0 ? (
                  <p style={{ fontSize: 12, color: T.text3 }}>Set a racket stage for this player to track skills.</p>
                ) : stageSkills.map(skill => {
                  const score = skillMap[skill] || 0
                  return (
                    <div key={skill} style={{ marginBottom: 11 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: T.text }}>{skill}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 10, color: skillLevelColour(score), fontWeight: 600 }}>{SKILL_LEVELS[score]}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[1, 2, 3, 4].map(lv => (
                          <button key={lv} title={SKILL_LEVELS[lv]} onClick={() => onSkillChange(skill, score === lv ? lv - 1 : lv)}
                            style={{ flex: 1, height: 9, borderRadius: 3, border: 0, padding: 0, cursor: 'pointer', background: lv <= score ? skillLevelColour(score) : T.hover }} />
                        ))}
                      </div>
                    </div>
                  )
                })}
                <p style={{ fontSize: 10.5, color: T.text3, marginTop: 4 }}>Tap a bar to mark mastery. Four bars (Consistent) = mastered.</p>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Racket journey</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {RACKET_STAGES.map((b, bi) => {
                    const state = s.idx < 0 ? 'locked' : bi < s.idx ? 'done' : bi === s.idx ? 'current' : 'locked'
                    return (
                      <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 9, opacity: state === 'locked' ? 0.4 : 1 }}>
                        <span style={{ width: 20, height: 12, borderRadius: 3, background: b.colour, border: '1px solid rgba(128,128,128,0.4)' }} />
                        <span style={{ fontSize: 11.5, color: T.text, fontWeight: state === 'current' ? 700 : 500, flex: 1 }}>{b.name}</span>
                        {state === 'done' && <Icon name="check" size={12} stroke={2.2} style={{ color: T.good }} />}
                        {state === 'current' && <span style={{ fontSize: 9, fontWeight: 700, color: accent.hex, background: accent.dim, padding: '1px 6px', borderRadius: 4, textTransform: 'uppercase' }}>now</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === 'contact' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[['Email', player.email], ['Phone', player.phone], ['Parent / guardian', player.parent_name], ['Level', player.level]].map(([l, v]) => (
                <div key={l as string} style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '9px 11px' }}>
                  <div style={{ fontSize: 9.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</div>
                  <div style={{ fontSize: 13, color: v ? T.text : T.text3, marginTop: 3 }}>{v || '—'}</div>
                </div>
              ))}
              {player.notes && <div style={{ gridColumn: '1 / -1', fontSize: 12.5, color: T.text2, lineHeight: 1.5 }}>{player.notes}</div>}
              <div style={{ gridColumn: '1 / -1' }}>
                <button onClick={onDelete} style={{ background: 'transparent', border: `1px solid rgba(239,68,68,0.4)`, color: '#EF4444', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Delete player</button>
              </div>
            </div>
          )}

          {tab === 'lessons' && (
            <div>
              {lessons.length === 0 ? (
                <p style={{ fontSize: 12.5, color: T.text3 }}>No lessons logged for this player yet. Log them in the Lesson Summaries module.</p>
              ) : lessons.map((l, i) => (
                <div key={l.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderTop: i ? `1px solid ${T.border}` : 'none' }}>
                  <div style={{ fontSize: 10.5, color: T.text3, width: 86, flexShrink: 0, paddingTop: 2 }}>{l.session_date ? new Date(l.session_date).toLocaleDateString('en-GB') : '—'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, color: T.text, fontWeight: 600 }}>{l.focus || 'Session'}{l.rating ? ` · ${l.rating}/5` : ''}</div>
                    {l.summary && <div style={{ fontSize: 11.5, color: T.text2, marginTop: 3 }}>{l.summary}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'attendance' && (
            <div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
                <input type="date" value={attDate} onChange={e => setAttDate(e.target.value)} style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 10px', color: T.text, fontSize: 12.5 }} />
                <button onClick={() => onAttendanceAdd(attDate, true)} style={{ border: '1px solid rgba(34,197,94,0.4)', background: 'rgba(34,197,94,0.1)', color: '#22C55E', borderRadius: 8, padding: '8px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>+ Present</button>
                <button onClick={() => onAttendanceAdd(attDate, false)} style={{ border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.1)', color: '#EF4444', borderRadius: 8, padding: '8px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>+ Absent</button>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: T.text3 }}>{attPct !== null ? `${attPct}% present (${attendanceRows.filter(a => a.present).length}/${attendanceRows.length})` : 'No records yet'}</span>
              </div>
              {attendanceRows.length === 0 ? (
                <p style={{ fontSize: 12.5, color: T.text3 }}>No attendance logged yet. Pick a date and mark the player present or absent.</p>
              ) : [...attendanceRows].sort((a, b) => String(b.session_date ?? '').localeCompare(String(a.session_date ?? ''))).map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderTop: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 12, color: T.text2, width: 100 }}>{a.session_date ? new Date(a.session_date).toLocaleDateString('en-GB') : '—'}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: a.present ? '#22C55E' : '#EF4444' }}>{a.present ? 'Present' : 'Absent'}</span>
                  <button onClick={() => onAttendanceRemove(a.id)} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: T.text3, cursor: 'pointer', fontSize: 16 }}>×</button>
                </div>
              ))}
            </div>
          )}

          {tab === 'consent' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 14 }}>
                {([['Data processing', player.consent_data], ['Photo / video', player.consent_photo], ['Medical info', player.consent_medical], ['Wearable / heart-rate', player.consent_wearable]] as const).map(([l, ok]) => (
                  <div key={l} style={{ background: T.panel2, border: `1px solid ${ok ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.35)'}`, borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 9.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: ok ? '#22C55E' : '#EF4444', marginTop: 3 }}>{ok ? '✓ Given' : '✗ Not given'}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12.5, color: T.text2, marginBottom: 6 }}>
                {player.consent_by ? `Consent given by ${player.consent_by}` : 'No consent giver recorded'}{player.consent_date ? ` · ${new Date(player.consent_date).toLocaleDateString('en-GB')}` : ''}
              </div>
              {player.medical_notes && <div style={{ fontSize: 12.5, color: T.text2, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', marginBottom: 14 }}><b style={{ color: T.text }}>Medical / emergency:</b> {player.medical_notes}</div>}
              {!player.consent_photo && <div style={{ fontSize: 12, color: '#EF4444', marginBottom: 12 }}>⚠ No photo/video consent — do not capture footage of this player.</div>}
              {!player.consent_wearable && <div style={{ fontSize: 12, color: '#F59E0B', marginBottom: 12 }}>⚠ No wearable/heart-rate consent — smartwatch effort tracking is blocked for this player.</div>}
              <p style={{ fontSize: 11.5, color: T.text3, margin: '0 0 12px' }}>Record or change consent using <b style={{ color: T.text2 }}>Edit</b>. Use Export to fulfil a data-access request, or Delete (Contact tab) for a right-to-erasure request.</p>
              <button onClick={() => exportPlayerData(player, lessons, attendanceRows)} style={{ background: 'transparent', border: `1px solid ${T.border}`, color: T.text2, borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>⬇ Export this player&apos;s data</button>

              {SHOW_WATCH_PAIRING && (
                <div style={{ marginTop: 16 }}>
                  <WatchConnectPanel
                    T={T} accent={accent}
                    token={player.watch_token || ''}
                    playerName={(player.name || '').split(' ')[0]}
                    consentOk={!!player.consent_wearable}
                    onReset={async () => { const nt = newWatchToken(); await dbUpdate('coach_players', player.id, { watch_token: nt }); return nt }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function exportPlayerData(player: any, lessons: any[], attendance: any[]) {
  const data = { player, lessons, attendance, exported_at: new Date().toISOString() }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = `${(player.name || 'player').replace(/\s+/g, '-').toLowerCase()}-data.json`; a.click()
  URL.revokeObjectURL(url)
}

// ── Welcome pack (printable) ─────────────────────────────────────────────────
const WP_THEME: Record<string, string> = { white: 'Foundations', yellow: 'Rallying', orange: 'Net & Touch', green: 'The Serve', blue: 'Spin & Shape', purple: 'Specialty Shots', brown: 'Weapons', red: 'Tactics', black: 'Mastery' }

// Rich 3-page printable welcome pack — welcome letter, starting action plan, and
// an onboarding questionnaire (mirrors the demo, over live data).
function printWelcomePack(p: any, org?: { academy: string; coach: string }) {
  if (typeof window === 'undefined') return
  const academy = org?.academy || 'Lumio Tennis Academy', coach = org?.coach || 'Your Coach'
  const esc = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const fill = (w = '100%') => `<span style="display:inline-block;border-bottom:1px dashed #b9bdca;min-width:${w};height:15px"></span>`
  const line = '<div style="border-bottom:1px dashed #b9bdca;height:22px;margin:6px 0"></div>'
  const s = stageOf(p.racket_stage)
  const stage = s.stage || RACKET_STAGES[0]
  const idx = s.idx >= 0 ? s.idx : 0
  const theme = WP_THEME[stage.id] || 'Foundations'
  const next = RACKET_STAGES[Math.min(idx + 1, RACKET_STAGES.length - 1)]
  const skills = (RACKET_SKILLS[stage.id] || []).map(sk => `<li>${esc(sk.name)} — <span style="color:#6b7280">${esc(sk.note)}</span></li>`).join('')
  const first = (p.name || 'there').split(' ')[0]

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Welcome Pack — ${esc(p.name)}</title>
  <style>*{box-sizing:border-box}body{margin:0;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1d29;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{width:210mm;min-height:296mm;padding:18mm 16mm;margin:0 auto;position:relative;page-break-after:always}.page:last-child{page-break-after:auto}
  .band{background:linear-gradient(120deg,#1f6fd6,#3A8EE0);color:#fff;border-radius:14px;padding:22px 26px}
  h2{font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:#1f6fd6;margin:22px 0 8px;border-bottom:2px solid #ecedf2;padding-bottom:5px}
  p{font-size:12.5px;line-height:1.7;color:#374151}ul,ol{margin:0;padding-left:20px}li{font-size:12px;line-height:1.6;color:#374151;margin-bottom:4px}
  .accentbox{border:1px solid #d6e6fb;border-left:4px solid #3A8EE0;border-radius:0 10px 10px 0;background:#f3f8ff;padding:12px 16px;margin-top:10px}
  .q{margin:0 0 12px}.q .lbl{font-size:12px;font-weight:600;color:#1a1d29;margin-bottom:4px}
  table{width:100%;border-collapse:collapse;margin-top:6px}td,th{font-size:12px;padding:6px 8px;border-bottom:1px solid #f0f1f6;text-align:left;vertical-align:top}th{color:#9099ad;font-size:9.5px;text-transform:uppercase;letter-spacing:.05em}
  .foot{position:absolute;bottom:12mm;left:16mm;right:16mm;display:flex;justify-content:space-between;font-size:9px;color:#aab;border-top:1px solid #eee;padding-top:8px}@page{size:A4;margin:0}</style></head><body>

  <div class="page">
    <div class="band"><div style="font-size:11px;letter-spacing:.3em;text-transform:uppercase;opacity:.85">Welcome Pack</div><div style="font-size:30px;font-weight:800;margin-top:6px">Welcome, ${esc(first)}! 🎾</div><div style="opacity:.9;margin-top:4px">${esc(academy)}</div></div>
    <p style="margin-top:18px">Hi ${esc(first)},</p>
    <p>A warm welcome to ${esc(academy)} — we're really pleased to have you on board. Whether you're brand new to tennis or coming back to it, our job is to help you improve, enjoy your tennis and hit some clear goals along the way.</p>
    <p>We coach using a <strong>racket progression system</strong> (like martial arts) — you'll work through clear skills at each racket, earn certificates as you progress, and always know what you're working towards. It keeps things fun, structured and motivating.</p>
    <h2>What happens next</h2>
    <ol><li><strong>Complete the onboarding questions</strong> (page 3) and bring them to your first session — this helps us place you at exactly the right racket.</li><li><strong>First session = assessment &amp; a hit</strong> — relaxed, no pressure, just so we can see your game.</li><li><strong>We agree your goals</strong> and set your starting racket and a simple plan.</li></ol>
    <h2>Handy to know</h2>
    <ul><li>Bring: trainers/tennis shoes, water, and a racket if you have one (we can lend one).</li><li>Wear comfortable sports clothing for the weather.</li><li>Lessons, progress and homework are shared through the Lumio Coach app.</li></ul>
    <p style="margin-top:14px">See you on court,<br/><strong style="font-family:Georgia,serif;font-style:italic;font-size:15px">${esc(coach)}</strong></p>
    <div class="foot"><span>${esc(academy)}</span><span>Welcome pack for ${esc(p.name)}</span></div>
  </div>

  <div class="page">
    <h2 style="margin-top:0">Your starting action plan</h2>
    <div class="accentbox" style="display:flex;align-items:center;gap:12px"><span style="width:40px;height:25px;border-radius:5px;background:${stage.colour};border:1px solid rgba(0,0,0,.25)"></span><div><div style="font-size:16px;font-weight:700">${esc(stage.name)} racket — ${esc(theme)}</div><div style="font-size:11px;color:#6b7280">Your suggested starting point — confirmed after your first session</div></div></div>
    <h2>Skills you'll work on first</h2><ul>${skills}</ul>
    ${p.goal ? `<h2>Your goal</h2><p>${esc(p.goal)}</p>` : ''}
    <h2>First four weeks</h2>
    <table><thead><tr><th style="width:70px">Week</th><th>Focus</th></tr></thead><tbody>
      <tr><td>Week 1</td><td>Assessment &amp; getting to know your game — set your racket and goal</td></tr>
      <tr><td>Week 2</td><td>Foundations of ${esc(theme.toLowerCase())}</td></tr>
      <tr><td>Week 3</td><td>Build &amp; repeat — take the new skills into rallies and games</td></tr>
      <tr><td>Week 4</td><td>First progress check — celebrate the wins and set the next target (${esc(next.name)})</td></tr>
    </tbody></table>
    <div class="foot"><span>${esc(academy)}</span><span>${esc(coach)}</span></div>
  </div>

  <div class="page">
    <h2 style="margin-top:0">Onboarding — tell us about your tennis</h2>
    <p style="margin-top:0">Please complete and bring to your first session. This helps us place you at the right racket from day one.</p>
    <table><tbody><tr><td style="width:50%">Player name: ${fill('120px')}</td><td>Date of birth: ${fill('110px')}</td></tr><tr><td>Parent/guardian (if junior): ${fill('100px')}</td><td>Best contact number: ${fill('110px')}</td></tr></tbody></table>
    <h2>Your tennis history</h2>
    <div class="q"><div class="lbl">How long have you been playing tennis?</div>${fill('200px')} years / months</div>
    <div class="q"><div class="lbl">Have you had coaching before? Where, and for how long?</div>${line}${line}</div>
    <div class="q"><div class="lbl">What level have you played at? (club, school, county, ratings)</div>${line}${line}</div>
    <div class="q"><div class="lbl">Do you compete, or would you like to?</div>${line}</div>
    <h2>Your goals</h2>
    <div class="q"><div class="lbl">What are you looking to achieve from these sessions?</div>${line}${line}${line}</div>
    <div class="q"><div class="lbl">Which parts of your game do you most want to improve?</div>${line}${line}</div>
    <h2>Practical</h2>
    <div class="q"><div class="lbl">Which days / times generally suit you?</div>${line}</div>
    <div class="q"><div class="lbl">Any injuries, medical conditions or things we should know?</div>${line}${line}</div>
    <div class="accentbox" style="margin-top:14px"><strong>For the coach:</strong> suggested starting racket after review: ${fill('150px')} &nbsp; Date: ${fill('90px')}</div>
    <div class="foot"><span>${esc(academy)}</span><span>Onboarding · ${esc(p.name)}</span></div>
  </div>
  </body></html>`
  const w = window.open('', '_blank', 'width=920,height=1040')
  if (!w) { alert('Please allow pop-ups to open the welcome pack.'); return }
  w.document.write(html); w.document.close(); w.focus()
  setTimeout(() => { try { w.print() } catch { /* manual */ } }, 350)
}
