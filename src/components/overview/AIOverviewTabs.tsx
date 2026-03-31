'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { RotateCcw, Check, Clock, AlertCircle, TrendingUp, TrendingDown, Minus, MessageSquare, X, Link2, ChevronRight, Users, Building2, Pencil } from 'lucide-react'
import { EmployeeProfileCard, ProfileModal, type StaffRecord } from '@/components/team/EmployeeProfileCard'

// ─── Types ───────────────────────────────────────────────────────────────────

interface AIContext {
  userName: string
  company: string
  role: string
  department: string
  activeDepartment?: string
  isDirector?: boolean
  connectedIntegrations: string[]
  importedData: { hasStaff: boolean; hasContacts: boolean; hasAccounts: boolean }
  importedStaff?: { first_name?: string; last_name?: string; job_title?: string; department?: string }[]
  departmentStaff?: { first_name?: string; last_name?: string; job_title?: string; department?: string }[]
}

interface QuickWin { id: string; title: string; description: string; impact: 'HIGH' | 'MEDIUM'; timeEstimate: string; department: string; actionLabel: string; source: string }
interface DailyTask { id: string; title: string; description: string; priority: 'urgent' | 'high' | 'normal'; category: string; dueTime: string | null; estimatedMinutes: number }
interface Insight { id: string; title: string; summary: string; trend: 'up' | 'down' | 'neutral' | 'alert'; metric: string | null; recommendation: string; category: string }
interface DontMissItem { id: string; title: string; description: string; urgency: 'critical' | 'high' | 'medium'; deadline: string | null; actionLabel: string; category: string }
interface TeamMember { id: string; name: string; role: string; department: string; status: 'available' | 'in-meeting' | 'busy' | 'away'; currentFocus: string; needsAttention: boolean; attentionNote: string | null }

type TeamSubTab = 'staff' | 'org' | 'info'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTimeOfDay(): string {
  const h = new Date().getHours()
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'
}

function getDayOfWeek(): string {
  return new Date().toLocaleDateString('en-GB', { weekday: 'long' })
}

const CACHE_TTL = 30 * 60 * 1000 // 30 minutes
const DISMISS_TTL = 24 * 60 * 60 * 1000 // 24 hours

function getCached<T>(tab: string): T | null {
  if (typeof window === 'undefined') return null
  const ts = localStorage.getItem(`lumio_ai_${tab}_timestamp`)
  if (!ts || Date.now() - parseInt(ts) > CACHE_TTL) return null
  const raw = localStorage.getItem(`lumio_ai_${tab}_cache`)
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

function setCache(tab: string, data: unknown) {
  if (typeof window === 'undefined') return
  localStorage.setItem(`lumio_ai_${tab}_cache`, JSON.stringify(data))
  localStorage.setItem(`lumio_ai_${tab}_timestamp`, String(Date.now()))
}

// Dismissed items with 24hr expiry
function getDismissed(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem('lumio_dontmiss_dismissed')
    if (!raw) return new Set()
    const entries: { id: string; at: number }[] = JSON.parse(raw)
    const now = Date.now()
    const valid = entries.filter(e => now - e.at < DISMISS_TTL)
    // Clean up expired
    if (valid.length !== entries.length) {
      localStorage.setItem('lumio_dontmiss_dismissed', JSON.stringify(valid))
    }
    return new Set(valid.map(e => e.id))
  } catch { return new Set() }
}

function saveDismissed(ids: Set<string>) {
  if (typeof window === 'undefined') return
  const now = Date.now()
  // Preserve existing timestamps, add new ones with current time
  let existing: { id: string; at: number }[] = []
  try {
    const raw = localStorage.getItem('lumio_dontmiss_dismissed')
    if (raw) existing = JSON.parse(raw)
  } catch { /* ignore */ }
  const map = new Map(existing.map(e => [e.id, e.at]))
  const entries = Array.from(ids).map(id => ({ id, at: map.get(id) || now }))
  localStorage.setItem('lumio_dontmiss_dismissed', JSON.stringify(entries))
}

function clearDismissed() {
  if (typeof window !== 'undefined') localStorage.removeItem('lumio_dontmiss_dismissed')
}

function useAIFetch<T>(tab: string, ctx: AIContext, extraContext?: Record<string, unknown>) {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchData = useCallback(async (force = false) => {
    if (!force) {
      const cached = getCached<T[]>(tab)
      if (cached) { setItems(cached); setLoading(false); return }
    }
    setLoading(true)
    setError(false)
    try {
      const token = localStorage.getItem('workspace_session_token') || ''
      const res = await fetch('/api/ai/overview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-workspace-token': token },
        body: JSON.stringify({
          tab,
          context: { ...ctx, ...extraContext, timeOfDay: getTimeOfDay(), dayOfWeek: getDayOfWeek() },
        }),
      })
      if (!res.ok) throw new Error('fetch failed')
      const data = await res.json()
      setItems(data.items || [])
      setCache(tab, data.items || [])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [tab, ctx])

  useEffect(() => { fetchData() }, [fetchData])

  return { items, loading, error, regenerate: () => fetchData(true) }
}

// ─── Shared UI ───────────────────────────────────────────────────────────────

function SkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl p-5 animate-pulse" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <div className="h-4 rounded w-1/3 mb-3" style={{ backgroundColor: '#1F2937' }} />
          <div className="h-3 rounded w-2/3 mb-2" style={{ backgroundColor: '#1F2937' }} />
          <div className="h-3 rounded w-1/2" style={{ backgroundColor: '#1F2937' }} />
        </div>
      ))}
    </div>
  )
}

function hasRealData(checks: ('staff' | 'contacts' | 'integrations')[]): boolean {
  if (typeof window === 'undefined') return false
  for (const c of checks) {
    if (c === 'staff') { try { if (JSON.parse(localStorage.getItem('lumio_staff_imported') || '[]').length > 0) return true } catch { /* */ } }
    if (c === 'contacts') { try { if (JSON.parse(localStorage.getItem('lumio_crm_contacts') || '[]').length > 0) return true } catch { /* */ } }
    if (c === 'integrations') { if (Object.keys(localStorage).some(k => k.startsWith('lumio_integration_') && localStorage.getItem(k) === 'true')) return true }
  }
  return false
}

function NoBanner() {
  return (
    <div className="flex items-center gap-3 rounded-xl px-4 py-3 mb-4" style={{ backgroundColor: 'rgba(108,63,197,0.08)', border: '1px solid rgba(108,63,197,0.2)' }}>
      <Link2 size={16} style={{ color: '#A78BFA', flexShrink: 0 }} />
      <p className="text-xs" style={{ color: '#A78BFA' }}>These suggestions are AI-generated based on your role. Connect your tools in Settings for personalised insights.</p>
    </div>
  )
}

function TabHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{title}</p>
      {right}
    </div>
  )
}

function RegenerateBtn({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button onClick={onClick} disabled={loading} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(108,63,197,0.15)', color: '#A78BFA', border: '1px solid rgba(108,63,197,0.3)', opacity: loading ? 0.5 : 1 }}>
      <RotateCcw size={11} className={loading ? 'animate-spin' : ''} /> Regenerate
    </button>
  )
}

function ErrorCard() {
  return (
    <div className="rounded-xl p-6 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <p className="text-sm mb-1" style={{ color: '#EF4444' }}>Failed to generate content</p>
      <p className="text-xs" style={{ color: '#6B7280' }}>Check your API key or try again</p>
    </div>
  )
}

// ─── Trend Icon (shared) ─────────────────────────────────────────────────────

function TrendIcon({ trend }: { trend: string }) {
  switch (trend) {
    case 'up': return <TrendingUp size={16} style={{ color: '#22C55E' }} />
    case 'down': return <TrendingDown size={16} style={{ color: '#EF4444' }} />
    case 'alert': return <AlertCircle size={16} style={{ color: '#F59E0B' }} />
    case 'neutral':
    default: return <Minus size={16} style={{ color: '#6B7280' }} />
  }
}

function trendMetricColor(trend: string): { bg: string; fg: string } {
  switch (trend) {
    case 'up': return { bg: 'rgba(34,197,94,0.15)', fg: '#22C55E' }
    case 'down': return { bg: 'rgba(239,68,68,0.15)', fg: '#EF4444' }
    case 'alert': return { bg: 'rgba(245,158,11,0.15)', fg: '#F59E0B' }
    default: return { bg: 'rgba(107,114,128,0.15)', fg: '#9CA3AF' }
  }
}

// ─── Quick Wins ──────────────────────────────────────────────────────────────

export function AIQuickWins({ ctx }: { ctx: AIContext }) {
  const { items, loading, error, regenerate } = useAIFetch<QuickWin>('quick-wins', ctx)
  const [done, setDone] = useState<Set<string>>(new Set())
  const showBanner = !hasRealData(['integrations'])

  function markDone(id: string) { setDone(prev => new Set(prev).add(id)) }

  return (
    <div>
      <TabHeader title="Quick Wins" right={
        <div className="flex items-center gap-3">
          {!loading && <span className="text-xs font-semibold" style={{ color: '#0D9488' }}>{done.size}/{items.length} done today</span>}
          <RegenerateBtn onClick={regenerate} loading={loading} />
        </div>
      } />
      {showBanner && <NoBanner />}
      {error ? <ErrorCard /> : loading ? <SkeletonCards count={4} /> : (
        <div className="space-y-3">
          {items.map(win => {
            const isDone = done.has(win.id)
            return (
              <div key={win.id} className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', opacity: isDone ? 0.45 : 1 }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: win.impact === 'HIGH' ? 'rgba(34,197,94,0.15)' : 'rgba(245,166,35,0.15)', color: win.impact === 'HIGH' ? '#22C55E' : '#F5A623' }}>
                        {win.impact} IMPACT
                      </span>
                      <span className="text-xs" style={{ color: '#6B7280' }}>{win.timeEstimate}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>{win.department}</span>
                    </div>
                    <p className="text-sm font-semibold mb-0.5" style={{ color: '#F9FAFB', textDecoration: isDone ? 'line-through' : undefined }}>{win.title}</p>
                    <p className="text-xs" style={{ color: '#6B7280' }}>{win.description}</p>
                    <p className="text-xs mt-1" style={{ color: '#4B5563' }}>Source: {win.source}</p>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    {!isDone && (
                      <button onClick={() => markDone(win.id)} className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(108,63,197,0.15)', color: '#A78BFA', border: '1px solid rgba(108,63,197,0.3)' }}>
                        {win.actionLabel}
                      </button>
                    )}
                    <button onClick={() => markDone(win.id)} className="text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1" style={{ color: isDone ? '#22C55E' : '#6B7280', backgroundColor: isDone ? 'rgba(34,197,94,0.1)' : 'transparent', border: isDone ? 'none' : '1px solid #1F2937' }}>
                      {isDone ? <><Check size={10} /> Done</> : 'Mark done'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Daily Tasks ─────────────────────────────────────────────────────────────

export function AIDailyTasks({ ctx }: { ctx: AIContext }) {
  const { items, loading, error, regenerate } = useAIFetch<DailyTask>('daily-tasks', ctx)
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const showBanner = !hasRealData(['integrations'])

  function toggle(id: string) {
    setChecked(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  const priorityOrder: Record<string, number> = { urgent: 0, high: 1, normal: 2 }
  const sorted = [...items].sort((a, b) => (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2))
  const pctDone = items.length ? Math.round((checked.size / items.length) * 100) : 0

  const priorityColor: Record<string, string> = { urgent: '#EF4444', high: '#F59E0B', normal: '#6B7280' }
  const priorityBg: Record<string, string> = { urgent: 'rgba(239,68,68,0.12)', high: 'rgba(245,158,11,0.12)', normal: 'rgba(107,114,128,0.12)' }

  return (
    <div>
      <TabHeader title="Daily Tasks" right={
        <div className="flex items-center gap-3">
          {!loading && <span className="text-xs font-semibold" style={{ color: '#0D9488' }}>{checked.size}/{items.length} complete</span>}
          <RegenerateBtn onClick={regenerate} loading={loading} />
        </div>
      } />
      {showBanner && <NoBanner />}
      {error ? <ErrorCard /> : loading ? <SkeletonCards count={5} /> : (
        <>
          <div className="rounded-full h-2 mb-4 overflow-hidden" style={{ backgroundColor: '#1F2937' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${pctDone}%`, backgroundColor: '#0D9488' }} />
          </div>
          <div className="space-y-2">
            {sorted.map(task => {
              const isDone = checked.has(task.id)
              return (
                <div key={task.id} className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', opacity: isDone ? 0.45 : 1 }}>
                  <button onClick={() => toggle(task.id)} className="mt-0.5 shrink-0 flex items-center justify-center rounded-md" style={{ width: 20, height: 20, border: isDone ? 'none' : '2px solid #374151', backgroundColor: isDone ? '#0D9488' : 'transparent' }}>
                    {isDone && <Check size={12} style={{ color: '#fff' }} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: priorityBg[task.priority] || priorityBg.normal, color: priorityColor[task.priority] || priorityColor.normal }}>
                        {task.priority.toUpperCase()}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>{task.category}</span>
                      {task.dueTime && <span className="text-xs inline-flex items-center gap-0.5" style={{ color: '#F59E0B' }}><Clock size={10} />{task.dueTime}</span>}
                    </div>
                    <p className="text-sm font-medium" style={{ color: '#F9FAFB', textDecoration: isDone ? 'line-through' : undefined }}>{task.title}</p>
                    <p className="text-xs" style={{ color: '#6B7280' }}>{task.description}</p>
                  </div>
                  <span className="text-xs shrink-0 mt-1" style={{ color: '#4B5563' }}>{task.estimatedMinutes}m</span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Insights ────────────────────────────────────────────────────────────────

export function AIInsights({ ctx }: { ctx: AIContext }) {
  const { items, loading, error, regenerate } = useAIFetch<Insight>('insights', ctx)
  const showBanner = !hasRealData(['integrations'])

  return (
    <div>
      <TabHeader title="Insights" right={<RegenerateBtn onClick={regenerate} loading={loading} />} />
      {showBanner && <NoBanner />}
      {error ? <ErrorCard /> : loading ? <SkeletonCards count={4} /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map(insight => {
            const mc = trendMetricColor(insight.trend)
            return (
              <div key={insight.id} className="rounded-xl p-4 flex flex-col" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                <div className="flex items-start gap-3 mb-3">
                  <div className="shrink-0 mt-0.5 flex items-center justify-center rounded-lg" style={{ width: 32, height: 32, backgroundColor: trendMetricColor(insight.trend).bg }}>
                    <TrendIcon trend={insight.trend} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{insight.title}</p>
                      {insight.metric && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: mc.bg, color: mc.fg }}>
                          {insight.metric}
                        </span>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>{insight.summary}</p>
                    <span className="text-xs px-1.5 py-0.5 rounded mt-1.5 inline-block" style={{ backgroundColor: '#1F2937', color: '#6B7280' }}>{insight.category}</span>
                  </div>
                </div>
                <div className="mt-auto rounded-lg px-3 py-2.5" style={{ backgroundColor: 'rgba(13,148,136,0.06)', border: '1px solid rgba(13,148,136,0.15)' }}>
                  <p className="text-xs font-medium inline-flex items-center gap-1" style={{ color: '#0D9488' }}><ChevronRight size={10} />{insight.recommendation}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Don't Miss ──────────────────────────────────────────────────────────────

export function AIDontMiss({ ctx }: { ctx: AIContext }) {
  const { items, loading, error, regenerate: baseRegenerate } = useAIFetch<DontMissItem>('dont-miss', ctx)
  const [dismissed, setDismissed] = useState<Set<string>>(getDismissed)
  const showBanner = !hasRealData(['integrations'])

  const urgencyColor: Record<string, string> = { critical: '#EF4444', high: '#F59E0B', medium: '#FBBF24' }
  const urgencyBg: Record<string, string> = { critical: 'rgba(239,68,68,0.08)', high: 'rgba(245,158,11,0.08)', medium: 'rgba(251,191,36,0.08)' }

  function dismiss(id: string) {
    const next = new Set(dismissed).add(id)
    setDismissed(next)
    saveDismissed(next)
  }

  function regenerate() {
    clearDismissed()
    setDismissed(new Set())
    baseRegenerate()
  }

  const visible = items.filter(i => !dismissed.has(i.id))

  return (
    <div>
      <TabHeader title="Don't Miss" right={<RegenerateBtn onClick={regenerate} loading={loading} />} />
      {showBanner && <NoBanner />}
      {error ? <ErrorCard /> : loading ? <SkeletonCards /> : visible.length === 0 ? (
        <div className="rounded-xl p-8 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <p className="text-sm" style={{ color: '#22C55E' }}>All clear! Nothing urgent right now.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(item => (
            <div key={item.id} className="rounded-xl overflow-hidden" style={{ backgroundColor: urgencyBg[item.urgency] || urgencyBg.medium, border: '1px solid #1F2937' }}>
              <div className="flex" style={{ minHeight: 0 }}>
                <div style={{ width: 4, backgroundColor: urgencyColor[item.urgency] || urgencyColor.medium, flexShrink: 0 }} />
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: (urgencyColor[item.urgency] || urgencyColor.medium) + '22', color: urgencyColor[item.urgency] || urgencyColor.medium }}>
                          {item.urgency.toUpperCase()}
                        </span>
                        {item.deadline && <span className="text-xs font-semibold inline-flex items-center gap-0.5" style={{ color: urgencyColor[item.urgency] || urgencyColor.medium }}><Clock size={10} />{item.deadline}</span>}
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>{item.category}</span>
                      </div>
                      <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{item.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{item.description}</p>
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: (urgencyColor[item.urgency] || urgencyColor.medium) + '22', color: urgencyColor[item.urgency] || urgencyColor.medium, border: `1px solid ${urgencyColor[item.urgency] || urgencyColor.medium}44` }}>
                        {item.actionLabel}
                      </button>
                      <button onClick={() => dismiss(item.id)} className="text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1" style={{ color: '#6B7280' }}>
                        <X size={10} /> Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Org Chart ──────────────────────────────────────────────────────────────

type HierarchyLevel = 'csuite' | 'director' | 'manager' | 'staff'

const LEVEL_COLORS: Record<HierarchyLevel, { bg: string; border: string; text: string }> = {
  csuite:   { bg: 'rgba(13,148,136,0.15)', border: 'rgba(13,148,136,0.4)', text: '#0D9488' },
  director: { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)', text: '#3B82F6' },
  manager:  { bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.3)', text: '#9CA3AF' },
  staff:    { bg: 'rgba(75,85,99,0.08)', border: 'rgba(75,85,99,0.25)', text: '#6B7280' },
}

function detectLevel(title: string): HierarchyLevel {
  const t = (title || '').toLowerCase()
  if (/\b(ceo|cto|cfo|coo|cpo|ciso|founder|owner|president|managing director)\b/i.test(t)) return 'csuite'
  if (/\b(director|vp|vice president|head of)\b/i.test(t)) return 'director'
  if (/\b(manager|lead|principal|senior)\b/i.test(t)) return 'manager'
  return 'staff'
}

function getReportingOverrides(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem('lumio_staff_reporting') || '{}') } catch { return {} }
}

function saveReportingOverrides(data: Record<string, string>) {
  if (typeof window !== 'undefined') localStorage.setItem('lumio_staff_reporting', JSON.stringify(data))
}

interface OrgNode { id: string; name: string; role: string; department: string; level: HierarchyLevel; children: OrgNode[] }

function buildHierarchy(members: TeamMember[], userName: string, userRole: string): OrgNode {
  const overrides = getReportingOverrides()
  const root: OrgNode = { id: 'root', name: userName || 'You', role: userRole || 'Manager', department: '', level: 'csuite', children: [] }

  // Categorise members by level
  const byLevel: Record<HierarchyLevel, TeamMember[]> = { csuite: [], director: [], manager: [], staff: [] }
  members.forEach(m => { byLevel[detectLevel(m.role)].push(m) })

  // Build tree with overrides first, then auto-detect
  const placed = new Set<string>()
  const nodeMap = new Map<string, OrgNode>()

  // Create nodes for all members
  members.forEach(m => {
    nodeMap.set(m.id, { id: m.id, name: m.name, role: m.role, department: m.department, level: detectLevel(m.role), children: [] })
  })

  // Apply overrides
  for (const [childId, parentId] of Object.entries(overrides)) {
    const child = nodeMap.get(childId)
    const parent = parentId === 'root' ? root : nodeMap.get(parentId)
    if (child && parent) { parent.children.push(child); placed.add(childId) }
  }

  // Auto-place unplaced members by level
  const unplaced = members.filter(m => !placed.has(m.id))

  // C-Suite → report to root
  unplaced.filter(m => detectLevel(m.role) === 'csuite').forEach(m => {
    const node = nodeMap.get(m.id)!; root.children.push(node); placed.add(m.id)
  })

  // Helper: find first C-Suite node (for cascading)
  const firstCSuite = root.children.find(c => c.level === 'csuite') || null

  // Directors → report to C-Suite in same dept, any C-Suite, or root
  unplaced.filter(m => detectLevel(m.role) === 'director' && !placed.has(m.id)).forEach(m => {
    const node = nodeMap.get(m.id)!
    const deptCSuite = root.children.find(c => c.level === 'csuite' && c.department === m.department)
    const parent = deptCSuite || firstCSuite || root
    parent.children.push(node); placed.add(m.id)
  })

  // Helper: find all placed nodes recursively
  const findInTree = (nodes: OrgNode[], test: (n: OrgNode) => boolean): OrgNode | null => {
    for (const n of nodes) { if (test(n)) return n; const found = findInTree(n.children, test); if (found) return found }
    return null
  }

  // Managers → find Director in same dept, any Director, C-Suite, or root
  unplaced.filter(m => detectLevel(m.role) === 'manager' && !placed.has(m.id)).forEach(m => {
    const node = nodeMap.get(m.id)!
    const parent =
      findInTree(root.children, n => n.level === 'director' && n.department === m.department) ||
      findInTree(root.children, n => n.level === 'director') ||
      firstCSuite || root
    parent.children.push(node); placed.add(m.id)
  })

  // Staff → find Manager in same dept, any Manager, Director in same dept, or root
  unplaced.filter(m => !placed.has(m.id)).forEach(m => {
    const node = nodeMap.get(m.id)!
    const parent =
      findInTree(root.children, n => n.level === 'manager' && n.department === m.department) ||
      findInTree(root.children, n => n.level === 'manager') ||
      findInTree(root.children, n => n.level === 'director' && n.department === m.department) ||
      firstCSuite || root
    parent.children.push(node)
  })

  return root
}

function nodeToStaffRecord(node: OrgNode): StaffRecord {
  const parts = node.name.split(' ')
  return { first_name: parts[0] || '', last_name: parts.slice(1).join(' ') || '', job_title: node.role, department: node.department || 'General', email: `${node.id}@staff` }
}

function OrgChart({ items, ctx, importedStaff }: { items: TeamMember[]; ctx: AIContext; statusColor: Record<string, string>; importedStaff?: ImportedStaff[] }) {
  const [editing, setEditing] = useState(false)
  const [overrides, setOverrides] = useState<Record<string, string>>(getReportingOverrides)
  const [movingId, setMovingId] = useState<string | null>(null)
  const [profileNode, setProfileNode] = useState<OrgNode | null>(null)
  const [, forceUpdate] = useState(0)

  const staffToUse: TeamMember[] = importedStaff?.length
    ? importedStaff.map((s, i) => ({
        id: s.email || `imported-${i}`,
        name: [s.first_name, s.last_name].filter(Boolean).join(' ') || s.email || 'Unknown',
        role: s.job_title || 'Team Member',
        department: s.department || 'General',
        status: 'available' as const,
        currentFocus: '',
        needsAttention: false,
        attentionNote: null,
      }))
    : items

  const tree = buildHierarchy(staffToUse, ctx.userName || 'You', ctx.role || 'Manager')

  function handleMove(childId: string, parentId: string) {
    const next = { ...overrides, [childId]: parentId }
    setOverrides(next)
    saveReportingOverrides(next)
    setMovingId(null)
    forceUpdate(n => n + 1)
  }

  function handleCancel() { setEditing(false); setMovingId(null); setOverrides(getReportingOverrides()) }

  function OrgNodeView({ node, depth = 0 }: { node: OrgNode; depth?: number }) {
    const isMoving = movingId === node.id
    const staffRecord = nodeToStaffRecord(node)

    return (
      <div className="flex flex-col items-center">
        {/* Node — mini EmployeeProfileCard */}
        <div style={{ opacity: isMoving ? 0.5 : 1, position: 'relative' }}>
          <EmployeeProfileCard
            staff={staffRecord}
            index={0}
            isCurrentUser={node.id === 'root'}
            onViewProfile={() => setProfileNode(node)}
            variant="mini"
          />
          {/* Edit mode buttons overlaid below the card */}
          {editing && node.id !== 'root' && (
            <div className="flex justify-center mt-1">
              <button onClick={e => { e.stopPropagation(); setMovingId(movingId === node.id ? null : node.id) }} className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: isMoving ? 'rgba(239,68,68,0.15)' : 'rgba(108,63,197,0.15)', color: isMoving ? '#EF4444' : '#A78BFA', border: `1px solid ${isMoving ? 'rgba(239,68,68,0.3)' : 'rgba(108,63,197,0.3)'}` }}>
                {isMoving ? 'Cancel' : 'Move'}
              </button>
            </div>
          )}
          {movingId && movingId !== node.id && editing && (
            <div className="flex justify-center mt-1">
              <button onClick={e => { e.stopPropagation(); handleMove(movingId, node.id) }} className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.3)' }}>
                Place here
              </button>
            </div>
          )}
        </div>

        {/* SVG connecting line + children */}
        {node.children.length > 0 && (
          <>
            <svg width="2" height="20" className="shrink-0"><line x1="1" y1="0" x2="1" y2="20" stroke="rgba(124,58,237,0.4)" strokeWidth="2" /></svg>
            {node.children.length > 1 && (
              <svg width={Math.max(node.children.length * 180, 200)} height="2" className="shrink-0">
                <line x1={90} y1="1" x2={90 + (node.children.length - 1) * 180} y2="1" stroke="rgba(124,58,237,0.4)" strokeWidth="2" />
              </svg>
            )}
            <div className="flex justify-center gap-5">
              {node.children.map(child => (
                <div key={child.id} className="flex flex-col items-center">
                  <svg width="2" height="12" className="shrink-0"><line x1="1" y1="0" x2="1" y2="12" stroke="rgba(124,58,237,0.4)" strokeWidth="2" /></svg>
                  <OrgNodeView node={child} depth={depth + 1} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-xl p-6" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs" style={{ color: '#6B7280' }}>{staffToUse.length} team members · hierarchy auto-detected from job titles</p>
        {editing ? (
          <div className="flex gap-2">
            <button onClick={handleCancel} className="text-xs px-3 py-1 rounded-lg" style={{ color: '#6B7280', border: '1px solid #1F2937' }}>Cancel</button>
            <button onClick={() => setEditing(false)} className="text-xs px-3 py-1 rounded-lg font-semibold" style={{ backgroundColor: '#0D9488', color: '#fff' }}>Save</button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1 font-semibold" style={{ backgroundColor: 'rgba(108,63,197,0.15)', color: '#A78BFA', border: '1px solid rgba(108,63,197,0.3)' }}>
            <Pencil size={10} /> Edit
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <div className="flex justify-center min-w-fit">
          <OrgNodeView node={tree} />
        </div>
      </div>
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-6 pt-4" style={{ borderTop: '1px solid #1F2937' }}>
        {([['You', 'rgba(108,63,197,0.3)'], ['C-Suite', LEVEL_COLORS.csuite.border], ['Directors', LEVEL_COLORS.director.border], ['Managers', LEVEL_COLORS.manager.border], ['Staff', LEVEL_COLORS.staff.border]] as const).map(([label, color]) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="rounded" style={{ width: 10, height: 10, backgroundColor: color }} />
            <span className="text-xs" style={{ color: '#6B7280' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Profile modal */}
      {profileNode && (
        <ProfileModal
          staff={nodeToStaffRecord(profileNode)}
          index={0}
          isCurrentUser={profileNode.id === 'root'}
          onClose={() => setProfileNode(null)}
        />
      )}
    </div>
  )
}

// ─── Team ────────────────────────────────────────────────────────────────────

interface ImportedStaff {
  first_name?: string; last_name?: string; email?: string
  job_title?: string; department?: string; phone?: string; start_date?: string
}

function getImportedStaff(): ImportedStaff[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem('lumio_staff_imported') || '[]') } catch { return [] }
}

function importedToTeamMember(s: ImportedStaff, i: number): TeamMember {
  return {
    id: `imported-${i}`,
    name: [s.first_name, s.last_name].filter(Boolean).join(' ') || s.email || 'Unknown',
    role: s.job_title || 'Team Member',
    department: s.department || 'General',
    status: 'available',
    currentFocus: 'Imported via CSV',
    needsAttention: false,
    attentionNote: null,
  }
}

export function AITeam({ ctx, onAction }: { ctx: AIContext; onAction?: (msg: string) => void }) {
  const [importedStaff, setImportedStaff] = useState<ImportedStaff[]>(getImportedStaff)
  const { items: aiItems, loading, error, regenerate } = useAIFetch<TeamMember>('team', ctx, importedStaff.length ? { importedStaff } : undefined)
  const [subTab, setSubTab] = useState<TeamSubTab>('staff')
  const showBanner = !hasRealData(['staff'])

  // Listen for new imports
  useEffect(() => {
    const handler = () => setImportedStaff(getImportedStaff())
    window.addEventListener('lumio-staff-imported', handler)
    return () => window.removeEventListener('lumio-staff-imported', handler)
  }, [])

  const hasImported = importedStaff.length > 0
  // If staff have been imported, use them as primary source; AI items as fallback
  const items: TeamMember[] = hasImported
    ? importedStaff.map((s, i) => importedToTeamMember(s, i))
    : aiItems

  const statusColor: Record<string, string> = { available: '#22C55E', 'in-meeting': '#F59E0B', busy: '#EF4444', away: '#6B7280' }
  const statusLabel: Record<string, string> = { available: 'Available', 'in-meeting': 'In meeting', busy: 'Busy', away: 'Away' }

  const SUB_TABS: { id: TeamSubTab; label: string; icon: React.ElementType }[] = [
    { id: 'staff', label: 'Staff Today', icon: Users },
    { id: 'org', label: 'Org Chart', icon: Building2 },
    { id: 'info', label: 'Team Info', icon: AlertCircle },
  ]

  // Group team by department for org chart
  const departments = items.reduce<Record<string, TeamMember[]>>((acc, m) => {
    const dept = m.department || 'General'
    if (!acc[dept]) acc[dept] = []
    acc[dept].push(m)
    return acc
  }, {})

  return (
    <div>
      <TabHeader title="Team" right={<RegenerateBtn onClick={regenerate} loading={loading} />} />

      {/* Sub-tabs */}
      <div className="flex items-center gap-1.5 mb-4">
        {SUB_TABS.map(st => (
          <button key={st.id} onClick={() => setSubTab(st.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              backgroundColor: subTab === st.id ? 'rgba(108,63,197,0.15)' : 'transparent',
              color: subTab === st.id ? '#A78BFA' : '#6B7280',
              border: subTab === st.id ? '1px solid rgba(108,63,197,0.3)' : '1px solid #1F2937',
            }}>
            <st.icon size={12} />{st.label}
          </button>
        ))}
      </div>

      {showBanner && <NoBanner />}

      {error ? <ErrorCard /> : loading ? <SkeletonCards count={4} /> : (
        <>
          {/* Staff Today */}
          {subTab === 'staff' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {items.map(member => {
                const initials = member.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                return (
                  <div key={member.id} className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
                    <div className="flex items-start gap-3">
                      <div className="relative shrink-0">
                        <div className="flex items-center justify-center rounded-full text-xs font-bold" style={{ width: 40, height: 40, backgroundColor: '#6C3FC5', color: '#F9FAFB' }}>
                          {initials}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 rounded-full" style={{ width: 12, height: 12, backgroundColor: statusColor[member.status] || '#6B7280', border: '2px solid #111318' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{member.name}</p>
                        <p className="text-xs" style={{ color: '#6B7280' }}>{member.role} &middot; {member.department}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="inline-block rounded-full" style={{ width: 6, height: 6, backgroundColor: statusColor[member.status] || '#6B7280' }} />
                          <span className="text-xs" style={{ color: statusColor[member.status] || '#6B7280' }}>{statusLabel[member.status] || member.status}</span>
                        </div>
                        <p className="text-xs mt-1.5" style={{ color: '#9CA3AF' }}>{member.currentFocus}</p>
                      </div>
                      <button onClick={() => onAction?.(`Opening Slack DM with ${member.name}...`)} className="text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0 inline-flex items-center gap-1" style={{ backgroundColor: 'rgba(108,63,197,0.15)', color: '#A78BFA', border: '1px solid rgba(108,63,197,0.3)' }}>
                        <MessageSquare size={10} />Message
                      </button>
                    </div>
                    {member.needsAttention && member.attentionNote && (
                      <div className="mt-3 rounded-lg px-3 py-2" style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                        <p className="text-xs font-medium inline-flex items-center gap-1" style={{ color: '#F59E0B' }}><AlertCircle size={10} />{member.attentionNote}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Org Chart */}
          {subTab === 'org' && <OrgChart items={items} ctx={ctx} statusColor={statusColor} importedStaff={importedStaff} />}

          {/* Team Info — Sticker cards */}
          {subTab === 'info' && (
            <TeamInfoCards importedStaff={importedStaff} items={items} ctx={ctx} onAction={onAction} />
          )}
        </>
      )}
    </div>
  )
}

// ─── Team Info Sticker Cards ─────────────────────────────────────────────────

function TeamInfoCards({ importedStaff, items, ctx, onAction }: {
  importedStaff: ImportedStaff[]; items: TeamMember[]; ctx: AIContext; onAction?: (msg: string) => void
}) {
  const [profileStaff, setProfileStaff] = useState<StaffRecord | null>(null)
  const [profileIndex, setProfileIndex] = useState(0)

  const currentUserName = (ctx.userName || '').toLowerCase()

  // Build sticker data from imported staff or AI items
  const staffCards: StaffRecord[] = importedStaff.length > 0
    ? importedStaff
    : items.map(m => {
        const parts = m.name.split(' ')
        return { first_name: parts[0], last_name: parts.slice(1).join(' '), job_title: m.role, department: m.department, email: '' }
      })

  function isCurrentUser(s: StaffRecord): boolean {
    if (!currentUserName) return false
    const full = [s.first_name, s.last_name].filter(Boolean).join(' ').toLowerCase()
    return full === currentUserName || (s.first_name?.toLowerCase() === currentUserName)
  }

  if (staffCards.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm" style={{ color: '#6B7280' }}>No team members yet — import staff via Settings.</p>
      </div>
    )
  }

  const currentUserCard = staffCards.find(s => isCurrentUser(s))
  const otherCards = staffCards.filter(s => !isCurrentUser(s))

  return (
    <>
      {currentUserCard ? (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left — current user */}
          <div className="flex flex-col items-center lg:w-1/3 shrink-0">
            <p className="text-xs font-semibold mb-3" style={{ color: '#6B7280', letterSpacing: '0.05em' }}>YOUR PROFILE</p>
            <div style={{ transform: 'scale(1.05)', transformOrigin: 'top center' }}>
              <EmployeeProfileCard
                staff={currentUserCard}
                index={staffCards.indexOf(currentUserCard)}
                isCurrentUser={true}
                onViewProfile={() => { setProfileStaff(currentUserCard); setProfileIndex(staffCards.indexOf(currentUserCard)) }}
                onMessage={() => onAction?.('Opening your profile...')}
              />
            </div>
            <button onClick={() => { setProfileStaff(currentUserCard); setProfileIndex(staffCards.indexOf(currentUserCard)) }} className="mt-3 text-xs font-semibold px-4 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(108,63,197,0.15)', color: '#A78BFA', border: '1px solid rgba(108,63,197,0.3)' }}>
              Edit Profile
            </button>
          </div>
          {/* Right — team */}
          <div className="flex-1">
            <p className="text-xs font-semibold mb-3" style={{ color: '#6B7280', letterSpacing: '0.05em' }}>YOUR TEAM</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {otherCards.map((s, i) => (
                <EmployeeProfileCard
                  key={s.email || i}
                  staff={s}
                  index={staffCards.indexOf(s)}
                  isCurrentUser={false}
                  onViewProfile={() => { setProfileStaff(s); setProfileIndex(staffCards.indexOf(s)) }}
                  onMessage={() => onAction?.(`Opening Slack DM with ${[s.first_name, s.last_name].filter(Boolean).join(' ')}...`)}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffCards.map((s, i) => (
            <EmployeeProfileCard
              key={s.email || i}
              staff={s}
              index={i}
              isCurrentUser={false}
              onViewProfile={() => { setProfileStaff(s); setProfileIndex(i) }}
              onMessage={() => onAction?.(`Opening Slack DM with ${[s.first_name, s.last_name].filter(Boolean).join(' ')}...`)}
          />
        ))}
      </div>
      )}

      {profileStaff && (
        <ProfileModal
          staff={profileStaff}
          index={profileIndex}
          isCurrentUser={isCurrentUser(profileStaff)}
          onClose={() => setProfileStaff(null)}
        />
      )}
    </>
  )
}
