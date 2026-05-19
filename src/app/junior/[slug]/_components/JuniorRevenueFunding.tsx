'use client'

// Junior Football — Club Revenue & Parent Funding.
//
// Promoted from a tab inside JuniorClubTeamAdmin (Commit 7) to its own
// first-class sidebar destination (Commit 7.1). Reason: Revenue &
// Parent Funding is a key selling feature for clubs — the platform
// pays the club via revenue share — so it should not be buried as a
// tab. The surface itself was already fully built in Commit 7; this
// move only relocates it.
//
// Role-scoped — chairman only. The sidebar whitelist gates this
// already (only chairman, via 'all', has revenue_funding in the
// JUNIOR_ROLE_CONFIG resolution), but the module enforces it
// defensively too: if a non-chairman session somehow reaches this
// component, render an access-denied panel instead of the revenue
// surface. Consistent with how the parent's safeguarding view is
// scoped inside JuniorSafeguardingHub (Commit 5).
//
// All demo content carries over verbatim from Commit 7: same 8
// subscription rows (including the sibling discount + the overdue
// Mia Carter row that matches the unpaid £28 in the Parent App),
// same payouts dashboard, same optional products.

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

// ─── Types + demo data (carried over verbatim from Commit 7) ────────────────

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

// ─── Subcomponents ──────────────────────────────────────────────────────────

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl p-5 ${className ?? ''}`} style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
      {children}
    </div>
  )
}

function AccessDenied() {
  return (
    <Card>
      <p className="text-sm font-bold mb-1" style={{ color: T.text }}>Revenue &amp; Funding</p>
      <p className="text-xs leading-relaxed" style={{ color: T.text2 }}>
        This surface is restricted to the Volunteer Chair. Financial information,
        payouts and subscription state are not visible to other roles. If you
        need access, contact the Chair to request a role change or add a
        Treasurer role (not yet defined).
      </p>
    </Card>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────

interface Props {
  session: SportsDemoSession
}

export default function JuniorRevenueFunding({ session }: Props) {
  // Defensive scoping — the sidebar whitelist gates the navigation, but
  // the module itself enforces the chairman-only rule too. Consistent
  // with the parent's child-scoped safeguarding view inside
  // JuniorSafeguardingHub.
  if (session.role !== 'chairman') return <AccessDenied />

  const overdueOrPartial = SUBSCRIPTIONS.filter(s => s.status === 'overdue' || s.status === 'partial').length
  const monthGross  = 1852
  const lastCleared = 2344

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
          Club Revenue & Parent Funding
        </p>
        <h2 className="text-lg font-bold" style={{ color: T.text }}>
          Per-child subscriptions, monthly payouts, and optional products
        </h2>
        <p className="text-sm mt-1 leading-relaxed" style={{ color: T.text2 }}>
          Lumio collects subscriptions and tournament fees, runs a revenue share
          with the club, and offers optional add-on products. Live billing wires
          via Lumio Pay later — the demo rows below show the shape of the
          surface.
        </p>
        <p className="text-[10px] mt-2 italic" style={{ color: T.text4 }}>
          Chairman-only surface. Whitelisted to <code>chairman</code> via 'all' in
          JUNIOR_ROLE_CONFIG; defensive role check inside this module too.
        </p>
      </div>

      {/* Subscription tracker */}
      <Card>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <p className="text-sm font-bold" style={{ color: T.text }}>Per-child subscriptions</p>
          <span className="text-[11px]" style={{ color: T.text3 }}>
            {SUBSCRIPTIONS.length} live subscriptions ·
            {' '}<span style={{ color: T.warn }}>{overdueOrPartial}</span> need chasing
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

      {/* Payouts & revenue share */}
      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: T.text }}>Payouts &amp; revenue share</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div className="rounded-lg p-3" style={{ backgroundColor: T.panelAlt, border: `1px solid ${T.borderSoft}` }}>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: T.text4 }}>This month gross</p>
            <p className="text-2xl font-bold tnum mt-1" style={{ color: T.good }}>£{monthGross.toLocaleString()}</p>
            <p className="text-[10px] mt-0.5" style={{ color: T.text3 }}>Subs + entry fees + season-film pilot</p>
          </div>
          <div className="rounded-lg p-3" style={{ backgroundColor: T.panelAlt, border: `1px solid ${T.borderSoft}` }}>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: T.text4 }}>Last cleared</p>
            <p className="text-2xl font-bold tnum mt-1" style={{ color: T.text }}>£{lastCleared.toLocaleString()}</p>
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
  )
}
