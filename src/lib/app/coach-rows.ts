// The iPhone app's view of the coach portal's tables (pure — no database).
//
// The website's portal reads and writes most of its data straight from the
// browser (coach-db.ts: dbList / dbInsert / dbUpdate / dbRemove), with row level
// security deciding what a coach may touch. The native app does the same work
// through ONE server route that applies the same rules, so nothing here gives
// the app more than the browser already has:
//
//   - only the tables below, and only the ones marked writable can be changed;
//   - every row is this academy's (coach_id), on top of row level security;
//   - an assistant coach's new rows carry their staff id, as the portal stamps;
//   - the same follow-ups run after a save (family told, calendars updated).

export const WRITABLE = new Set([
  'coach_players', 'coach_bookings', 'coach_sessions', 'coach_camps', 'coach_camp_attendees',
  'coach_payments', 'coach_packages', 'coach_development', 'coach_attendance', 'coach_player_skills',
  'coach_watch_sessions', 'coach_leads', 'coach_lead_events', 'coach_groups', 'coach_group_members',
  'coach_memberships', 'coach_player_notes', 'coach_adult_passes', 'coach_media',
  // The session planner (the app builds, edits and assigns plans like the website).
  'coach_session_plans',
])

/** Read-only here: their changes go through the server routes that own them. */
export const READABLE = new Set([
  ...WRITABLE,
  'coach_messages', 'coach_charges', 'coach_group_sessions', 'coach_group_replies',
  'coach_membership_bills', 'coach_welcome_links', 'coach_venues', 'coach_courts', 'coach_staff',
  'coach_adult_levels', 'coach_resources', 'coach_questionnaires',
])

/** Tables where an assistant coach's rows carry their staff id (coach-db.ts ASSIGNABLE). */
export const ASSIGNABLE = new Set([
  'coach_players', 'coach_bookings', 'coach_sessions', 'coach_session_plans',
  'coach_camps', 'coach_development', 'coach_attendance',
  'coach_leads', 'coach_lead_events', 'coach_groups', 'coach_group_members',
  'coach_memberships', 'coach_player_notes', 'coach_adult_passes',
])

const COLUMN = /^[a-z][a-z0-9_]{0,62}$/
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Empty strings become null; ids, academy and audit columns are never taken from the app. */
export function cleanRow(row: unknown): Record<string, unknown> | null {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return null
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(row as Record<string, unknown>)) {
    if (!COLUMN.test(k)) return null
    if (k === 'id' || k === 'coach_id' || k === 'created_at' || k === 'updated_at') continue
    out[k] = v === '' ? null : v
  }
  return out
}

/** What a new row is stamped with: always the academy, and the coach's staff id when they are an assistant. */
export function insertStamp(table: string, row: Record<string, unknown>, seat: { academyId: string; staffId: string | null; isHead: boolean }) {
  const stamp: Record<string, unknown> = { coach_id: seat.academyId }
  if (!seat.isHead && seat.staffId && ASSIGNABLE.has(table) && row.staff_id === undefined) stamp.staff_id = seat.staffId
  return stamp
}

export type Filter = { col: string; op: 'eq' | 'neq' | 'gte' | 'lte' | 'gt' | 'lt' | 'in' | 'is'; value: string | string[] | null }

/**
 * Filters from the query string, PostgREST style: ?booking_date=gte.2026-11-01&player_id=eq.<uuid>
 * Anything not in that shape is refused rather than ignored, so a typo can't
 * quietly turn "this week" into "every booking ever".
 */
export function parseFilters(params: URLSearchParams): { filters: Filter[]; order: { col: string; asc: boolean } | null; limit: number } | { error: string } {
  const filters: Filter[] = []
  let order: { col: string; asc: boolean } | null = null
  let limit = 2000
  for (const [k, raw] of params.entries()) {
    if (k === 'id') continue
    if (k === 'order') {
      const [col, dir] = raw.split('.')
      if (!COLUMN.test(col) || (dir && dir !== 'asc' && dir !== 'desc')) return { error: `Bad order: ${raw}` }
      order = { col, asc: dir === 'asc' }
      continue
    }
    if (k === 'limit') {
      const n = Number(raw)
      if (!Number.isInteger(n) || n < 1) return { error: `Bad limit: ${raw}` }
      limit = Math.min(n, 5000)
      continue
    }
    if (!COLUMN.test(k) || k === 'coach_id') return { error: `Unknown filter: ${k}` }
    const dot = raw.indexOf('.')
    const op = raw.slice(0, dot) as Filter['op']
    const value = raw.slice(dot + 1)
    if (dot < 1 || !['eq', 'neq', 'gte', 'lte', 'gt', 'lt', 'in', 'is'].includes(op)) return { error: `Bad filter: ${k}=${raw}` }
    if (op === 'in') {
      const list = value.replace(/^\(|\)$/g, '').split(',').map(s => s.trim()).filter(Boolean)
      if (!list.length || list.length > 500) return { error: `Bad list: ${k}` }
      filters.push({ col: k, op, value: list })
    } else if (op === 'is') {
      if (value !== 'null') return { error: `Only "is.null" is supported: ${k}` }
      filters.push({ col: k, op, value: null })
    } else {
      filters.push({ col: k, op, value })
    }
  }
  return { filters, order, limit }
}

/** The calendar event the portal pushes for a booking (coach-db.ts syncBookingCalendar). */
export function calendarEvent(row: Record<string, unknown>): { bookingId: string; title: string; start: string; end: string; location?: string; description?: string } | null {
  if (!row?.id || !row.booking_date || !row.start_time) return null
  const [h, m] = String(row.start_time).split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  const dur = Number(row.duration_min) || 60
  const total = h * 60 + m + dur
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    bookingId: String(row.id),
    title: String(row.title || row.player_name || 'Lesson'),
    start: `${row.booking_date}T${pad(h)}:${pad(m)}:00`,
    end: `${row.booking_date}T${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}:00`,
    location: row.court ? String(row.court) : undefined,
    description: row.notes ? String(row.notes) : undefined,
  }
}

/**
 * Columns that point at another of the academy's rows. Some have no foreign key
 * (coach_session_plans.booking_id) or no academy check in the database, so a
 * save from the app is refused when one names a row of another academy.
 */
export const REFERENCES: Record<string, { table: string; what: string }> = {
  player_id: { table: 'coach_players', what: 'That player isn’t on your roster.' },
  booking_id: { table: 'coach_bookings', what: 'That booking isn’t in your calendar.' },
  group_id: { table: 'coach_groups', what: 'That group isn’t one of yours.' },
  lead_id: { table: 'coach_leads', what: 'That lead isn’t one of yours.' },
  venue_id: { table: 'coach_venues', what: 'That venue isn’t one of yours.' },
  court_id: { table: 'coach_courts', what: 'That court isn’t one of yours.' },
}

/** The references a row sets (non-null), as [column, id]. Ids that aren't uuids are returned too, to be refused. */
export function referencesIn(row: Record<string, unknown>): [string, string][] {
  return Object.entries(row)
    .filter(([k, v]) => k in REFERENCES && v !== null && v !== undefined)
    .map(([k, v]) => [k, String(v)])
}

/** Plain words for a save the database refused. */
export function saveMessage(table: string, message: string): string {
  if (table === 'coach_session_plans' && /uniq_session_plans_booking|duplicate key/i.test(message)) return 'This booking already has a session plan.'
  if (/duplicate key/i.test(message)) return 'That has already been saved.'
  if (/row-level security|permission denied/i.test(message)) return 'You can’t change that.'
  return message
}
