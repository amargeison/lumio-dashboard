import { NextRequest, NextResponse } from 'next/server'
import { stripe, admin } from '../_stripe'

export const runtime = 'nodejs'

// Stripe webhook (register as a CONNECT endpoint so connected-account events arrive).
// Source of truth for "paid": never trust the browser redirect alone.
export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!sig || !secret) return NextResponse.json({ error: 'Webhook not configured' }, { status: 400 })

  const payload = await req.text()
  let event
  try {
    event = stripe.webhooks.constructEvent(payload, sig, secret)
  } catch (e) {
    return NextResponse.json({ error: `Signature check failed: ${e instanceof Error ? e.message : ''}` }, { status: 400 })
  }

  const db = admin()
  try {
    if (event.type === 'checkout.session.completed') {
      const s = event.data.object as { id: string; payment_intent?: string | null; metadata?: Record<string, string> | null }
      await db.from('coach_charges').update({
        status: 'paid', paid_at: new Date().toISOString(),
        stripe_payment_intent_id: (s.payment_intent as string) || null, updated_at: new Date().toISOString(),
      }).eq('stripe_checkout_session_id', s.id)
      // Reconcile: if this checkout was for a specific pack, mark that
      // coach_payments row paid so the tiles / table / dashboard reflect it.
      const paymentId = s.metadata?.payment_id
      const coachId = s.metadata?.coach_id
      if (paymentId && coachId) {
        await db.from('coach_payments').update({ paid: true, paid_at: new Date().toISOString() })
          .eq('id', paymentId).eq('coach_id', coachId)
      }
    } else if (event.type === 'account.updated') {
      const acct = event.data.object as { id: string; charges_enabled: boolean; details_submitted: boolean }
      await db.from('coach_stripe').update({
        charges_enabled: acct.charges_enabled, details_submitted: acct.details_submitted, updated_at: new Date().toISOString(),
      }).eq('stripe_account_id', acct.id)
    }
  } catch (e) {
    console.error('[pay/webhook] handler', e)
  }
  return NextResponse.json({ received: true })
}
