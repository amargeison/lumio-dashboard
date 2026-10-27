import { NextRequest, NextResponse } from 'next/server'
import { coachContext, noStore } from '@/lib/app/coach-context'
import { bookingsBetween, range } from '@/lib/app/coach-data'

export const runtime = 'nodejs'

// The calendar: bookings between two days (at most nine weeks).
//   GET ?from=2026-10-26&to=2026-11-01 → { from, to, bookings }
export async function GET(req: NextRequest) {
  const c = await coachContext()
  if (!c.ok) return c.res
  const { from, to } = range(req.nextUrl.searchParams.get('from'), req.nextUrl.searchParams.get('to'))
  const bookings = await bookingsBetween(c.ctx.db, c.ctx.service, c.ctx.seat.academyId, from, to)
  return NextResponse.json({ from, to, bookings }, noStore)
}
