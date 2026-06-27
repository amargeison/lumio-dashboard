'use client'

// Live Equipment & Kit — the demo over real data. Stats, grab-and-go "kit for
// each session type" checklists (coach_kit_items), and a categorised inventory
// (coach_equipment) with inline quantity/status editing. (The Restock list is
// intentionally left out of v1.)

import { useState, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { useCoachTable, dbInsert } from '../_lib/coach-db'

type Item = { id: string; item: string; category?: string | null; quantity?: number | null; status?: string | null; notes?: string | null }
type Kit = { id: string; session_type: string; label: string }
const SESSION_TYPES = ['Private lesson', 'Group / squad', 'Cardio Tennis', 'Match play', 'Mini / red ball']
const STATUSES: { v: string; l: string }[] = [{ v: 'in_stock', l: 'In stock' }, { v: 'low', l: 'Running low' }, { v: 'order', l: 'To order' }, { v: 'repair', l: 'Repair' }]
const statusLabel = (s?: string | null) => STATUSES.find(x => x.v === s)?.l || 'In stock'
const needsAttention = (s?: string | null) => s === 'low' || s === 'order' || s === 'repair'

export function LiveEquipment({ T, accent }: { T: ThemeTokens; accent: AccentTokens }) {
  const items = useCoachTable<Item>('coach_equipment')
  const kits = useCoachTable<Kit>('coach_kit_items')
  const [edit, setEdit] = useState<Item | 'new' | null>(null)
  const [filter, setFilter] = useState<'all' | 'attention'>('all')

  const statusColour = (s?: string | null) => s === 'in_stock' ? T.good : s === 'order' ? '#3A8EE0' : s === 'repair' ? T.bad : T.warn
  const tiles: [string, number, string][] = [
    ['Items tracked', items.rows.length, T.text],
    ['In stock', items.rows.filter(i => i.status === 'in_stock' || !i.status).length, T.good],
    ['Need attention', items.rows.filter(i => needsAttention(i.status)).length, T.warn],
    ['On order', items.rows.filter(i => i.status === 'order').length, '#3A8EE0'],
  ]

  // Inventory grouped by category.
  const cats = Array.from(new Set(items.rows.map(i => i.category || 'Uncategorised')))
  const shown = (i: Item) => filter === 'all' || needsAttention(i.status)

  return (
    <div style={{ fontFamily: FONT }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.text }}>Equipment &amp; Kit</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: T.text3 }}>Everything you need on court — edit stock inline and build your session kits.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setEdit('new')} style={{ appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 10, padding: '9px 15px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>+ Add item</button>
          <button onClick={() => printKit(SESSION_TYPES, kits.rows, items.rows)} style={{ appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 10, padding: '9px 15px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>🖨️ Print kit list</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
        {tiles.map(([l, v, c]) => (
          <div key={l} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{l}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: c, marginTop: 4 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Kit for each session type */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text, marginBottom: 10 }}>Kit for each session type <span style={{ fontSize: 11, fontWeight: 400, color: T.text3 }}>· grab-and-go checklists</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {SESSION_TYPES.map(st => <KitCard key={st} T={T} accent={accent} type={st} items={kits.rows.filter(k => k.session_type === st)} reload={kits.reload} remove={kits.remove} />)}
        </div>
      </div>

      {/* Inventory */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>Inventory <span style={{ fontSize: 11, fontWeight: 400, color: T.text3 }}>· tap a quantity or status to edit</span></div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 0, padding: 2, background: T.hover, borderRadius: 8 }}>
          {(['all', 'attention'] as const).map(f => <button key={f} onClick={() => setFilter(f)} style={{ appearance: 'none', border: 0, padding: '5px 12px', borderRadius: 6, fontSize: 11.5, cursor: 'pointer', fontFamily: FONT, background: filter === f ? T.panel : 'transparent', color: filter === f ? T.text : T.text2, fontWeight: filter === f ? 600 : 400 }}>{f === 'all' ? 'All' : 'Needs attention'}</button>)}
        </div>
      </div>
      {items.rows.length === 0 ? <div style={{ fontSize: 12.5, color: T.text3, padding: '8px 0' }}>No equipment yet — add your first item.</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {cats.map(cat => {
            const catItems = items.rows.filter(i => (i.category || 'Uncategorised') === cat && shown(i))
            if (catItems.length === 0) return null
            return (
              <div key={cat} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 10 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: T.text }}>{cat}</div>
                  <div style={{ marginLeft: 'auto', fontSize: 11, color: T.text3 }}>{catItems.length}</div>
                </div>
                {catItems.map(i => (
                  <div key={i.id} onClick={() => setEdit(i)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderTop: `1px solid ${T.border}`, cursor: 'pointer' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusColour(i.status), flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, color: T.text, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{i.item}</div>
                      {i.notes && <div style={{ fontSize: 10.5, color: T.text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{i.notes}</div>}
                    </div>
                    {i.quantity != null && <span style={{ fontSize: 11, color: T.text2, background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 6, padding: '2px 7px' }}>×{i.quantity}</span>}
                    <span style={{ fontSize: 9, fontWeight: 700, color: statusColour(i.status), background: `${statusColour(i.status)}22`, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{statusLabel(i.status)}</span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {edit && <ItemForm T={T} accent={accent} item={edit === 'new' ? null : edit}
        onClose={() => setEdit(null)}
        onDelete={edit !== 'new' ? async () => { await items.remove(edit.id); setEdit(null) } : undefined}
        onSave={async v => { if (edit === 'new') await items.add(v); else await items.edit(edit.id, v); setEdit(null) }} />}
    </div>
  )
}

function KitCard({ T, accent, type, items, reload, remove }: { T: ThemeTokens; accent: AccentTokens; type: string; items: Kit[]; reload: () => void; remove: (id: string) => Promise<void> }) {
  const [adding, setAdding] = useState('')
  const add = async () => { if (!adding.trim()) return; await dbInsert('coach_kit_items', { session_type: type, label: adding.trim() }); setAdding(''); reload() }
  return (
    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 14 }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: T.text, marginBottom: 10 }}>{type}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map(k => (
          <div key={k.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: accent.hex, fontSize: 11 }}>•</span>
            <span style={{ flex: 1, fontSize: 12, color: T.text2 }}>{k.label}</span>
            <button onClick={() => remove(k.id).then(reload)} style={{ appearance: 'none', border: 0, background: 'transparent', color: T.text3, cursor: 'pointer', fontSize: 14 }}>×</button>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <input value={adding} onChange={e => setAdding(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') add() }} placeholder="Add item" style={{ flex: 1, background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 9px', fontSize: 12, fontFamily: FONT, outline: 'none' }} />
        <button onClick={add} style={{ appearance: 'none', border: `1px solid ${accent.border}`, background: accent.dim, color: accent.hex, borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>+</button>
      </div>
    </div>
  )
}

function ItemForm({ T, accent, item, onClose, onSave, onDelete }: { T: ThemeTokens; accent: AccentTokens; item: Item | null; onClose: () => void; onSave: (v: Record<string, any>) => Promise<void>; onDelete?: () => Promise<void> }) {
  const [d, setD] = useState<Record<string, any>>({ item: item?.item || '', category: item?.category || '', quantity: item?.quantity ?? '', status: item?.status || 'in_stock', notes: item?.notes || '' })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: any) => setD(p => ({ ...p, [k]: v }))
  const field: CSSProperties = { width: '100%', background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 9, padding: '9px 11px', fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' }
  const lab: CSSProperties = { display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: T.text3, margin: '0 0 5px' }
  const save = async () => { if (!String(d.item).trim() || saving) return; setSaving(true); try { await onSave({ item: d.item, category: d.category, quantity: Number(d.quantity) || null, status: d.status, notes: d.notes }) } finally { setSaving(false) } }
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, fontFamily: FONT, padding: '5vh 16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 420, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 14 }}>{item ? 'Edit item' : 'Add item'}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div><label style={lab}>Item *</label><input value={d.item} onChange={e => set('item', e.target.value)} placeholder="e.g. Yellow balls" style={field} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr', gap: 10 }}>
            <div><label style={lab}>Category</label><input value={d.category} onChange={e => set('category', e.target.value)} placeholder="e.g. Balls & baskets" style={field} /></div>
            <div><label style={lab}>Quantity</label><input type="number" value={d.quantity} onChange={e => set('quantity', e.target.value)} style={field} /></div>
          </div>
          <div><label style={lab}>Status</label><select value={d.status} onChange={e => set('status', e.target.value)} style={{ ...field, cursor: 'pointer' }}>{STATUSES.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}</select></div>
          <div><label style={lab}>Notes / location</label><input value={d.notes} onChange={e => set('notes', e.target.value)} placeholder="e.g. Main coaching bag" style={field} /></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18 }}>
          {onDelete && <button onClick={async () => { if (confirm('Delete this item?')) await onDelete() }} style={{ appearance: 'none', padding: '8px 12px', borderRadius: 9, background: 'transparent', color: T.bad, border: `1px solid ${T.border}`, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>Delete</button>}
          <button onClick={onClose} style={{ marginLeft: 'auto', appearance: 'none', padding: '8px 14px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
          <button onClick={save} disabled={!String(d.item).trim() || saving} style={{ appearance: 'none', border: 0, padding: '8px 16px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: String(d.item).trim() && !saving ? 1 : 0.5, fontFamily: FONT }}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  )
}

function printKit(types: string[], kits: Kit[], items: Item[]) {
  if (typeof window === 'undefined') return
  const esc = (s: string) => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!))
  const kitBlocks = types.map(t => { const list = kits.filter(k => k.session_type === t); return list.length ? `<h3>${esc(t)}</h3><ul>${list.map(k => `<li>${esc(k.label)}</li>`).join('')}</ul>` : '' }).join('')
  const cats = Array.from(new Set(items.map(i => i.category || 'Uncategorised')))
  const inv = cats.map(c => `<h3>${esc(c)}</h3><ul>${items.filter(i => (i.category || 'Uncategorised') === c).map(i => `<li>${esc(i.item)}${i.quantity != null ? ` ×${i.quantity}` : ''} — ${esc(statusLabel(i.status))}</li>`).join('')}</ul>`).join('')
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Kit list</title><style>body{font-family:-apple-system,Segoe UI,Arial,sans-serif;max-width:720px;margin:32px auto;color:#111;padding:0 20px}h3{font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:#555;margin:16px 0 6px}ul{margin:0;padding-left:20px}li{margin:2px 0;font-size:13px}</style></head><body><h1>Kit list</h1><h2 style="color:#444">Session kits</h2>${kitBlocks}<h2 style="color:#444;margin-top:24px">Inventory</h2>${inv}</body></html>`
  const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 300) }
}
