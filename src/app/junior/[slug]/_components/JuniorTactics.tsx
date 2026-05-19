'use client'

// Junior Football — Tactics.
//
// Age-appropriate formations across the FA player-pathway formats:
//   - U7-U8  : 5v5 (1 GK + 4 outfield)
//   - U9-U10 : 7v7 (1 GK + 6 outfield)
//   - U11-U12: 9v9 (1 GK + 8 outfield)
//   - U13-U16: 11v11 (1 GK + 10 outfield)
//
// Demo data is canned. Real data layer is Workstream B.

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
} as const

interface Formation {
  id: string
  format: '5v5' | '7v7' | '9v9' | '11v11'
  name: string
  ageBands: string
  /** Outfield positions only — GK is fixed at (0.5, 0.92). Coordinates are 0..1 of the half-pitch we draw. */
  outfield: { x: number; y: number; label: string }[]
  principles: string[]
}

const FORMATIONS: Formation[] = [
  {
    id: 'u7-u8-122',
    format: '5v5',
    name: '1-2-2 (Diamond support)',
    ageBands: 'U7–U8',
    outfield: [
      { x: 0.5,  y: 0.70, label: 'D' },
      { x: 0.30, y: 0.50, label: 'M' },
      { x: 0.70, y: 0.50, label: 'M' },
      { x: 0.5,  y: 0.30, label: 'F' },
    ],
    principles: [
      'Everyone is a defender and everyone is an attacker — no fixed sides.',
      'Goalkeeper plays out from hands, never punts.',
      'Pass + move — the player who passes is the first one to support.',
      'No long balls. The phrase on the pitch is "feet to feet".',
    ],
  },
  {
    id: 'u9-u10-231',
    format: '7v7',
    name: '2-3-1',
    ageBands: 'U9–U10',
    outfield: [
      { x: 0.32, y: 0.74, label: 'DL' },
      { x: 0.68, y: 0.74, label: 'DR' },
      { x: 0.22, y: 0.52, label: 'ML' },
      { x: 0.5,  y: 0.48, label: 'M' },
      { x: 0.78, y: 0.52, label: 'MR' },
      { x: 0.5,  y: 0.26, label: 'F' },
    ],
    principles: [
      'Build from the back — goalkeeper to defenders, defenders into midfield.',
      'Wingers stretch the pitch wide; midfielder offers the inside option.',
      'Striker leads the press — first defender as soon as possession is lost.',
      'Switch the play when one side is overloaded.',
    ],
  },
  {
    id: 'u11-u12-332',
    format: '9v9',
    name: '3-3-2 (FA Charter staple)',
    ageBands: 'U11–U12',
    outfield: [
      { x: 0.25, y: 0.78, label: 'LB' },
      { x: 0.5,  y: 0.80, label: 'CB' },
      { x: 0.75, y: 0.78, label: 'RB' },
      { x: 0.22, y: 0.54, label: 'LM' },
      { x: 0.5,  y: 0.52, label: 'CM' },
      { x: 0.78, y: 0.54, label: 'RM' },
      { x: 0.38, y: 0.28, label: 'F' },
      { x: 0.62, y: 0.28, label: 'F' },
    ],
    principles: [
      'Centre-back is the on-pitch coach — talks the back three.',
      'CM scans every 3 seconds — "look, look, receive".',
      'Wide midfielders provide width AND track back to defenders.',
      'Front two press as a pair; one shows inside, one screens the pass.',
    ],
  },
  {
    id: 'u13-u16-433',
    format: '11v11',
    name: '4-3-3',
    ageBands: 'U13–U16',
    outfield: [
      { x: 0.18, y: 0.82, label: 'LB' },
      { x: 0.40, y: 0.84, label: 'CB' },
      { x: 0.60, y: 0.84, label: 'CB' },
      { x: 0.82, y: 0.82, label: 'RB' },
      { x: 0.30, y: 0.60, label: 'CM' },
      { x: 0.5,  y: 0.55, label: 'CM' },
      { x: 0.70, y: 0.60, label: 'CM' },
      { x: 0.18, y: 0.30, label: 'LW' },
      { x: 0.5,  y: 0.22, label: 'CF' },
      { x: 0.82, y: 0.30, label: 'RW' },
    ],
    principles: [
      'High line out of possession; compact mid-block when sat off.',
      'Full-backs invert into midfield in build-up; wingers stay high and wide.',
      'CF as the link — drops between the lines, brings wide players into shooting positions.',
      'Two of the three CMs always above the ball when attacking the box.',
    ],
  },
]

interface Props {
  session: SportsDemoSession
  demoChild?: { name: string; ageBand: string; team: string }
}

export default function JuniorTactics({ session }: Props) {
  const [id, setId] = useState(FORMATIONS[2].id) // U11/12 default — most demos
  const formation = FORMATIONS.find(f => f.id === id) ?? FORMATIONS[0]

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
          Tactics
        </p>
        <h2 className="text-lg font-bold" style={{ color: T.text }}>
          {formation.format} · {formation.name} · {formation.ageBands}
        </h2>
        <p className="text-sm mt-1 leading-relaxed" style={{ color: T.text2 }}>
          The FA player-pathway formats. Pick an age band and the principles
          we coach inside it. Tactics here pair with Set Pieces and Training
          for the full coaching picture. Signed in as{' '}
          <span style={{ color: T.text }}>{session.userName || session.role}</span>.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FORMATIONS.map(f => {
          const active = f.id === id
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setId(f.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{
                backgroundColor: active ? T.accentDim : 'transparent',
                border: `1px solid ${active ? T.accent : T.border}`,
                color: active ? T.good : T.text3,
              }}
            >
              {f.format} · {f.ageBands}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl p-4 flex justify-center" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
          <PitchSvg formation={formation} />
        </div>
        <div className="rounded-xl p-5" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
          <p className="text-sm font-bold mb-3" style={{ color: T.text }}>Principles we coach</p>
          <ul className="space-y-2">
            {formation.principles.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: T.text2 }}>
                <span className="mt-0.5" style={{ color: T.good }}>•</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-xl p-4" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
        <p className="text-sm font-bold mb-2" style={{ color: T.text }}>Why these formats</p>
        <p className="text-xs leading-relaxed" style={{ color: T.text2 }}>
          The FA player-pathway prescribes maximum match sizes by age band — 5v5,
          7v7, 9v9, then 11v11. Each step up adds tactical demands. The formations
          here are starting points, not doctrine — coaches adapt to the squad in
          front of them. The principles list is the language we use on the
          training pitch.
        </p>
      </div>
    </div>
  )
}

function PitchSvg({ formation }: { formation: Formation }) {
  const W = 280
  const H = 360
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${formation.format} pitch`}>
      <rect x={0} y={0} width={W} height={H} fill={T.pitch} />
      <rect x={6} y={6} width={W - 12} height={H - 12} fill="none" stroke={T.pitchLine} strokeWidth="1" />
      <line x1={6} y1={H / 2} x2={W - 6} y2={H / 2} stroke={T.pitchLine} strokeWidth="1" />
      <circle cx={W / 2} cy={H / 2} r={26} fill="none" stroke={T.pitchLine} strokeWidth="1" />
      <rect x={W / 2 - 50} y={H - 56} width={100} height={50} fill="none" stroke={T.pitchLine} strokeWidth="1" />
      <rect x={W / 2 - 20} y={H - 20} width={40} height={14} fill="none" stroke={T.pitchLine} strokeWidth="1" />
      <rect x={W / 2 - 50} y={6} width={100} height={50} fill="none" stroke={T.pitchLine} strokeWidth="1" />
      <rect x={W / 2 - 20} y={6} width={40} height={14} fill="none" stroke={T.pitchLine} strokeWidth="1" />

      {/* Goalkeeper — fixed at the bottom-centre. */}
      <PlayerDot x={W * 0.5} y={H * 0.93} label="GK" />

      {/* Outfield. */}
      {formation.outfield.map((p, i) => (
        <PlayerDot key={i} x={p.x * W} y={p.y * H} label={p.label} />
      ))}
    </svg>
  )
}

function PlayerDot({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={11} fill={T.accent} stroke="#fff" strokeWidth="1.5" />
      <text x={x} y={y + 3} fill="#fff" fontSize="9" fontWeight="700" textAnchor="middle">
        {label}
      </text>
    </g>
  )
}
