'use client'

import { useState, useEffect } from 'react'
import { useWorkspace } from '@/hooks/useWorkspace'
import DashboardBrief from '@/components/crm/DashboardBrief'
import KPIGrid from '@/components/crm/KPIGrid'
import RevenueChart from '@/components/crm/RevenueChart'
import PipelineHealth from '@/components/crm/PipelineHealth'
import ActivityFeed from '@/components/crm/ActivityFeed'
import type { CRMDeal, CRMContact, CRMActivity, PipelineStage } from '@/lib/crm/types'

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

// Fallback workspace resolution — if useWorkspace returns null, try to resolve from session token directly
function useFallbackWorkspaceId(): string | null {
  const [id, setId] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('workspace_session_token')
    if (!token) return

    fetch('/api/workspace/status', { headers: { 'x-workspace-token': token } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.id) setId(d.id) })
      .catch(() => {})
  }, [])

  return id
}

export default function CRMDashboardPage() {
  const ws = useWorkspace()
  const fallbackId = useFallbackWorkspaceId()
  const workspaceId = ws?.id || fallbackId
  const cached = getCachedCRM()
  const [brief, setBrief] = useState('')
  const [briefLoading, setBriefLoading] = useState(true)
  const [contacts, setContacts] = useState<CRMContact[]>(cached?.contacts || [])
  const [deals, setDeals] = useState<CRMDeal[]>(cached?.deals || [])
  const [activities, setActivities] = useState<CRMActivity[]>(cached?.activities || [])
  const [stages, setStages] = useState<PipelineStage[]>(cached?.stages || [])
  const [loading, setLoading] = useState(!cached)
  const [error, setError] = useState<string | null>(null)

  // Fetch CRM data
  useEffect(() => {
    if (!workspaceId) return

    async function loadData() {
      try {
        const { getCRMData, seedDemoData } = await import('@/lib/crm/actions')
        const data = await getCRMData(workspaceId!)

        let result = data
        if (data.contacts.length === 0) {
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
        if (!cached) setError(e?.message || 'Failed to load CRM data')
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

  // Skeleton loading state
  if (!workspaceId && !cached) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse rounded-xl" style={{ background: '#0F1019', height: 80 }} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse rounded-xl" style={{ background: '#0F1019', height: 120 }} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="animate-pulse rounded-xl" style={{ background: '#0F1019', height: 300 }} />
          <div className="animate-pulse rounded-xl" style={{ background: '#0F1019', height: 300 }} />
        </div>
      </div>
    )
  }

  if (loading && !cached) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse rounded-xl" style={{ background: '#0F1019', height: 80 }} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse rounded-xl" style={{ background: '#0F1019', height: 120 }} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="animate-pulse rounded-xl" style={{ background: '#0F1019', height: 300 }} />
          <div className="animate-pulse rounded-xl" style={{ background: '#0F1019', height: 300 }} />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="rounded-xl p-8 text-center max-w-md" style={{ background: '#0F1019', border: '1px solid #EF4444' }}>
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
        ariaAccuracy={91}
      />

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart />
        <PipelineHealth stages={stageData} />
      </div>

      {/* Activity + Top Deals row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed activities={activities.slice(0, 8)} />

        {/* Top Deals by ARIA Score */}
        <div className="rounded-xl p-6" style={{ background: '#0F1019', border: '1px solid #1E2035' }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: '#F1F3FA' }}>Top Deals by ARIA Score</h3>
          <div className="space-y-3">
            {topDeals.map(deal => (
              <div key={deal.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: '#121320' }}>
                {/* Score ring */}
                <div className="shrink-0">
                  <svg width="36" height="36" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#1E2035" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="14" fill="none"
                      stroke={deal.aria_score >= 80 ? '#10B981' : deal.aria_score >= 60 ? '#8B5CF6' : '#EF4444'}
                      strokeWidth="3"
                      strokeDasharray={`${(deal.aria_score / 100) * 87.96} 87.96`}
                      strokeLinecap="round"
                      transform="rotate(-90 18 18)"
                    />
                    <text x="18" y="18" textAnchor="middle" dominantBaseline="central"
                      fill="#F1F3FA" fontSize="10" fontWeight="600">
                      {deal.aria_score}
                    </text>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: '#F1F3FA' }}>{deal.title}</p>
                  <p className="text-xs" style={{ color: '#6B7299' }}>{deal.contact_name || 'No contact'}</p>
                </div>
                <span className="text-sm font-semibold shrink-0" style={{
                  background: 'linear-gradient(135deg, #8B5CF6, #22D3EE)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  £{(deal.value || 0).toLocaleString()}
                </span>
              </div>
            ))}
            {topDeals.length === 0 && (
              <p className="text-sm text-center py-4" style={{ color: '#6B7299' }}>No open deals yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
