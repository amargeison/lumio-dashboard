'use client'

import { useState, useEffect } from 'react'
import { useCRMWorkspaceId } from '@/hooks/useCRMWorkspaceId'
import DashboardBrief from '@/components/crm/DashboardBrief'
import KPIGrid from '@/components/crm/KPIGrid'
import RevenueChart from '@/components/crm/RevenueChart'
import PipelineHealth from '@/components/crm/PipelineHealth'
import ActivityFeed from '@/components/crm/ActivityFeed'
import { Phone, Mail, Calendar as CalendarIcon, Video, AlertCircle } from 'lucide-react'
import { PieChart, Pie, Cell, LineChart, Line, CartesianGrid, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { CRMDeal, CRMContact, CRMActivity, PipelineStage } from '@/lib/crm/types'

// ─── Static chart data (module-level, never recreated) ──────────────────────

const WIN_LOSS_DATA = [{ name: 'Price', value: 28, color: '#EF4444' }, { name: 'Competitor', value: 22, color: '#F59E0B' }, { name: 'Timing', value: 18, color: '#6B7280' }, { name: 'No Budget', value: 16, color: '#3B82F6' }, { name: 'Won', value: 16, color: '#22C55E' }]
const VELOCITY_DATA = [{ month: 'Jan', days: 24 }, { month: 'Feb', days: 22 }, { month: 'Mar', days: 19 }, { month: 'Apr', days: 18 }, { month: 'May', days: 16 }, { month: 'Jun', days: 14 }]
const LEAD_SOURCE_DATA = [{ source: 'Referral', pct: 34 }, { source: 'Inbound', pct: 24 }, { source: 'LinkedIn', pct: 18 }, { source: 'Partner', pct: 14 }, { source: 'Cold', pct: 10 }]
const CHURN_ACCOUNTS = [{ name: 'Apex Consulting', reason: 'No login in 42 days', risk: 91 }, { name: 'Oakridge Schools', reason: 'Support tickets × 4', risk: 78 }, { name: 'Pinebrook Primary', reason: 'Downgrade request sent', risk: 65 }]
const RENEWALS = [{ name: 'Sterling & Co', due: 'Apr 12', arr: '£14,800', health: 'Critical' as const }, { name: 'Northern Digital', due: 'Apr 18', arr: '£33,400', health: 'At Risk' as const }, { name: 'Metro Logistics', due: 'May 2', arr: '£76,000', health: 'Healthy' as const }]

const CRM_BG = '#0F1019'
const CRM_BORDER = '#1E2035'
const CRM_CARD = '#121320'
const PURPLE = '#8B5CF6'

function CRMTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg px-3 py-2 text-xs" style={{ background: '#1a1a2e', border: '1px solid #2a2a4e', color: '#F1F3FA' }}>
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || p.fill }}>{p.name}: {typeof p.value === 'number' && p.value > 1000 ? `£${p.value.toLocaleString()}` : p.value}</p>
      ))}
    </div>
  )
}

const CACHE_KEY = 'lumio_crm_cache'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getCachedCRM(): { contacts: CRMContact[]; deals: CRMDeal[]; activities: CRMActivity[]; stages: PipelineStage[] } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) { sessionStorage.removeItem(CACHE_KEY); return null }
    return data
  } catch { return null }
}

function setCachedCRM(data: any) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() })) } catch {}
}

export default function CRMDashboardPage() {
  const workspaceId = useCRMWorkspaceId()
  const [brief, setBrief] = useState('')
  const [briefLoading, setBriefLoading] = useState(true)
  const [contacts, setContacts] = useState<CRMContact[]>([])
  const [deals, setDeals] = useState<CRMDeal[]>([])
  const [activities, setActivities] = useState<CRMActivity[]>([])
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDemoActive] = useState(() => typeof window !== 'undefined' && localStorage.getItem('lumio_demo_active') === 'true')
  const [wsResolved, setWsResolved] = useState(false)
  const hasData = contacts.length > 0 || deals.length > 0 || isDemoActive

  // Hydrate from sessionStorage cache after mount (avoids SSR mismatch)
  useEffect(() => {
    const cached = getCachedCRM()
    if (cached) {
      setContacts(cached.contacts)
      setDeals(cached.deals)
      setActivities(cached.activities)
      setStages(cached.stages)
      setLoading(false)
    }
  }, [])

  // Track workspace resolution — if workspaceId stays null after a timeout, stop loading
  useEffect(() => {
    if (workspaceId) { setWsResolved(true); return }
    const timer = setTimeout(() => {
      setWsResolved(true)
      setLoading(false)
    }, 4000)
    return () => clearTimeout(timer)
  }, [workspaceId])

  // Fetch CRM data
  useEffect(() => {
    if (!workspaceId) {
      // Demo fallback: load static demo data when no workspace but demo is active
      if (isDemoActive) {
        setContacts([
          { id: 'dc1', first_name: 'Rachel', last_name: 'Fox', email: 'rachel@greenfield.edu', company: 'Greenfield Academy', job_title: 'Head of IT', phone: '+44 7700 900123', status: 'active', last_contacted: '2026-03-28', aria_score: 92, created_at: '' },
          { id: 'dc2', first_name: 'Gary', last_name: 'Stone', email: 'gary@fernview.edu', company: 'Fernview College', job_title: 'Deputy Head', phone: '+44 7700 900124', status: 'active', last_contacted: '2026-03-25', aria_score: 78, created_at: '' },
          { id: 'dc3', first_name: 'Ann', last_name: 'Mehta', email: 'ann@torchbearer.edu', company: 'Torchbearer Trust', job_title: 'CEO', phone: '+44 7700 900125', status: 'active', last_contacted: '2026-03-20', aria_score: 85, created_at: '' },
        ] as any)
        setDeals([
          { id: 'dd1', name: 'Oakridge Academy', company: 'Oakridge Academy', value: 45000, stage: 'Prospecting', owner: 'Marcus W.', expected_close: '2026-06-30', days_in_stage: 5, workspace_id: '', created_at: '' },
          { id: 'dd2', name: 'Alliance Trust', company: 'Alliance Trust', value: 340000, stage: 'Proposal', owner: 'Rachel O.', expected_close: '2026-05-15', days_in_stage: 12, workspace_id: '', created_at: '' },
          { id: 'dd3', name: 'Riverside MAT', company: 'Riverside MAT', value: 280000, stage: 'Negotiation', owner: 'Marcus W.', expected_close: '2026-04-30', days_in_stage: 8, workspace_id: '', created_at: '' },
          { id: 'dd4', name: 'Hillside Primary', company: 'Hillside Primary', value: 62000, stage: 'Closed Won', owner: 'Tom F.', expected_close: '2026-03-15', days_in_stage: 0, workspace_id: '', created_at: '' },
        ] as any)
        setStages([
          { id: 's1', name: 'Prospecting', order: 1, color: '#6B7280', workspace_id: '' },
          { id: 's2', name: 'Qualified', order: 2, color: '#3B82F6', workspace_id: '' },
          { id: 's3', name: 'Proposal', order: 3, color: '#F59E0B', workspace_id: '' },
          { id: 's4', name: 'Negotiation', order: 4, color: '#EF4444', workspace_id: '' },
          { id: 's5', name: 'Closed Won', order: 5, color: '#22C55E', workspace_id: '' },
        ] as any)
        setLoading(false)
      }
      return
    }

    async function loadData() {
      try {
        const { getCRMData, seedDemoData } = await import('@/lib/crm/actions')
        const data = await getCRMData(workspaceId!)

        let result = data
        const demoActive = typeof window !== 'undefined' && localStorage.getItem('lumio_demo_active') === 'true'
        if (data.contacts.length === 0 && demoActive) {
          await seedDemoData(workspaceId!)
          result = await getCRMData(workspaceId!)
        }

        setContacts(result.contacts)
        setDeals(result.deals)
        setActivities(result.activities)
        setStages(result.stages)
        setCachedCRM(result)
      } catch (e: any) {
        console.error('Failed to load CRM data:', e)
        setError(e?.message || 'Failed to load CRM data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [workspaceId])

  // Fetch ARIA brief (non-blocking)
  useEffect(() => {
    const token = localStorage.getItem('workspace_session_token')
    if (!token) { setBriefLoading(false); return }

    fetch('/api/crm/brief', { headers: { 'x-workspace-token': token } })
      .then(r => r.json())
      .then(d => setBrief(d.brief || 'Welcome to Lumio CRM. Add deals to see ARIA insights here.'))
      .catch(() => setBrief('Welcome to Lumio CRM. ARIA is ready to analyse your pipeline.'))
      .finally(() => setBriefLoading(false))
  }, [])

  const openDeals = deals.filter(d => !d.closed_at && d.won === null)
  const closedWon = deals.filter(d => d.won === true)
  const closedTotal = deals.filter(d => d.closed_at || d.won !== null)
  const pipelineValue = openDeals.reduce((sum, d) => sum + (d.value || 0), 0)
  const winRate = closedTotal.length > 0 ? Math.round((closedWon.length / closedTotal.length) * 100) : 0

  const stageData = stages
    .filter(s => s.name !== 'Closed Won' && s.name !== 'Closed Lost')
    .sort((a, b) => a.position - b.position)
    .map(s => {
      const stageDeals = deals.filter(d => d.stage_id === s.id)
      return {
        name: s.name,
        value: stageDeals.reduce((sum, d) => sum + (d.value || 0), 0),
        color: s.color,
        count: stageDeals.length,
      }
    })

  const topDeals = [...openDeals].sort((a, b) => b.aria_score - a.aria_score).slice(0, 5)

  // Loading skeleton — show while workspace is resolving or data is loading (skip for demo)
  if (loading && contacts.length === 0 && !error && !isDemoActive) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse rounded-xl" style={{ background: CRM_CARD, height: 80 }} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse rounded-xl" style={{ background: CRM_CARD, height: 120 }} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="animate-pulse rounded-xl" style={{ background: CRM_CARD, height: 300 }} />
          <div className="animate-pulse rounded-xl" style={{ background: CRM_CARD, height: 300 }} />
        </div>
      </div>
    )
  }

  // Error state — show clear error message with retry
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="rounded-xl p-8 text-center max-w-md" style={{ background: CRM_BG, border: '1px solid #EF4444' }}>
          <AlertCircle size={32} className="mx-auto mb-3" style={{ color: '#EF4444' }} />
          <p className="text-sm font-semibold mb-2" style={{ color: '#EF4444' }}>Failed to load CRM data</p>
          <p className="text-xs mb-4" style={{ color: '#6B7299' }}>{error}</p>
          <button
            onClick={() => { setError(null); setLoading(true); window.location.reload() }}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: '#8B5CF6', color: '#F1F3FA' }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // No workspace and resolution timed out — show empty state (skip if demo active)
  if (!workspaceId && wsResolved && !hasData && !isDemoActive) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="rounded-xl p-8 text-center max-w-md" style={{ background: CRM_BG, border: `1px solid ${CRM_BORDER}` }}>
          <p className="text-sm font-semibold mb-2" style={{ color: '#F1F3FA' }}>No workspace connected</p>
          <p className="text-xs mb-4" style={{ color: '#6B7299' }}>Sign into a workspace to view your CRM dashboard, or enable demo mode to explore.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: '#8B5CF6', color: '#F1F3FA' }}
          >
            Refresh
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#F1F3FA' }}>Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: '#6B7299' }}>Your AI-powered pipeline overview</p>
        </div>
      </div>

      {/* ARIA Brief */}
      <DashboardBrief brief={brief} loading={briefLoading} />

      {/* KPIs */}
      <KPIGrid
        pipelineValue={pipelineValue}
        openDeals={openDeals.length}
        winRate={winRate}
        avgDealSize={openDeals.length > 0 ? Math.round(pipelineValue / openDeals.length) : 0}
        revenueThisMonth={closedWon.reduce((s, d) => s + (d.value || 0), 0)}
        ariaAccuracy={hasData ? 91 : 0}
      />

      {/* Charts row 1: Revenue vs Target | Pipeline | Win/Loss */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl p-5" style={{ background: CRM_BG, border: `1px solid ${CRM_BORDER}` }}>
          {hasData ? <RevenueChart /> : <div className="flex flex-col items-center justify-center py-8"><p className="text-sm" style={{ color: '#6B7299' }}>No data yet</p></div>}
        </div>
        <div className="rounded-xl p-5" style={{ background: CRM_BG, border: `1px solid ${CRM_BORDER}` }}>
          <PipelineHealth stages={stageData} />
        </div>
        <div className="rounded-xl p-5" style={{ background: CRM_BG, border: `1px solid ${CRM_BORDER}` }}>
          <p className="text-sm font-semibold mb-3" style={{ color: '#F1F3FA' }}>Win/Loss Reasons</p>
          {hasData ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={WIN_LOSS_DATA} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} stroke="none">
                    {WIN_LOSS_DATA.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip content={<CRMTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 justify-center mt-1">
                {WIN_LOSS_DATA.map(d => (
                  <span key={d.name} className="flex items-center gap-1 text-[10px]" style={{ color: '#6B7299' }}>
                    <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: d.color }} />{d.name} {d.value}%
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center" style={{ height: 180 }}><p className="text-sm" style={{ color: '#6B7299' }}>No data yet</p></div>
          )}
        </div>
      </div>

      {/* Charts row 2: Velocity + Lead Source */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ background: CRM_BG, border: `1px solid ${CRM_BORDER}` }}>
          <p className="text-sm font-semibold mb-3" style={{ color: '#F1F3FA' }}>Deal Velocity Trend</p>
          {hasData ? (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={VELOCITY_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2035" />
                <XAxis dataKey="month" tick={{ fill: '#6B7299', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6B7299', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CRMTooltip />} />
                <Line type="monotone" dataKey="days" name="Avg Days" stroke={PURPLE} strokeWidth={2} dot={{ fill: PURPLE, r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center" style={{ height: 160 }}><p className="text-sm" style={{ color: '#6B7299' }}>No data yet</p></div>
          )}
        </div>
        <div className="rounded-xl p-5" style={{ background: CRM_BG, border: `1px solid ${CRM_BORDER}` }}>
          <p className="text-sm font-semibold mb-3" style={{ color: '#F1F3FA' }}>Lead Source Breakdown</p>
          {hasData ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={LEAD_SOURCE_DATA} layout="vertical" barSize={16}>
                <XAxis type="number" tick={{ fill: '#6B7299', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <YAxis type="category" dataKey="source" tick={{ fill: '#6B7299', fontSize: 10 }} axisLine={false} tickLine={false} width={65} />
                <Tooltip content={<CRMTooltip />} />
                <Bar dataKey="pct" name="%" fill="#06B6D4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center" style={{ height: 160 }}><p className="text-sm" style={{ color: '#6B7299' }}>No data yet</p></div>
          )}
        </div>
      </div>

      {/* Activity Today + Top Deals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ background: CRM_BG, border: `1px solid ${CRM_BORDER}` }}>
          <p className="text-sm font-semibold mb-4" style={{ color: '#F1F3FA' }}>Activity Today</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <Phone size={14} />, label: 'Calls Logged', value: hasData ? '8' : '0', trend: hasData ? '+3 vs yesterday' : 'No data yet', color: '#3B82F6' },
              { icon: <Mail size={14} />, label: 'Emails Sent', value: hasData ? '23' : '0', trend: hasData ? '+8 vs yesterday' : 'No data yet', color: PURPLE },
              { icon: <CalendarIcon size={14} />, label: 'Meetings Booked', value: hasData ? '4' : '0', trend: hasData ? '+1 vs yesterday' : 'No data yet', color: '#F59E0B' },
              { icon: <Video size={14} />, label: 'Demos Completed', value: hasData ? '2' : '0', trend: hasData ? 'On target' : 'No data yet', color: '#22C55E' },
            ].map(a => (
              <div key={a.label} className="rounded-lg p-3" style={{ background: CRM_CARD }}>
                <div className="flex items-center gap-2 mb-1" style={{ color: a.color }}>{a.icon}<span className="text-xs">{a.label}</span></div>
                <p className="text-lg font-black" style={{ color: '#F1F3FA' }}>{a.value}</p>
                <p className="text-[10px]" style={{ color: '#6B7299' }}>{a.trend}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Top Deals by ARIA Score */}
        <div className="rounded-xl p-5" style={{ background: CRM_BG, border: `1px solid ${CRM_BORDER}` }}>
          <p className="text-sm font-semibold mb-3" style={{ color: '#F1F3FA' }}>Top 5 Deals</p>
          <div className="space-y-3">
            {topDeals.map(deal => (
              <div key={deal.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: '#121320' }}>
                <div className="shrink-0">
                  <svg width="36" height="36" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#1E2035" strokeWidth="3" />
                    <circle cx="18" cy="18" r="14" fill="none" stroke={deal.aria_score >= 80 ? '#10B981' : deal.aria_score >= 60 ? '#8B5CF6' : '#EF4444'} strokeWidth="3" strokeDasharray={`${(deal.aria_score / 100) * 87.96} 87.96`} strokeLinecap="round" transform="rotate(-90 18 18)" />
                    <text x="18" y="18" textAnchor="middle" dominantBaseline="central" fill="#F1F3FA" fontSize="10" fontWeight="600">{deal.aria_score}</text>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: '#F1F3FA' }}>{deal.title}</p>
                  <p className="text-xs" style={{ color: '#6B7299' }}>{deal.contact_name || 'No contact'}</p>
                </div>
                <span className="text-sm font-semibold shrink-0" style={{ background: 'linear-gradient(135deg, #8B5CF6, #22D3EE)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>£{(deal.value || 0).toLocaleString()}</span>
              </div>
            ))}
            {topDeals.length === 0 && (
              <p className="text-sm text-center py-4" style={{ color: '#6B7299' }}>No open deals yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Churn Risk + Renewals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl overflow-hidden" style={{ background: CRM_BG, border: `1px solid ${CRM_BORDER}` }}>
          <div className="px-5 py-4" style={{ borderBottom: `1px solid ${CRM_BORDER}` }}><p className="text-sm font-semibold" style={{ color: '#F1F3FA' }}>Churn Risk Alerts</p></div>
          {hasData ? CHURN_ACCOUNTS.map((r, i) => (<div key={i} className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: i < CHURN_ACCOUNTS.length - 1 ? `1px solid ${CRM_BORDER}` : undefined }}><AlertCircle size={14} style={{ color: '#EF4444', flexShrink: 0 }} /><div className="flex-1 min-w-0"><p className="text-sm font-medium truncate" style={{ color: '#F1F3FA' }}>{r.name}</p><p className="text-xs" style={{ color: '#6B7299' }}>{r.reason}</p></div><span className="text-xs font-bold shrink-0" style={{ color: r.risk >= 80 ? '#EF4444' : '#F59E0B' }}>{r.risk}%</span></div>)) : <p className="px-5 py-6 text-sm text-center" style={{ color: '#6B7299' }}>No churn alerts</p>}
        </div>
        <div className="rounded-xl overflow-hidden" style={{ background: CRM_BG, border: `1px solid ${CRM_BORDER}` }}>
          <div className="px-5 py-4" style={{ borderBottom: `1px solid ${CRM_BORDER}` }}><p className="text-sm font-semibold" style={{ color: '#F1F3FA' }}>Upcoming Renewals</p></div>
          {hasData ? RENEWALS.map((r, i) => (<div key={i} className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: i < RENEWALS.length - 1 ? `1px solid ${CRM_BORDER}` : undefined }}><div className="flex-1 min-w-0"><p className="text-sm font-medium truncate" style={{ color: '#F1F3FA' }}>{r.name}</p><p className="text-xs" style={{ color: '#6B7299' }}>Due {r.due} · {r.arr}</p></div><span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0" style={{ backgroundColor: r.health === 'Healthy' ? 'rgba(34,197,94,0.1)' : r.health === 'At Risk' ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)', color: r.health === 'Healthy' ? '#22C55E' : r.health === 'At Risk' ? '#F59E0B' : '#EF4444' }}>{r.health}</span></div>)) : <p className="px-5 py-6 text-sm text-center" style={{ color: '#6B7299' }}>No upcoming renewals</p>}
        </div>
      </div>

      {/* Activity Feed */}
      <ActivityFeed activities={activities.slice(0, 8)} />
    </div>
  )
}
