'use client'

import { useState } from 'react'
import {
  TrendingUp, Users, Activity, Zap, Star, Shield,
  Headphones, GitBranch, DollarSign, AlertCircle, Clock, BarChart2,
  Sparkles, ChevronDown, ChevronUp,
} from 'lucide-react'
import { StatCard, SectionCard, Badge, PageShell } from '@/components/page-ui'
import { ChartSection, parseNum } from '@/components/chart-ui'
import ExportPdfButton from '@/components/ExportPdfButton'
import { DashboardEmptyState, useHasDashboardData } from '@/components/dashboard/EmptyState'
import DeptStaffHeader from '@/components/dashboard/DeptStaffHeader'
import { getDeptStaff, getDeptLead, getStaffName } from '@/lib/staff/deptMatch'

// ─── Types & helpers ──────────────────────────────────────────────────────────

type Role = 'Director' | 'Manager' | 'Finance' | 'Operations'
const ROLES: Role[] = ['Director', 'Manager', 'Finance', 'Operations']

function KV({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
      <span className="text-sm" style={{ color: '#9CA3AF' }}>{label}</span>
      <div className="flex flex-col items-end">
        <span className="text-sm font-semibold" style={{ color: color ?? '#F9FAFB' }}>{value}</span>
        {sub && <span className="text-xs" style={{ color: '#9CA3AF' }}>{sub}</span>}
      </div>
    </div>
  )
}

// Simple inline bar chart
function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div className="flex flex-col gap-1.5 px-5 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
      <div className="flex items-center justify-between">
        <span className="text-sm" style={{ color: '#9CA3AF' }}>{label}</span>
        <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{value}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: '#1F2937' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

// Mini trend line SVG
function TrendLine({ up, color }: { up: boolean; color: string }) {
  const data = up
    ? [20, 25, 22, 30, 28, 35, 32, 40, 38, 46]
    : [46, 42, 44, 36, 38, 30, 33, 26, 28, 20]
  const W = 60, H = 28
  const min = Math.min(...data), max = Math.max(...data), rng = max - min || 1
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - 2 - ((v - min) / rng) * (H - 6)}`).join(' ')
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── AI Highlights data ───────────────────────────────────────────────────────

const directorHighlights = [
  'MRR up 12% month-on-month — strongest growth since Q3 last year',
  '23 new customers added in last 30 days — pipeline converting well',
  '3 workflows flagged as needing attention — support SLA at risk',
  'Customer health score stable — 132 healthy, 29 at risk, 10 critical',
  'Workflow automation saved an estimated 47 hours this month',
]

const managerHighlights = [
  '8 active onboardings in progress — all on track',
  '14 leave requests pending approval — 3 flagged as urgent',
  '3 probation reviews overdue — HR action required',
  'Headcount at 187 — 2 open roles in recruitment pipeline',
  'Team sentiment stable — no escalations this month',
]

const financeHighlights = [
  'Monthly MRR: £41,993 — on track for £500k ARR by year end',
  'Expansion revenue up 18% — existing customers adding seats',
  'Average contract value increased to £4,200 — up from £3,800',
  '7 overdue invoices totalling £12,400 — chase sequence active',
  'Forecast: £44,500 MRR next month based on pipeline conversion',
]

const operationsHighlights = [
  '1,834 workflow runs in last 30 days — 0 critical failures',
  'Most triggered workflow: New Joiner Onboarding (248 runs)',
  'Invoice Chase workflow saving average £2,400/month in recovered debt',
  '3 workflows running slower than baseline — review recommended',
  'Automation coverage up to 67% of manual tasks across all departments',
]

// ─── AI Highlights panel ──────────────────────────────────────────────────────

function InsightsAIPanel({ items }: { items: string[] }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="overflow-hidden rounded-xl" style={{ border: '1px solid #6C3FC5' }}>
      <button
        className="flex w-full items-center justify-between px-5 py-4"
        style={{
          backgroundColor: 'rgba(108,63,197,0.08)',
          borderBottom: open ? '1px solid rgba(108,63,197,0.3)' : undefined,
        }}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={14} style={{ color: '#6C3FC5' }} />
          <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>AI Key Highlights</span>
          <span className="rounded-md px-2 py-0.5 text-xs font-semibold"
            style={{ backgroundColor: 'rgba(108,63,197,0.2)', color: '#A78BFA' }}>
            Mar
          </span>
        </div>
        {open
          ? <ChevronUp size={14} style={{ color: '#9CA3AF' }} />
          : <ChevronDown size={14} style={{ color: '#9CA3AF' }} />}
      </button>
      {open && (
        <div className="flex flex-col gap-3 p-5" style={{ backgroundColor: '#0f0e17' }}>
          {items.map((item, i) => (
            <div key={i} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{ backgroundColor: 'rgba(108,63,197,0.2)', color: '#A78BFA' }}>
                {i + 1}
              </span>
              <p className="text-xs leading-relaxed" style={{ color: '#C4B5FD' }}>{item}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Director View ─────────────────────────────────────────────────────────────

function DirectorView() {
  const stats = [
    { label: 'Company Health Score', value: '87/100', trend: '+3',   trendDir: 'up'   as const, trendGood: true,  icon: Activity,   sub: 'vs last quarter' },
    { label: 'MRR',                  value: '£42,800', trend: '+18%', trendDir: 'up'   as const, trendGood: true,  icon: TrendingUp, sub: 'vs last month'   },
    { label: 'Headcount',            value: '187',     trend: '+3',   trendDir: 'up'   as const, trendGood: true,  icon: Users,      sub: 'this month'      },
    { label: 'Workflow Efficiency',  value: '94%',     trend: '+2%',  trendDir: 'up'   as const, trendGood: true,  icon: Zap,        sub: 'vs last month'   },
  ]

  const topCustomers = [
    { company: 'Greenfield Academy',   arr: '£91,000', rag: 'green', csm: 'Dan Marsh'   },
    { company: 'Oakridge Schools Ltd', arr: '£76,000', rag: 'green', csm: 'Sophie Bell' },
    { company: 'Bramble Hill Trust',   arr: '£55,000', rag: 'amber', csm: 'Dan Marsh'   },
    { company: 'Hopscotch Learning',   arr: '£42,000', rag: 'green', csm: 'Raj Patel'   },
    { company: 'Crestview Academy',    arr: '£33,400', rag: 'green', csm: 'Sophie Bell' },
  ]

  const revenueVsTarget = [
    { month: 'Oct 25', actual: 38200, target: 40000 },
    { month: 'Nov 25', actual: 39800, target: 40000 },
    { month: 'Dec 25', actual: 41200, target: 42000 },
    { month: 'Jan 26', actual: 40500, target: 42000 },
    { month: 'Feb 26', actual: 41900, target: 43000 },
    { month: 'Mar 26', actual: 42800, target: 43000 },
  ]

  const efficiency = [
    { dept: 'Sales',    score: 96, max: 100 },
    { dept: 'Support',  score: 91, max: 100 },
    { dept: 'Success',  score: 94, max: 100 },
    { dept: 'HR',       score: 88, max: 100 },
    { dept: 'Accounts', score: 83, max: 100 },
    { dept: 'IT',       score: 97, max: 100 },
  ]

  return (
    <div className="flex flex-col gap-6">
      <InsightsAIPanel items={directorHighlights} />

      <ChartSection points={stats.map(s => ({ label: s.label, value: parseNum(s.value) }))}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      </ChartSection>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <SectionCard title="Revenue vs Target (Last 6 Months)">
            <div className="flex flex-col divide-y" style={{ borderColor: '#1F2937' }}>
              {revenueVsTarget.map((r) => {
                const pct = Math.round((r.actual / r.target) * 100)
                const hit = r.actual >= r.target
                return (
                  <div key={r.month} className="flex items-center gap-4 px-5 py-3">
                    <span className="w-14 text-xs" style={{ color: '#9CA3AF' }}>{r.month}</span>
                    <div className="flex flex-1 flex-col gap-1">
                      <div className="flex items-center justify-between text-xs" style={{ color: '#9CA3AF' }}>
                        <span>£{r.actual.toLocaleString()}</span>
                        <span>Target £{r.target.toLocaleString()}</span>
                      </div>
                      <div className="relative h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: '#1F2937' }}>
                        <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: hit ? '#22C55E' : '#F59E0B' }} />
                      </div>
                    </div>
                    <span className="w-10 text-right text-xs font-semibold" style={{ color: hit ? '#22C55E' : '#F59E0B' }}>{pct}%</span>
                  </div>
                )
              })}
            </div>
          </SectionCard>

          <SectionCard title="Top 5 Customers by ARR">
            <div className="flex flex-col">
              {topCustomers.map((c, i) => (
                <div key={c.company} className="flex items-center gap-4 px-5 py-3" style={{ borderBottom: i < topCustomers.length - 1 ? '1px solid #1F2937' : undefined }}>
                  <span className="text-xs font-bold w-5" style={{ color: '#9CA3AF' }}>#{i + 1}</span>
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{c.company}</span>
                    <span className="text-xs" style={{ color: '#9CA3AF' }}>CSM: {c.csm}</span>
                  </div>
                  <Badge status={c.rag} />
                  <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{c.arr}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="flex flex-col gap-4">
          <SectionCard title="Workflow Efficiency by Dept">
            <div className="flex flex-col">
              {efficiency.map((e) => (
                <BarRow key={e.dept} label={e.dept} value={e.score} max={100} color="#0D9488" />
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Key Metrics">
            <KV label="ARR" value="£513,600" sub="+18% YoY" />
            <KV label="NPS Score" value="54" sub="vs 48 last quarter" />
            <KV label="Churn Rate" value="2.1%" sub="-0.4% vs last Q" color="#22C55E" />
            <KV label="Gross Margin" value="78%" sub="stable" />
            <KV label="CAC" value="£1,240" sub="-£80 vs last Q" color="#22C55E" />
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

// ─── Manager View ─────────────────────────────────────────────────────────────

function ManagerView() {
  const stats = [
    { label: 'Avg Team Score',       value: '84%',  trend: '+2%', trendDir: 'up' as const, trendGood: true,  icon: Star,       sub: 'vs last month'  },
    { label: 'Workflow Completion',  value: '96%',  trend: '+1%', trendDir: 'up' as const, trendGood: true,  icon: GitBranch,  sub: 'all departments' },
    { label: 'SLA Compliance',       value: '91%',  trend: '−1%', trendDir: 'down' as const,trendGood: false, icon: Shield,     sub: 'vs last month'  },
    { label: 'CSAT',                 value: '94%',  trend: '+2%', trendDir: 'up' as const, trendGood: true,  icon: Headphones, sub: 'vs last month'  },
  ]

  const openActions = [
    { dept: 'Support',   count: 5,  urgent: 2,  trend: true  },
    { dept: 'Sales',     count: 3,  urgent: 1,  trend: false },
    { dept: 'HR',        count: 4,  urgent: 1,  trend: false },
    { dept: 'Accounts',  count: 3,  urgent: 2,  trend: true  },
    { dept: 'Success',   count: 5,  urgent: 3,  trend: true  },
    { dept: 'IT',        count: 2,  urgent: 0,  trend: false },
  ]

  const workflows = [
    { name: 'New Joiner Onboarding',     completion: 100, runs: 248, dept: 'HR'       },
    { name: 'Trial Follow-up Day 3',     completion: 98,  runs: 312, dept: 'Sales'    },
    { name: 'RAG Health Score Update',   completion: 100, runs: 181, dept: 'Success'  },
    { name: 'CSAT Survey Post-Ticket',   completion: 97,  runs: 421, dept: 'Support'  },
    { name: 'Invoice Chase 30d',         completion: 89,  runs: 67,  dept: 'Accounts' },
    { name: 'IT Provisioning',           completion: 100, runs: 248, dept: 'IT'       },
  ]

  const satisfaction = [
    { month: 'Oct 25', score: 88 }, { month: 'Nov 25', score: 90 },
    { month: 'Dec 25', score: 91 }, { month: 'Jan 26', score: 92 },
    { month: 'Feb 26', score: 93 }, { month: 'Mar 26', score: 94 },
  ]

  return (
    <div className="flex flex-col gap-6">
      <InsightsAIPanel items={managerHighlights} />

      <ChartSection points={stats.map(s => ({ label: s.label, value: parseNum(s.value) }))}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      </ChartSection>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <SectionCard title="Workflow Completion Rates">
            <div className="flex flex-col">
              {workflows.map((w) => (
                <div key={w.name} className="flex items-center gap-4 px-5 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
                  <div className="flex flex-1 flex-col gap-0.5">
                    <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{w.name}</span>
                    <span className="text-xs" style={{ color: '#9CA3AF' }}>{w.dept} · {w.runs} runs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full" style={{ backgroundColor: '#1F2937' }}>
                      <div className="h-full rounded-full" style={{ width: `${w.completion}%`, backgroundColor: w.completion >= 95 ? '#22C55E' : '#F59E0B' }} />
                    </div>
                    <span className="text-xs font-semibold w-8 text-right" style={{ color: w.completion >= 95 ? '#22C55E' : '#F59E0B' }}>{w.completion}%</span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="CSAT Trend (6 Months)">
            <div className="flex items-end gap-2 px-5 py-4">
              {satisfaction.map((s) => {
                const h = Math.round(((s.score - 80) / 20) * 60) + 8
                return (
                  <div key={s.month} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-xs font-semibold" style={{ color: '#22C55E' }}>{s.score}%</span>
                    <div className="w-full rounded-t" style={{ height: h, backgroundColor: '#22C55E', opacity: 0.7 }} />
                    <span className="text-xs" style={{ color: '#9CA3AF' }}>{s.month.split(' ')[0]}</span>
                  </div>
                )
              })}
            </div>
          </SectionCard>
        </div>

        <div className="flex flex-col gap-4">
          <SectionCard title="Open Actions by Department">
            {openActions.map((a) => (
              <div key={a.dept} className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{a.dept}</span>
                  <span className="text-xs" style={{ color: '#9CA3AF' }}>{a.urgent} urgent</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendLine up={a.trend} color={a.trend ? '#EF4444' : '#22C55E'} />
                  <span className="text-sm font-bold" style={{ color: a.urgent > 1 ? '#EF4444' : '#F9FAFB' }}>{a.count}</span>
                </div>
              </div>
            ))}
          </SectionCard>

          <SectionCard title="SLA Compliance">
            <KV label="Support (P1)" value="100%" color="#22C55E" />
            <KV label="Support (P2)" value="94%" color="#22C55E" />
            <KV label="Support (P3)" value="88%" color="#F59E0B" />
            <KV label="Accounts 30d" value="79%" color="#F59E0B" sub="2 breaches" />
            <KV label="Onboarding" value="96%" color="#22C55E" />
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

// ─── Finance View ─────────────────────────────────────────────────────────────

function FinanceView() {
  const stats = [
    { label: 'Revenue This Month',   value: '£142,800', trend: '+18%', trendDir: 'up' as const, trendGood: true,  icon: TrendingUp,  sub: 'vs last month'  },
    { label: 'Outstanding Invoices', value: '£84,200',  trend: '+£12k',trendDir: 'up' as const, trendGood: false, icon: AlertCircle, sub: 'vs last month'  },
    { label: 'MRR',                  value: '£42,800',  trend: '+6%',  trendDir: 'up' as const, trendGood: true,  icon: DollarSign,  sub: 'vs last month'  },
    { label: 'ARR Projection',       value: '£513,600', trend: '+6%',  trendDir: 'up' as const, trendGood: true,  icon: BarChart2,   sub: 'current run rate'},
  ]

  const overdue = [
    { company: 'Whitestone College',  amount: '£12,400', days: 34, band: 'red'   },
    { company: 'Bramble Hill Trust',  amount: '£8,200',  days: 20, band: 'amber' },
    { company: 'Elmfield Institute',  amount: '£2,800',  days: 11, band: 'amber' },
  ]

  const mrrBreakdown = [
    { label: 'New MRR',       value: '£4,200',  color: '#22C55E' },
    { label: 'Expansion MRR', value: '£1,800',  color: '#0D9488' },
    { label: 'Churn MRR',     value: '−£900',   color: '#EF4444' },
    { label: 'Contraction',   value: '−£300',   color: '#F59E0B' },
    { label: 'Net New MRR',   value: '£4,800',  color: '#22C55E' },
  ]

  const costPerWorkflow = [
    { dept: 'HR',       cost: '£0.42', runs: 440, saving: '£184' },
    { dept: 'Sales',    cost: '£0.18', runs: 653, saving: '£312' },
    { dept: 'Support',  cost: '£0.31', runs: 532, saving: '£228' },
    { dept: 'Accounts', cost: '£0.52', runs: 270, saving: '£96'  },
    { dept: 'Success',  cost: '£0.22', runs: 193, saving: '£86'  },
    { dept: 'IT',       cost: '£0.38', runs: 282, saving: '£124' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <InsightsAIPanel items={financeHighlights} />

      <ChartSection points={stats.map(s => ({ label: s.label, value: parseNum(s.value) }))}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      </ChartSection>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <SectionCard title="Cost per Workflow by Department">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid #1F2937' }}>
                    {['Department', 'Avg Cost', 'Runs (24h)', 'Est. Monthly Saving'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                        style={{ color: '#9CA3AF' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {costPerWorkflow.map((r, i) => (
                    <tr key={r.dept} style={{ borderBottom: i < costPerWorkflow.length - 1 ? '1px solid #1F2937' : undefined }}>
                      <td className="px-5 py-3 font-medium" style={{ color: '#F9FAFB' }}>{r.dept}</td>
                      <td className="px-5 py-3" style={{ color: '#9CA3AF' }}>{r.cost}</td>
                      <td className="px-5 py-3" style={{ color: '#9CA3AF' }}>{r.runs}</td>
                      <td className="px-5 py-3 font-semibold" style={{ color: '#22C55E' }}>{r.saving}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard title="Overdue Invoices Breakdown">
            {overdue.map((o) => (
              <div key={o.company} className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{o.company}</span>
                  <span className="text-xs" style={{ color: '#9CA3AF' }}>{o.days} days overdue</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge status={o.band === 'red' ? 'overdue' : 'pending'} />
                  <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{o.amount}</span>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-sm font-semibold" style={{ color: '#9CA3AF' }}>Total overdue</span>
              <span className="text-sm font-bold" style={{ color: '#EF4444' }}>£23,400</span>
            </div>
          </SectionCard>
        </div>

        <div className="flex flex-col gap-4">
          <SectionCard title="MRR Breakdown">
            {mrrBreakdown.map((m) => (
              <div key={m.label} className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
                <span className="text-sm" style={{ color: '#9CA3AF' }}>{m.label}</span>
                <span className="text-sm font-semibold" style={{ color: m.color }}>{m.value}</span>
              </div>
            ))}
          </SectionCard>

          <SectionCard title="Financial Health">
            <KV label="Gross Revenue" value="£186,300" />
            <KV label="Collected" value="£142,800" color="#22C55E" />
            <KV label="Avg Days to Pay" value="28 days" />
            <KV label="Payment on time" value="68%" color="#F59E0B" />
            <KV label="Gross Margin" value="78%" color="#22C55E" />
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

// ─── Operations View ──────────────────────────────────────────────────────────

function OperationsView() {
  const stats = [
    { label: 'Total Runs (24h)',    value: '312',  trend: '+28%', trendDir: 'up'   as const, trendGood: true,  icon: GitBranch,   sub: 'vs prior day'   },
    { label: 'Error Rate',         value: '1.0%', trend: '−0.3%',trendDir: 'down' as const, trendGood: true,  icon: AlertCircle, sub: 'vs last week'   },
    { label: 'System Uptime',      value: '99.8%',trend: '+0.1%',trendDir: 'up'   as const, trendGood: true,  icon: Activity,    sub: 'last 30 days'   },
    { label: 'Automation ROI',     value: '4.2×', trend: '+0.3×',trendDir: 'up'   as const, trendGood: true,  icon: Zap,         sub: 'vs last quarter'},
  ]

  const errorRates = [
    { dept: 'Sales',    errors: 1, runs: 653, rate: '0.15%' },
    { dept: 'Support',  errors: 1, runs: 532, rate: '0.19%' },
    { dept: 'Accounts', errors: 1, runs: 270, rate: '0.37%' },
    { dept: 'HR',       errors: 0, runs: 440, rate: '0.00%' },
    { dept: 'Success',  errors: 0, runs: 193, rate: '0.00%' },
    { dept: 'IT',       errors: 0, runs: 282, rate: '0.00%' },
  ]

  const hourlyRuns = [
    { hour: '00', runs: 4 },  { hour: '02', runs: 2 },  { hour: '04', runs: 3 },
    { hour: '06', runs: 8 },  { hour: '08', runs: 38 }, { hour: '09', runs: 52 },
    { hour: '10', runs: 61 }, { hour: '11', runs: 48 }, { hour: '12', runs: 29 },
    { hour: '13', runs: 34 }, { hour: '14', runs: 55 }, { hour: '15', runs: 44 },
    { hour: '16', runs: 38 }, { hour: '17', runs: 22 }, { hour: '18', runs: 11 },
    { hour: '20', runs: 6 },  { hour: '22', runs: 4 },
  ]
  const maxRuns = Math.max(...hourlyRuns.map((h) => h.runs))

  const roi = [
    { label: 'Hours saved per month', value: '340 hrs' },
    { label: 'Avg hourly cost',       value: '£32/hr'  },
    { label: 'Gross value saved',     value: '£10,880' },
    { label: 'Platform cost',         value: '£2,580'  },
    { label: 'Net monthly saving',    value: '£8,300'  },
    { label: 'ROI ratio',             value: '4.2×', color: '#22C55E' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <InsightsAIPanel items={operationsHighlights} />

      <ChartSection points={stats.map(s => ({ label: s.label, value: parseNum(s.value) }))}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      </ChartSection>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <SectionCard title="Busiest Workflow Hours (Today)">
            <div className="flex items-end gap-1 px-5 py-4" style={{ height: 120 }}>
              {hourlyRuns.map((h) => {
                const heightPct = Math.round((h.runs / maxRuns) * 72) + 4
                const hot = h.runs >= 40
                return (
                  <div key={h.hour} className="flex flex-1 flex-col items-center gap-1">
                    <div className="w-full rounded-t transition-all"
                      style={{ height: heightPct, backgroundColor: hot ? '#0D9488' : '#1F2937' }} />
                    <span className="text-xs" style={{ color: '#9CA3AF', fontSize: 9 }}>{h.hour}</span>
                  </div>
                )
              })}
            </div>
          </SectionCard>

          <SectionCard title="Error Rates by Department">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid #1F2937' }}>
                    {['Department', 'Errors (24h)', 'Total Runs', 'Error Rate'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {errorRates.map((r, i) => (
                    <tr key={r.dept} style={{ borderBottom: i < errorRates.length - 1 ? '1px solid #1F2937' : undefined }}>
                      <td className="px-5 py-3 font-medium" style={{ color: '#F9FAFB' }}>{r.dept}</td>
                      <td className="px-5 py-3 font-semibold" style={{ color: r.errors > 0 ? '#EF4444' : '#22C55E' }}>{r.errors}</td>
                      <td className="px-5 py-3" style={{ color: '#9CA3AF' }}>{r.runs}</td>
                      <td className="px-5 py-3" style={{ color: r.errors > 0 ? '#F59E0B' : '#22C55E' }}>{r.rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>

        <div className="flex flex-col gap-4">
          <SectionCard title="Automation ROI Estimate">
            {roi.map((r) => (
              <KV key={r.label} label={r.label} value={r.value} color={r.color} />
            ))}
          </SectionCard>

          <SectionCard title="System Health">
            <KV label="API uptime (30d)" value="99.8%" color="#22C55E" />
            <KV label="Avg workflow time" value="1m 24s" />
            <KV label="Queue depth now" value="2" color="#22C55E" />
            <KV label="Failed jobs (7d)" value="3" color="#F59E0B" />
            <KV label="Retry success rate" value="100%" color="#22C55E" />
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

// ─── Filter options ────────────────────────────────────────────────────────────

const REGIONS    = ['All Regions',   'North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East & Africa', 'United Kingdom', 'United States', 'Canada', 'Australia']
const COUNTRIES  = ['All Countries', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Netherlands', 'Singapore', 'UAE', 'South Africa', 'Brazil', 'India', 'Japan']
const SECTORS    = ['All Sectors',   'Education', 'Healthcare', 'Finance', 'Technology', 'Retail', 'Non-profit', 'Government', 'Sport & Leisure']
const ORG_TYPES  = ['All Types',     'Enterprise (500+ staff)', 'Mid-Market (50-500 staff)', 'SME (10-50 staff)', 'Startup (<10 staff)', 'Public Sector', 'Non-profit']

function FilterSelect({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, border: '1px solid #1F2937', background: '#111318', color: value === options[0] ? '#9CA3AF' : '#F9FAFB', cursor: 'pointer', height: 28 }}
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InsightsPage() {
  const [role,     setRole]     = useState<Role>('Director')
  const [region,   setRegion]   = useState('All Regions')
  const [country,  setCountry]  = useState('All Countries')
  const [sector,   setSector]   = useState('All Sectors')
  const [orgType,  setOrgType]  = useState('All Types')

  const hasData = useHasDashboardData('insights')

  const deptStaff = getDeptStaff('strategy')
  const deptLead = getDeptLead(deptStaff)

  if (hasData === null) return null
  if (!hasData) return (
    <PageShell title="Insights" subtitle="Analytics, reporting and performance data">
      {deptStaff.length > 0 && <DeptStaffHeader staff={deptStaff} lead={deptLead} dept="strategy" />}
      <div className="flex flex-col items-center justify-center py-16 text-center max-w-lg mx-auto">
        <div className="rounded-2xl flex items-center justify-center mb-5" style={{ width: 72, height: 72, backgroundColor: '#2D1B69' }}>
          <BarChart2 size={32} style={{ color: '#A78BFA' }} />
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: '#F9FAFB' }}>
          {deptLead ? `${getStaffName(deptLead).split(' ')[0]} is ready — add your insights data` : 'Add data to unlock Insights'}
        </h2>
        <p className="text-sm mb-8" style={{ color: '#6B7280' }}>
          {deptLead ? `${getStaffName(deptLead)} is set up as ${deptLead.job_title || 'Strategy Lead'}. Insights gives every role a tailored live view of your business. Add data across your modules to unlock the full Insights dashboard.` : 'Insights gives every role a tailored live view of your business. Add data across your modules to unlock the full Insights dashboard.'}
        </p>

        <div className="w-full space-y-3 mb-6">
          {[
            { icon: '⬆', label: 'Upload Business Data (CSV)', template: true },
            { icon: '⬆', label: 'Upload Key Metrics (CSV/XLSX)', template: true },
            { icon: '⇔', label: 'Connect an Integration (HubSpot, Xero, Slack + more)', template: false },
          ].map((opt, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl px-4 py-3 cursor-pointer" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="flex items-center gap-3">
                <span className="text-base">{opt.icon}</span>
                <span className="text-sm" style={{ color: '#F9FAFB' }}>{opt.label}</span>
              </div>
              {opt.template && (
                <button className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>↓ Template</button>
              )}
            </div>
          ))}
        </div>

        <div className="w-full flex items-center gap-3 mb-6">
          <div className="flex-1 h-px" style={{ backgroundColor: '#1F2937' }} />
          <span className="text-xs" style={{ color: '#6B7280' }}>or</span>
          <div className="flex-1 h-px" style={{ backgroundColor: '#1F2937' }} />
        </div>

        <button onClick={() => {
          const ALL_PAGES = ['overview','crm','sales','marketing','projects','hr','partners','finance','insights','workflows','strategy','reports','accounts','support','success','trials','operations','it']
          ALL_PAGES.forEach(k => localStorage.setItem(`lumio_dashboard_${k}_hasData`, 'true'))
          localStorage.setItem('lumio_demo_active', 'true')
          window.location.reload()
        }} className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold" style={{ backgroundColor: '#6D28D9', color: '#F9FAFB' }}>
          <Sparkles size={16} /> Explore with Demo Data
        </button>
        <p className="text-xs mt-3" style={{ color: '#6B7280' }}>Pre-filled sample data so you can explore every feature before adding your own</p>
      </div>
    </PageShell>
  )

  const isFiltered = region !== 'All Regions' || country !== 'All Countries' ||
                     sector !== 'All Sectors' || orgType !== 'All Types'

  const activeFilters = [region, country, sector, orgType].filter((v) => !v.startsWith('All'))

  return (
    <PageShell title="Insights" subtitle="Analytics, reporting and performance data">
      {/* Compact filter + role + export row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, whiteSpace: 'nowrap' }}>FILTER BY</span>
        <FilterSelect options={REGIONS}   value={region}   onChange={setRegion}   />
        <FilterSelect options={COUNTRIES} value={country}  onChange={setCountry}  />
        <FilterSelect options={SECTORS}   value={sector}   onChange={setSector}   />
        <FilterSelect options={ORG_TYPES} value={orgType}  onChange={setOrgType}  />
        {isFiltered && (
          <>
            <span className="rounded-md px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: 'rgba(108,63,197,0.15)', color: '#6C3FC5' }}>Filtered</span>
            <button onClick={() => { setRegion('All Regions'); setCountry('All Countries'); setSector('All Sectors'); setOrgType('All Types') }} className="text-xs" style={{ color: '#9CA3AF' }}>Clear</button>
          </>
        )}
        <div style={{ width: 1, height: 20, background: '#1F2937', margin: '0 4px' }} />
        <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, whiteSpace: 'nowrap' }}>VIEW AS</span>
        {ROLES.map((r) => (
          <button key={r} onClick={() => setRole(r)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, border: `1px solid ${role === r ? '#7C3AED' : '#1F2937'}`, background: role === r ? '#7C3AED' : 'transparent', color: role === r ? 'white' : '#9CA3AF', cursor: 'pointer', height: 28, fontWeight: role === r ? 700 : 400 }}>{r}</button>
        ))}
        <div style={{ marginLeft: 'auto' }}><ExportPdfButton /></div>
      </div>

      {isFiltered && (
        <p className="text-xs px-1" style={{ color: '#9CA3AF' }}>
          Data filtered by: {activeFilters.join(' · ')} — figures shown are indicative for this segment.
        </p>
      )}

      {role === 'Director'   && <DirectorView />}
      {role === 'Manager'    && <ManagerView />}
      {role === 'Finance'    && <FinanceView />}
      {role === 'Operations' && <OperationsView />}
    </PageShell>
  )
}
