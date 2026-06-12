'use client'

import { useState, type CSSProperties, type ReactNode } from 'react'
import type { ThemeTokens, AccentTokens, Density } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT, FONT_MONO } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { EQUIPMENT_INVENTORY, SESSION_KITS, COACH_ORG, type KitStatus } from '../_lib/coach-data'
import { RestockSourcingModal } from './RestockSourcing'

type Common = { T: ThemeTokens; accent: AccentTokens; density: Density }

function Card({ T, density, children, style }: { T: ThemeTokens; density: Density; children: ReactNode; style?: CSSProperties }) {
  return <div style={{ position: 'relative', background: T.panel, border: `1px solid ${T.border}`, borderRadius: density.radius, padding: density.pad, boxShadow: T.cardShadow, ...style }}>{children}</div>
}
function SectionHead({ T, title, right }: { T: ThemeTokens; title: ReactNode; right?: ReactNode }) {
  return <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 10, gap: 8 }}><div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{title}</div><div style={{ marginLeft: 'auto', fontSize: 11, color: T.text3 }}>{right}</div></div>
}

export function EquipmentView({ T, accent, density }: Common) {
  const [handled, setHandled] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<'all' | 'attention'>('all')
  const [sourceOpen, setSourceOpen] = useState(false)

  const tone = (s: KitStatus) => s === 'good' ? T.good : s === 'low' ? T.warn : s === 'order' ? '#3A8EE0' : T.bad
  const label = (s: KitStatus) => s === 'good' ? 'In stock' : s === 'low' ? 'Running low' : s === 'order' ? 'To order' : 'Repair'

  const allItems = EQUIPMENT_INVENTORY.flatMap(c => c.items.map(it => ({ ...it, category: c.category })))
  const attention = allItems.filter(i => i.status !== 'good')
  const outstanding = attention.filter(i => !handled.has(i.name))
  const toggle = (name: string) => setHandled(prev => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n })

  const cats = filter === 'attention'
    ? EQUIPMENT_INVENTORY.map(c => ({ ...c, items: c.items.filter(i => i.status !== 'good') })).filter(c => c.items.length)
    : EQUIPMENT_INVENTORY

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: FONT, fontSize: 24, fontWeight: 600, color: T.text, letterSpacing: '-0.02em' }}>Equipment &amp; Kit</h1>
          <p style={{ margin: '4px 0 0', fontSize: 12.5, color: T.text3 }}>Everything you need on court — track stock, flag what&apos;s running low, and grab the right kit for every session.</p>
        </div>
        <button onClick={() => openKitList()} style={{ marginLeft: 'auto', appearance: 'none', border: 0, padding: '8px 14px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 12.5, fontWeight: 600, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <Icon name="note" size={14} stroke={2} /> Print kit list
        </button>
      </div>

      {/* summary */}
      <div style={{ display: 'flex', gap: density.gap, marginBottom: density.gap, flexWrap: 'wrap' }}>
        {[
          { l: 'Items tracked', v: allItems.length, c: T.text },
          { l: 'In stock', v: allItems.filter(i => i.status === 'good').length, c: T.good },
          { l: 'Need attention', v: outstanding.length, c: outstanding.length ? T.warn : T.good },
          { l: 'On order', v: allItems.filter(i => i.status === 'order').length, c: '#3A8EE0' },
        ].map((m, i) => (
          <Card key={i} T={T} density={density} style={{ flex: '1 1 140px' }}>
            <div style={{ fontSize: 10.5, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m.l}</div>
            <div className="tnum" style={{ fontSize: 24, fontWeight: 500, color: m.c, marginTop: 4 }}>{m.v}</div>
          </Card>
        ))}
      </div>

      {/* restock / needs attention */}
      <Card T={T} density={density} style={{ marginBottom: density.gap, borderColor: outstanding.length ? `${T.warn}55` : T.border }}>
        <SectionHead T={T} title={<><Icon name="bell" size={13} stroke={1.7} style={{ color: T.warn, marginRight: 6, verticalAlign: -2 }} />Restock list — never miss anything</>}
          right={<span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>{outstanding.length} to sort</span>
            {attention.length > 0 && <button onClick={() => setSourceOpen(true)} style={{ appearance: 'none', border: 0, padding: '6px 12px', borderRadius: 8, background: accent.hex, color: T.btnText, fontSize: 11.5, fontWeight: 600, fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}><Icon name="sparkles" size={12} stroke={1.7} /> Source cheapest</button>}
          </span>} />
        {attention.length === 0 ? (
          <div style={{ fontSize: 12.5, color: T.text3 }}>All kit in stock — you&apos;re good to go.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
            {attention.map(it => {
              const done = handled.has(it.name)
              return (
                <button key={it.name} onClick={() => toggle(it.name)}
                  style={{ appearance: 'none', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 9, border: `1px solid ${done ? T.border : `${tone(it.status)}44`}`, background: done ? 'transparent' : `${tone(it.status)}10`, cursor: 'pointer', opacity: done ? 0.55 : 1 }}>
                  <div style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${done ? T.good : tone(it.status)}`, background: done ? T.good : 'transparent', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    {done && <Icon name="check" size={12} stroke={2.4} style={{ color: '#fff' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, color: T.text, fontWeight: 600, textDecoration: done ? 'line-through' : 'none' }}>{it.name}</div>
                    <div style={{ fontSize: 10.5, color: T.text3 }}>{it.category} · {it.location}{it.note ? ` · ${it.note}` : ''}</div>
                  </div>
                  <span style={{ fontSize: 9, fontFamily: FONT_MONO, fontWeight: 700, color: tone(it.status), textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{label(it.status)}</span>
                </button>
              )
            })}
          </div>
        )}
      </Card>

      {/* session kit checklists */}
      <SectionHead T={T} title="Kit for each session type" right="grab-and-go checklists" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: density.gap, marginBottom: density.gap }}>
        {SESSION_KITS.map(k => (
          <Card key={k.type} T={T} density={density}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center', background: accent.dim }}><Icon name={k.icon} size={15} stroke={1.7} style={{ color: accent.hex }} /></div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{k.type}</div>
            </div>
            {k.items.map((it, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: T.text2, padding: '3px 0' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: accent.hex, flexShrink: 0 }} />{it}
              </div>
            ))}
          </Card>
        ))}
      </div>

      {/* full inventory */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Inventory</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 0, padding: 2, background: T.hover, borderRadius: 8 }}>
          {([['all', 'All'], ['attention', 'Needs attention']] as const).map(([id, lbl]) => (
            <button key={id} onClick={() => setFilter(id)} style={{ appearance: 'none', border: 0, padding: '5px 12px', borderRadius: 6, fontSize: 11.5, cursor: 'pointer', background: filter === id ? T.panel : 'transparent', color: filter === id ? T.text : T.text2, fontWeight: filter === id ? 600 : 400, boxShadow: filter === id ? `0 0 0 1px ${T.border}` : 'none' }}>{lbl}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: density.gap }} className="cm-eq">
        {cats.map(cat => (
          <Card key={cat.category} T={T} density={density}>
            <SectionHead T={T} title={<><Icon name={cat.icon} size={13} stroke={1.7} style={{ color: accent.hex, marginRight: 6, verticalAlign: -2 }} />{cat.category}</>} right={`${cat.items.length}`} />
            {cat.items.map((it, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderTop: i ? `1px solid ${T.border}` : 'none' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: tone(it.status), flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: T.text }}>{it.name}</div>
                  <div style={{ fontSize: 10, color: T.text3 }}>{it.location}{it.note ? ` · ${it.note}` : ''}</div>
                </div>
                <span className="tnum" style={{ fontSize: 11, color: T.text2, fontFamily: FONT_MONO }}>{it.qty}</span>
                <span style={{ fontSize: 8.5, fontFamily: FONT_MONO, fontWeight: 700, color: tone(it.status), textTransform: 'uppercase', letterSpacing: '0.04em', padding: '2px 6px', borderRadius: 4, background: `${tone(it.status)}1a`, whiteSpace: 'nowrap' }}>{label(it.status)}</span>
              </div>
            ))}
          </Card>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap', fontSize: 10.5, color: T.text3 }}>
        {(['good', 'low', 'order', 'repair'] as KitStatus[]).map(s => (
          <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: tone(s) }} />{label(s)}</span>
        ))}
      </div>

      {sourceOpen && <RestockSourcingModal T={T} accent={accent} items={attention.map(i => ({ name: i.name, qty: i.qty, category: i.category }))} onClose={() => setSourceOpen(false)} />}
    </div>
  )
}

// ─── print ───────────────────────────────────────────────────────────────────
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
function openKitList() {
  if (typeof window === 'undefined') return
  const statusTxt = (s: KitStatus) => s === 'good' ? 'In stock' : s === 'low' ? 'LOW' : s === 'order' ? 'TO ORDER' : 'REPAIR'
  const restock = EQUIPMENT_INVENTORY.flatMap(c => c.items.filter(i => i.status !== 'good').map(i => `<li><strong>${esc(i.name)}</strong> — ${statusTxt(i.status)} <span style="color:#888">(${esc(i.location)})</span></li>`)).join('')
  const cats = EQUIPMENT_INVENTORY.map(c => {
    const rows = c.items.map(i => `<tr><td style="width:18px"><span style="display:inline-block;width:12px;height:12px;border:1.5px solid #9099ad;border-radius:3px"></span></td><td><strong>${esc(i.name)}</strong>${i.note ? `<br><span style="font-size:9px;color:#999">${esc(i.note)}</span>` : ''}</td><td style="text-align:right;white-space:nowrap">${esc(i.qty)}</td><td style="white-space:nowrap">${esc(i.location)}</td><td style="white-space:nowrap;text-transform:capitalize;color:${i.status === 'good' ? '#16a34a' : i.status === 'order' ? '#2563eb' : '#b45309'}">${statusTxt(i.status).toLowerCase()}</td></tr>`).join('')
    return `<div style="break-inside:avoid;margin-bottom:14px"><div style="font-size:13px;font-weight:700;color:#7c3aed;border-bottom:2px solid #ecedf2;padding-bottom:5px;margin-bottom:4px">${esc(c.category)}</div><table style="width:100%;border-collapse:collapse">${rows}</table></div>`
  }).join('')
  const sessions = SESSION_KITS.map(k => `<div style="break-inside:avoid;margin-bottom:10px"><strong>${esc(k.type)}:</strong> ${k.items.map(esc).join(' · ')}</div>`).join('')
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
