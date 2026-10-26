import { NextRequest, NextResponse } from 'next/server'
import { admin } from '@/app/api/coach/pay/_stripe'
import { academyMoney, activeMethod, askStripe, chargeSaved, priceBooking } from '@/app/api/coach/pay/_saved'
import { windowClosesAt, ukLocalToMs } from '@/lib/coach/cancel-policy'
import { addDaysIso, ukDate } from '@/lib/coach/uk-date'
import { packCover } from '@/lib/coach/packs-server'
import { planCover, runMonthly } from '@/lib/coach/monthly-server'
import { planCovering } from '@/lib/coach/memberships'
import { runCampBalances } from '@/lib/coach/camp-balance-server'
import { publicSiteOrigin } from '@/lib/public-origin'

export const runtime = 'nodejs'
export const maxDuration = 300

// Taking lesson payments when the free-cancellation window closes. A system
// cron on the VPS hits this every 15 minutes:
//
//   */15 * * * * curl -sS -X POST http://127.0.0.1:3000/api/cron/lesson-charges \
//     -H "Authorization: Bearer $CRON_SECRET" > /dev/null
//
// Only for academies that switched it on (Settings → Pricing & packages →
// "Take payment when the window closes"), and only for:
//   • a confirmed lesson for ONE player, with a price, whose window has closed
//     and which started no more than 12 hours ago (an older lesson is the
//     coach's to charge from the Payments page, not a surprise from us);
//   • a player with a card or Direct Debit on file;
//   • a lesson that does not come off a lesson pack (see lib/coach/packs),
//     and is not covered by the player's monthly plan;
//   • a lesson with no charge for it yet — not even a failed one. A charge
//     that failed is shown to the coach; it is never retried on its own.
// Safe to run twice: the database allows one live charge per lesson.
//
// It also takes monthly plans on their billing day (lib/coach/monthly-server),
// camp and holiday balances on their due date (lib/coach/camp-balance-server),
// and finishes any charge left half-way ('charging' for over five
// minutes) by asking Stripe again with the same key, which returns what
// Stripe did the first time.

const MAX_PER_RUN = 200

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const db = admin()
  const now = Date.now()
  const out = { resumed: 0, charged: 0, processing: 0, failed: 0, skipped: 0, onPack: 0, onPlan: 0, academies: 0, monthly: {} as Record<string, number>, balances: {} as Record<string, number> }

  // ── 1. Half-finished charges ──
  const stale = new Date(now - 5 * 60_000).toISOString()
  const { data: stuck } = await db.from('coach_charges').select('*').eq('status', 'charging').lt('created_at', stale).limit(50)
  for (const c of stuck || []) {
    const m = await academyMoney(db, c.coach_id)
    const { data: method } = c.method_id ? await db.from('coach_pay_methods').select('*').eq('id', c.method_id).maybeSingle() : { data: null }
    if (!m.accountId || !method) { await db.from('coach_charges').update({ status: 'failed', failure_reason: 'Interrupted before it reached the payment company. Nothing was taken.' }).eq('id', c.id); continue }
    await askStripe(db, m, c, method)
    out.resumed++
  }

  // ── 2. Lessons whose window has closed ──
  const { data: on } = await db.from('coach_settings').select('coach_id').eq('data->cancelPolicy->>autoCharge', 'true')
  let budget = MAX_PER_RUN
  for (const { coach_id: academyId } of on || []) {
    if (budget <= 0) break
    const m = await academyMoney(db, academyId)
    if (!m.policy.autoCharge || !m.accountId || !m.chargesEnabled) continue
    out.academies++
    const today = ukDate()
    const until = addDaysIso(today, Math.ceil(m.policy.hours / 24) + 1)
    const { data: lessons } = await db.from('coach_bookings').select('*')
      .eq('coach_id', academyId).eq('status', 'confirmed').not('player_id', 'is', null)
      .gte('booking_date', addDaysIso(today, -1)).lte('booking_date', until)
    const { cover } = await packCover(db, academyId, (lessons || []).map(l => l.player_id as string), m.policy)
    const plans = await planCover(db, academyId, (lessons || []).map(l => l.player_id as string))
    for (const b of lessons || []) {
      if (budget <= 0) break
      if (cover.has(b.id)) { out.onPack++; continue }
      if (planCovering(plans, { playerId: b.player_id, type: b.type })) { out.onPlan++; continue }
      if (b.type === 'Block' || (b.headcount && b.headcount > 1)) continue
      const closes = windowClosesAt(b, m.policy)
      const starts = ukLocalToMs(b.booking_date, String(b.start_time || '00:00').slice(0, 5))
      if (closes == null || closes > now || starts < now - 12 * 3_600_000) continue
      const { data: had } = await db.from('coach_charges').select('id').eq('booking_id', b.id).in('kind', ['lesson', 'no_show']).limit(1)
      if (had?.length) continue
      if (!await activeMethod(db, academyId, b.player_id)) continue
      const price = await priceBooking(db, academyId, m.settings, b)
      if (price.total <= 0) { out.skipped++; continue }
      const { data: player } = await db.from('coach_players').select('name').eq('id', b.player_id).maybeSingle()
      const when = new Date(`${b.booking_date}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
      budget--
      const r = await chargeSaved(db, m, {
        academyId, playerId: b.player_id, playerName: player?.name || b.player_name || 'Player', amountPennies: price.total,
        kind: 'lesson', bookingId: b.id, by: 'auto',
        description: `${b.type || 'Lesson'} · ${when} ${String(b.start_time || '').slice(0, 5)} · ${player?.name || b.player_name || ''}`.trim(),
      })
      if (r.ok && r.status === 'paid') out.charged++
      else if (r.ok) out.processing++
      else if (r.status === 'failed') out.failed++
      else out.skipped++
    }
  }

  // ── 3. Monthly plans whose billing day has come ──
  try { out.monthly = await runMonthly(db, Math.max(0, budget)) } catch (e) { console.error('[cron/lesson-charges] monthly', e) }
  // ── 4. Camp and holiday balances: the reminder, then the balance on its due date ──
  try { out.balances = await runCampBalances(db, publicSiteOrigin('https://www.lumiosports.com')) } catch (e) { console.error('[cron/lesson-charges] balances', e) }
  return NextResponse.json({ ok: true, ...out })
}
