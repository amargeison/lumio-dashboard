import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { icsFor } from '@/lib/coach/calendar-links'

export const runtime = 'nodejs'

// The "Add to Apple / Outlook" link from a confirmation email.
//
// Unauthenticated on purpose: it is opened from a mail client, often on a phone
// that has never signed into Lumio, and a calendar link behind a login is a
// calendar link nobody uses. What protects it is the id — a v4 uuid is not
// guessable, and it is already sitting in the recipient's inbox. The same trust
// model every "add to calendar" link on the internet uses.
//
// It returns one event and nothing else: the time, the place and the title. No
// contact details, no notes, no money, and never a list.

function bad() {
  // A 404 for anything that does not resolve — an invalid id and a valid id for
  // a cancelled booking should be indistinguishable from outside.
  return new NextResponse('Not found', { status: 404 })
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) return bad()

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  let ics: string | null = null
  let filename = 'lumio.ics'

  if (kind === 'booking') {
    const { data: b } = await db.from('coach_bookings')
      .select('id, coach_id, title, player_name, court, booking_date, start_time, duration_min, status, type')
      .eq('id', id).maybeSingle()
    if (!b || (b.status || '').toLowerCase() === 'cancelled' || !b.booking_date) return bad()

    const { data: profile } = await db.from('sports_profiles')
      .select('brand_name, contact_email, display_name').eq('id', b.coach_id).maybeSingle()
    const academy = profile?.brand_name || 'Tennis'
    const who = (b.player_name || b.title || '').trim()

    ics = icsFor({
      title: `${b.type || 'Lesson'}${who ? ` — ${who}` : ''} · ${academy}`,
      date: String(b.booking_date),
      time: b.start_time ? String(b.start_time).slice(0, 5) : null,
      durationMin: b.duration_min,
      location: b.court || undefined,
      description: `Booked with ${academy}.`,
      uid: `booking-${b.id}`,
    }, { name: profile?.display_name || academy, email: profile?.contact_email })
    filename = 'lesson.ics'
  }

  if (kind === 'camp') {
    const { data: c } = await db.from('coach_camps')
      .select('id, coach_id, name, start_date, end_date, location, region')
      .eq('id', id).maybeSingle()
    if (!c || !c.start_date) return bad()

    const { data: profile } = await db.from('sports_profiles')
      .select('brand_name, contact_email, display_name').eq('id', c.coach_id).maybeSingle()
    const academy = profile?.brand_name || 'Tennis'

    // A camp is days, not hours — an all-day span that ends the day it ends.
    const endExclusive = (() => {
      const d = new Date(`${String(c.end_date || c.start_date).slice(0, 10)}T00:00:00`)
      return d.toISOString().slice(0, 10)
    })()
    ics = icsFor({
      title: `${c.name} · ${academy}`,
      date: String(c.start_date),
      time: null,
      location: [c.location, c.region].filter(Boolean).join(', ') || undefined,
      description: `Your place is booked with ${academy}.`,
      uid: `camp-${c.id}`,
      durationMin: null,
      // Multi-day: icsFor's all-day branch adds one day, so pass the last day.
      ...(endExclusive !== String(c.start_date).slice(0, 10) ? { date: String(c.start_date) } : {}),
    }, { name: profile?.display_name || academy, email: profile?.contact_email })
    filename = 'camp.ics'
  }

  if (!ics) return bad()

  return new NextResponse(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, max-age=300',
    },
  })
}
