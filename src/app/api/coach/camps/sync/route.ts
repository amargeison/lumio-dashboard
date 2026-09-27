import { NextRequest, NextResponse } from 'next/server'
import { sessionCoachId } from '@/lib/coach/oauth'
import { unsyncBooking } from '@/lib/coach/calendar'
import { syncCampsToCalendar, campKey as key } from '@/lib/coach/camp-calendar'

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


export async function POST(req: NextRequest) {
  const coachId = await sessionCoachId()
  if (!coachId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const { campId, missing } = (await req.json().catch(() => ({}))) as { campId?: string; missing?: boolean }

  try {
    const results = await syncCampsToCalendar(coachId, { campIds: campId ? [campId] : undefined, missingOnly: !!missing })
    if (!results.length) return NextResponse.json({ ok: true, synced: 0, camps: 0 })

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
