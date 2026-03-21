'use client'

import { useState } from 'react'
import { LayoutGrid, BarChart2, TrendingUp, Activity, PieChart, Crosshair } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ChartType = 'table' | 'bar' | 'line' | 'area' | 'pie' | 'scatter'

export interface ChartPoint { label: string; value: number }

const COLORS = ['#0D9488', '#6C3FC5', '#22C55E', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899']

// ─── Utility ─────────────────────────────────────────────────────────────────

export function parseNum(s: string): number {
  const c = s.replace(/[£,\s]/g, '')
  if (c.endsWith('M'))  return parseFloat(c) * 1_000_000
  if (c.endsWith('k'))  return parseFloat(c) * 1_000
  if (c.endsWith('%'))  return parseFloat(c)
  if (c.endsWith('h'))  return parseFloat(c)
  if (c.endsWith('d'))  return parseFloat(c)
  if (c.endsWith('×'))  return parseFloat(c)
  return parseFloat(c) || 0
}

function fmtShort(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}k`
  if (n % 1 !== 0)    return n.toFixed(1)
  return String(Math.round(n))
}

function truncate(s: string, max = 14): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}

// ─── Toolbar ─────────────────────────────────────────────────────────────────

const TOOLBAR_BUTTONS: { type: ChartType; Icon: React.ElementType; title: string }[] = [
  { type: 'table',   Icon: LayoutGrid, title: 'Cards'       },
  { type: 'bar',     Icon: BarChart2,  title: 'Bar Chart'   },
  { type: 'line',    Icon: TrendingUp, title: 'Line Chart'  },
  { type: 'area',    Icon: Activity,   title: 'Area Chart'  },
  { type: 'pie',     Icon: PieChart,   title: 'Pie Chart'   },
  { type: 'scatter', Icon: Crosshair,  title: 'Scatter Plot'},
]

export function ChartToolbar({ current, onChange }: { current: ChartType; onChange: (t: ChartType) => void }) {
  return (
    <div className="flex items-center gap-1 self-start rounded-lg px-2 py-1"
      style={{ backgroundColor: '#07080F', border: '1px solid #1F2937' }}>
      <span className="pr-1 text-xs font-semibold uppercase tracking-widest" style={{ color: '#6B7280' }}>
        View
      </span>
      {TOOLBAR_BUTTONS.map(({ type, Icon, title }) => {
        const active = current === type
        return (
          <button key={type} onClick={() => onChange(type)} title={title}
            className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
            style={{ backgroundColor: active ? '#1F2937' : 'transparent', color: active ? '#0D9488' : '#4B5563' }}>
            <Icon size={13} strokeWidth={1.75} />
          </button>
        )
      })}
    </div>
  )
}

// ─── SVG helpers ─────────────────────────────────────────────────────────────

const W = 560, H = 196
const PL = 10, PR = 10, PT = 28, PB = 44
const CW = W - PL - PR   // 540
const CH = H - PT - PB   // 124

function GridLines({ max }: { max: number }) {
  return (
    <>
      {[0.25, 0.5, 0.75, 1].map((f) => {
        const y = PT + CH - f * CH
        return (
          <g key={f}>
            <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#1F2937" strokeWidth={1} strokeDasharray="3,4" />
            <text x={PL - 2} y={y + 3} textAnchor="end" fontSize={8} fill="#4B5563">{fmtShort(max * f)}</text>
          </g>
        )
      })}
    </>
  )
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────

function SvgBar({ points }: { points: ChartPoint[] }) {
  const max = Math.max(...points.map(p => p.value), 1)
  const N = points.length
  const gap = CW / N
  const bw = Math.min(gap * 0.6, 72)
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
      <GridLines max={max} />
      {/* x-axis */}
      <line x1={PL} y1={PT + CH} x2={W - PR} y2={PT + CH} stroke="#1F2937" strokeWidth={1} />
      {points.map((p, i) => {
        const x  = PL + gap * i + gap / 2
        const bh = (p.value / max) * CH
        const by = PT + CH - bh
        const c  = COLORS[i % COLORS.length]
        return (
          <g key={p.label}>
            <rect x={x - bw / 2} y={by} width={bw} height={bh} fill={c} fillOpacity={0.85} rx={3}
              style={{ transition: 'height 0.3s ease, y 0.3s ease' }} />
            <text x={x} y={by - 4} textAnchor="middle" fontSize={9} fill="#F9FAFB" fontWeight={600}>
              {fmtShort(p.value)}
            </text>
            <text x={x} y={H - PB + 14} textAnchor="middle" fontSize={8} fill="#9CA3AF">
              {truncate(p.label, 16)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── Line Chart ───────────────────────────────────────────────────────────────

function SvgLine({ points, filled = false }: { points: ChartPoint[]; filled?: boolean }) {
  const max = Math.max(...points.map(p => p.value), 1)
  const N = points.length
  const pts = points.map((p, i) => ({
    x: N === 1 ? PL + CW / 2 : PL + (CW / (N - 1)) * i,
    y: PT + CH - (p.value / max) * CH,
    ...p,
  }))
  const linePts = pts.map(p => `${p.x},${p.y}`).join(' ')
  const c = COLORS[0]
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
      <GridLines max={max} />
      <line x1={PL} y1={PT + CH} x2={W - PR} y2={PT + CH} stroke="#1F2937" strokeWidth={1} />
      {filled && (
        <polygon
          points={`${pts[0].x},${PT + CH} ${linePts} ${pts[pts.length - 1].x},${PT + CH}`}
          fill={c} fillOpacity={0.12} />
      )}
      <polyline points={linePts} fill="none" stroke={c} strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p) => (
        <g key={p.label}>
          <circle cx={p.x} cy={p.y} r={4} fill={c} />
          <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize={9} fill="#F9FAFB" fontWeight={600}>
            {fmtShort(p.value)}
          </text>
          <text x={p.x} y={H - PB + 14} textAnchor="middle" fontSize={8} fill="#9CA3AF">
            {truncate(p.label, 14)}
          </text>
        </g>
      ))}
    </svg>
  )
}

// ─── Pie / Donut Chart ────────────────────────────────────────────────────────

function SvgPie({ points }: { points: ChartPoint[] }) {
  const total = points.reduce((s, p) => s + p.value, 0) || 1
  const R = 72, cx = W * 0.38, cy = H / 2
  let cumAngle = -Math.PI / 2
  const slices = points.map((p, i) => {
    const angle    = (p.value / total) * 2 * Math.PI
    const start    = cumAngle
    const end      = cumAngle + angle
    cumAngle       = end
    const large    = angle > Math.PI ? 1 : 0
    const x1       = cx + R * Math.cos(start)
    const y1       = cy + R * Math.sin(start)
    const x2       = cx + R * Math.cos(end)
    const y2       = cy + R * Math.sin(end)
    const midAngle = (start + end) / 2
    const lx       = cx + (R * 0.65) * Math.cos(midAngle)
    const ly       = cy + (R * 0.65) * Math.sin(midAngle)
    const pct      = Math.round((p.value / total) * 100)
    const color    = COLORS[i % COLORS.length]
    const path     = angle > 0.01
      ? `M ${cx} ${cy} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${R} ${R} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`
      : ''
    return { ...p, path, lx, ly, pct, color, angle }
  })

  const legendX = cx + R + 20
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
      {/* Track */}
      <circle cx={cx} cy={cy} r={R} fill="#0D111A" />
      {slices.map((s) => s.path && (
        <path key={s.label} d={s.path} fill={s.color} fillOpacity={0.85} stroke="#07080F" strokeWidth={1} />
      ))}
      {/* Centre hole */}
      <circle cx={cx} cy={cy} r={R * 0.45} fill="#07080F" />
      {/* Pct labels inside if slice is big enough */}
      {slices.map((s) => s.pct >= 8 && (
        <text key={s.label + 'l'} x={s.lx} y={s.ly + 3} textAnchor="middle" fontSize={9} fill="#F9FAFB" fontWeight={700}>
          {s.pct}%
        </text>
      ))}
      {/* Legend */}
      {slices.map((s, i) => {
        const ly = H / 2 - ((slices.length - 1) * 18) / 2 + i * 18
        return (
          <g key={s.label + 'leg'}>
            <rect x={legendX} y={ly - 5} width={8} height={8} rx={2} fill={s.color} />
            <text x={legendX + 12} y={ly + 3} fontSize={9} fill="#9CA3AF">
              {truncate(s.label, 20)} — {fmtShort(s.value)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── Scatter Plot ─────────────────────────────────────────────────────────────

function SvgScatter({ points }: { points: ChartPoint[] }) {
  const max = Math.max(...points.map(p => p.value), 1)
  const N = points.length
  const gap = CW / N
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
      <GridLines max={max} />
      <line x1={PL} y1={PT + CH} x2={W - PR} y2={PT + CH} stroke="#1F2937" strokeWidth={1} />
      {points.map((p, i) => {
        const x = PL + gap * i + gap / 2
        const y = PT + CH - (p.value / max) * CH
        const c = COLORS[i % COLORS.length]
        return (
          <g key={p.label}>
            <circle cx={x} cy={y} r={7} fill={c} fillOpacity={0.8} />
            <circle cx={x} cy={y} r={7} fill="none" stroke={c} strokeWidth={1.5} opacity={0.4} />
            <text x={x} y={y - 12} textAnchor="middle" fontSize={9} fill="#F9FAFB" fontWeight={600}>
              {fmtShort(p.value)}
            </text>
            <text x={x} y={H - PB + 14} textAnchor="middle" fontSize={8} fill="#9CA3AF">
              {truncate(p.label, 14)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── Chart renderer ───────────────────────────────────────────────────────────

function SimpleChart({ type, points }: { type: Exclude<ChartType, 'table'>; points: ChartPoint[] }) {
  switch (type) {
    case 'bar':     return <SvgBar     points={points} />
    case 'line':    return <SvgLine    points={points} />
    case 'area':    return <SvgLine    points={points} filled />
    case 'pie':     return <SvgPie     points={points} />
    case 'scatter': return <SvgScatter points={points} />
  }
}

// ─── Chart Section wrapper ────────────────────────────────────────────────────

const FADE = `@keyframes _cu_fade{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}`

export function ChartSection({
  points,
  children,
}: {
  points: ChartPoint[]
  children: React.ReactNode
}) {
  const [chart, setChart] = useState<ChartType>('table')
  return (
    <div className="flex flex-col gap-3">
      <ChartToolbar current={chart} onChange={setChart} />
      <style>{FADE}</style>
      <div key={chart} style={{ animation: '_cu_fade 0.22s ease forwards' }}>
        {chart === 'table'
          ? children
          : (
            <div className="overflow-hidden rounded-xl p-4"
              style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <SimpleChart type={chart} points={points} />
            </div>
          )
        }
      </div>
    </div>
  )
}

// ─── DfE multi-metric chart section ──────────────────────────────────────────
// Exported separately — used in src/app/dfe/page.tsx

type Month = 'sept' | 'oct' | 'nov' | 'dec' | 'jan'
const DFE_MONTHS: Month[] = ['sept', 'oct', 'nov', 'dec', 'jan']
const DFE_LABELS: Record<Month, string> = { sept: 'Sept', oct: 'Oct', nov: 'Nov', dec: 'Dec', jan: 'Jan' }

export interface DfeMetric {
  label: string
  data: Record<Month, number>
  good: 'up' | 'down'
}

// Normalize a metric's values to [0,1] across all months
function normSeries(metric: DfeMetric): number[] {
  const vals = DFE_MONTHS.map(m => metric.data[m])
  const mn = Math.min(...vals), mx = Math.max(...vals), rng = mx - mn || 1
  return vals.map(v => (v - mn) / rng)
}

const DH = 220  // taller for multi-metric charts
const DCH = DH - PT - PB

function DfeBarChart({ metrics, month }: { metrics: DfeMetric[]; month: Month }) {
  const vals = metrics.map(m => m.data[month])
  const max = Math.max(...vals, 1)
  const N = metrics.length
  const gap = CW / N
  const bw = Math.min(gap * 0.6, 72)
  return (
    <svg width="100%" height={DH} viewBox={`0 0 ${W} ${DH}`}>
      {[0.25, 0.5, 0.75, 1].map(f => (
        <line key={f} x1={PL} y1={PT + DCH - f * DCH} x2={W - PR} y2={PT + DCH - f * DCH}
          stroke="#1F2937" strokeWidth={1} strokeDasharray="3,4" />
      ))}
      <line x1={PL} y1={PT + DCH} x2={W - PR} y2={PT + DCH} stroke="#1F2937" strokeWidth={1} />
      {metrics.map((m, i) => {
        const x = PL + gap * i + gap / 2
        const bh = (vals[i] / max) * DCH
        const by = PT + DCH - bh
        const c = COLORS[i % COLORS.length]
        return (
          <g key={m.label}>
            <rect x={x - bw / 2} y={by} width={bw} height={bh} fill={c} fillOpacity={0.85} rx={3} />
            <text x={x} y={by - 4} textAnchor="middle" fontSize={9} fill="#F9FAFB" fontWeight={600}>
              {fmtShort(vals[i])}
            </text>
            <text x={x} y={DH - PB + 14} textAnchor="middle" fontSize={8} fill="#9CA3AF">
              {truncate(m.label, 16)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function DfeMultiLine({ metrics, filled = false }: { metrics: DfeMetric[]; filled?: boolean }) {
  const N = DFE_MONTHS.length
  return (
    <svg width="100%" height={DH} viewBox={`0 0 ${W} ${DH}`}>
      {[0, 0.25, 0.5, 0.75, 1].map(f => (
        <line key={f} x1={PL} y1={PT + DCH - f * DCH} x2={W - PR} y2={PT + DCH - f * DCH}
          stroke="#1F2937" strokeWidth={1} strokeDasharray="3,4" />
      ))}
      {/* x labels */}
      {DFE_MONTHS.map((m, i) => {
        const x = PL + (CW / (N - 1)) * i
        return <text key={m} x={x} y={DH - PB + 14} textAnchor="middle" fontSize={9} fill="#9CA3AF">{DFE_LABELS[m]}</text>
      })}
      {metrics.map((metric, mi) => {
        const norm = normSeries(metric)
        const pts = norm.map((v, i) => ({
          x: PL + (CW / (N - 1)) * i,
          y: PT + DCH - v * DCH,
        }))
        const linePts = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
        const c = COLORS[mi % COLORS.length]
        return (
          <g key={metric.label}>
            {filled && (
              <polygon
                points={`${pts[0].x},${PT + DCH} ${linePts} ${pts[N - 1].x},${PT + DCH}`}
                fill={c} fillOpacity={0.08} />
            )}
            <polyline points={linePts} fill="none" stroke={c} strokeWidth={1.75}
              strokeLinecap="round" strokeLinejoin="round" />
            {pts.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={3} fill={c} />
            ))}
            {/* Label at last point */}
            <text x={pts[N - 1].x + 4} y={pts[N - 1].y + 3} fontSize={8} fill={c}>
              {truncate(metric.label.split(' ')[0], 10)}
            </text>
          </g>
        )
      })}
      {/* Y-axis label */}
      <text x={PL} y={PT - 8} fontSize={8} fill="#4B5563">Normalised (0–100%)</text>
    </svg>
  )
}

function DfePieChart({ metrics, month }: { metrics: DfeMetric[]; month: Month }) {
  const vals = metrics.map(m => m.data[month])
  const points: ChartPoint[] = metrics.map((m, i) => ({ label: m.label, value: vals[i] }))
  return <SvgPie points={points} />
}

function DfeScatterChart({ metrics }: { metrics: DfeMetric[] }) {
  const N = DFE_MONTHS.length
  return (
    <svg width="100%" height={DH} viewBox={`0 0 ${W} ${DH}`}>
      {[0, 0.25, 0.5, 0.75, 1].map(f => (
        <line key={f} x1={PL} y1={PT + DCH - f * DCH} x2={W - PR} y2={PT + DCH - f * DCH}
          stroke="#1F2937" strokeWidth={1} strokeDasharray="3,4" />
      ))}
      {DFE_MONTHS.map((m, i) => {
        const x = PL + (CW / (N - 1)) * i
        return <text key={m} x={x} y={DH - PB + 14} textAnchor="middle" fontSize={9} fill="#9CA3AF">{DFE_LABELS[m]}</text>
      })}
      {metrics.map((metric, mi) => {
        const norm = normSeries(metric)
        const c = COLORS[mi % COLORS.length]
        return norm.map((v, i) => {
          const x = PL + (CW / (N - 1)) * i
          const y = PT + DCH - v * DCH
          return (
            <g key={`${mi}-${i}`}>
              <circle cx={x} cy={y} r={5} fill={c} fillOpacity={0.8} />
              <circle cx={x} cy={y} r={8} fill="none" stroke={c} strokeWidth={0.75} opacity={0.3} />
            </g>
          )
        })
      })}
      {/* Legend */}
      {metrics.map((m, mi) => (
        <g key={m.label + 'leg'}>
          <circle cx={PL + 6} cy={DH - PB + 28 + mi * 14} r={4} fill={COLORS[mi % COLORS.length]} />
          <text x={PL + 14} y={DH - PB + 32 + mi * 14} fontSize={8} fill="#9CA3AF">{truncate(m.label, 30)}</text>
        </g>
      ))}
    </svg>
  )
}

function DfeChart({ type, metrics, month }: {
  type: Exclude<ChartType, 'table'>
  metrics: DfeMetric[]
  month: Month
}) {
  switch (type) {
    case 'bar':     return <DfeBarChart    metrics={metrics} month={month} />
    case 'line':    return <DfeMultiLine   metrics={metrics} />
    case 'area':    return <DfeMultiLine   metrics={metrics} filled />
    case 'pie':     return <DfePieChart    metrics={metrics} month={month} />
    case 'scatter': return <DfeScatterChart metrics={metrics} />
  }
}

export function DfeChartSection({
  metrics,
  month,
  children,
}: {
  metrics: DfeMetric[]
  month: Month
  children: React.ReactNode
}) {
  const [chart, setChart] = useState<ChartType>('table')
  return (
    <div className="flex flex-col gap-3">
      <ChartToolbar current={chart} onChange={setChart} />
      <style>{FADE}</style>
      <div key={chart} style={{ animation: '_cu_fade 0.22s ease forwards' }}>
        {chart === 'table'
          ? children
          : (
            <div className="overflow-hidden rounded-xl p-4"
              style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
              <DfeChart type={chart} metrics={metrics} month={month} />
            </div>
          )
        }
      </div>
    </div>
  )
}
