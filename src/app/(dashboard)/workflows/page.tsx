'use client'

import { useState } from 'react'
import { GitBranch, Activity, Clock, AlertCircle, Plus, Play, FileText, Download, Loader2, CheckCircle2, XCircle, Star, Building2, Sparkles } from 'lucide-react'
import { StatCard, QuickActions, Badge, SectionCard, Table, PanelItem, PageShell, TwoCol } from '@/components/page-ui'
import DeptAISummary from '@/components/DeptAISummary'
import DeptInfoModal from '@/components/DeptInfoModal'
import AIInsightsReport from '@/components/AIInsightsReport'
import { DashboardEmptyState, useHasDashboardData } from '@/components/dashboard/EmptyState'
import { useToast } from '@/components/modals/useToast'

// ─── Types ────────────────────────────────────────────────────────────────────

type RunStatus = 'idle' | 'running' | 'complete' | 'error'

// ─── Static data ──────────────────────────────────────────────────────────────

const stats = [
  { label: 'Total Workflows',    value: '47',   trend: '+5',   trendDir: 'up' as const, trendGood: true,  icon: GitBranch,   sub: 'vs last month'  },
  { label: 'Active',             value: '38',   trend: '+3',   trendDir: 'up' as const, trendGood: true,  icon: Activity,    sub: 'currently live' },
  { label: 'Last 24hr Runs',     value: '312',  trend: '+28%', trendDir: 'up' as const, trendGood: true,  icon: Clock,       sub: 'vs prior day'   },
  { label: 'Errors',             value: '3',    trend: '+1',   trendDir: 'up' as const, trendGood: false, icon: AlertCircle, sub: 'vs yesterday'   },
]

// ─── HR wired workflows ───────────────────────────────────────────────────────

const HR_WIRED: { name: string; route: string; lastRun: string; runs: number }[] = [
  { name: 'New Joiner Onboarding',     route: '/api/workflows/new-joiner-onboarding', lastRun: '14 min ago', runs: 248 },
  { name: 'Offboarding Checklist',     route: '/api/workflows/offboarding-checklist', lastRun: '3 days ago', runs: 41  },
  { name: 'Probation Review Reminder', route: '/api/workflows/probation-review',      lastRun: '1 day ago',  runs: 18  },
  { name: 'Leave Approval Flow',       route: '/api/workflows/leave-approval',        lastRun: '2 hrs ago',  runs: 134 },
]

// ─── Non-wired display workflows ─────────────────────────────────────────────

const OTHER_WORKFLOWS: {
  name: string; dept: string; status: string; lastRun: string; runs: number; errors: number
}[] = [
  // Sales
  { name: 'Trial Follow-up Day 3',      dept: 'Sales',    status: 'Enabled',  lastRun: 'Just now',   runs: 312, errors: 1 },
  { name: 'Trial Follow-up Day 7',      dept: 'Sales',    status: 'Enabled',  lastRun: '4 hrs ago',  runs: 289, errors: 0 },
  { name: 'Deal Stage Notification',    dept: 'Sales',    status: 'Enabled',  lastRun: '1 hr ago',   runs: 97,  errors: 0 },
  { name: 'Renewal Alert 90d',          dept: 'Sales',    status: 'Enabled',  lastRun: '6 hrs ago',  runs: 54,  errors: 0 },
  // Support
  { name: 'SLA Breach Alert',           dept: 'Support',  status: 'Enabled',  lastRun: '22 min ago', runs: 88,  errors: 1 },
  { name: 'CSAT Survey Post-Ticket',    dept: 'Support',  status: 'Enabled',  lastRun: '1 hr ago',   runs: 421, errors: 0 },
  { name: 'P1 Escalation Flow',         dept: 'Support',  status: 'Enabled',  lastRun: '3 hrs ago',  runs: 23,  errors: 0 },
  // Accounts
  { name: 'Invoice Chase 30d',          dept: 'Accounts', status: 'Enabled',  lastRun: '8 min ago',  runs: 67,  errors: 1 },
  { name: 'Payment Received Notify',    dept: 'Accounts', status: 'Enabled',  lastRun: '2 hrs ago',  runs: 203, errors: 0 },
  // Success
  { name: 'RAG Health Score Update',    dept: 'Success',  status: 'Enabled',  lastRun: 'Just now',   runs: 181, errors: 0 },
  { name: 'Red Account Recovery Flow',  dept: 'Success',  status: 'Disabled', lastRun: '2 days ago', runs: 12,  errors: 0 },
  // IT
  { name: 'New Joiner IT Provisioning', dept: 'IT',       status: 'Enabled',  lastRun: '14 min ago', runs: 248, errors: 0 },
  { name: 'Licence Renewal Alert',      dept: 'IT',       status: 'Enabled',  lastRun: '1 day ago',  runs: 34,  errors: 0 },
  // Marketing
  { name: 'Lead Score Update',          dept: 'Marketing',status: 'Enabled',  lastRun: '30 min ago', runs: 156, errors: 0 },
  { name: 'Webinar Reminder Sequence',  dept: 'Marketing',status: 'Disabled', lastRun: '5 days ago', runs: 8,   errors: 0 },
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

// ─── Run button ───────────────────────────────────────────────────────────────

function RunButton({ status, onClick }: { status: RunStatus; onClick: () => void }) {
  if (status === 'running') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg"
        style={{ backgroundColor: 'rgba(13,148,136,0.12)', color: '#0D9488' }}>
        <Loader2 size={11} className="animate-spin" /> Running…
      </span>
    )
  }
  if (status === 'complete') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg"
        style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#22C55E' }}>
        <CheckCircle2 size={11} /> Complete
      </span>
    )
  }
  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg"
        style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>
        <XCircle size={11} /> Error
      </span>
    )
  }
  return (
    <button onClick={onClick}
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all"
      style={{ backgroundColor: 'rgba(13,148,136,0.1)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.25)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(13,148,136,0.2)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(13,148,136,0.1)' }}>
      <Play size={10} fill="currentColor" /> Run
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkflowsPage() {
  const [runStatus, setRunStatus] = useState<Record<string, RunStatus>>({})
  const [showAIInsights, setShowAIInsights] = useState(false)
  const [showDeptInfo, setShowDeptInfo] = useState(false)
  const { showToast, Toast } = useToast()

  const actions = [
    { label: 'New Workflow',  icon: Plus,     onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'Run Now',       icon: Play,     onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'View Logs',     icon: FileText, onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'Export Report', icon: Download, onClick: () => showToast('Feature coming soon — we\'re building this now 🚀') },
    { label: 'Dept Insights', icon: Star, onClick: () => setShowAIInsights(true) },
    { label: 'Dept Info',    icon: Building2, onClick: () => setShowDeptInfo(true) },
  ]

  const hasData = useHasDashboardData('workflows')
  if (hasData === null) return null
  if (!hasData) return <DashboardEmptyState pageKey="workflows"
    title="No workflows configured yet"
    description="Lumio Workflows automates your repetitive tasks. Browse the template library and activate your first workflow to get started."
    uploads={[
      { key: 'workflows', label: 'Import Workflow Config (JSON)', accept: '.json' },
    ]}
  />

  async function runWorkflow(name: string, route: string) {
    setRunStatus(s => ({ ...s, [name]: 'running' }))
    try {
      const res = await fetch(route, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggered_from: 'workflows_library', timestamp: new Date().toISOString() }),
      })
      setRunStatus(s => ({ ...s, [name]: res.ok ? 'complete' : 'error' }))
    } catch {
      setRunStatus(s => ({ ...s, [name]: 'error' }))
    }
    setTimeout(() => setRunStatus(s => ({ ...s, [name]: 'idle' })), 5000)
  }

  const otherDepts = [...new Set(OTHER_WORKFLOWS.map(w => w.dept))]

  const wfHighlights = ['1,847 workflow executions this month — 0 critical failures', 'Most triggered: Invoice Chase (saves £2,400/month)', '3 workflows running slower than baseline', 'Automation coverage up to 67% across departments', '23 active workflows, 2 paused, 4 erroring']

  return (
    <PageShell title="Workflows" subtitle="Automations, integrations and workflow management">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        <DeptAISummary dept="workflows" portal="business" />
        <div className="rounded-xl p-5 flex flex-col" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} style={{ color: '#6C3FC5' }} />
            <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>AI Key Highlights</span>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(108,63,197,0.15)', color: '#A78BFA' }}>Workflows</span>
          </div>
          <ul className="space-y-2.5">
            {wfHighlights.map((h: string, i: number) => (
              <li key={i} className="flex items-start gap-3 text-sm" style={{ color: '#D1D5DB' }}>
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(108,63,197,0.2)', color: '#A78BFA' }}>{i + 1}</span>
                {h}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <QuickActions items={actions} />

      <TwoCol
        main={
          <div className="flex flex-col gap-4">

            {/* ── HR — wired to n8n ─────────────────────────────────────────── */}
            <SectionCard title="HR">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1F2937' }}>
                      {['Workflow', 'Status', 'Last Run', 'Runs', 'Errors', ''].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {HR_WIRED.map((w, i) => (
                      <tr key={w.name} style={{ borderBottom: i < HR_WIRED.length - 1 ? '1px solid #111318' : undefined }}>
                        <td className="px-4 py-3 font-medium" style={{ color: '#F9FAFB' }}>{w.name}</td>
                        <td className="px-4 py-3"><Badge status="Enabled" /></td>
                        <td className="px-4 py-3 text-xs" style={{ color: '#9CA3AF' }}>{w.lastRun}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: '#9CA3AF' }}>{w.runs}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: '#9CA3AF' }}>0</td>
                        <td className="px-4 py-3">
                          <RunButton
                            status={runStatus[w.name] ?? 'idle'}
                            onClick={() => runWorkflow(w.name, w.route)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            {/* ── All other departments — display only ──────────────────────── */}
            {otherDepts.map(dept => (
              <SectionCard key={dept} title={dept}>
                <Table
                  cols={['Workflow', 'Status', 'Last Run', 'Runs', 'Errors']}
                  rows={OTHER_WORKFLOWS.filter(w => w.dept === dept).map(w => [
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
              {errors.map(e => (
                <PanelItem key={e.name} title={e.name} sub={e.reason} extra={e.time} badge={e.badge} />
              ))}
            </SectionCard>
            <SectionCard title="Run History">
              {runHistory.map(r => (
                <PanelItem key={r.name + r.time} title={r.name} sub={r.time} badge={r.status} />
              ))}
            </SectionCard>
          </>
        }
      />
      <AIInsightsReport dept="workflows" portal="business" isOpen={showAIInsights} onClose={() => setShowAIInsights(false)} />
      <Toast />
      {showDeptInfo && <DeptInfoModal dept="workflows" onClose={() => setShowDeptInfo(false)} />}
    </PageShell>
  )
}
