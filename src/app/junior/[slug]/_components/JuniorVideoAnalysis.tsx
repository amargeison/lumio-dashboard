'use client'

// Junior Football — Video & Analysis (coaching/tactical tool).
//
// DISTINCT from Match Video (matchday highlights / parent-facing recap).
// This is the coach-side tactical breakdown: training session footage,
// drill film, opposition scout snippets, annotated tactical moments.
//
// Demo data is canned.

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

type ClipType = 'training' | 'opposition' | 'tactical_moment' | 'drill_film'

const TYPE_LABEL: Record<ClipType, string> = {
  training:         'Training session',
  opposition:       'Opposition scout',
  tactical_moment:  'Tactical moment',
  drill_film:       'Drill film',
}

interface Clip {
  id: string
  type: ClipType
  team: string
  title: string
  recorded: string
  duration: string
  annotations: number
  coach: string
  topic: string
  note: string
}

const CLIPS: Clip[] = [
  {
    id: 'c-101', type: 'training', team: 'U11 Lions',
    title: 'Tuesday rondo — scanning before receiving',
    recorded: 'Tue 19 May', duration: '4:32', annotations: 6,
    coach: 'Mark Hutchings', topic: 'Scanning',
    note: 'Coloured-bib rondo — coach calls a colour as the ball travels. Jack Carter\'s scans now consistent; clip 3 shows the standout moment.',
  },
  {
    id: 'c-102', type: 'tactical_moment', team: 'U11 Lions',
    title: 'Saturday goal #2 — switch + cut-back',
    recorded: 'Sat 17 May', duration: '0:38', annotations: 4,
    coach: 'Mark Hutchings', topic: 'Switching the play',
    note: 'Cross-pitch switch from LB to RW, RW carries, cut-back to A. Sefer. Same pattern we drilled Wednesday — annotation 2 highlights the trigger.',
  },
  {
    id: 'c-103', type: 'drill_film', team: 'U13 Falcons',
    title: 'Y-shape passing — both-feet variant',
    recorded: 'Wed 14 May', duration: '6:11', annotations: 8,
    coach: 'Greta Yardley', topic: 'Weak-foot use',
    note: 'Variant where every other receive must be with the weaker foot. Mia and Sophie M. complete the drill with no errors at speed in clip 5.',
  },
  {
    id: 'c-104', type: 'opposition', team: 'U13 Falcons',
    title: 'Thornvale Ladies U13 — set-piece tendencies',
    recorded: 'Sun 11 May', duration: '3:54', annotations: 7,
    coach: 'Greta Yardley', topic: 'Opposition set pieces',
    note: 'Three corners all in-swinging to near post in their last fixture; we drop a player to near post on every corner this Saturday.',
  },
  {
    id: 'c-105', type: 'tactical_moment', team: 'U14 Eagles',
    title: 'Defensive transition — second half lapse',
    recorded: 'Sat 10 May', duration: '0:52', annotations: 5,
    coach: 'Dev Patel', topic: 'Defensive transition',
    note: 'Loss of shape between losing possession and ball reaching their striker = 4.2 seconds. Annotation 3 marks where the screen should have appeared.',
  },
  {
    id: 'c-106', type: 'drill_film', team: 'U14 Eagles',
    title: '1v1 channel defending',
    recorded: 'Thu 15 May', duration: '5:08', annotations: 6,
    coach: 'Dev Patel', topic: 'Defending 1v1',
    note: 'Channel-defending drill — jockey, show wide, poke only on a heavy touch. Idris Khan is the standout — clip 4.',
  },
  {
    id: 'c-107', type: 'training', team: 'U16 Saints',
    title: 'Set-piece walk-through — indirect FK',
    recorded: 'Thu 15 May', duration: '7:22', annotations: 9,
    coach: 'Dev Patel', topic: 'Set pieces',
    note: 'Three routines walked through, then full-speed. Routine 2 (overload-left → roll inside → strike) clearly the cleanest.',
  },
  {
    id: 'c-108', type: 'tactical_moment', team: 'U11 Lions',
    title: 'Press trigger — back-pass to keeper',
    recorded: 'Sat 03 May', duration: '0:24', annotations: 3,
    coach: 'Mark Hutchings', topic: 'Pressing',
    note: 'Striker initiates the press the moment the opposition back-pass leaves the foot. Two seconds of compact shape afterwards — annotation 2.',
  },
]

const TYPE_TONE: Record<ClipType, { bg: string; fg: string }> = {
  training:        { bg: 'rgba(34,197,94,0.18)',  fg: T.good },
  opposition:      { bg: 'rgba(59,130,246,0.18)', fg: T.blue },
  tactical_moment: { bg: 'rgba(245,158,11,0.18)', fg: T.warn },
  drill_film:      { bg: 'rgba(167,139,250,0.18)',fg: '#A78BFA' },
}

interface Props {
  session: SportsDemoSession
  demoChild?: { name: string; ageBand: string; team: string }
}

export default function JuniorVideoAnalysis({ session }: Props) {
  const [filter, setFilter] = useState<'all' | ClipType>('all')
  const [openId, setOpenId] = useState<string | null>(null)

  const filtered = filter === 'all' ? CLIPS : CLIPS.filter(c => c.type === filter)
  const open = openId ? CLIPS.find(c => c.id === openId) : null

  const totalAnnotations = CLIPS.reduce((sum, c) => sum + c.annotations, 0)

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
          Video &amp; Analysis · Coach tool
        </p>
        <h2 className="text-lg font-bold" style={{ color: T.text }}>
          {CLIPS.length} clips · {totalAnnotations} annotations · across {new Set(CLIPS.map(c => c.team)).size} teams
        </h2>
        <p className="text-sm mt-1 leading-relaxed" style={{ color: T.text2 }}>
          Training footage, opposition scout snippets, drill film and tactical
          moments — annotated by the coach. Separate from Match Video (the
          parent-facing matchday recap). Signed in as{' '}
          <span style={{ color: T.text }}>{session.userName || session.role}</span>.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['all', 'training', 'opposition', 'tactical_moment', 'drill_film'] as const).map(f => {
          const active = filter === f
          const label = f === 'all' ? 'All clips' : TYPE_LABEL[f]
          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{
                backgroundColor: active ? T.accentDim : 'transparent',
                border: `1px solid ${active ? T.accent : T.border}`,
                color: active ? T.good : T.text3,
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map(c => {
          const tone = TYPE_TONE[c.type]
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setOpenId(c.id === openId ? null : c.id)}
              className="text-left rounded-lg p-4 transition-colors"
              style={{
                backgroundColor: openId === c.id ? T.panelAlt : T.panel,
                border: `1px solid ${openId === c.id ? T.accent : T.border}`,
              }}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-sm font-bold" style={{ color: T.text }}>{c.title}</p>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono" style={{ color: T.text3, backgroundColor: T.panel, border: `1px solid ${T.borderSoft}` }}>
                  {c.duration}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: tone.bg, color: tone.fg }}>
                  {TYPE_LABEL[c.type]}
                </span>
                <span className="text-[10px]" style={{ color: T.text3 }}>{c.team}</span>
                <span className="text-[10px]" style={{ color: T.text4 }}>· {c.recorded}</span>
                <span className="text-[10px] ml-auto" style={{ color: T.good }}>📝 {c.annotations}</span>
              </div>
              <p className="text-[10px]" style={{ color: T.text4 }}>{c.coach} · {c.topic}</p>
            </button>
          )
        })}
      </div>

      {open && (
        <div className="rounded-xl p-5" style={{ backgroundColor: T.panel, border: `1px solid ${T.accent}` }}>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <p className="text-sm font-bold" style={{ color: T.text }}>{open.title}</p>
            <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: TYPE_TONE[open.type].bg, color: TYPE_TONE[open.type].fg }}>
              {TYPE_LABEL[open.type]}
            </span>
          </div>
          <div className="rounded-lg p-8 mb-3 flex items-center justify-center" style={{ backgroundColor: '#000', border: `1px solid ${T.borderSoft}` }}>
            <span className="text-4xl" aria-hidden>▶</span>
          </div>
          <p className="text-xs leading-relaxed mb-2" style={{ color: T.text2 }}>{open.note}</p>
          <div className="text-[10px]" style={{ color: T.text4 }}>
            {open.team} · {open.recorded} · {open.duration} · {open.annotations} annotations · {open.coach}
          </div>
        </div>
      )}
    </div>
  )
}
