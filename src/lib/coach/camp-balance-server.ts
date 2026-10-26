// Camp and holiday balances on the server: the reminder, taking the balance
// from the deposit card, and the link to pay it.
//
// Used by the timer (/api/cron/lesson-charges), the coach's buttons on the
// camp's Finance tab (/api/coach/camps/balance) and the family's link
// (/api/camp/balance/<token>).

import { randomBytes } from 'crypto'
import { stripe, admin } from '@/app/api/coach/pay/_stripe'
import { academyMoney, type AcademyMoney } from '@/app/api/coach/pay/_saved'
import { sendFamilyEmail } from './family-mail'
import { owedPennies, paidPennies } from './camp-money'
import { balanceStage, balanceReminder, balanceTaken, balanceFailed, withinAgreed } from './camp-balance'
import { ukDate } from './uk-date'
import { formatPennies } from './money'

type Db = ReturnType<typeof admin>
type Row = Record<string, any>
const first = (s: unknown) => String(s || '').trim().split(/\s+/)[0] || ''
export const CAMP_COLS = 'id, coach_id, name, price, room_options, payment_mode, balance_due, auto_balance, balance_reminder_days, start_date, end_date'

export const cardWords = (a: Row) => (a.stripe_payment_method_id ? `${a.card_brand ? a.card_brand.charAt(0).toUpperCase() + a.card_brand.slice(1) : 'card'} ending ${a.card_last4 || '••••'}` : null)
/** Will the balance be taken from a kept card? Only with the family's agreement, only up to the amount they agreed, and only if the coach left it on. */
export const autoTakes = (camp: Row, a: Row) => !!camp.auto_balance && !!a.stripe_payment_method_id && !!a.stripe_customer_id && !!a.balance_agreed_at && withinAgreed(camp, a)

const helloFor = (a: Row) => (a.parent_name ? `Hi ${first(a.parent_name)},` : 'Hi,')

/** The family's private link to pay the balance. Made the first time it is needed. */
export async function balanceUrl(db: Db, a: Row, origin: string): Promise<string> {
  let token = a.balance_token as string | null
  if (!token) {
    token = randomBytes(18).toString('base64url')
    const { data } = await db.from('coach_camp_attendees').update({ balance_token: token }).eq('id', a.id).is('balance_token', null).select('balance_token')
    if (!data?.length) {
      const { data: again } = await db.from('coach_camp_attendees').select('balance_token').eq('id', a.id).maybeSingle()
      token = (again?.balance_token as string) || token
    }
    a.balance_token = token
  }
  return `${origin}/pay-balance/${token}`
}

/** Email the reminder (what will be taken, or a link to pay) and note that it went. */
export async function remind(db: Db, m: AcademyMoney, camp: Row, a: Row, origin: string): Promise<boolean> {
  const to = String(a.parent_email || '').trim()
  const owed = owedPennies(camp, a)
  if (!to || owed < 50 || !camp.balance_due) return false
  const url = await balanceUrl(db, a, origin)
  const msg = balanceReminder({ hello: helloFor(a), player: first(a.player_name), camp: camp.name, academy: m.academy, who: m.coachName || m.academy, balance: owed, due: camp.balance_due, card: autoTakes(camp, a) ? cardWords(a) : null, url })
  const ok = await sendFamilyEmail(camp.coach_id, { to, subject: msg.subject, html: msg.html, replyTo: m.contactEmail, context: 'coach/camp balance reminder' })
  if (ok) await db.from('coach_camp_attendees').update({ balance_reminded_at: new Date().toISOString() }).eq('id', a.id)
  return ok
}

/**
 * Take the balance from the kept card. Claimed on the attendee first, so the
 * timer and the coach can never take it twice; the Stripe key is the charge
 * row's id, for the same reason one level down. A failed attempt is only tried
 * again by the coach.
 */
export async function takeBalance(db: Db, m: AcademyMoney, camp: Row, a: Row, by: 'auto' | 'coach', origin: string): Promise<{ ok: boolean; error?: string }> {
  if (!m.accountId || !m.chargesEnabled) return { ok: false, error: 'Card payments are not switched on.' }
  if (!autoTakes(camp, a) && by === 'auto') return { ok: false, error: 'No card kept for the balance.' }
  if (!a.stripe_payment_method_id || !a.stripe_customer_id) return { ok: false, error: 'There is no card kept for this family. Send them the link to pay instead.' }
  const owed = owedPennies(camp, a)
  if (owed < 50) return { ok: false, error: 'Nothing is owed on this place.' }
  if (!a.balance_agreed_at) return { ok: false, error: 'They did not agree to the balance being taken from their card. Send them the link to pay instead.' }
  if (!withinAgreed(camp, a)) return { ok: false, error: `The balance is now ${formatPennies(owed)}, more than the ${formatPennies(Number(a.balance_agreed_pennies))} they agreed could be taken from their card. Send them the link to pay instead.` }
  let q = db.from('coach_camp_attendees').update({ balance_status: 'charging', balance_failed_reason: null }).eq('id', a.id)
  q = by === 'coach' ? q.or('balance_status.is.null,balance_status.eq.failed') : q.is('balance_status', null)
  const { data: claimed } = await q.select('id')
  if (!claimed?.length) return { ok: false, error: 'This balance is already being taken, or has been.' }

  const description = `${camp.name} balance · ${a.player_name}`.slice(0, 200)
  const { data: row, error } = await db.from('coach_charges').insert({
    coach_id: camp.coach_id, player_id: a.player_id || null, player_name: a.player_name, kind: 'other', description, amount_pennies: owed, status: 'charging', charged_by: by,
  }).select('id').single()
  if (error || !row) {
    await db.from('coach_camp_attendees').update({ balance_status: null }).eq('id', a.id)
    return { ok: false, error: 'The payment could not be started. Please try again.' }
  }
  const fail = async (why: string) => {
    await db.from('coach_charges').update({ status: 'failed', failure_reason: why, updated_at: new Date().toISOString() }).eq('id', row.id)
    await db.from('coach_camp_attendees').update({ balance_status: 'failed', balance_failed_reason: why, balance_charge_id: row.id }).eq('id', a.id)
    const to = String(a.parent_email || '').trim()
    if (to) {
      const url = await balanceUrl(db, a, origin)
      const msg = balanceFailed({ hello: helloFor(a), player: first(a.player_name), camp: camp.name, academy: m.academy, who: m.coachName || m.academy, balance: owed, url })
      await sendFamilyEmail(camp.coach_id, { to, subject: msg.subject, html: msg.html, replyTo: m.contactEmail, context: 'coach/camp balance failed' }).catch(() => false)
    }
    return { ok: false, error: why }
  }
  try {
    const pi = await stripe.paymentIntents.create({
      amount: owed, currency: 'gbp', customer: a.stripe_customer_id, payment_method: a.stripe_payment_method_id, payment_method_types: ['card'],
      off_session: true, confirm: true, description,
      metadata: { coach_id: camp.coach_id, charge_id: row.id, camp_attendee_id: a.id, kind: 'camp_balance' },
    }, { stripeAccount: m.accountId, idempotencyKey: `lumio-charge-${row.id}` })
    if (pi.status !== 'succeeded') return await fail(pi.status === 'requires_action' ? 'The bank wanted the card holder to confirm the payment themselves. They have been sent a link to pay.' : 'The payment did not go through. They have been sent a link to pay.')
    const now = new Date().toISOString()
    await db.from('coach_charges').update({ status: 'paid', paid_at: now, stripe_payment_intent_id: pi.id, updated_at: now }).eq('id', row.id)
    await db.from('coach_camp_attendees').update({ paid_pennies: paidPennies(camp, a) + owed, paid: true, balance_status: 'paid', balance_charge_id: row.id }).eq('id', a.id)
    const to = String(a.parent_email || '').trim()
    if (to) {
      const msg = balanceTaken({ hello: helloFor(a), player: first(a.player_name), camp: camp.name, academy: m.academy, who: m.coachName || m.academy, balance: owed, card: cardWords(a) || 'card' })
      await sendFamilyEmail(camp.coach_id, { to, subject: msg.subject, html: msg.html, replyTo: m.contactEmail, context: 'coach/camp balance taken' }).catch(() => false)
    }
    return { ok: true }
  } catch (e) {
    const err = e as { code?: string; decline_code?: string }
    return await fail(err.code === 'authentication_required'
      ? 'The bank wanted the card holder to confirm the payment themselves. They have been sent a link to pay.'
      : err.code === 'card_declined' || err.decline_code ? `The card was declined${err.decline_code === 'insufficient_funds' ? ' (not enough money in the account)' : err.decline_code === 'expired_card' ? ' (the card has expired)' : ''}. They have been sent a link to pay.`
      : 'The payment company could not take the payment. They have been sent a link to pay.')
  }
}

/** The timer: reminders a week before, and the balance taken on the day. */
export async function runCampBalances(db: Db, origin: string, budget = 100) {
  const out = { reminded: 0, taken: 0, failed: 0 }
  const today = ukDate()
  const { data: camps } = await db.from('coach_camps').select(CAMP_COLS).eq('payment_mode', 'deposit').not('balance_due', 'is', null).gte('balance_due', addDays(today, -15)).limit(500)
  const money = new Map<string, AcademyMoney>()
  for (const camp of camps || []) {
    if (budget <= 0) break
    const stage = balanceStage(camp, today)
    if (stage !== 'remind' && stage !== 'due') continue
    const { data: people } = await db.from('coach_camp_attendees').select('*').eq('camp_id', camp.id).neq('status', 'cancelled').neq('status', 'pending')
    if (!people?.length) continue
    if (!money.has(camp.coach_id)) money.set(camp.coach_id, await academyMoney(db, camp.coach_id))
    const m = money.get(camp.coach_id)!
    for (const a of people) {
      if (budget <= 0) break
      if (a.paid || owedPennies(camp, a) < 50) continue
      if (stage === 'remind' || (stage === 'due' && !autoTakes(camp, a))) {
        // One reminder: a week before, or on the day when there is no card to take it from.
        if (!a.balance_reminded_at) { budget--; if (await remind(db, m, camp, a, origin)) out.reminded++ }
        continue
      }
      if (a.balance_status) continue   // taken, being taken, or failed (the coach's to retry)
      if (!m.chargesEnabled) continue
      budget--
      const r = await takeBalance(db, m, camp, a, 'auto', origin)
      if (r.ok) out.taken++; else out.failed++
    }
  }
  return out
}

function addDays(iso: string, n: number) {
  const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10)
}

/** After a card or a pay-link payment, keep the card the family paid the deposit with — only if they agreed to the balance being taken from it. */
export async function keepDepositCard(db: Db, accountId: string, attendeeId: string, paymentIntentId: string) {
  const { data: a } = await db.from('coach_camp_attendees').select('id, balance_agreed_at, stripe_payment_method_id').eq('id', attendeeId).maybeSingle()
  if (!a?.balance_agreed_at || a.stripe_payment_method_id) return
  try {
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId, { expand: ['payment_method'] }, { stripeAccount: accountId })
    const pm = pi.payment_method && typeof pi.payment_method !== 'string' ? pi.payment_method : null
    const customer = typeof pi.customer === 'string' ? pi.customer : pi.customer?.id
    if (!pm || pm.type !== 'card' || !customer) return
    await db.from('coach_camp_attendees').update({ stripe_customer_id: customer, stripe_payment_method_id: pm.id, card_brand: pm.card?.brand || null, card_last4: pm.card?.last4 || null }).eq('id', attendeeId)
  } catch (e) { console.error('[camp balance] keep card', e) }
}
