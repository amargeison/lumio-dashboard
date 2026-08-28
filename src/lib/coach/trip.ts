// ─────────────────────────────────────────────────────────────────────────────
// The trip hub — everything a player needs for the week, on one link.
//
// A camp already knows what happens on court. This is the other half: where you
// are staying, how you get around, where the coaches actually eat, and who to
// ring when your flight is late. Today a coach sends that as a PDF in February
// and answers the same six questions by message for the next four months.
//
// The sections mirror how coaches already organise this themselves — the PG
// Tennis Discord is split into transport, eating and tennis, and that is not a
// coincidence; it is what people ask about. Tennis is the camp itinerary we
// already hold, so this file covers the other two plus the practicalities.
//
// This record is also the source the player app reads. Everything here is
// shared with everyone on the trip, so everything on it is true for everyone on
// it. Per-player content — their targets, their balance — is attached in the app
// where there is an identity to attach it to, never here.
//
// The shape is deliberately flat and optional. A coach fills in what they have,
// and the page renders only the sections that exist: an empty "Eating" heading
// reads as information withheld, which is worse than no heading at all.
// ─────────────────────────────────────────────────────────────────────────────

export type TripContact = { name: string; role?: string; phone?: string; note?: string }
export type TripSection = { title: string; body?: string; items?: string[] }

/**
 * A place or a business the coach recommends — a restaurant, a taxi firm, a
 * supermarket, a bike hire shop.
 *
 * `note` is the part that matters and the part only the coach can write. Anyone
 * can find a restaurant; "the one we book for the last night, ask for the
 * terrace" is worth the trip.
 */
export type TripPlace = {
  name: string
  kind?: string      // "Seafood", "Taxi firm", "Supermarket"
  address?: string
  phone?: string
  url?: string
  note?: string
}

export type Trip = {
  /** The opening paragraph. What this week is, in the coach's voice. */
  intro?: string

  stay?: {
    name?: string
    address?: string
    url?: string       // the hotel's own site or the booking page
    checkIn?: string
    rooms?: string
    meals?: string
    wifi?: string
    notes?: string
  }

  venue?: {
    name?: string
    address?: string
    url?: string
    courts?: string
    facilities?: string
    notes?: string
  }

  /** Getting there and home again. Flights, airport, transfers. */
  travel?: {
    airport?: string
    flights?: string
    transfers?: string
    arrival?: string
    departure?: string
    notes?: string
  }

  /** Getting around once you are there. Taxi firms, car hire, the local bus. */
  transport?: TripPlace[]

  /** Where the coaches actually eat. */
  eating?: TripPlace[]

  /** Who to ring, and for what. The most-used part of a page like this. */
  contacts?: TripContact[]

  /** Kit and paperwork. Separate from the camp's coaching equipment list. */
  bring?: string[]

  practical?: {
    currency?: string
    weather?: string
    timeDifference?: string
    plugs?: string
    health?: string
    notes?: string
  }

  /** Anything the coach adds that we did not think of. */
  sections?: TripSection[]
}

const str = (v?: string) => { const x = String(v ?? '').trim(); return x || undefined }
const filled = (o?: Record<string, unknown> | null) =>
  !!o && Object.values(o).some(v => typeof v === 'string' && v.trim())

/** Is there actually anything in this trip worth publishing? */
export function tripHasContent(t?: Trip | null): boolean {
  if (!t) return false
  return !!(
    str(t.intro) ||
    filled(t.stay) || filled(t.venue) || filled(t.travel) || filled(t.practical) ||
    (t.contacts || []).some(c => str(c?.name)) ||
    (t.transport || []).some(p => str(p?.name)) ||
    (t.eating || []).some(p => str(p?.name)) ||
    (t.bring || []).some(x => str(x)) ||
    (t.sections || []).some(s => str(s?.title))
  )
}

/** Strip empties so the page never renders a heading with nothing under it. */
export function cleanTrip(t: Trip): Trip {
  const obj = <T extends Record<string, string | undefined>>(o?: T): T | undefined => {
    if (!o) return undefined
    const out = Object.fromEntries(
      Object.entries(o).map(([k, v]) => [k, str(v as string)]).filter(([, v]) => v),
    ) as T
    return Object.keys(out).length ? out : undefined
  }
  const list = (a?: string[]) => {
    const out = (a || []).map(x => String(x ?? '').trim()).filter(Boolean)
    return out.length ? out : undefined
  }
  const places = (a?: TripPlace[]) => {
    const out = (a || [])
      .map(p => ({
        name: String(p?.name ?? '').trim(),
        kind: str(p?.kind), address: str(p?.address),
        phone: str(p?.phone), url: str(p?.url), note: str(p?.note),
      }))
      .filter(p => p.name)
    return out.length ? out : undefined
  }

  const contacts = (t.contacts || [])
    .map(c => ({ name: String(c?.name ?? '').trim(), role: str(c?.role), phone: str(c?.phone), note: str(c?.note) }))
    .filter(c => c.name)

  const sections = (t.sections || [])
    .map(x => ({ title: String(x?.title ?? '').trim(), body: str(x?.body), items: list(x?.items) }))
    .filter(x => x.title && (x.body || x.items?.length))

  return {
    intro: str(t.intro),
    stay: obj(t.stay),
    venue: obj(t.venue),
    travel: obj(t.travel),
    practical: obj(t.practical),
    transport: places(t.transport),
    eating: places(t.eating),
    contacts: contacts.length ? contacts : undefined,
    bring: list(t.bring),
    sections: sections.length ? sections : undefined,
  }
}

/**
 * An embeddable Google map for a free-text address.
 *
 * The `output=embed` form needs no API key, which matters because a coach
 * setting up a camp should not have to provision one. The page always shows an
 * "Open in Maps" link alongside, so if Google ever stops honouring it the
 * address is still usable rather than the section silently becoming a grey box.
 */
export function mapEmbedUrl(address: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`
}

export function mapLinkUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}

/** Normalise a URL a coach pasted without a scheme, so the link actually works. */
export function safeUrl(raw?: string): string | null {
  const v = String(raw ?? '').trim()
  if (!v) return null
  const withScheme = /^https?:\/\//i.test(v) ? v : `https://${v}`
  try {
    const u = new URL(withScheme)
    // Only http(s). A pasted `javascript:` would otherwise become a live link on
    // a page we hand to families.
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.toString() : null
  } catch { return null }
}

/**
 * The share link for a camp's trip hub.
 *
 * Readable enough that a coach recognises it in his own message history, with
 * enough randomness that it is not guessable from the camp name — the page holds
 * a hotel address and a coach's mobile number, so it should not be findable by
 * anyone who happens to know where the camp is.
 */
export function makeTripSlug(campName: string): string {
  const base = String(campName || 'trip')
    .toLowerCase().normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'trip'
  const rand = Math.random().toString(36).slice(2, 6) + Math.random().toString(36).slice(2, 6)
  return `${base}-${rand}`
}
