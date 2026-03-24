'use client'

import { useState } from 'react'
import {
  GitBranch,
  UserPlus,
  Headphones,
  AlertCircle,
  Plus,
  Users,
  FlaskConical,
  Receipt,
  TicketCheck,
  CheckCircle2,
  Loader2,
  CircleAlert,
  Circle,
  BookOpen,
  CalendarHeart,
  Target,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { StatCard } from '@/components/page-ui'
import { ChartSection, parseNum } from '@/components/chart-ui'
import PersonalBanner from './overview/components/PersonalBanner'
import DailyTabs from './overview/components/DailyTabs'
import MeetingsToday from './overview/components/MeetingsToday'
import MorningReview from './overview/components/MorningReview'
import QuickWins from './overview/components/QuickWins'
import DailyTasks from './overview/components/DailyTasks'
import Insights from './overview/components/Insights'
import NotToMiss from './overview/components/NotToMiss'
import TeamPanel from './overview/components/TeamPanel'

// ─── Types ────────────────────────────────────────────────────────────────────

type Trend = 'up' | 'down'
type WorkflowStatus = 'COMPLETE' | 'RUNNING' | 'ACTION'
type RAGStatus = 'green' | 'amber' | 'red'

// ─── Data ─────────────────────────────────────────────────────────────────────

const stats = [
  { label: 'Active Workflows',    value: '47', trend: '+12%', trendDir: 'up'   as Trend, trendGood: true,  icon: GitBranch,  sub: 'vs last 30d'    },
  { label: 'New Customers (30d)', value: '23', trend: '+8%',  trendDir: 'up'   as Trend, trendGood: true,  icon: UserPlus,   sub: 'vs prior period' },
  { label: 'Open Tickets',        value: '18', trend: '−5%',  trendDir: 'down' as Trend, trendGood: true,  icon: Headphones, sub: 'vs last 30d'    },
  { label: 'Overdue Invoices',    value: '7',  trend: '+2',   trendDir: 'up'   as Trend, trendGood: false, icon: AlertCircle,sub: 'since last week' },
]

const quickActions = [
  { label: 'New Joiner',        icon: Users,          href: '/hr/new-joiner'               },
  { label: 'New Customer',      icon: UserPlus,       href: '/sales/new-customer'          },
  { label: 'New Trial',         icon: FlaskConical,   href: '/trials/new'                  },
  { label: 'Chase Invoice',     icon: Receipt,        href: '/accounts/chase'              },
  { label: 'Support Ticket',    icon: TicketCheck,    href: '/support/new'                 },
  { label: 'Create Wiki',       icon: BookOpen,       href: '/operations/wiki'             },
  { label: 'Team Events',       icon: CalendarHeart,  href: '/hr/events'                   },
  { label: 'Competitor Watch',  icon: Target,         href: '/strategy/competitor-watch'   },
]

const workflowFeed: { id: number; name: string; customer: string; status: WorkflowStatus; ts: string }[] = [
  { id: 1,  name: 'Onboarding — Welcome sequence',   customer: 'Greenfield Academy',   status: 'COMPLETE', ts: '2 min ago'  },
  { id: 2,  name: 'Trial follow-up — Day 3',         customer: 'Hopscotch Learning',   status: 'RUNNING',  ts: 'Just now'   },
  { id: 3,  name: 'Invoice chase — 30d overdue',     customer: 'Bramble Hill Trust',   status: 'ACTION',   ts: '8 min ago'  },
  { id: 4,  name: 'New joiner IT provisioning',      customer: 'Internal',             status: 'COMPLETE', ts: '14 min ago' },
  { id: 5,  name: 'Health score alert — RAG Red',    customer: 'Whitestone College',   status: 'ACTION',   ts: '22 min ago' },
  { id: 6,  name: 'Renewal reminder — 60d notice',   customer: 'Oakridge Schools Ltd', status: 'COMPLETE', ts: '41 min ago' },
  { id: 7,  name: 'Support SLA breach — P1',         customer: 'Elmfield Institute',   status: 'ACTION',   ts: '1 hr ago'   },
  { id: 8,  name: 'Onboarding — Training kickoff',   customer: 'Crestview Academy',    status: 'COMPLETE', ts: '1 hr ago'   },
  { id: 9,  name: 'Trial conversion — Upsell flow',  customer: 'Pinebrook Primary',    status: 'RUNNING',  ts: '2 hr ago'   },
  { id: 10, name: 'Marketing drip — NPS follow-up',  customer: 'Sunfield Trust',       status: 'COMPLETE', ts: '3 hr ago'   },
]

const ragCounts: { status: RAGStatus; count: number; label: string }[] = [
  { status: 'green', count: 142, label: 'Healthy'  },
  { status: 'amber', count: 31,  label: 'At Risk'  },
  { status: 'red',   count: 8,   label: 'Critical' },
]

// ─── Morning AI Summary ───────────────────────────────────────────────────────

const morningHighlights = [
  'You have 4 meetings today — first up: New Customer Demo with Oakridge Schools at 9am (happening in 45 min)',
  '12 emails overnight — 2 marked urgent, including one from Apex Consulting re: renewal',
  '3 workflows need your attention — Support SLA breach at Pinebrook Primary is highest priority',
  'Monthly MRR at £41,993 — up 12% on last month, on track for £500k ARR',
  'New customer trial conversion yesterday — Sunfield Trust now a paying customer 🎉',
  'Team standup at 5pm — 2 team members on leave today, consider cover for afternoon support queue',
]

function MorningAIPanel() {
  const [open, setOpen] = useState(true)
  const now = new Date()
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const dayLabel = `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]}`
  return (
    <div className="overflow-hidden rounded-xl" style={{ border: '1px solid #6C3FC5' }}>
        <button
          className="flex w-full items-center justify-between px-5 py-4"
          style={{ backgroundColor: 'rgba(108,63,197,0.08)', borderBottom: open ? '1px solid rgba(108,63,197,0.3)' : undefined }}
          onClick={() => setOpen((v) => !v)}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={14} style={{ color: '#6C3FC5' }} />
            <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>AI Morning Summary</span>
            <span className="rounded-md px-2 py-0.5 text-xs font-semibold"
              style={{ backgroundColor: 'rgba(108,63,197,0.2)', color: '#A78BFA' }}>{dayLabel}</span>
          </div>
          {open
            ? <ChevronUp size={14} style={{ color: '#6C3FC5' }} />
            : <ChevronDown size={14} style={{ color: '#6C3FC5' }} />}
        </button>
        {open && (
          <div className="flex flex-col gap-3 p-5 overflow-y-auto" style={{ backgroundColor: '#0f0e17', maxHeight: '12rem' }}>
            {morningHighlights.map((item, i) => (
              <div key={i} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{ backgroundColor: 'rgba(108,63,197,0.2)', color: '#A78BFA' }}>{i + 1}</span>
                <p className="text-xs leading-relaxed" style={{ color: '#C4B5FD' }}>{item}</p>
              </div>
            ))}
          </div>
        )}
      </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: WorkflowStatus }) {
  const cfg = {
    COMPLETE: { label: 'COMPLETE', color: '#22C55E', bg: 'rgba(34,197,94,0.12)',  Icon: CheckCircle2 },
    RUNNING:  { label: 'RUNNING',  color: '#0D9488', bg: 'rgba(13,148,136,0.12)', Icon: Loader2      },
    ACTION:   { label: 'ACTION',   color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  Icon: CircleAlert  },
  }[status]
  return (
    <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}>
      <cfg.Icon size={11} strokeWidth={2} />
      {cfg.label}
    </span>
  )
}

function RAGDot({ status }: { status: RAGStatus }) {
  const color = { green: '#22C55E', amber: '#F59E0B', red: '#EF4444' }[status]
  return <Circle size={10} fill={color} strokeWidth={0} style={{ color }} />
}

// ─── Home tab content (original overview) ─────────────────────────────────────

function HomeTab() {
  const total = ragCounts.reduce((s, r) => s + r.count, 0)
  return (
    <div className="flex flex-col gap-6">

      {/* Meetings + AI Summary */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MeetingsToday />
        </div>
        <div>
          <MorningAIPanel />
        </div>
      </div>

      {/* Stats */}
      <ChartSection points={stats.map(s => ({ label: s.label, value: parseNum(s.value) }))}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      </ChartSection>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3 rounded-xl p-4"
        style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <p className="w-full text-xs font-semibold uppercase tracking-widest" style={{ color: '#9CA3AF' }}>
          Quick Actions
        </p>
        {quickActions.map(({ label, icon: Icon, href }) => (
          <a key={label} href={href}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#0F766E' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#0D9488' }}
          >
            <Icon size={15} strokeWidth={2} />
            {label}
          </a>
        ))}
      </div>

      {/* Feed + RAG */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Workflow feed */}
        <div className="flex flex-col rounded-xl lg:col-span-2"
          style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Workflow Activity</p>
            <a href="/workflows" className="text-xs font-medium" style={{ color: '#0D9488' }}>View all →</a>
          </div>
          {workflowFeed.map((run, i) => (
            <div key={run.id} className="flex items-center gap-4 px-5 py-3"
              style={{ borderBottom: i < workflowFeed.length - 1 ? '1px solid #1F2937' : undefined }}>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="truncate text-sm font-medium" style={{ color: '#F9FAFB' }}>{run.name}</p>
                <p className="truncate text-xs" style={{ color: '#9CA3AF' }}>{run.customer}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <StatusBadge status={run.status} />
                <p className="text-xs" style={{ color: '#9CA3AF' }}>{run.ts}</p>
              </div>
            </div>
          ))}
        </div>

        {/* RAG summary */}
        <div className="flex flex-col rounded-xl"
          style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #1F2937' }}>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Customer Health</p>
            <p className="mt-0.5 text-xs" style={{ color: '#9CA3AF' }}>{total} accounts tracked</p>
          </div>

          <div className="flex flex-col gap-4 p-5">
            {ragCounts.map(({ status, count, label }) => {
              const pct = Math.round((count / total) * 100)
              const barColor = { green: '#22C55E', amber: '#F59E0B', red: '#EF4444' }[status]
              return (
                <div key={status} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RAGDot status={status} />
                      <span className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{label}</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-bold" style={{ color: '#F9FAFB' }}>{count}</span>
                      <span className="text-xs" style={{ color: '#9CA3AF' }}>{pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: '#1F2937' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-auto grid grid-cols-3 py-4" style={{ borderTop: '1px solid #1F2937' }}>
            {ragCounts.map(({ status, count, label }) => {
              const color = { green: '#22C55E', amber: '#F59E0B', red: '#EF4444' }[status]
              return (
                <div key={status} className="flex flex-col items-center gap-0.5 px-2">
                  <span className="text-xl font-bold" style={{ color }}>{count}</span>
                  <span className="text-xs" style={{ color: '#9CA3AF' }}>{label}</span>
                </div>
              )
            })}
          </div>

          <div className="px-5 pb-4">
            <a href="/success"
              className="block w-full rounded-lg py-2 text-center text-sm font-medium"
              style={{ backgroundColor: '#07080F', color: '#9CA3AF', border: '1px solid #1F2937' }}>
              View RAG Dashboard →
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'home' | 'quick-wins' | 'tasks' | 'insights' | 'not-to-miss' | 'team'

export default function OverviewPage() {
  const [activeTab, setActiveTab] = useState<Tab>('home')

  return (
    <div className="flex flex-col">
      <PersonalBanner />
      <div className="px-4 pt-3 sm:px-6">
        <MorningReview />
      </div>
      <DailyTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="px-4 py-4 sm:px-6">
        {activeTab === 'home'        && <HomeTab />}
        {activeTab === 'quick-wins'  && <QuickWins />}
        {activeTab === 'tasks'       && <DailyTasks />}
        {activeTab === 'insights'    && <Insights />}
        {activeTab === 'not-to-miss' && <NotToMiss />}
        {activeTab === 'team'        && <TeamPanel />}
      </div>
    </div>
  )
}
