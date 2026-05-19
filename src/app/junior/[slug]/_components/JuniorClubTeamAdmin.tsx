'use client'

// Junior Football — Club & Team Admin.
//
// Multi-team operating dashboard for the Chair / Team Manager.
// Surfaces:
//   - Fixtures across all age bands
//   - Training schedule
//   - Availability / RSVP rollup
//   - Squad lists with registration status
//   - GDPR-compliant team / parent messaging
//
// Role scoping (enforced at the dispatch in page.tsx — parent_guardian
// is NOT whitelisted to this module). The component itself trusts that
// only staff render it.

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
} as const

type Tab = 'fixtures' | 'training' | 'rsvp' | 'squads' | 'messaging' | 'revenue'

interface Fixture {
  id: string
  date: string
  time: string
  team: string
  opponent: string
  venue: 'H' | 'A'
  type: 'league' | 'cup' | 'friendly' | 'training-match'
  refConfirmed: boolean
}

interface TrainingSession {
  id: string
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'
  time: string
  team: string
  pitch: string
  coach: string
}

interface RsvpRow {
  team: string
  fixture: string
  confirmed: number
  pending:   number
  declined:  number
  squadSize: number
}

interface SquadRow {
  team: string
  ageBand: string
  registered: number
  capacity: number
  unregistered: number
  coach: string
  manager: string
}

interface MessageRow {
  id: string
  sent: string
  audience: string
  subject: string
  channel: 'email' | 'sms' | 'push' | 'inapp'
  delivered: number
  read: number
  consented: boolean
}

const FIXTURES: Fixture[] = [
  { id: 'fx-001', date: 'Sat 24 May', time: '09:30', team: 'U7 Cubs',     opponent: 'Hartwell U7',         venue: 'H', type: 'league',          refConfirmed: true  },
  { id: 'fx-002', date: 'Sat 24 May', time: '10:30', team: 'U9 Tigers',   opponent: 'Harfield Juniors U9', venue: 'H', type: 'league',          refConfirmed: true  },
  { id: 'fx-003', date: 'Sat 24 May', time: '11:30', team: 'U11 Lions',   opponent: 'Castleton Colts U11', venue: 'A', type: 'cup',             refConfirmed: true  },
  { id: 'fx-004', date: 'Sun 25 May', time: '10:00', team: 'U13 Falcons', opponent: 'Glenmoor U13',        venue: 'H', type: 'league',          refConfirmed: false },
  { id: 'fx-005', date: 'Sun 25 May', time: '11:30', team: 'U14 Eagles',  opponent: 'Sunday Rovers U14',   venue: 'A', type: 'friendly',        refConfirmed: false },
  { id: 'fx-006', date: 'Sun 25 May', time: '14:00', team: 'U16 Wolves',  opponent: 'Northbridge U16',     venue: 'H', type: 'league',          refConfirmed: true  },
]

const TRAINING: TrainingSession[] = [
  { id: 'tr-001', day: 'Mon', time: '18:00', team: 'U13 Falcons', pitch: 'Pitch 2', coach: 'M. Hutchings' },
  { id: 'tr-002', day: 'Tue', time: '18:00', team: 'U11 Lions',   pitch: 'Pitch 1', coach: 'A. Singh' },
  { id: 'tr-003', day: 'Tue', time: '19:15', team: 'U16 Wolves',  pitch: 'Pitch 2', coach: 'M. Hutchings' },
  { id: 'tr-004', day: 'Wed', time: '17:30', team: 'U7 Cubs',     pitch: 'Pitch 3 (small)', coach: 'P. Rolfe' },
  { id: 'tr-005', day: 'Wed', time: '18:30', team: 'U9 Tigers',   pitch: 'Pitch 3 (small)', coach: 'P. Rolfe' },
  { id: 'tr-006', day: 'Thu', time: '18:00', team: 'U14 Eagles',  pitch: 'Pitch 1', coach: 'G. Yardley' },
]

const RSVP: RsvpRow[] = [
  { team: 'U7 Cubs',     fixture: 'vs Hartwell U7 (Sat)',         confirmed: 9, pending: 2, declined: 0, squadSize: 11 },
  { team: 'U9 Tigers',   fixture: 'vs Harfield Juniors U9 (Sat)', confirmed: 10, pending: 1, declined: 1, squadSize: 12 },
  { team: 'U11 Lions',   fixture: 'vs Castleton Colts U11 (Sat)', confirmed: 13, pending: 2, declined: 1, squadSize: 16 },
  { team: 'U13 Falcons', fixture: 'vs Glenmoor U13 (Sun)',        confirmed: 11, pending: 3, declined: 2, squadSize: 16 },
  { team: 'U14 Eagles',  fixture: 'vs Sunday Rovers U14 (Sun)',   confirmed: 8,  pending: 5, declined: 3, squadSize: 16 },
  { team: 'U16 Wolves',  fixture: 'vs Northbridge U16 (Sun)',     confirmed: 14, pending: 1, declined: 1, squadSize: 16 },
]

const SQUADS: SquadRow[] = [
  { team: 'U7 Cubs',     ageBand: 'U7',  registered: 11, capacity: 12, unregistered: 0, coach: 'P. Rolfe',     manager: 'B. Donnelly' },
  { team: 'U9 Tigers',   ageBand: 'U9',  registered: 12, capacity: 12, unregistered: 0, coach: 'P. Rolfe',     manager: 'S. Wong' },
  { team: 'U10 Owls',    ageBand: 'U10', registered: 14, capacity: 14, unregistered: 0, coach: 'R. Patel',     manager: 'D. Lally' },
  { team: 'U11 Lions',   ageBand: 'U11', registered: 16, capacity: 16, unregistered: 0, coach: 'M. Hutchings', manager: 'L. Owens' },
  { team: 'U12 Hawks',   ageBand: 'U12', registered: 14, capacity: 16, unregistered: 1, coach: 'R. Patel',     manager: 'D. Lally' },
  { team: 'U13 Falcons', ageBand: 'U13', registered: 16, capacity: 16, unregistered: 0, coach: 'M. Hutchings', manager: 'F. Aydin' },
  { team: 'U14 Eagles',  ageBand: 'U14', registered: 15, capacity: 16, unregistered: 1, coach: 'G. Yardley',   manager: 'G. Yardley' },
  { team: 'U16 Wolves',  ageBand: 'U16', registered: 16, capacity: 16, unregistered: 0, coach: 'M. Hutchings', manager: 'T. Brennan' },
]

// ─── Revenue & Funding (chairman-only tab) ──────────────────────────────────
// "Club Revenue & Parent Funding" — Commit 7 placement decision:
// rendered as a chairman-only tab WITHIN this Club & Team Admin module
// rather than as its own sidebar item. Reasoning:
//   - The 9-item sidebar has no revenue slot and Commit 4 deliberately
//     dropped Women's-style commercial surfaces (Sponsorship Pipeline,
//     Commercial dashboard) from the junior portal.
//   - Junior revenue concerns are small in number (subs, payouts, optional
//     products) and naturally administrative — they belong with the rest
//     of club admin.
//   - Chair is the only role that needs this surface end-to-end.
//     Welfare officers, coaches, team managers don't touch revenue.
//   - The chairman whitelist already includes 'club_team' (via 'all'),
//     so no role-config change is needed.
// Flagged for review: if a future requirement (e.g. parents seeing a
// payment portal) needs broader access, promote to its own sidebar item.

interface SubscriptionRow {
  childName: string
  team: string
  monthlyAmount: number
  status: 'current' | 'overdue' | 'partial' | 'sibling_discount'
  lastPaid: string
  ytd: number
}

interface PayoutRow {
  source: string
  amount: number
  month: string
  status: 'cleared' | 'pending'
}

interface RevenueProduct {
  id: string
  label: string
  description: string
  status: 'live' | 'pilot' | 'not_offered'
  takeUp?: string
}

const SUBSCRIPTIONS: SubscriptionRow[] = [
  { childName: 'Jack Carter',   team: 'U11 Lions',   monthlyAmount: 22, status: 'current',          lastPaid: '1 May', ytd: 264 },
  { childName: 'Mia Carter',    team: 'U13 Falcons', monthlyAmount: 28, status: 'overdue',          lastPaid: '1 Apr', ytd: 280 },
  { childName: 'Amira Okafor',  team: 'U9 Tigers',   monthlyAmount: 18, status: 'current',          lastPaid: '1 May', ytd: 216 },
  { childName: 'Sophie Mahan',  team: 'U13 Falcons', monthlyAmount: 28, status: 'current',          lastPaid: '1 May', ytd: 336 },
  { childName: 'Tom Pereira',   team: 'U7 Cubs',     monthlyAmount: 15, status: 'current',          lastPaid: '1 May', ytd: 180 },
  { childName: 'Noah Baxter',   team: 'U14 Eagles',  monthlyAmount: 30, status: 'partial',          lastPaid: '15 Apr', ytd: 285 },
  { childName: 'Ravi Doshi',    team: 'U11 Lions',   monthlyAmount: 22, status: 'current',          lastPaid: '1 May', ytd: 264 },
  { childName: 'Aria Khoury',   team: 'U11 Lions',   monthlyAmount: 22, status: 'sibling_discount', lastPaid: '1 May', ytd: 198 },
]

const PAYOUTS: PayoutRow[] = [
  { source: 'Subscription payouts (April)',                 amount: 2104, month: 'Apr', status: 'cleared' },
  { source: 'Tournament entry fees (Spring Cup)',           amount:  420, month: 'Apr', status: 'cleared' },
  { source: 'Pitch hire share (county FA)',                 amount: -180, month: 'Apr', status: 'cleared' },
  { source: 'Subscription payouts (May, in-month)',         amount: 1612, month: 'May', status: 'pending' },
  { source: 'Season-film pre-orders (pilot)',               amount:  240, month: 'May', status: 'pending' },
]

const REVENUE_PRODUCTS: RevenueProduct[] = [
  { id: 'rp-001', label: 'Monthly subs',                description: 'Per-child rolling subscription via Lumio Pay. Sibling discount applied automatically.', status: 'live',         takeUp: '128 of 128 active' },
  { id: 'rp-002', label: 'Season film (per child)',     description: 'Full-season highlight reel produced from match clips. Pilot pricing £29.',               status: 'pilot',       takeUp: '8 pre-orders' },
  { id: 'rp-003', label: 'Tournament entry fees',       description: 'One-off charge for cup or invitational entries.',                                         status: 'live',         takeUp: '12 entries this season' },
  { id: 'rp-004', label: 'Local sponsorship (banners)', description: 'Pitchside banner placements — under-£500 packages routed to club, not via Lumio.',         status: 'not_offered' },
]

const MESSAGES: MessageRow[] = [
  { id: 'm-001', sent: 'Fri 17:00', audience: 'All teams · matchday reminder', subject: 'Saturday matches — kick-off times + venues', channel: 'email', delivered: 128, read: 96, consented: true },
  { id: 'm-002', sent: 'Wed 18:30', audience: 'U11 Lions parents',             subject: "Cup-round travel info — coach pickup 09:00",  channel: 'push',  delivered: 16,  read: 14, consented: true },
  { id: 'm-003', sent: 'Tue 12:00', audience: 'U14 Eagles squad',              subject: 'Training cancelled tonight — pitch unavailable', channel: 'sms', delivered: 15,  read: 15, consented: true },
  { id: 'm-004', sent: 'Mon 09:00', audience: 'Coaching staff',                subject: 'Safeguarding refresher — quarterly check-in', channel: 'inapp', delivered: 8,   read: 8,  consented: true },
]

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl p-5 ${className ?? ''}`} style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
      {children}
    </div>
  )
}

export default function JuniorClubTeamAdmin({ session }: { session: SportsDemoSession }) {
  const [tab, setTab] = useState<Tab>('fixtures')
  // Revenue & Parent Funding tab is chairman-only. The role check is
  // local to this module — the sidebar already gates 'club_team' to
  // staff (parent_guardian is never here), so we only need to filter
  // chairman from the other staff roles within this module.
  const isChair = session.role === 'chairman'

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'fixtures',  label: 'Fixtures',           icon: '📅' },
    { id: 'training',  label: 'Training',           icon: '🏃' },
    { id: 'rsvp',      label: 'Availability / RSVP',icon: '✅' },
    { id: 'squads',    label: 'Squads & registration', icon: '👥' },
    { id: 'messaging', label: 'Parent comms',       icon: '✉️' },
    ...(isChair ? [{ id: 'revenue' as const, label: 'Revenue & funding', icon: '💷' }] : []),
  ]

  const refsToBook = FIXTURES.filter(f => !f.refConfirmed).length
  const totalConfirmed = RSVP.reduce((n, r) => n + r.confirmed, 0)
  const totalSquad = RSVP.reduce((n, r) => n + r.squadSize, 0)
  const totalUnregistered = SQUADS.reduce((n, s) => n + s.unregistered, 0)

  return (
    <div className="space-y-4">
      <div
        className="rounded-xl p-5"
        style={{
          background: `linear-gradient(135deg, ${T.accentDim} 0%, rgba(22,101,52,0.04) 60%, transparent 100%)`,
          border: `1px solid ${T.accent}55`,
        }}
      >
        <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: T.accent }}>Club & Team Admin</p>
        <h2 className="text-lg font-bold" style={{ color: T.text }}>This weekend — multi-team operating view</h2>
        <p className="text-sm mt-1 leading-relaxed" style={{ color: T.text2 }}>
          {FIXTURES.length} fixtures across {SQUADS.length} teams · {refsToBook} referee bookings outstanding ·
          {' '}{totalConfirmed}/{totalSquad} player confirmations in · {totalUnregistered} unregistered slots.
        </p>
      </div>

      <div className="flex gap-1 border-b flex-wrap" style={{ borderColor: T.border }}>
        {tabs.map(t => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className="px-4 py-2.5 text-xs font-semibold transition-all"
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

      {tab === 'fixtures' && (
        <Card>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <p className="text-sm font-bold" style={{ color: T.text }}>This weekend's fixtures</p>
            <button
              type="button"
              className="text-[11px] px-3 py-1.5 rounded-lg font-medium"
              style={{ backgroundColor: T.accentDim, color: T.good, border: `1px solid ${T.accent}55` }}
            >
              Publish fixtures pack (demo)
            </button>
          </div>
          <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: T.panelAlt, borderBottom: `1px solid ${T.border}` }}>
                  <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: T.text4 }}>When</th>
                  <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: T.text4 }}>Team</th>
                  <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: T.text4 }}>Opponent</th>
                  <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: T.text4 }}>Type</th>
                  <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: T.text4 }}>Referee</th>
                </tr>
              </thead>
              <tbody>
                {FIXTURES.map(f => (
                  <tr key={f.id} style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                    <td className="p-3">
                      <div className="text-xs font-semibold" style={{ color: T.text }}>{f.date}</div>
                      <div className="text-[10px] font-mono" style={{ color: T.text4 }}>{f.time}</div>
                    </td>
                    <td className="p-3 text-xs" style={{ color: T.text2 }}>{f.team}</td>
                    <td className="p-3 text-xs" style={{ color: T.text2 }}>
                      vs {f.opponent} <span className="text-[10px] ml-1" style={{ color: T.text4 }}>({f.venue === 'H' ? 'Home' : 'Away'})</span>
                    </td>
                    <td className="p-3 text-[11px]" style={{ color: T.text3 }}>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wide font-semibold"
                        style={{
                          backgroundColor: f.type === 'cup' ? 'rgba(245,158,11,0.15)' : T.accentDim,
                          color: f.type === 'cup' ? T.warn : T.good,
                        }}
                      >
                        {f.type}
                      </span>
                    </td>
                    <td className="p-3 text-[11px]" style={{ color: f.refConfirmed ? T.good : T.warn }}>
                      {f.refConfirmed ? '✓ Booked' : 'To book'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'training' && (
        <Card>
          <p className="text-sm font-bold mb-3" style={{ color: T.text }}>Weekly training schedule</p>
          <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: T.panelAlt, borderBottom: `1px solid ${T.border}` }}>
                  <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: T.text4 }}>Day</th>
                  <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: T.text4 }}>Time</th>
                  <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: T.text4 }}>Team</th>
                  <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: T.text4 }}>Pitch</th>
                  <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: T.text4 }}>Lead coach</th>
                </tr>
              </thead>
              <tbody>
                {TRAINING.map(t => (
                  <tr key={t.id} style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                    <td className="p-3 text-xs font-semibold" style={{ color: T.text }}>{t.day}</td>
                    <td className="p-3 text-[11px] font-mono" style={{ color: T.text3 }}>{t.time}</td>
                    <td className="p-3 text-xs" style={{ color: T.text2 }}>{t.team}</td>
                    <td className="p-3 text-[11px]" style={{ color: T.text3 }}>{t.pitch}</td>
                    <td className="p-3 text-[11px]" style={{ color: T.text3 }}>{t.coach}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'rsvp' && (
        <Card>
          <p className="text-sm font-bold mb-3" style={{ color: T.text }}>This weekend — availability rollup</p>
          <div className="space-y-2">
            {RSVP.map(r => {
              const pct = Math.round((r.confirmed / r.squadSize) * 100)
              const barColor = pct >= 85 ? T.good : pct >= 65 ? T.warn : T.bad
              return (
                <div key={r.team} className="rounded-lg p-3" style={{ backgroundColor: T.panelAlt, border: `1px solid ${T.borderSoft}` }}>
                  <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold" style={{ color: T.text }}>{r.team}</p>
                      <p className="text-[10px]" style={{ color: T.text4 }}>{r.fixture}</p>
                    </div>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span style={{ color: T.good }}>✓ {r.confirmed}</span>
                      <span style={{ color: T.warn }}>· {r.pending} pending</span>
                      <span style={{ color: T.bad }}>✗ {r.declined}</span>
                      <span style={{ color: T.text4 }}>of {r.squadSize}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: T.borderSoft }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {tab === 'squads' && (
        <Card>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <p className="text-sm font-bold" style={{ color: T.text }}>Squads & registration</p>
            <span className="text-[11px]" style={{ color: T.text3 }}>
              Whole Game System sync · last fetched 2 hours ago
            </span>
          </div>
          <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: T.panelAlt, borderBottom: `1px solid ${T.border}` }}>
                  <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: T.text4 }}>Team</th>
                  <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: T.text4 }}>Age</th>
                  <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: T.text4 }}>Registered</th>
                  <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: T.text4 }}>Coach / Manager</th>
                </tr>
              </thead>
              <tbody>
                {SQUADS.map(s => {
                  const ratio = `${s.registered}/${s.capacity}`
                  const ratioColor = s.unregistered > 0 ? T.warn : T.good
                  return (
                    <tr key={s.team} style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                      <td className="p-3 text-xs font-semibold" style={{ color: T.text }}>{s.team}</td>
                      <td className="p-3 text-[11px] font-mono" style={{ color: T.text3 }}>{s.ageBand}</td>
                      <td className="p-3 text-[11px]" style={{ color: ratioColor }}>
                        {ratio}{s.unregistered > 0 ? ` · ${s.unregistered} unregistered` : ''}
                      </td>
                      <td className="p-3 text-[11px]" style={{ color: T.text3 }}>
                        {s.coach} · <span style={{ color: T.text4 }}>{s.manager}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'revenue' && isChair && (
        <div className="space-y-4">
          {/* Note: this tab is gated to chairman in the tabs array above.
              Other staff roles never see it. */}
          <div
            className="rounded-xl p-4"
            style={{
              background: `linear-gradient(135deg, ${T.accentDim} 0%, transparent 70%)`,
              border: `1px solid ${T.accent}55`,
            }}
          >
            <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: T.accent }}>
              Club Revenue & Parent Funding
            </p>
            <p className="text-sm leading-relaxed" style={{ color: T.text2 }}>
              Per-child subscriptions, monthly payouts, and the optional revenue products on
              offer. Live billing wires in via Lumio Pay later — these rows are seeded demo
              data so the chair can see the shape of the surface.
            </p>
            <p className="text-[10px] mt-2 italic" style={{ color: T.text4 }}>
              Placed inside Club & Team Admin (chairman-only tab) rather than a 10th sidebar
              item — junior revenue concerns are administrative and small in number. If a
              parent-facing payment portal lands later, this gets promoted to its own sidebar
              item.
            </p>
          </div>

          {/* Subscription tracker */}
          <Card>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <p className="text-sm font-bold" style={{ color: T.text }}>Per-child subscriptions</p>
              <span className="text-[11px]" style={{ color: T.text3 }}>
                {SUBSCRIPTIONS.length} live subscriptions ·
                {' '}<span style={{ color: T.warn }}>{SUBSCRIPTIONS.filter(s => s.status === 'overdue' || s.status === 'partial').length}</span> need chasing
              </span>
            </div>
            <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: T.panelAlt, borderBottom: `1px solid ${T.border}` }}>
                    <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: T.text4 }}>Child</th>
                    <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: T.text4 }}>Team</th>
                    <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: T.text4 }}>Monthly</th>
                    <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: T.text4 }}>Status</th>
                    <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: T.text4 }}>Last paid</th>
                    <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: T.text4 }}>YTD</th>
                  </tr>
                </thead>
                <tbody>
                  {SUBSCRIPTIONS.map(s => {
                    const statusBadge =
                      s.status === 'current'           ? { label: 'Current',           color: T.good } :
                      s.status === 'sibling_discount'  ? { label: 'Sibling discount',  color: T.good } :
                      s.status === 'partial'           ? { label: 'Partial',           color: T.warn } :
                                                         { label: 'Overdue',           color: T.bad  }
                    return (
                      <tr key={s.childName} style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                        <td className="p-3 text-xs font-semibold" style={{ color: T.text }}>{s.childName}</td>
                        <td className="p-3 text-[11px]" style={{ color: T.text3 }}>{s.team}</td>
                        <td className="p-3 text-[11px] font-mono" style={{ color: T.text2 }}>£{s.monthlyAmount}</td>
                        <td className="p-3">
                          <span
                            className="text-[10px] px-2 py-0.5 rounded uppercase tracking-wide font-semibold"
                            style={{ backgroundColor: `${statusBadge.color}1e`, color: statusBadge.color }}
                          >
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="p-3 text-[11px] font-mono" style={{ color: T.text4 }}>{s.lastPaid}</td>
                        <td className="p-3 text-[11px] font-mono" style={{ color: T.text2 }}>£{s.ytd}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Revenue-share payout dashboard */}
          <Card>
            <p className="text-sm font-bold mb-3" style={{ color: T.text }}>Payouts &amp; revenue share</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div className="rounded-lg p-3" style={{ backgroundColor: T.panelAlt, border: `1px solid ${T.borderSoft}` }}>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: T.text4 }}>This month gross</p>
                <p className="text-2xl font-bold tnum mt-1" style={{ color: T.good }}>£1,852</p>
                <p className="text-[10px] mt-0.5" style={{ color: T.text3 }}>Subs + entry fees + season-film pilot</p>
              </div>
              <div className="rounded-lg p-3" style={{ backgroundColor: T.panelAlt, border: `1px solid ${T.borderSoft}` }}>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: T.text4 }}>Last cleared</p>
                <p className="text-2xl font-bold tnum mt-1" style={{ color: T.text }}>£2,344</p>
                <p className="text-[10px] mt-0.5" style={{ color: T.text3 }}>April net · cleared into club account</p>
              </div>
            </div>
            <ul className="space-y-2">
              {PAYOUTS.map((p, i) => (
                <li key={i} className="flex items-center justify-between gap-2 rounded-lg p-3" style={{ backgroundColor: T.panelAlt, border: `1px solid ${T.borderSoft}` }}>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold" style={{ color: T.text }}>{p.source}</p>
                    <p className="text-[10px]" style={{ color: T.text4 }}>{p.month}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono" style={{ color: p.amount < 0 ? T.bad : T.text }}>
                      {p.amount < 0 ? '−' : '+'}£{Math.abs(p.amount).toLocaleString()}
                    </span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded uppercase tracking-wide font-semibold"
                      style={{ backgroundColor: p.status === 'cleared' ? `${T.good}1e` : `${T.warn}1e`, color: p.status === 'cleared' ? T.good : T.warn }}
                    >
                      {p.status === 'cleared' ? 'Cleared' : 'Pending'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          {/* Optional revenue products */}
          <Card>
            <p className="text-sm font-bold mb-3" style={{ color: T.text }}>Optional revenue products</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {REVENUE_PRODUCTS.map(p => {
                const statusBadge =
                  p.status === 'live'        ? { label: 'Live',        color: T.good } :
                  p.status === 'pilot'       ? { label: 'Pilot',       color: T.warn } :
                                               { label: 'Not offered', color: T.text4 }
                return (
                  <div key={p.id} className="rounded-lg p-3" style={{ backgroundColor: T.panelAlt, border: `1px solid ${T.borderSoft}` }}>
                    <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                      <p className="text-xs font-bold" style={{ color: T.text }}>{p.label}</p>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded uppercase tracking-wide font-semibold"
                        style={{ backgroundColor: `${statusBadge.color}1e`, color: statusBadge.color }}
                      >
                        {statusBadge.label}
                      </span>
                    </div>
                    <p className="text-[11px] mb-2" style={{ color: T.text2 }}>{p.description}</p>
                    {p.takeUp && <p className="text-[10px] italic" style={{ color: T.text4 }}>{p.takeUp}</p>}
                  </div>
                )
              })}
            </div>
            <p className="text-[10px] mt-3" style={{ color: T.text4 }}>
              Live billing wires via Lumio Pay later. Sponsorship banners under £500 route to the
              club directly, not through Lumio.
            </p>
          </Card>
        </div>
      )}

      {tab === 'messaging' && (
        <Card>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div>
              <p className="text-sm font-bold" style={{ color: T.text }}>Parent &amp; team comms</p>
              <p className="text-[11px]" style={{ color: T.text3 }}>
                All messages routed through Lumio — consent and unsubscribe state respected. No
                comms reach a parent who hasn&apos;t opted in to that channel.
              </p>
            </div>
            <button
              type="button"
              className="text-[11px] px-3 py-1.5 rounded-lg font-medium"
              style={{ backgroundColor: T.accentDim, color: T.good, border: `1px solid ${T.accent}55` }}
            >
              Compose new (demo)
            </button>
          </div>
          <div className="rounded-lg p-3 mb-3" style={{ backgroundColor: T.accentDim, border: `1px solid ${T.accent}55` }}>
            <p className="text-[11px]" style={{ color: T.good }}>
              <strong>GDPR:</strong> only audiences with active comms consent appear in the recipient
              picker. Records carrying the &quot;data-sharing: declined&quot; flag are auto-excluded; restricted
              children are never named in batch messages.
            </p>
          </div>
          <ul className="space-y-2">
            {MESSAGES.map(m => (
              <li key={m.id} className="rounded-lg p-3" style={{ backgroundColor: T.panelAlt, border: `1px solid ${T.borderSoft}` }}>
                <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold" style={{ color: T.text }}>{m.subject}</p>
                    <p className="text-[10px]" style={{ color: T.text4 }}>{m.sent} · {m.audience}</p>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span
                      className="px-2 py-0.5 rounded uppercase tracking-wide font-semibold"
                      style={{ backgroundColor: T.accentDim, color: T.good }}
                    >
                      {m.channel}
                    </span>
                    <span style={{ color: T.text3 }}>{m.read}/{m.delivered} read</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
