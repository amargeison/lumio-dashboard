// The demo academy's PUBLIC pages.
//
// A coach exploring the demo presses "Open" on a camp's sign-up page, its trip
// hub, or an attendee's player-information form. Those are server-rendered
// public pages that read the real database — where the demo's camps do not
// exist, so every one of those links used to land on "not found".
//
// The demo data set is a pure function of today's date, so the server can
// build the very same academy the browser is showing and serve the page from
// it. Nothing is stored and nothing is sent: a sign-up or a form submitted on a
// demo page is thanked and discarded.
//
// Only ever consulted AFTER the real database has said "no such camp", so a
// real academy's page can never be shadowed by the demo's.

import { buildDemoSeed } from '@/app/coach/[slug]/_lib/demo/seed'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>
export type DemoCamp = { camp: Row; profile: Row | null; attendees: Row[] }

function seed() { return buildDemoSeed(new Date()) }
function withCamp(s: Record<string, Row[]>, camp: Row | undefined): DemoCamp | null {
  if (!camp) return null
  return {
    camp,
    profile: (s.sports_profiles || [])[0] || null,
    attendees: (s.coach_camp_attendees || []).filter(a => a.camp_id === camp.id),
  }
}
const eq = (a: unknown, b: string) => String(a ?? '').toLowerCase() === b.toLowerCase()

/** The demo camp with this sign-up address, if it is open. */
export function demoCampBySignupSlug(slug: string): DemoCamp | null {
  try { const s = seed(); return withCamp(s, (s.coach_camps || []).find(c => c.signup_open && eq(c.signup_slug, slug))) } catch { return null }
}
/** The demo camp with this trip-hub address, if it is shared. */
export function demoCampByTripSlug(slug: string): DemoCamp | null {
  try { const s = seed(); return withCamp(s, (s.coach_camps || []).find(c => c.trip_open && eq(c.trip_slug, slug))) } catch { return null }
}
/** The demo attendee who owns this player-information link, with their camp. */
export function demoAttendeeByFormToken(token: string): (DemoCamp & { attendee: Row }) | null {
  try {
    const s = seed()
    const attendee = (s.coach_camp_attendees || []).find(a => a.form_token === token)
    const found = attendee ? withCamp(s, (s.coach_camps || []).find(c => c.id === attendee.camp_id)) : null
    return found && attendee ? { ...found, attendee } : null
  } catch { return null }
}
