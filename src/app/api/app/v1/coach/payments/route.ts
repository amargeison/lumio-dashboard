import { NextResponse } from 'next/server'
import { coachContext, noStore } from '@/lib/app/coach-context'
import { packCover } from '@/lib/coach/packs-server'
import { allocate } from '@/lib/coach/packs'
import { readPolicy } from '@/lib/coach/cancel-policy'
import { paymentOwedPennies, isVoidPayment, toPennies } from '@/lib/coach/money'
import { planWords, coversWords, nextBillDate, monthWords } from '@/lib/coach/memberships'
import { ukDate } from '@/lib/coach/uk-date'
import { payStatus, isPack, STATUS_LABEL, planLabel, monthState, type PayLine } from '@/lib/app/payments-view'

export const runtime = 'nodejs'

// The Payments page for the iPhone app, worked out on the server with the
// website's own rules: the month's takings, what's owed, every pack with the
// sessions it has left, and the monthly plans with this month's bill.
// Read as the coach (row level security), so an invited coach sees their own players.

type Row = Record<string, any>

export async function GET() {
  const c = await coachContext()
  if (!c.ok) return c.res
  const { db, service, seat } = c.ctx
  const academy = seat.academyId
  const today = ukDate()
  const month = today.slice(0, 7)

  const [{ data: lines }, { data: players }, { data: plans }, { data: packages }, { data: settings }] = await Promise.all([
    db.from('coach_payments').select('*').eq('coach_id', academy).order('created_at', { ascending: false }).limit(2000),
    db.from('coach_players').select('id, name').eq('coach_id', academy),
    db.from('coach_memberships').select('*').eq('coach_id', academy).neq('status', 'ended').order('created_at', { ascending: false }),
    db.from('coach_packages').select('id, name, kind, price, sessions, period, description').eq('coach_id', academy).order('price'),
    service.from('coach_settings').select('data').eq('coach_id', academy).maybeSingle(),
  ])
  const all = (lines || []) as (PayLine & Row)[]
  const roster = new Map(((players || []) as Row[]).map(p => [String(p.id), String(p.name || '')]))
  const policy = readPolicy(((settings?.data as Row) || {}).cancelPolicy)

  // Sessions used per pack — the same allocation the Payments page makes.
  const packPlayers = Array.from(new Set(all.filter(p => (p.sessions_total || 0) > 0 && p.player_id).map(p => String(p.player_id))))
  const used = new Map<string, number>()
  if (packPlayers.length) {
    try {
      const info = await packCover(db, academy, packPlayers, policy)
      const { byPack } = allocate(info.packs, info.uses.filter(u => u.reason !== 'planned'))
      for (const [id, uses] of byPack) used.set(id, uses.length)
    } catch (e) { console.error('[app/payments] packs', e) }
  }

  let earned = 0, outstanding = 0, activePacks = 0, expiring = 0
  const shaped = all.map(p => {
    const u = used.get(p.id) || 0
    const status = payStatus(p, u, today)
    const owed = paymentOwedPennies(p)
    if (p.paid && !isVoidPayment(p) && String(p.paid_at || '').slice(0, 7) === month) earned += toPennies(p.amount)
    outstanding += owed
    if (isPack(p) && (status === 'active' || status === 'expiring')) activePacks++
    if (isPack(p) && status === 'expiring') expiring++
    const linked = p.player_id && roster.has(String(p.player_id)) ? String(p.player_id) : null
    return {
      id: p.id, playerId: linked, playerName: linked ? roster.get(linked)! : (p.player_name || 'Not linked'),
      item: p.item || (isPack(p) ? 'Lesson pack' : 'Invoice'), amountPennies: p.amount == null ? null : toPennies(p.amount),
      paid: !!p.paid, paidAt: p.paid_at || null, dueDate: p.due_date || null, renewsDate: p.renews_date || null,
      pack: isPack(p), sessionsTotal: p.sessions_total || null, used: Math.min(u, p.sessions_total || u),
      status, statusLabel: STATUS_LABEL[status], owedPennies: owed, storedStatus: p.status || null, createdAt: p.created_at || null,
    }
  })

  // Monthly plans, with whether a card is saved and this month's bill.
  const planRows = (plans || []) as Row[]
  const planPlayers = Array.from(new Set(planRows.map(p => String(p.player_id)).filter(Boolean)))
  const [cards, bills, groups] = await Promise.all([
    planPlayers.length ? service.from('coach_pay_methods').select('player_id').eq('coach_id', academy).eq('status', 'active').in('player_id', planPlayers) : Promise.resolve({ data: [] as Row[] }),
    planRows.length ? db.from('coach_membership_bills').select('membership_id, period, status, charge_id').in('membership_id', planRows.map(p => p.id)) : Promise.resolve({ data: [] as Row[] }),
    db.from('coach_groups').select('id, name').eq('coach_id', academy),
  ])
  const withCard = new Set(((cards.data || []) as Row[]).map(r => String(r.player_id)))
  const billRows = (bills.data || []) as Row[]
  const chargeIds = billRows.map(b => b.charge_id).filter(Boolean)
  const { data: charges } = chargeIds.length ? await service.from('coach_charges').select('id, status').in('id', chargeIds) : { data: [] as Row[] }
  const chargeStatus = new Map(((charges || []) as Row[]).map(ch => [String(ch.id), String(ch.status)]))
  const groupName = new Map(((groups.data || []) as Row[]).map(g => [String(g.id), String(g.name)]))
  let monthlyTotal = 0
  const memberships = planRows.map(p => {
    const hasCard = withCard.has(String(p.player_id))
    const mine = billRows.filter(b => b.membership_id === p.id)
    const bill = mine.find(b => b.period === month)
    const state = monthState(p as any, { period: month, today, hasCard, bill: bill ? { status: bill.status, chargeStatus: bill.charge_id ? chargeStatus.get(String(bill.charge_id)) : null } : null })
    if (p.status === 'active' && p.agreed_at) monthlyTotal += Number(p.amount_pennies) || 0
    const billed = new Set(mine.filter(b => b.status === 'done' || b.status === 'charging').map(b => String(b.period)))
    return {
      id: p.id, playerId: p.player_id, playerName: roster.get(String(p.player_id)) || 'Player',
      name: p.name, amountPennies: p.amount_pennies, dayOfMonth: p.day_of_month, startsMonth: p.starts_month || null,
      covers: p.covers, groupId: p.group_id || null, status: p.status, agreed: !!p.agreed_at, notes: p.notes || null,
      words: planWords(p as any), coversWords: coversWords(p as any, p.group_id ? groupName.get(String(p.group_id)) : null),
      label: planLabel(p as any, hasCard), thisMonth: state.words, canTakeNow: state.canTake, hasCard,
      nextBill: p.status === 'active' && p.agreed_at ? nextBillDate(p as any, billed, today) : (p.starts_month ? monthWords(p.starts_month) : null),
    }
  })

  return NextResponse.json({
    month, canPrice: seat.isHead,
    totals: { earnedPennies: earned, outstandingPennies: outstanding, activePacks, expiringPacks: expiring, monthlyPennies: monthlyTotal, waitingToAgree: planRows.filter(p => p.status === 'offered').length },
    lines: shaped,
    memberships,
    packages: ((packages || []) as Row[]).map(k => ({ id: k.id, name: k.name, kind: k.kind || null, pricePennies: k.price == null ? null : toPennies(k.price), sessions: k.sessions || null, period: k.period || null, description: k.description || null })),
  }, noStore)
}
