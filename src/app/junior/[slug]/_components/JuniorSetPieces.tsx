'use client'

// Junior Football — Set Pieces.
//
// Age-appropriate set-piece routines. Foundation phase is mostly
// "everyone arrives, ball goes in" reality; structure appears at U10
// and grows from there.
//
// Demo data is canned.

import { useState } from 'react'
import type { SportsDemoSession } from '@/components/sports-demo/SportsDemoGate'

const T = {
  panel:      '#0D1117',
  panelAlt:   '#111318',
  border:     '#1F2937',
  borderSoft: '#1A2030',
  pitch:      '#0A2E1A',
  pitchLine:  'rgba(255,255,255,0.18)',
  text:       '#F9FAFB',
  text2:      '#D1D5DB',
  text3:      '#9CA3AF',
  text4:      '#6B7280',
  accent:     '#16A34A',
  accentDim:  'rgba(22,163,74,0.12)',
  good:       '#22C55E',
  attackerColor: '#22C55E',
  defenderColor: '#EF4444',
  runColor:   '#F59E0B',
  passColor:  '#3B82F6',
} as const

type Kind = 'corner' | 'free_kick' | 'throw_in' | 'goal_kick'

interface Routine {
  id: string
  kind: Kind
  name: string
  ageBand: string
  description: string
  /** Coordinates as 0..1 of the half-pitch we draw. */
  attackers: { x: number; y: number; label: string }[]
  defenders: { x: number; y: number }[]
  runs?: { from: [number, number]; to: [number, number] }[]
  passes?: { from: [number, number]; to: [number, number] }[]
}

const ROUTINES: Routine[] = [
  {
    id: 'corner-near-post-flick',
    kind: 'corner',
    name: 'Near-post flick',
    ageBand: 'U11+',
    description: 'In-swinging corner aimed at the near-post runner. Runner flicks on with the head; second-ball striker arrives from the far side. Other attackers create traffic in the six-yard box.',
    attackers: [
      { x: 0.02, y: 0.06, label: 'K' },     // kicker at corner flag
      { x: 0.28, y: 0.18, label: 'A1' },    // near-post runner
      { x: 0.55, y: 0.22, label: 'A2' },    // far-post arriving
      { x: 0.45, y: 0.32, label: 'A3' },    // edge of box, late
      { x: 0.20, y: 0.30, label: 'A4' },    // 6-yard box screener
    ],
    defenders: [
      { x: 0.50, y: 0.05 },                  // GK
      { x: 0.30, y: 0.18 },
      { x: 0.55, y: 0.20 },
      { x: 0.42, y: 0.30 },
      { x: 0.65, y: 0.32 },
    ],
    runs: [
      { from: [0.45, 0.40], to: [0.28, 0.18] }, // A1 sprint to near post
      { from: [0.60, 0.42], to: [0.55, 0.22] }, // A2 arrives far post
    ],
    passes: [
      { from: [0.02, 0.06], to: [0.28, 0.18] }, // delivery
    ],
  },
  {
    id: 'corner-short-overload',
    kind: 'corner',
    name: 'Short-corner overload',
    ageBand: 'U13+',
    description: 'Two attackers play the corner short, drag a defender out. Quick combination then a cross from the wide channel onto a 3-runner near-post pattern.',
    attackers: [
      { x: 0.02, y: 0.06, label: 'K' },
      { x: 0.14, y: 0.18, label: 'A1' },     // short receiver
      { x: 0.30, y: 0.18, label: 'A2' },     // near post run
      { x: 0.50, y: 0.22, label: 'A3' },     // back-post arriving
      { x: 0.42, y: 0.34, label: 'A4' },     // edge of area
    ],
    defenders: [
      { x: 0.50, y: 0.05 },
      { x: 0.14, y: 0.20 },                  // dragged out
      { x: 0.32, y: 0.20 },
      { x: 0.52, y: 0.22 },
      { x: 0.62, y: 0.30 },
    ],
    runs: [
      { from: [0.30, 0.30], to: [0.30, 0.18] },
      { from: [0.62, 0.32], to: [0.50, 0.22] },
    ],
    passes: [
      { from: [0.02, 0.06], to: [0.14, 0.18] },
      { from: [0.14, 0.18], to: [0.30, 0.18] },
    ],
  },
  {
    id: 'fk-indirect-overload-left',
    kind: 'free_kick',
    name: 'Indirect FK · overload left',
    ageBand: 'U12+',
    description: 'Pre-agreed indirect free kick 25 yards out. Two attackers split right, three overload the left. Ball is rolled inside for a left-footed striker.',
    attackers: [
      { x: 0.42, y: 0.55, label: 'K' },
      { x: 0.36, y: 0.55, label: 'A1' },     // roller
      { x: 0.28, y: 0.50, label: 'A2' },     // left overload
      { x: 0.20, y: 0.40, label: 'A3' },     // left overload
      { x: 0.68, y: 0.42, label: 'A4' },     // right decoy
      { x: 0.78, y: 0.34, label: 'A5' },     // right decoy
    ],
    defenders: [
      { x: 0.50, y: 0.05 },
      { x: 0.46, y: 0.36 }, { x: 0.50, y: 0.36 }, { x: 0.54, y: 0.36 }, // 3-man wall
      { x: 0.36, y: 0.30 }, { x: 0.62, y: 0.34 },
    ],
    runs: [
      { from: [0.78, 0.34], to: [0.50, 0.18] }, // right decoy late
      { from: [0.20, 0.40], to: [0.30, 0.30] }, // overload arrives
    ],
    passes: [
      { from: [0.42, 0.55], to: [0.36, 0.55] }, // tap to roller
      { from: [0.36, 0.55], to: [0.28, 0.46] }, // roller plays inside
    ],
  },
  {
    id: 'fk-direct-wall-charlie',
    kind: 'free_kick',
    name: 'Direct FK · wall trick',
    ageBand: 'U13+',
    description: 'Wall is set. Decoy striker stands in the wall and ducks at the last second. Direct strike under the wall into the bottom corner. Coached as a Friday-only routine — high reward, high failure rate at junior age.',
    attackers: [
      { x: 0.46, y: 0.55, label: 'K' },
      { x: 0.50, y: 0.36, label: 'A1' },     // in the wall, ducks
      { x: 0.30, y: 0.40, label: 'A2' },     // shadow runner
      { x: 0.70, y: 0.40, label: 'A3' },     // shadow runner
    ],
    defenders: [
      { x: 0.50, y: 0.05 },
      { x: 0.46, y: 0.36 }, { x: 0.50, y: 0.36 }, { x: 0.54, y: 0.36 },
      { x: 0.30, y: 0.30 }, { x: 0.66, y: 0.30 },
    ],
    passes: [
      { from: [0.46, 0.55], to: [0.40, 0.10] },
    ],
  },
  {
    id: 'throw-in-down-the-line',
    kind: 'throw_in',
    name: 'Throw-in · down the line',
    ageBand: 'U9+',
    description: 'Receiver shows for the ball, lays it back first time; thrower has continued down the touchline and receives in space. The simplest junior throw routine — works every age band.',
    attackers: [
      { x: 0.02, y: 0.40, label: 'K' },
      { x: 0.14, y: 0.40, label: 'A1' },
      { x: 0.30, y: 0.36, label: 'A2' },
    ],
    defenders: [
      { x: 0.18, y: 0.40 },
      { x: 0.32, y: 0.36 },
    ],
    runs: [
      { from: [0.02, 0.40], to: [0.16, 0.30] }, // thrower releases down the line
    ],
    passes: [
      { from: [0.02, 0.40], to: [0.14, 0.40] }, // throw
      { from: [0.14, 0.40], to: [0.16, 0.30] }, // lay-off
    ],
  },
  {
    id: 'goal-kick-play-out',
    kind: 'goal_kick',
    name: 'Goal kick · play out from the back',
    ageBand: 'U10+',
    description: 'FA player-pathway favourite. Defenders split wide of the box, goalkeeper rolls the ball out — never punts. Midfielder drops to give the third-man option.',
    attackers: [
      { x: 0.50, y: 0.92, label: 'GK' },
      { x: 0.22, y: 0.82, label: 'A1' },
      { x: 0.78, y: 0.82, label: 'A2' },
      { x: 0.50, y: 0.66, label: 'A3' },
    ],
    defenders: [
      { x: 0.40, y: 0.74 },
      { x: 0.60, y: 0.74 },
      { x: 0.50, y: 0.58 },
    ],
    passes: [
      { from: [0.50, 0.92], to: [0.22, 0.82] },
      { from: [0.22, 0.82], to: [0.50, 0.66] },
    ],
  },
]

const KIND_LABEL: Record<Kind, string> = {
  corner:    'Corners',
  free_kick: 'Free kicks',
  throw_in:  'Throw-ins',
  goal_kick: 'Goal kicks',
}

interface Props {
  session: SportsDemoSession
  demoChild?: { name: string; ageBand: string; team: string }
}

export default function JuniorSetPieces({ session }: Props) {
  const [id, setId] = useState(ROUTINES[0].id)
  const routine = ROUTINES.find(r => r.id === id) ?? ROUTINES[0]
  const counts = (Object.keys(KIND_LABEL) as Kind[]).map(k => ({ k, n: ROUTINES.filter(r => r.kind === k).length }))

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
          Set Pieces
        </p>
        <h2 className="text-lg font-bold" style={{ color: T.text }}>
          {routine.name} · {routine.ageBand}
        </h2>
        <p className="text-sm mt-1 leading-relaxed" style={{ color: T.text2 }}>
          Age-appropriate routines. Foundation phase (U7–U9) keeps it simple —
          everyone arrives, ball goes in. Structure earns its place from U10
          onwards. Signed in as{' '}
          <span style={{ color: T.text }}>{session.userName || session.role}</span>.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {counts.map(c => (
          <div key={c.k} className="rounded-xl p-3 text-center" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
            <div className="text-2xl font-bold" style={{ color: T.good }}>{c.n}</div>
            <div className="text-xs mt-0.5" style={{ color: T.text3 }}>{KIND_LABEL[c.k]}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {ROUTINES.map(r => {
          const active = r.id === id
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setId(r.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{
                backgroundColor: active ? T.accentDim : 'transparent',
                border: `1px solid ${active ? T.accent : T.border}`,
                color: active ? T.good : T.text3,
              }}
            >
              {r.name}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl p-4 flex justify-center" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
          <RoutineSvg routine={routine} />
        </div>
        <div className="rounded-xl p-5" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
          <p className="text-sm font-bold mb-2" style={{ color: T.text }}>How we coach it</p>
          <p className="text-xs leading-relaxed mb-3" style={{ color: T.text2 }}>{routine.description}</p>
          <Legend />
        </div>
      </div>
    </div>
  )
}

function RoutineSvg({ routine }: { routine: Routine }) {
  const W = 320
  const H = 380
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={routine.name}>
      <rect x={0} y={0} width={W} height={H} fill={T.pitch} />
      <rect x={6} y={6} width={W - 12} height={H - 12} fill="none" stroke={T.pitchLine} strokeWidth="1" />
      <rect x={W / 2 - 70} y={6} width={140} height={70} fill="none" stroke={T.pitchLine} strokeWidth="1" />
      <rect x={W / 2 - 30} y={6} width={60} height={20} fill="none" stroke={T.pitchLine} strokeWidth="1" />
      <line x1={6} y1={H / 2} x2={W - 6} y2={H / 2} stroke={T.pitchLine} strokeWidth="0.6" strokeDasharray="3 4" />

      {/* Passes (blue arrows). */}
      {routine.passes?.map((p, i) => (
        <Arrow key={`p-${i}`} fromX={p.from[0] * W} fromY={p.from[1] * H} toX={p.to[0] * W} toY={p.to[1] * H} color={T.passColor} dashed={false} />
      ))}
      {/* Runs (amber dashed). */}
      {routine.runs?.map((r, i) => (
        <Arrow key={`r-${i}`} fromX={r.from[0] * W} fromY={r.from[1] * H} toX={r.to[0] * W} toY={r.to[1] * H} color={T.runColor} dashed={true} />
      ))}
      {/* Defenders. */}
      {routine.defenders.map((d, i) => (
        <circle key={`d-${i}`} cx={d.x * W} cy={d.y * H} r={8} fill="none" stroke={T.defenderColor} strokeWidth="2" />
      ))}
      {/* Attackers. */}
      {routine.attackers.map((a, i) => (
        <g key={`a-${i}`}>
          <circle cx={a.x * W} cy={a.y * H} r={11} fill={T.attackerColor} stroke="#fff" strokeWidth="1.5" />
          <text x={a.x * W} y={a.y * H + 3} fill="#fff" fontSize="9" fontWeight="700" textAnchor="middle">{a.label}</text>
        </g>
      ))}
    </svg>
  )
}

function Arrow({ fromX, fromY, toX, toY, color, dashed }: { fromX: number; fromY: number; toX: number; toY: number; color: string; dashed: boolean }) {
  const dx = toX - fromX
  const dy = toY - fromY
  const len = Math.sqrt(dx * dx + dy * dy)
  const ux = dx / len
  const uy = dy / len
  const headLen = 8
  const baseX = toX - ux * headLen
  const baseY = toY - uy * headLen
  const perpX = -uy
  const perpY = ux
  return (
    <g>
      <line x1={fromX} y1={fromY} x2={baseX} y2={baseY} stroke={color} strokeWidth="2" strokeDasharray={dashed ? '4 3' : undefined} />
      <polygon
        points={`${toX},${toY} ${baseX + perpX * 4},${baseY + perpY * 4} ${baseX - perpX * 4},${baseY - perpY * 4}`}
        fill={color}
      />
    </g>
  )
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-3 text-[11px]" style={{ color: T.text3 }}>
      <span className="flex items-center gap-1.5"><span style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: T.attackerColor, display: 'inline-block' }} /> Attacker</span>
      <span className="flex items-center gap-1.5"><span style={{ width: 10, height: 10, borderRadius: 999, border: `2px solid ${T.defenderColor}`, display: 'inline-block' }} /> Defender</span>
      <span className="flex items-center gap-1.5"><span style={{ width: 16, height: 2, backgroundColor: T.passColor, display: 'inline-block' }} /> Pass</span>
      <span className="flex items-center gap-1.5"><span style={{ width: 16, height: 2, backgroundColor: T.runColor, display: 'inline-block' }} /> Run</span>
    </div>
  )
}
