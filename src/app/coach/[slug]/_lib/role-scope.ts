'use client'

// Coach portal — VIEW ROLE + the coachId data-scope it implies.
//
// Phase 1 of the role switcher. Three roles:
//   • head    — Head Coach: full academy access, NO scoping (current behaviour).
//   • coach   — Coach: the portal narrowed to one coach's own players/bookings.
//   • student — Student: a player/parent view (placeholder this phase; Phase 2).
//
// The role itself is owned by the demo session (lumio_sports_demo_coach.role,
// written by the shared RoleSwitcher). The portal shell mirrors the active role
// into this module-level scope store so the DATA VIEWS can scope themselves
// WITHOUT threading a prop through every view — mirrors menu-visibility.ts's
// pub/sub shape. Head = scope null = views render exactly as before.

import { useEffect, useState } from 'react'

export type CoachViewRole = 'head' | 'coach' | 'student'

// Which coach the 'coach' role impersonates in the demo. Rachel Adeyemi is a
// NON-head Senior who carries her own players + bookings in coaches-data
// (STAFF_PLAYERS/STAFF_BOOKINGS), so her filtered Roster / Development / Racket
// / Booking views are populated rather than empty. Per-session content
// (lessons, recordings, GPS) is only seeded for the head's roster in the demo,
// so those views show their existing empty states under this scope — a known
// Phase-1 demo-data gap, not a filtering bug. Point this at another COACHES id
// to impersonate a different coach.
export const COACH_VIEW_COACH_ID = 'rachel'

// Nav items a 'coach' cannot see — academy-wide / head-only modules. Everything
// else stays visible and is data-scoped by coachId. (Resource Centre stays
// visible as a read-only shared library.)
export const COACH_HIDDEN_NAV = ['staff', 'camps', 'venues', 'equipment', 'payments']

// Normalise whatever the session carries (may be a legacy role like
// 'assistant'/'manager', or undefined) to one of the three view roles.
export function normalizeRole(role: string | undefined | null): CoachViewRole {
  return role === 'coach' || role === 'student' ? role : 'head'
}

// The coachId a role scopes to — null means "no scope" (head / student).
export function coachIdForRole(role: CoachViewRole): string | null {
  return role === 'coach' ? COACH_VIEW_COACH_ID : null
}

// Whether a role may see a given sidebar nav item. Head sees everything;
// coach hides the academy-wide modules. (Student renders a placeholder, so its
// nav is handled separately by the shell — it never reaches this filter.)
export function roleAllowsNav(role: CoachViewRole, navId: string): boolean {
  if (role === 'coach') return !COACH_HIDDEN_NAV.includes(navId)
  return true
}

// ─── Module-level scope store (client-only, single page) ─────────────────────
// null = head/student (no scoping). A coachId = scope every data view to it.
let _scope: string | null = null
const _subs = new Set<() => void>()

export function getScopeCoachId(): string | null { return _scope }

export function setScopeCoachId(id: string | null) {
  if (_scope === id) return
  _scope = id
  _subs.forEach(cb => cb())
}

export function subscribeScope(cb: () => void): () => void {
  _subs.add(cb)
  return () => { _subs.delete(cb) }
}

// Read the active scope reactively. Starts null on the server and on the first
// client render (matching SSR), then the shell pushes the real scope after
// mount — so there's no hydration mismatch.
export function useScopeCoachId(): string | null {
  const [v, setV] = useState<string | null>(_scope)
  useEffect(() => {
    setV(_scope)
    return subscribeScope(() => setV(_scope))
  }, [])
  return v
}
