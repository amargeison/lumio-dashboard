'use client'

// Junior Football — Coach Toolkit.
//
// Light-touch by design — a volunteer coach interacts only with the
// brief, the squad view, and the team selector. Surfaces:
//   - This week's coaching brief (canned)
//   - Session planner (templates + recent sessions)
//   - Drill library (filterable by age band + focus)
//   - Drag-and-drop team selection (drag-handles only — drag-drop
//     library wiring is out of scope for this commit; UI shape only)
//   - FIFA-style junior player cards (the small grid of stat tokens)

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
  accentDeep: '#166534',
  accentDim:  'rgba(22,163,74,0.12)',
  good:       '#22C55E',
  warn:       '#F59E0B',
  bad:        '#EF4444',
} as const

type Tab = 'brief' | 'sessions' | 'drills' | 'selection'

interface SessionPlan {
  id: string
  date: string
  team: string
  focus: string
  duration: number
  blocks: { label: string; minutes: number }[]
  status: 'drafted' | 'delivered' | 'scheduled'
}

interface Drill {
  id: string
  name: string
  ageBands: string[]
  focus: 'technical' | 'tactical' | 'physical' | 'psychological'
  durationMin: number
  description: string
}

interface PlayerCard {
  id: string
  name: string
  pos: 'GK' | 'DEF' | 'MID' | 'FWD'
  shirt: number
  /** FIFA-style attribute tokens. Junior context: small set, age-appropriate. */
  attrs: {
    technical: number
    physical:  number
    decision:  number
    teamplay:  number
  }
  status: 'fit' | 'doubt' | 'unavailable'
}

const SESSIONS: SessionPlan[] = [
  {
    id: 'sn-001', date: 'Tue 21 May', team: 'U11 Lions', focus: 'Passing patterns under pressure', duration: 75,
    blocks: [
      { label: 'Arrival & rondo warm-up',         minutes: 10 },
      { label: 'Tech: 1-2 combination passing',   minutes: 15 },
      { label: 'Game: 4v2 rondo (small pitch)',    minutes: 15 },
      { label: 'Phase of play: build from the back',minutes: 25 },
      { label: 'Cool-down + reflection',          minutes: 10 },
    ],
    status: 'delivered',
  },
  {
    id: 'sn-002', date: 'Thu 23 May', team: 'U14 Eagles', focus: 'Defensive shape — mid block',     duration: 90,
    blocks: [
      { label: 'Activation + agility ladders',    minutes: 15 },
      { label: 'Tactical walk-through (mid block)', minutes: 20 },
      { label: 'Conditioned 8v8 game',            minutes: 40 },
      { label: 'Cool-down + reflection',          minutes: 15 },
    ],
    status: 'scheduled',
  },
  {
    id: 'sn-003', date: 'Sat 18 May', team: 'U9 Tigers', focus: 'Fun + first-touch (FA Play)',      duration: 60,
    blocks: [
      { label: 'Free dribbling games',            minutes: 15 },
      { label: 'Skill stations (3×)',             minutes: 20 },
      { label: 'Small-sided matches',             minutes: 20 },
      { label: 'Cool-down (high-fives + question)', minutes: 5  },
    ],
    status: 'delivered',
  },
]

const DRILLS: Drill[] = [
  { id: 'dl-001', name: 'Rondo 4v2 (small pitch)',           ageBands: ['U9','U11','U13'],  focus: 'technical', durationMin: 12, description: 'Classic possession box. Two pressers in the middle, four around the edge — quick one-touch passing.' },
  { id: 'dl-002', name: 'Cone gates — change of direction',  ageBands: ['U7','U9'],         focus: 'physical',  durationMin: 10, description: 'Coloured cone gates; players sprint between gates on coach call. Age-appropriate agility.' },
  { id: 'dl-003', name: '1v1 attacking duels',               ageBands: ['U11','U13','U14'], focus: 'technical', durationMin: 15, description: 'Defender plays the ball into the attacker; attacker takes on with two touches + a finish.' },
  { id: 'dl-004', name: 'Build-from-the-back phase',         ageBands: ['U13','U14','U16'], focus: 'tactical',  durationMin: 20, description: 'Goalkeeper + back line vs a press of two strikers; objective is to play out cleanly past the halfway line.' },
  { id: 'dl-005', name: 'Team huddle reflection',            ageBands: ['U7','U9','U11'],   focus: 'psychological', durationMin: 5,  description: 'Two questions: "what went well?" and "one thing for next time?". No coach answers — players only.' },
  { id: 'dl-006', name: '8v8 conditioned game',              ageBands: ['U13','U14','U16'], focus: 'tactical',  durationMin: 30, description: 'Two-touch maximum in own half, free in opposition half. Forces composure under pressure.' },
]

const U11_SQUAD: PlayerCard[] = [
  { id: 'p-01', name: 'Jack Carter',   pos: 'MID', shirt: 8,  attrs: { technical: 78, physical: 65, decision: 74, teamplay: 82 }, status: 'fit' },
  { id: 'p-02', name: 'Ollie Wren',    pos: 'GK',  shirt: 1,  attrs: { technical: 70, physical: 72, decision: 76, teamplay: 78 }, status: 'fit' },
  { id: 'p-03', name: 'Maya Singh',    pos: 'DEF', shirt: 4,  attrs: { technical: 72, physical: 75, decision: 71, teamplay: 80 }, status: 'fit' },
  { id: 'p-04', name: 'Zac Daley',     pos: 'DEF', shirt: 5,  attrs: { technical: 66, physical: 78, decision: 68, teamplay: 74 }, status: 'doubt' },
  { id: 'p-05', name: 'Aria Khoury',   pos: 'MID', shirt: 6,  attrs: { technical: 80, physical: 62, decision: 78, teamplay: 81 }, status: 'fit' },
  { id: 'p-06', name: 'Liam Forrest',  pos: 'MID', shirt: 10, attrs: { technical: 82, physical: 64, decision: 80, teamplay: 76 }, status: 'fit' },
  { id: 'p-07', name: 'Ravi Doshi',    pos: 'FWD', shirt: 9,  attrs: { technical: 79, physical: 70, decision: 73, teamplay: 70 }, status: 'fit' },
  { id: 'p-08', name: 'Beth Halpern',  pos: 'FWD', shirt: 11, attrs: { technical: 76, physical: 68, decision: 72, teamplay: 74 }, status: 'fit' },
  { id: 'p-09', name: 'Ben Aitken',    pos: 'DEF', shirt: 2,  attrs: { technical: 68, physical: 76, decision: 70, teamplay: 75 }, status: 'fit' },
]

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl p-5 ${className ?? ''}`} style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
      {children}
    </div>
  )
}

function attrColor(v: number) {
  if (v >= 80) return T.good
  if (v >= 70) return T.accent
  if (v >= 60) return T.warn
  return T.bad
}

function PlayerTile({ p }: { p: PlayerCard }) {
  const overall = Math.round((p.attrs.technical + p.attrs.physical + p.attrs.decision + p.attrs.teamplay) / 4)
  const statusBadge =
    p.status === 'fit'         ? { label: 'Fit',         color: T.good } :
    p.status === 'doubt'       ? { label: 'Doubt',       color: T.warn } :
                                 { label: 'Unavailable', color: T.bad  }
  return (
    <div
      className="rounded-lg p-3"
      style={{
        background: `linear-gradient(135deg, ${T.accentDim} 0%, transparent 70%)`,
        border: `1px solid ${T.borderSoft}`,
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0">
          <p className="text-xs font-bold truncate" style={{ color: T.text }}>{p.name}</p>
          <p className="text-[10px]" style={{ color: T.text4 }}>#{p.shirt} · {p.pos}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-black leading-none" style={{ color: attrColor(overall) }}>{overall}</p>
          <p className="text-[9px] uppercase tracking-wider" style={{ color: T.text4 }}>overall</p>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1 mb-2">
        {([
          ['TEC', p.attrs.technical],
          ['PHY', p.attrs.physical],
          ['DEC', p.attrs.decision],
          ['TEM', p.attrs.teamplay],
        ] as [string, number][]).map(([k, v]) => (
          <div key={k} className="rounded p-1 text-center" style={{ backgroundColor: T.panel }}>
            <p className="text-[8px] uppercase tracking-wider" style={{ color: T.text4 }}>{k}</p>
            <p className="text-[10px] font-bold tnum" style={{ color: attrColor(v) }}>{v}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span
          className="text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wide font-semibold"
          style={{ backgroundColor: `${statusBadge.color}1e`, color: statusBadge.color }}
        >
          {statusBadge.label}
        </span>
        <span className="text-[10px]" style={{ color: T.text4 }} aria-hidden>⠿</span>
      </div>
    </div>
  )
}

export default function JuniorCoachToolkit({ session: _session }: { session: SportsDemoSession }) {
  const [tab, setTab] = useState<Tab>('brief')

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'brief',     label: "Today's brief",  icon: '📋' },
    { id: 'sessions',  label: 'Session planner', icon: '🏃' },
    { id: 'drills',    label: 'Drill library',  icon: '📚' },
    { id: 'selection', label: 'Team selection', icon: '👥' },
  ]

  const nextSession = SESSIONS.find(s => s.status === 'scheduled') ?? SESSIONS[0]

  return (
    <div className="space-y-4">
      <div
        className="rounded-xl p-5"
        style={{
          background: `linear-gradient(135deg, ${T.accentDim} 0%, rgba(22,101,52,0.04) 60%, transparent 100%)`,
          border: `1px solid ${T.accent}55`,
        }}
      >
        <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: T.accent }}>Coach Toolkit</p>
        <h2 className="text-lg font-bold" style={{ color: T.text }}>Light-touch by design</h2>
        <p className="text-sm mt-1 leading-relaxed" style={{ color: T.text2 }}>
          Volunteer-friendly. Most coaches will only ever use the brief, the squad
          view and the team selector — everything else is here when you want it,
          out of the way when you don&apos;t.
        </p>
      </div>

      <div className="flex gap-1 border-b flex-wrap" style={{ borderColor: T.border }}>
        {tabs.map(t => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className="px-4 py-2.5 text-xs font-semibold transition-all"
              style={{
                color: active ? T.good : T.text4,
                borderBottom: active ? `2px solid ${T.good}` : '2px solid transparent',
              }}
            >
              <span className="mr-1.5">{t.icon}</span>{t.label}
            </button>
          )
        })}
      </div>

      {tab === 'brief' && (
        <div className="space-y-4">
          <Card>
            <p className="text-sm font-bold mb-1" style={{ color: T.text }}>This week's coaching brief</p>
            <p className="text-[11px] mb-3" style={{ color: T.text4 }}>From the Head of Coaching · refreshed Monday</p>
            <ul className="space-y-2 text-xs" style={{ color: T.text2 }}>
              <li>• <strong>Focus:</strong> playing out from the back · transition speed once we win the ball.</li>
              <li>• <strong>Watch:</strong> last week's 8v8 conditioned game video clip (3 mins) — note the press triggers.</li>
              <li>• <strong>Welfare:</strong> Zac Daley returning from a knock — light minutes only on Tuesday.</li>
              <li>• <strong>Charter:</strong> Charter Standard refresher session due this month — short course in the Coach Toolkit.</li>
              <li>• <strong>FA Respect:</strong> remind parents about touchline behaviour ahead of the cup tie on Saturday.</li>
            </ul>
          </Card>

          <Card>
            <p className="text-sm font-bold mb-1" style={{ color: T.text }}>Next session</p>
            <p className="text-[11px] mb-3" style={{ color: T.text4 }}>{nextSession.date} · {nextSession.team} · {nextSession.duration} min</p>
            <p className="text-sm mb-3" style={{ color: T.text2 }}>{nextSession.focus}</p>
            <ul className="space-y-1">
              {nextSession.blocks.map(b => (
                <li key={b.label} className="flex items-center justify-between text-xs py-1.5" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                  <span style={{ color: T.text2 }}>{b.label}</span>
                  <span className="font-mono text-[11px]" style={{ color: T.text4 }}>{b.minutes} min</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {tab === 'sessions' && (
        <Card>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <p className="text-sm font-bold" style={{ color: T.text }}>Session planner</p>
            <button
              type="button"
              className="text-[11px] px-3 py-1.5 rounded-lg font-medium"
              style={{ backgroundColor: T.accentDim, color: T.good, border: `1px solid ${T.accent}55` }}
            >
              New session from template (demo)
            </button>
          </div>
          <ul className="space-y-3">
            {SESSIONS.map(s => {
              const badge =
                s.status === 'delivered' ? { label: 'Delivered', color: T.good } :
                s.status === 'scheduled' ? { label: 'Scheduled', color: T.accent } :
                                           { label: 'Drafted',   color: T.warn  }
              return (
                <li key={s.id} className="rounded-lg p-3" style={{ backgroundColor: T.panelAlt, border: `1px solid ${T.borderSoft}` }}>
                  <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold" style={{ color: T.text }}>{s.team} · {s.focus}</p>
                      <p className="text-[10px]" style={{ color: T.text4 }}>{s.date} · {s.duration} min · {s.blocks.length} blocks</p>
                    </div>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded uppercase tracking-wide font-semibold"
                      style={{ backgroundColor: `${badge.color}1e`, color: badge.color }}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {s.blocks.map(b => (
                      <span key={b.label} className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: T.panel, color: T.text3, border: `1px solid ${T.borderSoft}` }}>
                        {b.label} · {b.minutes}m
                      </span>
                    ))}
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      {tab === 'drills' && (
        <Card>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <p className="text-sm font-bold" style={{ color: T.text }}>Drill library</p>
            <span className="text-[11px]" style={{ color: T.text3 }}>{DRILLS.length} drills · filter by age band + focus (demo)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {DRILLS.map(d => (
              <div
                key={d.id}
                className="rounded-lg p-3"
                style={{ backgroundColor: T.panelAlt, border: `1px solid ${T.borderSoft}` }}
              >
                <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                  <p className="text-xs font-semibold" style={{ color: T.text }}>{d.name}</p>
                  <span className="text-[10px] font-mono" style={{ color: T.text4 }}>{d.durationMin} min</span>
                </div>
                <p className="text-[11px] leading-relaxed mb-2" style={{ color: T.text2 }}>{d.description}</p>
                <div className="flex flex-wrap gap-1">
                  <span
                    className="text-[10px] px-2 py-0.5 rounded uppercase tracking-wide font-semibold"
                    style={{ backgroundColor: T.accentDim, color: T.good }}
                  >
                    {d.focus}
                  </span>
                  {d.ageBands.map(a => (
                    <span key={a} className="text-[10px] px-2 py-0.5 rounded font-mono" style={{ backgroundColor: T.panel, color: T.text3, border: `1px solid ${T.borderSoft}` }}>
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'selection' && (
        <Card>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div>
              <p className="text-sm font-bold" style={{ color: T.text }}>Team selection — U11 Lions (demo)</p>
              <p className="text-[11px]" style={{ color: T.text3 }}>
                Drag-and-drop to set the starting XI / bench. Drag handles shown
                (⠿) — drag-drop wiring lands in a later commit; this is the UI
                shape only.
              </p>
            </div>
            <button
              type="button"
              className="text-[11px] px-3 py-1.5 rounded-lg font-medium"
              style={{ backgroundColor: T.accentDim, color: T.good, border: `1px solid ${T.accent}55` }}
            >
              Save selection (demo)
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {U11_SQUAD.map(p => <PlayerTile key={p.id} p={p} />)}
          </div>
        </Card>
      )}
    </div>
  )
}
