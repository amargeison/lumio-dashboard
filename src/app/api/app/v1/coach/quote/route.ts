import { NextRequest, NextResponse } from 'next/server'
import { coachContext, noStore } from '@/lib/app/coach-context'
import { priceFor, courtCostFor, type PriceRule } from '@/lib/coach/pricing'
import { isUuid } from '@/lib/coach/membership'

export const runtime = 'nodejs'

// What a booking will cost, worked out the way the website's booking form does
// (priceFor / courtCostFor), so the app shows the same "£45 · court £12 · you
// make £33" line without holding the price list itself.
//
//   POST { type, venueId?, mins, people?, playerId?, pricePennies? }
//     → { total, each, people, why, court }   (pennies)
//     → { total: null }  for an invited coach: the price list is the head coach's.

type Row = Record<string, unknown>

export async function POST(req: NextRequest) {
  const c = await coachContext()
  if (!c.ok) return c.res
  const { db, service, seat } = c.ctx
  if (!seat.isHead) return NextResponse.json({ total: null }, noStore)

  const b = (await req.json().catch(() => ({}))) as { type?: string; venueId?: string | null; mins?: number; people?: number | null; playerId?: string | null; pricePennies?: number | null }
  const type = String(b.type || 'Private').slice(0, 60)
  if (type === 'Block') return NextResponse.json({ total: null }, noStore)
  const mins = Math.max(5, Math.min(600, Math.round(Number(b.mins) || 60)))
  const venueId = isUuid(b.venueId) ? b.venueId! : null

  const [settingsRow, venue, player] = await Promise.all([
    service.from('coach_settings').select('data').eq('coach_id', seat.academyId).maybeSingle(),
    venueId ? db.from('coach_venues').select('id, name, court_cost_pennies, court_billing').eq('id', venueId).eq('coach_id', seat.academyId).maybeSingle() : Promise.resolve({ data: null }),
    isUuid(b.playerId) ? db.from('coach_players').select('rate_pennies, rate_reason').eq('id', b.playerId!).eq('coach_id', seat.academyId).maybeSingle() : Promise.resolve({ data: null }),
  ])
  const s = ((settingsRow.data as { data?: Row } | null)?.data || {}) as Row
  const booking = {
    type, venue_id: venueId, duration_min: mins,
    headcount: b.people == null ? null : Math.max(1, Math.min(50, Math.round(Number(b.people)))),
    price_pennies: b.pricePennies == null ? null : Math.max(0, Math.round(Number(b.pricePennies))),
  }
  const v = venue.data as Row | null
  const price = priceFor(booking, {
    rules: (Array.isArray(s.priceList) ? s.priceList : []) as PriceRule[],
    client: player.data as { rate_pennies?: number | null; rate_reason?: string | null } | null,
    defaultHourly: typeof s.privateRate === 'number' ? s.privateRate : Number(s.privateRate) || null,
    venueName: id => (v && v.id === id ? String(v.name || '') : undefined),
  })
  const court = courtCostFor({ duration_min: mins }, v as { court_cost_pennies?: number | null; court_billing?: string | null } | null)
  return NextResponse.json({ total: price.total, each: price.each, people: price.people, why: price.why, court }, noStore)
}
