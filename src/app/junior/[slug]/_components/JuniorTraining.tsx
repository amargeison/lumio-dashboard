'use client'

// Junior Football — Training.
//
// Weekly session plans + drill library + attendance. Age-appropriate
// drills tagged by phase. Demo data is canned.

import { useState } from 'react'
import type { SportsDemoSession } from '@/components/sports-demo/SportsDemoGate'

const T = {
  panel:      '#0D1117',
  panelAlt:   '#111318',
  border:     '#1F2937',
  borderSoft: '#1A2030',
  text:       '#F9FAFB',
  text2:      '#D1D5DB',
  text3:      '#9CA3AF',
  text4:      '#6B7280',
  accent:     '#16A34A',
  accentDim:  'rgba(22,163,74,0.12)',
  good:       '#22C55E',
  warn:       '#F59E0B',
  bad:        '#EF4444',
  blue:       '#3B82F6',
} as const

type Phase = 'foundation' | 'development' | 'youth'

const PHASE_LABEL: Record<Phase, string> = {
  foundation:  'Foundation · U7–U9',
  development: 'Development · U10–U12',
  youth:       'Youth · U13–U16',
}

interface Session {
  day: string
  time: string
  team: string
  phase: Phase
  focus: string
  drills: string[]
  attendance: { present: number; squad: number }
  coach: string
}

interface Drill {
  id: string
  name: string
  phase: Phase | 'all'
  focus: 'technical' | 'physical' | 'social' | 'psychological'
  duration: number
  description: string
}

const SESSIONS: Session[] = [
  { day: 'Mon', time: '17:30', team: 'U7 Cubs',     phase: 'foundation',  focus: 'Ball mastery + listening',    drills: ['Sharks and minnows', 'Traffic lights', 'Mini-games (2v2)'],        attendance: { present: 11, squad: 12 }, coach: 'P. Connolly' },
  { day: 'Mon', time: '18:30', team: 'U9 Tigers',   phase: 'foundation',  focus: 'Passing under no pressure',   drills: ['Pass + move squares', 'Triangle rondo (3v1)', 'Score-from-pass game'], attendance: { present: 14, squad: 14 }, coach: 'S. Mills' },
  { day: 'Tue', time: '18:00', team: 'U11 Lions',   phase: 'development', focus: 'Scanning before receiving',   drills: ['Colour-call rondo', 'Y-shape passing', '4v4+2 with shadow ref'],   attendance: { present: 11, squad: 12 }, coach: 'M. Hutchings' },
  { day: 'Wed', time: '17:30', team: 'U10 Hawks',   phase: 'development', focus: '1v1 attacking',               drills: ['Beat the cone', '1v1 to small goals', 'Ronaldinho turn drill'],     attendance: { present: 13, squad: 14 }, coach: 'G. Yardley' },
  { day: 'Wed', time: '19:00', team: 'U13 Falcons', phase: 'development', focus: 'Switching the play',          drills: ['Cross-pitch switches', '6v6 with side-zones', 'Conditioned game'], attendance: { present: 13, squad: 14 }, coach: 'G. Yardley' },
  { day: 'Thu', time: '18:30', team: 'U14 Eagles',  phase: 'youth',       focus: 'Defending 1v1',               drills: ['Jockey-and-poke', '1v1 channel game', 'Conditioned 7v7 defending'], attendance: { present: 12, squad: 13 }, coach: 'D. Patel' },
  { day: 'Thu', time: '19:30', team: 'U16 Saints',  phase: 'youth',       focus: 'Set-piece delivery',          drills: ['Whipped corners', 'Indirect FK routines', 'Crossing + finishing'],  attendance: { present: 14, squad: 16 }, coach: 'D. Patel' },
  { day: 'Fri', time: '18:00', team: 'U11 Lions',   phase: 'development', focus: 'Match prep (Sat away)',       drills: ['Walk-throughs', 'Set-piece review', '4v4 tactical games'],         attendance: { present: 12, squad: 12 }, coach: 'M. Hutchings' },
]

const DRILLS: Drill[] = [
  { id: 'd-001', name: 'Sharks and minnows',  phase: 'foundation',  focus: 'technical',     duration: 12, description: 'One or two "sharks" without a ball try to tag minnows who dribble across the area. Restart from a coned end-line.' },
  { id: 'd-002', name: 'Traffic lights',      phase: 'foundation',  focus: 'physical',      duration: 8,  description: 'Coach calls red / amber / green. Players stop / slow / sprint with the ball. Adds coordination + listening.' },
  { id: 'd-003', name: 'Triangle rondo (3v1)',phase: 'all',         focus: 'technical',     duration: 10, description: 'Three players around the triangle, one in the middle. Two-touch only. Switch the defender after every 6 passes.' },
  { id: 'd-004', name: 'Colour-call rondo',   phase: 'development', focus: 'psychological', duration: 12, description: 'Players wear coloured bibs. Coach shouts a colour the moment the ball travels — the called player must scan before receiving.' },
  { id: 'd-005', name: 'Y-shape passing',     phase: 'development', focus: 'technical',     duration: 12, description: 'Three lines form a Y. Pass to the apex, follow your pass, receive at the second cone. Both feet, two-touch then one-touch.' },
  { id: 'd-006', name: 'Beat the cone',       phase: 'development', focus: 'technical',     duration: 10, description: 'Each player picks a 1v1 move (step-over, cut, drag-back). Cone is the defender. Coach calls the move; player executes at pace.' },
  { id: 'd-007', name: '1v1 to small goals',  phase: 'all',         focus: 'social',        duration: 12, description: 'Two queues either side, two small goals. Player on the ball attacks; defender presses. Rotate queues every minute.' },
  { id: 'd-008', name: 'Cross-pitch switches',phase: 'development', focus: 'technical',     duration: 15, description: '4v4 in two zones either side of a no-go strip. Score a goal only after switching the ball at least once.' },
  { id: 'd-009', name: 'Jockey-and-poke',     phase: 'youth',       focus: 'technical',     duration: 12, description: 'Defender shows attacker onto the weaker foot, jockeys, pokes only when the touch is heavy. Repeat from both wings.' },
  { id: 'd-010', name: 'Whipped corners',     phase: 'youth',       focus: 'technical',     duration: 12, description: 'In-swinging and out-swinging corners. Three target zones marked. Track who delivers, who arrives, who scores.' },
  { id: 'd-011', name: 'Indirect FK routines',phase: 'youth',       focus: 'psychological', duration: 12, description: 'Three pre-agreed routines (overload-left, second-ball-back, dummy-then-shoot). Walk-through, then under pressure.' },
  { id: 'd-012', name: 'Conditioned game',    phase: 'all',         focus: 'social',        duration: 20, description: 'Small-sided game with the day\'s constraint baked in (e.g. must pass before shooting, no goals from outside the area).' },
]

interface Props {
  session: SportsDemoSession
  demoChild?: { name: string; ageBand: string; team: string }
}

export default function JuniorTraining({ session }: Props) {
  const [phaseFilter, setPhaseFilter] = useState<'all' | Phase>('all')
  const filteredDrills = phaseFilter === 'all'
    ? DRILLS
    : DRILLS.filter(d => d.phase === phaseFilter || d.phase === 'all')

  const totals = SESSIONS.reduce(
    (acc, s) => {
      acc.present += s.attendance.present
      acc.squad += s.attendance.squad
      return acc
    },
    { present: 0, squad: 0 },
  )
  const attendancePct = totals.squad === 0 ? 0 : Math.round((totals.present / totals.squad) * 100)

  return (
    <div className="space-y-4">
      <div
        className="rounded-xl p-5"
        style={{
          background: `linear-gradient(135deg, ${T.accentDim} 0%, rgba(22,101,52,0.04) 60%, transparent 100%)`,
          border: `1px solid ${T.accent}55`,
        }}
      >
        <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: T.accent }}>
          Training
        </p>
        <h2 className="text-lg font-bold" style={{ color: T.text }}>
          This week · {SESSIONS.length} sessions · {attendancePct}% attendance
        </h2>
        <p className="text-sm mt-1 leading-relaxed" style={{ color: T.text2 }}>
          Session plans, attendance and the drill library. Charter Standard
          evidence pack picks up session counts and attendance automatically.
          Signed in as <span style={{ color: T.text }}>{session.userName || session.role}</span>.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiTile label="Sessions this week" value={SESSIONS.length} tone="good" />
        <KpiTile label="Players present" value={`${totals.present}/${totals.squad}`} tone="neutral" />
        <KpiTile label="Attendance %" value={`${attendancePct}%`} tone={attendancePct >= 90 ? 'good' : 'warn'} />
        <KpiTile label="Drills in library" value={DRILLS.length} tone="neutral" />
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
        <table className="w-full text-xs">
          <thead style={{ backgroundColor: T.panelAlt, color: T.text3 }}>
            <tr className="text-left">
              <th className="px-3 py-2 font-semibold">Day</th>
              <th className="px-3 py-2 font-semibold">Time</th>
              <th className="px-3 py-2 font-semibold">Team</th>
              <th className="px-3 py-2 font-semibold">Focus</th>
              <th className="px-3 py-2 font-semibold">Drills</th>
              <th className="px-3 py-2 font-semibold">Attendance</th>
              <th className="px-3 py-2 font-semibold">Coach</th>
            </tr>
          </thead>
          <tbody>
            {SESSIONS.map((s, i) => {
              const pct = Math.round((s.attendance.present / s.attendance.squad) * 100)
              return (
                <tr key={i} style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                  <td className="px-3 py-2 font-semibold" style={{ color: T.text }}>{s.day}</td>
                  <td className="px-3 py-2 font-mono" style={{ color: T.text3 }}>{s.time}</td>
                  <td className="px-3 py-2" style={{ color: T.text }}>{s.team}</td>
                  <td className="px-3 py-2" style={{ color: T.text2 }}>{s.focus}</td>
                  <td className="px-3 py-2 text-[11px]" style={{ color: T.text3 }}>{s.drills.join(' · ')}</td>
                  <td className="px-3 py-2 font-mono" style={{ color: pct >= 90 ? T.good : pct >= 80 ? T.warn : T.bad }}>
                    {s.attendance.present}/{s.attendance.squad} ({pct}%)
                  </td>
                  <td className="px-3 py-2" style={{ color: T.text3 }}>{s.coach}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <p className="text-sm font-bold" style={{ color: T.text }}>Drill library</p>
          <div className="flex gap-2">
            {(['all', 'foundation', 'development', 'youth'] as const).map(p => {
              const active = phaseFilter === p
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPhaseFilter(p)}
                  className="px-3 py-1 rounded-lg text-[10px] font-semibold transition-colors"
                  style={{
                    backgroundColor: active ? T.accentDim : 'transparent',
                    border: `1px solid ${active ? T.accent : T.border}`,
                    color: active ? T.good : T.text3,
                  }}
                >
                  {p === 'all' ? 'All phases' : PHASE_LABEL[p]}
                </button>
              )
            })}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredDrills.map(d => (
            <div key={d.id} className="rounded-lg p-3" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-sm font-bold" style={{ color: T.text }}>{d.name}</p>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono" style={{ color: T.text3, backgroundColor: T.panelAlt, border: `1px solid ${T.borderSoft}` }}>
                  {d.duration}m
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: T.accentDim, color: T.good }}>
                  {d.phase === 'all' ? 'All phases' : PHASE_LABEL[d.phase]}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded capitalize" style={{ backgroundColor: T.panelAlt, color: T.text3 }}>
                  {d.focus}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: T.text2 }}>{d.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function KpiTile({ label, value, tone }: { label: string; value: string | number; tone: 'good' | 'warn' | 'bad' | 'neutral' }) {
  const colorMap: Record<typeof tone, string> = { good: T.good, warn: T.warn, bad: T.bad, neutral: T.text }
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
      <div className="text-2xl font-bold" style={{ color: colorMap[tone] }}>{value}</div>
      <div className="text-xs mt-0.5" style={{ color: T.text3 }}>{label}</div>
    </div>
  )
}
