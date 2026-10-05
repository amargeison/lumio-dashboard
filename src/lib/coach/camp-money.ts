// ─────────────────────────────────────────────────────────────────────────────
// What a camp is worth, and what has actually been paid.
//
// One place, because these numbers appear on the Overview, on the Finance tab
// and inside the two-week chase email — and a coach whose Finance tab says a
// family is square while Lumio emails them asking for £1,200 will stop trusting
// both. The email was already doing this correctly; the tabs were not.
//
// The rule, precisely — everything is worked out in pennies:
//   a.paid           — the tick. It means PAID IN FULL: the whole price is in.
//   a.paid_pennies   — the coach's own ledger: what has actually been received
//                      for this place from any source (bank transfer, cash at
//                      the club, a first instalment). When it is set, it is the
//                      answer (migration 173).
//   a.amount_pennies — only the fallback, for a place nobody has typed a figure
//                      against: what the sign-up page charged online. While the
//                      place is still 'pending' that charge has NOT been paid —
//                      the sign-up stores the amount due before any money moves
//                      — so a pending place has paid nothing.
//
// So an unticked attendee who paid a £300 deposit has paid £300, not £0 and not
// £1,500; a typed part-payment counts; and an online sign-up that never reached
// the payment page is not shown as a deposit.
// ─────────────────────────────────────────────────────────────────────────────

import { safeUrl } from '@/lib/coach/trip'

// The index signatures are load-bearing: without them these are "weak types"
// (every property optional), and TypeScript then refuses the real camp and
// attendee rows that carry thirty other fields alongside these three.
export type MoneyCamp = { price?: number | null; capacity?: number | null; [k: string]: unknown }
export type MoneyAttendee = { paid?: boolean | null; amount_pennies?: number | null; paid_pennies?: number | null; status?: string | null; [k: string]: unknown }

const pricePennies = (camp: MoneyCamp) => Math.max(0, Math.round((Number(camp.price) || 0) * 100))

/** What this attendee has actually handed over, in pennies. Never more than the place costs. */
export function paidPennies(camp: MoneyCamp, a: MoneyAttendee): number {
  const due = pricePennies(camp)
  if (a.paid) return due
  const typed = a.paid_pennies
  const received = typed != null && !Number.isNaN(Number(typed))
    ? Number(typed)
    : (a.status || '') === 'pending' ? 0 : Number(a.amount_pennies) || 0
  return Math.min(due, Math.max(0, Math.round(received)))
}

/** What is still owed on this place, in pennies. Zero once they are ticked off. */
export function owedPennies(camp: MoneyCamp, a: MoneyAttendee): number {
  const due = pricePennies(camp)
  if (!due || a.paid) return 0
  // To the penny. Everything here is whole pennies, so there is no rounding to
  // forgive — and a place 40p short used to read "Paid" on one screen while the
  // 40p stayed in "Outstanding" on another.
  return Math.max(0, due - paidPennies(camp, a))
}

/** The same two figures in pounds, for the screens and emails that print them. */
export function paidSoFar(camp: MoneyCamp, a: MoneyAttendee): number { return paidPennies(camp, a) / 100 }
export function balanceOwed(camp: MoneyCamp, a: MoneyAttendee): number { return owedPennies(camp, a) / 100 }

/**
 * The one word shown beside an attendee, so the Attendees list and the Finance
 * tab cannot disagree. 'awaiting' is an online sign-up that was asked to pay on
 * the page and has not: it holds no money, so it is never shown as a deposit.
 */
export type PayState = 'paid' | 'deposit' | 'awaiting' | 'unpaid'
/** A cancelled place owes nothing and is not chased, whatever was paid before. */
export const isCancelled = (a: MoneyAttendee) => (a.status || '') === 'cancelled'
export function payState(camp: MoneyCamp, a: MoneyAttendee): PayState {
  if (a.paid || owedPennies(camp, a) === 0) return 'paid'
  if (paidPennies(camp, a) > 0) return 'deposit'
  return (a.status || '') === 'pending' ? 'awaiting' : 'unpaid'
}
export const PAY_STATE_LABEL: Record<PayState, string> = { paid: 'Paid', deposit: 'Part paid', awaiting: 'Awaiting payment', unpaid: 'Unpaid' }

/**
 * Every figure the camp screens show, from one calculation.
 *
 * `potential` is what the camp is worth if it fills; `booked` is what the seats
 * actually taken are worth. They were both being called "projected", which is
 * why a camp with one attendee out of twenty-four read £1,500 in a box headed
 * "Projected revenue". Outstanding is measured against BOOKED — an empty seat is
 * not a debt.
 */
export function campMoney(camp: MoneyCamp, attendees: MoneyAttendee[]) {
  const per = Number(camp.price) || 0
  // A cancelled place is not booked and does not owe anything.
  const live = attendees.filter(a => (a.status || '') !== 'cancelled')
  // Added in pennies: 33.33 + 59.60 added as pounds is 92.92999999999999.
  const collected = live.reduce((n, a) => n + paidPennies(camp, a), 0) / 100
  const booked = (live.length * pricePennies(camp)) / 100
  return {
    per,
    seats: live.length,
    capacity: Number(camp.capacity) || 0,
    potential: per * (Number(camp.capacity) || 0),
    booked,
    collected,
    outstanding: Math.max(0, Math.round((booked - collected) * 100) / 100),
  }
}

/**
 * "Where a balance gets paid" is whatever the coach typed. It only ever becomes
 * a link when it is a plain web address; anything else — "bank transfer to
 * 12-34-56 …", or something that is not a web link at all — is printed as
 * words. So a `javascript:` or `data:` address can never be the Pay button in
 * a family's inbox, whatever is saved on the camp.
 */
export function payDestination(raw: unknown): { href: string | null; text: string | null } {
  const v = String(raw ?? '').trim()
  if (!v) return { href: null, text: null }
  const looksLikeLink = !/\s/.test(v) && (/^https?:\/\//i.test(v) || /^[a-z0-9-]+(\.[a-z0-9-]+)+([/?#].*)?$/i.test(v))
  const href = looksLikeLink ? safeUrl(v) : null
  return href ? { href, text: null } : { href: null, text: v.slice(0, 300) }
}

/** True when the box holds something that tries to be a link but is not a web address. */
export function unsafePayLink(raw: unknown): boolean {
  const v = String(raw ?? '').trim()
  return !/\s/.test(v) && /^[a-z][a-z0-9+.-]*:/i.test(v) && !/^https?:\/\//i.test(v)
}
