'use client'

import { useMemo, useState } from 'react'
import {
  Calculator, Activity, Layers, TrendingUp, ShieldCheck, FileText,
  Plus, X, AlertTriangle, CheckCircle2,
} from 'lucide-react'

const C = {
  bg: '#07080F', card: '#0D1017', cardAlt: '#111318',
  border: '#1F2937', borderHi: '#374151',
  text: '#F9FAFB', text2: '#D1D5DB', muted: '#9CA3AF', dim: '#6B7280',
  primary: '#003DA5', gold: '#F1C40F',
  green: '#22C55E', amber: '#F59E0B', red: '#EF4444', blue: '#3B82F6', purple: '#8B5CF6', teal: '#0D9488',
} as const

type Tab = 'current' | 'scenario' | 'amortisation' | 'projections' | 'carve-outs' | 'audit'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'current',       label: 'Current Position',     icon: Activity },
  { id: 'scenario',      label: 'Scenario Modeller',    icon: Calculator },
  { id: 'amortisation',  label: 'Amortisation',         icon: Layers },
  { id: 'projections',   label: 'Multi-Year Projections', icon: TrendingUp },
  { id: 'carve-outs',    label: 'Carve-Outs',           icon: ShieldCheck },
  { id: 'audit',         label: 'Audit Trail',          icon: FileText },
]

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl p-5 ${className}`} style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>{children}</div>
}
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-bold mb-3" style={{ color: C.text }}>{children}</h3>
}
function Pill({ children, color = C.muted }: { children: React.ReactNode; color?: string }) {
  return <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}55` }}>{children}</span>
}
function Gauge({ pct, threshold, label, color }: { pct: number; threshold: number; label: string; color: string }) {
  const fill = Math.min(100, Math.max(0, pct))
  const breach = pct > threshold
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-[10px] uppercase tracking-wider" style={{ color: C.dim }}>{label}</span>
        <span className="text-[10px] font-mono" style={{ color: breach ? C.red : color }}>{pct.toFixed(0)}% / {threshold}%</span>
      </div>
      <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: C.border }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${fill}%`, backgroundColor: breach ? C.red : pct > threshold * 0.9 ? C.amber : color }} />
      </div>
    </div>
  )
}

// ─── CURRENT POSITION ────────────────────────────────────────────────────────

const PSR_YEARS = [
  { year: '2023/24', revenue: 87.4, expenditure: 121.6, netPL: -34.2, deductions: 9.8,  psr: -24.4 },
  { year: '2024/25', revenue: 96.2, expenditure: 124.8, netPL: -28.6, deductions: 9.2,  psr: -19.4 },
  { year: '2025/26', revenue: 104.8, expenditure: 137.4, netPL: -32.6, deductions: 8.4,  psr: -24.2 },
]
const PSR_LIMIT = 105
const SCR_REVENUE = 104.8
const SCR_SQUAD_COST = 84.9
const SCR_PCT = (SCR_SQUAD_COST / SCR_REVENUE) * 100
const SCR_THRESHOLD = 85
const SCR_UEFA_THRESHOLD = 70

function CurrentPositionTab() {
  const psrCumulative = PSR_YEARS.reduce((s, y) => s + y.psr, 0)
  const psrCumulativeAbs = Math.abs(psrCumulative)
  const psrHeadroom = PSR_LIMIT - psrCumulativeAbs

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* PSR PANEL */}
        <Card>
          <div className="flex items-center justify-between mb-2">
            <SectionTitle>PSR — 2023/24 to 2025/26 Rolling Window</SectionTitle>
            <Pill color={psrHeadroom > 30 ? C.green : psrHeadroom > 15 ? C.amber : C.red}>
              {psrHeadroom > 30 ? '✓ Safe' : psrHeadroom > 15 ? 'Monitor' : 'At risk'}
            </Pill>
          </div>
          <div className="flex items-baseline gap-3 mb-3">
            <span className="text-4xl font-black" style={{ color: psrCumulativeAbs > PSR_LIMIT ? C.red : C.text }}>
              −£{psrCumulativeAbs.toFixed(1)}m
            </span>
            <span className="text-xs" style={{ color: C.muted }}>cumulative · vs £{PSR_LIMIT}m limit</span>
          </div>
          <Gauge pct={(psrCumulativeAbs / PSR_LIMIT) * 100} threshold={100} label="PSR usage" color={C.primary} />
          <div className="mt-4 grid grid-cols-3 gap-2">
            {PSR_YEARS.map(y => (
              <div key={y.year} className="rounded-lg p-2.5" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
                <div className="text-[10px]" style={{ color: C.dim }}>{y.year}</div>
                <div className="text-base font-bold mt-0.5" style={{ color: C.red }}>£{y.psr.toFixed(1)}m</div>
                <div className="text-[10px] mt-0.5" style={{ color: C.muted }}>−£{y.deductions.toFixed(1)}m carve-outs</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[10px] flex items-center gap-2" style={{ color: C.dim }}>
            <span>Headroom remaining:</span><span className="font-bold" style={{ color: C.green }}>£{psrHeadroom.toFixed(1)}m</span>
          </div>
        </Card>

        {/* SCR PANEL */}
        <Card>
          <div className="flex items-center justify-between mb-2">
            <SectionTitle>SCR — 2025/26 Shadow Mode</SectionTitle>
            <Pill color={SCR_PCT > SCR_THRESHOLD ? C.red : SCR_PCT > SCR_THRESHOLD * 0.95 ? C.amber : C.green}>
              {SCR_PCT > SCR_THRESHOLD ? 'Breach' : SCR_PCT > SCR_THRESHOLD * 0.95 ? 'Monitor' : '✓ Safe'}
            </Pill>
          </div>
          <div className="flex items-baseline gap-3 mb-3">
            <span className="text-4xl font-black" style={{ color: SCR_PCT > SCR_THRESHOLD ? C.red : C.text }}>{SCR_PCT.toFixed(1)}%</span>
            <span className="text-xs" style={{ color: C.muted }}>squad cost / revenue · 85% threshold (70% UEFA)</span>
          </div>
          <Gauge pct={SCR_PCT} threshold={SCR_THRESHOLD} label="SCR usage" color={C.purple} />
          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              { l: 'Player wages',          v: 58.4 },
              { l: 'Manager + coach wages', v: 7.2  },
              { l: 'Agents fees (amortised)', v: 4.6 },
              { l: 'Transfer amortisation',   v: 14.7 },
            ].map(c => (
              <div key={c.l} className="rounded-lg p-2.5" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
                <div className="text-[10px]" style={{ color: C.dim }}>{c.l}</div>
                <div className="text-sm font-bold mt-0.5" style={{ color: C.text }}>£{c.v.toFixed(1)}m</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[10px]" style={{ color: C.dim }}>
            Total squad cost: <span className="font-bold" style={{ color: C.text }}>£{SCR_SQUAD_COST.toFixed(1)}m</span> · Revenue: <span className="font-bold" style={{ color: C.text }}>£{SCR_REVENUE.toFixed(1)}m</span> · UEFA threshold (if qualified): <span className="font-bold" style={{ color: C.purple }}>{SCR_UEFA_THRESHOLD}%</span>
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle>SSR — Three In-Season Financial Tests</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { test: 'Test 1 · Financial sustainability', status: 'pass',    note: 'Net liquid assets cover 90 days operating costs' },
            { test: 'Test 2 · Real-time wage-to-revenue', status: 'monitor', note: '63% — within 65% PL guidance, trending up' },
            { test: 'Test 3 · Cost coverage forecast',     status: 'pass',    note: '12-month forecast positive given current commercial pipeline' },
          ].map((t, i) => {
            const c = t.status === 'pass' ? C.green : t.status === 'monitor' ? C.amber : C.red
            return (
              <div key={i} className="rounded-lg p-4" style={{ backgroundColor: C.cardAlt, border: `1px solid ${c}55` }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold" style={{ color: C.text }}>{t.test}</span>
                  <Pill color={c}>{t.status}</Pill>
                </div>
                <div className="text-[11px]" style={{ color: C.muted }}>{t.note}</div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

// ─── SCENARIO MODELLER ───────────────────────────────────────────────────────

type TransferIn  = { id: string; player: string; pos: string; fee: number; years: number; wage: number; agent: number }
type TransferOut = { id: string; player: string; saleFee: number; yearsLeft: number; originalFee: number; homegrown: boolean }

function ScenarioModellerTab() {
  const [transfersIn,  setIn]  = useState<TransferIn[]>([
    { id: 't1', player: 'New striker (target)', pos: 'ST', fee: 30, years: 5, wage: 4.2, agent: 1.5 },
  ])
  const [transfersOut, setOut] = useState<TransferOut[]>([
    { id: 's1', player: 'Owen Hartley (academy)', saleFee: 18, yearsLeft: 2, originalFee: 0, homegrown: true },
  ])
  const [uefa, setUefa] = useState(false)
  const [revGrowth, setRevGrowth] = useState(6)

  const impact = useMemo(() => {
    // Amortisation hit (capped at 5yr) for each new transfer
    const amortHit = transfersIn.reduce((s, t) => s + t.fee / Math.min(t.years, 5), 0)
    const wageHit  = transfersIn.reduce((s, t) => s + t.wage, 0)
    const agentHit = transfersIn.reduce((s, t) => s + t.agent / Math.min(t.years, 5), 0)
    // Profit on sale: homegrown = full fee (no book value), else saleFee - book value (originalFee × yearsLeft / contractLength approx)
    const profitOnSale = transfersOut.reduce((s, t) => {
      if (t.homegrown) return s + t.saleFee
      const bookValue = t.originalFee * Math.max(0, t.yearsLeft / 5)
      return s + (t.saleFee - bookValue)
    }, 0)

    // PSR delta: + profit on sale (helpful), - amortisation - wage - agent (harmful)
    const psrDelta = profitOnSale - amortHit - wageHit - agentHit
    const psrCumulative = -68 + psrDelta // baseline -£68m

    // SCR delta: more wages + more amortisation worsens SCR; revenue growth helps
    const newSquadCost = SCR_SQUAD_COST + wageHit + amortHit + agentHit
    const newRevenue   = SCR_REVENUE * (1 + revGrowth / 100)
    const newScr       = (newSquadCost / newRevenue) * 100
    const threshold    = uefa ? SCR_UEFA_THRESHOLD : SCR_THRESHOLD

    return { amortHit, wageHit, agentHit, profitOnSale, psrDelta, psrCumulative, newScr, newSquadCost, newRevenue, threshold }
  }, [transfersIn, transfersOut, uefa, revGrowth])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* INPUTS */}
      <div className="space-y-4">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <SectionTitle>Transfers In</SectionTitle>
            <button onClick={() => setIn([...transfersIn, { id: `t${Date.now()}`, player: 'New target', pos: 'TBD', fee: 10, years: 4, wage: 1.5, agent: 0.5 }])}
              className="px-2 py-1 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1"
              style={{ backgroundColor: C.green, color: '#000' }}>
              <Plus size={11} /> Add transfer
            </button>
          </div>
          <div className="space-y-2">
            {transfersIn.map(t => (
              <div key={t.id} className="rounded-lg p-3" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
                <div className="flex items-center justify-between mb-2">
                  <input value={t.player} onChange={e => setIn(transfersIn.map(x => x.id === t.id ? { ...x, player: e.target.value } : x))}
                    className="bg-transparent text-sm font-bold flex-1 outline-none" style={{ color: C.text }} />
                  <button onClick={() => setIn(transfersIn.filter(x => x.id !== t.id))} style={{ color: C.dim }}><X size={13} /></button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                  <label className="flex flex-col gap-0.5"><span style={{ color: C.dim }}>Fee £m</span>
                    <input type="number" value={t.fee} onChange={e => setIn(transfersIn.map(x => x.id === t.id ? { ...x, fee: parseFloat(e.target.value) || 0 } : x))} className="bg-transparent font-mono outline-none" style={{ color: C.text, borderBottom: `1px solid ${C.border}` }} /></label>
                  <label className="flex flex-col gap-0.5"><span style={{ color: C.dim }}>Years (≤5)</span>
                    <input type="number" min={1} max={5} value={t.years} onChange={e => setIn(transfersIn.map(x => x.id === t.id ? { ...x, years: Math.min(5, parseInt(e.target.value) || 1) } : x))} className="bg-transparent font-mono outline-none" style={{ color: C.text, borderBottom: `1px solid ${C.border}` }} /></label>
                  <label className="flex flex-col gap-0.5"><span style={{ color: C.dim }}>Wage £m/yr</span>
                    <input type="number" value={t.wage} onChange={e => setIn(transfersIn.map(x => x.id === t.id ? { ...x, wage: parseFloat(e.target.value) || 0 } : x))} className="bg-transparent font-mono outline-none" style={{ color: C.text, borderBottom: `1px solid ${C.border}` }} /></label>
                  <label className="flex flex-col gap-0.5"><span style={{ color: C.dim }}>Agent £m</span>
                    <input type="number" value={t.agent} onChange={e => setIn(transfersIn.map(x => x.id === t.id ? { ...x, agent: parseFloat(e.target.value) || 0 } : x))} className="bg-transparent font-mono outline-none" style={{ color: C.text, borderBottom: `1px solid ${C.border}` }} /></label>
                </div>
              </div>
            ))}
            {transfersIn.length === 0 && <p className="text-[11px]" style={{ color: C.dim }}>No hypothetical inbound transfers.</p>}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <SectionTitle>Transfers Out</SectionTitle>
            <button onClick={() => setOut([...transfersOut, { id: `s${Date.now()}`, player: 'Squad player', saleFee: 5, yearsLeft: 1, originalFee: 8, homegrown: false }])}
              className="px-2 py-1 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1"
              style={{ backgroundColor: C.amber, color: '#000' }}>
              <Plus size={11} /> Add sale
            </button>
          </div>
          <div className="space-y-2">
            {transfersOut.map(t => (
              <div key={t.id} className="rounded-lg p-3" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
                <div className="flex items-center justify-between mb-2">
                  <input value={t.player} onChange={e => setOut(transfersOut.map(x => x.id === t.id ? { ...x, player: e.target.value } : x))}
                    className="bg-transparent text-sm font-bold flex-1 outline-none" style={{ color: C.text }} />
                  {t.homegrown && <Pill color={C.green}>HOMEGROWN</Pill>}
                  <button onClick={() => setOut(transfersOut.filter(x => x.id !== t.id))} style={{ color: C.dim, marginLeft: 8 }}><X size={13} /></button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                  <label className="flex flex-col gap-0.5"><span style={{ color: C.dim }}>Sale fee £m</span>
                    <input type="number" value={t.saleFee} onChange={e => setOut(transfersOut.map(x => x.id === t.id ? { ...x, saleFee: parseFloat(e.target.value) || 0 } : x))} className="bg-transparent font-mono outline-none" style={{ color: C.text, borderBottom: `1px solid ${C.border}` }} /></label>
                  <label className="flex flex-col gap-0.5"><span style={{ color: C.dim }}>Yrs left</span>
                    <input type="number" value={t.yearsLeft} onChange={e => setOut(transfersOut.map(x => x.id === t.id ? { ...x, yearsLeft: parseFloat(e.target.value) || 0 } : x))} className="bg-transparent font-mono outline-none" style={{ color: C.text, borderBottom: `1px solid ${C.border}` }} /></label>
                  <label className="flex flex-col gap-0.5"><span style={{ color: C.dim }}>Orig fee £m</span>
                    <input type="number" value={t.originalFee} disabled={t.homegrown} onChange={e => setOut(transfersOut.map(x => x.id === t.id ? { ...x, originalFee: parseFloat(e.target.value) || 0 } : x))} className="bg-transparent font-mono outline-none disabled:opacity-50" style={{ color: C.text, borderBottom: `1px solid ${C.border}` }} /></label>
                  <label className="flex items-center gap-1.5 mt-3"><input type="checkbox" checked={t.homegrown} onChange={e => setOut(transfersOut.map(x => x.id === t.id ? { ...x, homegrown: e.target.checked, originalFee: e.target.checked ? 0 : x.originalFee } : x))} /><span style={{ color: C.muted }}>Homegrown</span></label>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle>Revenue Assumptions</SectionTitle>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-xs" style={{ color: C.text }}>Commercial revenue growth</span>
              <input type="number" value={revGrowth} onChange={e => setRevGrowth(parseFloat(e.target.value) || 0)}
                className="bg-transparent text-sm font-mono w-16 text-right outline-none" style={{ color: C.gold, borderBottom: `1px solid ${C.border}` }} />
            </label>
            <label className="flex items-center gap-2 text-xs" style={{ color: C.text }}>
              <input type="checkbox" checked={uefa} onChange={e => setUefa(e.target.checked)} />
              Qualified for UEFA competition (SCR threshold drops to 70%)
            </label>
          </div>
        </Card>
      </div>

      {/* IMPACT */}
      <div className="space-y-4">
        <Card>
          <SectionTitle>PSR Impact</SectionTitle>
          <div className="grid grid-cols-2 gap-2 text-[11px] mb-3">
            <div><span style={{ color: C.dim }}>Profit on sale</span><div className="text-base font-bold" style={{ color: C.green }}>+£{impact.profitOnSale.toFixed(1)}m</div></div>
            <div><span style={{ color: C.dim }}>Amortisation hit</span><div className="text-base font-bold" style={{ color: C.red }}>−£{impact.amortHit.toFixed(1)}m</div></div>
            <div><span style={{ color: C.dim }}>New wages</span><div className="text-base font-bold" style={{ color: C.red }}>−£{impact.wageHit.toFixed(1)}m</div></div>
            <div><span style={{ color: C.dim }}>Agent (amortised)</span><div className="text-base font-bold" style={{ color: C.red }}>−£{impact.agentHit.toFixed(1)}m</div></div>
          </div>
          <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(0,61,165,0.1)', border: '1px solid rgba(0,61,165,0.3)' }}>
            <div className="flex items-center justify-between">
              <span className="text-[11px]" style={{ color: C.muted }}>3-yr cumulative PSR</span>
              <span className="text-[11px] font-mono" style={{ color: C.dim }}>baseline −£68m</span>
            </div>
            <div className="text-2xl font-black mt-1" style={{ color: Math.abs(impact.psrCumulative) > PSR_LIMIT ? C.red : C.green }}>
              −£{Math.abs(impact.psrCumulative).toFixed(1)}m
            </div>
            <div className="text-[10px] mt-1" style={{ color: C.muted }}>
              Net impact: <span className="font-bold" style={{ color: impact.psrDelta >= 0 ? C.green : C.red }}>{impact.psrDelta >= 0 ? '+' : ''}£{impact.psrDelta.toFixed(1)}m</span> · Headroom: <span className="font-bold" style={{ color: C.green }}>£{(PSR_LIMIT - Math.abs(impact.psrCumulative)).toFixed(1)}m</span>
            </div>
          </div>
        </Card>

        <Card>
          <SectionTitle>SCR Impact</SectionTitle>
          <Gauge pct={impact.newScr} threshold={impact.threshold} label={`SCR vs ${impact.threshold}% threshold`} color={C.purple} />
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
            <div><span style={{ color: C.dim }}>New squad cost</span><div className="text-base font-bold" style={{ color: C.text }}>£{impact.newSquadCost.toFixed(1)}m</div></div>
            <div><span style={{ color: C.dim }}>New revenue</span><div className="text-base font-bold" style={{ color: C.text }}>£{impact.newRevenue.toFixed(1)}m</div></div>
          </div>
          {impact.newScr > impact.threshold && (
            <div className="mt-3 rounded-lg p-2.5 flex items-center gap-2" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <AlertTriangle size={14} style={{ color: C.red }} />
              <span className="text-[11px]" style={{ color: C.red }}>SCR breach — apply 30% multi-year allowance or reduce squad cost.</span>
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle>SSR Test Status (forward 12mo)</SectionTitle>
          <div className="space-y-1.5">
            {[
              { t: 'T1 · Sustainability', s: impact.psrDelta < -10 ? 'monitor' : 'pass' },
              { t: 'T2 · Wage / revenue',  s: impact.newScr > 80 ? 'monitor' : 'pass' },
              { t: 'T3 · Cost coverage',   s: impact.psrDelta < -20 ? 'fail' : impact.psrDelta < -5 ? 'monitor' : 'pass' },
            ].map(t => {
              const c = t.s === 'pass' ? C.green : t.s === 'monitor' ? C.amber : C.red
              return (
                <div key={t.t} className="flex items-center justify-between py-1">
                  <span className="text-xs" style={{ color: C.text }}>{t.t}</span>
                  <Pill color={c}>{t.s}</Pill>
                </div>
              )
            })}
          </div>
        </Card>

        <div className="flex gap-2">
          <button className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: C.primary, color: C.gold }}>Save Scenario</button>
          <button className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: C.cardAlt, color: C.muted, border: `1px solid ${C.border}` }}>Export PDF</button>
          <button className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: C.cardAlt, color: C.muted, border: `1px solid ${C.border}` }}>Share with Board</button>
        </div>
      </div>
    </div>
  )
}

// ─── AMORTISATION ────────────────────────────────────────────────────────────

const SQUAD_AMORT = [
  { player: 'Jordan Hayes',     fee: 0,    years: 0, end: 'Jun 2027', annual: 0,   bv: 0,   homegrown: true },
  { player: 'Tom Fletcher',      fee: 1.2,  years: 4, end: 'Jun 2027', annual: 0.30, bv: 0.30, homegrown: false },
  { player: 'Daniel Webb',       fee: 0.8,  years: 4, end: 'Jun 2027', annual: 0.20, bv: 0.20, homegrown: false },
  { player: 'Marcus Reid',      fee: 0,    years: 0, end: 'Jun 2026', annual: 0,   bv: 0,   homegrown: true },
  { player: 'Isaac Kemp',     fee: 0.6,  years: 4, end: 'Jun 2027', annual: 0.15, bv: 0.30, homegrown: false },
  { player: 'Liam Barker',     fee: 1.4,  years: 5, end: 'Jun 2027', annual: 0.28, bv: 0.56, homegrown: false },
  { player: 'Connor Walsh',         fee: 0,    years: 0, end: 'Jun 2026', annual: 0,   bv: 0,   homegrown: true },
  { player: 'Ryan Cole',     fee: 1.8,  years: 5, end: 'Jun 2027', annual: 0.36, bv: 0.72, homegrown: false },
  { player: 'Paul Granger',     fee: 0,    years: 0, end: 'Jun 2026', annual: 0,   bv: 0,   homegrown: true },
  { player: 'Myles Okafor',    fee: 4.5,  years: 4, end: 'Jun 2026', annual: 1.13, bv: 1.13, homegrown: false },
  { player: 'James Tilley',       fee: 1.6,  years: 4, end: 'Jun 2026', annual: 0.40, bv: 0.40, homegrown: false },
  { player: 'Dean Morris',       fee: 8.5,  years: 5, end: 'Jun 2027', annual: 1.70, bv: 3.40, homegrown: false },
  { player: 'Sam Porter',     fee: 3.2,  years: 4, end: 'Jun 2026', annual: 0.80, bv: 0.80, homegrown: false },
  { player: 'Chris Nwosu',         fee: 5.5,  years: 4, end: 'Jun 2026', annual: 1.38, bv: 1.38, homegrown: false },
  { player: 'Antwoine Rowe',  fee: 2.1,  years: 5, end: 'Jun 2027', annual: 0.42, bv: 0.84, homegrown: false },
]

function AmortisationTab() {
  const [filter, setFilter] = useState<'all' | 'homegrown' | 'signed' | 'rolling-off'>('all')
  const filtered = SQUAD_AMORT.filter(p => {
    if (filter === 'homegrown') return p.homegrown
    if (filter === 'signed') return !p.homegrown
    if (filter === 'rolling-off') return p.end === 'Jun 2026'
    return true
  })
  const totalAnnual = SQUAD_AMORT.reduce((s, p) => s + p.annual, 0)
  const totalBV = SQUAD_AMORT.reduce((s, p) => s + p.bv, 0)
  const rollingOffSoon = SQUAD_AMORT.filter(p => p.end === 'Jun 2026' && p.annual > 0).reduce((s, p) => s + p.annual, 0)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card><div className="text-[10px] uppercase tracking-wider" style={{ color: C.dim }}>Total annual amort</div><div className="text-2xl font-black mt-1" style={{ color: C.text }}>£{totalAnnual.toFixed(1)}m</div></Card>
        <Card><div className="text-[10px] uppercase tracking-wider" style={{ color: C.dim }}>Total book value</div><div className="text-2xl font-black mt-1" style={{ color: C.text }}>£{totalBV.toFixed(1)}m</div></Card>
        <Card><div className="text-[10px] uppercase tracking-wider" style={{ color: C.dim }}>Rolling off Jun 2026</div><div className="text-2xl font-black mt-1" style={{ color: C.green }}>£{rollingOffSoon.toFixed(1)}m</div><div className="text-[10px] mt-1" style={{ color: C.muted }}>PSR/SCR relief incoming</div></Card>
      </div>

      <Card>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <SectionTitle>5-Year Forward Amortisation Schedule</SectionTitle>
          <div className="flex gap-1">
            {(['all','homegrown','signed','rolling-off'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider"
                style={{ backgroundColor: filter === f ? C.primary : C.cardAlt, color: filter === f ? C.gold : C.muted, border: `1px solid ${C.border}` }}>
                {f.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.muted }}>
              <th className="text-left px-2 py-2 font-semibold uppercase tracking-wider text-[10px]">Player</th>
              <th className="text-left px-2 py-2 font-semibold uppercase tracking-wider text-[10px]">Fee</th>
              <th className="text-left px-2 py-2 font-semibold uppercase tracking-wider text-[10px]">Length</th>
              <th className="text-left px-2 py-2 font-semibold uppercase tracking-wider text-[10px]">Contract end</th>
              <th className="text-left px-2 py-2 font-semibold uppercase tracking-wider text-[10px]">Annual amort</th>
              <th className="text-left px-2 py-2 font-semibold uppercase tracking-wider text-[10px]">Book value</th>
              <th className="text-left px-2 py-2 font-semibold uppercase tracking-wider text-[10px]">Type</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.player} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td className="px-2 py-2 font-semibold" style={{ color: C.text }}>{p.player}</td>
                <td className="px-2 py-2 font-mono" style={{ color: C.gold }}>£{p.fee.toFixed(1)}m</td>
                <td className="px-2 py-2 font-mono" style={{ color: C.muted }}>{p.years || '—'} yr</td>
                <td className="px-2 py-2 font-mono" style={{ color: p.end === 'Jun 2026' ? C.amber : C.muted }}>{p.end}</td>
                <td className="px-2 py-2 font-mono" style={{ color: C.text }}>£{p.annual.toFixed(2)}m</td>
                <td className="px-2 py-2 font-mono" style={{ color: C.muted }}>£{p.bv.toFixed(2)}m</td>
                <td className="px-2 py-2">{p.homegrown ? <Pill color={C.green}>Homegrown</Pill> : <Pill color={C.blue}>Signed</Pill>}</td>
              </tr>
            ))}
            <tr style={{ borderTop: `2px solid ${C.gold}` }}>
              <td className="px-2 py-2 font-bold" style={{ color: C.gold }}>TOTAL ({filtered.length})</td>
              <td colSpan={3} />
              <td className="px-2 py-2 font-mono font-bold" style={{ color: C.gold }}>£{filtered.reduce((s, p) => s + p.annual, 0).toFixed(2)}m</td>
              <td className="px-2 py-2 font-mono font-bold" style={{ color: C.gold }}>£{filtered.reduce((s, p) => s + p.bv, 0).toFixed(2)}m</td>
              <td />
            </tr>
          </tbody>
        </table>
      </Card>
    </div>
  )
}

// ─── PROJECTIONS ─────────────────────────────────────────────────────────────

function ProjectionsTab() {
  const [revG, setRevG] = useState(6)
  const [wageInf, setWageInf] = useState(4)
  const [outcome, setOutcome] = useState<'stay' | 'promotion' | 'relegation'>('stay')
  const [uefa, setUefa] = useState(false)
  const [stadiumCapex, setStadiumCapex] = useState(8)
  const [academy, setAcademy] = useState(8.5)

  const projection = useMemo(() => {
    const baseRev = SCR_REVENUE
    const outcomeMult = outcome === 'promotion' ? 1.45 : outcome === 'relegation' ? 0.55 : 1.0
    const years = [1, 2, 3].map(y => {
      const rev    = baseRev * Math.pow(1 + revG/100, y) * (y === 1 ? 1 : outcomeMult)
      const wages  = SCR_SQUAD_COST * Math.pow(1 + wageInf/100, y)
      const scr    = (wages / rev) * 100
      // PSR for the year — simplistic
      const grossLoss = wages - rev * 0.85
      const carveOuts = academy + stadiumCapex
      const psrYear = -grossLoss + carveOuts
      return { year: `Yr ${y}`, rev, wages, scr, psrYear }
    })
    const psrCumulative = years.reduce((s, y) => s + y.psrYear, 0)
    const threshold = uefa ? SCR_UEFA_THRESHOLD : SCR_THRESHOLD
    const breachYears = years.filter(y => y.scr > threshold).length
    const psrBreach = Math.abs(psrCumulative) > PSR_LIMIT
    return { years, psrCumulative, threshold, breachYears, psrBreach }
  }, [revG, wageInf, outcome, uefa, stadiumCapex, academy])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="space-y-4">
        <Card>
          <SectionTitle>Assumptions (editable)</SectionTitle>
          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between"><span style={{ color: C.text }}>Revenue growth %</span>
              <input type="number" value={revG} onChange={e => setRevG(parseFloat(e.target.value) || 0)} className="bg-transparent font-mono w-16 text-right outline-none" style={{ color: C.gold, borderBottom: `1px solid ${C.border}` }} /></label>
            <label className="flex items-center justify-between"><span style={{ color: C.text }}>Wage inflation %</span>
              <input type="number" value={wageInf} onChange={e => setWageInf(parseFloat(e.target.value) || 0)} className="bg-transparent font-mono w-16 text-right outline-none" style={{ color: C.gold, borderBottom: `1px solid ${C.border}` }} /></label>
            <label className="flex items-center justify-between"><span style={{ color: C.text }}>League outcome</span>
              <select value={outcome} onChange={e => setOutcome(e.target.value as typeof outcome)}
                className="bg-transparent text-right outline-none" style={{ color: C.gold, borderBottom: `1px solid ${C.border}` }}>
                <option value="stay">Stay in division</option>
                <option value="promotion">Promotion</option>
                <option value="relegation">Relegation</option>
              </select></label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={uefa} onChange={e => setUefa(e.target.checked)} /><span style={{ color: C.text }}>UEFA qualification (SCR threshold drops to 70%)</span></label>
            <label className="flex items-center justify-between"><span style={{ color: C.text }}>Stadium capex / yr (£m, PSR-deductible)</span>
              <input type="number" value={stadiumCapex} onChange={e => setStadiumCapex(parseFloat(e.target.value) || 0)} className="bg-transparent font-mono w-16 text-right outline-none" style={{ color: C.gold, borderBottom: `1px solid ${C.border}` }} /></label>
            <label className="flex items-center justify-between"><span style={{ color: C.text }}>Academy spend / yr (£m, PSR-deductible)</span>
              <input type="number" value={academy} onChange={e => setAcademy(parseFloat(e.target.value) || 0)} className="bg-transparent font-mono w-16 text-right outline-none" style={{ color: C.gold, borderBottom: `1px solid ${C.border}` }} /></label>
          </div>
        </Card>

        <Card>
          <SectionTitle>Quick Question</SectionTitle>
          <div className="rounded-lg p-3" style={{ backgroundColor: C.cardAlt, border: `1px solid ${C.border}` }}>
            <div className="text-[11px]" style={{ color: C.dim }}>What's the latest we can sign a £25m striker (5yr deal, £4m/yr wages) without breaching?</div>
            <div className="text-base font-bold mt-2" style={{ color: C.green }}>Window: Jul 2026 onwards</div>
            <div className="text-[11px] mt-1" style={{ color: C.muted }}>Two senior contracts roll off Jun 2026 (£2.5m amort relief), creating headroom.</div>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <SectionTitle>3-Year PSR Projection</SectionTitle>
          <div className="space-y-2">
            {projection.years.map((y, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5" style={{ borderBottom: i < 2 ? `1px solid ${C.border}` : undefined }}>
                <span className="text-xs font-bold w-12 shrink-0" style={{ color: C.gold }}>{y.year}</span>
                <div className="flex-1">
                  <div className="text-[11px]" style={{ color: C.muted }}>PSR contribution: <span className="font-mono font-bold" style={{ color: y.psrYear < 0 ? C.red : C.green }}>{y.psrYear >= 0 ? '+' : ''}£{y.psrYear.toFixed(1)}m</span></div>
                  <div className="h-1.5 rounded-full mt-1 overflow-hidden" style={{ backgroundColor: C.border }}>
                    <div className="h-full" style={{ width: `${Math.min(100, Math.abs(y.psrYear) / 35 * 100)}%`, backgroundColor: y.psrYear < 0 ? C.red : C.green }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-lg p-3 flex items-center gap-2"
            style={{ backgroundColor: projection.psrBreach ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)', border: `1px solid ${projection.psrBreach ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}` }}>
            {projection.psrBreach ? <AlertTriangle size={14} style={{ color: C.red }} /> : <CheckCircle2 size={14} style={{ color: C.green }} />}
            <span className="text-[11px]" style={{ color: projection.psrBreach ? C.red : C.green }}>
              3-yr cumulative: −£{Math.abs(projection.psrCumulative).toFixed(1)}m of £{PSR_LIMIT}m limit · {projection.psrBreach ? 'BREACH' : 'within limit'}
            </span>
          </div>
        </Card>

        <Card>
          <SectionTitle>3-Year SCR Projection</SectionTitle>
          <div className="space-y-3">
            {projection.years.map((y, i) => (
              <Gauge key={i} pct={y.scr} threshold={projection.threshold} label={y.year} color={C.purple} />
            ))}
          </div>
          {projection.breachYears > 0 && (
            <div className="mt-3 rounded-lg p-2.5 flex items-center gap-2" style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <AlertTriangle size={14} style={{ color: C.red }} />
              <span className="text-[11px]" style={{ color: C.red }}>{projection.breachYears} of 3 years breach {projection.threshold}% threshold.</span>
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle>Sensitivity</SectionTitle>
          <div className="space-y-1.5 text-[11px]">
            {[
              { v: '-15%', impact: 'Tight — likely PSR breach Yr 2', c: C.red },
              { v: '-10%', impact: 'PSR pressure · SCR Yr 3 over threshold', c: C.amber },
              { v: '-5%',  impact: 'Within limits · headroom thin', c: C.amber },
              { v: 'Base', impact: 'Within both PSR and SCR', c: C.green },
              { v: '+5%',  impact: 'Comfortable headroom', c: C.green },
              { v: '+10%', impact: 'Strong position · UEFA buffer', c: C.green },
              { v: '+15%', impact: 'Very strong · accelerated investment possible', c: C.green },
            ].map((r, i) => (
              <div key={i} className="flex items-center gap-3 py-1" style={{ borderBottom: i < 6 ? `1px solid ${C.border}` : undefined }}>
                <span className="font-mono w-12 shrink-0" style={{ color: C.gold }}>{r.v}</span>
                <span className="flex-1" style={{ color: C.muted }}>{r.impact}</span>
                <Pill color={r.c}>{r.c === C.green ? 'OK' : r.c === C.amber ? 'Watch' : 'Risk'}</Pill>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

// ─── CARVE-OUTS ──────────────────────────────────────────────────────────────

function CarveOutsTab() {
  const carveOuts = [
    { title: "Women's Football Expenditure", icon: '🚺', current: 4.2, threeYr: 11.6, docs: 'complete', color: C.green, note: 'Salaries + travel + facilities for women\'s programme' },
    { title: 'Youth Development / Academy',   icon: '🎓', current: 8.5, threeYr: 23.4, docs: 'complete', color: C.green, note: 'EPPP Cat 2 spend, scholarship costs, age-group programmes' },
    { title: 'Community Development',         icon: '❤️', current: 1.1, threeYr: 3.2,  docs: 'partial',  color: C.amber, note: 'Foundation grants, schools programmes, fan engagement events' },
    { title: 'Infrastructure / Tangible Asset Depreciation', icon: '🏟️', current: 6.0, threeYr: 18.0, docs: 'complete', color: C.green, note: 'Stadium, training ground, equipment depreciation' },
  ]
  const totalCurrent = carveOuts.reduce((s, c) => s + c.current, 0)
  const totalThreeYr = carveOuts.reduce((s, c) => s + c.threeYr, 0)

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <SectionTitle>PSR Allowable Deductions</SectionTitle>
            <p className="text-[11px]" style={{ color: C.muted }}>Premier League PSR rules permit specific costs to be deducted from the calculation. Each requires invoice trail for compliance audit.</p>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider" style={{ color: C.dim }}>Total deductions</div>
            <div className="text-2xl font-black" style={{ color: C.green }}>£{totalCurrent.toFixed(1)}m</div>
            <div className="text-[10px]" style={{ color: C.muted }}>Current year · £{totalThreeYr.toFixed(1)}m over 3yr</div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {carveOuts.map(c => (
          <div key={c.title} className="rounded-xl p-5" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{c.icon}</span>
                <div className="text-sm font-bold" style={{ color: C.text }}>{c.title}</div>
              </div>
              <Pill color={c.color}>{c.docs} docs</Pill>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider" style={{ color: C.dim }}>Current year</div>
                <div className="text-xl font-black mt-1" style={{ color: C.text }}>£{c.current.toFixed(1)}m</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider" style={{ color: C.dim }}>3-yr cumulative</div>
                <div className="text-xl font-black mt-1" style={{ color: C.gold }}>£{c.threeYr.toFixed(1)}m</div>
              </div>
            </div>
            <div className="text-[11px]" style={{ color: C.muted }}>{c.note}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── AUDIT TRAIL ─────────────────────────────────────────────────────────────

const AUDIT_LOG = [
  { date: '14 Apr 2026', type: 'Scenario', action: 'Ran scenario: Sign £30m striker / sell academy graduate £18m', who: 'Dr Reeves (DoF)', psr: '+£6.0m', scr: '+3.0pp' },
  { date: '08 Apr 2026', type: 'Sale',     action: 'Loan recall + sale: M. Sutton to Northgate City', who: 'Dr Reeves (DoF) · Board approved', psr: '+£8.5m', scr: '−1.2pp' },
  { date: '02 Apr 2026', type: 'Sign',     action: 'Contract extension: Dean Morris · 4yr · £55k/wk', who: 'Manager + DoF · CFO sign-off', psr: '−£3.4m', scr: '+0.8pp' },
  { date: '24 Mar 2026', type: 'Carve-out', action: 'Logged Foundation grant invoice — £180k (Community)', who: 'CFO', psr: '+£0.18m', scr: '—' },
  { date: '12 Mar 2026', type: 'Audit',    action: 'PL PSR Q3 self-assessment submitted', who: 'CFO + Board Chair', psr: '—', scr: '—' },
  { date: '02 Mar 2026', type: 'Sign',     action: 'New signing: Marcos Pereira (£12m, 5yr, £35k/wk)', who: 'Board approved', psr: '−£3.6m', scr: '+1.7pp' },
  { date: '18 Feb 2026', type: 'Sale',     action: 'Sold Owen Hartley to Crown Park Galaxy · £14m (homegrown · pure profit)', who: 'DoF · CFO', psr: '+£14.0m', scr: '−0.6pp' },
  { date: '04 Feb 2026', type: 'Audit',    action: 'Independent audit — Foundation invoice trail reconciled', who: 'KPMG external · CFO', psr: '—', scr: '—' },
  { date: '14 Jan 2026', type: 'Scenario', action: 'Scenario run: Promotion + UEFA · 70% SCR threshold modelling', who: 'CFO + Chair', psr: '—', scr: '—' },
  { date: '02 Jan 2026', type: 'Carve-out', action: 'Stadium north stand depreciation logged · £1.5m', who: 'CFO', psr: '+£1.5m', scr: '—' },
  { date: '14 Dec 2025', type: 'Sign',     action: 'Loan in: A. Rivera from Northgate City', who: 'DoF', psr: '−£0.4m', scr: '+0.4pp' },
  { date: '02 Dec 2025', type: 'Audit',    action: 'PL PSR Q1 self-assessment submitted', who: 'CFO', psr: '—', scr: '—' },
]

function AuditTab() {
  const [filter, setFilter] = useState<'all' | 'Scenario' | 'Sign' | 'Sale' | 'Carve-out' | 'Audit'>('all')
  const filtered = AUDIT_LOG.filter(a => filter === 'all' || a.type === filter)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 flex-wrap">
          {(['all', 'Scenario', 'Sign', 'Sale', 'Carve-out', 'Audit'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider"
              style={{ backgroundColor: filter === f ? C.primary : C.cardAlt, color: filter === f ? C.gold : C.muted, border: `1px solid ${C.border}` }}>
              {f}
            </button>
          ))}
        </div>
        <button className="px-3 py-1.5 rounded-lg text-[11px] font-semibold" style={{ backgroundColor: C.gold, color: '#000' }}>
          Generate FFP/SCR Submission Pack
        </button>
      </div>

      <Card>
        <SectionTitle>Compliance Decision Audit Trail</SectionTitle>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.muted }}>
              <th className="text-left px-2 py-2 font-semibold uppercase tracking-wider text-[10px]">Date</th>
              <th className="text-left px-2 py-2 font-semibold uppercase tracking-wider text-[10px]">Type</th>
              <th className="text-left px-2 py-2 font-semibold uppercase tracking-wider text-[10px]">Action</th>
              <th className="text-left px-2 py-2 font-semibold uppercase tracking-wider text-[10px]">Approved By</th>
              <th className="text-left px-2 py-2 font-semibold uppercase tracking-wider text-[10px]">PSR</th>
              <th className="text-left px-2 py-2 font-semibold uppercase tracking-wider text-[10px]">SCR</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a, i) => {
              const typeColor = a.type === 'Sign' ? C.red : a.type === 'Sale' ? C.green : a.type === 'Scenario' ? C.purple : a.type === 'Carve-out' ? C.gold : C.blue
              const psrColor = a.psr.startsWith('+') ? C.green : a.psr.startsWith('−') ? C.red : C.muted
              return (
                <tr key={i} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : undefined }}>
                  <td className="px-2 py-2.5 font-mono" style={{ color: C.gold }}>{a.date}</td>
                  <td className="px-2 py-2.5"><Pill color={typeColor}>{a.type}</Pill></td>
                  <td className="px-2 py-2.5" style={{ color: C.text }}>{a.action}</td>
                  <td className="px-2 py-2.5" style={{ color: C.muted }}>{a.who}</td>
                  <td className="px-2 py-2.5 font-mono" style={{ color: psrColor }}>{a.psr}</td>
                  <td className="px-2 py-2.5 font-mono" style={{ color: a.scr.startsWith('+') ? C.red : a.scr.startsWith('−') ? C.green : C.muted }}>{a.scr}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

export default function PSRScenarioModellerView({ club }: { club?: { name?: string } | null }) {
  const [tab, setTab] = useState<Tab>('current')

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: C.text }}>
          <Calculator size={20} style={{ color: C.primary }} /> PSR / SCR Modeller — {club?.name || 'Oakridge FC'}
        </h2>
        <p className="text-sm mt-1" style={{ color: C.muted }}>
          Models current PSR (3yr rolling £105m) and incoming SCR (85% squad cost ratio · 70% UEFA · 30% multi-year allowance) in parallel · transition window 2025/26 → 2026/27
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5"
            style={{ backgroundColor: tab === t.id ? C.gold : C.cardAlt, color: tab === t.id ? '#000' : C.muted, border: tab === t.id ? 'none' : `1px solid ${C.border}` }}>
            <t.icon size={13} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'current'      && <CurrentPositionTab />}
      {tab === 'scenario'     && <ScenarioModellerTab />}
      {tab === 'amortisation' && <AmortisationTab />}
      {tab === 'projections'  && <ProjectionsTab />}
      {tab === 'carve-outs'   && <CarveOutsTab />}
      {tab === 'audit'        && <AuditTab />}
    </div>
  )
}
