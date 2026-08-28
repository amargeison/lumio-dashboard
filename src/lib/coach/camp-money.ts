// ─────────────────────────────────────────────────────────────────────────────
// What a camp is worth, and what has actually been paid.
//
// One place, because these numbers appear on the Overview, on the Finance tab
// and inside the two-week chase email — and a coach whose Finance tab says a
// family is square while Lumio emails them asking for £1,200 will stop trusting
// both. The email was already doing this correctly; the tabs were not.
//
// The rule, precisely:
//   a.paid           — the coach has ticked them off. Settled, whatever else says.
//   a.amount_pennies — what Stripe actually took. On a deposit camp that is the
//                      deposit, not the full price. On a "no payment" camp, zero.
//
// So an untickeD attendee who paid a £300 deposit has paid £300, not £0 and not
// £1,500. Counting `paid` attendees × price got both of those wrong: it showed
// nothing for a real deposit, and the full price for anyone ticked off who had
// only put a deposit down.
// ─────────────────────────────────────────────────────────────────────────────

// The index signatures are load-bearing: without them these are "weak types"
// (every property optional), and TypeScript then refuses the real camp and
// attendee rows that carry thirty other fields alongside these three.
export type MoneyCamp = { price?: number | null; capacity?: number | null; [k: string]: unknown }
export type MoneyAttendee = { paid?: boolean | null; amount_pennies?: number | null; status?: string | null; [k: string]: unknown }

/** What this attendee has actually handed over, in pounds. */
export function paidSoFar(camp: MoneyCamp, a: MoneyAttendee): number {
  const price = Number(camp.price) || 0
  if (a.paid) return price
  const pennies = Number(a.amount_pennies) || 0
  // Never report more collected than the place costs, whatever is in the row.
  return Math.min(price, Math.max(0, pennies / 100))
}

/** What is still owed on this place. Zero once they are ticked off. */
export function balanceOwed(camp: MoneyCamp, a: MoneyAttendee): number {
  const price = Number(camp.price) || 0
  if (!price || a.paid) return 0
  const owed = price - paidSoFar(camp, a)
  // Under 50p is settled — it is a rounding artefact, not a debt worth an email.
  return owed > 0.5 ? owed : 0
}

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
  const collected = live.reduce((n, a) => n + paidSoFar(camp, a), 0)
  const booked = live.length * per
  return {
    per,
    seats: live.length,
    capacity: Number(camp.capacity) || 0,
    potential: per * (Number(camp.capacity) || 0),
    booked,
    collected,
    outstanding: Math.max(0, booked - collected),
  }
}
