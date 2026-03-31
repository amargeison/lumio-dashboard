'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { RotateCcw, Check, Zap, Clock, AlertCircle, TrendingUp, TrendingDown, Minus, MessageSquare, X, Link2, ChevronRight } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface AIContext {
  userName: string
  company: string
  role: string
  department: string
  connectedIntegrations: string[]
  importedData: { hasStaff: boolean; hasContacts: boolean; hasAccounts: boolean }
}

interface QuickWin { id: string; title: string; description: string; impact: 'HIGH' | 'MEDIUM'; timeEstimate: string; department: string; actionLabel: string; source: string }
interface DailyTask { id: string; title: string; description: string; priority: 'urgent' | 'high' | 'normal'; category: string; dueTime: string | null; estimatedMinutes: number }
interface Insight { id: string; title: string; summary: string; trend: 'up' | 'down' | 'neutral' | 'alert'; metric: string | null; recommendation: string; category: string }
interface DontMissItem { id: string; title: string; description: string; urgency: 'critical' | 'high' | 'medium'; deadline: string | null; actionLabel: string; category: string }
interface TeamMember { id: string; name: string; role: string; department: string; status: 'available' | 'in-meeting' | 'busy' | 'away'; currentFocus: string; needsAttention: boolean; attentionNote: string | null }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTimeOfDay(): string {
  const h = new Date().getHours()
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'
}

function getDayOfWeek(): string {
  return new Date().toLocaleDateString('en-GB', { weekday: 'long' })
}

const CACHE_TTL = 30 * 60 * 1000 // 30 minutes

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

function useAIFetch<T>(tab: string, ctx: AIContext) {
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
          context: { ...ctx, timeOfDay: getTimeOfDay(), dayOfWeek: getDayOfWeek() },
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

function NoBanner() {
  return (
    <div className="flex items-center gap-3 rounded-xl px-4 py-3 mb-4" style={{ backgroundColor: 'rgba(108,63,197,0.08)', border: '1px solid rgba(108,63,197,0.2)' }}>
      <Link2 size={16} style={{ color: '#A78BFA' }} />
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

// ─── Quick Wins ──────────────────────────────────────────────────────────────

export function AIQuickWins({ ctx }: { ctx: AIContext }) {
  const { items, loading, error, regenerate } = useAIFetch<QuickWin>('quick-wins', ctx)
  const [done, setDone] = useState<Set<string>>(new Set())

  function markDone(id: string) { setDone(prev => new Set(prev).add(id)) }

  const noIntegrations = !ctx.connectedIntegrations.length

  if (error) return <><TabHeader title="Quick Wins" right={<RegenerateBtn onClick={regenerate} loading={loading} />} /><ErrorCard /></>
  if (loading) return <><TabHeader title="Quick Wins" /><SkeletonCards count={4} /></>

  return (
    <div>
      <TabHeader title="Quick Wins" right={
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold" style={{ color: '#0D9488' }}>{done.size}/{items.length} done today</span>
          <RegenerateBtn onClick={regenerate} loading={loading} />
        </div>
      } />
      {noIntegrations && <NoBanner />}
      <div className="space-y-3">
        {items.map(win => {
          const isDone = done.has(win.id)
          return (
            <div key={win.id} className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937', opacity: isDone ? 0.45 : 1 }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
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
                  <button onClick={() => markDone(win.id)} className="text-xs px-3 py-1.5 rounded-lg" style={{ color: isDone ? '#22C55E' : '#6B7280', backgroundColor: isDone ? 'rgba(34,197,94,0.1)' : 'transparent', border: isDone ? 'none' : '1px solid #1F2937' }}>
                    {isDone ? <><Check size={10} /> Done</> : 'Mark done'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Daily Tasks ─────────────────────────────────────────────────────────────

export function AIDailyTasks({ ctx }: { ctx: AIContext }) {
  const { items, loading, error, regenerate } = useAIFetch<DailyTask>('daily-tasks', ctx)
  const [checked, setChecked] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setChecked(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  const noIntegrations = !ctx.connectedIntegrations.length
  const priorityOrder = { urgent: 0, high: 1, normal: 2 }
  const sorted = [...items].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
  const pctDone = items.length ? Math.round((checked.size / items.length) * 100) : 0

  if (error) return <><TabHeader title="Daily Tasks" right={<RegenerateBtn onClick={regenerate} loading={loading} />} /><ErrorCard /></>
  if (loading) return <><TabHeader title="Daily Tasks" /><SkeletonCards count={5} /></>

  const priorityColor = { urgent: '#EF4444', high: '#F59E0B', normal: '#6B7280' }
  const priorityBg = { urgent: 'rgba(239,68,68,0.12)', high: 'rgba(245,158,11,0.12)', normal: 'rgba(107,114,128,0.12)' }

  return (
    <div>
      <TabHeader title="Daily Tasks" right={
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold" style={{ color: '#0D9488' }}>{checked.size}/{items.length} complete</span>
          <RegenerateBtn onClick={regenerate} loading={loading} />
        </div>
      } />
      {noIntegrations && <NoBanner />}
      {/* Progress bar */}
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
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: priorityBg[task.priority], color: priorityColor[task.priority] }}>
                    {task.priority.toUpperCase()}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>{task.category}</span>
                  {task.dueTime && <span className="text-xs" style={{ color: '#F59E0B' }}><Clock size={10} className="inline mr-0.5" />{task.dueTime}</span>}
                </div>
                <p className="text-sm font-medium" style={{ color: '#F9FAFB', textDecoration: isDone ? 'line-through' : undefined }}>{task.title}</p>
                <p className="text-xs" style={{ color: '#6B7280' }}>{task.description}</p>
              </div>
              <span className="text-xs shrink-0 mt-1" style={{ color: '#4B5563' }}>{task.estimatedMinutes}m</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Insights ────────────────────────────────────────────────────────────────

export function AIInsights({ ctx }: { ctx: AIContext }) {
  const { items, loading, error, regenerate } = useAIFetch<Insight>('insights', ctx)
  const noIntegrations = !ctx.connectedIntegrations.length

  const TrendIcon = ({ trend }: { trend: Insight['trend'] }) => {
    const map = { up: { Icon: TrendingUp, color: '#22C55E' }, down: { Icon: TrendingDown, color: '#EF4444' }, neutral: { Icon: Minus, color: '#6B7280' }, alert: { Icon: AlertCircle, color: '#F59E0B' } }
    const { Icon, color } = map[trend]
    return <Icon size={16} style={{ color }} />
  }

  if (error) return <><TabHeader title="Insights" right={<RegenerateBtn onClick={regenerate} loading={loading} />} /><ErrorCard /></>
  if (loading) return <><TabHeader title="Insights" /><SkeletonCards count={4} /></>

  return (
    <div>
      <TabHeader title="Insights" right={<RegenerateBtn onClick={regenerate} loading={loading} />} />
      {noIntegrations && <NoBanner />}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map(insight => (
          <div key={insight.id} className="rounded-xl p-4 flex flex-col" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
            <div className="flex items-start gap-3 mb-3">
              <div className="shrink-0 mt-0.5"><TrendIcon trend={insight.trend} /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{insight.title}</p>
                  {insight.metric && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: insight.trend === 'up' ? 'rgba(34,197,94,0.15)' : insight.trend === 'down' ? 'rgba(239,68,68,0.15)' : 'rgba(107,114,128,0.15)', color: insight.trend === 'up' ? '#22C55E' : insight.trend === 'down' ? '#EF4444' : '#9CA3AF' }}>
                      {insight.metric}
                    </span>
                  )}
                </div>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>{insight.summary}</p>
                <span className="text-xs px-1.5 py-0.5 rounded mt-1 inline-block" style={{ backgroundColor: '#1F2937', color: '#6B7280' }}>{insight.category}</span>
              </div>
            </div>
            <div className="mt-auto rounded-lg px-3 py-2.5" style={{ backgroundColor: 'rgba(13,148,136,0.06)', border: '1px solid rgba(13,148,136,0.15)' }}>
              <p className="text-xs font-medium" style={{ color: '#0D9488' }}><ChevronRight size={10} className="inline mr-1" />{insight.recommendation}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Don't Miss ──────────────────────────────────────────────────────────────

export function AIDontMiss({ ctx }: { ctx: AIContext }) {
  const { items, loading, error, regenerate } = useAIFetch<DontMissItem>('dont-miss', ctx)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const noIntegrations = !ctx.connectedIntegrations.length

  const urgencyColor = { critical: '#EF4444', high: '#F59E0B', medium: '#FBBF24' }
  const urgencyBg = { critical: 'rgba(239,68,68,0.08)', high: 'rgba(245,158,11,0.08)', medium: 'rgba(251,191,36,0.08)' }

  if (error) return <><TabHeader title="Don't Miss" right={<RegenerateBtn onClick={regenerate} loading={loading} />} /><ErrorCard /></>
  if (loading) return <><TabHeader title="Don't Miss" /><SkeletonCards /></>

  const visible = items.filter(i => !dismissed.has(i.id))

  return (
    <div>
      <TabHeader title="Don't Miss" right={<RegenerateBtn onClick={regenerate} loading={loading} />} />
      {noIntegrations && <NoBanner />}
      {visible.length === 0 ? (
        <div className="rounded-xl p-8 text-center" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <p className="text-sm" style={{ color: '#22C55E' }}>All clear! Nothing urgent right now.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(item => (
            <div key={item.id} className="rounded-xl overflow-hidden" style={{ backgroundColor: urgencyBg[item.urgency], border: '1px solid #1F2937' }}>
              <div className="flex" style={{ minHeight: 0 }}>
                <div style={{ width: 4, backgroundColor: urgencyColor[item.urgency], flexShrink: 0 }} />
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: urgencyColor[item.urgency] + '22', color: urgencyColor[item.urgency] }}>
                          {item.urgency.toUpperCase()}
                        </span>
                        {item.deadline && <span className="text-xs font-semibold" style={{ color: urgencyColor[item.urgency] }}><Clock size={10} className="inline mr-0.5" />{item.deadline}</span>}
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: '#1F2937', color: '#9CA3AF' }}>{item.category}</span>
                      </div>
                      <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{item.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{item.description}</p>
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button className="text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ backgroundColor: urgencyColor[item.urgency] + '22', color: urgencyColor[item.urgency], border: `1px solid ${urgencyColor[item.urgency]}44` }}>
                        {item.actionLabel}
                      </button>
                      <button onClick={() => setDismissed(prev => new Set(prev).add(item.id))} className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1" style={{ color: '#6B7280' }}>
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

// ─── Team ────────────────────────────────────────────────────────────────────

export function AITeam({ ctx, onAction }: { ctx: AIContext; onAction?: (msg: string) => void }) {
  const { items, loading, error, regenerate } = useAIFetch<TeamMember>('team', ctx)
  const noIntegrations = !ctx.connectedIntegrations.length

  const statusColor = { available: '#22C55E', 'in-meeting': '#F59E0B', busy: '#EF4444', away: '#6B7280' }
  const statusLabel = { available: 'Available', 'in-meeting': 'In meeting', busy: 'Busy', away: 'Away' }

  if (error) return <><TabHeader title="Team" right={<RegenerateBtn onClick={regenerate} loading={loading} />} /><ErrorCard /></>
  if (loading) return <><TabHeader title="Team" /><SkeletonCards count={4} /></>

  return (
    <div>
      <TabHeader title="Team" right={<RegenerateBtn onClick={regenerate} loading={loading} />} />
      {noIntegrations && <NoBanner />}
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
                  <div className="absolute -bottom-0.5 -right-0.5 rounded-full" style={{ width: 12, height: 12, backgroundColor: statusColor[member.status], border: '2px solid #111318' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{member.name}</p>
                  <p className="text-xs" style={{ color: '#6B7280' }}>{member.role} &middot; {member.department}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="inline-block rounded-full" style={{ width: 6, height: 6, backgroundColor: statusColor[member.status] }} />
                    <span className="text-xs" style={{ color: statusColor[member.status] }}>{statusLabel[member.status]}</span>
                  </div>
                  <p className="text-xs mt-1.5" style={{ color: '#9CA3AF' }}>{member.currentFocus}</p>
                </div>
                <button onClick={() => onAction?.(`Opening Slack DM with ${member.name}...`)} className="text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0" style={{ backgroundColor: 'rgba(108,63,197,0.15)', color: '#A78BFA', border: '1px solid rgba(108,63,197,0.3)' }}>
                  <MessageSquare size={10} className="inline mr-1" />Message
                </button>
              </div>
              {member.needsAttention && member.attentionNote && (
                <div className="mt-3 rounded-lg px-3 py-2" style={{ backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <p className="text-xs font-medium" style={{ color: '#F59E0B' }}><AlertCircle size={10} className="inline mr-1" />{member.attentionNote}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
