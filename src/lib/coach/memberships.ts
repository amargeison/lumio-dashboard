// Monthly plans: the rules and the words (pure — no database, no browser).
//
// A regular client pays a set amount each month ("£150 a month on the 1st"),
// taken by Lumio from their saved card or Direct Debit once they have agreed
// to it. What the plan covers is not charged again lesson by lesson:
//
//   'lessons'  their one-to-one lessons (a weekly private, say)
//   'group'    their place in one weekly group (a yes is not charged)
//   'none'     nothing else: the monthly amount is for something the coach
//              keeps track of another way
//
// A month is taken from its billing day for a week. A client who agrees, or
// saves their card, later than that starts the following month, so nobody is
// charged for a month that is mostly over. The coach can still take the
// current month by hand.

import { ukDate } from './uk-date'
import { formatPennies } from './money'

export type Covers = 'lessons' | 'group' | 'none'
export type Plan = {
  id: string; player_id: string; name: string; amount_pennies: number; day_of_month: number; starts_month: string
  covers: Covers; group_id?: string | null; status: 'offered' | 'active' | 'paused' | 'ended'
  agreed_at?: string | null; staff_id?: string | null
}

/** How many days after the billing day a month can still be taken on its own. */
export const BILL_WINDOW_DAYS = 7

export const monthOf = (iso: string) => iso.slice(0, 7)
export function nextMonth(period: string): string {
  const [y, m] = period.split('-').map(Number)
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
}

/** "1st", "2nd", "23rd" */
export function ordinal(n: number): string {
  const s = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] || 'th'
  return `${n}${s}`
}

/** "March 2027" */
export function monthWords(period: string): string {
  const d = new Date(`${period}-15T12:00:00Z`)
  return Number.isNaN(d.getTime()) ? period : d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}

/** "£150 a month on the 1st" */
export const planWords = (p: Pick<Plan, 'amount_pennies' | 'day_of_month'>) => `${formatPennies(p.amount_pennies)} a month on the ${ordinal(p.day_of_month)}`

export function coversWords(p: Pick<Plan, 'covers'>, groupName?: string | null, first?: string | null): string {
  const whose = first ? `${first}’s` : 'your'
  if (p.covers === 'lessons') return `It covers ${whose} one-to-one lessons, so they are not charged separately.`
  if (p.covers === 'group') return `It covers ${whose} place in ${groupName || 'the weekly group'}, so saying yes each week costs nothing extra.`
  return ''
}

/** The words a client agrees to, kept with the plan. */
export function agreeText(p: Pick<Plan, 'amount_pennies' | 'day_of_month' | 'starts_month' | 'name' | 'covers'>, academy: string, groupName?: string | null): string {
  return `${p.name}: I agree to pay ${academy} ${planWords(p)}, starting ${monthWords(p.starts_month)}, taken from my saved card or Direct Debit, until I or ${academy} end the plan. ${coversWords(p, groupName)}`.trim()
}

/** Is this plan's month due to be taken today, and which month is it? */
export function dueNow(p: Plan, today = ukDate()): { period: string; due: boolean } {
  const period = monthOf(today)
  const day = Number(today.slice(8, 10))
  const due = p.status === 'active' && !!p.agreed_at && period >= p.starts_month
    && day >= p.day_of_month && day < p.day_of_month + BILL_WINDOW_DAYS
  return { period, due }
}

/** When the next payment will be taken: 'YYYY-MM-DD'. */
export function nextBillDate(p: Plan, billed: Set<string>, today = ukDate()): string {
  let period = monthOf(today) < p.starts_month ? p.starts_month : monthOf(today)
  for (let i = 0; i < 14; i++) {
    const d = `${period}-${String(p.day_of_month).padStart(2, '0')}`
    const lastDay = Number(d.slice(8, 10)) + BILL_WINDOW_DAYS - 1
    const stillOpen = monthOf(today) < period || (monthOf(today) === period && Number(today.slice(8, 10)) <= lastDay)
    if (!billed.has(period) && stillOpen) return d < today ? today : d
    period = nextMonth(period)
  }
  return `${period}-${String(p.day_of_month).padStart(2, '0')}`
}

/** The plan, if any, that covers a lesson: a one-to-one lesson for that player, or their place in that group. */
export function planCovering(plans: Plan[], o: { playerId?: string | null; type?: string | null; groupId?: string | null }): Plan | null {
  if (!o.playerId) return null
  const live = plans.filter(p => p.player_id === o.playerId && p.status === 'active' && !!p.agreed_at)
  if (o.groupId) return live.find(p => p.covers === 'group' && p.group_id === o.groupId) || null
  if (/group|squad|cardio|match/i.test(o.type || '') || o.type === 'Block') return null
  return live.find(p => p.covers === 'lessons') || null
}
