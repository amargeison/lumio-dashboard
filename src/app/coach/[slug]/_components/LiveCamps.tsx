'use client'

// Live Training Camps — the demo CampsView over real data. Camp cards →
// selected camp with Overview / 14-Day Itinerary / Equipment / Attendees /
// Targets / Player Packs / Finance. The itinerary, equipment and objectives are
// designed by the Lumio Master Coach AI (/api/coach/camp-design) and editable.
// Attendees link to the roster so Player Packs pull real racket/attendance/skills.

import { useState, useMemo, type CSSProperties, type ReactNode } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { useCoachTable, dbInsert, dbRemove, RACKET_STAGES, RACKET_SKILLS } from '../_lib/coach-db'

type Camp = {
  id: string; name: string; start_date?: string | null; end_date?: string | null; capacity?: number | null
  price?: number | null; collected?: number | null; location?: string | null; region?: string | null
  surface?: string | null; courts?: number | null; board?: string | null; daily_rhythm?: string | null
  description?: string | null; confirmed?: boolean | null; notes?: string | null
  itinerary?: { day: number; focus?: string; did?: string; nextAction?: string }[] | null
  equipment?: string[] | null; objectives?: string[] | null
}
type Attendee = { id: string; camp_id: string; player_id?: string | null; player_name: string; paid?: boolean | null }
type Player = { id: string; name: string; age?: number | null; racket_stage?: string | null; avatar_url?: string | null }

const DAY = 86400000
const fmtD = (d?: string | null) => { const t = d ? new Date(d) : null; return t && !isNaN(t.getTime()) ? t.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' }
const money = (n: number) => `£${(n || 0).toLocaleString('en-GB')}`
const campDays = (c: Camp) => { if (c.start_date && c.end_date) { const d = Math.round((new Date(c.end_date).getTime() - new Date(c.start_date).getTime()) / DAY) + 1; return d > 0 ? d : (c.itinerary?.length || 0) } return c.itinerary?.length || 0 }
const isPast = (c: Camp) => !!c.end_date && new Date(c.end_date).getTime() < Date.now() - DAY
const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?'

export function LiveCamps({ T, accent }: { T: ThemeTokens; accent: AccentTokens }) {
  const camps = useCoachTable<Camp>('coach_camps')
  const attendees = useCoachTable<Attendee>('coach_camp_attendees')
  const { rows: players } = useCoachTable<Player>('coach_players')
  const { rows: skillRows } = useCoachTable<{ player_id: string; skill: string; score: number }>('coach_player_skills')
  const { rows: attRows } = useCoachTable<{ player_id: string; present: boolean }>('coach_attendance')

  const [selId, setSelId] = useState<string | null>(null)
  const [tab, setTab] = useState('overview')
  const [formOpen, setFormOpen] = useState(false)

  const sel = camps.rows.find(c => c.id === selId) ?? camps.rows[0]
  const campAttendees = attendees.rows.filter(a => a.camp_id === sel?.id)

  const skillMap = useMemo(() => { const m: Record<string, Record<string, number>> = {}; for (const r of skillRows) { (m[r.player_id] ||= {})[r.skill] = r.score } return m }, [skillRows])

  if (camps.rows.length === 0) {
    return (
      <div style={{ fontFamily: FONT }}>
        <Head T={T} accent={accent} onNew={() => setFormOpen(true)} />
        <div style={{ textAlign: 'center', padding: '48px 20px', background: T.panel, border: `1px dashed ${T.border}`, borderRadius: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>No camps yet</div>
          <div style={{ fontSize: 12.5, color: T.text3, marginTop: 4 }}>Create your first camp — Lumio’s AI will design the itinerary, kit and targets for you.</div>
          <button onClick={() => setFormOpen(true)} style={{ marginTop: 14, appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>+ New camp</button>
        </div>
        {formOpen && <CampForm T={T} accent={accent} camp={null} onClose={() => setFormOpen(false)} onSave={async v => { await camps.add(v); setFormOpen(false) }} />}
      </div>
    )
  }

  const booked = (c: Camp) => attendees.rows.filter(a => a.camp_id === c.id).length
  const TABS = [['overview', 'Overview'], ['itinerary', `${campDays(sel!) || ''}${campDays(sel!) ? '-Day ' : ''}Itinerary`], ['equipment', 'Equipment'], ['attendees', `Attendees · ${campAttendees.length}`], ['targets', 'Targets'], ['packs', 'Player Packs'], ['finance', 'Finance']]

  return (
    <div style={{ fontFamily: FONT }}>
      <Head T={T} accent={accent} onNew={() => setFormOpen(true)} />

      {/* Camp cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
        {camps.rows.map(c => {
          const bk = booked(c), cap = c.capacity || 0, past = isPast(c), active = c.id === sel?.id
          return (
            <button key={c.id} onClick={() => { setSelId(c.id); setTab('overview') }} style={{ textAlign: 'left', appearance: 'none', cursor: 'pointer', background: active ? accent.dim : T.panel, border: `1px solid ${active ? accent.border : T.border}`, borderRadius: 12, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: T.text, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                <span style={{ fontSize: 8.5, fontWeight: 700, color: past ? T.good : accent.hex, background: past ? `${T.good}22` : accent.dim, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase' }}>{past ? 'Completed' : 'Upcoming'}</span>
              </div>
              <div style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>{c.location || c.region || '—'}</div>
              <div style={{ fontSize: 10.5, color: T.text3, marginTop: 6 }}>{fmtD(c.start_date)} → {fmtD(c.end_date)}{campDays(c) ? ` · ${campDays(c)} days` : ''}</div>
              <div style={{ height: 5, borderRadius: 3, background: T.hover, marginTop: 8, overflow: 'hidden' }}><div style={{ width: `${cap ? Math.min(100, bk / cap * 100) : 0}%`, height: '100%', background: past ? T.good : accent.hex }} /></div>
              <div style={{ fontSize: 10, color: T.text3, marginTop: 3, textAlign: 'right' }}>{bk}/{cap || '—'}</div>
            </button>
          )
        })}
      </div>

      {sel && <>
        {/* Camp header */}
        <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ fontSize: 19, fontWeight: 700, color: T.text }}>{sel.name}</div>
              <div style={{ fontSize: 12, color: T.text3, marginTop: 2 }}>{[sel.location, sel.region, sel.surface, sel.courts ? `${sel.courts} courts` : ''].filter(Boolean).join(' · ')}</div>
              {sel.description && <div style={{ fontSize: 12.5, color: T.text2, marginTop: 10, lineHeight: 1.5, maxWidth: 640 }}>{sel.description}</div>}
            </div>
            <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
              {[['Dates', `${campDays(sel)} days`], ['Booked', `${campAttendees.length}/${sel.capacity || '—'}`], ['Per head', money(sel.price || 0)], ['Revenue', money((sel.price || 0) * campAttendees.length)]].map(([l, v], i) => (
                <div key={l}><div style={{ fontSize: 9.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</div><div style={{ fontSize: 15, fontWeight: 700, color: i === 3 ? T.good : i === 2 ? accent.hex : T.text, marginTop: 3 }}>{v}</div></div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, padding: 2, background: T.hover, borderRadius: 9, marginBottom: 16, width: 'fit-content', flexWrap: 'wrap' }}>
          {TABS.map(([id, label]) => <button key={id} onClick={() => setTab(id)} style={{ appearance: 'none', border: 0, padding: '6px 14px', borderRadius: 7, fontSize: 12, cursor: 'pointer', fontFamily: FONT, background: tab === id ? T.panel : 'transparent', color: tab === id ? T.text : T.text2, fontWeight: tab === id ? 600 : 400, boxShadow: tab === id ? `0 0 0 1px ${T.border}` : 'none' }}>{label}</button>)}
        </div>

        {tab === 'overview' && <Overview T={T} accent={accent} camp={sel} booked={campAttendees.length} />}
        {tab === 'itinerary' && <Itinerary T={T} accent={accent} camp={sel} onSave={v => camps.edit(sel.id, v)} />}
        {tab === 'equipment' && <ListEditor T={T} accent={accent} title="Equipment & kit" items={sel.equipment || []} onSave={items => camps.edit(sel.id, { equipment: items })} placeholder="One kit item per line" />}
        {tab === 'targets' && <ListEditor T={T} accent={accent} title="Camp targets" items={sel.objectives || []} onSave={items => camps.edit(sel.id, { objectives: items })} placeholder="One objective per line" />}
        {tab === 'attendees' && <Attendees T={T} accent={accent} camp={sel} attendees={campAttendees} players={players} reload={attendees.reload} remove={attendees.remove} />}
        {tab === 'packs' && <Packs T={T} accent={accent} camp={sel} attendees={campAttendees} players={players} skillMap={skillMap} attRows={attRows} />}
        {tab === 'finance' && <Finance T={T} accent={accent} camp={sel} attendees={campAttendees} editAtt={attendees.edit} editCamp={v => camps.edit(sel.id, v)} />}

        <div style={{ marginTop: 16 }}>
          <button onClick={async () => { if (confirm(`Delete ${sel.name}?`)) { await camps.remove(sel.id); setSelId(null) } }} style={{ appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.bad, borderRadius: 8, padding: '7px 13px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>Delete camp</button>
        </div>
      </>}

      {formOpen && <CampForm T={T} accent={accent} camp={null} onClose={() => setFormOpen(false)} onSave={async v => { const r = await camps.add(v) as any; if (r?.id) setSelId(r.id); setFormOpen(false) }} />}
    </div>
  )
}

function Head({ T, accent, onNew }: { T: ThemeTokens; accent: AccentTokens; onNew: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.text }}>Training Camps</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: T.text3 }}>Run your camps end to end — bookings, itinerary, targets and finances in one place.</p>
      </div>
      <button onClick={onNew} style={{ appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>+ New camp</button>
    </div>
  )
}

function card(T: ThemeTokens): CSSProperties { return { background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 } }
function box(T: ThemeTokens): CSSProperties { return { background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px' } }
function lbl(T: ThemeTokens): CSSProperties { return { fontSize: 9.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' } }

function Overview({ T, accent, camp, booked }: { T: ThemeTokens; accent: AccentTokens; camp: Camp; booked: number }) {
  const revenue = (camp.price || 0) * booked
  const collected = camp.collected || 0
  const glance: [string, ReactNode][] = [
    ['Location', camp.location || '—'], ['Region', camp.region || '—'],
    ['Duration', `${campDays(camp)} days · ${fmtD(camp.start_date)}–${fmtD(camp.end_date)}`], ['Courts', [camp.courts, camp.surface].filter(Boolean).join(' · ') || '—'],
    ['Daily rhythm', camp.daily_rhythm || '—'], ['Capacity', `${booked} of ${camp.capacity || '—'} booked`], ['Board', camp.board || '—'],
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
      <div style={card(T)}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12 }}>Camp at a glance</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {glance.map(([l, v]) => <div key={l} style={box(T)}><div style={lbl(T)}>{l}</div><div style={{ fontSize: 12.5, color: T.text, marginTop: 3 }}>{v}</div></div>)}
        </div>
      </div>
      <div style={card(T)}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12 }}>Financial snapshot</div>
        {[['Projected revenue', revenue, T.text], ['Collected', collected, T.good], ['Outstanding', revenue - collected, T.warn]].map(([l, v, c]) => (
          <div key={l as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.border}` }}><span style={{ fontSize: 12.5, color: T.text2 }}>{l}</span><span style={{ fontSize: 13, fontWeight: 700, color: c as string }}>{money(v as number)}</span></div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}><span style={{ fontSize: 12.5, color: T.text2 }}>Spots remaining</span><span style={{ fontSize: 13, fontWeight: 700, color: accent.hex }}>{Math.max(0, (camp.capacity || 0) - booked)}</span></div>
        {!!camp.objectives?.length && <>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '14px 0 8px' }}>Top objectives</div>
          {camp.objectives.slice(0, 4).map((o, i) => <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: T.text2, padding: '3px 0' }}><span style={{ color: accent.hex }}>›</span>{o}</div>)}
        </>}
      </div>
    </div>
  )
}

function Itinerary({ T, accent, camp, onSave }: { T: ThemeTokens; accent: AccentTokens; camp: Camp; onSave: (v: Record<string, any>) => Promise<void> }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const it = camp.itinerary || []
  const design = async () => {
    setBusy(true); setErr('')
    try {
      const res = await fetch('/api/coach/camp-design', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: camp.name, days: campDays(camp), theme: camp.description || camp.name, level: camp.region, surface: camp.surface, board: camp.board }) })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Design failed')
      await onSave({ itinerary: d.itinerary || [], equipment: d.equipment || camp.equipment, objectives: d.objectives || camp.objectives, daily_rhythm: d.daily_rhythm || camp.daily_rhythm })
    } catch (e) { setErr(e instanceof Error ? e.message : 'Design failed') }
    setBusy(false)
  }
  return (
    <div style={card(T)}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Day-by-day itinerary</div>
        <button onClick={design} disabled={busy} style={{ marginLeft: 'auto', appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 9, padding: '8px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, opacity: busy ? 0.6 : 1 }}>✦ {busy ? 'Designing…' : it.length ? 'Re-design with AI' : 'Design with AI'}</button>
      </div>
      {err && <div style={{ fontSize: 12, color: T.bad, marginBottom: 8 }}>{err}</div>}
      {it.length === 0 ? <div style={{ fontSize: 12.5, color: T.text3 }}>No itinerary yet — let the Lumio Master Coach design the full {campDays(camp)}-day plan.</div> : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {it.map((d, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderTop: i ? `1px solid ${T.border}` : 'none' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: accent.hex, width: 44, flexShrink: 0 }}>D{d.day}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: T.text }}>{d.focus}</div>
                {d.did && <div style={{ fontSize: 11.5, color: T.text2, marginTop: 2 }}>{d.did}</div>}
                {d.nextAction && <div style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>→ {d.nextAction}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ListEditor({ T, accent, title, items, onSave, placeholder }: { T: ThemeTokens; accent: AccentTokens; title: string; items: string[]; onSave: (items: string[]) => Promise<void>; placeholder: string }) {
  const [text, setText] = useState(items.join('\n'))
  const [saving, setSaving] = useState(false)
  return (
    <div style={card(T)}>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 10 }}>{title}</div>
      <textarea value={text} onChange={e => setText(e.target.value)} rows={8} placeholder={placeholder} style={{ width: '100%', background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 9, padding: '10px 12px', fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.6, outline: 'none' }} />
      <button onClick={async () => { setSaving(true); await onSave(text.split('\n').map(s => s.trim()).filter(Boolean)); setSaving(false) }} style={{ marginTop: 10, appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 9, padding: '8px 16px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>{saving ? 'Saving…' : 'Save'}</button>
    </div>
  )
}

function Attendees({ T, accent, camp, attendees, players, reload, remove }: { T: ThemeTokens; accent: AccentTokens; camp: Camp; attendees: Attendee[]; players: Player[]; reload: () => void; remove: (id: string) => Promise<void> }) {
  const [pick, setPick] = useState('')
  const taken = new Set(attendees.map(a => a.player_name.toLowerCase()))
  const add = async (name: string, playerId: string | null) => {
    if (!name.trim() || taken.has(name.toLowerCase())) return
    await dbInsert('coach_camp_attendees', { camp_id: camp.id, player_id: playerId, player_name: name.trim() })
    reload(); setPick('')
  }
  return (
    <div style={card(T)}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <select value={pick} onChange={e => setPick(e.target.value)} style={{ flex: 1, minWidth: 160, background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 9, padding: '9px 11px', fontSize: 13, fontFamily: FONT }}>
          <option value="">Add player from roster…</option>
          {players.filter(p => !taken.has(p.name.toLowerCase())).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button onClick={() => { const p = players.find(x => x.id === pick); if (p) add(p.name, p.id) }} disabled={!pick} style={{ appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 9, padding: '9px 16px', fontSize: 12.5, fontWeight: 700, cursor: pick ? 'pointer' : 'not-allowed', opacity: pick ? 1 : 0.5, fontFamily: FONT }}>+ Add</button>
      </div>
      {attendees.length === 0 ? <div style={{ fontSize: 12.5, color: T.text3 }}>No attendees yet.</div> : attendees.map(a => {
        const p = players.find(x => x.id === a.player_id)
        const st = p ? RACKET_STAGES.find(s => s.id === p.racket_stage) : null
        return (
          <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: `1px solid ${T.border}` }}>
            {p?.avatar_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={p.avatar_url} alt="" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              : <span style={{ width: 26, height: 26, borderRadius: '50%', background: accent.dim, color: accent.hex, display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700 }}>{initials(a.player_name)}</span>}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, color: T.text, fontWeight: 600 }}>{a.player_name}</div>
              <div style={{ fontSize: 10.5, color: T.text3 }}>{st ? st.name : (p?.age ? `Age ${p.age}` : 'Guest')}</div>
            </div>
            <button onClick={async () => { await remove(a.id); reload() }} style={{ appearance: 'none', border: 0, background: 'transparent', color: T.text3, cursor: 'pointer', fontSize: 16 }}>×</button>
          </div>
        )
      })}
    </div>
  )
}

function Packs({ T, accent, camp, attendees, players, skillMap, attRows }: { T: ThemeTokens; accent: AccentTokens; camp: Camp; attendees: Attendee[]; players: Player[]; skillMap: Record<string, Record<string, number>>; attRows: { player_id: string; present: boolean }[] }) {
  const [selId, setSelId] = useState<string | null>(null)
  if (attendees.length === 0) return <div style={{ ...card(T), fontSize: 12.5, color: T.text3 }}>Add attendees first to generate their camp packs.</div>
  const sel = attendees.find(a => a.id === selId) ?? attendees[0]
  const p = players.find(x => x.id === sel.player_id)
  const st = p ? RACKET_STAGES.find(s => s.id === p.racket_stage) : null
  const sm = p ? (skillMap[p.id] || {}) : {}
  const mastered = RACKET_STAGES.flatMap(s => (RACKET_SKILLS[s.id] || [])).filter(s => (sm[s.name] || 0) >= 4)
  const curMastered = st ? (RACKET_SKILLS[st.id] || []).filter(s => (sm[s.name] || 0) >= 4).map(s => s.name) : []
  const att = p ? attRows.filter(a => a.player_id === p.id) : []
  const attPct = att.length ? Math.round(att.filter(a => a.present).length / att.length * 100) : null
  const tiles: [string, string][] = [['Attendance', attPct === null ? '—' : `${attPct}%`], ['Racket', st ? st.name : '—'], ['Skills mastered', String(mastered.length)], ['Camp days', String(campDays(camp))]]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 14 }}>
      <div style={{ ...card(T), padding: 8, alignSelf: 'start' }}>
        {attendees.map(a => {
          const active = a.id === sel.id
          return <div key={a.id} onClick={() => setSelId(a.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', background: active ? accent.dim : 'transparent', border: `1px solid ${active ? accent.border : 'transparent'}`, marginBottom: 3 }}>
            {players.find(x => x.id === a.player_id)?.avatar_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={(players.find(x => x.id === a.player_id) as any).avatar_url} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              : <span style={{ width: 24, height: 24, borderRadius: '50%', background: accent.dim, color: accent.hex, display: 'grid', placeItems: 'center', fontSize: 9.5, fontWeight: 700 }}>{initials(a.player_name)}</span>}
            <span style={{ fontSize: 12, color: T.text, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.player_name}</span>
          </div>
        })}
      </div>
      <div style={card(T)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{sel.player_name}</div>
          <div style={{ fontSize: 11.5, color: T.text3 }}>{camp.name} · {fmtD(camp.start_date)}–{fmtD(camp.end_date)}</div>
          <button onClick={() => printPack(sel.player_name, camp, { attPct, racket: st?.name, mastered: curMastered })} style={{ marginLeft: 'auto', appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 9, padding: '8px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>🏆 Print camp pack</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginTop: 14 }}>
          {tiles.map(([l, v]) => <div key={l} style={box(T)}><div style={lbl(T)}>{l}</div><div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginTop: 3 }}>{v}</div></div>)}
        </div>
        {curMastered.length > 0 && <>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '16px 0 8px' }}>Mastered this racket</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{curMastered.map(s => <span key={s} style={{ fontSize: 11, color: accent.hex, background: accent.dim, border: `1px solid ${accent.border}`, borderRadius: 999, padding: '3px 9px' }}>▲ {s}</span>)}</div>
        </>}
        {!!camp.itinerary?.length && <>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '16px 0 8px' }}>Daily log (camp plan)</div>
          {camp.itinerary.slice(0, 14).map((d, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 0', borderTop: i ? `1px solid ${T.border}` : 'none' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: accent.hex, width: 34, flexShrink: 0 }}>D{d.day}</span>
              <div><div style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{d.focus}</div>{d.did && <div style={{ fontSize: 11, color: T.text3 }}>{d.did}</div>}</div>
            </div>
          ))}
        </>}
        {!p && <div style={{ fontSize: 11.5, color: T.text3, marginTop: 12 }}>This attendee isn’t linked to a roster player, so racket/skills aren’t shown. Add them to the Roster to track their development.</div>}
      </div>
    </div>
  )
}

function Finance({ T, accent, camp, attendees, editAtt, editCamp }: { T: ThemeTokens; accent: AccentTokens; camp: Camp; attendees: Attendee[]; editAtt: (id: string, v: Record<string, any>) => Promise<void>; editCamp: (v: Record<string, any>) => Promise<void> }) {
  const per = camp.price || 0
  const collected = attendees.filter(a => a.paid).length * per
  const revenue = attendees.length * per
  return (
    <div style={card(T)}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 14 }}>
        {[['Per head', money(per), T.text], ['Projected', money(revenue), accent.hex], ['Collected', money(collected), T.good], ['Outstanding', money(revenue - collected), T.warn]].map(([l, v, c]) => (
          <div key={l} style={box(T)}><div style={lbl(T)}>{l}</div><div style={{ fontSize: 16, fontWeight: 700, color: c, marginTop: 3 }}>{v}</div></div>
        ))}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Payments · tick when paid</div>
      {attendees.length === 0 ? <div style={{ fontSize: 12.5, color: T.text3 }}>No attendees yet.</div> : attendees.map(a => (
        <label key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: `1px solid ${T.border}`, cursor: 'pointer' }}>
          <input type="checkbox" checked={!!a.paid} onChange={e => editAtt(a.id, { paid: e.target.checked })} />
          <span style={{ flex: 1, fontSize: 12.5, color: T.text }}>{a.player_name}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: a.paid ? T.good : T.text3 }}>{a.paid ? `Paid · ${money(per)}` : money(per)}</span>
        </label>
      ))}
      <button onClick={() => editCamp({ collected })} style={{ marginTop: 12, appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 9, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>Save collected total ({money(collected)})</button>
    </div>
  )
}

// ── New camp form ─────────────────────────────────────────────────────────────
function CampForm({ T, accent, camp, onClose, onSave }: { T: ThemeTokens; accent: AccentTokens; camp: Camp | null; onClose: () => void; onSave: (v: Record<string, any>) => Promise<void> }) {
  const [d, setD] = useState<Record<string, any>>({ name: camp?.name || '', location: camp?.location || '', region: camp?.region || '', start_date: camp?.start_date || '', end_date: camp?.end_date || '', capacity: camp?.capacity || 16, price: camp?.price || 0, surface: camp?.surface || '', courts: camp?.courts || '', board: camp?.board || '', description: camp?.description || '' })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: any) => setD(p => ({ ...p, [k]: v }))
  const field: CSSProperties = { width: '100%', background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 9, padding: '9px 11px', fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }
  const lab: CSSProperties = { display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: T.text3, margin: '0 0 5px' }
  const save = async () => {
    if (!String(d.name).trim() || saving) return
    setSaving(true)
    try { await onSave({ name: d.name, location: d.location, region: d.region, start_date: d.start_date || null, end_date: d.end_date || null, capacity: Number(d.capacity) || null, price: Number(d.price) || null, surface: d.surface, courts: Number(d.courts) || null, board: d.board, description: d.description }) }
    finally { setSaving(false) }
  }
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, fontFamily: FONT, padding: '4vh 16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 520, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 14 }}>New camp</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><label style={lab}>Camp name *</label><input value={d.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Algarve Performance Camp" style={field} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={lab}>Location</label><input value={d.location} onChange={e => set('location', e.target.value)} placeholder="Vale do Lobo" style={field} /></div>
            <div><label style={lab}>Region</label><input value={d.region} onChange={e => set('region', e.target.value)} placeholder="Algarve, Portugal" style={field} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={lab}>Start date</label><input type="date" value={d.start_date} onChange={e => set('start_date', e.target.value)} style={field} /></div>
            <div><label style={lab}>End date</label><input type="date" value={d.end_date} onChange={e => set('end_date', e.target.value)} style={field} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div><label style={lab}>Capacity</label><input type="number" value={d.capacity} onChange={e => set('capacity', e.target.value)} style={field} /></div>
            <div><label style={lab}>Per head £</label><input type="number" value={d.price} onChange={e => set('price', e.target.value)} style={field} /></div>
            <div><label style={lab}>Courts</label><input type="number" value={d.courts} onChange={e => set('courts', e.target.value)} style={field} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={lab}>Surface</label><input value={d.surface} onChange={e => set('surface', e.target.value)} placeholder="Clay & hard" style={field} /></div>
            <div><label style={lab}>Board</label><input value={d.board} onChange={e => set('board', e.target.value)} placeholder="Full board at resort" style={field} /></div>
          </div>
          <div><label style={lab}>Description</label><textarea value={d.description} onChange={e => set('description', e.target.value)} rows={2} placeholder="A line about the camp — the AI uses this to design the plan." style={{ ...field, resize: 'vertical' }} /></div>
        </div>
        <div style={{ fontSize: 10.5, color: T.text3, marginTop: 10 }}>After creating, open the Itinerary tab and tap “Design with AI” to generate the full plan, kit and targets.</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button onClick={onClose} style={{ appearance: 'none', padding: '8px 14px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
          <button onClick={save} disabled={!String(d.name).trim() || saving} style={{ appearance: 'none', border: 0, padding: '8px 16px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: String(d.name).trim() && !saving ? 1 : 0.5, fontFamily: FONT }}>{saving ? 'Creating…' : 'Create camp'}</button>
        </div>
      </div>
    </div>
  )
}

function printPack(name: string, camp: Camp, p: { attPct: number | null; racket?: string; mastered: string[] }) {
  if (typeof window === 'undefined') return
  const esc = (s: string) => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!))
  const chips = p.mastered.map(s => `<span class="chip">${esc(s)}</span>`).join('')
  const days = (camp.itinerary || []).map(d => `<tr><td style="color:#1f6fd6;font-weight:700">D${d.day}</td><td><b>${esc(d.focus || '')}</b>${d.did ? `<div style="color:#555;font-size:12px">${esc(d.did)}</div>` : ''}</td></tr>`).join('')
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Camp pack — ${esc(name)}</title><style>body{font-family:-apple-system,Segoe UI,Arial,sans-serif;max-width:720px;margin:32px auto;color:#111;padding:0 20px}.chip{display:inline-block;border:1px solid #dfe4ee;background:#f5f7fb;border-radius:20px;padding:3px 11px;margin:0 5px 7px;font-size:12px}td{padding:6px 8px;border-top:1px solid #eee;vertical-align:top}.tiles{display:flex;gap:18px;margin:14px 0}</style></head><body>
  <h1 style="margin:0">${esc(name)}</h1><h2 style="font-weight:600;color:#444;margin:2px 0 16px">${esc(camp.name)} · ${esc(fmtD(camp.start_date))}–${esc(fmtD(camp.end_date))}</h2>
  <div class="tiles"><div><small>Attendance</small><div style="font-size:20px;font-weight:700">${p.attPct === null ? '—' : p.attPct + '%'}</div></div><div><small>Racket</small><div style="font-size:20px;font-weight:700">${esc(p.racket || '—')}</div></div></div>
  ${p.mastered.length ? `<h3>Mastered this racket</h3>${chips}` : ''}
  ${days ? `<h3>Daily plan</h3><table style="width:100%;border-collapse:collapse">${days}</table>` : ''}
  <div style="margin-top:24px;font-size:10px;color:#aab;letter-spacing:.1em">LUMIO COACH · lumiosports.com</div></body></html>`
  const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 300) }
}
