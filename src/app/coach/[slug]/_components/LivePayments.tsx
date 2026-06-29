'use client'

// Live Payments & Packages — the demo PaymentsView over real data. A coach-
// editable package price list (coach_packages), and per-player lesson packs
// (coach_payments) tracking sessions used vs the pack total, status and renewal.

import { useState, useEffect, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { useCoachTable, sb, currentCoachId } from '../_lib/coach-db'
import { getSettings, setSettings } from '../_lib/settings-store'
import { seedLumioPackages } from '../_lib/lumio-packages'

// Package type → Equipment & Kit session-type checklist.
const KIND_TO_SESSION: Record<string, string> = { Private: 'Private lesson', Performance: 'Private lesson', Adult: 'Private lesson', Group: 'Group / squad', Junior: 'Group / squad', Cardio: 'Cardio Tennis' }
async function pushEquipmentToKit(kind: string, equipment: string) {
  try {
    const items = (equipment || '').split('\n').map(s => s.trim()).filter(Boolean)
    if (!items.length) return
    const uid = await currentCoachId(); if (!uid) return
    const st = KIND_TO_SESSION[kind] || 'Private lesson'
    const ex = await sb().from('coach_kit_items').select('label').eq('coach_id', uid).eq('session_type', st)
    const have = new Set((ex.data ?? []).map((r: any) => (r.label || '').toLowerCase()))
    const rows = items.filter(i => !have.has(i.toLowerCase())).map(label => ({ coach_id: uid, session_type: st, label }))
    if (rows.length) await sb().from('coach_kit_items').insert(rows)
  } catch (e) { console.warn('[payments] pushEquipmentToKit', e) }
}

type Pkg = { id: string; name: string; kind?: string | null; price?: number | null; sessions?: number | null; period?: string | null; description?: string | null; features?: string | null }
type Pay = { id: string; player_name?: string | null; item?: string | null; amount?: number | null; status?: string | null; sessions_used?: number | null; sessions_total?: number | null; renews_date?: string | null; paid?: boolean | null; paid_at?: string | null }
type Player = { id: string; name: string }
type Sess = { id: string; player_name?: string | null; session_date?: string | null; focus?: string | null; rating?: number | null }
type RosterRow = { name: string; assign: Pay | null; used: number; sessions: Sess[] }

const KINDS = ['Private', 'Performance', 'Adult', 'Group', 'Cardio', 'Junior']
const DAY = 86400000
const money = (n: number) => `£${Math.round(n || 0).toLocaleString('en-GB')}`
const fmtD = (d?: string | null) => { const t = d ? new Date(d) : null; return t && !isNaN(t.getTime()) ? t.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—' }

function statusOf(p: Pay): 'active' | 'expiring' | 'overdue' {
  if (p.status === 'overdue' || p.status === 'expiring' || p.status === 'active') return p.status
  const days = p.renews_date ? (new Date(p.renews_date).getTime() - Date.now()) / DAY : null
  if (days != null && days < 0) return 'overdue'
  if (days != null && days <= 14) return 'expiring'
  return 'active'
}

export function LivePayments({ T, accent }: { T: ThemeTokens; accent: AccentTokens }) {
  const packages = useCoachTable<Pkg>('coach_packages')
  const payments = useCoachTable<Pay>('coach_payments')
  const sessions = useCoachTable<Sess>('coach_sessions')
  const { rows: players } = useCoachTable<Player>('coach_players')
  const [editPkg, setEditPkg] = useState<Pkg | 'new' | null>(null)
  const [editPay, setEditPay] = useState<Pay | 'new' | null>(null)
  const [runSheet, setRunSheet] = useState<RosterRow | null>(null)
  const [assignPrefill, setAssignPrefill] = useState<string | null>(null)

  // First visit: load the Lumio default packages as a starting price list (once —
  // the coach can edit/remove anything they don't want).
  useEffect(() => {
    if (packages.loading || getSettings().packagesSeeded) return
    if (packages.rows.length) { setSettings({ packagesSeeded: true }); return }
    seedLumioPackages().then(() => { setSettings({ packagesSeeded: true }); packages.reload() }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packages.loading])

  // Lesson packages are driven by the roster: every player appears, on a package
  // or "pay as you go". Sessions used are derived from submitted lesson summaries
  // (coach_sessions) — no manual ticking.
  const nameKey = (s?: string | null) => (s || '').trim().toLowerCase()
  const sessionsFor = (name?: string | null) => sessions.rows.filter(s => nameKey(s.player_name) === nameKey(name)).sort((a, b) => (a.session_date || '').localeCompare(b.session_date || ''))
  const rosterRows: RosterRow[] = players.map(pl => {
    const assign = payments.rows.find(p => nameKey(p.player_name) === nameKey(pl.name)) || null
    const ss = sessionsFor(pl.name)
    return { name: pl.name, assign, used: ss.length, sessions: ss }
  })
  const extraRows: RosterRow[] = payments.rows
    .filter(p => !players.some(pl => nameKey(pl.name) === nameKey(p.player_name)))
    .map(p => { const ss = sessionsFor(p.player_name); return { name: p.player_name || '—', assign: p, used: ss.length, sessions: ss } })
  const lessonRows = [...rosterRows, ...extraRows]

  const statusColour = (s: string) => s === 'overdue' ? T.bad : s === 'expiring' ? T.warn : T.good
  // Earned = payments collected (paid); Outstanding = priced packages not yet paid.
  const earned = payments.rows.filter(p => p.paid).reduce((s, p) => s + (p.amount || 0), 0)
  const outstanding = payments.rows.filter(p => !p.paid && (p.amount || 0) > 0).reduce((s, p) => s + (p.amount || 0), 0)
  const activeCount = payments.rows.filter(p => statusOf(p) === 'active').length
  const expiringCount = payments.rows.filter(p => statusOf(p) === 'expiring').length
  const togglePaid = async (p: Pay) => { await payments.edit(p.id, { paid: !p.paid, paid_at: !p.paid ? new Date().toISOString() : null }) }

  const tiles: [string, string, string][] = [
    ['Earned this month', money(earned), accent.hex],
    ['Outstanding', money(outstanding), T.bad],
    ['Active packages', String(activeCount), T.good],
    ['Expiring soon', String(expiringCount), T.warn],
  ]

  return (
    <div style={{ fontFamily: FONT }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.text }}>Payments &amp; Packages</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: T.text3 }}>Lesson packs, credits used and what’s outstanding.{(() => { const r = getSettings().privateRate; return r ? ` · Private £${r}/hr` : '' })()}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 16 }}>
        {tiles.map(([l, v, c]) => (
          <div key={l} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{l}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: c, marginTop: 4 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Packages on offer */}
      <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>Packages on offer</div>
          <span style={{ fontSize: 11.5, color: T.text3 }}>Your price list — what players can buy.</span>
          <button onClick={() => setEditPkg('new')} style={{ marginLeft: 'auto', appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 9, padding: '8px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>+ Add package</button>
        </div>
        {packages.rows.length === 0 ? <div style={{ fontSize: 12.5, color: T.text3, padding: '6px 0' }}>No packages yet — add your first to build your price list.</div> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 12 }}>
            {packages.rows.map(pk => (
              <div key={pk.id} style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, position: 'relative' }}>
                <button onClick={async () => { if (confirm(`Remove ${pk.name}?`)) packages.remove(pk.id) }} style={{ position: 'absolute', top: 8, right: 8, appearance: 'none', border: 0, background: 'transparent', color: T.text3, cursor: 'pointer', fontSize: 15 }}>×</button>
                {pk.kind && <span style={{ fontSize: 8.5, fontWeight: 700, color: accent.hex, background: accent.dim, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase' }}>{pk.kind}</span>}
                <div onClick={() => setEditPkg(pk)} style={{ cursor: 'pointer' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginTop: 8 }}>{pk.name}</div>
                  <div style={{ marginTop: 6 }}><span style={{ fontSize: 20, fontWeight: 700, color: T.text }}>{money(pk.price || 0)}</span><span style={{ fontSize: 11, color: T.text3 }}> {pk.period || ''}{pk.sessions ? ` · ${pk.sessions} sessions` : ''}</span></div>
                  {pk.description && <div style={{ fontSize: 11.5, color: T.text2, marginTop: 8, lineHeight: 1.45 }}>{pk.description}</div>}
                  {!!(pk.features || '').trim() && <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {(pk.features || '').split('\n').map(s => s.trim()).filter(Boolean).map((f, i) => <div key={i} style={{ display: 'flex', gap: 6, fontSize: 11.5, color: T.text2 }}><span style={{ color: T.good }}>✓</span>{f}</div>)}
                  </div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lesson packages (per player) */}
      <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>Lesson packages</div>
          <span style={{ fontSize: 11.5, color: T.text3 }}>Every player — on a package or pay-as-you-go. Sessions tick automatically from lesson summaries.</span>
          <button onClick={() => setEditPay('new')} style={{ marginLeft: 'auto', appearance: 'none', border: `1px solid ${accent.border}`, background: accent.dim, color: accent.hex, borderRadius: 9, padding: '8px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>+ Assign package</button>
        </div>
        {lessonRows.length === 0 ? <div style={{ fontSize: 12.5, color: T.text3 }}>No players on the roster yet — add players in Player Roster and they’ll appear here.</div> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 780 }}>
              <thead><tr>{['Player', 'Plan', 'Used', 'Cost', 'Status', 'Paid', 'Renews'].map(h => <th key={h} style={{ textAlign: 'left', fontSize: 10, color: T.text3, fontWeight: 600, padding: '6px 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>)}</tr></thead>
              <tbody>
                {lessonRows.map(r => {
                  const a = r.assign
                  const total = a?.sessions_total || 0
                  const used = total ? Math.min(r.used, total) : r.used
                  const s = a ? statusOf(a) : 'payg'
                  const pct = total ? Math.min(100, used / total * 100) : 0
                  const bar = s === 'overdue' ? T.bad : accent.hex
                  return (
                    <tr key={r.name} onClick={() => setRunSheet(r)} style={{ borderTop: `1px solid ${T.border}`, cursor: 'pointer' }}>
                      <td style={{ padding: '10px 10px', fontSize: 12.5, color: T.text, fontWeight: 600 }}>{r.name}</td>
                      <td style={{ padding: '10px 10px', fontSize: 12, color: a ? T.text2 : T.text3 }}>{a?.item || 'No plan — pay as you go'}</td>
                      <td style={{ padding: '10px 10px', minWidth: 140 }}>
                        {total ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 6, borderRadius: 3, background: T.hover, overflow: 'hidden' }}><div style={{ width: `${pct}%`, height: '100%', background: bar }} /></div>
                            <span style={{ fontSize: 10.5, color: T.text3 }}>{used}/{total}</span>
                          </div>
                        ) : <span style={{ fontSize: 11, color: T.text3 }}>{r.used} logged · PAYG</span>}
                      </td>
                      <td style={{ padding: '10px 10px', fontSize: 12, color: a && a.amount ? T.text : T.text3 }}>{a && a.amount ? money(a.amount) : '—'}</td>
                      <td style={{ padding: '10px 10px' }}>{a
                        ? <span style={{ fontSize: 9.5, fontWeight: 700, color: statusColour(s), background: `${statusColour(s)}22`, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase' }}>{s}</span>
                        : <span style={{ fontSize: 9.5, fontWeight: 700, color: T.text3, background: T.hover, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase' }}>Pay as you go</span>}</td>
                      <td style={{ padding: '10px 10px' }}>{a
                        ? <button onClick={e => { e.stopPropagation(); togglePaid(a) }} title="Click to mark paid / unpaid" style={{ appearance: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', padding: '3px 9px', borderRadius: 5, border: `1px solid ${a.paid ? T.good : T.warn}`, background: a.paid ? `${T.good}22` : 'transparent', color: a.paid ? T.good : T.warn }}>{a.paid ? '✓ Paid' : 'Mark paid'}</button>
                        : <span style={{ fontSize: 12, color: T.text3 }}>—</span>}</td>
                      <td style={{ padding: '10px 10px', fontSize: 12, color: T.text2 }}>{a ? fmtD(a.renews_date) : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {runSheet && <PackageRunSheet T={T} accent={accent} row={runSheet}
        onClose={() => setRunSheet(null)}
        onEditPlan={() => { const a = runSheet.assign; const nm = runSheet.name; setRunSheet(null); if (a) setEditPay(a); else { setAssignPrefill(nm); setEditPay('new') } }} />}
      {editPkg && <PackageForm T={T} accent={accent} pkg={editPkg === 'new' ? null : editPkg} onClose={() => setEditPkg(null)} onSave={async v => { if (editPkg === 'new') await packages.add(v); else await packages.edit(editPkg.id, v); setEditPkg(null) }} />}
      {editPay && <AssignForm T={T} accent={accent} players={players} packages={packages.rows} pay={editPay === 'new' ? null : editPay} prefillName={assignPrefill}
        onClose={() => { setEditPay(null); setAssignPrefill(null) }}
        onDelete={editPay !== 'new' ? async () => { await payments.remove(editPay.id); setEditPay(null) } : undefined}
        onSave={async v => { if (editPay === 'new') await payments.add(v); else await payments.edit(editPay.id, v); setEditPay(null); setAssignPrefill(null) }} />}
    </div>
  )
}

const field = (T: ThemeTokens): CSSProperties => ({ width: '100%', background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 9, padding: '9px 11px', fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' })
const lab = (T: ThemeTokens): CSSProperties => ({ display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: T.text3, margin: '0 0 5px' })
function Shell({ T, title, onClose, children, footer }: { T: ThemeTokens; title: string; onClose: () => void; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, fontFamily: FONT, padding: '5vh 16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 460, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 14 }}>{title}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18 }}>{footer}</div>
      </div>
    </div>
  )
}

function PackageForm({ T, accent, pkg, onClose, onSave }: { T: ThemeTokens; accent: AccentTokens; pkg: Pkg | null; onClose: () => void; onSave: (v: Record<string, any>) => Promise<void> }) {
  const [d, setD] = useState<Record<string, any>>({ name: pkg?.name || '', kind: pkg?.kind || 'Private', price: pkg?.price ?? '', sessions: pkg?.sessions ?? '', period: pkg?.period || 'per pack', description: pkg?.description || '', features: pkg?.features || '', equipment: (pkg as any)?.equipment || '' })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: any) => setD(p => ({ ...p, [k]: v }))
  const save = async () => {
    if (!String(d.name).trim() || saving) return
    setSaving(true)
    try {
      await onSave({ name: d.name, kind: d.kind, price: Number(d.price) || null, sessions: Number(d.sessions) || null, period: d.period, description: d.description, features: d.features, equipment: d.equipment })
      await pushEquipmentToKit(d.kind, d.equipment)
    } finally { setSaving(false) }
  }
  return (
    <Shell T={T} title={pkg ? 'Edit package' : 'Add a package'} onClose={onClose}
      footer={<>
        <button onClick={onClose} style={{ marginLeft: 'auto', appearance: 'none', padding: '8px 14px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
        <button onClick={save} disabled={!String(d.name).trim() || saving} style={{ appearance: 'none', border: 0, padding: '8px 16px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: String(d.name).trim() && !saving ? 1 : 0.5, fontFamily: FONT }}>{saving ? 'Saving…' : '+ Add package'}</button>
      </>}>
      <div><label style={lab(T)}>Package name *</label><input value={d.name} onChange={e => set('name', e.target.value)} placeholder="e.g. 10-lesson private pack" style={field(T)} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div><label style={lab(T)}>Type</label><select value={d.kind} onChange={e => set('kind', e.target.value)} style={{ ...field(T), cursor: 'pointer' }}>{KINDS.map(k => <option key={k} value={k}>{k}</option>)}</select></div>
        <div><label style={lab(T)}>Sessions</label><input type="number" value={d.sessions} onChange={e => set('sessions', e.target.value)} style={field(T)} /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div><label style={lab(T)}>Price (£) *</label><input type="number" value={d.price} onChange={e => set('price', e.target.value)} style={field(T)} /></div>
        <div><label style={lab(T)}>Billing</label><select value={d.period} onChange={e => set('period', e.target.value)} style={{ ...field(T), cursor: 'pointer' }}>{['per pack', 'per month', 'per term'].map(p => <option key={p} value={p}>{p.replace('per ', 'Per ')}</option>)}</select></div>
      </div>
      <div><label style={lab(T)}>Description</label><input value={d.description} onChange={e => set('description', e.target.value)} placeholder="One line about this package" style={field(T)} /></div>
      <div><label style={lab(T)}>What’s included (one per line)</label><textarea value={d.features} onChange={e => set('features', e.target.value)} rows={4} style={{ ...field(T), resize: 'vertical' }} /></div>
      <div><label style={lab(T)}>Equipment needed per session (one per line)</label><textarea value={d.equipment} onChange={e => set('equipment', e.target.value)} rows={3} placeholder="Ball basket (60+)&#10;Cones ×8&#10;Target hoops" style={{ ...field(T), resize: 'vertical' }} /></div>
      <div style={{ fontSize: 11, color: T.text3 }}>Added to <strong style={{ color: T.text2 }}>Equipment &amp; Kit → {KIND_TO_SESSION[d.kind] || 'Private lesson'}</strong> so it’s on the grab-and-go checklist.</div>
    </Shell>
  )
}

function AssignForm({ T, accent, players, packages, pay, prefillName, onClose, onSave, onDelete }: { T: ThemeTokens; accent: AccentTokens; players: Player[]; packages: Pkg[]; pay: Pay | null; prefillName?: string | null; onClose: () => void; onSave: (v: Record<string, any>) => Promise<void>; onDelete?: () => Promise<void> }) {
  const [d, setD] = useState<Record<string, any>>({ player_name: pay?.player_name || prefillName || '', item: pay?.item || '', amount: pay?.amount ?? '', sessions_total: pay?.sessions_total ?? '', status: pay?.status || 'active', renews_date: pay?.renews_date || '' })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: any) => setD(p => ({ ...p, [k]: v }))
  const pickPackage = (name: string) => {
    if (name === 'Pay as you go') { set('item', 'Pay as you go'); set('sessions_total', ''); set('amount', ''); return }
    const pk = packages.find(p => p.name === name); set('item', name); if (pk) { set('amount', pk.price ?? ''); set('sessions_total', pk.sessions ?? '') }
  }
  const save = async () => { if (!String(d.player_name).trim() || saving) return; setSaving(true); try { await onSave({ player_name: d.player_name, item: d.item, amount: Number(d.amount) || null, sessions_total: Number(d.sessions_total) || null, status: d.status, renews_date: d.renews_date || null }) } finally { setSaving(false) } }
  return (
    <Shell T={T} title={pay ? 'Update package' : 'Assign package'} onClose={onClose}
      footer={<>
        {onDelete && <button onClick={async () => { if (confirm('Remove this package?')) await onDelete() }} style={{ appearance: 'none', padding: '8px 12px', borderRadius: 9, background: 'transparent', color: T.bad, border: `1px solid ${T.border}`, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>Delete</button>}
        <button onClick={onClose} style={{ marginLeft: 'auto', appearance: 'none', padding: '8px 14px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
        <button onClick={save} disabled={!String(d.player_name).trim() || saving} style={{ appearance: 'none', border: 0, padding: '8px 16px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: String(d.player_name).trim() && !saving ? 1 : 0.5, fontFamily: FONT }}>{saving ? 'Saving…' : 'Save'}</button>
      </>}>
      <div><label style={lab(T)}>Player *</label>
        <select value={players.some(p => p.name === d.player_name) ? d.player_name : ''} onChange={e => set('player_name', e.target.value)} style={{ ...field(T), cursor: 'pointer' }}>
          <option value="">Choose a player…</option>
          {players.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
        </select>
      </div>
      <div><label style={lab(T)}>Plan</label>
        <select value={packages.some(p => p.name === d.item) ? d.item : (d.item === 'Pay as you go' ? 'Pay as you go' : '')} onChange={e => pickPackage(e.target.value)} style={{ ...field(T), cursor: 'pointer' }}>
          <option value="">Choose a package…</option>
          <option value="Pay as you go">Pay as you go (no package)</option>
          {packages.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div><label style={lab(T)}>Price £</label><input type="number" value={d.amount} onChange={e => set('amount', e.target.value)} style={field(T)} /></div>
        <div><label style={lab(T)}>Total sessions</label><input type="number" value={d.sessions_total} onChange={e => set('sessions_total', e.target.value)} style={field(T)} /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div><label style={lab(T)}>Status</label><select value={d.status} onChange={e => set('status', e.target.value)} style={{ ...field(T), cursor: 'pointer' }}>{['active', 'expiring', 'overdue'].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
        <div><label style={lab(T)}>Renews</label><input type="date" value={d.renews_date} onChange={e => set('renews_date', e.target.value)} style={field(T)} /></div>
      </div>
      <div style={{ fontSize: 11, color: T.text3 }}>Sessions used tick automatically each time you submit a lesson summary for this player — no manual counting.</div>
    </Shell>
  )
}

function PackageRunSheet({ T, accent, row, onClose, onEditPlan }: { T: ThemeTokens; accent: AccentTokens; row: RosterRow; onClose: () => void; onEditPlan: () => void }) {
  const a = row.assign
  const total = a?.sessions_total || 0
  const slots = total || row.sessions.length || 0
  const list = Array.from({ length: slots }, (_, i) => row.sessions[i] || null)
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, fontFamily: FONT, padding: '5vh 16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 460, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{row.name}</div>
            <div style={{ fontSize: 12, color: T.text3, marginTop: 2 }}>{a?.item ? `${a.item}${a.renews_date ? ` · renews ${fmtD(a.renews_date)}` : ''}` : 'No plan — pay as you go'}</div>
          </div>
          <button onClick={onClose} style={{ appearance: 'none', border: 0, background: 'transparent', color: T.text3, cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>
        {total > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
          <div style={{ flex: 1, height: 6, borderRadius: 3, background: T.hover, overflow: 'hidden' }}><div style={{ width: `${Math.min(100, row.used / total * 100)}%`, height: '100%', background: accent.hex }} /></div>
          <span style={{ fontSize: 11, color: T.text3 }}>{Math.min(row.used, total)}/{total} used</span>
        </div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 }}>
          {slots === 0 ? <div style={{ fontSize: 12.5, color: T.text3 }}>No sessions logged yet. Submit a lesson summary and it’ll appear here automatically.</div> : list.map((s, i) => {
            const done = !!s
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: done ? accent.dim : T.panel2, border: `1px solid ${done ? accent.border : T.border}`, borderRadius: 9, padding: '9px 11px' }}>
                <span style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, display: 'grid', placeItems: 'center', background: done ? accent.hex : 'transparent', border: done ? 0 : `1.5px solid ${T.border}`, color: T.btnText, fontSize: 11, fontWeight: 700 }}>{done ? '✓' : ''}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: T.text }}>Session {i + 1}</div>
                  {done && <div style={{ fontSize: 10.5, color: T.text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{[s!.session_date && new Date(s!.session_date).toLocaleDateString('en-GB'), s!.focus].filter(Boolean).join(' · ') || 'Lesson summary logged'}</div>}
                </div>
                {done && <span style={{ fontSize: 9.5, fontWeight: 700, color: accent.hex }}>SUMMARY</span>}
              </div>
            )
          })}
        </div>
        <div style={{ fontSize: 10.5, color: T.text3, marginTop: 12, lineHeight: 1.5 }}>Sessions tick automatically as you submit lesson summaries — you don’t mark these by hand.</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
          <button onClick={onClose} style={{ marginLeft: 'auto', appearance: 'none', padding: '8px 14px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>Close</button>
          <button onClick={onEditPlan} style={{ appearance: 'none', border: 0, padding: '8px 16px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>{a ? 'Edit plan' : 'Assign a package'}</button>
        </div>
      </div>
    </div>
  )
}
