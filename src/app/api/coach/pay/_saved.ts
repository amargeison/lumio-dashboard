// Cards and Direct Debits on file: saving one, and taking a lesson's money from it.
//
// Everything happens ON THE COACH'S OWN Stripe account (direct charges, the
// `stripeAccount` option). The client's card is Stripe's to hold; Lumio keeps
// the reference, the last four digits and the record of what they agreed to.
//
// Used by the coach's routes (/api/coach/pay/cards, /charge), the client's link
// (/api/card/<token>), the Stripe webhook and the hourly charge runner — so the
// rules about what may be charged, and how a result is recorded, live here once.

import type Stripe from 'stripe'
import { stripe, admin } from './_stripe'
import { priceFor, type PriceRule } from '@/lib/coach/pricing'
import { readPolicy, type CancelPolicy } from '@/lib/coach/cancel-policy'
import { MAX_AMOUNT_POUNDS } from '@/lib/coach/money'

type Db = ReturnType<typeof admin>

export type AcademyMoney = {
  accountId: string | null
  chargesEnabled: boolean
  settings: Record<string, any>
  policy: CancelPolicy
  academy: string
  logoUrl: string | null
  coachName: string
  contactEmail: string | null
}

/** The academy's Stripe account, its settings and its name: what every card route needs first. */
export async function academyMoney(db: Db, academyId: string): Promise<AcademyMoney> {
  const [{ data: st }, { data: set }, { data: prof }] = await Promise.all([
    db.from('coach_stripe').select('stripe_account_id, charges_enabled').eq('coach_id', academyId).maybeSingle(),
    db.from('coach_settings').select('data').eq('coach_id', academyId).maybeSingle(),
    db.from('sports_profiles').select('brand_name, display_name, brand_logo_url, contact_email').eq('id', academyId).maybeSingle(),
  ])
  const settings = (set?.data as Record<string, any>) || {}
  return {
    accountId: (st?.stripe_account_id as string) || null,
    chargesEnabled: !!st?.charges_enabled,
    settings,
    policy: readPolicy(settings.cancelPolicy),
    academy: (prof?.brand_name as string) || (settings.academy as string) || 'Your coach',
    logoUrl: (prof?.brand_logo_url as string) || null,
    coachName: (prof?.display_name as string) || (settings.coach as string) || '',
    contactEmail: (prof?.contact_email as string) || null,
  }
}

/** Whether the coach's Stripe account can take Direct Debits yet (they switch Bacs on in their own Stripe dashboard). */
export async function bacsReady(accountId: string): Promise<boolean> {
  try {
    const acct = await stripe.accounts.retrieve(accountId)
    return (acct.capabilities as Record<string, string> | undefined)?.bacs_debit_payments === 'active'
  } catch { return false }
}

/** The card or Direct Debit a player has on file now, if any. */
export async function activeMethod(db: Db, academyId: string, playerId: string) {
  const { data } = await db.from('coach_pay_methods').select('*')
    .eq('coach_id', academyId).eq('player_id', playerId).eq('status', 'active')
    .order('saved_at', { ascending: false }).limit(1)
  return (data && data[0]) || null
}

// ── Saving ──────────────────────────────────────────────────────────────────
/**
 * A client finished Stripe's page. Reads the result from Stripe (never from the
 * browser), files the card against the invitation, and retires any card the
 * player had before. Safe to call twice — from the return page and from the
 * webhook — and the second call changes nothing.
 */
export async function finishSetup(db: Db, accountId: string, sessionId: string): Promise<{ ok: boolean; error?: string }> {
  const { data: row } = await db.from('coach_pay_methods').select('*').eq('stripe_setup_session_id', sessionId).maybeSingle()
  if (!row) return { ok: false, error: 'We could not find this card request.' }
  if (row.status === 'active') return { ok: true }
  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['setup_intent', 'setup_intent.payment_method'] }, { stripeAccount: accountId })
  } catch { return { ok: false, error: 'We could not check this with the payment company. Please try again.' } }
  const si = session.setup_intent as Stripe.SetupIntent | null
  if (session.status !== 'complete' || !si || si.status !== 'succeeded' || !si.payment_method) {
    return { ok: false, error: 'Your details were not saved. Please try again.' }
  }
  const pm = (typeof si.payment_method === 'string'
    ? await stripe.paymentMethods.retrieve(si.payment_method, {}, { stripeAccount: accountId })
    : si.payment_method) as Stripe.PaymentMethod
  const kind = pm.type === 'bacs_debit' ? 'bacs_debit' : 'card'
  const now = new Date().toISOString()
  const details = kind === 'card'
    ? { brand: pm.card?.brand || 'card', last4: pm.card?.last4 || null, exp_month: pm.card?.exp_month ?? null, exp_year: pm.card?.exp_year ?? null }
    : { brand: 'Direct Debit', last4: pm.bacs_debit?.last4 || null, exp_month: null, exp_year: null }
  // The older card goes first, so there is never a moment with two "active".
  await db.from('coach_pay_methods').update({ status: 'removed', removed_at: now, updated_at: now })
    .eq('coach_id', row.coach_id).eq('player_id', row.player_id).eq('status', 'active').neq('id', row.id)
  const { error } = await db.from('coach_pay_methods').update({
    status: 'active', kind, stripe_payment_method_id: pm.id, saved_at: now, updated_at: now, ...details,
    agreed_by: row.agreed_by || session.customer_details?.name || session.customer_details?.email || null,
  }).eq('id', row.id)
  if (error) return { ok: false, error: 'Your details were saved with the payment company but not recorded. Please tell your coach.' }
  // So a payment taken later uses this card without naming it again.
  if (row.stripe_customer_id) {
    await stripe.customers.update(row.stripe_customer_id, { invoice_settings: { default_payment_method: pm.id } }, { stripeAccount: accountId }).catch(() => null)
  }
  return { ok: true }
}

// ── Pricing a lesson on the server ──────────────────────────────────────────
/** What a booking costs, worked out the same way the calendar shows it. */
export async function priceBooking(db: Db, academyId: string, settings: Record<string, any>, b: Record<string, any>) {
  let client = null
  if (b.player_id) {
    const { data } = await db.from('coach_players').select('rate_pennies, rate_reason').eq('id', b.player_id).eq('coach_id', academyId).maybeSingle()
    client = data || null
  }
  return priceFor(b, { rules: (settings.priceList as PriceRule[]) || [], client, defaultHourly: Number(settings.privateRate) || 0 })
}

// ── Charging ────────────────────────────────────────────────────────────────
export type ChargeKind = 'lesson' | 'late_cancel' | 'no_show' | 'other' | 'group'
export type ChargeResult =
  | { ok: true; status: 'paid' | 'processing'; chargeId: string }
  | { ok: false; status: 'failed' | 'refused'; error: string; chargeId?: string; needsClient?: boolean }

const KIND_WORDS: Record<ChargeKind, string> = { lesson: 'Lesson', late_cancel: 'Late cancellation', no_show: 'Missed lesson', other: 'Payment', group: 'Group place' }

/**
 * Take money from a player's saved card or Direct Debit, off-session.
 *
 * A charge row is written BEFORE Stripe is asked, as 'charging'. With a lesson
 * attached, the database refuses a second row for the same lesson and reason
 * (migration 210), so two presses, two devices or the runner and the coach at
 * once can never take the money twice. The Stripe idempotency key is that
 * row's id, for the same reason one level down.
 */
export async function chargeSaved(db: Db, m: AcademyMoney, o: {
  academyId: string; playerId: string; playerName: string; amountPennies: number
  kind: ChargeKind; bookingId?: string | null; description?: string; by: 'coach' | 'auto'
  /** A weekly-group answer (migration 214): one payment per answer, not per lesson. */
  replyId?: string | null
  /** A pack or invoice on the Payments page (migration 215): marked paid when the money is in. */
  paymentId?: string | null
}): Promise<ChargeResult> {
  if (!m.accountId || !m.chargesEnabled) return { ok: false, status: 'refused', error: 'Card payments are not switched on yet. Connect your bank in Settings → Pricing & packages.' }
  const amount = Math.round(o.amountPennies)
  if (!Number.isFinite(amount) || amount < 50) return { ok: false, status: 'refused', error: 'A payment has to be at least £0.50.' }
  if (amount > MAX_AMOUNT_POUNDS * 100) return { ok: false, status: 'refused', error: 'That amount is too large. Check it and try again.' }
  const method = await activeMethod(db, o.academyId, o.playerId)
  if (!method?.stripe_payment_method_id || !method.stripe_customer_id) {
    return { ok: false, status: 'refused', error: `${o.playerName} has no card or Direct Debit saved. Send them a card link first.` }
  }
  const description = (o.description || `${KIND_WORDS[o.kind]} · ${o.playerName}`).slice(0, 200)
  const { data: row, error: insErr } = await db.from('coach_charges').insert({
    coach_id: o.academyId, player_id: o.playerId, player_name: o.playerName, booking_id: o.bookingId || null,
    kind: o.kind, method_id: method.id, description, amount_pennies: amount, status: 'charging', charged_by: o.by,
    ...(o.replyId ? { reply_id: o.replyId } : {}),
    ...(o.paymentId ? { payment_id: o.paymentId } : {}),
  }).select('id').single()
  if (insErr || !row) {
    // 23505: the lesson already has a charge for this reason in hand or paid.
    if ((insErr as { code?: string } | null)?.code === '23505') return { ok: false, status: 'refused', error: 'This has already been charged.' }
    return { ok: false, status: 'refused', error: 'The payment could not be started. Please try again.' }
  }
  return askStripe(db, m, { id: row.id, coach_id: o.academyId, player_id: o.playerId, player_name: o.playerName, booking_id: o.bookingId || null, kind: o.kind, amount_pennies: amount, description, payment_id: o.paymentId || null }, method)
}

/** The exact request for one charge row. Built the same way every time, so asking again with the same idempotency key gets Stripe's first answer back. */
function piParams(c: ChargeRow, method: Record<string, any>): Stripe.PaymentIntentCreateParams {
  return {
    amount: c.amount_pennies, currency: 'gbp', customer: method.stripe_customer_id, payment_method: method.stripe_payment_method_id,
    payment_method_types: [method.kind === 'bacs_debit' ? 'bacs_debit' : 'card'],
    off_session: true, confirm: true, description: c.description,
    metadata: { coach_id: c.coach_id, charge_id: c.id, player_id: c.player_id, ...(c.booking_id ? { booking_id: c.booking_id } : {}), ...(c.payment_id ? { payment_id: c.payment_id } : {}), kind: c.kind },
  }
}

type ChargeRow = { id: string; coach_id: string; player_id: string; player_name: string; booking_id: string | null; kind: ChargeKind; amount_pennies: number; description: string; payment_id?: string | null }

/**
 * Ask Stripe for one charge row and record the answer. Also how a row left at
 * 'charging' (the server stopped mid-way) is finished: the same request with
 * the same key returns what Stripe did the first time, so it cannot charge twice.
 */
export async function askStripe(db: Db, m: AcademyMoney, c: ChargeRow, method: Record<string, any>): Promise<ChargeResult> {
  const row = c
  const o = { playerName: c.player_name || 'This player' }
  const done = async (patch: Record<string, unknown>) =>
    db.from('coach_charges').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', row.id)
  try {
    const pi = await stripe.paymentIntents.create(piParams(c, method), { stripeAccount: m.accountId!, idempotencyKey: `lumio-charge-${row.id}` })
    if (pi.status === 'succeeded') {
      await done({ status: 'paid', paid_at: new Date().toISOString(), stripe_payment_intent_id: pi.id })
      if (c.payment_id) await settleInvoice(db, row.id)
      return { ok: true, status: 'paid', chargeId: row.id }
    }
    if (pi.status === 'processing') {
      // A Direct Debit takes about three working days; the webhook finishes it.
      await done({ status: 'processing', stripe_payment_intent_id: pi.id })
      return { ok: true, status: 'processing', chargeId: row.id }
    }
    const why = pi.status === 'requires_action'
      ? `${o.playerName}'s bank wants them to confirm this payment themselves. Send them a payment link instead.`
      : 'The payment did not go through.'
    await done({ status: 'failed', failure_reason: why, stripe_payment_intent_id: pi.id })
    return { ok: false, status: 'failed', error: why, chargeId: row.id, needsClient: pi.status === 'requires_action' }
  } catch (e) {
    const err = e as { code?: string; decline_code?: string; message?: string; raw?: { payment_intent?: { id?: string } } }
    const needsClient = err.code === 'authentication_required'
    const why = needsClient
      ? `${o.playerName}'s bank wants them to confirm this payment themselves. Send them a payment link instead.`
      : err.code === 'card_declined' || err.decline_code
        ? `${o.playerName}'s card was declined${err.decline_code === 'insufficient_funds' ? ' (not enough money in the account)' : err.decline_code === 'expired_card' ? ' (the card has expired)' : ''}. Ask them to save a new card, or send a payment link.`
        : 'The payment company could not take this payment. Please try again.'
    await done({ status: 'failed', failure_reason: why, stripe_payment_intent_id: err.raw?.payment_intent?.id || null })
    return { ok: false, status: 'failed', error: why, chargeId: row.id, needsClient }
  }
}

/** Give money back from a charge: all of it, or part. */
export async function refundCharge(db: Db, m: AcademyMoney, academyId: string, chargeId: string, pennies?: number): Promise<{ ok: boolean; error?: string; refunded?: number }> {
  if (!m.accountId) return { ok: false, error: 'Card payments are not switched on.' }
  const { data: c } = await db.from('coach_charges').select('*').eq('id', chargeId).eq('coach_id', academyId).maybeSingle()
  if (!c) return { ok: false, error: 'We could not find that payment.' }
  if (c.status !== 'paid' || !c.stripe_payment_intent_id) return { ok: false, error: c.status === 'refunded' ? 'That payment has already been refunded.' : 'Only a payment that has gone through can be refunded.' }
  const left = c.amount_pennies - (c.refunded_pennies || 0)
  const amount = pennies == null ? left : Math.round(pennies)
  if (!(amount >= 1 && amount <= left)) return { ok: false, error: `You can refund up to £${(left / 100).toFixed(2)}.` }
  try {
    await stripe.refunds.create({ payment_intent: c.stripe_payment_intent_id, amount, metadata: { charge_id: c.id } },
      { stripeAccount: m.accountId, idempotencyKey: `lumio-refund-${c.id}-${(c.refunded_pennies || 0) + amount}` })
  } catch (e) { return { ok: false, error: (e as Error)?.message || 'The refund did not go through.' } }
  const total = (c.refunded_pennies || 0) + amount
  await db.from('coach_charges').update({ refunded_pennies: total, ...(total >= c.amount_pennies ? { status: 'refunded' } : {}), updated_at: new Date().toISOString() }).eq('id', c.id)
  return { ok: true, refunded: amount }
}

/**
 * A pack or invoice paid from a saved card: tick it paid once the money is in.
 * Only when the charge is for exactly what the invoice is for — the same check
 * the payment-link route makes — so a different sum never settles it.
 */
export async function settleInvoice(db: Db, chargeId: string): Promise<void> {
  const { data: c } = await db.from('coach_charges').select('coach_id, payment_id, amount_pennies, status').eq('id', chargeId).maybeSingle()
  if (!c?.payment_id || c.status !== 'paid') return
  const { data: inv } = await db.from('coach_payments').select('amount, paid, status').eq('id', c.payment_id).eq('coach_id', c.coach_id).maybeSingle()
  if (!inv || inv.paid || Math.round(Number(inv.amount) * 100) !== c.amount_pennies) return
  await db.from('coach_payments').update({ paid: true, paid_at: new Date().toISOString(), ...(inv.status === 'overdue' ? { status: 'active' } : {}) })
    .eq('id', c.payment_id).eq('coach_id', c.coach_id)
}
