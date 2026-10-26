// What the player app shows about a client's lessons, groups and plan, and the
// words for what happens if they cancel (pure — no database, no browser).
//
// Every sentence about money comes from the coach's own cancellation policy,
// the same one the client agreed to when they saved their card, so the app can
// never promise something the policy does not say.

import { ukLocalToMs, type CancelPolicy } from '@/lib/coach/cancel-policy'

export type Cover = 'plan' | 'pack' | null

export type MyLesson = {
  id: string
  date: string; time: string | null; mins: number
  type: string | null; court: string | null; coach: string | null
  paid: boolean
  /** Covered by their monthly plan or a lesson pack. */
  cover: Cover
  confirmed: { at: string; by: string | null } | null
  /** Cancelling now: free, or what happens under the policy. */
  cancel: { free: boolean; words: string; confirm: string }
}

export type MyGroup = {
  id: string; name: string; every: string; price: number; venue: string | null
  next: {
    date: string; time: string
    /** null until they have been asked for this week. */
    token: string | null; askOn: string | null
    answer: 'yes' | 'no' | null; paid: boolean; coveredByPlan: boolean
    placesLeft: number | null; freeUntil: string | null; cancelled: boolean
  } | null
}

export type MyAccount = {
  plan: { name: string; words: string; covers: string; status: string; nextBill: string | null; agreed: boolean } | null
  packs: { name: string; used: number; total: number; left: number; renews: string | null }[]
  method: string | null
  policy: { title: string; text: string }[]
  owed: { kind: 'welcome' | 'balance' | 'group'; title: string; detail: string; url: string }[]
}

export type MyBooking = { on: boolean; durations: number[]; duration: number; type: string }

/** Everything the player app shows about their lessons, groups and plan. */
export type MyPage = { lessons: MyLesson[]; groups: MyGroup[]; account: MyAccount; booking: MyBooking }

const TZ = 'Europe/London'

/** "Tue 14 Oct, 10:00" */
export function whenWords(date: string, time?: string | null): string {
  const d = new Date(`${date}T12:00:00Z`)
  const day = Number.isNaN(d.getTime()) ? date : d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
  return time ? `${day}, ${time.slice(0, 5)}` : day
}

/** A moment (ms) as "Mon 13 Oct, 10:00", in UK time. */
export function momentWords(ms: number): string {
  const d = new Date(ms)
  const day = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: TZ })
  const t = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ })
  return `${day}, ${t}`
}

const span = (h: number) => (h % 24 === 0 && h >= 48 ? `${h / 24} days` : `${h} hours`)
const share = (pct: number) => (pct >= 100 ? 'charged in full' : `charged ${pct}% of the lesson price`)

/**
 * What cancelling this lesson now means, in the policy's own terms:
 * free until the window closes; after that, a plan covers it, a pack loses a
 * lesson, or it is charged as the policy says.
 */
export function cancelTerms(b: { date: string; time: string | null }, p: CancelPolicy, cover: Cover, academy: string, now = Date.now()): MyLesson['cancel'] {
  const who = academy.trim() || 'your coach'
  const starts = ukLocalToMs(b.date, (b.time || '00:00').slice(0, 5))
  const closes = starts - p.hours * 3_600_000
  if (p.hours <= 0 || now < closes) {
    const words = p.hours <= 0 ? 'Free to cancel any time before it starts.' : `Free to cancel until ${momentWords(closes)}.`
    return { free: true, words, confirm: 'Cancel this lesson? It is free to cancel, and your coach will be told straight away.' }
  }
  const inside = `It is inside the ${span(p.hours)} before the lesson`
  let words: string
  if (cover === 'plan') words = `${inside}. Your monthly plan covers your lessons, so there is nothing extra to pay.`
  else if (p.lateChargePct <= 0) words = `${inside}, but under ${who}’s policy it is not charged.`
  else if (cover === 'pack') words = `${inside}, so under ${who}’s policy one lesson comes off your pack.`
  else words = `${inside}, so under ${who}’s policy it is ${share(p.lateChargePct)}.`
  return { free: false, words, confirm: `${words} Cancel it anyway? Your coach will be told straight away.` }
}

/** Has this lesson already started (or finished)? */
export const started = (date: string, time: string | null, now = Date.now()) => ukLocalToMs(date, (time || '00:00').slice(0, 5)) <= now

/** The policy, short: the points a client needs before cancelling. */
export function policyShort(terms: { title: string; text: string }[]): { title: string; text: string }[] {
  const keep = ['Cancelling with notice', 'Missed lessons', 'Weather and coach cancellations', 'Lesson packs']
  return terms.filter(t => keep.includes(t.title) || t.title.startsWith('Inside ')).slice(0, 5)
}

/** Booking lengths a client can choose, around the length of their usual lesson. */
export function bookingDurations(usual?: number | null): { durations: number[]; duration: number } {
  const base = [30, 45, 60, 90]
  const u = Number(usual) || 60
  const durations = base.includes(u) ? base : [...base, u].sort((a, b) => a - b)
  return { durations, duration: u }
}
