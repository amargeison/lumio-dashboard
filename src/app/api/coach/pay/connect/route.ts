import { NextRequest, NextResponse } from 'next/server'
import { stripe, getCoach, admin } from '../_stripe'
import { publicSiteOrigin } from '@/lib/public-origin'

export const runtime = 'nodejs'

// Get-or-create the coach's Stripe Express account and return a hosted onboarding link.
export async function POST(req: NextRequest) {
  const user = await getCoach()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: 'Payments not configured yet' }, { status: 500 })

  const { returnPath = '/' } = (await req.json().catch(() => ({}))) as { returnPath?: string }
  // Stripe sends the coach BACK here after they enter their bank details, so an
  // internal origin does not merely look wrong — it strands them on a dead URL at
  // the end of onboarding, with a Stripe account that exists but no way back.
  const origin = publicSiteOrigin(new URL(req.url).origin)
  const db = admin()

  try {
    const { data: row } = await db.from('coach_stripe').select('*').eq('coach_id', user.id).maybeSingle()
    let accountId = row?.stripe_account_id as string | undefined

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express', country: 'GB', email: user.email ?? undefined,
        business_type: 'individual',
        capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
      })
      accountId = account.id
      await db.from('coach_stripe').upsert({ coach_id: user.id, stripe_account_id: accountId, updated_at: new Date().toISOString() })
    }

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}${returnPath}`,
      return_url: `${origin}${returnPath}`,
      type: 'account_onboarding',
    })
    return NextResponse.json({ url: link.url })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Could not start onboarding' }, { status: 500 })
  }
}
