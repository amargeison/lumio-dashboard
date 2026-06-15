'use client'

import { useState } from 'react'
import { FileCheck2 } from 'lucide-react'

// Registration & Transfer Compliance. Squad registration status, GBE / work-
// permit tracking, international clearances (ITC/TMS), intermediary fee
// disclosure, and prohibited-practice checks (TPO, bridge transfers,
// solidarity & training compensation). Shared; men's (GBE-heavy, EFL/PL) vs
// women's (WPLL, fewer internationals). Demo only — illustrative.

type Variant = 'mens' | 'womens'
type RAG = 'green' | 'amber' | 'red'
type Tab = 'squad' | 'permits' | 'clearances' | 'intermediaries' | 'checks'

interface Reg { name: string; pos: string; status: RAG; note: string }
interface Permit { name: string; route: string; status: RAG; detail: string }
interface Clearance { player: string; move: string; date: string; status: RAG }
interface Intermediary { deal: string; agent: string; fee: string; disclosed: boolean }
interface Check { label: string; status: RAG; note: string }
interface Profile {
  accent: string; accentLt: string; accentDim: string; clubName: string; regime: string
  stats: { label: string; value: string; col?: 'good' | 'amber' | 'text' }[]
  reg: Reg[]; permits: Permit[]; clearances: Clearance[]; intermediaries: Intermediary[]; checks: Check[]
  permitsTitle: string; permitsBlurb: string
}

const MENS: Profile = {
  accent: '#003DA5', accentLt: '#60A5FA', accentDim: 'rgba(37,99,235,0.14)',
  clubName: 'Oakridge FC', regime: 'EFL / Premier League registration · GBE · FIFA TMS',
  stats: [
    { label: 'Squad registered', value: '25 / 25', col: 'good' },
    { label: 'GBE / work permits', value: '4 active', col: 'text' },
    { label: 'Open transfers', value: '2', col: 'amber' },
    { label: 'Intermediary spend (YTD)', value: '£1.8m', col: 'text' },
  ],
  reg: [
    { name: 'Dean Morris', pos: 'LW', status: 'green', note: 'Registered — EFL squad list A' },
    { name: 'Sam Porter', pos: 'ST', status: 'green', note: 'Registered — homegrown' },
    { name: 'Chris Nwosu', pos: 'ST', status: 'green', note: 'Registered — GBE (auto pass)' },
    { name: 'Lucas Vidal', pos: 'CM', status: 'amber', note: 'ITC pending from Liga overseas FA' },
    { name: 'Academy U21 (8)', pos: '—', status: 'green', note: 'Registered — under-21 list' },
  ],
  permits: [
    { name: 'Chris Nwosu', route: 'GBE — Auto pass', status: 'green', detail: 'Senior international appearances ≥ threshold' },
    { name: 'Lucas Vidal', route: 'GBE — Points', status: 'amber', detail: '14 points — Exceptions Panel review booked' },
    { name: 'Kwame Boateng', route: 'GBE — Points', status: 'green', detail: '17 points — auto pass' },
    { name: 'Diego Santos', route: 'GBE — Auto pass', status: 'green', detail: 'Continental minutes ≥ threshold' },
  ],
  clearances: [
    { player: 'Lucas Vidal', move: 'In — overseas FA', date: '28 Aug 2026', status: 'amber' },
    { player: 'Tom Fletcher', move: 'Out — loan (domestic)', date: '14 Aug 2026', status: 'green' },
    { player: 'Diego Santos', move: 'In — overseas FA', date: '02 Jul 2026', status: 'green' },
  ],
  intermediaries: [
    { deal: 'Lucas Vidal — permanent', agent: 'Apex Football Mgmt', fee: '£640k', disclosed: true },
    { deal: 'Diego Santos — permanent', agent: 'Meridian Sports', fee: '£820k', disclosed: true },
    { deal: 'Tom Fletcher — loan', agent: 'In-house', fee: '£0', disclosed: true },
  ],
  checks: [
    { label: 'Third-party ownership (TPO)', status: 'green', note: 'No TPO interests — declarations on file' },
    { label: 'Bridge-transfer screening', status: 'green', note: 'No flagged intermediary chains' },
    { label: 'Solidarity & training compensation', status: 'amber', note: 'Diego Santos — solidarity payment due to 2 training clubs' },
    { label: 'Agent fee cap (FIFA reg.)', status: 'green', note: 'All within disclosed-cap thresholds' },
    { label: 'Minors (FIFA Art. 19)', status: 'green', note: 'No international minor transfers' },
  ],
  permitsTitle: 'GBE / Work permits',
  permitsBlurb: 'Overseas players require a Governing Body Endorsement — auto-pass on international appearances, or a points score assessed by the Exceptions Panel.',
}

const WOMENS: Profile = {
  accent: '#BE185D', accentLt: '#EC4899', accentDim: 'rgba(236,72,153,0.12)',
  clubName: 'Oakridge Women FC', regime: 'WPLL registration · GBE (women) · FIFA TMS',
  stats: [
    { label: 'Squad registered', value: '24 / 24', col: 'good' },
    { label: 'GBE / work permits', value: '3 active', col: 'text' },
    { label: 'Open transfers', value: '1', col: 'amber' },
    { label: 'Intermediary spend (YTD)', value: '£95k', col: 'text' },
  ],
  reg: [
    { name: 'Jade Osei', pos: 'ST', status: 'green', note: 'Registered — WPLL squad list' },
    { name: 'Lucy Whitmore (C)', pos: 'CM', status: 'green', note: 'Registered — homegrown' },
    { name: 'Aisha Diallo', pos: 'CB', status: 'green', note: 'Registered — GBE (auto pass)' },
    { name: 'Elin Johansson', pos: 'LW', status: 'amber', note: 'ITC pending from overseas FA' },
    { name: 'Academy / dual-reg (5)', pos: '—', status: 'green', note: 'Registered — dual-registration list' },
  ],
  permits: [
    { name: 'Aisha Diallo', route: 'GBE — Auto pass', status: 'green', detail: 'Senior international appearances ≥ threshold' },
    { name: 'Elin Johansson', route: 'GBE — Points', status: 'amber', detail: '13 points — Exceptions Panel review booked' },
    { name: 'María Fernández', route: 'GBE — Auto pass', status: 'green', detail: 'Continental minutes ≥ threshold' },
  ],
  clearances: [
    { player: 'Elin Johansson', move: 'In — overseas FA', date: '29 Aug 2026', status: 'amber' },
    { player: 'Niamh Gallagher', move: 'In — overseas FA', date: '10 Jul 2026', status: 'green' },
    { player: 'Beth Carter', move: 'Out — loan (domestic)', date: '12 Aug 2026', status: 'green' },
  ],
  intermediaries: [
    { deal: 'Elin Johansson — permanent', agent: 'Nordic Player Mgmt', fee: '£42k', disclosed: true },
    { deal: 'María Fernández — permanent', agent: 'Iberia Sports', fee: '£38k', disclosed: true },
    { deal: 'Beth Carter — loan', agent: 'In-house', fee: '£0', disclosed: true },
  ],
  checks: [
    { label: 'Third-party ownership (TPO)', status: 'green', note: 'No TPO interests — declarations on file' },
    { label: 'Bridge-transfer screening', status: 'green', note: 'No flagged intermediary chains' },
    { label: 'Solidarity & training compensation', status: 'green', note: 'No outstanding solidarity payments' },
    { label: 'Agent fee cap (FIFA reg.)', status: 'green', note: 'All within disclosed-cap thresholds' },
    { label: 'Minors (FIFA Art. 19)', status: 'green', note: 'No international minor transfers' },
  ],
  permitsTitle: 'GBE / Work permits (women)',
  permitsBlurb: 'Overseas players require a Governing Body Endorsement under the women’s criteria — auto-pass on international appearances, or a points score assessed by the Exceptions Panel.',
}

const C = {
  panel: '#0D1117', panelAlt: '#111318', border: '#1F2937',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280',
  good: '#22C55E', amber: '#F59E0B', red: '#EF4444',
}
const ragCol = (r: RAG) => r === 'green' ? C.good : r === 'amber' ? C.amber : C.red
const ragLabel = (r: RAG) => r === 'green' ? 'Clear' : r === 'amber' ? 'In progress' : 'Issue'
const TABS: [Tab, string][] = [['squad', 'Squad Registration'], ['permits', 'GBE / Permits'], ['clearances', 'Clearances (ITC)'], ['intermediaries', 'Intermediaries'], ['checks', 'Prohibited-Practice Checks']]

export default function RegistrationTransferView({ variant, club }: { variant: Variant; club?: { name?: string } | null }) {
  const p = variant === 'mens' ? MENS : WOMENS
  const name = club?.name || p.clubName
  const [tab, setTab] = useState<Tab>('squad')
  const colOf = (c?: string) => c === 'good' ? C.good : c === 'amber' ? C.amber : C.text

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: C.text }}><FileCheck2 size={18} style={{ color: p.accent }} /> Registration & Transfer Compliance</h2>
        <p className="text-sm mt-1 max-w-2xl" style={{ color: C.text3 }}>{name} — squad registration, work permits, international clearances and intermediary disclosure. Regime: {p.regime}.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {p.stats.map((s, i) => (
          <div key={i} className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}><div className="text-[10px] uppercase tracking-wider" style={{ color: C.text4 }}>{s.label}</div><div className="text-xl font-black mt-1" style={{ color: colOf(s.col) }}>{s.value}</div></div>
        ))}
      </div>

      <div className="flex gap-1 border-b overflow-x-auto" style={{ borderColor: C.border }}>
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className="px-4 py-2 text-xs font-semibold -mb-px whitespace-nowrap" style={{ borderBottom: `2px solid ${tab === id ? p.accent : 'transparent'}`, color: tab === id ? p.accentLt : C.text4 }}>{label}</button>
        ))}
      </div>

      {tab === 'squad' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <table className="w-full text-xs"><thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>{['Player', 'Pos', 'Registration status', 'Status'].map(h => <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
            <tbody>{p.reg.map((r, i) => (<tr key={i} style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{r.name}</td><td className="px-4 py-2.5" style={{ color: C.text4 }}>{r.pos}</td><td className="px-4 py-2.5" style={{ color: C.text3 }}>{r.note}</td><td className="px-4 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${ragCol(r.status)}1f`, color: ragCol(r.status) }}>{ragLabel(r.status)}</span></td></tr>))}</tbody>
          </table>
        </div>
      )}

      {tab === 'permits' && (
        <div className="space-y-3">
          <div className="rounded-xl p-4" style={{ backgroundColor: C.panelAlt, border: `1px solid ${C.border}` }}><div className="text-sm font-bold" style={{ color: C.text }}>{p.permitsTitle}</div><p className="text-xs mt-1" style={{ color: C.text4 }}>{p.permitsBlurb}</p></div>
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
            <table className="w-full text-xs"><thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>{['Player', 'Route', 'Detail', 'Status'].map(h => <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
              <tbody>{p.permits.map((r, i) => (<tr key={i} style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{r.name}</td><td className="px-4 py-2.5" style={{ color: C.text3 }}>{r.route}</td><td className="px-4 py-2.5" style={{ color: C.text4 }}>{r.detail}</td><td className="px-4 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${ragCol(r.status)}1f`, color: ragCol(r.status) }}>{ragLabel(r.status)}</span></td></tr>))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'clearances' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <table className="w-full text-xs"><thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>{['Player', 'Movement', 'Target date', 'Status'].map(h => <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
            <tbody>{p.clearances.map((r, i) => (<tr key={i} style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{r.player}</td><td className="px-4 py-2.5" style={{ color: C.text3 }}>{r.move}</td><td className="px-4 py-2.5 font-mono" style={{ color: C.text3 }}>{r.date}</td><td className="px-4 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${ragCol(r.status)}1f`, color: ragCol(r.status) }}>{r.status === 'green' ? 'Cleared' : 'Pending'}</span></td></tr>))}</tbody>
          </table>
          <div className="px-4 py-2.5 text-[10px]" style={{ borderTop: `1px solid ${C.border}`, color: C.text4 }}>International Transfer Certificates processed via FIFA TMS / Clearing House.</div>
        </div>
      )}

      {tab === 'intermediaries' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <table className="w-full text-xs"><thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>{['Transaction', 'Intermediary', 'Fee', 'Disclosed'].map(h => <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
            <tbody>{p.intermediaries.map((r, i) => (<tr key={i} style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{r.deal}</td><td className="px-4 py-2.5" style={{ color: C.text3 }}>{r.agent}</td><td className="px-4 py-2.5 font-mono font-semibold" style={{ color: p.accentLt }}>{r.fee}</td><td className="px-4 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: r.disclosed ? `${C.good}1f` : `${C.red}1f`, color: r.disclosed ? C.good : C.red }}>{r.disclosed ? 'Disclosed' : 'Outstanding'}</span></td></tr>))}</tbody>
          </table>
          <div className="px-4 py-2.5 text-[10px]" style={{ borderTop: `1px solid ${C.border}`, color: C.text4 }}>All intermediary dealings disclosed on each transaction per FIFA / FA agent regulations.</div>
        </div>
      )}

      {tab === 'checks' && (
        <div className="space-y-2">{p.checks.map((c, i) => (
          <div key={i} className="rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap" style={{ backgroundColor: C.panel, border: `1px solid ${ragCol(c.status)}33` }}>
            <div><div className="text-sm font-semibold" style={{ color: C.text }}>{c.label}</div><div className="text-[11px] mt-0.5" style={{ color: C.text4 }}>{c.note}</div></div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${ragCol(c.status)}1f`, color: ragCol(c.status) }}>{ragLabel(c.status)}</span>
          </div>
        ))}</div>
      )}

      <div className="rounded-xl p-3 text-[11px]" style={{ background: `${p.accent}12`, borderLeft: `3px solid ${p.accent}`, color: C.text2 }}>
        Demo — illustrative only. Player names, GBE points, fees and clearance dates are invented demo values.
      </div>
    </div>
  )
}
