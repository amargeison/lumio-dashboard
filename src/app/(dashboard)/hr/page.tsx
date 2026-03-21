'use client'

import { Users, UserPlus, FileText, Star, AlertCircle } from 'lucide-react'
import { StatCard, QuickActions, Badge, SectionCard, Table, PanelItem, PageShell, TwoCol } from '@/components/page-ui'
import { ChartSection, parseNum } from '@/components/chart-ui'

const stats = [
  { label: 'Total Employees',   value: '187', trend: '+3',    trendDir: 'up'   as const, trendGood: true,  icon: Users,       sub: 'vs last month' },
  { label: 'Active Onboardings',value: '8',   trend: '+2',    trendDir: 'up'   as const, trendGood: true,  icon: UserPlus,    sub: 'this month'    },
  { label: 'Leave Requests',    value: '14',  trend: '+4',    trendDir: 'up'   as const, trendGood: false, icon: FileText,    sub: 'pending'       },
  { label: 'Overdue Reviews',   value: '3',   trend: '+1',    trendDir: 'up'   as const, trendGood: false, icon: AlertCircle, sub: 'vs last week'  },
]

const actions = [
  { label: 'New Starter',     icon: UserPlus  },
  { label: 'Offboarding',     icon: Users     },
  { label: 'Leave Request',   icon: FileText  },
  { label: 'Nominate Award',  icon: Star      },
  { label: 'Payroll Query',   icon: AlertCircle },
  { label: 'HR Report',       icon: FileText  },
]

const starters = [
  { name: 'Sophie Williams',   role: 'Customer Success Manager',  start: '10 Mar 2026', day: 'Day 11', progress: 75, status: 'Onboarding' },
  { name: 'James Okafor',      role: 'Sales Development Rep',     start: '03 Mar 2026', day: 'Day 18', progress: 90, status: 'Onboarding' },
  { name: 'Priya Kapoor',      role: 'Frontend Developer',        start: '17 Mar 2026', day: 'Day 4',  progress: 30, status: 'Onboarding' },
  { name: 'Tom Ashworth',      role: 'Marketing Executive',       start: '17 Mar 2026', day: 'Day 4',  progress: 25, status: 'Onboarding' },
  { name: 'Amara Diallo',      role: 'Support Specialist',        start: '24 Feb 2026', day: 'Day 25', progress: 100, status: 'Complete'  },
  { name: 'Oliver Chen',       role: 'Account Executive',         start: '24 Feb 2026', day: 'Day 25', progress: 100, status: 'Complete'  },
  { name: 'Fatima Al-Hassan',  role: 'Data Analyst',              start: '21 Apr 2026', day: 'Pending',progress: 0,   status: 'Pending'   },
  { name: 'Liam Brennan',      role: 'Head of Partnerships',      start: '07 Apr 2026', day: 'Pending',progress: 0,   status: 'Pending'   },
]

function ProgressBar({ pct }: { pct: number }) {
  const color = pct === 100 ? '#22C55E' : pct >= 50 ? '#0D9488' : '#F59E0B'
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full" style={{ backgroundColor: '#1F2937' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs" style={{ color: '#9CA3AF' }}>{pct}%</span>
    </div>
  )
}

const leaveRequests = [
  { name: 'Marcus Reid',     type: 'Annual Leave',  dates: '28 Mar – 1 Apr',  days: '5 days'  },
  { name: 'Nadia Petrov',    type: 'Sick Leave',    dates: '21 Mar',           days: '1 day'   },
  { name: 'Chris Ogunleye',  type: 'Annual Leave',  dates: '7–11 Apr',         days: '5 days'  },
  { name: 'Yuki Tanaka',     type: 'Parental',      dates: '1 May – 31 Jul',   days: '3 months'},
]

const probations = [
  { name: 'Amara Diallo',  date: '24 Mar 2026', manager: 'Laura Simmons' },
  { name: 'Oliver Chen',   date: '24 Mar 2026', manager: 'Dan Marsh'     },
  { name: 'James Okafor',  date: '3 Apr 2026',  manager: 'Dan Marsh'     },
]

export default function HRPage() {
  return (
    <PageShell>
      <ChartSection points={stats.map(s => ({ label: s.label, value: parseNum(s.value) }))}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      </ChartSection>

      <QuickActions items={actions} />

      <TwoCol
        main={
          <SectionCard title="New Starter Onboarding Tracker" action="View all">
            <Table
              cols={['Name', 'Role', 'Start Date', 'Day', 'Progress', 'Status']}
              rows={starters.map((s) => [
                s.name, s.role, s.start, s.day,
                <ProgressBar key={s.name} pct={s.progress} />,
                <Badge key={s.name} status={s.status} />,
              ])}
            />
          </SectionCard>
        }
        side={
          <>
            <SectionCard title="Leave Requests — Pending Approval">
              {leaveRequests.map((r) => (
                <PanelItem key={r.name} title={r.name} sub={`${r.type} · ${r.dates}`} extra={r.days} badge="Pending" />
              ))}
            </SectionCard>
            <SectionCard title="Upcoming Probation Reviews">
              {probations.map((p) => (
                <PanelItem key={p.name} title={p.name} sub={p.date} extra={`Manager: ${p.manager}`} badge="In Review" />
              ))}
            </SectionCard>
          </>
        }
      />
    </PageShell>
  )
}
