'use client'

import { useState } from 'react'
import { ClipboardList } from 'lucide-react'

// Shared Procurement & Contracts — Operations. Accent + profile driven.
// Contract register, renewals calendar + alerts, supplier scorecards, tender
// / RFP pipeline, spend analytics. Demo only.

const G = {
  panel: '#0D1117', panelAlt: '#111318', border: '#1F2937',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280',
  good: '#22C55E', warn: '#F59E0B', bad: '#EF4444', info: '#60A5FA',
}

export type ProcurementProfile = {
  kpis: { label: string; value: string; sub: string; color: string }[]
  contracts: { supplier: string; category: string; value: string; renewal: string; status: 'Active' | 'Renewal due' | 'Out to tender'; owner: string }[]
  renewals: { supplier: string; date: string; value: string; action: string }[]
  scorecards: { supplier: string; service: string; quality: number; price: number; reliability: number; overall: number }[]
  tenders: { name: string; stage: string; value: string; bidders: number; decision: string }[]
}
const stCol = (s: string) => s === 'Active' ? G.good : s === 'Renewal due' ? G.warn : G.info
const stars = (n: number) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n))

export default function ProcurementContractsView({ accent, profile }: { accent: string; profile: ProcurementProfile }) {
  const [tab, setTab] = useState<'contracts' | 'renewals' | 'scorecards' | 'tenders'>('contracts')
  const tabs = [['contracts', 'Contracts'], ['renewals', 'Renewals (90d)'], ['scorecards', 'Supplier scorecards'], ['tenders', 'Tenders / RFP']] as const
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: G.text }}><ClipboardList size={18} style={{ color: accent }} /> Procurement &amp; Contracts</h2>
        <p className="text-sm mt-1" style={{ color: G.text3 }}>Contract register, renewals, supplier performance and the tender pipeline.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {profile.kpis.map(k => (<div key={k.label} className="rounded-xl p-3.5" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}><div className="text-[10px] uppercase tracking-wider" style={{ color: G.text4 }}>{k.label}</div><div className="text-xl font-black mt-1" style={{ color: k.color }}>{k.value}</div><div className="text-[10px] mt-0.5" style={{ color: G.text4 }}>{k.sub}</div></div>))}
      </div>

      <div className="flex gap-1 border-b overflow-x-auto" style={{ borderColor: G.border }}>
        {tabs.map(([id, label]) => (<button key={id} onClick={() => setTab(id)} className="px-4 py-2 text-xs font-semibold -mb-px whitespace-nowrap" style={{ borderBottom: `2px solid ${tab === id ? accent : 'transparent'}`, color: tab === id ? accent : G.text4 }}>{label}</button>))}
      </div>

      {tab === 'contracts' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
          <table className="w-full text-xs"><thead><tr style={{ color: G.text4, borderBottom: `1px solid ${G.border}`, background: 'rgba(17,24,39,0.3)' }}><th className="text-left px-4 py-2.5 font-semibold">Supplier</th><th className="text-left px-4 py-2.5 font-semibold">Category</th><th className="text-right px-4 py-2.5 font-semibold">Value / yr</th><th className="text-left px-4 py-2.5 font-semibold">Renewal</th><th className="text-left px-4 py-2.5 font-semibold">Status</th><th className="text-left px-4 py-2.5 font-semibold">Owner</th></tr></thead>
            <tbody>{profile.contracts.map((c, i) => (<tr key={i} style={{ borderBottom: `1px solid ${G.border}80` }}><td className="px-4 py-2.5 font-medium" style={{ color: G.text2 }}>{c.supplier}</td><td className="px-4 py-2.5" style={{ color: G.text4 }}>{c.category}</td><td className="px-4 py-2.5 text-right" style={{ color: G.text3 }}>{c.value}</td><td className="px-4 py-2.5" style={{ color: G.text3 }}>{c.renewal}</td><td className="px-4 py-2.5"><span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${stCol(c.status)}1f`, color: stCol(c.status) }}>{c.status}</span></td><td className="px-4 py-2.5" style={{ color: G.text4 }}>{c.owner}</td></tr>))}</tbody>
          </table>
        </div>
      )}

      {tab === 'renewals' && (
        <div className="space-y-3">
          <div className="rounded-xl p-3 text-[11px]" style={{ background: `${G.warn}12`, borderLeft: `3px solid ${G.warn}`, color: G.text2 }}>{profile.renewals.length} contracts up for renewal in the next 90 days — review before auto-rollover dates.</div>
          {profile.renewals.map((r, i) => (
            <div key={i} className="rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
              <div><div className="text-sm font-semibold" style={{ color: G.text }}>{r.supplier}</div><div className="text-[11px] mt-0.5" style={{ color: G.text4 }}>Renews {r.date} · {r.value}/yr</div></div>
              <span className="text-[11px] font-bold px-3 py-1.5 rounded-lg" style={{ background: `${accent}1f`, color: accent }}>{r.action}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'scorecards' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
          <table className="w-full text-xs"><thead><tr style={{ color: G.text4, borderBottom: `1px solid ${G.border}` }}><th className="text-left px-4 py-2.5 font-semibold">Supplier</th><th className="text-left px-4 py-2.5 font-semibold">Service</th><th className="text-center px-4 py-2.5 font-semibold">Quality</th><th className="text-center px-4 py-2.5 font-semibold">Price</th><th className="text-center px-4 py-2.5 font-semibold">Reliability</th><th className="text-right px-4 py-2.5 font-semibold">Overall</th></tr></thead>
            <tbody>{profile.scorecards.map((s, i) => (<tr key={i} style={{ borderBottom: `1px solid ${G.border}80` }}><td className="px-4 py-2.5 font-medium" style={{ color: G.text2 }}>{s.supplier}</td><td className="px-4 py-2.5" style={{ color: G.text4 }}>{s.service}</td><td className="px-4 py-2.5 text-center" style={{ color: accent }}>{stars(s.quality)}</td><td className="px-4 py-2.5 text-center" style={{ color: accent }}>{stars(s.price)}</td><td className="px-4 py-2.5 text-center" style={{ color: accent }}>{stars(s.reliability)}</td><td className="px-4 py-2.5 text-right font-bold" style={{ color: s.overall >= 4 ? G.good : G.warn }}>{s.overall.toFixed(1)}</td></tr>))}</tbody>
          </table>
        </div>
      )}

      {tab === 'tenders' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between"><p className="text-xs" style={{ color: G.text4 }}>{profile.tenders.length} live tenders</p><button className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: accent }}>+ New tender</button></div>
          {profile.tenders.map((t, i) => (
            <div key={i} className="rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
              <div><div className="text-sm font-semibold" style={{ color: G.text }}>{t.name}</div><div className="text-[11px] mt-0.5" style={{ color: G.text4 }}>{t.value} · {t.bidders} bidders · decision {t.decision}</div></div>
              <span className="text-[11px] font-bold px-3 py-1.5 rounded-lg" style={{ background: `${G.info}1f`, color: G.info }}>{t.stage}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
