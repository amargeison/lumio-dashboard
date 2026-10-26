import { NextRequest, NextResponse } from 'next/server'
import { publicSiteOrigin } from '@/lib/public-origin'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { stripe, admin } from '@/app/api/coach/pay/_stripe'
import { academyMoney } from '@/app/api/coach/pay/_saved'
import { owedPennies } from '@/lib/coach/camp-money'
import { CAMP_COLS, autoTakes, cardWords } from '@/lib/coach/camp-balance-server'
import { dayWords } from '@/lib/coach/camp-balance'

export const runtime = 'nodejs'

// A family's link to pay a camp or holiday balance — /pay-balance/<token>.
//
//   GET   what is owed, when, and whether it is already paid
//   POST  open a card payment page for exactly what is owed
//
// The place is ticked paid by the Stripe webhook when the money is in, never
// by the browser coming back.

const TOKEN_RE = /^[A-Za-z0-9_-]{16,64}$/
const first = (s: unknown) => String(s || '').trim().split(/\s+/)[0] || ''

async function load(token: string) {
  if (!TOKEN_RE.test(token)) return null
  const db = admin()
  const { data: a } = await db.from('coach_camp_attendees').select('*').eq('balance_token', token).maybeSingle()
  if (!a) return null
  const { data: camp } = await db.from('coach_camps').select(CAMP_COLS).eq('id', a.camp_id).maybeSingle()
  if (!camp) return null
  const m = await academyMoney(db, camp.coach_id)
  return { db, a, camp, m }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const g = await load(token)
  if (!g) return NextResponse.json({ error: 'This link is not valid. Ask your coach to send it again.' }, { status: 404 })
  const owed = owedPennies(g.camp, g.a)
  return NextResponse.json({
    academy: g.m.academy, logoUrl: g.m.logoUrl, camp: g.camp.name, player: first(g.a.player_name),
    owed, due: g.camp.balance_due ? dayWords(g.camp.balance_due) : null, cancelled: g.a.status === 'cancelled',
    card: autoTakes(g.camp, g.a) && g.a.balance_status !== 'failed' ? cardWords(g.a) : null,
    ready: !!g.m.accountId && g.m.chargesEnabled,
    room: g.a.extra_label && Number(g.a.extra_pennies) > 0 ? { label: String(g.a.extra_label), pennies: Number(g.a.extra_pennies) } : null,
  })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const limit = rateLimit(`pay-balance:${clientIp(req.headers)}`, 15, 10 * 60_000)
  if (!limit.ok) return NextResponse.json({ error: 'Too many tries. Please wait a few minutes.' }, { status: 429 })
  const g = await load(token)
  if (!g) return NextResponse.json({ error: 'This link is not valid.' }, { status: 404 })
  const { db, a, camp, m } = g
  if (a.status === 'cancelled') return NextResponse.json({ error: 'This place has been cancelled.' }, { status: 400 })
  if (a.balance_status === 'charging') return NextResponse.json({ error: 'Your balance is being taken from your card right now. Refresh in a minute.' }, { status: 409 })
  const owed = owedPennies(camp, a)
  if (owed < 50) return NextResponse.json({ error: 'There is nothing left to pay. Thank you!' }, { status: 400 })
  if (!m.accountId || !m.chargesEnabled) return NextResponse.json({ error: `${m.academy} cannot take card payments just yet. Please contact them.` }, { status: 400 })
  const back = `${publicSiteOrigin(new URL(req.url).origin)}/pay-balance/${token}`
  try {
    const s = await stripe.checkout.sessions.create({
      mode: 'payment', customer_email: a.parent_email || undefined,
      line_items: [{ price_data: { currency: 'gbp', product_data: { name: `${camp.name} — balance for ${a.player_name}` }, unit_amount: owed }, quantity: 1 }],
      success_url: `${back}?paid=1`, cancel_url: back,
      metadata: { coach_id: camp.coach_id, camp_attendee_id: a.id, camp_id: camp.id, camp_balance: '1' },
    }, { stripeAccount: m.accountId })
    await db.from('coach_charges').insert({
      coach_id: camp.coach_id, player_id: a.player_id || null, player_name: a.player_name, kind: 'other',
      description: `${camp.name} balance · ${a.player_name}`, amount_pennies: owed, status: 'pending', stripe_checkout_session_id: s.id, charged_by: 'client',
    })
    return NextResponse.json({ url: s.url })
  } catch (e) {
    console.error('[pay-balance]', e)
    return NextResponse.json({ error: 'The payment page could not be opened. Please try again.' }, { status: 500 })
  }
}
