import { NextResponse } from 'next/server'
import { coachContext, noStore } from '@/lib/app/coach-context'
import { buildDashboard, type DashboardRows } from '@/lib/app/coach-dashboard'
import { ukDate, ukWeek } from '@/lib/coach/uk-date'

export const runtime = 'nodejs'

// The iPhone app's dashboard: the portal dashboard's panels, worked out here
// (lib/app/coach-dashboard.ts) from the coach's own rows, read as them so row
// level security narrows an invited coach exactly as the website does.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>

export async function GET() {
  const c = await coachContext()
  if (!c.ok) return c.res
  const { db, service, seat, userId } = c.ctx
  const academy = seat.academyId
  const week = ukWeek(ukDate())
  const rows = async (q: PromiseLike<{ data: unknown }>) => ((await q).data || []) as Row[]

  const [players, bookings, lessons, payments, attendance, skills, messages, equipment, staff, venues, camps, campAttendees, settingsRow, profile] = await Promise.all([
    rows(db.from('coach_players').select('id, name, parent_name, racket_stage, avatar_url, staff_id').eq('coach_id', academy)),
    // From the start of this week: "this week", today, next and upcoming all start there.
    rows(db.from('coach_bookings').select('id, booking_date, start_time, status, title, player_name, player_id, court, type, staff_id').eq('coach_id', academy).gte('booking_date', week.start).order('booking_date').limit(2000)),
    rows(db.from('coach_sessions').select('id, session_date, player_name, focus, staff_id').eq('coach_id', academy).order('session_date', { ascending: false }).limit(300)),
    rows(db.from('coach_payments').select('*').eq('coach_id', academy)),
    rows(db.from('coach_attendance').select('player_id, present').eq('coach_id', academy)),
    rows(db.from('coach_player_skills').select('player_id, skill, score').eq('coach_id', academy)),
    rows(db.from('coach_messages').select('id, recipients, subject, body, direction, read, dismissed, created_at, player_id, reaction').eq('coach_id', academy).order('created_at', { ascending: false }).limit(60)),
    rows(db.from('coach_equipment').select('id, item, quantity, status, low_at').eq('coach_id', academy)),
    rows(db.from('coach_staff').select('id, name').eq('coach_id', academy)),
    rows(db.from('coach_venues').select('id, name').eq('coach_id', academy)),
    rows(db.from('coach_camps').select('*').eq('coach_id', academy)),
    rows(db.from('coach_camp_attendees').select('*').eq('coach_id', academy)),
    service.from('coach_settings').select('data').eq('coach_id', academy).maybeSingle(),
    service.from('sports_profiles').select('display_name').eq('id', userId).maybeSingle(),
  ])

  const s = ((settingsRow.data as { data?: Row } | null)?.data || {}) as Row
  const staffName = seat.staffId ? String(staff.find(x => x.id === seat.staffId)?.name || '') : ''
  const all: DashboardRows = { players, bookings, lessons, payments, attendance, skills, messages, equipment, staff, venues, camps, campAttendees }
  const dash = buildDashboard(all, {
    clubName: String((seat.isHead && typeof s.academy === 'string' && s.academy.trim()) || seat.brandName || ''),
    personName: staffName || String((profile.data as Row | null)?.display_name || ''),
    myStaffId: seat.isHead ? null : seat.staffId,
    features: { racket: (s.features as Row | undefined)?.racket === true },
    sectionsOff: Array.isArray((s.sectionsOff as Row | undefined)?.dashboard) ? (s.sectionsOff as Row).dashboard.map(String) : [],
  })
  return NextResponse.json(dash, noStore)
}
