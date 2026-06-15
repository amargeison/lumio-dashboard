'use client'

import { useState } from 'react'
import { Coins } from 'lucide-react'

// Central Distributions & Prize Money. Broadcast/solidarity/parachute (men's)
// or FA/WPLL/prize (women's) plus grant income. Shared variant component.
// Demo only — illustrative.

type Variant = 'mens' | 'womens'
type Tab = 'distributions' | 'prize' | 'grants'

interface Dist { source: string; basis: string; amount: number; status: string }
interface Prize { competition: string; scenario: string; amount: number }
interface Grant { source: string; purpose: string; amount: number; status: string }
interface Profile { accent: string; accentLt: string; clubName: string; money: (n: number) => string
  distributions: Dist[]; prize: Prize[]; grants: Grant[]; distNote: string }

const MENS: Profile = {
  accent: '#003DA5', accentLt: '#60A5FA', clubName: 'Oakridge FC',
  money: (n) => '£' + n.toLocaleString('en-GB') + 'k',
  distributions: [
    { source: 'EFL central distribution', basis: 'Equal-share + solidarity', amount: 8200, status: 'Confirmed' },
    { source: 'Parachute / solidarity payment', basis: 'Post-PL relegation tier', amount: 0, status: 'N/A — not in receipt' },
    { source: 'Broadcast facility fees', basis: 'Per televised fixture', amount: 1400, status: 'Confirmed' },
    { source: 'Cup competition central pot', basis: 'Round progression', amount: 620, status: 'Partial' },
    { source: 'Solidarity / training compensation (in)', basis: 'FIFA mechanism', amount: 180, status: 'Confirmed' },
  ],
  prize: [
    { competition: 'League position', scenario: 'Top-half finish', amount: 900 },
    { competition: 'FA Cup', scenario: 'Reach 5th round', amount: 360 },
    { competition: 'EFL Cup', scenario: 'Reach quarter-final', amount: 240 },
    { competition: 'Play-off bonus pool', scenario: 'If promoted via play-offs', amount: 3000 },
  ],
  grants: [
    { source: 'Premier League / EFL solidarity fund', purpose: 'Academy & community', amount: 480, status: 'Received' },
    { source: 'Football Foundation', purpose: 'Facility co-funding', amount: 250, status: 'Awarded' },
    { source: 'Stadium safety grant', purpose: 'Accessibility works', amount: 120, status: 'Applied' },
  ],
  distNote: 'Central distributions are the largest single income line for a Championship club and a core PSR-allowable revenue.',
}

const WOMENS: Profile = {
  accent: '#BE185D', accentLt: '#EC4899', clubName: 'Oakridge Women FC',
  money: (n) => '£' + n.toLocaleString('en-GB') + 'k',
  distributions: [
    { source: 'WPLL central distribution', basis: 'Tier equal-share', amount: 620, status: 'Confirmed' },
    { source: 'Broadcast pool (BBC / Sky)', basis: 'Collective rights deal', amount: 280, status: 'Confirmed' },
    { source: 'FA women’s football funding', basis: 'Tier participation', amount: 240, status: 'Confirmed' },
    { source: 'Solidarity / training compensation (in)', basis: 'FIFA mechanism', amount: 18, status: 'Confirmed' },
  ],
  prize: [
    { competition: 'League position', scenario: 'Top-half finish', amount: 80 },
    { competition: 'FA Women’s Cup', scenario: 'Reach quarter-final', amount: 45 },
    { competition: 'League Cup', scenario: 'Reach semi-final', amount: 30 },
    { competition: 'Promotion bonus pool', scenario: 'If promoted to WSL', amount: 250 },
  ],
  grants: [
    { source: 'FA / Lionesses Futures Fund', purpose: 'Facility & pathway', amount: 90, status: 'Awarded' },
    { source: 'Premier League Women’s Infrastructure Fund', purpose: 'Stadium upgrade', amount: 120, status: 'Applied' },
    { source: 'Football Foundation', purpose: 'Grassroots pitches', amount: 60, status: 'Awarded' },
  ],
  distNote: 'Central distributions and FA funding are the backbone of women’s-game finance and a core FSR-allowable revenue.',
}

const C = { panel: '#0D1117', panelAlt: '#111318', border: '#1F2937', text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280', good: '#22C55E', amber: '#F59E0B' }
const TABS: [Tab, string][] = [['distributions', 'Central Distributions'], ['prize', 'Prize Money'], ['grants', 'Grants & Funding']]

export default function CentralDistributionsView({ variant, club }: { variant: Variant; club?: { name?: string } | null }) {
  const p = variant === 'mens' ? MENS : WOMENS
  const name = club?.name || p.clubName
  const [tab, setTab] = useState<Tab>('distributions')
  const totalDist = p.distributions.reduce((s, d) => s + d.amount, 0)
  const potentialPrize = p.prize.reduce((s, d) => s + d.amount, 0)
  const totalGrants = p.grants.reduce((s, d) => s + d.amount, 0)

  const Stat = ({ label, value, col }: { label: string; value: string; col?: string }) => (
    <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}><div className="text-[10px] uppercase tracking-wider" style={{ color: C.text4 }}>{label}</div><div className="text-xl font-black mt-1" style={{ color: col || C.text }}>{value}</div></div>
  )

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: C.text }}><Coins size={18} style={{ color: p.accent }} /> Central Distributions & Prize Money</h2>
        <p className="text-sm mt-1 max-w-2xl" style={{ color: C.text3 }}>{name} — central distributions, competition prize money and grant / funding income.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Central distributions" value={p.money(totalDist)} col={p.accentLt} />
        <Stat label="Prize money (potential)" value={p.money(potentialPrize)} col={C.amber} />
        <Stat label="Grants secured/applied" value={p.money(totalGrants)} col={C.good} />
        <Stat label="Combined" value={p.money(totalDist + totalGrants)} />
      </div>

      <div className="flex gap-1 border-b overflow-x-auto" style={{ borderColor: C.border }}>
        {TABS.map(([id, label]) => (<button key={id} onClick={() => setTab(id)} className="px-4 py-2 text-xs font-semibold -mb-px whitespace-nowrap" style={{ borderBottom: `2px solid ${tab === id ? p.accent : 'transparent'}`, color: tab === id ? p.accentLt : C.text4 }}>{label}</button>))}
      </div>

      {tab === 'distributions' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <table className="w-full text-xs"><thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>{['Source', 'Basis', 'Amount', 'Status'].map(h => <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
            <tbody>{p.distributions.map((d, i) => (<tr key={i} style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{d.source}</td><td className="px-4 py-2.5" style={{ color: C.text4 }}>{d.basis}</td><td className="px-4 py-2.5 font-mono font-semibold" style={{ color: p.accentLt }}>{p.money(d.amount)}</td><td className="px-4 py-2.5" style={{ color: C.text3 }}>{d.status}</td></tr>))}</tbody>
            <tfoot><tr style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-bold" style={{ color: C.text }}>Total</td><td></td><td className="px-4 py-2.5 font-mono font-bold" style={{ color: p.accentLt }}>{p.money(totalDist)}</td><td></td></tr></tfoot>
          </table>
          <div className="px-4 py-2.5 text-[10px]" style={{ borderTop: `1px solid ${C.border}`, color: C.text4 }}>{p.distNote}</div>
        </div>
      )}

      {tab === 'prize' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <table className="w-full text-xs"><thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>{['Competition', 'Scenario', 'Potential'].map(h => <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
            <tbody>{p.prize.map((d, i) => (<tr key={i} style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{d.competition}</td><td className="px-4 py-2.5" style={{ color: C.text3 }}>{d.scenario}</td><td className="px-4 py-2.5 font-mono font-semibold" style={{ color: C.amber }}>{p.money(d.amount)}</td></tr>))}</tbody>
            <tfoot><tr style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-bold" style={{ color: C.text }}>Total upside</td><td></td><td className="px-4 py-2.5 font-mono font-bold" style={{ color: C.amber }}>{p.money(potentialPrize)}</td></tr></tfoot>
          </table>
          <div className="px-4 py-2.5 text-[10px]" style={{ borderTop: `1px solid ${C.border}`, color: C.text4 }}>Prize money modelled at scenario level; recognised only when earned. Promotion pool is the dominant swing factor.</div>
        </div>
      )}

      {tab === 'grants' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <table className="w-full text-xs"><thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>{['Funder', 'Purpose', 'Amount', 'Status'].map(h => <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
            <tbody>{p.grants.map((d, i) => (<tr key={i} style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{d.source}</td><td className="px-4 py-2.5" style={{ color: C.text4 }}>{d.purpose}</td><td className="px-4 py-2.5 font-mono font-semibold" style={{ color: C.good }}>{p.money(d.amount)}</td><td className="px-4 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: d.status === 'Applied' ? `${C.amber}1f` : `${C.good}1f`, color: d.status === 'Applied' ? C.amber : C.good }}>{d.status}</span></td></tr>))}</tbody>
            <tfoot><tr style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-bold" style={{ color: C.text }}>Total</td><td></td><td className="px-4 py-2.5 font-mono font-bold" style={{ color: C.good }}>{p.money(totalGrants)}</td><td></td></tr></tfoot>
          </table>
          <div className="px-4 py-2.5 text-[10px]" style={{ borderTop: `1px solid ${C.border}`, color: C.text4 }}>Restricted grants recognised against qualifying spend; ring-fenced from general operating budget.</div>
        </div>
      )}

      <div className="rounded-xl p-3 text-[11px]" style={{ background: `${p.accent}12`, borderLeft: `3px solid ${p.accent}`, color: C.text2 }}>
        Demo — illustrative only. Distribution amounts, prize scenarios and grant values are invented demo values.
      </div>
    </div>
  )
}
