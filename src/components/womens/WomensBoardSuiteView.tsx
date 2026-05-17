'use client'

// Women's Board Suite — pink-themed port of Pro's BoardSuiteView at WSL 2 scale.
// Structural lift from src/components/football/BoardSuiteView.tsx; numbers
// re-scaled to a well-run WSL 2 narrative (£3.25M relevant revenue, 72%
// wage-to-revenue, ~£260k FSR headroom against the 80% cap, 6,500-seat
// stadium). Strategy tab from Pro is excluded; Welfare tab added as a board
// lens with cross-links to the dedicated welfare modules. Honours are modest
// invented WSL 2 finishes — no real clubs cited. Built sequentially over
// 5 commits: this commit ships scaffolding + Overview + Profile.

import { useState } from 'react'
import {
  Crown, TrendingDown, Users, DollarSign, Trophy, AlertCircle,
} from 'lucide-react'

interface WomensClub {
  name: string
  slug: string
  league: 'WSL' | 'WSL2' | 'National League'
  tier: 'pro' | 'championship' | 'grassroots'
  accent: string
  stadium: string
  capacity: number
  manager: string
  director: string
  fsrHeadroom: number | null
  salarySpend: number | null
  relevantRevenue: number
  kitSponsor: string | null
  founded: number
}

const C = {
  bg:         '#07080F',
  card:       '#0D1017',
  cardAlt:    '#111318',
  border:     '#1F2937',
  text:       '#F9FAFB',
  text2:      '#D1D5DB',
  muted:      '#9CA3AF',
  text4:      '#6B7280',
  pink:       '#EC4899',
  pinkDeep:   '#BE185D',
  pinkSoft:   '#F472B6',
  pinkDim:    'rgba(236,72,153,0.10)',
  pinkBorder: 'rgba(236,72,153,0.30)',
  teal:       '#0D9488',
  purple:     '#8B5CF6',
  good:       '#22C55E',
  warn:       '#F59E0B',
  bad:        '#EF4444',
  info:       '#3B82F6',
} as const

type Tab = 'overview' | 'profile' | 'finance' | 'welfare' | 'squad' | 'governance' | 'facilities'

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl p-5 ${className}`} style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
      {children}
    </div>
  )
}

function KPI({ icon: Icon, label, value, trend, trendUp }: { icon: React.ElementType; label: string; value: string; trend: string; trendUp: boolean }) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: C.pinkDim }}>
          <Icon size={16} style={{ color: C.pink }} />
        </div>
        <span className="text-xs font-bold" style={{ color: trendUp ? C.good : C.bad }}>{trendUp ? '▲' : '▼'} {trend}</span>
      </div>
      <p className="text-2xl font-black" style={{ color: C.text }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: C.muted }}>{label}</p>
    </Card>
  )
}

function TabBtn({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
      style={{
        backgroundColor: active ? C.pink : C.cardAlt,
        color: active ? '#FFFFFF' : C.muted,
        border: active ? 'none' : `1px solid ${C.border}`,
      }}>
      {label}
    </button>
  )
}

// Shared between the Overview tab's top-N snapshot and the Governance tab's
// fuller register. Both surfaces render from this single source so any
// risk appearing in both (FSR breach, Welfare Lead vacancy, contracts,
// east terrace, sponsorship) has guaranteed-identical wording and RAG.
const RISK_OVERVIEW_SNAPSHOT = [
  { risk: 'FSR breach if wage bill exceeds 80% cap',                level: 'Medium', color: '#F59E0B', mitigation: 'Currently 72% (£260k headroom) — monthly CFO review' },
  { risk: 'Two senior player contracts expire summer 2026',          level: 'High',   color: '#EF4444', mitigation: 'Renewal talks open — board approval required Jun' },
  { risk: 'Welfare Lead post unfilled — interim cover only',         level: 'High',   color: '#EF4444', mitigation: 'Shortlist of 3, final interviews w/c 26 May' },
  { risk: 'East terrace safety re-inspection due',                   level: 'Medium', color: '#F59E0B', mitigation: 'Inspection booked 7 Jun, contractor briefed' },
  { risk: 'Sponsorship pipeline thinner than budget for 26/27',      level: 'Medium', color: '#F59E0B', mitigation: 'Commercial Lead opening 4 new conversations Q2' },
] as const

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab() {
  const form = ['W', 'D', 'W', 'L', 'W', 'W', 'D', 'L', 'W', 'D']
  const formColor: Record<string, string> = { W: C.good, D: C.warn, L: C.bad }
  return (
    <div className="space-y-4">
      {/* Row 1 — League Form / Next Fixture / Top Performer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm font-bold mb-3" style={{ color: C.text }}>League Form (Last 10)</p>
          <div className="flex gap-1.5">
            {form.map((r, i) => (
              <span key={i} className="flex items-center justify-center rounded-lg text-xs font-black"
                style={{ width: 28, height: 28, backgroundColor: `${formColor[r]}20`, color: formColor[r], border: `1px solid ${formColor[r]}40` }}>{r}</span>
            ))}
          </div>
          <p className="text-xs mt-3" style={{ color: C.muted }}>5W 3D 2L — 18 pts from last 30</p>
        </Card>
        <Card>
          <p className="text-sm font-bold mb-2" style={{ color: C.text }}>Next Fixture</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-black" style={{ color: C.text }}>vs Harfield United Women</p>
              <p className="text-xs" style={{ color: C.muted }}>Sun 24 May · 14:00 · Home</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold" style={{ color: C.pink }}>WSL 2</p>
              <p className="text-xs" style={{ color: C.muted }}>Matchday 21</p>
            </div>
          </div>
        </Card>
        <Card>
          <p className="text-sm font-bold mb-2" style={{ color: C.text }}>Top Performer</p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ backgroundColor: `${C.pink}25`, color: C.pinkSoft, border: `2px solid ${C.pinkDeep}` }}>SR</div>
            <div>
              <p className="text-sm font-bold" style={{ color: C.text }}>S. Reyes</p>
              <p className="text-xs" style={{ color: C.muted }}>ST · 11 goals · 5 assists · Rating 7.9</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Row 2 — Financial Snapshot (WSL 2 scale, 72% WTR) + Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <p className="text-sm font-bold mb-4" style={{ color: C.text }}>Financial Snapshot</p>
          <div className="space-y-3">
            {[
              { l: 'Relevant Revenue (YTD)', v: '£2.41M', c: C.good },
              { l: 'Expenditure (YTD)',      v: '£2.18M', c: C.bad  },
              { l: 'Net Position',           v: '+£230K', c: C.good },
            ].map(r => (
              <div key={r.l} className="flex justify-between">
                <span className="text-xs" style={{ color: C.muted }}>{r.l}</span>
                <span className="text-xs font-bold" style={{ color: r.c }}>{r.v}</span>
              </div>
            ))}
            <div className="pt-2" style={{ borderTop: `1px solid ${C.border}` }}>
              <div className="flex justify-between mb-1">
                <span className="text-xs" style={{ color: C.muted }}>Wage-to-Revenue</span>
                <span className="text-xs font-bold" style={{ color: C.text }}>72%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: C.border }}>
                <div className="h-full rounded-full" style={{ width: '72%', backgroundColor: C.warn }} />
              </div>
              <p className="text-[10px] mt-1" style={{ color: C.text4 }}>FSR cap: 80% · headroom £260k</p>
            </div>
            <div className="flex justify-between pt-2" style={{ borderTop: `1px solid ${C.border}` }}>
              <span className="text-xs" style={{ color: C.muted }}>Projected EOY Surplus</span>
              <span className="text-xs font-bold" style={{ color: C.good }}>£185K</span>
            </div>
          </div>
        </Card>
        <Card>
          <p className="text-sm font-bold mb-4" style={{ color: C.text }}>Attendance & Matchday</p>
          <div className="flex items-center gap-6">
            <ProgressRing percent={47} size={90} />
            <div className="space-y-2 flex-1">
              <div className="flex justify-between"><span className="text-xs" style={{ color: C.muted }}>Avg Attendance</span><span className="text-xs font-bold" style={{ color: C.text }}>3,050 / 6,500</span></div>
              <div className="flex justify-between"><span className="text-xs" style={{ color: C.muted }}>Season Tickets</span><span className="text-xs font-bold" style={{ color: C.text }}>1,420</span></div>
              <div className="flex justify-between"><span className="text-xs" style={{ color: C.muted }}>Last Match</span><span className="text-xs font-bold" style={{ color: C.good }}>3,420 (▲9%)</span></div>
            </div>
          </div>
        </Card>
      </div>

      {/* Row 3 — Board Action Items */}
      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Board Action Items</p>
        <div className="space-y-2">
          {[
            { icon: '📋', text: 'Board meeting: 12 Jun — agenda being drafted by Club Director',                       urgency: 'amber'  },
            { icon: '🩺', text: 'Welfare Lead recruitment: shortlist of 3 — final interviews scheduled w/c 26 May',     urgency: 'amber'  },
            { icon: '💷', text: 'FSR Q2 submission window opens 1 Jul — supporting evidence pack 80% complete',         urgency: 'amber'  },
            { icon: '🏟️', text: 'East terrace safety inspection booked: 7 Jun',                                          urgency: 'normal' },
            { icon: '✅', text: 'Karen Carney self-assessment annual return — submitted Mar 2026',                      urgency: 'done'   },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg px-4 py-3"
              style={{
                backgroundColor: item.urgency === 'done'  ? 'rgba(34,197,94,0.06)'  : item.urgency === 'amber' ? 'rgba(245,158,11,0.06)' : '#0A0B10',
                border: `1px solid ${item.urgency === 'done' ? 'rgba(34,197,94,0.2)' : item.urgency === 'amber' ? 'rgba(245,158,11,0.2)' : C.border}`,
              }}>
              <span>{item.icon}</span>
              <span className="text-xs flex-1" style={{ color: item.urgency === 'done' ? C.text4 : C.text, textDecoration: item.urgency === 'done' ? 'line-through' : 'none' }}>{item.text}</span>
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
              <circle cx={55} cy={55} r={48} fill="none" stroke={C.pink} strokeWidth={8}
                strokeDasharray={`${2 * Math.PI * 48}`} strokeDashoffset={`${2 * Math.PI * 48 * (1 - 0.71)}`}
                strokeLinecap="round" transform="rotate(-90 55 55)" />
              <text x="55" y="52" textAnchor="middle" fill={C.text} fontSize={22} fontWeight={900}>71</text>
              <text x="55" y="68" textAnchor="middle" fill={C.muted} fontSize={9}>/100</text>
            </svg>
          </div>
          <div className="flex-1 space-y-2.5">
            {[
              { l: 'Financial Sustainability', v: 76, c: C.good },
              { l: 'Squad Strength',           v: 68, c: C.warn },
              { l: 'Welfare Standards',        v: 82, c: C.good },
              { l: 'Infrastructure',           v: 58, c: C.warn },
            ].map(s => (
              <div key={s.l}>
                <div className="flex justify-between mb-0.5">
                  <span className="text-[10px]" style={{ color: C.muted }}>{s.l}</span>
                  <span className="text-[10px] font-bold" style={{ color: s.c }}>{s.v}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: C.border }}>
                  <div className="h-full rounded-full" style={{ width: `${s.v}%`, backgroundColor: s.c }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Season comparison — WSL 2 scale */}
      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Season vs Last Season</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {['Metric', '2024/25', '2025/26', 'Change'].map(h => <th key={h} className="text-left py-2 px-3 font-semibold" style={{ color: C.muted }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {[
                { m: 'Points at this stage', prev: '28', curr: '34', change: '▲+6',     ok: true  },
                { m: 'Goals scored',         prev: '26', curr: '31', change: '▲+5',     ok: true  },
                { m: 'Goals conceded',       prev: '24', curr: '21', change: '▼-3',     ok: true  },
                { m: 'Average attendance',   prev: '2,650', curr: '3,050', change: '▲+400',   ok: true  },
                { m: 'Relevant revenue',     prev: '£2.85M', curr: '£3.25M', change: '▲+14%', ok: true  },
                { m: 'Wage-to-Revenue',      prev: '70%', curr: '72%', change: '▲+2pp',  ok: false },
              ].map(r => (
                <tr key={r.m} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td className="py-2 px-3" style={{ color: C.text }}>{r.m}</td>
                  <td className="py-2 px-3" style={{ color: C.muted }}>{r.prev}</td>
                  <td className="py-2 px-3 font-bold" style={{ color: C.text }}>{r.curr}</td>
                  <td className="py-2 px-3 font-bold" style={{ color: r.ok ? C.good : C.warn }}>{r.change} {r.ok ? '✅' : '⚠️'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Risk Register — top-N snapshot rendered from the shared constant
          (RISK_OVERVIEW_SNAPSHOT). The Governance tab's Risk Register
          sub-tab renders the same constant + extras, guaranteeing identical
          wording and RAG for any risk shown in both surfaces. */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold" style={{ color: C.text }}>Risk Register (board snapshot)</p>
          <span className="text-[10px]" style={{ color: C.text4 }}>Full register: Governance → Risk Register</span>
        </div>
        <div className="space-y-2">
          {RISK_OVERVIEW_SNAPSHOT.map((r, i) => (
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

function ProgressRing({ percent, size = 80 }: { percent: number; size?: number }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (percent / 100) * circ
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.border} strokeWidth={6} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.pink} strokeWidth={6}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      <text x="50%" y="50%" textAnchor="middle" dy="0.35em" fill={C.text} fontSize={size > 60 ? 16 : 12} fontWeight={900}>{percent}%</text>
    </svg>
  )
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileTab({ club }: { club: WomensClub }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ backgroundColor: C.pinkDeep, color: '#FFFFFF' }}>⚽</div>
        <div>
          <h2 className="text-xl font-bold" style={{ color: C.text }}>{club.name}</h2>
          <p className="text-sm" style={{ color: C.muted }}>WSL 2 · Founded {club.founded}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { l: 'Nickname', v: 'The Oaks' },
          { l: 'Colours',  v: 'Pink & navy' },
          { l: 'Stadium',  v: club.stadium },
          { l: 'Capacity', v: club.capacity.toLocaleString() },
        ].map(s => (
          <div key={s.l} className="rounded-xl p-4" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
            <p className="text-xs" style={{ color: C.text4 }}>{s.l}</p>
            <p className="text-sm font-bold" style={{ color: C.text }}>{s.v}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Honours — invented modest WSL 2 finishes, no real clubs */}
        <div className="rounded-xl p-5" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
          <p className="text-sm font-bold mb-3" style={{ color: C.pinkSoft }}>🏆 Honours</p>
          {[
            'WSL 2 — 4th place: 2024/25',
            'WSL 2 — 6th place: 2023/24',
            'FA Women’s National League North champions: 2021/22 (promoted)',
            'County Cup winners: 2019/20, 2020/21',
          ].map(h => (
            <p key={h} className="text-xs py-1" style={{ color: C.text2 }}>{h}</p>
          ))}
        </div>

        <div className="rounded-xl p-5" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
          <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Facilities</p>
          {[
            { l: 'Training Ground', v: '⭐⭐⭐ Tier 2 standard' },
            { l: 'Stadium',         v: '⭐⭐⭐ WSL 2 licensed'  },
            { l: 'Academy',         v: '⭐⭐⭐ Tier 2 Pathway'   },
            { l: 'Medical Centre',  v: '⭐⭐⭐⭐'                 },
          ].map(f => (
            <div key={f.l} className="flex justify-between py-1">
              <span className="text-xs" style={{ color: C.muted }}>{f.l}</span>
              <span className="text-xs" style={{ color: C.pinkSoft }}>{f.v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl p-5" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Board & Ownership</p>
        {[
          ['Owner',       'Oakridge Sports Holdings Ltd'],
          ['Club Director', club.director],
          ['Head Coach',  club.manager],
          ['Founded',     String(club.founded)],
          ['Philosophy',  '"Player-led, community-rooted, sustainably run."'],
        ].map(([l, v]) => (
          <div key={l} className="flex justify-between py-1.5">
            <span className="text-xs" style={{ color: C.muted }}>{l}</span>
            <span className="text-xs font-medium" style={{ color: C.text }}>{v}</span>
          </div>
        ))}
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
        <div className="px-5 py-4" style={{ backgroundColor: C.cardAlt, borderBottom: `1px solid ${C.border}` }}>
          <p className="text-sm font-bold" style={{ color: C.text }}>Recent League History</p>
        </div>
        <table className="w-full text-xs">
          <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
            {['Season', 'Division', 'Position', 'Pts'].map(h => (
              <th key={h} className="text-left px-4 py-2" style={{ color: C.text4 }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {[
              ['2025/26', 'WSL 2',                          '5th (current)',      '34'],
              ['2024/25', 'WSL 2',                          '4th',                '46'],
              ['2023/24', 'WSL 2',                          '6th',                '38'],
              ['2022/23', 'FA Women’s National League N.',  '2nd',                '64'],
              ['2021/22', 'FA Women’s National League N.',  '1st (Promoted)',     '72'],
            ].map((r, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                {r.map((c, j) => (
                  <td key={j} className="px-4 py-2"
                    style={{
                      color: j === 0 ? C.text
                        : c.includes('Promoted') ? C.good
                        : c.includes('Relegated') ? C.bad
                        : C.muted,
                    }}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Finance Tab ──────────────────────────────────────────────────────────────
// All figures at WSL 2 well-run scale. Annual relevant revenue £3.25M, wage
// bill £2.34M (72% wage-to-revenue), £260k headroom against the 80% FSR cap.
// Revenue mix reflects WSL 2 reality — commercial-led, modest broadcasting,
// material WSL/FA central distributions, small matchday share.

function FinanceTab() {
  // Q2 monthly slice (Mar–May 2026) in £k for the revenue bar chart.
  const months = [
    { month: 'Mar', commercial: 115, central: 58, matchday: 40, broadcast: 25 },
    { month: 'Apr', commercial: 122, central: 58, matchday: 44, broadcast: 25 },
    { month: 'May', commercial: 120, central: 58, matchday: 42, broadcast: 25 },
  ]
  const allVals = months.flatMap(m => [m.commercial, m.central, m.matchday, m.broadcast])
  const maxVal = Math.max(...allVals)

  // Cost categories — YTD vs budget at WSL 2 scale (£k).
  const costs = [
    { cat: 'Wages',           budget: 1170, actual: 1170, ok: true  },
    { cat: 'Operations',      budget:  175, actual:  188, ok: false },
    { cat: 'Academy',         budget:  105, actual:  102, ok: true  },
    { cat: 'Medical/Welfare', budget:   65, actual:   62, ok: true  },
    { cat: 'Marketing',       budget:   42, actual:   38, ok: true  },
    { cat: 'Travel',          budget:   48, actual:   54, ok: false },
  ]

  return (
    <div className="space-y-4">
      {/* FSR headroom banner — board-relevant top-line at WSL 2 scale */}
      <div className="rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-4"
        style={{ backgroundColor: C.pinkDim, border: `1px solid ${C.pinkBorder}` }}>
        {[
          { l: 'Relevant Revenue (forecast)', v: '£3.25M', c: C.text },
          { l: 'Wage Bill (forecast)',        v: '£2.34M', c: C.text },
          { l: 'Wage-to-Revenue',             v: '72%',    c: C.warn },
          { l: 'FSR Headroom (vs 80% cap)',   v: '£260k',  c: C.good },
        ].map(s => (
          <div key={s.l}>
            <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.muted }}>{s.l}</p>
            <p className="text-lg font-black mt-0.5" style={{ color: s.c }}>{s.v}</p>
          </div>
        ))}
      </div>

      <Card>
        <p className="text-sm font-bold mb-4" style={{ color: C.text }}>Revenue Breakdown (Q2)</p>
        <div className="flex items-end justify-center gap-8" style={{ height: 200 }}>
          {months.map(m => {
            const bars = [
              { val: m.commercial, c: C.pink   },
              { val: m.central,    c: C.purple },
              { val: m.matchday,   c: C.teal   },
              { val: m.broadcast,  c: C.warn   },
            ]
            const total = m.commercial + m.central + m.matchday + m.broadcast
            return (
              <div key={m.month} className="flex flex-col items-center">
                <div className="flex items-end gap-1" style={{ height: 160 }}>
                  {bars.map((b, i) => (
                    <div key={i} className="rounded-t"
                      style={{ width: 24, height: Math.max(4, (b.val / maxVal) * 150), backgroundColor: b.c, transition: 'height 0.4s ease' }} />
                  ))}
                </div>
                <span className="text-xs mt-2 font-bold" style={{ color: C.muted }}>{m.month}</span>
                <span className="text-[10px]" style={{ color: C.muted }}>£{total}k</span>
              </div>
            )
          })}
        </div>
        <div className="flex gap-4 mt-4 flex-wrap">
          {[
            { l: 'Commercial / Sponsorship', c: C.pink   },
            { l: 'WSL / FA central',         c: C.purple },
            { l: 'Matchday',                 c: C.teal   },
            { l: 'Broadcasting',             c: C.warn   },
          ].map(x => (
            <div key={x.l} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: x.c }} />
              <span className="text-[10px]" style={{ color: C.muted }}>{x.l}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Cost Analysis (YTD)</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {['Category', 'Budget', 'Actual', 'Variance'].map(h => (
                <th key={h} className="text-left py-2 px-3 font-semibold" style={{ color: C.muted }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {costs.map(c => (
                <tr key={c.cat} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td className="py-2.5 px-3 font-medium" style={{ color: C.text }}>{c.cat}</td>
                  <td className="py-2.5 px-3" style={{ color: C.muted }}>£{c.budget}k</td>
                  <td className="py-2.5 px-3" style={{ color: C.text }}>£{c.actual}k</td>
                  <td className="py-2.5 px-3 font-bold" style={{ color: c.ok ? C.good : C.warn }}>
                    {c.actual <= c.budget ? '+' : '−'}£{Math.abs(c.budget - c.actual)}k {c.ok ? '✅' : '⚠️'}
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
            {[
              { q: 'Q4 24/25',         v: 70 },
              { q: 'Q1 25/26',         v: 74 },
              { q: 'Q2 25/26 (curr)',  v: 72 },
            ].map(q => (
              <div key={q.q} className="flex-1 text-center">
                <div className="h-2 rounded-full mb-1" style={{ backgroundColor: C.border }}>
                  <div className="h-full rounded-full"
                    style={{ width: `${q.v}%`, backgroundColor: q.v >= 78 ? C.bad : q.v >= 70 ? C.warn : C.good }} />
                </div>
                <span className="text-[10px] font-bold" style={{ color: C.muted }}>{q.q}: {q.v}%</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] mt-2" style={{ color: C.muted }}>Internal target: 70% · FSR cap: 80% · headroom £260k</p>
        </Card>
        <Card>
          <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Cash Flow Summary (YTD)</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { l: 'Opening', v: '£620k',  c: C.text },
              { l: 'In',      v: '+£1.8M', c: C.good },
              { l: 'Out',     v: '−£1.7M', c: C.bad  },
              { l: 'Closing', v: '£720k',  c: C.good },
            ].map(x => (
              <div key={x.l} className="rounded-lg p-3 text-center"
                style={{
                  backgroundColor: x.l === 'Closing' ? 'rgba(34,197,94,0.08)' : '#0A0B10',
                  border: `1px solid ${x.l === 'Closing' ? 'rgba(34,197,94,0.3)' : C.border}`,
                }}>
                <p className="text-xs" style={{ color: C.muted }}>{x.l}</p>
                <p className="text-sm font-black" style={{ color: x.c }}>{x.v}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Monthly P&L — small surpluses with a Jan dip, WSL 2 cadence */}
      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Monthly P&amp;L (Last 6 Months)</p>
        <table className="w-full text-xs">
          <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
            {['Month', 'Revenue', 'Costs', 'Net'].map(h => (
              <th key={h} className="text-left py-2 px-3 font-semibold" style={{ color: C.muted }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {[
              { m: 'Dec 2025', r: '£298k', c: '£276k', n: '+£22k', ok: true  },
              { m: 'Jan 2026', r: '£242k', c: '£268k', n: '−£26k', ok: false },
              { m: 'Feb 2026', r: '£260k', c: '£272k', n: '−£12k', ok: false },
              { m: 'Mar 2026', r: '£305k', c: '£280k', n: '+£25k', ok: true  },
              { m: 'Apr 2026', r: '£318k', c: '£282k', n: '+£36k', ok: true  },
              { m: 'May 2026', r: '£290k', c: '£270k', n: '+£20k', ok: true  },
            ].map(row => (
              <tr key={row.m} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td className="py-2 px-3" style={{ color: C.text }}>{row.m}</td>
                <td className="py-2 px-3" style={{ color: C.muted }}>{row.r}</td>
                <td className="py-2 px-3" style={{ color: C.muted }}>{row.c}</td>
                <td className="py-2 px-3 font-bold" style={{ color: row.ok ? C.good : C.warn }}>
                  {row.n} {row.ok ? '✅' : '⚠️'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[10px] mt-2" style={{ color: C.text4 }}>Jan / Feb dip = season-ticket renewal lull + winter break matchday gap; covered by reserves.</p>
      </Card>

      {/* Transfer Budget Tracker — WSL 2 scale, modest */}
      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Transfer Budget Tracker (2025/26)</p>
        <div className="flex justify-between text-xs mb-2">
          <span style={{ color: C.muted }}>£75k spent</span>
          <span style={{ color: C.muted }}>£45k remaining</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden flex" style={{ backgroundColor: C.border }}>
          <div style={{ width: '62.5%', backgroundColor: C.pink }} />
          <div style={{ width: '37.5%', backgroundColor: `${C.pinkDeep}55` }} />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px]" style={{ color: C.pinkSoft }}>Spent: L. Fowler from a Tier 3 side (£75k incl. add-ons)</span>
          <span className="text-[10px]" style={{ color: C.muted }}>Summer window opens: 1 Jun 2026</span>
        </div>
      </Card>

      {/* Top Revenue Sources — annual mix at WSL 2 reality */}
      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Top Revenue Sources (annual)</p>
        <div className="space-y-2">
          {[
            { l: 'Commercial / Sponsorship', v: 1400, pct: 43 },
            { l: 'WSL / FA central distributions', v: 700, pct: 22 },
            { l: 'Matchday (gate)',                v: 480, pct: 15 },
            { l: 'Broadcasting',                   v: 300, pct:  9 },
            { l: 'Hospitality',                    v: 180, pct:  6 },
            { l: 'Academy & community',            v: 120, pct:  4 },
            { l: 'Merchandising / other',          v:  70, pct:  2 },
          ].map(s => (
            <div key={s.l} className="flex items-center gap-3">
              <span className="text-xs w-44 shrink-0" style={{ color: C.muted }}>{s.l}</span>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: C.border }}>
                <div className="h-full rounded-full" style={{ width: `${s.pct}%`, backgroundColor: C.pink }} />
              </div>
              <span className="text-xs w-16 text-right font-bold" style={{ color: C.text }}>£{s.v}k</span>
              <span className="text-[10px] w-8 text-right" style={{ color: C.muted }}>{s.pct}%</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Outstanding Invoices — small, plausible WSL 2 figures */}
      <div className="rounded-xl p-4 flex items-start gap-3"
        style={{ backgroundColor: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
        <AlertCircle size={16} style={{ color: C.warn, marginTop: 2 }} />
        <div>
          <p className="text-xs font-bold" style={{ color: C.warn }}>2 invoices overdue &gt;30 days — total £3,800</p>
          <p className="text-[10px] mt-0.5" style={{ color: C.muted }}>Oldest: matchday merchandise supplier — £1,600 — 38 days overdue</p>
        </div>
      </div>
    </div>
  )
}

// ─── Welfare Tab (board lens) ─────────────────────────────────────────────────
// Light rollup of the dedicated welfare modules. Numbers shown at board level
// are aggregate and anonymised — clinical detail stays in the modules and
// with the Welfare Lead and Club Doctor. Cycle and Pregnancy & RTP framing is
// wellbeing-led and player-controlled. Cross-links open the corresponding
// modules via the page-level activeSection setter (passed in as onNavigate).

function WelfareTab({ onNavigate }: { onNavigate?: (id: string) => void }) {
  const go = (id: string) => () => onNavigate?.(id)

  return (
    <div className="space-y-4">
      {/* Headline KPIs — board-relevant, all aggregate / anonymised */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { l: 'Open welfare flags',         v: '4',   sub: '2 amber · 2 yellow · 0 red', c: C.warn },
          { l: 'Players on modified-load',   v: '3',   sub: 'all within standard pathway', c: C.text },
          { l: 'Cycle module opt-in rate',   v: '64%', sub: '14 of 22 — opt-in only',      c: C.pinkSoft },
          { l: 'Active pregnancy / RTP',     v: '1',   sub: 'Stage 4 of 10 (adapted training)', c: C.pinkSoft },
        ].map(s => (
          <Card key={s.l}>
            <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.muted }}>{s.l}</p>
            <p className="text-2xl font-black mt-1" style={{ color: s.c }}>{s.v}</p>
            <p className="text-[10px] mt-0.5" style={{ color: C.text4 }}>{s.sub}</p>
          </Card>
        ))}
      </div>

      {/* Three board-lens summary cards, each with a cross-link to its module */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold" style={{ color: C.text }}>ACL Risk Prevention</p>
            <button onClick={go('acl')} className="text-[10px] font-bold px-2 py-1 rounded-md"
              style={{ backgroundColor: C.pinkDim, color: C.pinkSoft, border: `1px solid ${C.pinkBorder}` }}>
              Open module →
            </button>
          </div>
          <div className="space-y-2">
            {[
              { l: 'Low risk',      v: 15, c: C.good },
              { l: 'Moderate risk', v:  5, c: C.warn },
              { l: 'Elevated risk', v:  2, c: C.bad  },
            ].map(r => (
              <div key={r.l}>
                <div className="flex justify-between mb-0.5">
                  <span className="text-[11px]" style={{ color: C.muted }}>{r.l}</span>
                  <span className="text-[11px] font-bold" style={{ color: r.c }}>{r.v}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: C.border }}>
                  <div className="h-full rounded-full" style={{ width: `${(r.v / 22) * 100}%`, backgroundColor: r.c }} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] mt-3" style={{ color: C.text4 }}>
            Aggregate squad screen. Individual ACL detail sits with the Club Doctor in the ACL module.
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold" style={{ color: C.text }}>Cycle Tracking</p>
            <button onClick={go('cycle')} className="text-[10px] font-bold px-2 py-1 rounded-md"
              style={{ backgroundColor: C.pinkDim, color: C.pinkSoft, border: `1px solid ${C.pinkBorder}` }}>
              Open module →
            </button>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between"><span style={{ color: C.muted }}>Opt-in players</span><span className="font-bold" style={{ color: C.text }}>14 / 22</span></div>
            <div className="flex justify-between"><span style={{ color: C.muted }}>Consent revoked YTD</span><span className="font-bold" style={{ color: C.text }}>1 (purged 30d backups)</span></div>
            <div className="flex justify-between"><span style={{ color: C.muted }}>Visible to coaching</span><span className="font-bold" style={{ color: C.good }}>availability flags only</span></div>
            <div className="flex justify-between"><span style={{ color: C.muted }}>Phase data access</span><span className="font-bold" style={{ color: C.text }}>Doctor + Welfare Lead</span></div>
          </div>
          <p className="text-[10px] mt-3" style={{ color: C.text4 }}>
            Opt-in only. Players control consent and can revoke at any time, no questions asked.
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold" style={{ color: C.text }}>Mental Health</p>
            <button onClick={go('mental')} className="text-[10px] font-bold px-2 py-1 rounded-md"
              style={{ backgroundColor: C.pinkDim, color: C.pinkSoft, border: `1px solid ${C.pinkBorder}` }}>
              Open module →
            </button>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between"><span style={{ color: C.muted }}>Sessions delivered (YTD)</span><span className="font-bold" style={{ color: C.text }}>62</span></div>
            <div className="flex justify-between"><span style={{ color: C.muted }}>% squad accessing</span><span className="font-bold" style={{ color: C.text }}>~55%</span></div>
            <div className="flex justify-between"><span style={{ color: C.muted }}>PFA referrals open</span><span className="font-bold" style={{ color: C.text }}>2</span></div>
            <div className="flex justify-between"><span style={{ color: C.muted }}>Avg wait to first session</span><span className="font-bold" style={{ color: C.good }}>3 days</span></div>
          </div>
          <p className="text-[10px] mt-3" style={{ color: C.text4 }}>
            Confidential by default. Board sees utilisation only — no clinical content.
          </p>
        </Card>
      </div>

      {/* Pregnancy & RTP — 10-stage pathway with anonymised active case */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold" style={{ color: C.text }}>Pregnancy & Return-to-Play</p>
          <button onClick={go('maternity')} className="text-[10px] font-bold px-2 py-1 rounded-md"
            style={{ backgroundColor: C.pinkDim, color: C.pinkSoft, border: `1px solid ${C.pinkBorder}` }}>
            Open module →
          </button>
        </div>
        <div className="space-y-3">
          <div className="flex gap-1">
            {[
              { s: 1, label: 'Notification' },
              { s: 2, label: 'Clinical handover' },
              { s: 3, label: 'Adapted training (T1)' },
              { s: 4, label: 'Adapted training (T2)' },
              { s: 5, label: 'Cessation of contact' },
              { s: 6, label: 'Maternity leave' },
              { s: 7, label: 'Postpartum clearance' },
              { s: 8, label: 'Pelvic floor / MSK' },
              { s: 9, label: 'Graduated RTP' },
              { s: 10, label: 'Match selection' },
            ].map((st) => (
              <div key={st.s} className="flex-1 text-center" title={st.label}>
                <div className="h-2 rounded" style={{ backgroundColor: st.s <= 4 ? C.pink : st.s === 5 ? C.pinkDim : C.border }} />
                <p className="text-[9px] mt-1 font-bold" style={{ color: st.s === 4 ? C.pinkSoft : C.text4 }}>{st.s}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div><span style={{ color: C.muted }}>Active cases: </span><span className="font-bold" style={{ color: C.text }}>1 player (Stage 4)</span></div>
            <div><span style={{ color: C.muted }}>Pay backstop: </span><span className="font-bold" style={{ color: C.good }}>WSL 26 wks · FIFA Art. 18quater</span></div>
            <div><span style={{ color: C.muted }}>Board visibility: </span><span className="font-bold" style={{ color: C.text }}>stage + contract only</span></div>
          </div>
        </div>
        <p className="text-[10px] mt-3" style={{ color: C.text4 }}>
          Care-not-surveillance. Clinical detail stays with player + Club Doctor; Welfare Lead sees pathway stage and contract obligations.
        </p>
      </Card>

      {/* Compliance + recruitment rollup */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Karen Carney Standards</p>
          <div className="space-y-2 text-xs">
            {[
              { l: 'Independent Welfare Lead in post',         ok: false, note: 'interim cover (perm hire in flight)' },
              { l: 'Cycle-aware training adaptation',          ok: true  },
              { l: 'Postpartum return-to-play pathway',        ok: true  },
              { l: 'Mental-health pathway with PFA liaison',   ok: true  },
              { l: 'Player transition / retirement support',   ok: true  },
              { l: 'Annual Carney self-assessment return',     ok: true, note: 'submitted Mar 2026' },
            ].map((c, i) => (
              <div key={i} className="flex items-center gap-2 py-1" style={{ borderBottom: `1px solid ${C.border}` }}>
                <span style={{ color: c.ok ? C.good : C.bad }}>{c.ok ? '✓' : '✗'}</span>
                <span style={{ color: C.text2 }} className="flex-1">{c.l}</span>
                {c.note && <span className="text-[10px]" style={{ color: C.warn }}>{c.note}</span>}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Welfare Lead Recruitment</p>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span style={{ color: C.muted }}>Status</span><span className="font-bold" style={{ color: C.warn }}>Interim cover · permanent hire in flight</span></div>
            <div className="flex justify-between"><span style={{ color: C.muted }}>Shortlist</span><span className="font-bold" style={{ color: C.text }}>3 candidates</span></div>
            <div className="flex justify-between"><span style={{ color: C.muted }}>Final interviews</span><span className="font-bold" style={{ color: C.text }}>w/c 26 May 2026</span></div>
            <div className="flex justify-between"><span style={{ color: C.muted }}>Expected start</span><span className="font-bold" style={{ color: C.text }}>1 Jul 2026</span></div>
          </div>
          <p className="text-[10px] mt-3" style={{ color: C.text4 }}>
            Welfare Lead has independent reporting line to the Club Director and direct access to the board.
          </p>
        </Card>
      </div>

      {/* Cross-link strip — quick jump into the full welfare modules */}
      <Card>
        <p className="text-[10px] uppercase tracking-wider font-semibold mb-3" style={{ color: C.muted }}>Open full welfare modules</p>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'welfare',   label: 'Player Welfare Hub' },
            { id: 'cycle',     label: 'Cycle Tracking' },
            { id: 'maternity', label: 'Pregnancy & RTP' },
            { id: 'acl',       label: 'ACL Prevention' },
            { id: 'mental',    label: 'Mental Health' },
            { id: 'medical',   label: 'Medical Records' },
          ].map(l => (
            <button key={l.id} onClick={go(l.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ backgroundColor: C.cardAlt, color: C.text2, border: `1px solid ${C.border}` }}>
              {l.label} →
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ─── Squad & Performance Tab ──────────────────────────────────────────────────
// Squad scale matches the KPI strip (22 players). Contract-expiry count must
// match the Overview Risk Register entry "Two senior player contracts expire
// summer 2026" — both surfaces show 2, not 3. Injury/availability is the
// selection-availability lens; it can sit alongside the Welfare tab's
// "3 on modified-load" without contradiction (modified-load can apply to
// players still selectable).

function SquadTab() {
  const performers = [
    { name: 'S. Reyes',       pos: 'ST',  apps: 19, goals: 11, assists: 5, rating: 7.9 },
    { name: 'A. Patel',       pos: 'CM',  apps: 20, goals:  4, assists: 8, rating: 7.7 },
    { name: 'N. Achterberg',  pos: 'LW',  apps: 18, goals:  7, assists: 4, rating: 7.5 },
    { name: 'J. Okonkwo',     pos: 'CB',  apps: 20, goals:  2, assists: 1, rating: 7.5 },
    { name: 'M. Costa',       pos: 'GK',  apps: 20, goals:  0, assists: 0, rating: 7.4 },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { l: 'Squad Size',      v: '22',   i: Users,   c: C.pink   },
          { l: 'Average Age',     v: '24.4', i: Users,   c: C.teal   },
          { l: 'Internationals',  v: '3',    i: Trophy,  c: C.purple },
          { l: 'Academy Grads',   v: '4',    i: Users,   c: C.good   },
        ].map(s => (
          <Card key={s.l}>
            <div className="flex items-center gap-2 mb-1">
              <s.i size={14} style={{ color: s.c }} />
              <span className="text-xs" style={{ color: C.muted }}>{s.l}</span>
            </div>
            <p className="text-2xl font-black" style={{ color: C.text }}>{s.v}</p>
          </Card>
        ))}
      </div>

      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Top 5 Performers</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {['Player', 'Pos', 'Apps', 'Goals', 'Assists', 'Rating'].map(h => (
                <th key={h} className="text-left py-2 px-3 font-semibold" style={{ color: C.muted }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {performers.map(p => (
                <tr key={p.name} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td className="py-2.5 px-3 font-bold" style={{ color: C.text }}>{p.name}</td>
                  <td className="py-2.5 px-3" style={{ color: C.muted }}>{p.pos}</td>
                  <td className="py-2.5 px-3" style={{ color: C.text }}>{p.apps}</td>
                  <td className="py-2.5 px-3 font-bold" style={{ color: C.good }}>{p.goals}</td>
                  <td className="py-2.5 px-3" style={{ color: C.text }}>{p.assists}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{
                        backgroundColor: p.rating >= 7.6 ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                        color:           p.rating >= 7.6 ? C.good : C.warn,
                      }}>{p.rating}</span>
                  </td>
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
            <div className="flex justify-between"><span className="text-xs" style={{ color: C.muted }}>Available</span><span className="text-xs font-bold" style={{ color: C.good }}>18 ✅</span></div>
            <div className="flex justify-between"><span className="text-xs" style={{ color: C.muted }}>Suspended</span><span className="text-xs font-bold" style={{ color: C.warn }}>1 🟡</span></div>
            <div className="pt-2" style={{ borderTop: `1px solid ${C.border}` }}>
              <p className="text-xs font-bold mb-2" style={{ color: C.bad }}>Injured (3) 🔴</p>
              {[
                { n: 'L. Brennan', inj: 'Hamstring', ret: '2 weeks' },
                { n: 'K. Hwang',   inj: 'Ankle',     ret: '4 weeks' },
                { n: 'T. Adeyemi', inj: 'Illness',   ret: '3 days'  },
              ].map(p => (
                <div key={p.n} className="flex justify-between py-1">
                  <span className="text-xs" style={{ color: C.text }}>{p.n} — {p.inj}</span>
                  <span className="text-[10px]" style={{ color: C.muted }}>{p.ret}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] mt-2" style={{ color: C.text4 }}>Modified-load list (3 players) sits in the Welfare tab — separate concept.</p>
          </div>
        </Card>
        <Card>
          <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Contract Status</p>
          <div className="space-y-3">
            <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p className="text-xs font-bold mb-1" style={{ color: C.bad }}>Expiring Summer 2026 (2 senior)</p>
              <p className="text-[10px]" style={{ color: C.muted }}>S. Reyes (ST) · A. Patel (CM) — renewal talks open, board approval required Jun</p>
            </div>
            <div className="flex justify-between"><span className="text-xs" style={{ color: C.muted }}>Under contract 1yr+</span><span className="text-xs font-bold" style={{ color: C.text }}>14</span></div>
            <div className="flex justify-between"><span className="text-xs" style={{ color: C.muted }}>Under contract 2yr+</span><span className="text-xs font-bold" style={{ color: C.text }}>6</span></div>
          </div>
        </Card>
      </div>

      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Form Guide (Last 5 Appearances)</p>
        <div className="space-y-2">
          {[
            { n: 'S. Reyes',       dots: ['🟢','🟢','🟢','🟡','🟢'], avg: '7.8' },
            { n: 'A. Patel',       dots: ['🟢','🟡','🟢','🟢','🟢'], avg: '7.7' },
            { n: 'N. Achterberg',  dots: ['🟡','🟢','🟢','🟡','🟢'], avg: '7.4' },
            { n: 'J. Okonkwo',     dots: ['🟢','🟢','🟡','🟢','🟢'], avg: '7.5' },
            { n: 'M. Costa',       dots: ['🟢','🟢','🟢','🟡','🟡'], avg: '7.4' },
            { n: 'O. Nakamura',    dots: ['🟡','🟢','🟡','🟢','🟡'], avg: '7.1' },
            { n: 'F. Mireles',     dots: ['🟢','🟡','🟢','🟡','🟢'], avg: '7.3' },
            { n: 'S. Connolly',    dots: ['🟡','🟡','🟢','🟢','🟢'], avg: '7.2' },
          ].map(p => (
            <div key={p.n} className="flex items-center gap-3">
              <span className="text-xs w-24 shrink-0 font-medium" style={{ color: C.text }}>{p.n}</span>
              <div className="flex gap-1">{p.dots.map((d, i) => <span key={i} className="text-sm">{d}</span>)}</div>
              <span className="text-xs font-bold ml-auto" style={{ color: C.pinkSoft }}>{p.avg}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Age Profile</p>
        <div className="flex rounded-full overflow-hidden h-4 mb-3">
          <div style={{ width: '18%', backgroundColor: C.info   }} title="U21" />
          <div style={{ width: '41%', backgroundColor: C.teal   }} title="21-25" />
          <div style={{ width: '32%', backgroundColor: C.pink   }} title="26-29" />
          <div style={{ width:  '9%', backgroundColor: C.bad    }} title="30+" />
        </div>
        <div className="flex gap-4 flex-wrap">
          {[
            { l: 'U21',   v: '4 (18%)', c: C.info },
            { l: '21–25', v: '9 (41%)', c: C.teal },
            { l: '26–29', v: '7 (32%)', c: C.pink },
            { l: '30+',   v: '2 (9%)',  c: C.bad  },
          ].map(a => (
            <div key={a.l} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: a.c }} />
              <span className="text-[10px]" style={{ color: C.muted }}>{a.l}: {a.v}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Academy / Pathway Pipeline</p>
        <table className="w-full text-xs">
          <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
            {['Player', 'Age', 'Pos', 'Status'].map(h => (
              <th key={h} className="text-left py-2 px-3 font-semibold" style={{ color: C.muted }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {[
              { n: 'R. Adesina',    a: 18, p: 'ST', s: 'Training with first team' },
              { n: 'C. McAllister', a: 17, p: 'CM', s: 'U21 captain' },
              { n: 'I. Beckett',    a: 18, p: 'RB', s: 'Loan return Jun 2026' },
              { n: 'N. Holloway',   a: 16, p: 'LW', s: 'Scholarship signed' },
              { n: 'B. Osei',       a: 18, p: 'GK', s: 'First team squad' },
            ].map(p => (
              <tr key={p.n} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td className="py-2 px-3 font-medium" style={{ color: C.text }}>{p.n}</td>
                <td className="py-2 px-3" style={{ color: C.muted }}>{p.a}</td>
                <td className="py-2 px-3" style={{ color: C.muted }}>{p.p}</td>
                <td className="py-2 px-3" style={{ color: C.pinkSoft }}>{p.s}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { l: 'Yellow Cards',     v: '28',  c: C.warn  },
          { l: 'Red Cards',        v: '1',   c: C.bad   },
          { l: 'Suspensions',      v: '2',   c: C.bad   },
          { l: 'Avg Fouls / Game', v: '9.4', c: C.muted },
        ].map(d => (
          <Card key={d.l}>
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.muted }}>{d.l}</p>
            <p className="text-xl font-black mt-1" style={{ color: d.c }}>{d.v}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ─── Facilities Tab ───────────────────────────────────────────────────────────
// East terrace inspection date (7 Jun 2026) and contractor briefing must
// match the Overview Risk Register entry. Stadium capacity (6,500) and
// average attendance (3,050 / 47%) match the Overview attendance card.

function FacilitiesTab() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { name: 'Main Pitch',          status: 'Good',                  icon: '🏟️', ok: true  },
          { name: 'Training Ground',     status: 'Good',                  icon: '⚽', ok: true  },
          { name: 'East Terrace',        status: 'Re-inspection due 7 Jun', icon: '🏗️', ok: false },
          { name: 'Changing Rooms',      status: 'Women’s-spec, refurbished', icon: '🚿', ok: true  },
          { name: 'Floodlights',         status: 'Operational',           icon: '💡', ok: true  },
          { name: 'Medical & Welfare Suite', status: 'Operational',       icon: '🩺', ok: true  },
        ].map(f => (
          <Card key={f.name}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg">{f.icon}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: f.ok ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
                  color:           f.ok ? C.good : C.warn,
                }}>
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
            { date: '7 Jun',  task: 'East terrace safety re-inspection (contractor briefed)' },
            { date: '22 Jun', task: 'Pitch aeration & overseeding' },
            { date: '5 Jul',  task: 'CCTV system upgrade — women’s-only zones included' },
            { date: '1 Aug',  task: 'Pre-season training ground refresh' },
            { date: '15 Aug', task: 'Floodlight PAT testing' },
          ].map((m, i) => (
            <div key={i} className="relative flex items-start gap-4 pb-4">
              <div className="absolute left-[-18px] w-3.5 h-3.5 rounded-full"
                style={{ backgroundColor: i === 0 ? C.pink : C.border, border: `2px solid ${C.card}`, top: 2 }} />
              <div>
                <p className="text-xs font-bold" style={{ color: i === 0 ? C.pinkSoft : C.text }}>{m.date}</p>
                <p className="text-xs" style={{ color: C.muted }}>{m.task}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Stadium Capacity Utilisation</p>
        <div className="space-y-2">
          <div className="flex justify-between"><span className="text-xs" style={{ color: C.muted }}>This season average</span><span className="text-xs font-bold" style={{ color: C.text }}>47% (3,050 / 6,500)</span></div>
          <div className="flex justify-between"><span className="text-xs" style={{ color: C.muted }}>Best attended</span><span className="text-xs font-bold" style={{ color: C.good }}>Derby vs Harfield United — 5,820 (90%)</span></div>
          <div className="flex justify-between"><span className="text-xs" style={{ color: C.muted }}>Lowest</span><span className="text-xs font-bold" style={{ color: C.bad }}>Late-Sunday fixture vs Cliffe Town — 1,860 (29%)</span></div>
        </div>
      </Card>

      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Facility Investment Plan</p>
        <table className="w-full text-xs">
          <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
            {['Project', 'Budget', 'Status', 'Completion'].map(h => (
              <th key={h} className="text-left py-2 px-3 font-semibold" style={{ color: C.muted }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {[
              { p: 'East terrace inspection & repairs',          b: '£35k', s: 'In progress', c: 'Jun 2026', sc: C.warn  },
              { p: 'Training ground drainage',                   b: '£22k', s: 'Approved',    c: 'Jul 2026', sc: C.good  },
              { p: 'CCTV upgrade — women’s-only zones',          b: '£12k', s: 'Tendering',   c: 'Jul 2026', sc: C.warn  },
              { p: 'Pitch resurfacing',                          b: '£45k', s: 'Planned',     c: 'Aug 2026', sc: C.muted },
              { p: 'Club shop refit',                            b: '£18k', s: 'Planned',     c: 'Sep 2026', sc: C.muted },
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

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { l: 'Monthly Energy Cost', v: '£2,400',     c: C.warn },
          { l: 'Solar Savings YTD',   v: '£1,100',     c: C.good },
          { l: 'Pitch Water Usage',   v: '12,500 L/mo',c: C.info },
          { l: 'Carbon Offset',       v: 'On track ✅', c: C.good },
        ].map(e => (
          <Card key={e.l}>
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.muted }}>{e.l}</p>
            <p className="text-lg font-black mt-1" style={{ color: e.c }}>{e.v}</p>
          </Card>
        ))}
      </div>

      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Stadium Timeline</p>
        <div className="space-y-2">
          {[
            { y: '1923',    text: 'Oakridge Stadium opened (men’s side)' },
            { y: '2018',    text: 'Women’s-spec facilities added — dedicated changing, medical room' },
            { y: '2024',    text: 'East terrace refurbishment (re-inspection now due)' },
            { y: 'Now',     text: 'Current capacity: 6,500' },
            { y: 'Pending', text: 'Expand women’s hospitality capacity — board-approved scoping, target 2027/28' },
          ].map(t => (
            <div key={t.y} className="flex items-center gap-3">
              <span className="text-xs font-bold w-16 shrink-0" style={{ color: t.y === 'Pending' ? C.pinkSoft : C.text }}>{t.y}</span>
              <span className="text-xs" style={{ color: C.muted }}>{t.text}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ─── Governance Tab (5 sub-tabs) ──────────────────────────────────────────────
// Compliance / Risk Register / Board Minutes / Conflicts of Interest /
// Policies — preserved per user correction. The Risk Register sub-tab is the
// fuller register; the Overview tab's "Risk Register (board snapshot)" is the
// top-N snapshot of the same data. Risks appearing in both surfaces use
// IDENTICAL wording and IDENTICAL RAG rating. The FSR-breach risk uses the
// locked 72% wage-to-revenue figure and £260k headroom.

type GovSub = 'compliance' | 'risk' | 'minutes' | 'conflicts' | 'policies'

const RISK_FULL_EXTRAS = [
  { risk: 'Squad over-reliance on top scorer (S. Reyes)',            level: 'Medium', color: '#F59E0B', mitigation: 'Renewal priority 1; scouting back-up ST profile' },
  { risk: 'Match-day stewarding capacity at derby fixtures',         level: 'Low',    color: '#22C55E', mitigation: 'Post-Mar-derby review actioned; increased booking for 26/27' },
  { risk: 'GDPR / data subject access response time',                level: 'Low',    color: '#22C55E', mitigation: 'All SARs YTD answered within 14d (vs 30d statutory)' },
  { risk: 'Stadium capacity ceiling vs WSL 1 promotion criteria',    level: 'Low',    color: '#22C55E', mitigation: 'Board-approved hospitality-expansion scoping, target 2027/28' },
  { risk: 'Cycle module opt-in below WSL guidance floor',            level: 'Low',    color: '#22C55E', mitigation: '64% opt-in — voluntary expansion only, player-led' },
] as const

function GovComplianceTab() {
  return (
    <div className="space-y-4">
      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>WSL / FA Licensing</p>
        <div className="space-y-2 text-xs">
          {[
            { item: 'FSR salary cap',            ok: true,  note: 'WTR 72% · £260k headroom' },
            { item: 'Age-band squad minimums',   ok: false, note: '1 player short — interim signing under review' },
            { item: 'Welfare standards (Carney)',ok: true                                 },
            { item: 'First-team registration',   ok: true                                 },
            { item: 'Dual-registration records', ok: true                                 },
            { item: 'Stadium licensing',         ok: false, note: 'east terrace re-inspection 7 Jun' },
            { item: 'Safeguarding (FA mandatory)', ok: true                              },
          ].map((c, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5" style={{ borderBottom: `1px solid ${C.border}` }}>
              <span style={{ color: c.ok ? C.good : C.bad }}>{c.ok ? '✓' : '✗'}</span>
              <span style={{ color: C.text2 }} className="flex-1">{c.item}</span>
              {c.note && <span className="text-[10px]" style={{ color: c.ok ? C.muted : C.warn }}>{c.note}</span>}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <p className="text-sm font-bold mb-3" style={{ color: C.text }}>FSR Status</p>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between"><span style={{ color: C.muted }}>Relevant Revenue (annual)</span><span className="font-bold" style={{ color: C.text }}>£3.25M</span></div>
            <div className="flex justify-between"><span style={{ color: C.muted }}>Wage Bill (annual)</span><span className="font-bold" style={{ color: C.text }}>£2.34M</span></div>
            <div className="flex justify-between"><span style={{ color: C.muted }}>Wage-to-Revenue</span><span className="font-bold" style={{ color: C.warn }}>72%</span></div>
            <div className="flex justify-between"><span style={{ color: C.muted }}>FSR Cap</span><span className="font-bold" style={{ color: C.text }}>80%</span></div>
            <div className="flex justify-between"><span style={{ color: C.muted }}>Headroom</span><span className="font-bold" style={{ color: C.good }}>£260k · SAFE</span></div>
            <div className="flex justify-between pt-2" style={{ borderTop: `1px solid ${C.border}` }}><span style={{ color: C.muted }}>Q1 submission</span><span className="font-bold" style={{ color: C.good }}>Accepted</span></div>
            <div className="flex justify-between"><span style={{ color: C.muted }}>Q2 submission window</span><span className="font-bold" style={{ color: C.text }}>opens 1 Jul 2026</span></div>
          </div>
        </Card>
        <Card>
          <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Karen Carney Standards (recap)</p>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between"><span style={{ color: C.muted }}>Annual return</span><span className="font-bold" style={{ color: C.good }}>Submitted Mar 2026</span></div>
            <div className="flex justify-between"><span style={{ color: C.muted }}>Welfare Lead (perm)</span><span className="font-bold" style={{ color: C.warn }}>Hire in flight</span></div>
            <div className="flex justify-between"><span style={{ color: C.muted }}>Cycle-aware adaptation</span><span className="font-bold" style={{ color: C.good }}>In place</span></div>
            <div className="flex justify-between"><span style={{ color: C.muted }}>Pregnancy / RTP pathway</span><span className="font-bold" style={{ color: C.good }}>In place</span></div>
            <div className="flex justify-between"><span style={{ color: C.muted }}>Mental-health pathway</span><span className="font-bold" style={{ color: C.good }}>In place</span></div>
            <div className="flex justify-between"><span style={{ color: C.muted }}>Transition / retirement</span><span className="font-bold" style={{ color: C.good }}>In place</span></div>
          </div>
          <p className="text-[10px] mt-3" style={{ color: C.text4 }}>Full detail in the Welfare tab and the Karen Carney Compliance doc (Staff → Club Info).</p>
        </Card>
      </div>

      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Data & GDPR</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {[
            { l: 'SARs YTD',           v: '4',         c: C.text },
            { l: 'Avg response time',  v: '14 days',   c: C.good },
            { l: 'Cycle consents revoked YTD', v: '1', c: C.text },
            { l: 'Data steward',       v: 'Welfare Lead', c: C.text },
          ].map(d => (
            <div key={d.l} className="rounded-lg p-3" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: C.muted }}>{d.l}</p>
              <p className="text-sm font-bold mt-0.5" style={{ color: d.c }}>{d.v}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function GovRiskTab() {
  const all = [...RISK_OVERVIEW_SNAPSHOT, ...RISK_FULL_EXTRAS]
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold" style={{ color: C.text }}>Risk Register (full — {all.length} entries)</p>
          <span className="text-[10px]" style={{ color: C.text4 }}>Top-5 snapshot mirrored on the Overview tab</span>
        </div>
        <div className="space-y-2">
          {all.map((r, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg px-4 py-3" style={{ backgroundColor: '#0A0B10', border: `1px solid ${C.border}` }}>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: `${r.color}15`, color: r.color }}>{r.level}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold" style={{ color: C.text }}>{r.risk}</p>
                <p className="text-[10px] mt-0.5" style={{ color: C.muted }}>Mitigation: {r.mitigation}</p>
              </div>
              {i < RISK_OVERVIEW_SNAPSHOT.length && (
                <span className="text-[9px] uppercase tracking-wider shrink-0 mt-1 px-1.5 py-0.5 rounded-full" style={{ color: C.pinkSoft, backgroundColor: C.pinkDim }}>On Overview</span>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>By Severity</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { l: 'High',   v: all.filter(r => r.level === 'High').length,   c: C.bad  },
            { l: 'Medium', v: all.filter(r => r.level === 'Medium').length, c: C.warn },
            { l: 'Low',    v: all.filter(r => r.level === 'Low').length,    c: C.good },
          ].map(s => (
            <div key={s.l} className="rounded-lg p-3" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: C.muted }}>{s.l}</p>
              <p className="text-2xl font-black mt-0.5" style={{ color: s.c }}>{s.v}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function GovMinutesTab() {
  return (
    <div className="space-y-4">
      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Recent Board Meetings</p>
        <div className="space-y-3">
          {[
            { date: '12 Mar 2026', items: ['Approved 25/26 mid-season budget review', 'Cleared FSR Q1 submission', 'Ratified Welfare Lead job description'] },
            { date: '15 Jan 2026', items: ['Endorsed January-window approach (£75k Fowler signing)', 'Reviewed Q4 24/25 financials', 'Carney annual-return scope agreed'] },
            { date: '13 Nov 2025', items: ['Approved 25/26 first-half budget', 'East-terrace inspection scheduling', 'Sponsorship pipeline review'] },
            { date: '11 Sep 2025', items: ['Season opening: confirmed squad budget', 'FSR projections sign-off', 'Reviewed pre-season medical & welfare audit'] },
          ].map((m, i) => (
            <div key={i} className="rounded-lg p-3" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
              <p className="text-xs font-bold mb-1" style={{ color: C.pinkSoft }}>{m.date}</p>
              <ul className="text-[11px] space-y-0.5" style={{ color: C.text2 }}>
                {m.items.map((it, j) => <li key={j}>· {it}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <p className="text-sm font-bold mb-2" style={{ color: C.text }}>Next Meeting</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-black" style={{ color: C.text }}>12 Jun 2026</p>
            <p className="text-xs" style={{ color: C.muted }}>Agenda in drafting · pack due 18 days from now</p>
          </div>
          <span className="text-[10px] px-2 py-1 rounded-full" style={{ color: C.pinkSoft, backgroundColor: C.pinkDim, border: `1px solid ${C.pinkBorder}` }}>Mirrored on Overview banner</span>
        </div>
      </Card>
    </div>
  )
}

function GovConflictsTab() {
  return (
    <div className="space-y-4">
      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Conflicts of Interest Register</p>
        <table className="w-full text-xs">
          <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
            {['Board Member', 'Role', 'Declared Interest', 'Status'].map(h => (
              <th key={h} className="text-left py-2 px-3 font-semibold" style={{ color: C.muted }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {[
              { n: 'M. Latham',  r: 'Chair',            i: 'Director — Latham Partners (no club exposure)', s: 'Declared · no recusal required' },
              { n: 'A. Daley',   r: 'Club Director',    i: 'None',                                          s: 'Nil return' },
              { n: 'P. Sutcliffe', r: 'Treasurer',      i: 'Trustee — Oakridge Community Trust',            s: 'Declared · recusal on community-grant items' },
              { n: 'R. Mensah',  r: 'Welfare Trustee',  i: 'PFA member',                                    s: 'Declared · no recusal required' },
              { n: 'F. Akingbade', r: 'Commercial Lead', i: 'Director — local hospitality firm (not a current sponsor)', s: 'Declared · recusal on hospitality-sponsor items' },
              { n: 'J. Whitmore', r: 'Independent NED', i: 'None',                                          s: 'Nil return' },
            ].map(row => (
              <tr key={row.n} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td className="py-2 px-3 font-medium" style={{ color: C.text }}>{row.n}</td>
                <td className="py-2 px-3" style={{ color: C.muted }}>{row.r}</td>
                <td className="py-2 px-3" style={{ color: C.text2 }}>{row.i}</td>
                <td className="py-2 px-3 text-[11px]" style={{ color: C.pinkSoft }}>{row.s}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[10px] mt-3" style={{ color: C.text4 }}>Register reviewed annually and on appointment of new board members. Last review: Mar 2026.</p>
      </Card>
    </div>
  )
}

function GovPoliciesTab() {
  return (
    <div className="space-y-4">
      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Policy Index</p>
        <p className="text-[11px] mb-3" style={{ color: C.text4 }}>Full policy documents live under Staff → Club Info (illustrative demo placeholders).</p>
        <table className="w-full text-xs">
          <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>
            {['Policy', 'Owner', 'Last reviewed', 'Next review'].map(h => (
              <th key={h} className="text-left py-2 px-3 font-semibold" style={{ color: C.muted }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {[
              { p: 'Staff Code of Conduct',        o: 'Club Director',  l: 'Mar 2026', n: 'Mar 2027' },
              { p: 'Karen Carney compliance',      o: 'Welfare Lead',   l: 'Mar 2026', n: 'Mar 2027' },
              { p: 'FSR submission policy',        o: 'Treasurer',      l: 'Feb 2026', n: 'Aug 2026' },
              { p: 'Cycle-tracking privacy',       o: 'Welfare Lead',   l: 'Jan 2026', n: 'Jan 2027' },
              { p: 'Pregnancy & RTP pathway',      o: 'Club Doctor',    l: 'Jan 2026', n: 'Jan 2027' },
              { p: 'Data protection / GDPR',       o: 'Welfare Lead',   l: 'Oct 2025', n: 'Oct 2026' },
              { p: 'Safeguarding (FA mandatory)',  o: 'Safeguarding Lead', l: 'Sep 2025', n: 'Sep 2026' },
              { p: 'Coaching & CPD',               o: 'Head Coach',     l: 'Aug 2025', n: 'Aug 2026' },
              { p: 'Anti-discrimination',          o: 'Club Director',  l: 'Aug 2025', n: 'Aug 2026' },
            ].map(row => (
              <tr key={row.p} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td className="py-2 px-3 font-medium" style={{ color: C.text }}>{row.p}</td>
                <td className="py-2 px-3" style={{ color: C.muted }}>{row.o}</td>
                <td className="py-2 px-3" style={{ color: C.text2 }}>{row.l}</td>
                <td className="py-2 px-3" style={{ color: C.text2 }}>{row.n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

function GovernanceTab() {
  const [sub, setSub] = useState<GovSub>('compliance')
  const subs: { id: GovSub; label: string }[] = [
    { id: 'compliance', label: 'Compliance' },
    { id: 'risk',       label: 'Risk Register' },
    { id: 'minutes',    label: 'Board Minutes' },
    { id: 'conflicts',  label: 'Conflicts of Interest' },
    { id: 'policies',   label: 'Policies' },
  ]
  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {subs.map(s => (
          <button key={s.id} onClick={() => setSub(s.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{
              backgroundColor: sub === s.id ? C.pinkDim : C.cardAlt,
              color:           sub === s.id ? C.pinkSoft : C.muted,
              border: `1px solid ${sub === s.id ? C.pinkBorder : C.border}`,
            }}>
            {s.label}
          </button>
        ))}
      </div>
      {sub === 'compliance' && <GovComplianceTab />}
      {sub === 'risk'       && <GovRiskTab />}
      {sub === 'minutes'    && <GovMinutesTab />}
      {sub === 'conflicts'  && <GovConflictsTab />}
      {sub === 'policies'   && <GovPoliciesTab />}
    </div>
  )
}

// ─── Stub tabs (filled in subsequent commits) ─────────────────────────────────

function StubTab({ label, nextCommit }: { label: string; nextCommit: string }) {
  return (
    <Card>
      <p className="text-sm font-bold mb-2" style={{ color: C.text }}>{label}</p>
      <p className="text-xs" style={{ color: C.muted }}>Tab content ships in the next commit ({nextCommit}). Scaffolding and tab nav are in place.</p>
    </Card>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function WomensBoardSuiteView({ club, onNavigate }: { club: WomensClub; onNavigate?: (id: string) => void }) {
  const [tab, setTab] = useState<Tab>('overview')

  return (
    <div className="space-y-5">
      {/* Board-meeting banner */}
      <div className="rounded-xl p-4 flex items-center justify-between"
        style={{ backgroundColor: C.pinkDim, border: `1px solid ${C.pinkBorder}` }}>
        <div>
          <div className="text-sm font-medium" style={{ color: C.pinkSoft }}>Next board meeting: 12 Jun 2026</div>
          <div className="text-xs" style={{ color: C.muted }}>Pack due in 18 days</div>
        </div>
        <button disabled
          className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-not-allowed"
          style={{ backgroundColor: '#1A1F2E', color: C.text4, border: `1px solid ${C.border}` }}>
          Generate Pack — Phase 2
        </button>
      </div>

      {/* KPI Bar — 5 cards at WSL 2 scale, 72% wage-to-revenue narrative */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        <KPI icon={Trophy}        label="League Position"   value="5th"        trend="↑1"      trendUp />
        <KPI icon={Crown}         label="Points"            value="34"         trend="+4"      trendUp />
        <KPI icon={Users}         label="Squad Size"        value="22"         trend="↑1"      trendUp />
        <KPI icon={DollarSign}    label="Relevant Revenue"  value="£3.25M"     trend="+14%"    trendUp />
        <KPI icon={TrendingDown}  label="Wage-to-Revenue"   value="72%"        trend="+2pp"    trendUp={false} />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {([
          { id: 'overview'   as Tab, label: 'Overview' },
          { id: 'profile'    as Tab, label: 'Profile' },
          { id: 'finance'    as Tab, label: 'Finance' },
          { id: 'welfare'    as Tab, label: 'Welfare' },
          { id: 'squad'      as Tab, label: 'Squad & Performance' },
          { id: 'governance' as Tab, label: 'Governance' },
          { id: 'facilities' as Tab, label: 'Facilities' },
        ]).map(t => <TabBtn key={t.id} active={tab === t.id} label={t.label} onClick={() => setTab(t.id)} />)}
      </div>

      {/* Content */}
      {tab === 'overview'   && <OverviewTab />}
      {tab === 'profile'    && <ProfileTab club={club} />}
      {tab === 'finance'    && <FinanceTab />}
      {tab === 'welfare'    && <WelfareTab onNavigate={onNavigate} />}
      {tab === 'squad'      && <SquadTab />}
      {tab === 'governance' && <GovernanceTab />}
      {tab === 'facilities' && <FacilitiesTab />}
    </div>
  )
}
