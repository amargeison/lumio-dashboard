'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'

// Risk Register & Insurance — enterprise risk register (likelihood x impact),
// insurance policy schedule, claims log and business continuity. Shared;
// men's (blue) vs women's (pink). Demo only — illustrative.

type Variant = 'mens' | 'womens'
type Tab = 'register' | 'matrix' | 'insurance' | 'claims' | 'continuity'

interface Risk { ref: string; title: string; cat: string; likelihood: number; impact: number; owner: string; mitigation: string }
interface Policy { cover: string; insurer: string; limit: string; renews: string }
interface Claim { ref: string; summary: string; date: string; status: string; value: string }
interface Bcp { scenario: string; status: 'green' | 'amber'; note: string }
interface Profile { accent: string; accentLt: string; clubName: string; insuredValue: string
  risks: Risk[]; policies: Policy[]; claims: Claim[]; bcp: Bcp[] }

const MENS: Profile = {
  accent: '#003DA5', accentLt: '#60A5FA', clubName: 'Oakridge FC', insuredValue: '£120m',
  risks: [
    { ref: 'R-01', title: 'PSR breach / points deduction', cat: 'Regulatory', likelihood: 2, impact: 5, owner: 'Finance Director', mitigation: 'Live PSR modelling; January spend gated by board' },
    { ref: 'R-02', title: 'Relegation revenue cliff', cat: 'Financial', likelihood: 3, impact: 5, owner: 'CEO', mitigation: 'Parachute modelling; cost-flex clauses in contracts' },
    { ref: 'R-03', title: 'Key-player long-term injury', cat: 'Sporting', likelihood: 3, impact: 4, owner: 'Head of Medical', mitigation: 'Squad depth; specific-injury insurance' },
    { ref: 'R-04', title: 'Stadium safety / crowd incident', cat: 'Operational', likelihood: 2, impact: 5, owner: 'Head of Operations', mitigation: 'SAG certificate; stewarding; EAP drilled' },
    { ref: 'R-05', title: 'Cyber / data breach', cat: 'Technology', likelihood: 3, impact: 4, owner: 'Company Secretary', mitigation: 'Pen-testing; cyber cover; staff training' },
    { ref: 'R-06', title: 'Academy de-categorisation (EPPP)', cat: 'Regulatory', likelihood: 2, impact: 3, owner: 'Academy Director', mitigation: 'Audit action plan; education-hours uplift' },
  ],
  policies: [
    { cover: 'Public & employers’ liability', insurer: 'Northbridge Underwriting', limit: '£25m', renews: 'Jul 2026' },
    { cover: 'Squad / specific-injury', insurer: 'Meridian Sports Cover', limit: '£18m', renews: 'Aug 2026' },
    { cover: 'Property & stadium', insurer: 'Northbridge Underwriting', limit: '£120m', renews: 'Jul 2026' },
    { cover: 'Cyber & data', insurer: 'Vanta Speciality', limit: '£5m', renews: 'Oct 2026' },
    { cover: 'Directors’ & officers’', insurer: 'Crown Assurance', limit: '£10m', renews: 'Jul 2026' },
  ],
  claims: [
    { ref: 'CL-2026-03', summary: 'Player ACL — specific-injury claim', date: 'Apr 2026', status: 'Open', value: '£640k' },
    { ref: 'CL-2025-11', summary: 'Storm damage — West Stand roof', date: 'Nov 2025', status: 'Settled', value: '£82k' },
  ],
  bcp: [
    { scenario: 'Stadium unavailable (fixture)', status: 'green', note: 'Reciprocal ground agreement in place' },
    { scenario: 'Major IT / ticketing outage', status: 'amber', note: 'Manual matchday fallback; DR test due' },
    { scenario: 'Training ground loss', status: 'green', note: 'Alternative facility MOU signed' },
  ],
}

const WOMENS: Profile = {
  accent: '#BE185D', accentLt: '#EC4899', clubName: 'Oakridge Women FC', insuredValue: '£24m',
  risks: [
    { ref: 'R-01', title: 'FSR breach / sanction', cat: 'Regulatory', likelihood: 2, impact: 4, owner: 'Head of Finance', mitigation: 'Live FSR modelling; contract spend gated' },
    { ref: 'R-02', title: 'ACL injury cluster', cat: 'Sporting', likelihood: 3, impact: 4, owner: 'Head of Performance', mitigation: 'ACL prevention programme; specific-injury cover' },
    { ref: 'R-03', title: 'Promotion cost step-up (WSL)', cat: 'Financial', likelihood: 3, impact: 4, owner: 'Managing Director', mitigation: 'Promotion budget modelled; phased uplift' },
    { ref: 'R-04', title: 'Stadium / matchday safety', cat: 'Operational', likelihood: 2, impact: 4, owner: 'Head of Operations', mitigation: 'SGSA self-regulation; stewarding; EAP drilled' },
    { ref: 'R-05', title: 'Cyber / data breach', cat: 'Technology', likelihood: 2, impact: 4, owner: 'Managing Director', mitigation: 'Pen-testing; cyber cover; staff training' },
    { ref: 'R-06', title: 'Key partner / sponsor loss', cat: 'Commercial', likelihood: 3, impact: 3, owner: 'Commercial Lead', mitigation: 'Diversified pipeline; renewal calendar' },
  ],
  policies: [
    { cover: 'Public & employers’ liability', insurer: 'Northbridge Underwriting', limit: '£10m', renews: 'Jul 2026' },
    { cover: 'Squad / specific-injury', insurer: 'Meridian Sports Cover', limit: '£4m', renews: 'Aug 2026' },
    { cover: 'Property & facilities', insurer: 'Northbridge Underwriting', limit: '£24m', renews: 'Jul 2026' },
    { cover: 'Cyber & data', insurer: 'Vanta Speciality', limit: '£2m', renews: 'Oct 2026' },
    { cover: 'Directors’ & officers’', insurer: 'Crown Assurance', limit: '£5m', renews: 'Jul 2026' },
  ],
  claims: [
    { ref: 'CL-2026-02', summary: 'Player ACL — specific-injury claim', date: 'Mar 2026', status: 'Open', value: '£180k' },
    { ref: 'CL-2025-08', summary: 'Minibus damage — away travel', date: 'Oct 2025', status: 'Settled', value: '£14k' },
  ],
  bcp: [
    { scenario: 'Stadium unavailable (fixture)', status: 'green', note: 'Reciprocal ground agreement in place' },
    { scenario: 'Major IT / ticketing outage', status: 'amber', note: 'Manual matchday fallback; DR test due' },
    { scenario: 'Training ground loss', status: 'green', note: 'Alternative facility MOU signed' },
  ],
}

const C = { panel: '#0D1117', panelAlt: '#111318', border: '#1F2937', text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280', good: '#22C55E', amber: '#F59E0B', red: '#EF4444' }
const score = (l: number, i: number) => l * i
const scoreCol = (s: number) => s >= 15 ? C.red : s >= 8 ? C.amber : C.good
const scoreLabel = (s: number) => s >= 15 ? 'High' : s >= 8 ? 'Medium' : 'Low'
const TABS: [Tab, string][] = [['register', 'Risk Register'], ['matrix', 'Heat Map'], ['insurance', 'Insurance Schedule'], ['claims', 'Claims'], ['continuity', 'Business Continuity']]

export default function RiskInsuranceView({ variant, club }: { variant: Variant; club?: { name?: string } | null }) {
  const p = variant === 'mens' ? MENS : WOMENS
  const name = club?.name || p.clubName
  const [tab, setTab] = useState<Tab>('register')
  const high = p.risks.filter(r => score(r.likelihood, r.impact) >= 15).length
  const med = p.risks.filter(r => { const s = score(r.likelihood, r.impact); return s >= 8 && s < 15 }).length

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: C.text }}><AlertTriangle size={18} style={{ color: p.accent }} /> Risk Register & Insurance</h2>
        <p className="text-sm mt-1 max-w-2xl" style={{ color: C.text3 }}>{name} — enterprise risk register, insurance schedule, claims and business continuity.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}><div className="text-[10px] uppercase tracking-wider" style={{ color: C.text4 }}>Tracked risks</div><div className="text-xl font-black mt-1" style={{ color: C.text }}>{p.risks.length}</div></div>
        <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}><div className="text-[10px] uppercase tracking-wider" style={{ color: C.text4 }}>High / Medium</div><div className="text-xl font-black mt-1" style={{ color: high ? C.red : C.amber }}>{high} / {med}</div></div>
        <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}><div className="text-[10px] uppercase tracking-wider" style={{ color: C.text4 }}>Insured value</div><div className="text-xl font-black mt-1" style={{ color: C.text }}>{p.insuredValue}</div></div>
        <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}><div className="text-[10px] uppercase tracking-wider" style={{ color: C.text4 }}>Open claims</div><div className="text-xl font-black mt-1" style={{ color: C.amber }}>{p.claims.filter(c => c.status === 'Open').length}</div></div>
      </div>

      <div className="flex gap-1 border-b overflow-x-auto" style={{ borderColor: C.border }}>
        {TABS.map(([id, label]) => (<button key={id} onClick={() => setTab(id)} className="px-4 py-2 text-xs font-semibold -mb-px whitespace-nowrap" style={{ borderBottom: `2px solid ${tab === id ? p.accent : 'transparent'}`, color: tab === id ? p.accentLt : C.text4 }}>{label}</button>))}
      </div>

      {tab === 'register' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <table className="w-full text-xs"><thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>{['Ref', 'Risk', 'Category', 'Score', 'Owner', 'Mitigation'].map(h => <th key={h} className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
            <tbody>{p.risks.map((r, i) => { const s = score(r.likelihood, r.impact); return (<tr key={i} style={{ borderTop: `1px solid ${C.border}` }}><td className="px-3 py-2.5 font-mono text-[10px]" style={{ color: C.text4 }}>{r.ref}</td><td className="px-3 py-2.5 font-semibold" style={{ color: C.text }}>{r.title}</td><td className="px-3 py-2.5" style={{ color: C.text4 }}>{r.cat}</td><td className="px-3 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${scoreCol(s)}1f`, color: scoreCol(s) }}>{scoreLabel(s)} ({s})</span></td><td className="px-3 py-2.5" style={{ color: C.text3 }}>{r.owner}</td><td className="px-3 py-2.5" style={{ color: C.text4 }}>{r.mitigation}</td></tr>) })}</tbody>
          </table>
        </div>
      )}

      {tab === 'matrix' && (
        <div className="rounded-xl p-5" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <div className="text-sm font-bold mb-3" style={{ color: C.text }}>Likelihood × Impact heat map</div>
          <div className="flex">
            <div className="flex flex-col justify-between pr-2 text-[9px] font-semibold" style={{ color: C.text4 }}><span>5</span><span>4</span><span>3</span><span>2</span><span>1</span></div>
            <div className="grid grid-cols-5 gap-1 flex-1">
              {[5, 4, 3, 2, 1].map(l => [1, 2, 3, 4, 5].map(im => {
                const s = l * im; const here = p.risks.filter(r => r.likelihood === l && r.impact === im)
                return (<div key={`${l}-${im}`} className="rounded flex items-center justify-center text-[9px] font-bold" style={{ aspectRatio: '1.6', background: `${scoreCol(s)}26`, border: `1px solid ${scoreCol(s)}55`, color: C.text2 }}>{here.map(r => r.ref).join(' ')}</div>)
              }))}
            </div>
          </div>
          <div className="flex justify-between mt-1 pl-6 text-[9px] font-semibold" style={{ color: C.text4 }}><span>Impact 1</span><span>2</span><span>3</span><span>4</span><span>5</span></div>
          <div className="text-[10px] mt-3" style={{ color: C.text4 }}>Vertical axis = likelihood, horizontal = impact. Cells coloured by risk score (L × I).</div>
        </div>
      )}

      {tab === 'insurance' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <table className="w-full text-xs"><thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>{['Cover', 'Insurer', 'Limit of indemnity', 'Renews'].map(h => <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
            <tbody>{p.policies.map((r, i) => (<tr key={i} style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{r.cover}</td><td className="px-4 py-2.5" style={{ color: C.text3 }}>{r.insurer}</td><td className="px-4 py-2.5 font-mono font-semibold" style={{ color: p.accentLt }}>{r.limit}</td><td className="px-4 py-2.5 font-mono" style={{ color: C.text4 }}>{r.renews}</td></tr>))}</tbody>
          </table>
        </div>
      )}

      {tab === 'claims' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <table className="w-full text-xs"><thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>{['Ref', 'Summary', 'Date', 'Value', 'Status'].map(h => <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
            <tbody>{p.claims.map((r, i) => (<tr key={i} style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-mono" style={{ color: C.text4 }}>{r.ref}</td><td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{r.summary}</td><td className="px-4 py-2.5" style={{ color: C.text3 }}>{r.date}</td><td className="px-4 py-2.5 font-mono" style={{ color: C.text2 }}>{r.value}</td><td className="px-4 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: r.status === 'Open' ? `${C.amber}1f` : `${C.good}1f`, color: r.status === 'Open' ? C.amber : C.good }}>{r.status}</span></td></tr>))}</tbody>
          </table>
        </div>
      )}

      {tab === 'continuity' && (
        <div className="space-y-2">{p.bcp.map((b, i) => (
          <div key={i} className="rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap" style={{ backgroundColor: C.panel, border: `1px solid ${(b.status === 'green' ? C.good : C.amber)}33` }}>
            <div><div className="text-sm font-semibold" style={{ color: C.text }}>{b.scenario}</div><div className="text-[11px] mt-0.5" style={{ color: C.text4 }}>{b.note}</div></div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${(b.status === 'green' ? C.good : C.amber)}1f`, color: b.status === 'green' ? C.good : C.amber }}>{b.status === 'green' ? 'Plan in place' : 'Test due'}</span>
          </div>
        ))}</div>
      )}

      <div className="rounded-xl p-3 text-[11px]" style={{ background: `${p.accent}12`, borderLeft: `3px solid ${p.accent}`, color: C.text2 }}>
        Demo — illustrative only. Risk scores, insurers, limits and claim values are invented demo values; insurer names are fictional.
      </div>
    </div>
  )
}
