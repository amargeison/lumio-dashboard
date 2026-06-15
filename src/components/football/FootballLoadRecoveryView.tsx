'use client'

import { useState } from 'react'
import { BatteryCharging } from 'lucide-react'

// Load & Recovery Monitor. Training load (ACWR), readiness, sleep and wellness
// per player, weekly load and recovery interventions. Shared variant component:
// men's (blue) and women's (pink). Demo only — illustrative.

type Variant = 'mens' | 'womens'
type Zone = 'red' | 'amber' | 'green'

const C = {
  panel: '#0D1117', panelAlt: '#111318', border: '#1F2937',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280',
  good: '#22C55E', amber: '#F59E0B', red: '#EF4444',
}
const zc = (z: Zone) => z === 'red' ? C.red : z === 'amber' ? C.amber : C.good
const readyZone = (r: number): Zone => r < 60 ? 'red' : r < 80 ? 'amber' : 'green'
const acwrZone = (a: number): Zone => (a > 1.5 || a < 0.8) ? 'red' : a > 1.3 ? 'amber' : 'green'
type Tab = 'readiness' | 'load' | 'recovery'

interface Player { name: string; pos: string; acwr: number; sleep: number; wellness: number; soreness: number; readiness: number }
interface Day { d: string; load: number; type: string }
interface Interv { player: string; plan: string; status: Zone }
interface Profile { accent: string; accentLt: string; clubName: string; squad: Player[]; week: Day[]; interventions: Interv[] }

const MENS: Profile = {
  accent: '#003DA5', accentLt: '#60A5FA', clubName: 'Oakridge FC',
  squad: [
    { name: 'Chris Nwosu', pos: 'ST', acwr: 1.62, sleep: 6.2, wellness: 5, soreness: 7, readiness: 52 },
    { name: 'Tom Fletcher', pos: 'LB', acwr: 1.38, sleep: 6.8, wellness: 6, soreness: 6, readiness: 64 },
    { name: 'Liam Barker', pos: 'CM', acwr: 1.28, sleep: 7.1, wellness: 7, soreness: 4, readiness: 78 },
    { name: 'Dean Morris', pos: 'LW', acwr: 1.10, sleep: 7.8, wellness: 8, soreness: 3, readiness: 88 },
    { name: 'Daniel Webb', pos: 'CB', acwr: 1.05, sleep: 8.0, wellness: 8, soreness: 2, readiness: 90 },
    { name: 'Sam Porter', pos: 'ST', acwr: 1.20, sleep: 7.4, wellness: 7, soreness: 4, readiness: 81 },
    { name: 'Kyle Osei', pos: 'RB', acwr: 0.78, sleep: 7.2, wellness: 6, soreness: 5, readiness: 66 },
    { name: 'Jordan Hayes', pos: 'GK', acwr: 0.95, sleep: 7.6, wellness: 8, soreness: 2, readiness: 87 },
  ],
  week: [
    { d: 'Mon', load: 540, type: 'Recovery + analysis' }, { d: 'Tue', load: 820, type: 'High intensity' },
    { d: 'Wed', load: 760, type: 'Tactical + speed' }, { d: 'Thu', load: 410, type: 'Activation' },
    { d: 'Fri', load: 880, type: 'Match prep' }, { d: 'Sat', load: 1120, type: 'Matchday' }, { d: 'Sun', load: 220, type: 'Recovery' },
  ],
  interventions: [
    { player: 'Chris Nwosu', plan: 'Cryotherapy + reduced session load (60%); sleep-hygiene review', status: 'red' },
    { player: 'Tom Fletcher', plan: 'Hydrotherapy + soft-tissue therapy; monitor hamstring', status: 'amber' },
    { player: 'Kyle Osei', plan: 'Under-loaded (ACWR 0.78) — progressive top-up running block', status: 'amber' },
    { player: 'Squad', plan: 'Compression + sleep tracking post-matchday; nutrition recovery window', status: 'green' },
  ],
}

const WOMENS: Profile = {
  accent: '#BE185D', accentLt: '#EC4899', clubName: 'Oakridge Women FC',
  squad: [
    { name: 'Emily Zhang', pos: 'CM', acwr: 1.58, sleep: 6.3, wellness: 5, soreness: 7, readiness: 54 },
    { name: 'Priya Nair', pos: 'CM', acwr: 1.36, sleep: 6.9, wellness: 6, soreness: 6, readiness: 65 },
    { name: 'Jade Osei', pos: 'ST', acwr: 1.25, sleep: 7.2, wellness: 7, soreness: 4, readiness: 80 },
    { name: 'Lucy Whitmore', pos: 'CM', acwr: 1.12, sleep: 7.7, wellness: 8, soreness: 3, readiness: 87 },
    { name: 'Aisha Diallo', pos: 'CB', acwr: 1.06, sleep: 8.0, wellness: 8, soreness: 2, readiness: 90 },
    { name: 'Megan Hughes', pos: 'DM', acwr: 1.18, sleep: 7.5, wellness: 7, soreness: 4, readiness: 82 },
    { name: 'Abbi Walsh', pos: 'RW', acwr: 0.79, sleep: 7.3, wellness: 6, soreness: 5, readiness: 67 },
    { name: 'Charlotte Reed', pos: 'GK', acwr: 0.98, sleep: 7.6, wellness: 8, soreness: 2, readiness: 88 },
  ],
  week: [
    { d: 'Mon', load: 480, type: 'Recovery + analysis' }, { d: 'Tue', load: 720, type: 'High intensity' },
    { d: 'Wed', load: 680, type: 'Tactical + speed' }, { d: 'Thu', load: 360, type: 'Activation' },
    { d: 'Fri', load: 760, type: 'Match prep' }, { d: 'Sat', load: 980, type: 'Matchday' }, { d: 'Sun', load: 200, type: 'Recovery' },
  ],
  interventions: [
    { player: 'Emily Zhang', plan: 'Cryotherapy + reduced load (60%); ACL-prevention prehab priority', status: 'red' },
    { player: 'Priya Nair', plan: 'Hydrotherapy + soft-tissue therapy; cycle-phase load adjustment', status: 'amber' },
    { player: 'Abbi Walsh', plan: 'Under-loaded (ACWR 0.79) — progressive top-up running block', status: 'amber' },
    { player: 'Squad', plan: 'Compression + sleep tracking post-matchday; nutrition recovery window', status: 'green' },
  ],
}

export default function FootballLoadRecoveryView({ variant = 'mens', club }: { variant?: Variant; club?: { name?: string } | null }) {
  const p = variant === 'womens' ? WOMENS : MENS
  const name = club?.name || p.clubName
  const [tab, setTab] = useState<Tab>('readiness')
  const avgReady = Math.round(p.squad.reduce((s, x) => s + x.readiness, 0) / p.squad.length)
  const redZone = p.squad.filter(x => readyZone(x.readiness) === 'red').length
  const avgAcwr = (p.squad.reduce((s, x) => s + x.acwr, 0) / p.squad.length).toFixed(2)
  const avgSleep = (p.squad.reduce((s, x) => s + x.sleep, 0) / p.squad.length).toFixed(1)
  const maxLoad = Math.max(...p.week.map(w => w.load))

  const Stat = ({ label, value, sub, col }: { label: string; value: string; sub: string; col: string }) => (
    <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}><div className="text-[10px] uppercase tracking-wider" style={{ color: C.text4 }}>{label}</div><div className="text-xl font-black mt-1" style={{ color: col }}>{value}</div><div className="text-[10px] mt-0.5" style={{ color: C.text4 }}>{sub}</div></div>
  )
  const TABS: [Tab, string][] = [['readiness', 'Squad Readiness'], ['load', 'Weekly Load'], ['recovery', 'Recovery Plan']]

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: C.text }}><BatteryCharging size={18} style={{ color: p.accent }} /> Load & Recovery Monitor</h2>
        <p className="text-sm mt-1 max-w-2xl" style={{ color: C.text3 }}>{name} — training load (acute:chronic), readiness, sleep and wellness — the daily physiological picture behind selection and load management.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Avg readiness" value={`${avgReady}%`} sub="squad, this morning" col={avgReady >= 80 ? C.good : C.amber} />
        <Stat label="Players in red zone" value={String(redZone)} sub="readiness < 60%" col={redZone ? C.red : C.good} />
        <Stat label="Avg ACWR" value={avgAcwr} sub="sweet spot 0.8–1.3" col={p.accentLt} />
        <Stat label="Avg sleep" value={`${avgSleep}h`} sub="last 7 nights" col={C.text} />
      </div>

      <div className="flex gap-1 border-b overflow-x-auto" style={{ borderColor: C.border }}>
        {TABS.map(([id, label]) => (<button key={id} onClick={() => setTab(id)} className="px-4 py-2 text-xs font-semibold -mb-px whitespace-nowrap" style={{ borderBottom: `2px solid ${tab === id ? p.accent : 'transparent'}`, color: tab === id ? p.accentLt : C.text4 }}>{label}</button>))}
      </div>

      {tab === 'readiness' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <table className="w-full text-xs"><thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>{['Player', 'ACWR', 'Sleep', 'Wellness', 'Soreness', 'Readiness'].map(h => <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
            <tbody>{p.squad.map((x, i) => { const rz = readyZone(x.readiness); const az = acwrZone(x.acwr); return (<tr key={i} style={{ borderTop: `1px solid ${C.border}`, background: rz === 'red' ? `${C.red}08` : undefined }}><td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{x.name} <span style={{ color: C.text4 }}>· {x.pos}</span></td><td className="px-4 py-2.5 font-mono" style={{ color: zc(az) }}>{x.acwr.toFixed(2)}</td><td className="px-4 py-2.5 font-mono" style={{ color: x.sleep < 7 ? C.amber : C.text3 }}>{x.sleep}h</td><td className="px-4 py-2.5" style={{ color: C.text3 }}>{x.wellness}/10</td><td className="px-4 py-2.5" style={{ color: x.soreness >= 6 ? C.amber : C.text3 }}>{x.soreness}/10</td><td className="px-4 py-2.5"><div className="flex items-center gap-2"><div className="w-16 rounded-full h-1.5" style={{ background: C.border }}><div className="h-1.5 rounded-full" style={{ width: `${x.readiness}%`, background: zc(rz) }} /></div><span className="text-[11px] font-bold" style={{ color: zc(rz) }}>{x.readiness}%</span></div></td></tr>) })}</tbody>
          </table>
          <div className="px-4 py-2.5 text-[10px]" style={{ borderTop: `1px solid ${C.border}`, color: C.text4 }}>Readiness blends ACWR, overnight sleep, subjective wellness and soreness. Red-zone players flagged to coaching before training.</div>
        </div>
      )}

      {tab === 'load' && (
        <div className="rounded-xl p-5" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: C.text }}>Weekly squad load (arbitrary units)</h3>
          <div className="flex items-end gap-3" style={{ height: 160 }}>{p.week.map(w => (
            <div key={w.d} className="flex-1 flex flex-col items-center justify-end gap-1">
              <span className="text-[10px] font-bold" style={{ color: C.text3 }}>{w.load}</span>
              <div className="w-full rounded-t" style={{ height: `${(w.load / maxLoad) * 120}px`, background: w.load >= maxLoad * 0.9 ? p.accent : w.load <= 300 ? C.good : p.accentLt }} />
              <span className="text-[10px] font-semibold" style={{ color: C.text2 }}>{w.d}</span>
              <span className="text-[8px] text-center" style={{ color: C.text4 }}>{w.type}</span>
            </div>
          ))}</div>
          <div className="text-[10px] mt-4" style={{ color: C.text4 }}>Load periodised around the matchday: peak matchday, taper Thu, recovery Sun/Mon. Weekly total monitored against the 4-week chronic average.</div>
        </div>
      )}

      {tab === 'recovery' && (
        <div className="space-y-2">{p.interventions.map((it, i) => (
          <div key={i} className="rounded-xl p-4 flex items-center justify-between gap-3 flex-wrap" style={{ backgroundColor: C.panel, border: `1px solid ${zc(it.status)}33` }}>
            <div><div className="text-sm font-semibold" style={{ color: C.text }}>{it.player}</div><div className="text-[11px] mt-0.5" style={{ color: C.text4 }}>{it.plan}</div></div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${zc(it.status)}1f`, color: zc(it.status) }}>{it.status === 'red' ? 'Priority' : it.status === 'amber' ? 'Monitor' : 'Routine'}</span>
          </div>
        ))}
        <div className="rounded-xl p-3 text-[11px]" style={{ background: `${p.accent}12`, borderLeft: `3px solid ${p.accent}`, color: C.text2 }}>Recovery suite: cryotherapy, hydrotherapy, compression, sleep tracking and a post-session nutrition window. Interventions assigned daily off the readiness board.</div>
        </div>
      )}

      <div className="rounded-xl p-3 text-[11px]" style={{ background: `${p.accent}12`, borderLeft: `3px solid ${p.accent}`, color: C.text2 }}>
        Demo — illustrative only. Load, readiness and sleep figures are invented demo values.
      </div>
    </div>
  )
}
