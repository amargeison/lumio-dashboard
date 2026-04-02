'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { RotateCcw, Check, Clock, AlertCircle, TrendingUp, TrendingDown, Minus, MessageSquare, X, Link2, ChevronRight, Users, Building2, Pencil, ExternalLink } from 'lucide-react'
import { EmployeeProfileCard, ProfileModal, getGridCols, type StaffRecord } from '@/components/team/EmployeeProfileCard'

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
interface TeamMember { id: string; name: string; role: string; department: string; status: 'available' | 'in-meeting' | 'busy' | 'away'; currentFocus: string; needsAttention: boolean; attentionNote: string | null; roleLevel?: number }

type TeamSubTab = 'staff' | 'org' | 'info' | 'company'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTimeOfDay(): string {
  const h = new Date().getHours()
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'
}

function getDayOfWeek(): string {
  return new Date().toLocaleDateString('en-GB', { weekday: 'long' })
}

const DISMISS_TTL = 24 * 60 * 60 * 1000 // 24 hours

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0] // e.g. '2026-04-01'
}

function getSlug(): string {
  if (typeof window === 'undefined') return ''
  const parts = window.location.pathname.split('/').filter(Boolean)
  return parts[0] || ''
}

function getCached<T>(tab: string): { data: T; time: string } | null {
  if (typeof window === 'undefined') return null
  const slug = getSlug()
  const today = getTodayKey()
  const raw = localStorage.getItem(`lumio_ai_${tab}_${slug}_${today}`)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    return { data: parsed.data, time: parsed.time || '' }
  } catch { return null }
}

function setCache(tab: string, data: unknown) {
  if (typeof window === 'undefined') return
  const slug = getSlug()
  const today = getTodayKey()
  const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  localStorage.setItem(`lumio_ai_${tab}_${slug}_${today}`, JSON.stringify({ data, time }))
  // Clean up old date caches for this tab
  const prefix = `lumio_ai_${tab}_${slug}_`
  Object.keys(localStorage).filter(k => k.startsWith(prefix) && !k.endsWith(today)).forEach(k => localStorage.removeItem(k))
}

function getCacheTime(tab: string): string {
  if (typeof window === 'undefined') return ''
  const slug = getSlug()
  const today = getTodayKey()
  const raw = localStorage.getItem(`lumio_ai_${tab}_${slug}_${today}`)
  if (!raw) return ''
  try { return JSON.parse(raw).time || '' } catch { return '' }
}

// Persist checked/done tasks per slug per day
function getCheckedTasks(tab: string): Set<string> {
  if (typeof window === 'undefined') return new Set()
  const slug = getSlug()
  const today = getTodayKey()
  const raw = localStorage.getItem(`lumio_tasks_done_${tab}_${slug}_${today}`)
  if (!raw) return new Set()
  try { return new Set(JSON.parse(raw)) } catch { return new Set() }
}

function saveCheckedTasks(tab: string, ids: Set<string>) {
  if (typeof window === 'undefined') return
  const slug = getSlug()
  const today = getTodayKey()
  localStorage.setItem(`lumio_tasks_done_${tab}_${slug}_${today}`, JSON.stringify(Array.from(ids)))
  // Clean up old date keys
  const prefix = `lumio_tasks_done_${tab}_${slug}_`
  Object.keys(localStorage).filter(k => k.startsWith(prefix) && !k.endsWith(today)).forEach(k => localStorage.removeItem(k))
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
  const [items, setItems] = useState<T[]>(() => {
    const cached = getCached<T[]>(tab)
    return cached ? cached.data : []
  })
  const [loading, setLoading] = useState(() => {
    const cached = getCached<T[]>(tab)
    return !cached
  })
  const [error, setError] = useState(false)
  const [generatedAt, setGeneratedAt] = useState(() => getCacheTime(tab))

  const fetchData = useCallback(async (force = false) => {
    if (!force) {
      const cached = getCached<T[]>(tab)
      if (cached) { setItems(cached.data); setGeneratedAt(cached.time); setLoading(false); return }
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
      setGeneratedAt(getCacheTime(tab))
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [tab, ctx])

  useEffect(() => { fetchData() }, [fetchData])

  return { items, loading, error, regenerate: () => fetchData(true), generatedAt }
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
  const { items, loading, error, regenerate, generatedAt } = useAIFetch<QuickWin>('quick-wins', ctx)
  const [done, setDone] = useState<Set<string>>(() => getCheckedTasks('quick-wins'))
  const showBanner = !hasRealData(['integrations'])

  function markDone(id: string) {
    setDone(prev => {
      const next = new Set(prev).add(id)
      saveCheckedTasks('quick-wins', next)
      return next
    })
  }

  return (
    <div>
      <TabHeader title="Quick Wins" right={
        <div className="flex items-center gap-3">
          {!loading && generatedAt && <span className="text-[10px]" style={{ color: '#4B5563' }}>Generated today at {generatedAt}</span>}
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
  const { items, loading, error, regenerate, generatedAt } = useAIFetch<DailyTask>('daily-tasks', ctx)
  const [checked, setChecked] = useState<Set<string>>(() => getCheckedTasks('daily-tasks'))
  const showBanner = !hasRealData(['integrations'])

  function toggle(id: string) {
    setChecked(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      saveCheckedTasks('daily-tasks', s)
      return s
    })
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
          {!loading && generatedAt && <span className="text-[10px]" style={{ color: '#4B5563' }}>Generated today at {generatedAt}</span>}
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
  const { items, loading, error, regenerate, generatedAt } = useAIFetch<Insight>('insights', ctx)
  const showBanner = !hasRealData(['integrations'])

  return (
    <div>
      <TabHeader title="Insights" right={
        <div className="flex items-center gap-3">
          {!loading && generatedAt && <span className="text-[10px]" style={{ color: '#4B5563' }}>Generated today at {generatedAt}</span>}
          <RegenerateBtn onClick={regenerate} loading={loading} />
        </div>
      } />
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
  const { items, loading, error, regenerate: baseRegenerate, generatedAt } = useAIFetch<DontMissItem>('dont-miss', ctx)
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
      <TabHeader title="Don't Miss" right={
        <div className="flex items-center gap-3">
          {!loading && generatedAt && <span className="text-[10px]" style={{ color: '#4B5563' }}>Generated today at {generatedAt}</span>}
          <RegenerateBtn onClick={regenerate} loading={loading} />
        </div>
      } />
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

function detectLevel(title: string, roleLevel?: number): HierarchyLevel {
  // Use explicit role_level if available (from workspace_staff)
  if (roleLevel === 1) return 'csuite'
  if (roleLevel === 2) return 'director'
  if (roleLevel === 3) return 'manager'
  if (roleLevel === 4) return 'staff'
  // Fallback: detect from job title
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

function buildHierarchy(members: TeamMember[], _userName: string, _userRole: string): OrgNode {
  const overrides = getReportingOverrides()
  // Virtual root — invisible container. Hierarchy is PURELY based on role_level.
  const root: OrgNode = { id: 'root', name: '', role: '', department: '', level: 'csuite', children: [] }

  const nodeMap = new Map<string, OrgNode>()
  const placed = new Set<string>()

  // Create nodes for all members
  members.forEach(m => {
    nodeMap.set(m.id, { id: m.id, name: m.name, role: m.role, department: m.department, level: detectLevel(m.role, m.roleLevel), children: [] })
  })

  // Apply manual overrides first
  for (const [childId, parentId] of Object.entries(overrides)) {
    const child = nodeMap.get(childId)
    const parent = parentId === 'root' ? root : nodeMap.get(parentId)
    if (child && parent) { parent.children.push(child); placed.add(childId) }
  }

  const findInTree = (nodes: OrgNode[], test: (n: OrgNode) => boolean): OrgNode | null => {
    for (const n of nodes) { if (test(n)) return n; const found = findInTree(n.children, test); if (found) return found }
    return null
  }

  // Place by level: csuite/director → root, manager → under director, staff → under manager
  const levels: HierarchyLevel[] = ['csuite', 'director', 'manager', 'staff']
  for (const level of levels) {
    members.filter(m => detectLevel(m.role, m.roleLevel) === level && !placed.has(m.id)).forEach(m => {
      const node = nodeMap.get(m.id)!
      let parent: OrgNode = root
      if (level === 'manager') {
        parent = findInTree(root.children, n => n.level === 'director' && n.department === m.department)
          || findInTree(root.children, n => (n.level === 'csuite' || n.level === 'director'))
          || root
      } else if (level === 'staff') {
        parent = findInTree(root.children, n => n.level === 'manager' && n.department === m.department)
          || findInTree(root.children, n => n.level === 'manager')
          || findInTree(root.children, n => n.level === 'director' && n.department === m.department)
          || findInTree(root.children, n => (n.level === 'csuite' || n.level === 'director'))
          || root
      }
      parent.children.push(node); placed.add(m.id)
    })
  }

  // If root has exactly 1 child, promote it to be the effective root (cleaner visual)
  if (root.children.length === 1) return root.children[0]

  return root
}

function nodeToStaffRecord(node: OrgNode, currentUserEmail?: string): StaffRecord {
  const parts = node.name.split(' ')
  // Preserve real email for photo lookup — node.id is the email for imported staff
  let email: string | undefined
  if (currentUserEmail && node.id.includes('@') === false) email = currentUserEmail // fallback for virtual nodes
  else if (node.id.includes('@') && !node.id.endsWith('@staff')) email = node.id
  return { first_name: parts[0] || '', last_name: parts.slice(1).join(' ') || '', job_title: node.role, department: node.department || 'General', email }
}

function OrgChart({ items, ctx, importedStaff }: { items: TeamMember[]; ctx: AIContext; statusColor: Record<string, string>; importedStaff?: ImportedStaff[] }) {
  const [editing, setEditing] = useState(false)
  const [overrides, setOverrides] = useState<Record<string, string>>(getReportingOverrides)
  const [movingId, setMovingId] = useState<string | null>(null)
  const [profileNode, setProfileNode] = useState<OrgNode | null>(null)
  const [, forceUpdate] = useState(0)
  const currentUserEmail = typeof window !== 'undefined' ? localStorage.getItem('lumio_user_email') || '' : ''

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
    const staffRecord = nodeToStaffRecord(node, currentUserEmail)

    return (
      <div className="flex flex-col items-center">
        {/* Node — mini EmployeeProfileCard */}
        <div style={{ opacity: isMoving ? 0.5 : 1, position: 'relative' }}>
          <EmployeeProfileCard
            staff={staffRecord}
            index={0}
            isCurrentUser={node.name.toLowerCase() === (ctx.userName || '').toLowerCase()}
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
          staff={nodeToStaffRecord(profileNode, currentUserEmail)}
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
  role?: string; role_level?: number
}

function getImportedStaff(): ImportedStaff[] {
  if (typeof window === 'undefined') return []
  try {
    const raw: ImportedStaff[] = JSON.parse(localStorage.getItem('lumio_staff_imported') || '[]')
    // Deduplicate by email at read time
    const seen = new Set<string>()
    return raw.filter(s => {
      const key = s.email?.toLowerCase() || `${s.first_name}_${s.last_name}`.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  } catch { return [] }
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
    roleLevel: s.role_level,
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

  // Deduplicate imported staff by email
  const dedupedStaff = React.useMemo(() => {
    const seen = new Set<string>()
    return importedStaff.filter(s => {
      const key = s.email?.toLowerCase() || `${s.first_name}_${s.last_name}`.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [importedStaff])

  const hasImported = dedupedStaff.length > 0
  // Use imported staff as primary source (single source of truth); AI items as fallback only
  const items: TeamMember[] = hasImported
    ? dedupedStaff.map((s, i) => importedToTeamMember(s, i))
    : aiItems

  const statusColor: Record<string, string> = { available: '#22C55E', 'in-meeting': '#F59E0B', busy: '#EF4444', away: '#6B7280' }
  const statusLabel: Record<string, string> = { available: 'Available', 'in-meeting': 'In meeting', busy: 'Busy', away: 'Away' }

  const SUB_TABS: { id: TeamSubTab; label: string; icon: React.ElementType }[] = [
    { id: 'staff', label: 'Staff Today', icon: Users },
    { id: 'org', label: 'Org Chart', icon: Building2 },
    { id: 'info', label: 'Team Info', icon: AlertCircle },
    { id: 'company', label: 'Company Info', icon: Building2 },
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

          {/* Company Info */}
          {subTab === 'company' && (
            <CompanyInfoTab items={items} />
          )}
        </>
      )}
    </div>
  )
}

// ─── Company Info Tab ────────────────────────────────────────────────────────

const COMPANY_DOCS = [
  { icon: '📋', title: 'Staff Handbook', desc: 'Employment policies, conduct, benefits' },
  { icon: '🏖️', title: 'Leave & Holiday Policy', desc: 'Annual leave, booking, blackout dates' },
  { icon: '💚', title: 'Health & Wellbeing', desc: 'Mental health, EAP, sick leave' },
  { icon: '🔒', title: 'Data & Security', desc: 'GDPR, data handling, passwords' },
  { icon: '💰', title: 'Expenses Policy', desc: 'Claims, limits, deadlines' },
  { icon: '🎓', title: 'Learning & Development', desc: 'Training budget, study leave' },
]

function CompanyInfoTab({ items }: { items: TeamMember[] }) {
  const [docModal, setDocModal] = useState<string | null>(null)
  const ceo = items.find(m => /ceo|founder|director/i.test(m.role)) || items[0]
  const hr = items.find(m => /hr|people|human/i.test(m.department || m.role))
  const it = items.find(m => /it|tech|system/i.test(m.department || m.role))
  const fin = items.find(m => /finance|account/i.test(m.department || m.role))

  return (
    <div className="space-y-6 max-w-5xl">
      <h2 className="text-xl font-black" style={{ color: '#F9FAFB' }}>Company Info</h2>

      {/* Documents */}
      <div>
        <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Company Documents</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {COMPANY_DOCS.map(d => (
            <div key={d.title} onClick={() => setDocModal(d.title)} className="rounded-xl p-4 cursor-pointer transition-all hover:-translate-y-0.5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <span className="text-2xl block mb-2">{d.icon}</span>
              <p className="text-xs font-bold" style={{ color: '#F9FAFB' }}>{d.title}</p>
              <p className="text-[10px] mt-0.5" style={{ color: '#6B7280' }}>{d.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Company Details + Key Contacts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Company Details</p>
          {[['Founded', '2021'], ['Industry', 'SaaS / Technology'], ['Size', '10-50 employees'], ['HQ', 'London, UK'], ['Website', 'lumiocms.com']].map(([l, v]) => (
            <div key={l} className="flex justify-between py-1"><span className="text-xs" style={{ color: '#6B7280' }}>{l}</span><span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{v}</span></div>
          ))}
        </div>
        <div className="rounded-xl p-5" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Key Contacts</p>
          {[['CEO', ceo?.name || '—'], ['HR', hr?.name || '—'], ['IT Support', it?.name || '—'], ['Finance', fin?.name || '—']].map(([r, n]) => (
            <div key={r} className="flex justify-between py-1"><span className="text-xs" style={{ color: '#6B7280' }}>{r}</span><span className="text-xs font-medium" style={{ color: '#F9FAFB' }}>{n}</span></div>
          ))}
        </div>
      </div>

      {/* Useful Links */}
      <div>
        <p className="text-sm font-bold mb-3" style={{ color: '#F9FAFB' }}>Useful Links</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {['Slack workspace', 'Google Drive', 'HR system', 'Payroll portal', 'Benefits portal', 'IT helpdesk', 'Company calendar', 'Training platform'].map(l => (
            <div key={l} className="flex items-center gap-2 rounded-lg p-3 cursor-pointer" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <ExternalLink size={12} style={{ color: '#6B7280' }} />
              <span className="text-xs" style={{ color: '#9CA3AF' }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Document modal */}
      {docModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={() => setDocModal(null)}>
          <div className="rounded-2xl p-6 w-full max-w-sm text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }} onClick={e => e.stopPropagation()}>
            <p className="text-3xl mb-3">📄</p>
            <h3 className="text-base font-bold mb-2" style={{ color: '#F9FAFB' }}>{docModal}</h3>
            <p className="text-sm mb-5" style={{ color: '#6B7280' }}>Document coming soon — upload your company documents in Settings.</p>
            <button onClick={() => setDocModal(null)} className="px-5 py-2 rounded-lg text-sm font-semibold" style={{ backgroundColor: '#0D9488', color: '#F9FAFB', border: 'none', cursor: 'pointer' }}>Got it</button>
          </div>
        </div>
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
                teamSize={staffCards.length}
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
            <div className={`grid ${getGridCols(otherCards.length)} gap-4`}>
              {otherCards.map((s, i) => (
                <EmployeeProfileCard
                  key={s.email || i}
                  staff={s}
                  index={staffCards.indexOf(s)}
                  isCurrentUser={false}
                  teamSize={staffCards.length}
                  onViewProfile={() => { setProfileStaff(s); setProfileIndex(staffCards.indexOf(s)) }}
                  onMessage={() => onAction?.(`Opening Slack DM with ${[s.first_name, s.last_name].filter(Boolean).join(' ')}...`)}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className={`grid ${getGridCols(staffCards.length)} gap-4`}>
          {staffCards.map((s, i) => (
            <EmployeeProfileCard
              key={s.email || i}
              staff={s}
              index={i}
              isCurrentUser={false}
              teamSize={staffCards.length}
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
