'use client'

import { useState } from 'react'
import {
  Shield, BookOpen, Scale, Heart, TrendingUp, FileText,
  ExternalLink, Upload, ChevronDown, ChevronRight,
  Users, MapPin, Stethoscope, Activity, Briefcase,
  GraduationCap, Baby, Brain, Flower2, Crown, Calendar,
} from 'lucide-react'

const C = {
  bg: '#07080F', panel: '#111318', panel2: '#0D0F14',
  border: '#1F2937', borderHi: '#374151',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280',
  good: '#22C55E', warn: '#F59E0B', bad: '#EF4444', accent: '#BE185D',
  goodDim: 'rgba(34,197,94,0.15)', warnDim: 'rgba(245,158,11,0.15)', badDim: 'rgba(239,68,68,0.15)',
  accentDim: 'rgba(190,24,93,0.15)',
}

type Rag = 'green' | 'amber' | 'red' | 'unassessed'
type Tab = 'carney' | 'wpll' | 'equal' | 'welfare' | 'investment' | 'resources'

const ragColor = (r: Rag) => r === 'red' ? C.bad : r === 'amber' ? C.warn : r === 'unassessed' ? C.text4 : C.good
const ragLabel = (r: Rag) => r === 'green' ? 'COMPLIANT' : r === 'amber' ? 'PARTIAL' : r === 'red' ? 'BELOW STANDARD' : 'NOT YET ASSESSED'

// ─── Carney Review (10 recommendations) ───────────────────────────────────

interface CarneyRec {
  n: number
  title: string
  text: string
  status: Rag
  position: string
  reviewed: string
  evidence: string[]
  actions: { txt: string; done: boolean }[]
}

const CARNEY: CarneyRec[] = [
  { n: 1, title: 'Independent body for the women\'s professional game',
    text: 'Establish a new, independent body — a New Co — to take responsibility for the women\'s professional game, distinct from the men\'s game and the FA, with appropriate funding and remit.',
    status: 'green',
    position: 'Women\'s Professional Leagues Limited (WPLL) launched in 2024 and is now the operating body for WSL and Championship. Oakridge Women FC is a constituent member.',
    reviewed: '12 Mar 2026',
    evidence: ['WPLL membership confirmation (Aug 2024)', 'WPLL constituency vote record', 'WPLL operating standards subscription'],
    actions: [{ txt: 'Annual WPLL constituency review attendance', done: true }] },
  { n: 2, title: 'Treat women\'s football as elite sport',
    text: 'Apply minimum operating standards in line with elite sport — including facilities, medical and S&C provision — to all WSL and Championship clubs.',
    status: 'amber',
    position: 'Facilities at parity with men\'s first team. Medical hours below WPLL minimum standard target by 14 hours/week — additional physio cover budgeted Y2.',
    reviewed: '04 Apr 2026',
    evidence: ['Facilities audit Q1 2026', 'Medical staffing rota (current)', 'WPLL minimum standards self-assessment'],
    actions: [
      { txt: 'Hire 2nd physio (target Aug 2026)', done: false },
      { txt: 'Add 1 additional doctor day/week', done: false },
    ] },
  { n: 3, title: 'Long-term broadcast and commercial independence',
    text: 'Build a sustainable, independent broadcast and commercial strategy for the women\'s game — distinct rights, distinct sponsors, distinct narrative.',
    status: 'green',
    position: 'WSL/Championship broadcast deal with BBC and Sky Sports running 2024-2030. Standalone commercial pipeline operational.',
    reviewed: '20 Feb 2026',
    evidence: ['WPLL broadcast contract excerpt (BBC + Sky 2024-2030)', 'Standalone sponsorship pipeline report'],
    actions: [{ txt: 'Quarterly broadcast partner relationship review', done: true }] },
  { n: 4, title: 'Equal access to facilities and provision',
    text: 'Ensure women\'s teams have equal access to facilities, training conditions, medical provision and matchday operations — at parity with the men\'s first team.',
    status: 'amber',
    position: 'See Equal Access tab — currently 62% parity score. Gaps in medical hours, S&C provision, video analysis, scouting resource.',
    reviewed: '10 Apr 2026',
    evidence: ['Equal Access Audit Q3 2025', 'Equal Access Audit Q1 2026'],
    actions: [
      { txt: 'Close medical hours gap by Aug 2026', done: false },
      { txt: 'Equalise video analyst hours by Jan 2027', done: false },
      { txt: 'Strategic Investment Plan ratified by board', done: true },
    ] },
  { n: 5, title: 'Player welfare standards',
    text: 'Implement comprehensive welfare standards covering pregnancy, maternity, return-to-play protocols, mental health provision and confidential disclosure pathways.',
    status: 'green',
    position: 'Maternity policy v3.2 in force. RTP protocols documented. Mental health partnership with national provider. Independent welfare officer in post.',
    reviewed: '02 Apr 2026',
    evidence: ['Welfare policy v3.2 (Sept 2025)', 'Maternity policy', 'Mental health partnership SLA (Mind, Mar 2025)', 'Independent welfare officer appointment letter'],
    actions: [{ txt: 'Annual welfare report — Sept 2026', done: false }] },
  { n: 6, title: 'Independent director / commissioner role',
    text: 'Establish an independent director or commissioner with specific remit for the women\'s professional game, with sufficient seniority and funding.',
    status: 'red',
    position: 'Board currently lacks a dedicated women\'s-game independent director. Recruitment process opened Q1 2026 — search firm appointed, target appointment Q3 2026.',
    reviewed: '08 Apr 2026',
    evidence: ['Board minutes — recruitment authorisation (12 Feb 2026)', 'Search firm engagement letter'],
    actions: [
      { txt: 'Shortlist by Jun 2026', done: false },
      { txt: 'Board interviews Jul 2026', done: false },
      { txt: 'Target appointment Q3 2026', done: false },
    ] },
  { n: 7, title: 'Increase fan attendance and engagement',
    text: 'Drive fan attendance through affordable family ticketing, accessible venues and long-term fan engagement programmes.',
    status: 'green',
    position: 'Average attendance up 18% YoY. Family ticket bundle in place since 2024. Standalone supporters\' association liaison active.',
    reviewed: '28 Mar 2026',
    evidence: ['Attendance YoY report Q1 2026', 'Family ticket scheme T&Cs', 'Supporters\' Association quarterly minutes'],
    actions: [{ txt: 'Continue family-ticket promotion through season', done: true }] },
  { n: 8, title: 'Schools partnership for pathway visibility',
    text: 'Build durable partnerships between women\'s clubs and local schools, creating a visible pathway for girls into the professional game.',
    status: 'amber',
    position: 'Active partnerships with 8 of target 12 schools. 4 additional partnerships in pipeline — target completion Sept 2026.',
    reviewed: '01 Apr 2026',
    evidence: ['Schools partnership register Q1 2026', 'Foundation programme delivery report'],
    actions: [
      { txt: '4 additional school partnerships by Sept 2026', done: false },
      { txt: 'Pathway open day with all 12 schools — May 2026', done: false },
    ] },
  { n: 9, title: 'Investment in elite player pathway',
    text: 'Invest in Regional Talent Centres, Emerging Talent Centres and dual-registration arrangements to create a robust elite player pathway.',
    status: 'green',
    position: 'RTC fully funded for 2025-2028 cycle. 3 dual-registration academy partnerships active. Pathway to first team via U21 → senior squad documented.',
    reviewed: '18 Mar 2026',
    evidence: ['RTC funding agreement 2025-2028', 'Dual-reg agreements (3 active partner clubs)', 'Pathway documentation v2'],
    actions: [{ txt: 'RTC midpoint review — Sept 2026', done: false }] },
  { n: 10, title: 'Player voice in governance',
    text: 'Embed players in governance and welfare decision-making — players\' association representation, formal consultation on welfare and contract changes.',
    status: 'green',
    position: 'Players\' representative elected to welfare board. Quarterly welfare consultations held. PFA recognised as players\' association partner.',
    reviewed: '22 Feb 2026',
    evidence: ['Welfare board ToR (Feb 2025)', 'Quarterly consultation minutes (last 4 sessions)', 'PFA partnership letter'],
    actions: [{ txt: 'Q2 welfare consultation — Jun 2026', done: false }] },
]

// ─── WPLL Minimum Standards (6 categories) ────────────────────────────────

interface WpllCategory {
  title: string
  icon: React.ElementType
  metrics: { label: string; value: string; status: Rag; sub?: string }[]
  status: Rag
}

const WPLL_CATEGORIES: WpllCategory[] = [
  { title: 'Facilities', icon: MapPin, status: 'amber', metrics: [
    { label: 'Training ground access — women\'s first team', value: '28 hrs/wk', status: 'amber', sub: 'Target 35 hrs (parity with men\'s)' },
    { label: 'Match-day stadium access',                     value: 'Full',     status: 'green', sub: 'Oakridge Park primary venue' },
    { label: 'Medical room provision',                       value: 'Dedicated', status: 'green', sub: 'On training ground site' },
    { label: 'S&C facility access',                          value: '24 hrs/wk', status: 'amber', sub: 'Target 32 hrs (parity)' },
  ] },
  { title: 'Medical & S&C', icon: Stethoscope, status: 'amber', metrics: [
    { label: 'Doctor coverage',                              value: '14 hrs/wk', status: 'amber', sub: 'Target 18 hrs (WPLL minimum)' },
    { label: 'Physio coverage',                              value: '28 hrs/wk', status: 'amber', sub: 'Target 36 hrs · Y2 hire planned' },
    { label: 'S&C coach provision',                          value: '2 dedicated', status: 'green', sub: 'Plus 1 shared with academy' },
    { label: 'Sports science / nutrition',                   value: '8 hrs/wk',   status: 'amber', sub: 'Target 12 hrs · contractor in flight' },
  ] },
  { title: 'Governance', icon: Users, status: 'amber', metrics: [
    { label: 'Dedicated MD for women\'s side',               value: 'Yes',      status: 'green', sub: 'Kate Brennan, since Jul 2024' },
    { label: 'Board representation for women\'s game',       value: 'In progress', status: 'red', sub: 'Independent director — target Q3 2026' },
    { label: 'Independent welfare officer',                  value: 'Yes',      status: 'green', sub: 'Sarah Martinez, since Mar 2025' },
    { label: 'Players\' association engagement',             value: 'Active',   status: 'green', sub: 'PFA partnership · quarterly consultations' },
  ] },
  { title: 'Commercial & Resourcing', icon: Briefcase, status: 'green', metrics: [
    { label: 'Standalone women\'s commercial pipeline',      value: 'Yes',      status: 'green', sub: 'Decoupled from men\'s commercial' },
    { label: 'Marketing budget per home fixture',            value: '£14,800',  status: 'green', sub: 'WPLL benchmark: £12k · 23% above' },
    { label: 'Match-day revenue retention (women\'s)',       value: '100%',     status: 'green', sub: 'All gate + F&B retained by women\'s P&L' },
    { label: 'Sponsor activation independence',              value: 'Full',     status: 'green', sub: 'Activations approved by women\'s commercial' },
  ] },
  { title: 'Contract Minimums', icon: FileText, status: 'green', metrics: [
    { label: 'Minimum contract length',                      value: '2 years',  status: 'green', sub: 'WPLL minimum: 1 year · exceeded' },
    { label: 'Minimum salary band',                          value: '£28k',     status: 'green', sub: 'WPLL minimum: £24k · exceeded' },
    { label: 'Maternity provision in contract',              value: 'Standard clause', status: 'green', sub: 'Aligned to WPLL template' },
    { label: 'Mental health provision in contract',          value: 'Standard clause', status: 'green', sub: 'Aligned to WPLL template' },
  ] },
  { title: 'Pathway', icon: GraduationCap, status: 'green', metrics: [
    { label: 'Academy / RTC funding',                        value: 'Fully funded', status: 'green', sub: '2025-2028 cycle ratified' },
    { label: 'U21 / U18 squad provision',                    value: 'U21 + U18 active', status: 'green', sub: 'Both squads with dedicated coaching' },
    { label: 'Schools partnerships',                         value: '8 of 12',   status: 'amber', sub: '4 in pipeline · target Sept 2026' },
    { label: 'Dual-registration partnerships',               value: '3 active',  status: 'green', sub: 'Tier 3-4 partner clubs' },
  ] },
]

// ─── Equal Access Audit ───────────────────────────────────────────────────

const EQUAL_ACCESS_ROWS = [
  { cat: 'Training facilities — pitch access',     w: '28 hrs/wk',         m: '35 hrs/wk',        gap: '−7 hrs',     status: 'amber' as Rag },
  { cat: 'Medical staff hours (Dr + Physio)',      w: '42 hrs/wk',         m: '78 hrs/wk',        gap: '−36 hrs',    status: 'red' as Rag },
  { cat: 'S&C provision — coaches + facility',     w: '24 hrs/wk',         m: '40 hrs/wk',        gap: '−16 hrs',    status: 'amber' as Rag },
  { cat: 'Kit allocation — annual budget / player',w: '£1,800',            m: '£2,100',           gap: '−£300 (14%)', status: 'green' as Rag },
  { cat: 'Match-day operations — staff + budget',  w: '£18k / fixture',    m: '£85k / fixture',   gap: '−£67k',      status: 'red' as Rag },
  { cat: 'Travel standards — coach + hotel',       w: 'Standard + 3-star', m: 'Charter + 4-star', gap: 'Tier diff.', status: 'amber' as Rag },
  { cat: 'Hospitality access',                      w: 'Family lounge',     m: 'Lounge + boxes',   gap: 'Boxes absent', status: 'amber' as Rag },
  { cat: 'Recovery facilities',                     w: 'Shared, scheduled', m: 'Dedicated access', gap: 'Scheduling',  status: 'amber' as Rag },
  { cat: 'Video analysis — analyst hours / fixture',w: '8 hrs',             m: '18 hrs',           gap: '−10 hrs',    status: 'amber' as Rag },
  { cat: 'Scouting resource — scouts + travel',    w: '1 scout · £8k',     m: '6 scouts · £45k',  gap: 'Significant', status: 'red' as Rag },
]

// Match-day note: women's vs men's match-day costs reflect different fixture
// scale (women's at training-ground stadium; men's at primary stadium with
// full safety + commercial overhead). This is contextual, not a parity gap
// that can be closed by spend alone — flagged in detail row below.

// ─── Welfare cards ────────────────────────────────────────────────────────

const WELFARE_CARDS = [
  { title: 'Maternity Policy Compliance',     icon: Baby,
    metrics: [
      ['Policy version', 'v3.2 (adopted Sept 2025)'],
      ['Players currently on maternity', '1 (Ava Mitchell, Phase 2 RTP)'],
      ['Return-to-play protocols', 'Documented · UEFA-aligned'],
      ['Training adaptation policy', 'In place · cycle-aware'],
    ], status: 'green' as Rag },
  { title: 'ACL Prevention Programme',        icon: Activity,
    metrics: [
      ['Programme status', 'Active (Nordic + landing mechanics, weekly)'],
      ['Players in elevated risk band', '2 (Emily Zhang, Niamh Gallagher)'],
      ['Last cohort assessment', 'Mar 2026 — full squad screened'],
      ['Cross-link', 'Performance > ACL Risk Monitor'],
    ], status: 'green' as Rag },
  { title: 'Mental Health Provision',         icon: Brain,
    metrics: [
      ['Provider partnership', 'Mind — partnership active since Mar 2025'],
      ['24/7 access', 'Available · player-controlled visibility'],
      ['Player utilisation rate', '15% (anonymous · last 12 months)'],
      ['Welfare check-in completion', '87% squad coverage'],
    ], status: 'green' as Rag },
  { title: 'Cycle Awareness Programme',       icon: Flower2,
    metrics: [
      ['Training adaptation policy', 'In place (with consent)'],
      ['Players engaged with programme', '18 of 25 (anonymous count)'],
      ['Educational sessions to staff', '6 delivered (Sept 2025 — Mar 2026)'],
      ['Cross-link', 'Performance > Cycle Tracker'],
    ], status: 'green' as Rag },
  { title: 'Independent Welfare Officer',     icon: Shield,
    metrics: [
      ['Officer', 'Sarah Martinez (Welfare Lead)'],
      ['Reports to', 'MD direct (independent of football operations)'],
      ['Annual welfare report', 'Sept 2025 published · Sept 2026 due'],
      ['Confidential disclosure pathway', 'Documented · two routes'],
    ], status: 'green' as Rag },
  { title: 'Player Voice in Welfare Decisions', icon: Users,
    metrics: [
      ['Player rep elected', 'Yes — Lucy Whitmore (Captain)'],
      ['Quarterly welfare consultation', 'Active · 4 sessions Apr 2025 → present'],
      ['Concerns raised / resolved (12 mo)', '4 raised · 4 resolved'],
      ['Player satisfaction with welfare', '92% (anonymous survey · Sept 2025)'],
    ], status: 'green' as Rag },
]

// ─── Strategic Investment Plan (3-year forward) ───────────────────────────

const INVESTMENT_PLAN = [
  { gap: 'Medical hours (Carney #2 / Equal Access)',     y1: '£60k',  y2: '£180k',  y3: '£200k', outcome: 'Close gap from −36 hrs to −10 hrs (Y2) → parity (Y3)' },
  { gap: 'S&C provision (Equal Access)',                  y1: '£25k',  y2: '£90k',   y3: '£100k', outcome: 'Add 1 dedicated S&C coach (Y2); equal facility hours (Y3)' },
  { gap: 'Independent Director (Carney #6)',              y1: '£40k',  y2: '£90k',   y3: '£90k',  outcome: 'Search firm + 1st year compensation; full-board capability Y2' },
  { gap: 'Schools partnerships (Carney #8)',              y1: '£18k',  y2: '£24k',   y3: '£26k',  outcome: '+4 partner schools (Y2 → 12 of 12); pathway visibility complete' },
  { gap: 'Video analysis hours (Equal Access)',           y1: '£20k',  y2: '£55k',   y3: '£60k',  outcome: 'Hire dedicated women\'s analyst (Y2) → parity in analyst-hours' },
  { gap: 'Scouting resource (Equal Access)',              y1: '£15k',  y2: '£75k',   y3: '£120k', outcome: '+2 scouts + travel budget tier-up (Y3 → 60% of men\'s scouting capacity)' },
]

// ─── Resources & Documents ────────────────────────────────────────────────

// Note: external link URLs below are demo placeholders only — no live linkage.
const EXTERNAL_RESOURCES = [
  { name: 'Independent Review of Women\'s Football (Carney, July 2023)', source: 'gov.uk', summary: '10 strategic recommendations for women\'s professional football' },
  { name: 'WPLL Minimum Standards (latest version)',                    source: 'wpll.org', summary: 'Operational standards across facilities, medical, governance, contracts, pathway' },
  { name: 'FA Women\'s Football Strategy 2024-2028',                     source: 'thefa.com', summary: 'Strategic plan for women\'s football across all levels' },
  { name: 'WPLL Annual Report',                                          source: 'wpll.org', summary: 'Operating performance · season-by-season league data' },
  { name: 'Sport England — Women\'s Game Equal Access Research',         source: 'sportengland.org', summary: 'Benchmarking studies on women\'s vs men\'s provision in elite sport' },
  { name: 'PFA / FIFPRO Women\'s Football Welfare Standards',           source: 'pfa.com', summary: 'International welfare standards reference' },
  { name: 'Karen Carney Review — 1 Year On (2024)',                      source: 'gov.uk', summary: 'Progress report on the original 10 recommendations' },
]

const INTERNAL_EVIDENCE = [
  { name: 'Welfare policy v3.2',                  type: 'Policy',    updated: 'Sept 2025', owner: 'Welfare Lead', status: 'current' as const },
  { name: 'Maternity policy',                     type: 'Policy',    updated: 'Aug 2024',  owner: 'HR',           status: 'current' as const },
  { name: 'Equal Access Audit — Q3 2025',         type: 'Audit',     updated: 'Oct 2025',  owner: 'MD',            status: 'current' as const },
  { name: 'Equal Access Audit — Q1 2026',         type: 'Audit',     updated: 'Apr 2026',  owner: 'MD',            status: 'current' as const },
  { name: 'ACL prevention programme',             type: 'Programme', updated: 'Jan 2026',  owner: 'Performance',   status: 'current' as const },
  { name: 'Mental health partnership SLA (Mind)', type: 'Contract',  updated: 'Mar 2025',  owner: 'MD',            status: 'review' as const },
  { name: 'Player welfare survey results 2025',   type: 'Survey',    updated: 'Sept 2025', owner: 'Welfare Lead', status: 'current' as const },
  { name: 'WPLL self-assessment Q1 2026',          type: 'Compliance',updated: 'Mar 2026',  owner: 'MD',            status: 'current' as const },
]

// ─── Scoring helpers ──────────────────────────────────────────────────────

function aggregateScore() {
  const carneyOnTrack = CARNEY.filter(c => c.status === 'green').length // 6 / 10
  const wpllOnTrack   = WPLL_CATEGORIES.filter(c => c.status === 'green').length // 3 / 6
  const equalGood     = EQUAL_ACCESS_ROWS.filter(r => r.status === 'green').length
  const equalTotal    = EQUAL_ACCESS_ROWS.length
  const equalPct      = Math.round((equalGood / equalTotal) * 100) // ~10
  const welfareOnTrack = WELFARE_CARDS.filter(w => w.status === 'green').length // 6 / 6

  // Headline: out of 10 logical "standards on track"
  // Buckets: 4 buckets × ~2.5 weighting each, simplified to total of 10
  // Carney: 4 buckets (count green / total ÷ 10 × 4)
  // WPLL: 2 buckets
  // Equal Access overall: 2 buckets
  // Welfare: 2 buckets
  const carneyScore   = Math.round((carneyOnTrack / 10) * 4) // 6/10 → 2.4 → 2
  const wpllScore     = Math.round((wpllOnTrack / 6) * 2)    // 3/6 → 1
  const equalScore    = Math.round((equalGood / equalTotal) * 2)
  const welfareScore  = Math.round((welfareOnTrack / 6) * 2) // 6/6 → 2

  const headline = carneyScore + wpllScore + equalScore + welfareScore
  return { headline, carneyOnTrack, wpllOnTrack, equalPct, welfareOnTrack }
}

// ─── Component ────────────────────────────────────────────────────────────

interface Props {
  club?: { name?: string } | null
  onNavigate?: (deptId: string) => void
}

export default function GameStandardsView({ club, onNavigate }: Props) {
  void club
  const [tab, setTab] = useState<Tab>('carney')
  const [openCarney, setOpenCarney] = useState<number | null>(null)
  const [openWpll, setOpenWpll] = useState<string | null>(null)

  const score = aggregateScore()

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'carney',     label: 'Carney Review Tracker',  icon: BookOpen },
    { id: 'wpll',       label: 'WPLL Minimum Standards', icon: Scale },
    { id: 'equal',      label: 'Equal Access Audit',     icon: Users },
    { id: 'welfare',    label: 'Welfare & Player Standards', icon: Heart },
    { id: 'investment', label: 'Strategic Investment',  icon: TrendingUp },
    { id: 'resources',  label: 'Resources & Documents', icon: FileText },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <Shield size={20} style={{ color: C.accent }} className="mt-0.5" />
          <div>
            <h1 className="text-xl font-black" style={{ color: C.text }}>Game Standards</h1>
            <p className="text-sm mt-0.5" style={{ color: C.text4 }}>Operating framework for the professional women's game · Carney · WPLL · Equal Access</p>
          </div>
        </div>
        <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <Crown size={16} style={{ color: C.accent }} />
          <div>
            <div className="text-[10px] uppercase tracking-wider" style={{ color: C.text4 }}>Aggregate</div>
            <div className="text-lg font-black" style={{ color: C.text }}>{score.headline} <span className="text-sm" style={{ color: C.text3 }}>/ 10 standards on track</span></div>
            <div className="text-[10px]" style={{ color: C.text4 }}>Carney {score.carneyOnTrack}/10 · WPLL {score.wpllOnTrack}/6 · Equal {score.equalPct}% · Welfare {score.welfareOnTrack}/6</div>
          </div>
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
              <TabIcon size={13} strokeWidth={1.75} />
              {t.label}
            </button>
          )
        })}
      </div>

      <div className="pt-2">
        {tab === 'carney' && (
          <div className="space-y-4">
            <div className="rounded-xl p-4 flex items-center justify-between" style={{ backgroundColor: C.panel2, border: `1px solid ${C.border}` }}>
              <div>
                <div className="text-sm font-bold" style={{ color: C.text }}>Independent Review of Women's Football</div>
                <div className="text-[11px]" style={{ color: C.text4 }}>Karen Carney CBE · July 2023 · 10 strategic recommendations</div>
              </div>
              <div className="text-sm font-black" style={{ color: C.accent }}>{score.carneyOnTrack} / 10 on track</div>
            </div>
            <div className="space-y-2">
              {CARNEY.map(rec => {
                const open = openCarney === rec.n
                return (
                  <div key={rec.n} className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
                    <button onClick={() => setOpenCarney(open ? null : rec.n)} className="w-full flex items-center gap-3 px-4 py-3 text-left">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0" style={{ backgroundColor: ragColor(rec.status) + '26', color: ragColor(rec.status) }}>{rec.n}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold truncate" style={{ color: C.text }}>{rec.title}</div>
                        <div className="text-[11px] mt-0.5" style={{ color: C.text4 }}>Last reviewed {rec.reviewed}</div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: ragColor(rec.status) + '26', color: ragColor(rec.status) }}>{ragLabel(rec.status)}</span>
                      {open ? <ChevronDown size={14} style={{ color: C.text3 }} /> : <ChevronRight size={14} style={{ color: C.text3 }} />}
                    </button>
                    {open && (
                      <div className="px-4 pb-4 pt-2 space-y-3" style={{ borderTop: `1px solid ${C.border}`, backgroundColor: C.panel2 }}>
                        <p className="text-xs italic" style={{ color: C.text2 }}>"{rec.text}"</p>
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: C.text4 }}>Club's current position</div>
                          <p className="text-xs" style={{ color: C.text2 }}>{rec.position}</p>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: C.text4 }}>Evidence on file</div>
                          <ul className="space-y-1">
                            {rec.evidence.map((e, i) => <li key={i} className="text-xs flex items-center gap-2" style={{ color: C.text2 }}><FileText size={10} style={{ color: C.text4 }} />{e}</li>)}
                          </ul>
                        </div>
                        {rec.actions.length > 0 && (
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: C.text4 }}>Action items</div>
                            <ul className="space-y-1">
                              {rec.actions.map((a, i) => (
                                <li key={i} className="text-xs flex items-center gap-2" style={{ color: a.done ? C.text3 : C.text2 }}>
                                  <span className="w-3 h-3 rounded border flex items-center justify-center" style={{ borderColor: a.done ? C.good : C.borderHi, background: a.done ? C.goodDim : 'transparent' }}>
                                    {a.done && <span style={{ color: C.good, fontSize: 8 }}>✓</span>}
                                  </span>
                                  <span style={{ textDecoration: a.done ? 'line-through' : 'none' }}>{a.txt}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <button className="text-[11px] font-semibold px-3 py-1.5 rounded-lg" style={{ background: C.accentDim, color: C.accent, border: `1px solid ${C.accent}40` }}>Update Status</button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="rounded-xl p-4 text-[11px]" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}`, color: C.text3 }}>
              <ExternalLink size={12} className="inline mr-1.5" style={{ color: C.text4 }} />
              Reference: <a href="https://www.gov.uk/government/publications/independent-review-of-womens-football" className="underline" style={{ color: C.accent }}>Independent Review of Women's Football — full report</a>
              <span className="ml-2 text-[10px]" style={{ color: C.text4 }}>(demo link — not active)</span>
            </div>
          </div>
        )}

        {tab === 'wpll' && (
          <div className="space-y-4">
            <div className="rounded-xl p-4 flex items-center justify-between" style={{ backgroundColor: C.panel2, border: `1px solid ${C.border}` }}>
              <div>
                <div className="text-sm font-bold" style={{ color: C.text }}>Women's Professional Leagues Limited</div>
                <div className="text-[11px]" style={{ color: C.text4 }}>WPLL operating standards · 6 categories</div>
              </div>
              <div className="text-sm font-black" style={{ color: C.accent }}>{score.wpllOnTrack} / 6 categories fully compliant</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {WPLL_CATEGORIES.map(cat => {
                const open = openWpll === cat.title
                const CatIcon = cat.icon
                return (
                  <div key={cat.title} className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
                    <button onClick={() => setOpenWpll(open ? null : cat.title)} className="w-full flex items-center gap-3 px-4 py-3 text-left">
                      <CatIcon size={16} style={{ color: ragColor(cat.status) }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold" style={{ color: C.text }}>{cat.title}</div>
                        <div className="text-[11px] mt-0.5" style={{ color: C.text4 }}>{cat.metrics.length} metrics tracked</div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: ragColor(cat.status) + '26', color: ragColor(cat.status) }}>{ragLabel(cat.status)}</span>
                    </button>
                    {open && (
                      <div className="px-4 pb-4 pt-2 space-y-2" style={{ borderTop: `1px solid ${C.border}`, backgroundColor: C.panel2 }}>
                        {cat.metrics.map((m, i) => (
                          <div key={i} className="flex items-start justify-between gap-3 text-xs">
                            <div className="flex-1">
                              <div style={{ color: C.text2 }}>{m.label}</div>
                              {m.sub && <div className="text-[10px] mt-0.5" style={{ color: C.text4 }}>{m.sub}</div>}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="font-bold font-mono" style={{ color: ragColor(m.status) }}>{m.value}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <button className="text-[11px] font-semibold px-4 py-2 rounded-lg" style={{ background: C.accentDim, color: C.accent, border: `1px solid ${C.accent}40` }}>
              Generate WPLL Compliance Report (PDF — coming next sprint)
            </button>
          </div>
        )}

        {tab === 'equal' && (
          <div className="space-y-4">
            <div className="rounded-xl p-4" style={{ backgroundColor: C.panel2, border: `1px solid ${C.border}` }}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-sm font-bold" style={{ color: C.text }}>Equal Access — Women's First Team vs Men's First Team</div>
                  <div className="text-[11px]" style={{ color: C.text4 }}>Carney Recommendation #4 · benchmark of operational provision parity</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black" style={{ color: C.warn }}>{score.equalPct}%</div>
                  <div className="text-[10px]" style={{ color: C.text4 }}>parity score</div>
                </div>
              </div>
              <div className="text-[11px] mt-2 p-2 rounded-lg" style={{ backgroundColor: C.warnDim, color: C.warn }}>
                Forecast: target 85% parity by season 2027/28 (Strategic Investment Plan ratified by board)
              </div>
            </div>
            <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
              <table className="w-full text-xs">
                <thead><tr style={{ background: C.panel2 }}>
                  {['Category','Women\'s first team','Men\'s first team','Gap','Status'].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {EQUAL_ACCESS_ROWS.map((r, i) => {
                    const rc = ragColor(r.status)
                    return (
                      <tr key={i} style={{ borderTop: `1px solid ${C.border}`, background: r.status === 'red' ? `${C.bad}08` : 'transparent' }}>
                        <td className="px-3 py-2.5 font-semibold" style={{ color: C.text }}>{r.cat}</td>
                        <td className="px-3 py-2.5 font-mono" style={{ color: C.text2 }}>{r.w}</td>
                        <td className="px-3 py-2.5 font-mono" style={{ color: C.text3 }}>{r.m}</td>
                        <td className="px-3 py-2.5 font-mono font-bold" style={{ color: rc }}>{r.gap}</td>
                        <td className="px-3 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: rc + '26', color: rc }}>{ragLabel(r.status)}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="rounded-xl p-3 text-[11px]" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}`, color: C.text3 }}>
              <strong style={{ color: C.text2 }}>Note on match-day comparison:</strong> men's match-day cost reflects primary-stadium overhead (full safety + commercial capacity). Women's currently plays at the training-ground stadium for most fixtures. The financial gap above is contextual — the parity question is provision quality, not absolute spend. Reviewed quarterly with women's MD.
            </div>
          </div>
        )}

        {tab === 'welfare' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {WELFARE_CARDS.map(w => {
              const WIcon = w.icon
              return (
                <div key={w.title} className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <WIcon size={16} style={{ color: C.accent }} />
                      <h3 className="text-sm font-bold" style={{ color: C.text }}>{w.title}</h3>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: ragColor(w.status) + '26', color: ragColor(w.status) }}>{ragLabel(w.status)}</span>
                  </div>
                  <div className="space-y-1.5">
                    {w.metrics.map(([k, v], i) => (
                      <div key={i} className="flex justify-between text-[11px]">
                        <span style={{ color: C.text4 }}>{k}</span>
                        <span style={{ color: C.text2 }} className="font-medium text-right ml-3">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {tab === 'investment' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Kpi label="Current-year spend" value="£1.4m" sub="women's-game-specific" accent={C.accent} />
              <Kpi label="Y2 forward plan"     value="£514k" sub="6 remediation lines" accent={C.warn} />
              <Kpi label="3-year total"        value="£1.7m" sub="incremental investment" accent={C.warn} />
              <Kpi label="Target parity score" value="85%"   sub="by 2027/28 season" accent={C.good} />
            </div>
            <div>
              <h3 className="text-sm font-bold mb-2" style={{ color: C.text }}>3-Year Forward Investment Plan — Carney + Equal Access remediation</h3>
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
                <table className="w-full text-xs">
                  <thead><tr style={{ background: C.panel2 }}>
                    {['Gap (linked to)','Y1','Y2','Y3','Expected outcome'].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {INVESTMENT_PLAN.map((p, i) => (
                      <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}>
                        <td className="px-3 py-2.5 font-semibold" style={{ color: C.text }}>{p.gap}</td>
                        <td className="px-3 py-2.5 font-mono" style={{ color: C.text2 }}>{p.y1}</td>
                        <td className="px-3 py-2.5 font-mono" style={{ color: C.text2 }}>{p.y2}</td>
                        <td className="px-3 py-2.5 font-mono" style={{ color: C.text2 }}>{p.y3}</td>
                        <td className="px-3 py-2.5" style={{ color: C.text3 }}>{p.outcome}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="rounded-xl p-4 flex items-center justify-between" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
              <div>
                <div className="text-sm font-bold" style={{ color: C.text }}>Cross-link to Club Vision</div>
                <div className="text-[11px] mt-0.5" style={{ color: C.text4 }}>All investment plans here are reflected in the women's Club Vision multi-year planner.</div>
              </div>
              <button onClick={() => onNavigate?.('club-vision')} className="text-xs font-semibold px-4 py-2 rounded-lg" style={{ background: C.accentDim, color: C.accent, border: `1px solid ${C.accent}40` }}>
                View Full Multi-Year Vision →
              </button>
            </div>
          </div>
        )}

        {tab === 'resources' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold mb-2" style={{ color: C.text }}>External Standards & Research</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {EXTERNAL_RESOURCES.map(r => (
                  <a key={r.name} href="#" onClick={e => e.preventDefault()} className="rounded-xl p-4 block" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="text-sm font-bold" style={{ color: C.text }}>{r.name}</div>
                      <ExternalLink size={12} style={{ color: C.text4 }} className="flex-shrink-0 mt-1" />
                    </div>
                    <div className="text-[11px] mb-1" style={{ color: C.text4 }}>{r.source}</div>
                    <div className="text-[11px]" style={{ color: C.text3 }}>{r.summary}</div>
                  </a>
                ))}
              </div>
              <div className="text-[10px] mt-2" style={{ color: C.text4 }}>External links above are demo placeholders — not active in this build.</div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold" style={{ color: C.text }}>Internal Club Evidence</h3>
                <button className="text-[11px] font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5" style={{ background: C.accentDim, color: C.accent, border: `1px solid ${C.accent}40` }}>
                  <Upload size={12} />Upload New Document
                </button>
              </div>
              <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
                <table className="w-full text-xs">
                  <thead><tr style={{ background: C.panel2 }}>
                    {['Document','Type','Last updated','Owner','Status'].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {INTERNAL_EVIDENCE.map(d => (
                      <tr key={d.name} style={{ borderTop: `1px solid ${C.border}` }}>
                        <td className="px-3 py-2.5 font-semibold" style={{ color: C.text }}>{d.name}</td>
                        <td className="px-3 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: C.accentDim, color: C.accent }}>{d.type}</span></td>
                        <td className="px-3 py-2.5 font-mono" style={{ color: C.text3 }}>{d.updated}</td>
                        <td className="px-3 py-2.5" style={{ color: C.text3 }}>{d.owner}</td>
                        <td className="px-3 py-2.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: d.status === 'current' ? C.goodDim : C.warnDim, color: d.status === 'current' ? C.good : C.warn }}>
                            {d.status === 'current' ? 'CURRENT' : 'NEEDS REVIEW'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Kpi({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
      <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: C.text4 }}>{label}</div>
      <div className="text-2xl font-black" style={{ color: C.text }}>{value}</div>
      <div className="text-[11px] mt-1" style={{ color: accent }}>{sub}</div>
    </div>
  )
}

// Suppress unused-import warnings for icons retained for future tab additions
void Calendar
