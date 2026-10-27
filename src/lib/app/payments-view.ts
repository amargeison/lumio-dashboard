// The Payments page's words for a line and a monthly plan, for the iPhone app
// (pure — the same rules as LivePayments.tsx and MonthlyPlans.tsx).

import { isVoidPayment, paymentOwedPennies, toPennies } from '@/lib/coach/money'
import { ordinal } from '@/lib/coach/memberships'

export type PayLine = {
  id: string; player_id?: string | null; player_name?: string | null; item?: string | null; amount?: unknown
  status?: string | null; due_date?: string | null; paid?: boolean | null; paid_at?: string | null; notes?: string | null
  sessions_total?: number | null; renews_date?: string | null; created_at?: string | null
}
export type PayStatus = 'active' | 'expiring' | 'expired' | 'used' | 'overdue' | 'due' | 'settled' | 'void' | 'none'

export const STATUS_LABEL: Record<PayStatus, string> = {
  active: 'Active', expiring: 'Expiring', expired: 'Expired', used: 'Used up', overdue: 'Overdue',
  due: 'Due', settled: 'Settled', void: 'Not owed', none: 'No charge',
}

const day = (s?: string | null) => String(s || '').slice(0, 10)
const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 864e5)

export const isPack = (p: PayLine) => (p.sessions_total || 0) > 0 || !!p.renews_date

/** LivePayments statusOf: worked out from the dates, with "overdue" the one stored word honoured. */
export function payStatus(p: PayLine, used: number, today: string): PayStatus {
  if (isVoidPayment(p)) return 'void'
  const owed = paymentOwedPennies(p) > 0
  const late = owed && (p.status === 'overdue' || (!!p.due_date && day(p.due_date) < today))
  if (isPack(p)) {
    const days = p.renews_date ? daysBetween(today, day(p.renews_date)) : null
    if (late) return 'overdue'
    if (days != null && days < 0) return 'expired'
    if ((p.sessions_total || 0) > 0 && used >= (p.sessions_total || 0)) return 'used'
    if (days != null ? days <= 14 : p.status === 'expiring') return 'expiring'
    return 'active'
  }
  if (toPennies(p.amount) <= 0) return 'none'
  if (p.paid) return 'settled'
  return late ? 'overdue' : 'due'
}

export type PlanLike = { status: string; agreed_at?: string | null; day_of_month: number; starts_month?: string | null }

/** MonthlyPlans: the plan's state in words. */
export function planLabel(p: PlanLike, hasCard: boolean): string {
  if (p.status === 'ended') return 'Ended'
  if (p.status === 'offered' || !p.agreed_at) return 'Waiting for them to agree'
  if (p.status === 'paused') return 'Paused'
  if (!hasCard) return 'Waiting for a card'
  return 'Running'
}

/** This month's bill in words, and whether "Take it now" applies. */
export function monthState(p: PlanLike, o: { period: string; today: string; hasCard: boolean; bill?: { status: string; chargeStatus?: string | null } | null }) {
  const running = p.status === 'active' && !!p.agreed_at
  const started = !p.starts_month || o.period >= p.starts_month
  let words: string
  if (!running || !started) words = '—'
  else if (o.bill?.chargeStatus === 'paid') words = 'Taken'
  else if (o.bill?.chargeStatus === 'processing') words = 'On its way (Direct Debit)'
  else if (o.bill?.status === 'failed' || o.bill?.chargeStatus === 'failed') words = 'Failed'
  else if (o.bill?.status === 'charging') words = 'Taking it now'
  else if (Number(o.today.slice(8, 10)) < p.day_of_month) words = `Due on the ${ordinal(p.day_of_month)}`
  else words = 'Not taken'
  const canTake = running && started && o.hasCard && (!o.bill || o.bill.status === 'failed' || o.bill.chargeStatus === 'failed')
  return { words, canTake }
}
