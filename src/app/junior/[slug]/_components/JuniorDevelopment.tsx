'use client'

// Junior Football — Player Development Tracker.
//
// CANONICAL FRAMEWORK: the FA four-corner model (technical / physical /
// social / psychological). The Coach Toolkit player tiles
// (JuniorCoachToolkit.tsx) display the same four corners — the FIFA-
// style player card is the read-only display layer of the same data
// authored here. Commit 7 reconciled the two surfaces against this
// scheme, closing the backlog entry logged in Commit 6.
//
// Role-scoped surfaces:
//   - parent_guardian: parent-friendly progress view for their own
//     child only. Four-corner radar, milestone timeline, termly
//     review summary (no coach drill-down notes).
//   - junior_player (age-gated, demo only — not a top-level sidebar
//     option; reached via the Parent App profile in a later commit):
//     simplified self-view with badge achievements. Demo behaviour
//     here is "if session.role === 'junior_player' show the self-view
//     scaffold"; in production the age gate logic + scoped session
//     lives in the auth layer.
//   - chairman / coach / team_manager / welfare_officer /
//     academy_lead: full development tracker — squad-wide milestone
//     timeline + termly review authoring (academy_lead drives the
//     review, others read).
//
// Demo data is canned. Real data layer is Workstream B.

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

type Tab = 'overview' | 'reviews' | 'milestones' | 'framework' | 'self'

// ─── FA four-corner framework ────────────────────────────────────────────────

interface CornerScores {
  technical:     number
  physical:      number
  social:        number
  psychological: number
}

interface PlayerProfile {
  id: string
  name: string
  ageBand: string
  team: string
  scores: CornerScores
  /** Termly review numbers — three completed terms shown as a trend. */
  termHistory: { term: string; scores: CornerScores }[]
  badges: { id: string; label: string; earned: string }[]
}

interface MilestoneEntry {
  id: string
  date: string
  player: string
  corner: keyof CornerScores
  label: string
  detail: string
}

interface ReviewEntry {
  id: string
  term: string
  reviewer: string
  signedOff: string
  player: string
  scores: CornerScores
  summary: string
  next_focus: string
}

const FRAMEWORK_DETAILS: Record<keyof CornerScores, { label: string; description: string; bandHint: string }> = {
  technical: {
    label: 'Technical',
    description: 'Ball mastery, passing, first touch, finishing. The on-the-ball skills.',
    bandHint: 'U7–U9: first touch, dribbling. U10–U12: passing patterns, scanning. U13+: technique under pressure.',
  },
  physical: {
    label: 'Physical',
    description: 'Movement, agility, coordination, age-appropriate fitness. Growth-aware.',
    bandHint: 'U7–U9: balance, coordination. U10–U12: agility, change of direction. U13+: power, endurance.',
  },
  social: {
    label: 'Social',
    description: 'Teamwork, communication, FA Respect codes, leadership.',
    bandHint: 'U7–U9: cooperative play. U10–U12: positional teamwork, vocal cues. U13+: leadership moments.',
  },
  psychological: {
    label: 'Psychological',
    description: "Decision-making, resilience, self-management. The 'game brain'.",
    bandHint: 'U7–U9: focus, listening. U10–U12: decision-making, reading the game. U13+: composure under pressure.',
  },
}

// ─── Demo data ───────────────────────────────────────────────────────────────

const JACK_PROFILE: PlayerProfile = {
  id: 'jack-carter',
  name: 'Jack Carter',
  ageBand: 'U11',
  team: 'U11 Lions',
  scores: { technical: 78, physical: 65, social: 82, psychological: 74 },
  termHistory: [
    { term: 'Autumn 25/26', scores: { technical: 68, physical: 62, social: 74, psychological: 64 } },
    { term: 'Spring 25/26', scores: { technical: 73, physical: 64, social: 78, psychological: 70 } },
    { term: 'Summer 25/26', scores: { technical: 78, physical: 65, social: 82, psychological: 74 } },
  ],
  badges: [
    { id: 'b-001', label: '50 club sessions',     earned: 'Sat 10 May' },
    { id: 'b-002', label: 'Player of the Match',  earned: 'Sat 03 May' },
    { id: 'b-003', label: 'First-time captain',   earned: 'Sat 12 Apr' },
    { id: 'b-004', label: 'Respect ambassador',   earned: 'Sat 22 Feb' },
  ],
}

const MIA_PROFILE: PlayerProfile = {
  id: 'mia-carter',
  name: 'Mia Carter',
  ageBand: 'U13',
  team: 'U13 Falcons',
  scores: { technical: 76, physical: 72, social: 78, psychological: 70 },
  termHistory: [
    { term: 'Autumn 25/26', scores: { technical: 65, physical: 65, social: 70, psychological: 60 } },
    { term: 'Spring 25/26', scores: { technical: 71, physical: 68, social: 74, psychological: 66 } },
    { term: 'Summer 25/26', scores: { technical: 76, physical: 72, social: 78, psychological: 70 } },
  ],
  badges: [
    { id: 'b-101', label: 'FA Girls Football Week', earned: 'Sat 17 May' },
    { id: 'b-102', label: 'Double-goal day',         earned: 'Sun 11 May' },
    { id: 'b-103', label: 'Captain-for-a-week',      earned: 'Sat 03 May' },
  ],
}

const MILESTONES: MilestoneEntry[] = [
  { id: 'ms-001', date: 'Tue 20 May', player: 'Jack Carter',  corner: 'psychological', label: 'Scans before receiving',     detail: 'Coach noted scanning is now consistent in rondo work.' },
  { id: 'ms-002', date: 'Sat 17 May', player: 'Mia Carter',   corner: 'social',         label: 'FA Girls Football Week event',detail: 'Represented Oakridge at County FA Girls Week. Volunteer of the day.' },
  { id: 'ms-003', date: 'Sat 10 May', player: 'Jack Carter',  corner: 'social',         label: '50 club sessions reached',    detail: 'Charter Standard attendance milestone.' },
  { id: 'ms-004', date: 'Sun 11 May', player: 'Mia Carter',   corner: 'technical',      label: 'Two-goal performance',        detail: 'Both goals from cut-in moves — left-foot finishing repeating now.' },
  { id: 'ms-005', date: 'Sat 03 May', player: 'Jack Carter',  corner: 'social',         label: 'Player-voted MOTM',           detail: 'Captain-for-a-week awarded the following week.' },
  { id: 'ms-006', date: 'Sat 22 Feb', player: 'Jack Carter',  corner: 'social',         label: 'Respect ambassador',           detail: 'Awarded for shaking hands with opposition GK after a hard-fought 1–1.' },
]

const REVIEWS: ReviewEntry[] = [
  {
    id: 'rv-001',
    term: 'Summer 25/26',
    reviewer: 'Coach Mark Hutchings + Academy Lead',
    signedOff: 'Mon 19 May',
    player: 'Jack Carter',
    scores: JACK_PROFILE.scores,
    summary:
      'Big quarter for Jack. Technical and Psychological both up — scanning before receiving is the standout. ' +
      'Social score reflects player-voted MOTM + captain-for-a-week. Physical steady, growth-spurt watch flagged ' +
      'by parents but no load adjustment needed yet.',
    next_focus:
      'Continue scanning work. Introduce more 1v1 attacking duels to push Technical further. Monitor for any growth-spurt ' +
      'related discomfort and bring in physio team if flagged.',
  },
  {
    id: 'rv-002',
    term: 'Summer 25/26',
    reviewer: 'Coach Greta Yardley + Academy Lead',
    signedOff: 'Mon 19 May',
    player: 'Mia Carter',
    scores: MIA_PROFILE.scores,
    summary:
      "Strong term across all four corners. Technical and Psychological both up — repeatable cut-in goals show " +
      "left-foot finishing is now habit. Captain-for-a-week earned at the request of teammates.",
    next_focus:
      'Push Physical with age-appropriate strength + conditioning add-ons (twice a week). Tactical reading of the ' +
      'transition moment is the next horizon for Psychological.',
  },
]

// ─── Subcomponents ───────────────────────────────────────────────────────────

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl p-5 ${className ?? ''}`} style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
      {children}
    </div>
  )
}

function CornerRadar({ scores, size = 220, max = 100 }: { scores: CornerScores; size?: number; max?: number }) {
  // Four-point radar: technical (top), physical (right), social (bottom),
  // psychological (left). SVG built in a single pass.
  const cx = size / 2
  const cy = size / 2
  const r  = size / 2 - 28
  const corners: { key: keyof CornerScores; label: string; x: number; y: number; lx: number; ly: number }[] = [
    { key: 'technical',     label: 'Technical',     x: cx,         y: cy - r,    lx: cx,        ly: cy - r - 12 },
    { key: 'physical',      label: 'Physical',      x: cx + r,     y: cy,        lx: cx + r + 6,ly: cy + 4 },
    { key: 'social',        label: 'Social',        x: cx,         y: cy + r,    lx: cx,        ly: cy + r + 16 },
    { key: 'psychological', label: 'Psychological', x: cx - r,     y: cy,        lx: cx - r - 6,ly: cy + 4 },
  ]
  const pts = corners.map(c => {
    const v = scores[c.key] / max
    const dx = c.x - cx
    const dy = c.y - cy
    return `${cx + dx * v},${cy + dy * v}`
  }).join(' ')

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="FA four-corner radar">
      {/* Concentric guides at 25/50/75/100 */}
      {[0.25, 0.5, 0.75, 1].map(t => {
        const guidePts = corners.map(c => {
          const dx = c.x - cx; const dy = c.y - cy
          return `${cx + dx * t},${cy + dy * t}`
        }).join(' ')
        return <polygon key={t} points={guidePts} fill="none" stroke={T.borderSoft} strokeWidth="1" />
      })}
      {/* Axes */}
      {corners.map(c => (
        <line key={c.key} x1={cx} y1={cy} x2={c.x} y2={c.y} stroke={T.borderSoft} strokeWidth="1" />
      ))}
      {/* Data shape */}
      <polygon points={pts} fill={T.accent} fillOpacity="0.18" stroke={T.good} strokeWidth="2" />
      {/* Labels */}
      {corners.map(c => (
        <text
          key={c.key}
          x={c.lx}
          y={c.ly}
          fill={T.text3}
          fontSize="11"
          textAnchor={c.key === 'physical' ? 'start' : c.key === 'psychological' ? 'end' : 'middle'}
          dominantBaseline="middle"
        >
          {c.label}
        </text>
      ))}
      {/* Value badges at each axis end */}
      {corners.map(c => (
        <text
          key={`v-${c.key}`}
          x={cx + (c.x - cx) * (scores[c.key] / max) * 1.0 + (c.key === 'physical' ? -10 : c.key === 'psychological' ? 10 : 0)}
          y={cy + (c.y - cy) * (scores[c.key] / max) * 1.0 + (c.key === 'technical' ? 12 : c.key === 'social' ? -4 : 0)}
          fill={T.good}
          fontSize="10"
          fontWeight="700"
          textAnchor="middle"
        >
          {scores[c.key]}
        </text>
      ))}
    </svg>
  )
}

function CornerScoreRow({ scores }: { scores: CornerScores }) {
  const rows: { key: keyof CornerScores; v: number }[] = [
    { key: 'technical',     v: scores.technical },
    { key: 'physical',      v: scores.physical },
    { key: 'social',        v: scores.social },
    { key: 'psychological', v: scores.psychological },
  ]
  return (
    <div className="space-y-2">
      {rows.map(r => (
        <div key={r.key}>
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span style={{ color: T.text2 }}>{FRAMEWORK_DETAILS[r.key].label}</span>
            <span className="font-mono" style={{ color: T.good }}>{r.v}</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: T.borderSoft }}>
            <div className="h-full rounded-full" style={{ width: `${r.v}%`, backgroundColor: T.good }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function TermTrend({ history }: { history: PlayerProfile['termHistory'] }) {
  // Tiny sparkline-ish bar chart per corner across the three terms.
  const corners: (keyof CornerScores)[] = ['technical','physical','social','psychological']
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {corners.map(c => {
        const vals = history.map(h => h.scores[c])
        const max = Math.max(...vals, 100)
        return (
          <div key={c} className="rounded-lg p-3" style={{ backgroundColor: T.panelAlt, border: `1px solid ${T.borderSoft}` }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold" style={{ color: T.text }}>{FRAMEWORK_DETAILS[c].label}</p>
              <p className="text-[10px]" style={{ color: T.text4 }}>
                <span className="font-mono" style={{ color: T.good }}>+{vals[vals.length - 1] - vals[0]}</span> across 3 terms
              </p>
            </div>
            <div className="flex items-end gap-2 h-12">
              {history.map((h, i) => {
                const heightPct = (h.scores[c] / max) * 100
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
                    <div className="text-[9px] font-mono" style={{ color: T.text4 }}>{h.scores[c]}</div>
                    <div
                      className="w-full rounded-sm"
                      style={{ height: `${heightPct}%`, backgroundColor: T.accent, opacity: 0.5 + (i / 3) * 0.5 }}
                    />
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between text-[9px] mt-1" style={{ color: T.text4 }}>
              {history.map(h => <span key={h.term}>{h.term.split(' ')[0]}</span>)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────

interface Props {
  session: SportsDemoSession
  demoChild?: { name: string; ageBand: string; team: string }
}

export default function JuniorDevelopment({ session, demoChild }: Props) {
  const isParent = session.role === 'parent_guardian'
  const isPlayer = session.role === 'junior_player'
  const profile =
    isParent && demoChild?.name === 'Mia Carter' ? MIA_PROFILE :
    JACK_PROFILE

  const [tab, setTab] = useState<Tab>(
    isPlayer ? 'self' :
    isParent ? 'overview' :
               'overview',
  )

  const tabs: { id: Tab; label: string; icon: string }[] = isPlayer
    ? [{ id: 'self', label: 'My profile', icon: '⭐' }]
    : isParent
      ? [
          { id: 'overview',   label: 'Overview',   icon: '🧭' },
          { id: 'milestones', label: 'Milestones', icon: '🏅' },
          { id: 'framework',  label: 'Framework',  icon: '📐' },
        ]
      : [
          { id: 'overview',   label: 'Squad overview',  icon: '🧭' },
          { id: 'reviews',    label: 'Termly reviews',  icon: '📓' },
          { id: 'milestones', label: 'Milestone feed',  icon: '🏅' },
          { id: 'framework',  label: 'Framework',       icon: '📐' },
        ]

  const playerMilestones = MILESTONES.filter(m => m.player === profile.name)

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
          Player Development {isParent ? '· Your child' : isPlayer ? '· My profile' : '· Squad'}
        </p>
        <h2 className="text-lg font-bold" style={{ color: T.text }}>
          {isParent
            ? `${profile.name}'s development · FA four-corner model`
            : isPlayer
              ? 'My development profile'
              : 'Player development tracker · FA four-corner canonical'}
        </h2>
        <p className="text-sm mt-1 leading-relaxed" style={{ color: T.text2 }}>
          Technical · Physical · Social · Psychological. The same four-corner scheme drives the
          Coach Toolkit player cards — the FIFA-style display layer reads the same data authored
          here.
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

      {/* Overview — radar + termly trend. */}
      {tab === 'overview' && !isPlayer && (
        <>
          <Card className="mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="flex justify-center">
                <CornerRadar scores={profile.scores} />
              </div>
              <div>
                <p className="text-sm font-bold mb-3" style={{ color: T.text }}>
                  {profile.name} · {profile.ageBand} · {profile.team}
                </p>
                <CornerScoreRow scores={profile.scores} />
                <p className="text-[10px] mt-3" style={{ color: T.text4 }}>
                  Scores authored termly by the coach and signed off by the Academy Lead. The same
                  numbers appear on the Coach Toolkit player card.
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <p className="text-sm font-bold mb-3" style={{ color: T.text }}>Term-on-term trend</p>
            <TermTrend history={profile.termHistory} />
          </Card>
        </>
      )}

      {/* Termly reviews — staff only. */}
      {tab === 'reviews' && !isParent && !isPlayer && (
        <Card>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <p className="text-sm font-bold" style={{ color: T.text }}>Termly reviews · summer 25/26</p>
            <button
              type="button"
              className="text-[11px] px-3 py-1.5 rounded-lg font-medium"
              style={{ backgroundColor: T.accentDim, color: T.good, border: `1px solid ${T.accent}55` }}
            >
              Start a new review (demo)
            </button>
          </div>
          <div className="space-y-3">
            {REVIEWS.map(r => (
              <div key={r.id} className="rounded-lg p-4" style={{ backgroundColor: T.panelAlt, border: `1px solid ${T.borderSoft}` }}>
                <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                  <div>
                    <p className="text-xs font-bold" style={{ color: T.text }}>{r.player} · {r.term}</p>
                    <p className="text-[10px]" style={{ color: T.text4 }}>Signed off {r.signedOff} by {r.reviewer}</p>
                  </div>
                  <CornerScoreRow scores={r.scores} />
                </div>
                <p className="text-xs leading-relaxed mb-2" style={{ color: T.text2 }}>{r.summary}</p>
                <div className="rounded p-2" style={{ backgroundColor: T.accentDim, border: `1px solid ${T.accent}55` }}>
                  <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: T.good }}>Next focus</p>
                  <p className="text-[11px]" style={{ color: T.text2 }}>{r.next_focus}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Milestone feed — both staff and parent (parent filtered to own child). */}
      {tab === 'milestones' && !isPlayer && (
        <Card>
          <p className="text-sm font-bold mb-3" style={{ color: T.text }}>
            Milestone feed · {isParent ? profile.name : 'all players'}
          </p>
          <ol className="space-y-3">
            {(isParent ? playerMilestones : MILESTONES).map(m => (
              <li key={m.id} className="flex gap-3">
                <div
                  className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs"
                  style={{ backgroundColor: T.accentDim, border: `1px solid ${T.accent}55` }}
                >
                  🏅
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="text-xs font-semibold" style={{ color: T.text }}>{m.label}</p>
                    <span className="text-[10px] font-mono" style={{ color: T.text4 }}>{m.date}</span>
                  </div>
                  <p className="text-[11px] mt-0.5" style={{ color: T.text2 }}>{m.detail}</p>
                  {!isParent && <p className="text-[10px] mt-0.5" style={{ color: T.text4 }}>{m.player} · {FRAMEWORK_DETAILS[m.corner].label} corner</p>}
                </div>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {/* Framework — explainer card visible to everyone. */}
      {tab === 'framework' && !isPlayer && (
        <Card>
          <p className="text-sm font-bold mb-3" style={{ color: T.text }}>FA four-corner model · canonical framework</p>
          <p className="text-[11px] mb-4" style={{ color: T.text3 }}>
            Lumio Junior uses the FA's four-corner youth-development model end-to-end. Authored
            here; displayed as FIFA-style player cards in the Coach Toolkit. Same data, two
            surfaces.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(Object.keys(FRAMEWORK_DETAILS) as (keyof CornerScores)[]).map(k => {
              const d = FRAMEWORK_DETAILS[k]
              return (
                <div key={k} className="rounded-lg p-3" style={{ backgroundColor: T.panelAlt, border: `1px solid ${T.borderSoft}` }}>
                  <p className="text-sm font-bold mb-1" style={{ color: T.good }}>{d.label}</p>
                  <p className="text-[11px] mb-2" style={{ color: T.text2 }}>{d.description}</p>
                  <p className="text-[10px] italic" style={{ color: T.text4 }}>{d.bandHint}</p>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Junior-player self-view — age-gated scaffold. */}
      {tab === 'self' && isPlayer && (
        <>
          <Card className="mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg font-black"
                style={{ backgroundColor: T.accentDim, color: T.good, border: `1px solid ${T.accent}55` }}
              >
                ⚽
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: T.text }}>{profile.name}</p>
                <p className="text-[11px]" style={{ color: T.text3 }}>{profile.ageBand} · {profile.team}</p>
              </div>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: T.text2 }}>
              Hi! Here&apos;s how you&apos;re doing this season. Big tick boxes mean you&apos;ve earned a badge.
              Numbers are how your coach has marked your four corners — the higher the better, but
              keep an eye on which corner you can grow in next.
            </p>
          </Card>
          <Card className="mb-4">
            <p className="text-sm font-bold mb-3" style={{ color: T.text }}>Your four corners</p>
            <CornerScoreRow scores={profile.scores} />
          </Card>
          <Card>
            <p className="text-sm font-bold mb-3" style={{ color: T.text }}>Badges 🏅</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {profile.badges.map(b => (
                <div key={b.id} className="rounded-lg p-3 text-center" style={{ backgroundColor: T.accentDim, border: `1px solid ${T.accent}55` }}>
                  <p className="text-2xl mb-1" aria-hidden>🏅</p>
                  <p className="text-[11px] font-semibold" style={{ color: T.text }}>{b.label}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: T.text4 }}>{b.earned}</p>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
