import { NextRequest, NextResponse } from 'next/server'
import { stripe, getCoach, admin } from '../_stripe'

export const runtime = 'nodejs'

// Create a Checkout Session ON the coach's connected account (direct charge) so the
// money settles to their bank. Records a pending coach_charges row.
export async function POST(req: NextRequest) {
  const user = await getCoach()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const { amount, description = 'Tennis coaching', player_name = null, package_id = null, payment_id = null, returnPath = '/' } =
    (await req.json().catch(() => ({}))) as { amount: number; description?: string; player_name?: string | null; package_id?: string | null; payment_id?: string | null; returnPath?: string }

  const pennies = Math.round(Number(amount) * 100)
  if (!pennies || pennies < 50) return NextResponse.json({ error: 'Enter an amount of at least £0.50' }, { status: 400 })

  const db = admin()
  const { data: row } = await db.from('coach_stripe').select('*').eq('coach_id', user.id).maybeSingle()
  if (!row?.stripe_account_id || !row.charges_enabled) return NextResponse.json({ error: 'Connect your bank first (Settings → Payments & Packages).' }, { status: 400 })

  const origin = new URL(req.url).origin
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price_data: { currency: 'gbp', product_data: { name: description }, unit_amount: pennies }, quantity: 1 }],
      success_url: `${origin}${returnPath}?paid=1`,
      cancel_url: `${origin}${returnPath}?paid=0`,
      // Carry the reconciliation link so the webhook can mark the actual pack paid.
      metadata: { coach_id: user.id, ...(payment_id ? { payment_id } : {}), ...(package_id ? { package_id } : {}), ...(player_name ? { player_name } : {}) },
      // application_fee_amount: 0,  // no per-transaction Lumio fee — payments are plan-gated
    }, { stripeAccount: row.stripe_account_id })

    await db.from('coach_charges').insert({
      coach_id: user.id, player_name, package_id, description, amount_pennies: pennies,
      status: 'pending', stripe_checkout_session_id: session.id,
    })
    return NextResponse.json({ url: session.url })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Could not start payment' }, { status: 500 })
  }
}
