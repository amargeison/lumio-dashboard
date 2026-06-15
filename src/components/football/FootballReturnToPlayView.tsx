'use client'

import { useState } from 'react'
import { HeartPulse } from 'lucide-react'

// Injury & Return-to-Play. Current injuries, 5-phase RTP pipeline, rehab
// milestones and GRTP clearance. Shared variant component: men's (blue) and
// women's (pink). Demo only — illustrative.

type Variant = 'mens' | 'womens'
type RAG = 'green' | 'amber' | 'red'
type Tab = 'pipeline' | 'milestones' | 'clearance'

const C = {
  panel: '#0D1117', panelAlt: '#111318', border: '#1F2937',
  text: '#F9FAFB', text2: '#D1D5DB', text3: '#9CA3AF', text4: '#6B7280',
  good: '#22C55E', amber: '#F59E0B', red: '#EF4444',
}
const rc = (r: RAG) => r === 'green' ? C.good : r === 'amber' ? C.amber : C.red
const PHASES = ['Acute / protect', 'Recovery', 'Reconditioning', 'Return to train', 'Return to play']

interface Injury { name: string; pos: string; injury: string; date: string; phase: number; eta: string; status: RAG; note: string }
interface Clear { player: string; test: string; owner: string; status: RAG }
interface Profile { accent: string; accentLt: string; clubName: string; injuries: Injury[]; milestones: Record<string, { label: string; done: boolean }[]>; clearance: Clear[] }

const MENS: Profile = {
  accent: '#003DA5', accentLt: '#60A5FA', clubName: 'Oakridge FC',
  injuries: [
    { name: 'Isaac Kemp', pos: 'CB', injury: 'ACL reconstruction', date: 'Dec 2025', phase: 3, eta: 'Jul 2026', status: 'amber', note: 'On protocol — progressive load, change-of-direction reintroduced.' },
    { name: 'Chris Nwosu', pos: 'ST', injury: 'Hamstring grade 2', date: '02 Apr 2026', phase: 2, eta: '08 May 2026', status: 'amber', note: 'Recurrence risk — extended reconditioning before sprint exposure.' },
    { name: 'Tom Fletcher', pos: 'LB', injury: 'Calf strain grade 1', date: '14 Apr 2026', phase: 4, eta: '28 Apr 2026', status: 'green', note: 'Returned to full training; GRTP final session pending.' },
    { name: 'Paul Granger', pos: 'CDM', injury: 'Adductor / groin', date: '20 Mar 2026', phase: 5, eta: 'Available', status: 'green', note: 'Cleared — minutes managed for two fixtures.' },
    { name: 'Joe McDonnell', pos: 'GK', injury: 'Shoulder (AC joint)', date: '28 Mar 2026', phase: 2, eta: '30 May 2026', status: 'red', note: 'Slower than protocol — specialist review booked.' },
  ],
  milestones: {
    'Isaac Kemp': [
      { label: 'Wound healing / swelling resolved', done: true }, { label: 'Full ROM restored', done: true }, { label: 'Quad strength ≥ 80% LSI', done: true }, { label: 'Running progression complete', done: true }, { label: 'Change-of-direction battery', done: false }, { label: 'Hop-test ≥ 90% LSI', done: false }, { label: 'GRTP on-pitch clearance', done: false },
    ],
    'Chris Nwosu': [
      { label: 'Pain-free walking', done: true }, { label: 'Isometric strength baseline', done: true }, { label: 'Eccentric loading block', done: false }, { label: 'Submax running', done: false }, { label: 'Max-sprint exposure', done: false }, { label: 'GRTP clearance', done: false },
    ],
    'Joe McDonnell': [
      { label: 'Sling / immobilisation phase', done: true }, { label: 'Pain-free passive ROM', done: false }, { label: 'Rotator-cuff strengthening', done: false }, { label: 'GK-specific diving battery', done: false }, { label: 'GRTP clearance', done: false },
    ],
  },
  clearance: [
    { player: 'Tom Fletcher', test: 'GRTP final on-pitch session', owner: 'Head Physio', status: 'amber' },
    { player: 'Paul Granger', test: 'Cleared — minutes managed', owner: 'Club Doctor', status: 'green' },
    { player: 'Isaac Kemp', test: 'Hop-test + COD battery (≥90% LSI)', owner: 'Head of Performance', status: 'red' },
    { player: 'Joe McDonnell', test: 'Specialist orthopaedic review', owner: 'Club Doctor', status: 'red' },
  ],
}

const WOMENS: Profile = {
  accent: '#BE185D', accentLt: '#EC4899', clubName: 'Oakridge Women FC',
  injuries: [
    { name: 'Sophie Turner', pos: 'LB', injury: 'ACL reconstruction', date: 'Dec 2024', phase: 4, eta: 'May 2026', status: 'amber', note: 'On protocol — sport-specific reintroduced; high adherence.' },
    { name: 'Sasha Davies', pos: 'CM', injury: 'Meniscus repair', date: 'Jan 2026', phase: 3, eta: 'Jun 2026', status: 'amber', note: 'Reconditioning; change-of-direction loading building.' },
    { name: 'Emily Zhang', pos: 'CM', injury: 'Hamstring grade 1', date: '10 Apr 2026', phase: 2, eta: '02 May 2026', status: 'amber', note: 'Prior ACL history — cautious sprint reintroduction.' },
    { name: 'Abbi Walsh', pos: 'RW', injury: 'Ankle sprain', date: '22 Mar 2026', phase: 5, eta: 'Available', status: 'green', note: 'Cleared — minutes managed for two fixtures.' },
    { name: 'Tilly Brooks', pos: 'LW', injury: 'Concussion (graded return)', date: '05 Apr 2026', phase: 4, eta: '26 Apr 2026', status: 'green', note: 'Symptom-free 48h; contact cleared, GRTP final stage.' },
  ],
  milestones: {
    'Sophie Turner': [
      { label: 'Wound healing / swelling resolved', done: true }, { label: 'Full ROM restored', done: true }, { label: 'Quad strength ≥ 80% LSI', done: true }, { label: 'Running progression complete', done: true }, { label: 'Change-of-direction battery', done: true }, { label: 'Hop-test ≥ 90% LSI', done: false }, { label: 'GRTP on-pitch clearance', done: false },
    ],
    'Sasha Davies': [
      { label: 'Pain-free walking', done: true }, { label: 'Full ROM restored', done: true }, { label: 'Strength base ≥ 75% LSI', done: true }, { label: 'Running progression', done: false }, { label: 'Change-of-direction battery', done: false }, { label: 'GRTP clearance', done: false },
    ],
    'Emily Zhang': [
      { label: 'Pain-free walking', done: true }, { label: 'Isometric strength baseline', done: true }, { label: 'Eccentric loading block', done: false }, { label: 'Submax running', done: false }, { label: 'Max-sprint exposure', done: false }, { label: 'GRTP clearance', done: false },
    ],
  },
  clearance: [
    { player: 'Tilly Brooks', test: 'GRTP final on-pitch session (concussion)', owner: 'Club Doctor', status: 'amber' },
    { player: 'Abbi Walsh', test: 'Cleared — minutes managed', owner: 'Head Physio', status: 'green' },
    { player: 'Sophie Turner', test: 'Hop-test ≥ 90% LSI', owner: 'Head of Performance', status: 'amber' },
    { player: 'Sasha Davies', test: 'COD + strength battery', owner: 'Head Physio', status: 'red' },
  ],
}

export default function FootballReturnToPlayView({ variant = 'mens', club }: { variant?: Variant; club?: { name?: string } | null }) {
  const p = variant === 'womens' ? WOMENS : MENS
  const name = club?.name || p.clubName
  const [tab, setTab] = useState<Tab>('pipeline')
  const inRehab = p.injuries.filter(x => x.phase < 5).length
  const onTrack = Math.round((p.injuries.filter(x => x.status !== 'red').length / p.injuries.length) * 100)
  const pending = p.clearance.filter(c => c.status !== 'green').length

  const Stat = ({ label, value, sub, col }: { label: string; value: string; sub: string; col: string }) => (
    <div className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}><div className="text-[10px] uppercase tracking-wider" style={{ color: C.text4 }}>{label}</div><div className="text-xl font-black mt-1" style={{ color: col }}>{value}</div><div className="text-[10px] mt-0.5" style={{ color: C.text4 }}>{sub}</div></div>
  )
  const TABS: [Tab, string][] = [['pipeline', 'RTP Pipeline'], ['milestones', 'Rehab Milestones'], ['clearance', 'GRTP Clearance']]

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: C.text }}><HeartPulse size={18} style={{ color: p.accent }} /> Injury & Return-to-Play</h2>
        <p className="text-sm mt-1 max-w-2xl" style={{ color: C.text3 }}>{name} — five-phase return-to-play pathway, rehab milestones and graduated return-to-play (GRTP) clearance for injured players.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Players in rehab" value={String(inRehab)} sub="active cases" col={C.text} />
        <Stat label="On-track" value={`${onTrack}%`} sub="vs RTP protocol" col={onTrack >= 70 ? C.good : C.amber} />
        <Stat label="GRTP pending" value={String(pending)} sub="clearances outstanding" col={pending ? C.amber : C.good} />
        <Stat label="Available soon" value={String(p.injuries.filter(x => x.phase >= 4).length)} sub="phase 4–5" col={p.accentLt} />
      </div>

      <div className="flex gap-1 border-b overflow-x-auto" style={{ borderColor: C.border }}>
        {TABS.map(([id, label]) => (<button key={id} onClick={() => setTab(id)} className="px-4 py-2 text-xs font-semibold -mb-px whitespace-nowrap" style={{ borderBottom: `2px solid ${tab === id ? p.accent : 'transparent'}`, color: tab === id ? p.accentLt : C.text4 }}>{label}</button>))}
      </div>

      {tab === 'pipeline' && (
        <div className="space-y-3">{p.injuries.map((x, i) => (
          <div key={i} className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
            <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
              <div><div className="text-sm font-bold" style={{ color: C.text }}>{x.name} <span style={{ color: C.text4 }}>· {x.pos}</span></div><div className="text-[11px] mt-0.5" style={{ color: C.text4 }}>{x.injury} · since {x.date} · {x.note}</div></div>
              <div className="text-right"><div className="text-[10px]" style={{ color: C.text4 }}>Expected return</div><div className="text-xs font-bold" style={{ color: x.eta === 'Available' ? C.good : rc(x.status) }}>{x.eta}</div></div>
            </div>
            <div className="flex items-center gap-1">{PHASES.map((ph, idx) => { const reached = idx + 1 <= x.phase; const current = idx + 1 === x.phase; return (
              <div key={ph} className="flex-1">
                <div className="h-1.5 rounded-full" style={{ background: reached ? (current ? rc(x.status) : p.accent) : C.border }} />
                <div className="text-[8px] mt-1 text-center" style={{ color: current ? rc(x.status) : reached ? C.text3 : C.text4, fontWeight: current ? 700 : 400 }}>{ph}</div>
              </div>
            ) })}</div>
          </div>
        ))}</div>
      )}

      {tab === 'milestones' && (
        <div className="space-y-4">{Object.entries(p.milestones).map(([player, ms]) => { const done = ms.filter(m => m.done).length; return (
          <div key={player} className="rounded-xl p-4" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
            <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-bold" style={{ color: C.text }}>{player}</h3><span className="text-[11px]" style={{ color: C.text4 }}>{done}/{ms.length} milestones</span></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">{ms.map((m, i) => (
              <div key={i} className="flex items-center gap-2 text-xs"><span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: m.done ? `${C.good}33` : C.panelAlt, border: `1px solid ${m.done ? C.good + '80' : C.border}` }}>{m.done && <span style={{ color: C.good, fontSize: 9 }}>✓</span>}</span><span style={{ color: m.done ? C.text3 : C.text2, textDecoration: m.done ? 'line-through' : 'none' }}>{m.label}</span></div>
            ))}</div>
          </div>
        ) })}</div>
      )}

      {tab === 'clearance' && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: C.panel, border: `1px solid ${C.border}` }}>
          <table className="w-full text-xs"><thead><tr style={{ background: 'rgba(17,24,39,0.3)' }}>{['Player', 'Clearance gate', 'Owner', 'Status'].map(h => <th key={h} className="text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.text4 }}>{h}</th>)}</tr></thead>
            <tbody>{p.clearance.map((c, i) => (<tr key={i} style={{ borderTop: `1px solid ${C.border}` }}><td className="px-4 py-2.5 font-semibold" style={{ color: C.text }}>{c.player}</td><td className="px-4 py-2.5" style={{ color: C.text3 }}>{c.test}</td><td className="px-4 py-2.5" style={{ color: C.text4 }}>{c.owner}</td><td className="px-4 py-2.5"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${rc(c.status)}1f`, color: rc(c.status) }}>{c.status === 'green' ? 'Cleared' : c.status === 'amber' ? 'Final gate' : 'Not cleared'}</span></td></tr>))}</tbody>
          </table>
          <div className="px-4 py-2.5 text-[10px]" style={{ borderTop: `1px solid ${C.border}`, color: C.text4 }}>GRTP sign-off requires medical + performance agreement against objective criteria (strength LSI, hop tests, GPS exposure) before the head coach is advised available.</div>
        </div>
      )}

      <div className="rounded-xl p-3 text-[11px]" style={{ background: `${p.accent}12`, borderLeft: `3px solid ${p.accent}`, color: C.text2 }}>
        Demo — illustrative only. Injuries, phases, milestones and return dates are invented demo values.
      </div>
    </div>
  )
}
