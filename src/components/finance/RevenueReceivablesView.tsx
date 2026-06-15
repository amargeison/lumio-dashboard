'use client'

import { useState } from 'react'
import { Receipt } from 'lucide-react'

// Revenue & Receivables. Revenue recognition by stream and aged debtors on
// sponsorship, broadcast and matchday. Shared; men's (blue) vs women's (pink).
// Demo only — illustrative.

type Variant = 'mens' | 'womens'
type Tab = 'recognition' | 'debtors' | 'invoices'

interface Stream { stream: string; annual: number; recognised: number; deferred: number }
interface Aged { customer: string; amount: number; bucket: string; status: 'green' | 'amber' | 'red' }
interface Invoice { ref: string; customer: string; amount: number; due: string; status: string }
interface Profile { accent: string; accentLt: string; clubName: string; money: (n: number) => string
  streams: Stream[]; aged: Aged[]; invoices: Invoice[] }

const MENS: Profile = {
  accent: '#003DA5', accentLt: '#60A5FA', clubName: 'Oakridge FC',
  money: (n) => '£' + n.toLocaleString('en-GB') + 'k',
  streams: [
    { stream: 'Broadcast & central distribution', annual: 14000, recognised: 10500, deferred: 3500 },
    { stream: 'Commercial & sponsorship', annual: 11000, recognised: 8250, deferred: 2750 },
    { stream: 'Matchday & season tickets', annual: 9000, recognised: 6750, deferred: 2250 },
    { stream: 'Retail & licensing', annual: 2400, recognised: 1800, deferred: 600 },
  ],
  aged: [
    { customer: 'Meridian Watches (principal sponsor)', amount: 150, bucket: '0–30 days', status: 'green' },
    { customer: 'Apex Performance (kit)', amount: 92, bucket: '31–60 days', status: 'amber' },
    { customer: 'Broadcast distribution (Q3)', amount: 3500, bucket: '0–30 days', status: 'green' },
    { customer: 'Northshore Brewing (stadium)', amount: 48, bucket: '61–90 days', status: 'amber' },
    { customer: 'Hospitality — corporate (mixed)', amount: 36, bucket: '90+ days', status: 'red' },
  ],
  invoices: [
    { ref: 'INV-5521', customer: 'Meridian Watches', amount: 150, due: '30 Jun 2026', status: 'Open' },
    { ref: 'INV-5503', customer: 'Apex Performance', amount: 92, due: '12 Jun 2026', status: 'Overdue' },
    { ref: 'INV-5488', customer: 'Northshore Brewing', amount: 48, due: '02 Jun 2026', status: 'Overdue' },
  ],
}

const WOMENS: Profile = {
  accent: '#BE185D', accentLt: '#EC4899', clubName: 'Oakridge Women FC',
  money: (n) => '£' + n.toLocaleString('en-GB') + 'k',
  streams: [
    { stream: 'WSL / WPLL central distribution', annual: 900, recognised: 675, deferred: 225 },
    { stream: 'Commercial & sponsorship', annual: 720, recognised: 540, deferred: 180 },
    { stream: 'Matchday & season tickets', annual: 380, recognised: 285, deferred: 95 },
    { stream: 'Retail & licensing', annual: 140, recognised: 105, deferred: 35 },
  ],
  aged: [
    { customer: 'Apex Performance (kit)', amount: 24, bucket: '0–30 days', status: 'green' },
    { customer: 'Central distribution (Q3)', amount: 225, bucket: '0–30 days', status: 'green' },
    { customer: 'Local sponsor — Vanta Health', amount: 12, bucket: '31–60 days', status: 'amber' },
    { customer: 'Hospitality — corporate', amount: 6, bucket: '90+ days', status: 'red' },
  ],
  invoices: [
    { ref: 'INV-2208', customer: 'Apex Performance', amount: 24, due: '28 Jun 2026', status: 'Open' },
    { ref: 'INV-2194', customer: 'Vanta Health', amount: 12, due: '10 Jun 2026', status: 'Overdue' },
  ],
}

const C = { panel: '#0D1117', panelAlt: '#111318', border: '#1F2937', text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280', good: '#22C55E', amber: '#F59E0B', red: '#EF4444' }
const sCol = (s: 'green' | 'amber' | 'red') => s === 'green' ? C.good : s === 'amber' ? C.amber : C.red
const TABS: [Tab, string][] = [['recognition', 'Revenue Recognition'], ['debtors', 'Aged Debtors'], ['invoices', 'Open Invoices']]

export default function RevenueReceivablesView({ variant, club }: { variant: Variant; club?: { name?: string } | null }) {
  const p = variant === 'mens' ? MENS : WOMENS
  const name = club?.name || p.clubName
  const [tab, setTab] = useState<Tab>('recognition')
  const totalAnnual = p.streams.reduce((s, r) => s + r.annual, 0)
  const totalRecognised = p.streams.reduce((s, r) => s + r.recognised, 0)
  const totalDeferred = p.streams.reduce((s, r) => s + r.deferred, 0)
  const totalDebtors = p.aged.reduce((s, r) => s + r.amount, 0)
  const overdue = p.aged.filter(a => a.status === 'red').reduce((s, a) => s + a.amount, 0)

  const Stat = ({ label, value, col }: { label: string; value: string; col?: string }) => (
    <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}><div className="text-[10px] uppercase tracking-wider" style={{ color: C.text4 }}>{label}</div><div className="text-xl font-black mt-1" style={{ color: col || C.text }}>{value}</div></div>
  )

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: C.text }}><Receipt size={18} style={{ color: p.accent }} /> Revenue & Receivables</h2>
        <p className="text-sm mt-1 max-w-2xl" style={{ color: C.text3 }}>{name} — revenue recognition by stream, deferred income and aged debtors.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Annual revenue" value={p.money(totalAnnual)} />
        <Stat label="Recognised (YTD)" value={p.money(totalRecognised)} col={C.accentLt} />
        <Stat label="Deferred income" value={p.money(totalDeferred)} col={C.amber} />
        <Stat label="Debtors 90+ overdue" value={p.money(overdue)} col={overdue ? C.red : C.good} />
      </div>

      <div className="flex gap-1 border-b overflow-x-auto" style={{ borderColor: C.border }}>
        {TABS.map(([id, label]) => (<button key={id} onClick={() => setTab(id)} className="px-4 py-2 text-xs font-semibold -mb-px whitespace-nowrap" style={{ borderBottom: `2px solid ${tab === id ? p.accent : 'transparent'}`, color: tab === id ? p.accentLt : C.text4 }}>{label}</button>))}
      </div>

      {tab === 'recognition' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <table className="w-full text-xs"><thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>{['Revenue stream', 'Annual contracted', 'Recognised', 'Deferred'].map(h => <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
            <tbody>{p.streams.map((r, i) => (<tr key={i} style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{r.stream}</td><td className="px-4 py-2.5 font-mono" style={{ color: C.text3 }}>{p.money(r.annual)}</td><td className="px-4 py-2.5 font-mono font-semibold" style={{ color: C.good }}>{p.money(r.recognised)}</td><td className="px-4 py-2.5 font-mono" style={{ color: C.amber }}>{p.money(r.deferred)}</td></tr>))}</tbody>
            <tfoot><tr style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-bold" style={{ color: C.text }}>Total</td><td className="px-4 py-2.5 font-mono font-bold" style={{ color: C.text }}>{p.money(totalAnnual)}</td><td className="px-4 py-2.5 font-mono font-bold" style={{ color: C.good }}>{p.money(totalRecognised)}</td><td className="px-4 py-2.5 font-mono font-bold" style={{ color: C.amber }}>{p.money(totalDeferred)}</td></tr></tfoot>
          </table>
          <div className="px-4 py-2.5 text-[10px]" style={{ borderTop: `1px solid ${C.border}`, color: C.text4 }}>Sponsorship and broadcast recognised over the contract period; season-ticket income deferred and released per match.</div>
        </div>
      )}

      {tab === 'debtors' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <table className="w-full text-xs"><thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>{['Customer', 'Amount', 'Ageing', 'Status'].map(h => <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
            <tbody>{p.aged.map((a, i) => (<tr key={i} style={{ borderTop: `1px solid ${C.border}`, background: a.status === 'red' ? `${C.red}08` : undefined }}><td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{a.customer}</td><td className="px-4 py-2.5 font-mono font-semibold" style={{ color: C.text2 }}>{p.money(a.amount)}</td><td className="px-4 py-2.5" style={{ color: C.text4 }}>{a.bucket}</td><td className="px-4 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${sCol(a.status)}1f`, color: sCol(a.status) }}>{a.status === 'green' ? 'Current' : a.status === 'amber' ? 'Watch' : 'Chase'}</span></td></tr>))}</tbody>
            <tfoot><tr style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-bold" style={{ color: C.text }}>Total debtors</td><td className="px-4 py-2.5 font-mono font-bold" style={{ color: C.text }}>{p.money(totalDebtors)}</td><td colSpan={2}></td></tr></tfoot>
          </table>
        </div>
      )}

      {tab === 'invoices' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <table className="w-full text-xs"><thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>{['Invoice', 'Customer', 'Amount', 'Due', 'Status'].map(h => <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
            <tbody>{p.invoices.map((v, i) => (<tr key={i} style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-mono" style={{ color: C.text4 }}>{v.ref}</td><td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{v.customer}</td><td className="px-4 py-2.5 font-mono" style={{ color: C.text2 }}>{p.money(v.amount)}</td><td className="px-4 py-2.5 font-mono" style={{ color: C.text3 }}>{v.due}</td><td className="px-4 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: v.status === 'Open' ? `${C.good}1f` : `${C.red}1f`, color: v.status === 'Open' ? C.good : C.red }}>{v.status}</span></td></tr>))}</tbody>
          </table>
          <div className="px-4 py-2.5 text-[10px]" style={{ borderTop: `1px solid ${C.border}`, color: C.text4 }}>Overdue invoices auto-chase on a 7 / 14 / 30-day cadence before escalation.</div>
        </div>
      )}

      <div className="rounded-xl p-3 text-[11px]" style={{ background: `${p.accent}12`, borderLeft: `3px solid ${p.accent}`, color: C.text2 }}>
        Demo — illustrative only. Revenue figures, debtor balances and invoice references are invented demo values.
      </div>
    </div>
  )
}
