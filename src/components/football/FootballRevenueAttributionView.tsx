'use client'

import { TrendingUp } from 'lucide-react'

// Men's Pro — Revenue Attribution (PSR). Revenue breakdown for the PSR
// calculation, associated-party transactions assessed at fair market value,
// and bundled-deal attribution split men's vs women's group. Demo only.

const C = {
  panel: '#0D1117', border: '#1F2937',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280',
  blue: '#003DA5', blueLt: '#60A5FA', good: '#22C55E', amber: '#F59E0B', red: '#EF4444',
}
const fmtM = (n: number) => '£' + n + 'm'
const Stat = ({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) => (
  <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}><div className="text-[10px] uppercase tracking-wider" style={{ color: C.text4 }}>{label}</div><div className="text-xl font-black mt-1" style={{ color }}>{value}</div><div className="text-[10px] mt-0.5" style={{ color: C.text4 }}>{sub}</div></div>
)

const CATEGORIES = [
  { name: 'Broadcast & central distribution', value: 14, pct: 37, color: '#003DA5' },
  { name: 'Commercial & sponsorship', value: 11, pct: 29, color: '#60A5FA' },
  { name: 'Matchday', value: 9, pct: 24, color: '#22C55E' },
  { name: 'Player trading & other', value: 4, pct: 10, color: '#F59E0B' },
]
const BUNDLED = [
  { sponsor: 'Meridian Watches (Principal — group)', total: '£600k', mens: '£420k', pct: '70%', flag: true },
  { sponsor: 'Apex Performance (Kit — standalone)', total: '£185k', mens: '£185k', pct: '100%', flag: false },
  { sponsor: 'Northshore Brewing (Stadium)', total: '£95k', mens: '£95k', pct: '100%', flag: false },
]
const APT = [
  { party: 'Meridian Group (owner-linked sponsorship)', book: '£420k', fmv: '£360k', adj: '−£60k', status: 'Adjusted' },
  { party: 'Northbridge Travel (director-connected)', book: '£240k', fmv: '£240k', adj: '£0', status: 'At FMV' },
  { party: 'Stadium naming pre-sale (related entity)', book: '£6.0m', fmv: '£6.0m', adj: '£0', status: 'At FMV' },
]

export default function FootballRevenueAttributionView() {
  return (
    <div className="space-y-5">
      <div><h2 className="text-xl font-bold flex items-center gap-2" style={{ color: C.text }}><TrendingUp size={18} style={{ color: C.blue }} /> Revenue Attribution</h2><p className="text-sm mt-1" style={{ color: C.text3 }}>PSR revenue recognition — associated-party transactions at fair market value, bundled-deal splits.</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Total revenue" value="£38m" sub="2025/26 recognised" color={C.text} />
        <Stat label="YoY growth" value="+6%" sub="vs 2024/25" color={C.good} />
        <Stat label="Associated-party flags" value="1" sub="Meridian Group" color={C.amber} />
        <Stat label="FMV adjustment" value="−£0.4m" sub="applied for PSR" color={C.red} />
      </div>

      <div className="rounded-xl p-5" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
        <h3 className="text-sm font-bold mb-4" style={{ color: C.text }}>Revenue breakdown (PSR-recognised)</h3>
        <div className="space-y-3">{CATEGORIES.map(c => (
          <div key={c.name}><div className="flex items-center justify-between mb-1"><span className="text-xs" style={{ color: C.text3 }}>{c.name}</span><span className="text-sm font-semibold" style={{ color: C.text }}>{fmtM(c.value)}</span></div><div className="w-full rounded-full h-1.5" style={{ background: C.border }}><div className="h-1.5 rounded-full" style={{ width: `${c.pct}%`, background: c.color }} /></div></div>
        ))}</div>
        <div className="mt-4 pt-3 flex items-center justify-between" style={{ borderTop: `1px solid ${C.border}` }}><span className="text-sm font-bold" style={{ color: C.text }}>Total</span><span className="text-sm font-bold" style={{ color: C.blueLt }}>£38m</span></div>
      </div>

      <div className="rounded-xl p-5" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
        <h3 className="text-sm font-bold mb-1" style={{ color: C.text }}>Associated-party transactions — fair market value</h3>
        <p className="text-xs mb-3" style={{ color: C.text4 }}>Owner / director-connected income must be assessed at fair market value for PSR. Over-value is removed from allowable revenue.</p>
        <table className="w-full text-xs"><thead><tr style={{ color: C.text4, borderBottom: `1px solid ${C.border}` }}><th className="text-left py-2 font-semibold">Counterparty</th><th className="text-right py-2 font-semibold">Book value</th><th className="text-right py-2 font-semibold">Assessed FMV</th><th className="text-right py-2 font-semibold">PSR adj.</th><th className="text-right py-2 font-semibold">Status</th></tr></thead>
          <tbody>{APT.map((a, i) => (<tr key={i} style={{ borderBottom: `1px solid ${C.border}80` }}><td className="py-2 font-medium" style={{ color: C.text2 }}>{a.party}</td><td className="py-2 text-right" style={{ color: C.text3 }}>{a.book}</td><td className="py-2 text-right" style={{ color: C.text3 }}>{a.fmv}</td><td className="py-2 text-right font-semibold" style={{ color: a.adj === '£0' ? C.text4 : C.red }}>{a.adj}</td><td className="py-2 text-right"><span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: a.status === 'At FMV' ? `${C.good}1f` : `${C.amber}1f`, color: a.status === 'At FMV' ? C.good : C.amber }}>{a.status}</span></td></tr>))}</tbody>
        </table>
      </div>

      <div className="rounded-xl p-5" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
        <h3 className="text-sm font-bold mb-1" style={{ color: C.text }}>Bundled-deal attribution (men&apos;s vs women&apos;s group)</h3>
        <p className="text-xs mb-3" style={{ color: C.text4 }}>Sponsors shared with the women&apos;s club are split; PSR recognises only the men&apos;s attributed share.</p>
        <div className="space-y-2">{BUNDLED.map(s => (
          <div key={s.sponsor} className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${C.border}80`, background: s.flag ? 'rgba(245,158,11,0.05)' : undefined, borderRadius: s.flag ? 6 : 0, paddingLeft: s.flag ? 8 : 0, paddingRight: s.flag ? 8 : 0 }}>
            <div className="flex items-center gap-2"><span className="text-xs" style={{ color: C.text3 }}>{s.sponsor}</span>{s.flag && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${C.amber}33`, color: C.amber }}>Review</span>}</div>
            <div className="flex items-center gap-4"><span className="text-xs" style={{ color: C.text4 }}>Total: {s.total}</span><span className="text-xs font-semibold" style={{ color: C.blueLt }}>Men&apos;s: {s.mens} ({s.pct})</span></div>
          </div>
        ))}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl p-5" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: C.text }}>Season comparison</h3>
          <div className="space-y-3">{[['2023/24', 33.4, 88], ['2024/25', 35.8, 94], ['2025/26', 38.0, 100]].map(([season, val, bar]) => (
            <div key={season as string}><div className="flex items-center justify-between mb-1"><span className="text-xs" style={{ color: C.text3 }}>{season}</span><span className="text-sm font-semibold" style={{ color: C.text }}>£{val}m</span></div><div className="w-full rounded-full h-2" style={{ background: C.border }}><div className="h-2 rounded-full" style={{ width: `${bar}%`, background: C.blue }} /></div></div>
          ))}</div>
          <p className="text-[10px] mt-3" style={{ color: C.text4 }}>Recognised revenue +6% YoY; +14% over three seasons.</p>
        </div>
        <div className="rounded-xl p-5" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: C.text }}>Permitted squad-cost calculation</h3>
          <div className="space-y-0">{[
            ['Total relevant revenue', '£38.0m', C.text],
            ['UEFA squad-cost limit (85% transitional)', '£32.3m', C.text3],
            ['Current squad cost (wages + amort + agents)', '£30.8m', C.text3],
            ['Squad-cost ratio', '81%', C.amber],
            ['Remaining headroom', '£1.5m', C.good],
          ].map(([label, val, col], i) => (
            <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: i < 4 ? `1px solid ${C.border}80` : undefined }}><span className="text-xs" style={{ color: C.text4 }}>{label}</span><span className="text-sm font-semibold" style={{ color: col as string }}>{val}</span></div>
          ))}</div>
          <p className="text-[10px] mt-3" style={{ color: C.text4 }}>UEFA Squad Cost Rule caps squad cost at 70% of revenue (85% transitional). The PSR loss test runs in parallel — see the PSR SCR Dashboard.</p>
        </div>
      </div>

      <div className="rounded-xl p-3 text-[11px]" style={{ background: `${C.blue}12`, borderLeft: `3px solid ${C.blue}`, color: C.text2 }}>
        Allowable revenue feeds the PSR 3-year calculation. Associated-party adjustments and bundled splits are reflected in the PSR SCR Dashboard position.
      </div>
    </div>
  )
}
