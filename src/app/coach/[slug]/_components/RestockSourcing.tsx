'use client'

// Smart Sourcing — for the restock list, compares suppliers for each flagged
// item, picks the cheapest, shows the saving, and prints a grouped purchase
// order. Suppliers are fictional (Lumio brand universe); prices are indicative.

import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { FONT, FONT_MONO } from '@/app/cricket/[slug]/v2/_lib/theme'
import { Icon } from '@/app/cricket/[slug]/v2/_components/Icon'
import { COACH_ORG } from '../_lib/coach-data'

export type SrcItem = { name: string; qty: string; category: string }

const SUPPLIERS = [
  { name: 'Apex Court Supplies',   factor: 0.91, note: 'Trade account · free delivery over £75' },
  { name: 'Crown Racquet & Co',    factor: 0.97, note: 'Bulk discounts on balls' },
  { name: 'Meridian Sports Trade', factor: 1.00, note: 'Next-day delivery' },
  { name: 'Baseline Wholesale',    factor: 1.12, note: 'Premium stock' },
]

// indicative cost to bring an item back to full stock
const COSTS: Record<string, number> = {
  'Green (transition) balls': 56, 'Ball tubes (pickup)': 30, 'Hand targets / hoops': 18,
  'Portable mini-nets': 120, 'Line tape': 24, 'Spare batteries': 22, 'Sunscreen SPF50': 16,
  'Electrolyte sachets': 20, 'Reward stickers (juniors)': 12, 'String reels': 90,
}
const hash = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 997; return h }
const baseCost = (name: string) => COSTS[name] ?? 25
function quote(name: string, supplierIdx: number) {
  const f = SUPPLIERS[supplierIdx].factor
  const variance = 0.94 + ((hash(name) + supplierIdx * 5) % 13) / 100
  return Math.round(baseCost(name) * f * variance)
}

type Row = { item: SrcItem; quotes: number[]; bestIdx: number; best: number; typical: number }
function build(items: SrcItem[]): Row[] {
  return items.map(item => {
    const quotes = SUPPLIERS.map((_s, i) => quote(item.name, i))
    let bestIdx = 0
    quotes.forEach((q, i) => { if (q < quotes[bestIdx]) bestIdx = i })
    const typical = quotes[2] // Meridian = list/typical
    return { item, quotes, bestIdx, best: quotes[bestIdx], typical }
  })
}

export function RestockSourcingModal({ T, accent, items, onClose }: { T: ThemeTokens; accent: AccentTokens; items: SrcItem[]; onClose: () => void }) {
  const rows = build(items)
  const basket = rows.reduce((s, r) => s + r.best, 0)
  const typical = rows.reduce((s, r) => s + r.typical, 0)
  const saving = Math.max(typical - basket, 0)
  const usedSuppliers = Array.from(new Set(rows.map(r => SUPPLIERS[r.bestIdx].name)))

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.84)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '5vh 16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 760, background: T.panel, border: `1px solid ${T.borderHi}`, borderRadius: 16, boxShadow: '0 30px 80px -20px rgba(0,0,0,0.7)' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: `1px solid ${T.border}` }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center', background: accent.dim }}><Icon name="sparkles" size={16} stroke={1.6} style={{ color: accent.hex }} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Smart sourcing</div>
            <div style={{ fontSize: 11.5, color: T.text3 }}>Cheapest restock matched across {SUPPLIERS.length} suppliers</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text3, cursor: 'pointer', width: 30, height: 30, fontSize: 16 }}>✕</button>
        </div>

        {/* summary */}
        <div style={{ margin: 18, padding: '16px 18px', borderRadius: 12, background: `linear-gradient(120deg, ${accent.dim}, transparent)`, border: `1px solid ${accent.border}`, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 10, color: accent.hex, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Best basket</div>
            <div className="tnum" style={{ fontSize: 30, fontWeight: 700, color: T.text }}>£{basket}</div>
          </div>
          <div style={{ width: 1, height: 36, background: T.border }} />
          <div>
            <div style={{ fontSize: 11, color: T.text3 }}>Saves vs buying at list</div>
            <div className="tnum" style={{ fontSize: 18, fontWeight: 700, color: T.good }}>−£{saving}</div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 11.5, color: T.text2, maxWidth: 240, lineHeight: 1.5 }}>
            <Icon name="sparkles" size={12} stroke={1.6} style={{ color: accent.hex, verticalAlign: -1, marginRight: 4 }} />
            Lumio compared {rows.length} items across {SUPPLIERS.length} suppliers and picked the cheapest for each — spread over {usedSuppliers.length} orders.
          </div>
        </div>

        {/* rows */}
        <div style={{ padding: '0 18px 4px', maxHeight: '46vh', overflowY: 'auto' }}>
          {rows.map((r, ri) => (
            <div key={ri} style={{ padding: '11px 0', borderTop: ri ? `1px solid ${T.border}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 7 }}>
                <span style={{ fontSize: 12.5, color: T.text, fontWeight: 600 }}>{r.item.name}</span>
                <span style={{ fontSize: 10.5, color: T.text3 }}>{r.item.qty} · {r.item.category}</span>
                <span className="tnum" style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 700, color: T.good, fontFamily: FONT_MONO }}>£{r.best}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {SUPPLIERS.map((s, si) => {
                  const best = si === r.bestIdx
                  return (
                    <div key={si} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 9px', borderRadius: 8, border: `1px solid ${best ? T.good : T.border}`, background: best ? `${T.good}14` : 'transparent' }}>
                      <span style={{ fontSize: 10.5, color: best ? T.text : T.text3 }}>{s.name.split(' ')[0]}</span>
                      <span className="tnum" style={{ fontSize: 11, fontWeight: 600, color: best ? T.good : T.text2, fontFamily: FONT_MONO }}>£{r.quotes[si]}</span>
                      {best && <span style={{ fontSize: 8, fontWeight: 700, color: T.good, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Best</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderTop: `1px solid ${T.border}`, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11.5, color: T.text3 }}>Indicative prices · {usedSuppliers.length} suppliers in this basket</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button onClick={() => printPO(rows)} style={{ appearance: 'none', padding: '9px 14px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
              <Icon name="note" size={13} stroke={1.8} /> Print purchase order
            </button>
            <button onClick={onClose} style={{ appearance: 'none', border: 0, padding: '9px 16px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 12.5, fontWeight: 600, fontFamily: FONT, cursor: 'pointer' }}>Done</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── print: purchase order grouped by cheapest supplier ───────────────────────
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
function printPO(rows: Row[]) {
  if (typeof window === 'undefined') return
  const bySupplier = new Map<string, { items: Row[]; total: number; note: string }>()
  rows.forEach(r => {
    const s = SUPPLIERS[r.bestIdx]
    const cur = bySupplier.get(s.name) ?? { items: [], total: 0, note: s.note }
    cur.items.push(r); cur.total += r.best; bySupplier.set(s.name, cur)
  })
  const grand = rows.reduce((s, r) => s + r.best, 0)
  const blocks = Array.from(bySupplier.entries()).map(([name, g]) => `
    <div style="break-inside:avoid;margin-bottom:16px;border:1px solid #ecedf2;border-radius:10px;padding:12px 16px">
      <div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:2px solid #ecedf2;padding-bottom:6px;margin-bottom:6px">
        <div><strong style="color:#7c3aed;font-size:14px">${esc(name)}</strong> <span style="font-size:10px;color:#999">${esc(g.note)}</span></div>
        <strong style="font-size:14px">£${g.total}</strong>
      </div>
      <table style="width:100%;border-collapse:collapse">
        ${g.items.map(r => `<tr><td style="width:18px;padding:5px 0"><span style="display:inline-block;width:12px;height:12px;border:1.5px solid #9099ad;border-radius:3px"></span></td><td style="padding:5px 0;font-size:12px"><strong>${esc(r.item.name)}</strong> <span style="color:#888;font-size:10px">${esc(r.item.qty)}</span></td><td style="text-align:right;padding:5px 0;font-size:12px">£${r.best}</td></tr>`).join('')}
      </table>
    </div>`).join('')
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Purchase order — ${esc(COACH_ORG.academy)}</title>
  <style>*{box-sizing:border-box}body{margin:0;font-family:'Helvetica Neue',Arial,sans-serif;color:#1a1d29;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{width:210mm;min-height:296mm;padding:18mm 16mm;margin:0 auto;position:relative}
  .foot{position:absolute;bottom:12mm;left:16mm;right:16mm;display:flex;justify-content:space-between;font-size:9px;color:#aab;border-top:1px solid #eee;padding-top:8px}
  @page{size:A4;margin:0}</style></head><body>
  <div class="page">
    <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #a855f7;padding-bottom:10px;margin-bottom:14px">
      <div><div style="font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:#a855f7;font-weight:700">Restock Purchase Order</div>
      <div style="font-size:22px;font-weight:800;margin-top:4px">${esc(COACH_ORG.academy)}</div></div>
      <div style="text-align:right;font-size:11px;color:#6b7280">${esc(COACH_ORG.coach)}<br>${new Date().toLocaleDateString('en-GB')}</div>
    </div>
    <div style="background:#f7f4ff;border:1px solid #ead9ff;border-radius:8px;padding:10px 14px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:12px;color:#374151">Cheapest basket across suppliers — order each block from the named supplier.</span>
      <strong style="font-size:18px">Total £${grand}</strong>
    </div>
    ${blocks}
    <div class="foot"><span>${esc(COACH_ORG.academy)} · Indicative prices — confirm at checkout</span><span>Lumio Smart Sourcing</span></div>
  </div></body></html>`
  const w = window.open('', '_blank', 'width=920,height=1040')
  if (!w) { alert('Please allow pop-ups to print the purchase order.'); return }
  w.document.write(html); w.document.close(); w.focus()
  setTimeout(() => { try { w.print() } catch { /* manual */ } }, 350)
}
