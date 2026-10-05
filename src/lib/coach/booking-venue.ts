// Which venue a booking is at.
//
// A booking made from a booking link, or from a form that sends one, records
// its venue (coach_bookings.venue_id, migration 197) and that is the answer.
// Older bookings record only a COURT ("Court 3", "Indoor 1"), so for those the
// venue has to be worked out, and the rule for working it out has to be the
// same everywhere: the confirmation email and the family's page cannot disagree
// about where to turn up.
//
// The rule, in order: the venue the booking names; a venue whose name appears
// in the court's name; the venue that court belongs to on the academy's court
// list; the only venue there is. If none of those gives ONE answer there is no
// venue — the email and the page then say nothing about where. It used to fall
// back to the "home" venue, which sent families to the wrong building whenever
// the lesson was somewhere else.

export type VenueRow = {
  id?: string | null
  name?: string | null
  address?: string | null
  access_note?: string | null
  facilities?: string | null
  is_home?: boolean | null
}

export type VenueHints = {
  /** coach_bookings.venue_id, when the booking carries one. */
  venueId?: string | null
  /** The academy's courts (coach_courts) — each knows which venue it is at. */
  courts?: { name?: string | null; venue_id?: string | null }[] | null
}

export function matchVenue<T extends VenueRow>(venues: T[] | null | undefined, court: string | null | undefined, hints?: VenueHints): T | null {
  const vs = (venues || []).filter(Boolean)
  if (!vs.length) return null
  if (hints?.venueId) {
    const exact = vs.find(v => v.id === hints.venueId)
    if (exact) return exact
  }
  const c = String(court || '').trim().toLowerCase()
  const named = c
    ? vs.find(v => { const n = String(v.name || '').toLowerCase(); return !!n && c.includes(n) })
    : undefined
  if (named) return named
  // "Court 2" on its own: use the court list, but only when every court of that
  // name is at the same venue. Two venues each with a "Court 2" is not an answer.
  if (c && hints?.courts?.length) {
    const at = new Set(hints.courts
      .filter(k => String(k?.name || '').trim().toLowerCase() === c && k?.venue_id)
      .map(k => String(k.venue_id)))
    if (at.size === 1) {
      const owner = vs.find(v => v.id === [...at][0])
      if (owner) return owner
    }
  }
  return vs.length === 1 ? vs[0] : null
}

/** A map link for an address, or null. Deliberately the universal Google Maps
    search URL rather than a native scheme: it opens in whatever the player
    already uses, on a phone or a laptop, without an app install. */
export function venueMapUrl(v: { name?: string | null; address?: string | null } | null | undefined): string | null {
  const q = String(v?.address || '').trim() || String(v?.name || '').trim()
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : null
}
