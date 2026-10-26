import { NextRequest, NextResponse } from 'next/server'
import { isAcademyUser, notAnAcademy } from '@/lib/coach/academy-guard'
import { coachGate, isUuid } from '@/lib/coach/membership'
import { serviceClient } from '@/lib/coach/oauth'
import { publicSiteOrigin } from '@/lib/public-origin'
import { academyMoney } from '@/app/api/coach/pay/_saved'
import { CAMP_COLS, takeBalance, remind, balanceUrl } from '@/lib/coach/camp-balance-server'

export const runtime = 'nodejs'

// A camp place's balance, from the coach's Finance tab.
//
// POST { attendeeId, action: 'take' }   take it now from the card the family agreed to
// POST { attendeeId, action: 'link' }   email them the reminder with their link to pay
// POST { attendeeId, action: 'copy' }   just the link, to send another way
// Head coach only: camps are the academy's.

export async function POST(req: NextRequest) {
  const who = await coachGate({ headOnly: true })
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: who.status })
  if (!await isAcademyUser(who.userId)) return notAnAcademy()
  const b = (await req.json().catch(() => ({}))) as { attendeeId?: string; action?: string }
  if (!isUuid(b.attendeeId) || !['take', 'link', 'copy'].includes(String(b.action))) return NextResponse.json({ error: 'Say who, and what to do.' }, { status: 400 })
  const db = serviceClient()
  const academyId = who.seat.academyId
  const { data: a } = await db.from('coach_camp_attendees').select('*').eq('id', b.attendeeId).eq('coach_id', academyId).maybeSingle()
  if (!a) return NextResponse.json({ error: 'We could not find that place.' }, { status: 404 })
  const { data: camp } = await db.from('coach_camps').select(CAMP_COLS).eq('id', a.camp_id).eq('coach_id', academyId).maybeSingle()
  if (!camp) return NextResponse.json({ error: 'We could not find that camp.' }, { status: 404 })
  const origin = publicSiteOrigin(new URL(req.url).origin)
  const m = await academyMoney(db, academyId)
  if (b.action === 'copy') return NextResponse.json({ ok: true, url: await balanceUrl(db, a, origin) })
  if (b.action === 'link') {
    if (!a.parent_email) return NextResponse.json({ error: 'There is no email address for this place.' }, { status: 400 })
    if (!camp.balance_due) return NextResponse.json({ error: 'Set the balance due date first (Sign-up page settings).' }, { status: 400 })
    const ok = await remind(db, m, camp, a, origin)
    return ok ? NextResponse.json({ ok: true, to: a.parent_email }) : NextResponse.json({ error: 'The email did not send.' }, { status: 500 })
  }
  const r = await takeBalance(db, m, camp, a, 'coach', origin)
  return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: r.error }, { status: 400 })
}
