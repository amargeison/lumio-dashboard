'use client'

import { Fragment, useState } from 'react'
import { Sparkles, AlertCircle, CheckCircle2, Clock, Target, Users, Layers, BarChart3, Filter, Plus } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const BG = '#111318'
const BORDER = '#1F2937'

// ─── Static Data ────────────────────────────────────────────────────────────

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

const PM_INSIGHTS = [
  '📊 Sprint 8 is 69% complete with 4 days remaining — on track for deadline',
  '🔴 2 critical blockers: Supabase RLS migration (LSP) and Stripe webhook (CPR) need urgent attention',
  '✅ Marketing Automation project at 89% — on schedule for Mar 31 handoff to client success',
  '⚠️ Mobile App MVP has 8 blocked tasks — recommend scope reduction or deadline extension to Q3',
  '📈 Team velocity stable at 38pts/sprint — consistent with 4-sprint average of 36pts',
]

const BOARD_COLUMNS = [
  { name: 'To Do', color: '#6B7280', tasks: [{ title: 'API rate limiting', proj: 'APD', priority: 'Low', assignee: 'JO', points: 3 }, { title: 'SSO design doc', proj: 'ESS', priority: 'Medium', assignee: 'MB', points: 5 }] },
  { name: 'In Progress', color: '#3B82F6', tasks: [{ title: 'RLS policy implementation', proj: 'LSP', priority: 'Critical', assignee: 'PK', points: 8 }, { title: 'Kanban drag-drop', proj: 'CPR', priority: 'High', assignee: 'TA', points: 5 }, { title: 'Email templates', proj: 'MAU', priority: 'High', assignee: 'CD', points: 3 }] },
  { name: 'In Review', color: '#8B5CF6', tasks: [{ title: 'Webhook retry logic', proj: 'CPR', priority: 'High', assignee: 'SW', points: 5 }, { title: 'Campaign analytics', proj: 'MAU', priority: 'Medium', assignee: 'CD', points: 3 }] },
  { name: 'Blocked', color: '#EF4444', tasks: [{ title: 'Stripe key renewal', proj: 'CPR', priority: 'High', assignee: 'TA', points: 3 }, { title: 'iOS push notifications', proj: 'MAM', priority: 'Medium', assignee: 'MB', points: 8 }] },
  { name: 'Done', color: '#22C55E', tasks: [{ title: 'School dashboard stats', proj: 'LSP', priority: 'High', assignee: 'SW', points: 5 }, { title: 'A/B testing engine', proj: 'MAU', priority: 'Medium', assignee: 'JO', points: 5 }, { title: 'Contact enrichment', proj: 'CPR', priority: 'High', assignee: 'PK', points: 8 }] },
]

const BURNDOWN = [{d:'D1',ideal:55,actual:55},{d:'D2',ideal:51,actual:53},{d:'D3',ideal:47,actual:50},{d:'D4',ideal:43,actual:48},{d:'D5',ideal:39,actual:44},{d:'D6',ideal:35,actual:40},{d:'D7',ideal:31,actual:36},{d:'D8',ideal:27,actual:31},{d:'D9',ideal:24,actual:27},{d:'D10',ideal:20,actual:22},{d:'D11',ideal:16,actual:17},{d:'D12',ideal:12,actual:17},{d:'D13',ideal:8,actual:17},{d:'D14',ideal:0,actual:17}]
const VELOCITY = [{s:'S1',pts:32},{s:'S2',pts:38},{s:'S3',pts:41},{s:'S4',pts:35},{s:'S5',pts:44},{s:'S6',pts:39},{s:'S7',pts:42},{s:'S8',pts:38}]

const SPRINT_TASKS = [
  { title: 'School dashboard stats', proj: 'LSP', priority: 'High', points: 5, assignee: 'Sophie W.', done: true },
  { title: 'Contact enrichment API', proj: 'CPR', priority: 'High', points: 8, assignee: 'Priya K.', done: true },
  { title: 'A/B testing engine', proj: 'MAU', priority: 'Medium', points: 5, assignee: 'James O.', done: true },
  { title: 'RLS policy setup', proj: 'LSP', priority: 'Critical', points: 8, assignee: 'Priya K.', done: false },
  { title: 'Kanban drag-drop', proj: 'CPR', priority: 'High', points: 5, assignee: 'Tom A.', done: false },
  { title: 'Email templates', proj: 'MAU', priority: 'High', points: 3, assignee: 'Charlotte D.', done: false },
  { title: 'Stripe webhook fix', proj: 'CPR', priority: 'High', points: 3, assignee: 'Tom A.', done: false },
  { title: 'iOS push setup', proj: 'MAM', priority: 'Medium', points: 8, assignee: 'Marcus B.', done: false },
]

const ROADMAP = [
  { code: 'LSP', name: 'Lumio Schools Portal', start: 0, end: 3, color: '#0D9488' },
  { code: 'CPR', name: 'CRM Pipeline Rebuild', start: 1, end: 4, color: '#8B5CF6' },
  { code: 'MAU', name: 'Marketing Automation', start: 0, end: 2, color: '#22C55E' },
  { code: 'MAM', name: 'Mobile App MVP', start: 2, end: 5, color: '#F59E0B' },
  { code: 'APD', name: 'API v2 Docs', start: 3, end: 4, color: '#3B82F6' },
  { code: 'ESS', name: 'Enterprise SSO', start: 5, end: 8, color: '#6B7280' },
]
const QUARTERS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep']

const OKRS = [
  { title: 'Reach £500k ARR by Q4 2026', progress: 34, status: 'At Risk', color: '#EF4444' },
  { title: 'Launch 10 enterprise customers', progress: 20, status: 'On Track', color: '#22C55E' },
  { title: 'Achieve 95% customer retention', progress: 87, status: 'On Track', color: '#22C55E' },
  { title: 'Ship MIS sync v1', progress: 0, status: 'Not Started', color: '#6B7280' },
]

const BACKLOG = [
  { id: 'BL-001', title: 'Multi-tenant SSO middleware', proj: 'ESS', priority: 'High', points: 13, prioritised: true },
  { id: 'BL-002', title: 'SCIM user provisioning', proj: 'ESS', priority: 'High', points: 8, prioritised: true },
  { id: 'BL-003', title: 'Webhook delivery dashboard', proj: 'CPR', priority: 'Medium', points: 5, prioritised: true },
  { id: 'BL-004', title: 'Bulk import CSV tool', proj: 'LSP', priority: 'Medium', points: 5, prioritised: false },
  { id: 'BL-005', title: 'Dark mode toggle', proj: 'MAM', priority: 'Low', points: 3, prioritised: false },
  { id: 'BL-006', title: 'PDF report export', proj: 'LSP', priority: 'Medium', points: 5, prioritised: false },
  { id: 'BL-007', title: 'Push notification preferences', proj: 'MAM', priority: 'Low', points: 3, prioritised: false },
  { id: 'BL-008', title: 'API versioning strategy doc', proj: 'APD', priority: 'Low', points: 2, prioritised: false },
  { id: 'BL-009', title: 'Integration marketplace UI', proj: 'CPR', priority: 'Medium', points: 8, prioritised: false },
  { id: 'BL-010', title: 'Accessibility audit fixes', proj: 'LSP', priority: 'High', points: 5, prioritised: false },
  { id: 'BL-011', title: 'Custom report builder', proj: 'MAU', priority: 'Medium', points: 8, prioritised: false },
  { id: 'BL-012', title: 'Two-factor auth flow', proj: 'ESS', priority: 'High', points: 5, prioritised: false },
]

const RISKS = [
  { title: 'Supabase RLS migration delay', severity: 'Critical', likelihood: 'High', impact: 'Critical path blocked — LSP launch delayed', mitigation: 'Escalate to DevOps lead. Fallback: manual policy config.' },
  { title: 'Stripe API key expiry across environments', severity: 'High', likelihood: 'Medium', impact: 'Payment processing halted for CPR testing', mitigation: 'Finance to renew key. Add key rotation monitoring.' },
  { title: 'Mobile App scope creep', severity: 'High', likelihood: 'High', impact: '8 blocked tasks, budget overrun likely', mitigation: 'Recommend descoping push notifications to v1.1.' },
  { title: 'Team capacity Q2 — Priya on leave Apr', severity: 'Medium', likelihood: 'Confirmed', impact: 'LSP velocity drop during final sprint', mitigation: 'Cross-train James on RLS. Front-load critical work.' },
]

const TEAM = [
  { name: 'Sophie Williams', role: 'Lead Engineer', sprintPts: 10, capacity: 13, projects: ['LSP', 'CPR'] },
  { name: 'James Okafor', role: 'Full-Stack Dev', sprintPts: 8, capacity: 13, projects: ['APD', 'MAU'] },
  { name: 'Priya Kapoor', role: 'Backend Dev', sprintPts: 16, capacity: 13, projects: ['LSP', 'CPR'] },
  { name: 'Tom Ashworth', role: 'Frontend Dev', sprintPts: 8, capacity: 13, projects: ['CPR', 'MAM'] },
]

const TABS = ['Overview', 'Board', 'Sprint', 'Roadmap', 'OKRs', 'Backlog', 'Risks', 'Team'] as const
const TAB_BADGES: Record<string, number> = { Board: 3, OKRs: 1, Risks: 4 }

function CTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return <div className="rounded-lg px-3 py-2 text-xs" style={{ background: '#1a1a2e', border: '1px solid #2a2a4e', color: '#F1F3FA' }}><p className="font-semibold mb-1">{label}</p>{payload.map((p: any, i: number) => <p key={i} style={{ color: p.stroke || p.fill }}>{p.name}: {p.value}</p>)}</div>
}

const statusColor = (s: string) => s === 'In Progress' ? '#0D9488' : s === 'In Review' ? '#8B5CF6' : s === 'Blocked' ? '#EF4444' : s === 'To Do' ? '#3B82F6' : '#6B7280'
const priorityColor = (p: string) => p === 'Critical' ? '#EF4444' : p === 'High' ? '#F59E0B' : p === 'Medium' ? '#3B82F6' : '#6B7280'

// ─── Component ──────────────────────────────────────────────────────────────

export default function ProjectsView() {
  const [tab, setTab] = useState<string>('Overview')

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div><h2 className="text-xl font-bold" style={{ color: '#F9FAFB' }}>Project Management</h2><p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>2 active projects · Sprint 8 in progress · 2 blocked tasks</p></div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#9CA3AF', border: `1px solid ${BORDER}` }}><Filter size={12} /> Filter</button>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}><Plus size={12} /> New Project</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none" style={{ borderBottom: `1px solid ${BORDER}` }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className="px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap"
            style={{ borderBottomColor: tab === t ? '#0D9488' : 'transparent', color: tab === t ? '#0D9488' : '#6B7280' }}>
            {t}{TAB_BADGES[t] ? ` (${TAB_BADGES[t]})` : ''}
          </button>
        ))}
      </div>

      {/* ════════ OVERVIEW ════════ */}
      {tab === 'Overview' && <>
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(13,148,136,0.3)' }}>
          <div className="flex items-center gap-2 px-5 py-3" style={{ backgroundColor: 'rgba(13,148,136,0.08)', borderBottom: '1px solid rgba(13,148,136,0.2)' }}><Sparkles size={14} style={{ color: '#0D9488' }} /><span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>PM Intelligence Summary</span></div>
          <div className="flex flex-col gap-2.5 p-5" style={{ backgroundColor: '#0a0c12' }}>{PM_INSIGHTS.map((ins, i) => <p key={i} className="text-xs leading-relaxed" style={{ color: '#D1D5DB' }}>{ins}</p>)}</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {[{ label: 'Active Projects', value: '2', icon: Layers, color: '#0D9488' }, { label: 'Sprint Points', value: '38/55', icon: Target, color: '#8B5CF6' }, { label: 'Blocked Tasks', value: '2', icon: AlertCircle, color: '#EF4444' }, { label: 'OKRs On Track', value: '2/4', icon: CheckCircle2, color: '#22C55E' }, { label: 'Team Velocity', value: '38pts', icon: BarChart3, color: '#3B82F6' }, { label: 'Backlog Items', value: '8', icon: Clock, color: '#F59E0B' }].map(s => (
            <div key={s.label} className="rounded-xl p-4" style={{ backgroundColor: BG, border: `1px solid ${BORDER}` }}><div className="flex items-center gap-2 mb-1"><s.icon size={13} style={{ color: s.color }} /><span className="text-[10px]" style={{ color: '#6B7280' }}>{s.label}</span></div><p className="text-lg font-black" style={{ color: '#F9FAFB' }}>{s.value}</p></div>
          ))}
        </div>
        <div><p className="text-xs font-semibold mb-2" style={{ color: '#4B5563' }}>QUICK ACTIONS</p><div className="flex items-center gap-2 flex-wrap">{[{ l: 'New Task', i: Plus }, { l: 'Sprint Planning', i: Target }, { l: 'Risk Review', i: AlertCircle }, { l: 'OKR Update', i: CheckCircle2 }, { l: 'Capacity Check', i: Users }, { l: 'Dept Insights', i: BarChart3 }].map(a => (<button key={a.l} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 whitespace-nowrap" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}><a.i size={12} />{a.l}</button>))}</div></div>
        {/* All Projects Table */}
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: BG, border: `1px solid ${BORDER}` }}>
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>All Projects</p><span className="text-xs" style={{ color: '#6B7280' }}>{PROJECTS.length} projects</span></div>
          <table className="w-full text-xs"><thead><tr style={{ borderBottom: `1px solid ${BORDER}` }}>{['Code', 'Project', 'Status', 'Priority', 'Progress', 'Tasks', 'Deadline', 'Budget', 'Lead'].map(h => <th key={h} className="text-left px-4 py-3 font-semibold" style={{ color: '#6B7280' }}>{h}</th>)}</tr></thead>
            <tbody>{PROJECTS.map((p, i) => (<tr key={p.code} style={{ borderBottom: i < PROJECTS.length - 1 ? `1px solid ${BORDER}` : undefined }} className="hover:bg-white/[0.02]"><td className="px-4 py-3"><span className="px-2 py-1 rounded text-[10px] font-bold" style={{ backgroundColor: `${p.color}1a`, color: p.color }}>{p.code}</span></td><td className="px-4 py-3 font-medium" style={{ color: '#F9FAFB' }}>{p.name}</td><td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{ backgroundColor: `${statusColor(p.status)}1a`, color: statusColor(p.status) }}>{p.status}</span></td><td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{ backgroundColor: `${priorityColor(p.priority)}1a`, color: priorityColor(p.priority) }}>{p.priority}</span></td><td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1F2937' }}><div className="h-full rounded-full" style={{ width: `${p.progress}%`, backgroundColor: p.progress >= 80 ? '#22C55E' : p.progress >= 40 ? '#0D9488' : '#F59E0B' }} /></div><span style={{ color: '#9CA3AF' }}>{p.progress}%</span></div></td><td className="px-4 py-3" style={{ color: p.blocked > 0 ? '#EF4444' : '#9CA3AF' }}>{p.blocked > 0 ? `${p.blocked} blocked` : p.tasks}</td><td className="px-4 py-3" style={{ color: '#9CA3AF' }}>{p.deadline}</td><td className="px-4 py-3" style={{ color: '#9CA3AF' }}>{p.budget}</td><td className="px-4 py-3" style={{ color: '#9CA3AF' }}>{p.lead}</td></tr>))}</tbody></table>
        </div>
        {BLOCKED_TASKS.length > 0 && <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(239,68,68,0.3)' }}><div className="flex items-center gap-2 px-5 py-3" style={{ backgroundColor: 'rgba(239,68,68,0.08)', borderBottom: '1px solid rgba(239,68,68,0.2)' }}><AlertCircle size={14} style={{ color: '#EF4444' }} /><span className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Blocked — Requires Immediate Action</span></div><div className="divide-y" style={{ borderColor: BORDER }}>{BLOCKED_TASKS.map((t, i) => (<div key={i} className="flex items-start justify-between px-5 py-4"><div className="flex-1"><div className="flex items-center gap-2 mb-1"><span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>{t.project}</span><span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: t.severity === 'Critical' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', color: t.severity === 'Critical' ? '#EF4444' : '#F59E0B' }}>{t.severity}</span></div><p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{t.task}</p><p className="text-xs mt-1" style={{ color: '#6B7280' }}>Assigned: {t.assignee} · Blocked for {t.days} days</p></div><button className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ backgroundColor: '#EF4444', color: '#F9FAFB' }}>Resolve</button></div>))}</div></div>}
      </>}

      {/* ════════ BOARD ════════ */}
      {tab === 'Board' && <div className="flex gap-3 overflow-x-auto pb-2">
        {BOARD_COLUMNS.map(col => (
          <div key={col.name} className="rounded-xl shrink-0" style={{ width: 240, background: BG, border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} /><span className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>{col.name}</span><span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${col.color}1a`, color: col.color }}>{col.tasks.length}</span></div>
            </div>
            <div className="p-3 space-y-2">{col.tasks.map(t => (
              <div key={t.title} className="rounded-lg p-3" style={{ background: '#0A0B10', border: `1px solid ${BORDER}` }}>
                <p className="text-xs font-semibold mb-1" style={{ color: '#F9FAFB' }}>{t.title}</p>
                <div className="flex items-center justify-between"><span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${priorityColor(t.priority)}1a`, color: priorityColor(t.priority) }}>{t.proj}</span><div className="flex items-center gap-1.5"><span className="text-[10px]" style={{ color: '#6B7280' }}>{t.points}pts</span><span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>{t.assignee}</span></div></div>
              </div>
            ))}</div>
          </div>
        ))}
      </div>}

      {/* ════════ SPRINT ════════ */}
      {tab === 'Sprint' && <div className="space-y-4">
        <div className="rounded-xl p-5" style={{ backgroundColor: BG, border: `1px solid ${BORDER}` }}>
          <div className="flex items-center justify-between mb-1"><h3 className="text-sm font-bold" style={{ color: '#F9FAFB' }}>Sprint 8</h3><span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(13,148,136,0.1)', color: '#0D9488' }}>Active</span></div>
          <p className="text-xs" style={{ color: '#6B7280' }}>Mar 17 → Mar 31 · 55 Committed / 38 Completed / 17 Remaining</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl p-5" style={{ backgroundColor: BG, border: `1px solid ${BORDER}` }}>
            <p className="text-sm font-semibold mb-3" style={{ color: '#F9FAFB' }}>Sprint Burndown</p>
            <ResponsiveContainer width="100%" height={180}><LineChart data={BURNDOWN}><CartesianGrid strokeDasharray="3 3" stroke="#1E2035" /><XAxis dataKey="d" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip content={<CTooltip />} /><Line type="monotone" dataKey="ideal" name="Ideal" stroke="#6B7280" strokeWidth={1} strokeDasharray="5 5" dot={false} /><Line type="monotone" dataKey="actual" name="Actual" stroke="#0D9488" strokeWidth={2} dot={{ fill: '#0D9488', r: 2 }} /></LineChart></ResponsiveContainer>
          </div>
          <div className="rounded-xl p-5" style={{ backgroundColor: BG, border: `1px solid ${BORDER}` }}>
            <p className="text-sm font-semibold mb-3" style={{ color: '#F9FAFB' }}>Team Velocity</p>
            <ResponsiveContainer width="100%" height={180}><BarChart data={VELOCITY}><XAxis dataKey="s" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip content={<CTooltip />} /><Bar dataKey="pts" name="Points" fill="#8B5CF6" radius={[3, 3, 0, 0]} barSize={24} /></BarChart></ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: BG, border: `1px solid ${BORDER}` }}>
          <div className="px-5 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Sprint Tasks</p></div>
          <table className="w-full text-xs"><thead><tr style={{ borderBottom: `1px solid ${BORDER}` }}>{['Task', 'Project', 'Priority', 'Points', 'Assignee', 'Status'].map(h => <th key={h} className="text-left px-4 py-2.5 font-semibold" style={{ color: '#6B7280' }}>{h}</th>)}</tr></thead>
            <tbody>{SPRINT_TASKS.map((t, i) => (<tr key={i} style={{ borderBottom: `1px solid ${BORDER}` }}><td className="px-4 py-2.5 font-medium" style={{ color: '#F9FAFB', textDecoration: t.done ? 'line-through' : undefined, opacity: t.done ? 0.5 : 1 }}>{t.title}</td><td className="px-4 py-2.5"><span className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>{t.proj}</span></td><td className="px-4 py-2.5"><span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${priorityColor(t.priority)}1a`, color: priorityColor(t.priority) }}>{t.priority}</span></td><td className="px-4 py-2.5" style={{ color: '#9CA3AF' }}>{t.points}</td><td className="px-4 py-2.5" style={{ color: '#9CA3AF' }}>{t.assignee}</td><td className="px-4 py-2.5"><span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: t.done ? 'rgba(34,197,94,0.1)' : 'rgba(59,130,246,0.1)', color: t.done ? '#22C55E' : '#3B82F6' }}>{t.done ? 'Done' : 'In Progress'}</span></td></tr>))}</tbody></table>
        </div>
      </div>}

      {/* ════════ ROADMAP ════════ */}
      {tab === 'Roadmap' && <div className="rounded-xl p-5 overflow-x-auto" style={{ backgroundColor: BG, border: `1px solid ${BORDER}` }}>
        <div className="min-w-[600px]">
          <div className="grid gap-0" style={{ gridTemplateColumns: '120px repeat(9, 1fr)' }}>
            <div />{QUARTERS.map(q => <div key={q} className="text-center text-[10px] font-semibold pb-2" style={{ color: '#6B7280' }}>{q}</div>)}
            {ROADMAP.map(r => (
              <Fragment key={r.code}>
                <div className="flex items-center gap-2 pr-2 py-2"><span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: `${r.color}1a`, color: r.color }}>{r.code}</span><span className="text-xs truncate" style={{ color: '#9CA3AF' }}>{r.name}</span></div>
                {QUARTERS.map((_, qi) => <div key={qi} className="py-2 px-0.5">{qi >= r.start && qi <= r.end && <div className="h-5 rounded" style={{ backgroundColor: r.color, opacity: 0.7 }} />}</div>)}
              </Fragment>
            ))}
          </div>
        </div>
      </div>}

      {/* ════════ OKRs ════════ */}
      {tab === 'OKRs' && <div className="space-y-3">
        {OKRS.map(o => (
          <div key={o.title} className="rounded-xl p-5" style={{ backgroundColor: BG, border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between mb-2"><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{o.title}</p><span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: `${o.color}1a`, color: o.color }}>{o.status}</span></div>
            <div className="flex items-center gap-3"><div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#1F2937' }}><div className="h-full rounded-full" style={{ width: `${o.progress}%`, backgroundColor: o.color }} /></div><span className="text-xs font-bold" style={{ color: o.color }}>{o.progress}%</span></div>
          </div>
        ))}
      </div>}

      {/* ════════ BACKLOG ════════ */}
      {tab === 'Backlog' && <div className="rounded-xl overflow-hidden" style={{ backgroundColor: BG, border: `1px solid ${BORDER}` }}>
        <div className="px-5 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Backlog ({BACKLOG.length} items)</p></div>
        <table className="w-full text-xs"><thead><tr style={{ borderBottom: `1px solid ${BORDER}` }}>{['ID', 'Title', 'Project', 'Priority', 'Points', ''].map(h => <th key={h} className="text-left px-4 py-2.5 font-semibold" style={{ color: '#6B7280' }}>{h}</th>)}</tr></thead>
          <tbody>{BACKLOG.map(b => (<tr key={b.id} style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: b.prioritised ? 'rgba(13,148,136,0.04)' : undefined }}><td className="px-4 py-2.5 font-mono" style={{ color: '#6B7280' }}>{b.id}</td><td className="px-4 py-2.5 font-medium" style={{ color: '#F9FAFB' }}>{b.title}</td><td className="px-4 py-2.5"><span className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>{b.proj}</span></td><td className="px-4 py-2.5"><span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${priorityColor(b.priority)}1a`, color: priorityColor(b.priority) }}>{b.priority}</span></td><td className="px-4 py-2.5" style={{ color: '#9CA3AF' }}>{b.points}</td><td className="px-4 py-2.5">{b.prioritised && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(13,148,136,0.1)', color: '#0D9488' }}>Prioritised</span>}</td></tr>))}</tbody></table>
      </div>}

      {/* ════════ RISKS ════════ */}
      {tab === 'Risks' && <div className="space-y-3">
        {RISKS.map(r => {
          const sc = r.severity === 'Critical' ? '#EF4444' : r.severity === 'High' ? '#F59E0B' : '#3B82F6'
          return (
            <div key={r.title} className="rounded-xl p-5" style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${sc}` }}>
              <div className="flex items-center justify-between mb-2"><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{r.title}</p><span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: `${sc}1a`, color: sc }}>{r.severity}</span></div>
              <div className="grid grid-cols-2 gap-2 mb-2"><div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Likelihood</span><span className="text-xs" style={{ color: '#F9FAFB' }}>{r.likelihood}</span></div><div className="flex justify-between"><span className="text-xs" style={{ color: '#6B7280' }}>Impact</span><span className="text-xs" style={{ color: '#F9FAFB' }}>{r.impact}</span></div></div>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>Mitigation: {r.mitigation}</p>
            </div>
          )
        })}
      </div>}

      {/* ════════ TEAM ════════ */}
      {tab === 'Team' && <div className="rounded-xl overflow-hidden" style={{ backgroundColor: BG, border: `1px solid ${BORDER}` }}>
        <div className="px-5 py-3" style={{ borderBottom: `1px solid ${BORDER}` }}><p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Team Capacity</p></div>
        <table className="w-full text-xs"><thead><tr style={{ borderBottom: `1px solid ${BORDER}` }}>{['Name', 'Role', 'Sprint Pts', 'Capacity', 'Utilisation', 'Projects'].map(h => <th key={h} className="text-left px-4 py-2.5 font-semibold" style={{ color: '#6B7280' }}>{h}</th>)}</tr></thead>
          <tbody>{TEAM.map(t => { const util = Math.round((t.sprintPts / t.capacity) * 100); const uc = util > 100 ? '#EF4444' : util > 80 ? '#F59E0B' : '#22C55E'; return (
            <tr key={t.name} style={{ borderBottom: `1px solid ${BORDER}` }}><td className="px-4 py-3 font-medium" style={{ color: '#F9FAFB' }}>{t.name}</td><td className="px-4 py-3" style={{ color: '#9CA3AF' }}>{t.role}</td><td className="px-4 py-3 font-bold" style={{ color: t.sprintPts > t.capacity ? '#EF4444' : '#F9FAFB' }}>{t.sprintPts}</td><td className="px-4 py-3" style={{ color: '#6B7280' }}>{t.capacity}</td><td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#1F2937' }}><div className="h-full rounded-full" style={{ width: `${Math.min(100, util)}%`, backgroundColor: uc }} /></div><span style={{ color: uc }}>{util}%</span></div></td><td className="px-4 py-3"><div className="flex gap-1">{t.projects.map(p => <span key={p} className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>{p}</span>)}</div></td></tr>
          )})}</tbody></table>
      </div>}
    </div>
  )
}
