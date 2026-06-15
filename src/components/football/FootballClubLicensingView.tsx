'use client'

import { useState } from 'react'
import {
  Building2, Users, GraduationCap, Activity, Scale, Stethoscope,
  ShieldCheck, AlertTriangle, ListChecks, History, FileText,
  ChevronDown, ChevronRight, ExternalLink, CheckCircle2, Circle,
} from 'lucide-react'

// Men's Pro — Club Licensing. EFL / Premier League licensing + EPPP academy +
// ground grading. Mirrors the women's flagship depth exactly: licence-status
// hero, category grid, top outstanding, rich Criteria accordion (per-criterion
// threshold/current/evidence/next-review grid + notes), Risk Register table,
// Action Plan with progress + linked criteria + notes, Audit (history +
// Evidence Vault + re-audit countdown). Blue palette. Demo only — illustrative.

const C = {
  bg: '#07080F', panel: '#0D1117', panel2: '#111318',
  border: '#1F2937', borderHi: '#374151', borderSoft: '#1A2030',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280',
  good: '#22C55E', warn: '#F59E0B', bad: '#EF4444',
  accent: '#2563EB', accentDeep: '#003DA5',
  goodDim: 'rgba(34,197,94,0.15)', warnDim: 'rgba(245,158,11,0.15)',
  badDim: 'rgba(239,68,68,0.15)', accentDim: 'rgba(37,99,235,0.14)',
}

type Rag = 'green' | 'amber' | 'red'
type CategoryKey = 'facilities' | 'personnel' | 'academy' | 'sporting' | 'medical' | 'legal'
type Tab = 'overview' | 'criteria' | 'risk' | 'actions' | 'audit'

interface Category { key: CategoryKey; label: string; icon: typeof Building2; status: Rag }
interface Criterion {
  id: string; category: CategoryKey; name: string; rag: Rag
  threshold: string; current: string; evidence: string; nextReview: string; note?: string
}
interface RiskItem { criterionId: string; category: CategoryKey; name: string; shortfall: string; level: Rag; owner: string; eta: string }
interface ActionItem { id: string; title: string; links: string[]; owner: string; due: string; pct: number; status: 'On track' | 'At risk' | 'Blocked'; note: string }
interface AuditEntry { date: string; scope: string; outcome: string; auditor: string }

// ─── Demo data ──────────────────────────────────────────────────────────────

const CATEGORIES: Category[] = [
  { key: 'facilities', label: 'Stadium & Ground Grading',   icon: Building2,     status: 'amber' },
  { key: 'personnel',  label: 'Personnel & Administration', icon: Users,         status: 'green' },
  { key: 'academy',    label: 'Academy (EPPP)',             icon: GraduationCap, status: 'amber' },
  { key: 'sporting',   label: 'Sporting & Infrastructure',  icon: Activity,      status: 'amber' },
  { key: 'medical',    label: 'Medical & Player Care',      icon: Stethoscope,   status: 'green' },
  { key: 'legal',      label: 'Legal & Financial',          icon: Scale,         status: 'green' },
]

const CRITERIA: Criterion[] = [
  // Stadium & Ground Grading — 5 green + 1 amber → AMBER
  { id: 'STA-01', category: 'facilities', name: 'Ground grading standard', rag: 'green', threshold: 'EFL Championship grade', current: 'Achieved — full grading awarded 2025', evidence: 'EFL grading certificate 2025 · ground inspection report', nextReview: 'Jul 2026' },
  { id: 'STA-02', category: 'facilities', name: 'Safety certificate & capacity', rag: 'green', threshold: 'Valid SAG safety certificate', current: '24,000 capacity — certificate valid to 2027', evidence: 'SAG safety certificate · annual inspection log', nextReview: 'Annual' },
  { id: 'STA-03', category: 'facilities', name: 'Floodlight luminance', rag: 'green', threshold: '≥ 1,200 lux average', current: '1,650 lux average (Mar 2026 test)', evidence: 'Lux test report Mar 2026 · electrician sign-off', nextReview: 'Mar 2027' },
  { id: 'STA-04', category: 'facilities', name: 'Pitch dimensions & surface', rag: 'green', threshold: '105 × 68 m · pro hybrid spec', current: 'Hybrid system — FIFA Quality Pro test pass', evidence: 'Pitch test certificate · maintenance log', nextReview: 'Aug 2026' },
  { id: 'STA-05', category: 'facilities', name: 'Media & broadcast facilities', rag: 'green', threshold: 'Full EFL/PL broadcast provision', current: 'Compliant — gantry, studio, mixed zone', evidence: 'Broadcaster sign-off · facilities spec', nextReview: 'Annual' },
  { id: 'STA-06', category: 'facilities', name: 'Accessibility (CAFE standard)', rag: 'amber', threshold: 'Meets CAFE accessibility guidance', current: 'East Stand wheelchair-bay + sightline works outstanding', evidence: 'CAFE audit 2025 · access statement', nextReview: 'Aug 2026', note: 'East Stand accessibility works scheduled — see Action AP-01.' },
  // Personnel & Administration — all green
  { id: 'PER-01', category: 'personnel', name: 'Licensed club secretary', rag: 'green', threshold: 'In post · EFL-registered', current: 'James Morton — registered, in post since 2021', evidence: 'Appointment record · EFL registration', nextReview: 'Annual' },
  { id: 'PER-02', category: 'personnel', name: 'Designated safeguarding officer', rag: 'green', threshold: 'FA-trained · current DBS · in post', current: 'In post — DBS current, refresher complete', evidence: 'FA safeguarding certificate · DBS register', nextReview: 'Annual' },
  { id: 'PER-03', category: 'personnel', name: 'Medical staffing minimum', rag: 'green', threshold: 'Club doctor + ≥ 2 physios', current: 'Doctor + 3 physios contracted', evidence: 'Staff roster · GMC/HCPC registration', nextReview: 'Annual' },
  { id: 'PER-04', category: 'personnel', name: "Owners' & Directors' Test", rag: 'green', threshold: 'All directors passed · declarations current', current: 'Current — all declarations filed', evidence: 'ODT declarations · ownership register', nextReview: 'On change' },
  // Academy (EPPP) — 4 green + 1 amber → AMBER
  { id: 'ACA-01', category: 'academy', name: 'EPPP category status', rag: 'green', threshold: 'Category 2 minimum', current: 'Category 2 retained at last audit', evidence: 'EPPP audit report · category certificate', nextReview: 'Annual' },
  { id: 'ACA-02', category: 'academy', name: 'Coaching qualification ratios', rag: 'green', threshold: 'Per EPPP age-phase requirements', current: 'Met across all age phases', evidence: 'Coach licence log · qualification register', nextReview: 'Annual' },
  { id: 'ACA-03', category: 'academy', name: 'Education provision hours', rag: 'amber', threshold: '≥ 12 hrs/week (full-time phase)', current: '10.5 hrs/week — 1.5-hour shortfall', evidence: 'Scholar timetable Q4 2025 · education plan', nextReview: 'Sep 2026', note: 'Additional academic block being timetabled — see Action AP-02.' },
  { id: 'ACA-04', category: 'academy', name: 'Games programme / contact hours', rag: 'green', threshold: 'Per EPPP age-group schedule', current: 'Met — full fixture + contact programme', evidence: 'Games programme log · attendance', nextReview: 'Annual' },
  { id: 'ACA-05', category: 'academy', name: 'Independent academy audit', rag: 'green', threshold: 'Passed annually', current: 'Passed — Feb 2026 audit', evidence: 'EPPP independent audit 2026', nextReview: 'Feb 2027' },
  // Sporting & Infrastructure — 3 green + 1 amber → AMBER
  { id: 'SPO-01', category: 'sporting', name: 'First-team training facility', rag: 'green', threshold: 'Professional standard · category-compliant', current: 'Compliant — full inspection pass', evidence: 'Facility inspection report', nextReview: 'Annual' },
  { id: 'SPO-02', category: 'sporting', name: 'First-team contact hours', rag: 'green', threshold: '≥ EFL/PL guidance', current: 'Met — weekly schedule logged', evidence: 'Training schedule · attendance log', nextReview: 'Annual' },
  { id: 'SPO-03', category: 'sporting', name: 'Sports science & analysis provision', rag: 'green', threshold: 'Full department provision', current: 'Lumio GPS + analysis suite + S&C team', evidence: 'Department structure · equipment register', nextReview: 'Annual' },
  { id: 'SPO-04', category: 'sporting', name: 'Recovery & medical centre', rag: 'amber', threshold: 'Professional recovery standard', current: 'Refurbishment in progress — hydro suite offline', evidence: 'Project plan · contractor schedule', nextReview: 'Jul 2026', note: 'Refurbishment due to complete pre-season — see Action AP-03.' },
  // Medical & Player Care — all green
  { id: 'MED-01', category: 'medical', name: 'Club doctor presence', rag: 'green', threshold: 'Matchday cover + weekly clinic', current: 'Dr Sarah Phillips — matchday + Tue/Thu clinic', evidence: 'GMC registration · matchday cover log', nextReview: 'Annual' },
  { id: 'MED-02', category: 'medical', name: 'Physio ratio', rag: 'green', threshold: '≥ 1 FT physio per 14 players', current: '3 FT physios / 25 players (1 : 8)', evidence: 'Contracts · HCPC registration', nextReview: 'Annual' },
  { id: 'MED-03', category: 'medical', name: 'HIA-compliant concussion SOP', rag: 'green', threshold: 'FA/PL protocol · GRTP active', current: 'Concussion SOP v3 · GRTP module live', evidence: 'SOP document · GRTP log', nextReview: 'Annual' },
  { id: 'MED-04', category: 'medical', name: 'Emergency Action Plan', rag: 'green', threshold: 'EAP signed · drilled annually', current: 'EAP v4 · drilled 12 Feb 2026', evidence: 'EAP document · drill report', nextReview: 'Feb 2027' },
  { id: 'MED-05', category: 'medical', name: 'Mental-health pathway', rag: 'green', threshold: 'Psychologist + external referral pathway', current: 'Sport psychologist + EAP referral framework', evidence: 'Psychology contract · referral pathway doc', nextReview: 'Annual' },
  // Legal & Financial — all green
  { id: 'LEG-01', category: 'legal', name: 'Audited accounts filed', rag: 'green', threshold: 'Filed on time at Companies House', current: 'Filed — clean audit opinion', evidence: 'Companies House filing · auditor report', nextReview: 'Annual' },
  { id: 'LEG-02', category: 'legal', name: 'Going concern / solvency', rag: 'green', threshold: 'Confirmed by auditor', current: 'Confirmed — going-concern letter on file', evidence: 'Auditor going-concern letter', nextReview: 'Annual' },
  { id: 'LEG-03', category: 'legal', name: 'Tax compliance (PAYE / VAT)', rag: 'green', threshold: 'Up to date · no arrears', current: 'Up to date — HMRC statements clear', evidence: 'HMRC statements · payroll records', nextReview: 'Quarterly' },
  { id: 'LEG-04', category: 'legal', name: 'Insurance cover', rag: 'green', threshold: 'All required policies in place', current: 'In place — full schedule current', evidence: 'Policy schedule · broker confirmation', nextReview: 'Annual' },
  { id: 'LEG-05', category: 'legal', name: 'PSR submission', rag: 'green', threshold: 'Filed · within limits', current: 'Filed — within PSR limits (see PSR SCR Dashboard)', evidence: 'EFL P&S return · PSR working papers', nextReview: 'Annual', note: 'Full position modelled in Compliance → PSR SCR Dashboard.' },
]

const RISKS: RiskItem[] = CRITERIA.filter(c => c.rag !== 'green').map(c => ({
  criterionId: c.id, category: c.category, name: c.name, shortfall: c.current, level: c.rag,
  owner:
    c.id === 'STA-06' ? 'Head of Operations' :
    c.id === 'ACA-03' ? 'Academy Director' :
    c.id === 'SPO-04' ? 'Head of Operations' : 'Club Secretary',
  eta:
    c.id === 'STA-06' ? 'Aug 2026' :
    c.id === 'ACA-03' ? 'Sep 2026' :
    c.id === 'SPO-04' ? 'Jul 2026' : 'TBC',
}))

const ACTIONS: ActionItem[] = [
  { id: 'AP-01', title: 'East Stand CAFE accessibility works', links: ['STA-06'], owner: 'Head of Operations', due: 'Aug 2026', pct: 40, status: 'On track',
    note: 'New wheelchair bays + sightline remediation in East Stand. Contractor appointed; works phased around the fixture calendar to complete pre-season.' },
  { id: 'AP-02', title: 'Scholar academic hours uplift 10.5 → 12 hrs/wk', links: ['ACA-03'], owner: 'Academy Director', due: 'Sep 2026', pct: 60, status: 'On track',
    note: 'Additional weekly academic block agreed with education partner; timetable restructure pending 2026/27 scholar intake confirmation.' },
  { id: 'AP-03', title: 'Recovery & medical centre refurbishment', links: ['SPO-04'], owner: 'Head of Operations', due: 'Jul 2026', pct: 70, status: 'On track',
    note: 'Hydrotherapy + cryo suite refurbishment. Build on schedule; commissioning and sign-off targeted for the start of pre-season.' },
]

const AUDITS: AuditEntry[] = [
  { date: '14 Mar 2026', scope: 'EFL annual licensing self-assessment', outcome: 'Submitted — provisional (3 categories amber)', auditor: 'Club Secretary' },
  { date: '02 Feb 2026', scope: 'EPPP academy audit',                    outcome: 'Category 2 retained',                       auditor: 'Premier League' },
  { date: '10 Jan 2026', scope: 'Ground safety inspection',              outcome: 'Passed',                                    auditor: 'Safety Advisory Group' },
  { date: '05 Dec 2025', scope: 'Quarterly compliance review',           outcome: 'Actions logged · on track',                 auditor: 'Club Secretary' },
]

const EVIDENCE_COUNTS: Record<CategoryKey, number> = {
  facilities: 31, personnel: 16, academy: 38, sporting: 22, medical: 29, legal: 24,
}

const NEXT_AUDIT = '14 Sep 2026'

// ─── Helpers ────────────────────────────────────────────────────────────────

const ragColor = (r: Rag) => r === 'red' ? C.bad : r === 'amber' ? C.warn : C.good
const ragDim   = (r: Rag) => r === 'red' ? C.badDim : r === 'amber' ? C.warnDim : C.goodDim
const ragLabel = (r: Rag) => r === 'red' ? 'BREACH' : r === 'amber' ? 'PARTIAL' : 'COMPLIANT'
const categoryLabel = (k: CategoryKey) => CATEGORIES.find(c => c.key === k)?.label ?? k

// ─── Primitives ─────────────────────────────────────────────────────────────

const Panel = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-xl p-5 ${className ?? ''}`} style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>{children}</div>
)

const RagPill = ({ r, size = 'sm' }: { r: Rag; size?: 'sm' | 'xs' }) => (
  <span className={`inline-flex items-center gap-1 rounded font-bold ${size === 'xs' ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'}`}
    style={{ backgroundColor: ragDim(r), color: ragColor(r), border: `1px solid ${ragColor(r)}55` }}>
    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ragColor(r) }} />
    {ragLabel(r)}
  </span>
)

const Disclaimer = () => (
  <div className="rounded-lg p-3 text-[11px] leading-relaxed mb-4" style={{ backgroundColor: C.accentDim, border: `1px solid ${C.accent}55`, color: '#BFDBFE' }}>
    <strong style={{ color: '#93C5FD' }}>Demo data — illustrative only.</strong>{' '}
    Categories below reflect publicly-known EFL / Premier League club-licensing and EPPP academy themes.
    All thresholds, percentages, deadlines, evidence counts, audit outcomes and document references are
    invented demo values and do not represent any real licensing decision. Lumio does not issue licences;
    this module is a club-side preparation workspace.
  </div>
)

// ─── Overview tab ───────────────────────────────────────────────────────────

const OverviewTab = () => {
  const greenCount = CATEGORIES.filter(c => c.status === 'green').length
  const amberCount = CATEGORIES.filter(c => c.status === 'amber').length
  const redCount   = CATEGORIES.filter(c => c.status === 'red').length
  const totalCrit  = CRITERIA.length
  const greenCrit  = CRITERIA.filter(c => c.rag === 'green').length
  const amberCrit  = CRITERIA.filter(c => c.rag === 'amber').length
  const topOutstanding = CRITERIA.filter(c => c.rag !== 'green').slice(0, 5)

  return (
    <div className="space-y-5">
      <Disclaimer />

      <Panel>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: C.text4 }}>Current Licence Status (demo)</div>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-black" style={{ color: C.text }}>PROVISIONAL</span>
              <span className="text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wide" style={{ backgroundColor: C.warnDim, color: C.warn, border: `1px solid ${C.warn}55` }}>{amberCount} categories amber</span>
            </div>
            <div className="text-xs mt-2" style={{ color: C.text3 }}>Next audit window: <strong style={{ color: C.text }}>{NEXT_AUDIT}</strong></div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg px-4 py-2" style={{ backgroundColor: C.goodDim, border: `1px solid ${C.good}55` }}>
              <div className="text-2xl font-black" style={{ color: C.good }}>{greenCount}</div>
              <div className="text-[10px] font-semibold uppercase" style={{ color: C.good }}>Green</div>
            </div>
            <div className="rounded-lg px-4 py-2" style={{ backgroundColor: C.warnDim, border: `1px solid ${C.warn}55` }}>
              <div className="text-2xl font-black" style={{ color: C.warn }}>{amberCount}</div>
              <div className="text-[10px] font-semibold uppercase" style={{ color: C.warn }}>Amber</div>
            </div>
            <div className="rounded-lg px-4 py-2" style={{ backgroundColor: C.badDim, border: `1px solid ${C.bad}55` }}>
              <div className="text-2xl font-black" style={{ color: C.bad }}>{redCount}</div>
              <div className="text-[10px] font-semibold uppercase" style={{ color: C.bad }}>Red</div>
            </div>
          </div>
        </div>
      </Panel>

      <div>
        <div className="text-sm font-bold mb-3" style={{ color: C.text }}>Category Status</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon
            const criteriaInCat = CRITERIA.filter(c => c.category === cat.key)
            const greenN = criteriaInCat.filter(c => c.rag === 'green').length
            const amberN = criteriaInCat.filter(c => c.rag === 'amber').length
            return (
              <div key={cat.key} className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${ragColor(cat.status)}55` }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md" style={{ backgroundColor: ragDim(cat.status) }}>
                      <Icon size={16} style={{ color: ragColor(cat.status) }} />
                    </div>
                    <div className="text-sm font-bold" style={{ color: C.text }}>{cat.label}</div>
                  </div>
                  <RagPill r={cat.status} />
                </div>
                <div className="text-[11px]" style={{ color: C.text3 }}>
                  {greenN} of {criteriaInCat.length} compliant
                  {amberN > 0 && <span style={{ color: C.warn }}> · {amberN} partial</span>}
                </div>
                <div className="w-full rounded-full h-1.5 mt-2" style={{ background: C.border }}>
                  <div className="h-1.5 rounded-full" style={{ width: `${(greenN / criteriaInCat.length) * 100}%`, background: ragColor(cat.status) }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <Panel>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-bold" style={{ color: C.text }}>Top Outstanding Items</div>
          <div className="text-[10px]" style={{ color: C.text4 }}>{amberCrit + redCount} of {totalCrit} criteria not yet green</div>
        </div>
        <div className="space-y-2">
          {topOutstanding.map(c => (
            <div key={c.id} className="flex items-start justify-between gap-3 rounded-lg p-3" style={{ backgroundColor: C.panel2, border: `1px solid ${C.borderSoft}` }}>
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className="text-[10px] font-bold mt-0.5" style={{ color: C.text4 }}>{c.id}</span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold" style={{ color: C.text }}>{c.name}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: C.text3 }}>{c.current}</div>
                </div>
              </div>
              <RagPill r={c.rag} />
            </div>
          ))}
        </div>
        <div className="mt-3 text-[10px]" style={{ color: C.text4 }}>
          Compliance composition — {greenCrit} green · {amberCrit} amber · 0 red across {totalCrit} criteria.
        </div>
      </Panel>
    </div>
  )
}

// ─── Criteria tab ───────────────────────────────────────────────────────────

const CriteriaTab = () => {
  const [open, setOpen] = useState<Record<CategoryKey, boolean>>({
    facilities: true, personnel: false, academy: true, sporting: true, medical: false, legal: false,
  })
  const toggle = (k: CategoryKey) => setOpen(s => ({ ...s, [k]: !s[k] }))

  return (
    <div className="space-y-4">
      <Disclaimer />
      {CATEGORIES.map(cat => {
        const Icon = cat.icon
        const list = CRITERIA.filter(c => c.category === cat.key)
        const isOpen = open[cat.key]
        return (
          <div key={cat.key} className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
            <button onClick={() => toggle(cat.key)} className="w-full flex items-center justify-between p-4 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: C.panel2, borderBottom: isOpen ? `1px solid ${C.border}` : 'none' }}>
              <div className="flex items-center gap-3">
                {isOpen ? <ChevronDown size={16} style={{ color: C.text3 }} /> : <ChevronRight size={16} style={{ color: C.text3 }} />}
                <div className="flex h-8 w-8 items-center justify-center rounded-md" style={{ backgroundColor: ragDim(cat.status) }}>
                  <Icon size={16} style={{ color: ragColor(cat.status) }} />
                </div>
                <div className="text-sm font-bold" style={{ color: C.text }}>{cat.label}</div>
                <div className="text-[11px]" style={{ color: C.text4 }}>{list.length} criteria</div>
              </div>
              <RagPill r={cat.status} />
            </button>
            {isOpen && (
              <div>
                {list.map(c => (
                  <div key={c.id} className="p-4" style={{ borderTop: `1px solid ${C.borderSoft}` }}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <span className="text-[10px] font-bold mt-0.5 shrink-0 font-mono" style={{ color: C.text4 }}>{c.id}</span>
                        <div className="text-xs font-semibold" style={{ color: C.text }}>{c.name}</div>
                      </div>
                      <RagPill r={c.rag} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] ml-12">
                      <div>
                        <div className="font-semibold uppercase text-[9px] mb-0.5" style={{ color: C.text4 }}>Threshold (demo)</div>
                        <div style={{ color: C.text3 }}>{c.threshold}</div>
                      </div>
                      <div>
                        <div className="font-semibold uppercase text-[9px] mb-0.5" style={{ color: C.text4 }}>Current</div>
                        <div style={{ color: c.rag === 'green' ? C.good : c.rag === 'amber' ? C.warn : C.bad }}>{c.current}</div>
                      </div>
                      <div>
                        <div className="font-semibold uppercase text-[9px] mb-0.5" style={{ color: C.text4 }}>Evidence on file</div>
                        <div style={{ color: C.text3 }}>{c.evidence}</div>
                      </div>
                      <div>
                        <div className="font-semibold uppercase text-[9px] mb-0.5" style={{ color: C.text4 }}>Next review</div>
                        <div style={{ color: C.text3 }}>{c.nextReview}</div>
                      </div>
                    </div>
                    {c.note && <div className="ml-12 mt-2 text-[11px] italic" style={{ color: C.text3 }}>{c.note}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Risk Register tab ──────────────────────────────────────────────────────

const RiskTab = () => (
  <div className="space-y-4">
    <Disclaimer />
    <Panel>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} style={{ color: C.warn }} />
          <div className="text-sm font-bold" style={{ color: C.text }}>Risk Register</div>
        </div>
        <div className="text-[10px]" style={{ color: C.text4 }}>{RISKS.length} open risks · 0 critical</div>
      </div>
      <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
        <table className="w-full text-sm">
          <thead><tr style={{ backgroundColor: C.panel2, borderBottom: `1px solid ${C.border}` }}>
            {['ID','Category','Risk','Shortfall','Level','Owner','Mitigation ETA'].map(h => (
              <th key={h} className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: C.text4 }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {RISKS.map(r => (
              <tr key={r.criterionId} style={{ borderTop: `1px solid ${C.borderSoft}` }}>
                <td className="p-3 text-[11px] font-bold font-mono" style={{ color: C.text4 }}>{r.criterionId}</td>
                <td className="p-3 text-[11px]" style={{ color: C.text3 }}>{categoryLabel(r.category)}</td>
                <td className="p-3 text-xs font-medium" style={{ color: C.text }}>{r.name}</td>
                <td className="p-3 text-[11px]" style={{ color: C.text3 }}>{r.shortfall}</td>
                <td className="p-3"><RagPill r={r.level} /></td>
                <td className="p-3 text-[11px]" style={{ color: C.text3 }}>{r.owner}</td>
                <td className="p-3 text-[11px] font-semibold" style={{ color: C.text2 }}>{r.eta}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 text-[10px]" style={{ color: C.text4 }}>
        Each open risk is linked to a workstream in the Action Plan tab. ETAs reflect the club&apos;s own
        commitment dates — they are not licensing-body deadlines.
      </div>
    </Panel>
  </div>
)

// ─── Action Plan tab ────────────────────────────────────────────────────────

const ActionsTab = () => {
  const statusPill = (s: ActionItem['status']) => {
    const colour = s === 'On track' ? C.good : s === 'At risk' ? C.warn : C.bad
    return <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide" style={{ backgroundColor: `${colour}22`, color: colour, border: `1px solid ${colour}55` }}>{s}</span>
  }
  return (
    <div className="space-y-4">
      <Disclaimer />
      <Panel>
        <div className="flex items-center gap-2 mb-3">
          <ListChecks size={16} style={{ color: C.accent }} />
          <div className="text-sm font-bold" style={{ color: C.text }}>Action Plan</div>
        </div>
        <div className="space-y-3">
          {ACTIONS.map(a => (
            <div key={a.id} className="rounded-lg p-4" style={{ backgroundColor: C.panel2, border: `1px solid ${C.borderSoft}` }}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="text-[10px] font-bold mt-0.5 font-mono" style={{ color: C.text4 }}>{a.id}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-bold" style={{ color: C.text }}>{a.title}</div>
                    <div className="text-[10px] mt-0.5" style={{ color: C.text4 }}>
                      Linked criteria: {a.links.join(', ')} · Owner: {a.owner} · Due {a.due}
                    </div>
                  </div>
                </div>
                {statusPill(a.status)}
              </div>
              <div className="mt-3 mb-2">
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span style={{ color: C.text4 }}>Progress</span>
                  <span className="font-bold" style={{ color: C.text }}>{a.pct}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: C.borderSoft }}>
                  <div className="h-full rounded-full" style={{ width: `${a.pct}%`, backgroundColor: C.accent }} />
                </div>
              </div>
              <div className="text-[11px] mt-2" style={{ color: C.text3 }}>{a.note}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}

// ─── Audit tab ──────────────────────────────────────────────────────────────

const AuditTab = () => {
  const totalEvidence = Object.values(EVIDENCE_COUNTS).reduce((s, n) => s + n, 0)
  return (
    <div className="space-y-4">
      <Disclaimer />

      <Panel>
        <div className="flex items-center gap-2 mb-3">
          <History size={16} style={{ color: C.accent }} />
          <div className="text-sm font-bold" style={{ color: C.text }}>Audit History</div>
        </div>
        <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
          <table className="w-full text-sm">
            <thead><tr style={{ backgroundColor: C.panel2, borderBottom: `1px solid ${C.border}` }}>
              {['Date','Scope','Outcome (demo)','Auditor'].map(h => (
                <th key={h} className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: C.text4 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {AUDITS.map((a, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${C.borderSoft}` }}>
                  <td className="p-3 text-[11px] font-semibold" style={{ color: C.text2 }}>{a.date}</td>
                  <td className="p-3 text-[11px]" style={{ color: C.text }}>{a.scope}</td>
                  <td className="p-3 text-[11px]" style={{ color: C.text3 }}>{a.outcome}</td>
                  <td className="p-3 text-[11px]" style={{ color: C.text3 }}>{a.auditor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel>
        <div className="flex items-center gap-2 mb-3">
          <FileText size={16} style={{ color: C.accent }} />
          <div className="text-sm font-bold" style={{ color: C.text }}>Evidence Vault</div>
          <div className="ml-auto text-[10px]" style={{ color: C.text4 }}>{totalEvidence} documents across {CATEGORIES.length} categories</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon
            return (
              <div key={cat.key} className="rounded-lg p-3 flex items-center gap-3" style={{ backgroundColor: C.panel2, border: `1px solid ${C.borderSoft}` }}>
                <div className="flex h-8 w-8 items-center justify-center rounded-md" style={{ backgroundColor: ragDim(cat.status) }}>
                  <Icon size={14} style={{ color: ragColor(cat.status) }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold" style={{ color: C.text }}>{cat.label}</div>
                  <div className="text-[10px]" style={{ color: C.text3 }}>{EVIDENCE_COUNTS[cat.key]} documents</div>
                </div>
              </div>
            )
          })}
        </div>
      </Panel>

      <Panel>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-sm font-bold" style={{ color: C.text }}>Re-audit countdown</div>
            <div className="text-[11px] mt-0.5" style={{ color: C.text3 }}>Next audit window: <strong style={{ color: C.text }}>{NEXT_AUDIT}</strong></div>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: C.accentDim, color: '#93C5FD', border: `1px solid ${C.accent}55` }}>
              <CheckCircle2 size={12} className="inline mr-1" /> Mark category for re-evidence
            </button>
            <button className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: C.panel2, color: C.text3, border: `1px solid ${C.border}` }}>
              <ExternalLink size={12} className="inline mr-1" /> Open evidence vault
            </button>
          </div>
        </div>
      </Panel>
    </div>
  )
}

// ─── Main view ──────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: typeof Building2 }[] = [
  { id: 'overview', label: 'Overview',      icon: ShieldCheck },
  { id: 'criteria', label: 'Criteria',      icon: Circle },
  { id: 'risk',     label: 'Risk Register', icon: AlertTriangle },
  { id: 'actions',  label: 'Action Plan',   icon: ListChecks },
  { id: 'audit',    label: 'Audit',         icon: History },
]

export default function FootballClubLicensingView() {
  const [tab, setTab] = useState<Tab>('overview')
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: C.accentDim }}>
          <Building2 size={20} style={{ color: C.accent }} />
        </div>
        <div>
          <h2 className="text-lg font-bold" style={{ color: C.text }}>Club Licensing</h2>
          <p className="text-xs" style={{ color: C.text4 }}>EFL / Premier League compliance workspace — stadium · personnel · academy (EPPP) · sporting · medical · legal</p>
        </div>
      </div>

      <div className="flex gap-1 border-b" style={{ borderColor: C.border }}>
        {TABS.map(t => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors"
              style={{ color: active ? C.accent : C.text3, borderBottom: active ? `2px solid ${C.accent}` : '2px solid transparent', marginBottom: '-1px' }}>
              <Icon size={13} />
              {t.label}{t.id === 'risk' && RISKS.length > 0 ? ` (${RISKS.length})` : ''}
            </button>
          )
        })}
      </div>

      <div>
        {tab === 'overview' && <OverviewTab />}
        {tab === 'criteria' && <CriteriaTab />}
        {tab === 'risk'     && <RiskTab />}
        {tab === 'actions'  && <ActionsTab />}
        {tab === 'audit'    && <AuditTab />}
      </div>
    </div>
  )
}
