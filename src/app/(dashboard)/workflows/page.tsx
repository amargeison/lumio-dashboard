'use client'

import { GitBranch, Activity, Clock, AlertCircle, Plus, Play, FileText, Download } from 'lucide-react'
import { StatCard, QuickActions, Badge, SectionCard, Table, PanelItem, PageShell, TwoCol } from '@/components/page-ui'

const stats = [
  { label: 'Total Workflows',    value: '47',   trend: '+5',   trendDir: 'up' as const, trendGood: true,  icon: GitBranch,   sub: 'vs last month'  },
  { label: 'Active',             value: '38',   trend: '+3',   trendDir: 'up' as const, trendGood: true,  icon: Activity,    sub: 'currently live' },
  { label: 'Last 24hr Runs',     value: '312',  trend: '+28%', trendDir: 'up' as const, trendGood: true,  icon: Clock,       sub: 'vs prior day'   },
  { label: 'Errors',             value: '3',    trend: '+1',   trendDir: 'up' as const, trendGood: false, icon: AlertCircle, sub: 'vs yesterday'   },
]

const actions = [
  { label: 'New Workflow', icon: Plus      },
  { label: 'Run Now',      icon: Play      },
  { label: 'View Logs',    icon: FileText  },
  { label: 'Export Report',icon: Download  },
]

const workflows: {
  name: string; dept: string; status: string; lastRun: string; runs: number; errors: number
}[] = [
  // HR
  { name: 'New Joiner Onboarding',      dept: 'HR',       status: 'Enabled', lastRun: '14 min ago', runs: 248, errors: 0 },
  { name: 'Offboarding Checklist',      dept: 'HR',       status: 'Enabled', lastRun: '3 days ago', runs: 41,  errors: 0 },
  { name: 'Probation Review Reminder',  dept: 'HR',       status: 'Enabled', lastRun: '1 day ago',  runs: 18,  errors: 0 },
  { name: 'Leave Approval Flow',        dept: 'HR',       status: 'Enabled', lastRun: '2 hrs ago',  runs: 134, errors: 0 },
  // Sales
  { name: 'Trial Follow-up Day 3',      dept: 'Sales',    status: 'Enabled', lastRun: 'Just now',   runs: 312, errors: 1 },
  { name: 'Trial Follow-up Day 7',      dept: 'Sales',    status: 'Enabled', lastRun: '4 hrs ago',  runs: 289, errors: 0 },
  { name: 'Deal Stage Notification',    dept: 'Sales',    status: 'Enabled', lastRun: '1 hr ago',   runs: 97,  errors: 0 },
  { name: 'Renewal Alert 90d',          dept: 'Sales',    status: 'Enabled', lastRun: '6 hrs ago',  runs: 54,  errors: 0 },
  // Support
  { name: 'SLA Breach Alert',           dept: 'Support',  status: 'Enabled', lastRun: '22 min ago', runs: 88,  errors: 1 },
  { name: 'CSAT Survey Post-Ticket',    dept: 'Support',  status: 'Enabled', lastRun: '1 hr ago',   runs: 421, errors: 0 },
  { name: 'P1 Escalation Flow',         dept: 'Support',  status: 'Enabled', lastRun: '3 hrs ago',  runs: 23,  errors: 0 },
  // Accounts
  { name: 'Invoice Chase 30d',          dept: 'Accounts', status: 'Enabled', lastRun: '8 min ago',  runs: 67,  errors: 1 },
  { name: 'Payment Received Notify',    dept: 'Accounts', status: 'Enabled', lastRun: '2 hrs ago',  runs: 203, errors: 0 },
  // Success
  { name: 'RAG Health Score Update',    dept: 'Success',  status: 'Enabled', lastRun: 'Just now',   runs: 181, errors: 0 },
  { name: 'Red Account Recovery Flow',  dept: 'Success',  status: 'Disabled',lastRun: '2 days ago', runs: 12,  errors: 0 },
  // IT
  { name: 'New Joiner IT Provisioning', dept: 'IT',       status: 'Enabled', lastRun: '14 min ago', runs: 248, errors: 0 },
  { name: 'Licence Renewal Alert',      dept: 'IT',       status: 'Enabled', lastRun: '1 day ago',  runs: 34,  errors: 0 },
  // Marketing
  { name: 'Lead Score Update',          dept: 'Marketing',status: 'Enabled', lastRun: '30 min ago', runs: 156, errors: 0 },
  { name: 'Webinar Reminder Sequence',  dept: 'Marketing',status: 'Disabled',lastRun: '5 days ago', runs: 8,   errors: 0 },
]

const errors = [
  { name: 'Trial Follow-up Day 3',   time: '2 hrs ago',  reason: 'Email API timeout — hopscotch.co.uk',   badge: 'Error' },
  { name: 'SLA Breach Alert',        time: '3 hrs ago',  reason: 'Ticket lookup returned null',           badge: 'Error' },
  { name: 'Invoice Chase 30d',       time: '8 min ago',  reason: 'Customer not found in Xero',           badge: 'Error' },
]

const runHistory = [
  { name: 'RAG Health Score Update',    time: 'Just now',   status: 'Complete' },
  { name: 'Trial Follow-up Day 3',      time: 'Just now',   status: 'Running'  },
  { name: 'New Joiner Onboarding',      time: '14 min ago', status: 'Complete' },
  { name: 'New Joiner IT Provisioning', time: '14 min ago', status: 'Complete' },
  { name: 'Invoice Chase 30d',          time: '8 min ago',  status: 'Error'    },
  { name: 'SLA Breach Alert',           time: '22 min ago', status: 'Complete' },
]

export default function WorkflowsPage() {
  const depts = [...new Set(workflows.map((w) => w.dept))]

  return (
    <PageShell>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <QuickActions items={actions} />

      <TwoCol
        main={
          <div className="flex flex-col gap-4">
            {depts.map((dept) => (
              <SectionCard key={dept} title={dept}>
                <Table
                  cols={['Workflow', 'Status', 'Last Run', 'Runs', 'Errors']}
                  rows={workflows.filter((w) => w.dept === dept).map((w) => [
                    w.name,
                    <Badge key={w.name} status={w.status} />,
                    w.lastRun,
                    w.runs.toString(),
                    w.errors > 0
                      ? <span key={w.name + 'e'} style={{ color: '#EF4444' }}>{w.errors}</span>
                      : <span key={w.name + 'e'} style={{ color: '#9CA3AF' }}>0</span>,
                  ])}
                />
              </SectionCard>
            ))}
          </div>
        }
        side={
          <>
            <SectionCard title="Recent Errors">
              {errors.map((e) => (
                <PanelItem key={e.name} title={e.name} sub={e.reason} extra={e.time} badge={e.badge} />
              ))}
            </SectionCard>
            <SectionCard title="Run History">
              {runHistory.map((r) => (
                <PanelItem key={r.name + r.time} title={r.name} sub={r.time} badge={r.status} />
              ))}
            </SectionCard>
          </>
        }
      />
    </PageShell>
  )
}
