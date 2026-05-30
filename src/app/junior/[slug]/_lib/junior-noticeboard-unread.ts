// junior-noticeboard-unread.ts
//
// localStorage-backed last-seen tracking for the Junior Noticeboard.
// Keyed by session.userName so the per-user signal survives role
// switches inside the same demo session.
//
// Lifecycle:
//   1. Sidebar render reads getLastSeen(userName) and counts items
//      newer than it (broadcasts + visibility-filtered activity).
//   2. JuniorNoticeboard, on mount, snapshots the CURRENT last-seen
//      into local React state so this render's unread stripes are
//      stable for the visit. It then immediately persists new now()
//      as the new last-seen, then dispatches a window event so the
//      sidebar badge can clear.
//   3. Sidebar listens for the event, recomputes, badge updates.
//
// Why a custom DOM event: localStorage 'storage' events only fire
// across tabs, not within the same tab. We need cross-component
// coordination inside the same window — the event channel handles it
// without lifting more state into page.tsx.

import { JUNIOR_BROADCASTS, JUNIOR_ACTIVITY_EVENTS, type JuniorActivityEvent } from './junior-noticeboard-data'

export const NOTICEBOARD_SEEN_EVENT = 'junior:noticeboard:seen'

function keyFor(userName: string): string {
  return `lumio.junior.noticeboard.lastSeen.${userName}`
}

export function getLastSeen(userName: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(keyFor(userName))
  } catch {
    return null
  }
}

export function setLastSeen(userName: string, iso: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(keyFor(userName), iso)
    window.dispatchEvent(new CustomEvent(NOTICEBOARD_SEEN_EVENT, { detail: { userName, iso } }))
  } catch {
    // Silent fail — private browsing or quota exceeded shouldn't
    // break the surface.
  }
}

/** Filter an activity event by the same visibility rules used in
 *  JuniorNoticeboard. Pulled out so the sidebar badge can reuse it
 *  without depending on the component. */
function activityVisibleTo(role: string, event: JuniorActivityEvent): boolean {
  if (event.visibility === 'all') return true
  if (event.visibility === 'staff') return role !== 'parent_guardian'
  if (Array.isArray(event.visibility)) return event.visibility.includes(role)
  return false
}

/** Compute unread count for the sidebar badge. Mirrors the role and
 *  audience filters used by JuniorNoticeboard so the badge can't
 *  count items the user isn't allowed to see. */
export function countUnread(args: {
  userName: string
  role: string
  /** Loosely typed as string because the page.tsx JuniorClub model
   *  carries ageBand as a string (it's authored data, not a typed
   *  enum at that boundary). The audience filter only checks
   *  equality with b.ageBand which is a JuniorAgeBand — string
   *  comparison is sound. */
  childAgeBand?: string
}): number {
  const { userName, role, childAgeBand } = args
  const lastSeen = getLastSeen(userName)
  const lastSeenMs = lastSeen ? new Date(lastSeen).getTime() : 0
  const isParent = role === 'parent_guardian'

  let count = 0

  for (const b of JUNIOR_BROADCASTS) {
    if (isParent) {
      if (b.audience === 'staff_only') continue
      if (b.audience === 'age_band' && b.ageBand !== childAgeBand) continue
    }
    if (new Date(b.timestamp).getTime() > lastSeenMs) count++
  }

  for (const e of JUNIOR_ACTIVITY_EVENTS) {
    if (!activityVisibleTo(role, e)) continue
    if (new Date(e.timestamp).getTime() > lastSeenMs) count++
  }

  return count
}
