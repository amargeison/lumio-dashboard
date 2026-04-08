'use client'

import { useState, useEffect, useMemo } from 'react'
import type { MockPlayer, MockFixture } from '@/lib/football-data'
import { FeatureGate } from './FeatureGate'
import type { ClubTier } from '@/lib/feature-gates'

const C = {
  bg: '#07080F', card: '#111318', border: '#1F2937',
  text: '#F9FAFB', muted: '#9CA3AF', yellow: '#F1C40F',
  green: '#22C55E', amber: '#F59E0B', red: '#EF4444',
  blue: '#3B82F6', purple: '#8B5CF6', pink: '#EC4899', cyan: '#06B6D4',
}

type Period = '30d' | '90d' | 'season'

interface FanData {
  attendanceSummary: {
    average: number; highest: number; lowest: number; trend: number
    history: { date: string; value: number; opponent: string | null }[]
  }
  npsSummary: { current: number; trend: number; history: any[] }
  seasonTickets: { current: any | null; previous: any | null; renewalTrend: number; all: any[] }
  socialSentiment: { overallScore: number; trend: number; byPlatform: { platform: string; score: number; mentions: number }[]; history: any[] }
  fanMetrics: any[]
  fanJourney: any | null
  competitors: any[]
}

interface Props {
  clubId: string | null
  clubName: string
  isDemo?: boolean
  squad?: MockPlayer[]
  fixtures?: MockFixture[]
  avgTicketPrice?: number
  groundCapacity?: number
  clubTier?: ClubTier
}

function npsLabel(n: number): { label: string; color: string } {
  if (n < 0) return { label: 'Needs Work', color: C.red }
  if (n <= 30) return { label: 'Good', color: C.amber }
  if (n <= 70) return { label: 'Great', color: C.green }
  return { label: 'Excellent', color: C.purple }
}

function sentimentColor(s: number): string {
  if (s >= 50) return C.green
  if (s >= 0) return C.amber
  return C.red
}

function platformColor(p: string): string {
  switch (p) {
    case 'Twitter': return C.cyan
    case 'Instagram': return C.pink
    case 'Facebook': return C.blue
    case 'TikTok': return C.purple
    case 'Reddit': return C.amber
    default: return C.muted
  }
}

function fmtNum(n: number): string {
  if (n >= 1000000) return `£${(n / 1000000).toFixed(1)}m`
  if (n >= 1000) return `${Math.round(n / 100) / 10}k`
  return String(Math.round(n))
}

// ─── Reusable mini SVG charts ────────────────────────────────────────────────

function LineChart({ points, color = C.blue, height = 100, threshold }: { points: number[]; color?: string; height?: number; threshold?: number }) {
  if (points.length === 0) return <div className="text-[10px]" style={{ color: C.muted }}>No data</div>
  const max = Math.max(1, ...points)
  const min = Math.min(0, ...points)
  const range = Math.max(1, max - min)
  const w = 300
  const path = points.map((p, i) => {
    const x = (i / Math.max(1, points.length - 1)) * (w - 10) + 5
    const y = height - ((p - min) / range) * (height - 10) - 5
    return `${i === 0 ? 'M' : 'L'}${x},${y}`
  }).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full">
      {threshold != null && (
        <line x1={0} y1={height - ((threshold - min) / range) * (height - 10) - 5} x2={w} y2={height - ((threshold - min) / range) * (height - 10) - 5} stroke={C.amber} strokeWidth={0.5} strokeDasharray="3,3" />
      )}
      <path d={path} fill="none" stroke={color} strokeWidth={2} />
      {points.map((p, i) => {
        const x = (i / Math.max(1, points.length - 1)) * (w - 10) + 5
        const y = height - ((p - min) / range) * (height - 10) - 5
        return <circle key={i} cx={x} cy={y} r={2} fill={color} />
      })}
    </svg>
  )
}

function BarChart({ data, color = C.purple, height = 110 }: { data: { label: string; value: number }[]; color?: string; height?: number }) {
  if (data.length === 0) return <div className="text-[10px]" style={{ color: C.muted }}>No data</div>
  const max = Math.max(1, ...data.map((d) => d.value))
  const w = 300
  const bw = (w - 20) / data.length - 4
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full">
      {data.map((d, i) => {
        const x = 10 + i * (bw + 4)
        const h = (d.value / max) * (height - 30)
        const y = height - 20 - h
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={h} fill={color} rx={2} />
            <text x={x + bw / 2} y={y - 2} fill={C.text} fontSize="7" textAnchor="middle">{d.value}</text>
            <text x={x + bw / 2} y={height - 5} fill={C.muted} fontSize="6" textAnchor="middle">{d.label}</text>
          </g>
        )
      })}
    </svg>
  )
}

function Donut({ slices, size = 110 }: { slices: { label: string; value: number; color: string }[]; size?: number }) {
  const total = slices.reduce((a, s) => a + s.value, 0)
  if (total === 0) return <div className="text-[10px]" style={{ color: C.muted }}>No data</div>
  const r = size / 2 - 8
  const cx = size / 2
  const cy = size / 2
  let acc = 0
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      {slices.map((s, i) => {
        const startAngle = (acc / total) * Math.PI * 2
        acc += s.value
        const endAngle = (acc / total) * Math.PI * 2
        const x1 = cx + r * Math.sin(startAngle)
        const y1 = cy - r * Math.cos(startAngle)
        const x2 = cx + r * Math.sin(endAngle)
        const y2 = cy - r * Math.cos(endAngle)
        const large = endAngle - startAngle > Math.PI ? 1 : 0
        return <path key={i} d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`} fill={s.color} />
      })}
      <circle cx={cx} cy={cy} r={r * 0.55} fill={C.bg} />
      <text x={cx} y={cy + 3} fill={C.text} fontSize="9" textAnchor="middle" fontWeight="bold">{total}</text>
    </svg>
  )
}

function NPSGauge({ score }: { score: number }) {
  // Semicircle gauge -100 to +100
  const w = 240, h = 130, cx = 120, cy = 110, r = 90
  const norm = Math.max(-100, Math.min(100, score))
  const angle = ((norm + 100) / 200) * Math.PI - Math.PI / 2 // -90° to +90°
  const needleX = cx + r * 0.85 * Math.sin(angle)
  const needleY = cy - r * 0.85 * Math.cos(angle)
  // Zone arcs
  const arc = (from: number, to: number) => {
    const a1 = ((from + 100) / 200) * Math.PI - Math.PI / 2
    const a2 = ((to + 100) / 200) * Math.PI - Math.PI / 2
    const x1 = cx + r * Math.sin(a1)
    const y1 = cy - r * Math.cos(a1)
    const x2 = cx + r * Math.sin(a2)
    const y2 = cy - r * Math.cos(a2)
    return `M${x1},${y1} A${r},${r} 0 0 1 ${x2},${y2}`
  }
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
      <path d={arc(-100, 0)} stroke={C.red} strokeWidth={14} fill="none" />
      <path d={arc(0, 30)} stroke={C.amber} strokeWidth={14} fill="none" />
      <path d={arc(30, 70)} stroke={C.green} strokeWidth={14} fill="none" />
      <path d={arc(70, 100)} stroke={C.purple} strokeWidth={14} fill="none" />
      <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke={C.text} strokeWidth={3} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={4} fill={C.text} />
      <text x={cx} y={cy + 18} fill={C.text} fontSize="14" textAnchor="middle" fontWeight="bold">{Math.round(score)}</text>
    </svg>
  )
}

function ScatterChart({ points, height = 120 }: { points: { x: number; y: number; label?: string }[]; height?: number }) {
  if (points.length === 0) return <div className="text-[10px]" style={{ color: C.muted }}>No data</div>
  const w = 300
  const xMin = Math.min(...points.map((p) => p.x))
  const xMax = Math.max(...points.map((p) => p.x))
  const yMin = Math.min(...points.map((p) => p.y))
  const yMax = Math.max(...points.map((p) => p.y))
  const xR = Math.max(1, xMax - xMin)
  const yR = Math.max(1, yMax - yMin)
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full">
      {points.map((p, i) => {
        const x = ((p.x - xMin) / xR) * (w - 20) + 10
        const y = height - ((p.y - yMin) / yR) * (height - 20) - 10
        return <circle key={i} cx={x} cy={y} r={3} fill={C.purple} opacity={0.7} />
      })}
    </svg>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function FanEngagementView({ clubId, clubName, isDemo = false, squad = [], fixtures = [], avgTicketPrice = 22, groundCapacity = 9000, clubTier = 'starter' }: Props) {
  const [period, setPeriod] = useState<Period>('season')
  const [data, setData] = useState<FanData | null>(null)
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showNpsForm, setShowNpsForm] = useState(false)

  // AI insights state
  const [aiRecs, setAiRecs] = useState<any[] | null>(null)
  const [aiLoadingRecs, setAiLoadingRecs] = useState(false)
  const [newsletter, setNewsletter] = useState<string | null>(null)
  const [aiLoadingNews, setAiLoadingNews] = useState(false)

  // Add data form state
  const [newType, setNewType] = useState('attendance')
  const [newValue, setNewValue] = useState('')
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [newNotes, setNewNotes] = useState('')

  // NPS form state
  const [npsP, setNpsP] = useState(0)
  const [npsPa, setNpsPa] = useState(0)
  const [npsD, setNpsD] = useState(0)
  const [npsThemes, setNpsThemes] = useState('')
  const npsLive = (npsP + npsPa + npsD) > 0 ? Math.round(((npsP - npsD) / (npsP + npsPa + npsD)) * 100) : 0

  useEffect(() => {
    if (!clubId) return
    let cancelled = false
    setLoading(true)
    fetch(`/api/football/fan-engagement?clubId=${clubId}&period=${period}`)
      .then((r) => r.ok ? r.json() : null)
      .then((j) => { if (!cancelled) { setData(j); setLoading(false) } })
      .catch(() => { if (!cancelled) { setData(null); setLoading(false) } })
    return () => { cancelled = true }
  }, [clubId, period])

  async function submitMetric() {
    if (!clubId || !newValue) return
    await fetch('/api/football/fan-engagement/input', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clubId, metricType: newType, value: Number(newValue), metricDate: newDate, notes: newNotes }),
    })
    setShowAddModal(false); setNewValue(''); setNewNotes('')
    // refetch
    fetch(`/api/football/fan-engagement?clubId=${clubId}&period=${period}`).then((r) => r.json()).then(setData)
  }

  async function submitNps() {
    if (!clubId) return
    await fetch('/api/football/fan-engagement/nps', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clubId, promoters: npsP, passives: npsPa, detractors: npsD, topPositiveThemes: npsThemes.split(',').map((s) => s.trim()).filter(Boolean) }),
    })
    setShowNpsForm(false); setNpsP(0); setNpsPa(0); setNpsD(0); setNpsThemes('')
    fetch(`/api/football/fan-engagement?clubId=${clubId}&period=${period}`).then((r) => r.json()).then(setData)
  }

  async function generateRecs() {
    setAiLoadingRecs(true)
    setAiRecs(null)
    try {
      const res = await fetch('/api/ai/fan-insights', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clubName,
          action: 'recommendations',
          avgAttendance: data?.attendanceSummary.average,
          attendanceTrend: data?.attendanceSummary.trend,
          nps: data?.npsSummary.current,
          npsTrend: data?.npsSummary.trend,
          renewalRate: data?.seasonTickets.current?.renewal_rate,
          sentiment: data?.socialSentiment.overallScore,
        }),
      })
      const j = await res.json()
      if (j.recommendations) setAiRecs(j.recommendations)
    } catch { /* swallow */ }
    setAiLoadingRecs(false)
  }

  async function generateNewsletter() {
    setAiLoadingNews(true)
    setNewsletter(null)
    try {
      const upcoming = fixtures.find((f) => !f.result)?.opponent ?? 'TBC'
      const res = await fetch('/api/ai/fan-insights', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clubName,
          action: 'newsletter-draft',
          attendanceTrend: data?.attendanceSummary.trend,
          upcomingFixture: upcoming,
          recentForm: 'mixed',
        }),
      })
      const j = await res.json()
      if (j.newsletter) setNewsletter(j.newsletter)
    } catch { /* swallow */ }
    setAiLoadingNews(false)
  }

  // ─── Derived metrics ─────────────────────────────────────────────────────
  const att = data?.attendanceSummary
  const nps = data?.npsSummary
  const tickets = data?.seasonTickets
  const social = data?.socialSentiment
  const journey = data?.fanJourney
  const competitors = data?.competitors ?? []

  const capacityPct = att && groundCapacity ? Math.round((att.average / groundCapacity) * 100) : 0
  const npsLab = npsLabel(Number(nps?.current ?? 0))
  const overallSent = social?.overallScore ?? 0

  // Squad-derived "Fan Favourites"
  const topScorer = useMemo(() => [...squad].sort((a, b) => b.goals - a.goals)[0], [squad])
  const topAssister = useMemo(() => [...squad].sort((a, b) => b.assists - a.assists)[0], [squad])
  const playerOfMonth = useMemo(() => [...squad].sort((a, b) => b.lastRating - a.lastRating)[0], [squad])
  const ageBuckets = useMemo(() => {
    const buckets = [{ label: '<20', value: 0 }, { label: '20-24', value: 0 }, { label: '25-29', value: 0 }, { label: '30-34', value: 0 }, { label: '35+', value: 0 }]
    squad.forEach((p) => {
      if (p.age < 20) buckets[0].value++
      else if (p.age < 25) buckets[1].value++
      else if (p.age < 30) buckets[2].value++
      else if (p.age < 35) buckets[3].value++
      else buckets[4].value++
    })
    return buckets
  }, [squad])
  const nationalitySlices = useMemo(() => {
    const counts: Record<string, number> = {}
    squad.forEach((p) => { counts[p.nationality] = (counts[p.nationality] ?? 0) + 1 })
    const palette = [C.blue, C.purple, C.green, C.amber, C.pink, C.cyan, C.red]
    return Object.entries(counts).map(([k, v], i) => ({ label: k, value: v, color: palette[i % palette.length] }))
  }, [squad])

  // Top fan-mentioned squad members (match top_keywords against squad names)
  const fanFavourites = useMemo(() => {
    const counts: Record<string, number> = {}
    ;(social?.history ?? []).forEach((h: any) => {
      ;(h.keywords ?? []).forEach((kw: string) => {
        const lc = kw.toLowerCase()
        squad.forEach((p) => {
          if (lc.includes(p.name.toLowerCase().split(' ')[0]) || p.name.toLowerCase().includes(lc)) {
            counts[p.name] = (counts[p.name] ?? 0) + 1
          }
        })
      })
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [social, squad])

  // Goals scored/conceded last 12 (from played fixtures)
  const last12 = useMemo(() => fixtures.filter((f) => f.result).slice(-12), [fixtures])
  const goalsFor = last12.map((f, i) => {
    const parts = (f.result ?? '').split('-').map(Number)
    return { label: String(i + 1), value: parts[0] || 0 }
  })
  const goalsAgainst = last12.map((f, i) => {
    const parts = (f.result ?? '').split('-').map(Number)
    return { label: String(i + 1), value: parts[1] || 0 }
  })

  // Win/Draw/Loss home vs away
  const wdlSlices = useMemo(() => {
    let w = 0, d = 0, l = 0
    last12.forEach((f) => {
      const parts = (f.result ?? '').split('-').map(Number)
      const isHome = f.venue !== 'Away'
      const our = isHome ? parts[0] : parts[1]
      const them = isHome ? parts[1] : parts[0]
      if (our > them) w++
      else if (our === them) d++
      else l++
    })
    return [
      { label: 'W', value: w, color: C.green },
      { label: 'D', value: d, color: C.amber },
      { label: 'L', value: l, color: C.red },
    ]
  }, [last12])

  // Match day revenue
  const matchRevenue = (att?.average ?? 0) * (avgTicketPrice ?? 22)
  const seasonProjection = matchRevenue * 23

  // Sentiment by day of week
  const sentimentByDay = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const buckets: Record<string, number[]> = {}
    days.forEach((d) => buckets[d] = [])
    ;(social?.history ?? []).forEach((h: any) => {
      const dt = new Date(h.date)
      if (!isNaN(dt.getTime())) buckets[days[dt.getDay()]].push(h.score)
    })
    return days.map((d) => ({
      label: d,
      value: buckets[d].length > 0 ? Math.round(buckets[d].reduce((a, n) => a + n, 0) / buckets[d].length) : 0,
    }))
  }, [social])

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-black flex items-center gap-2" style={{ color: C.text }}>👥 Fan Engagement</h2>
          <p className="text-xs mt-0.5" style={{ color: C.muted }}>Attendance · NPS · Sentiment · Season Tickets</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isDemo && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(245,158,11,0.10)', color: C.amber, border: `1px solid ${C.amber}33` }}>⚡ Live demo data</span>}
          <div className="flex gap-1">
            {(['30d', '90d', 'season'] as Period[]).map((p) => (
              <button key={p} onClick={() => setPeriod(p)} className="text-[10px] px-2 py-1 rounded font-semibold uppercase" style={{
                backgroundColor: period === p ? 'rgba(0,61,165,0.15)' : '#1F2937',
                color: period === p ? C.yellow : C.muted,
                border: `1px solid ${period === p ? 'rgba(0,61,165,0.4)' : C.border}`,
              }}>{p === '30d' ? '30 Days' : p === '90d' ? '90 Days' : 'This Season'}</button>
            ))}
          </div>
          <button onClick={() => setShowAddModal(true)} className="text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#003DA5', color: C.yellow }}>+ Add Data</button>
        </div>
      </div>

      {loading && <div className="text-xs" style={{ color: C.muted }}>Loading dashboard...</div>}

      {/* KPI STRIP */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="rounded-xl p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
          <div className="text-[10px] uppercase tracking-wider" style={{ color: C.muted }}>Avg Attendance</div>
          <div className="text-2xl font-black mt-1" style={{ color: C.text }}>{att?.average ?? 0}</div>
          <div className="text-[10px]" style={{ color: C.muted }}>{capacityPct}% of capacity</div>
          <div className="text-[10px] mt-1" style={{ color: (att?.trend ?? 0) >= 0 ? C.green : C.red }}>{(att?.trend ?? 0) >= 0 ? '↑' : '↓'} {Math.abs(att?.trend ?? 0)}% vs prev</div>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
          <div className="text-[10px] uppercase tracking-wider" style={{ color: C.muted }}>NPS</div>
          <div className="text-2xl font-black mt-1" style={{ color: C.text }}>{nps?.current ?? 0}</div>
          <div className="text-[10px] font-semibold" style={{ color: npsLab.color }}>{npsLab.label}</div>
          <div className="text-[10px] mt-1" style={{ color: (nps?.trend ?? 0) >= 0 ? C.green : C.red }}>{(nps?.trend ?? 0) >= 0 ? '↑' : '↓'} {Math.abs(nps?.trend ?? 0)} pts</div>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
          <div className="text-[10px] uppercase tracking-wider" style={{ color: C.muted }}>Season Ticket Renewal</div>
          <div className="text-2xl font-black mt-1" style={{ color: C.text }}>{tickets?.current?.renewal_rate ?? 0}%</div>
          <div className="text-[10px]" style={{ color: C.muted }}>{tickets?.current?.total_sold ?? 0} / {tickets?.current?.total_capacity ?? 0}</div>
          <div className="text-[10px] mt-1" style={{ color: (tickets?.renewalTrend ?? 0) >= 0 ? C.green : C.red }}>{(tickets?.renewalTrend ?? 0) >= 0 ? '↑' : '↓'} {Math.abs(tickets?.renewalTrend ?? 0)}%</div>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
          <div className="text-[10px] uppercase tracking-wider" style={{ color: C.muted }}>Social Sentiment</div>
          <div className="text-2xl font-black mt-1" style={{ color: sentimentColor(overallSent) }}>+{Math.round(overallSent)}</div>
          <div className="text-[10px]" style={{ color: C.muted }}>−100 ← → +100</div>
          <div className="text-[10px] mt-1" style={{ color: (social?.trend ?? 0) >= 0 ? C.green : C.red }}>{(social?.trend ?? 0) >= 0 ? '↑' : '↓'} {Math.abs(social?.trend ?? 0)} pts</div>
        </div>
      </div>

      <FeatureGate featureKey="fan_hub_advanced" clubTier={clubTier} featureName="Fan Hub Advanced Analytics">
      {/* CHARTS ROW 1 — Attendance trend + Sentiment over time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
          <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: C.muted }}>Attendance Trend</div>
          <LineChart points={(att?.history ?? []).map((h) => h.value)} color={C.blue} />
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
          <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: C.muted }}>Sentiment Over Time</div>
          <LineChart points={(social?.history ?? []).slice(0, 20).reverse().map((h: any) => h.score)} color={C.purple} threshold={0} />
          <div className="flex flex-wrap gap-1 mt-2">
            {(social?.byPlatform ?? []).map((p) => (
              <span key={p.platform} className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${platformColor(p.platform)}22`, color: platformColor(p.platform), border: `1px solid ${platformColor(p.platform)}55` }}>{p.platform} {Math.round(p.score)}</span>
            ))}
          </div>
        </div>
      </div>

      {/* EXTRA CHARTS — Goals trend + WDL donut + Attendance vs perf scatter + Sentiment by day */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl p-3" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
          <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: C.muted }}>Goals For (last 12)</div>
          <BarChart data={goalsFor} color={C.green} />
        </div>
        <div className="rounded-xl p-3" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
          <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: C.muted }}>Goals Against (last 12)</div>
          <BarChart data={goalsAgainst} color={C.red} />
        </div>
        <div className="rounded-xl p-3 flex flex-col items-center" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
          <div className="text-[10px] font-bold uppercase tracking-wider mb-1 self-start" style={{ color: C.muted }}>W/D/L Last 12</div>
          <Donut slices={wdlSlices} />
          <div className="flex gap-2 text-[9px] mt-1">
            <span style={{ color: C.green }}>W {wdlSlices[0].value}</span>
            <span style={{ color: C.amber }}>D {wdlSlices[1].value}</span>
            <span style={{ color: C.red }}>L {wdlSlices[2].value}</span>
          </div>
        </div>
        <div className="rounded-xl p-3" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
          <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: C.muted }}>Sentiment by Day</div>
          <BarChart data={sentimentByDay} color={C.purple} />
        </div>
      </div>

      {/* Attendance vs perf correlation + Social vs results overlay */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
          <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: C.muted }}>Attendance vs Performance</div>
          <ScatterChart points={(att?.history ?? []).slice(0, 12).map((h, i) => ({ x: h.value, y: (last12[i] ? Number((last12[i].result ?? '0-0').split('-')[0]) - Number((last12[i].result ?? '0-0').split('-')[1]) : 0) }))} />
          <div className="text-[9px] mt-1" style={{ color: C.muted }}>X: attendance · Y: goal difference</div>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
          <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: C.muted }}>Social Volume vs Results</div>
          <LineChart points={(social?.history ?? []).slice(0, 20).reverse().map((h: any, i: number) => h.score + (last12[i] ? 5 : 0))} color={C.cyan} />
        </div>
      </div>

      {/* NPS SECTION */}
      <div className="rounded-xl p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold" style={{ color: C.text }}>Net Promoter Score</h3>
          <button onClick={() => setShowNpsForm((s) => !s)} className="text-[10px] px-2 py-1 rounded" style={{ backgroundColor: '#1F2937', color: C.yellow, border: `1px solid ${C.border}` }}>+ Add NPS Survey</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <NPSGauge score={Number(nps?.current ?? 0)} />
          </div>
          <div className="rounded-lg p-3" style={{ backgroundColor: '#0A0B10', border: `1px solid ${C.border}` }}>
            <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: C.muted }}>Breakdown</div>
            {(() => {
              const last = nps?.history?.[0]
              if (!last) return <div className="text-[10px]" style={{ color: C.muted }}>No surveys yet</div>
              const t = last.total_responses || 1
              const rows = [
                { label: 'Promoters', val: last.promoters, pct: Math.round((last.promoters / t) * 100), color: C.green },
                { label: 'Passives', val: last.passives, pct: Math.round((last.passives / t) * 100), color: C.amber },
                { label: 'Detractors', val: last.detractors, pct: Math.round((last.detractors / t) * 100), color: C.red },
              ]
              return (
                <div className="space-y-2">
                  {rows.map((r) => (
                    <div key={r.label}>
                      <div className="flex justify-between text-[10px]"><span style={{ color: C.muted }}>{r.label}</span><span style={{ color: r.color }}>{r.pct}%</span></div>
                      <div className="h-1.5 rounded" style={{ backgroundColor: '#1F2937' }}><div className="h-full rounded" style={{ width: `${r.pct}%`, backgroundColor: r.color }} /></div>
                    </div>
                  ))}
                  <div className="text-[9px] mt-1" style={{ color: C.muted }}>Total: {t}</div>
                </div>
              )
            })()}
          </div>
          <div className="rounded-lg p-3" style={{ backgroundColor: '#0A0B10', border: `1px solid ${C.border}` }}>
            <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: C.muted }}>NPS by match type</div>
            {(() => {
              const types: Record<string, { sum: number; n: number }> = {}
              ;(nps?.history ?? []).forEach((s: any) => {
                const k = s.match_type ?? 'Other'
                types[k] = types[k] ?? { sum: 0, n: 0 }
                types[k].sum += Number(s.nps_score)
                types[k].n += 1
              })
              return Object.entries(types).map(([k, v]) => (
                <div key={k} className="flex justify-between text-[10px] py-0.5">
                  <span style={{ color: C.muted }}>{k}</span>
                  <span style={{ color: C.text, fontWeight: 700 }}>{Math.round(v.sum / v.n)}</span>
                </div>
              ))
            })()}
          </div>
        </div>

        {/* History table */}
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="text-[10px]" style={{ color: C.muted, borderBottom: `1px solid ${C.border}` }}>
              <th className="text-left p-2">Date</th><th className="text-left p-2">Type</th><th className="text-right p-2">Score</th><th className="text-right p-2">Responses</th><th className="text-right p-2">vs Prev</th>
            </tr></thead>
            <tbody>
              {(nps?.history ?? []).slice(0, 4).map((s: any, i: number) => {
                const prev = nps?.history?.[i + 1]
                const delta = prev ? Number(s.nps_score) - Number(prev.nps_score) : 0
                return (
                  <tr key={s.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td className="p-2" style={{ color: C.text }}>{s.survey_date}</td>
                    <td className="p-2" style={{ color: C.muted }}>{s.match_type}</td>
                    <td className="p-2 text-right font-bold" style={{ color: C.text }}>{s.nps_score}</td>
                    <td className="p-2 text-right" style={{ color: C.muted }}>{s.total_responses}</td>
                    <td className="p-2 text-right" style={{ color: delta >= 0 ? C.green : C.red }}>{delta >= 0 ? '↑' : '↓'} {Math.abs(Math.round(delta * 10) / 10)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Themes trend */}
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: C.muted }}>Positive themes</div>
            <div className="flex flex-wrap gap-1">
              {Array.from(new Set((nps?.history ?? []).flatMap((s: any) => s.top_positive_themes ?? []))).slice(0, 8).map((t, i) => (
                <span key={i} className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(34,197,94,0.10)', color: C.green }}>{t as string}</span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: C.muted }}>Negative themes</div>
            <div className="flex flex-wrap gap-1">
              {Array.from(new Set((nps?.history ?? []).flatMap((s: any) => s.top_negative_themes ?? []))).slice(0, 8).map((t, i) => (
                <span key={i} className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.10)', color: C.red }}>{t as string}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Verbatim quotes */}
        {nps?.history?.[0]?.verbatim_comments?.length > 0 && (
          <div className="mt-3">
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: C.muted }}>Verbatim comments</div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {(nps?.history?.[0]?.verbatim_comments ?? []).map((c: string, i: number) => (
                <div key={i} className="text-[10px] italic px-2 py-1 rounded shrink-0" style={{ backgroundColor: '#0A0B10', color: '#D1D5DB', border: `1px solid ${C.border}`, maxWidth: 200 }}>"{c}"</div>
              ))}
            </div>
          </div>
        )}

        {/* Inline NPS form */}
        {showNpsForm && (
          <div className="mt-3 rounded-lg p-3" style={{ backgroundColor: '#0A0B10', border: `1px solid ${C.border}` }}>
            <div className="grid grid-cols-3 gap-2">
              <div><label className="text-[10px]" style={{ color: C.muted }}>Promoters (9-10)</label><input type="number" value={npsP} onChange={(e) => setNpsP(Number(e.target.value))} className="w-full text-xs rounded px-2 py-1" style={{ backgroundColor: '#1F2937', color: C.text, border: `1px solid ${C.border}` }} /></div>
              <div><label className="text-[10px]" style={{ color: C.muted }}>Passives (7-8)</label><input type="number" value={npsPa} onChange={(e) => setNpsPa(Number(e.target.value))} className="w-full text-xs rounded px-2 py-1" style={{ backgroundColor: '#1F2937', color: C.text, border: `1px solid ${C.border}` }} /></div>
              <div><label className="text-[10px]" style={{ color: C.muted }}>Detractors (0-6)</label><input type="number" value={npsD} onChange={(e) => setNpsD(Number(e.target.value))} className="w-full text-xs rounded px-2 py-1" style={{ backgroundColor: '#1F2937', color: C.text, border: `1px solid ${C.border}` }} /></div>
            </div>
            <input value={npsThemes} onChange={(e) => setNpsThemes(e.target.value)} placeholder="Top themes (comma separated)" className="w-full text-xs mt-2 rounded px-2 py-1" style={{ backgroundColor: '#1F2937', color: C.text, border: `1px solid ${C.border}` }} />
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px]" style={{ color: C.muted }}>Live NPS: <span style={{ color: C.text, fontWeight: 700 }}>{npsLive}</span></span>
              <button onClick={submitNps} className="text-[10px] px-2 py-1 rounded" style={{ backgroundColor: '#003DA5', color: C.yellow }}>Save Survey</button>
            </div>
          </div>
        )}
      </div>

      {/* SOCIAL SECTION */}
      <div className="rounded-xl p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
        <h3 className="text-sm font-bold mb-3" style={{ color: C.text }}>Social Sentiment</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {(social?.byPlatform ?? []).map((p) => (
            <div key={p.platform} className="rounded-lg p-3" style={{ backgroundColor: '#0A0B10', border: `1px solid ${platformColor(p.platform)}55` }}>
              <div className="text-[10px] font-bold" style={{ color: platformColor(p.platform) }}>{p.platform}</div>
              <div className="text-lg font-black" style={{ color: C.text }}>+{Math.round(p.score)}</div>
              <div className="text-[9px]" style={{ color: C.muted }}>{p.mentions} mentions</div>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: C.muted }}>Top keywords</div>
          <div className="flex flex-wrap gap-1">
            {Array.from(new Set((social?.history ?? []).flatMap((h: any) => h.keywords ?? []))).slice(0, 16).map((k, i) => (
              <span key={i} className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: '#1F2937', color: C.text, border: `1px solid ${C.border}` }}>{k as string}</span>
            ))}
          </div>
        </div>
      </div>

      {/* SEASON TICKETS SECTION */}
      <div className="rounded-xl p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
        <h3 className="text-sm font-bold mb-3" style={{ color: C.text }}>Season Tickets</h3>

        {/* Renewal funnel — simple horizontal bars */}
        {tickets?.previous && tickets?.current && (
          <div className="mb-3 grid grid-cols-4 gap-2">
            {[
              { label: 'Prev total', value: tickets.previous.total_sold, color: C.muted },
              { label: 'Renewals', value: Math.round(tickets.previous.total_sold * (tickets.current.renewal_rate / 100)), color: C.green },
              { label: 'New', value: tickets.current.new_purchasers, color: C.blue },
              { label: 'Current', value: tickets.current.total_sold, color: C.purple },
            ].map((b, i) => (
              <div key={i} className="text-center rounded-lg p-2" style={{ backgroundColor: '#0A0B10', border: `1px solid ${b.color}55` }}>
                <div className="text-lg font-bold" style={{ color: b.color }}>{b.value}</div>
                <div className="text-[9px]" style={{ color: C.muted }}>{b.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Comparison table */}
        <table className="w-full text-xs">
          <thead><tr className="text-[10px]" style={{ color: C.muted, borderBottom: `1px solid ${C.border}` }}>
            <th className="text-left p-2">Season</th><th className="text-right p-2">Sold</th><th className="text-right p-2">Capacity</th><th className="text-right p-2">Renewal</th><th className="text-right p-2">Revenue</th>
          </tr></thead>
          <tbody>
            {(tickets?.all ?? []).map((s: any) => (
              <tr key={s.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td className="p-2" style={{ color: C.text }}>{s.season}</td>
                <td className="p-2 text-right" style={{ color: C.text }}>{s.total_sold}</td>
                <td className="p-2 text-right" style={{ color: C.muted }}>{Math.round((s.total_sold / s.total_capacity) * 100)}%</td>
                <td className="p-2 text-right" style={{ color: C.text }}>{s.renewal_rate}%</td>
                <td className="p-2 text-right" style={{ color: C.green }}>{fmtNum(Number(s.revenue_total))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {tickets?.current && (
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
            <div className="rounded p-2" style={{ backgroundColor: '#0A0B10', border: `1px solid ${C.border}` }}><div style={{ color: C.muted }}>Avg price</div><div style={{ color: C.text, fontWeight: 700 }}>£{tickets.current.avg_price ?? '—'}</div></div>
            <div className="rounded p-2" style={{ backgroundColor: '#0A0B10', border: `1px solid ${C.border}` }}><div style={{ color: C.muted }}>Local fans</div><div style={{ color: C.text, fontWeight: 700 }}>{tickets.current.geo_local_pct ?? 0}%</div></div>
            <div className="rounded p-2" style={{ backgroundColor: '#0A0B10', border: `1px solid ${C.border}` }}><div style={{ color: C.muted }}>Regional</div><div style={{ color: C.text, fontWeight: 700 }}>{tickets.current.geo_regional_pct ?? 0}%</div></div>
            <div className="rounded p-2" style={{ backgroundColor: '#0A0B10', border: `1px solid ${C.border}` }}><div style={{ color: C.muted }}>Travelling</div><div style={{ color: C.text, fontWeight: 700 }}>{tickets.current.geo_travelling_pct ?? 0}%</div></div>
          </div>
        )}

        {/* Churn warning */}
        {tickets?.current && tickets?.previous && tickets.current.lapsed_purchasers > tickets.previous.lapsed_purchasers && (
          <div className="mt-3 text-[10px] px-2 py-1 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.10)', color: C.red, border: `1px solid ${C.red}55` }}>⚠ Churn rising — {tickets.current.lapsed_purchasers} lapsed (vs {tickets.previous.lapsed_purchasers})</div>
        )}
      </div>

      {/* MATCH DAY REVENUE + FAN JOURNEY FUNNEL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
          <h3 className="text-sm font-bold mb-2" style={{ color: C.text }}>Match Day Revenue</h3>
          <div className="text-2xl font-black" style={{ color: C.green }}>{fmtNum(matchRevenue)}</div>
          <div className="text-[10px]" style={{ color: C.muted }}>{att?.average ?? 0} × £{avgTicketPrice} per match</div>
          <div className="text-xs mt-2" style={{ color: C.text }}>Season projection: <span style={{ color: C.green, fontWeight: 700 }}>{fmtNum(seasonProjection)}</span></div>
          <div className="text-[10px]" style={{ color: C.muted }}>(23 home matches at current pace)</div>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
          <h3 className="text-sm font-bold mb-2" style={{ color: C.text }}>Fan Journey Funnel</h3>
          {journey ? (
            <div className="space-y-2">
              {[
                { l: 'Social followers', v: journey.social_followers, c: C.cyan },
                { l: 'App downloads', v: journey.app_downloads, c: C.purple },
                { l: 'Newsletter subs', v: journey.newsletter_subscribers, c: C.blue },
                { l: 'Match attendees', v: journey.match_attendees, c: C.amber },
                { l: 'Season tickets', v: journey.season_ticket_holders, c: C.green },
              ].map((row, i, arr) => {
                const max = arr[0].v
                const pct = (row.v / max) * 100
                return (
                  <div key={row.l}>
                    <div className="flex justify-between text-[10px]"><span style={{ color: C.muted }}>{row.l}</span><span style={{ color: row.c, fontWeight: 700 }}>{row.v.toLocaleString()}</span></div>
                    <div className="h-2 rounded" style={{ backgroundColor: '#1F2937' }}><div className="h-full rounded" style={{ width: `${pct}%`, backgroundColor: row.c }} /></div>
                  </div>
                )
              })}
            </div>
          ) : <div className="text-[10px]" style={{ color: C.muted }}>No journey data</div>}
        </div>
      </div>

      {/* COMPETITORS */}
      {competitors.length > 0 && (
        <div className="rounded-xl p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
          <h3 className="text-sm font-bold mb-2" style={{ color: C.text }}>Competitor Comparison</h3>
          <table className="w-full text-xs">
            <thead><tr className="text-[10px]" style={{ color: C.muted, borderBottom: `1px solid ${C.border}` }}>
              <th className="text-left p-2">Club</th><th className="text-right p-2">Avg Att</th><th className="text-right p-2">NPS</th><th className="text-right p-2">Sentiment</th><th className="text-right p-2">Season Tkts</th>
            </tr></thead>
            <tbody>
              <tr style={{ borderBottom: `1px solid ${C.border}`, backgroundColor: 'rgba(0,61,165,0.08)' }}>
                <td className="p-2 font-bold" style={{ color: C.yellow }}>{clubName} (You)</td>
                <td className="p-2 text-right" style={{ color: C.text }}>{att?.average ?? 0}</td>
                <td className="p-2 text-right" style={{ color: C.text }}>{nps?.current ?? 0}</td>
                <td className="p-2 text-right" style={{ color: C.text }}>+{Math.round(overallSent)}</td>
                <td className="p-2 text-right" style={{ color: C.text }}>{tickets?.current?.total_sold ?? 0}</td>
              </tr>
              {competitors.map((c) => (
                <tr key={c.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td className="p-2" style={{ color: C.text }}>{c.competitor_name}</td>
                  <td className="p-2 text-right" style={{ color: C.muted }}>{c.avg_attendance}</td>
                  <td className="p-2 text-right" style={{ color: C.muted }}>{c.nps_score}</td>
                  <td className="p-2 text-right" style={{ color: C.muted }}>+{c.social_sentiment}</td>
                  <td className="p-2 text-right" style={{ color: C.muted }}>{c.season_ticket_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* FAN FAVOURITES (squad-derived) */}
      <div className="rounded-xl p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
        <h3 className="text-sm font-bold mb-3" style={{ color: C.text }}>Fan Favourites</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          {topScorer && (
            <div className="rounded-lg p-3" style={{ backgroundColor: '#0A0B10', border: `1px solid ${C.green}55` }}>
              <div className="text-[9px] uppercase tracking-wider" style={{ color: C.muted }}>Top Scorer</div>
              <div className="text-sm font-bold mt-0.5" style={{ color: C.text }}>{topScorer.name}</div>
              <div className="text-[10px]" style={{ color: C.green }}>{topScorer.goals} goals</div>
            </div>
          )}
          {topAssister && (
            <div className="rounded-lg p-3" style={{ backgroundColor: '#0A0B10', border: `1px solid ${C.blue}55` }}>
              <div className="text-[9px] uppercase tracking-wider" style={{ color: C.muted }}>Top Assister</div>
              <div className="text-sm font-bold mt-0.5" style={{ color: C.text }}>{topAssister.name}</div>
              <div className="text-[10px]" style={{ color: C.blue }}>{topAssister.assists} assists</div>
            </div>
          )}
          {playerOfMonth && (
            <div className="rounded-lg p-3" style={{ backgroundColor: '#0A0B10', border: `1px solid ${C.yellow}55` }}>
              <div className="text-[9px] uppercase tracking-wider" style={{ color: C.muted }}>Player of the Month</div>
              <div className="text-sm font-bold mt-0.5" style={{ color: C.text }}>{playerOfMonth.name}</div>
              <div className="text-[10px]" style={{ color: C.yellow }}>{playerOfMonth.lastRating} rating</div>
            </div>
          )}
          {playerOfMonth && (
            <div className="rounded-lg p-3" style={{ backgroundColor: '#0A0B10', border: `1px solid ${C.purple}55` }}>
              <div className="text-[9px] uppercase tracking-wider" style={{ color: C.muted }}>Most Improved</div>
              <div className="text-sm font-bold mt-0.5" style={{ color: C.text }}>{playerOfMonth.name}</div>
              <div className="text-[10px]" style={{ color: C.purple }}>+0.6 last 3 matches</div>
            </div>
          )}
        </div>
        {fanFavourites.length > 0 && (
          <div className="mb-3">
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: C.muted }}>Top mentioned by fans</div>
            <div className="flex flex-wrap gap-1">
              {fanFavourites.map(([name, count]) => (
                <span key={name} className="text-[10px] px-2 py-1 rounded" style={{ backgroundColor: 'rgba(139,92,246,0.10)', color: C.purple, border: `1px solid ${C.purple}55` }}>{name} ({count})</span>
              ))}
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: C.muted }}>Squad age distribution</div>
            <BarChart data={ageBuckets} color={C.cyan} />
          </div>
          <div className="flex flex-col items-center">
            <div className="text-[10px] uppercase tracking-wider mb-1 self-start" style={{ color: C.muted }}>Nationality breakdown</div>
            <Donut slices={nationalitySlices} />
          </div>
        </div>
      </div>

      {/* AI INSIGHTS */}
      <div className="rounded-xl p-4" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
        <h3 className="text-sm font-bold mb-3" style={{ color: C.text }}>🧠 AI Fan Insights</h3>
        <div className="flex gap-2 flex-wrap">
          <button onClick={generateRecs} disabled={aiLoadingRecs} className="text-xs px-3 py-2 rounded-lg font-semibold" style={{ backgroundColor: C.purple, color: '#fff', opacity: aiLoadingRecs ? 0.6 : 1 }}>{aiLoadingRecs ? 'Generating...' : 'Generate Recommendations'}</button>
          <button onClick={generateNewsletter} disabled={aiLoadingNews} className="text-xs px-3 py-2 rounded-lg font-semibold" style={{ backgroundColor: '#1F2937', color: C.text, border: `1px solid ${C.border}`, opacity: aiLoadingNews ? 0.6 : 1 }}>{aiLoadingNews ? 'Drafting...' : 'Draft Fan Newsletter'}</button>
        </div>

        {aiRecs && aiRecs.length > 0 && (
          <div className="mt-3 space-y-2">
            {aiRecs.map((r, i) => (
              <div key={i} className="rounded-lg p-3" style={{ backgroundColor: '#0A0B10', border: `1px solid ${C.border}` }}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="text-sm font-bold" style={{ color: C.text }}>{i + 1}. {r.title}</div>
                  <div className="flex gap-1 shrink-0">
                    <span className="text-[9px] px-1.5 py-0.5 rounded uppercase" style={{ backgroundColor: r.difficulty === 'Easy' ? `${C.green}22` : r.difficulty === 'Medium' ? `${C.amber}22` : `${C.red}22`, color: r.difficulty === 'Easy' ? C.green : r.difficulty === 'Medium' ? C.amber : C.red }}>{r.difficulty}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded uppercase" style={{ backgroundColor: '#1F2937', color: C.muted }}>{r.timeline}</span>
                  </div>
                </div>
                <p className="text-xs" style={{ color: '#D1D5DB' }}>{r.action}</p>
                <div className="text-[10px] mt-1" style={{ color: C.green }}>📈 Expected: {r.expectedImpact}</div>
              </div>
            ))}
          </div>
        )}

        {newsletter && (
          <div className="mt-3 rounded-lg p-3" style={{ backgroundColor: '#0A0B10', border: `1px solid ${C.border}` }}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] uppercase tracking-wider" style={{ color: C.muted }}>Newsletter draft</div>
              <button onClick={() => navigator.clipboard?.writeText(newsletter)} className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: '#1F2937', color: C.text }}>Copy</button>
            </div>
            <pre className="text-xs whitespace-pre-wrap font-sans" style={{ color: '#D1D5DB' }}>{newsletter}</pre>
          </div>
        )}
      </div>

      </FeatureGate>

      {/* ADD DATA MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={() => setShowAddModal(false)}>
          <div className="rounded-xl p-5 w-full max-w-md" style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }} onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold mb-3" style={{ color: C.text }}>Add Fan Metric</h3>
            <div className="space-y-2">
              <select value={newType} onChange={(e) => setNewType(e.target.value)} className="w-full text-xs rounded px-2 py-2" style={{ backgroundColor: '#0A0B10', color: C.text, border: `1px solid ${C.border}` }}>
                <option value="attendance">Attendance</option>
                <option value="nps">NPS</option>
                <option value="season_ticket">Season Ticket</option>
                <option value="social_sentiment">Social Sentiment</option>
                <option value="merchandise_sales">Merchandise Sales</option>
                <option value="app_downloads">App Downloads</option>
                <option value="newsletter_opens">Newsletter Opens</option>
              </select>
              <input type="number" value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="Value" className="w-full text-xs rounded px-2 py-2" style={{ backgroundColor: '#0A0B10', color: C.text, border: `1px solid ${C.border}` }} />
              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full text-xs rounded px-2 py-2" style={{ backgroundColor: '#0A0B10', color: C.text, border: `1px solid ${C.border}` }} />
              <textarea value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="Notes (optional)" className="w-full text-xs rounded px-2 py-2" style={{ backgroundColor: '#0A0B10', color: C.text, border: `1px solid ${C.border}` }} />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowAddModal(false)} className="text-xs px-3 py-1.5 rounded" style={{ backgroundColor: '#1F2937', color: C.text }}>Cancel</button>
                <button onClick={submitMetric} className="text-xs px-3 py-1.5 rounded" style={{ backgroundColor: '#003DA5', color: C.yellow }}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
