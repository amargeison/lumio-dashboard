// The next session, assembled for the family's page.
//
// A booking confirmation lands in an inbox once and is then gone — scrolled
// past, filtered into Promotions, read on a phone in a car park and forgotten.
// The question it answers ("when is it, where is it, what are we doing") is
// asked again every week, and until now the app had no answer: the portal held
// lessons that had already happened and nothing at all about the next one.
//
// So this is the same four facts the email sends, kept somewhere they stay put:
// when, how long, where (with a map, because "Court 3" is not an address), and
// what the coach is planning to work on.
//
// Built on the server for both readers — the family's own portal and the coach's
// preview of it — so there is one rule for which booking is "next", which venue
// a court belongs to, and which plan belongs to the session. Three rules would
// be three chances for the preview to promise something the real page does not.

import { matchVenue, type VenueRow } from '@/lib/coach/booking-venue'

export type NextSessionPlan = {
  title?: string | null
  focus?: string | null
  /** The timed run-sheet, if the coach has built one. */
  runSheet?: { phase: string; mins?: number | null; detail?: string | null }[]
  drills?: string[]
  /** Always empty. The plan's note is what the coach asked Lumio Coach for when
      building the plan — theirs, not the family's — and is never sent. */
  notes?: string | null
}

export type StudentNextSession = {
  id: string
  date: string | null
  start_time: string | null
  duration_min?: number | null
  type?: string | null
  title?: string | null
  court?: string | null
  coach?: string | null
  status?: string | null
  venue?: { name?: string | null; address?: string | null; access_note?: string | null; facilities?: string | null } | null
  plan?: NextSessionPlan | null
}

type Db = {
  from: (t: string) => any
}

/** Today in the UK, as YYYY-MM-DD. The server runs in UTC; a 23:30 BST booking
    must not disappear from "upcoming" an hour early. */
const todayUK = () => {
  try { return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' }) }
  catch { return new Date().toISOString().slice(0, 10) }
}

/** Minutes since midnight in the UK, now. */
const ukNowHM = () => {
  try {
    const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date())
    const n = (t: string) => Number(p.find(x => x.type === t)?.value || 0)
    return (n('hour') % 24) * 60 + n('minute')
  } catch { const d = new Date(); return d.getUTCHours() * 60 + d.getUTCMinutes() }
}

const dayKey = (v: unknown) => String(v ?? '').slice(0, 10)
const timeKey = (v: unknown) => String(v ?? '').slice(0, 5)

const asList = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.map(x => String(x ?? '').trim()).filter(Boolean)
  if (typeof v === 'string') return v.split(/\r?\n|;/).map(s => s.trim()).filter(Boolean)
  return []
}

/** The plan the coach built for this session, stripped of anything that is not
    the player's business. `coach_note` is explicitly a line TO THE COACH — it is
    never returned here, and neither is anything not named below. */
function planFor(row: Record<string, unknown> | null | undefined): NextSessionPlan | null {
  if (!row) return null
  const str = (k: string) => { const s = String(row[k] ?? '').trim(); return s || undefined }
  const runSheet = Array.isArray(row.run_sheet)
    ? (row.run_sheet as Record<string, unknown>[])
      .map(p => ({
        phase: String(p?.phase ?? '').trim(),
        mins: typeof p?.mins === 'number' ? p.mins : null,
        detail: String(p?.detail ?? '').trim() || null,
      }))
      .filter(p => p.phase)
      .slice(0, 8)
    : []
  const drills = asList(row.drills).slice(0, 10)
  const plan: NextSessionPlan = {
    title: str('title') ?? null,
    focus: str('focus') ?? null,
    runSheet: runSheet.length ? runSheet : undefined,
    drills: drills.length ? drills : undefined,
    // Not the plan's `notes`: that box is the coach's brief to Lumio Coach
    // ("what do you want from this session?"), not something written for the
    // family. It was being sent along with the plan.
    notes: null,
  }
  // Nothing worth showing is still nothing. An empty "What we'll cover" heading
  // reads as a coach who has not bothered, which is worse than no heading.
  return (plan.focus || plan.runSheet || plan.drills || plan.notes || plan.title) ? plan : null
}

/**
 * The next booked session for one player, with its venue and plan.
 *
 * Scoped the same way as the rest of the bundle: the academy, then the player by
 * id, falling back to the name ONLY for rows written before bookings carried a
 * player_id (migration 146). A name is not an identity, so callers pass one
 * only when it belongs to exactly one player in the academy (nameIsUnique) and
 * an empty string otherwise. Returns null when there is nothing booked — the
 * section then does not render at all.
 */
export async function buildNextSession(
  db: Db, academyId: string, playerId: string | null, playerName: string,
): Promise<StudentNextSession | null> {
  const safe = async (q: any) => { try { const { data } = await q; return (data || []) as Record<string, unknown>[] } catch { return [] } }
  const today = todayUK()
  const cols = 'id, booking_date, start_time, duration_min, court, type, title, status, assigned_coach, player_id, player_name'

  const base = () => db.from('coach_bookings').select(cols).eq('coach_id', academyId).gte('booking_date', today)
  const [byId, legacy] = await Promise.all([
    playerId ? safe(base().eq('player_id', playerId).order('booking_date', { ascending: true }).limit(20)) : Promise.resolve([]),
    playerName ? safe(base().is('player_id', null).eq('player_name', playerName).order('booking_date', { ascending: true }).limit(20)) : Promise.resolve([]),
  ])

  const seen = new Set(byId.map(r => r.id))
  // Today's sessions the coach has already finished (the plan is marked done).
  const todays = [...byId, ...legacy].filter(b => dayKey(b.booking_date) === today).map(b => String(b.id))
  const done = new Set((todays.length
    ? await safe(db.from('coach_session_plans').select('booking_id').eq('coach_id', academyId).in('booking_id', todays).not('completed_at', 'is', null))
    : []).map(r => String(r.booking_id)))
  // A session that is over is not the NEXT one. It used to be judged on the
  // date alone, so a lesson finished at 11:00 was still "Booked in · today" on
  // the family's page that evening.
  const nowHM = ukNowHM()
  const over = (b: Record<string, unknown>) => {
    if (dayKey(b.booking_date) !== today) return false
    if (done.has(String(b.id))) return true
    const m = /^(\d{1,2}):(\d{2})/.exec(String(b.start_time ?? ''))
    if (!m) return false   // no time on it: still today's session
    const end = Number(m[1]) * 60 + Number(m[2]) + (typeof b.duration_min === 'number' && b.duration_min > 0 ? b.duration_min : 60)
    return end <= nowHM
  }
  const upcoming = [...byId, ...legacy.filter(r => !seen.has(r.id))]
    .filter(b => String(b.status ?? '').toLowerCase() !== 'cancelled')
    .filter(b => dayKey(b.booking_date) >= today && !over(b))
    .sort((a, b) => (dayKey(a.booking_date) + timeKey(a.start_time)).localeCompare(dayKey(b.booking_date) + timeKey(b.start_time)))

  const next = upcoming[0]
  if (!next) return null

  const [venues, courts, where, plans] = await Promise.all([
    safe(db.from('coach_venues').select('id, name, address, access_note, facilities, is_home').eq('coach_id', academyId)),
    safe(db.from('coach_courts').select('name, venue_id').eq('coach_id', academyId)),
    // The venue the booking itself names (migration 197). Read on its own so a
    // database without the column still shows the session.
    safe(db.from('coach_bookings').select('venue_id').eq('coach_id', academyId).eq('id', next.id).limit(1)),
    // The plan for THIS booking (migration 179). Name-and-date is the fallback
    // for plans written before plans carried a booking id — and it is why a
    // moved session used to show a family no plan at all, because the plan was
    // still dated the day the lesson was originally on.
    safe(db.from('coach_session_plans')
      .select('title, focus, drills, notes, run_sheet, session_date, group_name, booking_id')
      .eq('coach_id', academyId).eq('booking_id', next.id).limit(1)),
  ])

  // The same rule, with the same evidence, as the confirmation email.
  const venue = matchVenue(venues as VenueRow[], String(next.court ?? ''), {
    venueId: (where[0]?.venue_id as string) || null,
    courts: courts as { name?: string | null; venue_id?: string | null }[],
  })

  // Nothing tied to the booking itself — fall back to the old match.
  let plan = plans[0] || null
  if (!plan && playerName) {
    const legacyPlan = await safe(db.from('coach_session_plans')
      .select('title, focus, drills, notes, run_sheet, session_date, group_name, booking_id')
      .eq('coach_id', academyId).is('booking_id', null)
      .eq('session_date', dayKey(next.booking_date))
      // The name exactly (any case) — % and _ in a name are not wildcards.
      .ilike('group_name', playerName.replace(/[\\%_]/g, m => `\\${m}`)).limit(1))
    plan = legacyPlan[0] || null
  }

  return {
    id: String(next.id),
    date: next.booking_date ? dayKey(next.booking_date) : null,
    start_time: next.start_time ? timeKey(next.start_time) : null,
    duration_min: typeof next.duration_min === 'number' ? next.duration_min : null,
    type: (next.type as string) ?? null,
    title: (next.title as string) ?? null,
    court: (next.court as string) ?? null,
    coach: (next.assigned_coach as string) ?? null,
    status: (next.status as string) ?? null,
    venue: venue ? { name: venue.name, address: venue.address, access_note: venue.access_note, facilities: venue.facilities } : null,
    plan: planFor(plan),
  }
}
