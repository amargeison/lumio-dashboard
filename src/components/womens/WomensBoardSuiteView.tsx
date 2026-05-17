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
  Crown, TrendingDown, Users, DollarSign, Trophy,
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

      {/* Risk Register — board-level snapshot, FSR-framed */}
      <Card>
        <p className="text-sm font-bold mb-3" style={{ color: C.text }}>Risk Register (board snapshot)</p>
        <div className="space-y-2">
          {[
            { risk: 'FSR breach if wage bill exceeds 80% cap',                level: 'Medium', color: C.warn, mitigation: 'Currently 72% (£260k headroom) — monthly CFO review' },
            { risk: 'Two senior player contracts expire summer 2026',          level: 'High',   color: C.bad,  mitigation: 'Renewal talks open — board approval required Jun' },
            { risk: 'Welfare Lead post unfilled — interim cover only',         level: 'High',   color: C.bad,  mitigation: 'Shortlist of 3, final interviews w/c 26 May' },
            { risk: 'East terrace safety re-inspection due',                   level: 'Medium', color: C.warn, mitigation: 'Inspection booked 7 Jun, contractor briefed' },
            { risk: 'Sponsorship pipeline thinner than budget for 26/27',      level: 'Medium', color: C.warn, mitigation: 'Commercial Lead opening 4 new conversations Q2' },
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

export default function WomensBoardSuiteView({ club }: { club: WomensClub }) {
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
      {tab === 'finance'    && <StubTab label="Finance"            nextCommit="C2 of 5" />}
      {tab === 'welfare'    && <StubTab label="Welfare (board lens)" nextCommit="C3 of 5" />}
      {tab === 'squad'      && <StubTab label="Squad & Performance" nextCommit="C4 of 5" />}
      {tab === 'governance' && <StubTab label="Governance"          nextCommit="C5 of 5" />}
      {tab === 'facilities' && <StubTab label="Facilities"          nextCommit="C4 of 5" />}
    </div>
  )
}
