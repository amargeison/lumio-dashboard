'use client'

import React, { useState, useEffect } from 'react'
import { EmptyState } from '@/app/(schools)/components/EmptyState'
import { Plus, Play, History, Link, HelpCircle, Sparkles } from 'lucide-react'

function StatCard({ label, value, sub, color = '#0D9488' }: { label: string; value: string; sub: string; color?: string }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <p className="text-xs font-medium" style={{ color: '#9CA3AF' }}>{label}</p>
      <p className="text-2xl font-black mt-1" style={{ color }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{sub}</p>
    </div>
  )
}

function AIHighlights({ items }: { items: string[] }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(13,148,136,0.4)' }}>
      <div className="flex items-center gap-2 px-4 py-3" style={{ backgroundColor: 'rgba(13,148,136,0.08)', borderBottom: '1px solid rgba(13,148,136,0.2)' }}>
        <Sparkles size={14} style={{ color: '#0D9488' }} />
        <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>AI Key Highlights</span>
        <span className="text-xs ml-auto" style={{ color: '#6B7280' }}>Updated just now</span>
      </div>
      <div className="flex flex-col gap-3 p-4" style={{ backgroundColor: '#07080F' }}>
        {items.map((item, i) => (
          <div key={i} className="flex gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488' }}>{i + 1}</span>
            <p className="text-xs leading-relaxed" style={{ color: '#D1D5DB' }}>{item}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function QuickActions({ actions }: { actions: { label: string; icon: React.ReactNode }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(a => (
        <button key={a.label} className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#0F766E')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#0D9488')}>
          {a.icon}{a.label}
        </button>
      ))}
    </div>
  )
}

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return <span className="rounded-md px-2 py-0.5 text-xs font-semibold" style={{ color, backgroundColor: bg }}>{label}</span>
}

type WorkflowStatus = 'ACTIVE' | 'ACTION' | 'PAUSED' | 'RUNNING'

interface Workflow {
  name: string
  description: string
  schedule: string
  lastRun: string
  status: WorkflowStatus
  statusNote?: string
}

interface Department {
  name: string
  workflows: Workflow[]
}

const departments: Department[] = [
  {
    name: 'School Office',
    workflows: [
      { name: 'Daily Absence Alert', description: 'Auto-notifies office team of registered absences at 7:30am', schedule: 'Runs daily', lastRun: 'Today 7:32am', status: 'ACTIVE' },
      { name: 'Parent Communication Sender', description: 'Sends templated messages to parents via email/SMS', schedule: 'On demand', lastRun: '22 Mar', status: 'ACTIVE' },
      { name: 'Trip Permission Tracker', description: 'Tracks and chases outstanding trip permission forms', schedule: 'Scheduled', lastRun: '21 Mar', status: 'ACTIVE' },
      { name: 'New Admission Workflow', description: 'Creates pupil record, sends welcome pack, notifies class teacher', schedule: 'On demand', lastRun: '20 Mar', status: 'ACTIVE' },
    ],
  },
  {
    name: 'HR & Staff',
    workflows: [
      { name: 'DBS Expiry Monitor', description: 'Checks DBS expiry dates weekly and sends renewal reminders', schedule: 'Weekly Mon', lastRun: 'Today 8:00am', status: 'ACTION', statusNote: 'M. Taylor' },
      { name: 'Cover Booking Notifier', description: 'Notifies staff of cover bookings and class details', schedule: 'On demand', lastRun: 'Today 8:14am', status: 'ACTIVE' },
      { name: 'Performance Review Scheduler', description: 'Creates review tasks and sends calendar invites', schedule: 'Termly', lastRun: 'Jan 2026', status: 'ACTIVE' },
      { name: 'Staff Absence Logger', description: 'Logs absence, arranges cover, notifies relevant staff', schedule: 'On demand', lastRun: 'Today', status: 'ACTIVE' },
    ],
  },
  {
    name: 'Curriculum',
    workflows: [
      { name: 'Lesson Plan Reminder', description: 'Weekly reminder to teaching staff to submit lesson plans', schedule: 'Weekly Fri', lastRun: '21 Mar', status: 'ACTIVE' },
      { name: 'Assessment Due Alert', description: 'Notifies teachers of upcoming assessment deadlines', schedule: 'Weekly', lastRun: '17 Mar', status: 'ACTIVE' },
      { name: 'Parents Evening Booking', description: 'Opens booking slots and sends reminders to families', schedule: 'Scheduled', lastRun: '15 Mar', status: 'ACTIVE' },
      { name: 'Cover Work Generator', description: 'AI-generates cover work based on topic and year group', schedule: 'On demand', lastRun: 'Today', status: 'ACTIVE' },
    ],
  },
  {
    name: 'SEND & DSL',
    workflows: [
      { name: 'EHCP Review Reminder', description: 'Alerts SENCO 8 weeks before EHCP annual review deadline', schedule: 'Monthly', lastRun: '1 Mar', status: 'ACTIVE' },
      { name: 'Attendance Concern Escalator', description: 'Flags pupils below 85% and drafts escalation letters', schedule: 'Weekly', lastRun: '17 Mar', status: 'ACTIVE' },
      { name: 'Safeguarding Log Sync', description: 'Syncs daily concern logs to secure safeguarding record', schedule: 'Daily', lastRun: 'Today 8:30am', status: 'RUNNING' },
      { name: 'KCSIE Compliance Checker', description: 'Annual sign-off tracker for all staff', schedule: 'Annual', lastRun: 'Sep 2025', status: 'ACTIVE' },
    ],
  },
  {
    name: 'Finance',
    workflows: [
      { name: 'Invoice Approval Reminder', description: 'Chases finance approvers for outstanding invoices', schedule: 'Weekly', lastRun: '17 Mar', status: 'PAUSED', statusNote: 'needs email config' },
      { name: 'Pupil Premium Tracker', description: 'Monthly spend update against PP allocation', schedule: 'Monthly', lastRun: '1 Mar', status: 'ACTIVE' },
    ],
  },
  {
    name: 'Facilities',
    workflows: [
      { name: 'Maintenance Job Logger', description: 'Creates job tickets and notifies site manager', schedule: 'On demand', lastRun: '22 Mar', status: 'ACTIVE' },
      { name: 'Compliance Certificate Alert', description: '30-day advance warning before cert expiry', schedule: 'Monthly', lastRun: '1 Mar', status: 'PAUSED', statusNote: 'needs config' },
    ],
  },
  {
    name: 'Safeguarding',
    workflows: [
      { name: 'DSL Review Scheduler', description: 'Daily check for open concerns requiring review', schedule: 'Daily 9am', lastRun: 'Today 9:00am', status: 'ACTION', statusNote: 'SG-047 overdue' },
      { name: 'Staff Training Tracker', description: 'Monitors completion of mandatory training', schedule: 'Monthly', lastRun: '1 Mar', status: 'ACTIVE' },
    ],
  },
  {
    name: 'Admissions',
    workflows: [
      { name: 'Enquiry Response', description: 'Auto-acknowledges new admissions enquiries via email', schedule: 'On demand', lastRun: '21 Mar', status: 'ACTIVE' },
      { name: 'Open Day Reminder', description: 'Sends reminder sequence to registered open day attendees', schedule: 'Scheduled', lastRun: '15 Mar', status: 'ACTIVE' },
    ],
  },
]

const statusConfig: Record<WorkflowStatus, { label: string; color: string; bg: string }> = {
  ACTIVE:  { label: 'Active',        color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  ACTION:  { label: 'Action Needed', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  PAUSED:  { label: 'Paused',        color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  RUNNING: { label: 'Running',       color: '#0D9488', bg: 'rgba(13,148,136,0.12)' },
}

const aiHighlights = [
  'DBS Reminder workflow triggered for M. Taylor — follow-up action still needed',
  'Daily absence alert ran successfully at 7:32am — 14 pupils flagged to office',
  'Safeguarding log sync is running — last completed 8:30am',
  '2 workflows paused awaiting configuration — email integration not connected',
]

const filterOptions: { label: string; value: WorkflowStatus | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Action Needed', value: 'ACTION' },
  { label: 'Paused', value: 'PAUSED' },
  { label: 'Running', value: 'RUNNING' },
]

function WorkflowCard({ workflow }: { workflow: Workflow }) {
  const cfg = statusConfig[workflow.status]
  return (
    <div className="rounded-xl p-4 flex flex-col gap-3" style={{ backgroundColor: '#07080F', border: '1px solid #1F2937' }}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-snug" style={{ color: '#F9FAFB' }}>{workflow.name}</p>
        <Badge label={cfg.label} color={cfg.color} bg={cfg.bg} />
      </div>
      <p className="text-xs leading-relaxed flex-1" style={{ color: '#9CA3AF' }}>{workflow.description}</p>
      {workflow.statusNote && (
        <p className="text-xs font-medium" style={{ color: cfg.color }}>— {workflow.statusNote}</p>
      )}
      <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid #1F2937' }}>
        <div className="text-xs space-y-0.5">
          <p style={{ color: '#6B7280' }}>Schedule: <span style={{ color: '#D1D5DB' }}>{workflow.schedule}</span></p>
          <p style={{ color: '#6B7280' }}>Last run: <span style={{ color: '#D1D5DB' }}>{workflow.lastRun}</span></p>
        </div>
        <button
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
          style={{ backgroundColor: 'rgba(13,148,136,0.1)', color: '#0D9488', border: '1px solid rgba(13,148,136,0.2)' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(13,148,136,0.2)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(13,148,136,0.1)')}>
          <Play size={10} /> Run
        </button>
      </div>
    </div>
  )
}

export default function WorkflowsPage() {
  const [hasData, setHasData] = useState<boolean | null>(null)
  const [statusFilter, setStatusFilter] = useState<WorkflowStatus | 'ALL'>('ALL')

  useEffect(() => {
    const pathname = window.location.pathname
    const slugMatch = pathname.match(/\/schools\/([^/]+)/)
    const slug = slugMatch?.[1] ?? 'school'
    setHasData(
      localStorage.getItem(`lumio_${slug}_workflows_hasData`) === 'true' ||
      localStorage.getItem('lumio_schools_demo_loaded') === 'true'
    )
  }, [])

  if (hasData === null) return null
  if (!hasData) return <EmptyState pageName="workflows" title="Workflows — Coming Soon" description="This section is being set up. Use demo data to explore what's possible." uploads={[
    { key: 'data', label: 'Upload Data (CSV)' },
    { key: 'mis', label: 'Connect Data Source' },
  ]} />

  const totalWorkflows = departments.reduce((sum, d) => sum + d.workflows.length, 0)
  const activeCount = departments.reduce((sum, d) => sum + d.workflows.filter(w => w.status === 'ACTIVE').length, 0)
  const actionCount = departments.reduce((sum, d) => sum + d.workflows.filter(w => w.status === 'ACTION').length, 0)
  const pausedCount = departments.reduce((sum, d) => sum + d.workflows.filter(w => w.status === 'PAUSED').length, 0)

  const filteredDepartments = departments
    .map(dept => ({
      ...dept,
      workflows: statusFilter === 'ALL' ? dept.workflows : dept.workflows.filter(w => w.status === statusFilter),
    }))
    .filter(dept => dept.workflows.length > 0)

  return (
    <div className="min-h-screen p-6 space-y-6" style={{ backgroundColor: '#07080F' }}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black" style={{ color: '#F9FAFB' }}>Workflow Automation</h1>
        <p className="text-sm mt-1" style={{ color: '#6B7280' }}>School-specific automated workflows organised by department</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Workflows" value={String(totalWorkflows)} sub="Automated" />
        <StatCard label="Ran Today" value="8" sub="Successful" />
        <StatCard label="Pending Action" value={String(actionCount + pausedCount)} sub="Need attention" color="#EF4444" />
        <StatCard label="Time Saved" value="14h" sub="this month" />
      </div>

      {/* Quick Actions */}
      <QuickActions actions={[
        { label: 'New Workflow', icon: <Plus size={14} /> },
        { label: 'Run Workflow', icon: <Play size={14} /> },
        { label: 'View History', icon: <History size={14} /> },
        { label: 'Connect Integration', icon: <Link size={14} /> },
        { label: 'Help', icon: <HelpCircle size={14} /> },
      ]} />

      {/* AI Highlights */}
      <AIHighlights items={aiHighlights} />

      {/* Status summary bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Active', count: activeCount, color: '#22C55E', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)' },
          { label: 'Running', count: 1, color: '#0D9488', bg: 'rgba(13,148,136,0.08)', border: 'rgba(13,148,136,0.2)' },
          { label: 'Action Needed', count: actionCount, color: '#EF4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
          { label: 'Paused', count: pausedCount, color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
        ].map(item => (
          <div key={item.label} className="rounded-xl p-3 text-center"
            style={{ backgroundColor: item.bg, border: `1px solid ${item.border}` }}>
            <p className="text-2xl font-black" style={{ color: item.color }}>{item.count}</p>
            <p className="text-xs mt-0.5" style={{ color: item.color }}>{item.label}</p>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium mr-1" style={{ color: '#6B7280' }}>Filter:</span>
        {filterOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              backgroundColor: statusFilter === opt.value ? '#0D9488' : '#111318',
              color: statusFilter === opt.value ? '#F9FAFB' : '#9CA3AF',
              border: `1px solid ${statusFilter === opt.value ? '#0D9488' : '#1F2937'}`,
            }}>
            {opt.label}
          </button>
        ))}
        <span className="ml-auto text-xs" style={{ color: '#6B7280' }}>
          Showing {filteredDepartments.reduce((s, d) => s + d.workflows.length, 0)} of {totalWorkflows} workflows
        </span>
      </div>

      {/* Department Groups */}
      <div className="space-y-8">
        {filteredDepartments.map(dept => (
          <div key={dept.name}>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#2DD4BF' }}>{dept.name}</h2>
              <div className="flex-1 h-px" style={{ backgroundColor: '#1F2937' }} />
              <span className="text-xs" style={{ color: '#6B7280' }}>{dept.workflows.length} workflow{dept.workflows.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {dept.workflows.map(wf => (
                <WorkflowCard key={wf.name} workflow={wf} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredDepartments.length === 0 && (
        <div className="rounded-xl p-12 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <p className="text-sm font-medium" style={{ color: '#6B7280' }}>No workflows match the selected filter.</p>
        </div>
      )}
    </div>
  )
}
