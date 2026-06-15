'use client'

import { useState } from 'react'
import { Landmark } from 'lucide-react'

// Treasury, Debt & Covenants. Cash & bank positions, debt schedule, covenant
// headroom and FX exposure. Shared; men's (blue) vs women's (pink). Demo only.

type Variant = 'mens' | 'womens'
type RAG = 'green' | 'amber' | 'red'
type Tab = 'cash' | 'debt' | 'covenants' | 'fx'

interface Account { name: string; type: string; balance: number }
interface Debt { facility: string; lender: string; drawn: number; limit: number; rate: string; matures: string }
interface Covenant { name: string; test: string; actual: string; status: RAG }
interface Fx { ccy: string; exposure: string; hedged: string; note: string }
interface Profile { accent: string; accentLt: string; clubName: string; money: (n: number) => string
  accounts: Account[]; debt: Debt[]; covenants: Covenant[]; fx: Fx[] }

const MENS: Profile = {
  accent: '#003DA5', accentLt: '#60A5FA', clubName: 'Oakridge FC',
  money: (n) => '£' + n.toLocaleString('en-GB') + 'k',
  accounts: [
    { name: 'Operating current account', type: 'Current', balance: 4200 },
    { name: 'Player-trading escrow', type: 'Restricted', balance: 2600 },
    { name: 'Reserve / deposit', type: 'Deposit', balance: 3100 },
    { name: 'Matchday / merchant float', type: 'Current', balance: 380 },
  ],
  debt: [
    { facility: 'Revolving credit facility', lender: 'Northbridge Bank', drawn: 6000, limit: 12000, rate: 'SONIA + 3.0%', matures: 'Jun 2028' },
    { facility: 'Stadium development loan', lender: 'Crown Capital', drawn: 9500, limit: 9500, rate: '5.4% fixed', matures: 'Jul 2032' },
    { facility: 'Transfer-fee financing', lender: 'Meridian Finance', drawn: 3200, limit: 5000, rate: 'SONIA + 4.2%', matures: 'Rolling' },
  ],
  covenants: [
    { name: 'Net debt / EBITDA', test: '≤ 3.0x', actual: '2.4x', status: 'green' },
    { name: 'Interest cover', test: '≥ 3.0x', actual: '3.6x', status: 'green' },
    { name: 'Minimum liquidity', test: '≥ £2.0m', actual: '£3.8m', status: 'green' },
    { name: 'Wage / turnover', test: '≤ 70%', actual: '63%', status: 'green' },
    { name: 'RCF utilisation', test: '≤ 75%', actual: '50%', status: 'green' },
  ],
  fx: [
    { ccy: 'EUR', exposure: '€2.4m (transfer instalments)', hedged: '70% forward-covered', note: 'Santos / Vidal instalments' },
    { ccy: 'USD', exposure: '$0.3m (kit / equipment)', hedged: 'Unhedged', note: 'Below hedging threshold' },
  ],
}

const WOMENS: Profile = {
  accent: '#BE185D', accentLt: '#EC4899', clubName: 'Oakridge Women FC',
  money: (n) => '£' + n.toLocaleString('en-GB') + 'k',
  accounts: [
    { name: 'Operating current account', type: 'Current', balance: 540 },
    { name: 'Grant / funding account', type: 'Restricted', balance: 220 },
    { name: 'Reserve / deposit', type: 'Deposit', balance: 310 },
    { name: 'Matchday / merchant float', type: 'Current', balance: 60 },
  ],
  debt: [
    { facility: 'Working-capital facility', lender: 'Northbridge Bank', drawn: 150, limit: 600, rate: 'SONIA + 3.2%', matures: 'Jun 2027' },
    { facility: 'Group inter-company loan', lender: 'Parent group', drawn: 400, limit: 400, rate: '0% (subordinated)', matures: 'On demand' },
  ],
  covenants: [
    { name: 'Net debt / EBITDA', test: '≤ 2.5x', actual: '0.9x', status: 'green' },
    { name: 'Interest cover', test: '≥ 3.0x', actual: '5.1x', status: 'green' },
    { name: 'Minimum liquidity', test: '≥ £0.3m', actual: '£0.45m', status: 'amber' },
    { name: 'Wage / turnover', test: '≤ 80%', actual: '78%', status: 'amber' },
    { name: 'Facility utilisation', test: '≤ 75%', actual: '25%', status: 'green' },
  ],
  fx: [
    { ccy: 'EUR', exposure: '€0.2m (transfer instalments)', hedged: 'Unhedged', note: 'Fernández instalment — below threshold' },
  ],
}

const C = { panel: '#0D1117', panelAlt: '#111318', border: '#1F2937', text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280', good: '#22C55E', amber: '#F59E0B', red: '#EF4444' }
const ragCol = (r: RAG) => r === 'green' ? C.good : r === 'amber' ? C.amber : C.red
const TABS: [Tab, string][] = [['cash', 'Cash & Bank'], ['debt', 'Debt Schedule'], ['covenants', 'Covenants'], ['fx', 'FX Exposure']]

export default function TreasuryView({ variant, club }: { variant: Variant; club?: { name?: string } | null }) {
  const p = variant === 'mens' ? MENS : WOMENS
  const name = club?.name || p.clubName
  const [tab, setTab] = useState<Tab>('cash')
  const totalCash = p.accounts.reduce((s, a) => s + a.balance, 0)
  const totalDrawn = p.debt.reduce((s, d) => s + d.drawn, 0)
  const totalLimit = p.debt.reduce((s, d) => s + d.limit, 0)
  const breaches = p.covenants.filter(c => c.status === 'red').length

  const Stat = ({ label, value, col }: { label: string; value: string; col?: string }) => (
    <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}><div className="text-[10px] uppercase tracking-wider" style={{ color: C.text4 }}>{label}</div><div className="text-xl font-black mt-1" style={{ color: col || C.text }}>{value}</div></div>
  )

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: C.text }}><Landmark size={18} style={{ color: p.accent }} /> Treasury, Debt & Covenants</h2>
        <p className="text-sm mt-1 max-w-2xl" style={{ color: C.text3 }}>{name} — cash positions, debt facilities, covenant headroom and FX exposure.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Total cash" value={p.money(totalCash)} col={C.good} />
        <Stat label="Debt drawn" value={p.money(totalDrawn)} col={p.accentLt} />
        <Stat label="Net debt" value={p.money(totalDrawn - totalCash)} />
        <Stat label="Covenant breaches" value={String(breaches)} col={breaches ? C.red : C.good} />
      </div>

      <div className="flex gap-1 border-b overflow-x-auto" style={{ borderColor: C.border }}>
        {TABS.map(([id, label]) => (<button key={id} onClick={() => setTab(id)} className="px-4 py-2 text-xs font-semibold -mb-px whitespace-nowrap" style={{ borderBottom: `2px solid ${tab === id ? p.accent : 'transparent'}`, color: tab === id ? p.accentLt : C.text4 }}>{label}</button>))}
      </div>

      {tab === 'cash' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <table className="w-full text-xs"><thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>{['Account', 'Type', 'Balance'].map(h => <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
            <tbody>{p.accounts.map((a, i) => (<tr key={i} style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{a.name}</td><td className="px-4 py-2.5" style={{ color: C.text4 }}>{a.type}</td><td className="px-4 py-2.5 font-mono font-semibold" style={{ color: C.good }}>{p.money(a.balance)}</td></tr>))}</tbody>
            <tfoot><tr style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-bold" style={{ color: C.text }}>Total available cash</td><td></td><td className="px-4 py-2.5 font-mono font-bold" style={{ color: C.good }}>{p.money(totalCash)}</td></tr></tfoot>
          </table>
        </div>
      )}

      {tab === 'debt' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <table className="w-full text-xs"><thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>{['Facility', 'Lender', 'Drawn / Limit', 'Rate', 'Matures'].map(h => <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
            <tbody>{p.debt.map((d, i) => (<tr key={i} style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{d.facility}</td><td className="px-4 py-2.5" style={{ color: C.text3 }}>{d.lender}</td><td className="px-4 py-2.5 font-mono" style={{ color: C.text2 }}>{p.money(d.drawn)} / {p.money(d.limit)}</td><td className="px-4 py-2.5" style={{ color: C.text4 }}>{d.rate}</td><td className="px-4 py-2.5" style={{ color: C.text4 }}>{d.matures}</td></tr>))}</tbody>
            <tfoot><tr style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-bold" style={{ color: C.text }}>Total</td><td></td><td className="px-4 py-2.5 font-mono font-bold" style={{ color: p.accentLt }}>{p.money(totalDrawn)} / {p.money(totalLimit)}</td><td colSpan={2}></td></tr></tfoot>
          </table>
          <div className="px-4 py-2.5 text-[10px]" style={{ borderTop: `1px solid ${C.border}`, color: C.text4 }}>Undrawn headroom: {p.money(totalLimit - totalDrawn)}. Lender names are fictional.</div>
        </div>
      )}

      {tab === 'covenants' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <table className="w-full text-xs"><thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>{['Covenant', 'Test', 'Actual', 'Status'].map(h => <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
            <tbody>{p.covenants.map((c, i) => (<tr key={i} style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{c.name}</td><td className="px-4 py-2.5 font-mono" style={{ color: C.text4 }}>{c.test}</td><td className="px-4 py-2.5 font-mono font-semibold" style={{ color: C.text2 }}>{c.actual}</td><td className="px-4 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${ragCol(c.status)}1f`, color: ragCol(c.status) }}>{c.status === 'green' ? 'Headroom' : c.status === 'amber' ? 'Tight' : 'Breach'}</span></td></tr>))}</tbody>
          </table>
          <div className="px-4 py-2.5 text-[10px]" style={{ borderTop: `1px solid ${C.border}`, color: C.text4 }}>Tested quarterly and certified to lenders. Amber items watched monthly by the finance team.</div>
        </div>
      )}

      {tab === 'fx' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <table className="w-full text-xs"><thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>{['Currency', 'Exposure', 'Hedging', 'Note'].map(h => <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
            <tbody>{p.fx.map((f, i) => (<tr key={i} style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-semibold font-mono" style={{ color: C.text }}>{f.ccy}</td><td className="px-4 py-2.5" style={{ color: C.text2 }}>{f.exposure}</td><td className="px-4 py-2.5" style={{ color: C.text3 }}>{f.hedged}</td><td className="px-4 py-2.5" style={{ color: C.text4 }}>{f.note}</td></tr>))}</tbody>
          </table>
          <div className="px-4 py-2.5 text-[10px]" style={{ borderTop: `1px solid ${C.border}`, color: C.text4 }}>Overseas transfer instalments and wages hedged with forward contracts above threshold to fix the sterling cost.</div>
        </div>
      )}

      <div className="rounded-xl p-3 text-[11px]" style={{ background: `${p.accent}12`, borderLeft: `3px solid ${p.accent}`, color: C.text2 }}>
        Demo — illustrative only. Balances, facilities, rates and covenant levels are invented demo values; lender names are fictional.
      </div>
    </div>
  )
}
