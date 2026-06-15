'use client'

import { useState } from 'react'
import { Wrench } from 'lucide-react'

// Shared Asset Register / CMMS — Facilities. Accent + profile driven.
// Asset register, work orders (raise/track), planned preventive maintenance,
// asset value by category. Demo only.

const G = {
  panel: '#0D1117', panelAlt: '#111318', border: '#1F2937',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280',
  good: '#22C55E', warn: '#F59E0B', bad: '#EF4444', info: '#60A5FA',
}

export type AssetProfile = {
  kpis: { label: string; value: string; sub: string; color: string }[]
  assets: { name: string; category: string; condition: 'Good' | 'Fair' | 'Poor'; warranty: string; nextService: string; status: string }[]
  workOrders: { ref: string; asset: string; priority: 'High' | 'Medium' | 'Low'; assignee: string; due: string; status: 'Open' | 'In progress' }[]
  ppm: { task: string; frequency: string; nextDue: string; compliance: number }[]
  value: { category: string; nbv: string; pct: number }[]
}
const condCol = (c: string) => c === 'Good' ? G.good : c === 'Fair' ? G.warn : G.bad
const priCol = (p: string) => p === 'High' ? G.bad : p === 'Medium' ? G.warn : G.text4

export default function AssetRegisterView({ accent, profile }: { accent: string; profile: AssetProfile }) {
  const [tab, setTab] = useState<'register' | 'workorders' | 'ppm'>('register')
  const tabs = [['register', 'Asset register'], ['workorders', 'Work orders'], ['ppm', 'Planned maintenance']] as const
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: G.text }}><Wrench size={18} style={{ color: accent }} /> Asset Register</h2>
        <p className="text-sm mt-1" style={{ color: G.text3 }}>Asset lifecycle, work orders and planned preventive maintenance (CMMS).</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {profile.kpis.map(k => (<div key={k.label} className="rounded-xl p-3.5" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}><div className="text-[10px] uppercase tracking-wider" style={{ color: G.text4 }}>{k.label}</div><div className="text-xl font-black mt-1" style={{ color: k.color }}>{k.value}</div><div className="text-[10px] mt-0.5" style={{ color: G.text4 }}>{k.sub}</div></div>))}
      </div>

      <div className="flex gap-1 border-b" style={{ borderColor: G.border }}>
        {tabs.map(([id, label]) => (<button key={id} onClick={() => setTab(id)} className="px-4 py-2 text-xs font-semibold -mb-px" style={{ borderBottom: `2px solid ${tab === id ? accent : 'transparent'}`, color: tab === id ? accent : G.text4 }}>{label}</button>))}
      </div>

      {tab === 'register' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
          <table className="w-full text-xs"><thead><tr style={{ color: G.text4, borderBottom: `1px solid ${G.border}`, background: 'rgba(17,24,39,0.3)' }}><th className="text-left px-4 py-2.5 font-semibold">Asset</th><th className="text-left px-4 py-2.5 font-semibold">Category</th><th className="text-left px-4 py-2.5 font-semibold">Condition</th><th className="text-left px-4 py-2.5 font-semibold">Warranty to</th><th className="text-left px-4 py-2.5 font-semibold">Next service</th><th className="text-left px-4 py-2.5 font-semibold">Status</th></tr></thead>
            <tbody>{profile.assets.map((a, i) => (<tr key={i} style={{ borderBottom: `1px solid ${G.border}80` }}><td className="px-4 py-2.5 font-medium" style={{ color: G.text2 }}>{a.name}</td><td className="px-4 py-2.5" style={{ color: G.text4 }}>{a.category}</td><td className="px-4 py-2.5"><span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${condCol(a.condition)}1f`, color: condCol(a.condition) }}>{a.condition}</span></td><td className="px-4 py-2.5" style={{ color: G.text3 }}>{a.warranty}</td><td className="px-4 py-2.5" style={{ color: G.text3 }}>{a.nextService}</td><td className="px-4 py-2.5" style={{ color: a.status === 'OK' ? G.good : G.warn }}>{a.status}</td></tr>))}</tbody>
          </table>
        </div>
      )}

      {tab === 'workorders' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between"><p className="text-xs" style={{ color: G.text4 }}>{profile.workOrders.length} open work orders</p><button className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: accent }}>+ Raise work order</button></div>
          {profile.workOrders.map((w, i) => (
            <div key={i} className="rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
              <div className="min-w-0"><div className="flex items-center gap-2"><span className="text-xs font-bold" style={{ color: accent }}>{w.ref}</span><span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${priCol(w.priority)}1f`, color: priCol(w.priority) }}>{w.priority}</span><span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: G.border, color: G.text4 }}>{w.status}</span></div><div className="text-sm font-semibold mt-1" style={{ color: G.text }}>{w.asset}</div></div>
              <div className="text-right text-[11px]" style={{ color: G.text4 }}><div>Assigned: <span style={{ color: G.text3 }}>{w.assignee}</span></div><div>Due: <span style={{ color: G.text3 }}>{w.due}</span></div></div>
            </div>
          ))}
        </div>
      )}

      {tab === 'ppm' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
          <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${G.border}` }}><h3 className="text-sm font-bold" style={{ color: G.text }}>Planned preventive maintenance</h3></div>
          <table className="w-full text-xs"><thead><tr style={{ color: G.text4, borderBottom: `1px solid ${G.border}` }}><th className="text-left px-4 py-2.5 font-semibold">Task</th><th className="text-left px-4 py-2.5 font-semibold">Frequency</th><th className="text-left px-4 py-2.5 font-semibold">Next due</th><th className="text-left px-4 py-2.5 font-semibold">Compliance</th></tr></thead>
            <tbody>{profile.ppm.map((p, i) => (<tr key={i} style={{ borderBottom: `1px solid ${G.border}80` }}><td className="px-4 py-2.5 font-medium" style={{ color: G.text2 }}>{p.task}</td><td className="px-4 py-2.5" style={{ color: G.text4 }}>{p.frequency}</td><td className="px-4 py-2.5" style={{ color: G.text3 }}>{p.nextDue}</td><td className="px-4 py-2.5"><div className="flex items-center gap-2"><div className="flex-1 rounded-full h-1.5 min-w-[60px]" style={{ background: G.border }}><div className="h-1.5 rounded-full" style={{ width: `${p.compliance}%`, background: p.compliance >= 95 ? G.good : G.warn }} /></div><span style={{ color: G.text4 }}>{p.compliance}%</span></div></td></tr>))}</tbody>
          </table>
        </div>
      )}

      <div className="rounded-xl p-5" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
        <h3 className="text-sm font-bold mb-4" style={{ color: G.text }}>Net book value by category</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5">{profile.value.map(v => (<div key={v.category}><div className="flex justify-between text-xs mb-1"><span style={{ color: G.text3 }}>{v.category}</span><span className="font-bold" style={{ color: G.text }}>{v.nbv}</span></div><div className="w-full rounded-full h-1.5" style={{ background: G.border }}><div className="h-1.5 rounded-full" style={{ width: `${v.pct}%`, background: accent }} /></div></div>))}</div>
      </div>
    </div>
  )
}
