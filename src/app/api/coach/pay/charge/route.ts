import { NextRequest, NextResponse } from 'next/server'
import { isAcademyUser, notAnAcademy } from '@/lib/coach/academy-guard'
import { coachGate, isUuid } from '@/lib/coach/membership'
import { feeFor, isLateCancel } from '@/lib/coach/cancel-policy'
import { admin } from '../_stripe'
import { academyMoney, chargeSaved, priceBooking, refundCharge, type ChargeKind } from '../_saved'
import { packCover } from '@/lib/coach/packs-server'

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
// POST { paymentId } charges a pack or invoice from the Payments page to the
//   player's saved card, for exactly what it is for, and ticks it paid when the
//   money is in.
//
// POST { refund: chargeId, amountPennies? } gives money back instead.

const KINDS: ChargeKind[] = ['lesson', 'late_cancel', 'no_show', 'other']

export async function POST(req: NextRequest) {
  const who = await coachGate()
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: who.status })
  if (!await isAcademyUser(who.userId)) return notAnAcademy()
  const academyId = who.seat.academyId
  const mine = who.seat.isHead ? null : who.seat.staffId
  const b = (await req.json().catch(() => ({}))) as { playerId?: string; bookingId?: string | null; kind?: ChargeKind; amountPennies?: number; refund?: string; paymentId?: string }
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

  // ── A pack or invoice ──
  if (b.paymentId) {
    if (!isUuid(b.paymentId)) return NextResponse.json({ error: 'We could not find that invoice.' }, { status: 404 })
    const { data: inv } = await db.from('coach_payments').select('id, player_id, player_name, item, amount, paid').eq('id', b.paymentId).eq('coach_id', academyId).maybeSingle()
    if (!inv || !inv.player_id) return NextResponse.json({ error: 'We could not find that invoice, or it is not linked to a player.' }, { status: 404 })
    const { data: pl } = await db.from('coach_players').select('id, name, staff_id').eq('id', inv.player_id).eq('coach_id', academyId).maybeSingle()
    if (!pl || (mine && pl.staff_id !== mine)) return NextResponse.json({ error: 'That invoice is not for one of your players.' }, { status: 403 })
    if (inv.paid) return NextResponse.json({ error: 'That is already marked paid.' }, { status: 400 })
    const pennies = Math.round(Number(inv.amount) * 100)
    if (!(pennies > 0)) return NextResponse.json({ error: 'There is nothing to pay on that line.' }, { status: 400 })
    const { data: live } = await db.from('coach_charges').select('id').eq('payment_id', inv.id).in('status', ['charging', 'processing', 'paid']).limit(1)
    if (live?.length) return NextResponse.json({ error: 'This has already been charged. A Direct Debit takes about three working days to arrive.' }, { status: 400 })
    const r = await chargeSaved(db, m, { academyId, playerId: pl.id, playerName: pl.name, amountPennies: pennies, kind: 'other', paymentId: inv.id, description: `${inv.item || 'Payment'} · ${pl.name}`, by: 'coach' })
    return NextResponse.json({ ...r, amountPennies: pennies }, { status: r.ok ? 200 : r.status === 'refused' ? 400 : 402 })
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
    // A lesson that comes off the player's pack is paid for by the pack.
    if (kind !== 'other') {
      const { cover } = await packCover(db, academyId, [player.id], m.policy)
      const pack = cover.get(bk.id)
      if (pack) return NextResponse.json({ error: `This lesson comes off ${player.name}’s pack (${pack.item || 'lesson pack'}), so there is nothing to charge.` }, { status: 400 })
    }
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
