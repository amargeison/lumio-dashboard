import { NextRequest, NextResponse } from 'next/server'
import { sessionCoachId } from '@/lib/coach/oauth'
import { syncBooking, unsyncBooking, type CalEvent } from '@/lib/coach/calendar'

// Push a booking into the coach's connected calendars (POST) or remove it (DELETE).
// Called by the live portal when a booking is created / updated / cancelled. Auth is
// the coach's own session; tokens never leave the server.
//
// This is a ONE-WAY push (Lumio → calendar). Importing external events back into
// Lumio is not built — see the sync report / docs/follow-ups.md.
//
// Response contract: `ok` means "every connected calendar was actually written to".
// It is NOT set merely because the request was handled — a connected provider whose
// write failed comes back in `failed` with ok:false, so the UI can show FAILED
// instead of a cosmetic "Synced".

export async function POST(req: NextRequest) {
  const coachId = await sessionCoachId()
  if (!coachId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const b = (await req.json().catch(() => ({}))) as Partial<CalEvent>
  if (!b.bookingId || !b.title || !b.start || !b.end) {
    return NextResponse.json({ error: 'bookingId, title, start and end are required' }, { status: 400 })
  }
  try {
    const { synced, failed, connected } = await syncBooking(coachId, b as CalEvent)
    if (failed.length) {
      console.error('[coach/calendar/event] sync incomplete', { coachId, bookingId: b.bookingId, synced, failed })
      // 207 when some calendars took it, 502 when none did.
      return NextResponse.json({ ok: false, synced, failed, connected }, { status: synced.length ? 207 : 502 })
    }
    return NextResponse.json({ ok: true, synced, failed, connected })
  } catch (err) {
    console.error('[coach/calendar/event] sync', err)
    return NextResponse.json({ ok: false, error: 'Calendar sync failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const coachId = await sessionCoachId()
  if (!coachId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const bookingId = req.nextUrl.searchParams.get('bookingId')
  if (!bookingId) return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 })
  try {
    await unsyncBooking(coachId, bookingId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[coach/calendar/event] unsync', err)
    return NextResponse.json({ error: 'Calendar removal failed' }, { status: 500 })
  }
}
