'use client'
import React, { useState } from 'react'
import {
  Layers, Plus, ChevronRight, AlertTriangle, CheckCircle, Clock,
  TrendingUp, TrendingDown, Users, Flag, Zap, BarChart2,
  Calendar, Target, Star, Filter, Search, X, MoreHorizontal,
  ArrowUp, ArrowDown, Minus, Play, Pause, Circle
} from 'lucide-react'
import { DashboardEmptyState, useHasDashboardData } from '@/components/dashboard/EmptyState'
import DeptStaffHeader from '@/components/dashboard/DeptStaffHeader'
import { getDeptStaff, getDeptLead, getStaffName } from '@/lib/staff/deptMatch'

// ─── Types ────────────────────────────────────────────────────────────────────
type Status = 'backlog' | 'todo' | 'in-progress' | 'review' | 'done' | 'blocked'
type Priority = 'critical' | 'high' | 'medium' | 'low'
type RAG = 'green' | 'amber' | 'red'

// ─── Theme helpers ────────────────────────────────────────────────────────────
const statusCfg: Record<Status, { label: string; color: string; bg: string }> = {
  backlog:     { label: 'Backlog',     color: '#6B7280', bg: 'rgba(107,114,128,0.15)' },
  todo:        { label: 'To Do',       color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)' },
  'in-progress':{ label: 'In Progress', color: '#0D9488', bg: 'rgba(13,148,136,0.15)' },
  review:      { label: 'In Review',   color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)' },
  done:        { label: 'Done',        color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  blocked:     { label: 'Blocked',     color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
}

const priorityCfg: Record<Priority, { label: string; color: string; icon: React.ReactNode }> = {
  critical: { label: 'Critical', color: '#EF4444', icon: <ArrowUp size={10} /> },
  high:     { label: 'High',     color: '#F97316', icon: <ArrowUp size={10} /> },
  medium:   { label: 'Medium',   color: '#F59E0B', icon: <Minus size={10} /> },
  low:      { label: 'Low',      color: '#22C55E', icon: <ArrowDown size={10} /> },
}

const ragCfg: Record<RAG, { color: string; bg: string; border: string }> = {
  green: { color: '#22C55E', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.3)' },
  amber: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
  red:   { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)'  },
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const PROJECTS = [
  { id: 1, name: 'Lumio Schools Portal', code: 'LSP', status: 'in-progress' as Status, priority: 'critical' as Priority, progress: 68, owner: 'SH', team: ['SH','DM','KB'], deadline: 'Apr 30', rag: 'green' as RAG, tasks: { total: 47, done: 32, blocked: 1 }, description: 'Full school management platform with SEND, attendance, and trust dashboards', sprint: 'Sprint 8', budget: 85000, budgetUsed: 61200 },
  { id: 2, name: 'CRM Pipeline Rebuild', code: 'CPR', status: 'in-progress' as Status, priority: 'high' as Priority, progress: 41, owner: 'DM', team: ['DM','JP'], deadline: 'May 15', rag: 'amber' as RAG, tasks: { total: 28, done: 11, blocked: 3 }, description: 'Rebuild CRM pipeline with AI scoring and automated follow-up sequences', sprint: 'Sprint 3', budget: 32000, budgetUsed: 19800 },
  { id: 3, name: 'Marketing Automation', code: 'MAU', status: 'review' as Status, priority: 'high' as Priority, progress: 89, owner: 'KB', team: ['KB','SH'], deadline: 'Mar 31', rag: 'green' as RAG, tasks: { total: 19, done: 17, blocked: 0 }, description: 'Full marketing automation stack: email sequences, lead scoring, campaign tracking', sprint: 'Sprint 6', budget: 18000, budgetUsed: 17100 },
  { id: 4, name: 'Mobile App MVP', code: 'MAM', status: 'blocked' as Status, priority: 'medium' as Priority, progress: 22, owner: 'JP', team: ['JP','TL'], deadline: 'Jun 30', rag: 'red' as RAG, tasks: { total: 64, done: 14, blocked: 8 }, description: 'Native iOS/Android app for Lumio CMS — dashboard and notifications MVP', sprint: 'Sprint 2', budget: 120000, budgetUsed: 28400 },
  { id: 5, name: 'API v2 Documentation', code: 'APD', status: 'todo' as Status, priority: 'low' as Priority, progress: 5, owner: 'TL', team: ['TL'], deadline: 'May 30', rag: 'green' as RAG, tasks: { total: 12, done: 1, blocked: 0 }, description: 'Complete API documentation for v2 endpoints — developer portal and OpenAPI spec', sprint: null, budget: 8000, budgetUsed: 400 },
  { id: 6, name: 'Enterprise SSO Integration', code: 'ESS', status: 'backlog' as Status, priority: 'medium' as Priority, progress: 0, owner: 'SH', team: ['SH','DM'], deadline: 'Q3 2026', rag: 'green' as RAG, tasks: { total: 18, done: 0, blocked: 0 }, description: 'SAML/OIDC SSO for enterprise customers — Okta, Azure AD, Google Workspace', sprint: null, budget: 45000, budgetUsed: 0 },
]

const TASKS = [
  { id: 1, title: 'Build MAT Trust Dashboard — 11 tabs', project: 'LSP', assignee: 'SH', priority: 'critical' as Priority, status: 'done' as Status, points: 13, sprint: 'Sprint 8', due: 'Mar 24' },
  { id: 2, title: 'SEND White Paper in-app document viewer', project: 'LSP', assignee: 'SH', priority: 'high' as Priority, status: 'done' as Status, points: 8, sprint: 'Sprint 8', due: 'Mar 24' },
  { id: 3, title: 'Empty states with CSV upload for all live portal pages', project: 'LSP', assignee: 'DM', priority: 'high' as Priority, status: 'in-progress' as Status, points: 5, sprint: 'Sprint 8', due: 'Mar 26' },
  { id: 4, title: 'Fix TypeScript build errors — duplicate style attributes', project: 'LSP', assignee: 'SH', priority: 'critical' as Priority, status: 'in-progress' as Status, points: 2, sprint: 'Sprint 8', due: 'Mar 25' },
  { id: 5, title: 'Add Ofsted section to marketing page', project: 'LSP', assignee: 'KB', priority: 'high' as Priority, status: 'review' as Status, points: 3, sprint: 'Sprint 8', due: 'Mar 25' },
  { id: 6, title: 'CRM deal scoring model — AI integration', project: 'CPR', assignee: 'DM', priority: 'high' as Priority, status: 'in-progress' as Status, points: 8, sprint: 'Sprint 3', due: 'Apr 5' },
  { id: 7, title: 'Email sequence builder — 3 templates', project: 'MAU', assignee: 'KB', priority: 'medium' as Priority, status: 'review' as Status, points: 5, sprint: 'Sprint 6', due: 'Mar 28' },
  { id: 8, title: 'iOS push notification service — blocked on Apple cert', project: 'MAM', assignee: 'JP', priority: 'critical' as Priority, status: 'blocked' as Status, points: 13, sprint: 'Sprint 2', due: 'Mar 30' },
  { id: 9, title: 'Android deep link routing', project: 'MAM', assignee: 'TL', priority: 'high' as Priority, status: 'blocked' as Status, points: 8, sprint: 'Sprint 2', due: 'Mar 30' },
  { id: 10, title: 'Pipeline drag-and-drop stage migration', project: 'CPR', assignee: 'JP', priority: 'medium' as Priority, status: 'todo' as Status, points: 5, sprint: 'Sprint 3', due: 'Apr 8' },
  { id: 11, title: 'Lead scoring formula — weighted attributes', project: 'CPR', assignee: 'DM', priority: 'high' as Priority, status: 'todo' as Status, points: 8, sprint: 'Sprint 3', due: 'Apr 10' },
  { id: 12, title: 'OpenAPI spec export — all v2 endpoints', project: 'APD', assignee: 'TL', priority: 'low' as Priority, status: 'todo' as Status, points: 3, sprint: null, due: 'May 15' },
]

const OKRS = [
  {
    objective: 'Become the leading schools management platform in England',
    owner: 'SH', quarter: 'Q1 2026', status: 'on-track' as const,
    krs: [
      { kr: 'Launch live portal to 10 pilot schools', progress: 60, target: '10 schools', current: '6 schools', status: 'on-track' as const },
      { kr: 'Achieve 4.7+ NPS from pilot schools', progress: 82, target: 'NPS 4.7', current: 'NPS 4.6', status: 'on-track' as const },
      { kr: 'Ship SEND White Paper compliance module', progress: 100, target: 'Live', current: 'Done ✓', status: 'done' as const },
      { kr: 'Trust dashboard live for MAT clients', progress: 100, target: 'Live', current: 'Done ✓', status: 'done' as const },
    ]
  },
  {
    objective: 'Grow MRR to £50k by end of Q2 2026',
    owner: 'DM', quarter: 'Q2 2026', status: 'at-risk' as const,
    krs: [
      { kr: 'Close 5 enterprise school trust deals', progress: 20, target: '5 deals', current: '1 deal', status: 'at-risk' as const },
      { kr: 'Convert 8 trials to paid by Apr 30', progress: 38, target: '8 conversions', current: '3 conversions', status: 'at-risk' as const },
      { kr: 'Launch pricing page A/B test', progress: 0, target: 'Live', current: 'Not started', status: 'off-track' as const },
      { kr: 'Reduce churn to below 3%/month', progress: 70, target: '<3%', current: '3.8%', status: 'at-risk' as const },
    ]
  },
  {
    objective: 'Ship mobile app MVP — iOS and Android',
    owner: 'JP', quarter: 'Q3 2026', status: 'off-track' as const,
    krs: [
      { kr: 'Complete iOS MVP (dashboard + notifications)', progress: 22, target: '100%', current: '22%', status: 'off-track' as const },
      { kr: 'Complete Android MVP', progress: 15, target: '100%', current: '15%', status: 'off-track' as const },
      { kr: 'Beta with 20 users by Jun 15', progress: 0, target: '20 users', current: '0', status: 'off-track' as const },
    ]
  },
  {
    objective: 'Establish Lumio as the market authority on SEND compliance',
    owner: 'KB', quarter: 'Q1 2026', status: 'on-track' as const,
    krs: [
      { kr: 'Publish 4 SEND thought leadership pieces', progress: 75, target: '4 articles', current: '3 published', status: 'on-track' as const },
      { kr: '500 newsletter subscribers', progress: 68, target: '500', current: '340', status: 'on-track' as const },
      { kr: 'SEND White Paper in-app viewer live', progress: 100, target: 'Live', current: 'Done ✓', status: 'done' as const },
    ]
  },
]

const BACKLOG = [
  { id: 1, title: 'AI-powered lesson plan generator for teachers', type: 'Feature', rice: { reach: 9, impact: 8, confidence: 7, effort: 5 }, score: 101, status: 'Prioritised', votes: 18 },
  { id: 2, title: 'Parent portal — homework and communication hub', type: 'Feature', rice: { reach: 10, impact: 9, confidence: 8, effort: 8 }, score: 90, status: 'Under review', votes: 24 },
  { id: 3, title: 'Ofsted evidence pack one-click export', type: 'Feature', rice: { reach: 7, impact: 10, confidence: 9, effort: 3 }, score: 210, status: 'Prioritised', votes: 31 },
  { id: 4, title: 'Bulk pupil data import from SIMS CSV', type: 'Enhancement', rice: { reach: 8, impact: 7, confidence: 9, effort: 2 }, score: 252, status: 'In sprint', votes: 14 },
  { id: 5, title: 'Two-factor authentication (2FA)', type: 'Security', rice: { reach: 10, impact: 8, confidence: 10, effort: 3 }, score: 267, status: 'Prioritised', votes: 8 },
  { id: 6, title: 'Pupil progress report PDF generator', type: 'Feature', rice: { reach: 9, impact: 7, confidence: 8, effort: 4 }, score: 126, status: 'Idea', votes: 21 },
  { id: 7, title: 'Integration with Google Classroom', type: 'Integration', rice: { reach: 6, impact: 6, confidence: 6, effort: 7 }, score: 31, status: 'Idea', votes: 12 },
  { id: 8, title: 'Real-time collaboration on ISP documents', type: 'Feature', rice: { reach: 7, impact: 8, confidence: 7, effort: 9 }, score: 44, status: 'Idea', votes: 9 },
]

const RISKS = [
  { id: 1, risk: 'Apple Developer certificate delay blocking iOS push notifications', project: 'MAM', probability: 'High', impact: 'High', owner: 'JP', status: 'Active', action: 'Raised support ticket — escalated to Apple Enterprise team. ETA 5 days.' },
  { id: 2, risk: 'Vercel build failures on main branch causing deployment delays', project: 'LSP', probability: 'Medium', impact: 'High', owner: 'SH', action: 'TypeScript strict mode review in progress. CI pre-check added.', status: 'Mitigating' },
  { id: 3, risk: 'CRM rebuild scope creep — 3 new features added mid-sprint', project: 'CPR', probability: 'High', impact: 'Medium', owner: 'DM', action: 'Sprint scope frozen. New requests moved to backlog for Sprint 4.', status: 'Mitigating' },
  { id: 4, risk: 'Key engineer (TL) capacity at 110% — burnout risk', project: 'MAM', probability: 'Medium', impact: 'High', owner: 'SH', action: 'TL workload review scheduled. Hiring brief for contractor raised.', status: 'Active' },
  { id: 5, risk: 'MIS API (SIMS) breaking changes in v2024.3 update', project: 'LSP', probability: 'Low', impact: 'Critical', owner: 'DM', action: 'Monitoring SIMS changelog. Adapter pattern in place — minimal exposure.', status: 'Monitoring' },
]

const SPRINT = {
  name: 'Sprint 8',
  goal: 'Ship trust dashboard, SEND white paper, and fix all build errors — portal feature-complete for pilot schools',
  start: 'Mar 17',
  end: 'Mar 31',
  team: ['SH', 'DM', 'KB', 'JP', 'TL'],
  points: { committed: 55, completed: 38, remaining: 17 },
  velocity: [32, 38, 41, 35, 44, 39, 42, 38],
  days: [
    { day: 1, ideal: 55, actual: 55 }, { day: 2, ideal: 51, actual: 52 },
    { day: 3, ideal: 47, actual: 48 }, { day: 4, ideal: 43, actual: 45 },
    { day: 5, ideal: 39, actual: 40 }, { day: 6, ideal: 35, actual: 37 },
    { day: 7, ideal: 31, actual: 32 }, { day: 8, ideal: 27, actual: 28 },
    { day: 9, ideal: 23, actual: 25 }, { day: 10, ideal: 19, actual: 22 },
  ],
}

// ─── Helper components ────────────────────────────────────────────────────────
function TabBtn({ active, label, onClick, badge }: { active: boolean; label: string; onClick: () => void; badge?: number }) {
  return (
    <button onClick={onClick}
      className="px-3 py-2 text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5"
      style={{
        borderBottom: active ? '2px solid #0D9488' : '2px solid transparent',
        color: active ? '#0D9488' : '#9CA3AF',
        backgroundColor: active ? 'rgba(13,148,136,0.08)' : 'transparent',
      }}>
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="rounded-full px-1 text-xs font-bold" style={{ backgroundColor: '#EF4444', color: '#F9FAFB', fontSize: 9, minWidth: 16, textAlign: 'center' }}>{badge}</span>
      )}
    </button>
  )
}

function Avatar({ initials, color = '#0D9488' }: { initials: string; color?: string }) {
  return (
    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
      style={{ backgroundColor: color, color: '#F9FAFB', fontSize: 9 }}>{initials}</div>
  )
}

function StatusBadge({ status }: { status: Status }) {
  const s = statusCfg[status]
  return <span className="rounded px-1.5 py-0.5 text-xs font-medium" style={{ color: s.color, backgroundColor: s.bg }}>{s.label}</span>
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const p = priorityCfg[priority]
  return (
    <span className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-medium" style={{ color: p.color, backgroundColor: `${p.color}15` }}>
      {p.icon}{p.label}
    </span>
  )
}

function ProgressBar({ value, color = '#0D9488', height = 4 }: { value: number; color?: string; height?: number }) {
  return (
    <div className="rounded-full overflow-hidden" style={{ backgroundColor: '#1F2937', height }}>
      <div className="h-full rounded-full" style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }} />
    </div>
  )
}

function StatCard({ label, value, sub, color = '#F9FAFB', rag }: { label: string; value: string; sub?: string; color?: string; rag?: RAG }) {
  const r = rag ? ragCfg[rag] : null
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: r ? `1px solid ${r.border}` : '1px solid #1F2937' }}>
      <p className="text-xs" style={{ color: '#6B7280' }}>{label}</p>
      <p className="text-2xl font-black mt-0.5" style={{ color: r ? r.color : color }}>{value}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{sub}</p>}
    </div>
  )
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function Overview() {
  const onTrack = OKRS.filter(o => o.status === 'on-track').length
  const atRisk = OKRS.filter(o => o.status === 'at-risk').length
  const blocked = TASKS.filter(t => t.status === 'blocked').length
  const inProgress = PROJECTS.filter(p => p.status === 'in-progress').length

  return (
    <div className="p-5 flex flex-col gap-5">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <StatCard label="Active Projects" value={String(inProgress)} sub="2 amber · 1 red" color="#0D9488" />
        <StatCard label="Sprint Points" value={`${SPRINT.points.completed}/${SPRINT.points.committed}`} sub="Sprint 8 · 7 days left" />
        <StatCard label="Blocked Tasks" value={String(blocked)} sub="Needs immediate action" rag={blocked>0?'red':'green'} />
        <StatCard label="OKRs On Track" value={`${onTrack}/${OKRS.length}`} sub={`${atRisk} at risk`} rag={atRisk>0?'amber':'green'} />
        <StatCard label="Team Velocity" value="38pts" sub="vs 42pts last sprint" color="#8B5CF6" />
        <StatCard label="Backlog Items" value={String(BACKLOG.length)} sub="3 prioritised" color="#F59E0B" />
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {[{l:'New Task',i:Plus},{l:'Sprint Planning',i:Target},{l:'Risk Review',i:AlertTriangle},{l:'OKR Update',i:CheckCircle},{l:'Capacity Check',i:Users},{l:'Dept Insights',i:Star}].map(a=>(
          <button key={a.l} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-opacity hover:opacity-90" style={{backgroundColor:'#0D9488',color:'#F9FAFB'}}><a.i size={12}/>{a.l}</button>
        ))}
      </div>

      {/* Projects summary */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between px-5 py-3" style={{ backgroundColor: '#111318', borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>All Projects</p>
          <button className="flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
            <Plus size={12} /> New Project
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 800 }}>
            {PROJECTS.map((p, i) => (
              <div key={p.id} className="grid items-center px-5 py-3 gap-3"
                style={{ gridTemplateColumns: '2fr 80px 100px 100px 80px 120px 80px', borderBottom: i < PROJECTS.length - 1 ? '1px solid #1F2937' : 'none', backgroundColor: i % 2 === 0 ? '#111318' : 'transparent' }}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono rounded px-1.5 py-0.5" style={{ backgroundColor: '#1F2937', color: '#6B7280' }}>{p.code}</span>
                    <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{p.name}</p>
                    {p.rag === 'red' && <AlertTriangle size={12} style={{ color: '#EF4444' }} />}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{p.description}</p>
                </div>
                <StatusBadge status={p.status} />
                <PriorityBadge priority={p.priority} />
                <div>
                  <div className="flex justify-between text-xs mb-1" style={{ color: '#9CA3AF' }}>
                    <span>{p.progress}%</span>
                    <span style={{ color: p.tasks.blocked > 0 ? '#EF4444' : '#6B7280' }}>{p.tasks.blocked > 0 ? `${p.tasks.blocked} blocked` : `${p.tasks.done}/${p.tasks.total}`}</span>
                  </div>
                  <ProgressBar value={p.progress} color={p.rag === 'red' ? '#EF4444' : p.rag === 'amber' ? '#F59E0B' : '#0D9488'} />
                </div>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>{p.deadline}</p>
                <div className="flex -space-x-1">
                  {p.team.map((m, j) => <Avatar key={m} initials={m} color={['#0D9488','#8B5CF6','#F59E0B','#EF4444','#22C55E'][j % 5]} />)}
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold" style={{ color: p.budgetUsed / p.budget > 0.9 ? '#EF4444' : '#22C55E' }}>
                    £{(p.budgetUsed / 1000).toFixed(0)}k / £{(p.budget / 1000).toFixed(0)}k
                  </p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>{Math.round((p.budgetUsed / p.budget) * 100)}% used</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Blocked items */}
      {blocked > 0 && (
        <div>
          <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: '#EF4444' }}>⛔ Blocked — Requires Immediate Action</p>
          {TASKS.filter(t => t.status === 'blocked').map(t => (
            <div key={t.id} className="flex items-center gap-3 rounded-lg px-4 py-3 mb-2" style={{ backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <span className="text-xs font-mono rounded px-1.5 py-0.5 flex-shrink-0" style={{ backgroundColor: '#1F2937', color: '#6B7280' }}>{t.project}</span>
              <p className="text-sm flex-1" style={{ color: '#F9FAFB' }}>{t.title}</p>
              <Avatar initials={t.assignee} color="#EF4444" />
              <PriorityBadge priority={t.priority} />
              <span className="text-xs" style={{ color: '#6B7280' }}>Due {t.due}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Kanban Tab ───────────────────────────────────────────────────────────────
function KanbanBoard() {
  const columns: { id: Status; label: string }[] = [
    { id: 'todo', label: 'To Do' },
    { id: 'in-progress', label: 'In Progress' },
    { id: 'review', label: 'In Review' },
    { id: 'done', label: 'Done' },
    { id: 'blocked', label: 'Blocked' },
  ]

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Sprint 8 Board</p>
          <span className="text-xs rounded-full px-2 py-0.5" style={{ backgroundColor: 'rgba(13,148,136,0.12)', color: '#0D9488' }}>Mar 17–31</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-xs rounded-lg px-2 py-1.5 flex items-center gap-1" style={{ backgroundColor: '#111318', color: '#9CA3AF', border: '1px solid #1F2937' }}>
            <Filter size={11} /> Filter
          </button>
          <button className="flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
            <Plus size={12} /> Add Task
          </button>
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {columns.map(col => {
          const tasks = TASKS.filter(t => t.status === col.id)
          const s = statusCfg[col.id]
          return (
            <div key={col.id} className="flex-shrink-0 w-64 rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: '1px solid #1F2937' }}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  <p className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>{col.label}</p>
                </div>
                <span className="text-xs rounded-full px-1.5" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>{tasks.length}</span>
              </div>
              <div className="p-2 flex flex-col gap-2 min-h-[200px]">
                {tasks.map(task => (
                  <div key={task.id} className="rounded-lg p-3 cursor-pointer" style={{ backgroundColor: '#0A0B11', border: '1px solid #1F2937' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#374151'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#1F2937'}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-xs font-medium leading-snug" style={{ color: '#F9FAFB' }}>{task.title}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono rounded px-1 py-0.5" style={{ backgroundColor: '#1F2937', color: '#6B7280' }}>{task.project}</span>
                        <PriorityBadge priority={task.priority} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs" style={{ color: '#6B7280' }}>{task.points}pt</span>
                        <Avatar initials={task.assignee} color="#0D9488" />
                      </div>
                    </div>
                  </div>
                ))}
                <button className="flex items-center gap-1 text-xs mt-1 px-2 py-1.5 rounded-lg w-full" style={{ color: '#4B5563' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#0D9488'}
                  onMouseLeave={e => e.currentTarget.style.color = '#4B5563'}>
                  <Plus size={10} /> Add task
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Sprint Tab ───────────────────────────────────────────────────────────────
function SprintTab() {
  const maxPoints = Math.max(...SPRINT.velocity)
  return (
    <div className="p-5 flex flex-col gap-5">
      {/* Sprint header */}
      <div className="rounded-xl p-5" style={{ background: 'linear-gradient(135deg, rgba(13,148,136,0.15), rgba(99,102,241,0.08))', border: '1px solid rgba(13,148,136,0.3)' }}>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Play size={14} style={{ color: '#0D9488' }} />
              <p className="text-lg font-black" style={{ color: '#F9FAFB' }}>{SPRINT.name}</p>
              <span className="text-xs rounded-full px-2 py-0.5" style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#22C55E' }}>Active</span>
            </div>
            <p className="text-xs mb-3" style={{ color: '#9CA3AF' }}>{SPRINT.start} → {SPRINT.end}</p>
            <p className="text-sm" style={{ color: '#D1D5DB' }}>{SPRINT.goal}</p>
          </div>
          <div className="flex gap-4">
            {[
              { label: 'Committed', value: SPRINT.points.committed, color: '#9CA3AF' },
              { label: 'Completed', value: SPRINT.points.completed, color: '#22C55E' },
              { label: 'Remaining', value: SPRINT.points.remaining, color: '#F59E0B' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs" style={{ color: '#6B7280' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Burndown chart */}
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="px-5 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Sprint Burndown</p>
            <p className="text-xs" style={{ color: '#6B7280' }}>Ideal vs Actual story points remaining</p>
          </div>
          <div className="p-5">
            <div className="relative h-40">
              <svg width="100%" height="100%" viewBox="0 0 300 120" preserveAspectRatio="none">
                {/* Ideal line */}
                <polyline
                  points={SPRINT.days.map((d, i) => `${(i / (SPRINT.days.length - 1)) * 280 + 10},${(d.ideal / SPRINT.points.committed) * 110 + 5}`).join(' ')}
                  fill="none" stroke="#374151" strokeWidth="1.5" strokeDasharray="4,3" />
                {/* Actual line */}
                <polyline
                  points={SPRINT.days.map((d, i) => `${(i / (SPRINT.days.length - 1)) * 280 + 10},${(d.actual / SPRINT.points.committed) * 110 + 5}`).join(' ')}
                  fill="none" stroke="#0D9488" strokeWidth="2" />
                {/* Area under actual */}
                <polygon
                  points={[...SPRINT.days.map((d, i) => `${(i / (SPRINT.days.length - 1)) * 280 + 10},${(d.actual / SPRINT.points.committed) * 110 + 5}`), '290,115', '10,115'].join(' ')}
                  fill="rgba(13,148,136,0.08)" />
              </svg>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: '#6B7280' }}>
              <div className="flex items-center gap-1"><span className="w-4 h-0.5 rounded" style={{ backgroundColor: '#374151', display: 'inline-block' }} /> Ideal</div>
              <div className="flex items-center gap-1"><span className="w-4 h-0.5 rounded" style={{ backgroundColor: '#0D9488', display: 'inline-block' }} /> Actual</div>
              <span className="ml-auto" style={{ color: '#F59E0B' }}>+3pts above ideal</span>
            </div>
          </div>
        </div>

        {/* Velocity chart */}
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="px-5 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
            <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Team Velocity</p>
            <p className="text-xs" style={{ color: '#6B7280' }}>Story points completed per sprint — last 8 sprints</p>
          </div>
          <div className="p-5">
            <div className="flex items-end gap-2 h-32">
              {SPRINT.velocity.map((v, i) => {
                const isCurrent = i === SPRINT.velocity.length - 1
                const avg = Math.round(SPRINT.velocity.reduce((a, b) => a + b, 0) / SPRINT.velocity.length)
                return (
                  <div key={i} className="flex flex-col items-center flex-1">
                    <p className="text-xs mb-1 font-semibold" style={{ color: isCurrent ? '#0D9488' : '#9CA3AF' }}>{v}</p>
                    <div className="w-full rounded-t" style={{ height: `${(v / maxPoints) * 96}px`, backgroundColor: isCurrent ? '#0D9488' : v >= avg ? '#1F4F4A' : '#1F2937' }} />
                    <p className="text-xs mt-1" style={{ color: '#4B5563' }}>S{i + 1}</p>
                  </div>
                )
              })}
            </div>
            <p className="text-xs mt-2" style={{ color: '#6B7280' }}>Avg velocity: {Math.round(SPRINT.velocity.reduce((a, b) => a + b, 0) / SPRINT.velocity.length)} pts/sprint</p>
          </div>
        </div>
      </div>

      {/* Sprint tasks */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1F2937' }}>
        <div className="px-5 py-3" style={{ backgroundColor: '#111318', borderBottom: '1px solid #1F2937' }}>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Sprint Tasks</p>
        </div>
        {TASKS.filter(t => t.sprint === 'Sprint 8').map((t, i) => (
          <div key={t.id} className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: '1px solid #1F2937', backgroundColor: i % 2 === 0 ? '#111318' : 'transparent' }}>
            <StatusBadge status={t.status} />
            <p className="text-sm flex-1" style={{ color: t.status === 'done' ? '#6B7280' : '#F9FAFB', textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>{t.title}</p>
            <span className="text-xs font-mono rounded px-1.5 py-0.5" style={{ backgroundColor: '#1F2937', color: '#6B7280' }}>{t.project}</span>
            <PriorityBadge priority={t.priority} />
            <span className="text-xs" style={{ color: '#6B7280' }}>{t.points}pt</span>
            <Avatar initials={t.assignee} color="#0D9488" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Roadmap Tab ──────────────────────────────────────────────────────────────
function Roadmap() {
  const roadmapItems = [
    { id: 1, name: 'Schools Portal MVP', status: 'done', q: 'Q4 2025', type: 'Product', color: '#22C55E', width: 20 },
    { id: 2, name: 'SEND & DSL Module', status: 'done', q: 'Q4 2025', type: 'Product', color: '#22C55E', width: 15 },
    { id: 3, name: 'Trust Dashboard', status: 'done', q: 'Q1 2026', type: 'Product', color: '#22C55E', width: 12 },
    { id: 4, name: 'Marketing Automation', status: 'in-progress', q: 'Q1 2026', type: 'Internal', color: '#0D9488', width: 20 },
    { id: 5, name: 'CRM Pipeline Rebuild', status: 'in-progress', q: 'Q1 2026', type: 'Internal', color: '#0D9488', width: 18 },
    { id: 6, name: 'Schools Live Portal — 10 pilots', status: 'in-progress', q: 'Q1 2026', type: 'Growth', color: '#F59E0B', width: 25 },
    { id: 7, name: 'Parent Portal MVP', status: 'planned', q: 'Q2 2026', type: 'Product', color: '#6B7280', width: 22 },
    { id: 8, name: 'Mobile App (iOS + Android)', status: 'blocked', q: 'Q2–3 2026', type: 'Product', color: '#EF4444', width: 35 },
    { id: 9, name: 'Enterprise SSO', status: 'planned', q: 'Q3 2026', type: 'Product', color: '#8B5CF6', width: 18 },
    { id: 10, name: 'API v2 + Developer Portal', status: 'planned', q: 'Q2 2026', type: 'Platform', color: '#8B5CF6', width: 20 },
    { id: 11, name: 'AI Lesson Plan Generator', status: 'planned', q: 'Q3 2026', type: 'Product', color: '#8B5CF6', width: 22 },
    { id: 12, name: 'Ofsted Evidence Pack Export', status: 'planned', q: 'Q2 2026', type: 'Product', color: '#8B5CF6', width: 15 },
  ]

  const quarters = ['Q4 2025', 'Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026']
  const qColors: Record<string, string> = { 'Product': '#0D9488', 'Internal': '#8B5CF6', 'Growth': '#F59E0B', 'Platform': '#F97316' }

  return (
    <div className="p-5 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Product Roadmap</p>
          <p className="text-xs" style={{ color: '#6B7280' }}>Q4 2025 → Q4 2026 · Theme-based view</p>
        </div>
        <div className="flex gap-2">
          {['Product', 'Internal', 'Growth', 'Platform'].map(t => (
            <span key={t} className="text-xs rounded px-2 py-0.5" style={{ backgroundColor: `${qColors[t]}15`, color: qColors[t] }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Timeline header */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1F2937' }}>
        <div className="grid border-b" style={{ gridTemplateColumns: '200px repeat(5, 1fr)', borderColor: '#1F2937', backgroundColor: '#0A0B11' }}>
          <div className="px-3 py-2 text-xs font-medium" style={{ color: '#6B7280' }}>Initiative</div>
          {quarters.map(q => (
            <div key={q} className="px-3 py-2 text-xs font-semibold border-l text-center" style={{ color: '#9CA3AF', borderColor: '#1F2937' }}>{q}</div>
          ))}
        </div>
        {roadmapItems.map((item, i) => (
          <div key={item.id} className="grid items-center border-b" style={{ gridTemplateColumns: '200px repeat(5, 1fr)', borderColor: '#1F2937', backgroundColor: i % 2 === 0 ? '#111318' : 'transparent', minHeight: 44 }}>
            <div className="px-3 py-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <p className="text-xs" style={{ color: '#D1D5DB' }}>{item.name}</p>
            </div>
            {quarters.map((q, qi) => {
              const active = item.q.includes(q) || item.q === q
              return (
                <div key={q} className="px-1 py-2 border-l" style={{ borderColor: '#1F2937' }}>
                  {active && (
                    <div className="rounded h-6 flex items-center px-2" style={{ backgroundColor: `${item.color}25`, border: `1px solid ${item.color}50` }}>
                      <p className="text-xs truncate" style={{ color: item.color, fontSize: 10 }}>{item.status === 'done' ? '✓ Done' : item.status === 'blocked' ? '⛔ Blocked' : item.status === 'in-progress' ? '▶ Active' : '◦ Planned'}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── OKRs Tab ─────────────────────────────────────────────────────────────────
function OKRsTab() {
  const statusCfgOkr = {
    'on-track': { label: 'On Track', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
    'at-risk':  { label: 'At Risk',  color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
    'off-track':{ label: 'Off Track',color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
    'done':     { label: 'Done',     color: '#0D9488', bg: 'rgba(13,148,136,0.12)' },
  }

  return (
    <div className="p-5 flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Objectives', value: '4', color: '#F9FAFB' },
          { label: 'On Track', value: '2', color: '#22C55E' },
          { label: 'At Risk', value: '1', color: '#F59E0B' },
          { label: 'Off Track', value: '1', color: '#EF4444' },
        ].map(s => <StatCard key={s.label} label={s.label} value={s.value} color={s.color} />)}
      </div>

      {OKRS.map(obj => {
        const s = statusCfgOkr[obj.status]
        const avgProgress = Math.round(obj.krs.reduce((a, kr) => a + kr.progress, 0) / obj.krs.length)
        return (
          <div key={obj.objective} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${s.color}30` }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ backgroundColor: `${s.color}08`, borderBottom: '1px solid #1F2937' }}>
              <div className="flex items-start gap-3 flex-1">
                <Target size={16} style={{ color: s.color, flexShrink: 0, marginTop: 2 }} />
                <div className="flex-1">
                  <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{obj.objective}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs" style={{ color: '#6B7280' }}>{obj.quarter} · {obj.owner}</span>
                    <span className="rounded px-1.5 py-0.5 text-xs font-semibold" style={{ color: s.color, backgroundColor: s.bg }}>{s.label}</span>
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <p className="text-2xl font-black" style={{ color: s.color }}>{avgProgress}%</p>
                <p className="text-xs" style={{ color: '#6B7280' }}>overall</p>
              </div>
            </div>
            <div className="p-4 flex flex-col gap-3" style={{ backgroundColor: '#111318' }}>
              {obj.krs.map(kr => {
                const krs = statusCfgOkr[kr.status]
                return (
                  <div key={kr.kr}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-xs" style={{ color: '#6B7280' }}>KR</span>
                        <p className="text-xs flex-1" style={{ color: '#D1D5DB' }}>{kr.kr}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <span className="text-xs" style={{ color: '#6B7280' }}>{kr.current} → {kr.target}</span>
                        <span className="text-xs font-bold" style={{ color: krs.color }}>{kr.progress}%</span>
                      </div>
                    </div>
                    <ProgressBar value={kr.progress} color={krs.color} height={3} />
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Backlog Tab ──────────────────────────────────────────────────────────────
function BacklogTab() {
  const sorted = [...BACKLOG].sort((a, b) => b.score - a.score)

  return (
    <div className="p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Product Backlog</p>
          <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Prioritised using RICE scoring (Reach × Impact × Confidence ÷ Effort)</p>
        </div>
        <button className="flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
          <Plus size={12} /> Add Item
        </button>
      </div>

      {/* RICE explainer */}
      <div className="rounded-lg px-4 py-3 flex items-center gap-6" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        {[
          { label: 'Reach', desc: 'Users affected / quarter', color: '#0D9488' },
          { label: 'Impact', desc: 'Outcome improvement (1-10)', color: '#8B5CF6' },
          { label: 'Confidence', desc: 'Certainty in estimates (1-10)', color: '#F59E0B' },
          { label: 'Effort', desc: 'Engineer-months', color: '#EF4444' },
        ].map(r => (
          <div key={r.label}>
            <p className="text-xs font-bold" style={{ color: r.color }}>{r.label}</p>
            <p className="text-xs" style={{ color: '#6B7280' }}>{r.desc}</p>
          </div>
        ))}
        <div className="ml-auto text-xs rounded px-2 py-1" style={{ backgroundColor: '#0A0B11', color: '#9CA3AF', border: '1px solid #1F2937' }}>
          Score = (R × I × C) ÷ E
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1F2937' }}>
        <div className="grid px-5 py-2" style={{ gridTemplateColumns: '2fr 80px 40px 40px 40px 40px 80px 80px 60px', backgroundColor: '#0A0B11', borderBottom: '1px solid #1F2937' }}>
          {['Item', 'Type', 'R', 'I', 'C', 'E', 'RICE Score', 'Status', 'Votes'].map(h => (
            <p key={h} className="text-xs font-medium uppercase" style={{ color: '#6B7280' }}>{h}</p>
          ))}
        </div>
        {sorted.map((item, i) => (
          <div key={item.id} className="grid items-center px-5 py-3 gap-2"
            style={{ gridTemplateColumns: '2fr 80px 40px 40px 40px 40px 80px 80px 60px', borderBottom: '1px solid #1F2937', backgroundColor: i % 2 === 0 ? '#111318' : 'transparent' }}>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: '#4B5563' }}>#{i + 1}</span>
              <p className="text-sm" style={{ color: '#F9FAFB' }}>{item.title}</p>
            </div>
            <span className="text-xs rounded px-1.5 py-0.5" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>{item.type}</span>
            {[item.rice.reach, item.rice.impact, item.rice.confidence, item.rice.effort].map((v, j) => (
              <p key={j} className="text-xs font-mono text-center" style={{ color: j === 3 ? '#EF4444' : '#0D9488' }}>{v}</p>
            ))}
            <p className="text-sm font-black" style={{ color: item.score > 150 ? '#22C55E' : item.score > 80 ? '#F59E0B' : '#9CA3AF' }}>{item.score}</p>
            <span className="text-xs rounded px-1.5 py-0.5" style={{
              color: item.status === 'In sprint' ? '#0D9488' : item.status === 'Prioritised' ? '#22C55E' : item.status === 'Under review' ? '#F59E0B' : '#6B7280',
              backgroundColor: item.status === 'In sprint' ? 'rgba(13,148,136,0.12)' : item.status === 'Prioritised' ? 'rgba(34,197,94,0.12)' : item.status === 'Under review' ? 'rgba(245,158,11,0.12)' : '#1F2937',
            }}>{item.status}</span>
            <div className="flex items-center gap-1">
              <Star size={10} style={{ color: '#F59E0B' }} />
              <p className="text-xs" style={{ color: '#9CA3AF' }}>{item.votes}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Risks Tab ────────────────────────────────────────────────────────────────
function RisksTab() {
  return (
    <div className="p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>Risk Register</p>
        <button className="flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
          <Plus size={12} /> Log Risk
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Risks', value: String(RISKS.length), color: '#F9FAFB' },
          { label: 'Active', value: String(RISKS.filter(r => r.status === 'Active').length), color: '#EF4444' },
          { label: 'Mitigating', value: String(RISKS.filter(r => r.status === 'Mitigating').length), color: '#F59E0B' },
          { label: 'Monitoring', value: String(RISKS.filter(r => r.status === 'Monitoring').length), color: '#22C55E' },
        ].map(s => <StatCard key={s.label} label={s.label} value={s.value} color={s.color} />)}
      </div>

      {RISKS.map((risk, i) => {
        const isHigh = risk.probability === 'High' && risk.impact === 'High'
        const isCritical = risk.probability === 'High' && risk.impact === 'Critical'
        const color = isCritical || (isHigh && risk.status === 'Active') ? '#EF4444' : risk.probability === 'High' ? '#F59E0B' : '#6B7280'
        return (
          <div key={risk.id} className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: `1px solid ${color}30` }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-2 flex-1">
                <AlertTriangle size={14} style={{ color, flexShrink: 0, marginTop: 1 }} />
                <p className="text-sm font-medium" style={{ color: '#F9FAFB' }}>{risk.risk}</p>
              </div>
              <span className="text-xs rounded px-1.5 py-0.5 flex-shrink-0" style={{
                color: risk.status === 'Active' ? '#EF4444' : risk.status === 'Mitigating' ? '#F59E0B' : '#22C55E',
                backgroundColor: risk.status === 'Active' ? 'rgba(239,68,68,0.12)' : risk.status === 'Mitigating' ? 'rgba(245,158,11,0.12)' : 'rgba(34,197,94,0.12)',
              }}>{risk.status}</span>
            </div>
            <div className="flex items-center gap-4 text-xs mb-3" style={{ color: '#6B7280' }}>
              <span>Project: <span style={{ color: '#0D9488' }}>{risk.project}</span></span>
              <span>Probability: <span style={{ color }}>{risk.probability}</span></span>
              <span>Impact: <span style={{ color }}>{risk.impact}</span></span>
              <span>Owner: <span style={{ color: '#D1D5DB' }}>{risk.owner}</span></span>
            </div>
            <div className="rounded-lg px-3 py-2 text-xs" style={{ backgroundColor: '#0A0B11', color: '#9CA3AF' }}>
              <span style={{ color: '#6B7280' }}>Mitigation: </span>{risk.action}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Team Tab ─────────────────────────────────────────────────────────────────
function TeamTab() {
  const teamMembers = [
    { name: 'Sarah Henley', role: 'Product Lead', initials: 'SH', color: '#0D9488', projects: ['LSP', 'ESS'], points: 21, capacity: 85, skills: ['Strategy', 'Frontend', 'SEND domain'] },
    { name: 'David Mitchell', role: 'Eng. Lead', initials: 'DM', color: '#8B5CF6', projects: ['CPR', 'LSP'], points: 16, capacity: 92, skills: ['Backend', 'API', 'CRM systems'] },
    { name: 'Kate Brown', role: 'Marketing PM', initials: 'KB', color: '#F59E0B', projects: ['MAU', 'LSP'], points: 8, capacity: 70, skills: ['Marketing', 'Content', 'SEO'] },
    { name: 'James Park', role: 'Mobile Dev', initials: 'JP', color: '#EF4444', projects: ['MAM', 'CPR'], points: 13, capacity: 110, skills: ['iOS', 'Android', 'React Native'] },
    { name: 'Tom Liu', role: 'Backend Dev', initials: 'TL', color: '#22C55E', projects: ['MAM', 'APD'], points: 11, capacity: 108, skills: ['Node.js', 'APIs', 'DevOps'] },
  ]

  return (
    <div className="p-5 flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Team Members" value="5" sub="2 over capacity" color="#F9FAFB" />
        <StatCard label="Avg Capacity" value="93%" sub="JP + TL overloaded" rag="amber" />
        <StatCard label="Sprint Points" value="69 total" sub="across all members" color="#0D9488" />
        <StatCard label="Blocked Members" value="1" sub="JP — iOS cert issue" rag="red" />
      </div>

      {teamMembers.map(m => (
        <div key={m.name} className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="flex items-start gap-4">
            <Avatar initials={m.initials} color={m.color} />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className="text-sm font-bold" style={{ color: '#F9FAFB' }}>{m.name}</p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>{m.role}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black" style={{ color: m.capacity > 100 ? '#EF4444' : m.capacity > 85 ? '#F59E0B' : '#22C55E' }}>{m.capacity}%</p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>Capacity</p>
                </div>
              </div>
              <div className="mb-2">
                <div className="flex justify-between text-xs mb-1" style={{ color: '#9CA3AF' }}>
                  <span>Capacity utilisation</span>
                  <span style={{ color: m.capacity > 100 ? '#EF4444' : '#9CA3AF' }}>{m.capacity > 100 ? 'OVER CAPACITY' : 'OK'}</span>
                </div>
                <ProgressBar value={Math.min(m.capacity, 100)} color={m.capacity > 100 ? '#EF4444' : m.capacity > 85 ? '#F59E0B' : '#22C55E'} />
              </div>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex gap-1 flex-wrap">
                  {m.projects.map(p => (
                    <span key={p} className="text-xs rounded px-1.5 py-0.5 font-mono" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>{p}</span>
                  ))}
                </div>
                <div className="flex gap-1 flex-wrap">
                  {m.skills.map(s => (
                    <span key={s} className="text-xs rounded px-1.5 py-0.5" style={{ backgroundColor: `${m.color}15`, color: m.color }}>{s}</span>
                  ))}
                </div>
                <p className="text-xs" style={{ color: '#6B7280' }}>{m.points}pts this sprint</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',  label: '📊 Overview' },
  { id: 'kanban',    label: '📋 Board',     badge: 3 },
  { id: 'sprint',    label: '⚡ Sprint' },
  { id: 'roadmap',   label: '🗺️ Roadmap' },
  { id: 'okrs',      label: '🎯 OKRs',      badge: 1 },
  { id: 'backlog',   label: '📦 Backlog' },
  { id: 'risks',     label: '⚠️ Risks',     badge: 2 },
  { id: 'team',      label: '👥 Team' },
]

export default function ProjectsPage() {
  const [tab, setTab] = useState('overview')

  const hasData = useHasDashboardData('projects')

  const deptStaff = getDeptStaff('projects')
  const deptLead = getDeptLead(deptStaff)

  if (hasData === null) return null
  if (!hasData) return (
    <>
      {deptStaff.length > 0 && <DeptStaffHeader staff={deptStaff} lead={deptLead} dept="projects" />}
      <DashboardEmptyState pageKey="projects"
        title={deptLead ? `${getStaffName(deptLead).split(' ')[0]} is ready — add your projects data` : 'No project data yet'}
        description={deptLead ? `${getStaffName(deptLead)} is set up as ${deptLead.job_title || 'Projects Lead'}. Create your first project or import your existing project data to activate the Project Management module with kanban, sprints and OKRs.` : 'Create your first project or import your existing project data to activate the Project Management module with kanban, sprints and OKRs.'}
        uploads={[
          { key: 'projects', label: 'Upload Projects (CSV)' },
          { key: 'tasks', label: 'Upload Tasks (CSV)' },
        ]}
      />
    </>
  )

  const PM_AI: Record<string, { summary: string; highlights: Array<{n:number;text:string;color:string}> }> = {
    overview: { summary: '3 projects active \u2014 all on track. Sprint velocity up 12%. 2 risks need board review this week.', highlights: [{ n:1, text:'Project Alpha 2 days behind \u2014 flag blockers today', color:'text-red-400' },{ n:2, text:'Sprint velocity up 12% \u2014 strongest quarter', color:'text-teal-400' },{ n:3, text:'2 risks need board decision this week', color:'text-amber-400' },{ n:4, text:'Roadmap Q3 priorities not yet confirmed', color:'text-amber-400' },{ n:5, text:'Team capacity 91% \u2014 review resourcing', color:'text-teal-400' }] },
    kanban: { summary: '14 cards in progress, 3 blocked. API integration ticket overdue 4 days.', highlights: [{ n:1, text:'3 cards blocked \u2014 unblock before standup', color:'text-red-400' },{ n:2, text:'API ticket 4 days overdue \u2014 escalate', color:'text-red-400' },{ n:3, text:'6 cards in review \u2014 batch to clear backlog', color:'text-amber-400' },{ n:4, text:'12 cards completed this sprint', color:'text-teal-400' },{ n:5, text:'Cycle time improving \u2014 3.2 days vs 4.1 last sprint', color:'text-teal-400' }] },
    sprint: { summary: 'Sprint 73% complete, 4 days remaining. 2 stories at risk. Velocity on track.', highlights: [{ n:1, text:'2 stories at risk this sprint', color:'text-red-400' },{ n:2, text:'73% complete with 4 days left \u2014 on track', color:'text-teal-400' },{ n:3, text:'Same blocker 3 days running \u2014 resolve today', color:'text-amber-400' },{ n:4, text:'Bug count down 40% vs last sprint', color:'text-teal-400' },{ n:5, text:'Sprint review Friday \u2014 prep demo environment', color:'text-amber-400' }] },
    roadmap: { summary: 'Q2 roadmap 68% delivered. 3 features slipped to Q3. Q3 planning not started.', highlights: [{ n:1, text:'3 features slipped to Q3 \u2014 update stakeholders', color:'text-red-400' },{ n:2, text:'Q3 planning not started \u2014 begin this week', color:'text-amber-400' },{ n:3, text:'Mobile feature ahead of schedule', color:'text-teal-400' },{ n:4, text:'Design backlog growing \u2014 resource needed', color:'text-amber-400' },{ n:5, text:'Customer-requested features: 4 in Q3 scope', color:'text-teal-400' }] },
    okrs: { summary: 'Q2 OKRs at 73%. 2 key results behind. 1 ahead of schedule.', highlights: [{ n:1, text:'KR: New signups at 67% of target', color:'text-amber-400' },{ n:2, text:'KR: NPS 67 vs 65 goal \u2014 ahead', color:'text-teal-400' },{ n:3, text:'KR: Revenue on track \u2014 2 deals critical', color:'text-amber-400' },{ n:4, text:'Q3 OKR planning should start now', color:'text-amber-400' },{ n:5, text:'Team OKR alignment improving', color:'text-teal-400' }] },
    backlog: { summary: '47 items in backlog. 12 high priority. 6 items over 90 days old \u2014 need triage.', highlights: [{ n:1, text:'6 backlog items over 90 days \u2014 triage now', color:'text-red-400' },{ n:2, text:'12 high priority items unassigned', color:'text-amber-400' },{ n:3, text:'Backlog grew 18% this sprint \u2014 needs grooming', color:'text-amber-400' },{ n:4, text:'5 quick wins under 2 hours each', color:'text-teal-400' },{ n:5, text:'Next grooming session overdue by 1 week', color:'text-amber-400' }] },
    risks: { summary: '2 high risks, 3 medium active. One escalated to board. Mitigations in place.', highlights: [{ n:1, text:'RISK-01: Key person dependency \u2014 plan incomplete', color:'text-red-400' },{ n:2, text:'RISK-02: API supplier \u2014 contingency identified', color:'text-amber-400' },{ n:3, text:'2 risks closed this month', color:'text-teal-400' },{ n:4, text:'Board risk review Thursday \u2014 prep summary', color:'text-amber-400' },{ n:5, text:'Insurance renewal due \u2014 check coverage', color:'text-amber-400' }] },
    team: { summary: 'Team of 8, capacity 91%. 2 members at risk of burnout. 1 role open.', highlights: [{ n:1, text:'2 team members flagged for workload review', color:'text-red-400' },{ n:2, text:'1 open role \u2014 slowing delivery', color:'text-amber-400' },{ n:3, text:'Team satisfaction score 7.8/10', color:'text-teal-400' },{ n:4, text:'3 members have training requests pending', color:'text-amber-400' },{ n:5, text:'Velocity per person up 8% this quarter', color:'text-teal-400' }] },
  }
  const currentPMAI = PM_AI[tab] || PM_AI.overview

  return (
    <div className="flex flex-col gap-0" style={{ backgroundColor: '#07080F', minHeight: '100vh' }}>
      {/* Page header */}
      <div className="px-6 pt-6 pb-4" style={{ borderBottom: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Layers size={18} style={{ color: '#0D9488' }} />
              <h1 className="text-xl font-black" style={{ color: '#F9FAFB' }}>Project Management</h1>
            </div>
            <p className="text-sm" style={{ color: '#6B7280' }}>
              {PROJECTS.filter(p => p.status === 'in-progress').length} active projects ·
              Sprint 8 in progress · {TASKS.filter(t => t.status === 'blocked').length} blocked tasks
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="text-xs rounded-lg px-3 py-1.5 flex items-center gap-1.5" style={{ backgroundColor: '#111318', color: '#9CA3AF', border: '1px solid #1F2937' }}>
              <Filter size={12} /> Filter
            </button>
            <button className="flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5 font-semibold" style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}>
              <Plus size={12} /> New Project
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto px-2" style={{ backgroundColor: '#07080F', borderBottom: '1px solid #1F2937' }}>
        {TABS.map(t => <TabBtn key={t.id} active={tab === t.id} label={t.label} onClick={() => setTab(t.id)} badge={t.badge} />)}
      </div>

      {/* Content */}
      <div className="flex-1">
        {tab === 'overview' && <Overview />}
        {tab === 'kanban'   && <KanbanBoard />}
        {tab === 'sprint'   && <SprintTab />}
        {tab === 'roadmap'  && <Roadmap />}
        {tab === 'okrs'     && <OKRsTab />}
        {tab === 'backlog'  && <BacklogTab />}
        {tab === 'risks'    && <RisksTab />}
        {tab === 'team'     && <TeamTab />}
      </div>

      {/* AI Intelligence Row — changes per tab */}
      <div className="grid grid-cols-2 gap-4 mx-6 mb-6 mt-8 pt-6" style={{ borderTop: '1px solid #1F2937' }}>
        <div className="rounded-xl p-4" style={{ backgroundColor: '#0d0f1a', border: '1px solid rgba(108,63,197,0.3)' }}>
          <div className="flex items-center gap-2 mb-3">
            <span>{'\u2728'}</span>
            <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>AI Summary</span>
            <span className="text-xs ml-auto" style={{ color: '#6B7280' }}>Generated now</span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: '#D1D5DB' }}>{currentPMAI.summary}</p>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: '#0d0f1a', border: '1px solid rgba(13,148,136,0.3)' }}>
          <div className="flex items-center gap-2 mb-3">
            <span>{'\u26A1'}</span>
            <span className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>AI Key Highlights</span>
            <span className="text-xs ml-auto" style={{ color: '#6B7280' }}>Today</span>
          </div>
          <div className="space-y-2">
            {currentPMAI.highlights.map((h, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className={`text-xs font-bold w-4 flex-shrink-0 mt-0.5 ${h.color}`}>{h.n}</span>
                <span className="text-xs" style={{ color: '#D1D5DB' }}>{h.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
