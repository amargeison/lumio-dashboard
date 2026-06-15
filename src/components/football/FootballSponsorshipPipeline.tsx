'use client'

import { Handshake } from 'lucide-react'

// Men's Pro — Sponsorship Pipeline (standalone commercial CRM). PSR-aware,
// with bundled-deal attribution. Mirrors the Women's SponsorshipPipelineView,
// blue-themed with men's sponsor data.

const C = {
  panel: '#0D1117', panelAlt: '#111318', border: '#1F2937',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280',
  blue: '#003DA5', blueLt: '#60A5FA', green: '#22C55E', amber: '#F59E0B', red: '#EF4444',
}
const fmt = (n: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n)

type Deal = { partner: string; type: string; value: number; attribution: string; end: string; status: string; flag: string }
const DEALS: Deal[] = [
  { partner: 'Meridian Watches',    type: 'Principal',     value: 420000, attribution: 'Bundled (70%)',  end: '01 Jul 2026', status: 'Active',      flag: 'PSR REVIEW' },
  { partner: 'Apex Performance',    type: 'Kit',           value: 185000, attribution: 'Standalone (100%)', end: '14 Aug 2026', status: 'Active',      flag: '' },
  { partner: 'Northshore Brewing',  type: 'Stadium',       value: 95000,  attribution: 'Standalone (100%)', end: '01 Jul 2026', status: 'RENEWAL DUE', flag: '' },
  { partner: 'Riverside Healthcare',type: 'Medical',       value: 62000,  attribution: 'Standalone (100%)', end: '01 Mar 2027', status: 'Active',      flag: '' },
  { partner: 'Vanta Sports Drinks', type: 'Hydration',     value: 85000,  attribution: 'Standalone',        end: 'TBC',         status: 'NEGOTIATION', flag: '' },
  { partner: 'Stowe & Hart LLP',    type: 'Legal',         value: 45000,  attribution: 'Standalone',        end: '12 Jun 2026', status: 'RENEWAL DUE', flag: '' },
  { partner: 'Kingsmere Toyota',    type: 'Auto',          value: 70000,  attribution: 'Standalone',        end: 'TBC',         status: 'LEAD',        flag: '' },
  { partner: 'Local Energy Co',     type: 'Utilities',     value: 35000,  attribution: 'Standalone',        end: 'Apr 2026',    status: 'LAPSED',      flag: 'AT RISK' },
]

const StatCard = ({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) => (
  <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
    <div className="text-[10px] uppercase tracking-wider" style={{ color: C.text4 }}>{label}</div>
    <div className="text-xl font-black mt-1" style={{ color }}>{value}</div>
    {sub && <div className="text-[10px] mt-0.5" style={{ color: C.text4 }}>{sub}</div>}
  </div>
)

const statusStyle = (s: string): { background: string; color: string } =>
  s === 'Active'       ? { background: 'rgba(34,197,94,0.18)',  color: '#4ADE80' } :
  s === 'RENEWAL DUE'  ? { background: 'rgba(245,158,11,0.18)', color: '#FBBF24' } :
  s === 'NEGOTIATION'  ? { background: 'rgba(0,61,165,0.22)',   color: '#60A5FA' } :
  s === 'LEAD'         ? { background: 'rgba(96,165,250,0.15)', color: '#93C5FD' } :
                         { background: 'rgba(239,68,68,0.18)',  color: '#F87171' }

export default function FootballSponsorshipPipeline() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: C.text }}>
          <Handshake size={18} style={{ color: C.blue }} /> Sponsorship Pipeline
        </h2>
        <p className="text-sm mt-1" style={{ color: C.text3 }}>PSR-aware commercial CRM with bundled-deal attribution.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Active" value={fmt(762000)} sub="annualised" color={C.text} />
        <StatCard label="Pipeline" value={fmt(200000)} sub="negotiation + leads" color={C.blueLt} />
        <StatCard label="Renewals (90d)" value={fmt(465000)} sub="Northshore + Stowe & Hart" color={C.amber} />
        <StatCard label="At Risk" value={fmt(35000)} sub="Local Energy lapsed" color={C.red} />
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
        <table className="w-full text-sm">
          <thead><tr className="text-xs" style={{ color: C.text4, borderBottom: `1px solid ${C.border}`, background: 'rgba(17,24,39,0.3)' }}>
            <th className="text-left p-3 font-semibold">Partner</th><th className="text-left p-3 font-semibold">Type</th><th className="text-left p-3 font-semibold">Value</th><th className="text-left p-3 font-semibold">PSR Attribution</th><th className="text-left p-3 font-semibold">End</th><th className="text-left p-3 font-semibold">Status</th>
          </tr></thead>
          <tbody>
            {DEALS.map((d, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${C.border}80`, background: d.flag === 'PSR REVIEW' ? 'rgba(239,68,68,0.05)' : 'transparent' }}>
                <td className="p-3 font-medium" style={{ color: C.text2 }}>{d.partner}</td>
                <td className="p-3 text-xs" style={{ color: C.text4 }}>{d.type}</td>
                <td className="p-3" style={{ color: C.text3 }}>{fmt(d.value)}</td>
                <td className="p-3 text-xs"><span style={{ color: d.attribution.includes('Bundled') ? C.red : C.green }}>{d.attribution}</span></td>
                <td className="p-3 text-xs" style={{ color: C.text4 }}>{d.end}</td>
                <td className="p-3"><span className="text-xs px-2 py-0.5 rounded" style={statusStyle(d.status)}>{d.status}</span>{d.flag && <span className="text-xs px-2 py-0.5 rounded ml-1" style={{ background: 'rgba(239,68,68,0.18)', color: '#F87171' }}>{d.flag}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl p-4" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.3)' }}>
        <div className="text-xs font-medium mb-1" style={{ color: C.red }}>⚠ Bundled Attribution Review Required</div>
        <div className="text-xs" style={{ color: C.text3 }}>Meridian Watches — Principal partner, bundled across the men&apos;s and women&apos;s group deal (£600k total). Men&apos;s attribution 70% = £420k. PSR allowable-revenue review recommended.</div>
      </div>

      <div className="rounded-xl p-5" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
        <h3 className="text-sm font-bold mb-3" style={{ color: C.text }}>Brand Values Alignment</h3>
        <div className="space-y-2">
          {DEALS.slice(0, 5).map((d, i) => (
            <div key={i} className="flex items-center justify-between py-1.5" style={{ borderBottom: `1px solid ${C.border}80` }}>
              <span className="text-xs" style={{ color: C.text3 }}>{d.partner}</span>
              <div className="flex gap-3 text-xs" style={{ color: C.text4 }}>
                <span>Reach {'★'.repeat(4)}{'☆'.repeat(1)}</span>
                <span>Fit {'★'.repeat(i < 2 ? 5 : 3)}{'☆'.repeat(i < 2 ? 0 : 2)}</span>
                <span>Community {'★'.repeat(i < 3 ? 4 : 3)}{'☆'.repeat(i < 3 ? 1 : 2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl p-5" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
        <h3 className="text-sm font-bold mb-3" style={{ color: C.text }}>Prospect Pipeline</h3>
        <div className="space-y-2">
          {['Crown Telecom (back of shirt — est. £160k)', 'Northbridge Logistics (sleeve — £75k)', 'Harbour Financial (training kit — £55k)', 'Vantage Motors (auto — £90k)', 'GreenLeaf Nutrition (performance partner — £40k)'].map((p, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 text-xs" style={{ borderBottom: `1px solid ${C.border}80` }}>
              <span style={{ color: C.text4 }}>{p}</span><span style={{ color: '#4B5563' }}>Prospect</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
