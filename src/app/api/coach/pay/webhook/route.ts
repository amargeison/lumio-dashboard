import { NextRequest, NextResponse } from 'next/server'
import { stripe, admin } from '../_stripe'
import { sendCampSignupEmails } from '@/lib/coach/camp-signup-email'

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
      // Public camp sign-up: the place is only HELD once the money is in, so the
      // attendee sits at 'pending' until this fires. Keyed off the session id as
      // well as the metadata, because the webhook is the only trustworthy signal —
      // never the browser redirect, which a parent can simply not follow.
      const attendeeId = s.metadata?.camp_attendee_id
      if (attendeeId) {
        const { data: att } = await db.from('coach_camp_attendees')
          .update({ status: 'confirmed', paid: true })
          // The status filter is what makes this idempotent — see the note below.
          .eq('id', attendeeId).eq('stripe_session_id', s.id).eq('status', 'pending')
          .select('*').maybeSingle()
        // Only email on the transition. If Stripe redelivers this event — and it
        // does — the row is already confirmed, the update matches nothing, and no
        // second confirmation goes out.
        if (att) await notifyCampSignup(db, att)
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

// ── Camp sign-up confirmation ────────────────────────────────────────────────
// Sent from the webhook rather than the sign-up route, because a place is only
// held once Stripe says the money is in — and the browser redirect after payment
// is not proof of that. A parent who closes the tab still gets their email.
async function notifyCampSignup(db: ReturnType<typeof admin>, att: Record<string, any>) {
  try {
    const [{ data: camp }, { data: prof }] = await Promise.all([
      db.from('coach_camps').select('name, start_date, end_date, location, region, payment_mode').eq('id', att.camp_id).maybeSingle(),
      db.from('sports_profiles').select('brand_name, brand_logo_url, display_name, contact_email').eq('id', att.coach_id).maybeSingle(),
    ])
    if (!camp || !att.parent_email) return
    await sendCampSignupEmails(att.coach_id, {
      academy: prof?.brand_name || 'Tennis camp', logoUrl: prof?.brand_logo_url,
      coachName: prof?.display_name, coachEmail: prof?.contact_email,
      campName: camp.name, startDate: camp.start_date, endDate: camp.end_date,
      location: [camp.location, camp.region].filter(Boolean).join(', ') || null,
      playerName: att.player_name, parentName: att.parent_name, parentEmail: att.parent_email,
      parentPhone: att.parent_phone, playerAge: att.player_age,
      medicalNotes: att.medical_notes, emergencyContact: att.emergency_contact,
      consentPhoto: !!att.consent_photo, consentMedical: !!att.consent_medical,
      amountPennies: att.amount_pennies || 0, paymentMode: camp.payment_mode || 'full', paid: true,
    })
  } catch (e) { console.error('[pay/webhook] camp signup email', e) }
}
