'use client'

import { useState } from 'react'
import { Crown, TrendingUp, TrendingDown, Users, DollarSign, Trophy, Calendar, Shield, MapPin, CheckCircle2, AlertCircle, FileText, Building2 } from 'lucide-react'
import ClubPlannerTab from './ClubPlannerTab'
import GovernanceView from './GovernanceView'

const C = { bg: '#07080F', card: '#0D1017', border: '#1F2937', text: '#F9FAFB', muted: '#6B7280', purple: '#6C3FC5', teal: '#0D9488', red: '#C0392B', gold: '#F1C40F' } as const

type Tab = 'overview' | 'strategy' | 'profile' | 'finance' | 'squad' | 'governance' | 'facilities'

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl p-5 ${className}`} style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>{children}</div>
}

function KPI({ icon: Icon, label, value, trend, trendUp }: { icon: React.ElementType; label: string; value: string; trend: string; trendUp: boolean }) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: `${C.gold}18` }}><Icon size={16} style={{ color: C.gold }} /></div>
        <span className="text-xs font-bold" style={{ color: trendUp ? '#22C55E' : '#EF4444' }}>{trendUp ? '▲' : '▼'} {trend}</span>
      </div>
      <p className="text-2xl font-black" style={{ color: C.text }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: C.muted }}>{label}</p>
    </Card>
  )
}

function TabBtn({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
      style={{ backgroundColor: active ? C.gold : '#111318', color: active ? '#000' : C.muted, border: active ? 'none' : `1px solid ${C.border}` }}>
      {label}
    </button>
  )
}

function ProgressRing({ percent, size = 80 }: { percent: number; size?: number }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (percent / 100) * circ
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.border} strokeWidth={6} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.gold} strokeWidth={6}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      <text x="50%" y="50%" textAnchor="middle" dy="0.35em" fill={C.text} fontSize={size > 60 ? 16 : 12} fontWeight={900}>{percent}%</text>
    </svg>
  )
}

function CSSBar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs w-20 shrink-0" style={{ color: C.muted }}>{label}</span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: C.border }}>
        <div className="h-full rounded-full" style={{ width: `${(value / max) * 100}%`, backgroundColor: color, transition: 'width 0.5s ease' }} />
      </div>
      <span className="text-xs w-14 text-right font-bold" style={{ color: C.text }}>£{value}K</span>
    </div>
  )
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab() {
  const form = ['W', 'W', 'D', 'L', 'W', 'W', 'L', 'D', 'W', 'W']
  const formColor: Record<string, string> = { W: '#22C55E', D: '#F59E0B', L: '#EF4444' }
  return (
    <div className="space-y-4">
      {/* Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm font-bold mb-3" style={{ color: C.text }}>League Form (Last 10)</p>
          <div className="flex gap-1.5">
            {form.map((r, i) => (
              <span key={i} className="flex items-center justify-center rounded-lg text-xs font-black" style={{ width: 28, height: 28, backgroundColor: `${formColor[r]}20`, color: formColor[r], border: `1px solid ${formColor[r]}40` }}>{r}</span>
            ))}
          </div>
          <p className="text-xs mt-3" style={{ color: C.muted }}>7W 2D 1L — 23 pts from last 30</p>
        </Card>
        <Card>
          <p className="text-sm font-bold mb-2" style={{ color: C.text }}>Next Fixture</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-black" style={{ color: C.text }}>vs Riverside United</p>
              <p className="text-xs" style={{ color: C.muted }}>Sat 12 Apr · 15:00 · Home</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold" style={{ color: C.gold }}>CHAMPIONSHIP</p>
              <p className="text-xs" style={{ color: C.muted }}>Matchday 38</p>
            </div>
          </div>
        </Card>
        <Card>
          <p className="text-sm font-bold mb-2" style={{ color: C.text }}>Top Performer</p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: `${C.red}25`, color: C.red, border: `2px solid ${C.red}` }}>MO</div>
            <div>
              <p className="text-sm font-bold" style={{ color: C.text }}>M. Okafor</p>
              <p className="text-xs" style={{ color: C.muted }}>ST · 16 goals · 4 assists · Rating 8.2</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <p className="text-sm font-bold mb-4" style={{ color: C.text }}>Financial Snapshot</p>
          <div className="space-y-3">
            {[
              { l: 'Revenue YTD', v: '£1.14M', c: '#22C55E' },
              { l: 'Expenditure YTD', v: '£0.98M', c: '#EF4444' },
              { l: 'Net Position', v: '+£160K', c: '#22C55E' },
            ].map(r => (
              <div key={r.l} className="flex justify-between"><span className="text-xs" style={{ color: C.muted }}>{r.l}</span><span className="text-xs font-bold" style={{ color: r.c }}>{r.v}</span></div>
            ))}
            <div className="pt-2" style={{ borderTop: `1px solid ${C.border}` }}>
              <div className="flex justify-between mb-1"><span className="text-xs" style={{ color: C.muted }}>Wage-to-Revenue</span><span className="text-xs font-bold" style={{ color: C.text }}>55%</span></div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: C.border }}>
                <div className="h-full rounded-full" style={{ width: '55%', backgroundColor: '55' <= '60' ? '#22C55E' : '#F59E0B' }} />
              </div>
            </div>
            <div className="flex justify-between pt-2" style={{ borderTop: `1px solid ${C.border}` }}>
              <span className="text-xs" style={{ color: C.muted }}>Projected EOY Surplus</span>
              <span className="text-xs font-bold" style={{ color: '#22C55E' }}>£220K</span>
            </div>
          </div>
        </Card>
        <Card>
          <p className="text-sm font-bold mb-4" style={{ color: C.text }}>Attendance & Matchday</p>
          <div className="flex items-center gap-6">
            <ProgressRing percent={71} size={90} />
            <div className="space-y-2 flex-1">
              <div className="flex justify-between"><span className="text-xs" style={{ color: C.muted }}>Avg Attendance</span><span className="text-xs font-bold" style={{ color: C.text }}>22,500 / 24,000</span></div>
              <div className="flex justify-between"><span className="text-xs" style={{ color: C.muted }}>Season Tickets</span><span className="text-xs font-bold" style={{ color: C.text }}>14,200</span></div>
              <div className="flex justify-between"><span className="text-xs" style={{ color: C.muted }}>Last Match</span><span className="text-xs font-bold" style={{ color: '#22C55E' }}>23,840 (▲6%)</span></div>
            </div>
          </div>
        </Card>
      </div>

      {/* Row 3 */}
      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Board Action Items</p>
        <div className="space-y-2">
          {[
            { icon: '⚠️', text: 'Contract renewal due: James Hartley (expires Jun 2025)', urgency: 'amber' },
            { icon: '📋', text: 'Board meeting: 18 Apr — agenda not yet uploaded', urgency: 'amber' },
            { icon: '💰', text: 'Transfer window budget approval needed — £350K earmarked', urgency: 'amber' },
            { icon: '🏟️', text: 'Facilities inspection: West Stand — 22 Apr', urgency: 'normal' },
            { icon: '✅', text: 'Youth Academy partnership with Oakridge College — signed', urgency: 'done' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg px-4 py-3" style={{ backgroundColor: item.urgency === 'done' ? 'rgba(34,197,94,0.06)' : item.urgency === 'amber' ? 'rgba(245,158,11,0.06)' : '#0A0B10', border: `1px solid ${item.urgency === 'done' ? 'rgba(34,197,94,0.2)' : item.urgency === 'amber' ? 'rgba(245,158,11,0.2)' : C.border}` }}>
              <span>{item.icon}</span>
              <span className="text-xs flex-1" style={{ color: item.urgency === 'done' ? '#6B7280' : C.text, textDecoration: item.urgency === 'done' ? 'line-through' : 'none' }}>{item.text}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Club Health Score */}
      <Card>
        <p className="text-sm font-bold mb-4" style={{ color: C.text }}>Club Health Score</p>
        <div className="flex items-center gap-8">
          <div className="shrink-0">
            <svg width={110} height={110}>
              <circle cx={55} cy={55} r={48} fill="none" stroke={C.border} strokeWidth={8} />
              <circle cx={55} cy={55} r={48} fill="none" stroke={C.gold} strokeWidth={8}
                strokeDasharray={`${2 * Math.PI * 48}`} strokeDashoffset={`${2 * Math.PI * 48 * (1 - 0.74)}`}
                strokeLinecap="round" transform="rotate(-90 55 55)" />
              <text x="55" y="52" textAnchor="middle" fill={C.text} fontSize={22} fontWeight={900}>74</text>
              <text x="55" y="68" textAnchor="middle" fill={C.muted} fontSize={9}>/100</text>
            </svg>
          </div>
          <div className="flex-1 space-y-2.5">
            {[{ l: 'Financial Health', v: 78, c: '#22C55E' }, { l: 'Squad Strength', v: 72, c: C.gold }, { l: 'Fan Engagement', v: 69, c: '#F59E0B' }, { l: 'Infrastructure', v: 77, c: C.teal }].map(s => (
              <div key={s.l}>
                <div className="flex justify-between mb-0.5"><span className="text-[10px]" style={{ color: C.muted }}>{s.l}</span><span className="text-[10px] font-bold" style={{ color: s.c }}>{s.v}</span></div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: C.border }}>
                  <div className="h-full rounded-full" style={{ width: `${s.v}%`, backgroundColor: s.c }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Season Comparison */}
      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Season vs Last Season</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {['Metric', '2023/24', '2024/25', 'Change'].map(h => <th key={h} className="text-left py-2 px-3 font-semibold" style={{ color: C.muted }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {[
                { m: 'Points at this stage', prev: '41', curr: '47', change: '▲+6', ok: true },
                { m: 'Goals scored', prev: '38', curr: '44', change: '▲+6', ok: true },
                { m: 'Goals conceded', prev: '31', curr: '27', change: '▼-4', ok: true },
                { m: 'Average attendance', prev: '21,200', curr: '22,500', change: '▲+1,300', ok: true },
                { m: 'Revenue YTD', prev: '£21.4M', curr: '£23.6M', change: '▲+10%', ok: true },
                { m: 'Wage bill/mo', prev: '£1.85M', curr: '£2.0M', change: '▲+8%', ok: false },
              ].map(r => (
                <tr key={r.m} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td className="py-2 px-3" style={{ color: C.text }}>{r.m}</td>
                  <td className="py-2 px-3" style={{ color: C.muted }}>{r.prev}</td>
                  <td className="py-2 px-3 font-bold" style={{ color: C.text }}>{r.curr}</td>
                  <td className="py-2 px-3 font-bold" style={{ color: r.ok ? '#22C55E' : '#F59E0B' }}>{r.change} {r.ok ? '✅' : '⚠️'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Media & Social */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { l: 'Twitter/X', v: '12,400', t: '▲+340 this month', c: C.teal },
          { l: 'Instagram', v: '8,900', t: '▲+210 this month', c: C.purple },
          { l: 'YouTube Views', v: '4,200', t: 'This month', c: '#EF4444' },
          { l: 'Website Visits', v: '9,800', t: 'This month', c: C.gold },
        ].map(s => (
          <Card key={s.l}>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: C.muted }}>{s.l}</p>
            <p className="text-xl font-black" style={{ color: C.text }}>{s.v}</p>
            <p className="text-[10px] mt-0.5" style={{ color: s.c }}>{s.t}</p>
          </Card>
        ))}
      </div>

      {/* Risk Register */}
      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Risk Register</p>
        <div className="space-y-2">
          {[
            { risk: 'PSR breach if wage bill exceeds 75%', level: 'High', color: '#EF4444', mitigation: 'Monthly review with CFO — currently 55%' },
            { risk: 'Key player contract expiry (3 players)', level: 'High', color: '#EF4444', mitigation: 'Renewal talks initiated — board approval needed' },
            { risk: 'Transfer window overspend', level: 'Medium', color: '#F59E0B', mitigation: '£350K budget approved — tracking vs allocation' },
            { risk: 'Facilities non-compliance (West Stand)', level: 'Medium', color: '#F59E0B', mitigation: 'Inspection booked 22 Apr' },
            { risk: 'Academy EPPP audit gap', level: 'Low', color: '#22C55E', mitigation: '94% compliant — 2 items outstanding' },
          ].map((r, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg px-4 py-3" style={{ backgroundColor: '#0A0B10', border: `1px solid ${C.border}` }}>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: `${r.color}15`, color: r.color }}>{r.level}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold" style={{ color: C.text }}>{r.risk}</p>
                <p className="text-[10px] mt-0.5" style={{ color: C.muted }}>Mitigation: {r.mitigation}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ─── Finance Tab ──────────────────────────────────────────────────────────────

function FinanceTab() {
  const months = [
    { month: 'Jan', matchday: 180, commercial: 85, broadcasting: 35, academy: 20 },
    { month: 'Feb', matchday: 190, commercial: 90, broadcasting: 35, academy: 23 },
    { month: 'Mar', matchday: 185, commercial: 95, broadcasting: 38, academy: 22 },
  ]
  const allVals = months.flatMap(m => [m.matchday, m.commercial, m.broadcasting, m.academy])
  const maxVal = Math.max(...allVals)
  const costs = [
    { cat: 'Wages', budget: 630, actual: 618, ok: true },
    { cat: 'Operations', budget: 180, actual: 195, ok: false },
    { cat: 'Academy', budget: 90, actual: 88, ok: true },
    { cat: 'Marketing', budget: 45, actual: 39, ok: true },
    { cat: 'Travel', budget: 35, actual: 41, ok: false },
  ]

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-sm font-bold mb-4" style={{ color: C.text }}>Revenue Breakdown (Q1)</p>
        <div className="flex items-end justify-center gap-8" style={{ height: 200 }}>
          {months.map(m => {
            const bars = [
              { val: m.matchday, c: C.teal },
              { val: m.commercial, c: C.purple },
              { val: m.broadcasting, c: '#F59E0B' },
              { val: m.academy, c: '#3B82F6' },
            ]
            const total = m.matchday + m.commercial + m.broadcasting + m.academy
            return (
              <div key={m.month} className="flex flex-col items-center">
                <div className="flex items-end gap-1" style={{ height: 160 }}>
                  {bars.map((b, i) => (
                    <div key={i} className="rounded-t" style={{ width: 24, height: Math.max(4, (b.val / maxVal) * 150), backgroundColor: b.c, transition: 'height 0.4s ease' }} />
                  ))}
                </div>
                <span className="text-xs mt-2 font-bold" style={{ color: C.muted }}>{m.month}</span>
                <span className="text-[10px]" style={{ color: C.muted }}>£{total}K</span>
              </div>
            )
          })}
        </div>
        <div className="flex gap-4 mt-4 flex-wrap">
          {[{ l: 'Matchday', c: C.teal }, { l: 'Commercial', c: C.purple }, { l: 'Broadcasting', c: '#F59E0B' }, { l: 'Academy', c: '#3B82F6' }].map(x => (
            <div key={x.l} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: x.c }} /><span className="text-[10px]" style={{ color: C.muted }}>{x.l}</span></div>
          ))}
        </div>
      </Card>

      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Cost Analysis (Q1 YTD)</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {['Category', 'Budget', 'Actual', 'Variance'].map(h => <th key={h} className="text-left py-2 px-3 font-semibold" style={{ color: C.muted }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {costs.map(c => (
                <tr key={c.cat} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td className="py-2.5 px-3 font-medium" style={{ color: C.text }}>{c.cat}</td>
                  <td className="py-2.5 px-3" style={{ color: C.muted }}>£{c.budget}K</td>
                  <td className="py-2.5 px-3" style={{ color: C.text }}>£{c.actual}K</td>
                  <td className="py-2.5 px-3 font-bold" style={{ color: c.ok ? '#22C55E' : '#F59E0B' }}>
                    {c.ok ? '+' : '-'}£{Math.abs(c.budget - c.actual)}K {c.ok ? '✅' : '⚠️'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Wage-to-Revenue Tracker</p>
          <div className="flex items-center gap-2">
            {[{ q: 'Q1', v: 52 }, { q: 'Q2', v: 55 }, { q: 'Q3 (fcst)', v: 57 }].map(q => (
              <div key={q.q} className="flex-1 text-center">
                <div className="h-2 rounded-full mb-1" style={{ backgroundColor: C.border }}>
                  <div className="h-full rounded-full" style={{ width: `${q.v}%`, backgroundColor: q.v > 60 ? '#EF4444' : q.v > 55 ? '#F59E0B' : '#22C55E' }} />
                </div>
                <span className="text-[10px] font-bold" style={{ color: C.muted }}>{q.q}: {q.v}%</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] mt-2" style={{ color: C.muted }}>Target: below 60% · EFL limit: 70%</p>
        </Card>
        <Card>
          <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Cash Flow Summary</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { l: 'Opening', v: '£8.4M', c: C.text },
              { l: 'In', v: '+£3.2M', c: '#22C55E' },
              { l: 'Out', v: '-£2.4M', c: '#EF4444' },
              { l: 'Closing', v: '£9.2M', c: '#22C55E' },
            ].map(x => (
              <div key={x.l} className="rounded-lg p-3 text-center" style={{ backgroundColor: x.l === 'Closing' ? 'rgba(34,197,94,0.08)' : '#0A0B10', border: `1px solid ${x.l === 'Closing' ? 'rgba(34,197,94,0.3)' : C.border}` }}>
                <p className="text-xs" style={{ color: C.muted }}>{x.l}</p>
                <p className="text-sm font-black" style={{ color: x.c }}>{x.v}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Monthly P&L */}
      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Monthly P&L (Last 6 Months)</p>
        <table className="w-full text-xs">
          <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
            {['Month', 'Revenue', 'Costs', 'Net'].map(h => <th key={h} className="text-left py-2 px-3 font-semibold" style={{ color: C.muted }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {[
              { m: 'Oct 2024', r: '£362K', c: '£298K', n: '+£64K' },
              { m: 'Nov 2024', r: '£318K', c: '£301K', n: '+£17K' },
              { m: 'Dec 2024', r: '£395K', c: '£310K', n: '+£85K' },
              { m: 'Jan 2025', r: '£320K', c: '£295K', n: '+£25K' },
              { m: 'Feb 2025', r: '£338K', c: '£305K', n: '+£33K' },
              { m: 'Mar 2025', r: '£340K', c: '£290K', n: '+£50K' },
            ].map(row => (
              <tr key={row.m} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td className="py-2 px-3" style={{ color: C.text }}>{row.m}</td>
                <td className="py-2 px-3" style={{ color: C.muted }}>{row.r}</td>
                <td className="py-2 px-3" style={{ color: C.muted }}>{row.c}</td>
                <td className="py-2 px-3 font-bold" style={{ color: '#22C55E' }}>{row.n} ✅</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Transfer Budget Tracker */}
      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Transfer Budget Tracker</p>
        <div className="flex justify-between text-xs mb-2"><span style={{ color: C.muted }}>£6.3M spent</span><span style={{ color: C.muted }}>£8.7M remaining</span></div>
        <div className="h-3 rounded-full overflow-hidden flex" style={{ backgroundColor: C.border }}>
          <div style={{ width: '42%', backgroundColor: C.teal }} />
          <div style={{ width: '58%', backgroundColor: `${C.purple}40` }} />
        </div>
        <div className="flex justify-between mt-2"><span className="text-[10px]" style={{ color: C.teal }}>Spent: K. Whitfield from Cardiff City (£6.3M)</span><span className="text-[10px]" style={{ color: C.muted }}>Summer window opens: 1 Jun 2025</span></div>
      </Card>

      {/* Top Revenue Sources */}
      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Top Revenue Sources</p>
        <div className="space-y-2">
          {[
            { l: 'Gate receipts', v: 480, pct: 42 },
            { l: 'Commercial/Sponsorship', v: 270, pct: 24 },
            { l: 'Broadcasting', v: 108, pct: 9 },
            { l: 'Hospitality', v: 96, pct: 8 },
            { l: 'Academy sales', v: 87, pct: 8 },
            { l: 'Merchandising', v: 54, pct: 5 },
            { l: 'Other', v: 45, pct: 4 },
          ].map(s => (
            <div key={s.l} className="flex items-center gap-3">
              <span className="text-xs w-40 shrink-0" style={{ color: C.muted }}>{s.l}</span>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: C.border }}>
                <div className="h-full rounded-full" style={{ width: `${s.pct}%`, backgroundColor: C.teal }} />
              </div>
              <span className="text-xs w-16 text-right font-bold" style={{ color: C.text }}>£{s.v}K</span>
              <span className="text-[10px] w-8 text-right" style={{ color: C.muted }}>{s.pct}%</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Outstanding Invoices */}
      <div className="rounded-xl p-4 flex items-start gap-3" style={{ backgroundColor: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
        <AlertCircle size={16} style={{ color: '#F59E0B', marginTop: 2 }} />
        <div>
          <p className="text-xs font-bold" style={{ color: '#F59E0B' }}>3 invoices overdue &gt;30 days — total £12,400</p>
          <p className="text-[10px] mt-0.5" style={{ color: C.muted }}>Oldest: Matchday catering supplier — £4,800 — 47 days overdue</p>
        </div>
      </div>
    </div>
  )
}

// ─── Squad Tab ────────────────────────────────────────────────────────────────

function SquadTab() {
  const performers = [
    { name: 'M. Okafor', pos: 'ST', apps: 28, goals: 16, assists: 4, rating: 8.2 },
    { name: 'T. Brennan', pos: 'CM', apps: 30, goals: 5, assists: 11, rating: 7.9 },
    { name: 'L. Santos', pos: 'LW', apps: 26, goals: 9, assists: 7, rating: 7.8 },
    { name: 'K. Mensah', pos: 'CB', apps: 31, goals: 2, assists: 1, rating: 7.7 },
    { name: 'A. Park', pos: 'GK', apps: 32, goals: 0, assists: 0, rating: 7.6 },
  ]
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[{ l: 'Squad Size', v: '23', i: Users, c: C.gold }, { l: 'Average Age', v: '24.8', i: Users, c: C.teal }, { l: 'Internationals', v: '4', i: Trophy, c: C.purple }, { l: 'Academy Grads', v: '6', i: Users, c: '#22C55E' }].map(s => (
          <Card key={s.l}>
            <div className="flex items-center gap-2 mb-1"><s.i size={14} style={{ color: s.c }} /><span className="text-xs" style={{ color: C.muted }}>{s.l}</span></div>
            <p className="text-2xl font-black" style={{ color: C.text }}>{s.v}</p>
          </Card>
        ))}
      </div>

      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Top 5 Performers</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {['Player', 'Pos', 'Apps', 'Goals', 'Assists', 'Rating'].map(h => <th key={h} className="text-left py-2 px-3 font-semibold" style={{ color: C.muted }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {performers.map(p => (
                <tr key={p.name} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td className="py-2.5 px-3 font-bold" style={{ color: C.text }}>{p.name}</td>
                  <td className="py-2.5 px-3" style={{ color: C.muted }}>{p.pos}</td>
                  <td className="py-2.5 px-3" style={{ color: C.text }}>{p.apps}</td>
                  <td className="py-2.5 px-3 font-bold" style={{ color: '#22C55E' }}>{p.goals}</td>
                  <td className="py-2.5 px-3" style={{ color: C.text }}>{p.assists}</td>
                  <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: p.rating >= 7.8 ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)', color: p.rating >= 7.8 ? '#22C55E' : '#F59E0B' }}>{p.rating}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Injury & Availability</p>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-xs" style={{ color: C.muted }}>Available</span><span className="text-xs font-bold" style={{ color: '#22C55E' }}>19 ✅</span></div>
            <div className="flex justify-between"><span className="text-xs" style={{ color: C.muted }}>Suspended</span><span className="text-xs font-bold" style={{ color: '#F59E0B' }}>1 🟡</span></div>
            <div className="pt-2" style={{ borderTop: `1px solid ${C.border}` }}>
              <p className="text-xs font-bold mb-2" style={{ color: '#EF4444' }}>Injured (3) 🔴</p>
              {[{ n: 'J. Walsh', inj: 'Hamstring', ret: '2 weeks' }, { n: 'D. Cole', inj: 'Ankle', ret: '4 weeks' }, { n: 'P. Ryan', inj: 'Illness', ret: '3 days' }].map(p => (
                <div key={p.n} className="flex justify-between py-1"><span className="text-xs" style={{ color: C.text }}>{p.n} — {p.inj}</span><span className="text-[10px]" style={{ color: C.muted }}>{p.ret}</span></div>
              ))}
            </div>
          </div>
        </Card>
        <Card>
          <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Contract Status</p>
          <div className="space-y-3">
            <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p className="text-xs font-bold mb-1" style={{ color: '#EF4444' }}>Expiring This Summer (3)</p>
              <p className="text-[10px]" style={{ color: C.muted }}>J. Hartley · T. Shaw · N. Ward</p>
            </div>
            <div className="flex justify-between"><span className="text-xs" style={{ color: C.muted }}>Under contract 1yr+</span><span className="text-xs font-bold" style={{ color: C.text }}>15</span></div>
            <div className="flex justify-between"><span className="text-xs" style={{ color: C.muted }}>Under contract 2yr+</span><span className="text-xs font-bold" style={{ color: C.text }}>5</span></div>
          </div>
        </Card>
      </div>

      {/* Form Guide */}
      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Form Guide (Last 5 Appearances)</p>
        <div className="space-y-2">
          {[
            { n: 'M. Okafor', dots: ['🟢','🟢','🟢','🟢','🟡'], avg: '8.1' },
            { n: 'T. Brennan', dots: ['🟢','🟢','🟡','🟢','🟢'], avg: '7.9' },
            { n: 'L. Santos', dots: ['🟡','🟢','🟢','🟡','🟢'], avg: '7.6' },
            { n: 'K. Mensah', dots: ['🟢','🟢','🟢','🟢','🟢'], avg: '7.8' },
            { n: 'A. Park', dots: ['🟢','🟡','🟢','🟢','🟡'], avg: '7.6' },
            { n: 'D. Osei', dots: ['🟡','🟢','🟡','🟡','🟢'], avg: '7.2' },
            { n: 'R. Cole', dots: ['🟢','🟡','🟡','🟢','🟢'], avg: '7.4' },
            { n: 'B. Hardy', dots: ['🟡','🟡','🟢','🟢','🟡'], avg: '7.1' },
          ].map(p => (
            <div key={p.n} className="flex items-center gap-3">
              <span className="text-xs w-24 shrink-0 font-medium" style={{ color: C.text }}>{p.n}</span>
              <div className="flex gap-1">{p.dots.map((d, i) => <span key={i} className="text-sm">{d}</span>)}</div>
              <span className="text-xs font-bold ml-auto" style={{ color: C.gold }}>{p.avg}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Age Profile */}
      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Age Profile</p>
        <div className="flex rounded-full overflow-hidden h-4 mb-3">
          <div style={{ width: '26%', backgroundColor: '#3B82F6' }} title="U21" />
          <div style={{ width: '35%', backgroundColor: C.teal }} title="21-25" />
          <div style={{ width: '26%', backgroundColor: C.gold }} title="26-29" />
          <div style={{ width: '13%', backgroundColor: '#EF4444' }} title="30+" />
        </div>
        <div className="flex gap-4 flex-wrap">
          {[{ l: 'U21', v: '6 (26%)', c: '#3B82F6' }, { l: '21–25', v: '8 (35%)', c: C.teal }, { l: '26–29', v: '6 (26%)', c: C.gold }, { l: '30+', v: '3 (13%)', c: '#EF4444' }].map(a => (
            <div key={a.l} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: a.c }} /><span className="text-[10px]" style={{ color: C.muted }}>{a.l}: {a.v}</span></div>
          ))}
        </div>
      </Card>

      {/* Academy Pipeline */}
      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Academy Pipeline</p>
        <table className="w-full text-xs">
          <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
            {['Player', 'Age', 'Pos', 'Status'].map(h => <th key={h} className="text-left py-2 px-3 font-semibold" style={{ color: C.muted }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {[
              { n: 'R. Adeyemi', a: 18, p: 'ST', s: 'Training with first team' },
              { n: 'C. Walsh', a: 17, p: 'CM', s: 'Academy captain' },
              { n: 'J. Nkosi', a: 19, p: 'RB', s: 'Loan return Jun 2025' },
              { n: 'P. Diallo', a: 16, p: 'LW', s: 'Scholarship signed' },
              { n: 'B. Osei', a: 18, p: 'GK', s: 'First team squad' },
            ].map(p => (
              <tr key={p.n} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td className="py-2 px-3 font-medium" style={{ color: C.text }}>{p.n}</td>
                <td className="py-2 px-3" style={{ color: C.muted }}>{p.a}</td>
                <td className="py-2 px-3" style={{ color: C.muted }}>{p.p}</td>
                <td className="py-2 px-3" style={{ color: C.teal }}>{p.s}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Disciplinary */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[{ l: 'Yellow Cards', v: '34', c: '#F59E0B' }, { l: 'Red Cards', v: '2', c: '#EF4444' }, { l: 'Suspensions', v: '3', c: '#EF4444' }, { l: 'Avg Fouls/Game', v: '11.2', c: C.muted }].map(d => (
          <Card key={d.l}>
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.muted }}>{d.l}</p>
            <p className="text-xl font-black mt-1" style={{ color: d.c }}>{d.v}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ─── Governance Tab ───────────────────────────────────────────────────────────

function GovernanceTab() {
  return <GovernanceView />
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileTab() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ backgroundColor: "#003DA5" }}>⚽</div>
        <div><h2 className="text-xl font-bold" style={{ color: "#F9FAFB" }}>Lumio Sports FC</h2><p className="text-sm" style={{ color: "#9CA3AF" }}>EFL League One · Founded 2002</p></div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[{ l: "Nickname", v: "Lumio Sports FC" },{ l: "Colours", v: "Blue & Yellow" },{ l: "Stadium", v: "Lumio Park" },{ l: "Capacity", v: "9,215" }].map(s => (
          <div key={s.l} className="rounded-xl p-4" style={{ backgroundColor: "#111318", border: "1px solid #1F2937" }}><p className="text-xs" style={{ color: "#6B7280" }}>{s.l}</p><p className="text-sm font-bold" style={{ color: "#F9FAFB" }}>{s.v}</p></div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ backgroundColor: "#111318", border: "1px solid #1F2937" }}>
          <p className="text-sm font-bold mb-3" style={{ color: "#F1C40F" }}>🏆 Honours</p>
          {["League Two Play-off Winners: 2015/16","National League Promotion: 2010/11","Combined Counties League Premier: 2004/05","Isthmian League Division One: 2007/08"].map(h => <p key={h} className="text-xs py-1" style={{ color: "#D1D5DB" }}>{h}</p>)}
        </div>
        <div className="rounded-xl p-5" style={{ backgroundColor: "#111318", border: "1px solid #1F2937" }}>
          <p className="text-sm font-bold mb-3" style={{ color: "#F9FAFB" }}>Facilities</p>
          {[{ l: "Training Ground", v: "⭐⭐⭐⭐ Cat 1" },{ l: "Stadium", v: "⭐⭐⭐ Championship" },{ l: "Academy", v: "⭐⭐⭐⭐ EPPP Cat 2" },{ l: "Medical Centre", v: "⭐⭐⭐⭐" }].map(f => <div key={f.l} className="flex justify-between py-1"><span className="text-xs" style={{ color: "#9CA3AF" }}>{f.l}</span><span className="text-xs" style={{ color: "#F1C40F" }}>{f.v}</span></div>)}
        </div>
      </div>

      <div className="rounded-xl p-5" style={{ backgroundColor: "#111318", border: "1px solid #1F2937" }}>
        <p className="text-sm font-bold mb-3" style={{ color: "#F9FAFB" }}>Board & Ownership</p>
        {[["Owner", "Lumio Sports FC Trust (fan-owned)"],["Manager", "Johnnie Jackson"],["Founded", "2002"],["Philosophy", "\"By the fans, for the fans\""]].map(([l,v]) => <div key={l} className="flex justify-between py-1.5"><span className="text-xs" style={{ color: "#9CA3AF" }}>{l}</span><span className="text-xs font-medium" style={{ color: "#F9FAFB" }}>{v}</span></div>)}
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #1F2937" }}>
        <div className="px-5 py-4" style={{ backgroundColor: "#111318", borderBottom: "1px solid #1F2937" }}><p className="text-sm font-bold" style={{ color: "#F9FAFB" }}>Recent League History</p></div>
        <table className="w-full text-xs"><thead><tr style={{ borderBottom: "1px solid #1F2937" }}>{["Season","Division","Position","Pts"].map(h => <th key={h} className="text-left px-4 py-2" style={{ color: "#6B7280" }}>{h}</th>)}</tr></thead>
        <tbody>{[["2025/26","League One","14th (current)","—"],["2024/25","League Two","3rd (Promoted)","77"],["2023/24","League Two","10th","62"],["2022/23","League Two","19th","50"],["2021/22","League One","24th (Relegated)","41"]].map((r,i) => <tr key={i} style={{ borderBottom: "1px solid #1F2937" }}>{r.map((c,j) => <td key={j} className="px-4 py-2" style={{ color: j === 0 ? "#F9FAFB" : c.includes("Promoted") ? "#22C55E" : c.includes("Relegated") ? "#EF4444" : "#9CA3AF" }}>{c}</td>)}</tr>)}</tbody></table>
      </div>
    </div>
  )
}

// ─── Facilities Tab ───────────────────────────────────────────────────────────

function FacilitiesTab() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { name: 'Main Pitch', status: 'Good', icon: '🏟️', ok: true },
          { name: 'Training Ground', status: 'Good', icon: '⚽', ok: true },
          { name: 'West Stand', status: 'Inspection due', icon: '🏗️', ok: false },
          { name: 'Changing Rooms', status: 'Recently refurbished', icon: '🚿', ok: true },
          { name: 'Floodlights', status: 'Operational', icon: '💡', ok: true },
          { name: 'Club Shop', status: 'Open', icon: '🛍️', ok: true },
        ].map(f => (
          <Card key={f.name}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg">{f.icon}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: f.ok ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)', color: f.ok ? '#22C55E' : '#F59E0B' }}>
                {f.ok ? '✅' : '⚠️'} {f.status}
              </span>
            </div>
            <p className="text-xs font-bold" style={{ color: C.text }}>{f.name}</p>
          </Card>
        ))}
      </div>

      <Card>
        <p className="text-sm font-bold mb-4" style={{ color: C.text }}>Upcoming Maintenance</p>
        <div className="relative pl-6">
          <div className="absolute left-[7px] top-0 bottom-0 w-px" style={{ backgroundColor: C.border }} />
          {[
            { date: '22 Apr', task: 'West Stand inspection' },
            { date: '5 May', task: 'Pitch aeration & overseeding' },
            { date: '12 May', task: 'CCTV system upgrade' },
            { date: '1 Jun', task: 'Pre-season training ground refresh' },
            { date: '15 Jun', task: 'Floodlight PAT testing' },
          ].map((m, i) => (
            <div key={i} className="relative flex items-start gap-4 pb-4">
              <div className="absolute left-[-18px] w-3.5 h-3.5 rounded-full" style={{ backgroundColor: i === 0 ? C.gold : C.border, border: `2px solid ${C.card}`, top: 2 }} />
              <div>
                <p className="text-xs font-bold" style={{ color: i === 0 ? C.gold : C.text }}>{m.date}</p>
                <p className="text-xs" style={{ color: C.muted }}>{m.task}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Stadium Capacity Utilisation</p>
        <div className="space-y-2">
          <div className="flex justify-between"><span className="text-xs" style={{ color: C.muted }}>This season average</span><span className="text-xs font-bold" style={{ color: C.text }}>71%</span></div>
          <div className="flex justify-between"><span className="text-xs" style={{ color: C.muted }}>Best attended</span><span className="text-xs font-bold" style={{ color: '#22C55E' }}>Derby vs Riverside — 5,980 (99%)</span></div>
          <div className="flex justify-between"><span className="text-xs" style={{ color: C.muted }}>Lowest</span><span className="text-xs font-bold" style={{ color: '#EF4444' }}>LC R1 vs Cliffe Town — 1,240 (21%)</span></div>
        </div>
      </Card>

      {/* Facility Investment Plan */}
      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Facility Investment Plan</p>
        <table className="w-full text-xs">
          <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
            {['Project', 'Budget', 'Status', 'Completion'].map(h => <th key={h} className="text-left py-2 px-3 font-semibold" style={{ color: C.muted }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {[
              { p: 'West Stand inspection & repairs', b: '£45K', s: 'In progress', c: 'May 2025', sc: '#F59E0B' },
              { p: 'Training ground drainage', b: '£28K', s: 'Approved', c: 'Jun 2025', sc: '#22C55E' },
              { p: 'New CCTV system', b: '£15K', s: 'Tendering', c: 'May 2025', sc: '#F59E0B' },
              { p: 'Pitch resurfacing', b: '£60K', s: 'Planned', c: 'Jul 2025', sc: C.muted },
              { p: 'Club shop refit', b: '£22K', s: 'Planned', c: 'Aug 2025', sc: C.muted },
            ].map(r => (
              <tr key={r.p} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td className="py-2 px-3" style={{ color: C.text }}>{r.p}</td>
                <td className="py-2 px-3" style={{ color: C.muted }}>{r.b}</td>
                <td className="py-2 px-3"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${r.sc}15`, color: r.sc }}>{r.s}</span></td>
                <td className="py-2 px-3" style={{ color: C.muted }}>{r.c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Energy & Sustainability */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { l: 'Monthly Energy Cost', v: '£4,200', c: '#F59E0B' },
          { l: 'Solar Savings YTD', v: '£1,800', c: '#22C55E' },
          { l: 'Pitch Water Usage', v: '18,000L/mo', c: '#3B82F6' },
          { l: 'Carbon Offset', v: 'On track ✅', c: '#22C55E' },
        ].map(e => (
          <Card key={e.l}>
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.muted }}>{e.l}</p>
            <p className="text-lg font-black mt-1" style={{ color: e.c }}>{e.v}</p>
          </Card>
        ))}
      </div>

      {/* Stadium History */}
      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Stadium Timeline</p>
        <div className="space-y-2">
          {[
            { y: '1897', text: 'Oakridge Park opened' },
            { y: '2014', text: 'Last major refurbishment (West Stand)' },
            { y: 'Now', text: 'Current capacity: 24,000' },
            { y: 'Pending', text: 'East Stand expansion to 25,500 — Phase 1 enabling works on schedule (target 2026/27)' },
          ].map(t => (
            <div key={t.y} className="flex items-center gap-3">
              <span className="text-xs font-bold w-16 shrink-0" style={{ color: t.y === 'Pending' ? C.gold : C.text }}>{t.y}</span>
              <span className="text-xs" style={{ color: C.muted }}>{t.text}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function BoardSuiteView() {
  const [tab, setTab] = useState<Tab>('overview')

  return (
    <div className="space-y-5">
      {/* KPI Bar */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        <KPI icon={Trophy} label="League Position" value="6th" trend="↑2" trendUp />
        <KPI icon={Crown} label="Points" value="47" trend="+3" trendUp />
        <KPI icon={Users} label="Squad Value" value="£38M" trend="↑£1.2M" trendUp />
        <KPI icon={DollarSign} label="Monthly Revenue" value="£3.2M/mo" trend="+8%" trendUp />
        <KPI icon={TrendingDown} label="Wage Bill" value="£2.0M/mo" trend="+3%" trendUp={false} />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {([
          { id: 'overview' as Tab, label: 'Overview' },
          { id: 'strategy' as Tab, label: 'Strategy' },
          { id: 'profile' as Tab, label: 'Profile' },
          { id: 'finance' as Tab, label: 'Finance' },
          { id: 'squad' as Tab, label: 'Squad & Performance' },
          { id: 'governance' as Tab, label: 'Governance' },
          { id: 'facilities' as Tab, label: 'Facilities' },
        ]).map(t => <TabBtn key={t.id} active={tab === t.id} label={t.label} onClick={() => setTab(t.id)} />)}
      </div>

      {/* Content */}
      {tab === 'overview' && <OverviewTab />}
      {tab === 'strategy' && <ClubPlannerTab />}
      {tab === 'profile' && <ProfileTab />}
      {tab === 'finance' && <FinanceTab />}
      {tab === 'squad' && <SquadTab />}
      {tab === 'governance' && <GovernanceTab />}
      {tab === 'facilities' && <FacilitiesTab />}
    </div>
  )
}
