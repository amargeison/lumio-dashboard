import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { isAcademyUser, notAnAcademy } from '@/lib/coach/academy-guard'
import { coachGate, isUuid } from '@/lib/coach/membership'
import { publicSiteOrigin } from '@/lib/public-origin'
import { sendAsCoach } from '@/lib/coach/mail'
import { sendEmail } from '@/lib/emails/send'
import { stripe, admin } from '../_stripe'
import { academyMoney } from '../_saved'

export const runtime = 'nodejs'

// Cards and Direct Debits on file, from the coach's side.
//
//   GET     who has a card saved, who has been sent a link, and recent charges
//   POST    send (or copy) a player's "save your card" link
//   DELETE  take a saved card off file
//
// The academy is the one whose portal the coach is in (coachGate). An invited
// coach sees and acts for their own players only — the line their roster draws.

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const newToken = () => randomBytes(15).toString('base64url')

async function gate() {
  const who = await coachGate()
  if (!who.ok) return { res: NextResponse.json({ error: who.error }, { status: who.status }) }
  if (!await isAcademyUser(who.userId)) return { res: notAnAcademy() }
  return { who, academyId: who.seat.academyId, mine: who.seat.isHead ? null : who.seat.staffId }
}

/** The ids of this coach's own players, or null for the head coach (all of them). */
async function ownPlayers(db: ReturnType<typeof admin>, academyId: string, mine: string | null): Promise<Set<string> | null> {
  if (!mine) return null
  const { data } = await db.from('coach_players').select('id').eq('coach_id', academyId).eq('staff_id', mine)
  return new Set((data || []).map((p: { id: string }) => p.id))
}

export async function GET(req: NextRequest) {
  const g = await gate(); if ('res' in g) return g.res
  const db = admin()
  const own = await ownPlayers(db, g.academyId, g.mine)
  const since = new Date(Date.now() - 120 * 86_400_000).toISOString()
  const [{ data: methods }, { data: charges }, m] = await Promise.all([
    db.from('coach_pay_methods')
      .select('id, player_id, status, kind, brand, last4, exp_month, exp_year, saved_at, link_token, link_sent_to, link_sent_at, policy_agreed_at, agreed_by, created_at')
      .eq('coach_id', g.academyId).neq('status', 'removed').order('created_at', { ascending: false }),
    db.from('coach_charges')
      .select('*')
      .eq('coach_id', g.academyId).gte('created_at', since).order('created_at', { ascending: false }).limit(400),
    academyMoney(db, g.academyId),
  ])
  const origin = publicSiteOrigin(new URL(req.url).origin)
  const mineOnly = <T extends { player_id?: string | null }>(rows: T[]) => (own ? rows.filter(r => r.player_id && own.has(r.player_id)) : rows)
  return NextResponse.json({
    connected: !!m.accountId, chargesEnabled: m.chargesEnabled,
    methods: mineOnly(methods || []).map(({ link_token, ...r }: any) => ({ ...r, url: `${origin}/card/${link_token}` })),
    // '*' so the list still loads before migration 214 adds reply_id; Stripe's own references stay on the server.
    charges: mineOnly(charges || []).map(({ stripe_payment_intent_id, stripe_checkout_session_id, method_id, ...c }: any) => c),
  })
}

function inviteHtml(o: { academy: string; logoUrl: string | null; hello: string; forName: string | null; url: string; hours: number; dd: boolean }) {
  return `<!doctype html><html><body style="margin:0;background:#eef0f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:26px 18px">
    ${o.logoUrl ? `<div style="text-align:center;margin-bottom:16px"><img src="${esc(o.logoUrl)}" alt="" style="height:46px;max-width:150px;object-fit:contain"></div>` : ''}
    <div style="background:#fff;border-radius:14px;padding:24px;box-shadow:0 2px 12px rgba(20,25,40,.07)">
      <p style="font-size:16px;color:#1a1d29;margin:0 0 12px">${esc(o.hello)}</p>
      <p style="font-size:15px;line-height:1.6;color:#374151;margin:0 0 18px">
        To make paying for ${o.forName ? `${esc(o.forName)}'s` : 'your'} lessons easier, please save a ${o.dd ? 'card or set up a Direct Debit' : 'card'} with ${esc(o.academy)}.
        It takes a minute, and you will see the cancellation policy${o.hours ? ` (free to cancel up to ${o.hours} hours before a lesson)` : ''} before you agree to anything.
      </p>
      <p style="text-align:center;margin:0 0 18px">
        <a href="${esc(o.url)}" style="display:inline-block;background:#3A8EE0;color:#fff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 26px;border-radius:12px">Save my ${o.dd ? 'payment details' : 'card'} →</a>
      </p>
      <p style="font-size:13px;color:#6b7280;line-height:1.6;margin:0">Your details are held by Stripe, the payment company, not by ${esc(o.academy)} or Lumio.</p>
    </div>
    <p style="font-size:12px;color:#9aa1ad;text-align:center;margin:16px 0 0">${esc(o.academy)} · sent through Lumio</p>
  </div></body></html>`
}

export async function POST(req: NextRequest) {
  const g = await gate(); if ('res' in g) return g.res
  const b = (await req.json().catch(() => ({}))) as { playerId?: string; email?: string; send?: boolean }
  if (!isUuid(b.playerId)) return NextResponse.json({ error: 'Choose a player.' }, { status: 400 })
  const db = admin()
  const { data: player } = await db.from('coach_players').select('id, name, email, parent_name, parent_email, contact_email, staff_id, age')
    .eq('id', b.playerId).eq('coach_id', g.academyId).maybeSingle()
  if (!player) return NextResponse.json({ error: 'We could not find that player.' }, { status: 404 })
  if (g.mine && player.staff_id !== g.mine) return NextResponse.json({ error: 'That player is not one of yours.' }, { status: 403 })

  const m = await academyMoney(db, g.academyId)
  if (!m.accountId || !m.chargesEnabled) {
    return NextResponse.json({ error: g.mine ? 'Card payments are not switched on for the academy yet. Ask your head coach.' : 'Connect your bank first, in Settings → Pricing & packages. Then your clients can save a card with you.' }, { status: 400 })
  }

  const send = b.send !== false
  const to = String(b.email || player.parent_email || player.email || player.contact_email || '').trim().toLowerCase()
  if (send && !EMAIL_RE.test(to)) return NextResponse.json({ error: `There is no email address for ${player.name}. Add one to their profile, or copy the link and send it yourself.` }, { status: 400 })

  // One open invitation per player: sending again re-sends the same link.
  const { data: open } = await db.from('coach_pay_methods').select('id, link_token')
    .eq('coach_id', g.academyId).eq('player_id', player.id).eq('status', 'invited').order('created_at', { ascending: false }).limit(1)
  let row = open?.[0] || null
  if (!row) {
    const { data, error } = await db.from('coach_pay_methods').insert({ coach_id: g.academyId, player_id: player.id, link_token: newToken(), status: 'invited' })
      .select('id, link_token').single()
    if (error || !data) return NextResponse.json({ error: 'The link could not be made. Please try again.' }, { status: 500 })
    row = data
  }
  const url = `${publicSiteOrigin(new URL(req.url).origin)}/card/${row.link_token}`
  if (!send) return NextResponse.json({ ok: true, url, sent: false })

  const toParent = !!player.parent_email && to === String(player.parent_email).trim().toLowerCase()
  const hello = toParent && player.parent_name ? `Hi ${String(player.parent_name).split(/\s+/)[0]},` : !toParent ? `Hi ${String(player.name).split(/\s+/)[0]},` : 'Hi,'
  const html = inviteHtml({ academy: m.academy, logoUrl: m.logoUrl, hello, forName: toParent ? String(player.name).split(/\s+/)[0] : null, url, hours: m.policy.hours, dd: m.policy.directDebit })
  const subject = `Save your ${m.policy.directDebit ? 'payment details' : 'card'} with ${m.academy}`
  const sent = await sendAsCoach(g.who.userId, { to, subject, html })
  let delivered = sent.ok
  if (!sent.ok) {
    const fb = await sendEmail({ from: 'Lumio Tennis <noreply@lumiosports.com>', to: [to], subject, html, replyTo: m.contactEmail || undefined, context: 'coach/pay card link' }).catch(() => null)
    delivered = !!fb && !fb.error
  }
  if (delivered) await db.from('coach_pay_methods').update({ link_sent_to: to, link_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', row.id)
  return NextResponse.json({ ok: true, url, sent: delivered, to })
}

export async function DELETE(req: NextRequest) {
  const g = await gate(); if ('res' in g) return g.res
  const id = req.nextUrl.searchParams.get('id')
  if (!isUuid(id)) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  const db = admin()
  const { data: row } = await db.from('coach_pay_methods').select('*').eq('id', id).eq('coach_id', g.academyId).maybeSingle()
  if (!row) return NextResponse.json({ error: 'We could not find that card.' }, { status: 404 })
  if (g.mine) {
    const own = await ownPlayers(db, g.academyId, g.mine)
    if (!own?.has(row.player_id)) return NextResponse.json({ error: 'That player is not one of yours.' }, { status: 403 })
  }
  // Off the coach's Stripe account too, so it cannot be used from there either.
  if (row.status === 'active' && row.stripe_payment_method_id) {
    const m = await academyMoney(db, g.academyId)
    if (m.accountId) await stripe.paymentMethods.detach(row.stripe_payment_method_id, {}, { stripeAccount: m.accountId }).catch(() => null)
  }
  const now = new Date().toISOString()
  await db.from('coach_pay_methods').update({ status: 'removed', removed_at: now, updated_at: now }).eq('id', row.id)
  return NextResponse.json({ ok: true })
}
