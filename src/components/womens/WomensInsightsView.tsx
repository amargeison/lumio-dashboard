'use client'

// Women's Insights — extracted from the inline InsightsView in
// src/app/womens/[slug]/page.tsx. Port-by-copying pattern (no Pro/shared
// files modified). Built across 6 commits: this commit (C1) is the
// scaffolding + extraction + figure lock + shared strip + RBAC id
// alignment; dense per-role builds follow in C2-C6.
//
// Tab order is the GROUPED order — Performance / Welfare / Medical are
// adjacent in the rail to make the confidentiality boundary visible.
//
// Locked Board Suite figures used throughout:
//   • Relevant revenue (annual)     £3.25M
//   • Wage-to-revenue                72%
//   • FSR headroom (vs 80% cap)      £260k
//   • Squad size                     22
//   • Open welfare flags (aggregate) 4
//   • Avg attendance                 3,050 / 6,500 (47%)
//   • Next board meeting             12 Jun 2026
//
// Confidentiality (locked model — see §4 of the proposal):
//   • Welfare Lead — aggregate / pathway-stage / opt-in posture only.
//     No per-player cycle phase, no per-player ACL composite, no clinical.
//   • Head of Medical — clinical detail (injuries, ACL composite, RTP,
//     screening, GPS load + injury risk, cycle phase as load context).
//     No mental-health clinical content.
//   • Head of Performance — physical / load data only. No clinical
//     diagnosis, no injury detail. Sits alongside Medical without
//     duplicating it.
//   • Head Coach — selection availability flags only. No cycle phase,
//     no ACL composite, no clinical reasons for unavailability.

import { useState } from 'react'
import { RISK_OVERVIEW_SNAPSHOT } from '@/data/womens/board-risks'

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

// ─── Helpers — ported from page.tsx (port-by-copying pattern) ─────────────────

const StatCard = ({ label, value, sub, color = 'pink' }: { label: string; value: string | number; sub?: string; color?: string }) => {
  const colorMap: Record<string, string> = {
    pink:   'from-pink-600/20 to-pink-900/10 border-pink-600/20',
    teal:   'from-teal-600/20 to-teal-900/10 border-teal-600/20',
    green:  'from-green-600/20 to-green-900/10 border-green-600/20',
    red:    'from-red-600/20 to-red-900/10 border-red-600/20',
    amber:  'from-amber-600/20 to-amber-900/10 border-amber-600/20',
    blue:   'from-blue-600/20 to-blue-900/10 border-blue-600/20',
    purple: 'from-purple-600/20 to-purple-900/10 border-purple-600/20',
  }
  return (
    <div className={`bg-gradient-to-br ${colorMap[color] || colorMap.pink} border rounded-xl p-4`}>
      <div className="text-2xl font-bold text-white mb-0.5">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  )
}

const SectionHeader = ({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: string }) => (
  <div className="mb-6">
    <div className="flex items-center gap-2">
      {icon && <span className="text-xl">{icon}</span>}
      <h2 className="text-xl font-bold text-white">{title}</h2>
    </div>
    {subtitle && <p className="text-sm text-gray-400 mt-1 ml-7">{subtitle}</p>}
  </div>
)

const ICard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-[#0D1117] border border-gray-800 rounded-xl p-5 ${className}`}>{children}</div>
)
const IH3 = ({ children }: { children: React.ReactNode }) => <h3 className="text-sm font-bold text-white mb-3">{children}</h3>
const thd = 'text-gray-500 text-xs border-b border-gray-800 bg-gray-900/30'
const ttd = 'p-3 text-gray-400 text-xs'

// ─── Confidentiality footnote — used on welfare / medical / performance ──────

const VisibilityNote = ({ role }: { role: 'welfare' | 'medical' | 'performance' }) => {
  const lines: Record<typeof role, string> = {
    welfare:     'Welfare Lead lens — aggregate / pathway-stage / opt-in posture only. Per-player cycle phase, ACL composite scores and clinical detail sit with the Club Doctor.',
    medical:     'Head of Medical lens — clinical detail (injuries, ACL composite, RTP phase, screening, GPS load as injury-risk context). Mental-health clinical content is separately consented and does not appear here.',
    performance: 'Head of Performance lens — physical / load data only (GPS, training load, fitness). Clinical diagnosis and injury detail sit with the Club Doctor on the Head of Medical tab.',
  }
  return (
    <div className="rounded-lg px-3 py-2 mb-4 text-[10px]" style={{ backgroundColor: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.25)', color: '#F472B6' }}>
      <span className="font-bold">Visibility scope:</span> {lines[role]}
    </div>
  )
}

// ─── Roles — 10 tabs in the GROUPED order ────────────────────────────────────

const ROLES = [
  { id: 'ceo',         label: 'CEO / Chairman',         icon: '🏛️' },
  { id: 'dof',         label: 'Director of Football',   icon: '📋' },
  { id: 'coach',       label: 'Head Coach',             icon: '🎽' },
  { id: 'performance', label: 'Head of Performance',    icon: '📊' },
  { id: 'welfare',     label: 'Welfare Lead',           icon: '❤️' },
  { id: 'medical',     label: 'Head of Medical',        icon: '🏥' },
  { id: 'academy',     label: 'Academy Director',       icon: '🎓' },
  { id: 'commercial',  label: 'Commercial Director',    icon: '💼' },
  { id: 'operations',  label: 'Head of Operations',     icon: '🛠️' },
  { id: 'media',       label: 'Media & Comms',          icon: '📣' },
] as const

type RoleId = typeof ROLES[number]['id']

// Map an RBAC session role to an Insights tab id. RBAC ids now match Insights
// ids directly for ceo / dof / coach / performance / welfare / medical /
// operations / commercial (no fall-through bug). RBAC `community` defaults to
// the Media & Comms tab.
function mapRBACtoTab(rbac: string | undefined): RoleId {
  if (!rbac) return 'ceo'
  if (rbac === 'community') return 'media'
  const match = ROLES.find(r => r.id === rbac)
  return match ? match.id : 'ceo'
}

// ─── Shared common strip — renders under every role tab ──────────────────────
// Always-on context that every stakeholder cares about. Aggregate only —
// per-player cycle / ACL / injury / mental-health detail stays gated to
// role tabs and never appears here.

function SharedCommonStrip() {
  const formLast5 = ['W', 'D', 'W', 'L', 'W']
  const formColor: Record<string, string> = { W: '#22C55E', D: '#F59E0B', L: '#EF4444' }

  return (
    <div className="mt-8 pt-6 space-y-4" style={{ borderTop: '2px solid #1F2937' }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-md" style={{ color: '#F472B6', backgroundColor: 'rgba(236,72,153,0.10)', border: '1px solid rgba(236,72,153,0.25)' }}>Club Context</span>
        <span className="text-xs text-gray-500">Shared across every role — aggregate figures only.</span>
      </div>

      {/* Section 1 — Club status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="League Position" value="5th" sub="WSL 2" color="pink" />
        <StatCard label="Points" value="34" sub="↑1 vs same point last season" color="green" />
        {/* Form tile rendered inline — StatCard takes string|number values. */}
        <div className="bg-gradient-to-br from-teal-600/20 to-teal-900/10 border border-teal-600/20 rounded-xl p-4">
          <div className="flex gap-1 mb-1">
            {formLast5.map((r, i) => (
              <span key={i} className="inline-flex items-center justify-center text-[10px] font-black" style={{ width: 22, height: 22, borderRadius: 4, backgroundColor: `${formColor[r]}25`, color: formColor[r] }}>{r}</span>
            ))}
          </div>
          <div className="text-sm text-gray-400">Form (Last 5)</div>
          <div className="text-xs text-gray-500 mt-1">3W 1D 1L</div>
        </div>
        <StatCard label="Next Match" value="Sun 24 May" sub="vs Harfield United Women (H)" color="blue" />
      </div>

      {/* Section 2 — Financial posture (locked figures) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Relevant Revenue (YTD)" value="£2.41M" sub="vs £3.25M annual" color="pink" />
        <StatCard label="Wage-to-Revenue" value="72%" sub="FSR cap: 80%" color="amber" />
        <StatCard label="FSR Headroom" value="£260k" sub="Before cap breach" color="green" />
        <StatCard label="Net Position (YTD)" value="+£230k" sub="On budget" color="green" />
      </div>

      {/* Section 3 — Engagement */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard label="Avg Attendance" value="3,050 / 6,500" sub="47% utilisation" color="teal" />
        <StatCard label="Season Tickets" value="1,420" sub="vs 1,180 last season" color="green" />
        <StatCard label="Social Following" value="42.8k" sub="+18% this season" color="pink" />
      </div>

      {/* Section 4 — Standards posture */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard label="Karen Carney Score" value="91/100" sub="2 criteria outstanding" color="pink" />
        <StatCard label="WSL / FA Licensing" value="PASS" sub="2 open items (age-band · east terrace)" color="amber" />
        <StatCard label="Open Welfare Flags" value="4" sub="2 amber · 2 yellow · 0 red — detail on Welfare tab" color="amber" />
      </div>

      {/* Section 5 — Board context */}
      <ICard>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#6B7280' }}>Next Board Meeting</p>
            <p className="text-lg font-black text-white mt-0.5">12 Jun 2026</p>
            <p className="text-xs text-gray-500">in 25 days · pack due 18 days from now</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: '#6B7280' }}>Board Action Items</p>
            <p className="text-lg font-black" style={{ color: '#F59E0B' }}>4 open</p>
            <p className="text-xs text-gray-500">Full register on CEO/Chairman tab</p>
          </div>
        </div>
      </ICard>
    </div>
  )
}

// ─── Per-role content — ported from inline InsightsView with locked figures ──
// Density per tab grows in C2-C6; this commit preserves the existing per-tab
// content shape with re-anchored numbers and Performance / Operations stubs.

function CEOContent() {
  return (
    <div className="space-y-6">
      <SectionHeader title="CEO / Chairman View" subtitle="Financial performance, FSR compliance, strategic plan, governance and stakeholder context" icon="🏛️" />

      {/* 6-tile executive KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="League Position" value="5th" sub="WSL 2 · 34 pts" color="pink" />
        <StatCard label="EOY Surplus (projected)" value="+£185k" sub="Net of operating costs" color="green" />
        <StatCard label="FSR Status" value="SAFE" sub="72% WTR · £260k headroom" color="green" />
        <StatCard label="3-Yr Revenue Target" value="£4.2M" sub="By 2027/28" color="blue" />
        <StatCard label="Karen Carney" value="91/100" sub="2 criteria outstanding" color="pink" />
        <StatCard label="Avg Attendance" value="3,050" sub="47% of 6,500 capacity" color="teal" />
      </div>

      {/* Annual Financial Summary */}
      <ICard><IH3>Financial Summary (annual, projected)</IH3><table className="w-full text-sm"><thead><tr className={thd}><th className="text-left p-3">Category</th><th className="text-left p-3">Budget</th><th className="text-left p-3">Actual / Projected</th><th className="text-left p-3">Variance</th></tr></thead><tbody>{[
        { c: 'Relevant Revenue', b: '£3.35M', a: '£3.25M', v: '−£100k',  vc: 'amber' },
        { c: 'Wage Bill',        b: '£2.34M', a: '£2.34M', v: 'On budget', vc: 'green' },
        { c: 'Operations',       b: '£350k',  a: '£366k',  v: '−£16k',   vc: 'amber' },
        { c: 'Academy',          b: '£210k',  a: '£204k',  v: '+£6k',    vc: 'green' },
        { c: 'Net Position',     b: '—',      a: '+£185k', v: 'On budget', vc: 'green' },
      ].map((r, i) => <tr key={i} className="border-b border-gray-800/50"><td className="p-3 text-gray-200 font-medium">{r.c}</td><td className={ttd}>{r.b}</td><td className={ttd}>{r.a}</td><td className="p-3"><span className={`text-xs font-bold ${r.vc === 'green' ? 'text-green-400' : 'text-amber-400'}`}>{r.v}</span></td></tr>)}</tbody></table></ICard>

      {/* Quarterly P&L — explains the +£185k EOY landing through the year */}
      <ICard><IH3>P&amp;L by Quarter</IH3>
        <p className="text-[10px] mb-3 text-gray-500">YTD net +£230k after Q3 (current); Q4 forecast modest negative as summer commercial revenue lags pre-season costs.</p>
        <table className="w-full text-sm"><thead><tr className={thd}>
          <th className="text-left p-3">Quarter</th>
          <th className="text-left p-3">Revenue</th>
          <th className="text-left p-3">Costs</th>
          <th className="text-left p-3">Net</th>
        </tr></thead><tbody>{[
          { q: 'Q1 25/26 (Sep–Nov)',           r: '£820k',   c: '£780k',   n: '+£40k',  ok: true  },
          { q: 'Q2 25/26 (Dec–Feb)',           r: '£620k',   c: '£640k',   n: '−£20k',  ok: false },
          { q: 'Q3 25/26 (Mar–May, current)',  r: '£970k',   c: '£760k',   n: '+£210k', ok: true  },
          { q: 'Q4 25/26 (Jun–Aug, fcst)',     r: '£840k',   c: '£885k',   n: '−£45k',  ok: false },
          { q: 'EOY total (projected)',         r: '£3.25M',  c: '£3.07M',  n: '+£185k', ok: true  },
        ].map((r, i) => <tr key={i} className="border-b border-gray-800/50"><td className="p-3 text-gray-200">{r.q}</td><td className={ttd}>{r.r}</td><td className={ttd}>{r.c}</td><td className="p-3"><span className={`text-xs font-bold ${r.ok ? 'text-green-400' : 'text-amber-400'}`}>{r.n}</span></td></tr>)}</tbody></table>
      </ICard>

      {/* FSR posture with the locked quarterly trend (matches Board Suite Finance tracker) */}
      <ICard><IH3>FSR Posture</IH3>
        <p className="text-[10px] mb-3 text-gray-500">Current wage-to-revenue 72% — within the 80% FSR cap. Quarterly trend matches the Board Suite Finance tracker (single source of truth on numbers).</p>
        <div className="flex items-center gap-2 mb-4">{[
          { q: 'Q4 24/25',         v: 70 },
          { q: 'Q1 25/26',         v: 74 },
          { q: 'Q2 25/26 (curr)',  v: 72 },
        ].map(q => <div key={q.q} className="flex-1 text-center">
          <div className="h-2 rounded-full mb-1 bg-gray-800"><div className="h-full rounded-full" style={{ width: `${q.v}%`, backgroundColor: q.v >= 78 ? '#EF4444' : q.v >= 70 ? '#F59E0B' : '#22C55E' }} /></div>
          <span className="text-[10px] font-bold text-gray-400">{q.q}: {q.v}%</span>
        </div>)}</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div><span className="text-gray-500">Wage Bill</span><div className="font-bold text-white">£2.34M</div></div>
          <div><span className="text-gray-500">Cap (80%)</span><div className="font-bold text-white">£2.60M</div></div>
          <div><span className="text-gray-500">Headroom</span><div className="font-bold text-green-400">£260k</div></div>
          <div><span className="text-gray-500">Next submission</span><div className="font-bold text-white">Q2, opens 1 Jul</div></div>
        </div>
      </ICard>

      {/* Strategic KPIs — 3-Year Plan, expanded to 5 lines */}
      <ICard><IH3>Strategic KPIs — 3-Year Plan (2025–2028)</IH3><div className="space-y-3">{[
        { l: 'Revenue growth to £4.2M',              v: 77,  c: '£3.25M of £4.2M'        },
        { l: 'Avg attendance to 4,500',              v: 68,  c: '3,050 of 4,500'          },
        { l: 'Standalone revenue % to 45%',          v: 69,  c: '31% of 45%'              },
        { l: 'WSL 2 top-half finish (current year)', v: 100, c: '5th — On track'          },
        { l: 'Karen Carney 95+',                     v: 96,  c: '91/100 of 95'            },
      ].map(k => <div key={k.l}><div className="flex justify-between text-xs mb-1"><span className="text-gray-400">{k.l}</span><span className="text-gray-300">{k.c} ({k.v}%)</span></div><div className="h-2 bg-gray-800 rounded-full"><div className="h-2 rounded-full bg-pink-500" style={{ width: `${k.v}%` }} /></div></div>)}</div></ICard>

      {/* 3-Year horizon model */}
      <ICard><IH3>3-Year Horizon Model</IH3>
        <p className="text-[10px] mb-3 text-gray-500">Projections — board-approved working scenario. Updated quarterly against actuals.</p>
        <table className="w-full text-sm"><thead><tr className={thd}>
          <th className="text-left p-3">Year</th>
          <th className="text-left p-3">Revenue</th>
          <th className="text-left p-3">Wage Bill</th>
          <th className="text-left p-3">WTR</th>
          <th className="text-left p-3">Attendance</th>
          <th className="text-left p-3">League</th>
        </tr></thead><tbody>{[
          { y: '2025/26 (current)', rev: '£3.25M', w: '£2.34M', wtr: '72%', a: '3,050', lg: '5th WSL 2', curr: true  },
          { y: '2026/27 (proj)',     rev: '£3.55M', w: '£2.55M', wtr: '72%', a: '3,400', lg: 'Top 4 WSL 2',  curr: false },
          { y: '2027/28 (proj)',     rev: '£4.20M', w: '£3.00M', wtr: '71%', a: '4,500', lg: 'Promotion push', curr: false },
        ].map((r, i) => <tr key={i} className="border-b border-gray-800/50"><td className={`p-3 ${r.curr ? 'text-pink-400 font-bold' : 'text-gray-300'}`}>{r.y}</td><td className={ttd}>{r.rev}</td><td className={ttd}>{r.w}</td><td className={ttd}>{r.wtr}</td><td className={ttd}>{r.a}</td><td className={ttd}>{r.lg}</td></tr>)}</tbody></table>
      </ICard>

      {/* Karen Carney standards — outstanding criteria detail */}
      <ICard><IH3>Karen Carney Standards — Outstanding Criteria</IH3>
        <div className="space-y-2">{[
          { t: 'Independent Welfare Lead in post — interim cover only; permanent hire shortlist of 3, final interviews w/c 26 May, start 1 Jul 2026.', c: 'amber' },
          { t: 'Annual welfare audit completed — scoped, scheduled for June 2026 to align with Q2 FSR submission window.',                            c: 'amber' },
        ].map((c, i) => <div key={i} className={`p-3 border rounded-lg text-xs text-gray-300 ${c.c === 'amber' ? 'border-amber-600/30 bg-amber-900/10' : 'border-red-600/30 bg-red-900/10'}`}>{c.t}</div>)}</div>
      </ICard>

      {/* Risk Register — shared snapshot */}
      <ICard><IH3>Risk Register (board snapshot)</IH3><p className="text-[10px] mb-3 text-gray-500">Shared with Board Suite Overview — single source of truth (src/data/womens/board-risks.ts). Full register on Board Suite → Governance → Risk Register.</p><div className="space-y-2">{RISK_OVERVIEW_SNAPSHOT.map((r, i) => (
        <div key={i} className="flex items-start gap-3 rounded-lg px-4 py-3" style={{ backgroundColor: '#0a0c14', border: '1px solid #1F2937' }}>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: `${r.color}15`, color: r.color }}>{r.level}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white">{r.risk}</p>
            <p className="text-[10px] mt-0.5 text-gray-400">Mitigation: {r.mitigation}</p>
          </div>
        </div>
      ))}</div></ICard>

      {/* Board Action Queue — mirrors Board Suite Overview action items */}
      <ICard><IH3>Board Action Queue</IH3>
        <p className="text-[10px] mb-3 text-gray-500">Mirrors Board Suite Overview. 4 open · 1 done.</p>
        <div className="space-y-2">{[
          { icon: '📋', t: 'Board meeting: 12 Jun — agenda being drafted by Club Director',                       c: 'amber' },
          { icon: '🩺', t: 'Welfare Lead recruitment: shortlist of 3 — final interviews scheduled w/c 26 May',     c: 'amber' },
          { icon: '💷', t: 'FSR Q2 submission window opens 1 Jul — supporting evidence pack 80% complete',         c: 'amber' },
          { icon: '🏟️', t: 'East terrace safety inspection booked: 7 Jun',                                          c: 'amber' },
          { icon: '✅', t: 'Karen Carney self-assessment annual return — submitted Mar 2026',                      c: 'done'  },
        ].map((a, i) => <div key={i} className={`flex items-center gap-3 p-3 border rounded-lg text-xs ${a.c === 'done' ? 'border-green-600/20 bg-green-900/10 text-gray-500 line-through' : 'border-amber-600/30 bg-amber-900/10 text-gray-300'}`}><span>{a.icon}</span><span>{a.t}</span></div>)}</div>
      </ICard>

      {/* Recent Highlights digest — commercial, press, community */}
      <ICard><IH3>Recent Highlights — Last 30 days</IH3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-lg p-3" style={{ backgroundColor: '#0a0c14', border: '1px solid #1F2937' }}>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-pink-400 mb-2">💼 Commercial</p>
            <ul className="text-[11px] text-gray-300 space-y-1">
              <li>· NovaTech UK sleeve renewal signed (£40k/yr through Dec 2026)</li>
              <li>· Lumio Cycle partnership scoping with two prospective sponsors</li>
              <li>· Hospitality utilisation up 9% YoY for the Harfield derby</li>
            </ul>
          </div>
          <div className="rounded-lg p-3" style={{ backgroundColor: '#0a0c14', border: '1px solid #1F2937' }}>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-blue-400 mb-2">📰 Press</p>
            <ul className="text-[11px] text-gray-300 space-y-1">
              <li>· Crown Broadcasting feature pitch confirmed (welfare-tech focus)</li>
              <li>· The Chronicle interview with Sarah Frost scheduled 30 May</li>
              <li>· Northbridge Sport matchday access secured for 24 May fixture</li>
            </ul>
          </div>
          <div className="rounded-lg p-3" style={{ backgroundColor: '#0a0c14', border: '1px solid #1F2937' }}>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-green-400 mb-2">🌍 Community</p>
            <ul className="text-[11px] text-gray-300 space-y-1">
              <li>· Oakridge Council co-funded girls&apos; football days — 4 schools reached</li>
              <li>· Fan Hub membership crossed 1,200 (+18% this quarter)</li>
              <li>· Player visits programme: 6 visits delivered, 4 scheduled</li>
            </ul>
          </div>
        </div>
      </ICard>
    </div>
  )
}

function DoFContent() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Director of Football View" subtitle="Squad strategy, FSR headroom, transfers, dual-registration, scouting pipeline" icon="📋" />

      {/* 6-tile KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="FSR Headroom" value="£260k" sub="Before 80% cap breach" color="green" />
        <StatCard label="Contract Expiries" value="2" sub="Senior, summer 2026" color="amber" />
        <StatCard label="Transfer Window" value="Opens 1 Jun" sub="Summer window" color="blue" />
        <StatCard label="Squad Size" value="22" sub="WSL 2 registered" color="pink" />
        <StatCard label="Squad Age (avg)" value="24.4" sub="Median 24" color="teal" />
        <StatCard label="Dual-Reg Active" value="3" sub="With Tier-3 sides" color="purple" />
      </div>

      {/* Squad Overview triple-bar — quick snapshot of fitness / contracts / age */}
      <ICard>
        <IH3>Squad Overview (22 players)</IH3>
        <div className="space-y-3">{[
          { label: 'Fitness',   values: [{ l: 'Fit',         v: 18, c: '#22C55E' }, { l: 'Injured',     v:  3, c: '#EF4444' }, { l: 'Suspended', v: 1, c: '#F59E0B' }] },
          { label: 'Contracts', values: [{ l: 'Expiring',    v:  2, c: '#EF4444' }, { l: 'Negotiating', v:  4, c: '#F59E0B' }, { l: 'Secure',    v: 16, c: '#22C55E' }] },
          { label: 'Age',       values: [{ l: 'U21',         v:  4, c: '#3B82F6' }, { l: '21–25',       v:  9, c: '#0D9488' }, { l: '26–29',     v:  7, c: '#8B5CF6' }, { l: '30+',  v: 2, c: '#6B7280' }] },
        ].map(row => (
          <div key={row.label}>
            <p className="text-xs mb-1 text-gray-500">{row.label}</p>
            <div className="flex h-4 rounded-full overflow-hidden bg-gray-800">
              {row.values.map(v => <div key={v.l} style={{ width: `${(v.v / 22) * 100}%`, backgroundColor: v.c }} title={`${v.l}: ${v.v}`} />)}
            </div>
            <div className="flex flex-wrap gap-3 mt-1">{row.values.map(v => <span key={v.l} className="text-[10px]" style={{ color: v.c }}>{v.l}: {v.v}</span>)}</div>
          </div>
        ))}</div>
      </ICard>

      {/* FSR Headroom Tracker with quarterly trend */}
      <ICard>
        <IH3>FSR Headroom Tracker</IH3>
        <div className="flex justify-between text-xs mb-2"><span className="text-gray-400">£2.34M spent</span><span className="text-gray-400">£2.60M cap (80%)</span></div>
        <div className="h-4 bg-gray-800 rounded-full overflow-hidden mb-2"><div className="h-full rounded-full bg-pink-500" style={{ width: '90%' }} /></div>
        <div className="text-xs text-teal-400 mb-4">Headroom: £260k · current quarter 72%</div>
        <p className="text-[10px] mb-2 text-gray-500">Quarterly trend (matches Board Suite Finance &amp; CEO tabs):</p>
        <div className="flex items-center gap-2 mb-4">{[
          { q: 'Q4 24/25',        v: 70 },
          { q: 'Q1 25/26',        v: 74 },
          { q: 'Q2 25/26 (curr)', v: 72 },
        ].map(q => <div key={q.q} className="flex-1 text-center">
          <div className="h-2 rounded-full mb-1 bg-gray-800"><div className="h-full rounded-full" style={{ width: `${q.v}%`, backgroundColor: q.v >= 78 ? '#EF4444' : q.v >= 70 ? '#F59E0B' : '#22C55E' }} /></div>
          <span className="text-[10px] font-bold text-gray-400">{q.q}: {q.v}%</span>
        </div>)}</div>
      </ICard>

      {/* Proposed signings + departures impact on FSR headroom */}
      <ICard>
        <IH3>Proposed Signings &amp; Departures — FSR Impact</IH3>
        <p className="text-[10px] mb-3 text-gray-500">Running headroom after each move. Departures free space; signings consume it.</p>
        <div className="space-y-2">{[
          { t: '↑ Signing  · LB — K. Holm (Northern Lights FC, Tier 3)',         s: '−£42k',  h: '£218k', c: 'green' },
          { t: '↑ Signing  · FW — M. Sandhu (Riverside Athletic Women, Tier 3)', s: '−£68k',  h: '£150k', c: 'green' },
          { t: '↑ Signing  · CM — L. Tanaka (overseas senior side)',              s: '−£90k',  h: '£60k',  c: 'amber' },
          { t: '↓ Departure · GK — backup keeper out of contract (no renewal)',   s: '+£28k',  h: '£88k',  c: 'green' },
          { t: '↓ Departure · MID — placeholder loan-back',                       s: '+£18k',  h: '£106k', c: 'green' },
        ].map((r, i) => <div key={i} className="flex items-center justify-between p-3 bg-[#0a0c14] border border-gray-800 rounded-lg"><div className="text-xs text-gray-200">{r.t}</div><div className="flex items-center gap-4 text-xs"><span className="text-gray-500">{r.s}</span><span className={`font-bold ${r.c === 'green' ? 'text-green-400' : 'text-amber-400'}`}>→ {r.h}</span></div></div>)}</div>
      </ICard>

      {/* Contract Expiry Pipeline — 2 senior matching Board Suite Risk Register */}
      <ICard>
        <IH3>Contract Expiry Pipeline</IH3>
        <p className="text-[10px] mb-3 text-gray-500">Matches Board Suite Risk Register: "Two senior player contracts expire summer 2026" (S. Reyes, A. Patel). Plus the U21 and rolling-renewal context.</p>
        <table className="w-full text-sm"><thead><tr className={thd}><th className="text-left p-3">Player</th><th className="text-left p-3">Pos</th><th className="text-left p-3">Ends</th><th className="text-left p-3">Value</th><th className="text-left p-3">Action</th></tr></thead><tbody>{[
          { n: 'S. Reyes',         p: 'ST',  e: 'Jun 2026', v: '£68k/yr', a: 'Renewal priority 1 — top scorer'           },
          { n: 'A. Patel',         p: 'CM',  e: 'Jun 2026', v: '£55k/yr', a: 'Renewal talks open — board approval Jun'   },
          { n: 'N. Achterberg',    p: 'LW',  e: 'Jun 2027', v: '£44k/yr', a: '12-month rolling — monitor'                 },
          { n: 'J. Okonkwo',       p: 'CB',  e: 'Jun 2027', v: '£42k/yr', a: 'Negotiating extension'                      },
          { n: "Niamh O'Brien",    p: 'CB',  e: 'Aug 2026', v: 'Scholarship', a: 'Pro contract offer drafted (U18 → U21)' },
        ].map((r, i) => <tr key={i} className="border-b border-gray-800/50"><td className="p-3 text-gray-200">{r.n}</td><td className={ttd}>{r.p}</td><td className={ttd}>{r.e}</td><td className={ttd}>{r.v}</td><td className="p-3 text-xs text-pink-400">{r.a}</td></tr>)}</tbody></table>
      </ICard>

      {/* Squad depth by position */}
      <ICard>
        <IH3>Squad Depth by Position</IH3>
        <p className="text-[10px] mb-3 text-gray-500">22 senior + dual-registered academy bridges. Forward depth thinnest — informs window priorities.</p>
        <table className="w-full text-sm"><thead><tr className={thd}>
          <th className="text-left p-3">Position</th>
          <th className="text-left p-3">Senior</th>
          <th className="text-left p-3">Academy / Dual-Reg</th>
          <th className="text-left p-3">Total</th>
          <th className="text-left p-3">Window Priority</th>
        </tr></thead><tbody>{[
          { p: 'GK',  s: 2, a: 1, prio: 'Backup-keeper signing planned' },
          { p: 'DEF', s: 6, a: 1, prio: 'Adequate'                       },
          { p: 'MID', s: 6, a: 1, prio: 'CM target identified'            },
          { p: 'FWD', s: 4, a: 2, prio: 'Thin — depth signing required'   },
        ].map((r, i) => <tr key={i} className="border-b border-gray-800/50"><td className="p-3 text-gray-200 font-medium">{r.p}</td><td className={ttd}>{r.s}</td><td className={ttd}>{r.a}</td><td className="p-3 text-xs text-white font-bold">{r.s + r.a}</td><td className="p-3 text-xs text-pink-400">{r.prio}</td></tr>)}</tbody></table>
      </ICard>

      {/* Form & xG-diff trend (last 8 matches) */}
      <ICard>
        <IH3>Form &amp; xG-Diff Trend (last 8)</IH3>
        <div className="flex gap-2 mb-3">{['W', 'D', 'W', 'L', 'W', 'W', 'D', 'L'].map((r, i) => <span key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${r === 'W' ? 'bg-green-600/20 text-green-400' : r === 'L' ? 'bg-red-600/20 text-red-400' : 'bg-amber-600/20 text-amber-400'}`}>{r}</span>)}</div>
        <svg viewBox="0 0 320 60" className="w-full max-w-md" style={{ height: 60 }}>
          <line x1="0" y1="30" x2="320" y2="30" stroke="#1F2937" strokeWidth="0.5" strokeDasharray="2,2" />
          {(() => {
            const vals = [-0.5, -0.2, 1.2, 0.6, -0.1, 1.1, 0.8, -0.4]
            const xStep = 320 / (vals.length - 1)
            const yFor = (v: number) => 30 - (v / 1.5) * 24
            const pts = vals.map((v, i) => `${i * xStep},${yFor(v)}`).join(' ')
            return (
              <>
                <polyline points={pts} fill="none" stroke="#EC4899" strokeWidth="2" />
                {vals.map((v, i) => <circle key={i} cx={i * xStep} cy={yFor(v)} r="3" fill={v >= 0 ? '#22C55E' : '#EF4444'} />)}
                {vals.map((v, i) => <text key={`t${i}`} x={i * xStep} y={yFor(v) - 6} textAnchor="middle" fill="#9CA3AF" fontSize="7">{v >= 0 ? `+${v.toFixed(1)}` : v.toFixed(1)}</text>)}
              </>
            )
          })()}
        </svg>
        <p className="text-[10px] mt-2 text-gray-500">xG difference per match — most recent on right. Average xG diff last 8: +0.31. Improving trend.</p>
      </ICard>

      {/* Scout targets — brand-safe fictional sides */}
      <ICard>
        <IH3>Scout Targets</IH3>
        <p className="text-[10px] mb-3 text-gray-500">Active scouting pipeline for summer 2026 window. All targets at fictional Tier-3 / overseas / free-agent level — illustrative demo data.</p>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className={thd}>
          <th className="text-left p-3">Player</th>
          <th className="text-left p-3">Club</th>
          <th className="text-left p-3">Age</th>
          <th className="text-left p-3">Pos</th>
          <th className="text-left p-3">Value</th>
          <th className="text-left p-3">Rating</th>
          <th className="text-left p-3">Status</th>
        </tr></thead><tbody>{[
          { n: 'K. Holm',      cl: 'Northern Lights FC',          a: 22, p: 'LB',  v: '£42k', r: '★★★★☆', s: 'Approached',   c: '#F59E0B' },
          { n: 'M. Sandhu',    cl: 'Riverside Athletic Women',     a: 24, p: 'FW',  v: '£68k', r: '★★★★☆', s: 'Bid pending',  c: '#EF4444' },
          { n: 'L. Tanaka',    cl: 'Overseas senior side',         a: 26, p: 'CM',  v: '£90k', r: '★★★★★', s: 'Watching',     c: '#6B7280' },
          { n: 'F. Bauer',     cl: 'Castleton United Women',       a: 19, p: 'RB',  v: '£28k', r: '★★★☆☆', s: 'Reported',     c: '#6B7280' },
          { n: 'O. Beaumont',  cl: 'Free agent',                   a: 28, p: 'GK',  v: '£0',   r: '★★★☆☆', s: 'Final stages', c: '#F59E0B' },
        ].map((t, i) => <tr key={i} className="border-b border-gray-800/50"><td className="p-3 text-gray-200">{t.n}</td><td className={ttd}>{t.cl}</td><td className={ttd}>{t.a}</td><td className={ttd}>{t.p}</td><td className={ttd}>{t.v}</td><td className="p-3 text-pink-400 text-xs">{t.r}</td><td className="p-3"><span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: `${t.c}20`, color: t.c }}>{t.s}</span></td></tr>)}</tbody></table></div>
      </ICard>

      {/* Dual-Registration Status — Women's-specific */}
      <ICard>
        <IH3>Dual-Registration Status</IH3>
        <p className="text-[10px] mb-3 text-gray-500">Women&apos;s-game-specific arrangement: senior players with limited minutes / academy bridges retain dual registration with Tier-3 sides for matchday exposure.</p>
        <table className="w-full text-sm"><thead><tr className={thd}>
          <th className="text-left p-3">Player</th>
          <th className="text-left p-3">Pos</th>
          <th className="text-left p-3">Partner Club</th>
          <th className="text-left p-3">Tier</th>
          <th className="text-left p-3">Status</th>
        </tr></thead><tbody>{[
          { n: 'N. Lakeman',   p: 'MID', cl: 'Cliffe Town Women U23',        t: 'Tier 4', st: 'Active — 8 minutes-rich games' },
          { n: 'B. Osei',      p: 'GK',  cl: 'Oakridge Reserves',             t: 'Tier 4', st: 'Active — rotation keeper'      },
          { n: 'P. Diallo',    p: 'LW',  cl: 'Local U21 development side',    t: 'U21',    st: 'Active — academy bridge'        },
        ].map((r, i) => <tr key={i} className="border-b border-gray-800/50"><td className="p-3 text-gray-200">{r.n}</td><td className={ttd}>{r.p}</td><td className={ttd}>{r.cl}</td><td className={ttd}>{r.t}</td><td className="p-3 text-xs text-teal-400">{r.st}</td></tr>)}</tbody></table>
        <p className="text-[10px] mt-3 text-gray-500">Pipeline: 2 academy players nominated for next window (Niamh O&apos;Brien, Isla Pearce).</p>
      </ICard>

      {/* Squad age distribution (carried over) */}
      <ICard>
        <IH3>Squad Age Distribution (22 players)</IH3>
        <svg viewBox="0 0 200 80" className="w-full max-w-xs" style={{ height: 80 }}>
          {[{ l: 'U21', v: 4 }, { l: '21–25', v: 9 }, { l: '26–29', v: 7 }, { l: '30+', v: 2 }].map((b, i) => {
            const x = i * 50 + 5; const h = (b.v / 9) * 55
            return <g key={i}><rect x={x} y={70 - h} width={35} height={h} fill="#EC4899" rx="3" opacity="0.8" /><text x={x + 17.5} y={78} textAnchor="middle" fill="#9CA3AF" fontSize="8">{b.l}</text><text x={x + 17.5} y={66 - h} textAnchor="middle" fill="#F9FAFB" fontSize="9" fontWeight="700">{b.v}</text></g>
          })}
        </svg>
      </ICard>

      {/* Transfer Window Timeline */}
      <ICard>
        <IH3>Summer 2026 Transfer Window — Timeline</IH3>
        <div className="relative pl-6">
          <div className="absolute left-[7px] top-0 bottom-0 w-px bg-gray-800" />
          {[
            { date: '26 May 2026',  task: 'Final squad review — DoF + Head Coach',           current: true  },
            { date: '1 Jun 2026',   task: 'Summer window opens',                              current: false },
            { date: '5 Jun 2026',   task: 'Target shortlist finalised — submitted to board',  current: false },
            { date: '12 Jun 2026',  task: 'Board meeting — transfer plan approval',           current: false },
            { date: '30 Jun 2026',  task: 'Pre-season camp begins (Lake District)',           current: false },
            { date: '1 Sep 2026',   task: 'Summer window closes',                             current: false },
            { date: '8 Sep 2026',   task: 'WSL 2 registration deadline',                      current: false },
          ].map((m, i) => (
            <div key={i} className="relative flex items-start gap-4 pb-3">
              <div className="absolute left-[-18px] w-3.5 h-3.5 rounded-full" style={{ backgroundColor: m.current ? '#EC4899' : '#1F2937', border: '2px solid #0D1117', top: 2 }} />
              <div>
                <p className={`text-xs font-bold ${m.current ? 'text-pink-400' : 'text-white'}`}>{m.date}</p>
                <p className="text-xs text-gray-500">{m.task}</p>
              </div>
            </div>
          ))}
        </div>
      </ICard>
    </div>
  )
}

function CoachContent() {
  // Full 22-player squad. Availability column is the only signal the coach
  // sees — no cycle phase, no ACL composite, no clinical reason. The
  // "Coordinated with Medical" footnote below the table is where clinical
  // detail goes (and only the Head of Medical tab carries it).
  const squad = [
    // GK (2)
    { n: 'Emma Clarke',     p: 'GK', f: '100%', lc: '100%', av: 'Available',    avC: 'green' },
    { n: 'M. Costa',        p: 'GK', f: '100%', lc: '100%', av: 'Available',    avC: 'green' },
    // DEF (7)
    { n: 'J. Okonkwo',      p: 'CB', f: '100%', lc: '100%', av: 'Available',    avC: 'green' },
    { n: 'Charlotte Reed',  p: 'CB', f: '95%',  lc: '65%',  av: 'Adapted load', avC: 'amber' },
    { n: 'F. Mireles',      p: 'CB', f: '96%',  lc: '90%',  av: 'Available',    avC: 'green' },
    { n: 'Jade Osei',       p: 'LB', f: '100%', lc: '100%', av: 'Available',    avC: 'green' },
    { n: 'R. Bailey',       p: 'LB', f: '94%',  lc: '90%',  av: 'Available',    avC: 'green' },
    { n: 'I. Beckett',      p: 'RB', f: '98%',  lc: '100%', av: 'Available',    avC: 'green' },
    { n: 'K. Hwang',        p: 'RB', f: '—',    lc: '—',    av: 'Unavailable',  avC: 'red'   },
    // MID (7)
    { n: 'A. Patel',        p: 'CM', f: '100%', lc: '100%', av: 'Available',    avC: 'green' },
    { n: 'Lucy Whitmore',   p: 'CM', f: '100%', lc: '100%', av: 'Available',    avC: 'green' },
    { n: 'Emily Zhang',     p: 'CM', f: '88%',  lc: '60%',  av: 'Adapted load', avC: 'amber' },
    { n: 'O. Nakamura',     p: 'CM', f: '95%',  lc: '95%',  av: 'Available',    avC: 'green' },
    { n: 'S. Connolly',     p: 'CM', f: '92%',  lc: '90%',  av: 'Available',    avC: 'green' },
    { n: 'Abbi Walsh',      p: 'RM', f: '97%',  lc: '95%',  av: 'Available',    avC: 'green' },
    { n: 'N. Lakeman',      p: 'MID', f: '100%', lc: '100%', av: 'Suspended',    avC: 'amber' },
    // FWD (6)
    { n: 'S. Reyes',        p: 'ST', f: '100%', lc: '100%', av: 'Available',    avC: 'green' },
    { n: 'C. Beaufort',     p: 'ST', f: '95%',  lc: '95%',  av: 'Available',    avC: 'green' },
    { n: 'N. Achterberg',   p: 'LW', f: '100%', lc: '100%', av: 'Available',    avC: 'green' },
    { n: 'Priya Nair',      p: 'FW', f: '92%',  lc: '95%',  av: 'Available',    avC: 'green' },
    { n: 'L. Brennan',      p: 'FW', f: '—',    lc: '—',    av: 'Unavailable',  avC: 'red'   },
    { n: 'T. Adeyemi',      p: 'FW', f: '—',    lc: '—',    av: 'Unavailable',  avC: 'red'   },
  ]

  return (
    <div className="space-y-6">
      <SectionHeader title="Head Coach View" subtitle="Performance, squad availability, next opposition, set-pieces, training schedule" icon="🎽" />

      {/* 6-tile KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Squad Available" value="18/22" sub="1 suspended · 3 unavailable" color="pink" />
        <StatCard label="Today's Adapted Load" value="3" sub="Modified-load recs (squad-wide)" color="amber" />
        <StatCard label="Form (Last 5)" value="3W 1D 1L" sub="10 pts from last 15" color="green" />
        <StatCard label="xG Last Match" value="0.31" sub="vs Hartwell Women (L 0–1)" color="amber" />
        <StatCard label="Best XI Confidence" value="84%" sub="Avg likely-to-start" color="teal" />
        <StatCard label="Next Match" value="Sun 24 May" sub="vs Harfield United Women (H)" color="blue" />
      </div>

      {/* Full 22-player squad availability matrix */}
      <ICard>
        <IH3>Squad Availability (22 players)</IH3>
        <p className="text-[10px] mb-3 text-gray-500">Coach view — availability flags only. Clinical reasons for unavailability sit with the Club Doctor on the Head of Medical tab (locked confidentiality model).</p>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className={thd}>
          <th className="text-left p-3">Player</th><th className="text-left p-3">Pos</th><th className="text-left p-3">Fitness</th><th className="text-left p-3">Load Cap</th><th className="text-left p-3">Available</th>
        </tr></thead><tbody>
          {squad.map((r, i) => {
            const lcN = parseInt(r.lc); const lcC = isNaN(lcN) ? 'text-gray-500' : lcN <= 65 ? 'text-red-400' : lcN <= 85 ? 'text-amber-400' : 'text-green-400'
            const avB = r.avC === 'green' ? 'bg-green-600/20 text-green-400' : r.avC === 'amber' ? 'bg-amber-600/20 text-amber-400' : 'bg-red-600/20 text-red-400'
            return <tr key={i} className="border-b border-gray-800/50">
              <td className="p-3 text-gray-200 font-medium">{r.n}</td><td className={ttd}>{r.p}</td><td className={ttd}>{r.f}</td>
              <td className="p-3"><span className={`text-xs font-bold ${lcC}`}>{r.lc}</span></td>
              <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded ${avB}`}>{r.av}</span></td>
            </tr>
          })}
        </tbody></table></div>
      </ICard>

      {/* Form & xG-diff trend — 10 matches */}
      <ICard>
        <IH3>Form &amp; xG-Diff Trend (Last 10)</IH3>
        <div className="flex gap-1.5 mb-4">{['W', 'D', 'W', 'L', 'W', 'W', 'D', 'L', 'W', 'D'].map((r, i) => <span key={i} className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${r === 'W' ? 'bg-green-600/20 text-green-400' : r === 'L' ? 'bg-red-600/20 text-red-400' : 'bg-amber-600/20 text-amber-400'}`}>{r}</span>)}</div>
        <p className="text-xs text-gray-500 mb-2">5W 3D 2L — 18 points from last 30</p>
        <svg viewBox="0 0 360 60" className="w-full max-w-md" style={{ height: 60 }}>
          <line x1="0" y1="30" x2="360" y2="30" stroke="#1F2937" strokeWidth="0.5" strokeDasharray="2,2" />
          {(() => {
            const vals = [0.6, -0.2, 0.9, -0.7, 1.1, 0.8, -0.1, -0.4, 1.2, 0.0]
            const xStep = 360 / (vals.length - 1)
            const yFor = (v: number) => 30 - (v / 1.5) * 24
            const pts = vals.map((v, i) => `${i * xStep},${yFor(v)}`).join(' ')
            return (
              <>
                <polyline points={pts} fill="none" stroke="#EC4899" strokeWidth="2" />
                {vals.map((v, i) => <circle key={i} cx={i * xStep} cy={yFor(v)} r="3" fill={v >= 0 ? '#22C55E' : '#EF4444'} />)}
                {vals.map((v, i) => <text key={`t${i}`} x={i * xStep} y={yFor(v) - 6} textAnchor="middle" fill="#9CA3AF" fontSize="7">{v >= 0 ? `+${v.toFixed(1)}` : v.toFixed(1)}</text>)}
              </>
            )
          })()}
        </svg>
        <p className="text-[10px] mt-2 text-gray-500">Avg xG diff last 10: +0.32 — positive trend.</p>
      </ICard>

      {/* Last 3 results — detailed breakdown */}
      <ICard>
        <IH3>Last 3 Results — Detailed</IH3>
        <table className="w-full text-sm"><thead><tr className={thd}>
          <th className="text-left p-3">Date</th>
          <th className="text-left p-3">Opponent</th>
          <th className="text-left p-3">Score</th>
          <th className="text-left p-3">xG (F / A)</th>
          <th className="text-left p-3">Possession</th>
          <th className="text-left p-3">Shots</th>
        </tr></thead><tbody>{[
          { d: '17 May', o: 'vs Hartwell Women (A)',     s: 'L 0–1', xg: '0.31 / 1.42', p: '48%', sh: '7–14', sc: 'red'   },
          { d: '10 May', o: 'vs Cliffe Town Women (H)',  s: 'W 2–1', xg: '1.84 / 0.95', p: '56%', sh: '15–9', sc: 'green' },
          { d: '3 May',  o: 'vs Riverside Athletic (A)', s: 'W 3–0', xg: '2.21 / 0.42', p: '58%', sh: '17–6', sc: 'green' },
        ].map((r, i) => <tr key={i} className="border-b border-gray-800/50"><td className={ttd}>{r.d}</td><td className="p-3 text-gray-200">{r.o}</td><td className="p-3"><span className={`text-xs font-bold ${r.sc === 'green' ? 'text-green-400' : r.sc === 'red' ? 'text-red-400' : 'text-amber-400'}`}>{r.s}</span></td><td className={ttd}>{r.xg}</td><td className={ttd}>{r.p}</td><td className={ttd}>{r.sh}</td></tr>)}</tbody></table>
      </ICard>

      {/* Next Opposition Profile — threats / weaknesses */}
      <ICard>
        <IH3>Next Opposition — Harfield United Women</IH3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-bold mb-2 text-amber-400">⚠ THEIR THREATS</p>
            {[
              'Top scorer: T. Mason (9 goals)',
              'Set-piece danger from corners — 38% of goals from set pieces',
              'Fast counter-attack through right side (R. Field, RM)',
              'High press in first 15 minutes — disrupts build-up',
            ].map(t => <p key={t} className="text-xs mb-1 text-gray-300">⚠ {t}</p>)}
          </div>
          <div>
            <p className="text-xs font-bold mb-2 text-green-400">✓ THEIR WEAKNESSES</p>
            {[
              'Vulnerable to balls in behind LB — pace mismatch',
              'Slow centre-back pair on turning — exploit with through balls',
              'Goalkeeper command of area weak — corners winnable',
              '7 goals conceded from crosses this season',
            ].map(t => <p key={t} className="text-xs mb-1 text-gray-300">✓ {t}</p>)}
          </div>
        </div>
      </ICard>

      {/* Set-piece record */}
      <ICard>
        <IH3>Set-Piece Record (season)</IH3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">{[
          { l: 'Corners / Match',     v: '4.8',  c: '#F472B6' },
          { l: 'Goals from Corners',  v: '6 (12%)', c: '#22C55E' },
          { l: 'Penalties',           v: '4 / 4 (100%)', c: '#22C55E' },
          { l: 'Set-pieces Conceded', v: '5 goals', c: '#F59E0B' },
        ].map(s => <div key={s.l} className="rounded-lg p-3" style={{ backgroundColor: '#0a0c14', border: '1px solid #1F2937' }}>
          <p className="text-lg font-black" style={{ color: s.c }}>{s.v}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">{s.l}</p>
        </div>)}</div>
      </ICard>

      {/* Formation usage */}
      <ICard>
        <IH3>Formation Usage (season)</IH3>
        <table className="w-full text-sm"><thead><tr className={thd}>
          <th className="text-left p-3">Formation</th>
          <th className="text-left p-3">Games</th>
          <th className="text-left p-3">W-D-L</th>
          <th className="text-left p-3">Win%</th>
          <th className="text-left p-3">GF</th>
          <th className="text-left p-3">GA</th>
          <th className="text-left p-3">xG Diff</th>
        </tr></thead><tbody>{[
          { f: '4-3-3',   g: 14, r: '8-3-3', w: '57%', gf: 22, ga: 14, x: '+8.4' },
          { f: '4-2-3-1', g:  5, r: '2-1-2', w: '40%', gf:  7, ga:  6, x: '+1.6' },
          { f: '3-5-2',   g:  2, r: '1-0-1', w: '50%', gf:  4, ga:  3, x: '+0.7' },
        ].map((r, i) => <tr key={i} className="border-b border-gray-800/50"><td className="p-3 text-gray-200 font-medium">{r.f}</td><td className={ttd}>{r.g}</td><td className={ttd}>{r.r}</td><td className="p-3 text-xs text-pink-400 font-bold">{r.w}</td><td className={ttd}>{r.gf}</td><td className={ttd}>{r.ga}</td><td className="p-3 text-xs text-green-400 font-bold">{r.x}</td></tr>)}</tbody></table>
      </ICard>

      {/* Training schedule — next 3 sessions */}
      <ICard>
        <IH3>Training Schedule — Next 3 Sessions</IH3>
        <div className="space-y-2">{[
          { d: 'Tue 19 May · AM', f: 'Tactical block — press triggers + transitions (vs Harfield prep)', l: 'High intensity' },
          { d: 'Wed 20 May · AM', f: 'Set-pieces — corners attack and defend; penalty rota review',     l: 'Moderate'      },
          { d: 'Thu 21 May · AM', f: 'Light technical — match minus 3 protocol',                         l: 'Low'           },
        ].map((s, i) => <div key={i} className="flex items-center justify-between p-3 bg-[#0a0c14] border border-gray-800 rounded-lg">
          <div>
            <p className="text-xs font-bold text-pink-400">{s.d}</p>
            <p className="text-[11px] text-gray-300 mt-0.5">{s.f}</p>
          </div>
          <span className="text-[10px] font-bold px-2 py-1 rounded" style={{ backgroundColor: s.l === 'High intensity' ? 'rgba(239,68,68,0.15)' : s.l === 'Moderate' ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)', color: s.l === 'High intensity' ? '#EF4444' : s.l === 'Moderate' ? '#F59E0B' : '#22C55E' }}>{s.l}</span>
        </div>)}</div>
      </ICard>

      {/* Tactical Notes */}
      <ICard>
        <IH3>Tactical Notes — Match-Day Briefing</IH3>
        <div className="space-y-2">{[
          'Press trigger: Harfield play out from back. High press in first 10 minutes effective.',
          'Set-piece threat: opponent scores 38% of goals from corners. Zonal or man-mark decision required.',
          'Load consideration: 3 players on modified-load today. Conserve energy in transitions.',
          'XI confidence: 84% likely-to-start average — final call subject to fitness checks Saturday AM.',
        ].map((t, i) => <div key={i} className="p-3 bg-[#0a0c14] border border-gray-800 rounded-lg text-xs text-gray-300">• {t}</div>)}</div>
      </ICard>
    </div>
  )
}

function PerformanceContent() {
  // Physical / load only. No clinical diagnosis, no injury detail, no
  // cycle phase, no ACL composite, no mental-health content. Players who
  // are unavailable show as "—" or "Coordinated w/ Medical" — coach +
  // medical own the reason; performance owns the physical envelope.
  return (
    <div className="space-y-6">
      <SectionHeader title="Head of Performance View" subtitle="GPS, load, training analytics, fitness, conditioning" icon="📊" />
      <VisibilityNote role="performance" />

      {/* 6-tile KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Squad Avg Load (7-day)" value="412 AU" sub="Target band 380–450" color="green" />
        <StatCard label="Above Target" value="2" sub="Modified-load applied" color="amber" />
        <StatCard label="Below Target" value="1" sub="Coordinated w/ Medical" color="blue" />
        <StatCard label="HSR Squad Avg" value="68%" sub="vs season baseline" color="teal" />
        <StatCard label="Max Speed (last session)" value="29.4 km/h" sub="N. Achterberg" color="pink" />
        <StatCard label="Training Hours / Week" value="14.2" sub="Plan: 14.0" color="green" />
      </div>

      {/* 7-day squad-aggregate load trend */}
      <ICard>
        <IH3>Squad Load — Last 7 Days (squad average AU)</IH3>
        <p className="text-[10px] mb-3 text-gray-500">Target band 380–450 AU. Matchday spike on Sun 17 May; recovery dip Mon 18 May; tactical-block ramp through midweek.</p>
        <svg viewBox="0 0 350 100" className="w-full max-w-lg" style={{ height: 120 }}>
          {/* Target band */}
          <rect x="0" y={100 - (450 / 600) * 80} width="350" height={((450 - 380) / 600) * 80} fill="#22C55E" opacity="0.08" />
          <line x1="0" y1={100 - (450 / 600) * 80} x2="350" y2={100 - (450 / 600) * 80} stroke="#22C55E" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.4" />
          <line x1="0" y1={100 - (380 / 600) * 80} x2="350" y2={100 - (380 / 600) * 80} stroke="#22C55E" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.4" />
          {(() => {
            const days = [
              { d: 'Sat 17', v: 580, label: 'Match' },
              { d: 'Sun 18', v: 180, label: 'Recovery' },
              { d: 'Mon 19', v: 280, label: 'Off / Light' },
              { d: 'Tue 20', v: 510, label: 'Tactical' },
              { d: 'Wed 21', v: 460, label: 'Set-pieces' },
              { d: 'Thu 22', v: 320, label: 'M-3' },
              { d: 'Fri 23', v: 240, label: 'M-2 Light' },
            ]
            const xStep = 350 / (days.length - 1)
            const yFor = (v: number) => 100 - (v / 600) * 80
            const pts = days.map((d, i) => `${i * xStep},${yFor(d.v)}`).join(' ')
            return <>
              <polyline points={pts} fill="none" stroke="#EC4899" strokeWidth="2" />
              {days.map((d, i) => <circle key={i} cx={i * xStep} cy={yFor(d.v)} r="3" fill="#EC4899" />)}
              {days.map((d, i) => <text key={`d${i}`} x={i * xStep} y={97} textAnchor="middle" fill="#6B7280" fontSize="7">{d.d}</text>)}
              {days.map((d, i) => <text key={`v${i}`} x={i * xStep} y={yFor(d.v) - 6} textAnchor="middle" fill="#9CA3AF" fontSize="6">{d.v}</text>)}
            </>
          })()}
        </svg>
      </ICard>

      {/* GPS load by player — selectable players only (unavailable rows omitted, since they don't have load) */}
      <ICard>
        <IH3>GPS Load — Last Session (selectable players)</IH3>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className={thd}>
          <th className="text-left p-3">Player</th>
          <th className="text-left p-3">Distance</th>
          <th className="text-left p-3">HSR (m)</th>
          <th className="text-left p-3">Sprints</th>
          <th className="text-left p-3">Max Speed</th>
          <th className="text-left p-3">A:C Ratio</th>
          <th className="text-left p-3">Status</th>
        </tr></thead><tbody>{[
          { n: 'N. Achterberg',  d: '11.4 km', h: '720', sp: 18, ms: '29.4', ac: '1.18', st: 'Optimal', c: '#22C55E' },
          { n: 'S. Reyes',       d: '10.6 km', h: '680', sp: 22, ms: '28.7', ac: '1.22', st: 'Optimal', c: '#22C55E' },
          { n: 'A. Patel',       d: '12.1 km', h: '540', sp: 12, ms: '26.8', ac: '1.10', st: 'Optimal', c: '#22C55E' },
          { n: 'Lucy Whitmore',  d: '12.6 km', h: '580', sp: 14, ms: '27.2', ac: '1.32', st: 'High',    c: '#F59E0B' },
          { n: 'O. Nakamura',    d: '11.8 km', h: '510', sp: 13, ms: '27.5', ac: '1.16', st: 'Optimal', c: '#22C55E' },
          { n: 'J. Okonkwo',     d: '10.9 km', h: '480', sp: 9,  ms: '27.9', ac: '1.08', st: 'Optimal', c: '#22C55E' },
          { n: 'F. Mireles',     d: '10.4 km', h: '450', sp: 8,  ms: '27.1', ac: '1.04', st: 'Optimal', c: '#22C55E' },
          { n: 'Jade Osei',      d: '11.2 km', h: '620', sp: 16, ms: '28.4', ac: '1.14', st: 'Optimal', c: '#22C55E' },
          { n: 'I. Beckett',     d: '11.0 km', h: '600', sp: 15, ms: '28.2', ac: '1.42', st: 'High',    c: '#F59E0B' },
          { n: 'Abbi Walsh',     d: '10.8 km', h: '560', sp: 14, ms: '27.6', ac: '1.20', st: 'Optimal', c: '#22C55E' },
          { n: 'Priya Nair',     d: '10.2 km', h: '530', sp: 16, ms: '28.0', ac: '1.06', st: 'Optimal', c: '#22C55E' },
          { n: 'Charlotte Reed', d: '8.4 km',  h: '320', sp: 6,  ms: '24.5', ac: '0.82', st: 'Adapted', c: '#3B82F6' },
          { n: 'Emily Zhang',    d: '7.9 km',  h: '280', sp: 4,  ms: '23.8', ac: '0.78', st: 'Adapted', c: '#3B82F6' },
          { n: 'Emma Clarke',    d: '6.1 km',  h: '180', sp: 2,  ms: '21.4', ac: '1.00', st: 'GK plan', c: '#6B7280' },
        ].map((r, i) => <tr key={i} className="border-b border-gray-800/50"><td className="p-3 text-gray-200 font-medium">{r.n}</td><td className={ttd}>{r.d}</td><td className={ttd}>{r.h}</td><td className={ttd}>{r.sp}</td><td className={ttd}>{r.ms} km/h</td><td className={ttd}>{r.ac}</td><td className="p-3"><span className="text-xs px-2 py-0.5 rounded font-bold" style={{ backgroundColor: `${r.c}20`, color: r.c }}>{r.st}</span></td></tr>)}</tbody></table></div>
        <p className="text-[10px] mt-3 text-gray-500">A:C ratio (acute / chronic workload) — green &lt; 1.30 optimal · amber 1.30–1.50 high · red &gt; 1.50 elevated injury-risk per literature. Players on adapted-load show below-baseline numbers by design — clinical reasoning sits with Medical.</p>
      </ICard>

      {/* Training intensity zones */}
      <ICard>
        <IH3>Training Intensity Zones — Last 7 Days (% squad-minutes)</IH3>
        <div className="space-y-2">{[
          { l: 'Zone 1 — Low (recovery, walking)',         v: 22, c: '#22C55E' },
          { l: 'Zone 2 — Moderate (jogging, technical)',   v: 38, c: '#3B82F6' },
          { l: 'Zone 3 — High (running, tactical)',        v: 28, c: '#F59E0B' },
          { l: 'Zone 4 — Max (sprint, HSR)',               v: 12, c: '#EF4444' },
        ].map(z => <div key={z.l}>
          <div className="flex justify-between text-xs mb-1"><span className="text-gray-400">{z.l}</span><span className="text-gray-300 font-bold">{z.v}%</span></div>
          <div className="h-2 rounded-full bg-gray-800"><div className="h-2 rounded-full" style={{ width: `${z.v}%`, backgroundColor: z.c }} /></div>
        </div>)}</div>
        <p className="text-[10px] mt-3 text-gray-500">Plan target band: Zone 3 + 4 combined 35–45% in match-week. Currently 40% — on target.</p>
      </ICard>

      {/* A:C workload ratio distribution */}
      <ICard>
        <IH3>A:C Workload Ratio — Squad Distribution</IH3>
        <div className="grid grid-cols-3 gap-3 text-center">{[
          { l: 'Optimal (<1.30)', v: 11, c: '#22C55E' },
          { l: 'High (1.30–1.50)', v: 2, c: '#F59E0B' },
          { l: 'Elevated (>1.50)', v: 0, c: '#EF4444' },
        ].map(b => <div key={b.l} className="rounded-lg p-3" style={{ backgroundColor: '#0a0c14', border: '1px solid #1F2937' }}>
          <p className="text-2xl font-black" style={{ color: b.c }}>{b.v}</p>
          <p className="text-[10px] text-gray-500 mt-1">{b.l}</p>
        </div>)}</div>
        <p className="text-[10px] mt-3 text-gray-500">Of 14 players with full GPS load this week. Lucy Whitmore + I. Beckett in High band — apply load cap or rest day. No elevated-band cases.</p>
      </ICard>

      {/* Conditioning compliance per player */}
      <ICard>
        <IH3>Conditioning Compliance — This Week (S&amp;C sessions)</IH3>
        <table className="w-full text-sm"><thead><tr className={thd}>
          <th className="text-left p-3">Player</th>
          <th className="text-left p-3">Planned</th>
          <th className="text-left p-3">Attended</th>
          <th className="text-left p-3">Compliance</th>
        </tr></thead><tbody>{[
          { n: 'Squad average',  p: 3, a: '2.8', c: '93%', sc: '#22C55E' },
          { n: 'S. Reyes',       p: 3, a: '3',   c: '100%', sc: '#22C55E' },
          { n: 'N. Achterberg',  p: 3, a: '3',   c: '100%', sc: '#22C55E' },
          { n: 'O. Nakamura',    p: 3, a: '3',   c: '100%', sc: '#22C55E' },
          { n: 'I. Beckett',     p: 3, a: '2',   c: '67%',  sc: '#F59E0B' },
          { n: 'Priya Nair',     p: 3, a: '2',   c: '67%',  sc: '#F59E0B' },
        ].map((r, i) => <tr key={i} className="border-b border-gray-800/50"><td className={`p-3 ${i === 0 ? 'text-pink-400 font-bold' : 'text-gray-200'}`}>{r.n}</td><td className={ttd}>{r.p}</td><td className={ttd}>{r.a}</td><td className="p-3"><span className="text-xs font-bold" style={{ color: r.sc }}>{r.c}</span></td></tr>)}</tbody></table>
        <p className="text-[10px] mt-3 text-gray-500">Showing the 5 most-relevant rows. Full breakdown in S&amp;C log.</p>
      </ICard>

      {/* Fitness test results — pre-season baseline + last test */}
      <ICard>
        <IH3>Fitness Test Results — Pre-Season Baseline vs Last Test (May 2026)</IH3>
        <table className="w-full text-sm"><thead><tr className={thd}>
          <th className="text-left p-3">Metric</th>
          <th className="text-left p-3">Squad Avg (Aug 25)</th>
          <th className="text-left p-3">Squad Avg (May 26)</th>
          <th className="text-left p-3">Delta</th>
        </tr></thead><tbody>{[
          { m: 'Yo-Yo IR1 (m)',         pre: '1,820', now: '2,140', d: '+18%', sc: '#22C55E' },
          { m: 'Vertical jump (cm)',    pre: '42.6',  now: '44.1',  d: '+3.5%', sc: '#22C55E' },
          { m: '20m sprint (s)',        pre: '3.18',  now: '3.11',  d: '−2.2%', sc: '#22C55E' },
          { m: 'CMJ peak force (N)',    pre: '1,540', now: '1,610', d: '+4.5%', sc: '#22C55E' },
          { m: 'Match HSR (m / 90)',    pre: '480',   now: '560',   d: '+17%',  sc: '#22C55E' },
        ].map((r, i) => <tr key={i} className="border-b border-gray-800/50"><td className="p-3 text-gray-200">{r.m}</td><td className={ttd}>{r.pre}</td><td className={ttd}>{r.now}</td><td className="p-3 text-xs font-bold" style={{ color: r.sc }}>{r.d}</td></tr>)}</tbody></table>
        <p className="text-[10px] mt-3 text-gray-500">Season-long S&amp;C plan working. Next test block: Aug 2026 pre-season.</p>
      </ICard>

      {/* Weekly training plan (load periodisation) */}
      <ICard>
        <IH3>Weekly Training Plan — Periodisation</IH3>
        <table className="w-full text-sm"><thead><tr className={thd}>
          <th className="text-left p-3">Day</th>
          <th className="text-left p-3">Focus</th>
          <th className="text-left p-3">Load Target (AU)</th>
          <th className="text-left p-3">Intensity</th>
        </tr></thead><tbody>{[
          { day: 'Mon',     f: 'Recovery + technical',          au: '180–280', i: 'Low'      },
          { day: 'Tue',     f: 'Strength + tactical block',     au: '450–520', i: 'High'     },
          { day: 'Wed',     f: 'Set-pieces + small-sided',      au: '420–480', i: 'Moderate' },
          { day: 'Thu',     f: 'High-intensity intervals (M-3)', au: '300–360', i: 'Moderate' },
          { day: 'Fri',     f: 'Light technical (M-2)',          au: '220–260', i: 'Low'      },
          { day: 'Sat',     f: 'Activation + walk-through (M-1)', au: '120–160', i: 'Low'      },
          { day: 'Sun',     f: 'MATCH',                          au: '550–650', i: 'Max'      },
        ].map((r, i) => <tr key={i} className="border-b border-gray-800/50"><td className="p-3 text-gray-200 font-medium">{r.day}</td><td className={ttd}>{r.f}</td><td className={ttd}>{r.au}</td><td className="p-3"><span className="text-xs px-2 py-0.5 rounded font-bold" style={{ backgroundColor: r.i === 'High' || r.i === 'Max' ? 'rgba(239,68,68,0.15)' : r.i === 'Moderate' ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)', color: r.i === 'High' || r.i === 'Max' ? '#EF4444' : r.i === 'Moderate' ? '#F59E0B' : '#22C55E' }}>{r.i}</span></td></tr>)}</tbody></table>
        <p className="text-[10px] mt-3 text-gray-500">Squad-wide template — individual modifications applied for adapted-load players (coordinated with Medical).</p>
      </ICard>
    </div>
  )
}

function WelfareContent() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Welfare Lead View" subtitle="Aggregate flags, pathway stages, opt-in posture, compliance" icon="❤️" />
      <VisibilityNote role="welfare" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Open Welfare Flags" value="4" sub="2 amber · 2 yellow · 0 red" color="amber" />
        <StatCard label="Cycle Opt-in Rate" value="64%" sub="14 of 22 — opt-in only" color="pink" />
        <StatCard label="Check-ins Overdue" value="2" sub="Action required" color="red" />
        <StatCard label="Carney Compliance" value="91%" sub="2 criteria below threshold" color="green" />
      </div>
      <ICard><IH3>Priority Actions Today</IH3><div className="space-y-2">{[
        { t: 'ACL risk bands today: 17 low · 3 moderate · 2 elevated. Confirm with Club Doctor that intervention pathway is active for the elevated cases.', c: 'red'   },
        { t: 'Cycle module: 8 of 22 squad have not yet had the opt-in conversation. Schedule sessions over the next 2 weeks.',                                  c: 'amber' },
        { t: 'Maternity pathway: 1 active case at Stage 4. Pre-leave medical coordinated with Club Doctor — due by 30 Apr.',                                    c: 'blue'  },
      ].map((a, i) => <div key={i} className={`p-3 border rounded-lg text-xs text-gray-300 ${a.c === 'red' ? 'border-red-600/30 bg-red-900/10' : a.c === 'amber' ? 'border-amber-600/30 bg-amber-900/10' : 'border-blue-600/30 bg-blue-900/10'}`}>{a.t}</div>)}</div></ICard>
      <ICard><IH3>Karen Carney Review — Welfare Criteria</IH3><div className="space-y-1.5">{[
        { t: 'Licensed performance psychologist available',          s: '✓' },
        { t: 'Monthly wellbeing check-ins logged',                   s: '✓' },
        { t: 'Maternity policy documented and enacted',              s: '✓' },
        { t: 'Mental health first aider on staff',                   s: '✓' },
        { t: 'PFA referral pathway in place',                        s: '✓' },
        { t: 'No selection pressure during recovery',                s: '✓' },
        { t: 'Independent Welfare Lead appointed (in progress)',     s: '⚠' },
        { t: 'Annual welfare audit completed (due Jun 2026)',        s: '⚠' },
      ].map((c, i) => <div key={i} className="flex items-center gap-2 text-xs"><span className={c.s === '✓' ? 'text-green-400' : 'text-amber-400'}>{c.s}</span><span className="text-gray-300">{c.t}</span></div>)}</div></ICard>
    </div>
  )
}

function MedicalContent() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Head of Medical View" subtitle="Clinical detail — injuries, ACL composite, RTP, screening, GPS load as injury-risk context" icon="🏥" />
      <VisibilityNote role="medical" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active Injuries" value="3" sub="1 severe · 1 moderate · 1 minor" color="red" />
        <StatCard label="ACL Red Flags" value="2" sub="Immediate action required" color="red" />
        <StatCard label="Screenings Overdue" value="4" sub="Schedule this week" color="amber" />
        <StatCard label="RTP Players" value="1" sub="Sophie Turner — Phase 3" color="blue" />
      </div>
      <ICard><IH3>ACL Composite Score — Medical View</IH3><p className="text-[10px] mb-3 text-gray-500">Per-player composite scores — clinical detail owned by the medical team. Not visible on the Welfare Lead tab.</p><div className="grid grid-cols-2 lg:grid-cols-5 gap-3">{[
        { n: 'Emily Zhang',    p: 'CM', t: 98, l: 'red'   as const, a: 'Contact physio NOW. No training today.' },
        { n: 'Priya Nair',     p: 'FW', t: 53, l: 'amber' as const, a: 'Avoid cutting drills. Review post-training.' },
        { n: 'Sophie Turner',  p: 'CB', t: 57, l: 'amber' as const, a: 'Continue RTP Phase 3. ACL physio Thu.' },
        { n: 'Jade Osei',      p: 'LB', t: 15, l: 'green' as const, a: 'Clear for full training.' },
        { n: 'Emma Clarke',    p: 'GK', t: 18, l: 'green' as const, a: 'Schedule overdue ACL screening.' },
      ].map(p => <div key={p.n} className={`border rounded-xl p-3 ${p.l === 'red' ? 'bg-red-600/10 border-red-600/30' : p.l === 'amber' ? 'bg-amber-600/10 border-amber-600/30' : 'bg-green-600/10 border-green-600/30'}`}><div className="flex items-center gap-2 mb-2"><div className={`w-5 h-5 rounded-full ${p.l === 'red' ? 'bg-red-500' : p.l === 'amber' ? 'bg-amber-500' : 'bg-green-500'}`} /><div><div className="text-xs font-bold text-white">{p.n}</div><div className="text-[10px] text-gray-500">{p.p} · {p.t}/100</div></div></div><div className="text-[10px] text-gray-400">{p.a}</div></div>)}</div></ICard>
      <ICard><IH3>Injury Register</IH3><table className="w-full text-sm"><thead><tr className={thd}><th className="text-left p-3">Player</th><th className="text-left p-3">Injury</th><th className="text-left p-3">Severity</th><th className="text-left p-3">RTP</th></tr></thead><tbody>{[
        { n: 'Sophie Turner', i: 'ACL',        s: 'Severe',   r: 'Aug 2026'    },
        { n: 'K. Hwang',      i: 'Ankle',      s: 'Moderate', r: '4 weeks'     },
        { n: 'L. Brennan',    i: 'Hamstring',  s: 'Minor',    r: '2 weeks'     },
      ].map((r, i) => <tr key={i} className="border-b border-gray-800/50"><td className="p-3 text-gray-200">{r.n}</td><td className={ttd}>{r.i}</td><td className="p-3"><span className={`text-xs px-2 py-0.5 rounded ${r.s === 'Severe' ? 'bg-red-600/20 text-red-400' : r.s === 'Moderate' ? 'bg-amber-600/20 text-amber-400' : 'bg-blue-600/20 text-blue-400'}`}>{r.s}</span></td><td className={ttd}>{r.r}</td></tr>)}</tbody></table></ICard>
      <ICard><IH3>Upcoming Medical Appointments</IH3><div className="space-y-2">{[
        'Thu 21 May — Emily Zhang physio consultation (ACL flag)',
        'Fri 22 May — T. Adeyemi illness clearance review',
        'Mon 25 May — Sophie Turner RTP Phase 3 assessment',
        'Wed 27 May — Squad ACL screening block (4 players)',
      ].map((a, i) => <div key={i} className="p-2.5 bg-[#0a0c14] border border-gray-800 rounded-lg text-xs text-gray-300">{a}</div>)}</div></ICard>
    </div>
  )
}

function AcademyContent() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Academy Director View" subtitle="FA Girls' Centre of Excellence · U21 / U18" icon="🎓" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Academy Players" value="34" sub="U18: 18 · U21: 16" color="pink" />
        <StatCard label="First Team Promotions" value="2" sub="This season" color="green" />
        <StatCard label="CoE Compliance" value="87%" sub="3 criteria outstanding" color="amber" />
        <StatCard label="Development Contracts" value="8" sub="Scholarship agreements" color="blue" />
      </div>
      <ICard><IH3>FA Girls&apos; Centre of Excellence Compliance</IH3><div className="space-y-1.5">{[
        { t: 'Qualified coaching staff ratio met (1:15)',                                                s: '✓' },
        { t: 'Safeguarding DBS checks up to date',                                                       s: '✓' },
        { t: 'Education welfare officer in post',                                                        s: '✓' },
        { t: 'Player development plans filed (all U18)',                                                 s: '✓' },
        { t: 'Medical screening completed (all academy)',                                                s: '✓' },
        { t: 'Physiotherapy provision (shared — standalone required by Aug 2026)',                      s: '⚠' },
        { t: 'S&C coach (U18 — recruitment underway)',                                                   s: '⚠' },
        { t: 'Mental health practitioner for academy (Required Jun 2026 — urgent)',                     s: '✗' },
      ].map((c, i) => <div key={i} className="flex items-center gap-2 text-xs"><span className={c.s === '✓' ? 'text-green-400' : c.s === '⚠' ? 'text-amber-400' : 'text-red-400'}>{c.s}</span><span className="text-gray-300">{c.t}</span></div>)}</div></ICard>
      <ICard><IH3>U18 Squad — GPS Development Profiles</IH3><table className="w-full text-sm"><thead><tr className={thd}><th className="text-left p-3">Player</th><th className="text-left p-3">Age</th><th className="text-left p-3">Pos</th><th className="text-left p-3">GPS</th><th className="text-left p-3">Rating</th><th className="text-left p-3">Potential</th></tr></thead><tbody>{[
        { n: 'Isla Pearce',     a: 17, p: 'FW', g: '64 AU', d: '★★★★☆', po: 'High'    },
        { n: 'Freya Watts',     a: 16, p: 'CM', g: '58 AU', d: '★★★☆☆', po: 'Medium'  },
        { n: "Niamh O'Brien",   a: 17, p: 'CB', g: '71 AU', d: '★★★★★', po: 'Elite'   },
        { n: 'Becca Lane',      a: 15, p: 'GK', g: '55 AU', d: '★★★☆☆', po: 'Monitor' },
        { n: 'Simone Ashby',    a: 17, p: 'LB', g: '62 AU', d: '★★★★☆', po: 'High'    },
      ].map((r, i) => <tr key={i} className="border-b border-gray-800/50"><td className="p-3 text-gray-200">{r.n}</td><td className={ttd}>{r.a}</td><td className={ttd}>{r.p}</td><td className={ttd}>{r.g}</td><td className="p-3 text-pink-400 text-xs">{r.d}</td><td className="p-3 text-xs text-teal-400">{r.po}</td></tr>)}</tbody></table></ICard>
      <ICard><IH3>Dual Pathway — First Team Bridge</IH3><div className="space-y-2">{[
        "Niamh O'Brien — nominated for dual registration from May 2026. Pending DoF sign-off.",
        'Isla Pearce — training with first team Fridays. No formal registration yet.',
      ].map((t, i) => <div key={i} className="p-3 bg-[#0a0c14] border border-pink-600/20 rounded-lg text-xs text-gray-300">{t}</div>)}</div></ICard>
    </div>
  )
}

function CommercialContent() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Commercial Director View" subtitle="Sponsorship, revenue, and standalone attribution" icon="💼" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Commercial Revenue (annual)" value="£1.40M" sub="Women-attributed" color="pink" />
        <StatCard label="Active Sponsors" value="6" sub="3 renewal due" color="green" />
        <StatCard label="Pipeline Value" value="£285k" sub="3 live opportunities" color="blue" />
        <StatCard label="Standalone Revenue %" value="31%" sub="vs parent club benchmark" color="teal" />
      </div>
      <ICard><IH3>Sponsorship Portfolio</IH3><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className={thd}><th className="text-left p-3">Sponsor</th><th className="text-left p-3">Type</th><th className="text-left p-3">Value</th><th className="text-left p-3">Attr</th><th className="text-left p-3">Renewal</th><th className="text-left p-3">Status</th></tr></thead><tbody>{[
        { n: 'Kestrel Finance',          t: 'Kit',       v: '£420k', a: '100%',  r: 'Jun 2027', s: 'Active',  c: 'green' },
        { n: 'WSL central distribution', t: 'League',    v: '£85k',  a: '100%',  r: 'League',   s: 'Active',  c: 'green' },
        { n: 'NovaTech UK',              t: 'Sleeve',    v: '£40k',  a: '100%',  r: 'Dec 2026', s: 'Active',  c: 'green' },
        { n: 'Meridian Insurance',       t: 'Shared',    v: '£95k',  a: '11.9%', r: 'Mar 2026', s: 'Review',  c: 'amber' },
        { n: 'Local Energy Co',          t: "Women's",   v: '£35k',  a: '100%',  r: 'Apr 2026', s: 'Renewal', c: 'red'   },
        { n: 'Oakridge Council',         t: 'Community', v: '£18k',  a: '100%',  r: 'Jun 2026', s: 'Active',  c: 'green' },
      ].map((r, i) => <tr key={i} className="border-b border-gray-800/50"><td className="p-3 text-gray-200">{r.n}</td><td className={ttd}>{r.t}</td><td className={ttd}>{r.v}</td><td className={ttd}>{r.a}</td><td className={ttd}>{r.r}</td><td className="p-3"><span className={`text-xs px-2 py-0.5 rounded ${r.c === 'green' ? 'bg-green-600/20 text-green-400' : r.c === 'amber' ? 'bg-amber-600/20 text-amber-400' : 'bg-red-600/20 text-red-400'}`}>{r.s}</span></td></tr>)}</tbody></table></div></ICard>
      <ICard><IH3>Pipeline Opportunities</IH3><div className="space-y-2">{[
        'Cycle tracking app partnership — Lumio Cycle data product. Est. £60–120k/yr. In discussion.',
        "Women's kit sleeve — post-Carney opportunity. Est. £25–40k/yr. Proposal stage.",
        'GPS vest bundle — Lumio Health co-sell. Est. £85k one-off. Scoping.',
      ].map((o, i) => <div key={i} className="p-3 bg-[#0a0c14] border border-gray-800 rounded-lg text-xs text-gray-300">• {o}</div>)}</div></ICard>
      <ICard><IH3>Revenue YoY Trend</IH3><svg viewBox="0 0 200 80" className="w-full max-w-xs" style={{ height: 80 }}>{[
        { l: '23/24', v: 1.06 },
        { l: '24/25', v: 1.27 },
        { l: '25/26', v: 1.40 },
      ].map((b, i) => {
        const x = i * 65 + 10; const h = (b.v / 1.5) * 55
        return <g key={i}><rect x={x} y={70 - h} width={45} height={h} fill="#EC4899" rx="3" opacity="0.8" /><text x={x + 22.5} y={78} textAnchor="middle" fill="#9CA3AF" fontSize="8">{b.l}</text><text x={x + 22.5} y={66 - h} textAnchor="middle" fill="#F9FAFB" fontSize="9" fontWeight="700">£{b.v}M</text></g>
      })}</svg></ICard>
    </div>
  )
}

function OperationsContent() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Head of Operations View" subtitle="Matchday ops, facilities, logistics, travel, scheduling" icon="🛠️" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Next Match Ready" value="On track" sub="Sun 24 May (H)" color="green" />
        <StatCard label="Stewarding Capacity" value="100%" sub="Booked for next fixture" color="green" />
        <StatCard label="East Terrace" value="Re-inspection 7 Jun" sub="Contractor briefed" color="amber" />
        <StatCard label="Away Travel Plan" value="Submitted" sub="Next away: 31 May" color="blue" />
      </div>
      <ICard>
        <IH3>Notes</IH3>
        <p className="text-xs text-gray-400">Full matchday ops scoreboard, fixture logistics, travel & accommodation pipeline, facility booking and stewarding plan build out in <span className="text-pink-400">commit C6</span> alongside Media &amp; Comms.</p>
      </ICard>
    </div>
  )
}

function MediaContent() {
  return (
    <div className="space-y-6">
      <SectionHeader title="Media & Comms View" subtitle="Audience growth, social media, and fan engagement" icon="📣" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Social Followers" value="42.8k" sub="+18% this season" color="pink" />
        <StatCard label="Match Attendance" value="3,050 avg" sub="+400 vs last season" color="green" />
        <StatCard label="Media Requests" value="3 pending" sub="2 interview · 1 feature" color="amber" />
        <StatCard label="Fan Hub Members" value="1,240" sub="Launched Jan 2026" color="blue" />
      </div>
      <ICard><IH3>Social Media Performance</IH3><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className={thd}><th className="text-left p-3">Platform</th><th className="text-left p-3">Followers</th><th className="text-left p-3">Growth</th><th className="text-left p-3">Best Post</th><th className="text-left p-3">Eng.</th></tr></thead><tbody>{[
        { p: 'Instagram', f: '18.4k', g: '+22%', b: '48k (WSL goal)',    e: '6.8%' },
        { p: 'TikTok',    f: '14.2k', g: '+41%', b: '112k (BTS reel)',   e: '9.2%' },
        { p: 'X',         f: '7.6k',  g: '+8%',  b: '22k (match thread)', e: '3.1%' },
        { p: 'YouTube',   f: '2.6k',  g: '+14%', b: '8.4k (profile)',    e: '4.7%' },
      ].map((r, i) => <tr key={i} className="border-b border-gray-800/50"><td className="p-3 text-gray-200">{r.p}</td><td className={ttd}>{r.f}</td><td className="p-3 text-green-400 text-xs">{r.g}</td><td className={ttd}>{r.b}</td><td className={ttd}>{r.e}</td></tr>)}</tbody></table></div></ICard>
      <ICard><IH3>Content Calendar — This Week</IH3><div className="space-y-2">{[
        'Thu 21 May — Match preview (vs Harfield United Women) — IG + X',
        'Fri 22 May — Player spotlight: Emma Clarke — TikTok',
        'Sun 24 May — Live match thread + post-match reel — All',
        'Mon 26 May — Behind the season ep 7 — YouTube',
      ].map((c, i) => <div key={i} className="p-2.5 bg-[#0a0c14] border border-gray-800 rounded-lg text-xs text-gray-300">{c}</div>)}</div></ICard>
      <ICard><IH3>Pending Media Requests</IH3><div className="space-y-2">{[
        { t: 'Crown Broadcasting — feature on Lumio Cycle welfare integration. Deadline: 28 May.',                u: false },
        { t: 'The Chronicle — interview: Sarah Frost on WSL season. Deadline: 30 May.',                            u: false },
        { t: 'Northbridge Sport — matchday access vs Harfield United Women (Sun). Confirm by Fri.',                u: true  },
      ].map((m, i) => <div key={i} className={`p-3 border rounded-lg text-xs text-gray-300 flex items-start justify-between gap-2 ${m.u ? 'border-red-600/30 bg-red-900/10' : 'border-amber-600/30 bg-amber-900/10'}`}><span>{m.t}</span>{m.u && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-600/20 text-red-400 flex-shrink-0">URGENT</span>}</div>)}</div></ICard>
      <ICard><IH3>Fan Hub Highlights</IH3><div className="grid grid-cols-3 gap-3">{[
        { l: 'Members',       v: '1,240' },
        { l: 'Match Overlap', v: '68%'   },
        { l: 'Top Topic',     v: 'Player welfare' },
      ].map(s => <div key={s.l} className="text-center p-3 bg-[#0a0c14] border border-gray-800 rounded-lg"><div className="text-lg font-bold text-pink-400">{s.v}</div><div className="text-[10px] text-gray-500 mt-0.5">{s.l}</div></div>)}</div></ICard>
    </div>
  )
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export default function WomensInsightsView({ club, defaultRole }: { club: WomensClub; defaultRole?: string }) {
  const [activeRole, setActiveRole] = useState<RoleId>(mapRBACtoTab(defaultRole))

  const renderRole = () => {
    switch (activeRole) {
      case 'ceo':         return <CEOContent />
      case 'dof':         return <DoFContent />
      case 'coach':       return <CoachContent />
      case 'performance': return <PerformanceContent />
      case 'welfare':     return <WelfareContent />
      case 'medical':     return <MedicalContent />
      case 'academy':     return <AcademyContent />
      case 'commercial':  return <CommercialContent />
      case 'operations':  return <OperationsContent />
      case 'media':       return <MediaContent />
    }
  }

  return (
    <div>
      <SectionHeader title={`${club.name} — Insights`} subtitle="Role-based dashboards — 10 views, grouped to make the welfare / medical / performance confidentiality boundary visible." icon="📊" />
      <div className="overflow-x-auto pb-2 mb-6">
        <div className="flex gap-1 min-w-max">
          {ROLES.map(r => (
            <button key={r.id} onClick={() => setActiveRole(r.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap transition-all ${activeRole === r.id ? 'bg-pink-600/20 text-pink-400 border-b-2 border-pink-500' : 'text-gray-500 hover:text-gray-300'}`}>
              <span>{r.icon}</span>{r.label}
            </button>
          ))}
        </div>
      </div>
      {renderRole()}
      <SharedCommonStrip />
    </div>
  )
}
