'use client'

// Junior Football — Referees (flagship module).
//
// FOUR TABS addressing the whole grassroots-referee problem:
//   1. Booking         — per-fixture status, contact list, cash reminders,
//                        FA referee requirements.
//   2. Referee Pool    — a canned demo of the future regional shared pool.
//   3. Develop your own — the FA Referee Course pathway; the club's own
//                        teenagers as natural recruits.
//   4. Protect the Referee — abuse reporting, post-match referee experience,
//                        and the duty-of-care indicator for under-18 refs.
//
// MINOR-REFEREE SAFETY (FIRM RULE — APPLIED ACROSS ALL FOUR TABS):
// any person depicted as a referee under 18 gets a restricted display.
// First name + initial only. No phone. No contact details. No photo.
// The "Under-18 referee — duty of care applies" chip is always present.
// Implemented as an AGE TEST (`isMinor`) routed through `displayName` and
// `displayContact` helpers below, NOT as hand-curated per-row data. If a
// referee's age is unknown or missing, treat as a minor (fail-safe).
// This mirrors the restricted-child posture in the data layer.
//
// Demo data is canned.

import { useState } from 'react'
import type { SportsDemoSession } from '@/components/sports-demo/SportsDemoGate'

const T = {
  panel:      '#0D1117',
  panelAlt:   '#111318',
  border:     '#1F2937',
  borderSoft: '#1A2030',
  text:       '#F9FAFB',
  text2:      '#D1D5DB',
  text3:      '#9CA3AF',
  text4:      '#6B7280',
  accent:     '#16A34A',
  accentDeep: '#166534',
  accentDim:  'rgba(22,163,74,0.12)',
  good:       '#22C55E',
  warn:       '#F59E0B',
  bad:        '#EF4444',
  blue:       '#3B82F6',
  gold:       '#F1C40F',
} as const

// ─── MINOR-REFEREE SAFETY HELPERS ────────────────────────────────────────────
// Single source of truth for the under-18 treatment. Every place that
// renders a referee MUST flow through these helpers.

interface MinorAware {
  firstName: string
  lastName: string
  /** Undefined / missing age = treat as minor (fail-safe). */
  age?: number
  phone?: string
}

function isMinor(ref: { age?: number }): boolean {
  return ref.age === undefined || ref.age < 18
}

function displayName(ref: MinorAware): string {
  if (isMinor(ref)) return `${ref.firstName} ${ref.lastName.charAt(0)}.`
  return `${ref.firstName} ${ref.lastName}`
}

/** Returns the contact string to render — null when restricted. */
function displayContact(ref: MinorAware): string | null {
  if (isMinor(ref)) return null
  return ref.phone ?? null
}

function MinorDutyOfCareChip({ small = false }: { small?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded font-semibold ${small ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'}`}
      style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: T.bad, border: `1px solid ${T.bad}55` }}
    >
      ⚠️ Under-18 referee — duty of care applies
    </span>
  )
}

// ─── DATA ────────────────────────────────────────────────────────────────────

interface RefereeRecord {
  id: string
  firstName: string
  lastName: string
  age?: number
  level: 'Level 5' | 'Level 6' | 'Level 7' | 'Level 8 (Trainee Youth)'
  phone?: string
  feePerMatch: number
  distanceMiles: number
  area: string
  notes?: string
  rating: number              // 0..5 — our club's average rating
  faRegistered: boolean
  faDbsYouth: boolean         // refs officiating youth football need an FA DBS
  weekend: 'available' | 'maybe' | 'unavailable'
  clubContact: boolean        // true = on Oakridge's local contact list (Tab 1)
}

const REFEREES: RefereeRecord[] = [
  {
    id: 'r-001', firstName: 'Graham', lastName: 'Foster', age: 52, level: 'Level 6',
    phone: '07700 800 014', feePerMatch: 40, distanceMiles: 4, area: 'Oakridge / Hartwell',
    notes: 'Reliable. Prefers Saturday morning kick-offs. Knows the U11 + U13 squads well.',
    rating: 4.8, faRegistered: true, faDbsYouth: true, weekend: 'available', clubContact: true,
  },
  {
    id: 'r-002', firstName: 'Mike', lastName: 'Hendricks', age: 47, level: 'Level 7',
    phone: '07700 800 027', feePerMatch: 35, distanceMiles: 7, area: 'Hartwell',
    notes: 'Fair, calm, age-appropriate game management. Available most weekends.',
    rating: 4.6, faRegistered: true, faDbsYouth: true, weekend: 'available', clubContact: true,
  },
  {
    id: 'r-003', firstName: 'Paul', lastName: 'Naylor', age: 38, level: 'Level 6',
    phone: '07700 800 088', feePerMatch: 40, distanceMiles: 9, area: 'Glenmoor',
    notes: 'Strict but consistent. Excellent on dissent / Respect codes.',
    rating: 4.3, faRegistered: true, faDbsYouth: true, weekend: 'maybe', clubContact: true,
  },
  {
    id: 'r-004', firstName: 'Jess', lastName: 'Marlowe', age: 24, level: 'Level 7',
    phone: '07700 800 102', feePerMatch: 35, distanceMiles: 11, area: 'Thornvale',
    notes: 'Younger ref, strong with U7–U10 mini-soccer. Building toward Level 6.',
    rating: 4.7, faRegistered: true, faDbsYouth: true, weekend: 'available', clubContact: true,
  },
  {
    id: 'r-005', firstName: 'Toby', lastName: 'Lockhart-Reid', age: 17, level: 'Level 8 (Trainee Youth)',
    phone: undefined, feePerMatch: 25, distanceMiles: 2, area: 'Oakridge',
    notes: 'Trainee youth ref. Completed FA course in Oct. Mini-soccer only by County FA rule.',
    rating: 4.5, faRegistered: true, faDbsYouth: true, weekend: 'available', clubContact: true,
  },
  // Regional pool — extras NOT in our contact list yet.
  {
    id: 'r-006', firstName: 'Aaron', lastName: 'Whittle', age: 41, level: 'Level 5',
    phone: '07700 800 211', feePerMatch: 50, distanceMiles: 14, area: 'Kingsmere',
    notes: 'Senior referee, takes on U16 fixtures when his Saturday schedule allows.',
    rating: 4.4, faRegistered: true, faDbsYouth: true, weekend: 'maybe', clubContact: false,
  },
  {
    id: 'r-007', firstName: 'Sam', lastName: 'Kazmi', age: 16, level: 'Level 8 (Trainee Youth)',
    phone: undefined, feePerMatch: 25, distanceMiles: 18, area: 'Ridgefield',
    notes: 'Trainee youth ref. Available for mini-soccer Saturdays only.',
    rating: 4.0, faRegistered: true, faDbsYouth: false, weekend: 'available', clubContact: false,
  },
  {
    id: 'r-008', firstName: 'Helen', lastName: 'Bartlett', age: 53, level: 'Level 6',
    phone: '07700 800 318', feePerMatch: 40, distanceMiles: 12, area: 'Ashbourne',
    notes: 'Surrey FA referee mentor. Will mentor Oakridge trainees on request.',
    rating: 4.9, faRegistered: true, faDbsYouth: true, weekend: 'unavailable', clubContact: false,
  },
]

interface RefBooking {
  id: string
  fixture: string
  team: string
  date: string
  kickoff: string
  refereeId: string | null
  status: 'confirmed' | 'pending' | 'unbooked'
  fee: number
  cashSorted: boolean
  whoBringsCash: string | null
  note?: string
}

const BOOKINGS: RefBooking[] = [
  {
    id: 'bk-001',
    fixture: 'U11 Lions vs Harfield Juniors (H)',
    team: 'U11 Lions',
    date: 'Sat 24 May', kickoff: '09:30',
    refereeId: 'r-001', status: 'confirmed', fee: 40,
    cashSorted: true, whoBringsCash: 'M. Hutchings',
  },
  {
    id: 'bk-002',
    fixture: 'U13 Falcons vs Thornvale Ladies U13 (A)',
    team: 'U13 Falcons',
    date: 'Sat 24 May', kickoff: '11:00',
    refereeId: 'r-004', status: 'confirmed', fee: 35,
    cashSorted: true, whoBringsCash: 'G. Yardley',
    note: 'Away — host club provides referee; we carry £35 cash as a backup.',
  },
  {
    id: 'bk-003',
    fixture: 'U14 Eagles vs Ridgefield Athletic (H)',
    team: 'U14 Eagles',
    date: 'Sat 24 May', kickoff: '13:00',
    refereeId: null, status: 'unbooked', fee: 40,
    cashSorted: false, whoBringsCash: null,
    note: 'No referee booked. Mike H. flagged maybe — confirm by Thursday or fall back to standby.',
  },
  {
    id: 'bk-004',
    fixture: 'U9 Tigers · 5-team festival',
    team: 'U9 Tigers',
    date: 'Sun 25 May', kickoff: '10:00',
    refereeId: 'r-005', status: 'pending', fee: 25,
    cashSorted: false, whoBringsCash: null,
    note: 'Mini-soccer — Toby L. (trainee youth) booked. Cash sorted next training Wednesday.',
  },
  {
    id: 'bk-005',
    fixture: 'U16 Saints vs Northbridge Youth (H)',
    team: 'U16 Saints',
    date: 'Sat 31 May', kickoff: '13:00',
    refereeId: 'r-003', status: 'pending', fee: 40,
    cashSorted: false, whoBringsCash: null,
  },
]

const STATUS_TONE: Record<RefBooking['status'], { label: string; bg: string; fg: string }> = {
  confirmed: { label: 'Confirmed', bg: 'rgba(34,197,94,0.18)',  fg: T.good },
  pending:   { label: 'Pending',   bg: 'rgba(245,158,11,0.18)', fg: T.warn },
  unbooked:  { label: 'Unbooked',  bg: 'rgba(239,68,68,0.18)',  fg: T.bad },
}

const AVAIL_TONE: Record<RefereeRecord['weekend'], { label: string; bg: string; fg: string }> = {
  available:   { label: 'Available',     bg: 'rgba(34,197,94,0.18)',  fg: T.good },
  maybe:       { label: 'Maybe',         bg: 'rgba(245,158,11,0.18)', fg: T.warn },
  unavailable: { label: 'Unavailable',   bg: 'rgba(107,114,128,0.18)',fg: T.text4 },
}

interface DevelopCandidate {
  id: string
  firstName: string
  lastName: string
  age: number               // 14-17 by FA course rule
  ageBandClub: string       // their playing team — e.g. "U14 Eagles"
  status: 'identified' | 'interested' | 'enrolled' | 'qualified'
  note: string
}

const CANDIDATES: DevelopCandidate[] = [
  {
    id: 'c-001', firstName: 'Toby', lastName: 'Lockhart-Reid', age: 17, ageBandClub: 'Now refereeing — see Tab 1 contact list',
    status: 'qualified',
    note: 'Completed the FA Youth Referee course in October. Currently refereeing Oakridge mini-soccer Saturdays as Level 8 trainee.',
  },
  {
    id: 'c-002', firstName: 'Sebastian', lastName: 'Cole', age: 14, ageBandClub: 'U14 Eagles',
    status: 'enrolled',
    note: 'Booked onto the County FA June intake at Hartwell. Three evenings + a Saturday assessment. Club covering the £140 course fee.',
  },
  {
    id: 'c-003', firstName: 'Idris', lastName: 'Khan', age: 14, ageBandClub: 'U14 Eagles',
    status: 'interested',
    note: 'Mentioned interest after the Glenmoor away game. Parents on board. Will hold the September intake place once age 14 is confirmed.',
  },
]

const STATUS_CAND_TONE: Record<DevelopCandidate['status'], { label: string; bg: string; fg: string }> = {
  identified: { label: 'Identified',  bg: 'rgba(59,130,246,0.18)', fg: T.blue },
  interested: { label: 'Interested',  bg: 'rgba(245,158,11,0.18)', fg: T.warn },
  enrolled:   { label: 'Enrolled',    bg: 'rgba(34,197,94,0.18)',  fg: T.good },
  qualified:  { label: 'Qualified',   bg: 'rgba(34,197,94,0.30)',  fg: T.good },
}

interface ProtectIncident {
  id: string
  date: string
  fixture: string
  refereeId: string
  severity: 'low' | 'med' | 'high'
  experienceRating: number  // 1-5 — the ref's own post-match rating of the experience
  summary: string
  reportedBy: string
  outcome: 'resolved' | 'in_progress' | 'escalated'
}

const INCIDENTS: ProtectIncident[] = [
  {
    id: 'inc-001', date: 'Sat 17 May', fixture: 'U14 Eagles vs Plymouth Marine Boys (H)', refereeId: 'r-002',
    severity: 'low', experienceRating: 4,
    summary: 'Single shouted dissent from a parent on the touchline at half-time. Referee handled it well; Welfare Officer spoke to parent after the game. Logged for the trend record.',
    reportedBy: 'J. Holroyd (Welfare Officer)', outcome: 'resolved',
  },
  {
    id: 'inc-002', date: 'Sat 10 May', fixture: 'U9 Tigers · mini-soccer festival (A)', refereeId: 'r-005',
    severity: 'med', experienceRating: 2,
    summary: 'Opposition coach loudly questioned several decisions, directed at the trainee youth ref. Coach formally reported by Mark Hutchings on Toby\'s behalf. County FA notified given the under-18 ref involved.',
    reportedBy: 'M. Hutchings (Coach)', outcome: 'escalated',
  },
  {
    id: 'inc-003', date: 'Sat 03 May', fixture: 'U11 Lions vs Northgate Juniors (H)', refereeId: 'r-001',
    severity: 'low', experienceRating: 5,
    summary: 'No incidents. Referee post-match: "Excellent atmosphere — coaches and parents both modelled the FA Respect code well." Recorded as a positive datapoint.',
    reportedBy: 'G. Foster (Referee, self-report)', outcome: 'resolved',
  },
]

const SEV_TONE: Record<ProtectIncident['severity'], { label: string; bg: string; fg: string }> = {
  low:  { label: 'Low',  bg: 'rgba(34,197,94,0.18)',  fg: T.good },
  med:  { label: 'Medium', bg: 'rgba(245,158,11,0.18)', fg: T.warn },
  high: { label: 'High', bg: 'rgba(239,68,68,0.18)',  fg: T.bad },
}

const OUTCOME_TONE: Record<ProtectIncident['outcome'], { label: string; bg: string; fg: string }> = {
  resolved:    { label: 'Resolved',    bg: 'rgba(34,197,94,0.18)',  fg: T.good },
  in_progress: { label: 'In progress', bg: 'rgba(59,130,246,0.18)', fg: T.blue },
  escalated:   { label: 'Escalated',   bg: 'rgba(239,68,68,0.18)',  fg: T.bad },
}

function getRef(id: string | null): RefereeRecord | null {
  if (!id) return null
  return REFEREES.find(r => r.id === id) ?? null
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────

type Tab = 'booking' | 'pool' | 'develop' | 'protect'

interface Props {
  session: SportsDemoSession
  demoChild?: { name: string; ageBand: string; team: string }
}

export default function JuniorReferees({ session }: Props) {
  const [tab, setTab] = useState<Tab>('booking')
  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'booking', label: 'Booking',              icon: '📋' },
    { id: 'pool',    label: 'Referee Pool',         icon: '🌍' },
    { id: 'develop', label: 'Develop your own',     icon: '🌱' },
    { id: 'protect', label: 'Protect the Referee',  icon: '🛡️' },
  ]

  return (
    <div className="space-y-4">
      <div
        className="rounded-xl p-5"
        style={{
          background: `linear-gradient(135deg, ${T.accentDim} 0%, rgba(22,101,52,0.04) 60%, transparent 100%)`,
          border: `1px solid ${T.accent}55`,
        }}
      >
        <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: T.accent }}>
          Referees · the whole problem, not just the booking
        </p>
        <h2 className="text-lg font-bold" style={{ color: T.text }}>
          Booking · Regional pool · Develop your own · Protect the Referee
        </h2>
        <p className="text-sm mt-1 leading-relaxed" style={{ color: T.text2 }}>
          Grassroots is losing referees fast — abuse drives it, and the
          youngest (14–17, minors) quit first. This module addresses the four
          layers together. Under-18 referees are treated under the same duty
          of care as any other minor in the club. Signed in as{' '}
          <span style={{ color: T.text }}>{session.userName || session.role}</span>.
        </p>
      </div>

      <div className="flex gap-1 border-b overflow-x-auto" style={{ borderColor: T.border }}>
        {tabs.map(t => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className="px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-all"
              style={{
                color: active ? T.good : T.text4,
                borderBottom: active ? `2px solid ${T.good}` : '2px solid transparent',
              }}
            >
              <span className="mr-1.5">{t.icon}</span>{t.label}
            </button>
          )
        })}
      </div>

      {tab === 'booking' && <BookingTab />}
      {tab === 'pool'    && <PoolTab />}
      {tab === 'develop' && <DevelopTab />}
      {tab === 'protect' && <ProtectTab />}
    </div>
  )
}

// ─── TAB 1: BOOKING ─────────────────────────────────────────────────────────

function BookingTab() {
  const confirmed = BOOKINGS.filter(b => b.status === 'confirmed').length
  const unbooked  = BOOKINGS.filter(b => b.status === 'unbooked').length
  const totalFees = BOOKINGS.reduce((s, b) => s + b.fee, 0)
  const paidFees  = BOOKINGS.filter(b => b.cashSorted).reduce((s, b) => s + b.fee, 0)

  // "Saturday refs not yet covered" alert: any booking that's unbooked OR
  // confirmed-but-cash-not-sorted on the upcoming weekend.
  const weekendGaps = BOOKINGS.filter(b => b.date.startsWith('Sat 24 May') || b.date.startsWith('Sun 25 May'))
    .filter(b => b.status !== 'confirmed' || !b.cashSorted)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Upcoming fixtures" value={BOOKINGS.length}                 tone="neutral" />
        <Kpi label="Confirmed"          value={confirmed}                       tone="good"    />
        <Kpi label="Unbooked"           value={unbooked}                        tone={unbooked === 0 ? 'good' : 'bad'} />
        <Kpi label="Ref fees"           value={`£${paidFees}/${totalFees}`}     tone="neutral" sub="Cash sorted / total" />
      </div>

      {weekendGaps.length > 0 && (
        <div className="rounded-xl p-4" style={{ backgroundColor: T.panel, border: `1px solid ${T.warn}55` }}>
          <p className="text-sm font-bold mb-2" style={{ color: T.warn }}>
            ⚠️ This weekend — {weekendGaps.length} fixture{weekendGaps.length === 1 ? '' : 's'} not yet covered
          </p>
          <ul className="space-y-1.5">
            {weekendGaps.map(b => {
              const reasons: string[] = []
              if (b.status === 'unbooked')  reasons.push('no referee booked')
              if (b.status === 'pending')   reasons.push('referee pending confirmation')
              if (!b.cashSorted)            reasons.push(`£${b.fee} cash not sorted`)
              return (
                <li key={b.id} className="flex items-start gap-2 text-[11px]" style={{ color: T.text2 }}>
                  <span className="mt-0.5" style={{ color: T.warn }}>•</span>
                  <span>
                    <span style={{ color: T.text, fontWeight: 600 }}>{b.fixture}</span> ({b.date} {b.kickoff}) — {reasons.join(' · ')}.
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
        <div className="px-4 py-3" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
          <p className="text-sm font-bold" style={{ color: T.text }}>Referee bookings</p>
        </div>
        <ul>
          {BOOKINGS.map((b, i) => {
            const ref = getRef(b.refereeId)
            const refIsMinor = ref ? isMinor(ref) : false
            const refDisplay = ref ? displayName(ref) : 'No referee assigned'
            const s = STATUS_TONE[b.status]
            return (
              <li key={b.id} className="px-4 py-3" style={{ borderTop: i === 0 ? 'none' : `1px solid ${T.borderSoft}` }}>
                <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                  <p className="text-xs font-bold" style={{ color: T.text }}>{b.fixture}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: s.bg, color: s.fg }}>{s.label}</span>
                </div>
                <p className="text-[10px] mb-1" style={{ color: T.text4 }}>
                  {b.date} · {b.kickoff} · Ref fee £{b.fee}
                </p>
                <div className="flex items-center gap-2 flex-wrap text-[11px]">
                  <span style={{ color: ref ? T.text2 : T.bad }}>
                    Ref: <span style={{ color: ref ? T.text : T.bad }}>{refDisplay}</span>
                    {ref && ` · ${ref.level}`}
                  </span>
                  {refIsMinor && <MinorDutyOfCareChip small />}
                  <span
                    className="ml-auto text-[10px] px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: b.cashSorted ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)',
                      color: b.cashSorted ? T.good : T.bad,
                    }}
                  >
                    {b.cashSorted ? `Cash ✓ · ${b.whoBringsCash}` : 'Cash ✗ — who\'s bringing it?'}
                  </span>
                </div>
                {b.note && (
                  <p className="text-[10px] mt-1.5 leading-relaxed" style={{ color: T.text3 }}>{b.note}</p>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
        <div className="px-4 py-3" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
          <p className="text-sm font-bold" style={{ color: T.text }}>Club contact list</p>
          <p className="text-[10px] mt-0.5" style={{ color: T.text4 }}>
            Local referees Oakridge has on speed dial. Full regional pool is on the next tab.
          </p>
        </div>
        <ul>
          {REFEREES.filter(r => r.clubContact).map((r, i) => {
            const minor = isMinor(r)
            const contact = displayContact(r)
            return (
              <li key={r.id} className="px-4 py-3" style={{ borderTop: i === 0 ? 'none' : `1px solid ${T.borderSoft}` }}>
                <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                  <p className="text-xs font-bold" style={{ color: T.text }}>{displayName(r)}</p>
                  <span className="text-[10px] font-mono" style={{ color: T.text3 }}>{r.level} · £{r.feePerMatch}/match</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap text-[11px]">
                  {contact ? (
                    <span style={{ color: T.text2 }}>📞 <span style={{ color: T.text }}>{contact}</span></span>
                  ) : (
                    <span style={{ color: T.text4, fontStyle: 'italic' }}>
                      Contact details restricted{minor ? ' — under-18 referee' : ''}
                    </span>
                  )}
                  {minor && <MinorDutyOfCareChip small />}
                  <span className="ml-auto text-[10px]" style={{ color: T.text3 }}>
                    ⭐ {r.rating.toFixed(1)}
                  </span>
                </div>
                {r.notes && (
                  <p className="text-[10px] mt-1 leading-relaxed" style={{ color: T.text3 }}>{r.notes}</p>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      <div className="rounded-xl p-4" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
        <p className="text-sm font-bold mb-2" style={{ color: T.text }}>FA referee requirements</p>
        <ul className="space-y-1.5 text-[11px]" style={{ color: T.text2 }}>
          <li><span style={{ color: T.text4 }}>•</span> Surrey Youth League: Level 7 minimum for youth fixtures · Level 8 (trainee) acceptable for mini-soccer.</li>
          <li><span style={{ color: T.text4 }}>•</span> All referees must be FA registered and insured.</li>
          <li><span style={{ color: T.text4 }}>•</span> <strong style={{ color: T.text }}>FA DBS required</strong> for any referee officiating youth football — verified before assignment.</li>
          <li><span style={{ color: T.text4 }}>•</span> Minimum age: 14 for mini-soccer, 16 for youth football. (Under-18 referees are minors — see the Protect tab for the club&rsquo;s duty of care.)</li>
          <li><span style={{ color: T.text4 }}>•</span> Match fee paid on the day, cash or bank transfer. Standard mini-soccer £25 · 7v7/9v9 £30–£35 · 11v11 £40.</li>
        </ul>
      </div>
    </div>
  )
}

// ─── TAB 2: POOL ────────────────────────────────────────────────────────────

function PoolTab() {
  const [filter, setFilter] = useState<'all' | 'available' | 'maybe'>('all')
  const filtered = REFEREES.filter(r => {
    if (filter === 'available') return r.weekend === 'available'
    if (filter === 'maybe')     return r.weekend === 'available' || r.weekend === 'maybe'
    return true
  })

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4" style={{ backgroundColor: T.panel, border: `1px solid ${T.accent}55` }}>
        <p className="text-sm font-bold mb-1" style={{ color: T.text }}>Regional shared pool · canned demo</p>
        <p className="text-[11px] leading-relaxed" style={{ color: T.text2 }}>
          Referees discoverable across the Surrey area, so a club isn&rsquo;t limited to its own phonebook.
          The list below is a <span style={{ color: T.warn }}>canned demo</span> of the future cross-club
          shared pool. The live version &mdash; real availability synced across every Lumio Junior club in
          a region &mdash; is a backend workstream (see <span className="font-mono">docs/follow-ups.md</span>).
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {([
          { id: 'all',       label: 'All' },
          { id: 'available', label: 'Available this weekend' },
          { id: 'maybe',     label: 'Available or maybe' },
        ] as const).map(f => {
          const active = filter === f.id
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{
                backgroundColor: active ? T.accentDim : 'transparent',
                border: `1px solid ${active ? T.accent : T.border}`,
                color: active ? T.good : T.text3,
              }}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
        <table className="w-full text-xs">
          <thead style={{ backgroundColor: T.panelAlt, color: T.text3 }}>
            <tr className="text-left">
              <th className="px-3 py-2 font-semibold">Referee</th>
              <th className="px-3 py-2 font-semibold">Level</th>
              <th className="px-3 py-2 font-semibold">Area / Distance</th>
              <th className="px-3 py-2 font-semibold">This weekend</th>
              <th className="px-3 py-2 font-semibold">Fee</th>
              <th className="px-3 py-2 font-semibold">Rating</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => {
              const minor = isMinor(r)
              const av = AVAIL_TONE[r.weekend]
              return (
                <tr key={r.id} style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                  <td className="px-3 py-2" style={{ color: T.text }}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span>{displayName(r)}</span>
                      {minor && <MinorDutyOfCareChip small />}
                    </div>
                    {r.clubContact && <p className="text-[10px] mt-0.5" style={{ color: T.good }}>✓ On Oakridge contact list</p>}
                    {!r.faDbsYouth && (
                      <p className="text-[10px] mt-0.5" style={{ color: T.warn }}>
                        ⚠ FA DBS not on file — restricted to mini-soccer only until verified.
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-2" style={{ color: T.text3 }}>{r.level}</td>
                  <td className="px-3 py-2" style={{ color: T.text3 }}>{r.area} · {r.distanceMiles} mi</td>
                  <td className="px-3 py-2">
                    <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: av.bg, color: av.fg }}>
                      {av.label}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono" style={{ color: T.text2 }}>£{r.feePerMatch}</td>
                  <td className="px-3 py-2" style={{ color: T.gold }}>⭐ {r.rating.toFixed(1)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── TAB 3: DEVELOP ─────────────────────────────────────────────────────────

function DevelopTab() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4" style={{ backgroundColor: T.panel, border: `1px solid ${T.accent}55` }}>
        <p className="text-sm font-bold mb-1" style={{ color: T.text }}>Grow your own referees</p>
        <p className="text-[11px] leading-relaxed" style={{ color: T.text2 }}>
          The supply-side answer to the referee shortage: clubs developing their own.
          The FA Referee Course is open from age 14, leads to <span style={{ color: T.text }}>Youth Referee / Level 8 (trainee)</span>
          {' '}then <span style={{ color: T.text }}>Level 7</span> after assessed matches. A club&rsquo;s
          own teenagers are natural recruits — they already know the laws and the
          age-band culture.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl p-4" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
          <p className="text-sm font-bold mb-2" style={{ color: T.text }}>FA Referee Course · the path</p>
          <ul className="space-y-1.5 text-[11px]" style={{ color: T.text2 }}>
            <li><span style={{ color: T.accent }}>•</span> <span style={{ color: T.text }}>Age 14+</span> — minimum age to start. Parents enrol on the candidate&rsquo;s behalf.</li>
            <li><span style={{ color: T.accent }}>•</span> Course cost <span style={{ color: T.text }}>~£140</span> · approximately 30 hours · classroom + on-pitch.</li>
            <li><span style={{ color: T.accent }}>•</span> Completion = <span style={{ color: T.text }}>Level 8 Trainee Youth Referee</span> — eligible to officiate mini-soccer.</li>
            <li><span style={{ color: T.accent }}>•</span> After 5 assessed matches &amp; a year in the role, progression to <span style={{ color: T.text }}>Level 7</span>.</li>
            <li><span style={{ color: T.accent }}>•</span> Club fee subsidy available: Oakridge contributes £80 toward the £140 if the trainee commits to refereeing the club&rsquo;s mini-soccer Saturdays for a season.</li>
          </ul>
        </div>

        <div className="rounded-xl p-4" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
          <p className="text-sm font-bold mb-2" style={{ color: T.text }}>Next County FA intake</p>
          <p className="text-[11px] leading-relaxed mb-3" style={{ color: T.text2 }}>
            Surrey FA next intake: <span style={{ color: T.text }}>three Wednesday evenings + a Saturday assessment</span>,
            June 2026, hosted at Hartwell College. Bookings via the Surrey FA portal — pre-allocate
            places for candidates via the club, lock in once age 14 is confirmed.
          </p>
          <button
            type="button"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={{ backgroundColor: T.accentDim, color: T.good, border: `1px solid ${T.accent}55` }}
          >
            Open Surrey FA booking · demo
          </button>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
        <div className="px-4 py-3" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
          <p className="text-sm font-bold" style={{ color: T.text }}>Oakridge candidates · {CANDIDATES.length} on the pathway</p>
          <p className="text-[10px] mt-0.5" style={{ color: T.text4 }}>
            All candidates are under 18 by definition (FA course starts at 14). Contact details are
            restricted across the portal — talk to parents via Team Manager / Welfare channels.
          </p>
        </div>
        <ul>
          {CANDIDATES.map((c, i) => {
            const s = STATUS_CAND_TONE[c.status]
            return (
              <li key={c.id} className="px-4 py-3" style={{ borderTop: i === 0 ? 'none' : `1px solid ${T.borderSoft}` }}>
                <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                  <p className="text-xs font-bold" style={{ color: T.text }}>{displayName(c)}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: s.bg, color: s.fg }}>{s.label}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap text-[10px]" style={{ color: T.text4 }}>
                  <span>Age {c.age}</span>
                  <span>·</span>
                  <span>{c.ageBandClub}</span>
                  <MinorDutyOfCareChip small />
                </div>
                <p className="text-[11px] mt-1.5 leading-relaxed" style={{ color: T.text2 }}>{c.note}</p>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

// ─── TAB 4: PROTECT ─────────────────────────────────────────────────────────

function ProtectTab() {
  const minorRefBookings = BOOKINGS.filter(b => {
    const ref = getRef(b.refereeId)
    return ref && isMinor(ref)
  })
  const ratingsForMinors = INCIDENTS
    .filter(i => isMinor(getRef(i.refereeId) ?? { age: undefined } as RefereeRecord))
  const avgMinorRating = ratingsForMinors.length === 0
    ? null
    : (ratingsForMinors.reduce((s, i) => s + i.experienceRating, 0) / ratingsForMinors.length)

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4" style={{ backgroundColor: T.panel, border: `1px solid ${T.bad}55` }}>
        <p className="text-sm font-bold mb-1" style={{ color: T.text }}>
          🛡️ Protecting referees — especially the under-18s
        </p>
        <p className="text-[11px] leading-relaxed" style={{ color: T.text2 }}>
          Referees quit because of abuse — and the youngest, who are minors,
          quit first. Lumio Junior treats under-18 referees as minors inside the
          same safeguarding duty of care as players. The
          {' '}<span style={{ color: T.text }}>Welfare Officer (Jenna Holroyd)</span>{' '}
          is the designated point of contact for referee-welfare matters too;
          escalations route alongside player safeguarding incidents (see the
          {' '}<span style={{ color: T.text }}>Safeguarding &amp; Consent Hub</span>{' '}
          for the audit trail).
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Under-18 refs booked"        value={minorRefBookings.length}                                       tone={minorRefBookings.length > 0 ? 'warn' : 'neutral'} />
        <Kpi label="Open incidents"               value={INCIDENTS.filter(i => i.outcome !== 'resolved').length}        tone="warn" />
        <Kpi label="Escalated to County FA"       value={INCIDENTS.filter(i => i.outcome === 'escalated').length}       tone="bad"  />
        <Kpi label="Minor-ref experience avg"     value={avgMinorRating === null ? '—' : `${avgMinorRating.toFixed(1)}/5`} tone={avgMinorRating !== null && avgMinorRating < 3 ? 'bad' : 'good'} />
      </div>

      {minorRefBookings.length > 0 && (
        <div className="rounded-xl p-4" style={{ backgroundColor: T.panel, border: `1px solid ${T.bad}55` }}>
          <p className="text-sm font-bold mb-2" style={{ color: T.text }}>Under-18 referees on this fixture list</p>
          <ul className="space-y-1.5">
            {minorRefBookings.map(b => {
              const ref = getRef(b.refereeId)!
              return (
                <li key={b.id} className="flex items-start gap-2 text-[11px]" style={{ color: T.text2 }}>
                  <span className="mt-0.5" style={{ color: T.bad }}>•</span>
                  <span>
                    <span style={{ color: T.text, fontWeight: 600 }}>{b.fixture}</span> ({b.date} {b.kickoff}) — {displayName(ref)}, age {ref.age ?? 'unknown'}.
                    {' '}Coach + welfare on-site by default; opposition club notified pre-match that the referee is a minor.
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
        <div className="px-4 py-3" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
          <p className="text-sm font-bold" style={{ color: T.text }}>Referee-experience log · last 30 days</p>
          <p className="text-[10px] mt-0.5" style={{ color: T.text4 }}>
            Post-match referee experience ratings + any abuse-related incidents. Both directions —
            from the referee, and reported on their behalf.
          </p>
        </div>
        <ul>
          {INCIDENTS.map((inc, i) => {
            const ref = getRef(inc.refereeId)!
            const minor = isMinor(ref)
            const sev = SEV_TONE[inc.severity]
            const out = OUTCOME_TONE[inc.outcome]
            return (
              <li key={inc.id} className="px-4 py-3" style={{ borderTop: i === 0 ? 'none' : `1px solid ${T.borderSoft}` }}>
                <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                  <p className="text-xs font-bold" style={{ color: T.text }}>{inc.fixture}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: sev.bg, color: sev.fg }}>Severity · {sev.label}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: out.bg, color: out.fg }}>{out.label}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap text-[10px] mb-1" style={{ color: T.text4 }}>
                  <span>{inc.date}</span>
                  <span>· Ref: {displayName(ref)}</span>
                  <span>· Experience {inc.experienceRating}/5</span>
                  {minor && <MinorDutyOfCareChip small />}
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: T.text2 }}>{inc.summary}</p>
                <p className="text-[10px] mt-1.5" style={{ color: T.text4 }}>Reported by {inc.reportedBy}</p>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="rounded-xl p-4" style={{ backgroundColor: T.panel, border: `1px solid ${T.accent}55` }}>
        <p className="text-sm font-bold mb-2" style={{ color: T.text }}>Oakridge Juniors · zero-tolerance referee respect</p>
        <p className="text-[11px] leading-relaxed mb-2" style={{ color: T.text2 }}>
          Reports filed here route to the Welfare Officer&rsquo;s incident log
          and, when appropriate, to the County FA. Adult abuse of a minor
          referee is always escalated. The club&rsquo;s code of conduct binds
          coaches, parents, and visiting supporters — recorded at sign-on and
          repeated to opposition at matchday.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={{ backgroundColor: 'rgba(239,68,68,0.18)', color: T.bad, border: `1px solid ${T.bad}55` }}
          >
            🚩 Report a referee-abuse incident · demo
          </button>
          <button
            type="button"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={{ backgroundColor: T.accentDim, color: T.good, border: `1px solid ${T.accent}55` }}
          >
            Open Safeguarding &amp; Consent Hub
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── KPI tile ───────────────────────────────────────────────────────────────

function Kpi({ label, value, sub, tone }: { label: string; value: string | number; sub?: string; tone: 'good' | 'warn' | 'bad' | 'neutral' }) {
  const colorMap: Record<typeof tone, string> = { good: T.good, warn: T.warn, bad: T.bad, neutral: T.text }
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
      <div className="text-xl font-bold" style={{ color: colorMap[tone] }}>{value}</div>
      <div className="text-xs mt-0.5" style={{ color: T.text3 }}>{label}</div>
      {sub && <div className="text-[10px] mt-1" style={{ color: T.text4 }}>{sub}</div>}
    </div>
  )
}
