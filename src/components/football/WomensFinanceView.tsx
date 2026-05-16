'use client'

import {
  DollarSign, FileText, BarChart3, Users, TrendingUp,
} from 'lucide-react'

// Women's Finance — current-season operational view (transfer budget,
// wage bill, revenue YTD, contract tracker, revenue breakdown).
// DISTINCT from Financial Planning (multi-horizon FSR-constrained
// planner — lives at sidebar 'financial' route).
//
// Pink-themed, Women's demo data. Contract values scaled to WSL 2
// realities (lower wages than Pro), revenue mix
// weighted toward broadcasting + sponsorship vs Pro's matchday-heavy.

const C = {
  bg: '#0F172A',
  card: '#0D1017',
  cardAlt: '#111318',
  border: '#1F2937',
  text: '#F9FAFB',
  textSec: '#9CA3AF',
  muted: '#6B7280',
  primary: '#EC4899',
  gold: '#BE185D',
  good: '#22C55E',
  warn: '#F59E0B',
  bad: '#EF4444',
  blue: '#3B82F6',
  purple: '#8B5CF6',
  cyan: '#06B6D4',
} as const

type Contract = { player: string; position: string; weeklyWage: string; end: string; status: 'Offered' | 'Negotiating' | 'Standard'; agent: string }

const CONTRACT_DATA: Contract[] = [
  { player: 'Lia Barker',     position: 'CM',  weeklyWage: '£3,200', end: 'Jun 2026', status: 'Negotiating', agent: 'Apex Sports' },
  { player: 'Zara Williams',  position: 'ST',  weeklyWage: '£3,800', end: 'Jun 2026', status: 'Offered',     agent: 'KH Group' },
  { player: 'Nia Carter',     position: 'CAM', weeklyWage: '£3,000', end: 'Jun 2027', status: 'Standard',    agent: 'Apex Sports' },
  { player: 'Dani Morris',    position: 'LW',  weeklyWage: '£2,800', end: 'Jun 2027', status: 'Standard',    agent: 'Self-represented' },
  { player: 'Priya Granger',  position: 'CDM', weeklyWage: '£2,400', end: 'Jun 2025', status: 'Negotiating', agent: 'Athletes United' },
  { player: 'Maya Reid',      position: 'CB',  weeklyWage: '£2,200', end: 'Jun 2027', status: 'Standard',    agent: 'KH Group' },
  { player: 'Kira Okonkwo',   position: 'RB',  weeklyWage: '£2,000', end: 'Jun 2026', status: 'Standard',    agent: 'Apex Sports' },
  { player: 'Ellie Hayes',    position: 'GK',  weeklyWage: '£2,300', end: 'Jun 2027', status: 'Standard',    agent: 'Self-represented' },
  { player: 'Carla Porter',   position: 'ST',  weeklyWage: '£1,800', end: 'Jun 2025', status: 'Negotiating', agent: 'Athletes United' },
]

const REVENUE_BREAKDOWN = [
  { source: 'Broadcasting',      amount: '£640k', pct: '32%', trend: '+18%', color: C.blue },
  { source: 'Sponsorship',       amount: '£520k', pct: '26%', trend: '+12%', color: C.warn },
  { source: 'Matchday Revenue',  amount: '£360k', pct: '18%', trend: '+24%', color: C.good },
  { source: 'WSL Distribution',  amount: '£280k', pct: '14%', trend: '—',    color: C.purple },
  { source: 'Merchandise',       amount: '£140k', pct: '7%',  trend: '+31%', color: C.cyan },
  { source: 'Other',             amount: '£60k',  pct: '3%',  trend: '+4%',  color: C.muted },
]

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ElementType; color: string }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}18` }}>
          <Icon size={14} style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-black" style={{ color: C.text }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: C.muted }}>{label}</p>
    </div>
  )
}

export default function WomensFinanceView() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold" style={{ color: C.text }}>Club Finance</h2>
        <p className="text-sm mt-1" style={{ color: C.textSec }}>Current-season revenue, expenditure, wage bill, transfer budgets, and contract management. For multi-horizon planning see Financial Planning under COMMERCIAL.</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {[
          { label: 'Budget Overview',    icon: DollarSign },
          { label: 'Wage Report',        icon: FileText },
          { label: 'Revenue Dashboard',  icon: BarChart3 },
        ].map((a, i) => (
          <button key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap"
            style={{ backgroundColor: C.primary, color: '#fff' }}>
            <a.icon size={12} />{a.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Transfer Budget"     value="£480k"  icon={DollarSign}  color={C.good} />
        <StatCard label="Wage Bill"           value="£1.4m/yr" icon={Users}     color={C.primary} />
        <StatCard label="Revenue (YTD)"       value="£2.0m"  icon={TrendingUp}  color={C.blue} />
        <StatCard label="Wage/Rev Ratio"      value="70%"    icon={BarChart3}   color={C.warn} />
      </div>

      {/* Contract Tracker */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
          <p className="text-sm font-semibold" style={{ color: C.text }}>Contract Tracker</p>
          <span className="text-xs" style={{ color: C.muted }}>Sorted by expiry</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {['Player', 'Position', 'Weekly Wage', 'Expiry', 'Status', 'Agent'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold" style={{ color: C.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CONTRACT_DATA.map((c, i) => {
                const statusColor = c.status === 'Offered' ? C.blue : c.status === 'Negotiating' ? C.warn : C.muted
                return (
                  <tr key={i} style={{ borderBottom: i < CONTRACT_DATA.length - 1 ? `1px solid ${C.border}` : undefined }} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium" style={{ color: C.text }}>{c.player}</td>
                    <td className="px-4 py-3"><span className="px-1.5 py-0.5 rounded" style={{ backgroundColor: `${C.primary}1A`, color: C.primary }}>{c.position}</span></td>
                    <td className="px-4 py-3" style={{ color: C.textSec }}>{c.weeklyWage}</td>
                    <td className="px-4 py-3" style={{ color: c.end === 'Jun 2025' ? C.bad : c.end === 'Jun 2026' ? C.warn : C.textSec }}>{c.end}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-lg font-semibold" style={{ backgroundColor: `${statusColor}1a`, color: statusColor }}>{c.status}</span></td>
                    <td className="px-4 py-3" style={{ color: C.muted }}>{c.agent}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
        <div className="px-5 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
          <p className="text-sm font-semibold" style={{ color: C.text }}>Revenue Breakdown (YTD)</p>
        </div>
        <div className="divide-y" style={{ borderColor: C.border }}>
          {REVENUE_BREAKDOWN.map((r, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
                <span className="text-sm font-medium" style={{ color: C.text }}>{r.source}</span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="font-bold" style={{ color: C.text }}>{r.amount}</span>
                <span style={{ color: C.muted }}>{r.pct}</span>
                <span style={{ color: r.trend.startsWith('+') ? C.good : r.trend === '—' ? C.muted : C.bad }}>{r.trend}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
