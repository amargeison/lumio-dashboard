'use client'

// Junior Football — Parent App.
//
// The flagship parent-facing surface. Mobile-first. Rendered for
// parent_guardian when the sidebar 'squad' item is active (the squad
// item renders as "My Player" for parents — see roleAwareLabel in
// page.tsx). For multi-child households a ChildSwitcher sits at the
// top so a single parent login covers all their children, swapping
// the whole view on switch.
//
// Surfaces (per child):
//   - MatchRecapCard   — post-fixture recap (highlights, GPS headline,
//                        coach note, minutes + position). Pulls a
//                        compact preview of the AI Match Recap.
//   - Fixtures + Fees  — next fixture + fee status. The user
//                        confirmed this is CONTENT inside the
//                        Parent App view, not a sidebar item.
//   - SeasonTimeline   — every match, clip and milestone in one
//                        chronological feed for the child.
//   - KeepsakeArchive  — the child's photo/video archive.
//
// CONSENT GATE: the photo and video surfaces respect the restricted-
// flag rule established in Commit 5. A restricted child is never
// shown in any clip, archive or recap imagery, and is never named in
// other children's parent views. Demo behaviour for now — real RLS
// is Workstream B. The demo children below are all unrestricted; the
// behaviour is shown in the Settings → Privacy & Imagery matrix.

import { useState } from 'react'
import type { SportsDemoSession } from '@/components/sports-demo/SportsDemoGate'
import { JuniorAIMatchRecapPreview } from './JuniorAIMatchRecap'
import JuniorPlayerCard from './JuniorPlayerCard'
import { JUNIOR_PLAYER_DETAIL } from '../_lib/junior-squad-data'
import type { SquadPlayer } from './JuniorSquadManagement'

// ─── Theme ───────────────────────────────────────────────────────────────────

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

// ─── Demo children for the Parent App ────────────────────────────────────────
//
// Two children for the canonical demo parent login (Emma Carter):
//   - Jack Carter — U11 Lions, primary demo subject (also appears in
//     JuniorSafeguardingHub.CHILD_CONSENTS as the unrestricted flagship).
//   - Mia Carter — U13 Falcons, sibling. Different age band, different
//     team — gives the ChildSwitcher something to demonstrate.
//
// The restricted child (Noah Baxter) does NOT appear here — he belongs
// to a different demo parent (Lara Baxter) and a parent only sees their
// own child(ren). Restricted-flag behaviour is documented in Settings
// and surfaced via the consent-gate comment on the keepsake archive.

interface ParentAppChild {
  id: string
  detailId: string  // key into JUNIOR_PLAYER_DETAIL for the card embed
  name: string
  ageBand: string
  team: string
  shirt: number
  position: string
  /**
   * Demo data is restricted=false for both Carter children — only
   * Noah Baxter (other parent) carries the restricted flag. Included
   * here because the type needs it; if a restricted child were a
   * parent's own, the rule documented in the imagery matrix still
   * applies (their imagery is excluded from team / batch surfaces
   * but their own parent can of course see them).
   */
  restricted: boolean
  nextFixture: { date: string; opponent: string; venue: 'H' | 'A'; kickoff: string }
  feeStatus: { paid: boolean; amount: number; dueLabel: string; cycle: 'monthly' | 'termly' }
  lastMatch: { date: string; opponent: string; result: string; minutes: number; outOf: number }
}

const PARENT_CHILDREN: ParentAppChild[] = [
  {
    id: 'jack-carter',
    detailId: 'u11-jack-carter',
    name: 'Jack Carter',
    ageBand: 'U11',
    team: 'U11 Lions',
    shirt: 8,
    position: 'Right midfield',
    restricted: false,
    nextFixture: { date: 'Sat 31 May', opponent: 'Northbridge Juniors U11', venue: 'A', kickoff: '11:00' },
    feeStatus: { paid: true,  amount: 22, dueLabel: 'Paid 1 May · next due 1 Jun', cycle: 'monthly' },
    lastMatch: { date: 'Sun 25 May', opponent: 'Hartwell U11', result: 'W 3–2', minutes: 60, outOf: 60 },
  },
  {
    id: 'mia-carter',
    detailId: 'u13-mia-carter',
    name: 'Mia Carter',
    ageBand: 'U13',
    team: 'U13 Falcons',
    shirt: 7,
    position: 'Left wing',
    restricted: false,
    nextFixture: { date: 'Sun 1 Jun', opponent: 'Castleton Girls U13', venue: 'H', kickoff: '10:00' },
    feeStatus: { paid: false, amount: 28, dueLabel: '£28 outstanding · due by 5 Jun', cycle: 'monthly' },
    lastMatch: { date: 'Sun 25 May', opponent: 'Glenmoor U13', result: 'L 1–2', minutes: 70, outOf: 70 },
  },
]

interface TimelineEntry {
  id: string
  date: string
  kind: 'match' | 'training' | 'milestone' | 'clip' | 'note'
  title: string
  detail: string
}

// Keyed by child id. Each timeline is the season-to-date for that child.
const TIMELINE: Record<string, TimelineEntry[]> = {
  'jack-carter': [
    { id: 'jt-001', date: 'Sun 25 May', kind: 'match',     title: 'W 3–2 vs Hartwell U11',         detail: '2 goal-involvements · 60 mins · right-mid · top speed 19.2 km/h.' },
    { id: 'jt-002', date: 'Sun 25 May', kind: 'clip',      title: 'The pass for the first goal',    detail: '18s clip — saved to keepsake archive.' },
    { id: 'jt-003', date: 'Tue 20 May', kind: 'training',  title: 'Passing patterns under pressure',detail: '75-min session · pair work with Aria · noted in coach development notes.' },
    { id: 'jt-004', date: 'Sun 18 May', kind: 'match',     title: 'W 2–0 vs Sunday Rovers U11',    detail: '1 assist · 55 mins · right-mid.' },
    { id: 'jt-005', date: 'Sat 10 May', kind: 'milestone', title: '50 club training sessions',     detail: 'Jack hit his 50th Oakridge training session. Charter Standard milestone.' },
    { id: 'jt-006', date: 'Sat 03 May', kind: 'match',     title: 'D 1–1 vs Harfield U11',         detail: '1 goal · 60 mins · right-mid · player of the match (parent-voted).' },
    { id: 'jt-007', date: 'Sun 27 Apr', kind: 'note',      title: 'Coach development note',        detail: '"Scanning before receiving — big upgrade from last month." — Coach Mark' },
  ],
  'mia-carter': [
    { id: 'mt-001', date: 'Sun 25 May', kind: 'match',     title: 'L 1–2 vs Glenmoor U13',         detail: '70 mins · left wing · earned the penalty.' },
    { id: 'mt-002', date: 'Tue 20 May', kind: 'training',  title: '1v1 attacking duels',           detail: 'Strong session · 15 mins working with Coach Greta on cutting inside.' },
    { id: 'mt-003', date: 'Sat 17 May', kind: 'milestone', title: 'FA Girls football week',         detail: 'Mia attended the FA Girls Football Week event at the County FA pitch.' },
    { id: 'mt-004', date: 'Sun 11 May', kind: 'match',     title: 'W 4–1 vs Northbridge U13 Girls',detail: '2 goals · 65 mins · left wing.' },
    { id: 'mt-005', date: 'Sat 03 May', kind: 'note',      title: 'Coach development note',        detail: '"Vocal in the conditioned game — captain-for-a-week earned." — Coach Greta' },
  ],
}

const KEEPSAKE_BY_CHILD: Record<string, { id: string; label: string; date: string; type: 'photo' | 'video' }[]> = {
  'jack-carter': [
    { id: 'ja-01', label: "Goal-pass moment · vs Hartwell",   date: 'Sun 25 May', type: 'video' },
    { id: 'ja-02', label: 'Team photo · U11 Lions squad',     date: 'Sun 25 May', type: 'photo' },
    { id: 'ja-03', label: 'Walking-the-pitch · pre-match',    date: 'Sun 25 May', type: 'photo' },
    { id: 'ja-04', label: '50th training session moment',      date: 'Sat 10 May', type: 'photo' },
    { id: 'ja-05', label: 'Player-of-the-match clip',          date: 'Sat 03 May', type: 'video' },
    { id: 'ja-06', label: 'Training drill · rondo',            date: 'Tue 29 Apr', type: 'video' },
  ],
  'mia-carter': [
    { id: 'ma-01', label: 'Penalty earned · vs Glenmoor',     date: 'Sun 25 May', type: 'video' },
    { id: 'ma-02', label: 'FA Girls Football Week · group',   date: 'Sat 17 May', type: 'photo' },
    { id: 'ma-03', label: 'Double-goal day · vs Northbridge', date: 'Sun 11 May', type: 'video' },
    { id: 'ma-04', label: 'Team huddle · pre-kick-off',       date: 'Sun 11 May', type: 'photo' },
  ],
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl p-5 ${className ?? ''}`} style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
      {children}
    </div>
  )
}

function ChildSwitcher({
  children, selectedId, onSelect,
}: { children: ParentAppChild[]; selectedId: string; onSelect: (id: string) => void }) {
  return (
    <div
      className="rounded-xl p-3 mb-4"
      style={{
        background: `linear-gradient(135deg, ${T.accentDim} 0%, transparent 70%)`,
        border: `1px solid ${T.accent}55`,
      }}
    >
      <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: T.accent }}>Your children</p>
      <div className="flex gap-2 flex-wrap">
        {children.map(c => {
          const active = c.id === selectedId
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c.id)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors"
              style={{
                backgroundColor: active ? T.accent : T.panelAlt,
                color: active ? T.text : T.text2,
                border: active ? `1px solid ${T.good}` : `1px solid ${T.borderSoft}`,
                minWidth: 200,
              }}
            >
              <div
                className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                style={{
                  backgroundColor: active ? 'rgba(0,0,0,0.25)' : T.accentDim,
                  color: active ? T.text : T.good,
                  border: `1px solid ${active ? 'rgba(255,255,255,0.25)' : T.accent + '55'}`,
                }}
              >
                #{c.shirt}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">{c.name}</p>
                <p className="text-[10px] truncate" style={{ color: active ? T.text2 : T.text4 }}>
                  {c.ageBand} · {c.team}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function MatchRecapCard({ child, onOpenRecap }: { child: ParentAppChild; onOpenRecap: () => void }) {
  // For Jack we show the canned AI preview directly (matches the AI brief
  // demo content). For other children we show a generic placeholder
  // pointing at the AI brief — keeps it honest that only Jack has the
  // flagship demo recap right now.
  const isJack = child.id === 'jack-carter'
  return (
    <Card className="mb-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <p className="text-sm font-bold" style={{ color: T.text }}>📋 Last match · {child.lastMatch.date}</p>
        <span className="text-[11px]" style={{ color: T.text3 }}>
          {child.lastMatch.opponent} · <strong style={{ color: child.lastMatch.result.startsWith('W') ? T.good : child.lastMatch.result.startsWith('L') ? T.bad : T.warn }}>{child.lastMatch.result}</strong> · {child.lastMatch.minutes}/{child.lastMatch.outOf}'
        </span>
      </div>
      {isJack ? (
        <JuniorAIMatchRecapPreview onOpen={onOpenRecap} childName={child.name} />
      ) : (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: T.good }}>AI Match Recap</p>
            <h3 className="text-base font-bold" style={{ color: T.text }}>
              {child.name}'s match — recap pending
            </h3>
            <p className="text-sm mt-1 leading-relaxed" style={{ color: T.text2 }}>
              {child.name} played {child.lastMatch.minutes} minutes at {child.position} in {child.team}'s
              {' '}{child.lastMatch.result.toLowerCase()} against {child.lastMatch.opponent}. Full
              AI-generated recap drops in a few minutes — refresh in the AI brief tab.
            </p>
            <p className="text-[10px] mt-2" style={{ color: T.text4 }}>
              Demo: canned content for {child.name} not yet authored. Use Jack's profile to
              see the full flagship recap shape.
            </p>
          </div>
          <span className="text-3xl shrink-0" aria-hidden>🤖</span>
        </div>
      )}
    </Card>
  )
}

function FixturesAndFeesCard({ child }: { child: ParentAppChild }) {
  return (
    <Card className="mb-4">
      <p className="text-sm font-bold mb-3" style={{ color: T.text }}>📅 Up next · 💷 Fees</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Next fixture */}
        <div className="rounded-lg p-3" style={{ backgroundColor: T.panelAlt, border: `1px solid ${T.borderSoft}` }}>
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: T.text4 }}>Next fixture</p>
          <p className="text-sm font-bold" style={{ color: T.text }}>{child.team} vs {child.nextFixture.opponent}</p>
          <p className="text-xs mt-1" style={{ color: T.text2 }}>
            {child.nextFixture.date} · KO {child.nextFixture.kickoff} · {child.nextFixture.venue === 'H' ? 'Home' : 'Away'}
          </p>
          <button
            type="button"
            className="mt-3 text-[11px] px-3 py-1.5 rounded-lg font-medium"
            style={{ backgroundColor: T.accentDim, color: T.good, border: `1px solid ${T.accent}55` }}
          >
            RSVP — confirm available (demo)
          </button>
        </div>

        {/* Fees */}
        <div
          className="rounded-lg p-3"
          style={{
            backgroundColor: T.panelAlt,
            border: `1px solid ${child.feeStatus.paid ? `${T.good}33` : `${T.warn}55`}`,
          }}
        >
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: T.text4 }}>
            Subs · {child.feeStatus.cycle}
          </p>
          <p className="text-sm font-bold" style={{ color: T.text }}>
            £{child.feeStatus.amount}/{child.feeStatus.cycle === 'monthly' ? 'month' : 'term'}
          </p>
          <p className="text-xs mt-1" style={{ color: child.feeStatus.paid ? T.good : T.warn }}>
            {child.feeStatus.dueLabel}
          </p>
          {!child.feeStatus.paid && (
            <button
              type="button"
              className="mt-3 text-[11px] px-3 py-1.5 rounded-lg font-medium"
              style={{ backgroundColor: T.warn, color: '#1F2937' }}
            >
              Pay now (demo)
            </button>
          )}
          {child.feeStatus.paid && (
            <p className="text-[10px] mt-3" style={{ color: T.text4 }}>
              Paid — receipt available in account ledger.
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}

function SeasonTimelineCard({ child }: { child: ParentAppChild }) {
  const entries = TIMELINE[child.id] ?? []
  const kindColor = (k: TimelineEntry['kind']) => {
    switch (k) {
      case 'match':     return T.good
      case 'clip':      return T.accent
      case 'training':  return T.text3
      case 'milestone': return T.warn
      case 'note':      return '#A78BFA'
    }
  }
  const kindIcon = (k: TimelineEntry['kind']) => {
    switch (k) {
      case 'match':     return '⚽'
      case 'clip':      return '🎬'
      case 'training':  return '🏃'
      case 'milestone': return '🏅'
      case 'note':      return '📝'
    }
  }
  return (
    <Card className="mb-4">
      <p className="text-sm font-bold mb-3" style={{ color: T.text }}>📜 Season timeline · {child.name}</p>
      <ol className="space-y-3">
        {entries.map((e, i) => {
          const last = i === entries.length - 1
          return (
            <li key={e.id} className="flex gap-3">
              {/* Dot + line column */}
              <div className="flex flex-col items-center shrink-0">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs"
                  style={{ backgroundColor: `${kindColor(e.kind)}1e`, border: `1px solid ${kindColor(e.kind)}55` }}
                >
                  {kindIcon(e.kind)}
                </div>
                {!last && <div className="w-px flex-1 mt-1" style={{ backgroundColor: T.borderSoft }} />}
              </div>
              {/* Entry */}
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-xs font-semibold" style={{ color: T.text }}>{e.title}</p>
                  <span className="text-[10px] font-mono" style={{ color: T.text4 }}>{e.date}</span>
                </div>
                <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: T.text2 }}>{e.detail}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </Card>
  )
}

function KeepsakeArchiveCard({ child }: { child: ParentAppChild }) {
  const items = KEEPSAKE_BY_CHILD[child.id] ?? []
  return (
    <Card className="mb-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <p className="text-sm font-bold" style={{ color: T.text }}>📷 Keepsake archive · {child.name}</p>
        <span className="text-[11px]" style={{ color: T.text3 }}>{items.length} items this season</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {items.map(k => (
          <div
            key={k.id}
            className="rounded-lg overflow-hidden"
            style={{ backgroundColor: T.panelAlt, border: `1px solid ${T.borderSoft}` }}
          >
            <div
              className="aspect-square flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${T.accentDim}, ${T.panel})`,
                borderBottom: `1px solid ${T.borderSoft}`,
              }}
            >
              <span className="text-3xl" aria-hidden>{k.type === 'video' ? '▶' : '📷'}</span>
            </div>
            <div className="p-2">
              <p className="text-[11px] font-semibold truncate" style={{ color: T.text }}>{k.label}</p>
              <p className="text-[10px] mt-0.5" style={{ color: T.text4 }}>{k.date} · {k.type}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] mt-3" style={{ color: T.text4 }}>
        🔒 Imagery respects club consent settings. Restricted children are never named or shown
        in team-level keepsakes; their own parents&apos; archive shows them normally.
      </p>
    </Card>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

interface Props {
  session: SportsDemoSession
  /**
   * The canonical demo child from page.tsx DEMO_CLUBS (Jack Carter for
   * Oakridge). Used to pick the initially-selected child. If absent (e.g.
   * Sunday Rovers demo with no demo child set) we fall back to Jack's
   * record so the parent app always has something to render.
   */
  demoChild?: { name: string; ageBand: string; team: string }
  /**
   * Callback to open the full AI Match Recap view. The Parent App's
   * MatchRecapCard uses the compact preview; pressing "Open full recap"
   * navigates to the AI brief view. Wired in page.tsx.
   */
  onOpenFullRecap?: () => void
}

export default function JuniorParentApp({ session: _session, demoChild, onOpenFullRecap }: Props) {
  // Pick the initially-selected child. Match by name to the canonical
  // demo child if provided; default to the first record otherwise.
  const initialId = (() => {
    if (demoChild) {
      const m = PARENT_CHILDREN.find(c => c.name === demoChild.name)
      if (m) return m.id
    }
    return PARENT_CHILDREN[0].id
  })()
  const [selectedId, setSelectedId] = useState(initialId)
  const child = PARENT_CHILDREN.find(c => c.id === selectedId) ?? PARENT_CHILDREN[0]

  return (
    <div>
      <ChildSwitcher children={PARENT_CHILDREN} selectedId={selectedId} onSelect={setSelectedId} />

      {/* Hero — child header */}
      <div
        className="rounded-xl p-5 mb-4 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${T.accentDim} 0%, rgba(22,101,52,0.04) 60%, transparent 100%)`,
          border: `1px solid ${T.accent}55`,
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          {/* LEFT — identity content (avatar + name + position) */}
          <div className="flex items-center gap-4 flex-1">
            <div
              className="shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-lg font-black"
              style={{
                backgroundColor: 'rgba(0,0,0,0.25)',
                color: T.text,
                border: `1px solid ${T.accent}55`,
              }}
            >
              #{child.shirt}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider" style={{ color: T.accent }}>
                {child.team} · {child.ageBand} · {child.position}
              </p>
              <h1 className="text-2xl font-bold" style={{ color: T.text }}>{child.name}</h1>
              <p className="text-[11px] mt-0.5" style={{ color: T.text3 }}>
                Parent / Guardian view · child-scoped
              </p>
            </div>
          </div>

          {/* RIGHT — embedded player card. Card is reused verbatim;
              compact sizing handled here via a transform: scale wrapper
              (62.5% of the 320×480 modal version → 200×300). */}
          <div style={{ width: 200, height: 300, overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ transform: 'scale(0.625)', transformOrigin: 'top left', width: 320 }}>
              <JuniorPlayerCard
                player={{
                  id: child.detailId,
                  shirt: child.shirt,
                  name: child.name,
                  position: child.position,
                  availability: 'available',
                  attendancePct: 0,
                  faRegistered: true,
                } satisfies SquadPlayer}
                detail={JUNIOR_PLAYER_DETAIL[child.detailId]}
                teamName={child.team}
              />
            </div>
          </div>
        </div>
      </div>

      <MatchRecapCard child={child} onOpenRecap={() => onOpenFullRecap?.()} />
      <FixturesAndFeesCard child={child} />
      <SeasonTimelineCard child={child} />
      <KeepsakeArchiveCard child={child} />
    </div>
  )
}
