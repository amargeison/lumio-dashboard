'use client'

import { useState } from 'react'
import { Brain } from 'lucide-react'

// Mental Health — clinical support, confidential check-ins and referral pathway.
// Distinct from Mental Performance. Shared variant component: men's (blue) and
// women's (pink). Demo only — illustrative. Player detail is access-controlled.

type Variant = 'mens' | 'womens'
type RAG = 'green' | 'amber' | 'red'

const C = {
  panel: '#0D1117', panelAlt: '#111318', border: '#1F2937',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280',
  good: '#22C55E', amber: '#F59E0B', red: '#EF4444',
}
const rc = (r: RAG) => r === 'green' ? C.good : r === 'amber' ? C.amber : C.red

interface Checkin { ref: string; group: string; last: string; mood: number; sleep: number; flag: RAG; note: string }
interface Resource { name: string; type: string; detail: string }
interface Profile {
  accent: string; accentLt: string; accentDim: string; clubName: string
  stats: { label: string; value: string; sub: string; col: string }[]
  checkins: Checkin[]; resources: Resource[]
}

const PATHWAY = [
  { step: 'Self-referral or check-in flag', detail: 'Player, staff or anonymous app flag' },
  { step: 'Triage by welfare lead', detail: 'Within 24h · confidentiality maintained' },
  { step: 'Clinician assessment', detail: 'Club psychologist or external partner' },
  { step: 'Support plan', detail: 'Counselling, clinical referral, or watchful support' },
  { step: 'Review & step-down', detail: 'Regular review until resolved' },
]

const MENS: Profile = {
  accent: '#003DA5', accentLt: '#60A5FA', accentDim: 'rgba(37,99,235,0.14)', clubName: 'Oakridge FC',
  stats: [
    { label: 'Provider partnership', value: 'Active', sub: 'Sporting Chance + PFA', col: C.good },
    { label: 'Utilisation (12 mo)', value: '18%', sub: 'anonymous · squad + staff', col: C.text },
    { label: 'Check-in completion', value: '91%', sub: 'squad coverage', col: C.good },
    { label: 'Open flags', value: '2', sub: 'supported / monitored', col: C.amber },
  ],
  checkins: [
    { ref: 'Player A', group: 'First team', last: '2 days ago', mood: 6, sleep: 6, flag: 'amber', note: 'Form-related pressure; voluntary session booked' },
    { ref: 'Player B', group: 'First team', last: 'Yesterday', mood: 5, sleep: 5, flag: 'red', note: 'Recent bereavement — clinician-led support active' },
    { ref: 'Player C', group: 'Loanee', last: '4 days ago', mood: 7, sleep: 7, flag: 'amber', note: 'Relocation / isolation; buddy + check-in cadence raised' },
    { ref: 'Player D', group: 'Academy scholar', last: '1 day ago', mood: 8, sleep: 8, flag: 'green', note: 'Routine — no concerns' },
    { ref: 'Player E', group: 'First team', last: '3 days ago', mood: 8, sleep: 7, flag: 'green', note: 'Routine — no concerns' },
  ],
  resources: [
    { name: 'Sporting Chance Clinic', type: 'Clinical partner', detail: '24/7 confidential helpline + residential referral' },
    { name: 'PFA Wellbeing line', type: 'Union support', detail: 'Independent of the club · shared at signing' },
    { name: 'Club psychologist', type: 'In-house', detail: 'Dr R. Adeyemi — Tue/Thu confidential clinic' },
    { name: 'Mind partnership', type: 'Charity', detail: 'Education sessions + manager mental-health-first-aid training' },
  ],
}

const WOMENS: Profile = {
  accent: '#BE185D', accentLt: '#EC4899', accentDim: 'rgba(236,72,153,0.12)', clubName: 'Oakridge Women FC',
  stats: [
    { label: 'Provider partnership', value: 'Active', sub: 'Sporting Chance + PFA', col: C.good },
    { label: 'Utilisation (12 mo)', value: '21%', sub: 'anonymous · squad + staff', col: C.text },
    { label: 'Check-in completion', value: '92%', sub: 'squad coverage', col: C.good },
    { label: 'Open flags', value: '2', sub: 'supported / monitored', col: C.amber },
  ],
  checkins: [
    { ref: 'Player A', group: 'First team', last: '1 day ago', mood: 6, sleep: 6, flag: 'amber', note: 'Pre-match performance anxiety; weekly sessions with psychologist' },
    { ref: 'Player B', group: 'First team', last: '2 days ago', mood: 6, sleep: 6, flag: 'amber', note: 'Adjusting to rehab — welfare check-in scheduled' },
    { ref: 'Player C', group: 'Overseas signing', last: '3 days ago', mood: 7, sleep: 7, flag: 'amber', note: 'Relocation / homesickness; buddy + raised cadence' },
    { ref: 'Player D', group: 'First team', last: '1 day ago', mood: 8, sleep: 8, flag: 'green', note: 'Routine — no concerns' },
    { ref: 'Player E', group: 'Academy', last: '2 days ago', mood: 9, sleep: 8, flag: 'green', note: 'Routine — no concerns' },
  ],
  resources: [
    { name: 'Sporting Chance Clinic', type: 'Clinical partner', detail: '24/7 confidential helpline + residential referral' },
    { name: 'PFA Wellbeing line', type: 'Union support', detail: 'Independent of the club · shared at signing' },
    { name: 'Dr Anna Reid', type: 'In-house', detail: 'Performance psychologist — confidential clinic' },
    { name: 'Mind + Players Together', type: 'Charity / peer', detail: 'Education sessions + peer support network' },
  ],
}

export default function FootballMentalHealthView({ variant = 'mens', club }: { variant?: Variant; club?: { name?: string } | null }) {
  const p = variant === 'womens' ? WOMENS : MENS
  const name = club?.name || p.clubName
  const [tab, setTab] = useState<'overview' | 'checkins' | 'pathway'>('overview')
  const flags = p.checkins.filter(c => c.flag !== 'green').length

  const Stat = ({ label, value, sub, col }: { label: string; value: string; sub: string; col: string }) => (
    <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}><div className="text-[10px] uppercase tracking-wider" style={{ color: C.text4 }}>{label}</div><div className="text-xl font-black mt-1" style={{ color: col }}>{value}</div><div className="text-[10px] mt-0.5" style={{ color: C.text4 }}>{sub}</div></div>
  )
  const TABS: ['overview' | 'checkins' | 'pathway', string][] = [['overview', 'Overview'], ['checkins', 'Confidential Check-ins'], ['pathway', 'Referral Pathway']]

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: C.text }}><Brain size={18} style={{ color: p.accent }} /> Mental Health</h2>
        <p className="text-sm mt-1 max-w-2xl" style={{ color: C.text3 }}>{name} — clinical mental-health support, confidential check-ins and the referral pathway — distinct from on-pitch Mental Performance. Player detail is access-controlled and anonymised here.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {p.stats.map((s, i) => <Stat key={i} label={s.label} value={s.value} sub={s.sub} col={i === 3 ? (flags ? C.amber : C.good) : s.col} />)}
      </div>

      <div className="flex gap-1 border-b overflow-x-auto" style={{ borderColor: C.border }}>
        {TABS.map(([id, label]) => (<button key={id} onClick={() => setTab(id)} className="px-4 py-2 text-xs font-semibold -mb-px whitespace-nowrap" style={{ borderBottom: `2px solid ${tab === id ? p.accent : 'transparent'}`, color: tab === id ? p.accentLt : C.text4 }}>{label}</button>))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {p.resources.map((r, i) => (
            <div key={i} className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
              <div className="flex items-start justify-between gap-2 mb-1"><div className="text-sm font-bold" style={{ color: C.text }}>{r.name}</div><span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: p.accentDim, color: p.accentLt }}>{r.type}</span></div>
              <div className="text-[11px]" style={{ color: C.text3 }}>{r.detail}</div>
            </div>
          ))}
          <div className="md:col-span-2 rounded-xl p-3 text-[11px]" style={{ background: `${p.accent}12`, borderLeft: `3px solid ${p.accent}`, color: C.text2 }}>
            24/7 access available and player-controlled. Managers and senior staff trained in mental-health first aid; engagement is confidential and never affects selection.
          </div>
        </div>
      )}

      {tab === 'checkins' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <table className="w-full text-xs"><thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>{['Player (anon.)', 'Group', 'Last check-in', 'Mood', 'Sleep', 'Status'].map(h => <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
            <tbody>{p.checkins.map((c, i) => (<tr key={i} style={{ borderTop: `1px solid ${C.border}`, background: c.flag === 'red' ? `${C.red}08` : undefined }}><td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{c.ref}</td><td className="px-4 py-2.5" style={{ color: C.text4 }}>{c.group}</td><td className="px-4 py-2.5" style={{ color: C.text3 }}>{c.last}</td><td className="px-4 py-2.5" style={{ color: c.mood < 6 ? C.amber : C.text3 }}>{c.mood}/10</td><td className="px-4 py-2.5" style={{ color: c.sleep < 6 ? C.amber : C.text3 }}>{c.sleep}/10</td><td className="px-4 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${rc(c.flag)}1f`, color: rc(c.flag) }}>{c.flag === 'green' ? 'Routine' : c.flag === 'amber' ? 'Supported' : 'Priority'}</span></td></tr>))}</tbody>
          </table>
          <div className="px-4 py-2.5 text-[10px]" style={{ borderTop: `1px solid ${C.border}`, color: C.text4 }}>Players anonymised in this view. Full notes are restricted to the clinician and welfare lead under clinical confidentiality.</div>
        </div>
      )}

      {tab === 'pathway' && (
        <div className="rounded-xl p-5" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: C.text }}>Referral & support pathway</h3>
          <div className="space-y-0">{PATHWAY.map((s, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center"><div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: p.accentDim, color: p.accentLt, border: `1px solid ${p.accent}55` }}>{i + 1}</div>{i < PATHWAY.length - 1 && <div className="w-px flex-1 my-1" style={{ background: C.border }} />}</div>
              <div className="pb-4"><div className="text-sm font-semibold" style={{ color: C.text }}>{s.step}</div><div className="text-[11px] mt-0.5" style={{ color: C.text4 }}>{s.detail}</div></div>
            </div>
          ))}</div>
        </div>
      )}

      <div className="rounded-xl p-3 text-[11px]" style={{ background: `${p.accent}12`, borderLeft: `3px solid ${p.accent}`, color: C.text2 }}>
        Demo — illustrative only. Utilisation, check-ins and flags are invented demo values. This is a sensitive area; if you or someone you support is struggling, contact a GP or a helpline such as Samaritans (116 123).
      </div>
    </div>
  )
}
