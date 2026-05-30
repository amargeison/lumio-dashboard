'use client'

// JuniorNoticeboard — main Noticeboard view. Renders broadcasts +
// activity events with filter tabs, pinned section, interactive
// reactions, and (Commit 5) localStorage unread tracking.
//
// Commit 4 adds: lifted broadcast + reactions state, interactive
// reaction toggle on broadcast cards, JuniorBroadcastComposerModal
// for staff roles, "+ New broadcast" header button.
//
// Reaction toggle semantics:
//   - User has no reaction → click adds that reaction.
//   - User already reacted with the same type → click removes it.
//   - User reacted with a different type → click switches to the new
//     type (one reaction per user per broadcast).
//
// Composer:
//   - Visible only to roles mappable to JuniorBroadcastAuthorRole:
//     chairman → chair, welfare_officer, coach, team_manager.
//   - Other staff (academy_lead) and parent_guardian don't see the
//     button. academy_lead is a viewer-only Noticeboard role.
//
// Role gating (broadcasts/activity filter — unchanged from Commit 3):
//   parent_guardian: club_wide + age_band broadcasts (must match their
//                    child's ageBand). staff_only hidden.
//                    Activity events with visibility 'all'.
//   staff roles    : club_wide + staff_only + all age_band broadcasts.
//                    Activity events with visibility 'all' or 'staff'.
//   welfare_officer/chairman: also welfare visibility events (whitelist
//                             array on the event).

import { useEffect, useMemo, useRef, useState } from 'react'
import type { SportsDemoSession } from '@/components/sports-demo/SportsDemoGate'
import type { JuniorClub } from '../page'
import {
  JUNIOR_BROADCASTS,
  JUNIOR_ACTIVITY_EVENTS,
  type JuniorBroadcast,
  type JuniorBroadcastAuthorRole,
  type JuniorActivityEvent,
  type JuniorReaction,
  type JuniorReactionType,
} from '../_lib/junior-noticeboard-data'
import { getLastSeen, setLastSeen } from '../_lib/junior-noticeboard-unread'
import JuniorBroadcastCard from './JuniorBroadcastCard'
import JuniorActivityRow from './JuniorActivityRow'
import JuniorBroadcastComposerModal from './JuniorBroadcastComposerModal'

const C = {
  bg:         '#0A0E13',
  text:       '#F9FAFB',
  text3:      '#9CA3AF',
  text4:      '#6B7280',
  border:     '#1F2937',
  accent:     '#16A34A',
  accentLight:'#22C55E',
  accentDim:  'rgba(22,163,74,0.15)',
  accent55:   'rgba(22,163,74,0.55)',
} as const

interface Props {
  session: SportsDemoSession
  club: JuniorClub
}

type TabId = 'all' | 'broadcasts' | 'activity'

type FeedItem =
  | { kind: 'broadcast'; data: JuniorBroadcast; ts: number }
  | { kind: 'activity'; data: JuniorActivityEvent; ts: number }

// Map portal session.role → broadcast author role. Returns null for
// roles that cannot author broadcasts (parent_guardian, academy_lead).
function authorRoleFor(role: string): JuniorBroadcastAuthorRole | null {
  switch (role) {
    case 'chairman':        return 'chair'
    case 'welfare_officer': return 'welfare_officer'
    case 'coach':           return 'coach'
    case 'team_manager':    return 'team_manager'
    default:                return null
  }
}

export default function JuniorNoticeboard({ session, club }: Props) {
  const [tab, setTab] = useState<TabId>('all')
  const [composerOpen, setComposerOpen] = useState(false)

  // Lifted broadcasts list — seeded from the static data, allows local
  // composer to prepend. Vanishes on refresh (demo state).
  const [broadcasts, setBroadcasts] = useState<JuniorBroadcast[]>(JUNIOR_BROADCASTS)

  // Lifted reactions map — { [broadcastId]: JuniorReaction[] }. Seeded
  // from each broadcast's reactions on first render, then mutated
  // independently. Avoids re-cloning the whole broadcast array on each
  // reaction toggle.
  const [reactionsMap, setReactionsMap] = useState<Record<string, JuniorReaction[]>>(() =>
    Object.fromEntries(JUNIOR_BROADCASTS.map(b => [b.id, b.reactions]))
  )

  const isParent = session.role === 'parent_guardian'
  const childAgeBand = club.demoChild?.ageBand
  const userId = session.userName
  const authorRole = authorRoleFor(session.role)
  const canCompose = authorRole !== null

  // Snapshot last-seen for THIS render — used to compute the
  // per-item isUnread stripe. Frozen on mount via useRef so the
  // stripes don't flicker off as soon as the effect persists a new
  // last-seen.
  const snapshotLastSeenRef = useRef<number | null>(null)
  if (snapshotLastSeenRef.current === null) {
    const ls = getLastSeen(session.userName)
    snapshotLastSeenRef.current = ls ? new Date(ls).getTime() : 0
  }
  const snapshotMs = snapshotLastSeenRef.current

  // On mount: persist now() as the new last-seen and dispatch the
  // window event so the sidebar badge clears. Runs once per
  // Noticeboard navigation — when the user clicks elsewhere and
  // returns, this fires again.
  useEffect(() => {
    setLastSeen(session.userName, new Date().toISOString())
  }, [session.userName])

  // Filter broadcasts by role + audience.
  const visibleBroadcasts = useMemo(() => broadcasts.filter(b => {
    if (isParent) {
      if (b.audience === 'staff_only') return false
      if (b.audience === 'age_band' && b.ageBand !== childAgeBand) return false
    }
    return true
  }), [broadcasts, isParent, childAgeBand])

  // Filter activity events by visibility.
  const visibleActivity = useMemo(() => JUNIOR_ACTIVITY_EVENTS.filter(e => {
    if (e.visibility === 'all') return true
    if (e.visibility === 'staff') return !isParent
    if (Array.isArray(e.visibility)) return e.visibility.includes(session.role)
    return false
  }), [isParent, session.role])

  // Pinned section.
  const includesBroadcasts = tab === 'all' || tab === 'broadcasts'
  const pinned = includesBroadcasts
    ? visibleBroadcasts.filter(b => b.pinned)
    : []

  // Main feed.
  const feed: FeedItem[] = []
  if (tab === 'all' || tab === 'broadcasts') {
    visibleBroadcasts
      .filter(b => !b.pinned)
      .forEach(b => feed.push({
        kind: 'broadcast', data: b, ts: new Date(b.timestamp).getTime(),
      }))
  }
  if (tab === 'all' || tab === 'activity') {
    visibleActivity.forEach(a => feed.push({
      kind: 'activity', data: a, ts: new Date(a.timestamp).getTime(),
    }))
  }
  feed.sort((x, y) => y.ts - x.ts)

  const totalCount = pinned.length + feed.length

  // ─── Reaction toggle ────────────────────────────────────────────────
  function handleReact(broadcastId: string, type: JuniorReactionType) {
    setReactionsMap(prev => {
      const current = prev[broadcastId] ?? []
      const mine = current.find(r => r.userId === userId)
      let next: JuniorReaction[]
      if (mine && mine.type === type) {
        // Toggle off.
        next = current.filter(r => r.userId !== userId)
      } else if (mine) {
        // Switch type.
        next = current.map(r =>
          r.userId === userId
            ? { ...r, type, timestamp: new Date().toISOString() }
            : r
        )
      } else {
        // Add new.
        next = [...current, { userId, type, timestamp: new Date().toISOString() }]
      }
      return { ...prev, [broadcastId]: next }
    })
  }

  // ─── Composer submit ────────────────────────────────────────────────
  function handleComposerSubmit(b: JuniorBroadcast) {
    setBroadcasts(prev => [b, ...prev])
    setReactionsMap(prev => ({ ...prev, [b.id]: b.reactions }))
    setComposerOpen(false)
  }

  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100%' }}>
      <div className="px-6 py-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: C.text }}>
              Noticeboard
            </h1>
            <p className="text-xs" style={{ color: C.text3 }}>
              Club broadcasts and recent activity
            </p>
          </div>
          {canCompose && (
            <button
              type="button"
              onClick={() => setComposerOpen(true)}
              className="px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap"
              style={{
                color: C.accentLight,
                backgroundColor: C.accentDim,
                border: `1px solid ${C.accent55}`,
              }}
            >
              + New broadcast
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div
          className="flex gap-1 mb-5 overflow-x-auto"
          style={{ borderBottom: `1px solid ${C.border}` }}
        >
          <TabButton id="all"        label="All"        icon="📋" current={tab} onClick={setTab} />
          <TabButton id="broadcasts" label="Broadcasts" icon="📢" current={tab} onClick={setTab} />
          <TabButton id="activity"   label="Activity"   icon="🔔" current={tab} onClick={setTab} />
        </div>

        {/* Pinned section */}
        {pinned.length > 0 && (
          <div className="mb-6">
            <div
              className="text-[10px] font-semibold mb-2 inline-flex items-center gap-1"
              style={{
                color: C.accentLight,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              📌 Pinned
            </div>
            <div className="space-y-3">
              {pinned.map(b => (
                <JuniorBroadcastCard
                  key={b.id}
                  broadcast={b}
                  isUnread={new Date(b.timestamp).getTime() > snapshotMs}
                  reactions={reactionsMap[b.id] ?? b.reactions}
                  userId={userId}
                  onReact={(t) => handleReact(b.id, t)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Main feed */}
        {feed.length === 0 && pinned.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          <div className="space-y-3">
            {feed.map(item =>
              item.kind === 'broadcast' ? (
                <JuniorBroadcastCard
                  key={`b-${item.data.id}`}
                  broadcast={item.data}
                  isUnread={item.ts > snapshotMs}
                  reactions={reactionsMap[item.data.id] ?? item.data.reactions}
                  userId={userId}
                  onReact={(t) => handleReact(item.data.id, t)}
                />
              ) : (
                <JuniorActivityRow
                  key={`a-${item.data.id}`}
                  event={item.data}
                  isUnread={item.ts > snapshotMs}
                />
              )
            )}
          </div>
        )}

        {/* Count footer */}
        {totalCount > 0 && (
          <div
            className="text-[10px] mt-6 text-center"
            style={{ color: C.text4 }}
          >
            Showing {totalCount} {totalCount === 1 ? 'item' : 'items'}
          </div>
        )}
      </div>

      {/* Composer modal */}
      {composerOpen && authorRole && (
        <JuniorBroadcastComposerModal
          authorName={session.userName}
          authorRole={authorRole}
          onClose={() => setComposerOpen(false)}
          onSubmit={handleComposerSubmit}
        />
      )}
    </div>
  )
}

// ─── Tab button ──────────────────────────────────────────────────────

function TabButton({
  id, label, icon, current, onClick,
}: {
  id: TabId
  label: string
  icon: string
  current: TabId
  onClick: (id: TabId) => void
}) {
  const active = current === id
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className="px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-all"
      style={{
        color: active ? C.accentLight : C.text4,
        borderBottom: active ? `2px solid ${C.accentLight}` : '2px solid transparent',
        marginBottom: '-1px',
        background: 'transparent',
      }}
    >
      <span className="mr-1.5">{icon}</span>{label}
    </button>
  )
}

// ─── Empty state ─────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: TabId }) {
  const message =
    tab === 'broadcasts' ? 'No broadcasts yet.' :
    tab === 'activity'   ? 'No recent activity.' :
                           'Nothing here yet.'
  return (
    <div
      className="rounded-xl py-10 text-center"
      style={{
        backgroundColor: '#0D1117',
        border: `1px dashed ${C.border}`,
        color: C.text4,
      }}
    >
      <div className="text-2xl mb-2">🗒️</div>
      <div className="text-sm">{message}</div>
    </div>
  )
}
