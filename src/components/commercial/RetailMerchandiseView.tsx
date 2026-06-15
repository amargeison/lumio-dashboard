'use client'

import { ShoppingBag } from 'lucide-react'

// Shared Retail & Merchandise — Commercial. Accent + profile driven.
// Channel performance, top SKUs, stock/inventory, kit-launch performance.

const G = {
  panel: '#0D1117', panelAlt: '#111318', border: '#1F2937',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280',
  good: '#22C55E', warn: '#F59E0B', bad: '#EF4444',
}

export type RetailProfile = {
  kpis: { label: string; value: string; sub: string; color: string }[]
  channels: { name: string; revenue: string; pct: number; trend: string }[]
  topSkus: { product: string; units: string; revenue: string; margin: number; stock: 'In stock' | 'Low' | 'Out' }[]
  stock: { label: string; value: string }[]
  kitLaunch: { label: string; value: string }[]
}
const stockCol = (s: string) => s === 'In stock' ? G.good : s === 'Low' ? G.warn : G.bad

export default function RetailMerchandiseView({ accent, profile }: { accent: string; profile: RetailProfile }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: G.text }}><ShoppingBag size={18} style={{ color: accent }} /> Retail &amp; Merchandise</h2>
        <p className="text-sm mt-1" style={{ color: G.text3 }}>Store performance across online and matchday — sales, top sellers, stock and kit launches.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {profile.kpis.map(k => (<div key={k.label} className="rounded-xl p-3.5" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}><div className="text-[10px] uppercase tracking-wider" style={{ color: G.text4 }}>{k.label}</div><div className="text-xl font-black mt-1" style={{ color: k.color }}>{k.value}</div><div className="text-[10px] mt-0.5" style={{ color: G.text4 }}>{k.sub}</div></div>))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {profile.channels.map(c => (
          <div key={c.name} className="rounded-xl p-4" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
            <div className="flex items-center justify-between mb-2"><span className="text-xs font-semibold" style={{ color: G.text2 }}>{c.name}</span><span className="text-[10px] font-bold" style={{ color: G.good }}>{c.trend}</span></div>
            <div className="text-xl font-black" style={{ color: G.text }}>{c.revenue}</div>
            <div className="w-full rounded-full h-1.5 mt-2" style={{ background: G.border }}><div className="h-1.5 rounded-full" style={{ width: `${c.pct}%`, background: accent }} /></div>
            <div className="text-[10px] mt-1" style={{ color: G.text4 }}>{c.pct}% of retail revenue</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
        <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${G.border}` }}><h3 className="text-sm font-bold" style={{ color: G.text }}>Top sellers</h3></div>
        <table className="w-full text-xs"><thead><tr style={{ color: G.text4, borderBottom: `1px solid ${G.border}` }}><th className="text-left px-4 py-2.5 font-semibold">Product</th><th className="text-right px-4 py-2.5 font-semibold">Units</th><th className="text-right px-4 py-2.5 font-semibold">Revenue</th><th className="text-right px-4 py-2.5 font-semibold">Margin</th><th className="text-left px-4 py-2.5 font-semibold">Stock</th></tr></thead>
          <tbody>{profile.topSkus.map((s, i) => (<tr key={i} style={{ borderBottom: `1px solid ${G.border}80` }}><td className="px-4 py-2.5 font-medium" style={{ color: G.text2 }}>{s.product}</td><td className="px-4 py-2.5 text-right" style={{ color: G.text3 }}>{s.units}</td><td className="px-4 py-2.5 text-right font-semibold" style={{ color: accent }}>{s.revenue}</td><td className="px-4 py-2.5 text-right" style={{ color: G.text3 }}>{s.margin}%</td><td className="px-4 py-2.5"><span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${stockCol(s.stock)}1f`, color: stockCol(s.stock) }}>{s.stock}</span></td></tr>))}</tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: G.text }}>Stock &amp; inventory</h3>
          {profile.stock.map(s => (<div key={s.label} className="flex items-center justify-between py-1.5" style={{ borderBottom: `1px solid ${G.border}80` }}><span className="text-xs" style={{ color: G.text3 }}>{s.label}</span><span className="text-xs font-bold" style={{ color: G.text }}>{s.value}</span></div>))}
        </div>
        <div className="rounded-xl p-5" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: G.text }}>Latest kit launch</h3>
          {profile.kitLaunch.map(s => (<div key={s.label} className="flex items-center justify-between py-1.5" style={{ borderBottom: `1px solid ${G.border}80` }}><span className="text-xs" style={{ color: G.text3 }}>{s.label}</span><span className="text-xs font-bold" style={{ color: s.value.startsWith('+') ? G.good : G.text }}>{s.value}</span></div>))}
        </div>
      </div>
    </div>
  )
}
