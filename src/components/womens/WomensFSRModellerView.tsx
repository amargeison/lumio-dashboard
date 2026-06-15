'use client'

import { useState } from 'react'
import { LayoutDashboard, Activity, Calculator, Layers, TrendingUp, ShieldCheck, FileText } from 'lucide-react'

// Women's — FSR Compliance Dashboard. Mirrors the men's PSR SCR Dashboard tab
// structure (Dashboard · Current Position · Scenario · Amortisation · Multi-
// Year · Carve-Outs · Audit) but FSR-flavoured (WSL 80% wage cap, £1.5m 3-yr
// loss envelope, relevant-revenue attribution). Demo only.

const C = {
  panel: '#0D1117', panelAlt: '#111318', border: '#1F2937',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280',
  pink: '#EC4899', pinkDeep: '#BE185D', good: '#22C55E', amber: '#F59E0B', red: '#EF4444', blue: '#3B82F6', purple: '#8B5CF6',
}
type Tab = 'dashboard' | 'current' | 'scenario' | 'amortisation' | 'projections' | 'carve-outs' | 'audit'
const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'current', label: 'Current Position', icon: Activity },
  { id: 'scenario', label: 'Scenario Modeller', icon: Calculator },
  { id: 'amortisation', label: 'Amortisation', icon: Layers },
  { id: 'projections', label: 'Multi-Year Projections', icon: TrendingUp },
  { id: 'carve-outs', label: 'Carve-Outs', icon: ShieldCheck },
  { id: 'audit', label: 'Audit Trail', icon: FileText },
]
const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-xl p-5" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>{children}</div>
)
const KPI = ({ l, v, s, c }: { l: string; v: string; s: string; c: string }) => (
  <Card><div className="text-[10px] uppercase tracking-wider" style={{ color: C.text4 }}>{l}</div><div className="text-2xl font-black mt-1" style={{ color: c }}>{v}</div><div className="text-[10px] mt-1" style={{ color: C.text4 }}>{s}</div></Card>
)

export default function WomensFSRModellerView({ club }: { club?: { name?: string } }) {
  const [tab, setTab] = useState<Tab>('dashboard')
  const [newSalary, setNewSalary] = useState(0)
  const salary = 2180000, cap = 2560000, revenue = 3200000
  const ratio = ((salary + newSalary) / revenue) * 100

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: C.text }}><LayoutDashboard size={20} style={{ color: C.pinkDeep }} /> FSR Compliance Dashboard — {club?.name || 'Oakridge Women FC'}</h2>
        <p className="text-sm mt-1" style={{ color: C.text3 }}>Models the WSL Financial Sustainability Regulations — 80% wage-to-relevant-revenue cap and the £1.5m three-year loss envelope.</p>
      </div>

      <div className="flex gap-1 border-b overflow-x-auto" style={{ borderColor: C.border }}>
        {TABS.map(t => { const A = t.icon; return (
          <button key={t.id} onClick={() => setTab(t.id)} className="px-4 py-2 text-xs font-semibold flex items-center gap-1.5 -mb-px whitespace-nowrap" style={{ borderBottom: `2px solid ${tab === t.id ? C.pinkDeep : 'transparent'}`, color: tab === t.id ? '#F472B6' : C.text4 }}><A size={13} />{t.label}</button>
        ) })}
      </div>

      {tab === 'dashboard' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPI l="FSR Status" v="SAFE" s="within 80% cap" c={C.good} />
            <KPI l="Relevant Revenue" v="£3.2M" s="women-only revenue" c={C.text} />
            <KPI l="Salary Spend" v="£2.18M" s="68% of revenue" c="#F472B6" />
            <KPI l="Headroom" v="£380k" s="before cap breach" c={C.blue} />
          </div>
          <Card>
            <h3 className="text-sm font-bold mb-4" style={{ color: C.text }}>Revenue Attribution — relevant revenue breakdown</h3>
            <div className="space-y-3">{([['Matchday revenue (women-only)', '£680k', 21], ['Commercial (women-attributed)', '£1.42m', 44], ['Broadcast (WSL allocation)', '£820k', 26], ['Prize money & FA distributions', '£280k', 9]] as [string, string, number][]).map(([n, v, p]) => (
              <div key={n}><div className="flex items-center justify-between mb-1"><span className="text-xs" style={{ color: C.text3 }}>{n}</span><span className="text-sm font-semibold" style={{ color: C.text }}>{v}</span></div><div className="w-full rounded-full h-1.5" style={{ background: C.border }}><div className="h-1.5 rounded-full" style={{ width: `${p}%`, background: C.pink }} /></div></div>
            ))}</div>
            <div className="mt-4 pt-3 flex items-center justify-between" style={{ borderTop: `1px solid ${C.border}` }}><span className="text-sm font-bold" style={{ color: C.text }}>Total relevant revenue</span><span className="text-sm font-bold" style={{ color: '#F472B6' }}>£3.2m</span></div>
          </Card>
          <Card>
            <h3 className="text-sm font-bold mb-1" style={{ color: C.text }}>Bundled Sponsorship Attribution</h3>
            <p className="text-xs mb-3" style={{ color: C.text4 }}>Sponsors shared with the men's parent club show only the women's attributed share. FSR counts the women's portion.</p>
            <div className="space-y-2">{([['Skyward Atlantic (shared — parent club)', '£12m total', "£180k (1.5%)", true], ['Apex Performance (Kit — standalone)', '£420k total', '£420k (100%)', false], ['Local Energy Co (women-only)', '£35k total', '£35k (100%)', false]] as [string, string, string, boolean][]).map(([sp, total, womens, flag]) => (
              <div key={sp} className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${C.border}`, background: flag ? 'rgba(245,158,11,0.05)' : undefined }}><div className="flex items-center gap-2"><span className="text-xs" style={{ color: C.text2 }}>{sp}</span>{flag && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(245,158,11,0.2)', color: C.amber }}>Review</span>}</div><div className="flex items-center gap-4"><span className="text-xs" style={{ color: C.text4 }}>{total}</span><span className="text-xs font-semibold" style={{ color: '#F472B6' }}>Women's: {womens}</span></div></div>
            ))}</div>
          </Card>
          <div className="rounded-xl p-4" style={{ background: 'rgba(190,24,93,0.08)', border: `1px solid ${C.pinkDeep}55` }}><span className="text-xs font-bold" style={{ color: '#F472B6' }}>FSR Rule:</span> <span className="text-xs" style={{ color: C.text2 }}>Total salary spend must not exceed 80% of relevant revenue. Relevant revenue = only revenue directly attributable to women's football activities.</span></div>
        </div>
      )}

      {tab === 'current' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPI l="Wage / revenue" v="68%" s="cap 80%" c={C.good} />
            <KPI l="3-yr loss position" v="−£0.9m" s="envelope £1.5m" c={C.good} />
            <KPI l="Loss headroom" v="£0.6m" s="remaining" c={C.blue} />
            <KPI l="Liquidity" v="4.2 mo" s="reserves cover" c={C.good} />
          </div>
          <Card>
            <h3 className="text-sm font-bold mb-4" style={{ color: C.text }}>Three-year FSR loss window</h3>
            <table className="w-full text-xs"><thead><tr style={{ color: C.text4, borderBottom: `1px solid ${C.border}` }}><th className="text-left py-2 font-semibold">Season</th><th className="text-right py-2 font-semibold">Revenue</th><th className="text-right py-2 font-semibold">Costs</th><th className="text-right py-2 font-semibold">Result</th><th className="text-right py-2 font-semibold">Cumulative</th></tr></thead>
              <tbody>{([['2023/24', '£2.6m', '£2.8m', '−£0.2m', '−£0.2m'], ['2024/25', '£2.9m', '£3.3m', '−£0.4m', '−£0.6m'], ['2025/26', '£3.2m', '£3.5m', '−£0.3m', '−£0.9m']] as string[][]).map((r, i) => (<tr key={i} style={{ borderBottom: `1px solid ${C.border}80` }}><td className="py-2 font-medium" style={{ color: C.text2 }}>{r[0]}</td><td className="py-2 text-right" style={{ color: C.text3 }}>{r[1]}</td><td className="py-2 text-right" style={{ color: C.text3 }}>{r[2]}</td><td className="py-2 text-right" style={{ color: C.amber }}>{r[3]}</td><td className="py-2 text-right font-semibold" style={{ color: C.text }}>{r[4]}</td></tr>))}</tbody>
            </table>
            <div className="mt-3 w-full rounded-full h-3 overflow-hidden" style={{ background: C.border }}><div className="h-3 rounded-full" style={{ width: '60%', background: C.good }} /></div>
            <div className="flex justify-between text-[10px] mt-1" style={{ color: C.text4 }}><span>Cumulative loss £0.9m</span><span>Envelope £1.5m</span></div>
          </Card>
        </div>
      )}

      {tab === 'scenario' && (
        <Card>
          <h3 className="text-sm font-bold mb-2" style={{ color: C.text }}>New-signing salary modeller</h3>
          <p className="text-xs mb-3" style={{ color: C.text4 }}>Enter a proposed annual salary to see the impact on the 80% FSR wage cap.</p>
          <div className="flex items-center gap-3 mb-3"><input type="number" value={newSalary || ''} onChange={e => setNewSalary(Number(e.target.value))} placeholder="e.g. 60000" className="rounded-lg px-3 py-2 text-sm w-48 outline-none" style={{ background: C.panelAlt, border: `1px solid ${C.border}`, color: C.text }} /><span className="text-xs" style={{ color: C.text4 }}>Annual salary (£)</span></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPI l="Wage / revenue" v={`${ratio.toFixed(1)}%`} s="cap 80%" c={ratio <= 80 ? C.good : C.red} />
            <KPI l="New salary spend" v={`£${((salary + newSalary) / 1e6).toFixed(2)}m`} s="players + staff" c={C.text} />
            <KPI l="Cap headroom" v={`£${((cap - salary - newSalary) / 1000).toFixed(0)}k`} s="before breach" c={(cap - salary - newSalary) > 0 ? C.good : C.red} />
            <KPI l="Status" v={ratio <= 80 ? 'WITHIN CAP' : 'BREACH'} s="FSR 80% rule" c={ratio <= 80 ? C.good : C.red} />
          </div>
        </Card>
      )}

      {tab === 'amortisation' && (
        <Card>
          <h3 className="text-sm font-bold mb-4" style={{ color: C.text }}>Transfer amortisation schedule</h3>
          <table className="w-full text-xs"><thead><tr style={{ color: C.text4, borderBottom: `1px solid ${C.border}` }}><th className="text-left py-2 font-semibold">Player</th><th className="text-right py-2 font-semibold">Fee</th><th className="text-right py-2 font-semibold">Length</th><th className="text-right py-2 font-semibold">Annual amort.</th><th className="text-right py-2 font-semibold">Book value</th></tr></thead>
            <tbody>{([['Amara Diallo', '£140k', '3 yr', '£47k', '£93k'], ['Freya Johansson', '£95k', '3 yr', '£32k', '£63k'], ['Niamh Gallagher', '£55k', '2 yr', '£28k', '£28k']] as string[][]).map((r, i) => (<tr key={i} style={{ borderBottom: `1px solid ${C.border}80` }}><td className="py-2 font-medium" style={{ color: C.text2 }}>{r[0]}</td><td className="py-2 text-right" style={{ color: C.text3 }}>{r[1]}</td><td className="py-2 text-right" style={{ color: C.text3 }}>{r[2]}</td><td className="py-2 text-right font-semibold" style={{ color: '#F472B6' }}>{r[3]}</td><td className="py-2 text-right" style={{ color: C.text3 }}>{r[4]}</td></tr>))}</tbody>
            <tfoot><tr style={{ borderTop: `1px solid ${C.border}` }}><td className="py-2 font-bold" style={{ color: C.text }}>Total annual amortisation</td><td /><td /><td className="py-2 text-right font-bold" style={{ color: '#F472B6' }}>£107k</td><td /></tr></tfoot>
          </table>
        </Card>
      )}

      {tab === 'projections' && (
        <Card>
          <h3 className="text-sm font-bold mb-4" style={{ color: C.text }}>Three-year FSR projection</h3>
          <table className="w-full text-xs"><thead><tr style={{ color: C.text4, borderBottom: `1px solid ${C.border}` }}><th className="text-left py-2 font-semibold">Season</th><th className="text-right py-2 font-semibold">Revenue</th><th className="text-right py-2 font-semibold">Wages</th><th className="text-right py-2 font-semibold">Wage / rev</th><th className="text-right py-2 font-semibold">Loss headroom</th></tr></thead>
            <tbody>{([['2026/27', '£3.6m', '£2.4m', '67%', '£0.7m'], ['2027/28', '£4.1m', '£2.7m', '66%', '£0.8m'], ['2028/29 (promotion)', '£5.4m', '£3.6m', '67%', '£1.1m']] as string[][]).map((r, i) => (<tr key={i} style={{ borderBottom: `1px solid ${C.border}80` }}><td className="py-2 font-medium" style={{ color: C.text2 }}>{r[0]}</td><td className="py-2 text-right" style={{ color: C.text3 }}>{r[1]}</td><td className="py-2 text-right" style={{ color: C.text3 }}>{r[2]}</td><td className="py-2 text-right" style={{ color: C.good }}>{r[3]}</td><td className="py-2 text-right font-semibold" style={{ color: C.good }}>{r[4]}</td></tr>))}</tbody>
          </table>
          <p className="text-[10px] mt-3" style={{ color: C.text4 }}>Assumes commercial growth +12%/yr and wage discipline at ~67%. Promotion to WSL lifts central distribution materially.</p>
        </Card>
      )}

      {tab === 'carve-outs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {([['🎓', 'Academy & youth development', '£180k', 'Scholar costs, age-group programmes — FSR-deductible'], ['❤️', 'Community development', '£90k', 'Foundation, schools, fan engagement'], ['🏟️', 'Infrastructure depreciation', '£140k', 'Facilities & equipment depreciation'], ['🌸', "Women's-game investment", '£120k', 'Welfare, cycle-aware provision, parental support']] as string[][]).map(([icon, name, val, note]) => (
            <Card key={name}><div className="flex items-center justify-between mb-1"><span className="text-sm font-bold" style={{ color: C.text }}>{icon} {name}</span><span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.18)', color: C.good }}>Documented</span></div><div className="text-xl font-black" style={{ color: '#F472B6' }}>{val}</div><div className="text-[11px] mt-1" style={{ color: C.text4 }}>{note}</div></Card>
          ))}
        </div>
      )}

      {tab === 'audit' && (
        <Card>
          <h3 className="text-sm font-bold mb-4" style={{ color: C.text }}>FSR submission & audit trail</h3>
          <table className="w-full text-xs"><thead><tr style={{ color: C.text4, borderBottom: `1px solid ${C.border}` }}><th className="text-left py-2 font-semibold">Date</th><th className="text-left py-2 font-semibold">Submission</th><th className="text-left py-2 font-semibold">Outcome</th></tr></thead>
            <tbody>{([['Q1 2026', 'Quarterly FSR return + evidence pack', 'Accepted'], ['Sep 2025', 'Karen Carney compliance self-assessment', 'Submitted'], ['Jul 2025', 'Annual relevant-revenue attribution', 'Verified'], ['Apr 2025', 'Year-end FSR submission', 'Accepted']] as string[][]).map((r, i) => (<tr key={i} style={{ borderBottom: `1px solid ${C.border}80` }}><td className="py-2" style={{ color: C.text4 }}>{r[0]}</td><td className="py-2 font-medium" style={{ color: C.text2 }}>{r[1]}</td><td className="py-2"><span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.18)', color: C.good }}>{r[2]}</span></td></tr>))}</tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
