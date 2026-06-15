'use client'

import { useState } from 'react'
import { Scale } from 'lucide-react'

// Men's Pro — Salary Compliance. PSR / Squad Cost Ratio framing (no FSR 80%
// cap — Championship/PL clubs use the PL/UEFA squad-cost-ratio + wage-to-
// revenue guidance). Full squad weekly + annual wages, key staff, new-signing
// modeller. Demo only.

const C = {
  panel: '#0D1117', panelAlt: '#111318', border: '#1F2937',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280',
  blue: '#003DA5', blueLt: '#60A5FA', good: '#22C55E', amber: '#F59E0B', red: '#EF4444',
}
const fmt = (n: number) => '£' + Math.round(n).toLocaleString('en-GB')

type Player = { name: string; pos: string; weekly: number; end: string }
const SQUAD: Player[] = [
  { name: 'Dean Morris', pos: 'LW', weekly: 48000, end: 'Jun 2028' },
  { name: 'Sam Porter', pos: 'ST', weekly: 40000, end: 'Jun 2026' },
  { name: 'Chris Nwosu', pos: 'ST', weekly: 36000, end: 'Jun 2027' },
  { name: 'Liam Barker', pos: 'CM', weekly: 34000, end: 'Jun 2027' },
  { name: 'Daniel Webb (C)', pos: 'CB', weekly: 32000, end: 'Jun 2027' },
  { name: 'Jordan Hayes', pos: 'GK', weekly: 30000, end: 'Jun 2027' },
  { name: 'Kyle Osei', pos: 'RB', weekly: 28000, end: 'Jun 2026' },
  { name: 'Myles Okafor', pos: 'LW', weekly: 28000, end: 'Jun 2026' },
  { name: 'Ryan Cole', pos: 'CM', weekly: 26000, end: 'Jun 2027' },
  { name: 'James Tilley', pos: 'RW', weekly: 25000, end: 'Jun 2026' },
  { name: 'Marcus Reid', pos: 'CB', weekly: 24000, end: 'Jun 2026' },
  { name: 'Connor Walsh', pos: 'CM', weekly: 24000, end: 'Jun 2026' },
  { name: 'Tom Fletcher', pos: 'LB', weekly: 23000, end: 'Jun 2027' },
  { name: 'Isaac Kemp', pos: 'CB', weekly: 22000, end: 'Jun 2027' },
  { name: 'Antwoine Rowe', pos: 'CF', weekly: 18000, end: 'Jun 2026' },
  { name: 'Brodi Chen', pos: 'CB', weekly: 16000, end: 'Jun 2026' },
  { name: 'Joe Lewis', pos: 'CB', weekly: 15000, end: 'Jun 2026' },
  { name: 'Paul Granger', pos: 'CDM', weekly: 14000, end: 'Jun 2026' },
  { name: 'Joe McDonnell', pos: 'GK', weekly: 12000, end: 'Jun 2026' },
  { name: 'Zack Bright', pos: 'CM', weekly: 12000, end: 'Jun 2026' },
  { name: 'Delano Ashton', pos: 'CM', weekly: 10000, end: 'Jun 2027' },
]
const KEY_STAFF: { name: string; role: string; weekly: number }[] = [
  { name: 'Marcus Reid', role: 'Head Coach', weekly: 38000 },
  { name: 'David Hughes', role: 'Assistant Manager', weekly: 14000 },
  { name: 'Dave Thompson', role: 'Director of Football', weekly: 16000 },
  { name: 'Liam Forbes', role: 'Head of Sports Science', weekly: 6000 },
  { name: 'Dr Sarah Phillips', role: 'Club Doctor', weekly: 5500 },
]

const Stat = ({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) => (
  <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}><div className="text-[10px] uppercase tracking-wider" style={{ color: C.text4 }}>{label}</div><div className="text-xl font-black mt-1" style={{ color }}>{value}</div><div className="text-[10px] mt-0.5" style={{ color: C.text4 }}>{sub}</div></div>
)

export default function FootballSalaryComplianceView() {
  const [newWeekly, setNewWeekly] = useState(0)
  const playerAnnual = SQUAD.reduce((s, p) => s + p.weekly * 52, 0)
  const staffAnnual = KEY_STAFF.reduce((s, p) => s + p.weekly * 52, 0)
  const totalWages = playerAnnual + staffAnnual
  const revenue = 38000000
  const wageRatio = ((totalWages + newWeekly * 52) / revenue) * 100
  const guidance = 70
  return (
    <div className="space-y-5">
      <div><h2 className="text-xl font-bold flex items-center gap-2" style={{ color: C.text }}><Scale size={18} style={{ color: C.blue }} /> Salary Compliance</h2><p className="text-sm mt-1" style={{ color: C.text3 }}>Wage bill vs revenue and the UEFA / PL squad-cost-ratio guidance.</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Player wages" value={fmt(playerAnnual)} sub={`${SQUAD.length} registered`} color={C.text} />
        <Stat label="Total wage bill" value={fmt(totalWages)} sub="players + key staff" color={C.blueLt} />
        <Stat label="Wage / revenue" value={`${wageRatio.toFixed(0)}%`} sub={`guidance ≤ ${guidance}%`} color={wageRatio <= guidance ? C.good : C.amber} />
        <Stat label="Squad-cost ratio" value="81%" sub="vs 85% UEFA threshold" color={C.amber} />
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
        <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${C.border}` }}><h3 className="text-sm font-bold" style={{ color: C.text }}>First-team wages</h3></div>
        <div style={{ maxHeight: 360, overflowY: 'auto' }}>
          <table className="w-full text-xs"><thead><tr style={{ color: C.text4, borderBottom: `1px solid ${C.border}`, background: 'rgba(17,24,39,0.3)' }}><th className="text-left px-4 py-2.5 font-semibold">Player</th><th className="text-left px-4 py-2.5 font-semibold">Pos</th><th className="text-right px-4 py-2.5 font-semibold">Weekly</th><th className="text-right px-4 py-2.5 font-semibold">Annual</th><th className="text-left px-4 py-2.5 font-semibold">Contract end</th></tr></thead>
            <tbody>{SQUAD.map((p, i) => (<tr key={i} style={{ borderBottom: `1px solid ${C.border}80` }}><td className="px-4 py-2 font-medium" style={{ color: C.text2 }}>{p.name}</td><td className="px-4 py-2" style={{ color: C.text4 }}>{p.pos}</td><td className="px-4 py-2 text-right" style={{ color: C.text3 }}>{fmt(p.weekly)}</td><td className="px-4 py-2 text-right font-semibold" style={{ color: C.blueLt }}>{fmt(p.weekly * 52)}</td><td className="px-4 py-2" style={{ color: C.text4 }}>{p.end}</td></tr>))}</tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${C.border}` }}><h3 className="text-sm font-bold" style={{ color: C.text }}>Key football staff</h3></div>
          <table className="w-full text-xs"><tbody>{KEY_STAFF.map((p, i) => (<tr key={i} style={{ borderBottom: i < KEY_STAFF.length - 1 ? `1px solid ${C.border}80` : undefined }}><td className="px-4 py-2.5 font-medium" style={{ color: C.text2 }}>{p.name}</td><td className="px-4 py-2.5" style={{ color: C.text4 }}>{p.role}</td><td className="px-4 py-2.5 text-right font-semibold" style={{ color: C.blueLt }}>{fmt(p.weekly * 52)}</td></tr>))}</tbody></table>
        </div>
        <div className="rounded-xl p-5" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <h3 className="text-sm font-bold mb-2" style={{ color: C.text }}>New-signing wage modeller</h3>
          <p className="text-xs mb-3" style={{ color: C.text4 }}>Enter a proposed weekly wage to see the impact on the wage-to-revenue ratio.</p>
          <div className="flex items-center gap-3 mb-3">
            <input type="number" value={newWeekly || ''} onChange={e => setNewWeekly(Number(e.target.value))} placeholder="e.g. 30000" className="rounded-lg px-3 py-2 text-sm w-48 outline-none" style={{ background: C.panelAlt, border: `1px solid ${C.border}`, color: C.text }} />
            <span className="text-xs" style={{ color: C.text4 }}>Weekly wage (£)</span>
          </div>
          {newWeekly > 0 && (
            <div className="rounded-lg p-3" style={{ border: `1px solid ${wageRatio <= guidance ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`, background: wageRatio <= guidance ? 'rgba(34,197,94,0.05)' : 'rgba(245,158,11,0.05)' }}>
              <div className="text-sm font-semibold mb-1" style={{ color: C.text }}>Updated wage / revenue: {wageRatio.toFixed(1)}%</div>
              <div className="text-xs" style={{ color: wageRatio <= guidance ? C.good : C.amber }}>{wageRatio <= guidance ? 'Within the squad-cost guidance.' : 'Above guidance — would push the squad-cost ratio toward the UEFA threshold.'}</div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl p-3 text-[11px]" style={{ background: `${C.blue}12`, borderLeft: `3px solid ${C.blue}`, color: C.text2 }}>
        UEFA squad-cost rule limits squad costs (wages + transfer amortisation + agent fees) to 70% of revenue (85% transitional). The PL operates parallel wage-to-revenue guidance. Modelled here alongside the PSR position — see the PSR SCR Dashboard.
      </div>
    </div>
  )
}
