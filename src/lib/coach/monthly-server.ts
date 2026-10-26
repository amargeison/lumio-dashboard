// Monthly plans on the server: taking each month, and what a plan covers.
//
//   chargeMonth   takes one month of one plan, once (the bill row is the claim)
//   runMonthly    the timer's part: every agreed plan whose billing day has come
//   planCover     which players' lessons are covered by a plan, so they are not
//                 charged again lesson by lesson
//
// Each month is the same off-session payment as a lesson, from the client's
// saved card or Direct Debit, on the coach's own Stripe account.

import { admin } from '@/app/api/coach/pay/_stripe'
import { academyMoney, activeMethod, chargeSaved, type AcademyMoney } from '@/app/api/coach/pay/_saved'
import { familyAddress, sendFamilyEmail, type FamilyPlayer } from './family-mail'
import { dueNow, monthOf, monthWords, type Plan } from './memberships'
import { formatPennies } from './money'
import { ukDate } from './uk-date'

type Db = ReturnType<typeof admin>
const esc = (x: unknown) => String(x ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export type MonthResult = { ok: boolean; status: 'paid' | 'processing' | 'failed' | 'skipped'; error?: string }

/**
 * Take one month of a plan. The bill row (unique per plan and month) is
 * written first, so two runs — or the timer and the coach's button — can never
 * take the same month twice. A month that failed can be tried again by the coach.
 */
export async function chargeMonth(db: Db, plan: Plan & { coach_id: string }, period: string, by: 'auto' | 'coach', m?: AcademyMoney): Promise<MonthResult> {
  const money = m || await academyMoney(db, plan.coach_id)
  if (!money.accountId || !money.chargesEnabled) return { ok: false, status: 'skipped', error: 'Card payments are not switched on yet.' }
  const { data: claimed, error } = await db.from('coach_membership_bills').insert({
    coach_id: plan.coach_id, staff_id: plan.staff_id || null, membership_id: plan.id, player_id: plan.player_id, period, amount_pennies: plan.amount_pennies, status: 'charging',
  }).select('id').single()
  let billId = claimed?.id as string | undefined
  if (error || !billId) {
    // Already there: only a failed month may be tried again, and only by the coach.
    if (by !== 'coach') return { ok: false, status: 'skipped' }
    const { data: again } = await db.from('coach_membership_bills').update({ status: 'charging', failure_reason: null, amount_pennies: plan.amount_pennies, updated_at: new Date().toISOString() })
      .eq('membership_id', plan.id).eq('period', period).eq('status', 'failed').select('id')
    if (!again?.length) return { ok: false, status: 'skipped', error: `${monthWords(period)} has already been taken.` }
    billId = again[0].id as string
  }
  const { data: player } = await db.from('coach_players').select('id, name, email, parent_email, parent_name, contact_email').eq('id', plan.player_id).maybeSingle()
  const name = (player?.name as string) || 'Player'
  const r = await chargeSaved(db, money, {
    academyId: plan.coach_id, playerId: plan.player_id, playerName: name, amountPennies: plan.amount_pennies, kind: 'membership', by,
    description: `${plan.name} · ${monthWords(period)} · ${name}`,
  })
  await db.from('coach_membership_bills').update({
    charge_id: 'chargeId' in r && r.chargeId ? r.chargeId : null, status: r.ok ? 'done' : 'failed', failure_reason: r.ok ? null : r.error, updated_at: new Date().toISOString(),
  }).eq('id', billId)
  // A receipt, so a monthly payment is never a surprise on a statement.
  const addr = player ? familyAddress(player as FamilyPlayer) : null
  if (r.ok && addr) {
    const how = r.status === 'processing' ? 'is being collected by Direct Debit and will leave your account in about three working days' : 'has been taken from your saved card'
    const line = `Your ${monthWords(period)} payment of ${formatPennies(plan.amount_pennies)} for ${plan.name}${addr.toParent ? ` (${String(name).split(/\s+/)[0]})` : ''} ${how}.`
    const html = `<!doctype html><html><body style="margin:0;background:#eef0f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif"><div style="max-width:520px;margin:0 auto;padding:26px 18px"><div style="background:#fff;border-radius:14px;padding:22px 24px"><p style="font-size:16px;color:#1a1d29;margin:0 0 10px">${esc(addr.hello)}</p><p style="font-size:15.5px;color:#374151;line-height:1.6;margin:0 0 10px">${esc(line)}</p><p style="font-size:14px;color:#6b7280;margin:6px 0 0">${esc(money.coachName || money.academy)}</p></div><p style="font-size:12px;color:#9aa1ad;text-align:center;margin:14px 0 0">${esc(money.academy)} · sent through Lumio · reply to this email to reach your coach</p></div></body></html>`
    await sendFamilyEmail(plan.coach_id, { to: addr.to, subject: `${money.academy}: ${monthWords(period)} payment`, html, replyTo: money.contactEmail, context: 'coach/monthly receipt' }).catch(() => false)
  }
  if (r.ok) return { ok: true, status: r.status }
  return { ok: false, status: 'failed', error: r.error }
}

/** The timer: every agreed plan whose billing day has come and whose month is not taken. */
export async function runMonthly(db: Db, budget = 200) {
  const out = { charged: 0, processing: 0, failed: 0, waiting: 0 }
  const today = ukDate()
  const { data: plans } = await db.from('coach_memberships').select('*').eq('status', 'active').not('agreed_at', 'is', null).lte('starts_month', monthOf(today)).limit(2000)
  const money = new Map<string, AcademyMoney>()
  for (const p of plans || []) {
    if (budget <= 0) break
    const { period, due } = dueNow(p as Plan, today)
    if (!due) continue
    const { data: had } = await db.from('coach_membership_bills').select('id').eq('membership_id', p.id).eq('period', period).limit(1)
    if (had?.length) continue
    if (!money.has(p.coach_id)) money.set(p.coach_id, await academyMoney(db, p.coach_id))
    const m = money.get(p.coach_id)!
    if (!m.chargesEnabled) continue
    // No card or Direct Debit yet: wait (the coach sees "waiting for a card").
    if (!await activeMethod(db, p.coach_id, p.player_id)) { out.waiting++; continue }
    budget--
    const r = await chargeMonth(db, p, period, 'auto', m)
    if (r.status === 'paid') out.charged++; else if (r.status === 'processing') out.processing++; else if (r.status === 'failed') out.failed++
  }
  return out
}

/** Players whose one-to-one lessons a plan covers, and plans covering a group place. */
export async function planCover(db: Db, academyId: string, playerIds: string[]): Promise<Plan[]> {
  const ids = Array.from(new Set(playerIds.filter(Boolean)))
  if (!ids.length) return []
  const { data } = await db.from('coach_memberships').select('*').eq('coach_id', academyId).in('player_id', ids).eq('status', 'active').not('agreed_at', 'is', null)
  return (data || []) as Plan[]
}
