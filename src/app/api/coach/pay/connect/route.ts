import { NextRequest, NextResponse } from 'next/server'
import { isAcademyUser, notAnAcademy } from '@/lib/coach/academy-guard'
import { stripe, getCoach, admin, getAcademy } from '../_stripe'
import { publicSiteOrigin } from '@/lib/public-origin'

export const runtime = 'nodejs'

// Get-or-create the coach's Stripe Express account and return a hosted onboarding link.
export async function POST(req: NextRequest) {
  const user = await getCoach()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  // A demo account is signed in too. Only a real academy may use this.
  if (!await isAcademyUser(user.id)) return notAnAcademy()
  // The academy's bank is the head coach's to connect. An assistant got as far
  // as creating a Stripe account under their own id — one the academy would
  // never be paid through and nobody would know existed.
  const who = await getAcademy(user.id)
  if (!who || who.staffId || who.academyId !== user.id) {
    return NextResponse.json({ error: 'Only the head coach can connect the academy’s bank.' }, { status: 403 })
  }
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: 'Payments not configured yet' }, { status: 500 })

  const { returnPath = '/' } = (await req.json().catch(() => ({}))) as { returnPath?: string }
  // Stripe sends the coach BACK here after they enter their bank details, so an
  // internal origin does not merely look wrong — it strands them on a dead URL at
  // the end of onboarding, with a Stripe account that exists but no way back.
  const origin = publicSiteOrigin(new URL(req.url).origin)
  const backTo = typeof returnPath === 'string' && /^\/(?!\/)[\w\-./%]*$/.test(returnPath) ? returnPath : '/'
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
      refresh_url: `${origin}${backTo}`,
      return_url: `${origin}${backTo}`,
      type: 'account_onboarding',
    })
    return NextResponse.json({ url: link.url })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Could not start onboarding' }, { status: 500 })
  }
}
