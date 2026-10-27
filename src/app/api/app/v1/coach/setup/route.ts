import { NextResponse } from 'next/server'
import { coachContext, noStore } from '@/lib/app/coach-context'
import { ukDate } from '@/lib/coach/uk-date'

export const runtime = 'nodejs'

// What the iPhone app's booking, summary and message screens need to know about
// the academy, in one call: the lesson types and default length, the venues and
// courts, the coaches, the camps (a camp day can't take a lesson), and when
// lesson summaries go out. Read as the coach, so they see what the website shows them.

type Row = Record<string, unknown>
const DEFAULT_TYPES = ['Private', 'Group', 'Cardio', 'Match play']

export async function GET() {
  const c = await coachContext()
  if (!c.ok) return c.res
  const { db, service, seat } = c.ctx
  const academy = seat.academyId
  const since = ukDate(new Date(Date.now() - 31 * 864e5))

  const [settingsRow, venues, courts, staff, camps] = await Promise.all([
    service.from('coach_settings').select('data').eq('coach_id', academy).maybeSingle(),
    db.from('coach_venues').select('id, name, is_home').eq('coach_id', academy).order('name'),
    db.from('coach_courts').select('id, name, venue_id').eq('coach_id', academy).order('name'),
    db.from('coach_staff').select('id, name, is_head').eq('coach_id', academy).order('name'),
    db.from('coach_camps').select('id, name, start_date, end_date').eq('coach_id', academy).or(`end_date.gte.${since},and(end_date.is.null,start_date.gte.${since})`).order('start_date'),
  ])
  const s = ((settingsRow.data as { data?: Row } | null)?.data || {}) as Row
  const types = Array.isArray(s.lessonTypes) && s.lessonTypes.length ? (s.lessonTypes as unknown[]).map(String) : DEFAULT_TYPES
  const booking = (s.booking || {}) as Row
  const summaries = (s.summaries || {}) as Row
  const mins = Number(booking.defaultDuration)

  const coaches = ((staff.data || []) as Row[]).filter(r => !r.is_head).map(r => ({ id: String(r.id), name: String(r.name || '') }))
  const myName = seat.staffId ? coaches.find(x => x.id === seat.staffId)?.name ?? null : null

  return NextResponse.json({
    lessonTypes: [...types.filter(t => t !== 'Block'), 'Block'],
    defaultDuration: Number.isInteger(mins) && mins >= 5 && mins <= 600 ? mins : 60,
    venues: ((venues.data || []) as Row[]).map(v => ({ id: String(v.id), name: String(v.name || 'Venue'), isHome: v.is_home === true })),
    courts: ((courts.data || []) as Row[]).map(x => ({ id: String(x.id), name: String(x.name || 'Court'), venueId: x.venue_id ? String(x.venue_id) : null })),
    // A head coach books for anyone; an invited coach books for themselves.
    coaches: seat.isHead ? coaches : coaches.filter(x => x.id === seat.staffId),
    me: { isHead: seat.isHead, staffId: seat.staffId, name: myName },
    camps: ((camps.data || []) as Row[])
      .filter(r => r.start_date)
      .map(r => ({ id: String(r.id), name: String(r.name || 'Camp'), start: String(r.start_date).slice(0, 10), end: String(r.end_date || r.start_date).slice(0, 10) })),
    summaries: { send: ['manual', 'now', 'time'].includes(String(summaries.send)) ? String(summaries.send) : 'manual', at: typeof summaries.at === 'string' ? summaries.at : '22:00' },
  }, noStore)
}
