'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, BarChart2, PieChart } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// ─── Sparkline ────────────────────────────────────────────────────────────────

const UP_DATA   = [28, 34, 30, 40, 36, 46, 42, 52, 56, 64]
const DOWN_DATA = [64, 58, 62, 52, 56, 48, 54, 44, 40, 34]

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const W = 100, H = 44
  const min = Math.min(...data), max = Math.max(...data)
  const rng = max - min || 1
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * W,
    H - 4 - ((v - min) / rng) * (H - 12),
  ] as [number, number])
  const linePts = pts.map(([x, y]) => `${x},${y}`).join(' ')
  const areaPts = `0,${H} ${linePts} ${W},${H}`
  const [lx, ly] = pts[pts.length - 1]
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <polygon points={areaPts} fill={color} fillOpacity="0.1" />
      <polyline points={linePts} fill="none" stroke={color} strokeWidth="1.75"
        strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="2.5" fill={color} />
    </svg>
  )
}

// ─── Pie chart ────────────────────────────────────────────────────────────────

function PieDonut({ value, color }: { value: string; color: string }) {
  // Extract a numeric ratio (0–1) from the value string, default to 0.6
  const num = parseFloat(value.replace(/[^0-9.]/g, ''))
  const pct = isNaN(num) ? 0.6 : Math.min(num, 100) / 100
  const R = 18, cx = 22, cy = 22, stroke = 7
  const circ = 2 * Math.PI * R
  const dash = pct * circ
  const angle = pct * 360 - 90 // start from top
  const rad = (angle * Math.PI) / 180
  const ex = cx + R * Math.cos(rad)
  const ey = cy + R * Math.sin(rad)
  const large = pct > 0.5 ? 1 : 0
  // Arc path for filled segment
  const arc = `M ${cx} ${cy - R} A ${R} ${R} 0 ${large} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`

  return (
    <div className="flex items-center justify-center gap-4" style={{ height: 44 }}>
      <svg width={44} height={44} viewBox="0 0 44 44">
        {/* Track */}
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#1F2937" strokeWidth={stroke} />
        {/* Value segment */}
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`} />
      </svg>
      <div className="flex flex-col">
        <span className="text-lg font-bold" style={{ color: '#F9FAFB' }}>{value}</span>
        <span className="text-xs" style={{ color: '#9CA3AF' }}>{Math.round(pct * 100)}%</span>
      </div>
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

type View = 'number' | 'chart' | 'pie'

export function StatCard({
  label, value, trend, trendDir, trendGood, icon: Icon, sub,
}: {
  label: string; value: string; trend: string
  trendDir: 'up' | 'down'; trendGood: boolean
  icon: LucideIcon; sub: string
}) {
  const [view, setView] = useState<View>('number')
  const TIcon = trendDir === 'up' ? TrendingUp : TrendingDown
  const tc = trendGood ? '#22C55E' : '#EF4444'
  const sparkData = trendDir === 'up' ? UP_DATA : DOWN_DATA

  function toggleBtn(v: View, Icon: React.ElementType, title: string) {
    const active = view === v
    return (
      <button
        onClick={() => setView(active ? 'number' : v)}
        className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
        style={{ backgroundColor: active ? '#1F2937' : 'transparent', color: active ? '#0D9488' : '#9CA3AF' }}
        title={title}
      >
        <Icon size={14} strokeWidth={1.75} />
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl p-5"
      style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium" style={{ color: '#9CA3AF' }}>{label}</p>
        <div className="flex items-center gap-1">
          {toggleBtn('chart', BarChart2, 'Sparkline')}
          {toggleBtn('pie',   PieChart,  'Pie chart')}
          <div className="ml-1 flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ backgroundColor: '#07080F' }}>
            <Icon size={18} strokeWidth={1.75} style={{ color: '#0D9488' }} />
          </div>
        </div>
      </div>

      {view === 'chart' ? (
        <div style={{ height: 44 }}><Sparkline data={sparkData} color={tc} /></div>
      ) : view === 'pie' ? (
        <PieDonut value={value} color={tc} />
      ) : (
        <p className="text-3xl font-bold tracking-tight" style={{ color: '#F9FAFB' }}>{value}</p>
      )}

      <div className="flex items-center gap-1.5">
        <TIcon size={13} style={{ color: tc }} />
        <span className="text-xs font-medium" style={{ color: tc }}>{trend}</span>
        <span className="text-xs" style={{ color: '#9CA3AF' }}>{sub}</span>
      </div>
    </div>
  )
}

// ─── Quick Actions ─────────────────────────────────────────────────────────────

export function QuickActions({ items }: { items: { label: string; icon: LucideIcon; onClick?: () => void }[] }) {
  return (
    <div className="flex flex-wrap gap-3 rounded-xl p-4"
      style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <p className="w-full text-xs font-semibold uppercase tracking-widest"
        style={{ color: '#9CA3AF' }}>Quick Actions</p>
      {items.map(({ label, icon: Icon, onClick }) => (
        <button
          key={label}
          onClick={onClick}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          style={{ backgroundColor: '#0D9488', color: '#F9FAFB' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0F766E' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0D9488' }}
        >
          <Icon size={15} strokeWidth={2} />
          {label}
        </button>
      ))}
    </div>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────

const BADGE: Record<string, { color: string; bg: string }> = {
  complete:    { color: '#22C55E', bg: 'rgba(34,197,94,0.12)'   },
  active:      { color: '#0D9488', bg: 'rgba(13,148,136,0.12)'  },
  onboarding:  { color: '#0D9488', bg: 'rgba(13,148,136,0.12)'  },
  running:     { color: '#0D9488', bg: 'rgba(13,148,136,0.12)'  },
  enabled:     { color: '#22C55E', bg: 'rgba(34,197,94,0.12)'   },
  paid:        { color: '#22C55E', bg: 'rgba(34,197,94,0.12)'   },
  resolved:    { color: '#22C55E', bg: 'rgba(34,197,94,0.12)'   },
  closed:      { color: '#22C55E', bg: 'rgba(34,197,94,0.12)'   },
  converted:   { color: '#22C55E', bg: 'rgba(34,197,94,0.12)'   },
  delivered:   { color: '#22C55E', bg: 'rgba(34,197,94,0.12)'   },
  provisioned: { color: '#22C55E', bg: 'rgba(34,197,94,0.12)'   },
  published:   { color: '#22C55E', bg: 'rgba(34,197,94,0.12)'   },
  green:       { color: '#22C55E', bg: 'rgba(34,197,94,0.12)'   },
  pending:     { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
  proposal:    { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
  negotiation: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
  unpaid:      { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
  open:        { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
  scheduled:   { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
  'in transit':{ color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
  amber:       { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
  'at risk':   { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
  'in review': { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
  overdue:     { color: '#EF4444', bg: 'rgba(239,68,68,0.12)'   },
  red:         { color: '#EF4444', bg: 'rgba(239,68,68,0.12)'   },
  critical:    { color: '#EF4444', bg: 'rgba(239,68,68,0.12)'   },
  error:       { color: '#EF4444', bg: 'rgba(239,68,68,0.12)'   },
  lost:        { color: '#EF4444', bg: 'rgba(239,68,68,0.12)'   },
  high:        { color: '#EF4444', bg: 'rgba(239,68,68,0.12)'   },
  ending:      { color: '#EF4444', bg: 'rgba(239,68,68,0.12)'   },
  medium:      { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
  low:         { color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)' },
  draft:       { color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)' },
  disabled:    { color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)' },
  discovery:   { color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)' },
  inactive:    { color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)' },
}

export function Badge({ status }: { status: string }) {
  const s = BADGE[status.toLowerCase()] ?? { color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)' }
  return (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold capitalize"
      style={{ color: s.color, backgroundColor: s.bg }}>
      {status}
    </span>
  )
}

// ─── Section Card ─────────────────────────────────────────────────────────────

export function SectionCard({ title, action, children }: {
  title: string; action?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col rounded-xl"
      style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}>
      <div className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid #1F2937' }}>
        <p className="text-sm font-semibold" style={{ color: '#F9FAFB' }}>{title}</p>
        {action && (
          typeof action === 'string'
            ? <span className="cursor-pointer text-xs font-medium" style={{ color: '#0D9488' }}>{action} →</span>
            : <>{action}</>
        )}
      </div>
      {children}
    </div>
  )
}

// ─── Table ────────────────────────────────────────────────────────────────────

export function Table({ cols, rows }: { cols: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid #1F2937' }}>
            {cols.map((c) => (
              <th key={c} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                style={{ color: '#9CA3AF' }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: i < rows.length - 1 ? '1px solid #1F2937' : undefined }}>
              {row.map((cell, j) => (
                <td key={j} className="px-5 py-3 whitespace-nowrap"
                  style={{ color: j === 0 ? '#F9FAFB' : '#9CA3AF' }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Panel Item ───────────────────────────────────────────────────────────────

export function PanelItem({ title, sub, badge, extra }: {
  title: string; sub: string; badge?: string; extra?: string
}) {
  return (
    <div className="flex items-start gap-3 px-5 py-3"
      style={{ borderBottom: '1px solid #1F2937' }}>
      <div className="flex flex-1 flex-col gap-0.5 min-w-0">
        <p className="truncate text-sm font-medium" style={{ color: '#F9FAFB' }}>{title}</p>
        <p className="truncate text-xs" style={{ color: '#9CA3AF' }}>{sub}</p>
        {extra && <p className="text-xs" style={{ color: '#9CA3AF' }}>{extra}</p>}
      </div>
      {badge && <Badge status={badge} />}
    </div>
  )
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

export function PageShell({ children, title, subtitle }: { children: React.ReactNode; title?: string; subtitle?: string }) {
  return (
    <div className="flex flex-col gap-6">
      {title && (
        <div>
          <h1 className="text-lg font-bold" style={{ color: '#F9FAFB' }}>{title}</h1>
          {subtitle && <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  )
}

export function TwoCol({ main, side }: { main: React.ReactNode; side: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2 flex flex-col gap-4">{main}</div>
      <div className="flex flex-col gap-4">{side}</div>
    </div>
  )
}
