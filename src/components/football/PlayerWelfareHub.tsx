'use client'

import { useMemo, useState } from 'react'
import {
  Heart, Plane, Calendar, ShieldCheck, Smile, LayoutGrid, Globe2, Home, Wallet,
  GraduationCap, Car, Users, Stethoscope, Phone, Sparkles, Truck, Scroll,
  Activity, Building2, BookOpen, Plus,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────

export type WelfareTabId =
  | 'overview' | 'integration' | 'travel' | 'matchday' | 'compliance' | 'wellbeing'

type Stage = 'NEW ARRIVAL' | 'SETTLING IN' | 'ESTABLISHED' | 'MONITORING'
type Rag = 'green' | 'amber' | 'red'

interface ForeignPlayer {
  id: string
  name: string
  nationality: string
  flag: string
  position: 'GK' | 'DF' | 'MF' | 'FW'
  arrival: string
  stage: Stage
  completed: number
  total: number
  nextAction: string
  nextDeadline: string
  rag: Rag
}

// ─── Demo data ────────────────────────────────────────────────────────────

const FOREIGN_PLAYERS: ForeignPlayer[] = [
  { id: 'fernandez', name: 'Lucas Fernandez', nationality: 'Brazilian',  flag: '🇧🇷', position: 'GK', arrival: '12 Apr 2026', stage: 'NEW ARRIVAL',  completed: 3,  total: 12, nextAction: 'Bank account appointment', nextDeadline: 'Wed 30 Apr', rag: 'amber' },
  { id: 'tanaka',    name: 'Kenji Tanaka',     nationality: 'Japanese',   flag: '🇯🇵', position: 'MF', arrival: '02 Feb 2026', stage: 'SETTLING IN',  completed: 8,  total: 12, nextAction: 'Driving test',             nextDeadline: '15 May',     rag: 'green' },
  { id: 'diallo',    name: 'Amadou Diallo',    nationality: 'Senegalese', flag: '🇸🇳', position: 'FW', arrival: '04 Aug 2024', stage: 'ESTABLISHED',  completed: 12, total: 12, nextAction: 'Visa renewal',             nextDeadline: 'Sep 2026',   rag: 'green' },
  { id: 'rossi',     name: 'Matteo Rossi',     nationality: 'Italian',    flag: '🇮🇹', position: 'DF', arrival: '20 Jan 2026', stage: 'SETTLING IN',  completed: 6,  total: 12, nextAction: 'English lessons start',    nextDeadline: 'Mon 28 Apr', rag: 'amber' },
  { id: 'novak',     name: 'Pavel Novak',      nationality: 'Czech',      flag: '🇨🇿', position: 'MF', arrival: '21 Apr 2026', stage: 'NEW ARRIVAL',  completed: 1,  total: 12, nextAction: 'Housing viewing',          nextDeadline: 'Tomorrow 14:00', rag: 'red' },
]

const ACTIVITY_FEED = [
  { t: '10:14', txt: 'Fernandez: bank account application submitted — Barclays' },
  { t: '09:42', txt: 'Tanaka: driving test booked — 15 May, Mitcham Test Centre' },
  { t: '09:18', txt: 'Rossi: English lessons arranged — ESOL Level 2, Mon/Wed 10am' },
  { t: 'Yest',  txt: 'Novak: housing viewing — 3-bed flat, Kingston, tomorrow 14:00' },
  { t: 'Yest',  txt: 'Diallo: visa renewal reminder set — September 2026' },
  { t: '2d',    txt: 'Fernandez: GP surgery registration confirmed — Riverside Practice' },
  { t: '2d',    txt: 'Rossi: family relocation — partner job lead identified, Italian school place' },
  { t: '3d',    txt: 'Tanaka: cultural liaison assigned — Hiroshi Sato (Japanese community)' },
  { t: '3d',    txt: 'Novak: arrival logistics complete — airport pickup, hotel for first 7 nights' },
  { t: '4d',    txt: 'Quarterly wellbeing survey closed — 23/25 responses, 8.4/10 satisfaction' },
]

const AWAY_FIXTURES = [
  { id: 'aw1', date: 'Sat 10 May', opp: 'Thornvale United',  venue: 'Thornvale Park',     dist: 142, coach: '✓', hotel: 'N/A',  meals: '✓',  status: 'complete' as const },
  { id: 'aw2', date: 'Sat 24 May', opp: 'Kingsmere City',    venue: 'Kingsmere Stadium',  dist: 234, coach: '✓', hotel: '✓',    meals: '◐',  status: 'partial' as const },
  { id: 'aw3', date: 'Sat 07 Jun', opp: 'Hartwell Athletic', venue: 'Hartwell Ground',    dist: 88,  coach: '✓', hotel: 'N/A',  meals: '✓',  status: 'complete' as const },
  { id: 'aw4', date: 'Sat 21 Jun', opp: 'Penmarric Rovers',  venue: 'Penmarric Stadium',  dist: 287, coach: '◐', hotel: '◐',    meals: '◐',  status: 'partial' as const },
  { id: 'aw5', date: 'Sat 05 Jul', opp: 'Calderbrook Town',  venue: 'Calder Park',        dist: 168, coach: '◐', hotel: '–',    meals: '–',  status: 'not-started' as const },
]

const DBS_RECORDS = [
  { name: 'James Hartley',    role: 'Manager',          status: 'enhanced' as const, dbs: 'Mar 2024', expiry: 'Mar 2027', course: 'Level 2 ✓', flag: 'green'  as const },
  { name: 'Sophie Brennan',   role: 'Physio',           status: 'enhanced' as const, dbs: 'Jun 2023', expiry: 'Jun 2026', course: 'Level 2 ✓', flag: 'green'  as const },
  { name: 'Daniel Okoro',     role: 'Asst Manager',     status: 'enhanced' as const, dbs: 'Aug 2023', expiry: 'Aug 2026', course: 'Level 3 ✓', flag: 'green'  as const },
  { name: 'Priya Sharma',     role: 'Academy Lead',     status: 'enhanced' as const, dbs: 'Feb 2024', expiry: 'Feb 2027', course: 'Level 3 ✓', flag: 'green'  as const },
  { name: 'Tom Whitfield',    role: 'GK Coach',         status: 'enhanced' as const, dbs: 'Nov 2021', expiry: 'Nov 2024', course: 'Level 2 ⚠', flag: 'red'    as const },
  { name: 'Mark Davies',      role: 'S&C Coach',        status: 'enhanced' as const, dbs: 'Sep 2022', expiry: 'Sep 2025', course: 'Level 2 ✓', flag: 'amber'  as const },
  { name: 'Aisha Rahman',     role: 'Welfare Officer',  status: 'enhanced' as const, dbs: 'Jan 2025', expiry: 'Jan 2028', course: 'Level 3 ✓', flag: 'green'  as const },
  { name: 'Greg Pollard',     role: 'Kit Manager',      status: 'enhanced' as const, dbs: 'May 2020', expiry: 'May 2023', course: 'Level 1 ✓', flag: 'red'    as const },
  { name: 'Linda Frost',      role: 'Safeguarding Lead',status: 'enhanced' as const, dbs: 'Jul 2024', expiry: 'Jul 2027', course: 'Level 4 ✓', flag: 'green'  as const },
  { name: 'Rob Mitchell',     role: 'Youth Coach',      status: 'enhanced' as const, dbs: 'Apr 2024', expiry: 'Apr 2027', course: 'Level 2 ⚠', flag: 'amber'  as const },
]

const INSURANCE_POLICIES = [
  { name: 'Player Insurance (Squad Cover)', provider: 'Howden Sports', premium: '£185,400', renewal: '01 Jul 2026', status: 'active' as const },
  { name: 'Public Liability (£5M)',         provider: 'Aviva',         premium: '£8,200',   renewal: '14 Aug 2026', status: 'active' as const },
  { name: 'Directors & Officers',           provider: 'AIG',           premium: '£12,800',  renewal: '01 Jul 2026', status: 'active' as const },
  { name: 'Employers Liability',            provider: 'Aviva',         premium: '£14,500',  renewal: '14 Aug 2026', status: 'active' as const },
  { name: 'Stadium / Ground',               provider: 'Zurich',        premium: '£42,300',  renewal: '01 Sep 2026', status: 'active' as const },
]

const SURVEY_CATEGORIES = [
  { label: 'Overall satisfaction', score: 8.4 },
  { label: 'Training facilities',  score: 8.8 },
  { label: 'Medical support',      score: 9.1 },
  { label: 'Communication',        score: 7.9 },
  { label: 'Career development',   score: 7.2 },
  { label: 'Work-life balance',    score: 8.0 },
]

const WELLBEING_ROWS = [
  { name: 'Lucas Fernandez', flag: '🇧🇷', last: '2 days ago', mood: 7, sleep: 7, homesick: 'High',   status: 'amber' as const },
  { name: 'Pavel Novak',     flag: '🇨🇿', last: 'Yesterday',  mood: 6, sleep: 5, homesick: 'High',   status: 'red'   as const },
  { name: 'Matteo Rossi',    flag: '🇮🇹', last: '4 days ago', mood: 8, sleep: 8, homesick: 'Medium', status: 'amber' as const },
  { name: 'Kenji Tanaka',    flag: '🇯🇵', last: '1 day ago',  mood: 8, sleep: 7, homesick: 'Low',    status: 'green' as const },
  { name: 'Amadou Diallo',   flag: '🇸🇳', last: '3 days ago', mood: 9, sleep: 9, homesick: 'Low',    status: 'green' as const },
]

// ─── Theme helpers (dark base, accent passed in) ──────────────────────────

const COLORS = {
  bg: '#07080F',
  panel: '#111318',
  panel2: '#0D0F14',
  border: '#1F2937',
  borderHi: '#374151',
  text: '#F9FAFB',
  text2: '#D1D5DB',
  text3: '#9CA3AF',
  text4: '#6B7280',
  good: '#22C55E',
  warn: '#F59E0B',
  bad:  '#EF4444',
}

const ragColor = (rag: Rag) => rag === 'red' ? COLORS.bad : rag === 'amber' ? COLORS.warn : COLORS.good

// ─── Sub-components ───────────────────────────────────────────────────────

function KpiCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
      <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: COLORS.text4 }}>{label}</div>
      <div className="text-2xl font-black" style={{ color: COLORS.text }}>{value}</div>
      <div className="text-[11px] mt-1" style={{ color: accent }}>{sub}</div>
    </div>
  )
}

function StageColumn({ stage, players, accent }: { stage: Stage; players: ForeignPlayer[]; accent: string }) {
  return (
    <div className="rounded-xl p-3 flex flex-col gap-2 min-h-[200px]" style={{ backgroundColor: COLORS.panel2, border: `1px solid ${COLORS.border}` }}>
      <div className="flex items-center justify-between mb-1">
        <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.text3 }}>{stage}</div>
        <div className="text-[10px] font-bold" style={{ color: COLORS.text4 }}>{players.length}</div>
      </div>
      {players.map(p => {
        const pct = Math.round((p.completed / p.total) * 100)
        return (
          <div key={p.id} className="rounded-lg p-3" style={{ backgroundColor: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base">{p.flag}</span>
                <div className="text-xs font-bold truncate" style={{ color: COLORS.text }}>{p.name}</div>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${ragColor(p.rag)}26`, color: ragColor(p.rag) }}>{p.position}</span>
            </div>
            <div className="text-[10px] mb-2" style={{ color: COLORS.text4 }}>Arrived {p.arrival}</div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 h-1.5 rounded-full" style={{ background: COLORS.borderHi }}>
                <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: accent }} />
              </div>
              <span className="text-[10px] font-bold" style={{ color: COLORS.text2 }}>{p.completed}/{p.total}</span>
            </div>
            <div className="text-[10px]" style={{ color: COLORS.text3 }}>
              <span className="font-semibold" style={{ color: COLORS.text2 }}>Next:</span> {p.nextAction}
            </div>
            <div className="text-[10px] mt-0.5" style={{ color: ragColor(p.rag) }}>· {p.nextDeadline}</div>
          </div>
        )
      })}
    </div>
  )
}

function AiAction({ label, prompt, onAsk, accent }: { label: string; prompt: string; onAsk?: (p: string) => void; accent: string }) {
  return (
    <button onClick={() => onAsk?.(prompt)}
      className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-md transition-colors"
      style={{ backgroundColor: `${accent}1a`, color: accent, border: `1px solid ${accent}40` }}>
      <Sparkles size={11} />
      <span>{label}</span>
    </button>
  )
}

// ─── OVERVIEW TAB ─────────────────────────────────────────────────────────

function OverviewTab({ accent }: { accent: string }) {
  const stages: Stage[] = ['NEW ARRIVAL', 'SETTLING IN', 'ESTABLISHED', 'MONITORING']
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard label="Foreign Players" value="8" sub="of 25 squad" accent={accent} />
        <KpiCard label="Active Cases"    value="12" sub="across 5 players" accent={COLORS.warn} />
        <KpiCard label="Visa Compliance" value="100%" sub="next: 14 mo" accent={COLORS.good} />
        <KpiCard label="Language Pgm"    value="4" sub="2 int · 2 beg" accent={accent} />
        <KpiCard label="Satisfaction"    value="8.4" sub="quarterly /10" accent={COLORS.good} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold" style={{ color: COLORS.text }}>Player Welfare Board</h3>
          <span className="text-[11px]" style={{ color: COLORS.text4 }}>Drag stages · click cards to expand</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {stages.map(s => (
            <StageColumn key={s} stage={s} players={FOREIGN_PLAYERS.filter(p => p.stage === s)} accent={accent} />
          ))}
        </div>
      </div>

      <div className="rounded-xl p-4" style={{ backgroundColor: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
        <h3 className="text-sm font-bold mb-3" style={{ color: COLORS.text }}>Recent Activity</h3>
        <div className="space-y-2">
          {ACTIVITY_FEED.map((a, i) => (
            <div key={i} className="flex gap-3 text-xs">
              <span className="font-mono w-12 flex-shrink-0" style={{ color: COLORS.text4 }}>{a.t}</span>
              <span style={{ color: COLORS.text2 }}>{a.txt}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── INTEGRATION TAB ──────────────────────────────────────────────────────

interface ChecklistItem {
  id: string
  title: string
  icon: React.ElementType
  status: string
  details: { label: string; value: string }[]
  aiPrompt?: string
  aiLabel?: string
}

const buildChecklist = (player: ForeignPlayer, variant: 'mens' | 'womens' = 'mens'): ChecklistItem[] => [
  { id: 'visa', title: 'Visa & Work Permit', icon: Globe2, status: 'GBE approved · ISP visa granted', details: [
    { label: 'GBE status', value: 'Approved ✓' },
    { label: 'ISP visa expiry', value: 'Sep 2027' },
    { label: 'Sponsor licence', value: 'Up to date' },
    { label: 'Last Home Office filing', value: '01 Apr 2026' },
    { label: 'Immigration solicitor', value: 'M. Carter, Stowe & Hart LLP' },
  ], aiPrompt: `Generate visa renewal timeline for ${player.name} (${player.nationality}, ISP visa expiring Sep 2027). Include all milestones: 6-month review, sponsor licence audit, renewal application window, biometric appointment.`, aiLabel: 'Visa renewal timeline' },
  { id: 'housing', title: 'Housing & Accommodation', icon: Home, status: player.completed > 6 ? 'Moved in' : 'Searching', details: [
    { label: 'Status', value: player.completed > 6 ? 'Lease signed · moved in' : 'Viewing scheduled' },
    { label: 'Address', value: player.completed > 6 ? 'Kingston-upon-Thames' : '—' },
    { label: 'Utilities', value: player.completed > 6 ? 'All connected' : 'Pending' },
    { label: 'Furnishing', value: player.completed > 6 ? 'Complete' : 'Not started' },
  ], aiPrompt: `Find 3-bed family housing within 8 miles of training ground (KT6 4DZ) under £3,500/month. Include school catchments and commute times.`, aiLabel: 'Find housing near ground' },
  { id: 'banking', title: 'Banking & Finance', icon: Wallet, status: player.completed > 3 ? 'Account opened' : 'In progress', details: [
    { label: 'UK bank account', value: player.completed > 3 ? 'Opened ✓ — Barclays' : 'In progress' },
    { label: 'NI Number', value: player.completed > 4 ? 'Received' : 'Applied' },
    { label: 'PAYE registration', value: 'Complete ✓' },
    { label: 'Tax code', value: '1257L confirmed' },
  ], aiPrompt: `Generate bank application checklist for foreign national. Include all docs: passport, ISP visa, employment contract, proof of address (utility bill within 3mo), club letter, NI Number application form.`, aiLabel: 'Bank docs checklist' },
  { id: 'language', title: 'English Language', icon: BookOpen, status: 'Beginner' as const, details: [
    { label: 'Level', value: player.id === 'rossi' ? 'Elementary' : player.id === 'tanaka' ? 'Intermediate' : 'Beginner' },
    { label: 'Provider', value: 'ESOL Pathway · Surrey College' },
    { label: 'Schedule', value: 'Mon/Wed 10:00–12:00' },
    { label: 'Interpreter', value: player.id === 'tanaka' ? 'Hiroshi Sato' : 'On call (agency)' },
  ], aiPrompt: `Find English language courses near KT6 4DZ for adult learners, 1:1 or small group, evening + weekday morning slots. Include cost and provider quality rating.`, aiLabel: 'Find courses nearby' },
  { id: 'driving', title: 'Driving', icon: Car, status: 'Conversion in progress', details: [
    { label: 'Foreign licence', value: 'Valid · needs UK conversion' },
    { label: 'UK provisional', value: player.completed > 5 ? 'Received' : 'Applied' },
    { label: 'Lessons booked', value: player.id === 'tanaka' ? 'AA · 2x/week' : 'Pending' },
    { label: 'Test booked', value: player.nextDeadline },
    { label: 'Car', value: player.completed > 8 ? 'Club lease — BMW 3 Series' : 'Pending' },
  ], aiPrompt: `Generate driving licence conversion guide for a ${player.nationality} national in the UK. Include eligibility for direct exchange, theory test requirement, practical test booking process.`, aiLabel: 'Driving conversion guide' },
  { id: 'family', title: 'Family Relocation', icon: Users, status: player.id === 'rossi' ? 'In progress' : player.id === 'diallo' ? 'Complete' : 'Not started', details: [
    { label: 'Partner', value: player.id === 'rossi' ? 'Relocated · job lead' : player.id === 'diallo' ? 'Settled' : 'N/A' },
    { label: 'Children', value: player.id === 'diallo' ? '2 · school places secured' : player.id === 'rossi' ? '1 · Italian school place' : 'N/A' },
    { label: 'Childcare', value: player.id === 'diallo' ? 'Arranged' : 'N/A' },
  ], aiPrompt: `Find primary schools near KT6 with available places for September 2026 intake. Prioritise schools with EAL support and catchment-flexible admission.`, aiLabel: 'Find schools nearby' },
  { id: 'healthcare', title: 'Healthcare', icon: Stethoscope, status: 'GP registered', details: [
    { label: 'GP', value: 'Riverside Practice — registered' },
    { label: 'Dental', value: player.completed > 5 ? 'Bupa Dental — registered' : 'Pending' },
    { label: 'Private medical', value: 'Active · Vitality (club scheme)' },
  ] },
  { id: 'phone', title: 'Phone & Connectivity', icon: Phone, status: 'Active', details: [
    { label: 'UK phone number', value: 'Active ✓ — EE business plan' },
    { label: 'Home broadband', value: player.completed > 4 ? 'Connected' : 'Pending engineer' },
    { label: 'Club IT access', value: 'Provisioned ✓' },
  ] },
  { id: 'cultural', title: 'Cultural Integration', icon: Globe2, status: 'Liaison assigned', details: [
    { label: 'Local area guide', value: 'Provided' },
    { label: 'Cultural liaison', value: player.id === 'tanaka' ? 'Hiroshi Sato' : player.id === 'diallo' ? 'Ousmane Ba (community)' : 'Pending match' },
    { label: 'Community groups', value: 'Connected' },
  ] },
  { id: 'transport', title: 'Transport to Training', icon: Truck, status: 'Drives', details: [
    { label: 'Method', value: player.completed > 8 ? 'Drives' : 'Club shuttle' },
    { label: 'Parking', value: 'Allocated · Bay 14' },
    { label: 'Travel time', value: '22 min' },
  ] },
  { id: 'contract', title: 'Contract & Legal', icon: Scroll, status: 'Translated', details: [
    { label: 'Contract translated', value: 'Yes · countersigned' },
    { label: 'Legal advisor', value: 'D. Pemberton, Sportshelm' },
    { label: 'Player handbook', value: 'Provided · translated' },
  ] },
  { id: 'wellbeing', title: 'Wellbeing Check-ins', icon: Heart, status: `Last: ${player.completed > 8 ? '3 days ago' : 'this week'}`, details: [
    { label: 'Last check-in', value: player.completed > 8 ? '3 days ago' : 'This week' },
    { label: 'Frequency', value: player.completed < 4 ? 'Weekly' : 'Fortnightly' },
    { label: 'Homesickness', value: player.id === 'novak' || player.id === 'fernandez' ? 'High' : player.id === 'rossi' ? 'Medium' : 'Low' },
    { label: 'Open concerns', value: player.id === 'novak' ? 'Family arrival uncertainty' : 'None' },
  ], aiPrompt: `Generate 10 wellbeing check-in questions for a ${player.nationality} professional footballer who arrived ${player.arrival}. Cover homesickness, training adjustment, language confidence, family integration, sleep quality.`, aiLabel: 'Wellbeing check-in Qs' },
  ...(variant === 'womens' ? [
    { id: 'maternity', title: 'Maternity Planning', icon: Heart, status: 'Reviewed', details: [
      { label: 'Status', value: 'No active plan · reviewable on request' },
      { label: 'Maternity policy provided', value: 'Yes (translated)' },
      { label: 'Return-to-play protocol', value: 'On file · UEFA-aligned' },
      { label: 'Contract clause discussed', value: 'Yes — at signing' },
    ], aiPrompt: `Generate a maternity planning checklist for a women's professional footballer including return-to-play protocol, contract protection, training reintegration, and family-leave policy summary.`, aiLabel: 'Maternity planning guide' },
    { id: 'cycle', title: 'Cycle Tracking Integration', icon: Activity, status: 'Linked', details: [
      { label: 'Cycle tracking module', value: 'Linked · player consented' },
      { label: 'Training adjustment', value: 'Phased load enabled' },
      { label: 'Education provided', value: 'Yes (translated)' },
      { label: 'Privacy', value: 'Player-controlled visibility' },
    ] },
    { id: 'safeguarding', title: 'Women\'s-Specific Safeguarding', icon: ShieldCheck, status: 'Active', details: [
      { label: 'Independent welfare officer', value: 'Aisha Rahman' },
      { label: 'Women in Football network', value: 'Member · liaison contacts shared' },
      { label: 'Anti-harassment training', value: 'Completed at induction' },
      { label: 'Karen Carney Review compliance', value: 'Up to date' },
    ], aiPrompt: `Generate a women's-specific safeguarding checklist for a foreign professional footballer covering independent welfare officer access, FA WSL safeguarding standards, Karen Carney Review compliance, and anti-harassment protocols.`, aiLabel: 'Safeguarding checklist' },
  ] as ChecklistItem[] : []),
]

function IntegrationTab({ accent, onAsk, variant }: { accent: string; onAsk?: (p: string) => void; variant: 'mens' | 'womens' }) {
  const [playerId, setPlayerId] = useState(FOREIGN_PLAYERS[0].id)
  const player = FOREIGN_PLAYERS.find(p => p.id === playerId)!
  const checklist = useMemo(() => buildChecklist(player, variant), [player, variant])
  const [completed, setCompleted] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    checklist.slice(0, player.completed).forEach(c => { init[c.id] = true })
    return init
  })
  const [expanded, setExpanded] = useState<string | null>(null)

  const completedCount = checklist.filter(c => completed[c.id]).length
  const pct = Math.round((completedCount / checklist.length) * 100)

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4" style={{ backgroundColor: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-bold" style={{ color: COLORS.text3 }}>Player:</span>
          <select value={playerId} onChange={e => setPlayerId(e.target.value)}
            className="text-sm rounded-lg px-3 py-1.5 outline-none"
            style={{ backgroundColor: COLORS.panel2, border: `1px solid ${COLORS.border}`, color: COLORS.text }}>
            {FOREIGN_PLAYERS.map(p => (
              <option key={p.id} value={p.id}>{p.flag} {p.name} · {p.nationality}</option>
            ))}
          </select>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs" style={{ color: COLORS.text3 }}>{completedCount}/{checklist.length} complete ({pct}%)</span>
            <div className="w-32 h-1.5 rounded-full" style={{ background: COLORS.borderHi }}>
              <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: accent }} />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {checklist.map((item, idx) => {
          const ItemIcon = item.icon
          const done = !!completed[item.id]
          const open = expanded === item.id
          return (
            <div key={item.id} className="rounded-xl overflow-hidden" style={{ backgroundColor: done ? `${COLORS.good}0a` : COLORS.panel, border: `1px solid ${done ? COLORS.good + '30' : COLORS.border}` }}>
              <div className="flex items-center gap-3 p-3 cursor-pointer" onClick={() => setExpanded(open ? null : item.id)}>
                <button onClick={e => { e.stopPropagation(); setCompleted(c => ({ ...c, [item.id]: !c[item.id] })) }}
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: done ? `${COLORS.good}33` : COLORS.panel2, border: `1px solid ${done ? COLORS.good + '80' : COLORS.borderHi}` }}>
                  {done ? <span style={{ color: COLORS.good, fontSize: 12 }}>✓</span> : <span style={{ color: COLORS.text4, fontSize: 11 }}>{idx + 1}</span>}
                </button>
                <ItemIcon size={16} style={{ color: done ? COLORS.good : accent }} className="flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold" style={{ color: done ? COLORS.text2 : COLORS.text }}>{item.title}</div>
                  <div className="text-[11px]" style={{ color: COLORS.text4 }}>{item.status}</div>
                </div>
                <span style={{ color: COLORS.text4, fontSize: 11 }}>{open ? '▾' : '▸'}</span>
              </div>
              {open && (
                <div className="px-3 pb-3 pt-0 space-y-2" style={{ borderTop: `1px solid ${COLORS.border}` }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 pt-3">
                    {item.details.map((d, i) => (
                      <div key={i} className="flex justify-between text-[11px]">
                        <span style={{ color: COLORS.text4 }}>{d.label}</span>
                        <span style={{ color: COLORS.text2 }} className="font-medium">{d.value}</span>
                      </div>
                    ))}
                  </div>
                  {item.aiPrompt && item.aiLabel && (
                    <div className="pt-2"><AiAction label={item.aiLabel} prompt={item.aiPrompt} onAsk={onAsk} accent={accent} /></div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── TRAVEL TAB ───────────────────────────────────────────────────────────

function TravelTab({ accent, onAsk }: { accent: string; onAsk?: (p: string) => void }) {
  const statusBadge = (s: 'complete' | 'partial' | 'not-started') => {
    if (s === 'complete') return { txt: '✅ Complete', c: COLORS.good }
    if (s === 'partial')  return { txt: '🟡 In progress', c: COLORS.warn }
    return { txt: '⚪ Not started', c: COLORS.text3 }
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-sm font-bold" style={{ color: COLORS.text }}>Upcoming Away Fixtures — Travel & Logistics</h3>
        <div className="flex gap-2">
          <AiAction label="Plan away trip logistics" prompt="Plan logistics for an away trip 234 miles from base. Determine overnight requirement, coach vs train, dietary requirements for 25 players + 8 staff, pre-match meal timing." onAsk={onAsk} accent={accent} />
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: COLORS.panel2 }}>
              {['Date', 'Opponent', 'Venue', 'Distance', 'Coach', 'Hotel', 'Meals', 'Status'].map(h => (
                <th key={h} className="text-left px-3 py-2.5 font-semibold uppercase tracking-wider text-[10px]" style={{ color: COLORS.text4 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AWAY_FIXTURES.map(f => {
              const sb = statusBadge(f.status)
              return (
                <tr key={f.id} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                  <td className="px-3 py-2.5" style={{ color: COLORS.text2 }}>{f.date}</td>
                  <td className="px-3 py-2.5 font-semibold" style={{ color: COLORS.text }}>{f.opp}</td>
                  <td className="px-3 py-2.5" style={{ color: COLORS.text3 }}>{f.venue}</td>
                  <td className="px-3 py-2.5 font-mono" style={{ color: COLORS.text3 }}>{f.dist} mi</td>
                  <td className="px-3 py-2.5 text-center" style={{ color: f.coach === '✓' ? COLORS.good : f.coach === '◐' ? COLORS.warn : COLORS.text4 }}>{f.coach}</td>
                  <td className="px-3 py-2.5 text-center" style={{ color: f.hotel === '✓' ? COLORS.good : f.hotel === '◐' ? COLORS.warn : COLORS.text4 }}>{f.hotel}</td>
                  <td className="px-3 py-2.5 text-center" style={{ color: f.meals === '✓' ? COLORS.good : f.meals === '◐' ? COLORS.warn : COLORS.text4 }}>{f.meals}</td>
                  <td className="px-3 py-2.5 text-[11px] font-bold" style={{ color: sb.c }}>{sb.txt}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { icon: Truck,    label: 'Book Team Coach',    sub: 'Date, pickup, capacity, return' },
          { icon: Building2, label: 'Book Hotel',        sub: 'Dates, location, rooms, dietary' },
          { icon: Activity,  label: 'Order Pre-Match Meals', sub: 'Venue catering, dietary notes' },
        ].map(a => {
          const I = a.icon
          return (
            <button key={a.label} className="rounded-xl p-4 text-left transition-colors hover:opacity-80"
              style={{ backgroundColor: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
              <I size={18} style={{ color: accent }} />
              <div className="text-sm font-bold mt-2" style={{ color: COLORS.text }}>{a.label}</div>
              <div className="text-[11px] mt-0.5" style={{ color: COLORS.text4 }}>{a.sub}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── MATCHDAY TAB ─────────────────────────────────────────────────────────

const MATCHDAY_GROUPS = [
  { title: 'Stewards & Safety', items: [
    'Stewards confirmed (18 of 20 confirmed, 2 TBC)',
    'Safety officer briefing — Fri 16:00',
    'Ambulance: confirmed',
    'PA system tested',
  ] },
  { title: 'Catering & Hospitality', items: [
    'Matchday food order — burgers, hot dogs, pies (Pinkertons)',
    'Bar stock checked — beer, soft drinks, hot drinks',
    'Hospitality suite — 14 guests confirmed (12 sponsors, 2 board)',
    'Hospitality menu — 3-course, dietary notes filed',
    'Matchday programme — 500 copies printed',
  ] },
  { title: 'Pitch & Facilities', items: [
    'Pitch inspection — Fri 16:00',
    'Changing rooms prepared (home + away)',
    'Kit laid out',
    'Match balls — 6 checked',
    'Corner flags',
    'Goal nets — checked',
  ] },
  { title: 'Media', items: [
    'Press passes issued — 4',
    'Post-match interview area set up',
    'Photographer confirmed',
    'Social media plan — pre/during/post scheduled',
  ] },
  { title: 'Officials', items: [
    'Referee confirmed — D. Atkins',
    'Referee fee — £225 petty cash',
    'Officials changing room prepared',
  ] },
]

function MatchdayTab({ accent, onAsk }: { accent: string; onAsk?: (p: string) => void }) {
  const allKeys = useMemo(() => MATCHDAY_GROUPS.flatMap((g, gi) => g.items.map((_, ii) => `${gi}.${ii}`)), [])
  const [done, setDone] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    // Pre-tick about 60% to feel realistic
    allKeys.forEach((k, i) => { if (i % 5 !== 2 && i % 7 !== 4) init[k] = true })
    return init
  })
  const completed = allKeys.filter(k => done[k]).length
  const pct = Math.round((completed / allKeys.length) * 100)

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4" style={{ backgroundColor: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-sm font-bold" style={{ color: COLORS.text }}>Oakridge FC vs Hartwell Town</div>
            <div className="text-[11px]" style={{ color: COLORS.text4 }}>Sat 02 May · KO 15:00 · Home</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: COLORS.text3 }}>{completed}/{allKeys.length} complete ({pct}%)</span>
            <div className="w-40 h-1.5 rounded-full" style={{ background: COLORS.borderHi }}>
              <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: accent }} />
            </div>
            <AiAction label="Generate matchday plan" prompt="Generate a full matchday operations checklist for a home fixture vs Hartwell Town, expected attendance 4,200, KO 15:00. Cover stewarding, hospitality, pitch, media, officials." onAsk={onAsk} accent={accent} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {MATCHDAY_GROUPS.map((g, gi) => (
          <div key={g.title} className="rounded-xl p-4" style={{ backgroundColor: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: COLORS.text3 }}>{g.title}</h4>
            <div className="space-y-1.5">
              {g.items.map((it, ii) => {
                const k = `${gi}.${ii}`
                const isDone = !!done[k]
                return (
                  <button key={k} onClick={() => setDone(d => ({ ...d, [k]: !d[k] }))}
                    className="w-full flex items-center gap-2.5 text-left rounded-lg px-2 py-1.5 transition-colors"
                    style={{ backgroundColor: isDone ? `${COLORS.good}0d` : 'transparent' }}>
                    <span className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: isDone ? `${COLORS.good}33` : COLORS.panel2, border: `1px solid ${isDone ? COLORS.good + '60' : COLORS.borderHi}` }}>
                      {isDone && <span style={{ color: COLORS.good, fontSize: 9 }}>✓</span>}
                    </span>
                    <span className="text-[12px]" style={{ color: isDone ? COLORS.text3 : COLORS.text2, textDecoration: isDone ? 'line-through' : 'none' }}>{it}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── COMPLIANCE TAB ───────────────────────────────────────────────────────

function ComplianceTab({ accent, onAsk }: { accent: string; onAsk?: (p: string) => void }) {
  const flagColor = (f: 'green' | 'amber' | 'red') => f === 'red' ? COLORS.bad : f === 'amber' ? COLORS.warn : COLORS.good
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <h3 className="text-sm font-bold" style={{ color: COLORS.text }}>DBS & Safeguarding — Staff Roster</h3>
          <AiAction label="Generate DBS renewal schedule" prompt="Calculate upcoming DBS expiry dates across the staff roster, generate a 90/60/30-day reminder schedule, and flag anyone overdue." onAsk={onAsk} accent={accent} />
        </div>
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: COLORS.panel2 }}>
                {['Name', 'Role', 'DBS Status', 'DBS Date', 'Expiry', 'Safeguarding', 'Flag'].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 font-semibold uppercase tracking-wider text-[10px]" style={{ color: COLORS.text4 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DBS_RECORDS.map(r => (
                <tr key={r.name} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                  <td className="px-3 py-2.5 font-semibold" style={{ color: COLORS.text }}>{r.name}</td>
                  <td className="px-3 py-2.5" style={{ color: COLORS.text3 }}>{r.role}</td>
                  <td className="px-3 py-2.5 capitalize" style={{ color: COLORS.text2 }}>{r.status} ✓</td>
                  <td className="px-3 py-2.5 font-mono" style={{ color: COLORS.text3 }}>{r.dbs}</td>
                  <td className="px-3 py-2.5 font-mono" style={{ color: flagColor(r.flag) }}>{r.expiry}</td>
                  <td className="px-3 py-2.5" style={{ color: COLORS.text2 }}>{r.course}</td>
                  <td className="px-3 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${flagColor(r.flag)}26`, color: flagColor(r.flag) }}>{r.flag.toUpperCase()}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold mb-2" style={{ color: COLORS.text }}>Insurance Policies</h3>
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: COLORS.panel2 }}>
                {['Policy', 'Provider', 'Premium', 'Renewal', 'Status'].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 font-semibold uppercase tracking-wider text-[10px]" style={{ color: COLORS.text4 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {INSURANCE_POLICIES.map(p => (
                <tr key={p.name} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                  <td className="px-3 py-2.5 font-semibold" style={{ color: COLORS.text }}>{p.name}</td>
                  <td className="px-3 py-2.5" style={{ color: COLORS.text3 }}>{p.provider}</td>
                  <td className="px-3 py-2.5 font-mono" style={{ color: COLORS.text2 }}>{p.premium}</td>
                  <td className="px-3 py-2.5 font-mono" style={{ color: COLORS.text2 }}>{p.renewal}</td>
                  <td className="px-3 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${COLORS.good}26`, color: COLORS.good }}>ACTIVE</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── WELLBEING TAB ────────────────────────────────────────────────────────

function WellbeingChart({ data, accent }: { data: { label: string; score: number }[]; accent: string }) {
  const max = 10
  const W = 600, H = 220, P = 40
  const barW = (W - P * 2) / data.length - 8
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', maxHeight: 240 }}>
      {[0, 2.5, 5, 7.5, 10].map((g, i) => {
        const y = H - P - (g / max) * (H - P * 2)
        return <g key={i}>
          <line x1={P} x2={W - P} y1={y} y2={y} stroke={COLORS.border} strokeDasharray="2 3" />
          <text x={P - 6} y={y + 3} fontSize="9" fill={COLORS.text4} textAnchor="end">{g}</text>
        </g>
      })}
      {data.map((d, i) => {
        const x = P + i * ((W - P * 2) / data.length) + 4
        const h = (d.score / max) * (H - P * 2)
        const y = H - P - h
        return <g key={d.label}>
          <rect x={x} y={y} width={barW} height={h} rx={3} fill={accent} fillOpacity={0.85} />
          <text x={x + barW / 2} y={y - 4} fontSize="10" fill={COLORS.text} textAnchor="middle" fontWeight="700">{d.score.toFixed(1)}</text>
          <text x={x + barW / 2} y={H - P + 14} fontSize="9" fill={COLORS.text4} textAnchor="middle">{d.label.split(' ')[0]}</text>
          <text x={x + barW / 2} y={H - P + 24} fontSize="9" fill={COLORS.text4} textAnchor="middle">{d.label.split(' ').slice(1).join(' ')}</text>
        </g>
      })}
    </svg>
  )
}

function WellbeingTab({ accent, onAsk }: { accent: string; onAsk?: (p: string) => void }) {
  const flagColor = (f: 'green' | 'amber' | 'red') => f === 'red' ? COLORS.bad : f === 'amber' ? COLORS.warn : COLORS.good
  return (
    <div className="space-y-5">
      <div className="rounded-xl p-4" style={{ backgroundColor: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div>
            <h3 className="text-sm font-bold" style={{ color: COLORS.text }}>Latest Survey Results</h3>
            <p className="text-[11px]" style={{ color: COLORS.text4 }}>Quarterly · 23 of 25 responded · last closed 18 Apr 2026</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <AiAction label="Generate anonymous survey" prompt="Generate a 10-question anonymous wellbeing survey appropriate for a professional first-team squad. Cover sleep, training load perception, communication, mental health, family-life balance, career development." onAsk={onAsk} accent={accent} />
            <AiAction label="Analyse trends" prompt="Read the last 3 quarterly wellbeing surveys and summarise improvements and declines per category. Flag any score that dropped >0.5 vs last quarter." onAsk={onAsk} accent={accent} />
          </div>
        </div>
        <WellbeingChart data={SURVEY_CATEGORIES} accent={accent} />
      </div>

      <div>
        <h3 className="text-sm font-bold mb-2" style={{ color: COLORS.text }}>Individual Wellbeing Tracker</h3>
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: COLORS.panel, border: `1px solid ${COLORS.border}` }}>
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: COLORS.panel2 }}>
                {['Player', 'Last Check-in', 'Mood', 'Sleep', 'Homesickness', 'Status'].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 font-semibold uppercase tracking-wider text-[10px]" style={{ color: COLORS.text4 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {WELLBEING_ROWS.map(r => (
                <tr key={r.name} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                  <td className="px-3 py-2.5"><span className="mr-1.5">{r.flag}</span><span className="font-semibold" style={{ color: COLORS.text }}>{r.name}</span></td>
                  <td className="px-3 py-2.5" style={{ color: COLORS.text3 }}>{r.last}</td>
                  <td className="px-3 py-2.5 font-mono" style={{ color: COLORS.text2 }}>{r.mood}/10</td>
                  <td className="px-3 py-2.5 font-mono" style={{ color: COLORS.text2 }}>{r.sleep}/10</td>
                  <td className="px-3 py-2.5" style={{ color: COLORS.text2 }}>{r.homesick}</td>
                  <td className="px-3 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${flagColor(r.status)}26`, color: flagColor(r.status) }}>{r.status.toUpperCase()}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────

const TABS: { id: WelfareTabId; label: string; icon: React.ElementType }[] = [
  { id: 'overview',     label: 'Overview',                  icon: LayoutGrid },
  { id: 'integration',  label: 'Foreign Player Integration', icon: Globe2 },
  { id: 'travel',       label: 'Travel & Logistics',        icon: Plane },
  { id: 'matchday',     label: 'Matchday Operations',       icon: Calendar },
  { id: 'compliance',   label: 'Compliance & Insurance',    icon: ShieldCheck },
  { id: 'wellbeing',    label: 'Player Satisfaction',       icon: Smile },
]

export interface PlayerWelfareHubProps {
  accent?: string
  defaultTab?: WelfareTabId
  /** Open a Lumio AI overlay with a pre-filled prompt (passed by host page) */
  onAskLumio?: (prompt: string) => void
  /** Optional title override (e.g. for Club Operations entry point) */
  title?: string
  subtitle?: string
  /** "womens" adds maternity / cycle / women's-specific safeguarding to the foreign-player checklist */
  variant?: 'mens' | 'womens'
}

export default function PlayerWelfareHub({
  accent = '#003DA5',
  defaultTab = 'overview',
  onAskLumio,
  title = 'Player Welfare & Club Operations',
  subtitle = 'Foreign player integration · travel · matchday · compliance · wellbeing',
  variant = 'mens',
}: PlayerWelfareHubProps) {
  const [tab, setTab] = useState<WelfareTabId>(defaultTab)

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <Heart size={20} style={{ color: accent }} className="mt-0.5" />
        <div>
          <h1 className="text-xl font-black" style={{ color: COLORS.text }}>{title}</h1>
          <p className="text-sm mt-0.5" style={{ color: COLORS.text4 }}>{subtitle}</p>
        </div>
      </div>

      {/* Tab bar — cricket v2 style (inline-flex, accent underline) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, borderBottom: `1px solid ${COLORS.border}`, overflowX: 'auto' }}>
        {TABS.map(t => {
          const active = tab === t.id
          const TabIcon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              onMouseEnter={e => { if (!active) e.currentTarget.style.color = COLORS.text2 }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.color = COLORS.text3 }}
              style={{
                appearance: 'none', border: 0, background: 'transparent',
                padding: '10px 14px',
                fontSize: 12.5, fontWeight: active ? 600 : 500,
                color: active ? '#fff' : COLORS.text3,
                borderBottom: `2px solid ${active ? accent : 'transparent'}`,
                marginBottom: -1,
                cursor: 'pointer', whiteSpace: 'nowrap',
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
        {tab === 'overview'    && <OverviewTab accent={accent} />}
        {tab === 'integration' && <IntegrationTab accent={accent} onAsk={onAskLumio} variant={variant} />}
        {tab === 'travel'      && <TravelTab accent={accent} onAsk={onAskLumio} />}
        {tab === 'matchday'    && <MatchdayTab accent={accent} onAsk={onAskLumio} />}
        {tab === 'compliance'  && <ComplianceTab accent={accent} onAsk={onAskLumio} />}
        {tab === 'wellbeing'   && <WellbeingTab accent={accent} onAsk={onAskLumio} />}
      </div>
    </div>
  )
}
