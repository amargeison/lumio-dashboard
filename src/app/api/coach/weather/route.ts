import { NextResponse } from 'next/server'
import { isAcademyUser, notAnAcademy } from '@/lib/coach/academy-guard'
import { coachGate } from '@/lib/coach/membership'
import { serviceClient } from '@/lib/coach/oauth'
import { readReminders } from '@/lib/coach/reminders'
import { lessonWeather, WEATHER_CREDIT, type LessonWeather } from '@/lib/coach/weather'
import { venueForecast, weatherOn } from '@/lib/coach/weather-server'
import { ukLocalToMs } from '@/lib/coach/cancel-policy'
import { addDaysIso, ukDate } from '@/lib/coach/uk-date'

export const runtime = 'nodejs'

// The weather for the coach's lessons today and tomorrow, lesson by lesson,
// with the ones that cross the coach's own limits marked. The dashboard shows
// a warning from this and offers the rain-off.
//
// Forecasts are kept for three hours per venue (weather-server.ts), so opening
// the dashboard all day long does not spend the free allowance.

type Lesson = { bookingId: string; date: string; time: string; durMin: number; player: string | null; type: string | null; weather: LessonWeather | null }

export async function GET() {
  const who = await coachGate()
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: who.status })
  if (!await isAcademyUser(who.userId)) return notAnAcademy()
  if (!weatherOn()) return NextResponse.json({ on: false, venues: [] })
  const academyId = who.seat.academyId
  const mine = who.seat.isHead ? null : who.seat.staffId
  const db = serviceClient()
  const today = ukDate()
  const [{ data: set }, { data: venues }] = await Promise.all([
    db.from('coach_settings').select('data').eq('coach_id', academyId).maybeSingle(),
    db.from('coach_venues').select('id, coach_id, name, address, lat, lng, geocoded_at, is_home').eq('coach_id', academyId),
  ])
  const cfg = readReminders((set?.data as Record<string, unknown> | null)?.reminders)
  if (!cfg.weather) return NextResponse.json({ on: false, off: true, venues: [] })
  let q = db.from('coach_bookings').select('id, booking_date, start_time, duration_min, player_name, type, status, venue_id, staff_id')
    .eq('coach_id', academyId).in('booking_date', [today, addDaysIso(today, 1)]).neq('status', 'cancelled')
  if (mine) q = q.eq('staff_id', mine)
  const { data: lessons } = await q
  const home = (venues || []).find(v => v.is_home) || null
  const now = Date.now()
  const byVenue = new Map<string, { venueId: string; name: string; lessons: Lesson[] }>()
  for (const b of lessons || []) {
    if (b.type === 'Block' || !b.booking_date) continue
    const start = ukLocalToMs(b.booking_date, String(b.start_time || '00:00').slice(0, 5))
    if (start + (Number(b.duration_min) || 60) * 60_000 < now) continue
    const v = (venues || []).find(x => x.id === b.venue_id) || (b.venue_id ? null : home)
    if (!v) continue
    if (!byVenue.has(v.id)) byVenue.set(v.id, { venueId: v.id, name: v.name, lessons: [] })
    byVenue.get(v.id)!.lessons.push({ bookingId: b.id, date: b.booking_date, time: String(b.start_time || '').slice(0, 5), durMin: Number(b.duration_min) || 60, player: b.player_name, type: b.type, weather: null })
  }
  // At most one forecast request per venue, and usually none (kept for three hours).
  for (const group of byVenue.values()) {
    const v = (venues || []).find(x => x.id === group.venueId)!
    const series = await venueForecast(db, v)
    for (const l of group.lessons) l.weather = series.length ? lessonWeather(series, ukLocalToMs(l.date, l.time), l.durMin, cfg) : null
    group.lessons.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
  }
  return NextResponse.json({ on: true, credit: WEATHER_CREDIT, limits: { rainPct: cfg.rainPct, windMph: cfg.windMph }, today, venues: Array.from(byVenue.values()) })
}
