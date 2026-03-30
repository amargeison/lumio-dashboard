'use client'

import { useState } from 'react'
import { Sparkles, AlertCircle, CheckCircle2, Clock, Target, Users, Layers, BarChart3, Filter, Plus } from 'lucide-react'

const BG = '#111318'
const BORDER = '#1F2937'

const PROJECTS = [
  { code: 'LSP', name: 'Lumio Schools Portal', status: 'In Progress', priority: 'Critical', progress: 68, blocked: 1, tasks: '14/21', deadline: 'Apr 30', budget: '£61k/£85k', lead: 'Sophie W.', color: '#EF4444' },
  { code: 'CPR', name: 'CRM Pipeline Rebuild', status: 'In Progress', priority: 'High', progress: 41, blocked: 3, tasks: '8/19', deadline: 'May 15', budget: '£20k/£32k', lead: 'James O.', color: '#F59E0B' },
  { code: 'MAU', name: 'Marketing Automation', status: 'In Review', priority: 'High', progress: 89, blocked: 0, tasks: '17/19', deadline: 'Mar 31', budget: '£17k/£18k', lead: 'Charlotte D.', color: '#F59E0B' },
  { code: 'MAM', name: 'Mobile App MVP ⚠️', status: 'Blocked', priority: 'Medium', progress: 22, blocked: 8, tasks: '4/18', deadline: 'Jun 30', budget: '£28k/£120k', lead: 'Marcus B.', color: '#3B82F6' },
  { code: 'APD', name: 'API v2 Documentation', status: 'To Do', priority: 'Low', progress: 5, blocked: 0, tasks: '1/12', deadline: 'May 30', budget: '£0k/£8k', lead: 'James O.', color: '#6B7280' },
  { code: 'ESS', name: 'Enterprise SSO Integration', status: 'Backlog', priority: 'Medium', progress: 0, blocked: 0, tasks: '0/18', deadline: 'Q3 2026', budget: '£0k/£45k', lead: 'TBD', color: '#3B82F6' },
]

const BLOCKED_TASKS = [
  { project: 'LSP', task: 'Supabase RLS migration — waiting on DevOps to configure row-level security policies', assignee: 'Priya K.', days: 4, severity: 'Critical' },
  { project: 'CPR', task: 'Stripe webhook handler — payment provider API key expired, needs renewal from Finance', assignee: 'Tom A.', days: 7, severity: 'High' },
]

const TABS = ['Overview', 'Board (3)', 'Sprint', 'Roadmap', 'OKRs (1)', 'Backlog', 'Risks (4)', 'Team'] as const

const PM_INSIGHTS = [
  '📊 Sprint 8 is 69% complete with 4 days remaining — on track for deadline',
  '🔴 2 critical blockers: Supabase RLS migration (LSP) and Stripe webhook (CPR) need urgent attention',
  '✅ Marketing Automation project at 89% — on schedule for Mar 31 handoff to client success',
  '⚠️ Mobile App MVP has 8 blocked tasks — recommend scope reduction or deadline extension to Q3',
  '📈 Team velocity stable at 38pts/sprint — consistent with 4-sprint average of 36pts',
]

const statusColor = (s: string) => s === 'In Progress' ? '#0D9488' : s === 'In Review' ? '#8B5CF6' : s === 'Blocked' ? '#EF4444' : s === 'To Do' ? '#3B82F6' : '#6B7280'
const priorityColor = (p: string) => p === 'Critical' ? '#EF4444' : p === 'High' ? '#F59E0B' : p === 'Medium' ? '#3B82F6' : '#6B7280'

export default function ProjectsView() {
  const [tab, setTab] = useState('Overview')

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>Project Management</h2>
          <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>2 active projects · Sprint 8 in progress · 2 blocked tasks</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#9CA3AF', border: `1px solid ${BORDER}` }}>
            <Filter size={12} /> Filter
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
            <Plus size={12} /> New Project
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none" style={{ borderBottom: `1px solid ${BORDER}` }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t.replace(/ \(\d+\)/, ''))} className="px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap"
            style={{ borderBottomColor: tab === t.replace(/ \(\d+\)/, '') ? '#0D9488' : 'transparent', color: tab === t.replace(/ \(\d+\)/, '') ? '#0D9488' : '#6B7280' }}>
            {t}
          </button>
        ))}
      </div>

      {/* PM Intelligence Summary */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(13,148,136,0.3)' }}>
        <div className="flex items-center gap-2 px-5 py-3" style={{ backgroundColor: 'rgba(13,148,136,0.08)', borderBottom: '1px solid rgba(13,148,136,0.2)' }}>
          <Sparkles size={14} style={{ color: '#0D9488' }} />
          <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>PM Intelligence Summary</span>
        </div>
        <div className="flex flex-col gap-2.5 p-5" style={{ backgroundColor: '#0a0c12' }}>
          {PM_INSIGHTS.map((insight, i) => (
            <p key={i} className="text-xs leading-relaxed" style={{ color: '#D1D5DB' }}>{insight}</p>
          ))}
        </div>
      </div>

      {/* 6 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          { label: 'Active Projects', value: '2', icon: Layers, color: '#0D9488' },
          { label: 'Sprint Points', value: '38/55', icon: Target, color: '#8B5CF6' },
          { label: 'Blocked Tasks', value: '2', icon: AlertCircle, color: '#EF4444' },
          { label: 'OKRs On Track', value: '2/4', icon: CheckCircle2, color: '#22C55E' },
          { label: 'Team Velocity', value: '38pts', icon: BarChart3, color: '#3B82F6' },
          { label: 'Backlog Items', value: '8', icon: Clock, color: '#F59E0B' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4" style={{ backgroundColor: BG, border: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-2 mb-1">
              <s.icon size={13} style={{ color: s.color }} />
              <span className="text-[10px]" style={{ color: '#6B7280' }}>{s.label}</span>
            </div>
            <p className="text-lg font-black" style={{ color: '#F9FAFB' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <p className="text-xs font-semibold mb-2" style={{ color: '#4B5563' }}>QUICK ACTIONS</p>
        <div className="flex items-center gap-2 flex-wrap">
          {[{ l: 'New Task', i: Plus }, { l: 'Sprint Planning', i: Target }, { l: 'Risk Review', i: AlertCircle }, { l: 'OKR Update', i: CheckCircle2 }, { l: 'Capacity Check', i: Users }, { l: 'Dept Insights', i: BarChart3 }].map(a => (
            <button key={a.l} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 whitespace-nowrap" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
              <a.i size={12} />{a.l}
            </button>
          ))}
        </div>
      </div>

      {/* All Projects Table */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: BG, border: `1px solid ${BORDER}` }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>All Projects</p>
          <span className="text-xs" style={{ color: '#6B7280' }}>{PROJECTS.length} projects</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {['Code', 'Project', 'Status', 'Priority', 'Progress', 'Tasks', 'Deadline', 'Budget', 'Lead'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold" style={{ color: '#6B7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PROJECTS.map((p, i) => (
                <tr key={p.code} style={{ borderBottom: i < PROJECTS.length - 1 ? `1px solid ${BORDER}` : undefined }} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded text-[10px] font-bold" style={{ backgroundColor: `${p.color}1a`, color: p.color }}>{p.code}</span>
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: '#F9FAFB' }}>{p.name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{ backgroundColor: `${statusColor(p.status)}1a`, color: statusColor(p.status) }}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{ backgroundColor: `${priorityColor(p.priority)}1a`, color: priorityColor(p.priority) }}>{p.priority}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1F2937' }}>
                        <div className="h-full rounded-full" style={{ width: `${p.progress}%`, backgroundColor: p.progress >= 80 ? '#22C55E' : p.progress >= 40 ? '#0D9488' : '#F59E0B' }} />
                      </div>
                      <span style={{ color: '#9CA3AF' }}>{p.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: '#9CA3AF' }}>
                    {p.blocked > 0 ? <span style={{ color: '#EF4444' }}>{p.blocked} blocked</span> : p.tasks}
                  </td>
                  <td className="px-4 py-3" style={{ color: '#9CA3AF' }}>{p.deadline}</td>
                  <td className="px-4 py-3" style={{ color: '#9CA3AF' }}>{p.budget}</td>
                  <td className="px-4 py-3" style={{ color: '#9CA3AF' }}>{p.lead}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Blocked — Requires Immediate Action */}
      {BLOCKED_TASKS.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(239,68,68,0.3)' }}>
          <div className="flex items-center gap-2 px-5 py-3" style={{ backgroundColor: 'rgba(239,68,68,0.08)', borderBottom: '1px solid rgba(239,68,68,0.2)' }}>
            <AlertCircle size={14} style={{ color: '#EF4444' }} />
            <span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Blocked — Requires Immediate Action</span>
          </div>
          <div className="divide-y" style={{ borderColor: BORDER }}>
            {BLOCKED_TASKS.map((t, i) => (
              <div key={i} className="flex items-start justify-between px-5 py-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>{t.project}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${t.severity === 'Critical' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)'}`, color: t.severity === 'Critical' ? '#EF4444' : '#F59E0B' }}>{t.severity}</span>
                  </div>
                  <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{t.task}</p>
                  <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Assigned: {t.assignee} · Blocked for {t.days} days</p>
                </div>
                <button className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: '#EF4444', color: '#F9FAFB' }}>Resolve</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
