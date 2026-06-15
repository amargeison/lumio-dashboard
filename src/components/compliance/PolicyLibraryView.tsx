'use client'

import { useState } from 'react'
import { BookMarked } from 'lucide-react'

// Policy Library & Attestations — central versioned policy library, staff
// acknowledgement tracking, and the mandatory-training matrix. Shared;
// men's (blue) vs women's (pink). Demo only — illustrative.

type Variant = 'mens' | 'womens'
type RAG = 'green' | 'amber' | 'red'
type Tab = 'library' | 'attestations' | 'training'

interface Policy { name: string; cat: string; version: string; updated: string; review: string; status: RAG }
interface Attest { policy: string; pct: number; outstanding: number }
interface Course { course: string; pct: number; cadence: string }
interface Profile { accent: string; accentLt: string; clubName: string; headcount: number
  policies: Policy[]; attest: Attest[]; courses: Course[] }

const COMMON_POLICIES: Policy[] = [
  { name: 'Safeguarding & child protection', cat: 'People', version: 'v4.0', updated: 'Mar 2026', review: 'Mar 2027', status: 'green' },
  { name: 'Equality, diversity & inclusion', cat: 'Governance', version: 'v3.0', updated: 'Jan 2026', review: 'Jan 2027', status: 'green' },
  { name: 'Data protection & privacy', cat: 'Legal', version: 'v2.1', updated: 'Jan 2026', review: 'Jan 2027', status: 'green' },
  { name: 'Anti-corruption, betting & integrity', cat: 'Governance', version: 'v2.0', updated: 'Aug 2025', review: 'Aug 2026', status: 'amber' },
  { name: 'Health & safety policy', cat: 'Operations', version: 'v5.0', updated: 'Feb 2026', review: 'Feb 2027', status: 'green' },
  { name: 'Whistleblowing / speak-up', cat: 'Governance', version: 'v1.2', updated: 'Mar 2026', review: 'Mar 2027', status: 'green' },
  { name: 'Anti-money-laundering & KYC', cat: 'Legal', version: 'v1.1', updated: 'Sep 2025', review: 'Sep 2026', status: 'amber' },
  { name: 'Social media & code of conduct', cat: 'People', version: 'v3.1', updated: 'Feb 2026', review: 'Feb 2027', status: 'green' },
  { name: 'Modern slavery statement', cat: 'Legal', version: 'v2.0', updated: 'Dec 2025', review: 'Dec 2026', status: 'green' },
]

const MENS: Profile = {
  accent: '#003DA5', accentLt: '#60A5FA', clubName: 'Oakridge FC', headcount: 142,
  policies: COMMON_POLICIES,
  attest: [
    { policy: 'Safeguarding & child protection', pct: 96, outstanding: 6 },
    { policy: 'Equality, diversity & inclusion', pct: 91, outstanding: 13 },
    { policy: 'Data protection & privacy', pct: 88, outstanding: 17 },
    { policy: 'Anti-corruption & betting', pct: 100, outstanding: 0 },
    { policy: 'Health & safety', pct: 94, outstanding: 9 },
    { policy: 'Code of conduct', pct: 90, outstanding: 14 },
  ],
  courses: [
    { course: 'Safeguarding awareness', pct: 92, cadence: 'Every 3 yrs' },
    { course: 'EDI & unconscious bias', pct: 85, cadence: 'Annual' },
    { course: 'Data protection (GDPR)', pct: 88, cadence: 'Annual' },
    { course: 'Anti-corruption & betting', pct: 100, cadence: 'Annual (pre-season)' },
    { course: 'Health & safety induction', pct: 96, cadence: 'On hire + annual' },
  ],
}

const WOMENS: Profile = {
  accent: '#BE185D', accentLt: '#EC4899', clubName: 'Oakridge Women FC', headcount: 68,
  policies: COMMON_POLICIES,
  attest: [
    { policy: 'Safeguarding & child protection', pct: 97, outstanding: 2 },
    { policy: 'Equality, diversity & inclusion', pct: 94, outstanding: 4 },
    { policy: 'Data protection & privacy', pct: 90, outstanding: 7 },
    { policy: 'Anti-corruption & betting', pct: 100, outstanding: 0 },
    { policy: 'Health & safety', pct: 95, outstanding: 3 },
    { policy: 'Code of conduct', pct: 93, outstanding: 5 },
  ],
  courses: [
    { course: 'Safeguarding awareness', pct: 95, cadence: 'Every 3 yrs' },
    { course: 'EDI & unconscious bias', pct: 90, cadence: 'Annual' },
    { course: 'Data protection (GDPR)', pct: 90, cadence: 'Annual' },
    { course: 'Cycle-aware / welfare', pct: 90, cadence: 'Annual' },
    { course: 'Health & safety induction', pct: 95, cadence: 'On hire + annual' },
  ],
}

const C = { panel: '#0D1117', panelAlt: '#111318', border: '#1F2937', text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280', good: '#22C55E', amber: '#F59E0B', red: '#EF4444' }
const ragCol = (r: RAG) => r === 'green' ? C.good : r === 'amber' ? C.amber : C.red
const pctCol = (n: number) => n >= 95 ? C.good : n >= 85 ? C.amber : C.red
const TABS: [Tab, string][] = [['library', 'Policy Library'], ['attestations', 'Attestations'], ['training', 'Mandatory Training']]

export default function PolicyLibraryView({ variant, club }: { variant: Variant; club?: { name?: string } | null }) {
  const p = variant === 'mens' ? MENS : WOMENS
  const name = club?.name || p.clubName
  const [tab, setTab] = useState<Tab>('library')
  const dueReview = p.policies.filter(x => x.status !== 'green').length
  const avgAttest = Math.round(p.attest.reduce((s, a) => s + a.pct, 0) / p.attest.length)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: C.text }}><BookMarked size={18} style={{ color: p.accent }} /> Policy Library & Attestations</h2>
        <p className="text-sm mt-1 max-w-2xl" style={{ color: C.text3 }}>{name} — central versioned policy library, staff acknowledgements and the mandatory-training matrix.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}><div className="text-[10px] uppercase tracking-wider" style={{ color: C.text4 }}>Policies</div><div className="text-xl font-black mt-1" style={{ color: C.text }}>{p.policies.length}</div></div>
        <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}><div className="text-[10px] uppercase tracking-wider" style={{ color: C.text4 }}>Due for review</div><div className="text-xl font-black mt-1" style={{ color: dueReview ? C.amber : C.good }}>{dueReview}</div></div>
        <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}><div className="text-[10px] uppercase tracking-wider" style={{ color: C.text4 }}>Avg. attestation</div><div className="text-xl font-black mt-1" style={{ color: pctCol(avgAttest) }}>{avgAttest}%</div></div>
        <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}><div className="text-[10px] uppercase tracking-wider" style={{ color: C.text4 }}>Headcount</div><div className="text-xl font-black mt-1" style={{ color: C.text }}>{p.headcount}</div></div>
      </div>

      <div className="flex gap-1 border-b overflow-x-auto" style={{ borderColor: C.border }}>
        {TABS.map(([id, label]) => (<button key={id} onClick={() => setTab(id)} className="px-4 py-2 text-xs font-semibold -mb-px whitespace-nowrap" style={{ borderBottom: `2px solid ${tab === id ? p.accent : 'transparent'}`, color: tab === id ? p.accentLt : C.text4 }}>{label}</button>))}
      </div>

      {tab === 'library' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <table className="w-full text-xs"><thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>{['Policy', 'Category', 'Version', 'Updated', 'Next review', 'Status'].map(h => <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
            <tbody>{p.policies.map((r, i) => (<tr key={i} style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{r.name}</td><td className="px-4 py-2.5" style={{ color: C.text4 }}>{r.cat}</td><td className="px-4 py-2.5 font-mono" style={{ color: C.text3 }}>{r.version}</td><td className="px-4 py-2.5" style={{ color: C.text4 }}>{r.updated}</td><td className="px-4 py-2.5" style={{ color: C.text4 }}>{r.review}</td><td className="px-4 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${ragCol(r.status)}1f`, color: ragCol(r.status) }}>{r.status === 'green' ? 'Current' : 'Review due'}</span></td></tr>))}</tbody>
          </table>
        </div>
      )}

      {tab === 'attestations' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          {p.attest.map((a, i) => (
            <div key={i} className="px-5 py-3" style={{ borderBottom: i < p.attest.length - 1 ? `1px solid ${C.border}80` : undefined }}>
              <div className="flex items-center justify-between mb-1"><span className="text-xs font-semibold" style={{ color: C.text2 }}>{a.policy}</span><span className="text-[11px] font-bold" style={{ color: pctCol(a.pct) }}>{a.pct}% · {a.outstanding} outstanding</span></div>
              <div className="w-full rounded-full h-1.5" style={{ background: C.border }}><div className="h-1.5 rounded-full" style={{ width: `${a.pct}%`, background: pctCol(a.pct) }} /></div>
            </div>
          ))}
          <div className="px-5 py-2.5 text-[10px]" style={{ borderTop: `1px solid ${C.border}`, color: C.text4 }}>Staff acknowledge each policy on hire and on every material revision; outstanding counts auto-chase by email.</div>
        </div>
      )}

      {tab === 'training' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <table className="w-full text-xs"><thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>{['Mandatory course', 'Completion', 'Coverage', 'Cadence'].map(h => <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
            <tbody>{p.courses.map((c, i) => (<tr key={i} style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{c.course}</td><td className="px-4 py-2.5 font-bold" style={{ color: pctCol(c.pct) }}>{c.pct}%</td><td className="px-4 py-2.5"><div className="w-24 rounded-full h-1.5" style={{ background: C.border }}><div className="h-1.5 rounded-full" style={{ width: `${c.pct}%`, background: pctCol(c.pct) }} /></div></td><td className="px-4 py-2.5" style={{ color: C.text4 }}>{c.cadence}</td></tr>))}</tbody>
          </table>
        </div>
      )}

      <div className="rounded-xl p-3 text-[11px]" style={{ background: `${p.accent}12`, borderLeft: `3px solid ${p.accent}`, color: C.text2 }}>
        Demo — illustrative only. Policy versions, attestation rates and training percentages are invented demo values.
      </div>
    </div>
  )
}
