'use client'

import { useState, useEffect } from 'react'
import { useCRMWorkspaceId } from '@/hooks/useCRMWorkspaceId'
import ARIAChat from '@/components/crm/ARIAChat'
import ARIAInsightsPanel from '@/components/crm/ARIAInsightsPanel'
import type { ARIAInsight, CRMContext } from '@/lib/crm/types'

export default function IntelligencePage() {
  const workspaceId = useCRMWorkspaceId()
  const [insights, setInsights] = useState<ARIAInsight[]>([])
  const [crmContext, setCrmContext] = useState<CRMContext | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workspaceId) return
    async function load() {
      try {
        const { getCRMData, seedDemoData } = await import('@/lib/crm/actions')
        let data = await getCRMData(workspaceId!)
        const demoActive = typeof window !== 'undefined' && localStorage.getItem('lumio_demo_active') === 'true'
        if (data.contacts.length === 0 && demoActive) {
          await seedDemoData(workspaceId!)
          data = await getCRMData(workspaceId!)
        }

        setInsights(data.insights)

        const openDeals = data.deals.filter((d: any) => !d.closed_at && d.won === null)
        const closedWon = data.deals.filter((d: any) => d.won === true)
        const closedTotal = data.deals.filter((d: any) => d.closed_at || d.won !== null)

        setCrmContext({
          userName: (typeof window !== 'undefined' && localStorage.getItem('lumio_user_name')) || 'there',
          contacts: data.contacts,
          deals: data.deals,
          totalPipelineValue: openDeals.reduce((s: number, d: any) => s + (d.value || 0), 0),
          winRate: closedTotal.length > 0 ? Math.round((closedWon.length / closedTotal.length) * 100) : 0,
          openDealsCount: openDeals.length,
        })
      } catch (e) {
        console.error('Failed to load intelligence data:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [workspaceId])

  const openDeals = crmContext?.deals.filter(d => !d.closed_at && d.won === null) || []
  const atRiskDeals = openDeals.filter(d => d.aria_score < 50)
  const atRiskValue = atRiskDeals.reduce((s, d) => s + (d.value || 0), 0)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse rounded-xl" style={{ background: '#0F1019', height: 50 }} />
        <div className="grid grid-cols-1 lg:grid-cols-[290px_1fr] gap-6">
          <div className="animate-pulse rounded-xl" style={{ background: '#0F1019', height: 500 }} />
          <div className="animate-pulse rounded-xl" style={{ background: '#0F1019', height: 500 }} />
        </div>
      </div>
    )
  }

  if (!crmContext && insights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl mb-6" style={{ background: 'linear-gradient(135deg, rgba(108,63,197,0.2), rgba(108,63,197,0.05))', border: '1px solid rgba(108,63,197,0.3)' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 12l4-4"/><path d="M16 8h4v4"/></svg>
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: '#F9FAFB' }}>No intelligence data yet</h2>
        <p className="text-sm mb-6" style={{ color: '#9CA3AF' }}>Add contacts and deals to unlock ARIA-powered insights.</p>
        <a href="/crm/contacts" className="rounded-xl px-6 py-3 text-sm font-semibold" style={{ backgroundColor: '#7C3AED', color: '#F9FAFB', textDecoration: 'none' }}>Go to Contacts</a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#F1F3FA' }}>Intelligence</h1>
        <p className="text-sm mt-1" style={{ color: '#6B7299' }}>ARIA-powered insights and AI assistant</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[290px_1fr] gap-6" style={{ minHeight: 'calc(100vh - 200px)' }}>
        <ARIAInsightsPanel
          insights={insights.filter(i => !i.dismissed).slice(0, 4)}
          pipelineStats={{
            winRate: crmContext?.winRate || 0,
            atRiskValue,
            forecast: Math.round((crmContext?.totalPipelineValue || 0) * 0.35),
          }}
        />

        {crmContext && (
          <ARIAChat
            crmContext={crmContext}
            tenantId={workspaceId || ''}
          />
        )}
      </div>
    </div>
  )
}
