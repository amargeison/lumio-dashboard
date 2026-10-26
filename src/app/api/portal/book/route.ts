import { NextRequest, NextResponse } from 'next/server'
import { familyAccess, scopedDb } from '@/lib/coach/membership'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { publicSiteOrigin } from '@/lib/public-origin'
import { bookingSlots, bookLesson, actorName } from '@/lib/student/lesson-actions'

export const runtime = 'nodejs'

// The player app's "Book a session": the coach's free times, and booking one.
//
//   GET  ?playerId=…&mins=60          free slots, day by day, for 21 days
//   POST { playerId, date, time, mins }
//
// Booking can be switched off by the coach (Settings → the player app's
// sections, "Book a session"); that is checked here, not only on the page.

async function bookingOff(db: ReturnType<typeof scopedDb>, academyId: string) {
  const { data } = await db.from('coach_settings').select('data').eq('coach_id', academyId).maybeSingle()
  const off = (data?.data as { sectionsOff?: { student?: string[] } } | null)?.sectionsOff?.student || []
  return off.includes('booking') || off.includes('upcoming')
}

export async function GET(req: NextRequest) {
  const access = await familyAccess(req.nextUrl.searchParams.get('playerId'))
  if (!access.ok) return NextResponse.json({ error: access.error, code: access.code }, { status: access.status })
  const db = scopedDb()
  if (await bookingOff(db, access.m.academyId)) return NextResponse.json({ error: 'Booking from the app is switched off. Message your coach to book.' }, { status: 403 })
  const mins = Math.max(15, Math.min(240, Number(req.nextUrl.searchParams.get('mins')) || 60))
  return NextResponse.json({ days: await bookingSlots(db, access.m.academyId, mins) })
}

export async function POST(req: NextRequest) {
  const limit = rateLimit(`portal-book:${clientIp(req.headers)}`, 10, 10 * 60_000)
  if (!limit.ok) return NextResponse.json({ error: 'Too many tries. Please wait a few minutes.' }, { status: 429 })
  const b = (await req.json().catch(() => ({}))) as { playerId?: string; date?: string; time?: string; mins?: number }
  const access = await familyAccess(b.playerId)
  if (!access.ok) return NextResponse.json({ error: access.error, code: access.code }, { status: access.status })
  const m = access.m
  const db = scopedDb()
  if (await bookingOff(db, m.academyId)) return NextResponse.json({ error: 'Booking from the app is switched off. Message your coach to book.' }, { status: 403 })
  const by = await actorName(db, m.academyId, m.scopePlayerId, m.role, m.email)
  const r = await bookLesson(db, m.academyId, m.scopePlayerId, { date: String(b.date || ''), time: String(b.time || ''), mins: Number(b.mins) || 60, by, origin: publicSiteOrigin(new URL(req.url).origin) })
  if (!r.ok) {
    const days = r.taken ? await bookingSlots(db, m.academyId, Number(b.mins) || 60) : undefined
    return NextResponse.json({ error: r.error, days }, { status: r.taken ? 409 : 400 })
  }
  return NextResponse.json({ ok: true, notice: `Booked for ${r.when}. You will get a confirmation, and it is in your coach’s diary.` })
}
