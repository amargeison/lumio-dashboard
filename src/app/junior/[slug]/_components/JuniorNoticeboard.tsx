'use client'

// JuniorNoticeboard — main Noticeboard view. Renders broadcasts +
// activity events with filter tabs, pinned section, and unread
// tracking via localStorage.
//
// This skeleton (Commit 2) renders the basic feed read-only. Commit 3
// adds JuniorBroadcastCard + JuniorActivityRow sub-components and
// filter logic. Commit 4 adds reactions + composer. Commit 5 adds
// localStorage unread tracking + sidebar badge integration.
//
// Role gating:
//   parent_guardian: club_wide + age_band broadcasts (must match their
//                    child's ageBand) + activity events with visibility
//                    'all' OR matching their ageBand. Compliance and
//                    welfare events hidden.
//   staff roles    : club_wide + staff_only + all age_band broadcasts +
//                    activity events with visibility 'all' OR 'staff'.
//   welfare_officer/chairman: also welfare visibility events (whitelist
//                             array on the event).

import type { SportsDemoSession } from '@/components/sports-demo/SportsDemoGate'
import type { JuniorClub } from '../page'
import {
  JUNIOR_BROADCASTS,
  JUNIOR_ACTIVITY_EVENTS,
  formatRelativeTime,
  type JuniorBroadcast,
  type JuniorActivityEvent,
} from '../_lib/junior-noticeboard-data'

interface Props {
  session: SportsDemoSession
  club: JuniorClub
}

type FeedItem =
  | { kind: 'broadcast'; data: JuniorBroadcast }
  | { kind: 'activity'; data: JuniorActivityEvent }

export default function JuniorNoticeboard({ session, club }: Props) {
  const isParent = session.role === 'parent_guardian'
  const childAgeBand = club.demoChild?.ageBand

  // Filter broadcasts by role + audience.
  const visibleBroadcasts = JUNIOR_BROADCASTS.filter(b => {
    if (isParent) {
      if (b.audience === 'staff_only') return false
      if (b.audience === 'age_band' && b.ageBand !== childAgeBand) return false
    }
    return true
  })

  // Filter activity events by visibility.
  const visibleActivity = JUNIOR_ACTIVITY_EVENTS.filter(e => {
    if (e.visibility === 'all') return true
    if (e.visibility === 'staff') return !isParent
    if (Array.isArray(e.visibility)) return e.visibility.includes(session.role)
    return false
  })

  // Combined feed sorted by timestamp desc. Commit 3 will split into
  // pinned + non-pinned sections.
  const feed: FeedItem[] = [
    ...visibleBroadcasts.map(b => ({ kind: 'broadcast' as const, data: b })),
    ...visibleActivity.map(a => ({ kind: 'activity' as const, data: a })),
  ].sort((x, y) => new Date(y.data.timestamp).getTime() - new Date(x.data.timestamp).getTime())

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Noticeboard</h1>
        <p className="text-xs text-gray-400">Club broadcasts and activity</p>
      </div>

      {/* Placeholder skeleton — Commit 3 replaces with proper rendering. */}
      <div className="space-y-3">
        {feed.map((item) => (
          <div
            key={`${item.kind}-${item.data.id}`}
            className="bg-[#0D1117] border border-gray-800 rounded-xl p-4"
          >
            <div className="text-[10px] uppercase tracking-wider text-emerald-400/70 mb-1">
              {item.kind === 'broadcast'
                ? `📢 ${item.data.author.name}`
                : `📋 ${item.data.category}`}
            </div>
            <div className="text-sm font-bold text-white mb-1">{item.data.title}</div>
            {item.kind === 'broadcast' && (
              <p className="text-xs text-gray-400 line-clamp-2">{item.data.body}</p>
            )}
            {item.kind === 'activity' && item.data.detail && (
              <p className="text-xs text-gray-500">{item.data.detail}</p>
            )}
            <div className="text-[10px] text-gray-600 mt-2">
              {formatRelativeTime(item.data.timestamp)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
