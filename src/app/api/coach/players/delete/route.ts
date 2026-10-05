import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { serviceClient } from '@/lib/coach/oauth'
import { isUuid } from '@/lib/coach/membership'
import { unsyncBooking } from '@/lib/coach/calendar'

export const runtime = 'nodejs'

// Deleting a player — and saying first what goes with them.
//
// The roster's Delete was a bare "Delete Sam?" followed by removing the one
// row. The coach was never told the player had lessons booked, money owed, a
// camp place or a parent with a login; the parent's login was left "active"
// and pointing at nothing; and the photo stayed in storage.
//
//   GET  ?id=…   what this player has, so the question can be asked honestly
//   POST { id }  delete the player
//
// The Consent tab tells a coach to use Delete for a right-to-erasure request,
// so Delete has to erase. The database does it in one step (lumio_erase_player,
// migration 200), so it either all happens or none of it does:
//
//   ERASED  the profile and photo, skills, attendance, effort sessions, book
//           recommendations, every parent/player login, bookings, lesson
//           summaries, session plans written for them, development notes,
//           messages with the family, recordings and camp places with no money
//           against them.
//   KEPT    payments, card charges and camp places that have money against
//           them — a business must keep its financial records — but with the
//           name replaced by "Removed player" and the notes, parent details and
//           medical details cleared.
//
// The GET says all of that in numbers first, so the coach is asked honestly.
//
// Who: anyone who can see the player through row level security — the head
// coach, or the assistant the player is assigned to — exactly who could delete
// them before.

type Counts = { familyLogins: number; upcomingBookings: number; lessons: number; unpaidPayments: number; unpaidTotal: number; paidPayments: number; campPlaces: number; messages: number; recordings: number; plans: number }

async function resolve(id: string | null | undefined) {
  if (!isUuid(id)) return { error: NextResponse.json({ error: 'Player not found' }, { status: 404 }) }
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Not signed in' }, { status: 401 }) }
  // Read with the caller's own session, so the database decides whether this
  // player is theirs. The row also says which academy it belongs to.
  const { data: player } = await supabase.from('coach_players')
    .select('id, coach_id, name, avatar_url').eq('id', id).maybeSingle()
  if (!player) return { error: NextResponse.json({ error: 'Player not found' }, { status: 404 }) }
  return { userId: user.id, player: player as { id: string; coach_id: string; name: string; avatar_url: string | null } }
}

async function impact(academyId: string, playerId: string): Promise<Counts> {
  const db = serviceClient()
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' })
  const n = async (q: PromiseLike<{ count: number | null }>) => { try { return (await q).count ?? 0 } catch { return 0 } }
  const head = { count: 'exact' as const, head: true }
  const [familyLogins, upcomingBookings, lessons, paidPayments, campPlaces, messages, recordings] = await Promise.all([
    n(db.from('coach_members').select('id', head).eq('academy_id', academyId).eq('scope_player_id', playerId).neq('status', 'revoked')),
    n(db.from('coach_bookings').select('id', head).eq('coach_id', academyId).eq('player_id', playerId).gte('booking_date', today).neq('status', 'cancelled')),
    n(db.from('coach_sessions').select('id', head).eq('coach_id', academyId).eq('player_id', playerId)),
    n(db.from('coach_payments').select('id', head).eq('coach_id', academyId).eq('player_id', playerId).eq('paid', true)),
    n(db.from('coach_camp_attendees').select('id', head).eq('coach_id', academyId).eq('player_id', playerId).neq('status', 'cancelled')),
    n(db.from('coach_messages').select('id', head).eq('coach_id', academyId).eq('player_id', playerId)),
    n(db.from('coach_media').select('id', head).eq('coach_id', academyId).eq('player_id', playerId)),
  ])
  // What is owed, as a sum as well as a count: "2 unpaid invoices (£80)" is
  // the line that makes a coach stop and collect it first.
  let unpaidPayments = 0, unpaidTotal = 0
  try {
    const { data } = await db.from('coach_payments').select('amount')
      .eq('coach_id', academyId).eq('player_id', playerId).or('paid.is.null,paid.eq.false')
    unpaidPayments = (data || []).length
    unpaidTotal = (data || []).reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
  } catch { /* counted as none */ }
  // Session plans written for them: a plan for one of their bookings, or a
  // stand-alone plan under their name when nobody else has that name. A plan
  // carries the player's name and the coach's note about them, so it is erased
  // with them (migration 207) and has to be in the question. Counted by the
  // same rule the database uses.
  let plans = 0
  try {
    const [{ data: me }, { data: booked }, { data: all }] = await Promise.all([
      db.from('coach_players').select('name').eq('id', playerId).maybeSingle(),
      db.from('coach_bookings').select('id').eq('coach_id', academyId).eq('player_id', playerId),
      db.from('coach_session_plans').select('booking_id, group_name').eq('coach_id', academyId),
    ])
    const key = String(me?.name || '').trim().toLowerCase()
    const { data: same } = await db.from('coach_players').select('id, name').eq('coach_id', academyId).neq('id', playerId)
    const only = !!key && !(same || []).some(p => String(p.name || '').trim().toLowerCase() === key)
    const ids = new Set((booked || []).map(b => b.id as string))
    plans = (all || []).filter(p => (p.booking_id && ids.has(p.booking_id as string)) || (only && String(p.group_name || '').trim().toLowerCase() === key)).length
  } catch { /* counted as none */ }
  return { familyLogins, upcomingBookings, lessons, unpaidPayments, unpaidTotal, paidPayments, campPlaces, messages, recordings, plans }
}

export async function GET(req: NextRequest) {
  const r = await resolve(req.nextUrl.searchParams.get('id'))
  if ('error' in r) return r.error
  return NextResponse.json({ id: r.player.id, name: r.player.name, has: await impact(r.player.coach_id, r.player.id) })
}

export async function POST(req: NextRequest) {
  const { id } = (await req.json().catch(() => ({}))) as { id?: string }
  const r = await resolve(id)
  if ('error' in r) return r.error
  const { player } = r
  const db = serviceClient()
  const before = await impact(player.coach_id, player.id)

  const { data, error } = await db.rpc('lumio_erase_player', { p_academy: player.coach_id, p_player: player.id })
  if (error) {
    console.error('[players/delete]', error.code, error.message)
    return NextResponse.json({ error: 'The player could not be deleted, so nothing was changed. Please try again.' }, { status: 500 })
  }
  const out = (data || {}) as { erased?: Record<string, number>; kept?: Record<string, number>; bookingIds?: string[]; mediaPaths?: string[] }

  // Everything below is tidying outside the database. The player is gone
  // either way, so a failure here is logged, not shown.

  // Their bookings, out of any connected calendar.
  for (const bookingId of out.bookingIds || []) {
    for (const owner of Array.from(new Set([player.coach_id, r.userId]))) {
      try { await unsyncBooking(owner, bookingId) } catch (e) { console.error('[players/delete] calendar', e) }
    }
  }

  // The recording files. A stored path is something a signed-in coach could
  // have typed, so it is only ever followed inside this academy's own folder
  // (or the caller's own, where an assistant's uploads are filed).
  const inFolder = (path: string) => !path.includes('..') && path.startsWith(`${player.coach_id}/`)
  const media = (out.mediaPaths || []).filter(path => inFolder(path) || (!path.includes('..') && path.startsWith(`${r.userId}/`)))
  if (media.length) {
    const { error: rmErr } = await db.storage.from('coach-media').remove(media)
    if (rmErr) console.error('[players/delete] recordings', rmErr.message)
  }

  // The photo. The stored value may carry a "?v=" stamp, which is not part of
  // the file's path.
  const stored = String(player.avatar_url || '')
  const path = stored.match(/\/avatars\/(.+?)(?:\?|$)/)?.[1]
    || (stored && !/^(https?:|data:|\/)/.test(stored) ? stored.split('?')[0] : null)
  if (path && inFolder(path)) {
    const { error: rmErr } = await db.storage.from('avatars').remove([path])
    if (rmErr) console.error('[players/delete] photo', rmErr.message)
  }

  return NextResponse.json({ ok: true, removed: { familyLogins: before.familyLogins, ...(out.erased || {}) }, kept: out.kept || {} })
}
