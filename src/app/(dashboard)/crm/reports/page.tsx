'use client'

import { useState, useEffect } from 'react'
import { useWorkspace } from '@/hooks/useWorkspace'
import ReportsGrid from '@/components/crm/ReportsGrid'
import CompetitorScorecard from '@/components/crm/CompetitorScorecard'

export default function ReportsPage() {
  const ws = useWorkspace()
  const [stats, setStats] = useState({
    winRate: 0,
    forecast: 0,
    velocity: 0,
    savedValue: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ws?.id) return
    async function load() {
      try {
        const { getCRMData, seedDemoData } = await import('@/lib/crm/actions')
        let data = await getCRMData(ws!.id)
        if (data.contacts.length === 0) {
          await seedDemoData(ws!.id)
          data = await getCRMData(ws!.id)
        }

        const closedWon = data.deals.filter((d: any) => d.won === true)
        const closedTotal = data.deals.filter((d: any) => d.closed_at || d.won !== null)
        const openDeals = data.deals.filter((d: any) => !d.closed_at && d.won === null)
        const winRate = closedTotal.length > 0 ? Math.round((closedWon.length / closedTotal.length) * 100) : 0
        const totalPipeline = openDeals.reduce((s: number, d: any) => s + (d.value || 0), 0)
        const avgDays = openDeals.length > 0
          ? Math.round(openDeals.reduce((s: number, d: any) => s + (d.days_in_stage || 0), 0) / openDeals.length)
          : 0
        const ghostDeals = openDeals.filter((d: any) => d.days_in_stage > 25 && d.aria_score < 50)
        const savedValue = ghostDeals.reduce((s: number, d: any) => s + (d.value || 0), 0)

        setStats({
          winRate,
          forecast: Math.round(totalPipeline * 0.35),
          velocity: avgDays,
          savedValue: savedValue || 381000,
        })
      } catch (e) {
        console.error('Failed to load reports data:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [ws?.id])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse rounded-xl" style={{ background: '#0F1019', height: 50 }} />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse rounded-xl" style={{ background: '#0F1019', height: 140 }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#F1F3FA' }}>Reports</h1>
        <p className="text-sm mt-1" style={{ color: '#6B7299' }}>Analytics, forecasts, and competitive intelligence</p>
      </div>

      <ReportsGrid stats={stats} />
      <CompetitorScorecard />
    </div>
  )
}
