'use client'

import { useState, useEffect } from 'react'
import { useCRMWorkspaceId } from '@/hooks/useCRMWorkspaceId'
import KanbanBoard from '@/components/crm/KanbanBoard'
import DealDNA from '@/components/crm/DealDNA'
import type { CRMDeal, PipelineStage } from '@/lib/crm/types'

export default function PipelinePage() {
  const workspaceId = useCRMWorkspaceId()
  const [deals, setDeals] = useState<CRMDeal[]>([])
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [selectedDeal, setSelectedDeal] = useState<CRMDeal | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workspaceId) return
    async function load() {
      try {
        const { getCRMData, seedDemoData } = await import('@/lib/crm/actions')
        let data = await getCRMData(workspaceId!)
        if (data.contacts.length === 0) {
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
