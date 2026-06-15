'use client'

import { Leaf } from 'lucide-react'

// Shared Energy & Sustainability (ESG) — Facilities. Accent + profile driven.
// Utilities consumption, carbon footprint, net-zero roadmap, ESG scorecard.

const G = {
  panel: '#0D1117', panelAlt: '#111318', border: '#1F2937',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280',
  good: '#22C55E', warn: '#F59E0B', bad: '#EF4444',
}

export type EnergyProfile = {
  kpis: { label: string; value: string; sub: string; color: string }[]
  utilities: { name: string; usage: string; cost: string; yoy: number }[]
  carbon: { source: string; tco2e: number }[]
  carbonTrend: { year: string; tco2e: number }[]
  roadmap: { year: string; milestone: string; status: 'Done' | 'In progress' | 'Planned' }[]
  initiatives: { name: string; status: 'Done' | 'In progress' | 'Planned'; impact: string }[]
  esg: { env: number; social: number; gov: number }
}

const stCol = (s: string) => s === 'Done' ? G.good : s === 'In progress' ? G.warn : G.text4

export default function EnergySustainabilityView({ accent, profile }: { accent: string; profile: EnergyProfile }) {
  const maxCarbon = Math.max(...profile.carbon.map(c => c.tco2e))
  const totalCarbon = profile.carbon.reduce((s, c) => s + c.tco2e, 0)
  const tMax = Math.max(...profile.carbonTrend.map(t => t.tco2e))
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: G.text }}><Leaf size={18} style={{ color: accent }} /> Energy &amp; Sustainability</h2>
        <p className="text-sm mt-1" style={{ color: G.text3 }}>Utilities, carbon footprint, net-zero roadmap and the club&apos;s ESG scorecard.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {profile.kpis.map(k => (
          <div key={k.label} className="rounded-xl p-3.5" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}><div className="text-[10px] uppercase tracking-wider" style={{ color: G.text4 }}>{k.label}</div><div className="text-xl font-black mt-1" style={{ color: k.color }}>{k.value}</div><div className="text-[10px] mt-0.5" style={{ color: G.text4 }}>{k.sub}</div></div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
          <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${G.border}` }}><h3 className="text-sm font-bold" style={{ color: G.text }}>Utility consumption</h3></div>
          <table className="w-full text-xs"><thead><tr style={{ color: G.text4, borderBottom: `1px solid ${G.border}` }}><th className="text-left px-4 py-2.5 font-semibold">Utility</th><th className="text-right px-4 py-2.5 font-semibold">Usage</th><th className="text-right px-4 py-2.5 font-semibold">Annual cost</th><th className="text-right px-4 py-2.5 font-semibold">YoY</th></tr></thead>
            <tbody>{profile.utilities.map((u, i) => (<tr key={i} style={{ borderBottom: `1px solid ${G.border}80` }}><td className="px-4 py-2.5 font-medium" style={{ color: G.text2 }}>{u.name}</td><td className="px-4 py-2.5 text-right" style={{ color: G.text3 }}>{u.usage}</td><td className="px-4 py-2.5 text-right" style={{ color: G.text3 }}>{u.cost}</td><td className="px-4 py-2.5 text-right font-semibold" style={{ color: u.yoy <= 0 ? G.good : G.bad }}>{u.yoy > 0 ? '+' : ''}{u.yoy}%</td></tr>))}</tbody>
          </table>
        </div>
        <div className="rounded-xl p-5" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
          <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-bold" style={{ color: G.text }}>Carbon footprint</h3><span className="text-[11px]" style={{ color: G.text4 }}>{totalCarbon.toLocaleString()} tCO₂e / yr</span></div>
          <div className="space-y-2.5">{profile.carbon.map(c => (<div key={c.source}><div className="flex justify-between text-xs mb-1"><span style={{ color: G.text3 }}>{c.source}</span><span className="font-bold" style={{ color: G.text }}>{c.tco2e.toLocaleString()}</span></div><div className="w-full rounded-full h-1.5" style={{ background: G.border }}><div className="h-1.5 rounded-full" style={{ width: `${(c.tco2e / maxCarbon) * 100}%`, background: accent }} /></div></div>))}</div>
          <div className="flex items-end gap-1.5 mt-4" style={{ height: 50 }}>{profile.carbonTrend.map((t, i) => (<div key={i} className="flex-1 flex flex-col items-center justify-end gap-1" title={`${t.year}: ${t.tco2e}`}><div className="w-full rounded-t" style={{ height: `${(t.tco2e / tMax) * 100}%`, background: i === profile.carbonTrend.length - 1 ? G.good : G.text4 }} /><span className="text-[8px]" style={{ color: G.text4 }}>{t.year}</span></div>))}</div>
          <p className="text-[10px] mt-1" style={{ color: G.text4 }}>Emissions falling year on year.</p>
        </div>
      </div>

      <div className="rounded-xl p-5" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
        <h3 className="text-sm font-bold mb-4" style={{ color: G.text }}>Net-zero roadmap</h3>
        <div className="space-y-0">{profile.roadmap.map((r, i) => (
          <div key={i} className="flex items-start gap-3 pb-4 last:pb-0 relative">
            <div className="flex flex-col items-center"><div className="w-3 h-3 rounded-full mt-0.5 z-10" style={{ background: stCol(r.status), border: `2px solid ${G.panel}` }} />{i < profile.roadmap.length - 1 && <div className="w-px flex-1" style={{ background: G.border, minHeight: 24 }} />}</div>
            <div className="flex-1 -mt-0.5"><div className="flex items-center gap-2"><span className="text-xs font-bold" style={{ color: accent }}>{r.year}</span><span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: `${stCol(r.status)}1f`, color: stCol(r.status) }}>{r.status}</span></div><div className="text-xs mt-0.5" style={{ color: G.text2 }}>{r.milestone}</div></div>
          </div>
        ))}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl overflow-hidden" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
          <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${G.border}` }}><h3 className="text-sm font-bold" style={{ color: G.text }}>Sustainability initiatives</h3></div>
          <table className="w-full text-xs"><tbody>{profile.initiatives.map((it, i) => (<tr key={i} style={{ borderBottom: i < profile.initiatives.length - 1 ? `1px solid ${G.border}80` : undefined }}><td className="px-4 py-2.5 font-medium" style={{ color: G.text2 }}>{it.name}</td><td className="px-4 py-2.5 text-xs" style={{ color: G.text4 }}>{it.impact}</td><td className="px-4 py-2.5 text-right"><span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${stCol(it.status)}1f`, color: stCol(it.status) }}>{it.status}</span></td></tr>))}</tbody></table>
        </div>
        <div className="rounded-xl p-5" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: G.text }}>ESG scorecard</h3>
          {[['Environmental', profile.esg.env], ['Social', profile.esg.social], ['Governance', profile.esg.gov]].map(([l, v]) => (
            <div key={l as string} className="mb-3"><div className="flex justify-between text-xs mb-1"><span style={{ color: G.text3 }}>{l}</span><span className="font-bold" style={{ color: G.text }}>{v}/100</span></div><div className="w-full rounded-full h-2" style={{ background: G.border }}><div className="h-2 rounded-full" style={{ width: `${v}%`, background: (v as number) >= 75 ? G.good : G.warn }} /></div></div>
          ))}
          <p className="text-[10px] mt-3" style={{ color: G.text4 }}>Benchmarked against league sustainability standards. Reported to the board quarterly.</p>
        </div>
      </div>
    </div>
  )
}
