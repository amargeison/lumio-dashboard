// Lesson packs: which lessons come off which pack, and the credit rules.
//
// A pack is a line on the Payments page with a number of sessions ("10-lesson
// pack", 10). Lessons come off it as they happen — no ticking by hand. The
// rules Pete asked for, in the words his clients agree to:
//
//   • a lesson that happened uses one lesson from the pack;
//   • a LATE cancellation (inside the free window) uses one, instead of a charge,
//     when the policy charges for late cancellations;
//   • a MISSED lesson (marked absent) uses one, instead of a charge, when the
//     policy charges for missed lessons;
//   • a lesson the COACH calls off (rain, illness) never uses one — so it is
//     back on the pack automatically;
//   • a cancellation with notice never uses one.
//
// Each lesson is given to ONE pack: the oldest that had been sold by the day
// of the lesson, had not passed its renewal date, and still has room — of the
// same kind where the player has one (private lessons off a private pack,
// squad sessions off a term pass).
//
// The same rules decide whether a lesson is charged at all: one that comes off
// a pack is never charged to a card. So this file is used by the Payments page,
// a booking's payment strip, the charge runner and the charge route alike.
//
// Pure: no browser, no database.

import { isLateCancel, ukLocalToMs, type CancelPolicy } from './cancel-policy'
import { ukDate } from './uk-date'

export type PackLine = {
  id: string; player_id?: string | null; player_name?: string | null; item?: string | null
  sessions_total?: number | null; renews_date?: string | null; created_at?: string | null
}
export type BookingLite = {
  id: string; player_id?: string | null; player_name?: string | null; booking_date?: string | null; start_time?: string | null
  type?: string | null; status?: string | null; created_at?: string | null
  cancelled_at?: string | null; cancelled_by?: string | null
}
export type AttendanceLite = { player_id?: string | null; session_date?: string | null; present?: boolean | null }
export type WriteUp = { id: string; player_id?: string | null; player_name?: string | null; session_date?: string | null; focus?: string | null; rating?: number | null; created_at?: string | null }

/** Why a lesson counts. 'planned' is a booked lesson still to come (for deciding whether to charge it). */
export type UseReason = 'taken' | 'late' | 'missed' | 'planned'
export type Use = {
  id: string; bookingId: string | null; player_id: string | null; player_name?: string | null
  session_date: string; kind: 'private' | 'group'; reason: UseReason
  focus?: string | null; rating?: number | null; written?: boolean; created_at?: string | null
}

const dk = (d?: string | null) => String(d ?? '').slice(0, 10)
const kindOfType = (t?: string | null): 'private' | 'group' => (/group|squad|cardio|match/i.test(t || '') ? 'group' : 'private')
const kindOfPack = (p: PackLine): 'private' | 'group' => (/group|squad|term|cardio|club night/i.test(p.item || '') ? 'group' : 'private')
/** The day a pack was sold: the day the line was added. */
export const soldOn = (p: PackLine) => (p.created_at ? ukDate(p.created_at) : '')

export const REASON_WORDS: Record<UseReason, string> = {
  taken: 'Lesson', late: 'Late cancellation · credit used', missed: 'Missed · credit used', planned: 'Booked',
}

/**
 * Every lesson that uses (or, with `planned`, will use) a lesson from a pack.
 * `now` decides what has happened; times are UK.
 */
export function lessonUses(o: {
  bookings: BookingLite[]; attendance?: AttendanceLite[]; writeUps?: WriteUp[]
  policy: CancelPolicy; now?: number; planned?: boolean
}): Use[] {
  const now = o.now ?? Date.now()
  const today = ukDate(new Date(now))
  const key = (pid: unknown, d: unknown) => `${pid}|${dk(d as string)}`
  const absent = new Set((o.attendance || []).filter(a => a.present === false && a.player_id).map(a => key(a.player_id, a.session_date)))
  const writeUps = new Map((o.writeUps || []).filter(w => w.player_id).map(w => [key(w.player_id, w.session_date), w]))
  const out: Use[] = [], seen = new Set<string>()
  for (const b of o.bookings) {
    const d = dk(b.booking_date)
    if (!b.player_id || !d || b.status === 'pending' || b.type === 'Block') continue
    const k = key(b.player_id, d)
    const base = { id: b.id, bookingId: b.id, player_id: b.player_id, player_name: b.player_name, session_date: d, kind: kindOfType(b.type), created_at: b.created_at }
    if (b.status === 'cancelled') {
      // Late, and the policy charges for it: a credit is used instead.
      if (o.policy.lateChargePct > 0 && isLateCancel(b, o.policy)) out.push({ ...base, reason: 'late', focus: REASON_WORDS.late })
      continue
    }
    const happened = ukLocalToMs(d, (b.start_time || '00:00').slice(0, 5)) <= now
    if (!happened) { if (o.planned) out.push({ ...base, reason: 'planned', focus: b.type || 'Lesson' }); continue }
    if (seen.has(k)) continue
    seen.add(k)
    if (absent.has(k)) {
      if (o.policy.noShowPct > 0) out.push({ ...base, reason: 'missed', focus: REASON_WORDS.missed })
      continue
    }
    const w = writeUps.get(k)
    out.push({ ...base, reason: 'taken', focus: w?.focus || b.type || 'Lesson', rating: w?.rating ?? null, written: !!w })
  }
  // A write-up with no booking behind it still counts.
  for (const w of o.writeUps || []) {
    const k = w.player_id ? key(w.player_id, w.session_date) : ''
    if (k && seen.has(k)) continue
    if (k) seen.add(k)
    out.push({ id: w.id, bookingId: null, player_id: w.player_id || null, player_name: w.player_name, session_date: dk(w.session_date) || (w.created_at ? ukDate(w.created_at) : ''), kind: 'private', reason: 'taken', focus: w.focus, rating: w.rating ?? null, written: true, created_at: w.created_at })
  }
  // A squad session is booked for the group, not for each child, so the
  // player's own record of it is their attendance mark.
  for (const a of o.attendance || []) {
    const d = dk(a.session_date)
    if (!a.player_id || a.present === false || !d || d > today) continue
    const k = key(a.player_id, d)
    if (seen.has(k)) continue
    seen.add(k)
    const w = writeUps.get(k)
    out.push({ id: `att:${k}`, bookingId: null, player_id: a.player_id, session_date: d, kind: 'group', reason: 'taken', focus: w?.focus || 'Group session', rating: w?.rating ?? null, written: !!w })
  }
  return out
}

/** Give each lesson to one pack. Lessons in date order; a lesson no pack covers is left over. */
export function allocate<P extends PackLine, U extends Use>(packs: P[], uses: U[]): { byPack: Map<string, U[]>; loose: U[] } {
  const byPack = new Map<string, U[]>()
  const loose: U[] = []
  const ordered = packs.filter(p => (p.sessions_total || 0) > 0)
    .sort((a, b) => String(a.created_at || '').localeCompare(String(b.created_at || '')))
  for (const p of ordered) byPack.set(p.id, [])
  // Same day: what happened (or was cancelled late) before what is still to come.
  const rank = (u: Use) => (u.reason === 'planned' ? 1 : 0)
  for (const u of [...uses].sort((a, b) => a.session_date.localeCompare(b.session_date) || rank(a) - rank(b))) {
    const day = u.session_date
    const fits = (p: P) => {
      const got = byPack.get(p.id) as U[]
      return !!day && soldOn(p) <= day && (!p.renews_date || day <= dk(p.renews_date)) && got.length < (p.sessions_total || 0)
    }
    const sameKind = ordered.filter(p => kindOfPack(p) === u.kind)
    const pack = sameKind.length ? sameKind.find(fits) : ordered.find(fits)
    if (pack) (byPack.get(pack.id) as U[]).push(u); else loose.push(u)
  }
  return { byPack, loose }
}

/** Which booking comes off which pack — for one player's packs and lessons. */
export function coverage<P extends PackLine>(packs: P[], uses: Use[]): Map<string, P> {
  const { byPack } = allocate(packs, uses)
  const out = new Map<string, P>()
  for (const p of packs) for (const u of byPack.get(p.id) || []) if (u.bookingId) out.set(u.bookingId, p)
  return out
}

/** Coverage across many players at once: packs and lessons matched by player id. */
export function coverageByPlayer<P extends PackLine>(packs: P[], uses: Use[]): Map<string, P> {
  const out = new Map<string, P>()
  const ids = new Set(packs.map(p => p.player_id).filter(Boolean) as string[])
  for (const id of ids) {
    const mine = coverage(packs.filter(p => p.player_id === id), uses.filter(u => u.player_id === id))
    for (const [k, v] of mine) out.set(k, v)
  }
  return out
}

/** "10-lesson pack · 4 of 10 used" for the pack a lesson comes off. */
export function packWords(p: PackLine, uses: Use[], packs: PackLine[]): string {
  const { byPack } = allocate(packs.filter(x => x.player_id === p.player_id), uses.filter(u => u.player_id === p.player_id && u.reason !== 'planned'))
  const used = (byPack.get(p.id) || []).length
  return `${p.item || 'Lesson pack'} · ${Math.min(used, p.sessions_total || 0)} of ${p.sessions_total} used`
}
