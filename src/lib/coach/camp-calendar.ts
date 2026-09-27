import { serviceClient } from '@/lib/coach/oauth'
import { syncBooking } from '@/lib/coach/calendar'

// Push camps into the coach's own Google / Outlook / iCloud calendar.
//
// Shared by the camp sync route (a camp added or edited in the portal) and the
// import (camps brought in from a spreadsheet, in onboarding or Settings), so a
// camp lands on the coach's phone the moment it exists however it was created —
// which is what stops a lesson being booked in the middle of it.
//
// A camp is ONE event spanning the whole trip (a bar across the week on a
// phone), keyed `camp:<id>` in coach_calendar_links so it never collides with a
// booking's uuid.

export const campKey = (id: string) => `camp:${id}`
const MAX = 25

type CampRow = { id: string; name: string | null; start_date: string | null; end_date: string | null; location: string | null; region: string | null; description: string | null; confirmed: boolean | null }

export async function syncCampsToCalendar(coachId: string, opts: { campIds?: string[]; missingOnly?: boolean } = {}) {
  const db = serviceClient()
  let q = db.from('coach_camps')
    .select('id, name, start_date, end_date, location, region, description, confirmed')
    .eq('coach_id', coachId)
    .not('start_date', 'is', null)
  if (opts.campIds?.length) q = q.in('id', opts.campIds)
  const { data: camps } = await q.order('start_date', { ascending: true })
  let list = (camps || []) as CampRow[]

  // Only camps never written to a calendar — the catch-up pass the Camps page
  // runs on load, for camps set up before the coach connected their calendar.
  if (opts.missingOnly && list.length) {
    const { data: links } = await db.from('coach_calendar_links')
      .select('booking_id').eq('coach_id', coachId).in('booking_id', list.map(c => campKey(c.id)))
    const have = new Set(((links || []) as { booking_id: string }[]).map(l => l.booking_id))
    list = list.filter(c => !have.has(campKey(c.id)))
  }

  // Past camps are history. A camp still running counts as upcoming.
  const today = new Date().toISOString().slice(0, 10)
  list = list.filter(c => String(c.end_date || c.start_date).slice(0, 10) >= today).slice(0, MAX)

  const results = await Promise.all(list.map(async c => {
    const start = String(c.start_date).slice(0, 10)
    const end = String(c.end_date || c.start_date).slice(0, 10)
    const where = [c.location, c.region].filter(Boolean).join(', ')
    const r = await syncBooking(coachId, {
      bookingId: campKey(c.id),
      title: `🎾 ${c.name || 'Training camp'}${c.confirmed === false ? ' (pencilled in)' : ''}`,
      start: `${start}T08:00:00`,
      end: `${end}T20:00:00`,
      location: where || undefined,
      description: [c.description, 'Camp — Lumio Tennis Coach'].filter(Boolean).join('\n\n'),
    })
    return { id: c.id, name: c.name, ...r }
  }))
  return results
}
