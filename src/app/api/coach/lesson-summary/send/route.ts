import { NextRequest, NextResponse } from 'next/server'
import { isAcademyUser, notAnAcademy } from '@/lib/coach/academy-guard'
import { coachGate, isUuid } from '@/lib/coach/membership'
import { serviceClient } from '@/lib/coach/oauth'
import { readSummaries } from '@/lib/coach/reminders'
import { hasShareable } from '@/lib/coach/summary-share'
import { ukDate, ukTime } from '@/lib/coach/uk-date'
import { ukLocalToMs } from '@/lib/coach/cancel-policy'
import { sendSummary } from '@/lib/coach/summary-send'

export const runtime = 'nodejs'

// The coach approves a lesson summary and Lumio sends it to the family.
//
// POST { sessionId, when }
//   when = 'now'      send it now
//   when = 'schedule' send it at the coach's chosen time today (Settings →
//                     Reminders & summaries); after that time, it goes now
//   when = 'cancel'   take it off the schedule before it goes
//
// The summary is read from the database here, never from the browser, and the
// coach's private note is never part of it (summary-share.ts).

export async function POST(req: NextRequest) {
  const who = await coachGate()
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: who.status })
  if (!await isAcademyUser(who.userId)) return notAnAcademy()
  const academyId = who.seat.academyId
  const mine = who.seat.isHead ? null : who.seat.staffId
  const b = (await req.json().catch(() => ({}))) as { sessionId?: string; when?: string }
  if (!isUuid(b.sessionId)) return NextResponse.json({ error: 'We could not find that summary.' }, { status: 404 })
  const db = serviceClient()
  const { data: s } = await db.from('coach_sessions').select('*').eq('id', b.sessionId).eq('coach_id', academyId).maybeSingle()
  if (!s) return NextResponse.json({ error: 'We could not find that summary.' }, { status: 404 })
  if (mine && s.staff_id !== mine) {
    const { data: p } = s.player_id ? await db.from('coach_players').select('staff_id').eq('id', s.player_id).maybeSingle() : { data: null }
    if (p?.staff_id !== mine) return NextResponse.json({ error: 'That summary is not for one of your players.' }, { status: 403 })
  }

  if (b.when === 'cancel') {
    await db.from('coach_sessions').update({ share_due_at: null }).eq('id', s.id).is('shared_at', null)
    return NextResponse.json({ ok: true, scheduled: null })
  }
  if (!s.player_id) return NextResponse.json({ error: 'This summary is not linked to a player, so there is nobody to send it to.' }, { status: 400 })
  if (!hasShareable(s)) return NextResponse.json({ error: 'There is nothing to send yet. Add what you covered, a takeaway or homework first.' }, { status: 400 })

  if (b.when === 'schedule') {
    const { data: set } = await db.from('coach_settings').select('data').eq('coach_id', academyId).maybeSingle()
    const cfg = readSummaries((set?.data as Record<string, unknown> | null)?.summaries)
    const due = ukLocalToMs(ukDate(), cfg.at)
    if (ukTime() < cfg.at || due > Date.now()) {
      await db.from('coach_sessions').update({ share_due_at: new Date(due).toISOString(), share_error: null }).eq('id', s.id)
      return NextResponse.json({ ok: true, scheduled: new Date(due).toISOString(), at: cfg.at })
    }
    // The time has passed today: send it now rather than tomorrow night.
  }

  const r = await sendSummary(db, academyId, who.userId, s)
  return NextResponse.json(r, { status: r.ok ? 200 : 400 })
}
