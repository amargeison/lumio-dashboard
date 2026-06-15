'use client'

import { useState } from 'react'
import { ArrowRightLeft } from 'lucide-react'

// Player Trading & Amortisation Ledger. Transfer-fee amortisation schedules,
// registration book values, profit-on-disposal and add-on / contingent
// liabilities — the ledger that drives the PSR / FSR calculation. Shared;
// men's (blue/PSR) vs women's (pink/FSR). Demo only — illustrative.

type Variant = 'mens' | 'womens'
type Tab = 'book' | 'amort' | 'disposals' | 'contingent'

interface Reg { player: string; cost: number; signed: string; term: number; nbv: number; annual: number }
interface Disposal { player: string; fee: number; nbv: number; profit: number; window: string }
interface Contingent { player: string; trigger: string; amount: number; likelihood: string }
interface Profile {
  accent: string; accentLt: string; clubName: string; money: (n: number) => string
  regs: Reg[]; disposals: Disposal[]; contingent: Contingent[]; regimeNote: string
}

const MENS: Profile = {
  accent: '#003DA5', accentLt: '#60A5FA', clubName: 'Oakridge FC',
  money: (n) => '£' + n.toLocaleString('en-GB') + 'k',
  regs: [
    { player: 'Diego Santos', cost: 8200, signed: 'Jul 2025', term: 4, nbv: 6150, annual: 2050 },
    { player: 'Lucas Vidal', cost: 6400, signed: 'Aug 2024', term: 4, nbv: 3200, annual: 1600 },
    { player: 'Kwame Boateng', cost: 4500, signed: 'Jan 2024', term: 3.5, nbv: 1929, annual: 1286 },
    { player: 'Chris Nwosu', cost: 3200, signed: 'Jul 2023', term: 4, nbv: 800, annual: 800 },
    { player: 'Dean Morris', cost: 2800, signed: 'Jul 2022', term: 4, nbv: 0, annual: 700 },
  ],
  disposals: [
    { player: 'Marcus Reid', fee: 5500, nbv: 1400, profit: 4100, window: 'Summer 2025' },
    { player: 'Joe Lewis', fee: 1800, nbv: 600, profit: 1200, window: 'Summer 2025' },
    { player: 'Zack Bright', fee: 900, nbv: 0, profit: 900, window: 'Jan 2026' },
  ],
  contingent: [
    { player: 'Diego Santos', trigger: '20 league apps + promotion', amount: 1500, likelihood: 'Probable' },
    { player: 'Lucas Vidal', trigger: 'International cap', amount: 600, likelihood: 'Possible' },
    { player: 'Marcus Reid (sell-on)', trigger: '15% of next sale profit', amount: 800, likelihood: 'Possible' },
  ],
  regimeNote: 'Amortisation charge flows directly into the PSR 3-year calculation. Profit on player disposals is PSR-allowable income.',
}

const WOMENS: Profile = {
  accent: '#BE185D', accentLt: '#EC4899', clubName: 'Oakridge Women FC',
  money: (n) => '£' + n.toLocaleString('en-GB') + 'k',
  regs: [
    { player: 'María Fernández', cost: 220, signed: 'Jul 2025', term: 3, nbv: 165, annual: 73 },
    { player: 'Elin Johansson', cost: 180, signed: 'Aug 2025', term: 3, nbv: 150, annual: 60 },
    { player: 'Aisha Diallo', cost: 140, signed: 'Jan 2024', term: 3, nbv: 62, annual: 47 },
    { player: 'Jade Osei', cost: 95, signed: 'Jul 2023', term: 3, nbv: 16, annual: 32 },
    { player: 'Niamh Gallagher', cost: 60, signed: 'Jul 2024', term: 2, nbv: 0, annual: 30 },
  ],
  disposals: [
    { player: 'Beth Carter', fee: 120, nbv: 30, profit: 90, window: 'Summer 2025' },
    { player: 'Hannah Reid', fee: 45, nbv: 10, profit: 35, window: 'Jan 2026' },
  ],
  contingent: [
    { player: 'María Fernández', trigger: 'WSL promotion', amount: 40, likelihood: 'Probable' },
    { player: 'Elin Johansson', trigger: '25 league apps', amount: 25, likelihood: 'Possible' },
  ],
  regimeNote: 'Amortisation charge flows into the FSR 3-year calculation. Profit on player disposals is FSR-allowable income.',
}

const C = { panel: '#0D1117', panelAlt: '#111318', border: '#1F2937', text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280', good: '#22C55E', amber: '#F59E0B' }
const TABS: [Tab, string][] = [['book', 'Registration Book Values'], ['amort', 'Amortisation Schedule'], ['disposals', 'Profit on Disposal'], ['contingent', 'Contingent Liabilities']]

export default function PlayerTradingLedger({ variant, club }: { variant: Variant; club?: { name?: string } | null }) {
  const p = variant === 'mens' ? MENS : WOMENS
  const name = club?.name || p.clubName
  const [tab, setTab] = useState<Tab>('book')
  const totalNbv = p.regs.reduce((s, r) => s + r.nbv, 0)
  const totalAnnual = p.regs.reduce((s, r) => s + r.annual, 0)
  const totalProfit = p.disposals.reduce((s, r) => s + r.profit, 0)
  const totalContingent = p.contingent.reduce((s, r) => s + r.amount, 0)

  const Stat = ({ label, value, col }: { label: string; value: string; col?: string }) => (
    <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}><div className="text-[10px] uppercase tracking-wider" style={{ color: C.text4 }}>{label}</div><div className="text-xl font-black mt-1" style={{ color: col || C.text }}>{value}</div></div>
  )

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: C.text }}><ArrowRightLeft size={18} style={{ color: p.accent }} /> Player Trading & Amortisation Ledger</h2>
        <p className="text-sm mt-1 max-w-2xl" style={{ color: C.text3 }}>{name} — transfer-fee amortisation, registration book values, profit on disposal and contingent add-on liabilities.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Net book value (squad)" value={p.money(totalNbv)} />
        <Stat label="Annual amortisation" value={p.money(totalAnnual)} col={p.accentLt} />
        <Stat label="Profit on disposals (YTD)" value={p.money(totalProfit)} col={C.good} />
        <Stat label="Contingent liabilities" value={p.money(totalContingent)} col={C.amber} />
      </div>

      <div className="flex gap-1 border-b overflow-x-auto" style={{ borderColor: C.border }}>
        {TABS.map(([id, label]) => (<button key={id} onClick={() => setTab(id)} className="px-4 py-2 text-xs font-semibold -mb-px whitespace-nowrap" style={{ borderBottom: `2px solid ${tab === id ? p.accent : 'transparent'}`, color: tab === id ? p.accentLt : C.text4 }}>{label}</button>))}
      </div>

      {tab === 'book' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <table className="w-full text-xs"><thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>{['Player', 'Transfer fee', 'Signed', 'Term (yrs)', 'Net book value'].map(h => <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
            <tbody>{p.regs.map((r, i) => (<tr key={i} style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{r.player}</td><td className="px-4 py-2.5 font-mono" style={{ color: C.text3 }}>{p.money(r.cost)}</td><td className="px-4 py-2.5" style={{ color: C.text4 }}>{r.signed}</td><td className="px-4 py-2.5" style={{ color: C.text4 }}>{r.term}</td><td className="px-4 py-2.5 font-mono font-semibold" style={{ color: p.accentLt }}>{p.money(r.nbv)}</td></tr>))}</tbody>
            <tfoot><tr style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-bold" style={{ color: C.text }}>Total</td><td colSpan={3}></td><td className="px-4 py-2.5 font-mono font-bold" style={{ color: p.accentLt }}>{p.money(totalNbv)}</td></tr></tfoot>
          </table>
        </div>
      )}

      {tab === 'amort' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <table className="w-full text-xs"><thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>{['Player', 'Annual charge', 'Remaining NBV', 'Run-off'].map(h => <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
            <tbody>{p.regs.map((r, i) => { const yrsLeft = r.annual > 0 ? Math.round((r.nbv / r.annual) * 10) / 10 : 0; return (<tr key={i} style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{r.player}</td><td className="px-4 py-2.5 font-mono" style={{ color: C.text2 }}>{p.money(r.annual)}/yr</td><td className="px-4 py-2.5 font-mono" style={{ color: C.text3 }}>{p.money(r.nbv)}</td><td className="px-4 py-2.5"><span className="text-[11px]" style={{ color: yrsLeft <= 0.5 ? C.amber : C.text4 }}>{yrsLeft <= 0 ? 'Fully amortised' : `~${yrsLeft} yrs left`}</span></td></tr>) })}</tbody>
            <tfoot><tr style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-bold" style={{ color: C.text }}>Total annual charge</td><td className="px-4 py-2.5 font-mono font-bold" style={{ color: p.accentLt }}>{p.money(totalAnnual)}/yr</td><td colSpan={2}></td></tr></tfoot>
          </table>
          <div className="px-4 py-2.5 text-[10px]" style={{ borderTop: `1px solid ${C.border}`, color: C.text4 }}>{p.regimeNote}</div>
        </div>
      )}

      {tab === 'disposals' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <table className="w-full text-xs"><thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>{['Player', 'Sale fee', 'NBV at sale', 'Profit on disposal', 'Window'].map(h => <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
            <tbody>{p.disposals.map((r, i) => (<tr key={i} style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{r.player}</td><td className="px-4 py-2.5 font-mono" style={{ color: C.text3 }}>{p.money(r.fee)}</td><td className="px-4 py-2.5 font-mono" style={{ color: C.text4 }}>{p.money(r.nbv)}</td><td className="px-4 py-2.5 font-mono font-semibold" style={{ color: C.good }}>{p.money(r.profit)}</td><td className="px-4 py-2.5" style={{ color: C.text4 }}>{r.window}</td></tr>))}</tbody>
            <tfoot><tr style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-bold" style={{ color: C.text }}>Total profit</td><td colSpan={2}></td><td className="px-4 py-2.5 font-mono font-bold" style={{ color: C.good }}>{p.money(totalProfit)}</td><td></td></tr></tfoot>
          </table>
          <div className="px-4 py-2.5 text-[10px]" style={{ borderTop: `1px solid ${C.border}`, color: C.text4 }}>Profit on disposal recognised in full in the year of sale — a key lever for the rolling P&S / loss test.</div>
        </div>
      )}

      {tab === 'contingent' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <table className="w-full text-xs"><thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>{['Player', 'Trigger', 'Amount', 'Likelihood'].map(h => <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
            <tbody>{p.contingent.map((r, i) => (<tr key={i} style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{r.player}</td><td className="px-4 py-2.5" style={{ color: C.text3 }}>{r.trigger}</td><td className="px-4 py-2.5 font-mono font-semibold" style={{ color: C.amber }}>{p.money(r.amount)}</td><td className="px-4 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: r.likelihood === 'Probable' ? `${C.amber}1f` : `${C.text4}22`, color: r.likelihood === 'Probable' ? C.amber : C.text3 }}>{r.likelihood}</span></td></tr>))}</tbody>
            <tfoot><tr style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-bold" style={{ color: C.text }}>Total exposure</td><td></td><td className="px-4 py-2.5 font-mono font-bold" style={{ color: C.amber }}>{p.money(totalContingent)}</td><td></td></tr></tfoot>
          </table>
          <div className="px-4 py-2.5 text-[10px]" style={{ borderTop: `1px solid ${C.border}`, color: C.text4 }}>Add-on fees provided for when probable; tracked against transfer budget and the PSR / FSR position.</div>
        </div>
      )}

      <div className="rounded-xl p-3 text-[11px]" style={{ background: `${p.accent}12`, borderLeft: `3px solid ${p.accent}`, color: C.text2 }}>
        Demo — illustrative only. Fees, book values and add-on terms are invented demo values.
      </div>
    </div>
  )
}
