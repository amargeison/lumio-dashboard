'use client'

import { useState, useEffect, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Users, Eye, Sparkles, Trophy, Clock } from 'lucide-react'

type Period = '1d' | '7d' | '30d' | '90d'
type Sport = 'all' | 'tennis' | 'golf' | 'darts' | 'boxing' | 'cricket' | 'rugby' | 'football' | 'nonleague' | 'grassroots' | 'womens'

type Summary = {
  views: number
  unique_visitors: number
  demo_views: number
  founder_views: number
  top_sport: string | null
}

type TileSummary = Summary & { views: number; unique_visitors: number }

type ApiResponse = {
  period: { start: string; end: string }
  summary: Summary
  tiles: {
    today: TileSummary
    yesterday: TileSummary
    week: TileSummary
    month: TileSummary
    all_time: { views: number }
  }
  daily: { day: string; views: number; unique_visitors: number }[]
  topPaths: { key: string; count: number }[]
  topReferrers: { key: string; count: number }[]
  topCountries: { key: string; count: number }[]
  devices: { key: string; count: number }[]
  browsers: { key: string; count: number }[]
  botPct: number
  rowCapHit: boolean
}

const SPORTS: Sport[] = ['all', 'tennis', 'golf', 'darts', 'boxing', 'cricket', 'rugby', 'football', 'nonleague', 'grassroots', 'womens']
const PERIODS: { id: Period; label: string }[] = [
  { id: '1d', label: 'Today' },
  { id: '7d', label: '7d' },
  { id: '30d', label: '30d' },
  { id: '90d', label: '90d' },
]

function Tile({ label, value, sub, icon: Icon, color }: { label: string; value: string | number; sub?: string; icon: React.ElementType; color: string }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs" style={{ color: '#6B7280' }}>{label}</p>
        <Icon size={14} style={{ color }} />
      </div>
      <p className="text-2xl font-bold" style={{ color: '#F9FAFB' }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{sub}</p>}
    </div>
  )
}

function TopTable({ title, rows }: { title: string; rows: { key: string; count: number }[] }) {
  const total = rows.reduce((s, r) => s + r.count, 0)
  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <div className="px-4 py-3" style={{ borderBottom: '1px solid #1F2937' }}>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>{title}</p>
      </div>
      <div className="p-2">
        {rows.length === 0 ? (
          <p className="px-2 py-4 text-xs text-center" style={{ color: '#6B7280' }}>No data yet</p>
        ) : rows.map(r => {
          const pct = total > 0 ? (r.count / total) * 100 : 0
          return (
            <div key={r.key} className="relative px-2 py-1.5 text-sm flex items-center justify-between">
              <div className="absolute inset-0 mx-2 rounded" style={{ width: `${pct}%`, backgroundColor: 'rgba(245,166,35,0.08)' }} />
              <span className="relative truncate pr-4" style={{ color: '#F9FAFB' }}>{r.key}</span>
              <span className="relative font-mono text-xs" style={{ color: '#9CA3AF' }}>{r.count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function AdminAnalytics() {
  const [period, setPeriod] = useState<Period>('7d')
  const [sport, setSport] = useState<Sport>('all')
  const [excludeAdmin, setExcludeAdmin] = useState(true)
  const [excludeBots, setExcludeBots] = useState(true)
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_session_token') || '' : ''
    const qs = new URLSearchParams({
      period,
      sport,
      exclude_admin: excludeAdmin ? '1' : '0',
      exclude_bots: excludeBots ? '1' : '0',
    })
    fetch(`/api/admin/analytics?${qs.toString()}`, { headers: { 'x-admin-token': token } })
      .then(async r => {
        if (!r.ok) throw new Error(`${r.status}`)
        return r.json() as Promise<ApiResponse>
      })
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(String(e)); setLoading(false) })
  }, [period, sport, excludeAdmin, excludeBots])

  const dailyForChart = useMemo(() => {
    if (!data) return []
    return data.daily.map(d => ({ ...d, label: d.day.slice(5) }))
  }, [data])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold">Analytics</h1>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Period */}
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #1F2937' }}>
            {PERIODS.map(p => (
              <button key={p.id} onClick={() => setPeriod(p.id)}
                className="px-3 py-2 text-xs font-semibold"
                style={{ backgroundColor: period === p.id ? '#F5A623' : '#111318', color: period === p.id ? '#0A0B10' : '#6B7280' }}>
                {p.label}
              </button>
            ))}
          </div>

          {/* Sport */}
          <select value={sport} onChange={e => setSport(e.target.value as Sport)}
            className="text-xs px-3 py-2 rounded-lg outline-none"
            style={{ backgroundColor: '#111318', border: '1px solid #1F2937', color: '#F9FAFB' }}>
            {SPORTS.map(s => <option key={s} value={s}>{s === 'all' ? 'All sports' : s[0].toUpperCase() + s.slice(1)}</option>)}
          </select>

          {/* Toggles */}
          <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: '#9CA3AF' }}>
            <input type="checkbox" checked={excludeAdmin} onChange={e => setExcludeAdmin(e.target.checked)} />
            Exclude admin
          </label>
          <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: '#9CA3AF' }}>
            <input type="checkbox" checked={excludeBots} onChange={e => setExcludeBots(e.target.checked)} />
            Exclude bots
          </label>
        </div>
      </div>

      {error && (
        <div className="rounded-xl p-3 text-xs" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
          Failed to load analytics: {error}
        </div>
      )}

      {/* Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Tile label="Today"      value={loading ? '…' : (data?.tiles.today.views ?? 0).toLocaleString()}      sub={`${data?.tiles.today.unique_visitors ?? 0} unique`}     icon={Clock}    color="#6C3FC5" />
        <Tile label="Yesterday"  value={loading ? '…' : (data?.tiles.yesterday.views ?? 0).toLocaleString()}  sub={`${data?.tiles.yesterday.unique_visitors ?? 0} unique`} icon={Clock}    color="#6B7280" />
        <Tile label="Last 7 days"  value={loading ? '…' : (data?.tiles.week.views ?? 0).toLocaleString()}    sub={`${data?.tiles.week.unique_visitors ?? 0} unique`}      icon={Eye}      color="#F5A623" />
        <Tile label="Last 30 days" value={loading ? '…' : (data?.tiles.month.views ?? 0).toLocaleString()}   sub={`${data?.tiles.month.unique_visitors ?? 0} unique`}     icon={Eye}      color="#22C55E" />
        <Tile label="All time"   value={loading ? '…' : (data?.tiles.all_time.views ?? 0).toLocaleString()}                                                                icon={Trophy}   color="#0D9488" />
      </div>

      {/* Period-scoped secondary row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile label="Unique visitors (period)" value={loading ? '…' : (data?.summary.unique_visitors ?? 0).toLocaleString()} icon={Users}    color="#6C3FC5" />
        <Tile label="Demo URL views"           value={loading ? '…' : (data?.summary.demo_views ?? 0).toLocaleString()}      icon={Sparkles} color="#F5A623" />
        <Tile label="Founder URL views"        value={loading ? '…' : (data?.summary.founder_views ?? 0).toLocaleString()}   icon={Trophy}   color="#0D9488" />
        <Tile label="Top sport"                value={loading ? '…' : (data?.summary.top_sport || '—')}                      icon={Trophy}   color="#22C55E" />
      </div>

      {/* Chart */}
      <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>Page views</p>
          {data?.rowCapHit && <span className="text-xs" style={{ color: '#F59E0B' }}>Row cap hit — aggregates approximate</span>}
        </div>
        <div style={{ width: '100%', height: 240 }}>
          <ResponsiveContainer>
            <LineChart data={dailyForChart}>
              <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6B7280' }} stroke="#1F2937" />
              <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} stroke="#1F2937" />
              <Tooltip contentStyle={{ backgroundColor: '#0A0B10', border: '1px solid #1F2937', fontSize: 12 }} labelStyle={{ color: '#F9FAFB' }} />
              <Line type="monotone" dataKey="views" stroke="#F5A623" strokeWidth={2} dot={false} name="Views" />
              <Line type="monotone" dataKey="unique_visitors" stroke="#6C3FC5" strokeWidth={2} dot={false} name="Unique" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <TopTable title="Top paths" rows={data?.topPaths || []} />
        <TopTable title="Top referrers" rows={data?.topReferrers || []} />
        <TopTable title="Top countries" rows={data?.topCountries || []} />
      </div>

      {/* Secondary breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <TopTable title="Devices"  rows={data?.devices  || []} />
        <TopTable title="Browsers" rows={data?.browsers || []} />
        <div className="rounded-xl p-4" style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#6B7280' }}>Bot traffic</p>
          <p className="text-3xl font-bold" style={{ color: '#F9FAFB' }}>{loading ? '…' : `${data?.botPct ?? 0}%`}</p>
          <p className="text-xs mt-2" style={{ color: '#6B7280' }}>
            Share of bot page views in the selected period (computed before the exclude-bots filter).
          </p>
        </div>
      </div>
    </div>
  )
}
