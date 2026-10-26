// Lesson packs on the server: which of these players' lessons come off a pack.
//
// The same rules as the Payments page ('./packs'), read from the database, for
// the places that take money without the page open: the charge runner, the
// charge route and a rain-off. A lesson that comes off a pack is never charged
// to a card.

import type { SupabaseClient } from '@supabase/supabase-js'
import { lessonUses, coverageByPlayer, type PackLine, type Use } from './packs'
import type { CancelPolicy } from './cancel-policy'

/** Booking id → the pack it comes off, for the given players. Planned lessons included. */
export async function packCover(db: SupabaseClient, academyId: string, playerIds: string[], policy: CancelPolicy): Promise<{ cover: Map<string, PackLine>; packs: PackLine[]; uses: Use[] }> {
  const ids = Array.from(new Set(playerIds.filter(Boolean)))
  const empty = { cover: new Map<string, PackLine>(), packs: [] as PackLine[], uses: [] as Use[] }
  if (!ids.length) return empty
  const { data: packs } = await db.from('coach_payments').select('id, player_id, player_name, item, sessions_total, renews_date, created_at')
    .eq('coach_id', academyId).in('player_id', ids).gt('sessions_total', 0)
  if (!packs?.length) return empty
  // Lessons from the day the oldest pack was sold.
  const since = packs.map(p => String(p.created_at || '').slice(0, 10)).filter(Boolean).sort()[0] || '2000-01-01'
  const withPacks = Array.from(new Set(packs.map(p => p.player_id as string)))
  const [{ data: bookings }, { data: attendance }, { data: writeUps }] = await Promise.all([
    db.from('coach_bookings').select('id, player_id, player_name, booking_date, start_time, type, status, created_at, cancelled_at, cancelled_by')
      .eq('coach_id', academyId).in('player_id', withPacks).gte('booking_date', since).limit(5000),
    db.from('coach_attendance').select('player_id, session_date, present').eq('coach_id', academyId).in('player_id', withPacks).gte('session_date', since).limit(5000),
    db.from('coach_sessions').select('id, player_id, player_name, session_date, focus, rating, created_at').eq('coach_id', academyId).in('player_id', withPacks).gte('session_date', since).limit(5000),
  ])
  const uses = lessonUses({ bookings: bookings || [], attendance: attendance || [], writeUps: writeUps || [], policy, planned: true })
  return { cover: coverageByPlayer(packs as PackLine[], uses), packs: packs as PackLine[], uses }
}
