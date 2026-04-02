'use client'

import { useState, useEffect } from 'react'
import { useCRMWorkspaceId } from '@/hooks/useCRMWorkspaceId'
import KanbanBoard from '@/components/crm/KanbanBoard'
import DealDNA from '@/components/crm/DealDNA'
import type { CRMDeal, PipelineStage } from '@/lib/crm/types'

const DEMO_STAGES: PipelineStage[] = [
  { id: 's1', name: 'Prospecting', position: 1, color: '#6366F1', tenant_id: '', created_at: '' },
  { id: 's2', name: 'Qualified', position: 2, color: '#8B5CF6', tenant_id: '', created_at: '' },
  { id: 's3', name: 'Proposal', position: 3, color: '#A78BFA', tenant_id: '', created_at: '' },
  { id: 's4', name: 'Negotiation', position: 4, color: '#C084FC', tenant_id: '', created_at: '' },
  { id: 's5', name: 'Closed Won', position: 5, color: '#22C55E', tenant_id: '', created_at: '' },
  { id: 's6', name: 'Closed Lost', position: 6, color: '#EF4444', tenant_id: '', created_at: '' },
]
const DEMO_DEALS: CRMDeal[] = [
  { id: 'd1', tenant_id: '', title: 'Greenfield Academy', value: 91000, stage_id: 's4', contact_id: null, company_id: null, owner_id: null, aria_score: 92, engagement_score: 85, stakeholder_score: 78, momentum_score: 90, risk_score: 15, days_in_stage: 5, last_activity_at: '2026-03-28', expected_close_date: '2026-04-15', closed_at: null, won: null, notes: null, created_at: '2026-01-15', updated_at: '2026-03-28', contact_name: 'Rachel Fox', stage_name: 'Negotiation', stage_color: '#C084FC' },
  { id: 'd2', tenant_id: '', title: 'Oakridge Schools Ltd', value: 76000, stage_id: 's3', contact_id: null, company_id: null, owner_id: null, aria_score: 78, engagement_score: 72, stakeholder_score: 80, momentum_score: 65, risk_score: 30, days_in_stage: 12, last_activity_at: '2026-03-25', expected_close_date: '2026-05-01', closed_at: null, won: null, notes: null, created_at: '2026-02-01', updated_at: '2026-03-25', contact_name: 'Gary Stone', stage_name: 'Proposal', stage_color: '#A78BFA' },
  { id: 'd3', tenant_id: '', title: 'Torchbearer Trust', value: 55000, stage_id: 's3', contact_id: null, company_id: null, owner_id: null, aria_score: 71, engagement_score: 68, stakeholder_score: 74, momentum_score: 70, risk_score: 25, days_in_stage: 8, last_activity_at: '2026-03-20', expected_close_date: '2026-04-30', closed_at: null, won: null, notes: null, created_at: '2026-01-20', updated_at: '2026-03-20', contact_name: 'Ann Mehta', stage_name: 'Proposal', stage_color: '#A78BFA' },
  { id: 'd4', tenant_id: '', title: 'Brightfields MAT', value: 42000, stage_id: 's2', contact_id: null, company_id: null, owner_id: null, aria_score: 68, engagement_score: 60, stakeholder_score: 72, momentum_score: 55, risk_score: 35, days_in_stage: 3, last_activity_at: '2026-03-22', expected_close_date: '2026-06-15', closed_at: null, won: null, notes: null, created_at: '2026-02-10', updated_at: '2026-03-22', contact_name: 'Lee Dawson', stage_name: 'Qualified', stage_color: '#8B5CF6' },
  { id: 'd5', tenant_id: '', title: 'Starling Schools', value: 33400, stage_id: 's2', contact_id: null, company_id: null, owner_id: null, aria_score: 65, engagement_score: 58, stakeholder_score: 65, momentum_score: 62, risk_score: 40, days_in_stage: 7, last_activity_at: '2026-03-18', expected_close_date: '2026-05-30', closed_at: null, won: null, notes: null, created_at: '2026-02-15', updated_at: '2026-03-18', contact_name: 'Maria Olsen', stage_name: 'Qualified', stage_color: '#8B5CF6' },
  { id: 'd6', tenant_id: '', title: 'Northpoint Primary', value: 28000, stage_id: 's1', contact_id: null, company_id: null, owner_id: null, aria_score: 55, engagement_score: 45, stakeholder_score: 50, momentum_score: 40, risk_score: 50, days_in_stage: 2, last_activity_at: '2026-03-30', expected_close_date: '2026-07-01', closed_at: null, won: null, notes: null, created_at: '2026-03-01', updated_at: '2026-03-30', contact_name: 'Jake Burns', stage_name: 'Prospecting', stage_color: '#6366F1' },
  { id: 'd7', tenant_id: '', title: 'Meridian Trust', value: 24000, stage_id: 's1', contact_id: null, company_id: null, owner_id: null, aria_score: 48, engagement_score: 40, stakeholder_score: 55, momentum_score: 35, risk_score: 55, days_in_stage: 14, last_activity_at: '2026-03-15', expected_close_date: '2026-06-30', closed_at: null, won: null, notes: null, created_at: '2026-02-20', updated_at: '2026-03-15', contact_name: 'Marcus Chen', stage_name: 'Prospecting', stage_color: '#6366F1' },
  { id: 'd8', tenant_id: '', title: 'Helix Education', value: 18000, stage_id: 's4', contact_id: null, company_id: null, owner_id: null, aria_score: 95, engagement_score: 92, stakeholder_score: 88, momentum_score: 95, risk_score: 5, days_in_stage: 3, last_activity_at: '2026-03-29', expected_close_date: '2026-04-05', closed_at: null, won: null, notes: null, created_at: '2025-12-01', updated_at: '2026-03-29', contact_name: 'Priya Shah', stage_name: 'Negotiation', stage_color: '#C084FC' },
  { id: 'd9', tenant_id: '', title: 'Calibre Learning', value: 15000, stage_id: 's5', contact_id: null, company_id: null, owner_id: null, aria_score: 99, engagement_score: 95, stakeholder_score: 90, momentum_score: 100, risk_score: 0, days_in_stage: 0, last_activity_at: '2026-03-27', expected_close_date: '2026-03-27', closed_at: '2026-03-27', won: true, notes: null, created_at: '2025-11-15', updated_at: '2026-03-27', contact_name: 'Owen James', stage_name: 'Closed Won', stage_color: '#22C55E' },
  { id: 'd10', tenant_id: '', title: 'Apex Tutors', value: 12000, stage_id: 's1', contact_id: null, company_id: null, owner_id: null, aria_score: 42, engagement_score: 35, stakeholder_score: 40, momentum_score: 30, risk_score: 65, days_in_stage: 21, last_activity_at: '2026-03-10', expected_close_date: '2026-08-01', closed_at: null, won: null, notes: null, created_at: '2026-03-05', updated_at: '2026-03-10', contact_name: 'Nina Webb', stage_name: 'Prospecting', stage_color: '#6366F1' },
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
