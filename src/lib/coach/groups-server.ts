// Weekly groups on the server: asking who is coming, and what a yes or a no does.
//
// Used by the timer (/api/cron/reminders), the coach's "Ask now" and "Mark"
// buttons (/api/coach/groups) and the client's own link (/api/group/<token>),
// so the rules about places and money live here once.
//
//   ensureWeek  makes the week (its row and its booking in the diary), gives
//               every member a private link, and emails the ones not yet asked
//   sayYes      takes a place if there is one, then pays for it from the saved
//               card when the coach takes card payments
//   sayNo       gives the place back; money back only inside the free window
//   payLink     a card payment page, for a yes with no saved card

import { randomBytes } from 'crypto'
import { academyMoney, activeMethod, chargeSaved, refundCharge, type AcademyMoney } from '@/app/api/coach/pay/_saved'
import { stripe, admin } from '@/app/api/coach/pay/_stripe'
import { familyAddress, sendFamilyEmail, fileInApp, type FamilyPlayer } from './family-mail'
import { syncBooking } from './calendar'
import { askMessage, yesMessage, cancelState, payWayFor, dayWords, upcomingDate, dueToAsk } from './groups'
import { formatPennies } from './money'
import { ukTime } from './uk-date'
import { planCover } from './monthly-server'
import { planCovering } from './memberships'

type Db = ReturnType<typeof admin>
type Row = Record<string, any>

const token = () => randomBytes(18).toString('base64url')
const first = (s: unknown) => String(s || '').trim().split(/\s+/)[0] || ''
const pad = (n: number) => String(n).padStart(2, '0')

export function methodWords(m: { kind?: string | null; brand?: string | null; last4?: string | null } | null): string | null {
  if (!m) return null
  const brand = m.kind === 'bacs_debit' ? 'Direct Debit' : (m.brand ? m.brand.charAt(0).toUpperCase() + m.brand.slice(1) : 'card')
  return m.last4 ? `${brand} ending ${m.last4}` : brand
}

const PLAYER_COLS = 'id, name, email, parent_email, parent_name, contact_email'

/** The week of a group on a date: its row and its booking, made if they do not exist yet. */
export async function weekOf(db: Db, g: Row, date: string): Promise<Row | null> {
  const { data: had } = await db.from('coach_group_sessions').select('*').eq('group_id', g.id).eq('session_date', date).maybeSingle()
  if (had) return had
  // The row first: its unique (group, date) is what stops two runs making two weeks.
  const { data: made, error } = await db.from('coach_group_sessions')
    .insert({ coach_id: g.coach_id, staff_id: g.staff_id || null, group_id: g.id, session_date: date }).select('*').single()
  if (error || !made) {
    const { data: again } = await db.from('coach_group_sessions').select('*').eq('group_id', g.id).eq('session_date', date).maybeSingle()
    return again || null
  }
  const { data: bk } = await db.from('coach_bookings').insert({
    coach_id: g.coach_id, staff_id: g.staff_id || null, assigned_coach: g.assigned_coach || null,
    title: g.name, type: 'Group', status: 'confirmed', booking_date: date, start_time: g.start_time, duration_min: g.duration_min,
    venue_id: g.venue_id || null, court: g.court || null, notes: 'Weekly group. Places are taken from the group’s links.',
  }).select('id').single()
  if (bk) {
    await db.from('coach_group_sessions').update({ booking_id: bk.id }).eq('id', made.id)
    made.booking_id = bk.id
    try {
      const [h, m] = String(g.start_time).split(':').map(Number)
      const end = h * 60 + m + Number(g.duration_min || 60)
      await syncBooking(g.coach_id, { bookingId: bk.id, title: g.name, start: `${date}T${pad(h)}:${pad(m)}:00`, end: `${date}T${pad(Math.floor(end / 60) % 24)}:${pad(end % 60)}:00`, location: g.court || undefined })
    } catch (e) { console.error('[groups] calendar sync', e) }
  }
  return made
}

/**
 * Make sure everyone in the group has a link for this week, and email the ones
 * not yet asked. Each email is claimed (sent_at set) before it goes, so two
 * runs never send it twice; a failed send lets go of the claim.
 */
export async function ensureWeek(db: Db, g: Row, date: string, o: { origin: string; send: boolean; m?: AcademyMoney }) {
  const out = { sessionId: null as string | null, asked: 0, failed: 0, noEmail: 0, members: 0, closed: false }
  const s = await weekOf(db, g, date)
  if (!s) return out
  out.sessionId = s.id
  if (s.status !== 'open') { out.closed = true; return out }
  const [{ data: members }, { data: replies }] = await Promise.all([
    db.from('coach_group_members').select('player_id').eq('group_id', g.id),
    db.from('coach_group_replies').select('*').eq('session_id', s.id),
  ])
  const ids = Array.from(new Set((members || []).map(r => r.player_id as string)))
  out.members = ids.length
  const have = new Set((replies || []).map(r => r.player_id))
  const fresh = ids.filter(id => !have.has(id)).map(id => ({ coach_id: g.coach_id, staff_id: g.staff_id || null, session_id: s.id, group_id: g.id, player_id: id, token: token() }))
  let all = replies || []
  if (fresh.length) {
    const { data: added } = await db.from('coach_group_replies').insert(fresh).select('*')
    all = all.concat(added || [])
  }
  if (!o.send) return out
  const unsent = all.filter(r => !r.sent_at && !r.answer && ids.includes(r.player_id))
  if (!unsent.length) return out

  const m = o.m || await academyMoney(db, g.coach_id)
  const [{ data: players }, { data: methods }, { data: venue }] = await Promise.all([
    db.from('coach_players').select(PLAYER_COLS).eq('coach_id', g.coach_id).in('id', unsent.map(r => r.player_id)),
    db.from('coach_pay_methods').select('player_id, kind, brand, last4').eq('coach_id', g.coach_id).eq('status', 'active').in('player_id', unsent.map(r => r.player_id)),
    g.venue_id ? db.from('coach_venues').select('name').eq('id', g.venue_id).maybeSingle() : Promise.resolve({ data: null }),
  ])
  const { freeUntil } = cancelState(date, g.start_time, m.policy.hours)
  for (const r of unsent) {
    const player = (players || []).find(p => p.id === r.player_id)
    const addr = player ? familyAddress(player) : null
    if (!player || !addr) { out.noEmail++; continue }
    const { data: claimed } = await db.from('coach_group_replies').update({ sent_at: new Date().toISOString(), sent_to: addr.to, updated_at: new Date().toISOString() })
      .eq('id', r.id).is('sent_at', null).select('id')
    if (!claimed?.length) continue
    const card = (methods || []).find(x => x.player_id === r.player_id) || null
    const msg = askMessage({
      hello: addr.hello, childFirst: addr.toParent ? first(player.name) : null, coachName: m.coachName || null, academy: m.academy, logoUrl: m.logoUrl,
      group: g.name, date, time: g.start_time, durMin: g.duration_min, venue: (venue as Row | null)?.name || null, court: g.court || null,
      price: g.price_pennies, way: payWayFor(m.chargesEnabled, !!card), methodLabel: methodWords(card), freeUntil: m.policy.hours > 0 ? freeUntil : null,
      url: `${o.origin}/group/${r.token}`,
    })
    const ok = await sendFamilyEmail(g.coach_id, { to: addr.to, subject: msg.subject, html: msg.html, replyTo: m.contactEmail, context: 'coach/group ask', push: { url: `${o.origin}/group/${r.token}` } })
    if (ok) { out.asked++; await fileInApp(db, { coachId: g.coach_id, player, subject: msg.subject, body: msg.text }) }
    else { out.failed++; await db.from('coach_group_replies').update({ sent_at: null, sent_to: null }).eq('id', r.id) }
  }
  if (out.asked) await db.from('coach_group_sessions').update({ asked_at: new Date().toISOString() }).eq('id', s.id).is('asked_at', null)
  return out
}

/** The timer's part: every active group whose ask day has come. Emails only go out in the daytime. */
export async function runGroupAsks(db: Db, origin: string, budget = 200) {
  const out = { groups: 0, asked: 0, failed: 0 }
  const t = ukTime()
  if (t < '09:00' || t > '20:30') return out
  const { data: groups } = await db.from('coach_groups').select('*').eq('active', true).limit(500)
  const money = new Map<string, AcademyMoney>()
  for (const g of groups || []) {
    if (out.asked >= budget) break
    const date = upcomingDate(g)
    if (!dueToAsk(g, date)) continue
    if (!money.has(g.coach_id)) money.set(g.coach_id, await academyMoney(db, g.coach_id))
    const r = await ensureWeek(db, g, date, { origin, send: true, m: money.get(g.coach_id) })
    out.groups++; out.asked += r.asked; out.failed += r.failed
  }
  return out
}

/** The booking's headcount (and price) follow the answers. */
export async function recount(db: Db, sessionId: string) {
  const { data: s } = await db.from('coach_group_sessions').select('booking_id, group_id').eq('id', sessionId).maybeSingle()
  if (!s?.booking_id) return
  const [{ count }, { data: g }] = await Promise.all([
    db.from('coach_group_replies').select('id', { count: 'exact', head: true }).eq('session_id', sessionId).eq('answer', 'yes'),
    db.from('coach_groups').select('price_pennies').eq('id', s.group_id).maybeSingle(),
  ])
  const n = Math.min(50, count || 0)
  await db.from('coach_bookings').update({ headcount: n || null, price_pennies: n ? n * (g?.price_pennies || 0) : null }).eq('id', s.booking_id)
}

export type Loaded = { reply: Row; session: Row; group: Row; player: Row; m: AcademyMoney; venue: Row | null }

export async function loadReply(db: Db, by: { token?: string; id?: string }): Promise<Loaded | null> {
  const q = db.from('coach_group_replies').select('*')
  const { data: reply } = by.token ? await q.eq('token', by.token).maybeSingle() : by.id ? await q.eq('id', by.id).maybeSingle() : { data: null }
  if (!reply) return null
  const [{ data: session }, { data: group }, { data: player }] = await Promise.all([
    db.from('coach_group_sessions').select('*').eq('id', reply.session_id).maybeSingle(),
    db.from('coach_groups').select('*').eq('id', reply.group_id).maybeSingle(),
    db.from('coach_players').select(PLAYER_COLS).eq('id', reply.player_id).maybeSingle(),
  ])
  if (!session || !group || !player) return null
  const [m, { data: venue }] = await Promise.all([
    academyMoney(db, reply.coach_id),
    group.venue_id ? db.from('coach_venues').select('name, address').eq('id', group.venue_id).maybeSingle() : Promise.resolve({ data: null }),
  ])
  return { reply, session, group, player, m, venue: (venue as Row | null) || null }
}

/** The money behind one answer, newest first. */
export async function chargesOf(db: Db, replyId: string) {
  const { data } = await db.from('coach_charges').select('id, status, amount_pennies, refunded_pennies, stripe_checkout_session_id, failure_reason, created_at')
    .eq('reply_id', replyId).order('created_at', { ascending: false })
  return data || []
}

export type YesResult = { state: 'yes' | 'full' | 'closed' | 'missing'; paid?: 'paid' | 'processing' | 'none'; payNote?: string; needsLink?: boolean; error?: string }

/**
 * A yes. The place is taken first (lumio_group_say_yes), then paid for: from
 * the saved card when the coach takes card payments; otherwise the client is
 * offered a payment page, or pays on the day. The coach marking someone in
 * never charges them — that is for people paying another way.
 */
export async function sayYes(db: Db, L: Loaded, by: 'client' | 'coach', origin: string): Promise<YesResult> {
  const { reply, session, group, player, m } = L
  const cs = cancelState(session.session_date, group.start_time, m.policy.hours)
  if (cs.started) return { state: 'closed' }
  const { data: got, error } = await db.rpc('lumio_group_say_yes', { p_reply: reply.id, p_by: by })
  if (error) return { state: 'missing', error: 'We could not save that. Please try again.' }
  const state = String(got) as YesResult['state']
  if (state !== 'yes') return { state }
  if (by === 'coach') return { state, paid: 'none' }

  let res: YesResult = { state, paid: 'none' }
  const price = Number(group.price_pennies) || 0
  const already = (await chargesOf(db, reply.id)).find(c => ['paid', 'processing', 'charging'].includes(c.status))
  let method: Row | null = null
  if (already) res = { state, paid: already.status === 'processing' ? 'processing' : 'paid' }
  else if (price > 0 && planCovering(await planCover(db, reply.coach_id, [reply.player_id]), { playerId: reply.player_id, groupId: group.id })) {
    res = { state, paid: 'none', payNote: 'Your place is covered by your monthly plan.' }
  }
  else if (price > 0 && m.chargesEnabled) {
    method = await activeMethod(db, reply.coach_id, reply.player_id)
    if (method) {
      const c = await chargeSaved(db, m, {
        academyId: reply.coach_id, playerId: reply.player_id, playerName: player.name, amountPennies: price, kind: 'group',
        bookingId: session.booking_id, replyId: reply.id, by: 'auto',
        description: `${group.name} · ${dayWords(session.session_date)} · ${player.name}`,
      })
      if (c.ok) res = { state, paid: c.status === 'processing' ? 'processing' : 'paid', payNote: `${formatPennies(price)} ${c.status === 'processing' ? 'is being taken by Direct Debit' : `taken from your ${methodWords(method)}`}.` }
      else res = { state, paid: 'none', needsLink: true, payNote: c.status === 'failed' ? 'Your saved card did not go through, so your place is not paid for yet.' : undefined }
    } else res = { state, paid: 'none', needsLink: true }
  }
  // A confirmation by email, with the link to cancel. Once: a second tap on
  // Yes (they were already in) sends nothing new.
  const addr = reply.answer === 'yes' ? null : familyAddress(player as FamilyPlayer)
  if (addr) {
    const msg = yesMessage({
      hello: addr.hello, childFirst: addr.toParent ? first(player.name) : null, coachName: m.coachName || null, academy: m.academy, logoUrl: m.logoUrl,
      group: group.name, date: session.session_date, time: group.start_time, venue: L.venue?.name || null, court: group.court || null,
      paid: res.payNote && !res.needsLink ? res.payNote : (res.needsLink ? `Your place is held. Pay ${formatPennies(price)} by card from the link below.` : price > 0 && !m.chargesEnabled ? `It is ${formatPennies(price)}, paid on the day.` : null),
      freeUntil: m.policy.hours > 0 ? cs.freeUntil : null, url: `${origin}/group/${reply.token}`,
    })
    await sendFamilyEmail(reply.coach_id, { to: addr.to, subject: msg.subject, html: msg.html, replyTo: m.contactEmail, context: 'coach/group yes', push: false }).catch(() => false)
  }
  return res
}

/**
 * A no. Before the free window closes it costs nothing: any payment is
 * refunded. After it, the answer is recorded but the place was theirs, so the
 * money stays (the coach can still refund from Payments).
 */
export async function sayNo(db: Db, L: Loaded, by: 'client' | 'coach'): Promise<{ ok: boolean; late: boolean; refunded: number; error?: string }> {
  const { reply, session, group, m } = L
  const cs = cancelState(session.session_date, group.start_time, m.policy.hours)
  const wasYes = reply.answer === 'yes'
  const late = wasYes && !cs.free
  let refunded = 0
  let problem: string | undefined
  if (wasYes && !late) {
    for (const c of await chargesOf(db, reply.id)) {
      if (c.status === 'paid' && c.amount_pennies - (c.refunded_pennies || 0) > 0) {
        const rf = await refundCharge(db, m, reply.coach_id, c.id)
        if (rf.ok) refunded += rf.refunded || 0; else problem = rf.error
      } else if (c.status === 'processing') problem = 'A Direct Debit for this place has not arrived yet, so it cannot be refunded today. The coach will refund it once it has.'
    }
  }
  await db.from('coach_group_replies').update({ answer: 'no', answered_at: new Date().toISOString(), answered_by: by, late, updated_at: new Date().toISOString() }).eq('id', reply.id)
  if (wasYes) await recount(db, session.id)
  return { ok: true, late, refunded, ...(problem ? { error: problem } : {}) }
}

/** A Stripe payment page for one yes. An open one is reused, so two taps never make two. */
export async function payLink(db: Db, L: Loaded, origin: string): Promise<{ url?: string; error?: string }> {
  const { reply, session, group, player, m } = L
  if (reply.answer !== 'yes') return { error: 'Say yes first, then pay for your place.' }
  if (!m.accountId || !m.chargesEnabled) return { error: 'Card payments are not switched on. Pay your coach on the day.' }
  const price = Number(group.price_pennies) || 0
  if (price < 50) return { error: 'There is nothing to pay.' }
  const mine = await chargesOf(db, reply.id)
  if (mine.some(c => ['paid', 'processing', 'charging'].includes(c.status))) return { error: 'Your place is already paid for.' }
  for (const c of mine.filter(c => c.status === 'pending' && c.stripe_checkout_session_id)) {
    try {
      const s = await stripe.checkout.sessions.retrieve(c.stripe_checkout_session_id, {}, { stripeAccount: m.accountId })
      if (s.status === 'open' && s.url) return { url: s.url }
    } catch { /* make a new one */ }
  }
  const back = `${origin}/group/${reply.token}`
  try {
    const s = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price_data: { currency: 'gbp', product_data: { name: `${group.name} · ${dayWords(session.session_date)}` }, unit_amount: price }, quantity: 1 }],
      success_url: `${back}?paid=1`, cancel_url: back,
      metadata: { coach_id: reply.coach_id, group_reply_id: reply.id, player_name: player.name },
    }, { stripeAccount: m.accountId })
    await db.from('coach_charges').insert({
      coach_id: reply.coach_id, player_id: reply.player_id, player_name: player.name, booking_id: session.booking_id, reply_id: reply.id,
      kind: 'group', description: `${group.name} · ${dayWords(session.session_date)} · ${player.name}`, amount_pennies: price,
      status: 'pending', stripe_checkout_session_id: s.id, charged_by: 'client',
    })
    return { url: s.url || undefined }
  } catch (e) {
    console.error('[groups] pay link', e)
    return { error: 'The payment page could not be opened. Please try again.' }
  }
}
