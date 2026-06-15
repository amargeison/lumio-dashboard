'use client'

import { useState } from 'react'
import { ShieldAlert } from 'lucide-react'

// Safeguarding Operations — case management behind the Game Standards safeguarding
// framework. Concern/referral log, DBS-expiry tracker, training matrix, designated
// officers, reporting pathway. Shared; men's (blue) vs women's (pink). Demo only.

type Variant = 'mens' | 'womens'
type RAG = 'green' | 'amber' | 'red'
type Tab = 'cases' | 'dbs' | 'training' | 'officers'

interface Case { ref: string; area: string; opened: string; stage: string; level: RAG }
interface Dbs { group: string; valid: number; total: number; expiring: number }
interface Train { role: string; safeguarding: boolean; firstAid: boolean; mentalHealth: boolean; prevent: boolean }
interface Officer { name: string; role: string; contact: string }
interface Profile { accent: string; accentLt: string; clubName: string; stats: { label: string; value: string; col?: string }[]
  cases: Case[]; dbs: Dbs[]; training: Train[]; officers: Officer[] }

const MENS: Profile = {
  accent: '#003DA5', accentLt: '#60A5FA', clubName: 'Oakridge FC',
  stats: [{ label: 'DBS valid', value: '98%', col: 'good' }, { label: 'Open concerns', value: '2', col: 'amber' }, { label: 'Academy DSO', value: 'In post', col: 'good' }, { label: 'Training current', value: '92%', col: 'amber' }],
  cases: [
    { ref: 'SG-2026-09', area: 'Academy U16', opened: '02 May 2026', stage: 'Monitoring — external referral made', level: 'amber' },
    { ref: 'SG-2026-08', area: 'Community programme', opened: '18 Apr 2026', stage: 'Resolved — no further action', level: 'green' },
    { ref: 'SG-2026-05', area: 'Matchday / stewarding', opened: '11 Feb 2026', stage: 'Closed — policy reminder issued', level: 'green' },
  ],
  dbs: [
    { group: 'First-team staff', valid: 24, total: 24, expiring: 1 },
    { group: 'Academy staff & coaches', valid: 38, total: 40, expiring: 3 },
    { group: 'Matchday stewards', valid: 56, total: 58, expiring: 4 },
    { group: 'Community / Foundation', valid: 22, total: 22, expiring: 2 },
  ],
  training: [
    { role: 'First-team coaches', safeguarding: true, firstAid: true, mentalHealth: true, prevent: true },
    { role: 'Academy coaches', safeguarding: true, firstAid: true, mentalHealth: true, prevent: false },
    { role: 'Medical & physio', safeguarding: true, firstAid: true, mentalHealth: true, prevent: true },
    { role: 'Matchday stewards', safeguarding: true, firstAid: false, mentalHealth: false, prevent: true },
    { role: 'Community staff', safeguarding: true, firstAid: true, mentalHealth: false, prevent: true },
  ],
  officers: [
    { name: 'Karen Hughes', role: 'Designated Safeguarding Officer (Senior)', contact: 'dso@oakridgefc.demo' },
    { name: 'Paul Reeves', role: 'Academy Safeguarding Lead', contact: 'academy.safeguarding@oakridgefc.demo' },
    { name: 'Independent line', role: 'NSPCC / external reporting route', contact: 'Published in player & parent handbook' },
  ],
}

const WOMENS: Profile = {
  accent: '#BE185D', accentLt: '#EC4899', clubName: 'Oakridge Women FC',
  stats: [{ label: 'DBS valid', value: '96%', col: 'good' }, { label: 'Open concerns', value: '1', col: 'amber' }, { label: 'DSO', value: 'In post', col: 'good' }, { label: 'Training current', value: '95%', col: 'good' }],
  cases: [
    { ref: 'SG-2026-04', area: 'RTC / youth pathway', opened: '28 Apr 2026', stage: 'Monitoring — welfare plan in place', level: 'amber' },
    { ref: 'SG-2026-03', area: 'Community programme', opened: '06 Mar 2026', stage: 'Resolved — no further action', level: 'green' },
  ],
  dbs: [
    { group: 'First-team staff', valid: 22, total: 23, expiring: 1 },
    { group: 'RTC / academy staff', valid: 26, total: 27, expiring: 2 },
    { group: 'Matchday stewards', valid: 30, total: 31, expiring: 2 },
    { group: 'Community / Foundation', valid: 18, total: 18, expiring: 1 },
  ],
  training: [
    { role: 'First-team coaches', safeguarding: true, firstAid: true, mentalHealth: true, prevent: true },
    { role: 'RTC / academy coaches', safeguarding: true, firstAid: true, mentalHealth: true, prevent: false },
    { role: 'Medical & physio', safeguarding: true, firstAid: true, mentalHealth: true, prevent: true },
    { role: 'Matchday stewards', safeguarding: true, firstAid: false, mentalHealth: true, prevent: true },
    { role: 'Community staff', safeguarding: true, firstAid: true, mentalHealth: true, prevent: true },
  ],
  officers: [
    { name: 'Nina Walsh', role: 'Designated Safeguarding Officer (Senior)', contact: 'dso@oakridgewomen.demo' },
    { name: 'Sarah Martinez', role: 'Welfare Lead', contact: 'welfare@oakridgewomen.demo' },
    { name: 'Independent line', role: 'NSPCC / external reporting route', contact: 'Published in player & parent handbook' },
  ],
}

const C = { panel: '#0D1117', panelAlt: '#111318', border: '#1F2937', text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280', good: '#22C55E', amber: '#F59E0B', red: '#EF4444' }
const ragCol = (r: RAG) => r === 'green' ? C.good : r === 'amber' ? C.amber : C.red
const colOf = (c?: string) => c === 'good' ? C.good : c === 'amber' ? C.amber : C.text
const TABS: [Tab, string][] = [['cases', 'Concern / Referral Log'], ['dbs', 'DBS Register'], ['training', 'Training Matrix'], ['officers', 'Officers & Pathway']]
const Tick = ({ on }: { on: boolean }) => on ? <span style={{ color: C.good }}>✓</span> : <span style={{ color: C.text4 }}>—</span>

export default function SafeguardingOpsView({ variant, club }: { variant: Variant; club?: { name?: string } | null }) {
  const p = variant === 'mens' ? MENS : WOMENS
  const name = club?.name || p.clubName
  const [tab, setTab] = useState<Tab>('cases')

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: C.text }}><ShieldAlert size={18} style={{ color: p.accent }} /> Safeguarding Operations</h2>
        <p className="text-sm mt-1 max-w-2xl" style={{ color: C.text3 }}>{name} — concern & referral case management, DBS tracking and the training matrix behind the Game Standards safeguarding framework.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {p.stats.map((s, i) => (<div key={i} className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}><div className="text-[10px] uppercase tracking-wider" style={{ color: C.text4 }}>{s.label}</div><div className="text-xl font-black mt-1" style={{ color: colOf(s.col) }}>{s.value}</div></div>))}
      </div>

      <div className="flex gap-1 border-b overflow-x-auto" style={{ borderColor: C.border }}>
        {TABS.map(([id, label]) => (<button key={id} onClick={() => setTab(id)} className="px-4 py-2 text-xs font-semibold -mb-px whitespace-nowrap" style={{ borderBottom: `2px solid ${tab === id ? p.accent : 'transparent'}`, color: tab === id ? p.accentLt : C.text4 }}>{label}</button>))}
      </div>

      {tab === 'cases' && (
        <div className="space-y-2">{p.cases.map((c, i) => (
          <div key={i} className="rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap" style={{ backgroundColor: C.panel, border: `1px solid ${ragCol(c.level)}33` }}>
            <div><div className="flex items-center gap-2"><span className="font-mono text-[10px]" style={{ color: C.text4 }}>{c.ref}</span><span className="text-sm font-semibold" style={{ color: C.text }}>{c.area}</span></div><div className="text-[11px] mt-0.5" style={{ color: C.text4 }}>Opened {c.opened} · {c.stage}</div></div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${ragCol(c.level)}1f`, color: ragCol(c.level) }}>{c.level === 'green' ? 'Resolved' : c.level === 'amber' ? 'Active' : 'Escalated'}</span>
          </div>
        ))}
        <div className="rounded-xl p-3 text-[11px]" style={{ backgroundColor: C.panelAlt, border: `1px solid ${C.border}`, color: C.text4 }}>Confidential — case detail is access-controlled. Concerns route to the DSO and, where required, to the LADO / statutory agencies.</div>
        </div>
      )}

      {tab === 'dbs' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <table className="w-full text-xs"><thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>{['Staff group', 'Valid DBS', 'Coverage', 'Expiring (90 days)'].map(h => <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
            <tbody>{p.dbs.map((d, i) => { const pct = Math.round((d.valid / d.total) * 100); return (<tr key={i} style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{d.group}</td><td className="px-4 py-2.5" style={{ color: C.text3 }}>{d.valid} / {d.total}</td><td className="px-4 py-2.5"><div className="flex items-center gap-2"><div className="w-20 rounded-full h-1.5" style={{ background: C.border }}><div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: pct >= 98 ? C.good : C.amber }} /></div><span className="text-[10px]" style={{ color: C.text4 }}>{pct}%</span></div></td><td className="px-4 py-2.5"><span style={{ color: d.expiring > 2 ? C.amber : C.text3 }}>{d.expiring}</span></td></tr>) })}</tbody>
          </table>
          <div className="px-4 py-2.5 text-[10px]" style={{ borderTop: `1px solid ${C.border}`, color: C.text4 }}>Enhanced DBS with barred-list check for all regulated activity. Renewals auto-flagged 90 days out.</div>
        </div>
      )}

      {tab === 'training' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <table className="w-full text-xs"><thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>{['Role group', 'Safeguarding', 'First aid', 'Mental-health FA', 'Prevent'].map(h => <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
            <tbody>{p.training.map((t, i) => (<tr key={i} style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{t.role}</td><td className="px-4 py-2.5"><Tick on={t.safeguarding} /></td><td className="px-4 py-2.5"><Tick on={t.firstAid} /></td><td className="px-4 py-2.5"><Tick on={t.mentalHealth} /></td><td className="px-4 py-2.5"><Tick on={t.prevent} /></td></tr>))}</tbody>
          </table>
        </div>
      )}

      {tab === 'officers' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          {p.officers.map((o, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3.5 gap-3 flex-wrap" style={{ borderBottom: i < p.officers.length - 1 ? `1px solid ${C.border}80` : undefined }}>
              <div><div className="text-sm font-semibold" style={{ color: C.text }}>{o.name}</div><div className="text-[11px]" style={{ color: C.text4 }}>{o.role}</div></div>
              <span className="text-[11px] font-mono" style={{ color: p.accentLt }}>{o.contact}</span>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl p-3 text-[11px]" style={{ background: `${p.accent}12`, borderLeft: `3px solid ${p.accent}`, color: C.text2 }}>
        Demo — illustrative only. Case references, names, DBS counts and contacts are invented demo values. Real safeguarding case data is strictly access-controlled.
      </div>
    </div>
  )
}
