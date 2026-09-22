import { NextRequest, NextResponse } from 'next/server'

import { sessionCoachId, serviceClient } from '@/lib/coach/oauth'
import { publicSiteOrigin } from '@/lib/public-origin'
import type { BookingRow } from '@/lib/coach/booking-email'
import { sendBookingConfirmation } from '@/lib/coach/booking-confirm'

// Booking confirmation. Called (fire-and-forget) when a booking is CREATED.
//
// Two emails go out plus the in-app message — see lib/coach/booking-confirm.ts,
// which is shared with the public booking-link route so a session a player books
// themselves is confirmed in exactly the same words as one the coach types in.
//
// Auth is the coach's own session, and the booking is re-read server-side scoped
// to their coach_id — the client passes an id, never the content of the email.

export async function POST(req: NextRequest) {
  const coachId = await sessionCoachId()
  if (!coachId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const { bookingId } = (await req.json().catch(() => ({}))) as { bookingId?: string }
  if (!bookingId) return NextResponse.json({ error: 'bookingId is required' }, { status: 400 })

  try {
    const db = serviceClient()
    const { data: booking } = await db.from('coach_bookings').select('*')
      .eq('id', bookingId).eq('coach_id', coachId).maybeSingle()
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

    const b = booking as BookingRow
    // A cancelled booking is not something to send a "thanks for booking" about.
    if ((b.status || '').toLowerCase() === 'cancelled') {
      return NextResponse.json({ sent: false, reason: 'booking is cancelled' })
    }

    const origin = publicSiteOrigin(new URL(req.url).origin)
    const results = await sendBookingConfirmation({ coachId, booking: b, origin, db })
    return NextResponse.json({ ok: true, ...results })
  } catch (err) {
    console.error('[coach/bookings/confirm]', err)
    return NextResponse.json({ error: 'Could not send the confirmation' }, { status: 500 })
  }
}
