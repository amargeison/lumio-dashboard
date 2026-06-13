'use client'

// Women's Club Finance — CEO/owner financial command centre.
// Tabbed: Overview · Revenue · Costs · Wages · Contracts · Budgets &
// Transfers · Cash Flow · Financial Health (FSR). All charts are inline SVG
// (no external chart lib). DEMO: figures are canned/derived; sponsor names are
// fictional (brand rules). FSR / PSR are kept as factual governing-body refs.

import { useState } from 'react'
import {
  DollarSign, FileText, BarChart3, Users, TrendingUp, PieChart, Wallet,
  ShieldCheck, ArrowRightLeft, Building2, AlertTriangle, CheckCircle2, Activity,
} from 'lucide-react'

const C = {
  card: '#0D1017', cardAlt: '#111318', panel2: '#0B0D12',
  border: '#1F2937', borderHi: '#374151',
  text: '#F9FAFB', textSec: '#9CA3AF', muted: '#6B7280', text2: '#D1D5DB',
  primary: '#EC4899', gold: '#BE185D',
  good: '#22C55E', warn: '#F59E0B', bad: '#EF4444',
  blue: '#3B82F6', purple: '#8B5CF6', cyan: '#06B6D4', teal: '#14B8A6',
} as const

const MONTHS = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']

// money in £ thousands unless noted
const fmtK = (k: number) => k >= 1000 ? '£' + (k / 1000).toFixed(k % 1000 === 0 ? 1 : 1) + 'm' : '£' + Math.round(k) + 'k'
const fmtFull = (k: number) => '£' + (k * 1000).toLocaleString('en-GB')

// ─── Revenue (YTD, £k) ─────────────────────────────────────────────────────
const REVENUE = [
  { source: 'Broadcasting',     amount: 640, trend: '+18%', color: C.blue },
  { source: 'Sponsorship',      amount: 520, trend: '+12%', color: C.warn },
  { source: 'Matchday',         amount: 360, trend: '+24%', color: C.good },
  { source: 'WSL Distribution', amount: 280, trend: '—',    color: C.purple },
  { source: 'Merchandise',      amount: 140, trend: '+31%', color: C.cyan },
  { source: 'Other',            amount: 60,  trend: '+4%',  color: C.muted },
]
const REVENUE_TOTAL = REVENUE.reduce((s, r) => s + r.amount, 0) // 2000

// ─── Costs (YTD, £k) ───────────────────────────────────────────────────────
const COSTS = [
  { source: 'Player & staff wages',  amount: 1400, color: C.primary },
  { source: 'Football operations',   amount: 150,  color: C.blue },
  { source: 'Facilities & matchday', amount: 120,  color: C.good },
  { source: 'Academy & youth',       amount: 110,  color: C.purple },
  { source: 'Transfer amortisation', amount: 100,  color: C.gold },
  { source: 'Admin & overheads',     amount: 90,   color: C.cyan },
  { source: 'Travel & logistics',    amount: 80,   color: C.teal },
  { source: 'Medical & performance', amount: 70,   color: C.warn },
  { source: 'Commercial & marketing',amount: 60,   color: C.muted },
]
const COSTS_TOTAL = COSTS.reduce((s, c) => s + c.amount, 0) // 2180
const OWNER_FUNDING = 250 // £k injected by owner
const NET_OPERATING = REVENUE_TOTAL - COSTS_TOTAL // -180
const NET_RESULT = NET_OPERATING + OWNER_FUNDING   // +70

// ─── Monthly trend (£k) ────────────────────────────────────────────────────
const REV_TREND  = [150, 145, 168, 182, 175, 190, 160, 158, 172, 185, 178, 187]
const COST_TREND = [175, 178, 180, 185, 182, 188, 179, 176, 184, 186, 183, 184]

// ─── Wages ─────────────────────────────────────────────────────────────────
const WAGE_BY_GROUP = [
  { group: 'Forwards',    amount: 470, color: C.primary },
  { group: 'Midfield',    amount: 420, color: C.purple },
  { group: 'Defence',     amount: 330, color: C.blue },
  { group: 'Goalkeepers', amount: 95,  color: C.good },
  { group: 'Coaching & staff', amount: 85, color: C.muted },
]
const TOP_EARNERS = [
  { player: 'Zara Williams', pos: 'ST',  weekly: 3800 },
  { player: 'Lia Barker',    pos: 'CM',  weekly: 3200 },
  { player: 'Nia Carter',    pos: 'CAM', weekly: 3000 },
  { player: 'Dani Morris',   pos: 'LW',  weekly: 2800 },
  { player: 'Ellie Hayes',   pos: 'GK',  weekly: 2300 },
  { player: 'Priya Granger', pos: 'CDM', weekly: 2400 },
]
const WAGE_BILL_TREND = [1180, 1210, 1240, 1260, 1290, 1300, 1320, 1340, 1360, 1380, 1390, 1400]

// ─── Contracts ─────────────────────────────────────────────────────────────
type Contract = { player: string; pos: string; weekly: number; end: string; status: 'Offered' | 'Negotiating' | 'Standard'; agent: string; priority: 'High' | 'Medium' | 'Low' }
const CONTRACTS: Contract[] = [
  { player: 'Carla Porter',   pos: 'ST',  weekly: 1800, end: 'Jun 2025', status: 'Negotiating', agent: 'Athletes United', priority: 'High' },
  { player: 'Priya Granger',  pos: 'CDM', weekly: 2400, end: 'Jun 2025', status: 'Negotiating', agent: 'Athletes United', priority: 'High' },
  { player: 'Lia Barker',     pos: 'CM',  weekly: 3200, end: 'Jun 2026', status: 'Negotiating', agent: 'Apex Sports',     priority: 'High' },
  { player: 'Zara Williams',  pos: 'ST',  weekly: 3800, end: 'Jun 2026', status: 'Offered',     agent: 'KH Group',        priority: 'High' },
  { player: 'Kira Okonkwo',   pos: 'RB',  weekly: 2000, end: 'Jun 2026', status: 'Standard',    agent: 'Apex Sports',     priority: 'Medium' },
  { player: 'Nia Carter',     pos: 'CAM', weekly: 3000, end: 'Jun 2027', status: 'Standard',    agent: 'Apex Sports',     priority: 'Low' },
  { player: 'Dani Morris',    pos: 'LW',  weekly: 2800, end: 'Jun 2027', status: 'Standard',    agent: 'Self-represented',priority: 'Low' },
  { player: 'Maya Reid',      pos: 'CB',  weekly: 2200, end: 'Jun 2027', status: 'Standard',    agent: 'KH Group',        priority: 'Low' },
  { player: 'Ellie Hayes',    pos: 'GK',  weekly: 2300, end: 'Jun 2027', status: 'Standard',    agent: 'Self-represented',priority: 'Low' },
]

// ─── Budgets & Transfers (£k) ──────────────────────────────────────────────
const TRANSFER_BUDGET = 480
const TRANSFER_COMMITTED = 290
const TRANSFER_AVAILABLE = TRANSFER_BUDGET - TRANSFER_COMMITTED
const TRANSFER_ACTIVITY = [
  { dir: 'in',  player: 'Amara Diallo',   detail: 'Forward · from Westport City Women', fee: 140 },
  { dir: 'in',  player: 'Freya Johansson', detail: 'Centre mid · from Northbridge Ladies', fee: 95 },
  { dir: 'in',  player: 'Niamh Gallagher', detail: 'CB · from Harfield Women', fee: 55 },
  { dir: 'out', player: 'Robyn Searle',   detail: 'Winger · to Glenmoor Wanderers W', fee: 60 },
]
const BUDGET_ALLOCATION = [
  { dept: 'First-team transfers', amount: 480, color: C.primary },
  { dept: 'Wages headroom',       amount: 200, color: C.blue },
  { dept: 'Academy investment',   amount: 120, color: C.purple },
  { dept: 'Facilities & pitch',   amount: 90,  color: C.good },
  { dept: 'Performance / medical', amount: 60, color: C.warn },
]

// ─── Cash flow (£k) ────────────────────────────────────────────────────────
const CASHFLOW = MONTHS.map((m, i) => ({ month: m, inflow: REV_TREND[i] + (i % 4 === 0 ? OWNER_FUNDING / 3 : 0), outflow: COST_TREND[i] }))
let _bal = 350
const CASH_BALANCE = CASHFLOW.map(c => { _bal = _bal + c.inflow - c.outflow; return Math.round(_bal) })
const RESERVES = CASH_BALANCE[CASH_BALANCE.length - 1]

// ─── Top sponsors (fictional brands) ───────────────────────────────────────
const SPONSORS = [
  { name: 'Vanta Sports',     deal: 'Front-of-shirt + kit', value: 220, end: '2027', color: C.primary },
  { name: 'Meridian Watches', deal: 'Sleeve + hospitality',  value: 110, end: '2026', color: C.blue },
  { name: 'Crown Wagers',     deal: 'Training-wear + content', value: 90, end: '2026', color: C.purple },
  { name: 'Apex Performance', deal: 'Performance partner',   value: 60,  end: '2027', color: C.good },
  { name: 'Kestrel Finance',  deal: 'Stadium naming',        value: 40,  end: '2025', color: C.warn },
]

// ─── FSR / financial health ────────────────────────────────────────────────
const FSR_METRICS = [
  { label: 'Wage-to-turnover', value: 70, threshold: 80, unit: '%', good: 'below', note: 'WSL guidance ceiling 80% — 10pt headroom.' },
  { label: 'Rolling 3yr losses', value: 0.9, threshold: 1.5, unit: '£m', good: 'below', note: 'Allowable FSR loss envelope £1.5m over 3 years.' },
  { label: 'Liquidity (months cover)', value: 4.2, threshold: 3, unit: 'mo', good: 'above', note: 'Reserves cover ~4 months of outgoings.' },
  { label: 'Self-generated revenue', value: 86, threshold: 70, unit: '%', good: 'above', note: 'Share of revenue not from owner funding.' },
]
const RISK_FLAGS = [
  { tone: C.warn, text: '2 key contracts (Porter, Granger) expire Jun 2025 — renew or risk free transfers.' },
  { tone: C.good, text: 'Wage-to-turnover 70% — inside WSL sustainability guidance.' },
  { tone: C.warn, text: 'Operating deficit £180k before owner funding — narrowing YoY (was £240k).' },
  { tone: C.good, text: 'FSR rolling-loss headroom £0.6m remaining over the 3-year window.' },
]

// ─── Chart + UI helpers (inline SVG, no external lib) ──────────────────────
function StatCard({ label, value, sub, icon: Icon, color, tone }: { label: string; value: string; sub?: string; icon: React.ElementType; color: string; tone?: string }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}18` }}><Icon size={14} style={{ color }} /></div>
        {tone && <span className="text-[10px] font-bold" style={{ color: tone }}>{sub}</span>}
      </div>
      <p className="text-2xl font-black" style={{ color: C.text }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: C.muted }}>{label}</p>
      {sub && !tone && <p className="text-[10px] mt-0.5" style={{ color: C.muted }}>{sub}</p>}
    </div>
  )
}

function Donut({ data, total, centerLabel, size = 168 }: { data: { source: string; amount: number; color: string }[]; total: number; centerLabel: string; size?: number }) {
  const thickness = 24, r = (size - thickness) / 2, cx = size / 2, cy = size / 2, circ = 2 * Math.PI * r
  let acc = 0
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.border} strokeWidth={thickness} />
      {data.map((d, i) => {
        const frac = d.amount / total, len = frac * circ, off = -acc * circ
        acc += frac
        return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={d.color} strokeWidth={thickness}
          strokeDasharray={`${len} ${circ - len}`} strokeDashoffset={off} transform={`rotate(-90 ${cx} ${cy})`} />
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" style={{ fill: C.text, fontSize: 22, fontWeight: 800 }}>{centerLabel}</text>
      <text x={cx} y={cy + 16} textAnchor="middle" style={{ fill: C.muted, fontSize: 10 }}>total</text>
    </svg>
  )
}

function BreakdownRows({ data, total }: { data: { source: string; amount: number; color: string; trend?: string }[]; total: number }) {
  return (
    <div className="space-y-2.5 w-full">
      {data.map((d, i) => (
        <div key={i}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-2" style={{ color: C.text2 }}><span className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} />{d.source}</span>
            <span className="flex items-center gap-2"><span className="font-bold" style={{ color: C.text }}>{fmtK(d.amount)}</span><span style={{ color: C.muted }}>{Math.round(d.amount / total * 100)}%</span>{d.trend && <span style={{ color: d.trend.startsWith('+') ? C.good : d.trend === '—' ? C.muted : C.bad }}>{d.trend}</span>}</span>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: C.panel2 }}><div className="h-1.5 rounded-full" style={{ width: `${d.amount / total * 100}%`, background: d.color }} /></div>
        </div>
      ))}
    </div>
  )
}

function LineArea({ a, b, labelA, labelB, height = 150 }: { a: number[]; b?: number[]; labelA: string; labelB?: string; height?: number }) {
  const W = 320, H = height, pad = 6
  const all = b ? [...a, ...b] : a
  const max = Math.max(...all) * 1.05, min = Math.min(...all, 0) * 0.95
  const n = a.length
  const x = (i: number) => pad + (i / (n - 1)) * (W - 2 * pad)
  const y = (v: number) => H - pad - ((v - min) / (max - min)) * (H - 2 * pad)
  const line = (arr: number[]) => arr.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const area = (arr: number[]) => `${line(arr)} L${x(n - 1).toFixed(1)},${H - pad} L${x(0).toFixed(1)},${H - pad} Z`
  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
        <defs><linearGradient id="finGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.primary} stopOpacity="0.35" /><stop offset="100%" stopColor={C.primary} stopOpacity="0" /></linearGradient></defs>
        <path d={area(a)} fill="url(#finGrad)" />
        <path d={line(a)} fill="none" stroke={C.primary} strokeWidth="2" />
        {b && <path d={line(b)} fill="none" stroke={C.warn} strokeWidth="2" strokeDasharray="4 3" />}
      </svg>
      <div className="flex items-center gap-4 mt-2 text-[10px]">
        <span className="flex items-center gap-1.5" style={{ color: C.muted }}><span style={{ width: 10, height: 3, background: C.primary, display: 'inline-block', borderRadius: 2 }} />{labelA}</span>
        {labelB && <span className="flex items-center gap-1.5" style={{ color: C.muted }}><span style={{ width: 10, height: 3, background: C.warn, display: 'inline-block', borderRadius: 2 }} />{labelB}</span>}
      </div>
    </div>
  )
}

function VBars({ data, color, height = 130, fmt }: { data: { label: string; value: number }[]; color: string | ((v: number) => string); height?: number; fmt?: (v: number) => string }) {
  const max = Math.max(...data.map(d => d.value)) * 1.02
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((d, i) => {
        const col = typeof color === 'function' ? color(d.value) : color
        return (
          <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1" title={fmt ? fmt(d.value) : String(d.value)}>
            <span className="text-[8px] font-bold" style={{ color: C.muted }}>{fmt ? fmt(d.value) : d.value}</span>
            <div className="w-full rounded-t" style={{ height: `${Math.max(2, d.value / max * 100)}%`, background: col, minHeight: 3 }} />
            <span className="text-[9px]" style={{ color: C.muted }}>{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}

function GroupedBars({ data, height = 150 }: { data: { month: string; inflow: number; outflow: number }[]; height?: number }) {
  const max = Math.max(...data.flatMap(d => [d.inflow, d.outflow])) * 1.05
  return (
    <div>
      <div className="flex items-end gap-2" style={{ height }}>
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
            <div className="w-full flex items-end justify-center gap-0.5" style={{ height: '100%' }}>
              <div className="rounded-t" style={{ width: '45%', height: `${d.inflow / max * 100}%`, background: C.good }} title={`In ${fmtK(d.inflow)}`} />
              <div className="rounded-t" style={{ width: '45%', height: `${d.outflow / max * 100}%`, background: C.bad }} title={`Out ${fmtK(d.outflow)}`} />
            </div>
            <span className="text-[9px]" style={{ color: C.muted }}>{d.month}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-2 text-[10px]">
        <span className="flex items-center gap-1.5" style={{ color: C.muted }}><span style={{ width: 8, height: 8, background: C.good, display: 'inline-block', borderRadius: 2 }} />Inflow</span>
        <span className="flex items-center gap-1.5" style={{ color: C.muted }}><span style={{ width: 8, height: 8, background: C.bad, display: 'inline-block', borderRadius: 2 }} />Outflow</span>
      </div>
    </div>
  )
}

function Meter({ label, value, threshold, unit, good, note }: { label: string; value: number; threshold: number; unit: string; good: 'above' | 'below'; note: string }) {
  const scaleMax = Math.max(value, threshold) * 1.4
  const pass = good === 'below' ? value <= threshold : value >= threshold
  const col = pass ? C.good : C.bad
  const fmtv = (v: number) => unit === '%' ? `${v}%` : unit === '£m' ? `£${v}m` : `${v} ${unit}`
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold" style={{ color: C.text2 }}>{label}</span>
        <span className="text-sm font-black" style={{ color: col }}>{fmtv(value)}</span>
      </div>
      <div className="relative h-2 rounded-full mt-2" style={{ background: C.panel2 }}>
        <div className="absolute h-2 rounded-full" style={{ width: `${Math.min(100, value / scaleMax * 100)}%`, background: col }} />
        <div className="absolute top-[-3px] h-3.5 w-0.5" style={{ left: `${Math.min(100, threshold / scaleMax * 100)}%`, background: C.text }} title={`Threshold ${fmtv(threshold)}`} />
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[9px]" style={{ color: C.muted }}>{note}</span>
        <span className="text-[9px] font-bold" style={{ color: col }}>{pass ? 'PASS' : 'WATCH'}</span>
      </div>
    </div>
  )
}

function Panel({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
      <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
        <p className="text-sm font-semibold" style={{ color: C.text }}>{title}</p>
        {right}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

const TABS = [
  { id: 'overview',  label: 'Overview',           icon: BarChart3 },
  { id: 'revenue',   label: 'Revenue',            icon: TrendingUp },
  { id: 'costs',     label: 'Costs',              icon: PieChart },
  { id: 'wages',     label: 'Wages',              icon: Users },
  { id: 'contracts', label: 'Contracts',          icon: FileText },
  { id: 'transfers', label: 'Budgets & Transfers',icon: ArrowRightLeft },
  { id: 'cashflow',  label: 'Cash Flow',          icon: Wallet },
  { id: 'fsr',       label: 'Financial Health',   icon: ShieldCheck },
] as const

export default function WomensFinanceView() {
  const [tab, setTab] = useState<string>('overview')
  const wageRev = Math.round(COSTS[0].amount / REVENUE_TOTAL * 100)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold" style={{ color: C.text }}>Club Finance</h2>
        <p className="text-sm mt-1" style={{ color: C.textSec }}>The owner&apos;s financial command centre — revenue, costs, wages, contracts, transfers, cash flow and FSR health. For multi-horizon planning see Financial Planning under COMMERCIAL.</p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, borderBottom: `1px solid ${C.border}`, overflowX: 'auto' }}>
        {TABS.map(t => {
          const active = tab === t.id
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ appearance: 'none', border: 0, background: 'transparent', padding: '10px 14px', fontSize: 12.5, fontWeight: active ? 700 : 500, color: active ? '#fff' : C.textSec, borderBottom: `2px solid ${active ? C.primary : 'transparent'}`, marginBottom: -1, cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <Icon size={13} strokeWidth={1.75} />{t.label}
            </button>
          )
        })}
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            <StatCard label="Revenue (YTD)" value={fmtK(REVENUE_TOTAL)} sub="+16% YoY" tone={C.good} icon={TrendingUp} color={C.blue} />
            <StatCard label="Expenditure (YTD)" value={fmtK(COSTS_TOTAL)} sub="+8% YoY" tone={C.warn} icon={PieChart} color={C.primary} />
            <StatCard label="Operating result" value={fmtK(NET_OPERATING)} sub="deficit" tone={C.bad} icon={Activity} color={C.warn} />
            <StatCard label="Net result" value={`+${fmtK(NET_RESULT)}`} sub="after owner funding" tone={C.good} icon={Wallet} color={C.good} />
            <StatCard label="Wage bill" value={fmtK(COSTS[0].amount)} sub="of total cost" icon={Users} color={C.purple} />
            <StatCard label="Wage / revenue" value={`${wageRev}%`} sub="ceiling 80%" tone={C.good} icon={BarChart3} color={C.warn} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Revenue vs Expenditure (monthly, £k)"><LineArea a={REV_TREND} b={COST_TREND} labelA="Revenue" labelB="Costs" /></Panel>
            <Panel title="Profit & Loss summary">
              <div className="space-y-2 text-sm">
                {[['Total revenue', fmtK(REVENUE_TOTAL), C.text], ['Total expenditure', `(${fmtK(COSTS_TOTAL)})`, C.text2], ['Operating result', fmtK(NET_OPERATING), C.bad], ['Owner funding', `+${fmtK(OWNER_FUNDING)}`, C.good], ['Net result', `+${fmtK(NET_RESULT)}`, C.good]].map(([k, v, col], i) => (
                  <div key={i} className="flex items-center justify-between" style={{ borderTop: i === 4 ? `1px solid ${C.border}` : undefined, paddingTop: i === 4 ? 8 : 0 }}>
                    <span style={{ color: C.text2, fontWeight: i === 4 ? 700 : 400 }}>{k}</span>
                    <span className="font-mono font-bold" style={{ color: col as string }}>{v}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] mt-3" style={{ color: C.muted }}>Operating deficit narrowed from £240k last season. Owner funding within FSR limits.</p>
            </Panel>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Revenue mix"><div className="flex items-center gap-5 flex-wrap"><Donut data={REVENUE} total={REVENUE_TOTAL} centerLabel={fmtK(REVENUE_TOTAL)} /><div className="flex-1 min-w-[180px]"><BreakdownRows data={REVENUE} total={REVENUE_TOTAL} /></div></div></Panel>
            <Panel title="Cost mix"><div className="flex items-center gap-5 flex-wrap"><Donut data={COSTS} total={COSTS_TOTAL} centerLabel={fmtK(COSTS_TOTAL)} /><div className="flex-1 min-w-[180px]"><BreakdownRows data={COSTS} total={COSTS_TOTAL} /></div></div></Panel>
          </div>

          <Panel title="CEO alerts & financial health">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {RISK_FLAGS.map((f, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg p-2.5" style={{ background: C.panel2, border: `1px solid ${C.border}` }}>
                  {f.tone === C.good ? <CheckCircle2 size={14} className="mt-0.5 shrink-0" style={{ color: f.tone }} /> : <AlertTriangle size={14} className="mt-0.5 shrink-0" style={{ color: f.tone }} />}
                  <span className="text-xs" style={{ color: C.text2 }}>{f.text}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {/* REVENUE */}
      {tab === 'revenue' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Revenue (YTD)" value={fmtK(REVENUE_TOTAL)} sub="+16% YoY" tone={C.good} icon={TrendingUp} color={C.blue} />
            <StatCard label="Top stream" value="Broadcasting" sub={fmtK(640)} icon={BarChart3} color={C.blue} />
            <StatCard label="Fastest grower" value="Merchandise" sub="+31% YoY" tone={C.good} icon={TrendingUp} color={C.cyan} />
            <StatCard label="Commercial / sponsor" value={fmtK(520)} sub="26% of revenue" icon={DollarSign} color={C.warn} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Revenue by stream (YTD)"><div className="flex items-center gap-5 flex-wrap"><Donut data={REVENUE} total={REVENUE_TOTAL} centerLabel={fmtK(REVENUE_TOTAL)} /><div className="flex-1 min-w-[180px]"><BreakdownRows data={REVENUE} total={REVENUE_TOTAL} /></div></div></Panel>
            <Panel title="Monthly revenue (£k)"><VBars data={MONTHS.map((m, i) => ({ label: m, value: REV_TREND[i] }))} color={C.blue} fmt={v => String(v)} /></Panel>
          </div>
          <Panel title="Top commercial partners" right={<span className="text-xs" style={{ color: C.muted }}>{SPONSORS.length} active deals</span>}>
            <table className="w-full text-xs">
              <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>{['Partner', 'Deal', 'Annual value', 'Until'].map(h => <th key={h} className="text-left py-2 font-semibold" style={{ color: C.muted }}>{h}</th>)}</tr></thead>
              <tbody>
                {SPONSORS.map((s, i) => (
                  <tr key={i} style={{ borderBottom: i < SPONSORS.length - 1 ? `1px solid ${C.border}` : undefined }}>
                    <td className="py-2.5 font-semibold" style={{ color: C.text }}><span className="inline-block w-2 h-2 rounded-sm mr-2" style={{ background: s.color }} />{s.name}</td>
                    <td className="py-2.5" style={{ color: C.textSec }}>{s.deal}</td>
                    <td className="py-2.5 font-bold" style={{ color: C.text }}>{fmtK(s.value)}</td>
                    <td className="py-2.5" style={{ color: s.end === '2025' ? C.warn : C.muted }}>{s.end}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
      )}

      {/* COSTS */}
      {tab === 'costs' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Total expenditure" value={fmtK(COSTS_TOTAL)} sub="+8% YoY" tone={C.warn} icon={PieChart} color={C.primary} />
            <StatCard label="Largest cost" value="Wages" sub={`${Math.round(COSTS[0].amount / COSTS_TOTAL * 100)}% of spend`} icon={Users} color={C.primary} />
            <StatCard label="Non-wage costs" value={fmtK(COSTS_TOTAL - COSTS[0].amount)} sub="operations + facilities" icon={Building2} color={C.blue} />
            <StatCard label="Academy investment" value={fmtK(110)} sub="youth pathway" icon={TrendingUp} color={C.purple} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Cost breakdown (YTD)"><div className="flex items-center gap-5 flex-wrap"><Donut data={COSTS} total={COSTS_TOTAL} centerLabel={fmtK(COSTS_TOTAL)} /><div className="flex-1 min-w-[180px]"><BreakdownRows data={COSTS} total={COSTS_TOTAL} /></div></div></Panel>
            <Panel title="Monthly cost run-rate (£k)"><VBars data={MONTHS.map((m, i) => ({ label: m, value: COST_TREND[i] }))} color={C.primary} fmt={v => String(v)} /></Panel>
          </div>
        </div>
      )}

      {/* WAGES */}
      {tab === 'wages' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Annual wage bill" value={fmtK(COSTS[0].amount)} sub="players + staff" icon={Users} color={C.primary} />
            <StatCard label="Wage / revenue" value={`${wageRev}%`} sub="ceiling 80%" tone={C.good} icon={BarChart3} color={C.warn} />
            <StatCard label="Highest earner" value="Z. Williams" sub="£3,800/wk" icon={DollarSign} color={C.primary} />
            <StatCard label="Avg first-team wage" value="£2,600/wk" sub="across 22 squad" icon={TrendingUp} color={C.blue} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Wage distribution by group (£k/yr)"><div className="flex items-center gap-5 flex-wrap"><Donut data={WAGE_BY_GROUP.map(w => ({ source: w.group, amount: w.amount, color: w.color }))} total={WAGE_BY_GROUP.reduce((s, w) => s + w.amount, 0)} centerLabel={fmtK(WAGE_BY_GROUP.reduce((s, w) => s + w.amount, 0))} /><div className="flex-1 min-w-[180px]"><BreakdownRows data={WAGE_BY_GROUP.map(w => ({ source: w.group, amount: w.amount, color: w.color }))} total={WAGE_BY_GROUP.reduce((s, w) => s + w.amount, 0)} /></div></div></Panel>
            <Panel title="Wage bill trend (£k/yr)"><VBars data={MONTHS.map((m, i) => ({ label: m, value: WAGE_BILL_TREND[i] }))} color={C.primary} fmt={v => String(v)} /></Panel>
          </div>
          <Panel title="Top earners" right={<span className="text-xs" style={{ color: C.muted }}>weekly · annualised</span>}>
            <table className="w-full text-xs">
              <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>{['Player', 'Pos', 'Weekly', 'Annual', '% of bill'].map(h => <th key={h} className="text-left py-2 font-semibold" style={{ color: C.muted }}>{h}</th>)}</tr></thead>
              <tbody>
                {TOP_EARNERS.map((e, i) => (
                  <tr key={i} style={{ borderBottom: i < TOP_EARNERS.length - 1 ? `1px solid ${C.border}` : undefined }}>
                    <td className="py-2.5 font-semibold" style={{ color: C.text }}>{e.player}</td>
                    <td className="py-2.5"><span className="px-1.5 py-0.5 rounded" style={{ background: `${C.primary}1A`, color: C.primary }}>{e.pos}</span></td>
                    <td className="py-2.5" style={{ color: C.textSec }}>£{e.weekly.toLocaleString('en-GB')}</td>
                    <td className="py-2.5 font-bold" style={{ color: C.text }}>{fmtFull(e.weekly * 52 / 1000)}</td>
                    <td className="py-2.5" style={{ color: C.muted }}>{Math.round(e.weekly * 52 / 1000 / COSTS[0].amount * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
      )}

      {/* CONTRACTS */}
      {tab === 'contracts' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Contracts tracked" value={`${CONTRACTS.length}`} sub="first-team squad" icon={FileText} color={C.blue} />
            <StatCard label="Expiring 2025" value={`${CONTRACTS.filter(c => c.end === 'Jun 2025').length}`} sub="renew or lose free" tone={C.bad} icon={AlertTriangle} color={C.bad} />
            <StatCard label="In negotiation" value={`${CONTRACTS.filter(c => c.status !== 'Standard').length}`} sub="offered / talking" tone={C.warn} icon={ArrowRightLeft} color={C.warn} />
            <StatCard label="High-priority renewals" value={`${CONTRACTS.filter(c => c.priority === 'High').length}`} sub="this window" icon={CheckCircle2} color={C.primary} />
          </div>
          <Panel title="Contract tracker" right={<span className="text-xs" style={{ color: C.muted }}>sorted by expiry</span>}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr style={{ borderBottom: `1px solid ${C.border}` }}>{['Player', 'Pos', 'Weekly', 'Annual', 'Expiry', 'Status', 'Priority', 'Agent'].map(h => <th key={h} className="text-left py-2.5 font-semibold" style={{ color: C.muted }}>{h}</th>)}</tr></thead>
                <tbody>
                  {CONTRACTS.map((c, i) => {
                    const sc = c.status === 'Offered' ? C.blue : c.status === 'Negotiating' ? C.warn : C.muted
                    const pc = c.priority === 'High' ? C.bad : c.priority === 'Medium' ? C.warn : C.muted
                    return (
                      <tr key={i} style={{ borderBottom: i < CONTRACTS.length - 1 ? `1px solid ${C.border}` : undefined }} className="hover:bg-white/[0.02]">
                        <td className="py-2.5 font-medium" style={{ color: C.text }}>{c.player}</td>
                        <td className="py-2.5"><span className="px-1.5 py-0.5 rounded" style={{ background: `${C.primary}1A`, color: C.primary }}>{c.pos}</span></td>
                        <td className="py-2.5" style={{ color: C.textSec }}>£{c.weekly.toLocaleString('en-GB')}</td>
                        <td className="py-2.5" style={{ color: C.textSec }}>{fmtFull(c.weekly * 52 / 1000)}</td>
                        <td className="py-2.5 font-semibold" style={{ color: c.end === 'Jun 2025' ? C.bad : c.end === 'Jun 2026' ? C.warn : C.textSec }}>{c.end}</td>
                        <td className="py-2.5"><span className="px-2 py-0.5 rounded-lg font-semibold" style={{ background: `${sc}1a`, color: sc }}>{c.status}</span></td>
                        <td className="py-2.5"><span className="font-bold" style={{ color: pc }}>{c.priority}</span></td>
                        <td className="py-2.5" style={{ color: C.muted }}>{c.agent}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Expiry timeline">
              <VBars data={['Jun 2025', 'Jun 2026', 'Jun 2027'].map(y => ({ label: y.replace('Jun ', "'"), value: CONTRACTS.filter(c => c.end === y).length }))} color={(v) => v >= 2 ? C.bad : C.warn} fmt={v => String(v)} height={110} />
              <p className="text-[10px] mt-2" style={{ color: C.muted }}>Two expiries next summer — prioritise Porter & Granger renewals.</p>
            </Panel>
            <Panel title="Representation split">
              {Object.entries(CONTRACTS.reduce((m, c) => { m[c.agent] = (m[c.agent] || 0) + 1; return m }, {} as Record<string, number>)).map(([agent, n], i, arr) => (
                <div key={agent} className="flex items-center justify-between text-xs py-1.5" style={{ borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : undefined }}>
                  <span style={{ color: C.text2 }}>{agent}</span><span className="font-bold" style={{ color: C.text }}>{n} player{n > 1 ? 's' : ''}</span>
                </div>
              ))}
            </Panel>
          </div>
        </div>
      )}

      {/* TRANSFERS */}
      {tab === 'transfers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Transfer budget" value={fmtK(TRANSFER_BUDGET)} sub="this window" icon={Wallet} color={C.good} />
            <StatCard label="Committed" value={fmtK(TRANSFER_COMMITTED)} sub="3 signings agreed" tone={C.warn} icon={ArrowRightLeft} color={C.warn} />
            <StatCard label="Available" value={fmtK(TRANSFER_AVAILABLE)} sub="remaining headroom" tone={C.good} icon={DollarSign} color={C.good} />
            <StatCard label="Net spend" value={fmtK(TRANSFER_ACTIVITY.filter(t => t.dir === 'in').reduce((s, t) => s + t.fee, 0) - TRANSFER_ACTIVITY.filter(t => t.dir === 'out').reduce((s, t) => s + t.fee, 0))} sub="in minus out" icon={TrendingUp} color={C.blue} />
          </div>
          <Panel title="Budget utilisation">
            <div className="relative h-4 rounded-full" style={{ background: C.panel2 }}>
              <div className="absolute h-4 rounded-l-full" style={{ width: `${TRANSFER_COMMITTED / TRANSFER_BUDGET * 100}%`, background: C.warn }} />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs"><span style={{ color: C.warn }}>Committed {fmtK(TRANSFER_COMMITTED)}</span><span style={{ color: C.good }}>Available {fmtK(TRANSFER_AVAILABLE)}</span></div>
          </Panel>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Transfer activity (this window)">
              <div className="space-y-2">
                {TRANSFER_ACTIVITY.map((t, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg p-2.5" style={{ background: C.panel2, border: `1px solid ${C.border}` }}>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: t.dir === 'in' ? `${C.good}1a` : `${C.bad}1a`, color: t.dir === 'in' ? C.good : C.bad }}>{t.dir === 'in' ? 'IN' : 'OUT'}</span>
                      <div><div className="text-xs font-semibold" style={{ color: C.text }}>{t.player}</div><div className="text-[10px]" style={{ color: C.muted }}>{t.detail}</div></div>
                    </div>
                    <span className="font-bold text-xs" style={{ color: t.dir === 'in' ? C.text : C.good }}>{t.dir === 'in' ? '' : '+'}{fmtK(t.fee)}</span>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Owner budget allocation (£k)"><BreakdownRows data={BUDGET_ALLOCATION.map(b => ({ source: b.dept, amount: b.amount, color: b.color }))} total={BUDGET_ALLOCATION.reduce((s, b) => s + b.amount, 0)} /></Panel>
          </div>
        </div>
      )}

      {/* CASH FLOW */}
      {tab === 'cashflow' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Cash reserves" value={fmtK(RESERVES)} sub="end of period" icon={Wallet} color={C.good} />
            <StatCard label="Avg monthly inflow" value={fmtK(Math.round(CASHFLOW.reduce((s, c) => s + c.inflow, 0) / 12))} icon={TrendingUp} color={C.blue} />
            <StatCard label="Avg monthly outflow" value={fmtK(Math.round(CASHFLOW.reduce((s, c) => s + c.outflow, 0) / 12))} icon={PieChart} color={C.primary} />
            <StatCard label="Runway" value="~4.2 mo" sub="reserves / outgoings" tone={C.good} icon={ShieldCheck} color={C.warn} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Monthly cash flow (£k)"><GroupedBars data={CASHFLOW} /></Panel>
            <Panel title="Running cash balance (£k)"><LineArea a={CASH_BALANCE} labelA="Balance" /></Panel>
          </div>
        </div>
      )}

      {/* FSR */}
      {tab === 'fsr' && (
        <div className="space-y-4">
          <div className="rounded-xl p-4" style={{ background: `linear-gradient(135deg, ${C.good}14, ${C.cardAlt})`, border: `1px solid ${C.good}40` }}>
            <div className="flex items-center gap-2"><ShieldCheck size={18} style={{ color: C.good }} /><span className="text-sm font-bold" style={{ color: C.text }}>Financial Sustainability — COMPLIANT</span></div>
            <p className="text-xs mt-1" style={{ color: C.textSec }}>Within WSL Financial Sustainability Regulations (FSR) and Profit &amp; Sustainability (PSR) thresholds on all monitored metrics.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {FSR_METRICS.map((m, i) => <Meter key={i} label={m.label} value={m.value} threshold={m.threshold} unit={m.unit} good={m.good as 'above' | 'below'} note={m.note} />)}
          </div>
          <Panel title="Risk register">
            <div className="space-y-2">
              {RISK_FLAGS.map((f, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg p-2.5" style={{ background: C.panel2, border: `1px solid ${C.border}` }}>
                  {f.tone === C.good ? <CheckCircle2 size={14} className="mt-0.5 shrink-0" style={{ color: f.tone }} /> : <AlertTriangle size={14} className="mt-0.5 shrink-0" style={{ color: f.tone }} />}
                  <span className="text-xs" style={{ color: C.text2 }}>{f.text}</span>
                </div>
              ))}
            </div>
          </Panel>
          <p className="text-[10px]" style={{ color: C.muted }}>Demo — figures illustrative. FSR / PSR thresholds shown are indicative; a signed client would sync to filed accounts and league monitoring submissions.</p>
        </div>
      )}
    </div>
  )
}
