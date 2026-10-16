import { NextRequest, NextResponse } from 'next/server'
import { admin } from '../../../coach/pay/_stripe'
import { academyMoney, finishSetup } from '../../../coach/pay/_saved'

export const runtime = 'nodejs'

// The client is back from Stripe's page. Whether the card was saved is read
// from Stripe, not taken from the address bar; the webhook does the same thing
// independently, so a client who closes the tab early still has their card filed.

const TOKEN_RE = /^[A-Za-z0-9_-]{12,64}$/

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const { sessionId } = (await req.json().catch(() => ({}))) as { sessionId?: string }
  if (!TOKEN_RE.test(token) || typeof sessionId !== 'string' || !/^cs_[A-Za-z0-9_]{6,200}$/.test(sessionId)) {
    return NextResponse.json({ error: 'This link is not valid.' }, { status: 400 })
  }
  const db = admin()
  const { data: link } = await db.from('coach_pay_methods').select('coach_id, player_id').eq('link_token', token).maybeSingle()
  const { data: row } = await db.from('coach_pay_methods').select('coach_id, player_id, status, kind, brand, last4').eq('stripe_setup_session_id', sessionId).maybeSingle()
  // The session must be for the same player as the link it came back to.
  if (!link || !row || row.coach_id !== link.coach_id || row.player_id !== link.player_id) {
    return NextResponse.json({ error: 'We could not match this to your coach’s request.' }, { status: 404 })
  }
  const m = await academyMoney(db, row.coach_id)
  if (!m.accountId) return NextResponse.json({ error: 'Card payments are not switched on.' }, { status: 400 })
  const r = await finishSetup(db, m.accountId, sessionId)
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 })
  const { data: saved } = await db.from('coach_pay_methods').select('kind, brand, last4').eq('stripe_setup_session_id', sessionId).maybeSingle()
  return NextResponse.json({ ok: true, saved, academy: m.academy })
}
