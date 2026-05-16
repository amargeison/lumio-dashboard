'use client'

import { useState } from 'react'
import {
  Building2, Users, GraduationCap, Clock, Heart, Stethoscope,
  ShieldCheck, AlertTriangle, ListChecks, History, FileText,
  ChevronDown, ChevronRight, ExternalLink, CheckCircle2, Circle,
} from 'lucide-react'

// Club Licensing — Women's portal flagship compliance module.
//
// BRAND-SAFETY SCOPE:
// - All criteria thresholds, percentages, deadlines, evidence-doc counts,
//   audit outcomes, and document identifiers below are INVENTED demo values.
// - No real WPLL / WSL / WSL 2 licence document numbers are referenced.
// - Lumio does not issue licences. This is a club-side preparation tool,
//   not an accreditation system. Disclaimer visible on every tab.
// - Criteria categories (facilities, staffing, academy, contact hours,
//   welfare, medical) reflect publicly-known WSL / WSL 2 licensing themes;
//   specific figures are illustrative.
//
// Cross-references to ACL Prevention and Kit Manager are TEXTUAL ONLY —
// no nav buttons, per spec.

const C = {
  bg: '#07080F', panel: '#0D0F14', panel2: '#111318',
  border: '#1F2937', borderHi: '#374151', borderSoft: '#1A2030',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280',
  good: '#22C55E', warn: '#F59E0B', bad: '#EF4444',
  accent: '#EC4899', accentDeep: '#BE185D',
  goodDim: 'rgba(34,197,94,0.15)', warnDim: 'rgba(245,158,11,0.15)',
  badDim: 'rgba(239,68,68,0.15)', accentDim: 'rgba(236,72,153,0.12)',
}

type Rag = 'green' | 'amber' | 'red'
type CategoryKey = 'facilities' | 'staffing' | 'academy' | 'contact-hours' | 'welfare' | 'medical'
type Tab = 'overview' | 'criteria' | 'risk' | 'actions' | 'audit'

interface Category {
  key: CategoryKey
  label: string
  icon: typeof Building2
  status: Rag
}

interface Criterion {
  id: string
  category: CategoryKey
  name: string
  rag: Rag
  threshold: string
  current: string
  evidence: string
  nextReview: string
  note?: string
}

interface RiskItem {
  criterionId: string
  category: CategoryKey
  name: string
  shortfall: string
  level: Rag
  owner: string
  eta: string
}

interface ActionItem {
  id: string
  title: string
  links: string[]
  owner: string
  due: string
  pct: number
  status: 'On track' | 'At risk' | 'Blocked'
  note: string
}

interface AuditEntry {
  date: string
  scope: string
  outcome: string
  auditor: string
}

// ─── Demo data ──────────────────────────────────────────────────────────────

const CATEGORIES: Category[] = [
  { key: 'facilities',    label: 'Facilities',    icon: Building2,    status: 'green' },
  { key: 'staffing',      label: 'Staffing',      icon: Users,        status: 'green' },
  { key: 'academy',       label: 'Academy',       icon: GraduationCap, status: 'amber' },
  { key: 'contact-hours', label: 'Contact Hours', icon: Clock,        status: 'amber' },
  { key: 'welfare',       label: 'Welfare',       icon: Heart,        status: 'green' },
  { key: 'medical',       label: 'Medical',       icon: Stethoscope,  status: 'green' },
]

const CRITERIA: Criterion[] = [
  // Facilities — all green
  { id: 'FAC-01', category: 'facilities', name: 'Pitch — hybrid-grass minimum specification', rag: 'green', threshold: 'Hybrid system installed, FIFA Quality Pro test', current: 'Installed Aug 2024 — Quality Pro test pass Sep 2024', evidence: 'Pitch certification PDF · annual maintenance log', nextReview: 'Aug 2026' },
  { id: 'FAC-02', category: 'facilities', name: 'Floodlight luminance', rag: 'green', threshold: '≥ 1,500 lux average', current: '1,720 lux average (Apr 2026 measurement)', evidence: 'Floodlight survey Apr 2026 · electrician sign-off', nextReview: 'Apr 2027' },
  { id: 'FAC-03', category: 'facilities', name: 'Home dressing room — minimum spec', rag: 'green', threshold: '≥ 80 m² with single-gender amenities', current: '108 m² · two lockers per player · physio bay · showers', evidence: 'Floor plan · refurbishment sign-off Sep 2024', nextReview: 'Sep 2027' },
  { id: 'FAC-04', category: 'facilities', name: 'Pitchside medical suite', rag: 'green', threshold: 'Stretcher access · isolation bed · ambulance bay line-of-sight', current: 'Refurbished Sep 2024 — all three met', evidence: 'Medical suite spec · EAP drill Feb 2026', nextReview: 'Sep 2026' },
  { id: 'FAC-05', category: 'facilities', name: 'Hospitality capacity', rag: 'green', threshold: '≥ 200 seated covers', current: '220 covers across two hospitality lounges', evidence: 'Hospitality capacity certificate', nextReview: 'Aug 2026' },
  // Staffing — all green
  { id: 'STA-01', category: 'staffing', name: 'Head coach qualification', rag: 'green', threshold: 'UEFA Pro Licence or recognised equivalent', current: 'Sarah Frost — UEFA Pro Licence (held since 2019)', evidence: 'UEFA Pro Licence certificate on file', nextReview: 'CPD annual' },
  { id: 'STA-02', category: 'staffing', name: 'Full-time S&C ratio', rag: 'green', threshold: '≥ 1 FT S&C per 12 first-team players', current: '2 FT S&C / 24 players (1 : 12)', evidence: 'Contracts on file · qualifications register', nextReview: 'Annually' },
  { id: 'STA-03', category: 'staffing', name: 'Full-time goalkeeper coach', rag: 'green', threshold: '≥ 1 FT goalkeeper coach', current: 'Mark Sutton — FT, UEFA GK B', evidence: 'Contract · qualification', nextReview: 'CPD annual' },
  { id: 'STA-04', category: 'staffing', name: 'Designated welfare lead', rag: 'green', threshold: 'In post · Carney-equivalent training', current: 'Nina Walsh — Welfare Coord, since Jan 2024', evidence: 'Job description · training record', nextReview: 'CPD annual' },
  { id: 'STA-05', category: 'staffing', name: 'Designated safeguarding officer', rag: 'green', threshold: 'In post · current DBS · annual refresher', current: 'DBS current Sep 2025 · refresher complete', evidence: 'DBS certificate · refresher log', nextReview: 'Sep 2026' },
  // Academy — 3 green + 2 amber → AMBER overall
  { id: 'ACA-01', category: 'academy', name: 'Regional Talent Club affiliation', rag: 'green', threshold: 'RTC or equivalent affiliation in place', current: 'Oakridge RTC South-East — operational since 2018', evidence: 'RTC affiliation certificate · annual return', nextReview: 'Annually' },
  { id: 'ACA-02', category: 'academy', name: 'U21 squad size', rag: 'amber', threshold: '≥ 18 registered U21 players', current: '14 registered — 4-player gap', evidence: 'U21 registration return Q1 2026', nextReview: 'Q3 2026', note: 'Active recruitment via dual reg + scholarship intake — see Action AC-01.' },
  { id: 'ACA-03', category: 'academy', name: 'Education partnership', rag: 'green', threshold: 'Accredited HE / FE partner in place', current: 'Sheffield Hallam — partnership renewed 2025', evidence: 'Partnership MoU · student outcomes report', nextReview: 'Annually' },
  { id: 'ACA-04', category: 'academy', name: 'Scholarship academic hours', rag: 'amber', threshold: '≥ 12 hrs/week academic (rising 2027-28)', current: '9 hrs/week — 3-hour shortfall to 2027-28 target', evidence: 'Scholarship academic timetable Q4 2025', nextReview: '2027-28 cycle', note: 'Uplift requires additional academic block — see Action AC-02.' },
  { id: 'ACA-05', category: 'academy', name: 'Senior-pathway integration record', rag: 'green', threshold: 'Annual publication of academy-to-senior transitions', current: 'Published Aug 2025 — 4 transitions reported', evidence: 'Pathway integration report 2024-25', nextReview: 'Aug 2026' },
  // Contact Hours — 3 green + 2 amber → AMBER overall
  { id: 'CON-01', category: 'contact-hours', name: 'First-team weekly contact hours', rag: 'amber', threshold: '≥ 16 hrs/week (rising to 20 by 2027-28)', current: '14 hrs/week — 2-hour shortfall to current minimum', evidence: 'Weekly schedule template Q2 2026', nextReview: 'Jan 2027', note: 'Midweek schedule restructure underway — see Action AC-03.' },
  { id: 'CON-02', category: 'contact-hours', name: 'Pre-season residential duration', rag: 'green', threshold: '≥ 14 days', current: '16 days — Cotswold base + away friendlies', evidence: 'Pre-season plan 2025/26 · attendance log', nextReview: 'Annually' },
  { id: 'CON-03', category: 'contact-hours', name: 'Recovery provision', rag: 'green', threshold: 'Cryotherapy · hydrotherapy · sleep monitoring', current: 'All three present (Lumio Health sleep + cryo + hydro suite)', evidence: 'Equipment register · usage log', nextReview: 'Annually' },
  { id: 'CON-04', category: 'contact-hours', name: 'S&C minimum frequency', rag: 'green', threshold: '≥ 4 sessions/week', current: '4 standard, 5 in peak weeks', evidence: 'Weekly schedule · attendance log', nextReview: 'Annually' },
  { id: 'CON-05', category: 'contact-hours', name: 'Video / opposition analysis hours', rag: 'amber', threshold: '≥ 3 hrs/week team analysis', current: '2.5 hrs/week — analyst capacity gap', evidence: 'Analyst rota · session log', nextReview: 'Jun 2026', note: 'Recruitment for PT 0.6 FTE second analyst in progress — see Action AC-04.' },
  // Welfare — all green
  { id: 'WEL-01', category: 'welfare', name: 'Independent welfare officer', rag: 'green', threshold: 'In post · independent reporting line', current: 'Nina Walsh in post since Jan 2024', evidence: 'Job description · independent reporting policy', nextReview: 'CPD annual' },
  { id: 'WEL-02', category: 'welfare', name: 'Mental-health pathway', rag: 'green', threshold: 'Sport psychologist + external referral pathway', current: 'Dr Anna Reid (sport psychology) + Headspace referral framework', evidence: 'Psychology contract · referral pathway doc', nextReview: 'Annually' },
  { id: 'WEL-03', category: 'welfare', name: 'Cycle-aware training adoption', rag: 'green', threshold: 'Opt-in cycle-aware adjustment programme', current: 'Lumio Cycle deployed · opt-in 14/22 · auto-adjustments live', evidence: 'Programme spec · opt-in audit', nextReview: 'Annually', note: 'Squad ACL prevention adherence tracked in ACL Risk Monitor → ACL Prevention Programme.' },
  { id: 'WEL-04', category: 'welfare', name: 'Parental package', rag: 'green', threshold: '≥ 14 wks full pay (FIFA Art. 18quater minimum)', current: '26 weeks full pay (WSL standard) — exceeds minimum', evidence: 'Maternity policy · player handbook', nextReview: 'Annually' },
  { id: 'WEL-05', category: 'welfare', name: 'Period product provision', rag: 'green', threshold: 'Provision in all changing & matchday areas', current: '4 locations stocked · weekly restock cadence', evidence: 'Restock log · Welfare Coord review', nextReview: 'Quarterly', note: 'Restock cadence visible in Kit Manager → Period Product Provision.' },
  // Medical — all green
  { id: 'MED-01', category: 'medical', name: 'Full-time physio ratio', rag: 'green', threshold: '≥ 1 FT physio per 14 players', current: '2 FT physios / 24 players (1 : 12)', evidence: 'Contracts · HCPC registration', nextReview: 'Annually' },
  { id: 'MED-02', category: 'medical', name: 'Club doctor presence', rag: 'green', threshold: 'Matchday cover + weekly clinic', current: 'Dr Anna Reid — matchday + Tue/Thu clinic', evidence: 'GMC registration · matchday cover log', nextReview: 'Annually' },
  { id: 'MED-03', category: 'medical', name: 'HIA-compliant concussion SOP', rag: 'green', threshold: 'FA-aligned protocol · GRTP active', current: 'Concussion SOP v3 · GRTP module live', evidence: 'SOP document · GRTP module log', nextReview: 'Annually' },
  { id: 'MED-04', category: 'medical', name: 'ACL screening cadence', rag: 'green', threshold: 'Quarterly for high-risk · 6-monthly baseline', current: 'Quarterly active · 4 players overdue (in catch-up)', evidence: 'Screening log · catch-up scheduler', nextReview: 'Monthly', note: 'Detail in ACL Risk Monitor.' },
  { id: 'MED-05', category: 'medical', name: 'Emergency Action Plan', rag: 'green', threshold: 'EAP signed · drilled annually', current: 'EAP v4 · drilled 14 Feb 2026', evidence: 'EAP doc · drill report', nextReview: 'Feb 2027' },
]

const RISKS: RiskItem[] = CRITERIA
  .filter(c => c.rag !== 'green')
  .map(c => ({
    criterionId: c.id,
    category: c.category,
    name: c.name,
    shortfall: c.current,
    level: c.rag,
    owner:
      c.id === 'ACA-02' ? 'Kate Brennan (Director) + DoF' :
      c.id === 'ACA-04' ? 'Academy Manager' :
      c.id === 'CON-01' ? 'Sarah Frost + Head of Performance' :
      c.id === 'CON-05' ? 'Head Analyst' :
                          'Welfare Lead',
    eta:
      c.id === 'ACA-02' ? 'Jul 2026' :
      c.id === 'ACA-04' ? 'Sep 2027' :
      c.id === 'CON-01' ? 'Jan 2027' :
      c.id === 'CON-05' ? 'Jun 2026' :
                          'TBC',
  }))

const ACTIONS: ActionItem[] = [
  { id: 'AC-01', title: 'Academy U21 expansion', links: ['ACA-02'], owner: 'Kate Brennan + DoF', due: 'Jul 2026', pct: 35, status: 'On track',
    note: 'Recruitment of 4 additional U21 players via dual-reg + Sep 2026 scholarship intake. 2 dual-reg agreements provisionally signed.' },
  { id: 'AC-02', title: 'Scholarship academic hours uplift', links: ['ACA-04'], owner: 'Academy Manager', due: 'Sep 2027', pct: 15, status: 'On track',
    note: 'Sheffield Hallam partnership extension under negotiation to add a second weekly academic block. Long-lead workstream.' },
  { id: 'AC-03', title: 'First-team contact hours restructure', links: ['CON-01'], owner: 'Sarah Frost + Head of Performance', due: 'Jan 2027', pct: 55, status: 'On track',
    note: 'Thursday-PM tactical block added pre-season 2026/27 (provisional) — pending pitch availability sign-off.' },
  { id: 'AC-04', title: 'Video analysis capacity uplift', links: ['CON-05'], owner: 'Head Analyst', due: 'Jun 2026', pct: 70, status: 'On track',
    note: 'Second analyst (0.6 FTE) — shortlist of 3 candidates, interviews w/c 18 May 2026.' },
]

const AUDITS: AuditEntry[] = [
  { date: '14 Mar 2026', scope: 'Annual licence review',     outcome: 'Provisional — 4 of 6 categories green, 2 amber', auditor: 'Independent auditor' },
  { date: '12 Sep 2025', scope: 'Welfare-specific audit',     outcome: 'Pass with commendation',                          auditor: 'WPLL framework' },
  { date: '02 Jul 2025', scope: 'Academy & pathway audit',    outcome: 'Conditional pass — uplift required (ACA-04)',     auditor: 'FA framework' },
  { date: '18 Mar 2025', scope: 'Initial licence audit',      outcome: 'Provisional licence granted',                     auditor: 'Independent auditor' },
]

const EVIDENCE_COUNTS: Record<CategoryKey, number> = {
  facilities: 24, staffing: 18, academy: 32, 'contact-hours': 12, welfare: 28, medical: 35,
}

const NEXT_AUDIT = '14 Sep 2026'

// ─── Helpers ────────────────────────────────────────────────────────────────

const ragColor = (r: Rag) => r === 'red' ? C.bad : r === 'amber' ? C.warn : C.good
const ragDim   = (r: Rag) => r === 'red' ? C.badDim : r === 'amber' ? C.warnDim : C.goodDim
const ragLabel = (r: Rag) => r === 'red' ? 'BELOW STANDARD' : r === 'amber' ? 'PARTIAL' : 'COMPLIANT'

const categoryLabel = (k: CategoryKey) => CATEGORIES.find(c => c.key === k)?.label ?? k
const categoryIcon  = (k: CategoryKey) => CATEGORIES.find(c => c.key === k)?.icon ?? Building2

// ─── Primitives ─────────────────────────────────────────────────────────────

const Panel = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-xl p-5 ${className ?? ''}`} style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>{children}</div>
)

const RagPill = ({ r, size = 'sm' }: { r: Rag; size?: 'sm' | 'xs' }) => (
  <span
    className={`inline-flex items-center gap-1 rounded font-bold ${size === 'xs' ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'}`}
    style={{ backgroundColor: ragDim(r), color: ragColor(r), border: `1px solid ${ragColor(r)}55` }}
  >
    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ragColor(r) }} />
    {ragLabel(r)}
  </span>
)

const Disclaimer = () => (
  <div
    className="rounded-lg p-3 text-[11px] leading-relaxed mb-4"
    style={{ backgroundColor: C.accentDim, border: `1px solid ${C.accent}55`, color: '#FBCFE8' }}
  >
    <strong style={{ color: '#F9A8D4' }}>Demo data — illustrative only.</strong>{' '}
    Criteria categories below reflect publicly-known WSL / WSL 2 licensing themes. All specific
    thresholds, percentages, deadlines, evidence counts, audit outcomes and document references
    are invented demo values and do not represent any real licensing decision. Lumio does not
    issue licences; this module is a club-side preparation workspace.
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
              <span className="text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wide" style={{ backgroundColor: C.warnDim, color: C.warn, border: `1px solid ${C.warn}55` }}>2 categories amber</span>
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
    facilities: true, staffing: false, academy: true, 'contact-hours': true, welfare: false, medical: false,
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
            <button
              onClick={() => toggle(cat.key)}
              className="w-full flex items-center justify-between p-4 hover:opacity-90 transition-opacity"
              style={{ backgroundColor: C.panel2, borderBottom: isOpen ? `1px solid ${C.border}` : 'none' }}
            >
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
              <div className="divide-y" style={{ borderColor: C.border }}>
                {list.map(c => (
                  <div key={c.id} className="p-4" style={{ borderTop: `1px solid ${C.borderSoft}` }}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <span className="text-[10px] font-bold mt-0.5 shrink-0" style={{ color: C.text4 }}>{c.id}</span>
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
                    {c.note && (
                      <div className="ml-12 mt-2 text-[11px] italic" style={{ color: C.text3 }}>{c.note}</div>
                    )}
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
            <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: C.text4 }}>ID</th>
            <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: C.text4 }}>Category</th>
            <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: C.text4 }}>Risk</th>
            <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: C.text4 }}>Shortfall</th>
            <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: C.text4 }}>Level</th>
            <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: C.text4 }}>Owner</th>
            <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: C.text4 }}>Mitigation ETA</th>
          </tr></thead>
          <tbody>
            {RISKS.map(r => (
              <tr key={r.criterionId} style={{ borderTop: `1px solid ${C.borderSoft}` }}>
                <td className="p-3 text-[11px] font-bold" style={{ color: C.text4 }}>{r.criterionId}</td>
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
        Each open risk is linked to a workstream in the Action Plan tab. ETAs reflect the
        club&apos;s own commitment dates — they are not licensing-body deadlines.
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
                  <span className="text-[10px] font-bold mt-0.5" style={{ color: C.text4 }}>{a.id}</span>
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
              <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: C.text4 }}>Date</th>
              <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: C.text4 }}>Scope</th>
              <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: C.text4 }}>Outcome (demo)</th>
              <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: C.text4 }}>Auditor</th>
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
          <div className="ml-auto text-[10px]" style={{ color: C.text4 }}>{totalEvidence} documents across 6 categories</div>
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
            <button className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: C.accentDim, color: '#F9A8D4', border: `1px solid ${C.accent}55` }}>
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
  { id: 'overview', label: 'Overview',       icon: ShieldCheck },
  { id: 'criteria', label: 'Criteria',       icon: Circle },
  { id: 'risk',     label: 'Risk Register',  icon: AlertTriangle },
  { id: 'actions',  label: 'Action Plan',    icon: ListChecks },
  { id: 'audit',    label: 'Audit',          icon: History },
]

export default function ClubLicensingView() {
  const [tab, setTab] = useState<Tab>('overview')
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: C.accentDim }}>
          <Building2 size={20} style={{ color: C.accent }} />
        </div>
        <div>
          <h2 className="text-lg font-bold" style={{ color: C.text }}>Club Licensing</h2>
          <p className="text-xs" style={{ color: C.text4 }}>Compliance workspace — facilities · staffing · academy · contact hours · welfare · medical</p>
        </div>
      </div>

      <div className="flex gap-1 border-b" style={{ borderColor: C.border }}>
        {TABS.map(t => {
          const Icon = t.icon
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors"
              style={{
                color: active ? C.accent : C.text3,
                borderBottom: active ? `2px solid ${C.accent}` : '2px solid transparent',
                marginBottom: '-1px',
              }}
            >
              <Icon size={13} />
              {t.label}
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
