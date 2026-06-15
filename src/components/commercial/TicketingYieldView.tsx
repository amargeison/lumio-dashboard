'use client'

import { Ticket } from 'lucide-react'

// Shared Ticketing & Yield — Commercial. Accent + profile driven.
// Season-ticket renewals funnel, fixture sales + dynamic pricing, price bands,
// access control & secondary. Demo only.

const G = {
  panel: '#0D1117', panelAlt: '#111318', border: '#1F2937',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280',
  good: '#22C55E', warn: '#F59E0B', bad: '#EF4444', info: '#60A5FA',
}

export type TicketingProfile = {
  kpis: { label: string; value: string; sub: string; color: string }[]
  renewals: { label: string; value: string; pct: number; tone: 'good' | 'bad' | 'info' }[]
  fixtures: { fixture: string; sold: number; capacity: number; tier: string; forecast: string }[]
  pricing: { band: string; price: string; sold: number; capacity: number }[]
  access: { label: string; value: string }[]
}
const toneCol = (t: string) => t === 'good' ? G.good : t === 'bad' ? G.bad : G.info

export default function TicketingYieldView({ accent, profile }: { accent: string; profile: TicketingProfile }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: G.text }}><Ticket size={18} style={{ color: accent }} /> Ticketing &amp; Yield</h2>
        <p className="text-sm mt-1" style={{ color: G.text3 }}>Season tickets, matchday sales, dynamic pricing and access control.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {profile.kpis.map(k => (<div key={k.label} className="rounded-xl p-3.5" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}><div className="text-[10px] uppercase tracking-wider" style={{ color: G.text4 }}>{k.label}</div><div className="text-xl font-black mt-1" style={{ color: k.color }}>{k.value}</div><div className="text-[10px] mt-0.5" style={{ color: G.text4 }}>{k.sub}</div></div>))}
      </div>

      <div className="rounded-xl p-5" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
        <h3 className="text-sm font-bold mb-4" style={{ color: G.text }}>Season-ticket renewals</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{profile.renewals.map(r => (
          <div key={r.label} className="rounded-lg p-3" style={{ background: G.panelAlt, border: `1px solid ${G.border}` }}><div className="text-[10px] uppercase tracking-wider" style={{ color: G.text4 }}>{r.label}</div><div className="text-lg font-black mt-1" style={{ color: toneCol(r.tone) }}>{r.value}</div><div className="w-full rounded-full h-1 mt-1.5" style={{ background: G.border }}><div className="h-1 rounded-full" style={{ width: `${r.pct}%`, background: toneCol(r.tone) }} /></div></div>
        ))}</div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
        <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${G.border}` }}><h3 className="text-sm font-bold" style={{ color: G.text }}>Upcoming fixtures — sales &amp; pricing</h3></div>
        <table className="w-full text-xs"><thead><tr style={{ color: G.text4, borderBottom: `1px solid ${G.border}` }}><th className="text-left px-4 py-2.5 font-semibold">Fixture</th><th className="text-left px-4 py-2.5 font-semibold">Sold</th><th className="text-left px-4 py-2.5 font-semibold">Fill</th><th className="text-left px-4 py-2.5 font-semibold">Price tier</th><th className="text-right px-4 py-2.5 font-semibold">Forecast</th></tr></thead>
          <tbody>{profile.fixtures.map((f, i) => { const pct = Math.round((f.sold / f.capacity) * 100); return (
            <tr key={i} style={{ borderBottom: `1px solid ${G.border}80` }}>
              <td className="px-4 py-2.5 font-medium" style={{ color: G.text2 }}>{f.fixture}</td>
              <td className="px-4 py-2.5" style={{ color: G.text3 }}>{f.sold.toLocaleString()} / {f.capacity.toLocaleString()}</td>
              <td className="px-4 py-2.5"><div className="flex items-center gap-2"><div className="rounded-full h-1.5 w-16" style={{ background: G.border }}><div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: pct >= 85 ? G.good : pct >= 60 ? accent : G.warn }} /></div><span style={{ color: G.text4 }}>{pct}%</span></div></td>
              <td className="px-4 py-2.5"><span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: f.tier === 'Premium' ? `${G.good}1f` : f.tier === 'Value' ? `${G.info}1f` : `${G.warn}1f`, color: f.tier === 'Premium' ? G.good : f.tier === 'Value' ? G.info : G.warn }}>{f.tier}</span></td>
              <td className="px-4 py-2.5 text-right font-semibold" style={{ color: accent }}>{f.forecast}</td>
            </tr>
          ) })}</tbody>
        </table>
        <div className="px-5 py-2.5 text-[10px]" style={{ borderTop: `1px solid ${G.border}`, color: G.text4 }}>Dynamic pricing live — tiers auto-adjust on demand, opponent and remaining inventory.</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
          <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${G.border}` }}><h3 className="text-sm font-bold" style={{ color: G.text }}>Price bands</h3></div>
          <table className="w-full text-xs"><tbody>{profile.pricing.map((p, i) => { const pct = Math.round((p.sold / p.capacity) * 100); return (
            <tr key={i} style={{ borderBottom: i < profile.pricing.length - 1 ? `1px solid ${G.border}80` : undefined }}><td className="px-4 py-2.5 font-medium" style={{ color: G.text2 }}>{p.band}</td><td className="px-4 py-2.5" style={{ color: accent }}>{p.price}</td><td className="px-4 py-2.5 text-right" style={{ color: G.text3 }}>{p.sold.toLocaleString()} / {p.capacity.toLocaleString()} ({pct}%)</td></tr>
          ) })}</tbody></table>
        </div>
        <div className="rounded-xl p-5" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: G.text }}>Access &amp; secondary</h3>
          {profile.access.map(a => (<div key={a.label} className="flex items-center justify-between py-1.5" style={{ borderBottom: `1px solid ${G.border}80` }}><span className="text-xs" style={{ color: G.text3 }}>{a.label}</span><span className="text-xs font-bold" style={{ color: G.text }}>{a.value}</span></div>))}
        </div>
      </div>
    </div>
  )
}
