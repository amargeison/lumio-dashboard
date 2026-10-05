import { NextRequest, NextResponse } from 'next/server'
import { isAcademyUser, notAnAcademy } from '@/lib/coach/academy-guard'
import { stripe, getCoach, admin, getAcademy, assertOwnPlayer } from '../_stripe'
import { publicSiteOrigin } from '@/lib/public-origin'
import { isUuid } from '@/lib/coach/membership'
import { MAX_AMOUNT_POUNDS } from '@/lib/coach/money'

export const runtime = 'nodejs'

// Create a Checkout Session ON the coach's connected account (direct charge) so the
// money settles to their bank. Records a pending coach_charges row.
export async function POST(req: NextRequest) {
  const user = await getCoach()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  // A demo account is signed in too. Only a real academy may use this.
  if (!await isAcademyUser(user.id)) return notAnAcademy()

  const { amount, description = 'Tennis coaching', player_name = null, package_id = null, payment_id = null, returnPath = '/' } =
    (await req.json().catch(() => ({}))) as { amount: number; description?: string; player_name?: string | null; package_id?: string | null; payment_id?: string | null; returnPath?: string }

  const pennies = Math.round(Number(amount) * 100)
  if (!Number.isFinite(pennies) || pennies < 50) return NextResponse.json({ error: 'Enter an amount of at least £0.50' }, { status: 400 })
  if (pennies > MAX_AMOUNT_POUNDS * 100) return NextResponse.json({ error: 'That amount is too large. Check it and try again.' }, { status: 400 })

  // The academy's account takes the money, whoever is holding the phone. An
  // assistant coach can only charge for one of their own players.
  const who = await getAcademy(user.id)
  if (!who) return NextResponse.json({ error: 'We could not find your academy.' }, { status: 403 })
  const academyId = who.academyId
  const db = admin()

  // Collecting a SPECIFIC invoice. The webhook marks that invoice paid when
  // the money lands, so everything about it is checked here, against the
  // database, before a checkout exists: it is this academy's, it is still
  // unpaid, the amount is exactly what is owed, and it belongs to the player
  // named. Until now the id was passed through unchecked — a £20 checkout for
  // one player could carry the id of somebody else's £360 invoice and settle it.
  // There is no part-paid state on an invoice, so a part-payment against one is
  // refused; a part-payment is taken as a payment with no invoice attached.
  let playerName: string | null = typeof player_name === 'string' && player_name.trim() ? player_name.trim() : null
  if (payment_id) {
    const refuse = (error: string, status = 400) => NextResponse.json({ error }, { status })
    if (!isUuid(payment_id)) return refuse('We could not find that invoice. Refresh the page and try again.', 404)
    const { data: inv } = await db.from('coach_payments')
      .select('id, coach_id, player_id, player_name, amount, paid').eq('id', payment_id).eq('coach_id', academyId).maybeSingle()
    if (!inv) return refuse('We could not find that invoice. Refresh the page and try again.', 404)
    if (who.staffId) {
      // Whose invoice it is comes first, so a coach learns nothing about an
      // invoice that is not theirs. By the invoice's player ID — two players
      // can share a name.
      const { data: pl } = inv.player_id
        ? await db.from('coach_players').select('id').eq('id', inv.player_id).eq('coach_id', academyId).eq('staff_id', who.staffId).maybeSingle()
        : { data: null }
      if (!pl) return refuse('Choose one of your own players to take a payment.', 403)
    }
    if (inv.paid) return refuse('That invoice is already marked paid.')
    if (Math.round(Number(inv.amount) * 100) !== pennies) return refuse('The amount has to match what is owed on that invoice. To take a different amount, use Take a payment without choosing an invoice.')
    const same = (a?: string | null, b?: string | null) => (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase()
    if (playerName && !same(playerName, inv.player_name)) return refuse('That invoice belongs to a different player. Refresh the page and try again.')
    playerName = inv.player_name || playerName
  } else if (who.staffId && !(await assertOwnPlayer(who.academyId, who.staffId, playerName))) {
    return NextResponse.json({ error: 'Choose one of your own players to take a payment.' }, { status: 403 })
  }
  // Stripe sends the payer back to this path on OUR site. Anything that is not
  // a plain path on this site ("//elsewhere", ".evil.example") becomes "/".
  const backTo = typeof returnPath === 'string' && /^\/(?!\/)[\w\-./%]*$/.test(returnPath) ? returnPath : '/'

  const { data: row } = await db.from('coach_stripe').select('*').eq('coach_id', academyId).maybeSingle()
  if (!row?.stripe_account_id || !row.charges_enabled) return NextResponse.json({ error: who.staffId ? 'Card payments aren’t switched on for the academy yet — ask your head coach.' : 'Connect your bank first (Settings → Payments & Packages).' }, { status: 400 })

  const origin = publicSiteOrigin(new URL(req.url).origin)
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price_data: { currency: 'gbp', product_data: { name: description }, unit_amount: pennies }, quantity: 1 }],
      success_url: `${origin}${backTo}?paid=1`,
      cancel_url: `${origin}${backTo}?paid=0`,
      // Carry the reconciliation link so the webhook can mark the actual pack paid.
      metadata: { coach_id: academyId, ...(payment_id ? { payment_id } : {}), ...(package_id ? { package_id } : {}), ...(playerName ? { player_name: playerName } : {}) },
      // application_fee_amount: 0,  // no per-transaction Lumio fee — payments are plan-gated
    }, { stripeAccount: row.stripe_account_id })

    await db.from('coach_charges').insert({
      coach_id: academyId, player_name: playerName, package_id, description, amount_pennies: pennies,
      status: 'pending', stripe_checkout_session_id: session.id,
    })
    return NextResponse.json({ url: session.url })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Could not start payment' }, { status: 500 })
  }
}
