import { NextRequest, NextResponse } from 'next/server'
import { isAcademyUser, notAnAcademy } from '@/lib/coach/academy-guard'
import { coachGate, isUuid } from '@/lib/coach/membership'
import { feeFor, isLateCancel } from '@/lib/coach/cancel-policy'
import { admin } from '../_stripe'
import { academyMoney, chargeSaved, priceBooking, refundCharge, type ChargeKind } from '../_saved'

export const runtime = 'nodejs'

// The coach takes a payment from a player's saved card or Direct Debit.
//
// POST { playerId, bookingId?, kind, amountPennies? }
//   kind: lesson | late_cancel | no_show | other
//   With a booking and no amount, the amount is worked out HERE from the price
//   list and the cancellation policy — the same numbers the calendar shows —
//   so the screen cannot ask for a different sum than the one it displayed by
//   accident. A typed amount (the coach's own figure) is used as given.
//
// POST { refund: chargeId, amountPennies? } gives money back instead.

const KINDS: ChargeKind[] = ['lesson', 'late_cancel', 'no_show', 'other']

export async function POST(req: NextRequest) {
  const who = await coachGate()
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: who.status })
  if (!await isAcademyUser(who.userId)) return notAnAcademy()
  const academyId = who.seat.academyId
  const mine = who.seat.isHead ? null : who.seat.staffId
  const b = (await req.json().catch(() => ({}))) as { playerId?: string; bookingId?: string | null; kind?: ChargeKind; amountPennies?: number; refund?: string }
  const db = admin()
  const m = await academyMoney(db, academyId)

  // ── Refund ──
  if (b.refund) {
    if (!isUuid(b.refund)) return NextResponse.json({ error: 'We could not find that payment.' }, { status: 404 })
    if (mine) {
      const { data: c } = await db.from('coach_charges').select('player_id').eq('id', b.refund).eq('coach_id', academyId).maybeSingle()
      const { data: p } = c?.player_id ? await db.from('coach_players').select('id').eq('id', c.player_id).eq('staff_id', mine).maybeSingle() : { data: null }
      if (!p) return NextResponse.json({ error: 'That payment is not for one of your players.' }, { status: 403 })
    }
    const r = await refundCharge(db, m, academyId, b.refund, b.amountPennies == null ? undefined : Number(b.amountPennies))
    return NextResponse.json(r, { status: r.ok ? 200 : 400 })
  }

  // ── Charge ──
  const kind = KINDS.includes(b.kind as ChargeKind) ? (b.kind as ChargeKind) : null
  if (!kind) return NextResponse.json({ error: 'Say what the payment is for.' }, { status: 400 })
  if (!isUuid(b.playerId)) return NextResponse.json({ error: 'Choose a player.' }, { status: 400 })
  const { data: player } = await db.from('coach_players').select('id, name, staff_id').eq('id', b.playerId).eq('coach_id', academyId).maybeSingle()
  if (!player) return NextResponse.json({ error: 'We could not find that player.' }, { status: 404 })
  if (mine && player.staff_id !== mine) return NextResponse.json({ error: 'That player is not one of yours.' }, { status: 403 })

  let amount = b.amountPennies == null || (b.amountPennies as unknown) === '' ? null : Math.round(Number(b.amountPennies))
  let description: string | undefined
  if (b.bookingId) {
    if (!isUuid(b.bookingId)) return NextResponse.json({ error: 'We could not find that lesson.' }, { status: 404 })
    const { data: bk } = await db.from('coach_bookings').select('*').eq('id', b.bookingId).eq('coach_id', academyId).maybeSingle()
    if (!bk) return NextResponse.json({ error: 'We could not find that lesson.' }, { status: 404 })
    if (bk.player_id && bk.player_id !== player.id) return NextResponse.json({ error: 'That lesson is booked for a different player.' }, { status: 400 })
    if (kind === 'late_cancel' && bk.status !== 'cancelled') return NextResponse.json({ error: 'Only a cancelled lesson can have a late-cancellation charge.' }, { status: 400 })
    // The policy the client agreed to decides, not the button: a lesson
    // cancelled with notice is not charged for.
    if (kind === 'late_cancel' && !isLateCancel(bk, m.policy)) return NextResponse.json({ error: `This lesson was cancelled with more than ${m.policy.hours} hours’ notice, so your cancellation policy does not charge for it.` }, { status: 400 })
    if (kind === 'lesson' && bk.status === 'cancelled') return NextResponse.json({ error: 'This lesson was cancelled. Charge a late-cancellation fee instead, if your policy allows it.' }, { status: 400 })
    if (amount == null) {
      const price = await priceBooking(db, academyId, m.settings, bk)
      // A lesson shared by several is charged per head: this player's share.
      const base = price.each != null && price.people > 1 ? price.each : price.total
      amount = kind === 'late_cancel' ? feeFor(base, m.policy.lateChargePct) : kind === 'no_show' ? feeFor(base, m.policy.noShowPct) : base
    }
    const when = bk.booking_date ? new Date(`${bk.booking_date}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }) : ''
    const what = kind === 'late_cancel' ? 'Late cancellation' : kind === 'no_show' ? 'Missed lesson' : `${bk.type || 'Lesson'}`
    description = `${what}${when ? ` · ${when}` : ''}${bk.start_time ? ` ${String(bk.start_time).slice(0, 5)}` : ''} · ${player.name}`
  }
  if (amount == null || !Number.isFinite(amount)) return NextResponse.json({ error: 'Enter the amount to charge.' }, { status: 400 })
  if (amount <= 0) return NextResponse.json({ error: 'There is nothing to charge: this lesson has no price. Set your prices in Settings → Pricing & packages, or type an amount.' }, { status: 400 })

  const r = await chargeSaved(db, m, { academyId, playerId: player.id, playerName: player.name, amountPennies: amount, kind, bookingId: b.bookingId || null, description, by: 'coach' })
  return NextResponse.json({ ...r, amountPennies: amount }, { status: r.ok ? 200 : r.status === 'refused' ? 400 : 402 })
}
