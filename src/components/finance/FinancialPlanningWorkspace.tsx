'use client'

import { useState, useMemo } from 'react'
import { Calculator, LineChart, PieChart, Sparkles, TrendingUp, TrendingDown } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────
// All-in-one Financial Planning workspace — shared by the Men's Pro and
// Women's portals (accent-parameterized + data via a FinanceProfile).
//
//   1. Scenario modeller  — sliders (attendance, sponsorship, promotion/
//      relegation, player sale) recompute revenue, costs, net, wage ratio,
//      cash runway and PSR/FSR headroom live.
//   2. Cash-flow & budget — 12-month cash-flow forecast + budget vs actual.
//   3. P&L dashboard      — revenue streams, cost centres, wage-ratio gauge,
//      break-even.
//
// Demo only — all figures illustrative.
// ─────────────────────────────────────────────────────────────────────────

export type FinanceProfile = {
  unit: 'M' | 'k'                 // display unit (millions or thousands)
  revenue: { label: string; amount: number }[]
  costs: { label: string; amount: number }[]
  wageBill: number
  cashOnHand: number
  monthlyNet: number              // average monthly surplus/deficit (+/-)
  regLabel: 'PSR' | 'FSR'
  wageCapPct: number              // sustainability wage-to-revenue cap (e.g. 65 or 80)
  lossAllowance: number           // 3-yr loss allowance headroom (same unit)
  lossUsed: number                // of the allowance, used so far
  cashFlow: { m: string; inflow: number; outflow: number }[]
  budgets: { dept: string; budget: number; actual: number }[]
  promoUplift: number             // promotion revenue uplift fraction (e.g. 0.6)
  relegationHit: number           // relegation revenue hit fraction (e.g. 0.4)
}

const G = {
  panel: '#0D1117', panelAlt: '#111318', border: '#1F2937',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280',
  good: '#22C55E', warn: '#F59E0B', bad: '#EF4444',
}

export default function FinancialPlanningWorkspace({ accent, profile }: { accent: string; profile: FinanceProfile }) {
  const [tab, setTab] = useState<'scenario' | 'cashflow' | 'pnl'>('scenario')
  const u = profile.unit
  const money = (n: number) => `£${n % 1 === 0 ? n.toLocaleString('en-GB') : n.toFixed(1)}${u}`
  const baseRevenue = profile.revenue.reduce((s, r) => s + r.amount, 0)
  const baseCosts = profile.costs.reduce((s, c) => s + c.amount, 0)

  const tabs = [
    { id: 'scenario' as const, label: 'Scenario Modeller', icon: Calculator },
    { id: 'cashflow' as const, label: 'Cash-flow & Budget', icon: LineChart },
    { id: 'pnl' as const, label: 'P&L Dashboard', icon: PieChart },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: G.text }}>
          <Calculator size={18} style={{ color: accent }} /> Financial Planning
        </h2>
        <p className="text-sm mt-1" style={{ color: G.text3 }}>Scenario modelling, cash-flow forecasting and live P&amp;L — for the finance team and the board.</p>
      </div>

      <div className="flex gap-1 border-b" style={{ borderColor: G.border }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className="px-4 py-2 text-xs font-semibold flex items-center gap-1.5 -mb-px transition-all"
            style={{ borderBottom: `2px solid ${tab === t.id ? accent : 'transparent'}`, color: tab === t.id ? accent : G.text4 }}>
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'scenario' && <Scenario accent={accent} profile={profile} baseRevenue={baseRevenue} baseCosts={baseCosts} money={money} />}
      {tab === 'cashflow' && <CashFlow accent={accent} profile={profile} money={money} />}
      {tab === 'pnl' && <PnL accent={accent} profile={profile} baseRevenue={baseRevenue} baseCosts={baseCosts} money={money} />}
    </div>
  )
}

// ─── Scenario modeller ───────────────────────────────────────────────────
function Scenario({ accent, profile, baseRevenue, baseCosts, money }: { accent: string; profile: FinanceProfile; baseRevenue: number; baseCosts: number; money: (n: number) => string }) {
  const [attendance, setAttendance] = useState(0)     // -20..+20 %
  const [sponsor, setSponsor] = useState(0)           // -10..+30 %
  const [division, setDivision] = useState<'stay' | 'promoted' | 'relegated'>('stay')
  const [playerSale, setPlayerSale] = useState(0)     // one-off, in unit

  const r = useMemo(() => {
    const matchday = profile.revenue.find(x => /match/i.test(x.label))?.amount ?? 0
    const commercial = profile.revenue.find(x => /comm|sponsor/i.test(x.label))?.amount ?? 0
    let revenue = baseRevenue + matchday * (attendance / 100) + commercial * (sponsor / 100)
    let costs = baseCosts
    if (division === 'promoted') { revenue *= (1 + profile.promoUplift); costs *= 1.25 }
    if (division === 'relegated') { revenue *= (1 - profile.relegationHit); costs *= 0.9 }
    const net = revenue - costs + playerSale
    const wageRatio = (profile.wageBill / revenue) * 100
    const runwayMonths = profile.monthlyNet + playerSale / 12 >= 0 ? 99 : Math.max(0, profile.cashOnHand / Math.abs(profile.monthlyNet + (net - (baseRevenue - baseCosts)) / 12))
    const headroom = profile.lossAllowance - profile.lossUsed + net
    return { revenue, costs, net, wageRatio, runwayMonths, headroom }
  }, [attendance, sponsor, division, playerSale, profile, baseRevenue, baseCosts])

  const baseNet = baseRevenue - baseCosts
  const Slider = ({ label, value, setValue, min, max, suffix }: { label: string; value: number; setValue: (n: number) => void; min: number; max: number; suffix: string }) => (
    <div>
      <div className="flex justify-between text-xs mb-1.5"><span style={{ color: G.text3 }}>{label}</span><span className="font-bold" style={{ color: accent }}>{value > 0 ? '+' : ''}{value}{suffix}</span></div>
      <input type="range" min={min} max={max} value={value} onChange={e => setValue(Number(e.target.value))} className="w-full" style={{ accentColor: accent }} />
    </div>
  )
  const Out = ({ label, value, delta, tone }: { label: string; value: string; delta?: string; tone?: string }) => (
    <div className="rounded-xl p-3.5" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
      <div className="text-[10px] uppercase tracking-wider" style={{ color: G.text4 }}>{label}</div>
      <div className="text-lg font-black mt-1" style={{ color: tone ?? G.text }}>{value}</div>
      {delta && <div className="text-[10px] mt-0.5" style={{ color: G.text4 }}>{delta}</div>}
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="rounded-xl p-3 text-[11px] flex items-center gap-2" style={{ background: `${accent}12`, borderLeft: `3px solid ${accent}`, color: G.text2 }}>
        <Sparkles size={14} style={{ color: accent }} /> Move the levers to see the impact on revenue, the {profile.regLabel} position and your cash runway — instantly. Figures are illustrative.
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-xl p-5 space-y-4" style={{ backgroundColor: G.panelAlt, border: `1px solid ${G.border}` }}>
          <h3 className="text-sm font-bold" style={{ color: G.text }}>Assumptions</h3>
          <Slider label="Average attendance" value={attendance} setValue={setAttendance} min={-20} max={20} suffix="%" />
          <Slider label="Sponsorship / commercial" value={sponsor} setValue={setSponsor} min={-10} max={30} suffix="%" />
          <div>
            <div className="text-xs mb-1.5" style={{ color: G.text3 }}>Division outcome</div>
            <div className="flex gap-1.5">
              {(['relegated', 'stay', 'promoted'] as const).map(d => (
                <button key={d} onClick={() => setDivision(d)} className="flex-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold capitalize" style={{ background: division === d ? accent : 'rgba(255,255,255,0.05)', color: division === d ? '#fff' : G.text4 }}>{d}</button>
              ))}
            </div>
          </div>
          <Slider label={`One-off player sale (${profile.unit === 'M' ? '£m' : '£k'})`} value={playerSale} setValue={setPlayerSale} min={0} max={profile.unit === 'M' ? 20 : 400} suffix={profile.unit === 'M' ? 'm' : 'k'} />
        </div>
        <div className="grid grid-cols-2 gap-3 content-start">
          <Out label="Projected revenue" value={money(r.revenue)} delta={`base ${money(baseRevenue)}`} />
          <Out label="Projected costs" value={money(r.costs)} delta={`base ${money(baseCosts)}`} />
          <Out label="Net result" value={`${r.net >= 0 ? '+' : ''}${money(r.net)}`} delta={`base ${baseNet >= 0 ? '+' : ''}${money(baseNet)}`} tone={r.net >= 0 ? G.good : G.bad} />
          <Out label="Wage / revenue" value={`${r.wageRatio.toFixed(0)}%`} delta={`cap ${profile.wageCapPct}%`} tone={r.wageRatio <= profile.wageCapPct ? G.good : G.bad} />
          <Out label="Cash runway" value={r.runwayMonths >= 99 ? 'Sustainable' : `${r.runwayMonths.toFixed(0)} mo`} tone={r.runwayMonths >= 12 ? G.good : G.warn} />
          <Out label={`${profile.regLabel} headroom`} value={`${r.headroom >= 0 ? '+' : ''}${money(r.headroom)}`} delta={`3-yr allowance`} tone={r.headroom >= 0 ? G.good : G.bad} />
        </div>
      </div>
    </div>
  )
}

// ─── Cash-flow & budget ──────────────────────────────────────────────────
function CashFlow({ accent, profile, money }: { accent: string; profile: FinanceProfile; money: (n: number) => string }) {
  const cf = profile.cashFlow
  const maxV = Math.max(...cf.map(c => Math.max(c.inflow, c.outflow)))
  let running = profile.cashOnHand
  const runway = cf.map(c => { running += c.inflow - c.outflow; return running })
  const lowest = Math.min(...runway)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[['Cash on hand', money(profile.cashOnHand), G.text], ['Avg monthly net', `${profile.monthlyNet >= 0 ? '+' : ''}${money(profile.monthlyNet)}`, profile.monthlyNet >= 0 ? G.good : G.bad], ['Lowest projected cash', money(lowest), lowest >= 0 ? G.good : G.bad], ['12-mo close', money(runway[runway.length - 1]), accent]].map(([l, v, c]) => (
          <div key={l} className="rounded-xl p-3.5" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}><div className="text-[10px] uppercase tracking-wider" style={{ color: G.text4 }}>{l}</div><div className="text-lg font-black mt-1" style={{ color: c }}>{v}</div></div>
        ))}
      </div>

      <div className="rounded-xl p-5" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
        <h3 className="text-sm font-bold mb-4" style={{ color: G.text }}>12-month cash-flow forecast</h3>
        <div className="flex items-end gap-1.5" style={{ height: 160 }}>
          {cf.map((c, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-0.5" title={`${c.m}: in ${money(c.inflow)} / out ${money(c.outflow)}`}>
              <div className="w-full flex items-end justify-center gap-0.5" style={{ height: 130 }}>
                <div style={{ width: '45%', height: `${(c.inflow / maxV) * 100}%`, background: accent, borderRadius: '2px 2px 0 0' }} />
                <div style={{ width: '45%', height: `${(c.outflow / maxV) * 100}%`, background: G.text4, borderRadius: '2px 2px 0 0' }} />
              </div>
              <span className="text-[8px]" style={{ color: G.text4 }}>{c.m}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-3 text-[10px]" style={{ color: G.text4 }}>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: accent }} /> Inflow</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: G.text4 }} /> Outflow</span>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
        <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${G.border}` }}><h3 className="text-sm font-bold" style={{ color: G.text }}>Budget vs actual — by department</h3></div>
        <table className="w-full text-xs"><thead><tr style={{ color: G.text4, borderBottom: `1px solid ${G.border}` }}><th className="text-left px-4 py-2.5 font-semibold">Department</th><th className="text-right px-4 py-2.5 font-semibold">Budget</th><th className="text-right px-4 py-2.5 font-semibold">Actual / forecast</th><th className="text-right px-4 py-2.5 font-semibold">Variance</th></tr></thead>
          <tbody>{profile.budgets.map((b, i) => { const v = b.budget - b.actual; return (
            <tr key={i} style={{ borderBottom: `1px solid ${G.border}80` }}><td className="px-4 py-2.5 font-medium" style={{ color: G.text2 }}>{b.dept}</td><td className="px-4 py-2.5 text-right" style={{ color: G.text3 }}>{money(b.budget)}</td><td className="px-4 py-2.5 text-right" style={{ color: G.text3 }}>{money(b.actual)}</td><td className="px-4 py-2.5 text-right font-semibold" style={{ color: v >= 0 ? G.good : G.bad }}>{v >= 0 ? '+' : ''}{money(v)}</td></tr>
          ) })}</tbody>
        </table>
      </div>
    </div>
  )
}

// ─── P&L dashboard ───────────────────────────────────────────────────────
function PnL({ accent, profile, baseRevenue, baseCosts, money }: { accent: string; profile: FinanceProfile; baseRevenue: number; baseCosts: number; money: (n: number) => string }) {
  const net = baseRevenue - baseCosts
  const wageRatio = (profile.wageBill / baseRevenue) * 100
  const breakEven = profile.wageBill / (baseRevenue / baseCosts) // illustrative
  const maxR = Math.max(...profile.revenue.map(r => r.amount))
  const maxC = Math.max(...profile.costs.map(c => c.amount))

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[['Revenue', money(baseRevenue), accent, <TrendingUp size={14} key="a" />], ['Operating cost', money(baseCosts), G.text4, <TrendingDown size={14} key="b" />], ['Net result', `${net >= 0 ? '+' : ''}${money(net)}`, net >= 0 ? G.good : G.bad, null], ['Wage / revenue', `${wageRatio.toFixed(0)}%`, wageRatio <= profile.wageCapPct ? G.good : G.bad, null]].map(([l, v, c]) => (
          <div key={l as string} className="rounded-xl p-3.5" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}><div className="text-[10px] uppercase tracking-wider" style={{ color: G.text4 }}>{l}</div><div className="text-lg font-black mt-1" style={{ color: c as string }}>{v}</div></div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: G.text }}>Revenue streams</h3>
          <div className="space-y-2.5">{profile.revenue.map(r => (
            <div key={r.label}><div className="flex justify-between text-xs mb-1"><span style={{ color: G.text3 }}>{r.label}</span><span className="font-bold" style={{ color: G.text }}>{money(r.amount)}</span></div><div className="w-full rounded-full h-1.5" style={{ background: G.border }}><div className="h-1.5 rounded-full" style={{ width: `${(r.amount / maxR) * 100}%`, background: accent }} /></div></div>
          ))}</div>
        </div>
        <div className="rounded-xl p-5" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: G.text }}>Cost centres</h3>
          <div className="space-y-2.5">{profile.costs.map(c => (
            <div key={c.label}><div className="flex justify-between text-xs mb-1"><span style={{ color: G.text3 }}>{c.label}</span><span className="font-bold" style={{ color: G.text }}>{money(c.amount)}</span></div><div className="w-full rounded-full h-1.5" style={{ background: G.border }}><div className="h-1.5 rounded-full" style={{ width: `${(c.amount / maxC) * 100}%`, background: G.text4 }} /></div></div>
          ))}</div>
        </div>
      </div>

      <div className="rounded-xl p-5" style={{ backgroundColor: G.panel, border: `1px solid ${G.border}` }}>
        <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-bold" style={{ color: G.text }}>Sustainability — {profile.regLabel}</h3><span className="text-[11px]" style={{ color: G.text4 }}>Wage cap {profile.wageCapPct}% · break-even ~{money(breakEven)}</span></div>
        <div className="w-full rounded-full h-3 overflow-hidden" style={{ background: G.border }}>
          <div className="h-3 rounded-full" style={{ width: `${Math.min(100, (wageRatio / profile.wageCapPct) * 100)}%`, background: wageRatio <= profile.wageCapPct ? G.good : G.bad }} />
        </div>
        <div className="flex justify-between text-[10px] mt-1.5" style={{ color: G.text4 }}><span>Wage/revenue {wageRatio.toFixed(0)}%</span><span>Cap {profile.wageCapPct}%</span></div>
        <p className="text-[11px] mt-3" style={{ color: G.text3 }}>3-year {profile.regLabel} allowance: {money(profile.lossAllowance)} · used {money(profile.lossUsed)} · headroom <span style={{ color: G.good }}>{money(profile.lossAllowance - profile.lossUsed)}</span>.</p>
      </div>
    </div>
  )
}
