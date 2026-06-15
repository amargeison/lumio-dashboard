'use client'

import { ShieldCheck, AlertTriangle, CalendarClock, GraduationCap, ChevronRight } from 'lucide-react'

// Compliance Command Centre — roll-up landing for the whole Compliance section.
// Surfaces every compliance domain (financial-regulatory + legal/people) as a
// single RAG board: PSR/FSR headroom, salary ratio, licence status, open risks,
// upcoming regulatory deadlines, and training/DBS coverage. Shared component;
// men's (blue / PSR / EFL) vs women's (pink / FSR / WPLL) selected by variant.
// Demo only — illustrative values.

type Variant = 'mens' | 'womens'
type RAG = 'green' | 'amber' | 'red'

interface Domain { id: string; name: string; headline: string; sub: string; status: RAG; nav?: string }
interface Deadline { item: string; due: string; owner: string; status: RAG }
interface TrainingRow { label: string; pct: number }
interface Alert { level: RAG; text: string }

interface Profile {
  accent: string; accentLt: string; accentDim: string
  clubName: string; regime: string
  score: number; scoreLabel: string
  domains: Domain[]
  deadlines: Deadline[]
  training: TrainingRow[]
  alerts: Alert[]
}

const MENS: Profile = {
  accent: '#003DA5', accentLt: '#60A5FA', accentDim: 'rgba(37,99,235,0.14)',
  clubName: 'Oakridge FC', regime: 'PSR · EFL / Premier League · EPPP · UEFA squad-cost',
  score: 86, scoreLabel: 'Largely compliant — 3 amber domains in active remediation',
  domains: [
    { id: 'psr', name: 'PSR Position', headline: '£1.5m headroom', sub: '3-yr rolling · within £39m limit', status: 'green', nav: 'psr-scr-modeller' },
    { id: 'salary', name: 'Salary / Squad-Cost', headline: '81%', sub: 'vs 85% UEFA transitional', status: 'amber', nav: 'salary' },
    { id: 'licensing', name: 'Club Licensing', headline: 'Provisional', sub: '3 categories amber · audit 14 Sep', status: 'amber', nav: 'club-licensing' },
    { id: 'standards', name: 'Game Standards', headline: '3 / 5 on track', sub: 'EDI + fan engagement in progress', status: 'amber', nav: 'game-standards' },
    { id: 'registration', name: 'Registration & Transfers', headline: 'Window clear', sub: 'GBE + ITC current · 0 flags', status: 'green', nav: 'registration' },
    { id: 'gdpr', name: 'Data Protection', headline: '2 SARs open', sub: 'within statutory 30 days', status: 'amber', nav: 'data-protection' },
    { id: 'safeguarding', name: 'Safeguarding', headline: '98% DBS', sub: '2 renewals in progress', status: 'green', nav: 'safeguarding-ops' },
    { id: 'doping', name: 'Anti-Doping', headline: 'Current', sub: 'Whereabouts + education complete', status: 'green', nav: 'anti-doping' },
    { id: 'risk', name: 'Risk & Insurance', headline: '2 high risks', sub: 'mitigations on track · cover current', status: 'amber', nav: 'risk-insurance' },
  ],
  deadlines: [
    { item: 'EFL club licence — annual self-assessment', due: '14 Sep 2026', owner: 'Club Secretary', status: 'amber' },
    { item: 'Summer transfer window — registrations close', due: '01 Sep 2026', owner: 'Football Secretary', status: 'green' },
    { item: 'EDI Standard — Advanced submission', due: '30 Nov 2026', owner: 'Head of EDI', status: 'amber' },
    { item: 'PSR annual P&S submission', due: '31 Dec 2026', owner: 'Finance Director', status: 'green' },
    { item: 'Audited accounts — Companies House filing', due: '31 Mar 2027', owner: 'Finance Director', status: 'green' },
  ],
  training: [
    { label: 'DBS checks valid', pct: 98 },
    { label: 'Safeguarding training', pct: 92 },
    { label: 'Anti-corruption & betting', pct: 100 },
    { label: 'Data protection (GDPR)', pct: 88 },
  ],
  alerts: [
    { level: 'amber', text: 'East Stand CAFE accessibility works outstanding — licensing risk STA-06.' },
    { level: 'amber', text: 'Squad-cost ratio at 81% — model any January signing before agreeing terms.' },
    { level: 'green', text: 'No active FA Rule E / K or betting-integrity cases.' },
  ],
}

const WOMENS: Profile = {
  accent: '#BE185D', accentLt: '#EC4899', accentDim: 'rgba(236,72,153,0.12)',
  clubName: 'Oakridge Women FC', regime: 'FSR · WSL / Championship · WPLL · Carney Review',
  score: 88, scoreLabel: 'Largely compliant — 2 amber domains in active remediation',
  domains: [
    { id: 'fsr', name: 'FSR Position', headline: '£0.4m headroom', sub: '3-yr window · within £1.5m envelope', status: 'green', nav: 'fsr' },
    { id: 'salary', name: 'Salary / Wage Cap', headline: '78%', sub: 'vs 80% WSL wage cap', status: 'amber', nav: 'salary' },
    { id: 'licensing', name: 'Club Licensing', headline: 'Provisional', sub: '2 categories amber · audit 14 Sep', status: 'amber', nav: 'licensing' },
    { id: 'standards', name: 'Game Standards', headline: '7 / 10 on track', sub: 'Carney recommendations', status: 'amber', nav: 'game-standards' },
    { id: 'registration', name: 'Registration & Transfers', headline: 'Window clear', sub: 'WPLL registration + ITC current', status: 'green', nav: 'registration' },
    { id: 'gdpr', name: 'Data Protection', headline: '1 SAR open', sub: 'within statutory 30 days', status: 'amber', nav: 'data-protection' },
    { id: 'safeguarding', name: 'Safeguarding', headline: '96% DBS', sub: '3 renewals in progress', status: 'green', nav: 'safeguarding-ops' },
    { id: 'doping', name: 'Anti-Doping', headline: 'Current', sub: 'Whereabouts + education complete', status: 'green', nav: 'anti-doping' },
    { id: 'risk', name: 'Risk & Insurance', headline: '1 high risk', sub: 'mitigation on track · cover current', status: 'amber', nav: 'risk-insurance' },
  ],
  deadlines: [
    { item: 'WSL/Championship licence — self-assessment', due: '14 Sep 2026', owner: 'Club Secretary', status: 'amber' },
    { item: 'WPLL squad registration deadline', due: '01 Sep 2026', owner: 'Football Secretary', status: 'green' },
    { item: 'Carney action plan — annual review', due: '30 Sep 2026', owner: 'Managing Director', status: 'amber' },
    { item: 'FSR annual submission', due: '31 Mar 2027', owner: 'Head of Finance', status: 'green' },
    { item: 'Audited accounts — Companies House filing', due: '31 Dec 2026', owner: 'Head of Finance', status: 'green' },
  ],
  training: [
    { label: 'DBS checks valid', pct: 96 },
    { label: 'Safeguarding training', pct: 95 },
    { label: 'Cycle-aware / welfare training', pct: 90 },
    { label: 'Data protection (GDPR)', pct: 90 },
  ],
  alerts: [
    { level: 'amber', text: 'Championship contact time at 14 hrs/wk — below the 2027-28 20-hour target (Carney 3.1).' },
    { level: 'amber', text: 'Wage cap headroom tight at 78% — model new contracts before signing.' },
    { level: 'green', text: 'Maternity package (26 wks full pay) exceeds the FIFA / FA minimum.' },
  ],
}

const C = {
  panel: '#0D1117', panel2: '#111318', border: '#1F2937', borderSoft: '#1A2030',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280',
  good: '#22C55E', amber: '#F59E0B', red: '#EF4444',
  goodDim: 'rgba(34,197,94,0.15)', warnDim: 'rgba(245,158,11,0.15)', badDim: 'rgba(239,68,68,0.15)',
}
const ragCol = (r: RAG) => r === 'green' ? C.good : r === 'amber' ? C.amber : C.red
const ragDim = (r: RAG) => r === 'green' ? C.goodDim : r === 'amber' ? C.warnDim : C.badDim
const ragLabel = (r: RAG) => r === 'green' ? 'On track' : r === 'amber' ? 'Attention' : 'Breach'

export default function ComplianceCommandCentre({ variant, club, onNavigate }: { variant: Variant; club?: { name?: string } | null; onNavigate?: (id: string) => void }) {
  const p = variant === 'mens' ? MENS : WOMENS
  const name = club?.name || p.clubName
  const green = p.domains.filter(d => d.status === 'green').length
  const amber = p.domains.filter(d => d.status === 'amber').length
  const red = p.domains.filter(d => d.status === 'red').length
  const scoreCol = p.score >= 85 ? C.good : p.score >= 70 ? C.amber : C.red

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: C.text }}><ShieldCheck size={18} style={{ color: p.accent }} /> Compliance Command Centre</h2>
          <p className="text-sm mt-1 max-w-2xl" style={{ color: C.text3 }}>{name} — single view across every compliance domain. Regime: {p.regime}.</p>
        </div>
      </div>

      <div className="rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-5">
          <div className="relative flex items-center justify-center" style={{ width: 92, height: 92 }}>
            <svg width="92" height="92" viewBox="0 0 92 92" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="46" cy="46" r="40" fill="none" stroke={C.border} strokeWidth="8" />
              <circle cx="46" cy="46" r="40" fill="none" stroke={scoreCol} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(p.score / 100) * 251} 251`} />
            </svg>
            <div className="absolute text-center"><div className="text-2xl font-black" style={{ color: C.text }}>{p.score}</div><div className="text-[8px] uppercase tracking-wider" style={{ color: C.text4 }}>health</div></div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider" style={{ color: C.text4 }}>Overall compliance health</div>
            <div className="text-sm font-bold mt-1 max-w-md" style={{ color: C.text }}>{p.scoreLabel}</div>
            <div className="flex gap-3 mt-2 text-[11px]">
              <span style={{ color: C.good }}>● {green} on track</span>
              <span style={{ color: C.amber }}>● {amber} attention</span>
              <span style={{ color: C.red }}>● {red} breach</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="text-sm font-bold mb-3" style={{ color: C.text }}>Compliance domains</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {p.domains.map(d => (
            <button key={d.id} onClick={() => d.nav && onNavigate?.(d.nav)} className="text-left rounded-xl p-4 transition-opacity hover:opacity-90" style={{ backgroundColor: C.panel, border: `1px solid ${ragCol(d.status)}40` }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold" style={{ color: C.text }}>{d.name}</span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: ragDim(d.status), color: ragCol(d.status) }}>{ragLabel(d.status)}</span>
              </div>
              <div className="text-lg font-black" style={{ color: ragCol(d.status) }}>{d.headline}</div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-[11px]" style={{ color: C.text4 }}>{d.sub}</span>
                {d.nav && onNavigate && <ChevronRight size={13} style={{ color: p.accentLt }} />}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderBottom: `1px solid ${C.border}` }}><CalendarClock size={15} style={{ color: p.accentLt }} /><h3 className="text-sm font-bold" style={{ color: C.text }}>Upcoming regulatory deadlines</h3></div>
          {p.deadlines.map((d, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: i < p.deadlines.length - 1 ? `1px solid ${C.border}80` : undefined }}>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: ragCol(d.status) }} />
              <div className="flex-1 min-w-0"><div className="text-xs font-semibold" style={{ color: C.text2 }}>{d.item}</div><div className="text-[10px]" style={{ color: C.text4 }}>{d.owner}</div></div>
              <span className="text-[11px] font-mono font-semibold shrink-0" style={{ color: C.text3 }}>{d.due}</span>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl p-5" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: C.text }}><GraduationCap size={15} style={{ color: p.accentLt }} /> Training & checks coverage</h3>
            <div className="space-y-2.5">{p.training.map((t, i) => (
              <div key={i}><div className="flex items-center justify-between mb-1"><span className="text-[11px]" style={{ color: C.text3 }}>{t.label}</span><span className="text-[11px] font-bold" style={{ color: t.pct >= 95 ? C.good : t.pct >= 85 ? C.amber : C.red }}>{t.pct}%</span></div><div className="w-full rounded-full h-1.5" style={{ background: C.border }}><div className="h-1.5 rounded-full" style={{ width: `${t.pct}%`, background: t.pct >= 95 ? C.good : t.pct >= 85 ? C.amber : C.red }} /></div></div>
            ))}</div>
          </div>
          <div className="rounded-xl p-5" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: C.text }}><AlertTriangle size={15} style={{ color: C.amber }} /> Attention & alerts</h3>
            <div className="space-y-2">{p.alerts.map((a, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px]"><span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: ragCol(a.level) }} /><span style={{ color: C.text3 }}>{a.text}</span></div>
            ))}</div>
          </div>
        </div>
      </div>

      <div className="rounded-xl p-3 text-[11px]" style={{ background: `${p.accent}12`, borderLeft: `3px solid ${p.accent}`, color: C.text2 }}>
        Demo — illustrative only. Headroom figures, ratios, deadlines and coverage percentages are invented demo values. Click any domain to open its full workspace.
      </div>
    </div>
  )
}
