// Which venue a booking is at.
//
// A booking records a COURT ("Court 3", "Indoor 1"), not a venue — courts carry
// the venue_id, bookings never did. So the venue has to be inferred, and the
// rule for inferring it has to be the same everywhere: the confirmation email
// and the family's page cannot disagree about where to turn up.
//
// The rule, in order: a venue whose name appears in the court's name, else the
// academy's home venue, else the only one there is. It is a best guess, and it
// is the same best guess the email has always made.

export type VenueRow = {
  name?: string | null
  address?: string | null
  access_note?: string | null
  facilities?: string | null
  is_home?: boolean | null
}

export function matchVenue<T extends VenueRow>(venues: T[] | null | undefined, court: string | null | undefined): T | null {
  const vs = (venues || []).filter(Boolean)
  if (!vs.length) return null
  const c = String(court || '').toLowerCase()
  const named = c
    ? vs.find(v => { const n = String(v.name || '').toLowerCase(); return !!n && c.includes(n) })
    : undefined
  return named || vs.find(v => v.is_home) || vs[0] || null
}

/** A map link for an address, or null. Deliberately the universal Google Maps
    search URL rather than a native scheme: it opens in whatever the player
    already uses, on a phone or a laptop, without an app install. */
export function venueMapUrl(v: { name?: string | null; address?: string | null } | null | undefined): string | null {
  const q = String(v?.address || '').trim() || String(v?.name || '').trim()
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : null
}
