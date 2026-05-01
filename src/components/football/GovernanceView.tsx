'use client'

import { useState } from 'react'
import { Shield, FileText, AlertTriangle, ScrollText, Users, Eye } from 'lucide-react'

const C = {
  bg: '#07080F', panel: '#111318', panel2: '#0D0F14',
  border: '#1F2937', borderHi: '#374151',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280',
  good: '#22C55E', warn: '#F59E0B', bad: '#EF4444', accent: '#003DA5',
}

type Tab = 'minutes' | 'compliance' | 'shareholders' | 'risk' | 'audit'

const BOARD_DECISIONS = [
  { date: '12 Apr 2026', title: 'Q1 financial review approved', vote: '6-0', outcome: 'Approved', topic: 'Finance' },
  { date: '12 Apr 2026', title: 'Henderson contract restructure', vote: '5-1', outcome: 'Approved', topic: 'First team' },
  { date: '08 Mar 2026', title: 'Stadium north stand refurb (Phase 2)', vote: '6-0', outcome: 'Approved', topic: 'Infrastructure' },
  { date: '08 Mar 2026', title: 'Foundation £80k grant — schools programme', vote: '6-0', outcome: 'Approved', topic: 'Community' },
  { date: '12 Feb 2026', title: 'Apex Performance kit deal renewal', vote: '5-1', outcome: 'Approved', topic: 'Commercial' },
  { date: '12 Feb 2026', title: 'Auditor reappointment (KPMG)', vote: '6-0', outcome: 'Approved', topic: 'Governance' },
  { date: '14 Jan 2026', title: 'Strategic plan 2026-2029 ratified',  vote: '6-0', outcome: 'Approved', topic: 'Strategy' },
]

const COMPLIANCE_ITEMS = [
  { regime: 'EFL', requirement: 'Profitability & Sustainability (PSR)', status: 'compliant',     deadline: 'Q2 2026', flag: 'green'  as const },
  { regime: 'EFL', requirement: 'Squad cap submission',                  status: 'compliant',     deadline: '01 Jul 2026', flag: 'green' as const },
  { regime: 'FA',  requirement: 'Owners & Directors test (renewals)',    status: 'submitted',     deadline: '30 Apr 2026', flag: 'amber' as const },
  { regime: 'FA',  requirement: 'Safeguarding annual return',            status: 'compliant',     deadline: '31 May 2026', flag: 'green' as const },
  { regime: 'EFL', requirement: 'Wages-to-revenue ratio (60% cap)',      status: 'compliant — 47%', deadline: 'rolling',   flag: 'green' as const },
  { regime: 'PL/EFL', requirement: 'Anti-money-laundering checks',       status: 'compliant',     deadline: '14 Jun 2026', flag: 'green' as const },
  { regime: 'FA',  requirement: 'Dual-registration declarations',         status: 'attention',     deadline: '12 May 2026', flag: 'amber' as const },
  { regime: 'EFL', requirement: 'Quarterly financial returns',            status: 'submitted',     deadline: '15 Apr 2026', flag: 'green' as const },
]

const SHAREHOLDERS = [
  { name: 'Oakridge Holdings Ltd',     shares: '52.4%', type: 'Majority',     since: 2018 },
  { name: 'Meridian Capital LLP',      shares: '18.2%', type: 'Institutional',since: 2021 },
  { name: 'Founders Trust',            shares: '12.0%', type: 'Heritage',     since: 1989 },
  { name: 'Supporters\' Trust',        shares: '7.5%',  type: 'Fan equity',   since: 2014 },
  { name: 'Whitfield Family Office',   shares: '5.4%',  type: 'Private',      since: 2023 },
  { name: 'Other minority',            shares: '4.5%',  type: '11 holders',   since: '—' },
]

const RISK_REGISTER = [
  { id: 'R-2026-04', cat: 'Financial',    risk: 'PSR breach if Henderson restructure rejected by EFL', impact: 'High',   likelihood: 'Low',    score: 8,  owner: 'CFO', status: 'mitigation' as const },
  { id: 'R-2026-03', cat: 'Compliance',   risk: 'Dual-registration window misses 12 May submission',    impact: 'Medium', likelihood: 'Low',    score: 4,  owner: 'Sec.',status: 'monitoring' as const },
  { id: 'R-2026-02', cat: 'Commercial',   risk: 'Local Energy lapsed — £35k revenue gap, no replacement', impact: 'Medium', likelihood: 'High', score: 12, owner: 'CCO', status: 'open' as const },
  { id: 'R-2026-01', cat: 'Operations',   risk: 'Stadium north stand drainage — Phase 2 delays',          impact: 'Low',    likelihood: 'Medium', score: 4,  owner: 'COO', status: 'mitigation' as const },
  { id: 'R-2025-12', cat: 'Reputational', risk: 'Social media policy breach by first-team player',        impact: 'High',   likelihood: 'Low',    score: 8,  owner: 'CCO', status: 'monitoring' as const },
  { id: 'R-2025-09', cat: 'Cyber',        risk: 'Ticketing system data breach',                            impact: 'High',   likelihood: 'Low',    score: 8,  owner: 'CTO', status: 'mitigation' as const },
]

const AUDIT_TRAIL = [
  { ts: 'Today 09:14',     who: 'L. Frost',   action: 'Updated dual-registration declarations — H. Knibbs', area: 'Compliance' },
  { ts: 'Today 08:42',     who: 'M. Carter',  action: 'Approved board minutes — 12 Apr session',            area: 'Minutes' },
  { ts: 'Yesterday 17:30', who: 'A. Patel',   action: 'Logged risk R-2026-04 — Henderson restructure',     area: 'Risk' },
  { ts: 'Yesterday 14:08', who: 'D. Pemberton',action: 'Filed FA O&D test renewals (3 directors)',         area: 'Compliance' },
  { ts: '2 days ago',      who: 'C. Whitfield',action: 'Posted shareholder communication — Q1 results',     area: 'Shareholders' },
  { ts: '2 days ago',      who: 'KPMG (M. Singh)',action: 'External auditor sign-in — quarterly',          area: 'Audit' },
  { ts: '3 days ago',      who: 'L. Frost',   action: 'Renewed safeguarding annual return',                 area: 'Compliance' },
]

export default function GovernanceView({ club }: { club?: { name?: string } | null }) {
  void club
  const [tab, setTab] = useState<Tab>('minutes')
  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'minutes',      label: 'Board Minutes & Decisions', icon: ScrollText },
    { id: 'compliance',   label: 'Regulatory Compliance',     icon: FileText },
    { id: 'shareholders', label: 'Owner & Shareholder',       icon: Users },
    { id: 'risk',         label: 'Risk Register',             icon: AlertTriangle },
    { id: 'audit',        label: 'Audit Trail',               icon: Eye },
  ]

  const flagColor = (f: 'green' | 'amber' | 'red') => f === 'red' ? C.bad : f === 'amber' ? C.warn : C.good
  const statusColor = (s: 'open' | 'mitigation' | 'monitoring' | 'closed') => s === 'open' ? C.bad : s === 'mitigation' ? C.warn : s === 'monitoring' ? C.accent : C.good

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <Shield size={20} style={{ color: C.accent }} className="mt-0.5" />
        <div>
          <h1 className="text-xl font-black" style={{ color: C.text }}>Governance</h1>
          <p className="text-sm mt-0.5" style={{ color: C.text4 }}>Board minutes · regulatory compliance · shareholders · risk · audit trail</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, borderBottom: `1px solid ${C.border}`, overflowX: 'auto' }}>
        {TABS.map(t => {
          const active = tab === t.id
          const TabIcon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                appearance: 'none', border: 0, background: 'transparent',
                padding: '10px 14px', fontSize: 12.5, fontWeight: active ? 600 : 500,
                color: active ? '#fff' : C.text3,
                borderBottom: `2px solid ${active ? C.accent : 'transparent'}`,
                marginBottom: -1, cursor: 'pointer', whiteSpace: 'nowrap',
                display: 'inline-flex', alignItems: 'center', gap: 7,
                transition: 'color .12s, border-color .12s',
              }}>
              <TabIcon size={13} strokeWidth={1.75} />{t.label}
            </button>
          )
        })}
      </div>

      <div className="pt-2">
        {tab === 'minutes' && (
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
            <table className="w-full text-xs">
              <thead><tr style={{ background: C.panel2 }}>
                {['Date','Decision','Topic','Vote','Outcome'].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {BOARD_DECISIONS.map((d, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}>
                    <td className="px-3 py-2.5 font-mono" style={{ color: C.text3 }}>{d.date}</td>
                    <td className="px-3 py-2.5 font-semibold" style={{ color: C.text }}>{d.title}</td>
                    <td className="px-3 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${C.accent}26`, color: '#7AAEFF' }}>{d.topic}</span></td>
                    <td className="px-3 py-2.5 font-mono" style={{ color: C.text2 }}>{d.vote}</td>
                    <td className="px-3 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${C.good}26`, color: C.good }}>{d.outcome.toUpperCase()}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'compliance' && (
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
            <table className="w-full text-xs">
              <thead><tr style={{ background: C.panel2 }}>
                {['Regime','Requirement','Status','Deadline','Flag'].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {COMPLIANCE_ITEMS.map((c, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}>
                    <td className="px-3 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${C.accent}26`, color: '#7AAEFF' }}>{c.regime}</span></td>
                    <td className="px-3 py-2.5 font-semibold" style={{ color: C.text }}>{c.requirement}</td>
                    <td className="px-3 py-2.5" style={{ color: C.text2 }}>{c.status}</td>
                    <td className="px-3 py-2.5 font-mono" style={{ color: C.text3 }}>{c.deadline}</td>
                    <td className="px-3 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${flagColor(c.flag)}26`, color: flagColor(c.flag) }}>{c.flag.toUpperCase()}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'shareholders' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard label="Total Shareholders" value="16" sub="incl. 11 minority" />
              <KpiCard label="Majority Holding" value="52.4%" sub="Oakridge Holdings" />
              <KpiCard label="Fan Equity" value="7.5%" sub="Supporters' Trust" accent={C.good} />
              <KpiCard label="Heritage Stake" value="12.0%" sub="Founders Trust" />
            </div>
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
              <table className="w-full text-xs">
                <thead><tr style={{ background: C.panel2 }}>
                  {['Holder','Shares','Type','Held Since'].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {SHAREHOLDERS.map((s, i) => (
                    <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}>
                      <td className="px-3 py-2.5 font-semibold" style={{ color: C.text }}>{s.name}</td>
                      <td className="px-3 py-2.5 font-mono font-bold" style={{ color: '#F1C40F' }}>{s.shares}</td>
                      <td className="px-3 py-2.5" style={{ color: C.text3 }}>{s.type}</td>
                      <td className="px-3 py-2.5 font-mono" style={{ color: C.text3 }}>{s.since}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'risk' && (
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
            <table className="w-full text-xs">
              <thead><tr style={{ background: C.panel2 }}>
                {['ID','Category','Risk','Impact','Likelihood','Score','Owner','Status'].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {RISK_REGISTER.map(r => (
                  <tr key={r.id} style={{ borderTop: `1px solid ${C.border}` }}>
                    <td className="px-3 py-2.5 font-mono" style={{ color: C.text4 }}>{r.id}</td>
                    <td className="px-3 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${C.accent}26`, color: '#7AAEFF' }}>{r.cat}</span></td>
                    <td className="px-3 py-2.5" style={{ color: C.text2 }}>{r.risk}</td>
                    <td className="px-3 py-2.5 font-mono" style={{ color: C.text3 }}>{r.impact}</td>
                    <td className="px-3 py-2.5 font-mono" style={{ color: C.text3 }}>{r.likelihood}</td>
                    <td className="px-3 py-2.5 font-mono font-bold" style={{ color: r.score >= 12 ? C.bad : r.score >= 8 ? C.warn : C.good }}>{r.score}</td>
                    <td className="px-3 py-2.5 font-mono" style={{ color: C.text3 }}>{r.owner}</td>
                    <td className="px-3 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${statusColor(r.status)}26`, color: statusColor(r.status) }}>{r.status.toUpperCase()}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'audit' && (
          <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
            <h3 className="text-sm font-bold mb-3" style={{ color: C.text }}>Audit Trail — last 7 days</h3>
            <div className="space-y-2">
              {AUDIT_TRAIL.map((a, i) => (
                <div key={i} className="flex gap-3 text-xs">
                  <span className="font-mono w-32 flex-shrink-0" style={{ color: C.text4 }}>{a.ts}</span>
                  <span className="font-semibold w-32 flex-shrink-0" style={{ color: C.text2 }}>{a.who}</span>
                  <span style={{ color: C.text2 }} className="flex-1">{a.action}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full self-center" style={{ background: `${C.accent}26`, color: '#7AAEFF' }}>{a.area}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function KpiCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent?: string }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
      <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: C.text4 }}>{label}</div>
      <div className="text-2xl font-black" style={{ color: C.text }}>{value}</div>
      <div className="text-[11px] mt-1" style={{ color: accent ?? C.accent }}>{sub}</div>
    </div>
  )
}
