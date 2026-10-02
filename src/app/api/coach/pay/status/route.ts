import { NextResponse } from 'next/server'
import { stripe, getCoach, admin, getAcademy } from '../_stripe'

export const runtime = 'nodejs'

// Whether the coach can take payments yet (refreshes charges_enabled from Stripe).
export async function GET() {
  const user = await getCoach()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ connected: false, chargesEnabled: false })

  // An assistant coach takes payments into the academy's account, so they see
  // the academy's status.
  const academyId = (await getAcademy(user.id))?.academyId ?? user.id
  const db = admin()
  const { data: row } = await db.from('coach_stripe').select('*').eq('coach_id', academyId).maybeSingle()
  if (!row?.stripe_account_id) return NextResponse.json({ connected: false, chargesEnabled: false })

  try {
    const acct = await stripe.accounts.retrieve(row.stripe_account_id)
    await db.from('coach_stripe').update({
      charges_enabled: acct.charges_enabled, details_submitted: acct.details_submitted, updated_at: new Date().toISOString(),
    }).eq('coach_id', academyId)
    return NextResponse.json({ connected: true, chargesEnabled: acct.charges_enabled, detailsSubmitted: acct.details_submitted })
  } catch (e) {
    return NextResponse.json({ connected: true, chargesEnabled: !!row.charges_enabled, error: e instanceof Error ? e.message : 'lookup failed' })
  }
}
