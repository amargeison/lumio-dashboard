import { NextResponse } from 'next/server'
import { stripe, getCoach, admin } from '../_stripe'

export const runtime = 'nodejs'

// Whether the coach can take payments yet (refreshes charges_enabled from Stripe).
export async function GET() {
  const user = await getCoach()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ connected: false, chargesEnabled: false })

  const db = admin()
  const { data: row } = await db.from('coach_stripe').select('*').eq('coach_id', user.id).maybeSingle()
  if (!row?.stripe_account_id) return NextResponse.json({ connected: false, chargesEnabled: false })

  try {
    const acct = await stripe.accounts.retrieve(row.stripe_account_id)
    await db.from('coach_stripe').update({
      charges_enabled: acct.charges_enabled, details_submitted: acct.details_submitted, updated_at: new Date().toISOString(),
    }).eq('coach_id', user.id)
    return NextResponse.json({ connected: true, chargesEnabled: acct.charges_enabled, detailsSubmitted: acct.details_submitted })
  } catch (e) {
    return NextResponse.json({ connected: true, chargesEnabled: !!row.charges_enabled, error: e instanceof Error ? e.message : 'lookup failed' })
  }
}
