'use client'

// Junior Football — Match Video & AI Highlights.
//
// The portal handles clip METADATA only. Clipping itself is external —
// Option A (Veo/Trace-style automated camera) or Option B (Workstream C,
// post-match upload + ML clipping). This view assumes clips arrive
// pre-tagged with player references; the portal renders the library and
// gates visibility by role + consent.
//
// Role-scoped surfaces:
//   - staff (chairman / coach / team_manager / welfare_officer /
//     academy_lead): full-match library across all teams, with the
//     full clip list per match. Inert MatchVideoUpload surface
//     (Option B entry point — UI present, drop-zone disabled in demo).
//   - parent_guardian: their own child's auto-clipped highlight reel
//     only (clips filtered by player id + consent). No full-match
//     library access.
//
// CONSENT GATE — the restricted-flag rule from Commit 5 applies. Noah
// Baxter (U14 Eagles, care-order restriction) NEVER appears in any
// clip surface: not in his own auto-reel (he wouldn't see this app —
// his parent's view is provided by the same component, scoped to
// him as their child, but clips referencing him are excluded), and
// not in team-level full-match clips (he's omitted from the
// per-player tag list and any thumbnails). Demo behaviour for now —
// real RLS is Workstream B. The exclusion is implemented as a
// filter on the CLIPS data below.

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

type Tab = 'library' | 'highlights' | 'upload'

interface MatchFile {
  id: string
  date: string
  team: string
  opponent: string
  result: string
  durationMin: number
  source: 'option_a_camera' | 'option_b_upload'
  clipCount: number
}

interface Clip {
  id: string
  matchId: string
  label: string
  durationSec: number
  /** Player IDs tagged in the clip — drives the per-child auto-reel filter. */
  playerIds: string[]
  /** Tag categories (e.g. 'assist', 'tackle'). Drives parent-friendly chips. */
  tags: string[]
  /**
   * Clips referencing a restricted child are filtered OUT before render.
   * This flag flips true if ANY tagged playerId is in the restricted list
   * — keeps the filter explicit in the data, easy to inspect.
   */
  containsRestricted: boolean
}

// ─── Demo data ───────────────────────────────────────────────────────────────
// Two demo children for the canonical parent (matches JuniorParentApp):
//   - 'jack-carter' (Jack Carter, U11 Lions)
//   - 'mia-carter'  (Mia Carter,  U13 Falcons)
// One demo restricted child (matches JuniorSafeguardingHub):
//   - 'noah-baxter' (Noah Baxter, U14 Eagles, care-order restriction)
//
// Clips referencing 'noah-baxter' are listed in the data with
// containsRestricted: true and are filtered out of every render. This
// keeps the test surface honest — the data documents the exclusion,
// the filter enforces it.

const MATCHES: MatchFile[] = [
  { id: 'm-001', date: 'Sun 25 May', team: 'U11 Lions',   opponent: 'Hartwell U11',         result: 'W 3–2', durationMin: 60, source: 'option_a_camera', clipCount: 8 },
  { id: 'm-002', date: 'Sun 25 May', team: 'U13 Falcons', opponent: 'Glenmoor U13',         result: 'L 1–2', durationMin: 70, source: 'option_a_camera', clipCount: 6 },
  { id: 'm-003', date: 'Sun 25 May', team: 'U14 Eagles',  opponent: 'Sunday Rovers U14',    result: 'W 2–0', durationMin: 70, source: 'option_b_upload', clipCount: 5 },
  { id: 'm-004', date: 'Sun 18 May', team: 'U11 Lions',   opponent: 'Sunday Rovers U11',    result: 'W 2–0', durationMin: 60, source: 'option_a_camera', clipCount: 7 },
  { id: 'm-005', date: 'Sun 18 May', team: 'U13 Falcons', opponent: 'Northbridge U13 Girls', result: 'W 4–1', durationMin: 70, source: 'option_a_camera', clipCount: 9 },
]

const ALL_CLIPS: Clip[] = [
  // U11 Lions vs Hartwell — Jack-heavy day
  { id: 'c-101', matchId: 'm-001', label: 'Pass for the first goal',     durationSec: 18, playerIds: ['jack-carter'],               tags: ['assist'],     containsRestricted: false },
  { id: 'c-102', matchId: 'm-001', label: 'Press → turnover → equaliser', durationSec: 22, playerIds: ['jack-carter','aria-khoury'], tags: ['pressure','goal'], containsRestricted: false },
  { id: 'c-103', matchId: 'm-001', label: 'First-touch in own half',     durationSec: 11, playerIds: ['jack-carter'],               tags: ['composure'],  containsRestricted: false },
  { id: 'c-104', matchId: 'm-001', label: 'Goal-line clearance',         durationSec: 14, playerIds: ['maya-singh'],                tags: ['defending'], containsRestricted: false },
  { id: 'c-105', matchId: 'm-001', label: 'Late winner',                  durationSec: 16, playerIds: ['ravi-doshi','liam-forrest'], tags: ['goal'],      containsRestricted: false },
  // U13 Falcons vs Glenmoor — Mia-heavy day
  { id: 'c-201', matchId: 'm-002', label: 'Penalty earned (1v1 cut-in)', durationSec: 20, playerIds: ['mia-carter'],                tags: ['skill'],     containsRestricted: false },
  { id: 'c-202', matchId: 'm-002', label: 'Cross + assist',              durationSec: 16, playerIds: ['mia-carter','sophie-mahan'], tags: ['assist'],    containsRestricted: false },
  { id: 'c-203', matchId: 'm-002', label: 'Tracking back · recovery',    durationSec: 12, playerIds: ['mia-carter'],                tags: ['defending'], containsRestricted: false },
  // U14 Eagles — restricted-child match. The clip data exists in source
  // (the camera tagged Noah's runs) but containsRestricted: true gates it
  // out of every render before it reaches the UI.
  { id: 'c-301', matchId: 'm-003', label: 'Long ball over the top',      durationSec: 14, playerIds: ['noah-baxter'],               tags: ['skill'],     containsRestricted: true  },
  { id: 'c-302', matchId: 'm-003', label: 'Team goal celebration',       durationSec: 10, playerIds: ['noah-baxter','t-other'],     tags: ['team'],      containsRestricted: true  },
  { id: 'c-303', matchId: 'm-003', label: 'Defensive block',             durationSec: 12, playerIds: ['g-yardley-player'],          tags: ['defending'], containsRestricted: false },
  // Earlier U11 matches — Jack
  { id: 'c-401', matchId: 'm-004', label: 'Assist for opener',           durationSec: 14, playerIds: ['jack-carter'],               tags: ['assist'],    containsRestricted: false },
  { id: 'c-402', matchId: 'm-004', label: 'Player of the match moment',  durationSec: 22, playerIds: ['jack-carter'],               tags: ['skill'],     containsRestricted: false },
  // Earlier U13 — Mia
  { id: 'c-501', matchId: 'm-005', label: 'Double-goal day (1st)',       durationSec: 18, playerIds: ['mia-carter'],                tags: ['goal'],      containsRestricted: false },
  { id: 'c-502', matchId: 'm-005', label: 'Double-goal day (2nd)',       durationSec: 20, playerIds: ['mia-carter'],                tags: ['goal'],      containsRestricted: false },
  { id: 'c-503', matchId: 'm-005', label: 'Press triggered turnover',    durationSec: 12, playerIds: ['mia-carter'],                tags: ['pressure'],  containsRestricted: false },
]

// Consent gate — single chokepoint. Apply this before ANY clip render.
const visibleClips = (clips: Clip[]) => clips.filter(c => !c.containsRestricted)

// Apply also a player filter for the parent auto-reel.
const clipsForPlayer = (clips: Clip[], playerId: string) =>
  visibleClips(clips).filter(c => c.playerIds.includes(playerId))

// ─── Subcomponents ───────────────────────────────────────────────────────────

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl p-5 ${className ?? ''}`} style={{ backgroundColor: T.panel, border: `1px solid ${T.border}` }}>
      {children}
    </div>
  )
}

function ClipTile({ c }: { c: Clip }) {
  return (
    <div className="rounded-lg overflow-hidden" style={{ backgroundColor: T.panelAlt, border: `1px solid ${T.borderSoft}` }}>
      <div
        className="aspect-video flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${T.accentDim}, ${T.panel})`, borderBottom: `1px solid ${T.borderSoft}` }}
      >
        <span className="text-3xl" aria-hidden>▶</span>
      </div>
      <div className="p-2">
        <p className="text-[11px] font-semibold truncate" style={{ color: T.text }}>{c.label}</p>
        <p className="text-[10px] mt-0.5" style={{ color: T.text4 }}>
          {c.durationSec}s · {c.tags.join(' · ')}
        </p>
      </div>
    </div>
  )
}

function MatchVideoUpload() {
  return (
    <Card>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <p className="text-sm font-bold" style={{ color: T.text }}>Upload match video</p>
          <p className="text-[11px]" style={{ color: T.text3 }}>
            Option B entry point — post-match upload + ML clipping pipeline
            (Workstream C). Surface present so the flow is visible; ingestion
            is disabled in this build.
          </p>
        </div>
        <span
          className="text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider"
          style={{ backgroundColor: T.warn + '1e', color: T.warn, border: `1px solid ${T.warn}55` }}
        >
          Coming via Workstream C
        </span>
      </div>
      <div
        className="rounded-lg p-8 text-center"
        style={{
          backgroundColor: T.panelAlt,
          border: `2px dashed ${T.borderSoft}`,
          color: T.text4,
        }}
        aria-disabled
      >
        <p className="text-3xl mb-2" aria-hidden>📼</p>
        <p className="text-sm font-semibold" style={{ color: T.text3 }}>Drag a full-match video here</p>
        <p className="text-[11px] mt-1">MP4 / MOV up to 8 GB · ingest disabled in demo</p>
        <button
          type="button"
          disabled
          className="mt-4 text-[11px] px-4 py-2 rounded-lg font-medium cursor-not-allowed"
          style={{ backgroundColor: 'rgba(75,85,99,0.30)', color: T.text4, border: `1px solid ${T.borderSoft}` }}
        >
          Browse files (disabled)
        </button>
      </div>
      <p className="text-[10px] mt-3" style={{ color: T.text4 }}>
        Option A (automated camera) ingests in the background; matches tagged
        via Option A skip this surface entirely. Use this only when no camera
        was deployed.
      </p>
    </Card>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────

interface Props {
  session: SportsDemoSession
  /** Demo child from page.tsx DEMO_CLUBS — used to scope the parent reel. */
  demoChild?: { name: string; ageBand: string; team: string }
}

export default function JuniorMatchVideo({ session, demoChild }: Props) {
  const isParent = session.role === 'parent_guardian'

  // Map the canonical demoChild to a playerId. The Carter family has two
  // demo children; default to Jack on Oakridge. A real wire-up would
  // resolve via the active ChildSwitcher selection.
  const parentPlayerId = (() => {
    if (!isParent) return null
    if (demoChild?.name === 'Mia Carter') return 'mia-carter'
    return 'jack-carter'
  })()

  // Parents see ONLY the highlights tab (per-child reel). Staff see all
  // three tabs, defaulting to the library.
  const [tab, setTab] = useState<Tab>(isParent ? 'highlights' : 'library')

  const tabs: { id: Tab; label: string; icon: string }[] = isParent
    ? [
        { id: 'highlights', label: "My child's highlights", icon: '🎬' },
      ]
    : [
        { id: 'library',    label: 'Full-match library', icon: '📚' },
        { id: 'highlights', label: 'Highlights reel',    icon: '🎬' },
        { id: 'upload',     label: 'Upload match',       icon: '⬆️' },
      ]

  const childReel = parentPlayerId ? clipsForPlayer(ALL_CLIPS, parentPlayerId) : []
  const restrictedHidden = ALL_CLIPS.filter(c => c.containsRestricted).length

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div
        className="rounded-xl p-5"
        style={{
          background: `linear-gradient(135deg, ${T.accentDim} 0%, rgba(22,101,52,0.04) 60%, transparent 100%)`,
          border: `1px solid ${T.accent}55`,
        }}
      >
        <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: T.accent }}>
          Match Video {isParent ? `· ${demoChild?.name ?? 'Your child'}` : '· Library'}
        </p>
        <h2 className="text-lg font-bold" style={{ color: T.text }}>
          {isParent ? "Your child's highlights, auto-clipped" : 'Full-match library + AI-tagged highlights'}
        </h2>
        <p className="text-sm mt-1 leading-relaxed" style={{ color: T.text2 }}>
          {isParent
            ? `${childReel.length} clip${childReel.length === 1 ? '' : 's'} ready to view. Clips are auto-extracted from match footage and filtered to your child. Imagery respects every club consent setting.`
            : `${MATCHES.length} matches · ${visibleClips(ALL_CLIPS).length} clips visible (${restrictedHidden} excluded by safeguarding restriction). Portal handles clip metadata only — clipping is external (Option A camera / Option B upload).`}
        </p>
      </div>

      {/* Tabs */}
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

      {/* Library — staff only */}
      {tab === 'library' && !isParent && (
        <Card>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <p className="text-sm font-bold" style={{ color: T.text }}>Full matches · this fortnight</p>
            <span className="text-[11px]" style={{ color: T.text3 }}>
              Sourced from Option A camera + Option B uploads
            </span>
          </div>
          <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: T.panelAlt, borderBottom: `1px solid ${T.border}` }}>
                  <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: T.text4 }}>Date</th>
                  <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: T.text4 }}>Team</th>
                  <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: T.text4 }}>Opponent</th>
                  <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: T.text4 }}>Source</th>
                  <th className="text-left p-3 text-[10px] uppercase font-semibold" style={{ color: T.text4 }}>Clips</th>
                </tr>
              </thead>
              <tbody>
                {MATCHES.map(m => {
                  const clipsInMatch = visibleClips(ALL_CLIPS.filter(c => c.matchId === m.id))
                  return (
                    <tr key={m.id} style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                      <td className="p-3 text-xs" style={{ color: T.text2 }}>{m.date}</td>
                      <td className="p-3 text-xs font-semibold" style={{ color: T.text }}>{m.team}</td>
                      <td className="p-3 text-[11px]" style={{ color: T.text3 }}>
                        vs {m.opponent} · <span style={{ color: m.result.startsWith('W') ? T.good : m.result.startsWith('L') ? T.bad : T.warn }}>{m.result}</span>
                      </td>
                      <td className="p-3">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded uppercase tracking-wide font-semibold"
                          style={{
                            backgroundColor: m.source === 'option_a_camera' ? T.accentDim : 'rgba(245,158,11,0.15)',
                            color: m.source === 'option_a_camera' ? T.good : T.warn,
                          }}
                        >
                          {m.source === 'option_a_camera' ? 'Option A' : 'Option B'}
                        </span>
                      </td>
                      <td className="p-3 text-[11px]" style={{ color: T.text3 }}>
                        {clipsInMatch.length} clip{clipsInMatch.length === 1 ? '' : 's'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] mt-3" style={{ color: T.text4 }}>
            🔒 {restrictedHidden} clip{restrictedHidden === 1 ? '' : 's'} hidden by safeguarding consent — restricted children are excluded from all clip surfaces automatically. Visible to the Welfare Officer in the Safeguarding hub.
          </p>
        </Card>
      )}

      {/* Highlights — both staff (full reel) and parents (child-scoped). */}
      {tab === 'highlights' && (
        <Card>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <p className="text-sm font-bold" style={{ color: T.text }}>
              {isParent ? `${demoChild?.name ?? 'Your child'}'s reel · this season` : 'Recent highlights — all teams'}
            </p>
            <span className="text-[11px]" style={{ color: T.text3 }}>
              {isParent ? `${childReel.length} clip${childReel.length === 1 ? '' : 's'}` : `${visibleClips(ALL_CLIPS).length} clips · ${restrictedHidden} hidden by consent`}
            </span>
          </div>
          {isParent && childReel.length === 0 ? (
            <p className="text-xs" style={{ color: T.text3 }}>
              No clips yet for {demoChild?.name ?? 'your child'} this season — new highlights appear here automatically after each match.
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {(isParent ? childReel : visibleClips(ALL_CLIPS)).map(c => (
                <ClipTile key={c.id} c={c} />
              ))}
            </div>
          )}
          {isParent && (
            <p className="text-[10px] mt-3" style={{ color: T.text4 }}>
              Clips are filtered to your child and respect every club consent setting. Photography
              and filming consent revocable any time from Safeguarding.
            </p>
          )}
        </Card>
      )}

      {/* Upload — staff only. Inert surface (Option B entry point). */}
      {tab === 'upload' && !isParent && <MatchVideoUpload />}
    </div>
  )
}
