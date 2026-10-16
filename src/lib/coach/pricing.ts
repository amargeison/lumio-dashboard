// What a lesson costs the client, and what the court costs the coach.
//
// One coach charges by the hour for a private, a set price per head for a
// weekly group, and a sliding price for a private group (£65 for one, £35 each
// for two, £25 each for three…). The price can depend on the venue, and some
// clients are on their own rate ("legacy", "regular"). Lumio used to know one
// number — the private hourly rate — and nothing used it but a header.
//
// The order, first match wins:
//   1. a price typed on the booking itself
//   2. the client's own rate (private lessons; per hour)
//   3. the price list: this lesson type at this venue, then this type at any venue
//   4. the private hourly rate from Settings (one-to-one private lessons only)
// Everything is worked in pennies so totals are exact.
//
// Pure: no browser, no database. The calendar, the payments page and (later)
// the server that takes payments all use the same rules.

export type PriceBasis = 'hour' | 'session' | 'person' | 'headcount'

export type PriceRule = {
  id: string
  /** The lesson type this price is for (Private, Group, Cardio, …), or 'any'. */
  type: string
  /** A venue id, or null for any venue. */
  venueId: string | null
  basis: PriceBasis
  /** £ per hour / per session / per person. Not used for 'headcount'. */
  amount: number
  /** 'headcount': £ EACH PER HOUR when there are 1, 2, 3… people. The last value carries on for bigger groups. */
  perHead?: number[]
  /** Optional name for the list, e.g. "Private group". */
  label?: string
}

export type ClientRate = { rate_pennies?: number | null; rate_reason?: string | null } | null | undefined

export type PricedBooking = {
  type?: string | null; venue_id?: string | null; duration_min?: number | null
  price_pennies?: number | null; headcount?: number | null
}

export type Price = {
  /** What the whole booking is worth, in pennies. 0 when nothing applies. */
  total: number
  /** Per person, when the price is per person or by group size. */
  each: number | null
  people: number
  source: 'booking' | 'client' | 'list' | 'default' | 'none'
  /** Plain words for where the price came from, e.g. "Client rate · Legacy". */
  why: string
}

const pennies = (pounds: unknown) => {
  const n = typeof pounds === 'number' ? pounds : parseFloat(String(pounds ?? '').replace(/[£,\s]/g, ''))
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0
}
const hours = (mins: number | null | undefined) => Math.max(5, Math.min(600, Number(mins) || 60)) / 60
const sameType = (a?: string | null, b?: string | null) => (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase()
export const peopleOf = (b: PricedBooking) => Math.max(1, Math.min(50, Math.round(Number(b.headcount) || 1)))

/** The rule that prices this booking, if any: this type at this venue beats this type anywhere, which beats "any type". */
export function ruleFor(b: PricedBooking, rules: PriceRule[]): PriceRule | null {
  const t = b.type || 'Private'
  const v = b.venue_id || null
  const fits = (r: PriceRule, typeOk: (r: PriceRule) => boolean, venueOk: (r: PriceRule) => boolean) => typeOk(r) && venueOk(r)
  const exactType = (r: PriceRule) => sameType(r.type, t)
  const anyType = (r: PriceRule) => sameType(r.type, 'any')
  const atVenue = (r: PriceRule) => !!v && r.venueId === v
  const anyVenue = (r: PriceRule) => !r.venueId
  return rules.find(r => fits(r, exactType, atVenue))
    || rules.find(r => fits(r, exactType, anyVenue))
    || rules.find(r => fits(r, anyType, atVenue))
    || rules.find(r => fits(r, anyType, anyVenue))
    || null
}

/** Price one rule for one booking. */
export function applyRule(r: PriceRule, b: PricedBooking): { total: number; each: number | null; people: number } {
  const people = peopleOf(b)
  if (r.basis === 'hour') return { total: Math.round(pennies(r.amount) * hours(b.duration_min)), each: null, people }
  if (r.basis === 'session') return { total: pennies(r.amount), each: null, people }
  if (r.basis === 'person') { const each = pennies(r.amount); return { total: each * people, each, people } }
  const table = (r.perHead || []).map(pennies)
  if (!table.length) return { total: 0, each: null, people }
  // Per hour, like a private: £35 each for two is £35 each for an hour and
  // £17.50 each for half an hour.
  const each = Math.round(table[Math.min(people, table.length) - 1] * hours(b.duration_min))
  return { total: each * people, each, people }
}

const describe = (r: PriceRule, venueName?: (id: string) => string | undefined) => {
  const where = r.venueId ? ` at ${venueName?.(r.venueId) || 'this venue'}` : ''
  return `${r.label?.trim() || (sameType(r.type, 'any') ? 'Price list' : r.type)}${where}`
}

export function priceFor(b: PricedBooking, ctx: {
  rules: PriceRule[]; client?: ClientRate; defaultHourly?: number | null
  venueName?: (id: string) => string | undefined
}): Price {
  const people = peopleOf(b)
  if (b.price_pennies != null && Number.isFinite(Number(b.price_pennies)) && Number(b.price_pennies) >= 0) {
    const total = Math.round(Number(b.price_pennies))
    return { total, each: people > 1 ? Math.round(total / people) : null, people, source: 'booking', why: 'Price set on this booking' }
  }
  const isPrivate = sameType(b.type || 'Private', 'Private')
  // A client's own rate is an hourly rate for their one-to-one lessons. Group
  // sessions, and a private shared with friends, are priced for the group, not
  // for one person's deal.
  if (isPrivate && people === 1 && ctx.client?.rate_pennies && ctx.client.rate_pennies > 0) {
    const total = Math.round(ctx.client.rate_pennies * hours(b.duration_min))
    const reason = (ctx.client.rate_reason || '').trim()
    return { total, each: null, people, source: 'client', why: `Client rate${reason ? ` · ${reason}` : ''}` }
  }
  const r = ruleFor(b, ctx.rules || [])
  if (r) {
    const got = applyRule(r, b)
    if (got.total > 0) return { ...got, source: 'list', why: describe(r, ctx.venueName) }
  }
  // The hourly rate is for the lesson, however many share it.
  if (isPrivate && pennies(ctx.defaultHourly) > 0) {
    const total = Math.round(pennies(ctx.defaultHourly) * hours(b.duration_min))
    return { total, each: people > 1 ? Math.round(total / people) : null, people, source: 'default', why: people > 1 ? `Private hourly rate, shared by ${people}` : 'Private hourly rate' }
  }
  return { total: 0, each: null, people, source: 'none', why: 'No price set' }
}

// ── Court costs ─────────────────────────────────────────────────────────────
export type CourtBilling = 'invoice' | 'pay' | 'free'
export type VenueCost = { id?: string; court_cost_pennies?: number | null; court_billing?: string | null } | null | undefined

/** What the court costs for this booking, in pennies (one court for its length). */
export function courtCostFor(b: PricedBooking, venue: VenueCost): number {
  if (!venue || venue.court_billing === 'free') return 0
  const per = Number(venue.court_cost_pennies) || 0
  if (per <= 0) return 0
  return Math.round(per * hours(b.duration_min))
}

export const BILLING_LABEL: Record<CourtBilling, string> = {
  invoice: 'Invoiced to me (monthly)',
  pay: 'I pay at the venue',
  free: 'Free for me to use',
}

export const RATE_REASONS = ['Legacy rate', 'Regular', 'Family', 'Friend', 'Introductory'] as const

// ── For the price list editor and summaries ─────────────────────────────────
export const BASIS_LABEL: Record<PriceBasis, string> = {
  hour: 'Per hour',
  session: 'Per session',
  person: 'Per person',
  headcount: 'By group size',
}

const gbp = (p: number) => `£${(p / 100).toFixed(p % 100 ? 2 : 0)}`

/** "£38 an hour", "£15 each", "£65 for 1 · £35 each for 2 · …" */
export function ruleSummary(r: PriceRule): string {
  if (r.basis === 'headcount') {
    const t = (r.perHead || []).map(pennies)
    if (!t.length) return 'No prices yet'
    return t.map((p, i) => i === 0 ? `${gbp(p)} for 1` : `${gbp(p)} each for ${i + 1}${i === t.length - 1 ? '+' : ''}`).join(' · ') + ' (per hour)'
  }
  const a = pennies(r.amount)
  if (!a) return 'No price yet'
  return r.basis === 'hour' ? `${gbp(a)} an hour` : r.basis === 'person' ? `${gbp(a)} each` : `${gbp(a)} a session`
}

export const newRuleId = () => `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

/** The demo academy's price list: a coach who charges groups by the head and
 *  privates by how many share them. Venue-free so it fits any demo venue. */
export const DEMO_PRICE_LIST: PriceRule[] = [
  { id: 'demo-private', type: 'Private', venueId: null, basis: 'headcount', amount: 0, perHead: [38, 24, 18, 15], label: 'Private (1 to 4 players)' },
  { id: 'demo-group', type: 'Group', venueId: null, basis: 'person', amount: 15, label: 'Adult group' },
  { id: 'demo-cardio', type: 'Cardio', venueId: null, basis: 'person', amount: 12 },
  { id: 'demo-match', type: 'Match play', venueId: null, basis: 'person', amount: 10 },
]
