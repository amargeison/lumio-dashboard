'use client'

import { HardHat } from 'lucide-react'

// Shared Capital Projects tracker — Facilities. Accent + profile driven.
// Projects list, headline-project phase Gantt, funding mix, planning &
// milestones. Demo only.

const G = {
  panel: '#0D1117', panelAlt: '#111318', border: '#1F2937',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280',
  good: '#22C55E', warn: '#F59E0B', info: '#60A5FA', text5: '#4B5563',
}
type Status = 'Planning' | 'Approved' | 'On site' | 'Complete'
const stCol = (s: string) => s === 'Complete' ? G.good : s === 'On site' ? G.warn : s === 'Approved' ? G.info : G.text4

export type CapitalProfile = {
  kpis: { label: string; value: string; sub: string; color: string }[]
  projects: { name: string; status: Status; budget: string; spent: string; pct: number; due: string }[]
  headline: string
  phases: { name: string; period: string; pct: number; status: Status }[]
  funding: { source: string; amount: string; pct: number }[]
  planning: { label: string; status: string }[]
  milestones: { year: string; milestone: string; status: 'Done' | 'In progress' | 'Planned' }[]
}
const mCol = (s: string) => s === 'Done' ? G.good : s === 'In progress' ? G.warn : G.text4

export default function CapitalProjectsView({ accent, profile }: { accent: string; profile: CapitalProfile }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: G.text }}><HardHat size={18} style={{ color: accent }} /> Capital Projects</h2>
        <p className="text-sm mt-1" style={{ color: G.text3 }}>Stadium &amp; facility developments — budget, programme, funding and planning.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {profile.kpis.map(k => (<div key={k.label} className="rounded-xl p-3.5" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}><div className="text-[10px] uppercase tracking-wider" style={{ color: G.text4 }}>{k.label}</div><div className="text-xl font-black mt-1" style={{ color: k.color }}>{k.value}</div><div className="text-[10px] mt-0.5" style={{ color: G.text4 }}>{k.sub}</div></div>))}
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
        <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${G.border}` }}><h3 className="text-sm font-bold" style={{ color: G.text }}>Active &amp; planned projects</h3></div>
        <table className="w-full text-xs"><thead><tr style={{ color: G.text4, borderBottom: `1px solid ${G.border}` }}><th className="text-left px-4 py-2.5 font-semibold">Project</th><th className="text-left px-4 py-2.5 font-semibold">Status</th><th className="text-right px-4 py-2.5 font-semibold">Budget</th><th className="text-right px-4 py-2.5 font-semibold">Spent</th><th className="text-left px-4 py-2.5 font-semibold">Progress</th><th className="text-right px-4 py-2.5 font-semibold">Due</th></tr></thead>
          <tbody>{profile.projects.map((p, i) => (<tr key={i} style={{ borderBottom: `1px solid ${G.border}80` }}>
            <td className="px-4 py-2.5 font-medium" style={{ color: G.text2 }}>{p.name}</td>
            <td className="px-4 py-2.5"><span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${stCol(p.status)}1f`, color: stCol(p.status) }}>{p.status}</span></td>
            <td className="px-4 py-2.5 text-right" style={{ color: G.text3 }}>{p.budget}</td>
            <td className="px-4 py-2.5 text-right" style={{ color: G.text3 }}>{p.spent}</td>
            <td className="px-4 py-2.5"><div className="flex items-center gap-2"><div className="flex-1 rounded-full h-1.5 min-w-[60px]" style={{ background: G.border }}><div className="h-1.5 rounded-full" style={{ width: `${p.pct}%`, background: accent }} /></div><span style={{ color: G.text4 }}>{p.pct}%</span></div></td>
            <td className="px-4 py-2.5 text-right" style={{ color: G.text4 }}>{p.due}</td>
          </tr>))}</tbody>
        </table>
      </div>

      <div className="rounded-xl p-5" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
        <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-bold" style={{ color: G.text }}>Programme — {profile.headline}</h3><span className="text-[11px]" style={{ color: G.text4 }}>Phase plan</span></div>
        <div className="space-y-2.5">{profile.phases.map((ph, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-40 shrink-0 text-xs" style={{ color: G.text2 }}>{ph.name}</div>
            <div className="flex-1 rounded-full h-3 relative" style={{ background: G.border }}><div className="h-3 rounded-full" style={{ width: `${ph.pct}%`, background: stCol(ph.status) }} /></div>
            <div className="w-28 shrink-0 text-[10px] text-right" style={{ color: G.text4 }}>{ph.period}</div>
            <span className="w-20 shrink-0 text-[10px] text-right font-semibold" style={{ color: stCol(ph.status) }}>{ph.status}</span>
          </div>
        ))}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: G.text }}>Funding mix</h3>
          <div className="space-y-2.5">{profile.funding.map(fd => (<div key={fd.source}><div className="flex justify-between text-xs mb-1"><span style={{ color: G.text3 }}>{fd.source}</span><span className="font-bold" style={{ color: G.text }}>{fd.amount}</span></div><div className="w-full rounded-full h-1.5" style={{ background: G.border }}><div className="h-1.5 rounded-full" style={{ width: `${fd.pct}%`, background: accent }} /></div></div>))}</div>
        </div>
        <div className="rounded-xl p-5" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: G.text }}>Planning &amp; approvals</h3>
          {profile.planning.map(pl => (<div key={pl.label} className="flex items-center justify-between py-1.5" style={{ borderBottom: `1px solid ${G.border}80` }}><span className="text-xs" style={{ color: G.text3 }}>{pl.label}</span><span className="text-xs font-semibold" style={{ color: pl.status === 'Granted' || pl.status === 'Approved' || pl.status === 'Done' ? G.good : pl.status === 'Pending' ? G.text4 : G.warn }}>{pl.status}</span></div>))}
        </div>
      </div>

      <div className="rounded-xl p-5" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
        <h3 className="text-sm font-bold mb-4" style={{ color: G.text }}>Key milestones</h3>
        <div className="space-y-0">{profile.milestones.map((m, i) => (
          <div key={i} className="flex items-start gap-3 pb-4 last:pb-0">
            <div className="flex flex-col items-center"><div className="w-3 h-3 rounded-full mt-0.5 z-10" style={{ background: mCol(m.status), border: `2px solid ${G.panel}` }} />{i < profile.milestones.length - 1 && <div className="w-px flex-1" style={{ background: G.border, minHeight: 22 }} />}</div>
            <div className="flex-1 -mt-0.5"><div className="flex items-center gap-2"><span className="text-xs font-bold" style={{ color: accent }}>{m.year}</span><span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: `${mCol(m.status)}1f`, color: mCol(m.status) }}>{m.status}</span></div><div className="text-xs mt-0.5" style={{ color: G.text2 }}>{m.milestone}</div></div>
          </div>
        ))}</div>
      </div>
    </div>
  )
}
