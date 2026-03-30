'use client'

import { useState, useEffect } from 'react'
import { useCRMWorkspaceId } from '@/hooks/useCRMWorkspaceId'
import ReportsGrid from '@/components/crm/ReportsGrid'
import CompetitorScorecard from '@/components/crm/CompetitorScorecard'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts'

const CRM_BG = '#0F1019'
const CRM_BORDER = '#1E2035'
const PURPLE = '#8B5CF6'

const LEAD_ROI_DATA = [{ source: 'Referral', rate: 42 }, { source: 'Inbound', rate: 28 }, { source: 'LinkedIn', rate: 18 }, { source: 'Partner', rate: 34 }, { source: 'Cold', rate: 8 }]
const FORECAST_DATA = [{ w: 'W1', committed: 42000, bestCase: 52000, pipeline: 78000 }, { w: 'W4', committed: 48000, bestCase: 62000, pipeline: 85000 }, { w: 'W8', committed: 55000, bestCase: 74000, pipeline: 92000 }, { w: 'W12', committed: 62000, bestCase: 88000, pipeline: 98000 }]
const LOST_DEAL_DATA = [{ name: 'Price', value: 8 }, { name: 'Competitor', value: 6 }, { name: 'Timing', value: 5 }, { name: 'No Budget', value: 4 }, { name: 'No Response', value: 3 }]
const LOST_DEAL_COLORS = ['#EF4444', '#F59E0B', '#6B7280', '#3B82F6', '#8B5CF6']
const REP_DATA = [
  { name: 'Sophie Williams', closed: '£28,400', wr: '34%', open: 8, avg: '£4,200' },
  { name: 'James Okafor', closed: '£22,100', wr: '28%', open: 6, avg: '£3,800' },
  { name: 'Charlotte Davies', closed: '£31,600', wr: '41%', open: 5, avg: '£5,100' },
  { name: 'Marcus Reid', closed: '£18,900', wr: '22%', open: 9, avg: '£2,900' },
]

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

export default function ReportsPage() {
  const workspaceId = useCRMWorkspaceId()
  const [stats, setStats] = useState({
    winRate: 0,
    forecast: 0,
    velocity: 0,
    savedValue: 0,
  })
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
  }, [workspaceId])

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

      {/* Rep Performance + Lead Source ROI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl overflow-hidden" style={{ background: CRM_BG, border: `1px solid ${CRM_BORDER}` }}>
          <div className="px-5 py-4" style={{ borderBottom: `1px solid ${CRM_BORDER}` }}><p className="text-sm font-semibold" style={{ color: '#F1F3FA' }}>Rep Performance</p></div>
          <table className="w-full text-xs">
            <thead><tr style={{ borderBottom: `1px solid ${CRM_BORDER}` }}>{['Rep', 'Closed £', 'Win Rate', 'Deals Open', 'Avg Size'].map(h => <th key={h} className="text-left px-4 py-2.5 font-semibold" style={{ color: '#6B7299' }}>{h}</th>)}</tr></thead>
            <tbody>{REP_DATA.map(r => (
              <tr key={r.name} style={{ borderBottom: `1px solid ${CRM_BORDER}` }}>
                <td className="px-4 py-2.5 font-medium" style={{ color: '#F1F3FA' }}>{r.name}</td>
                <td className="px-4 py-2.5" style={{ color: '#A78BFA' }}>{r.closed}</td>
                <td className="px-4 py-2.5" style={{ color: '#22C55E' }}>{r.wr}</td>
                <td className="px-4 py-2.5" style={{ color: '#6B7299' }}>{r.open}</td>
                <td className="px-4 py-2.5" style={{ color: '#6B7299' }}>{r.avg}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div className="rounded-xl p-5" style={{ background: CRM_BG, border: `1px solid ${CRM_BORDER}` }}>
          <p className="text-sm font-semibold mb-3" style={{ color: '#F1F3FA' }}>Lead Source ROI</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={LEAD_ROI_DATA} layout="vertical" barSize={16}>
              <XAxis type="number" tick={{ fill: '#6B7299', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="source" tick={{ fill: '#6B7299', fontSize: 10 }} axisLine={false} tickLine={false} width={65} />
              <Tooltip content={<CRMTooltip />} />
              <Bar dataKey="rate" name="Conv Rate" fill="#22C55E" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sales Forecast + Lost Deal Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ background: CRM_BG, border: `1px solid ${CRM_BORDER}` }}>
          <p className="text-sm font-semibold mb-3" style={{ color: '#F1F3FA' }}>Sales Forecast (90 Days)</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={FORECAST_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2035" />
              <XAxis dataKey="w" tick={{ fill: '#6B7299', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6B7299', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `£${v / 1000}k`} />
              <Tooltip content={<CRMTooltip />} />
              <Line type="monotone" dataKey="committed" name="Committed" stroke="#22C55E" strokeWidth={2} dot={{ fill: '#22C55E', r: 3 }} />
              <Line type="monotone" dataKey="bestCase" name="Best Case" stroke={PURPLE} strokeWidth={2} strokeDasharray="5 5" dot={{ fill: PURPLE, r: 3 }} />
              <Line type="monotone" dataKey="pipeline" name="Pipeline" stroke="#6B7299" strokeWidth={1} strokeDasharray="3 3" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-xl p-5" style={{ background: CRM_BG, border: `1px solid ${CRM_BORDER}` }}>
          <p className="text-sm font-semibold mb-3" style={{ color: '#F1F3FA' }}>Lost Deal Analysis</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={LOST_DEAL_DATA} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} stroke="none">
                {LOST_DEAL_COLORS.map((c, i) => <Cell key={i} fill={c} />)}
              </Pie>
              <Tooltip content={<CRMTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 justify-center">
            {LOST_DEAL_DATA.map((d, i) => (
              <span key={d.name} className="flex items-center gap-1 text-[10px]" style={{ color: '#6B7299' }}><span className="w-2 h-2 rounded-full" style={{ backgroundColor: LOST_DEAL_COLORS[i] }} />{d.name} ({d.value})</span>
            ))}
          </div>
        </div>
      </div>

      <CompetitorScorecard />
    </div>
  )
}
