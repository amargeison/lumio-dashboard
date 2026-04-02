'use client'

import { useState, useEffect } from 'react'
import { useCRMWorkspaceId } from '@/hooks/useCRMWorkspaceId'
import KanbanBoard from '@/components/crm/KanbanBoard'
import DealDNA from '@/components/crm/DealDNA'
import type { CRMDeal, PipelineStage } from '@/lib/crm/types'

const DEMO_STAGES: PipelineStage[] = [
  { id: 's1', name: 'Prospecting', position: 1, color: '#6366F1', workspace_id: '' },
  { id: 's2', name: 'Qualified', position: 2, color: '#8B5CF6', workspace_id: '' },
  { id: 's3', name: 'Proposal', position: 3, color: '#A78BFA', workspace_id: '' },
  { id: 's4', name: 'Negotiation', position: 4, color: '#C084FC', workspace_id: '' },
  { id: 's5', name: 'Closed Won', position: 5, color: '#22C55E', workspace_id: '' },
  { id: 's6', name: 'Closed Lost', position: 6, color: '#EF4444', workspace_id: '' },
]
const DEMO_DEALS: CRMDeal[] = [
  { id: 'd1', company_name: 'Greenfield Academy', contact_name: 'Sarah Mitchell', value: 91000, stage_id: 's4', probability: 80, days_in_stage: 5, aria_score: 92, workspace_id: '', created_at: '' },
  { id: 'd2', company_name: 'Oakridge Schools Ltd', contact_name: 'James Harlow', value: 76000, stage_id: 's3', probability: 60, days_in_stage: 12, aria_score: 78, workspace_id: '', created_at: '' },
  { id: 'd3', company_name: 'Bramble Hill Trust', contact_name: 'Oliver Bennett', value: 55000, stage_id: 's3', probability: 50, days_in_stage: 8, aria_score: 71, workspace_id: '', created_at: '' },
  { id: 'd4', company_name: 'Hopscotch Learning', contact_name: 'Raj Patel', value: 42000, stage_id: 's2', probability: 40, days_in_stage: 3, aria_score: 68, workspace_id: '', created_at: '' },
  { id: 'd5', company_name: 'Crestview Academy', contact_name: 'Sophie Bell', value: 33400, stage_id: 's2', probability: 35, days_in_stage: 7, aria_score: 65, workspace_id: '', created_at: '' },
  { id: 'd6', company_name: 'Meadowbrook Primary', contact_name: 'Dan Marsh', value: 28000, stage_id: 's1', probability: 20, days_in_stage: 2, aria_score: 55, workspace_id: '', created_at: '' },
  { id: 'd7', company_name: 'Starling Schools', contact_name: 'Marcus Chen', value: 24000, stage_id: 's1', probability: 15, days_in_stage: 14, aria_score: 48, workspace_id: '', created_at: '' },
  { id: 'd8', company_name: 'Torchbearer Trust', contact_name: 'Charlotte Davies', value: 18000, stage_id: 's4', probability: 90, days_in_stage: 3, aria_score: 95, workspace_id: '', created_at: '' },
  { id: 'd9', company_name: 'Fernview College', contact_name: 'Amara Diallo', value: 15000, stage_id: 's5', probability: 100, days_in_stage: 0, aria_score: 99, workspace_id: '', created_at: '' },
  { id: 'd10', company_name: 'Lakewood Schools', contact_name: 'Rachel Fox', value: 12000, stage_id: 's1', probability: 10, days_in_stage: 21, aria_score: 42, workspace_id: '', created_at: '' },
]

export default function PipelinePage() {
  const workspaceId = useCRMWorkspaceId()
  const isDemoActive = typeof window !== 'undefined' && localStorage.getItem('lumio_demo_active') === 'true'
  const [deals, setDeals] = useState<CRMDeal[]>(isDemoActive && !workspaceId ? DEMO_DEALS : [])
  const [stages, setStages] = useState<PipelineStage[]>(isDemoActive && !workspaceId ? DEMO_STAGES : [])
  const [selectedDeal, setSelectedDeal] = useState<CRMDeal | null>(null)
  const [loading, setLoading] = useState(!isDemoActive)

  useEffect(() => {
    if (!workspaceId) { if (isDemoActive) { setDeals(DEMO_DEALS); setStages(DEMO_STAGES); setLoading(false) }; return }
    async function load() {
      try {
        const { getCRMData, seedDemoData } = await import('@/lib/crm/actions')
        let data = await getCRMData(workspaceId!)
        const demoActive = typeof window !== 'undefined' && localStorage.getItem('lumio_demo_active') === 'true'
        if (data.contacts.length === 0 && demoActive) {
          await seedDemoData(workspaceId!)
          data = await getCRMData(workspaceId!)
        }
        setDeals(data.deals)
        setStages(data.stages)
      } catch (e) {
        console.error('Failed to load pipeline data:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [workspaceId])

  async function handleDealMove(dealId: string, stageId: string) {
    // Optimistic update
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage_id: stageId, days_in_stage: 0 } : d))
    try {
      const { updateDealStage } = await import('@/lib/crm/actions')
      await updateDealStage(dealId, stageId)
    } catch (e) {
      console.error('Failed to update deal stage:', e)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse rounded-xl" style={{ background: '#0F1019', height: 50 }} />
        <div className="flex gap-4 overflow-x-auto">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="animate-pulse rounded-xl shrink-0" style={{ background: '#0F1019', height: 400, width: 280 }} />
          ))}
        </div>
      </div>
    )
  }

  if (deals.length === 0 && stages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl mb-6" style={{ background: 'linear-gradient(135deg, rgba(108,63,197,0.2), rgba(108,63,197,0.05))', border: '1px solid rgba(108,63,197,0.3)' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>
        </div>
        <h2 className="text-xl font-bold mb-2" style={{ color: '#F9FAFB' }}>No deals in your pipeline</h2>
        <p className="text-sm mb-6" style={{ color: '#9CA3AF' }}>Add contacts and create deals to see your pipeline here.</p>
        <a href="/crm/contacts" className="rounded-xl px-6 py-3 text-sm font-semibold" style={{ backgroundColor: '#7C3AED', color: '#F9FAFB', textDecoration: 'none' }}>Go to Contacts</a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#F1F3FA' }}>Pipeline</h1>
          <p className="text-sm mt-1" style={{ color: '#6B7299' }}>
            {deals.filter(d => !d.closed_at).length} active deals · £{deals.filter(d => !d.closed_at).reduce((s, d) => s + (d.value || 0), 0).toLocaleString()} in pipeline
          </p>
        </div>
      </div>

      <KanbanBoard
        stages={stages.sort((a, b) => a.position - b.position)}
        deals={deals}
        onDealMove={handleDealMove}
        onDealClick={setSelectedDeal}
      />

      <DealDNA deal={selectedDeal} />
    </div>
  )
}
