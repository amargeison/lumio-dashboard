'use client'

// Junior Football — Heatmaps.
//
// Positional / movement heatmaps. Junior context: more useful from U11+
// once positional understanding is in place; foundation-phase
// (U7-U9) heatmaps are deliberately framed as "everyone follows the
// ball" reality rather than a development concern.
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
  hot:        '#EF4444',
  warm:       '#F59E0B',
  cool:       '#3B82F6',
} as const

interface Subject {
  id: string
  kind: 'player' | 'team'
  name: string
  team: string
  position?: string
  /** 5x8 grid of intensities 0..1. Row 0 = own goal, row 7 = opposition goal. */
  grid: number[][]
  note: string
}

// Helper to define a 5x8 grid in a readable way.
function g(...rows: number[][]): number[][] { return rows }

const SUBJECTS: Subject[] = [
  {
    id: 'jack-carter',
    kind: 'player', name: 'Jack Carter', team: 'U11 Lions', position: 'CM',
    grid: g(
      [0.05, 0.05, 0.10, 0.10, 0.05],
      [0.05, 0.15, 0.25, 0.20, 0.05],
      [0.10, 0.35, 0.55, 0.40, 0.10],
      [0.15, 0.55, 0.90, 0.55, 0.15],
      [0.10, 0.45, 0.75, 0.45, 0.10],
      [0.10, 0.30, 0.50, 0.30, 0.10],
      [0.05, 0.15, 0.25, 0.15, 0.05],
      [0.00, 0.05, 0.10, 0.05, 0.00],
    ),
    note: 'Classic central-midfielder shape — anchored just behind the half-way line, drifts forward to support attacks but always recovers.',
  },
  {
    id: 'adam-sefer',
    kind: 'player', name: 'Adam Sefer', team: 'U11 Lions', position: 'FWD',
    grid: g(
      [0.00, 0.00, 0.05, 0.00, 0.00],
      [0.00, 0.05, 0.10, 0.05, 0.00],
      [0.05, 0.10, 0.15, 0.10, 0.05],
      [0.10, 0.25, 0.35, 0.25, 0.10],
      [0.15, 0.45, 0.55, 0.45, 0.15],
      [0.20, 0.65, 0.80, 0.65, 0.20],
      [0.20, 0.70, 0.95, 0.70, 0.20],
      [0.10, 0.40, 0.60, 0.40, 0.10],
    ),
    note: 'Striker — concentrated in the final third with peak intensity in the central channel just outside the area.',
  },
  {
    id: 'mia-carter',
    kind: 'player', name: 'Mia Carter', team: 'U13 Falcons', position: 'CAM',
    grid: g(
      [0.00, 0.05, 0.05, 0.05, 0.00],
      [0.05, 0.10, 0.20, 0.10, 0.05],
      [0.10, 0.30, 0.45, 0.30, 0.10],
      [0.20, 0.55, 0.70, 0.55, 0.20],
      [0.25, 0.70, 0.85, 0.70, 0.25],
      [0.20, 0.55, 0.70, 0.55, 0.20],
      [0.10, 0.30, 0.45, 0.30, 0.10],
      [0.05, 0.10, 0.20, 0.10, 0.05],
    ),
    note: 'Attacking midfielder — strong central presence, drifts to either flank to combine with wingers.',
  },
  {
    id: 'u11-lions-team',
    kind: 'team', name: 'U11 Lions · team shape', team: 'U11 Lions',
    grid: g(
      [0.15, 0.20, 0.25, 0.20, 0.15],
      [0.25, 0.35, 0.45, 0.35, 0.25],
      [0.35, 0.50, 0.60, 0.50, 0.35],
      [0.40, 0.60, 0.70, 0.60, 0.40],
      [0.40, 0.65, 0.75, 0.65, 0.40],
      [0.35, 0.55, 0.65, 0.55, 0.35],
      [0.25, 0.40, 0.50, 0.40, 0.25],
      [0.10, 0.20, 0.30, 0.20, 0.10],
    ),
    note: 'Even team-wide distribution with a slight forward bias — the 3-3-2 we drilled, lived on the pitch.',
  },
  {
    id: 'u13-falcons-team',
    kind: 'team', name: 'U13 Falcons · team shape', team: 'U13 Falcons',
    grid: g(
      [0.10, 0.15, 0.20, 0.15, 0.10],
      [0.20, 0.30, 0.40, 0.30, 0.20],
      [0.30, 0.45, 0.55, 0.45, 0.30],
      [0.35, 0.55, 0.65, 0.55, 0.35],
      [0.40, 0.60, 0.70, 0.60, 0.40],
      [0.40, 0.65, 0.75, 0.65, 0.40],
      [0.30, 0.50, 0.60, 0.50, 0.30],
      [0.15, 0.30, 0.40, 0.30, 0.15],
    ),
    note: 'Attacking weight — Falcons spend most of their time in the opposition half, consistent with the 4-3-3 build.',
  },
]

function intensityColor(v: number): string {
  if (v <= 0.01) return 'rgba(0,0,0,0)'
  if (v < 0.20) return `rgba(59,130,246,${0.15 + v})`         // cool blue
  if (v < 0.45) return `rgba(34,197,94,${0.20 + v * 0.6})`     // green
  if (v < 0.70) return `rgba(245,158,11,${0.30 + v * 0.5})`    // amber
  return `rgba(239,68,68,${Math.min(1, 0.45 + v * 0.5)})`      // hot red
}

interface Props {
  session: SportsDemoSession
  demoChild?: { name: string; ageBand: string; team: string }
}

export default function JuniorHeatmaps({ session }: Props) {
  const [aId, setAId] = useState(SUBJECTS[0].id)
  const [bId, setBId] = useState(SUBJECTS[3].id)
  const a = SUBJECTS.find(s => s.id === aId) ?? SUBJECTS[0]
  const b = SUBJECTS.find(s => s.id === bId) ?? SUBJECTS[1]

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
          Heatmaps · Player &amp; team shape
        </p>
        <h2 className="text-lg font-bold" style={{ color: T.text }}>
          Compare any two subjects · {SUBJECTS.length} on file
        </h2>
        <p className="text-sm mt-1 leading-relaxed" style={{ color: T.text2 }}>
          Most useful from U11 upwards — by then positional shape is part of
          the coaching conversation. For U7–U9 the heatmap is honestly &ldquo;everyone
          followed the ball&rdquo;, which is age-appropriate and not a development
          concern. Signed in as{' '}
          <span style={{ color: T.text }}>{session.userName || session.role}</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SubjectPanel side="left" subjects={SUBJECTS} subject={a} onChange={setAId} />
        <SubjectPanel side="right" subjects={SUBJECTS} subject={b} onChange={setBId} />
      </div>

      <Legend />
    </div>
  )
}

function SubjectPanel({ side, subjects, subject, onChange }: { side: 'left' | 'right'; subjects: Subject[]; subject: Subject; onChange: (id: string) => void }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <p className="text-sm font-bold" style={{ color: T.text }}>
          {side === 'left' ? 'A' : 'B'} · {subject.name}
        </p>
        <select
          value={subject.id}
          onChange={e => onChange(e.target.value)}
          className="text-xs px-2 py-1 rounded"
          style={{ backgroundColor: T.panelAlt, color: T.text, border: `1px solid ${T.border}` }}
        >
          {subjects.map(s => (
            <option key={s.id} value={s.id}>{s.kind === 'team' ? '🏟️ ' : '👤 '}{s.name}</option>
          ))}
        </select>
      </div>
      <div className="flex justify-center mb-3">
        <HeatPitch grid={subject.grid} />
      </div>
      <p className="text-[11px] leading-relaxed" style={{ color: T.text2 }}>{subject.note}</p>
      <p className="text-[10px] mt-2" style={{ color: T.text4 }}>
        {subject.team}{subject.position ? ` · ${subject.position}` : ''}
      </p>
    </div>
  )
}

function HeatPitch({ grid }: { grid: number[][] }) {
  const cols = grid[0].length
  const rows = grid.length
  const cellW = 38
  const cellH = 42
  const W = cellW * cols
  const H = cellH * rows
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Position heatmap">
      <rect x={0} y={0} width={W} height={H} fill={T.pitch} />
      {grid.map((row, ri) =>
        row.map((v, ci) => (
          <rect key={`${ri}-${ci}`} x={ci * cellW} y={ri * cellH} width={cellW} height={cellH} fill={intensityColor(v)} />
        )),
      )}
      <rect x={0.5} y={0.5} width={W - 1} height={H - 1} fill="none" stroke={T.pitchLine} strokeWidth="1" />
      <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke={T.pitchLine} strokeWidth="1" />
      <circle cx={W / 2} cy={H / 2} r={Math.min(W, H) * 0.10} fill="none" stroke={T.pitchLine} strokeWidth="1" />
      <rect x={W / 2 - cellW} y={0} width={cellW * 2} height={cellH} fill="none" stroke={T.pitchLine} strokeWidth="1" />
      <rect x={W / 2 - cellW} y={H - cellH} width={cellW * 2} height={cellH} fill="none" stroke={T.pitchLine} strokeWidth="1" />
    </svg>
  )
}

function Legend() {
  return (
    <div className="rounded-xl p-3 flex items-center justify-between gap-4 flex-wrap" style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
      <p className="text-xs" style={{ color: T.text3 }}>Intensity</p>
      <div className="flex items-center gap-3 text-[10px]" style={{ color: T.text3 }}>
        <span className="flex items-center gap-1.5"><span style={{ width: 14, height: 10, backgroundColor: T.cool, display: 'inline-block', borderRadius: 2 }} /> low</span>
        <span className="flex items-center gap-1.5"><span style={{ width: 14, height: 10, backgroundColor: T.good, display: 'inline-block', borderRadius: 2 }} /> moderate</span>
        <span className="flex items-center gap-1.5"><span style={{ width: 14, height: 10, backgroundColor: T.warm, display: 'inline-block', borderRadius: 2 }} /> high</span>
        <span className="flex items-center gap-1.5"><span style={{ width: 14, height: 10, backgroundColor: T.hot, display: 'inline-block', borderRadius: 2 }} /> peak</span>
      </div>
    </div>
  )
}
