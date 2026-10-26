import { NextRequest, NextResponse } from 'next/server'
import { isAcademyUser, notAnAcademy } from '@/lib/coach/academy-guard'
import { coachGate, isUuid } from '@/lib/coach/membership'
import { serviceClient } from '@/lib/coach/oauth'
import { chargeMonth } from '@/lib/coach/monthly-server'
import { monthOf, monthWords, type Plan } from '@/lib/coach/memberships'
import { ukDate } from '@/lib/coach/uk-date'

export const runtime = 'nodejs'

// Monthly plans, from the coach's side. Plans are set up and changed from the
// page; taking a month is the server's.
//
// POST { action: 'charge-now', id }
//   Take this month now: for a plan agreed after its billing day, or a month
//   whose payment failed and has been sorted out since.

export async function POST(req: NextRequest) {
  const who = await coachGate()
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: who.status })
  if (!await isAcademyUser(who.userId)) return notAnAcademy()
  const academyId = who.seat.academyId
  const mine = who.seat.isHead ? null : who.seat.staffId
  const b = (await req.json().catch(() => ({}))) as { action?: string; id?: string }
  if (b.action !== 'charge-now' || !isUuid(b.id)) return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
  const db = serviceClient()
  const { data: plan } = await db.from('coach_memberships').select('*').eq('id', b.id).eq('coach_id', academyId).maybeSingle()
  if (!plan || (mine && plan.staff_id !== mine)) return NextResponse.json({ error: 'We could not find that plan.' }, { status: 404 })
  if (!plan.agreed_at) return NextResponse.json({ error: 'They have not agreed to this plan yet. Send them their welcome link.' }, { status: 400 })
  if (plan.status !== 'active') return NextResponse.json({ error: 'This plan is not running. Resume it first.' }, { status: 400 })
  const period = monthOf(ukDate())
  if (period < plan.starts_month) return NextResponse.json({ error: `This plan starts in ${monthWords(plan.starts_month)}.` }, { status: 400 })
  const r = await chargeMonth(db, plan as Plan & { coach_id: string }, period, 'coach')
  if (!r.ok) return NextResponse.json({ error: r.error || 'The payment did not go through.' }, { status: 400 })
  return NextResponse.json({ ok: true, status: r.status, period })
}
