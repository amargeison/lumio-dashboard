'use client'

import { useState } from 'react'
import { ShieldCheck, FileText, ExternalLink, Upload, CheckSquare } from 'lucide-react'

// Men's Pro — Game Standards. Premier League / EFL frameworks: EDI Standard,
// governance & ODT, fan engagement (Football Governance Act), safeguarding,
// integrity. Matches the women's depth: aggregate tracker, per-framework
// criteria with evidence + last-reviewed + owner, outstanding-actions and
// key-evidence panels per framework, and a full Resources tab (external
// research cards + internal club-evidence table + upload). Demo only.

const C = {
  panel: '#0D1117', panelAlt: '#111318', panel2: '#0D0F14', border: '#1F2937',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280',
  blue: '#003DA5', blueLt: '#60A5FA', accent: '#2563EB',
  good: '#22C55E', amber: '#F59E0B', red: '#EF4444',
  accentDim: 'rgba(37,99,235,0.14)', goodDim: 'rgba(34,197,94,0.15)', warnDim: 'rgba(245,158,11,0.15)',
}
type RAG = 'green' | 'amber' | 'red'
const ragCol = (r: RAG) => r === 'green' ? C.good : r === 'amber' ? C.amber : C.red
const ragLabel = (r: RAG) => r === 'green' ? 'On track' : r === 'amber' ? 'In progress' : 'At risk'

type Crit = { label: string; status: RAG; note: string; evidence: string; reviewed: string }
type Action = { txt: string; done: boolean }
type Framework = { id: string; name: string; short: string; status: RAG; summary: string; owner: string; reviewed: string; criteria: Crit[]; actions: Action[] }

const FRAMEWORKS: Framework[] = [
  { id: 'edi', name: 'Equality, Diversity & Inclusion Standard', short: 'Equality', status: 'amber', owner: 'Head of EDI', reviewed: '12 Mar 2026',
    summary: 'Premier League / EFL EDI Standard — working toward Advanced level.',
    criteria: [
      { label: 'EDI Standard level', status: 'amber', note: 'Intermediate held; Advanced submission in preparation', evidence: 'Standard assessment 2025', reviewed: 'Mar 2026' },
      { label: 'Board diversity ≥ 30%', status: 'amber', note: 'Currently 22% — recruitment plan in place', evidence: 'Board composition register', reviewed: 'Mar 2026' },
      { label: 'Published EDI action plan', status: 'green', note: 'Refreshed annually, board-approved', evidence: 'EDI action plan v3', reviewed: 'Jan 2026' },
      { label: 'Workforce diversity monitoring', status: 'green', note: 'Annual return submitted', evidence: 'Workforce data return', reviewed: 'Feb 2026' },
      { label: 'Inclusive fan & community campaigns', status: 'green', note: 'Rainbow Laces, No Room For Racism delivered', evidence: 'Campaign log', reviewed: 'Mar 2026' },
    ],
    actions: [
      { txt: 'Submit EDI Standard Advanced-level assessment', done: false },
      { txt: 'Reach 30% board diversity via recruitment plan', done: false },
      { txt: 'File annual workforce diversity return', done: true },
    ] },
  { id: 'gov', name: 'Governance & Owners’ / Directors’ Test', short: 'Governance', status: 'green', owner: 'Club Secretary', reviewed: '04 Apr 2026',
    summary: 'Ownership suitability, board independence and governance review.',
    criteria: [
      { label: "Owners' & Directors' Test current", status: 'green', note: 'All declarations filed & up to date', evidence: 'ODT declarations', reviewed: 'Apr 2026' },
      { label: 'Independent non-executive directors', status: 'green', note: '2 INEDs on the board', evidence: 'Board register', reviewed: 'Apr 2026' },
      { label: 'Annual governance review', status: 'green', note: 'Completed; actions tracked', evidence: 'Governance review 2026', reviewed: 'Mar 2026' },
      { label: 'Whistleblowing & conflicts policy', status: 'green', note: 'In place, reviewed Mar 2026', evidence: 'Policy register', reviewed: 'Mar 2026' },
    ],
    actions: [
      { txt: 'Close out 2026 governance-review action items', done: true },
      { txt: 'Refresh conflicts-of-interest declarations', done: true },
    ] },
  { id: 'fans', name: 'Fan Engagement & Heritage', short: 'Fan', status: 'amber', owner: 'Supporter Liaison Officer', reviewed: '28 Mar 2026',
    summary: 'Football Governance Act — supporter voice and heritage protections.',
    criteria: [
      { label: 'Fan advisory board established', status: 'green', note: 'Quarterly meetings with the board', evidence: 'FAB minutes', reviewed: 'Mar 2026' },
      { label: 'Supporter representation at board level', status: 'amber', note: 'Shadow board agreed; rep appointment in progress', evidence: 'Board resolution', reviewed: 'Mar 2026' },
      { label: 'Heritage protection (crest, colours, name)', status: 'green', note: 'Locked in club articles', evidence: 'Articles of association', reviewed: 'Jan 2026' },
      { label: 'Annual supporter consultation', status: 'green', note: 'Ticketing, kit, matchday surveyed', evidence: 'Fan survey 2026', reviewed: 'Feb 2026' },
      { label: 'Matchday accessibility (CAFE)', status: 'amber', note: 'Audit actions outstanding on East Stand', evidence: 'CAFE audit', reviewed: 'Mar 2026' },
    ],
    actions: [
      { txt: 'Appoint supporter representative to the shadow board', done: false },
      { txt: 'Close East Stand CAFE accessibility actions', done: false },
      { txt: 'Publish annual fan-engagement report', done: true },
    ] },
  { id: 'safe', name: 'Safeguarding', short: 'Safeguarding', status: 'green', owner: 'Designated Safeguarding Officer', reviewed: '15 Mar 2026',
    summary: 'FA safeguarding standards across first team, academy and community.',
    criteria: [
      { label: 'Designated Safeguarding Officer in post', status: 'green', note: 'Full-time, FA-trained', evidence: 'Appointment + cert', reviewed: 'Mar 2026' },
      { label: 'DBS checks current', status: 'green', note: '98% — 2 renewals in progress', evidence: 'DBS register', reviewed: 'Mar 2026' },
      { label: 'Academy safeguarding audit', status: 'green', note: 'EPPP audit passed', evidence: 'EPPP audit', reviewed: 'Feb 2026' },
      { label: 'Mental-health first-aiders', status: 'green', note: '6 trained across departments', evidence: 'Training log', reviewed: 'Jan 2026' },
      { label: 'Clear reporting & referral pathway', status: 'green', note: 'Published; independent line available', evidence: 'Safeguarding policy', reviewed: 'Mar 2026' },
    ],
    actions: [
      { txt: 'Complete 2 outstanding DBS renewals', done: false },
      { txt: 'Annual safeguarding policy review & board sign-off', done: true },
    ] },
  { id: 'integrity', name: 'Integrity & Conduct', short: 'Integrity', status: 'green', owner: 'Club Secretary', reviewed: '02 Apr 2026',
    summary: 'Anti-corruption, betting rules and FA Rule E / K compliance.',
    criteria: [
      { label: 'Anti-corruption & betting education', status: 'green', note: 'Squad & staff trained pre-season', evidence: 'Education log', reviewed: 'Aug 2025' },
      { label: 'FA Rule E / K compliance', status: 'green', note: 'No live cases', evidence: 'Compliance register', reviewed: 'Apr 2026' },
      { label: 'Agent / intermediary dealings logged', status: 'green', note: 'Disclosed on each transaction', evidence: 'Intermediary returns', reviewed: 'Apr 2026' },
      { label: 'Equality in recruitment (Football Code)', status: 'green', note: 'Adopted for coaching appointments', evidence: 'Recruitment policy', reviewed: 'Feb 2026' },
    ],
    actions: [
      { txt: 'Deliver pre-season anti-corruption & betting refresher', done: true },
      { txt: 'Quarterly intermediary-returns reconciliation', done: true },
    ] },
]
const ON_TRACK = FRAMEWORKS.filter(f => f.status === 'green').length
const TOTAL_CRIT = FRAMEWORKS.reduce((s, f) => s + f.criteria.length, 0)
const MET_CRIT = FRAMEWORKS.reduce((s, f) => s + f.criteria.filter(c => c.status === 'green').length, 0)
const OPEN_ACTIONS = FRAMEWORKS.reduce((s, f) => s + f.actions.filter(a => !a.done).length, 0)

type ExtRes = { name: string; source: string; summary: string; type: string; url: string }
const EXTERNAL_RESOURCES: ExtRes[] = [
  { name: 'Premier League / EFL EDI Standard', source: 'Premier League · accreditation framework', type: 'Framework',
    summary: 'Tiered EDI accreditation (Preliminary → Intermediate → Advanced) for clubs.', url: '#' },
  { name: "Owners' & Directors' Test", source: 'EFL / Premier League regulations', type: 'Governance',
    summary: 'Suitability test and disclosure requirements for owners and directors.', url: '#' },
  { name: 'Football Governance Act 2024', source: 'gov.uk · legislation', type: 'Regulation',
    summary: 'Independent regulator, mandatory fan engagement and heritage protections.', url: 'https://www.gov.uk/government/publications/football-governance-bill' },
  { name: 'A Sustainable Future — Reforming Club Football Governance', source: 'gov.uk · White Paper', type: 'Policy',
    summary: 'Government White Paper underpinning the independent regulator.', url: 'https://www.gov.uk/government/publications/a-sustainable-future-reforming-club-football-governance' },
  { name: 'Fan-Led Review of Football Governance', source: 'gov.uk · Crouch Review (2021)', type: 'Review',
    summary: 'Recommendations on ownership, fan engagement and financial sustainability.', url: 'https://www.gov.uk/government/publications/fan-led-review-of-football-governance-securing-the-games-future' },
  { name: 'FA Safeguarding Standards for Clubs', source: 'thefa.com', type: 'Safeguarding',
    summary: 'Minimum safeguarding standards across first team, academy and community.', url: '#' },
  { name: 'FA Rules E & K — Integrity & Betting', source: 'thefa.com · handbook', type: 'Integrity',
    summary: 'Misconduct, integrity, betting and anti-corruption rules for participants.', url: '#' },
  { name: 'EFL Regulations & Club Licensing', source: 'efl.com', type: 'Licensing',
    summary: 'Championship club-licensing, ground-grading and governance requirements.', url: '#' },
]

type Doc = { name: string; type: string; updated: string; owner: string; status: 'current' | 'review' }
const INTERNAL_EVIDENCE: Doc[] = [
  { name: 'Club EDI action plan v3', type: 'Policy', updated: 'Jan 2026', owner: 'Head of EDI', status: 'current' },
  { name: "Owners' & Directors' Test declarations", type: 'Governance', updated: 'Apr 2026', owner: 'Club Secretary', status: 'current' },
  { name: 'Board governance review 2026', type: 'Audit', updated: 'Mar 2026', owner: 'Club Secretary', status: 'current' },
  { name: 'Safeguarding policy v4', type: 'Policy', updated: 'Mar 2026', owner: 'DSO', status: 'current' },
  { name: 'DBS register', type: 'Record', updated: 'Mar 2026', owner: 'HR', status: 'review' },
  { name: 'Fan engagement plan 2025/26', type: 'Programme', updated: 'Feb 2026', owner: 'SLO', status: 'current' },
  { name: 'Anti-corruption & betting education log', type: 'Record', updated: 'Aug 2025', owner: 'Club Secretary', status: 'review' },
]

export default function FootballGameStandardsView() {
  const [tab, setTab] = useState<string>('overview')
  const active = FRAMEWORKS.find(f => f.id === tab)
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div><h2 className="text-xl font-bold flex items-center gap-2" style={{ color: C.text }}><ShieldCheck size={18} style={{ color: C.blue }} /> Game Standards</h2><p className="text-sm mt-1 max-w-2xl" style={{ color: C.text3 }}>Operating framework for the men&apos;s professional game — Premier League / EFL equality, governance, fan engagement, safeguarding and integrity standards.</p></div>
        <div className="rounded-xl px-5 py-3" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <div className="text-[10px] uppercase tracking-wider" style={{ color: C.text4 }}>Aggregate</div>
          <div className="text-sm font-bold mt-1" style={{ color: C.text }}>{ON_TRACK} / {FRAMEWORKS.length} standards on track</div>
          <div className="text-[10px] mt-0.5" style={{ color: C.text4 }}>{MET_CRIT}/{TOTAL_CRIT} criteria met · {OPEN_ACTIONS} open actions</div>
        </div>
      </div>

      <div className="flex gap-1 border-b overflow-x-auto" style={{ borderColor: C.border }}>
        {[{ id: 'overview', short: 'Overview' }, ...FRAMEWORKS, { id: 'resources', short: 'Resources' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className="px-4 py-2 text-xs font-semibold -mb-px whitespace-nowrap" style={{ borderBottom: `2px solid ${tab === t.id ? C.blue : 'transparent'}`, color: tab === t.id ? C.blueLt : C.text4 }}>{t.short || (t as Framework).short}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-3">
          {FRAMEWORKS.map(f => { const met = f.criteria.filter(c => c.status === 'green').length; const open = f.actions.filter(a => !a.done).length; return (
            <button key={f.id} onClick={() => setTab(f.id)} className="w-full text-left rounded-xl p-5" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div><div className="text-sm font-bold" style={{ color: C.text }}>{f.name}</div><div className="text-xs mt-0.5" style={{ color: C.text4 }}>{f.summary}</div></div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0" style={{ background: `${ragCol(f.status)}1f`, color: ragCol(f.status) }}>{ragLabel(f.status)}</span>
              </div>
              <div className="flex items-center gap-3"><div className="flex-1 rounded-full h-1.5" style={{ background: C.border }}><div className="h-1.5 rounded-full" style={{ width: `${(met / f.criteria.length) * 100}%`, background: ragCol(f.status) }} /></div><span className="text-[10px] shrink-0" style={{ color: C.text4 }}>{met}/{f.criteria.length} met</span></div>
              <div className="flex items-center gap-4 mt-2 text-[10px]" style={{ color: C.text4 }}><span>Owner: {f.owner}</span><span>Last reviewed: {f.reviewed}</span><span>{open} open action{open === 1 ? '' : 's'}</span></div>
            </button>
          ) })}
        </div>
      )}

      {active && (
        <div className="space-y-3">
          <div className="rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap" style={{ backgroundColor: C.panelAlt, border: `1px solid ${C.border}` }}>
            <div><div className="text-sm font-bold" style={{ color: C.text }}>{active.name}</div><div className="text-xs mt-0.5" style={{ color: C.text4 }}>{active.summary} · Owner: {active.owner} · Last reviewed {active.reviewed}</div></div>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${ragCol(active.status)}1f`, color: ragCol(active.status) }}>{ragLabel(active.status)}</span>
          </div>
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
            <table className="w-full text-xs"><thead><tr style={{ color: C.text4, borderBottom: `1px solid ${C.border}`, background: 'rgba(17,24,39,0.3)' }}><th className="text-left px-4 py-2.5 font-semibold">Criterion</th><th className="text-left px-4 py-2.5 font-semibold">Detail</th><th className="text-left px-4 py-2.5 font-semibold">Evidence</th><th className="text-left px-4 py-2.5 font-semibold">Reviewed</th><th className="text-right px-4 py-2.5 font-semibold">Status</th></tr></thead>
              <tbody>{active.criteria.map((c, i) => (<tr key={i} style={{ borderBottom: `1px solid ${C.border}80` }}><td className="px-4 py-3 font-medium align-top" style={{ color: C.text2 }}>{c.label}</td><td className="px-4 py-3 align-top" style={{ color: C.text4 }}>{c.note}</td><td className="px-4 py-3 align-top" style={{ color: C.text4 }}>{c.evidence}</td><td className="px-4 py-3 align-top" style={{ color: C.text4 }}>{c.reviewed}</td><td className="px-4 py-3 text-right align-top"><span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${ragCol(c.status)}1f`, color: ragCol(c.status) }}>{ragLabel(c.status)}</span></td></tr>))}</tbody>
            </table>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
              <h3 className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: C.text }}><CheckSquare size={14} style={{ color: C.blueLt }} /> Outstanding actions</h3>
              <ul className="space-y-2">{active.actions.map((a, i) => (
                <li key={i} className="text-xs flex items-center gap-2" style={{ color: a.done ? C.text4 : C.text2 }}>
                  <span className="w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0" style={{ borderColor: a.done ? C.good : C.text4, background: a.done ? C.goodDim : 'transparent' }}>{a.done && <span style={{ color: C.good, fontSize: 9 }}>✓</span>}</span>
                  <span style={{ textDecoration: a.done ? 'line-through' : 'none' }}>{a.txt}</span>
                </li>
              ))}</ul>
            </div>
            <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
              <h3 className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: C.text }}><FileText size={14} style={{ color: C.blueLt }} /> Key evidence on file</h3>
              <div className="flex flex-wrap gap-1.5">{active.criteria.map((c, i) => (
                <span key={i} className="text-[10px] px-2 py-1 rounded" style={{ background: C.panelAlt, border: `1px solid ${C.border}`, color: C.text3 }}>📄 {c.evidence}</span>
              ))}</div>
              <div className="text-[10px] mt-3" style={{ color: C.text4 }}>Owner: {active.owner} · framework reviewed {active.reviewed}. Full document set in the Resources tab.</div>
            </div>
          </div>
        </div>
      )}

      {tab === 'resources' && (
        <div className="space-y-5">
          <div>
            <h3 className="text-sm font-bold mb-2" style={{ color: C.text }}>External Standards &amp; Research</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {EXTERNAL_RESOURCES.map(r => (
                <a key={r.name} href={r.url} target="_blank" rel="noopener noreferrer" className="rounded-xl p-4 block" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="text-sm font-bold" style={{ color: C.text }}>{r.name}</div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full shrink-0" style={{ background: C.accentDim, color: C.blueLt }}>{r.type}</span>
                  </div>
                  <div className="text-[11px] mb-1 flex items-center gap-1" style={{ color: C.text4 }}>{r.source} <ExternalLink size={10} /></div>
                  <div className="text-[11px]" style={{ color: C.text3 }}>{r.summary}</div>
                </a>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold" style={{ color: C.text }}>Internal Club Evidence</h3>
              <button className="text-[11px] font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5" style={{ background: C.accentDim, color: C.blueLt, border: `1px solid ${C.blue}40` }}>
                <Upload size={12} />Upload New Document
              </button>
            </div>
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
              <table className="w-full text-xs">
                <thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>
                  {['Document','Type','Last updated','Owner','Status'].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{INTERNAL_EVIDENCE.map(d => (
                  <tr key={d.name} style={{ borderTop: `1px solid ${C.border}` }}>
                    <td className="px-3 py-2.5 font-semibold" style={{ color: C.text }}>{d.name}</td>
                    <td className="px-3 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: C.accentDim, color: C.blueLt }}>{d.type}</span></td>
                    <td className="px-3 py-2.5 font-mono" style={{ color: C.text3 }}>{d.updated}</td>
                    <td className="px-3 py-2.5" style={{ color: C.text3 }}>{d.owner}</td>
                    <td className="px-3 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: d.status === 'current' ? C.goodDim : C.warnDim, color: d.status === 'current' ? C.good : C.amber }}>{d.status === 'current' ? 'CURRENT' : 'NEEDS REVIEW'}</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
          <div className="rounded-xl p-3 text-[11px]" style={{ background: `${C.blue}12`, borderLeft: `3px solid ${C.blue}`, color: C.text2 }}>
            Demo — illustrative only. Standards references reflect publicly-known EFL / Premier League frameworks; internal documents, dates and owners are invented demo values.
          </div>
        </div>
      )}
    </div>
  )
}
