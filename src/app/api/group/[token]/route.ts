import { NextRequest, NextResponse } from 'next/server'
import { publicSiteOrigin } from '@/lib/public-origin'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { admin } from '@/app/api/coach/pay/_stripe'
import { loadReply, sayYes, sayNo, payLink, chargesOf, methodWords, type Loaded } from '@/lib/coach/groups-server'
import { activeMethod } from '@/app/api/coach/pay/_saved'
import { cancelState, dayWords, untilWords, payWayFor } from '@/lib/coach/groups'
import { niceTime } from '@/lib/coach/reminders'
import { familyAddress, type FamilyPlayer } from '@/lib/coach/family-mail'

export const runtime = 'nodejs'

// One person's link for one week of a weekly group — /group/<token>, no account.
//
//   GET   the session, their answer, whether their place is paid
//   POST  { action: 'yes' | 'no' | 'pay' }
//
// Places are first come, first served (lumio_group_say_yes). A yes is paid for
// there and then from a saved card; without one, 'pay' opens a card payment
// page. A no is free until the coach's cancellation window closes.

const TOKEN_RE = /^[A-Za-z0-9_-]{16,64}$/
const first = (s: unknown) => String(s || '').trim().split(/\s+/)[0] || ''

async function view(db: ReturnType<typeof admin>, L: Loaded) {
  const { reply, session, group, player, m, venue } = L
  const cs = cancelState(session.session_date, group.start_time, m.policy.hours)
  const charges = await chargesOf(db, reply.id)
  const live = charges.find(c => ['paid', 'processing', 'charging'].includes(c.status))
  const refunded = charges.find(c => c.status === 'refunded')
  const { count } = await db.from('coach_group_replies').select('id', { count: 'exact', head: true }).eq('session_id', session.id).eq('answer', 'yes')
  const card = reply.answer === 'yes' ? null : (m.chargesEnabled ? await activeMethod(db, reply.coach_id, reply.player_id) : null)
  const state = session.status !== 'open' ? 'off' : cs.started ? 'past' : 'open'
  return {
    academy: m.academy, coachName: m.coachName || null, logoUrl: m.logoUrl, playerFirst: familyAddress(player as FamilyPlayer)?.toParent ? first(player.name) : '',
    group: group.name, when: `${dayWords(session.session_date)} at ${niceTime(group.start_time)}`, durMin: group.duration_min,
    venue: venue ? { name: venue.name, address: venue.address || null } : null, court: group.court || null,
    price: Number(group.price_pennies) || 0, placesLeft: Math.max(0, group.capacity - (count || 0)),
    state, answer: reply.answer || null, late: !!reply.late,
    paid: live ? (live.status === 'processing' ? 'processing' : 'paid') : refunded ? 'refunded' : 'none',
    payWay: payWayFor(m.chargesEnabled, !!card || !!live), card: methodWords(card),
    freeUntil: m.policy.hours > 0 ? untilWords(cs.freeUntil) : null, free: cs.free,
  }
}

async function load(token: string) {
  if (!TOKEN_RE.test(token)) return null
  const db = admin()
  const L = await loadReply(db, { token })
  return L ? { db, L } : null
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const got = await load(token)
  if (!got) return NextResponse.json({ error: 'This link is not valid.' }, { status: 404 })
  if (!got.L.reply.opened_at) await got.db.from('coach_group_replies').update({ opened_at: new Date().toISOString() }).eq('id', got.L.reply.id)
  return NextResponse.json(await view(got.db, got.L))
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const limit = rateLimit(`group:${clientIp(req.headers)}`, 20, 10 * 60_000)
  if (!limit.ok) return NextResponse.json({ error: 'Too many tries. Please wait a few minutes.' }, { status: 429 })
  const got = await load(token)
  if (!got) return NextResponse.json({ error: 'This link is not valid.' }, { status: 404 })
  const { db, L } = got
  const { action } = (await req.json().catch(() => ({}))) as { action?: string }
  const origin = publicSiteOrigin(new URL(req.url).origin)

  if (action === 'yes') {
    const r = await sayYes(db, L, 'client', origin)
    const fresh = await loadReply(db, { token })
    const v = await view(db, fresh || L)
    if (r.state === 'full') return NextResponse.json({ ...v, notice: 'Sorry, this week is full.' }, { status: 409 })
    if (r.state === 'closed') return NextResponse.json({ ...v, notice: 'This session has started or been called off.' }, { status: 409 })
    if (r.state !== 'yes') return NextResponse.json({ error: r.error || 'That could not be saved. Please try again.' }, { status: 500 })
    return NextResponse.json({ ...v, notice: r.payNote || null })
  }
  if (action === 'no') {
    const r = await sayNo(db, L, 'client')
    const fresh = await loadReply(db, { token })
    const v = await view(db, fresh || L)
    const money = r.refunded ? ` £${(r.refunded / 100).toFixed(r.refunded % 100 ? 2 : 0)} is on its way back to your card.` : ''
    const lateWords = v.paid === 'paid' || v.paid === 'processing'
      ? 'Thanks for letting us know. It is inside the cancellation window, so the place stays paid for.'
      : 'Thanks for letting us know. It is inside the cancellation window, so under the cancellation policy the place is still charged.'
    return NextResponse.json({ ...v, notice: r.error || (r.late ? lateWords : `Thanks for letting us know.${money}`) })
  }
  if (action === 'pay') {
    const r = await payLink(db, L, origin)
    if (!r.url) return NextResponse.json({ error: r.error || 'The payment page could not be opened.' }, { status: 400 })
    return NextResponse.json({ url: r.url })
  }
  return NextResponse.json({ error: 'Choose yes or no.' }, { status: 400 })
}
