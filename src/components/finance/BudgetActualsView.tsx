'use client'

import { useState } from 'react'
import { ClipboardList } from 'lucide-react'

// Budget vs Actuals. Departmental budget control, variance vs actuals and
// reforecast. Shared; men's (blue) vs women's (pink). Demo only.

type Variant = 'mens' | 'womens'
type Tab = 'depts' | 'variance' | 'reforecast'

interface Dept { dept: string; budget: number; actual: number }
interface Fore { period: string; budget: number; actual: number }
interface Profile { accent: string; accentLt: string; clubName: string; money: (n: number) => string
  depts: Dept[]; forecast: Fore[]; ytdLabel: string }

const MENS: Profile = {
  accent: '#003DA5', accentLt: '#60A5FA', clubName: 'Oakridge FC',
  money: (n) => '£' + n.toLocaleString('en-GB') + 'k',
  ytdLabel: 'YTD (to month 9)',
  depts: [
    { dept: 'Football — wages', budget: 13650, actual: 13900 },
    { dept: 'Football — transfers/amort.', budget: 5200, actual: 4980 },
    { dept: 'Academy', budget: 1800, actual: 1740 },
    { dept: 'Medical & sports science', budget: 640, actual: 690 },
    { dept: 'Commercial & marketing', budget: 1100, actual: 1020 },
    { dept: 'Operations & matchday', budget: 1450, actual: 1560 },
    { dept: 'Facilities & stadium', budget: 980, actual: 940 },
    { dept: 'Administration', budget: 720, actual: 700 },
  ],
  forecast: [
    { period: 'Q1', budget: 8200, actual: 8350 },
    { period: 'Q2', budget: 8400, actual: 8520 },
    { period: 'Q3', budget: 8300, actual: 8210 },
    { period: 'Q4 (reforecast)', budget: 8500, actual: 8650 },
  ],
}

const WOMENS: Profile = {
  accent: '#BE185D', accentLt: '#EC4899', clubName: 'Oakridge Women FC',
  money: (n) => '£' + n.toLocaleString('en-GB') + 'k',
  ytdLabel: 'YTD (to month 9)',
  depts: [
    { dept: 'Football — wages', budget: 1090, actual: 1120 },
    { dept: 'Football — transfers/amort.', budget: 210, actual: 195 },
    { dept: 'RTC / academy', budget: 195, actual: 188 },
    { dept: 'Medical & sports science', budget: 150, actual: 162 },
    { dept: 'Commercial & marketing', budget: 220, actual: 205 },
    { dept: 'Operations & matchday', budget: 240, actual: 258 },
    { dept: 'Facilities', budget: 160, actual: 152 },
    { dept: 'Administration', budget: 130, actual: 126 },
  ],
  forecast: [
    { period: 'Q1', budget: 620, actual: 640 },
    { period: 'Q2', budget: 640, actual: 655 },
    { period: 'Q3', budget: 630, actual: 620 },
    { period: 'Q4 (reforecast)', budget: 660, actual: 675 },
  ],
}

const C = { panel: '#0D1117', panelAlt: '#111318', border: '#1F2937', text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280', good: '#22C55E', amber: '#F59E0B', red: '#EF4444' }
const TABS: [Tab, string][] = [['depts', 'Departmental Budgets'], ['variance', 'Variance Analysis'], ['reforecast', 'Reforecast']]

export default function BudgetActualsView({ variant, club }: { variant: Variant; club?: { name?: string } | null }) {
  const p = variant === 'mens' ? MENS : WOMENS
  const name = club?.name || p.clubName
  const [tab, setTab] = useState<Tab>('depts')
  const totBudget = p.depts.reduce((s, d) => s + d.budget, 0)
  const totActual = p.depts.reduce((s, d) => s + d.actual, 0)
  const totVar = totActual - totBudget
  const overspends = p.depts.filter(d => d.actual > d.budget).length
  const varCol = (v: number, of: number) => { const pc = (v / of) * 100; return pc > 3 ? C.red : pc > 0 ? C.amber : C.good }

  const Stat = ({ label, value, col }: { label: string; value: string; col?: string }) => (
    <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}><div className="text-[10px] uppercase tracking-wider" style={{ color: C.text4 }}>{label}</div><div className="text-xl font-black mt-1" style={{ color: col || C.text }}>{value}</div></div>
  )

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: C.text }}><ClipboardList size={18} style={{ color: p.accent }} /> Budget vs Actuals</h2>
        <p className="text-sm mt-1 max-w-2xl" style={{ color: C.text3 }}>{name} — departmental budget control, variance and reforecast. {p.ytdLabel}.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Budget (YTD)" value={p.money(totBudget)} />
        <Stat label="Actual (YTD)" value={p.money(totActual)} col={p.accentLt} />
        <Stat label="Variance" value={(totVar >= 0 ? '+' : '') + p.money(totVar)} col={totVar > 0 ? C.red : C.good} />
        <Stat label="Departments over budget" value={`${overspends} / ${p.depts.length}`} col={overspends > 3 ? C.amber : C.text} />
      </div>

      <div className="flex gap-1 border-b overflow-x-auto" style={{ borderColor: C.border }}>
        {TABS.map(([id, label]) => (<button key={id} onClick={() => setTab(id)} className="px-4 py-2 text-xs font-semibold -mb-px whitespace-nowrap" style={{ borderBottom: `2px solid ${tab === id ? p.accent : 'transparent'}`, color: tab === id ? p.accentLt : C.text4 }}>{label}</button>))}
      </div>

      {(tab === 'depts' || tab === 'variance') && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <table className="w-full text-xs"><thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>{['Department', 'Budget', 'Actual', 'Variance', 'Var %'].map(h => <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
            <tbody>{p.depts.map((d, i) => { const v = d.actual - d.budget; const pc = (v / d.budget) * 100; return (<tr key={i} style={{ borderTop: `1px solid ${C.border}`, background: pc > 3 ? `${C.red}08` : undefined }}><td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{d.dept}</td><td className="px-4 py-2.5 font-mono" style={{ color: C.text3 }}>{p.money(d.budget)}</td><td className="px-4 py-2.5 font-mono" style={{ color: C.text2 }}>{p.money(d.actual)}</td><td className="px-4 py-2.5 font-mono font-semibold" style={{ color: varCol(v, d.budget) }}>{v >= 0 ? '+' : ''}{p.money(v)}</td><td className="px-4 py-2.5 font-mono" style={{ color: varCol(v, d.budget) }}>{pc >= 0 ? '+' : ''}{pc.toFixed(1)}%</td></tr>) })}</tbody>
            <tfoot><tr style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-bold" style={{ color: C.text }}>Total</td><td className="px-4 py-2.5 font-mono font-bold" style={{ color: C.text }}>{p.money(totBudget)}</td><td className="px-4 py-2.5 font-mono font-bold" style={{ color: C.text }}>{p.money(totActual)}</td><td className="px-4 py-2.5 font-mono font-bold" style={{ color: totVar > 0 ? C.red : C.good }}>{totVar >= 0 ? '+' : ''}{p.money(totVar)}</td><td className="px-4 py-2.5 font-mono font-bold" style={{ color: totVar > 0 ? C.red : C.good }}>{((totVar / totBudget) * 100).toFixed(1)}%</td></tr></tfoot>
          </table>
          <div className="px-4 py-2.5 text-[10px]" style={{ borderTop: `1px solid ${C.border}`, color: C.text4 }}>Variances above +3% flagged for departmental review. Wage overspend is the primary watch item.</div>
        </div>
      )}

      {tab === 'reforecast' && (
        <div className="rounded-xl p-5" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: C.text }}>Quarterly budget vs forecast / actual</h3>
          <div className="space-y-3">{p.forecast.map((f, i) => { const max = Math.max(...p.forecast.flatMap(x => [x.budget, x.actual])); return (
            <div key={i}>
              <div className="flex items-center justify-between mb-1"><span className="text-xs font-semibold" style={{ color: C.text2 }}>{f.period}</span><span className="text-[11px] font-mono" style={{ color: f.actual > f.budget ? C.amber : C.good }}>{p.money(f.actual)} vs {p.money(f.budget)}</span></div>
              <div className="relative w-full rounded-full h-3" style={{ background: C.border }}>
                <div className="absolute h-3 rounded-full" style={{ width: `${(f.budget / max) * 100}%`, background: `${p.accent}66` }} />
                <div className="absolute h-3 rounded-full" style={{ width: `${(f.actual / max) * 100}%`, background: p.accent }} />
              </div>
            </div>
          ) })}</div>
          <div className="text-[10px] mt-3 flex items-center gap-4" style={{ color: C.text4 }}><span><span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: `${p.accent}66` }} />Budget</span><span><span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: p.accent }} />Actual / forecast</span></div>
        </div>
      )}

      <div className="rounded-xl p-3 text-[11px]" style={{ background: `${p.accent}12`, borderLeft: `3px solid ${p.accent}`, color: C.text2 }}>
        Demo — illustrative only. Budgets, actuals and variances are invented demo values.
      </div>
    </div>
  )
}
