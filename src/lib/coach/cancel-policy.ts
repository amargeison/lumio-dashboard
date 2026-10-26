// The coach's cancellation policy, and the arithmetic that hangs off it.
//
// A client agrees to these words when they save their card (/card/<token>),
// and a copy of exactly what they agreed is kept with the card. So the words
// are built from the settings here, in one place, and the same function is
// used by the page the client reads, the record that is kept, and the coach's
// preview in Settings.
//
// Pure: no browser, no database.

export type RainOff = 'refund' | 'credit'

export type CancelPolicy = {
  /** Free to cancel up to this many hours before the start. */
  hours: number
  /** Share of the lesson price charged for a late cancellation (0–100). */
  lateChargePct: number
  /** Share charged when they do not turn up (0–100). */
  noShowPct: number
  /** When the COACH cancels (weather, illness): money back, or a credit. */
  rainOff: RainOff
  /** Take the lesson's money when the free-cancellation window closes. Off until the coach turns it on. */
  autoCharge: boolean
  /** Offer Direct Debit as well as a card on the client's link. */
  directDebit: boolean
  /** Anything else the coach wants on the policy, in their own words. */
  extra: string
}

export const DEFAULT_POLICY: CancelPolicy = {
  hours: 24, lateChargePct: 100, noShowPct: 100, rainOff: 'refund', autoCharge: false, directDebit: false, extra: '',
}

/** Settings as stored can be partial or from an older version; this always returns a whole policy. */
export function readPolicy(raw: unknown): CancelPolicy {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<CancelPolicy>
  const pct = (v: unknown, d: number) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : d }
  const hrs = Math.round(Number(r.hours))
  return {
    hours: Number.isFinite(hrs) && hrs >= 0 && hrs <= 168 ? hrs : DEFAULT_POLICY.hours,
    lateChargePct: pct(r.lateChargePct, DEFAULT_POLICY.lateChargePct),
    noShowPct: pct(r.noShowPct, DEFAULT_POLICY.noShowPct),
    rainOff: r.rainOff === 'credit' ? 'credit' : 'refund',
    autoCharge: !!r.autoCharge,
    directDebit: !!r.directDebit,
    extra: typeof r.extra === 'string' ? r.extra.slice(0, 600) : '',
  }
}

const share = (pct: number) => (pct >= 100 ? 'in full' : pct <= 0 ? 'nothing' : `${pct}% of the lesson price`)
const spanAdj = (h: number) => (h % 24 === 0 && h >= 48 ? `${h / 24}-day` : `${h}-hour`)
const span = (h: number) => (h === 0 ? 'until the lesson starts' : h % 24 === 0 && h >= 48 ? `${h / 24} days` : `${h} hours`)

/** The policy as the client reads it: a heading per point, then the words. */
export function policyTerms(p: CancelPolicy, academy: string): { title: string; text: string }[] {
  const who = academy.trim() || 'your coach'
  const terms: { title: string; text: string }[] = []
  terms.push({
    title: 'Cancelling with notice',
    text: p.hours === 0
      ? 'You can cancel or move a lesson free of charge at any time before it starts.'
      : `You can cancel or move a lesson free of charge up to ${span(p.hours)} before it starts.`,
  })
  if (p.hours > 0) {
    terms.push({
      title: `Inside ${span(p.hours)}`,
      text: p.lateChargePct <= 0
        ? `Lessons cancelled less than ${span(p.hours)} before the start are not charged.`
        : `Lessons cancelled less than ${span(p.hours)} before the start are charged ${share(p.lateChargePct)}.`
          + (p.autoCharge ? ` Your payment is taken when the ${spanAdj(p.hours)} window closes, before the lesson.` : ''),
    })
  }
  terms.push({
    title: 'Missed lessons',
    text: p.noShowPct <= 0 ? 'A lesson you miss without telling us is not charged.' : `A lesson you miss without telling us is charged ${share(p.noShowPct)}.`,
  })
  terms.push({
    title: 'Weather and coach cancellations',
    text: p.rainOff === 'credit'
      ? `If ${who} cancels because of the weather or because the coach cannot make it, you are not charged, or you get a credit for another lesson if you have already paid.`
      : `If ${who} cancels because of the weather or because the coach cannot make it, you are not charged, or you are refunded in full if you have already paid.`,
  })
  terms.push({
    title: 'Your card or bank details',
    text: `They are held securely by Stripe, the payment company, never by ${who} or Lumio. You can ask for them to be removed at any time; a lesson already inside the cancellation window is still charged.`,
  })
  terms.push({ title: 'Exceptions', text: `${who} can waive a charge where it is fair to, for example for illness or an emergency.` })
  if (p.extra.trim()) terms.push({ title: 'Also', text: p.extra.trim() })
  return terms
}

/** The whole policy as one block of text: what is kept with the card as the record of what was agreed. */
export function policyText(p: CancelPolicy, academy: string): string {
  return `${academy.trim() || 'Cancellation policy'} — cancellation policy\n\n` + policyTerms(p, academy).map((t, i) => `${i + 1}. ${t.title}. ${t.text}`).join('\n')
}

// ── Time ───────────────────────────────────────────────────────────────────
/** A UK wall-clock date and time ("2026-10-17", "16:00") as a moment in time (ms). */
export function ukLocalToMs(date: string, time: string): number {
  const [y, mo, d] = date.split('-').map(Number)
  const [h, mi] = (time || '00:00').split(':').map(Number)
  const guess = Date.UTC(y, mo - 1, d, h || 0, mi || 0)
  // What the UK clock reads at that UTC moment; the gap is the UK offset (0 or 1 hour).
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(guess))
  const g = (t: string) => Number(parts.find(x => x.type === t)?.value)
  const shown = Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute'))
  return guess - (shown - guess)
}

/** When the free-cancellation window closes for a lesson (ms), or null without a date. */
export function windowClosesAt(b: { booking_date?: string | null; start_time?: string | null }, p: CancelPolicy): number | null {
  if (!b.booking_date || !/^\d{4}-\d{2}-\d{2}$/.test(b.booking_date)) return null
  return ukLocalToMs(b.booking_date, (b.start_time || '00:00').slice(0, 5)) - p.hours * 3_600_000
}

/** A cancelled booking that was cancelled after its free window had closed. */
export function isLateCancel(b: { status?: string | null; cancelled_at?: string | null; cancelled_by?: string | null; booking_date?: string | null; start_time?: string | null }, p: CancelPolicy): boolean {
  // The coach calling it off (rain, illness) is never the client's late cancellation.
  if (b.status !== 'cancelled' || !b.cancelled_at || b.cancelled_by === 'coach' || p.hours <= 0) return false
  const closes = windowClosesAt(b, p)
  const at = Date.parse(b.cancelled_at)
  return closes != null && Number.isFinite(at) && at >= closes
}

/** The fee for a late cancellation or a no-show, from the lesson's price. */
export const feeFor = (pricePennies: number, pct: number) => Math.round((Math.max(0, pricePennies) * Math.max(0, Math.min(100, pct))) / 100)
