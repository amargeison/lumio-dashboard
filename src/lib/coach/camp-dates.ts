// Camps, as days on a calendar.
//
// A camp is the biggest thing in a coach's year and it lived in exactly one
// place: the Camps page. The calendar and the session planner — the two screens
// a coach actually opens to answer "what am I doing that week" — showed a clear
// diary for a week the coach was in Spain. Every double-booking that follows
// from that is Lumio's fault.
//
// A camp is not a booking and must not be stored as one: it runs for days, has
// no start time, has attendees and a balance and an itinerary. So it is not
// written into coach_bookings — it is READ alongside them and drawn as an
// all-day band, which is what a multi-day event is.

export type CampRow = {
  id: string
  name?: string | null
  start_date?: string | null
  end_date?: string | null
  location?: string | null
  region?: string | null
  confirmed?: boolean | null
}

export type CampSpan = {
  id: string
  name: string
  /** YYYY-MM-DD, inclusive. */
  start: string
  end: string
  where: string
  /** false = pencilled in. A camp with a date but no confirmation is still
      something the coach needs to see in the diary — greyed, not hidden. */
  confirmed: boolean
  /** Total days, inclusive of both ends. */
  days: number
}

const dayKey = (v?: string | null) => String(v ?? '').slice(0, 10)
const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v)

/** Rows → spans, dropping anything with no usable start date. A camp with no
    end date is a single day, which is what a one-day camp is. */
export function campSpans(rows: CampRow[]): CampSpan[] {
  return rows
    .map(c => {
      const start = dayKey(c.start_date)
      if (!isDate(start)) return null
      const rawEnd = dayKey(c.end_date)
      const end = isDate(rawEnd) && rawEnd >= start ? rawEnd : start
      const ms = new Date(`${end}T00:00:00`).getTime() - new Date(`${start}T00:00:00`).getTime()
      return {
        id: c.id,
        name: (c.name || 'Camp').trim() || 'Camp',
        start,
        end,
        where: [c.location, c.region].filter(Boolean).join(', '),
        confirmed: c.confirmed !== false,
        days: Math.max(1, Math.round(ms / 86400000) + 1),
      } satisfies CampSpan
    })
    .filter(Boolean)
    .sort((a, b) => a!.start.localeCompare(b!.start)) as CampSpan[]
}

export type CampDay = CampSpan & {
  /** 1-based — "Day 3 of 5". A coach looking at Wednesday wants to know which
      day of the camp Wednesday is, not just that a camp exists that week. */
  dayIndex: number
  first: boolean
  last: boolean
}

/** The camps covering a single date. */
export function campsOn(spans: CampSpan[], iso: string): CampDay[] {
  const d = dayKey(iso)
  return spans.filter(c => d >= c.start && d <= c.end).map(c => {
    const ms = new Date(`${d}T00:00:00`).getTime() - new Date(`${c.start}T00:00:00`).getTime()
    return { ...c, dayIndex: Math.round(ms / 86400000) + 1, first: d === c.start, last: d === c.end }
  })
}

/** "Day 3 of 5" — or just the camp name when it only runs a day. */
export const campDayLabel = (c: CampDay) => c.days > 1 ? `Day ${c.dayIndex} of ${c.days}` : 'All day'

/** Camps overlapping a date range (inclusive start, exclusive end). */
export const campsBetween = (spans: CampSpan[], fromIso: string, toIso: string) =>
  spans.filter(c => c.start < toIso && c.end >= fromIso)

/** The one colour camps are drawn in, everywhere they appear. Deliberately not
    one of the booking type colours — a camp is a different kind of thing, and a
    coach should be able to spot one without reading the label. */
export const CAMP_COLOUR = '#7c5cbf'
