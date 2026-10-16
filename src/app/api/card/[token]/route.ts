import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { publicSiteOrigin } from '@/lib/public-origin'
import { policyTerms, policyText } from '@/lib/coach/cancel-policy'
import { stripe, admin } from '../../coach/pay/_stripe'
import { academyMoney, bacsReady } from '../../coach/pay/_saved'

export const runtime = 'nodejs'

// The client's side of "save your card" — /card/<token>, no account needed.
//
//   GET   what the page shows: whose academy, which player, the policy
//   POST  they have read the policy and said yes: open Stripe's secure page
//
// Nothing about the card passes through Lumio. Stripe's page takes it and
// tells us the result (see ./done and the webhook).

const TOKEN_RE = /^[A-Za-z0-9_-]{12,64}$/
const first = (s: unknown) => String(s || '').trim().split(/\s+/)[0] || ''

async function load(token: string) {
  if (!TOKEN_RE.test(token)) return null
  const db = admin()
  const { data: row } = await db.from('coach_pay_methods').select('*').eq('link_token', token).maybeSingle()
  if (!row) return null
  const { data: player } = await db.from('coach_players').select('id, name, email, parent_email, parent_name, contact_email').eq('id', row.player_id).maybeSingle()
  const m = await academyMoney(db, row.coach_id)
  return { db, row, player, m }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const got = await load(token)
  if (!got || !got.player) return NextResponse.json({ error: 'This link is not valid. Ask your coach to send a new one.' }, { status: 404 })
  const { row, player, m } = got
  if (row.status === 'removed') return NextResponse.json({ error: 'This link is no longer in use. Ask your coach to send a new one.' }, { status: 410 })
  const dd = m.policy.directDebit && !!m.accountId && await bacsReady(m.accountId)
  return NextResponse.json({
    academy: m.academy, logoUrl: m.logoUrl, playerFirst: first(player.name),
    terms: policyTerms(m.policy, m.academy), hours: m.policy.hours, directDebit: dd,
    ready: !!m.accountId && m.chargesEnabled,
    saved: row.status === 'active' ? { kind: row.kind, brand: row.brand, last4: row.last4 } : null,
  })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const got = await load(token)
  if (!got || !got.player) return NextResponse.json({ error: 'This link is not valid. Ask your coach to send a new one.' }, { status: 404 })
  const { db, player, m } = got
  let row = got.row
  if (row.status === 'removed') return NextResponse.json({ error: 'This link is no longer in use. Ask your coach to send a new one.' }, { status: 410 })
  if (!m.accountId || !m.chargesEnabled) return NextResponse.json({ error: `${m.academy} cannot take card details just yet. Please try again later.` }, { status: 400 })

  const b = (await req.json().catch(() => ({}))) as { agree?: boolean; name?: string; method?: string }
  const name = String(b.name || '').trim().slice(0, 80)
  if (b.agree !== true) return NextResponse.json({ error: 'Please read the cancellation policy and tick the box to agree to it.' }, { status: 400 })
  if (name.length < 2) return NextResponse.json({ error: 'Please type your full name.' }, { status: 400 })
  const wantsDd = b.method === 'bacs_debit'
  if (wantsDd && !(m.policy.directDebit && await bacsReady(m.accountId))) return NextResponse.json({ error: 'Direct Debit is not available. Please save a card instead.' }, { status: 400 })

  const email = String(player.parent_email || player.email || player.contact_email || '').trim() || undefined
  try {
    // Saving a NEW card over one already saved is a fresh request, so the old
    // card stays in use until the new one is safely in.
    if (row.status === 'active') {
      const { data: fresh, error } = await db.from('coach_pay_methods').insert({
        coach_id: row.coach_id, player_id: row.player_id, link_token: randomBytes(15).toString('base64url'),
        status: 'invited', stripe_customer_id: row.stripe_customer_id,
      }).select('*').single()
      if (error || !fresh) throw new Error('insert')
      row = fresh
    }
    let customer = row.stripe_customer_id as string | null
    if (!customer) {
      // Any earlier card for this player was saved against a customer already: reuse it.
      const { data: prev } = await db.from('coach_pay_methods').select('stripe_customer_id').eq('player_id', row.player_id)
        .not('stripe_customer_id', 'is', null).order('created_at', { ascending: false }).limit(1)
      customer = (prev?.[0]?.stripe_customer_id as string) || null
    }
    if (!customer) {
      const c = await stripe.customers.create({ name: player.name, email, metadata: { lumio_player_id: player.id, lumio_coach_id: row.coach_id } }, { stripeAccount: m.accountId })
      customer = c.id
    }
    const origin = publicSiteOrigin(new URL(req.url).origin)
    const back = `${origin}/card/${encodeURIComponent(token)}`
    const session = await stripe.checkout.sessions.create({
      mode: 'setup', currency: 'gbp', customer,
      payment_method_types: [wantsDd ? 'bacs_debit' : 'card'],
      success_url: `${back}?done={CHECKOUT_SESSION_ID}`,
      cancel_url: back,
      metadata: { lumio_card_link: row.id, coach_id: row.coach_id, player_id: row.player_id },
    }, { stripeAccount: m.accountId })
    await db.from('coach_pay_methods').update({
      stripe_customer_id: customer, stripe_setup_session_id: session.id,
      policy_text: policyText(m.policy, m.academy), policy_agreed_at: new Date().toISOString(), agreed_by: name,
      updated_at: new Date().toISOString(),
    }).eq('id', row.id)
    return NextResponse.json({ url: session.url })
  } catch (e) {
    console.error('[card] start', e instanceof Error ? e.message : e)
    return NextResponse.json({ error: 'We could not open the secure card page. Please try again.' }, { status: 500 })
  }
}
