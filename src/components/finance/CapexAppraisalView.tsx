'use client'

import { useState } from 'react'
import { Building2 } from 'lucide-react'

// CapEx & Investment Appraisal. Capital budget, project ROI / payback and the
// depreciation schedule. Shared variant component. Demo only — illustrative.

type Variant = 'mens' | 'womens'
type Tab = 'pipeline' | 'appraisal' | 'depreciation'

interface Project { name: string; budget: number; spent: number; status: string }
interface Appraisal { name: string; capex: number; annualBenefit: number; payback: string; irr: string; decision: string }
interface Depr { asset: string; cost: number; rate: string; nbv: number }
interface Profile { accent: string; accentLt: string; clubName: string; money: (n: number) => string
  projects: Project[]; appraisals: Appraisal[]; depreciation: Depr[] }

const MENS: Profile = {
  accent: '#003DA5', accentLt: '#60A5FA', clubName: 'Oakridge FC',
  money: (n) => '£' + n.toLocaleString('en-GB') + 'k',
  projects: [
    { name: 'East Stand accessibility & hospitality', budget: 3200, spent: 1280, status: 'In progress' },
    { name: 'Training-ground recovery centre', budget: 1400, spent: 980, status: 'In progress' },
    { name: 'Pitch hybrid-system upgrade', budget: 850, spent: 850, status: 'Complete' },
    { name: 'Stadium LED / floodlight upgrade', budget: 620, spent: 0, status: 'Approved' },
    { name: 'Data centre / analytics infrastructure', budget: 340, spent: 120, status: 'In progress' },
  ],
  appraisals: [
    { name: 'East Stand hospitality expansion', capex: 3200, annualBenefit: 720, payback: '4.4 yrs', irr: '19%', decision: 'Approved' },
    { name: 'Recovery centre', capex: 1400, annualBenefit: 180, payback: '7.8 yrs', irr: '9%', decision: 'Approved (strategic)' },
    { name: 'Stadium solar / energy', capex: 900, annualBenefit: 165, payback: '5.5 yrs', irr: '14%', decision: 'Under review' },
  ],
  depreciation: [
    { asset: 'Stadium & stands', cost: 78000, rate: '2% SL', nbv: 61400 },
    { asset: 'Training ground', cost: 12000, rate: '4% SL', nbv: 8900 },
    { asset: 'Plant & equipment', cost: 4200, rate: '15% SL', nbv: 2380 },
    { asset: 'IT & analytics', cost: 1100, rate: '25% SL', nbv: 540 },
  ],
}

const WOMENS: Profile = {
  accent: '#BE185D', accentLt: '#EC4899', clubName: 'Oakridge Women FC',
  money: (n) => '£' + n.toLocaleString('en-GB') + 'k',
  projects: [
    { name: 'Training facility expansion', budget: 480, spent: 190, status: 'In progress' },
    { name: 'Stadium accessibility works', budget: 220, spent: 60, status: 'In progress' },
    { name: 'Performance gym fit-out', budget: 140, spent: 140, status: 'Complete' },
    { name: 'Floodlight upgrade (RTC pitch)', budget: 90, spent: 0, status: 'Approved' },
  ],
  appraisals: [
    { name: 'Training facility expansion', capex: 480, annualBenefit: 70, payback: '6.9 yrs', irr: '11%', decision: 'Approved (strategic)' },
    { name: 'Hospitality / matchday uplift', capex: 160, annualBenefit: 42, payback: '3.8 yrs', irr: '22%', decision: 'Approved' },
    { name: 'Solar / energy efficiency', capex: 120, annualBenefit: 22, payback: '5.5 yrs', irr: '13%', decision: 'Under review' },
  ],
  depreciation: [
    { asset: 'Facilities & stand', cost: 9000, rate: '2.5% SL', nbv: 7600 },
    { asset: 'Training facility', cost: 2200, rate: '4% SL', nbv: 1750 },
    { asset: 'Plant & equipment', cost: 680, rate: '15% SL', nbv: 410 },
    { asset: 'IT & analytics', cost: 240, rate: '25% SL', nbv: 130 },
  ],
}

const C = { panel: '#0D1117', panelAlt: '#111318', border: '#1F2937', text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280', good: '#22C55E', amber: '#F59E0B' }
const TABS: [Tab, string][] = [['pipeline', 'Capital Pipeline'], ['appraisal', 'Investment Appraisal'], ['depreciation', 'Depreciation']]

export default function CapexAppraisalView({ variant, club }: { variant: Variant; club?: { name?: string } | null }) {
  const p = variant === 'mens' ? MENS : WOMENS
  const name = club?.name || p.clubName
  const [tab, setTab] = useState<Tab>('pipeline')
  const totalBudget = p.projects.reduce((s, d) => s + d.budget, 0)
  const totalSpent = p.projects.reduce((s, d) => s + d.spent, 0)
  const nbv = p.depreciation.reduce((s, d) => s + d.nbv, 0)

  const Stat = ({ label, value, col }: { label: string; value: string; col?: string }) => (
    <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}><div className="text-[10px] uppercase tracking-wider" style={{ color: C.text4 }}>{label}</div><div className="text-xl font-black mt-1" style={{ color: col || C.text }}>{value}</div></div>
  )

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: C.text }}><Building2 size={18} style={{ color: p.accent }} /> CapEx & Investment Appraisal</h2>
        <p className="text-sm mt-1 max-w-2xl" style={{ color: C.text3 }}>{name} — capital pipeline, ROI / payback appraisal and the fixed-asset depreciation schedule.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Capital budget" value={p.money(totalBudget)} />
        <Stat label="Committed / spent" value={p.money(totalSpent)} col={p.accentLt} />
        <Stat label="Remaining" value={p.money(totalBudget - totalSpent)} col={C.amber} />
        <Stat label="Fixed-asset NBV" value={p.money(nbv)} col={C.good} />
      </div>

      <div className="flex gap-1 border-b overflow-x-auto" style={{ borderColor: C.border }}>
        {TABS.map(([id, label]) => (<button key={id} onClick={() => setTab(id)} className="px-4 py-2 text-xs font-semibold -mb-px whitespace-nowrap" style={{ borderBottom: `2px solid ${tab === id ? p.accent : 'transparent'}`, color: tab === id ? p.accentLt : C.text4 }}>{label}</button>))}
      </div>

      {tab === 'pipeline' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <table className="w-full text-xs"><thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>{['Project', 'Budget', 'Spent', 'Progress', 'Status'].map(h => <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
            <tbody>{p.projects.map((d, i) => { const pc = Math.round((d.spent / d.budget) * 100); return (<tr key={i} style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{d.name}</td><td className="px-4 py-2.5 font-mono" style={{ color: C.text3 }}>{p.money(d.budget)}</td><td className="px-4 py-2.5 font-mono" style={{ color: C.text2 }}>{p.money(d.spent)}</td><td className="px-4 py-2.5"><div className="flex items-center gap-2"><div className="w-16 rounded-full h-1.5" style={{ background: C.border }}><div className="h-1.5 rounded-full" style={{ width: `${pc}%`, background: p.accent }} /></div><span className="text-[10px]" style={{ color: C.text4 }}>{pc}%</span></div></td><td className="px-4 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: d.status === 'Complete' ? `${C.good}1f` : d.status === 'Approved' ? `${C.amber}1f` : `${p.accent}22`, color: d.status === 'Complete' ? C.good : d.status === 'Approved' ? C.amber : p.accentLt }}>{d.status}</span></td></tr>) })}</tbody>
          </table>
        </div>
      )}

      {tab === 'appraisal' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <table className="w-full text-xs"><thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>{['Project', 'CapEx', 'Annual benefit', 'Payback', 'IRR', 'Decision'].map(h => <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
            <tbody>{p.appraisals.map((d, i) => (<tr key={i} style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{d.name}</td><td className="px-4 py-2.5 font-mono" style={{ color: C.text3 }}>{p.money(d.capex)}</td><td className="px-4 py-2.5 font-mono" style={{ color: C.good }}>{p.money(d.annualBenefit)}/yr</td><td className="px-4 py-2.5" style={{ color: C.text2 }}>{d.payback}</td><td className="px-4 py-2.5 font-mono" style={{ color: p.accentLt }}>{d.irr}</td><td className="px-4 py-2.5" style={{ color: C.text3 }}>{d.decision}</td></tr>))}</tbody>
          </table>
          <div className="px-4 py-2.5 text-[10px]" style={{ borderTop: `1px solid ${C.border}`, color: C.text4 }}>Hurdle rate 10% IRR; strategic projects (facilities, welfare) approved below hurdle on qualitative grounds.</div>
        </div>
      )}

      {tab === 'depreciation' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <table className="w-full text-xs"><thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>{['Asset class', 'Cost', 'Rate', 'Net book value'].map(h => <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
            <tbody>{p.depreciation.map((d, i) => (<tr key={i} style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{d.asset}</td><td className="px-4 py-2.5 font-mono" style={{ color: C.text3 }}>{p.money(d.cost)}</td><td className="px-4 py-2.5" style={{ color: C.text4 }}>{d.rate}</td><td className="px-4 py-2.5 font-mono font-semibold" style={{ color: p.accentLt }}>{p.money(d.nbv)}</td></tr>))}</tbody>
            <tfoot><tr style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-bold" style={{ color: C.text }}>Total NBV</td><td colSpan={2}></td><td className="px-4 py-2.5 font-mono font-bold" style={{ color: p.accentLt }}>{p.money(nbv)}</td></tr></tfoot>
          </table>
          <div className="px-4 py-2.5 text-[10px]" style={{ borderTop: `1px solid ${C.border}`, color: C.text4 }}>Straight-line (SL) depreciation. Stadium infrastructure depreciation is added back for some PSR / FSR purposes.</div>
        </div>
      )}

      <div className="rounded-xl p-3 text-[11px]" style={{ background: `${p.accent}12`, borderLeft: `3px solid ${p.accent}`, color: C.text2 }}>
        Demo — illustrative only. Project budgets, appraisal metrics and asset values are invented demo values.
      </div>
    </div>
  )
}
