'use client'

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT, FONT_MONO } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { EQUIPMENT_INVENTORY, SESSION_KITS, PACKAGE_TYPE_TO_KIT, COACH_ORG, type KitStatus } from '../_lib/coach-data'
import { RestockSourcingModal } from './RestockSourcing'
import {
  getAddedEquipment, getInvOverrides, setInvOverride, getKitEdits, addKitItem, removeKitItem,
  getOrdered, subscribe as subscribeEquipment, type AddedKitItem,
} from '../_lib/equipment-store'
import { getOffers, subscribe as subscribePackages } from '../_lib/packages-store'
import { AddEquipmentModal } from './AddEquipmentModal'
import { getFlags as getFeatureFlags, subscribe as subscribeFeatures, type FeatureFlags, type FeatureKey } from '../_lib/feature-flags'

type Common = { T: ThemeTokens; accent: AccentTokens; density: Density }

const STATUSES: KitStatus[] = ['good', 'low', 'order', 'repair']

// Tag a kit item to a feature so it drops out of inventory / restock / session
// kits when that feature is turned off (e.g. cameras when Video is off).
function itemFeature(name: string): FeatureKey | null {
  const n = name.toLowerCase()
  if (/gps|tracker|vest|beacon/.test(n)) return 'gps'
  if (/camera|tripod|tablet|sd card|vision|\bvideo\b/.test(n)) return 'video'
  if (/\bmic\b|microphone|\baudio\b/.test(n)) return 'audio'
  return null
}

function Card({ T, density, children, style }: { T: ThemeTokens; density: Density; children: ReactNode; style?: CSSProperties }) {
  return <div style={{ position: 'relative', background: T.panel, border: `1px solid ${T.border}`, borderRadius: density.radius, padding: density.pad, boxShadow: T.cardShadow, ...style }}>{children}</div>
}
function SectionHead({ T, title, right }: { T: ThemeTokens; title: ReactNode; right?: ReactNode }) {
  return <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 10, gap: 8 }}><div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{title}</div><div style={{ marginLeft: 'auto', fontSize: 11, color: T.text3 }}>{right}</div></div>
}

export function EquipmentView({ T, accent, density }: Common) {
  const [filter, setFilter] = useState<'all' | 'attention'>('all')
  const [sourceOpen, setSourceOpen] = useState(false)
  const [deselected, setDeselected] = useState<Set<string>>(new Set())
  const [addOpen, setAddOpen] = useState(false)
  // live store snapshots
  const [addedItems, setAddedItems] = useState<AddedKitItem[]>([])
  const [overrides, setOverrides] = useState<Record<string, { qty?: string; status?: KitStatus }>>({})
  const [kitEdits, setKitEdits] = useState<Record<string, { added: string[]; removed: string[] }>>({})
  const [ordered, setOrdered] = useState<string[]>([])
  const [offers, setOffers] = useState(getOffers())
  const [feat, setFeat] = useState<FeatureFlags>(getFeatureFlags())
  useEffect(() => {
    const r = () => { setAddedItems(getAddedEquipment()); setOverrides(getInvOverrides()); setKitEdits(getKitEdits()); setOrdered(getOrdered()) }
    r(); const u1 = subscribeEquipment(r)
    const r2 = () => setOffers(getOffers()); r2(); const u2 = subscribePackages(r2)
    const r3 = () => setFeat(getFeatureFlags()); r3(); const u3 = subscribeFeatures(r3)
    return () => { u1(); u2(); u3() }
  }, [])
  // A kit item is shown only if its tagged feature is on (untagged = always on).
  const featureOn = (name: string) => { const f = itemFeature(name); return !f || feat[f] }

  const tone = (s: KitStatus) => s === 'good' ? T.good : s === 'low' ? T.warn : s === 'order' ? '#3A8EE0' : T.bad
  const label = (s: KitStatus) => s === 'good' ? 'In stock' : s === 'low' ? 'Running low' : s === 'order' ? 'To order' : 'Repair'

  // Apply overrides (qty/status) on top of the base + added inventory.
  const eff = (name: string, base: { qty: string; status: KitStatus }) => ({
    qty: overrides[name]?.qty ?? base.qty,
    status: overrides[name]?.status ?? base.status,
  })
  const mergedInventory = EQUIPMENT_INVENTORY.map(c => ({ ...c, items: [...c.items, ...addedItems.filter(a => a.category === c.category)].filter(it => featureOn(it.name)) })).filter(c => c.items.length)
  const allItems = mergedInventory.flatMap(c => c.items.map(it => { const e = eff(it.name, it); return { ...it, qty: e.qty, status: e.status, category: c.category } }))
  const orderedSet = new Set(ordered)
  // restock = anything not "good" and not already ordered
  const attention = allItems.filter(i => i.status !== 'good' && !orderedSet.has(i.name))
  const selected = attention.filter(i => !deselected.has(i.name))
  const toggleSel = (name: string) => setDeselected(prev => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n })

  const cats = (filter === 'attention'
    ? mergedInventory.map(c => ({ ...c, items: c.items.filter(i => eff(i.name, i).status !== 'good') })).filter(c => c.items.length)
    : mergedInventory)

  // ── session-kit checklist: base + package-derived + coach-added, minus removed ──
  const kitItemsFor = (type: string): string[] => {
    const base = SESSION_KITS.find(k => k.type === type)?.items ?? []
    const fromPackages = offers.filter(o => PACKAGE_TYPE_TO_KIT[o.type] === type).flatMap(o => o.equipment ?? [])
    const edit = kitEdits[type] ?? { added: [], removed: [] }
    const seen = new Set<string>()
    return [...base, ...fromPackages, ...edit.added].filter(it => {
      if (edit.removed.includes(it) || seen.has(it) || !featureOn(it)) return false
      seen.add(it); return true
    })
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: FONT, fontSize: 24, fontWeight: 600, color: T.text, letterSpacing: '-0.02em' }}>Equipment &amp; Kit</h1>
          <p style={{ margin: '4px 0 0', fontSize: 12.5, color: T.text3 }}>Everything you need on court — edit stock inline, build your session kits, and let Lumio source the cheapest restock.</p>
        </div>
        <button onClick={() => setAddOpen(true)} style={{ marginLeft: 'auto', appearance: 'none', border: 0, padding: '8px 14px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 12.5, fontWeight: 600, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <Icon name="plus" size={14} stroke={2} /> Add item
        </button>
        <button onClick={() => openKitList()} style={{ appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, padding: '8px 14px', borderRadius: 9, fontSize: 12.5, fontWeight: 600, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <Icon name="note" size={14} stroke={2} /> Print kit list
        </button>
      </div>

      {/* summary */}
      <div style={{ display: 'flex', gap: density.gap, marginBottom: density.gap, flexWrap: 'wrap' }}>
        {[
          { l: 'Items tracked', v: allItems.length, c: T.text },
          { l: 'In stock', v: allItems.filter(i => i.status === 'good').length, c: T.good },
          { l: 'Need attention', v: attention.length, c: attention.length ? T.warn : T.good },
          { l: 'On order', v: ordered.length, c: '#3A8EE0' },
        ].map((m, i) => (
          <Card key={i} T={T} density={density} style={{ flex: '1 1 140px' }}>
            <div style={{ fontSize: 10.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m.l}</div>
            <div className="tnum" style={{ fontSize: 24, fontWeight: 500, color: m.c, marginTop: 4 }}>{m.v}</div>
          </Card>
        ))}
      </div>

      {/* restock — tick what to buy, then let Lumio source & draft the order */}
      <Card T={T} density={density} style={{ marginBottom: density.gap, borderColor: attention.length ? `${T.warn}55` : T.border }}>
        <SectionHead T={T} title={<><Icon name="bell" size={13} stroke={1.7} style={{ color: T.warn, marginRight: 6, verticalAlign: -2 }} />Restock list — never miss anything</>}
          right={<span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>{selected.length} selected</span>
            {attention.length > 0 && (
              <button onClick={() => setSourceOpen(true)} disabled={selected.length === 0}
                style={{ appearance: 'none', border: 0, padding: '6px 12px', borderRadius: 8, background: selected.length ? accent.hex : T.hover, color: selected.length ? T.btnText : T.text3, fontSize: 11.5, fontWeight: 600, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 6, cursor: selected.length ? 'pointer' : 'not-allowed' }}>
                <Icon name="sparkles" size={12} stroke={1.7} /> Source &amp; order
              </button>
            )}
          </span>} />
        {attention.length === 0 ? (
          <div style={{ fontSize: 12.5, color: T.text3 }}>All kit in stock{ordered.length ? ` · ${ordered.length} on order` : ''} — you&apos;re good to go.</div>
        ) : (
          <>
            <div style={{ fontSize: 11, color: T.text3, marginBottom: 8 }}>Tick the items you want to buy, then Source &amp; order — Lumio finds the cheapest supplier and drafts the order email for you.</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
              {attention.map(it => {
                const on = !deselected.has(it.name)
                return (
                  <button key={it.name} onClick={() => toggleSel(it.name)}
                    style={{ appearance: 'none', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 9, border: `1px solid ${on ? `${tone(it.status)}44` : T.border}`, background: on ? `${tone(it.status)}10` : 'transparent', cursor: 'pointer', opacity: on ? 1 : 0.6 }}>
                    <div style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${on ? accent.hex : T.border}`, background: on ? accent.hex : 'transparent', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      {on && <Icon name="check" size={12} stroke={2.4} style={{ color: T.btnText }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, color: T.text, fontWeight: 600 }}>{it.name}</div>
                      <div style={{ fontSize: 10.5, color: T.text3 }}>{it.category} · {it.location}{it.note ? ` · ${it.note}` : ''}</div>
                    </div>
                    <span style={{ fontSize: 9, fontFamily: FONT_MONO, fontWeight: 700, color: tone(it.status), textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{label(it.status)}</span>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </Card>

      {/* session kit checklists — editable, fed by packages */}
      <SectionHead T={T} title="Kit for each session type" right="grab-and-go checklists · add or remove items" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: density.gap, marginBottom: density.gap }}>
        {SESSION_KITS.map(k => (
          <SessionKitCard key={k.type} T={T} accent={accent} density={density} type={k.type} icon={k.icon} items={kitItemsFor(k.type)} />
        ))}
      </div>

      {/* full inventory — editable qty + status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Inventory</div>
        <span style={{ fontSize: 11, color: T.text3 }}>tap a quantity or status to edit</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 0, padding: 2, background: T.hover, borderRadius: 8 }}>
          {([['all', 'All'], ['attention', 'Needs attention']] as const).map(([id, lbl]) => (
            <button key={id} onClick={() => setFilter(id)} style={{ appearance: 'none', border: 0, padding: '5px 12px', borderRadius: 6, fontSize: 11.5, cursor: 'pointer', background: filter === id ? T.panel : 'transparent', color: filter === id ? T.text : T.text2, fontWeight: filter === id ? 600 : 400, boxShadow: filter === id ? `0 0 0 1px ${T.border}` : 'none' }}>{lbl}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: density.gap }} className="cm-eq">
        {cats.map(cat => (
          <Card key={cat.category} T={T} density={density}>
            <SectionHead T={T} title={<><Icon name={cat.icon} size={13} stroke={1.7} style={{ color: accent.hex, marginRight: 6, verticalAlign: -2 }} />{cat.category}</>} right={`${cat.items.length}`} />
            {cat.items.map((it, i) => {
              const e = eff(it.name, it)
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderTop: i ? `1px solid ${T.border}` : 'none' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: tone(e.status), flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, color: T.text }}>{it.name}</div>
                    <div style={{ fontSize: 10, color: T.text3 }}>{it.location}{it.note ? ` · ${it.note}` : ''}</div>
                  </div>
                  <input value={e.qty} onChange={ev => setInvOverride(it.name, { qty: ev.target.value })}
                    style={{ width: 58, textAlign: 'right', appearance: 'none', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 6, color: T.text2, fontSize: 11, fontFamily: FONT_MONO, padding: '3px 6px', outline: 'none' }} />
                  <select value={e.status} onChange={ev => setInvOverride(it.name, { status: ev.target.value as KitStatus })}
                    title="Set status"
                    style={{ appearance: 'none', background: `${tone(e.status)}1a`, color: tone(e.status), border: `1px solid ${tone(e.status)}55`, borderRadius: 4, fontSize: 8.5, fontWeight: 700, fontFamily: FONT_MONO, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '3px 4px', cursor: 'pointer', outline: 'none' }}>
                    {STATUSES.map(s => <option key={s} value={s} style={{ color: '#111', textTransform: 'none' }}>{label(s)}</option>)}
                  </select>
                </div>
              )
            })}
          </Card>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap', fontSize: 10.5, color: T.text3 }}>
        {STATUSES.map(s => (
          <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: tone(s) }} />{label(s)}</span>
        ))}
      </div>

      {sourceOpen && <RestockSourcingModal T={T} accent={accent} items={selected.map(i => ({ name: i.name, qty: i.qty, category: i.category }))} onClose={() => setSourceOpen(false)} />}
      {addOpen && <AddEquipmentModal T={T} accent={accent} density={density} onClose={() => setAddOpen(false)} />}
    </div>
  )
}

// ─── editable session-kit card ────────────────────────────────────────────────
function SessionKitCard({ T, accent, density, type, icon, items }: Common & { type: string; icon: string; items: string[] }) {
  const [adding, setAdding] = useState(false)
  const [val, setVal] = useState('')
  const submit = () => { const t = val.trim(); if (t) { addKitItem(type, t); setVal('') } setAdding(false) }
  return (
    <div style={{ position: 'relative', background: T.panel, border: `1px solid ${T.border}`, borderRadius: density.radius, padding: density.pad, boxShadow: T.cardShadow }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', background: accent.dim }}><Icon name={icon} size={15} stroke={1.7} style={{ color: accent.hex }} /></div>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{type}</div>
      </div>
      {items.map((it, i) => (
        <div key={i} className="kit-row" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: T.text2, padding: '3px 0' }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: accent.hex, flexShrink: 0 }} />
          <span style={{ flex: 1, minWidth: 0 }}>{it}</span>
          <button onClick={() => removeKitItem(type, it)} title="Remove" style={{ appearance: 'none', border: 0, background: 'transparent', color: T.text4, cursor: 'pointer', fontSize: 13, lineHeight: 1, padding: '0 2px' }}>✕</button>
        </div>
      ))}
      {adding ? (
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <input autoFocus value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setAdding(false) }}
            placeholder="Add item…" style={{ flex: 1, appearance: 'none', background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 7, color: T.text, fontSize: 11.5, padding: '5px 8px', fontFamily: FONT, outline: 'none' }} />
          <button onClick={submit} style={{ appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 7, fontSize: 11, fontWeight: 600, padding: '5px 9px', cursor: 'pointer' }}>Add</button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{ marginTop: 8, appearance: 'none', border: `1px dashed ${T.border}`, background: 'transparent', color: T.text3, borderRadius: 7, fontSize: 11, fontWeight: 600, padding: '5px 9px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center' }}>
          <Icon name="plus" size={12} stroke={2} /> Add item
        </button>
      )}
    </div>
  )
}

// ─── print ───────────────────────────────────────────────────────────────────
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
function openKitList() {
  if (typeof window === 'undefined') return
  const ovr = getInvOverrides()
  const offers = getOffers()
  const kitEdits = getKitEdits()
  const effStatus = (name: string, base: KitStatus): KitStatus => ovr[name]?.status ?? base
  const effQty = (name: string, base: string): string => ovr[name]?.qty ?? base
  const statusTxt = (s: KitStatus) => s === 'good' ? 'In stock' : s === 'low' ? 'LOW' : s === 'order' ? 'TO ORDER' : 'REPAIR'
  const restock = EQUIPMENT_INVENTORY.flatMap(c => c.items.filter(i => effStatus(i.name, i.status) !== 'good').map(i => `<li><strong>${esc(i.name)}</strong> — ${statusTxt(effStatus(i.name, i.status))} <span style="color:#888">(${esc(i.location)})</span></li>`)).join('')
  const cats = EQUIPMENT_INVENTORY.map(c => {
    const rows = c.items.map(i => { const st = effStatus(i.name, i.status); return `<tr><td style="width:18px"><span style="display:inline-block;width:12px;height:12px;border:1.5px solid #9099ad;border-radius:3px"></span></td><td><strong>${esc(i.name)}</strong>${i.note ? `<br><span style="font-size:9px;color:#999">${esc(i.note)}</span>` : ''}</td><td style="text-align:right;white-space:nowrap">${esc(effQty(i.name, i.qty))}</td><td style="white-space:nowrap">${esc(i.location)}</td><td style="white-space:nowrap;text-transform:capitalize;color:${st === 'good' ? '#16a34a' : st === 'order' ? '#2563eb' : '#b45309'}">${statusTxt(st).toLowerCase()}</td></tr>` }).join('')
    return `<div style="break-inside:avoid;margin-bottom:14px"><div style="font-size:13px;font-weight:700;color:#7c3aed;border-bottom:2px solid #ecedf2;padding-bottom:5px;margin-bottom:4px">${esc(c.category)}</div><table style="width:100%;border-collapse:collapse">${rows}</table></div>`
  }).join('')
  const sessions = SESSION_KITS.map(k => {
    const fromPackages = offers.filter(o => PACKAGE_TYPE_TO_KIT[o.type] === k.type).flatMap(o => o.equipment ?? [])
    const edit = kitEdits[k.type] ?? { added: [], removed: [] }
    const seen = new Set<string>()
    const merged = [...k.items, ...fromPackages, ...edit.added].filter(it => { if (edit.removed.includes(it) || seen.has(it)) return false; seen.add(it); return true })
    return `<div style="break-inside:avoid;margin-bottom:10px"><strong>${esc(k.type)}:</strong> ${merged.map(esc).join(' · ')}</div>`
  }).join('')
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Equipment & Kit — ${esc(COACH_ORG.academy)}</title>
  <style>*{box-sizing:border-box}body{margin:0;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1d29;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{width:210mm;min-height:296mm;padding:18mm 16mm;margin:0 auto;position:relative}
  td{font-size:11px;padding:5px 8px;border-bottom:1px solid #f0f1f6;vertical-align:top}
  h2{font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:#7c3aed;margin:18px 0 8px;border-bottom:2px solid #ecedf2;padding-bottom:5px}
  ul{margin:0;padding-left:18px}li{font-size:12px;margin-bottom:3px}
  .foot{position:absolute;bottom:12mm;left:16mm;right:16mm;display:flex;justify-content:space-between;font-size:9px;color:#aab;border-top:1px solid #eee;padding-top:8px}
  @page{size:A4;margin:0}</style></head><body>
  <div class="page">
    <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #a855f7;padding-bottom:10px;margin-bottom:14px">
      <div><div style="font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:#a855f7;font-weight:700">Equipment &amp; Kit Checklist</div>
      <div style="font-size:22px;font-weight:800;margin-top:4px">${esc(COACH_ORG.academy)}</div></div>
      <div style="text-align:right;font-size:11px;color:#6b7280">${esc(COACH_ORG.coach)}<br>${new Date().toLocaleDateString('en-GB')}</div>
    </div>
    ${restock ? `<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:10px 14px;margin-bottom:14px"><strong style="color:#b45309">⚠ Restock / action needed</strong><ul>${restock}</ul></div>` : ''}
    <h2>Session kit checklists</h2>${sessions}
    <h2>Full inventory</h2>
    <div style="columns:2;column-gap:18px">${cats}</div>
    <div class="foot"><span>${esc(COACH_ORG.academy)} · ${esc(COACH_ORG.cert)}</span><span>Checked by ____________________</span></div>
  </div></body></html>`
  const w = window.open('', '_blank', 'width=920,height=1040')
  if (!w) { alert('Please allow pop-ups to print the kit list.'); return }
  w.document.write(html); w.document.close(); w.focus()
  setTimeout(() => { try { w.print() } catch { /* manual */ } }, 350)
}
