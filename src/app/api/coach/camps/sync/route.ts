import { NextRequest, NextResponse } from 'next/server'
import { sessionCoachId, serviceClient } from '@/lib/coach/oauth'
import { syncBooking, unsyncBooking } from '@/lib/coach/calendar'

// Camps in the coach's own calendar.
//
// Bookings have synced to Google / Outlook / iCloud since migration 124. Camps
// never did — so a coach who connected iCloud saw every one-hour lesson appear
// on their phone and a week in Spain not appear at all. Nothing to do with when
// the camp was created: camps were simply not part of the sync, and a camp is
// the single most important thing to have on the phone of somebody deciding
// whether they are free on Thursday.
//
// A camp is pushed as ONE event spanning the whole trip rather than a lesson per
// day: that is how it reads on a phone (a bar across the week) and it means
// moving the dates moves one event instead of orphaning six.
//
// `booking_id` on coach_calendar_links is text, so camps key on `camp:<id>` and
// can never collide with a booking's uuid.

export const runtime = 'nodejs'

const key = (id: string) => `camp:${id}`
const MAX = 25   // one page of camps per call; nobody runs more in a season

export async function POST(req: NextRequest) {
  const coachId = await sessionCoachId()
  if (!coachId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const { campId, missing } = (await req.json().catch(() => ({}))) as { campId?: string; missing?: boolean }

  try {
    const db = serviceClient()
    let q = db.from('coach_camps')
      .select('id, name, start_date, end_date, location, region, description, confirmed')
      .eq('coach_id', coachId)
      .not('start_date', 'is', null)
    if (campId) q = q.eq('id', campId)
    const { data: camps } = await q.order('start_date', { ascending: true })

    let list = (camps || []) as any[]

    // "missing" is the catch-up pass the Camps page runs on load: only camps that
    // have never been written to a calendar. It is what makes a camp set up
    // BEFORE the coach connected their calendar turn up afterwards, rather than
    // needing them to re-save every camp by hand.
    if (missing && list.length) {
      const { data: links } = await db.from('coach_calendar_links')
        .select('booking_id').eq('coach_id', coachId).in('booking_id', list.map(c => key(c.id)))
      const have = new Set((links || []).map((l: any) => l.booking_id))
      list = list.filter(c => !have.has(key(c.id)))
    }

    // Past camps are history; syncing them fills a coach's calendar with things
    // that already happened. A camp still running counts as upcoming.
    const today = new Date().toISOString().slice(0, 10)
    list = list.filter(c => String(c.end_date || c.start_date).slice(0, 10) >= today).slice(0, MAX)

    if (!list.length) return NextResponse.json({ ok: true, synced: 0, camps: 0 })

    const results = await Promise.all(list.map(async c => {
      const start = String(c.start_date).slice(0, 10)
      const end = String(c.end_date || c.start_date).slice(0, 10)
      const where = [c.location, c.region].filter(Boolean).join(', ')
      const r = await syncBooking(coachId, {
        bookingId: key(c.id),
        title: `🎾 ${c.name || 'Training camp'}${c.confirmed === false ? ' (pencilled in)' : ''}`,
        // A camp has no start time, so it is pushed as a block across the days
        // it runs — which is how a phone draws a multi-day event.
        start: `${start}T08:00:00`,
        end: `${end}T20:00:00`,
        location: where || undefined,
        description: [c.description, 'Camp — Lumio Tennis Coach'].filter(Boolean).join('\n\n'),
      })
      return { id: c.id, name: c.name, ...r }
    }))

    const synced = results.filter(r => r.synced.length).length
    const failed = results.flatMap(r => r.failed.map(f => ({ camp: r.name, ...f })))
    const connected = results[0]?.connected ?? 0
    if (failed.length) console.error('[coach/camps/sync] incomplete', { coachId, failed })
    return NextResponse.json({ ok: failed.length === 0, camps: results.length, synced, failed, connected })
  } catch (err) {
    console.error('[coach/camps/sync]', err)
    return NextResponse.json({ error: 'Calendar sync failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const coachId = await sessionCoachId()
  if (!coachId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const campId = req.nextUrl.searchParams.get('campId')
  if (!campId) return NextResponse.json({ error: 'campId is required' }, { status: 400 })
  try {
    await unsyncBooking(coachId, key(campId))
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[coach/camps/sync] delete', err)
    return NextResponse.json({ error: 'Could not remove the camp from your calendar' }, { status: 500 })
  }
}
