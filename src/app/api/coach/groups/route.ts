import { NextRequest, NextResponse } from 'next/server'
import { isAcademyUser, notAnAcademy } from '@/lib/coach/academy-guard'
import { coachGate, isUuid } from '@/lib/coach/membership'
import { serviceClient } from '@/lib/coach/oauth'
import { publicSiteOrigin } from '@/lib/public-origin'
import { ensureWeek, loadReply, sayYes, sayNo } from '@/lib/coach/groups-server'
import { upcomingDate } from '@/lib/coach/groups'

export const runtime = 'nodejs'

// Weekly groups, from the coach's side. The groups and their members are saved
// from the page itself; the weeks and the answers are the server's to write.
//
// POST { action: 'ask', groupId }
//   Ask about the next session now, instead of waiting for the ask day. Also
//   how someone added to the group after the question went out gets theirs.
// POST { action: 'mark', replyId, answer: 'yes' | 'no' }
//   The coach answers for someone (they said so on WhatsApp, or they are paying
//   another way). Marking someone in takes a place but never charges them;
//   marking them out follows the same free-window rule as if they had said so.

export async function POST(req: NextRequest) {
  const who = await coachGate()
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: who.status })
  if (!await isAcademyUser(who.userId)) return notAnAcademy()
  const academyId = who.seat.academyId
  const mine = who.seat.isHead ? null : who.seat.staffId
  const b = (await req.json().catch(() => ({}))) as { action?: string; groupId?: string; replyId?: string; answer?: string }
  const db = serviceClient()
  const origin = publicSiteOrigin(new URL(req.url).origin)

  if (b.action === 'ask') {
    if (!isUuid(b.groupId)) return NextResponse.json({ error: 'We could not find that group.' }, { status: 404 })
    const { data: g } = await db.from('coach_groups').select('*').eq('id', b.groupId).eq('coach_id', academyId).maybeSingle()
    if (!g || (mine && g.staff_id !== mine)) return NextResponse.json({ error: 'We could not find that group.' }, { status: 404 })
    if (!g.active) return NextResponse.json({ error: 'This group is paused. Switch it back on first.' }, { status: 400 })
    const date = upcomingDate(g)
    const r = await ensureWeek(db, g, date, { origin, send: true })
    if (r.closed) return NextResponse.json({ error: 'That week has been called off.' }, { status: 400 })
    if (!r.members) return NextResponse.json({ error: 'Add people to the group first.' }, { status: 400 })
    return NextResponse.json({ ok: true, date, ...r })
  }

  if (b.action === 'mark') {
    if (!isUuid(b.replyId) || !['yes', 'no'].includes(String(b.answer))) return NextResponse.json({ error: 'Say who, and whether they are coming.' }, { status: 400 })
    const L = await loadReply(db, { id: b.replyId })
    if (!L || L.reply.coach_id !== academyId || (mine && L.group.staff_id !== mine)) return NextResponse.json({ error: 'We could not find that answer.' }, { status: 404 })
    if (b.answer === 'yes') {
      const r = await sayYes(db, L, 'coach', origin)
      if (r.state === 'full') return NextResponse.json({ error: 'This week is full. Raise the number of places on the group to add them.' }, { status: 409 })
      if (r.state === 'closed') return NextResponse.json({ error: 'This week has started or been called off.' }, { status: 409 })
      if (r.state !== 'yes') return NextResponse.json({ error: r.error || 'That could not be saved.' }, { status: 400 })
      return NextResponse.json({ ok: true })
    }
    const r = await sayNo(db, L, 'coach')
    return NextResponse.json({ ok: true, late: r.late, refunded: r.refunded, ...(r.error ? { warning: r.error } : {}) })
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
}
