'use client'

// ─── LIVE CAMP TABS: Equipment · Attendees · Targets · Finance ───────────────
//
// These four are what a coach uses once the camp is sold and has to actually be
// run. They were the thinnest part of the live portal — a textarea for the kit,
// a list of names for the attendees, a textarea for the targets, and a tick-box
// for the money — while the demo had been showing a properly run camp for
// months. This closes that gap on the live side; the demo is untouched.
//
// Everything here reads and writes real rows. Nothing is seeded with example
// data: an empty camp looks empty, and the one thing that fills itself in is the
// kit list, which is derived from the camp's own size rather than invented.

import { useState, useEffect, useRef, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT, FONT_MONO } from '@/app/cricket/[slug]/v2/_lib/theme'
import { RACKET_STAGES } from '../_lib/coach-db'
import { avatarSrc } from '@/lib/avatar'
import { campMoney, paidSoFar, balanceOwed } from '@/lib/coach/camp-money'
import {
  buildCampKit, foldLooseItems, kitReadyCount, nextKitStatus, KIT_STATUS_LABEL,
  type KitCategory, type KitStatus,
} from '@/lib/coach/camp-kit-template'

// ── shared shapes (structural, so the caller's richer rows fit) ──────────────
export type TabCamp = {
  id: string; name: string; start_date?: string | null; end_date?: string | null
  capacity?: number | null; price?: number | null; courts?: number | null
  board?: string | null; overseas?: boolean | null; audience?: string | null
  equipment?: unknown; kit?: KitCategory[] | null
  objectives?: string[] | null; outcomes?: string[] | null
  player_targets?: { player_name: string; stage?: string; goals?: string[]; measure?: string }[] | null
  costs?: { label: string; amount: number }[] | null
  payment_plan?: PaymentPlan | null
  itinerary?: unknown[] | null
  [k: string]: unknown
}
export type TabAttendee = {
  id: string; player_id?: string | null; player_name: string
  paid?: boolean | null; amount_pennies?: number | null; paid_pennies?: number | null
  status?: string | null; source?: string | null; player_age?: number | null
  room?: string | null; arrival?: string | null; camp_goal?: string | null
  parent_name?: string | null; parent_email?: string | null; parent_phone?: string | null
  emergency_contact?: string | null; medical_notes?: string | null
  consent_photo?: boolean | null; consent_medical?: boolean | null
  [k: string]: unknown
}
export type TabPlayer = { id: string; name: string; age?: number | null; racket_stage?: string | null; avatar_url?: string | null; [k: string]: unknown }

export type PaymentPlan = { deposit?: number; installments?: { label: string; amount: number; due: string }[] }

type Save = (v: Record<string, unknown>) => Promise<void>
type SaveAtt = (id: string, v: Record<string, unknown>) => Promise<void>

// ── local primitives ────────────────────────────────────────────────────────
const card = (T: ThemeTokens): CSSProperties => ({ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 })
const box = (T: ThemeTokens): CSSProperties => ({ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 8, padding: '10px 12px' })
const lbl = (T: ThemeTokens): CSSProperties => ({ fontSize: 9.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 })
const money = (n: number) => `£${Math.round(n || 0).toLocaleString('en-GB')}`
const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?'
const fmtD = (d?: string | null) => { const t = d ? new Date(d) : null; return t && !isNaN(t.getTime()) ? t.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' }
const campDays = (c: TabCamp) => {
  if (c.start_date && c.end_date) {
    const d = Math.round((new Date(c.end_date).getTime() - new Date(c.start_date).getTime()) / 86400000) + 1
    if (d > 0) return d
  }
  return (c.itinerary || []).length || 1
}
const input = (T: ThemeTokens): CSSProperties => ({
  width: '100%', background: T.panel2, color: T.text, border: `1px solid ${T.border}`,
  borderRadius: 7, padding: '6px 8px', fontSize: 12, fontFamily: FONT, boxSizing: 'border-box', outline: 'none',
})
const btn = (T: ThemeTokens, accent: AccentTokens, primary?: boolean): CSSProperties => ({
  appearance: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 12.5, fontWeight: primary ? 700 : 600,
  borderRadius: 9, padding: primary ? '9px 16px' : '8px 13px',
  border: primary ? 0 : `1px solid ${T.border}`,
  background: primary ? accent.hex : 'transparent', color: primary ? T.btnText : T.text2,
})

/** An input that saves when you leave it, not on every keystroke. */
function CellInput({ T, value, placeholder, onSave, width }: {
  T: ThemeTokens; value: string; placeholder: string; onSave: (v: string) => void; width?: number
}) {
  const [v, setV] = useState(value)
  const [seen, setSeen] = useState(value)
  // A value changed elsewhere — a reload, another tab, the AI writing targets —
  // has to win over what is sitting in this box, or the cell quietly reverts on
  // the next save. Adjusted during render rather than in an effect: React re-runs
  // this component immediately with the new value and never paints the stale one.
  if (value !== seen) { setSeen(value); setV(value) }
  return (
    <input
      value={v} placeholder={placeholder}
      onChange={e => setV(e.target.value)}
      onBlur={() => { if (v !== seen) { setSeen(v); onSave(v) } }}
      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
      style={{ ...input(T), width: width ?? '100%', minWidth: width ?? 90, background: 'transparent', border: '1px solid transparent', padding: '5px 6px' }}
      onFocus={e => { e.currentTarget.style.background = T.panel2; e.currentTarget.style.borderColor = T.border }}
      onMouseLeave={e => { if (document.activeElement !== e.currentTarget) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' } }}
    />
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// EQUIPMENT — the kit checklist
// ═══════════════════════════════════════════════════════════════════════════
//
// Fills itself in the first time it is opened, from the camp's own numbers:
// players, days, courts, surface, whether it is abroad, whether it is juniors.
// Every quantity carries the reasoning behind it, and every line is editable —
// the point is to save the coach typing thirty items out, not to tell them what
// they need.

export function KitChecklist({ T, accent, camp, attendeeCount, onSave }: {
  T: ThemeTokens; accent: AccentTokens; camp: TabCamp; attendeeCount: number; onSave: Save
}) {
  const kit = Array.isArray(camp.kit) ? camp.kit : null
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const built = useRef(false)

  const shape = {
    players: attendeeCount || camp.capacity || 8,
    days: campDays(camp),
    courts: Number(camp.courts) || 2,
    overseas: camp.overseas,
    board: camp.board,
    audience: (camp.audience as string) || 'junior',
  }

  // Auto-fill on first open. Done once per camp and then never again: the saved
  // list is the coach's, and rebuilding it under them because a player was added
  // would wipe whatever they had changed.
  useEffect(() => {
    if (kit || built.current || busy) return
    built.current = true
    const fresh = buildCampKit(shape)
    const loose = foldLooseItems(camp.equipment)
    const next = loose ? [...fresh, loose] : fresh
    setBusy(true)
    onSave({ kit: next }).catch(e => setErr(e instanceof Error ? e.message : 'Could not save the kit list')).finally(() => setBusy(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camp.id, kit])

  const write = async (next: KitCategory[]) => {
    setErr('')
    try { await onSave({ kit: next }) } catch (e) { setErr(e instanceof Error ? e.message : 'Could not save that') }
  }

  if (!kit) {
    return <div style={{ ...card(T), fontSize: 12.5, color: T.text3 }}>{err || 'Working out your kit list…'}</div>
  }

  const { ready, total } = kitReadyCount(kit)
  const setItem = (ci: number, ii: number, patch: Partial<KitCategory['items'][number]>) => {
    const next = kit.map((c, i) => i !== ci ? c : { ...c, items: c.items.map((it, j) => j !== ii ? it : { ...it, ...patch }) })
    void write(next)
  }
  const removeItem = (ci: number, ii: number) => {
    const next = kit.map((c, i) => i !== ci ? c : { ...c, items: c.items.filter((_, j) => j !== ii) }).filter(c => c.items.length > 0)
    void write(next)
  }
  const addItem = (ci: number, name: string) => {
    if (!name.trim()) return
    const next = kit.map((c, i) => i !== ci ? c : { ...c, items: [...c.items, { name: name.trim(), qty: '×1', status: 'order' as KitStatus }] })
    void write(next)
  }

  const dot = (s: KitStatus) => s === 'ready' ? T.good : s === 'check' ? accent.hex : T.warn
  const pill = (s: KitStatus): CSSProperties => ({
    fontSize: 8.5, fontWeight: 700, letterSpacing: '0.06em', fontFamily: FONT_MONO,
    padding: '2px 6px', borderRadius: 4, cursor: 'pointer', appearance: 'none', border: 0, flexShrink: 0,
    color: s === 'ready' ? T.good : s === 'check' ? accent.hex : T.warn,
    background: s === 'ready' ? `${T.good}1F` : s === 'check' ? accent.dim : `${T.warn}1F`,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, color: T.text2 }}>
          Kit checklist for <strong style={{ color: T.text }}>{camp.name}</strong> — <span style={{ fontFamily: FONT_MONO }}>{ready}/{total}</span> ready
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => printKit(camp, kit)} style={btn(T, accent, true)}>Print kit list</button>
          <button onClick={() => { if (confirm('Rebuild the list from this camp’s size? Anything you have changed will be lost.')) void write(buildCampKit(shape)) }} style={btn(T, accent)}>↻ Rebuild</button>
        </div>
      </div>
      {!!err && <div style={{ fontSize: 12, color: T.bad }}>{err}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12, alignItems: 'start' }}>
        {kit.map((cat, ci) => (
          <div key={cat.category} style={card(T)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text, flex: 1 }}>{cat.category}</div>
              <div style={{ fontSize: 11, color: T.text3, fontFamily: FONT_MONO }}>{cat.items.length}</div>
            </div>
            {cat.items.map((it, ii) => (
              <div key={`${it.name}-${ii}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '7px 0', borderTop: ii ? `1px solid ${T.border}` : 'none' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot(it.status), flexShrink: 0, marginTop: 6 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <CellInput T={T} value={it.name} placeholder="Item" onSave={v => v.trim() ? setItem(ci, ii, { name: v.trim() }) : removeItem(ci, ii)} />
                  {!!it.note && <div style={{ fontSize: 10.5, color: T.text3, lineHeight: 1.45, padding: '0 6px' }}>{it.note}</div>}
                </div>
                <div style={{ width: 88, flexShrink: 0 }}>
                  <CellInput T={T} value={it.qty} placeholder="qty" onSave={v => setItem(ci, ii, { qty: v.trim() })} />
                </div>
                <button onClick={() => setItem(ci, ii, { status: nextKitStatus(it.status) })} style={{ ...pill(it.status), marginTop: 5 }} title="Click to change">
                  {KIT_STATUS_LABEL[it.status]}
                </button>
                <button onClick={() => removeItem(ci, ii)} style={{ appearance: 'none', border: 0, background: 'transparent', color: T.text4, cursor: 'pointer', fontSize: 14, marginTop: 3, flexShrink: 0 }} title="Remove">×</button>
              </div>
            ))}
            <AddRow T={T} accent={accent} placeholder="Add an item…" onAdd={name => addItem(ci, name)} />
          </div>
        ))}
      </div>

      <div style={{ ...card(T), display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 12, color: T.text3, flex: 1, minWidth: 200, lineHeight: 1.5 }}>
          Worked out for {shape.players} player{shape.players === 1 ? '' : 's'}, {shape.days} day{shape.days === 1 ? '' : 's'} and {shape.courts} court{shape.courts === 1 ? '' : 's'}. Click a status to move it between ready, check and to order.
        </div>
        <AddRow T={T} accent={accent} placeholder="New category…" onAdd={name => void write([...kit, { category: name.trim(), items: [] }])} />
      </div>
    </div>
  )
}

function AddRow({ T, accent, placeholder, onAdd }: { T: ThemeTokens; accent: AccentTokens; placeholder: string; onAdd: (v: string) => void }) {
  const [v, setV] = useState('')
  const go = () => { if (v.trim()) { onAdd(v); setV('') } }
  return (
    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
      <input value={v} onChange={e => setV(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') go() }} placeholder={placeholder} style={input(T)} />
      <button onClick={go} disabled={!v.trim()} style={{ ...btn(T, accent), opacity: v.trim() ? 1 : 0.45, padding: '6px 11px' }}>+</button>
    </div>
  )
}

function printKit(camp: TabCamp, kit: KitCategory[]) {
  const w = window.open('', '_blank')
  if (!w) { alert('Pop-up blocked — allow pop-ups for this site.'); return }
  const esc = (s: string) => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string))
  const cats = kit.map(c => `
    <section><h2>${esc(c.category)}</h2><table>
      ${c.items.map(i => `<tr><td class="tick">☐</td><td>${esc(i.name)}${i.note ? `<div class="note">${esc(i.note)}</div>` : ''}</td><td class="qty">${esc(i.qty)}</td><td class="st">${KIT_STATUS_LABEL[i.status]}</td></tr>`).join('')}
    </table></section>`).join('')
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Kit list — ${esc(camp.name)}</title><style>
    body{font:13px/1.5 -apple-system,system-ui,sans-serif;color:#111;margin:32px;}
    h1{font-size:20px;margin:0 0 2px}.sub{color:#666;font-size:12px;margin-bottom:20px}
    section{break-inside:avoid;margin-bottom:18px}h2{font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:#444;border-bottom:1px solid #ddd;padding-bottom:5px;margin:0 0 6px}
    table{width:100%;border-collapse:collapse}td{padding:5px 4px;border-bottom:1px solid #f0f0f0;vertical-align:top}
    .tick{width:18px;font-size:15px}.qty{width:90px;text-align:right;font-variant-numeric:tabular-nums;color:#333}
    .st{width:70px;text-align:right;font-size:10px;letter-spacing:.06em;color:#888}
    .note{color:#777;font-size:11px}@media print{body{margin:14mm}}
  </style></head><body>
    <h1>Kit list — ${esc(camp.name)}</h1>
    <div class="sub">${esc(fmtD(camp.start_date))} – ${esc(fmtD(camp.end_date))}</div>
    ${cats}
  </body></html>`)
  w.document.close(); w.focus(); w.print()
}

// ═══════════════════════════════════════════════════════════════════════════
// ATTENDEES — the rooming list, the airport run and what each week is for
// ═══════════════════════════════════════════════════════════════════════════

export function AttendeeTable({ T, accent, camp, attendees, players, addPlayer, remove, editAtt }: {
  T: ThemeTokens; accent: AccentTokens; camp: TabCamp; attendees: TabAttendee[]; players: TabPlayer[]
  addPlayer: (name: string, playerId: string | null) => Promise<void>
  remove: (id: string) => Promise<void>
  editAtt: SaveAtt
}) {
  const [pick, setPick] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [err, setErr] = useState('')
  const taken = new Set(attendees.map(a => a.player_name.toLowerCase()))
  const cap = Number(camp.capacity) || 0
  const left = cap ? Math.max(0, cap - attendees.length) : null

  const save = async (id: string, v: Record<string, unknown>) => {
    setErr('')
    try { await editAtt(id, v) } catch (e) { setErr(e instanceof Error ? e.message : 'Could not save that') }
  }

  const th: CSSProperties = { ...lbl(T), textAlign: 'left', padding: '0 8px 8px', whiteSpace: 'nowrap' }
  const td: CSSProperties = { padding: '6px 8px', borderTop: `1px solid ${T.border}`, verticalAlign: 'middle' }

  return (
    <div style={card(T)}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>
          Attendees · {attendees.length}{cap ? ` of ${cap}` : ''}
        </div>
        {left !== null && <div style={{ marginLeft: 'auto', fontSize: 11.5, color: left === 0 ? T.warn : T.text3 }}>{left === 0 ? 'Full' : `${left} spot${left === 1 ? '' : 's'} left`}</div>}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <select value={pick} onChange={e => setPick(e.target.value)} style={{ flex: 1, minWidth: 160, ...input(T), padding: '9px 11px', fontSize: 13 }}>
          <option value="">Add player from roster…</option>
          {players.filter(p => !taken.has(p.name.toLowerCase())).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button onClick={async () => { const p = players.find(x => x.id === pick); if (p) { await addPlayer(p.name, p.id); setPick('') } }}
          disabled={!pick} style={{ ...btn(T, accent, true), opacity: pick ? 1 : 0.5, cursor: pick ? 'pointer' : 'not-allowed' }}>+ Add</button>
      </div>

      {!!err && <div style={{ fontSize: 12, color: T.bad, marginBottom: 8 }}>{err}</div>}

      {attendees.length === 0 ? (
        <div style={{ fontSize: 12.5, color: T.text3 }}>No attendees yet.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 900, borderCollapse: 'collapse', fontFamily: FONT }}>
            <thead>
              <tr>
                {['Player', 'Age', 'Level', 'Payment', 'Balance', 'Room', 'Arrival', 'Camp goal', ''].map(h => <th key={h} style={th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {attendees.map(a => {
                const p = players.find(x => x.id === a.player_id)
                const st = p ? RACKET_STAGES.find(s => s.id === p.racket_stage) : null
                const took = paidSoFar(camp, a)
                const owed = balanceOwed(camp, a)
                const state: 'paid' | 'deposit' | 'unpaid' = a.paid || owed === 0 ? 'paid' : took > 0 ? 'deposit' : 'unpaid'
                const tone = state === 'paid' ? T.good : state === 'deposit' ? T.warn : T.bad
                const age = a.player_age || p?.age
                const details = ([
                  ['Parent', a.parent_name || ''], ['Email', a.parent_email || ''], ['Phone', a.parent_phone || ''],
                  ['Emergency contact', a.emergency_contact || ''], ['Medical / allergies', a.medical_notes || ''],
                ] as [string, string][]).filter(d => !!d[1])
                const showing = openId === a.id
                return (
                  <>
                    <tr key={a.id}>
                      <td style={td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {p?.avatar_url
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={avatarSrc(p.avatar_url)} alt="" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                            : <span style={{ width: 26, height: 26, borderRadius: '50%', background: accent.dim, color: accent.hex, display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{initials(a.player_name)}</span>}
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 12.5, color: T.text, fontWeight: 600, whiteSpace: 'nowrap' }}>{a.player_name}</div>
                            <div style={{ display: 'flex', gap: 5, marginTop: 1 }}>
                              {a.source === 'signup' && <span style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', color: accent.hex, background: accent.dim, borderRadius: 3, padding: '1px 4px' }}>Online</span>}
                              {/* A medical note has to be visible without anyone opening anything. */}
                              {!!a.medical_notes && <span style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', color: T.bad, background: `${T.bad}22`, borderRadius: 3, padding: '1px 4px' }}>Medical</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ ...td, fontSize: 12, color: T.text2, fontFamily: FONT_MONO }}>{age || '—'}</td>
                      <td style={td}>
                        {st
                          ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.text2 }}>
                              <span style={{ width: 11, height: 11, borderRadius: 3, background: st.colour, border: '1px solid rgba(128,128,128,0.4)' }} />{st.name}
                            </span>
                          : <span style={{ fontSize: 12, color: T.text3 }}>—</span>}
                      </td>
                      <td style={td}>
                        <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.06em', fontFamily: FONT_MONO, textTransform: 'uppercase', color: tone, background: `${tone}1F`, borderRadius: 4, padding: '2px 6px' }}>
                          {state === 'paid' ? 'Paid' : state === 'deposit' ? 'Deposit' : 'Unpaid'}
                        </span>
                      </td>
                      <td style={{ ...td, fontSize: 12, fontFamily: FONT_MONO, color: owed > 0 ? T.warn : T.text3 }}>{owed > 0 ? money(owed) : '—'}</td>
                      <td style={td}><CellInput T={T} value={a.room || ''} placeholder="—" onSave={v => void save(a.id, { room: v || null })} width={110} /></td>
                      <td style={td}><CellInput T={T} value={a.arrival || ''} placeholder="—" onSave={v => void save(a.id, { arrival: v || null })} width={120} /></td>
                      <td style={{ ...td, minWidth: 220 }}><CellInput T={T} value={a.camp_goal || ''} placeholder="What is this week for?" onSave={v => void save(a.id, { camp_goal: v || null })} /></td>
                      <td style={{ ...td, whiteSpace: 'nowrap', textAlign: 'right' }}>
                        {details.length > 0 && (
                          <button onClick={() => setOpenId(showing ? null : a.id)} style={{ appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 7, padding: '3px 9px', fontSize: 11, cursor: 'pointer', fontFamily: FONT }}>{showing ? 'Hide' : 'Details'}</button>
                        )}
                        <button onClick={() => { if (confirm(`Remove ${a.player_name} from this camp?`)) void remove(a.id) }} style={{ appearance: 'none', border: 0, background: 'transparent', color: T.text3, cursor: 'pointer', fontSize: 15, marginLeft: 4 }}>×</button>
                      </td>
                    </tr>
                    {showing && (
                      <tr key={`${a.id}-d`}>
                        <td colSpan={9} style={{ ...td, background: T.panel2 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }}>
                            {details.map(d => <div key={d[0]} style={box(T)}><div style={lbl(T)}>{d[0]}</div><div style={{ fontSize: 12, color: T.text, marginTop: 3, wordBreak: 'break-word' }}>{d[1]}</div></div>)}
                            <div style={box(T)}><div style={lbl(T)}>Consents</div><div style={{ fontSize: 12, color: T.text, marginTop: 3 }}>{`${a.consent_photo ? 'Photos ✓' : 'Photos ✗'} · ${a.consent_medical ? 'First aid ✓' : 'First aid ✗'}`}</div></div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'flex', gap: 14, marginTop: 12, flexWrap: 'wrap' }}>
        {([['paid in full', T.good], ['deposit only', T.warn], ['unpaid', T.bad]] as [string, string][]).map(([l, c]) => (
          <span key={l} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: T.text3 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: c }} />{l}
          </span>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 10.5, color: T.text3 }}>Room, arrival and camp goal save as you leave the box.</span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// TARGETS — what the camp is for, and what each player is there to fix
// ═══════════════════════════════════════════════════════════════════════════

export function TargetsBoard({ T, accent, camp, attendees, players, onSave, onReload, editAtt }: {
  T: ThemeTokens; accent: AccentTokens; camp: TabCamp
  attendees: TabAttendee[]; players: TabPlayer[]
  onSave: Save; onReload: () => void; editAtt: SaveAtt
}) {
  const targets = camp.objectives || []
  const outcomes = camp.outcomes || []
  const perPlayer = camp.player_targets || []
  const [editing, setEditing] = useState<null | 'targets' | 'outcomes'>(null)
  const [draftText, setDraftText] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [openName, setOpenName] = useState<string | null>(null)

  const aiRewrite = async () => {
    setBusy(true); setErr('')
    try {
      const r = await fetch('/api/coach/camp-targets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ campId: camp.id }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Could not work out the targets.')
      await onSave({ objectives: d.targets || [], outcomes: d.outcomes || [] })
    } catch (e) { setErr(e instanceof Error ? e.message : 'Could not work out the targets.') }
    finally { setBusy(false) }
  }

  const aiPlayers = async () => {
    setBusy(true); setErr('')
    try {
      const r = await fetch('/api/coach/camp-player', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ campId: camp.id, mode: 'targets' }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Could not set targets')
      onReload()
    } catch (e) { setErr(e instanceof Error ? e.message : 'Could not set targets') }
    finally { setBusy(false) }
  }

  const startEdit = (which: 'targets' | 'outcomes') => {
    setDraftText((which === 'targets' ? targets : outcomes).join('\n'))
    setEditing(which)
  }
  const commitEdit = async () => {
    const lines = draftText.split('\n').map(s => s.trim()).filter(Boolean)
    await onSave(editing === 'targets' ? { objectives: lines } : { outcomes: lines })
    setEditing(null)
  }

  const detailFor = (name: string) => perPlayer.find(t => (t.player_name || '').toLowerCase() === name.toLowerCase()) || null
  const open = openName ? detailFor(openName) : null
  const openAtt = openName ? attendees.find(a => a.player_name === openName) : null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: 14, alignItems: 'start' }}>
      {/* ── Camp targets & outcomes ─────────────────────────────────────── */}
      <div style={card(T)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text, flex: 1 }}>Camp targets</div>
          <button onClick={() => editing === 'targets' ? setEditing(null) : startEdit('targets')} style={{ ...btn(T, accent), padding: '4px 10px', fontSize: 11.5 }}>
            {editing === 'targets' ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editing === 'targets' ? (
          <>
            <textarea value={draftText} onChange={e => setDraftText(e.target.value)} rows={7} placeholder="One target per line"
              style={{ ...input(T), fontSize: 13, lineHeight: 1.6, resize: 'vertical', padding: '10px 12px' }} />
            <button onClick={commitEdit} style={{ ...btn(T, accent, true), marginTop: 10 }}>Save</button>
          </>
        ) : targets.length === 0 ? (
          <div style={{ fontSize: 12.5, color: T.text3, lineHeight: 1.6 }}>
            No targets yet. Lumio Coach can write them from the itinerary he designed, or press Edit and write your own.
          </div>
        ) : (
          targets.map((x, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i === targets.length - 1 ? 'none' : `1px solid ${T.border}` }}>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: accent.hex, background: accent.dim, borderRadius: 4, padding: '2px 7px', height: 'fit-content', fontFamily: FONT_MONO }}>{i + 1}</span>
              <span style={{ fontSize: 13, color: T.text2, lineHeight: 1.6 }}>{x}</span>
            </div>
          ))
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '18px 0 10px' }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text, flex: 1 }}>Camp outcomes</div>
          <button onClick={() => editing === 'outcomes' ? setEditing(null) : startEdit('outcomes')} style={{ ...btn(T, accent), padding: '4px 10px', fontSize: 11.5 }}>
            {editing === 'outcomes' ? 'Cancel' : 'Edit'}
          </button>
        </div>
        {editing === 'outcomes' ? (
          <>
            <textarea value={draftText} onChange={e => setDraftText(e.target.value)} rows={5} placeholder="One outcome per line"
              style={{ ...input(T), fontSize: 13, lineHeight: 1.6, resize: 'vertical', padding: '10px 12px' }} />
            <button onClick={commitEdit} style={{ ...btn(T, accent, true), marginTop: 10 }}>Save</button>
          </>
        ) : outcomes.length === 0 ? (
          <div style={{ fontSize: 12.5, color: T.text3, lineHeight: 1.6 }}>What you hand over by the last day — a report, a re-assessment, a plan for the weeks after.</div>
        ) : (
          outcomes.map((x, i) => (
            <div key={i} style={{ display: 'flex', gap: 9, padding: '5px 0' }}>
              <span style={{ color: T.good, fontSize: 13 }}>✓</span>
              <span style={{ fontSize: 13, color: T.text2, lineHeight: 1.6 }}>{x}</span>
            </div>
          ))
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={aiRewrite} disabled={busy} style={{ ...btn(T, accent), opacity: busy ? 0.6 : 1 }}>
            ✦ {busy ? 'Thinking…' : targets.length ? 'Ask Lumio Coach to re-write these' : 'Set the camp targets'}
          </button>
          {!!err && <span style={{ fontSize: 11.5, color: T.bad }}>{err}</span>}
        </div>
      </div>

      {/* ── Individual goals ────────────────────────────────────────────── */}
      <div style={card(T)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>Individual goals</div>
          <div style={{ marginLeft: 'auto', fontSize: 11, color: T.text3 }}>{attendees.length} player{attendees.length === 1 ? '' : 's'}</div>
        </div>

        {attendees.length === 0 ? (
          <div style={{ fontSize: 12.5, color: T.text3 }}>Add attendees first — goals are set per player, so there is nobody to set them for yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {attendees.map(a => {
              const p = players.find(x => x.id === a.player_id)
              const detail = detailFor(a.player_name)
              // The short goal on the attendee row is the coach's own and wins;
              // the AI's first target stands in until they write one.
              const line = (a.camp_goal || '').trim() || detail?.goals?.[0] || ''
              return (
                <button key={a.id} onClick={() => setOpenName(a.player_name)}
                  style={{ appearance: 'none', textAlign: 'left', cursor: 'pointer', fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10 }}>
                  {p?.avatar_url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={avatarSrc(p.avatar_url)} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                    : <span style={{ width: 30, height: 30, borderRadius: '50%', background: accent.dim, color: accent.hex, display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{initials(a.player_name)}</span>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: T.text }}>{a.player_name}</div>
                    <div style={{ fontSize: 11.5, color: line ? T.text2 : T.text3, marginTop: 2, lineHeight: 1.45 }}>
                      {line ? `🎾 ${line}` : 'No goal set yet'}
                    </div>
                  </div>
                  {!!detail && <span style={{ fontSize: 10.5, color: accent.hex, flexShrink: 0 }}>Report →</span>}
                </button>
              )
            })}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={aiPlayers} disabled={busy || attendees.length === 0} style={{ ...btn(T, accent, true), opacity: busy || attendees.length === 0 ? 0.5 : 1 }}>
            ✦ {busy ? 'Setting targets…' : perPlayer.length ? 'Re-set targets' : 'Set targets with Lumio Coach'}
          </button>
          <span style={{ fontSize: 11, color: T.text3 }}>Built from each player’s racket stage and recent sessions.</span>
        </div>
      </div>

      {/* ── One player, in full ─────────────────────────────────────────── */}
      {openName && (
        <div onClick={e => { if (e.target === e.currentTarget) setOpenName(null) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '6vh 16px', overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: 620, ...card(T), padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: T.text, flex: 1 }}>{openName}</div>
              <button onClick={() => setOpenName(null)} style={{ appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text3, borderRadius: 8, width: 30, height: 30, fontSize: 16, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ fontSize: 11.5, color: T.text3, marginBottom: 14 }}>
              {camp.name} · {fmtD(camp.start_date)} – {fmtD(camp.end_date)}{open?.stage ? ` · ${open.stage}` : ''}
            </div>

            <div style={{ ...box(T), marginBottom: 12 }}>
              <div style={lbl(T)}>Their goal for the week</div>
              <div style={{ marginTop: 4 }}>
                <CellInput T={T} value={openAtt?.camp_goal || ''} placeholder="Type the one thing this week is for…"
                  onSave={v => { if (openAtt) void editAtt(openAtt.id, { camp_goal: v || null }) }} />
              </div>
              <div style={{ fontSize: 10.5, color: T.text3, marginTop: 4 }}>Shows on the attendee list and on their camp pack.</div>
            </div>

            {open?.goals?.length ? (
              <>
                <div style={{ ...lbl(T), marginBottom: 8 }}>Lumio Coach’s targets</div>
                {open.goals.map((g, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderTop: i ? `1px solid ${T.border}` : 'none' }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: accent.hex, background: accent.dim, borderRadius: 4, padding: '2px 7px', height: 'fit-content', fontFamily: FONT_MONO }}>{i + 1}</span>
                    <span style={{ fontSize: 13, color: T.text2, lineHeight: 1.65 }}>{g}</span>
                  </div>
                ))}
                {!!open.measure && (
                  <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 9, background: `${T.good}14`, border: `1px solid ${T.good}44`, fontSize: 12.5, color: T.good, lineHeight: 1.6 }}>
                    ✓ {open.measure}
                  </div>
                )}
              </>
            ) : (
              <div style={{ fontSize: 12.5, color: T.text3, lineHeight: 1.6 }}>
                No detailed targets for {openName} yet. Press “Set targets with Lumio Coach” and he will write two or three,
                with a measure that proves they got there.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// FINANCE — what the camp makes, what it costs, and who owes what
// ═══════════════════════════════════════════════════════════════════════════

export function FinanceBoard({ T, accent, camp, attendees, editAtt, editCamp }: {
  T: ThemeTokens; accent: AccentTokens; camp: TabCamp; attendees: TabAttendee[]
  editAtt: SaveAtt; editCamp: Save
}) {
  const m = campMoney(camp, attendees)
  const costs = camp.costs || []
  const plan = camp.payment_plan || null
  const [err, setErr] = useState('')
  const [planOpen, setPlanOpen] = useState(false)

  const totalCost = costs.reduce((n, c) => n + (Number(c.amount) || 0), 0)
  const margin = m.booked - totalCost

  const save = async (v: Record<string, unknown>) => {
    setErr('')
    try { await editCamp(v) } catch (e) { setErr(e instanceof Error ? e.message : 'Could not save that') }
  }
  const saveAtt = async (id: string, v: Record<string, unknown>) => {
    setErr('')
    try { await editAtt(id, v) } catch (e) { setErr(e instanceof Error ? e.message : 'Could not save that') }
  }

  const tiles: [string, string, string, string][] = [
    ['Projected revenue', money(m.booked), T.text, `${m.seats} booked${m.capacity ? ` of ${m.capacity}` : ''}`],
    ['Collected', money(m.collected), T.good, m.potential ? `${money(m.potential)} if it sells out` : ''],
    ['Outstanding', money(m.outstanding), T.warn, ''],
    ['Est. margin', costs.length ? money(margin) : '—', costs.length ? (margin >= 0 ? T.good : T.bad) : T.text3, costs.length ? `after ${money(totalCost)} of costs` : 'add your costs below'],
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        {tiles.map(([l, v, c, sub]) => (
          <div key={l} style={card(T)}>
            <div style={lbl(T)}>{l}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: c, marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>{v}</div>
            {!!sub && <div style={{ fontSize: 10.5, color: T.text3, marginTop: 3 }}>{sub}</div>}
          </div>
        ))}
      </div>

      {!!err && <div style={{ background: `${T.bad}14`, border: `1px solid ${T.bad}44`, borderRadius: 9, padding: '9px 12px', fontSize: 12, color: T.bad }}>{err}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: 14, alignItems: 'start' }}>
        {/* ── Payment status ───────────────────────────────────────────── */}
        <div style={card(T)}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text, marginBottom: 4 }}>Payment status</div>
          <div style={{ fontSize: 11, color: T.text3, marginBottom: 12 }}>Type what you have actually received. Ticking somebody off marks them settled and stops the reminders.</div>
          {attendees.length === 0 ? <div style={{ fontSize: 12.5, color: T.text3 }}>No attendees yet.</div> : attendees.map(a => {
            const took = paidSoFar(camp, a)
            const owed = balanceOwed(camp, a)
            const state = a.paid || owed === 0 ? 'paid' : took > 0 ? 'deposit' : 'unpaid'
            const tone = state === 'paid' ? T.good : state === 'deposit' ? T.warn : T.bad
            return (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderTop: `1px solid ${T.border}`, flexWrap: 'wrap' }}>
                <input type="checkbox" checked={!!a.paid} onChange={e => void saveAtt(a.id, { paid: e.target.checked })} title="Fully paid" />
                <span style={{ flex: 1, minWidth: 110, fontSize: 12.5, color: T.text }}>{a.player_name}</span>
                <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 3, fontSize: 12, fontFamily: FONT_MONO, color: T.text3 }}>
                  <span style={{ width: 74 }}>
                    <CellInput T={T} value={took ? String(Math.round(took)) : ''} placeholder="0"
                      onSave={v => { const n = Number(v.replace(/[^\d.]/g, '')) || 0; void saveAtt(a.id, { paid_pennies: Math.round(n * 100), paid: n >= (m.per || 0) && m.per > 0 }) }} width={74} />
                  </span>
                  <span>/ {money(m.per)}</span>
                </span>
                <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.06em', fontFamily: FONT_MONO, textTransform: 'uppercase', color: tone, background: `${tone}1F`, borderRadius: 4, padding: '2px 6px' }}>
                  {state === 'paid' ? 'Paid' : state === 'deposit' ? 'Deposit' : 'Unpaid'}
                </span>
              </div>
            )
          })}
        </div>

        {/* ── Costs ───────────────────────────────────────────────────── */}
        <div style={card(T)}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text, flex: 1 }}>What it costs you</div>
            <div style={{ fontSize: 10.5, color: T.text3 }}>your figures</div>
          </div>
          <div style={{ fontSize: 11, color: T.text3, marginBottom: 12 }}>Resort, courts, assistant coaches, transfers — whatever this camp actually costs to put on.</div>
          {costs.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderTop: i ? `1px solid ${T.border}` : 'none' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <CellInput T={T} value={c.label} placeholder="Cost"
                  onSave={v => void save({ costs: v.trim() ? costs.map((x, j) => j === i ? { ...x, label: v.trim() } : x) : costs.filter((_, j) => j !== i) })} />
              </div>
              <div style={{ width: 96 }}>
                <CellInput T={T} value={c.amount ? String(c.amount) : ''} placeholder="0"
                  onSave={v => void save({ costs: costs.map((x, j) => j === i ? { ...x, amount: Number(v.replace(/[^\d.]/g, '')) || 0 } : x) })} width={96} />
              </div>
              <button onClick={() => void save({ costs: costs.filter((_, j) => j !== i) })} style={{ appearance: 'none', border: 0, background: 'transparent', color: T.text4, cursor: 'pointer', fontSize: 14 }}>×</button>
            </div>
          ))}
          <AddRow T={T} accent={accent} placeholder="Add a cost…" onAdd={label => void save({ costs: [...costs, { label: label.trim(), amount: 0 }] })} />
          {costs.length > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: `1px solid ${T.border}`, fontSize: 13, fontWeight: 700, color: T.text }}>
                <span>Total cost</span><span style={{ fontFamily: FONT_MONO }}>{money(totalCost)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 13, fontWeight: 700, color: margin >= 0 ? T.good : T.bad }}>
                <span>Estimated margin</span><span style={{ fontFamily: FONT_MONO }}>{money(margin)}</span>
              </div>
              <div style={{ fontSize: 10.5, color: T.text3, marginTop: 6, lineHeight: 1.5 }}>Against booked revenue, not a full camp — an empty seat is not income.</div>
            </>
          )}
        </div>
      </div>

      {/* ── Payment plan ─────────────────────────────────────────────── */}
      <PaymentPlanCard T={T} accent={accent} camp={camp} plan={plan} perHead={m.per} open={planOpen} setOpen={setPlanOpen} onSave={save} />
    </div>
  )
}

// A plan Lumio tracks and chases. The money still arrives however the coach
// already takes it — bank transfer, card, cash at the club — because building
// collection on top of a plan nobody has agreed to yet would be the wrong order
// to do it in. What this buys today: everyone can see what is due and when, and
// the reminder emails have something specific to chase.
function PaymentPlanCard({ T, accent, camp, plan, perHead, open, setOpen, onSave }: {
  T: ThemeTokens; accent: AccentTokens; camp: TabCamp; plan: PaymentPlan | null; perHead: number
  open: boolean; setOpen: (v: boolean) => void; onSave: Save
}) {
  const installments = plan?.installments || []
  const deposit = Number(plan?.deposit) || 0
  const scheduled = deposit + installments.reduce((n, i) => n + (Number(i.amount) || 0), 0)
  const gap = perHead - scheduled

  const set = (next: PaymentPlan | null) => void onSave({ payment_plan: next })

  if (!plan && !open) {
    return (
      <div style={{ ...card(T), display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>Payment plan</div>
          <div style={{ fontSize: 11.5, color: T.text3, marginTop: 3, lineHeight: 1.5 }}>
            A {money(perHead)} place is a lot to ask for in one go. Set a deposit and a few installments, and Lumio will show
            what is due when — and chase it for you.
          </div>
        </div>
        <button onClick={() => { setOpen(true); set({ deposit: Math.round(perHead * 0.2), installments: [] }) }} style={btn(T, accent, true)}>Set up a plan</button>
      </div>
    )
  }

  return (
    <div style={card(T)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text, flex: 1 }}>Payment plan</div>
        <button onClick={() => { if (confirm('Remove the payment plan?')) { set(null); setOpen(false) } }} style={{ ...btn(T, accent), padding: '4px 10px', fontSize: 11.5 }}>Remove</button>
      </div>
      <div style={{ fontSize: 11, color: T.text3, marginBottom: 12 }}>What a family owes, and when. Money still arrives however you take it today — this is the schedule, not a card machine.</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: `1px solid ${T.border}` }}>
        <span style={{ flex: 1, fontSize: 12.5, color: T.text, fontWeight: 600 }}>Deposit</span>
        <span style={{ fontSize: 11, color: T.text3 }}>on booking</span>
        <div style={{ width: 96 }}>
          <CellInput T={T} value={deposit ? String(deposit) : ''} placeholder="0"
            onSave={v => set({ ...(plan || {}), deposit: Number(v.replace(/[^\d.]/g, '')) || 0, installments })} width={96} />
        </div>
      </div>

      {installments.map((inst, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: `1px solid ${T.border}`, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 120 }}>
            <CellInput T={T} value={inst.label} placeholder={`Installment ${i + 1}`}
              onSave={v => set({ ...(plan || {}), deposit, installments: installments.map((x, j) => j === i ? { ...x, label: v } : x) })} />
          </div>
          <input type="date" value={inst.due || ''}
            onChange={e => set({ ...(plan || {}), deposit, installments: installments.map((x, j) => j === i ? { ...x, due: e.target.value } : x) })}
            style={{ ...input(T), width: 150 }} />
          <div style={{ width: 96 }}>
            <CellInput T={T} value={inst.amount ? String(inst.amount) : ''} placeholder="0"
              onSave={v => set({ ...(plan || {}), deposit, installments: installments.map((x, j) => j === i ? { ...x, amount: Number(v.replace(/[^\d.]/g, '')) || 0 } : x) })} width={96} />
          </div>
          <button onClick={() => set({ ...(plan || {}), deposit, installments: installments.filter((_, j) => j !== i) })}
            style={{ appearance: 'none', border: 0, background: 'transparent', color: T.text4, cursor: 'pointer', fontSize: 14 }}>×</button>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => {
          const n = installments.length + 1
          const due = nextMonthISO(camp.start_date, installments.length)
          const remaining = Math.max(0, perHead - deposit - installments.reduce((s, x) => s + (Number(x.amount) || 0), 0))
          set({ ...(plan || {}), deposit, installments: [...installments, { label: `Installment ${n}`, amount: Math.round(remaining), due }] })
        }} style={btn(T, accent)}>+ Add an installment</button>

        <div style={{ marginLeft: 'auto', fontSize: 11.5, color: gap === 0 ? T.good : T.warn, fontFamily: FONT_MONO }}>
          {gap === 0
            ? `Adds up to ${money(perHead)} ✓`
            : gap > 0 ? `${money(gap)} of the ${money(perHead)} place unallocated`
            : `${money(-gap)} more than the ${money(perHead)} place`}
        </div>
      </div>
    </div>
  )
}

/** A sensible due date for the next installment: monthly, ending before the camp. */
function nextMonthISO(start: string | null | undefined, index: number): string {
  const base = start ? new Date(`${String(start).slice(0, 10)}T00:00:00`) : new Date()
  const d = new Date(base)
  // Count backwards from the camp so the last installment lands a month before it.
  d.setMonth(d.getMonth() - (3 - Math.min(2, index)))
  const today = new Date()
  if (d.getTime() < today.getTime()) { d.setTime(today.getTime()); d.setMonth(d.getMonth() + index + 1) }
  return d.toISOString().slice(0, 10)
}
