import { NextRequest, NextResponse } from 'next/server'
import { publicSiteOrigin } from '@/lib/public-origin'
import { policyTerms } from '@/lib/coach/cancel-policy'
import { admin } from '../../coach/pay/_stripe'
import { academyMoney, bacsReady, startCardSetup } from '../../coach/pay/_saved'

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
  const { db, player, m, row } = got
  if (row.status === 'removed') return NextResponse.json({ error: 'This link is no longer in use. Ask your coach to send a new one.' }, { status: 410 })
  if (!m.accountId || !m.chargesEnabled) return NextResponse.json({ error: `${m.academy} cannot take card details just yet. Please try again later.` }, { status: 400 })

  const b = (await req.json().catch(() => ({}))) as { agree?: boolean; name?: string; method?: string }
  const name = String(b.name || '').trim().slice(0, 80)
  if (b.agree !== true) return NextResponse.json({ error: 'Please read the cancellation policy and tick the box to agree to it.' }, { status: 400 })
  if (name.length < 2) return NextResponse.json({ error: 'Please type your full name.' }, { status: 400 })
  const wantsDd = b.method === 'bacs_debit'
  if (wantsDd && !(m.policy.directDebit && await bacsReady(m.accountId))) return NextResponse.json({ error: 'Direct Debit is not available. Please save a card instead.' }, { status: 400 })

  const origin = publicSiteOrigin(new URL(req.url).origin)
  const r = await startCardSetup(db, m, row, player, { name, method: wantsDd ? 'bacs_debit' : 'card', back: `${origin}/card/${encodeURIComponent(token)}` })
  return r.url ? NextResponse.json({ url: r.url }) : NextResponse.json({ error: r.error }, { status: 500 })
}
