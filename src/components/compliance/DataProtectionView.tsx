'use client'

import { useState } from 'react'
import { Lock } from 'lucide-react'

// Data Protection & Information Governance (UK GDPR / DPA 2018). Record of
// processing (ROPA), subject-access requests, breach register, DPIAs, consent
// and retention. Shared; men's (blue) vs women's (pink). Demo only.

type Variant = 'mens' | 'womens'
type RAG = 'green' | 'amber' | 'red'
type Tab = 'ropa' | 'sars' | 'breaches' | 'dpia' | 'governance'

interface Ropa { activity: string; basis: string; special: boolean; retention: string; status: RAG }
interface Sar { ref: string; type: string; received: string; due: string; status: RAG }
interface Breach { ref: string; summary: string; date: string; severity: RAG; ico: string }
interface Dpia { name: string; status: RAG; note: string }
interface Gov { label: string; value: string; status: RAG }
interface Profile { accent: string; accentLt: string; accentDim: string; clubName: string
  stats: { label: string; value: string }[]; ropa: Ropa[]; sars: Sar[]; breaches: Breach[]; dpias: Dpia[]; gov: Gov[] }

const COMMON_ROPA = (special = true): Ropa[] => ([
  { activity: 'Player medical & injury records', basis: 'Legitimate interest + explicit consent', special: special, retention: '6 yrs post-contract', status: 'green' },
  { activity: 'Player performance / GPS data', basis: 'Contract', special: false, retention: '5 yrs', status: 'green' },
  { activity: 'Staff HR & payroll', basis: 'Contract / legal obligation', special: true, retention: '7 yrs', status: 'green' },
  { activity: 'Season-ticket & fan CRM', basis: 'Contract / legitimate interest', special: false, retention: '3 yrs inactive', status: 'amber' },
  { activity: 'Academy minors & guardians', basis: 'Consent (guardian)', special: true, retention: 'Age 25', status: 'green' },
  { activity: 'CCTV / stadium safety', basis: 'Legitimate interest (safety)', special: false, retention: '31 days', status: 'green' },
  { activity: 'Marketing & ticketing analytics', basis: 'Consent', special: false, retention: 'Until withdrawn', status: 'amber' },
])

const MENS: Profile = {
  accent: '#003DA5', accentLt: '#60A5FA', accentDim: 'rgba(37,99,235,0.14)', clubName: 'Oakridge FC',
  stats: [
    { label: 'ROPA entries', value: '34' },
    { label: 'Open SARs', value: '2' },
    { label: 'Breaches (12 mo)', value: '1 minor' },
    { label: 'GDPR training', value: '88%' },
  ],
  ropa: COMMON_ROPA(),
  sars: [
    { ref: 'SAR-2026-014', type: 'Former player', received: '20 May 2026', due: '17 Jun 2026', status: 'amber' },
    { ref: 'SAR-2026-013', type: 'Season-ticket holder', received: '12 May 2026', due: '09 Jun 2026', status: 'amber' },
    { ref: 'SAR-2026-011', type: 'Ex-employee', received: '02 Apr 2026', due: '30 Apr 2026', status: 'green' },
  ],
  breaches: [
    { ref: 'BR-2026-02', summary: 'Mis-addressed email — 1 fan record', date: '08 Mar 2026', severity: 'amber', ico: 'Logged — below ICO threshold' },
    { ref: 'BR-2025-07', summary: 'Lost club laptop — encrypted', date: '14 Nov 2025', severity: 'green', ico: 'No risk — encrypted, closed' },
  ],
  dpias: [
    { name: 'GPS / wearable player tracking', status: 'green', note: 'Completed — residual risk low' },
    { name: 'Facial-recognition turnstile trial', status: 'amber', note: 'In progress — high-risk, consult stage' },
    { name: 'Fan CRM marketing automation', status: 'green', note: 'Completed — consent controls added' },
  ],
  gov: [
    { label: 'ICO registration', value: 'Current — renews Sep 2026', status: 'green' },
    { label: 'Data Protection lead', value: 'Company Secretary (DPO function)', status: 'green' },
    { label: 'Privacy notices published', value: 'Player, staff, fan, academy', status: 'green' },
    { label: 'Retention schedule', value: 'v2 — reviewed Jan 2026', status: 'green' },
    { label: 'Processor agreements (DPAs)', value: '3 of 28 outstanding', status: 'amber' },
  ],
}

const WOMENS: Profile = {
  accent: '#BE185D', accentLt: '#EC4899', accentDim: 'rgba(236,72,153,0.12)', clubName: 'Oakridge Women FC',
  stats: [
    { label: 'ROPA entries', value: '28' },
    { label: 'Open SARs', value: '1' },
    { label: 'Breaches (12 mo)', value: '0' },
    { label: 'GDPR training', value: '90%' },
  ],
  ropa: COMMON_ROPA(),
  sars: [
    { ref: 'SAR-2026-006', type: 'Former player', received: '18 May 2026', due: '15 Jun 2026', status: 'amber' },
    { ref: 'SAR-2026-004', type: 'Season-ticket holder', received: '01 Apr 2026', due: '29 Apr 2026', status: 'green' },
  ],
  breaches: [
    { ref: 'BR-2025-09', summary: 'Mis-sent welfare email — corrected same day', date: '21 Dec 2025', severity: 'green', ico: 'No risk — recalled, closed' },
  ],
  dpias: [
    { name: 'Cycle-tracking welfare programme', status: 'green', note: 'Completed — explicit opt-in consent, anonymised' },
    { name: 'GPS / wearable player tracking', status: 'green', note: 'Completed — residual risk low' },
    { name: 'Academy minors data review', status: 'amber', note: 'In progress — guardian consent refresh' },
  ],
  gov: [
    { label: 'ICO registration', value: 'Current — renews Sep 2026', status: 'green' },
    { label: 'Data Protection lead', value: 'Managing Director (DPO function)', status: 'green' },
    { label: 'Privacy notices published', value: 'Player, staff, fan, academy', status: 'green' },
    { label: 'Retention schedule', value: 'v2 — reviewed Jan 2026', status: 'green' },
    { label: 'Processor agreements (DPAs)', value: '2 of 19 outstanding', status: 'amber' },
  ],
}

const C = {
  panel: '#0D1117', panelAlt: '#111318', border: '#1F2937',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280',
  good: '#22C55E', amber: '#F59E0B', red: '#EF4444',
}
const ragCol = (r: RAG) => r === 'green' ? C.good : r === 'amber' ? C.amber : C.red
const TABS: [Tab, string][] = [['ropa', 'Record of Processing'], ['sars', 'Subject Access'], ['breaches', 'Breach Register'], ['dpia', 'DPIAs'], ['governance', 'Governance']]

export default function DataProtectionView({ variant, club }: { variant: Variant; club?: { name?: string } | null }) {
  const p = variant === 'mens' ? MENS : WOMENS
  const name = club?.name || p.clubName
  const [tab, setTab] = useState<Tab>('ropa')

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: C.text }}><Lock size={18} style={{ color: p.accent }} /> Data Protection & Information Governance</h2>
        <p className="text-sm mt-1 max-w-2xl" style={{ color: C.text3 }}>{name} — UK GDPR / Data Protection Act 2018. Processing records, subject rights, breaches and governance.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {p.stats.map((s, i) => (
          <div key={i} className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}><div className="text-[10px] uppercase tracking-wider" style={{ color: C.text4 }}>{s.label}</div><div className="text-xl font-black mt-1" style={{ color: C.text }}>{s.value}</div></div>
        ))}
      </div>

      <div className="flex gap-1 border-b overflow-x-auto" style={{ borderColor: C.border }}>
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className="px-4 py-2 text-xs font-semibold -mb-px whitespace-nowrap" style={{ borderBottom: `2px solid ${tab === id ? p.accent : 'transparent'}`, color: tab === id ? p.accentLt : C.text4 }}>{label}</button>
        ))}
      </div>

      {tab === 'ropa' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <table className="w-full text-xs"><thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>{['Processing activity', 'Lawful basis', 'Special category', 'Retention', 'Status'].map(h => <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
            <tbody>{p.ropa.map((r, i) => (<tr key={i} style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{r.activity}</td><td className="px-4 py-2.5" style={{ color: C.text3 }}>{r.basis}</td><td className="px-4 py-2.5">{r.special ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${p.accent}22`, color: p.accentLt }}>Special</span> : <span className="text-[10px]" style={{ color: C.text4 }}>—</span>}</td><td className="px-4 py-2.5" style={{ color: C.text4 }}>{r.retention}</td><td className="px-4 py-2.5"><span className="w-2 h-2 rounded-full inline-block" style={{ background: ragCol(r.status) }} /></td></tr>))}</tbody>
          </table>
        </div>
      )}

      {tab === 'sars' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <table className="w-full text-xs"><thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>{['Reference', 'Requester type', 'Received', 'Statutory due', 'Status'].map(h => <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
            <tbody>{p.sars.map((r, i) => (<tr key={i} style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-mono font-semibold" style={{ color: C.text }}>{r.ref}</td><td className="px-4 py-2.5" style={{ color: C.text3 }}>{r.type}</td><td className="px-4 py-2.5 font-mono" style={{ color: C.text4 }}>{r.received}</td><td className="px-4 py-2.5 font-mono" style={{ color: C.text3 }}>{r.due}</td><td className="px-4 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${ragCol(r.status)}1f`, color: ragCol(r.status) }}>{r.status === 'green' ? 'Closed' : 'In time'}</span></td></tr>))}</tbody>
          </table>
          <div className="px-4 py-2.5 text-[10px]" style={{ borderTop: `1px solid ${C.border}`, color: C.text4 }}>One calendar month to respond (extendable to 3 for complex requests).</div>
        </div>
      )}

      {tab === 'breaches' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <table className="w-full text-xs"><thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>{['Reference', 'Summary', 'Date', 'Severity', 'ICO assessment'].map(h => <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
            <tbody>{p.breaches.map((r, i) => (<tr key={i} style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-mono font-semibold" style={{ color: C.text }}>{r.ref}</td><td className="px-4 py-2.5" style={{ color: C.text2 }}>{r.summary}</td><td className="px-4 py-2.5 font-mono" style={{ color: C.text4 }}>{r.date}</td><td className="px-4 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${ragCol(r.severity)}1f`, color: ragCol(r.severity) }}>{r.severity === 'green' ? 'Low' : r.severity === 'amber' ? 'Medium' : 'High'}</span></td><td className="px-4 py-2.5" style={{ color: C.text3 }}>{r.ico}</td></tr>))}</tbody>
          </table>
          <div className="px-4 py-2.5 text-[10px]" style={{ borderTop: `1px solid ${C.border}`, color: C.text4 }}>Reportable breaches must reach the ICO within 72 hours. None met the reporting threshold.</div>
        </div>
      )}

      {tab === 'dpia' && (
        <div className="space-y-2">{p.dpias.map((d, i) => (
          <div key={i} className="rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap" style={{ backgroundColor: C.panel, border: `1px solid ${ragCol(d.status)}33` }}>
            <div><div className="text-sm font-semibold" style={{ color: C.text }}>{d.name}</div><div className="text-[11px] mt-0.5" style={{ color: C.text4 }}>{d.note}</div></div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${ragCol(d.status)}1f`, color: ragCol(d.status) }}>{d.status === 'green' ? 'Complete' : 'In progress'}</span>
          </div>
        ))}</div>
      )}

      {tab === 'governance' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          {p.gov.map((g, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3" style={{ borderBottom: i < p.gov.length - 1 ? `1px solid ${C.border}80` : undefined }}>
              <span className="text-xs font-semibold" style={{ color: C.text2 }}>{g.label}</span>
              <div className="flex items-center gap-2"><span className="text-[11px]" style={{ color: C.text3 }}>{g.value}</span><span className="w-2 h-2 rounded-full" style={{ background: ragCol(g.status) }} /></div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl p-3 text-[11px]" style={{ background: `${p.accent}12`, borderLeft: `3px solid ${p.accent}`, color: C.text2 }}>
        Demo — illustrative only. Processing records, SAR references, breach logs and dates are invented demo values.
      </div>
    </div>
  )
}
