'use client'

// Live Player Roster — mirrors the demo roster (cards, filters, Welcome pack)
// and the player detail modal (stat tiles, goal, Development / Contact / Lessons
// tabs, racket journey) but wired to the coach's own data. Fields not yet
// captured show a clear placeholder.

import { useState, useEffect, useCallback } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { useCoachTable, dbInsert, dbUpdate, dbRemove, dbList, RACKET_STAGES, SKILLS_BY_STAGE, SKILL_LEVELS, skillLevelColour, setSkillScore } from '../_lib/coach-db'

type Common = { T: ThemeTokens; accent: AccentTokens; density: Density }
const CATEGORIES = ['Junior', 'Performance', 'Adult'] as const

const initials = (n: string) => (n || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
function stageOf(id?: string | null) {
  const idx = RACKET_STAGES.findIndex(s => s.id === id)
  return { idx, stage: idx >= 0 ? RACKET_STAGES[idx] : null, pct: idx >= 0 ? Math.round(((idx + 1) / RACKET_STAGES.length) * 100) : 0 }
}

function Avatar({ accent, name, size = 40 }: { accent: AccentTokens; name: string; size?: number }) {
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
  const [group, setGroup] = useState<'All' | typeof CATEGORIES[number]>('All')
  const [sel, setSel] = useState<any | null>(null)
  const [editing, setEditing] = useState<any | null | undefined>(undefined) // undefined = closed

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
                  <Avatar accent={accent} name={p.name} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: T.text3 }}>{p.category || p.level || 'Player'}{p.age ? ` · Age ${p.age}` : ''}</div>
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
                <button onClick={e => { e.stopPropagation(); printWelcomePack(p) }} style={{ width: '100%', marginTop: 8, appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 8, padding: '7px 10px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
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
  const set = (k: string, v: any) => setD(p => ({ ...p, [k]: v }))

  const save = async () => {
    if (!String(d.name ?? '').trim()) { setErr('Name is required'); return }
    setSaving(true); setErr('')
    try {
      const row = {
        name: d.name, category: d.category || null, age: d.age || null, parent_name: d.parent_name || null, racket_stage: d.racket_stage || null, goal: d.goal || null, level: d.level || null, email: d.email || null, phone: d.phone || null, notes: d.notes || null,
        consent_data: !!d.consent_data, consent_photo: !!d.consent_photo, consent_medical: !!d.consent_medical, consent_by: d.consent_by || null, consent_date: d.consent_date || null, medical_notes: d.medical_notes || null,
      }
      if (initial?.id) await dbUpdate('coach_players', initial.id, row); else await dbInsert('coach_players', row)
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {field('name', 'Name', 'text', 'Player name')}
          <div><label style={lbl}>Category</label><select value={d.category ?? ''} onChange={e => set('category', e.target.value)} style={input}><option value="">—</option>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          {field('age', 'Age', 'number')}
          {field('parent_name', 'Parent / guardian')}
          <div><label style={lbl}>Racket stage</label><select value={d.racket_stage ?? ''} onChange={e => set('racket_stage', e.target.value)} style={input}><option value="">—</option>{RACKET_STAGES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
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
            {([['consent_data', 'Data processing'], ['consent_photo', 'Photo / video'], ['consent_medical', 'Hold medical info']] as const).map(([k, label]) => (
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
          <Avatar accent={accent} name={player.name} size={50} />
          <div>
            <div style={{ fontSize: 19, fontWeight: 600, color: T.text }}>{player.name}</div>
            <div style={{ fontSize: 12, color: T.text3 }}>{player.category || player.level || 'Player'}{player.age ? ` · Age ${player.age}` : ''}{player.parent_name ? ` · Parent: ${player.parent_name}` : ''}</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
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
                {([['Data processing', player.consent_data], ['Photo / video', player.consent_photo], ['Medical info', player.consent_medical]] as const).map(([l, ok]) => (
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
              <p style={{ fontSize: 11.5, color: T.text3, margin: '0 0 12px' }}>Record or change consent using <b style={{ color: T.text2 }}>Edit</b>. Use Export to fulfil a data-access request, or Delete (Contact tab) for a right-to-erasure request.</p>
              <button onClick={() => exportPlayerData(player, lessons, attendanceRows)} style={{ background: 'transparent', border: `1px solid ${T.border}`, color: T.text2, borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>⬇ Export this player&apos;s data</button>
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
function printWelcomePack(p: any) {
  const s = stageOf(p.racket_stage)
  const journey = RACKET_STAGES.map((b, bi) => `<li style="${s.idx >= 0 && bi <= s.idx ? '' : 'opacity:.4'}">${b.name}${s.idx === bi ? ' — current' : ''}</li>`).join('')
  const w = window.open('', '_blank', 'width=720,height=900')
  if (!w) return
  w.document.write(`<!doctype html><html><head><title>Welcome pack — ${p.name}</title>
    <style>body{font-family:Arial,sans-serif;max-width:640px;margin:40px auto;color:#111;line-height:1.6;padding:0 20px}h1{margin-bottom:4px}.muted{color:#666;font-size:14px}ul{padding-left:18px}</style></head>
    <body><h1>Welcome, ${p.name}</h1><p class="muted">${[p.category, p.age ? 'Age ' + p.age : '', p.level].filter(Boolean).join(' · ')}</p>
    ${p.goal ? `<p><strong>Goal:</strong> ${p.goal}</p>` : ''}
    <p><strong>Current racket stage:</strong> ${s.stage ? s.stage.name : 'Not set'}</p>
    <h3>Your racket journey</h3><ul>${journey}</ul>
    ${p.parent_name ? `<p class="muted">Parent / guardian: ${p.parent_name}</p>` : ''}
    <p class="muted">Welcome to the academy — we're glad to have you on court.</p>
    </body></html>`)
  w.document.close(); w.focus(); w.print()
}
