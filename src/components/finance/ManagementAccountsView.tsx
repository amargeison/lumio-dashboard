'use client'

import { useState } from 'react'
import { FileBarChart } from 'lucide-react'

// Management Accounts & Board Pack. Monthly close summary, management KPI pack
// and a board-ready finance export. Shared variant component. Demo only.

type Variant = 'mens' | 'womens'
type Tab = 'pack' | 'kpis' | 'close'

interface Line { label: string; mtd: number; budget: number; ytd: number }
interface Kpi { label: string; value: string; trend: 'up' | 'down' | 'flat'; good: boolean }
interface Close { task: string; owner: string; done: boolean }
interface Profile { accent: string; accentLt: string; clubName: string; money: (n: number) => string
  lines: Line[]; kpis: Kpi[]; close: Close[]; period: string }

const MENS: Profile = {
  accent: '#003DA5', accentLt: '#60A5FA', clubName: 'Oakridge FC',
  money: (n) => '£' + n.toLocaleString('en-GB') + 'k',
  period: 'March 2026 (Month 9)',
  lines: [
    { label: 'Revenue', mtd: 3150, budget: 3100, ytd: 28400 },
    { label: 'Wages', mtd: -1620, budget: -1580, ytd: -14200 },
    { label: 'Player amortisation', mtd: -540, budget: -540, ytd: -4860 },
    { label: 'Other operating costs', mtd: -680, budget: -700, ytd: -6100 },
    { label: 'Player-trading profit', mtd: 0, budget: 0, ytd: 5200 },
    { label: 'EBIT', mtd: 310, budget: 280, ytd: 8440 },
  ],
  kpis: [
    { label: 'Wage / turnover', value: '63%', trend: 'flat', good: true },
    { label: 'EBITDA margin', value: '18%', trend: 'up', good: true },
    { label: 'Cash runway', value: '3.8 mo', trend: 'flat', good: true },
    { label: 'PSR headroom (3yr)', value: '£37m', trend: 'down', good: true },
    { label: 'Cost per league point', value: '£640k', trend: 'down', good: true },
    { label: 'Revenue per fan', value: '£1,180', trend: 'up', good: true },
  ],
  close: [
    { task: 'Bank reconciliations', owner: 'Financial Controller', done: true },
    { task: 'Payroll journal posted', owner: 'Payroll', done: true },
    { task: 'Amortisation & depreciation run', owner: 'Financial Controller', done: true },
    { task: 'Accruals & prepayments', owner: 'Management Accountant', done: true },
    { task: 'Revenue cut-off review', owner: 'Management Accountant', done: false },
    { task: 'Board pack sign-off', owner: 'Finance Director', done: false },
  ],
}

const WOMENS: Profile = {
  accent: '#BE185D', accentLt: '#EC4899', clubName: 'Oakridge Women FC',
  money: (n) => '£' + n.toLocaleString('en-GB') + 'k',
  period: 'March 2026 (Month 9)',
  lines: [
    { label: 'Revenue', mtd: 240, budget: 235, ytd: 2160 },
    { label: 'Wages', mtd: -132, budget: -128, ytd: -1180 },
    { label: 'Player amortisation', mtd: -22, budget: -22, ytd: -198 },
    { label: 'Other operating costs', mtd: -68, budget: -70, ytd: -610 },
    { label: 'Player-trading profit', mtd: 0, budget: 0, ytd: 125 },
    { label: 'EBIT', mtd: 18, budget: 15, ytd: 297 },
  ],
  kpis: [
    { label: 'Wage / turnover', value: '78%', trend: 'flat', good: false },
    { label: 'EBITDA margin', value: '12%', trend: 'up', good: true },
    { label: 'Cash runway', value: '2.6 mo', trend: 'flat', good: true },
    { label: 'FSR headroom (3yr)', value: '£0.4m', trend: 'down', good: true },
    { label: 'Cost per league point', value: '£44k', trend: 'down', good: true },
    { label: 'Revenue per fan', value: '£280', trend: 'up', good: true },
  ],
  close: [
    { task: 'Bank reconciliations', owner: 'Finance Officer', done: true },
    { task: 'Payroll journal posted', owner: 'Payroll', done: true },
    { task: 'Amortisation & depreciation run', owner: 'Finance Officer', done: true },
    { task: 'Accruals & prepayments', owner: 'Finance Officer', done: true },
    { task: 'Grant income cut-off', owner: 'Head of Finance', done: false },
    { task: 'Board pack sign-off', owner: 'Managing Director', done: false },
  ],
}

const C = { panel: '#0D1117', panelAlt: '#111318', border: '#1F2937', text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280', good: '#22C55E', amber: '#F59E0B', red: '#EF4444' }
const TABS: [Tab, string][] = [['pack', 'Management P&L'], ['kpis', 'KPI Pack'], ['close', 'Month-End Close']]

export default function ManagementAccountsView({ variant, club }: { variant: Variant; club?: { name?: string } | null }) {
  const p = variant === 'mens' ? MENS : WOMENS
  const name = club?.name || p.clubName
  const [tab, setTab] = useState<Tab>('pack')
  const closeDone = p.close.filter(c => c.done).length

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: C.text }}><FileBarChart size={18} style={{ color: p.accent }} /> Management Accounts & Board Pack</h2>
          <p className="text-sm mt-1 max-w-2xl" style={{ color: C.text3 }}>{name} — monthly management P&amp;L, KPI pack and month-end close. Period: {p.period}.</p>
        </div>
        <button className="text-[11px] font-semibold px-3 py-2 rounded-lg" style={{ background: `${p.accent}1f`, color: p.accentLt, border: `1px solid ${p.accent}55` }}>Export board pack (PDF)</button>
      </div>

      <div className="flex gap-1 border-b overflow-x-auto" style={{ borderColor: C.border }}>
        {TABS.map(([id, label]) => (<button key={id} onClick={() => setTab(id)} className="px-4 py-2 text-xs font-semibold -mb-px whitespace-nowrap" style={{ borderBottom: `2px solid ${tab === id ? p.accent : 'transparent'}`, color: tab === id ? p.accentLt : C.text4 }}>{label}</button>))}
      </div>

      {tab === 'pack' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <table className="w-full text-xs"><thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>{['Line', 'Month actual', 'Month budget', 'YTD'].map(h => <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
            <tbody>{p.lines.map((l, i) => { const isTotal = l.label === 'EBIT'; const mc = l.mtd < 0 ? C.text3 : C.text2; return (<tr key={i} style={{ borderTop: `1px solid ${C.border}`, background: isTotal ? 'rgba(17,24,39,0.4)' : undefined }}><td className="px-4 py-2.5 font-semibold" style={{ color: isTotal ? p.accentLt : C.text }}>{l.label}</td><td className="px-4 py-2.5 font-mono" style={{ color: isTotal ? p.accentLt : mc, fontWeight: isTotal ? 700 : 400 }}>{p.money(l.mtd)}</td><td className="px-4 py-2.5 font-mono" style={{ color: C.text4 }}>{p.money(l.budget)}</td><td className="px-4 py-2.5 font-mono" style={{ color: isTotal ? C.text : C.text3, fontWeight: isTotal ? 700 : 400 }}>{p.money(l.ytd)}</td></tr>) })}</tbody>
          </table>
          <div className="px-4 py-2.5 text-[10px]" style={{ borderTop: `1px solid ${C.border}`, color: C.text4 }}>Management basis (pre-audit). Player-trading profit shown separately as it is lumpy and PSR/FSR-significant.</div>
        </div>
      )}

      {tab === 'kpis' && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {p.kpis.map((k, i) => (
            <div key={i} className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
              <div className="text-[10px] uppercase tracking-wider" style={{ color: C.text4 }}>{k.label}</div>
              <div className="flex items-center gap-2 mt-1"><span className="text-xl font-black" style={{ color: k.good ? C.text : C.amber }}>{k.value}</span><span className="text-[11px]" style={{ color: k.trend === 'up' ? C.good : k.trend === 'down' ? C.text4 : C.text4 }}>{k.trend === 'up' ? '▲' : k.trend === 'down' ? '▼' : '—'}</span></div>
            </div>
          ))}
        </div>
      )}

      {tab === 'close' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}><span className="text-sm font-bold" style={{ color: C.text }}>Month-end close checklist</span><span className="text-[11px]" style={{ color: closeDone === p.close.length ? C.good : C.amber }}>{closeDone} / {p.close.length} complete</span></div>
          {p.close.map((c, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: i < p.close.length - 1 ? `1px solid ${C.border}80` : undefined }}>
              <span className="w-4 h-4 rounded border flex items-center justify-center shrink-0" style={{ borderColor: c.done ? C.good : C.text4, background: c.done ? `${C.good}22` : 'transparent' }}>{c.done && <span style={{ color: C.good, fontSize: 10 }}>✓</span>}</span>
              <span className="flex-1 text-xs" style={{ color: c.done ? C.text3 : C.text, textDecoration: c.done ? 'line-through' : 'none' }}>{c.task}</span>
              <span className="text-[10px]" style={{ color: C.text4 }}>{c.owner}</span>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl p-3 text-[11px]" style={{ background: `${p.accent}12`, borderLeft: `3px solid ${p.accent}`, color: C.text2 }}>
        Demo — illustrative only. Management figures, KPIs and close status are invented demo values.
      </div>
    </div>
  )
}
