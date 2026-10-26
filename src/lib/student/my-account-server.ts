// The player app's lessons, groups and plan, read for ONE player at ONE
// academy. Every query is scoped by both ids: the caller has already checked
// that this family may see this player (familyAccess, or the coach's preview).
//
// Only what the page shows leaves here — never another player's rows, row ids
// beyond the family's own bookings and answers, or anything the coach keeps
// private.

import type { SupabaseClient } from '@supabase/supabase-js'
import { academyMoney, activeMethod, type AcademyMoney } from '@/app/api/coach/pay/_saved'
import { methodWords } from '@/lib/coach/groups-server'
import { everyWords, upcomingDate, askOn, cancelState } from '@/lib/coach/groups'
import { packCover } from '@/lib/coach/packs-server'
import { allocate } from '@/lib/coach/packs'
import { planCover } from '@/lib/coach/monthly-server'
import { planCovering, planWords, coversWords, nextBillDate, monthWords, type Plan } from '@/lib/coach/memberships'
import { policyTerms } from '@/lib/coach/cancel-policy'
import { owedPennies } from '@/lib/coach/camp-money'
import { balanceUrl } from '@/lib/coach/camp-balance-server'
import { formatPennies } from '@/lib/coach/money'
import { ukDate, addDaysIso } from '@/lib/coach/uk-date'
import { cancelTerms, started, policyShort, bookingDurations, whenWords, momentWords, type MyLesson, type MyGroup, type MyAccount, type MyBooking, type MyPage } from './my-account'

type Db = SupabaseClient
type Row = Record<string, any>   // eslint-disable-line @typescript-eslint/no-explicit-any

/** The day they will be asked, only while it is still to come. */
const laterThan = (day: string | null | undefined, today: string) => (day && day > today ? day : null)

export async function loadMyPage(db: Db, academyId: string, playerId: string, o: { origin: string; sectionsOff?: string[]; m?: AcademyMoney }): Promise<MyPage> {
  const m = o.m || await academyMoney(db, academyId)
  const today = ukDate()
  const safe = async <T,>(f: () => Promise<T>, fallback: T): Promise<T> => { try { return await f() } catch (e) { console.error('[my-page]', e); return fallback } }

  const [plans, packInfo, method] = await Promise.all([
    safe(() => planCover(db, academyId, [playerId]), [] as Plan[]),
    safe(() => packCover(db, academyId, [playerId], m.policy), null),
    safe(() => activeMethod(db, academyId, playerId), null),
  ])

  // ── Their next lessons (one-to-one and private groups booked for them) ──
  const lessons = await safe(async () => {
    const [{ data: rows }, { data: staff }] = await Promise.all([
      db.from('coach_bookings').select('id, booking_date, start_time, duration_min, type, court, status, staff_id, assigned_coach, client_confirmed_at, client_confirmed_by')
        .eq('coach_id', academyId).eq('player_id', playerId).gte('booking_date', today).lte('booking_date', addDaysIso(today, 42))
        .order('booking_date', { ascending: true }).order('start_time', { ascending: true }).limit(20),
      db.from('coach_staff').select('id, name').eq('coach_id', academyId).limit(60),
    ])
    const live = (rows || []).filter((b: Row) => String(b.status || '').toLowerCase() !== 'cancelled' && b.type !== 'Block' && !started(b.booking_date, b.start_time)).slice(0, 8)
    if (!live.length) return [] as MyLesson[]
    const { data: paid } = await db.from('coach_charges').select('booking_id').eq('coach_id', academyId).in('booking_id', live.map((b: Row) => b.id)).in('status', ['paid', 'processing'])
    const paidSet = new Set((paid || []).map((c: Row) => c.booking_id))
    return live.map((b: Row): MyLesson => {
      const cover = planCovering(plans, { playerId, type: b.type }) ? 'plan' : packInfo?.cover.has(b.id) ? 'pack' : null
      const time = b.start_time ? String(b.start_time).slice(0, 5) : null
      return {
        id: b.id, date: b.booking_date, time, mins: Number(b.duration_min) || 60, type: b.type || null, court: b.court || null,
        coach: (staff || []).find((s: Row) => s.id === b.staff_id)?.name || b.assigned_coach || null,
        paid: paidSet.has(b.id), cover,
        confirmed: b.client_confirmed_at ? { at: b.client_confirmed_at, by: b.client_confirmed_by || null } : null,
        cancel: cancelTerms({ date: b.booking_date, time }, m.policy, cover, m.academy),
      }
    })
  }, [] as MyLesson[])

  // ── Their weekly groups ─────────────────────────────────────────────────
  const groups = await safe(async () => {
    const { data: mem } = await db.from('coach_group_members').select('group_id').eq('coach_id', academyId).eq('player_id', playerId)
    const ids = Array.from(new Set((mem || []).map((x: Row) => x.group_id)))
    if (!ids.length) return [] as MyGroup[]
    const { data: gs } = await db.from('coach_groups').select('*').eq('coach_id', academyId).in('id', ids).eq('active', true)
    const out: MyGroup[] = []
    for (const g of gs || []) {
      const [{ data: weeks }, { data: venue }] = await Promise.all([
        db.from('coach_group_sessions').select('id, session_date, status').eq('group_id', g.id).gte('session_date', today).order('session_date', { ascending: true }).limit(3),
        g.venue_id ? db.from('coach_venues').select('name').eq('id', g.venue_id).eq('coach_id', academyId).maybeSingle() : Promise.resolve({ data: null }),
      ])
      const week = (weeks || []).find((w: Row) => !started(w.session_date, g.start_time)) || null
      const date = week?.session_date || upcomingDate(g)
      let next: MyGroup['next'] = null
      if (date) {
        let token: string | null = null, answer: 'yes' | 'no' | null = null, paid = false, placesLeft: number | null = null
        if (week) {
          const [{ data: mine }, { count }] = await Promise.all([
            db.from('coach_group_replies').select('id, token, answer').eq('session_id', week.id).eq('player_id', playerId).maybeSingle(),
            db.from('coach_group_replies').select('id', { count: 'exact', head: true }).eq('session_id', week.id).eq('answer', 'yes'),
          ])
          if (mine) {
            token = mine.token; answer = mine.answer || null
            const { data: ch } = await db.from('coach_charges').select('status').eq('reply_id', mine.id).in('status', ['paid', 'processing']).limit(1)
            paid = !!ch?.length
          }
          placesLeft = Math.max(0, (Number(g.capacity) || 0) - (count || 0))
        }
        const cs = cancelState(date, g.start_time, m.policy.hours)
        next = {
          date, time: String(g.start_time).slice(0, 5), token, askOn: token ? null : laterThan(askOn(date, g.ask_days), today),
          answer, paid, coveredByPlan: !!planCovering(plans, { playerId, groupId: g.id }),
          placesLeft, freeUntil: m.policy.hours > 0 && cs.free ? momentWords(cs.freeUntil) : null,
          cancelled: week?.status === 'cancelled',
        }
      }
      out.push({ id: g.id, name: g.name, every: everyWords(g), price: Number(g.price_pennies) || 0, venue: (venue as Row | null)?.name || null, next })
    }
    return out
  }, [] as MyGroup[])

  // ── Their plan, packs, card and anything owed ───────────────────────────
  const account = await safe(async (): Promise<MyAccount> => {
    const { data: planRows } = await db.from('coach_memberships').select('*').eq('coach_id', academyId).eq('player_id', playerId).in('status', ['offered', 'active', 'paused'])
      .order('created_at', { ascending: false }).limit(1)
    const pl = (planRows?.[0] || null) as (Plan & Row) | null
    let plan: MyAccount['plan'] = null
    if (pl) {
      const { data: bills } = await db.from('coach_membership_bills').select('period, status').eq('membership_id', pl.id).in('status', ['done', 'charging'])
      let groupName: string | null = null
      if (pl.covers === 'group' && pl.group_id) { const { data: g } = await db.from('coach_groups').select('name').eq('id', pl.group_id).eq('coach_id', academyId).maybeSingle(); groupName = g?.name || null }
      plan = {
        name: pl.name, words: planWords(pl), covers: coversWords(pl, groupName),
        status: pl.status === 'active' && pl.agreed_at ? 'Running' : pl.status === 'paused' ? 'Paused' : pl.agreed_at ? 'Agreed' : 'Waiting for you to agree',
        nextBill: pl.status === 'active' && pl.agreed_at ? whenWords(nextBillDate(pl, new Set((bills || []).map((b: Row) => b.period)))) : null,
        agreed: !!pl.agreed_at,
      }
      if (pl.starts_month && !plan.nextBill && pl.agreed_at) plan.nextBill = monthWords(pl.starts_month)
    }

    const packs: MyAccount['packs'] = []
    if (packInfo?.packs.length) {
      const { byPack } = allocate(packInfo.packs, packInfo.uses.filter(u => u.reason !== 'planned'))
      for (const p of packInfo.packs) {
        const used = Math.min((byPack.get(p.id) || []).length, p.sessions_total || 0)
        if (used >= (p.sessions_total || 0)) continue
        packs.push({ name: p.item || 'Lesson pack', used, total: p.sessions_total || 0, left: (p.sessions_total || 0) - used, renews: p.renews_date ? whenWords(p.renews_date) : null })
      }
    }

    const owed: MyAccount['owed'] = []
    const { data: links } = await db.from('coach_welcome_links').select('token, sent_at, completed_at').eq('coach_id', academyId).eq('player_id', playerId)
      .is('completed_at', null).not('sent_at', 'is', null).order('created_at', { ascending: false }).limit(1)
    if (links?.[0]?.token) owed.push({ kind: 'welcome', title: 'Finish your welcome', detail: 'A few questions, then your card or Direct Debit.', url: `${o.origin}/welcome/${links[0].token}` })

    const { data: places } = await db.from('coach_camp_attendees').select('*').eq('coach_id', academyId).eq('player_id', playerId).neq('status', 'cancelled')
    for (const a of places || []) {
      const { data: camp } = await db.from('coach_camps').select('id, name, price, payment_mode, balance_due, end_date, start_date').eq('id', a.camp_id).eq('coach_id', academyId).maybeSingle()
      if (!camp || camp.payment_mode !== 'deposit' || String(camp.end_date || camp.start_date || '') < today) continue
      const owe = owedPennies(camp, a)
      if (owe < 50 || a.balance_status === 'charging') continue
      owed.push({ kind: 'balance', title: `${camp.name}: balance ${formatPennies(owe)}`, detail: camp.balance_due ? `Due ${whenWords(camp.balance_due)}.` : 'Still to pay.', url: await balanceUrl(db, a, o.origin) })
    }
    for (const g of groups) {
      const n = g.next
      if (n?.token && n.answer === 'yes' && !n.paid && !n.coveredByPlan && g.price >= 50 && m.chargesEnabled) {
        owed.push({ kind: 'group', title: `${g.name}: ${formatPennies(g.price)}`, detail: `Your place on ${whenWords(n.date, n.time)} is not paid for yet.`, url: `${o.origin}/group/${n.token}` })
      }
    }

    return { plan, packs, method: methodWords(method), policy: policyShort(policyTerms(m.policy, m.academy)), owed }
  }, { plan: null, packs: [], method: null, policy: [], owed: [] })

  // ── Booking a session ───────────────────────────────────────────────────
  const { data: usual } = await db.from('coach_bookings').select('duration_min').eq('coach_id', academyId).eq('player_id', playerId).neq('type', 'Group')
    .order('booking_date', { ascending: false }).limit(1)
  const d = bookingDurations(usual?.[0]?.duration_min)
  const booking: MyBooking = { on: !(o.sectionsOff || []).includes('booking'), ...d, type: 'Private' }

  return { lessons, groups, account, booking }
}
