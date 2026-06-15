'use client'

import { useState } from 'react'
import { Activity } from 'lucide-react'

// Men's Pro — Injury Risk Monitor. Composite daily risk (ACL + hamstring /
// muscle + soft-tissue), overdue-screening alert, squad risk table and
// prevention-programme adherence. Blue accent. Demo only — illustrative.

const C = {
  panel: '#0D1117', panelAlt: '#111318', border: '#1F2937',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280',
  blue: '#003DA5', blueLt: '#60A5FA', good: '#22C55E', amber: '#F59E0B', red: '#EF4444',
}
type Light = 'red' | 'amber' | 'green'
const lc = (l: Light) => l === 'red' ? C.red : l === 'amber' ? C.amber : C.good
type Tab = 'composite' | 'screening' | 'prevention'

const COMPOSITE = [
  { name: 'Chris Nwosu', pos: 'ST', prev: 35, load: 26, muscle: 18, fatigue: 12, total: 91, light: 'red' as Light, action: 'Cap at 60% load. No max-sprint or repeated-sprint drills today.' },
  { name: 'Tom Fletcher', pos: 'LB', prev: 0, load: 24, muscle: 16, fatigue: 14, total: 54, light: 'amber' as Light, action: 'Hamstring flag — avoid high-speed running blocks; monitor.' },
  { name: 'Isaac Kemp', pos: 'CB', prev: 30, load: 8, muscle: 10, fatigue: 6, total: 54, light: 'amber' as Light, action: 'Continue RTP Phase 3 progressive load.' },
  { name: 'Dean Morris', pos: 'LW', prev: 0, load: 12, muscle: 8, fatigue: 6, total: 26, light: 'green' as Light, action: 'Full training cleared.' },
  { name: 'Daniel Webb', pos: 'CB', prev: 0, load: 10, muscle: 6, fatigue: 5, total: 21, light: 'green' as Light, action: 'Full training cleared.' },
]

type Risk = 'High' | 'Medium' | 'Low'
const SCREENING: { name: string; pos: string; history: string; last: string; next: string; overdue: boolean; risk: Risk }[] = [
  { name: 'Chris Nwosu', pos: 'ST', history: 'Hamstring x2 (2024, 2025)', last: 'Nov 2025', next: 'Feb 2026', overdue: true, risk: 'High' },
  { name: 'Isaac Kemp', pos: 'CB', history: 'ACL reconstruction (2024)', last: 'Dec 2025', next: 'Mar 2026', overdue: true, risk: 'High' },
  { name: 'Tom Fletcher', pos: 'LB', history: 'Calf strain (2025)', last: 'Jan 2026', next: 'Apr 2026', overdue: true, risk: 'Medium' },
  { name: 'Paul Granger', pos: 'CDM', history: 'Groin (2025)', last: 'Feb 2026', next: 'May 2026', overdue: false, risk: 'Medium' },
  { name: 'Dean Morris', pos: 'LW', history: 'None', last: 'Mar 2026', next: 'Jun 2026', overdue: false, risk: 'Low' },
  { name: 'Sam Porter', pos: 'ST', history: 'None', last: 'Mar 2026', next: 'Jun 2026', overdue: false, risk: 'Low' },
  { name: 'Daniel Webb', pos: 'CB', history: 'None', last: 'Mar 2026', next: 'Jun 2026', overdue: false, risk: 'Low' },
  { name: 'Liam Barker', pos: 'CM', history: 'None', last: 'Feb 2026', next: 'May 2026', overdue: false, risk: 'Low' },
  { name: 'Jordan Hayes', pos: 'GK', history: 'None', last: 'Mar 2026', next: 'Jun 2026', overdue: false, risk: 'Low' },
  { name: 'Kyle Osei', pos: 'RB', history: 'Ankle (2024)', last: 'Mar 2026', next: 'Jun 2026', overdue: false, risk: 'Low' },
  { name: 'Ryan Cole', pos: 'CM', history: 'None', last: 'Feb 2026', next: 'May 2026', overdue: false, risk: 'Low' },
  { name: 'Marcus Reid', pos: 'CB', history: 'None', last: 'Mar 2026', next: 'Jun 2026', overdue: false, risk: 'Low' },
]

const PREVENTION = [
  { name: 'Chris Nwosu', pos: 'ST', week: 0, weekTgt: 3, block: 6, blockTgt: 18, notes: 'Missed Mon/Wed/Fri Nordic + hamstring prehab — drives current red composite.' },
  { name: 'Tom Fletcher', pos: 'LB', week: 2, weekTgt: 3, block: 14, blockTgt: 18, notes: 'One miss this week; hamstring-specific block ongoing.' },
  { name: 'Isaac Kemp', pos: 'CB', week: 3, weekTgt: 3, block: 17, blockTgt: 18, notes: 'Modified prehab integrated with RTP Phase 3.' },
  { name: 'Paul Granger', pos: 'CDM', week: 3, weekTgt: 3, block: 16, blockTgt: 18, notes: 'Two misses for international duty earlier in block.' },
  { name: 'Dean Morris', pos: 'LW', week: 3, weekTgt: 3, block: 18, blockTgt: 18, notes: 'Full adherence.' },
  { name: 'Sam Porter', pos: 'ST', week: 3, weekTgt: 3, block: 17, blockTgt: 18, notes: 'One travel-related miss.' },
]
const pctOf = (a: number, b: number) => Math.round((a / b) * 100)
const adhRag = (p: number): Light => p < 60 ? 'red' : p < 85 ? 'amber' : 'green'

const SCHEDULE = [
  { date: '10 Apr', day: 'Wed', player: 'Chris Nwosu', type: 'Catch-up screening' },
  { date: '11 Apr', day: 'Thu', player: 'Isaac Kemp', type: 'RTP follow-up' },
  { date: '14 Apr', day: 'Mon', player: 'Tom Fletcher', type: 'Catch-up screening' },
  { date: '17 Apr', day: 'Thu', player: 'Paul Granger', type: 'Routine' },
]

export default function FootballInjuryRiskMonitor() {
  const [tab, setTab] = useState<Tab>('composite')
  const overdue = SCREENING.filter(p => p.overdue).length
  const highRisk = SCREENING.filter(p => p.risk === 'High').length
  const squadAdh = pctOf(PREVENTION.reduce((s, p) => s + p.block, 0), PREVENTION.reduce((s, p) => s + p.blockTgt, 0))

  const Stat = ({ label, value, sub, col }: { label: string; value: string; sub: string; col: string }) => (
    <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}><div className="text-[10px] uppercase tracking-wider" style={{ color: C.text4 }}>{label}</div><div className="text-xl font-black mt-1" style={{ color: col }}>{value}</div><div className="text-[10px] mt-0.5" style={{ color: C.text4 }}>{sub}</div></div>
  )
  const riskCol = (r: Risk) => r === 'High' ? C.red : r === 'Medium' ? C.amber : C.good
  const TABS: [Tab, string][] = [['composite', 'Composite Risk'], ['screening', 'Screening Schedule'], ['prevention', 'Prevention Adherence']]

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: C.text }}><Activity size={18} style={{ color: C.blue }} /> Injury Risk Monitor</h2>
        <p className="text-sm mt-1 max-w-2xl" style={{ color: C.text3 }}>Daily composite risk across ACL, hamstring / muscle and soft-tissue — driven by injury history, GPS load, fatigue and biomechanics.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Squad screened" value={`${SCREENING.length - overdue}/${SCREENING.length}`} sub="last 90 days" col={C.text} />
        <Stat label="High-risk players" value={String(highRisk)} sub="composite + history" col={C.red} />
        <Stat label="Overdue screenings" value={String(overdue)} sub="welfare lead notified" col={overdue ? C.amber : C.good} />
        <Stat label="Prevention adherence" value={`${squadAdh}%`} sub="Nordics / FIFA 11+ block" col={squadAdh >= 85 ? C.good : C.amber} />
      </div>

      <div className="flex gap-1 border-b overflow-x-auto" style={{ borderColor: C.border }}>
        {TABS.map(([id, label]) => (<button key={id} onClick={() => setTab(id)} className="px-4 py-2 text-xs font-semibold -mb-px whitespace-nowrap" style={{ borderBottom: `2px solid ${tab === id ? C.blue : 'transparent'}`, color: tab === id ? C.blueLt : C.text4 }}>{label}</button>))}
      </div>

      {tab === 'composite' && (
        <div className="space-y-4">
          <div className="rounded-xl p-5" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
            <h3 className="text-sm font-bold mb-1" style={{ color: C.text }}>Composite Risk Score — daily traffic light</h3>
            <p className="text-xs mb-4" style={{ color: C.text4 }}>Injury history (35%) · GPS load / ACWR (30%) · muscle & biomechanics (20%) · fatigue (15%)</p>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">{COMPOSITE.map(p => (
              <div key={p.name} className="rounded-xl p-3" style={{ background: `${lc(p.light)}10`, border: `1px solid ${lc(p.light)}40` }}>
                <div className="flex items-center gap-2 mb-2"><span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px]" style={{ background: lc(p.light) }}>{p.light === 'red' ? '🔴' : p.light === 'amber' ? '🟡' : '🟢'}</span><div><div className="text-xs font-bold" style={{ color: C.text }}>{p.name}</div><div className="text-[10px]" style={{ color: C.text4 }}>{p.pos}</div></div></div>
                <div className="grid grid-cols-2 gap-1 text-[9px] mb-2">{[['Prev', p.prev], ['Load', p.load], ['Muscle', p.muscle], ['Fatigue', p.fatigue]].map(([l, v]) => (<div key={l as string} className="rounded px-1.5 py-1 text-center" style={{ background: C.panelAlt }}><span style={{ color: C.text4 }}>{l}: </span><span className="font-bold" style={{ color: C.text }}>{v}</span></div>))}</div>
                <div className="text-[10px] font-bold mb-1" style={{ color: lc(p.light) }}>Score: {p.total}/100</div>
                <div className="text-[10px]" style={{ color: C.text3 }}>{p.action}</div>
              </div>
            ))}</div>
          </div>
          <div className="rounded-xl p-3 text-[11px]" style={{ background: `${C.amber}14`, border: `1px solid ${C.amber}40`, color: C.amber }}>Composite updated daily at 06:30 from Lumio GPS load, the last 30 days of biomechanical assessment and overnight wellness/fatigue inputs.</div>
        </div>
      )}

      {tab === 'screening' && (
        <div className="space-y-4">
          {overdue > 0 && <div className="rounded-xl p-3 text-[11px] font-medium" style={{ background: `${C.red}10`, border: `1px solid ${C.red}40`, color: C.red }}>⚠ {overdue} players have overdue screenings — Head of Medical notified</div>}
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
            <table className="w-full text-xs"><thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>{['Player', 'Pos', 'Injury history', 'Last screening', 'Next due', 'Risk'].map(h => <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
              <tbody>{SCREENING.map((p, i) => (<tr key={i} style={{ borderTop: `1px solid ${C.border}`, background: p.overdue ? `${C.amber}08` : undefined }}><td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{p.name}</td><td className="px-4 py-2.5" style={{ color: C.text4 }}>{p.pos}</td><td className="px-4 py-2.5" style={{ color: C.text3 }}>{p.history}</td><td className="px-4 py-2.5" style={{ color: C.text4 }}>{p.last}</td><td className="px-4 py-2.5" style={{ color: p.overdue ? C.amber : C.text4 }}>{p.next}{p.overdue ? ' · overdue' : ''}</td><td className="px-4 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${riskCol(p.risk)}1f`, color: riskCol(p.risk) }}>{p.risk}</span></td></tr>))}</tbody>
            </table>
          </div>
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
            <div className="px-5 py-3" style={{ borderBottom: `1px solid ${C.border}` }}><h3 className="text-sm font-bold" style={{ color: C.text }}>Screening scheduler — next 6 weeks</h3></div>
            {SCHEDULE.map((s, i) => (<div key={i} className="flex items-center gap-4 px-5 py-2.5" style={{ borderBottom: i < SCHEDULE.length - 1 ? `1px solid ${C.border}80` : undefined }}><span className="text-[11px] font-mono w-20 shrink-0" style={{ color: C.text3 }}>{s.day} {s.date}</span><span className="text-xs font-semibold flex-1" style={{ color: C.text2 }}>{s.player}</span><span className="text-[11px]" style={{ color: C.text4 }}>{s.type}</span></div>))}
          </div>
        </div>
      )}

      {tab === 'prevention' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}><h3 className="text-sm font-bold" style={{ color: C.text }}>Prevention programme — Nordics / FIFA 11+ (block = 18 sessions)</h3><span className="text-[11px]" style={{ color: squadAdh >= 85 ? C.good : C.amber }}>Squad adherence {squadAdh}%</span></div>
          <table className="w-full text-xs"><thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>{['Player', 'This week', 'Block', 'Adherence', 'Notes'].map(h => <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
            <tbody>{PREVENTION.map((p, i) => { const bp = pctOf(p.block, p.blockTgt); const r = adhRag(bp); return (<tr key={i} style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{p.name} <span style={{ color: C.text4 }}>· {p.pos}</span></td><td className="px-4 py-2.5" style={{ color: C.text3 }}>{p.week}/{p.weekTgt}</td><td className="px-4 py-2.5" style={{ color: C.text3 }}>{p.block}/{p.blockTgt}</td><td className="px-4 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${lc(r)}1f`, color: lc(r) }}>{bp}% · {r === 'red' ? 'Behind' : r === 'amber' ? 'Catch up' : 'On track'}</span></td><td className="px-4 py-2.5" style={{ color: C.text4 }}>{p.notes}</td></tr>) })}</tbody>
          </table>
        </div>
      )}

      <div className="rounded-xl p-3 text-[11px]" style={{ background: `${C.blue}12`, borderLeft: `3px solid ${C.blue}`, color: C.text2 }}>
        Demo — illustrative only. Risk scores, screening dates and adherence are invented demo values.
      </div>
    </div>
  )
}
