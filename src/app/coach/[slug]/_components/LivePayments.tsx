'use client'

// Live Payments & Packages — the demo PaymentsView over real data. A coach-
// editable package price list (coach_packages), and per-player lesson packs
// (coach_payments) tracking sessions used vs the pack total, status and renewal.

import { useState, useEffect, type CSSProperties } from 'react'
import type { ThemeTokens, AccentTokens } from '@/app/cricket/[slug]/v2/_lib/theme'
import { V2_LABEL, V2_NOTES } from '@/lib/coach/v2'
import { FONT } from '@/app/cricket/[slug]/v2/_lib/theme'
import { useCoachTable, sb, currentCoachId, currentIdentity, getPreviewStaff } from '../_lib/coach-db'
import { getSettings, setSettings, isDemoPortal } from '../_lib/settings-store'
import { seedLumioPackages, PACKAGE_CHOICES } from '../_lib/lumio-packages'
import { SetupWizard } from './SetupWizard'
import { formatPounds, formatPennies, toPennies, sumPennies, parseAmount, isVoidPayment, paymentOwedPennies } from '@/lib/coach/money'
import { ukDate, ukMonth, daysBetweenIso } from '@/lib/coach/uk-date'
import { campMoney } from '@/lib/coach/camp-money'
import { tellApartHints } from '../_lib/tell-apart'
import { useAskBeforeClose } from '../_lib/ask-before-close'

// Package type → Equipment & Kit session-type checklist.
const KIND_TO_SESSION: Record<string, string> = { Private: 'Private lesson', Performance: 'Private lesson', Adult: 'Private lesson', Group: 'Group / squad', Junior: 'Group / squad', Cardio: 'Cardio Tennis' }
async function pushEquipmentToKit(kind: string, equipment: string) {
  try {
    const items = (equipment || '').split('\n').map(s => s.trim()).filter(Boolean)
    if (!items.length) return
    const uid = await currentCoachId(); if (!uid) return
    const st = KIND_TO_SESSION[kind] || 'Private lesson'
    const ex = await sb().from('coach_kit_items').select('label').eq('coach_id', uid).eq('session_type', st)
    const have = new Set((ex.data ?? []).map((r: any) => (r.label || '').toLowerCase()))
    const rows = items.filter(i => !have.has(i.toLowerCase())).map(label => ({ coach_id: uid, session_type: st, label }))
    if (rows.length) await sb().from('coach_kit_items').insert(rows)
  } catch (e) { console.warn('[payments] pushEquipmentToKit', e) }
}

type Pkg = { id: string; name: string; kind?: string | null; price?: number | null; sessions?: number | null; period?: string | null; description?: string | null; features?: string | null }
type Pay = { id: string; player_id?: string | null; player_name?: string | null; item?: string | null; amount?: number | null; status?: string | null; sessions_used?: number | null; sessions_total?: number | null; renews_date?: string | null; paid?: boolean | null; paid_at?: string | null; due_date?: string | null; notes?: string | null; created_at?: string | null }
type Player = { id: string; name: string; payment_method?: string | null; parent_name?: string | null; age?: number | null; year_group?: string | null; created_at?: string | null }
type Sess = { id: string; player_id?: string | null; player_name?: string | null; session_date?: string | null; focus?: string | null; rating?: number | null; created_at?: string | null; written?: boolean; kind?: 'private' | 'group' }
type Bk = { id: string; player_id?: string | null; player_name?: string | null; booking_date?: string | null; start_time?: string | null; type?: string | null; status?: string | null; created_at?: string | null }
type PayStatus = 'active' | 'expiring' | 'expired' | 'used' | 'overdue' | 'due' | 'settled' | 'void' | 'none'
// One line of the table. `used`/`sessions` are the lessons counted against THIS
// line: a pack's own lessons, or (on a line with no pack) the lessons no pack covers.
type RosterRow = { key: string; name: string; hint?: string | null; playerId?: string | null; assign: Pay | null; status: PayStatus; used: number; sessions: Sess[]; paysBy?: string | null; first?: boolean; count?: number; owes?: number; loose?: number }

const KINDS = ['Private', 'Performance', 'Adult', 'Group', 'Cardio', 'Junior']
const PAYG = 'Pay as you go'
// One formatter for every figure on this page — pounds and pence, to the penny.
const money = formatPounds
// An amount as it goes INTO a box for editing: "12.50", not "12.5" — and "40"
// stays "40". No £ and no thousands comma, so it reads back as typed.
const boxAmount = (v: unknown) => (v == null || v === '' ? '' : toPennies(v) % 100 ? (toPennies(v) / 100).toFixed(2) : String(toPennies(v) / 100))
const dk = (d?: string | null) => String(d ?? '').slice(0, 10)
const fmtD = (d?: string | null) => { const t = d ? new Date(`${dk(d)}T12:00:00Z`) : null; return t && !isNaN(t.getTime()) ? t.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' }) : '—' }

// A pack is something that runs: it has a number of sessions or a renewal date.
// Anything else is a one-off invoice — owed, or settled.
const isPack = (p: Pay) => (p.sessions_total || 0) > 0 || !!p.renews_date
// Refunded, cancelled or written off (the import keeps the word in the notes).
// Ticked "paid" so nobody chases it — but it is not money earned.
// Both come from the shared money file, so the dashboard adds up the same lines.
const isVoid = isVoidPayment
const owedPennies = paymentOwedPennies
// The day a pack was sold. There is no separate "start" date, so this is the
// day the line was added.
const soldOn = (p: Pay) => (p.created_at ? ukDate(p.created_at) : '')

// What to call a line RIGHT NOW, worked out from its dates and its tick rather
// than from the word stored on the row. The stored word was whatever the form
// defaulted to ("active"), so a pack ten days past its renewal still read
// ACTIVE. The one stored word still honoured is "overdue": a coach saying
// "chase this" is a fact the dates cannot know.
function statusOf(p: Pay, used: number, today: string): PayStatus {
  if (isVoid(p)) return 'void'
  const owed = owedPennies(p) > 0
  const late = owed && (p.status === 'overdue' || (!!p.due_date && dk(p.due_date) < today))
  if (isPack(p)) {
    const days = p.renews_date ? daysBetweenIso(today, dk(p.renews_date)) : null
    if (late) return 'overdue'
    if (days != null && days < 0) return 'expired'
    if ((p.sessions_total || 0) > 0 && used >= (p.sessions_total || 0)) return 'used'
    if (days != null ? days <= 14 : p.status === 'expiring') return 'expiring'
    return 'active'
  }
  if (toPennies(p.amount) <= 0) return 'none'     // pay as you go, or nothing to pay
  if (p.paid) return 'settled'
  return late ? 'overdue' : 'due'
}
const STATUS_LABEL: Record<PayStatus, string> = { active: 'Active', expiring: 'Expiring', expired: 'Expired', used: 'Used up', overdue: 'Overdue', due: 'Due', settled: 'Settled', void: 'Not owed', none: 'No charge' }
// The words a person would use for a line that is not an ordinary status.
const badgeFor = (p: Pay, s: PayStatus) => {
  if (s === 'void') { const m = /refund|cancel|written off|void/i.exec(`${p.notes || ''} ${p.status || ''}`)?.[0].toLowerCase(); return m === 'refund' ? 'Refunded' : m === 'cancel' ? 'Cancelled' : m === 'written off' ? 'Written off' : 'Void' }
  if (s === 'none') return (p.item || '') === PAYG ? PAYG : toPennies(p.amount) < 0 ? 'Credit' : 'No charge'
  return STATUS_LABEL[s]
}

// Which lessons count against which pack.
//
// It used to be "every lesson this player has ever had", applied to every one of
// their packs — so a pack sold today was already used up by last month's
// lessons, and one lesson came off two packs at once. Now each lesson is given
// to ONE pack: the oldest that was already sold on the day of the lesson, had
// not passed its renewal date, and still has room. A lesson no pack covers is
// left over ("pay as you go").
//
// Limitation, stated rather than hidden: a lesson carries no link to a pack, so
// this is worked out from dates. A pack entered late (sold a month ago, typed in
// today) does not pick up the lessons taken before it was entered.
function allocateLessons(packs: Pay[], lessons: Sess[]): { byPack: Map<string, Sess[]>; loose: Sess[] } {
  const byPack = new Map<string, Sess[]>()
  const loose: Sess[] = []
  const ordered = packs.filter(p => (p.sessions_total || 0) > 0)
    .sort((a, b) => String(a.created_at || '').localeCompare(String(b.created_at || '')))
  for (const p of ordered) byPack.set(p.id, [])
  const dateOf = (s: Sess) => dk(s.session_date) || (s.created_at ? ukDate(s.created_at) : '')
  // A private lesson comes off a private pack and a squad session off a group
  // term — a child with both had their private lessons used up the term pass.
  // Where the player has no pack of that kind, any pack may take it, as before.
  const kindOf = (p: Pay) => /group|squad|term|cardio|club night/i.test(p.item || '') ? 'group' : 'private'
  for (const s of [...lessons].sort((a, b) => dateOf(a).localeCompare(dateOf(b)))) {
    const day = dateOf(s)
    const fits = (p: Pay) => {
      const got = byPack.get(p.id) as Sess[]
      return !!day && soldOn(p) <= day && (!p.renews_date || day <= dk(p.renews_date)) && got.length < (p.sessions_total || 0)
    }
    const want = s.kind || 'private'
    const sameKind = ordered.filter(p => kindOf(p) === want)
    const pack = sameKind.length ? sameKind.find(fits) : ordered.find(fits)
    if (pack) (byPack.get(pack.id) as Sess[]).push(s); else loose.push(s)
  }
  return { byPack, loose }
}

export function LivePayments({ T, accent }: { T: ThemeTokens; accent: AccentTokens }) {
  const packages = useCoachTable<Pkg>('coach_packages')
  const payments = useCoachTable<Pay>('coach_payments')
  const sessions = useCoachTable<Sess>('coach_sessions')
  const bookings = useCoachTable<Bk>('coach_bookings')
  const attendance = useCoachTable<{ player_id?: string | null; session_date?: string | null; present?: boolean | null }>('coach_attendance')
  const { rows: players } = useCoachTable<Player>('coach_players')
  const camps = useCoachTable<{ id: string; price?: number | null; capacity?: number | null }>('coach_camps')
  const campAttendees = useCoachTable<{ camp_id: string; paid?: boolean | null; amount_pennies?: number | null; status?: string | null }>('coach_camp_attendees')
  const [editPkg, setEditPkg] = useState<Pkg | 'new' | null>(null)
  const [editPay, setEditPay] = useState<Pay | 'new' | null>(null)
  const [runSheet, setRunSheet] = useState<RosterRow | null>(null)
  // The player (by id) the assign form opens on, when it is opened from a player's line.
  const [assignPrefill, setAssignPrefill] = useState<string | null>(null)
  const [pay, setPay] = useState<{ amount?: number; description?: string; player_name?: string; payment_id?: string } | null>(null)
  const [payConnected, setPayConnected] = useState<boolean | null>(null)
  // A coach sees, takes and marks paid the payments for THEIR players (the rows
  // are limited to those — migration 188). The price list is the academy's: they
  // can put a player on a pack, but only the head coach changes the prices.
  const [canPrice, setCanPrice] = useState(true)
  useEffect(() => { currentIdentity().then(me => setCanPrice(!getPreviewStaff() && (me?.isHead ?? true))).catch(() => {}) }, [])
  useEffect(() => { fetch('/api/coach/pay/status').then(r => r.json()).then(d => setPayConnected(!!d.chargesEnabled)).catch(() => setPayConnected(false)) }, [])

  // Returning from Stripe checkout (success_url `?paid=1`): the webhook is the
  // source of truth, but refresh so the just-paid pack flips to Paid promptly.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const p = new URLSearchParams(window.location.search)
    if (p.get('paid') === '1') {
      payments.reload()
      p.delete('paid')
      const qs = p.toString()
      window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // First visit used to SILENTLY insert all six Lumio packages, so a new coach's
  // price list was somebody else's prices until they noticed and edited them —
  // and a price list is the one thing a coach must own. It now offers a choice
  // (see SetupWizard). `packagesSeeded` is reused as "the coach has answered
  // this", so "start empty" is remembered rather than re-asked every visit.
  const [setupAnswered, setSetupAnswered] = useState(false)
  // NOTE: an earlier version of this flipped `packagesSeeded` to true whenever the
  // coach had packages. That fought the Settings toggle — switching the starter
  // packages off while holding packages would silently switch itself back on. It
  // was also redundant: showSetup already requires an empty price list, so a coach
  // with packages never sees the wizard regardless of the flag.

  const showSetup = !isDemoPortal() && canPrice
    && !packages.loading && packages.rows.length === 0
    && !setupAnswered && !getSettings().packagesSeeded

  const finishSetup = () => { setSettings({ packagesSeeded: true }); setSetupAnswered(true) }
  const applySetup = async (sel: Record<string, string[]>) => { await seedLumioPackages(sel.packages); finishSetup(); packages.reload() }
  const loadAllSetup = async () => { await seedLumioPackages(); finishSetup(); packages.reload() }

  // Lesson packages are driven by the roster: every player appears, on a package
  // or "pay as you go". Sessions used are the lessons taken (see lessonsTaken below)
  // (coach_sessions) — no manual ticking.
  const today = ukDate()
  const nameKey = (s?: string | null) => (s || '').trim().toLowerCase()
  //
  // WHOSE line is it. By the player's id, never by their name: two children
  // called Bob Brown are two families, and grouping by name showed each of them
  // the other's invoices and one merged total. A line with no id (an older row,
  // or one saved before the player was on the roster) is placed by name only
  // when exactly one player has that name; otherwise it is listed on its own,
  // marked as not linked, rather than guessed onto somebody.
  const playerById = new Map(players.map(pl => [pl.id, pl]))
  const playersByName = new Map<string, Player[]>()
  for (const pl of players) { const k = nameKey(pl.name); playersByName.set(k, [...(playersByName.get(k) || []), pl]) }
  const ownerKey = (r: { player_id?: string | null; player_name?: string | null }) => {
    if (r.player_id && playerById.has(r.player_id)) return `id:${r.player_id}`
    const same = playersByName.get(nameKey(r.player_name)) || []
    return !r.player_id && same.length === 1 ? `id:${same[0].id}` : `name:${nameKey(r.player_name)}`
  }
  const group = <R extends { player_id?: string | null; player_name?: string | null }>(rows: R[]) => {
    const m = new Map<string, R[]>()
    for (const r of rows) { const k = ownerKey(r); m.set(k, [...(m.get(k) || []), r]) }
    return m
  }
  const paysByOwner = group(payments.rows)
  // What comes off a pack is a lesson TAKEN, not a lesson written up: a booking
  // for that player that has happened (not cancelled, not still waiting to be
  // confirmed, not a court block) where they were not marked absent. Counting
  // write-ups meant a coach who did not write up every lesson had packs that
  // never ran down — nine lessons in and the family's ten-pack still showed
  // seven left. A write-up with no booking behind it still counts, so nothing
  // that counted before is lost. Where a lesson was written up, its focus and
  // rating are shown against it.
  const nowHM = new Date().toLocaleTimeString('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hour12: false })
  const lessonsTaken: Sess[] = (() => {
    const key = (pid: unknown, d: unknown) => `${pid}|${dk(d as string)}`
    const absent = new Set(attendance.rows.filter(a => a.present === false && a.player_id).map(a => key(a.player_id, a.session_date)))
    const writeUps = new Map(sessions.rows.filter(w => w.player_id).map(w => [key(w.player_id, w.session_date), w]))
    const out: Sess[] = [], seen = new Set<string>()
    for (const b of bookings.rows) {
      const d = dk(b.booking_date)
      if (!b.player_id || !d || b.status === 'cancelled' || b.status === 'pending' || b.type === 'Block') continue
      if (d > today || (d === today && (b.start_time || '99:99') > nowHM)) continue
      const k = key(b.player_id, d)
      if (absent.has(k) || seen.has(k)) continue
      seen.add(k)
      const w = writeUps.get(k)
      out.push({ id: b.id, player_id: b.player_id, player_name: b.player_name, session_date: d, focus: w?.focus || b.type || 'Lesson', rating: w?.rating ?? null, created_at: b.created_at, written: !!w,
        kind: /group|squad|cardio|match/i.test(b.type || '') ? 'group' : 'private' })
    }
    for (const w of sessions.rows) {
      const k = w.player_id ? key(w.player_id, w.session_date) : ''
      if (k && seen.has(k)) continue
      if (k) seen.add(k)
      out.push({ ...w, written: true })
    }
    // A squad session is booked for the group, not for each child, so the
    // player's own record of it is their attendance mark.
    for (const a of attendance.rows) {
      const d = dk(a.session_date)
      if (!a.player_id || a.present === false || !d || d > today) continue
      const k = key(a.player_id, d)
      if (seen.has(k)) continue
      seen.add(k)
      const w = writeUps.get(k)
      out.push({ id: `att:${k}`, player_id: a.player_id, session_date: d, focus: w?.focus || 'Group session', rating: w?.rating ?? null, written: !!w, kind: 'group' })
    }
    return out
  })()
  const lessonsByOwner = group(lessonsTaken)
  // Something to tell two players with the same name apart, shown under the name.
  // The shared rule, so the hint here matches the one in the form and on the
  // other screens — and two namesakes never get the same one.
  const hints = tellApartHints(players)
  const tellApart = (pl: Player) => { const h = hints.get(pl.id); return h ? h.replace(/^./, c => c.toUpperCase()) : null }
  //
  // One line per invoice, not one per player. A child with a term fee, a camp
  // and a racket has three lines, grouped under their name with what they owe
  // in total — showing only the first hid the other two and made a family that
  // owed £340 look as if it owed £60.
  // What is owed comes first, oldest due date at the top.
  const inOrder = (list: Pay[]) => [...list].sort((a, b) => Number(!!a.paid) - Number(!!b.paid) || (a.due_date || a.renews_date || '9').localeCompare(b.due_date || b.renews_date || '9'))
  const linesFor = (key: string, name: string, paysBy: string | null, hint: string | null, playerId: string | null): RosterRow[] => {
    const list = inOrder(paysByOwner.get(key) || [])
    const { byPack, loose } = allocateLessons(list, lessonsByOwner.get(key) || [])
    if (!list.length) return [{ key, name, hint, playerId, assign: null, status: 'none', used: loose.length, sessions: loose, paysBy, first: true, count: 0, owes: 0, loose: loose.length }]
    const owes = list.reduce((n, p) => n + owedPennies(p), 0)
    return list.map((p, i) => {
      const mine = byPack.get(p.id)
      const ss = mine || loose
      return { key, name, hint, playerId, assign: p, status: statusOf(p, mine ? mine.length : 0, today), used: ss.length, sessions: ss, paysBy, first: i === 0, count: list.length, owes, loose: loose.length }
    })
  }
  const rosterRows: RosterRow[] = players.flatMap(pl => linesFor(`id:${pl.id}`, pl.name, pl.payment_method || null, tellApart(pl), pl.id))
  const extraKeys = [...paysByOwner.keys()].filter(k => k.startsWith('name:'))
  const extraRows: RosterRow[] = extraKeys.flatMap(k => {
    const shared = (playersByName.get(k.slice(5)) || []).length > 1
    return linesFor(k, (paysByOwner.get(k) || [])[0]?.player_name || '—', null, shared ? 'Not linked to a player — more than one has this name. Open the line and choose which.' : 'Not on your roster', null)
  })
  const lessonRows = [...rosterRows, ...extraRows]
  const payRows = lessonRows.filter(r => r.assign) as (RosterRow & { assign: Pay })[]

  const statusColour = (s: PayStatus) => s === 'overdue' || s === 'expired' ? T.bad : s === 'expiring' || s === 'due' ? T.warn : s === 'none' || s === 'used' || s === 'void' ? T.text3 : T.good
  // Earned = money that came in THIS calendar month (UK time), by the day it was
  // marked paid. It used to be every payment ever ticked, under the same label.
  // A refunded or cancelled invoice is ticked off but is not income.
  const month = ukMonth()
  const monthName = new Date(`${month}-15T12:00:00Z`).toLocaleDateString('en-GB', { month: 'long', timeZone: 'UTC' })
  const earnedRows = payments.rows.filter(p => p.paid && !isVoid(p) && !!p.paid_at && ukMonth(p.paid_at) === month)
  const earned = sumPennies(earnedRows.map(p => p.amount))
  // Ticked paid with no date: real money, but there is no knowing which month.
  const undated = payments.rows.filter(p => p.paid && !isVoid(p) && !p.paid_at && toPennies(p.amount) > 0).length
  const outstanding = payments.rows.reduce((n, p) => n + owedPennies(p), 0)
  // Packs only. A one-off invoice or a "pay as you go" line is not a package.
  const activeCount = payRows.filter(r => isPack(r.assign) && (r.status === 'active' || r.status === 'expiring')).length
  const expiringCount = payRows.filter(r => isPack(r.assign) && r.status === 'expiring').length
  // Marking paid also clears a stored "overdue" — the line has been settled.
  const togglePaid = async (p: Pay) => { await payments.edit(p.id, { paid: !p.paid, paid_at: !p.paid ? new Date().toISOString() : null, ...(!p.paid && p.status === 'overdue' ? { status: 'active' } : {}) }) }

  // Camp fees live on each camp, not here. Said out loud, with the figures, so a
  // coach reading "Outstanding £0" does not conclude that nothing is owed.
  const campTotals = camps.rows.reduce((t, c) => {
    const m = campMoney(c, campAttendees.rows.filter(a => a.camp_id === c.id))
    return { collected: t.collected + toPennies(m.collected), owed: t.owed + toPennies(m.outstanding) }
  }, { collected: 0, owed: 0 })

  // Earned is green and Outstanding red whatever the accent: with the red accent
  // the two tiles were the same colour.
  const tiles: [string, string, string][] = [
    [`Earned in ${monthName}`, formatPennies(earned), T.good],
    ['Outstanding', formatPennies(outstanding), T.bad],
    ['Active packages', String(activeCount), T.good],
    ['Expiring soon', String(expiringCount), T.warn],
  ]

  const sectOff = getSettings().sectionsOff?.payments || []
  const showSec = (k: string) => !sectOff.includes(k)

  return (
    <div style={{ fontFamily: FONT }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.text }}>Payments &amp; Packages</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: T.text3 }}>Lesson packs, credits used and what’s outstanding.{(() => { const r = getSettings().privateRate; return r > 0 ? ` · Private ${formatPounds(r)}/hr` : '' })()}</p>
        </div>
        {/* Card payments are V2. The button stays — a coach who has connected a
            bank can still use it — but it says what it is until then. */}
        <button onClick={() => setPay({})}
          title={payConnected ? 'Card · Apple Pay · Google Pay' : V2_NOTES.payments}
          style={{ appearance: 'none', border: payConnected ? 0 : `1px solid ${T.border}`, background: payConnected ? accent.hex : 'transparent', color: payConnected ? T.btnText : T.text3, borderRadius: 10, padding: '9px 15px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, display: 'flex', alignItems: 'center', gap: 8 }}>
          💳 Take a payment
          {!payConnected && <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: accent.hex, background: accent.dim, borderRadius: 999, padding: '2px 7px' }}>{V2_LABEL}</span>}
        </button>
      </div>

      {showSetup && (
        <div style={{ marginBottom: 16 }}>
          <SetupWizard T={T} accent={accent}
            title="Build your price list"
            blurb="Pick the packages you want to offer. Prices are Lumio's suggestions — edit them to yours once they're in, or start empty and write your own from scratch."
            groups={[{ key: 'packages', title: 'Suggested packages', hint: 'Edit names, prices and features after adding', options: PACKAGE_CHOICES }]}
            onApply={applySetup} onLoadAll={loadAllSetup} onSkip={finishSetup} />
        </div>
      )}

      <div style={{ display: showSec('stats') ? 'grid' : 'none', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 16 }}>
        {tiles.map(([l, v, c]) => (
          <div key={l} style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{l}</div>
            <div title={l === 'Expiring soon' ? 'Packs with a renewal date in the next 14 days' : undefined} style={{ fontSize: v.length > 10 ? 19 : v.length > 8 ? 22 : 26, fontWeight: 700, color: c, marginTop: 4, overflowWrap: 'anywhere' }}>{v}</div>
          </div>
        ))}
      </div>
      {showSec('stats') && (undated > 0 || campTotals.collected > 0 || campTotals.owed > 0) && (
        <div style={{ fontSize: 11.5, color: T.text3, lineHeight: 1.55, margin: '-6px 0 16px' }}>
          {undated > 0 && <div>{undated} paid {undated === 1 ? 'invoice has' : 'invoices have'} no payment date, so {undated === 1 ? 'it is' : 'they are'} not counted in any month.</div>}
          {(campTotals.collected > 0 || campTotals.owed > 0) && <div>Camp fees are not in these totals — they are kept on each camp’s Finance tab. Across your camps: {formatPennies(campTotals.collected)} collected, {formatPennies(campTotals.owed)} still owed.</div>}
        </div>
      )}

      {/* Packages on offer */}
      <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, marginBottom: 16, display: showSec('packages') ? undefined : 'none' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>Packages on offer</div>
          <span style={{ fontSize: 11.5, color: T.text3 }}>{canPrice ? 'Your price list — what players can buy.' : 'The academy’s price list — set by the head coach.'}</span>
          {canPrice && <button onClick={() => setEditPkg('new')} style={{ marginLeft: 'auto', appearance: 'none', border: 0, background: accent.hex, color: T.btnText, borderRadius: 9, padding: '8px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>+ Add package</button>}
        </div>
        {packages.rows.length === 0 ? <div style={{ fontSize: 12.5, color: T.text3, padding: '6px 0' }}>{canPrice ? 'No packages yet — add your first to build your price list.' : 'The head coach hasn’t set up any packages yet.'}</div> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 12 }}>
            {packages.rows.map(pk => (
              <div key={pk.id} style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, padding: 14, position: 'relative' }}>
                {canPrice && <button className="cm-tap" aria-label={`Remove ${pk.name}`} onClick={async () => { if (confirm(`Remove ${pk.name}?`)) packages.remove(pk.id) }} style={{ position: 'absolute', top: 8, right: 8, appearance: 'none', border: 0, background: 'transparent', color: T.text3, cursor: 'pointer', fontSize: 15 }}>×</button>}
                {pk.kind && <span style={{ fontSize: 8.5, fontWeight: 700, color: accent.hex, background: accent.dim, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase' }}>{pk.kind}</span>}
                <div onClick={() => { if (canPrice) setEditPkg(pk) }} style={{ cursor: canPrice ? 'pointer' : 'default' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginTop: 8 }}>{pk.name}</div>
                  <div style={{ marginTop: 6 }}><span style={{ fontSize: 20, fontWeight: 700, color: T.text }}>{pk.price == null ? 'No price set' : toPennies(pk.price) === 0 ? 'Free' : money(pk.price)}</span><span style={{ fontSize: 11, color: T.text3 }}> {pk.period || ''}{pk.sessions ? ` · ${pk.sessions} ${Number(pk.sessions) === 1 ? 'session' : 'sessions'}` : ''}</span></div>
                  {pk.description && <div style={{ fontSize: 11.5, color: T.text2, marginTop: 8, lineHeight: 1.45 }}>{pk.description}</div>}
                  {!!(pk.features || '').trim() && <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {(pk.features || '').split('\n').map(s => s.trim()).filter(Boolean).map((f, i) => <div key={i} style={{ display: 'flex', gap: 6, fontSize: 11.5, color: T.text2 }}><span style={{ color: T.good }}>✓</span>{f}</div>)}
                  </div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lesson packages (per player) */}
      <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, display: showSec('lessonpacks') ? undefined : 'none' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: T.text }}>Lesson packages</div>
          <span style={{ fontSize: 11.5, color: T.text3 }}>Every player and every invoice — what is owed first. Sessions tick off automatically as booked lessons take place.</span>
          <button onClick={() => setEditPay('new')} style={{ marginLeft: 'auto', appearance: 'none', border: `1px solid ${accent.border}`, background: accent.dim, color: accent.hex, borderRadius: 9, padding: '8px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>+ Assign package</button>
        </div>
        {lessonRows.length === 0 ? <div style={{ fontSize: 12.5, color: T.text3 }}>No players on the roster yet — add players in Player Roster and they’ll appear here.</div> : (
          <div style={{ overflowX: 'auto' }}>
            {/* On a phone the eight columns ran off the side — Cost, Status and
                Paid could only be found by scrolling sideways. Below 768px each
                line becomes a small block with its labels beside the values. */}
            <style>{`@media (max-width: 768px){
              .lp-table{ min-width:0 !important; display:block }
              .lp-table thead{ display:none }
              .lp-table tbody{ display:block }
              .lp-table tr{ display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:2px 8px; padding:8px 0 }
              .lp-table td{ padding:3px 4px !important; min-width:0 !important }
              .lp-table td.lp-wide{ grid-column:1 / -1 }
              .lp-table td.lp-empty{ display:none }
              .lp-table td[data-label]::before{ content:attr(data-label); display:block; font-size:9px; font-weight:600; letter-spacing:0.05em; text-transform:uppercase; opacity:0.6; margin-bottom:2px }
            }`}</style>
            <table className="lp-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: 780 }}>
              <thead><tr>{['Player', 'Plan / invoice', 'Used', 'Cost', 'Pays by', 'Status', 'Paid', 'Due / renews'].map(h => <th key={h} style={{ textAlign: 'left', fontSize: 10, color: T.text3, fontWeight: 600, padding: '6px 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>)}</tr></thead>
              <tbody>
                {lessonRows.map(r => {
                  const a = r.assign
                  const total = a?.sessions_total || 0
                  const used = total ? Math.min(r.used, total) : r.used
                  const s = r.status
                  const pct = total ? Math.min(100, used / total * 100) : 0
                  const bar = s === 'overdue' || s === 'expired' ? T.bad : accent.hex
                  const badge = a ? badgeFor(a, s) : ''
                  const badgeColour = statusColour(s)
                  // Something to pay: only then is there anything to mark paid.
                  const payable = !!a && toPennies(a.amount) > 0
                  return (
                    <tr key={a?.id || `none:${r.key}`} onClick={() => setRunSheet(r)} style={{ borderTop: r.first ? `1px solid ${T.border}` : 0, cursor: 'pointer' }}>
                      {/* The name and the running total sit on a player's first
                          line; their other invoices tuck in underneath. */}
                      <td className={r.first ? 'lp-wide' : 'lp-empty'} style={{ padding: r.first ? '10px 10px' : '4px 10px 10px', fontSize: 12.5, color: T.text, fontWeight: 600, verticalAlign: 'top' }}>{r.first ? (
                        <>
                          {r.name}
                          {/* Two players can share a name. This is what tells them apart. */}
                          {r.hint && <div style={{ fontSize: 10.5, fontWeight: 500, marginTop: 2, color: T.text3 }}>{r.hint}</div>}
                          {(r.count || 0) > 1 || (r.owes || 0) > 0 ? (
                            <div style={{ fontSize: 10.5, fontWeight: 600, marginTop: 2, color: (r.owes || 0) > 0 ? T.bad : T.good, whiteSpace: 'nowrap' }}>
                              {(r.owes || 0) > 0 ? `Owes ${formatPennies(r.owes || 0)}` : 'All paid'}{(r.count || 0) > 1 ? ` · ${r.count} invoices` : ''}
                            </div>
                          ) : null}
                        </>
                      ) : null}</td>
                      <td data-label="Plan / invoice" style={{ padding: r.first ? '10px 10px' : '4px 10px 10px', fontSize: 12, color: a ? T.text2 : T.text3 }}>{a ? (a.item || 'Payment') : 'No plan — pay as you go'}</td>
                      <td data-label="Used" style={{ padding: '10px 10px', minWidth: 140 }}>
                        {total ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 6, borderRadius: 3, background: T.hover, overflow: 'hidden' }}><div style={{ width: `${pct}%`, height: '100%', background: bar }} /></div>
                            <span style={{ fontSize: 10.5, color: T.text3 }}>{used}/{total}</span>
                          </div>
                        ) : r.first ? <span style={{ fontSize: 11, color: T.text3 }}>{r.loose || 0} logged · PAYG</span> : <span style={{ fontSize: 11, color: T.text3 }}>—</span>}
                      </td>
                      <td data-label="Cost" style={{ padding: '10px 10px', fontSize: 12, color: a && toPennies(a.amount) ? T.text : T.text3, whiteSpace: 'nowrap' }}>{a && toPennies(a.amount) ? money(a.amount) : '—'}</td>
                      {/* How they pay. An unpaid pack on a standing order is
                          money on its way; an unpaid pack on cash is a
                          conversation on Saturday. Same badge, different job. */}
                      <td data-label="Pays by" style={{ padding: '10px 10px' }}>{r.paysBy
                        ? <span style={{ fontSize: 10, fontWeight: 600, color: T.text2, background: T.hover, padding: '3px 8px', borderRadius: 5, whiteSpace: 'nowrap' }}>{r.paysBy}</span>
                        : <span style={{ fontSize: 11, color: T.text3 }}>—</span>}</td>
                      <td data-label="Status" style={{ padding: '10px 10px' }}>{a
                        ? <span style={{ fontSize: 9.5, fontWeight: 700, color: badgeColour, background: s === 'none' || s === 'used' || s === 'void' ? T.hover : `${badgeColour}22`, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{badge}</span>
                        : <span style={{ fontSize: 9.5, fontWeight: 700, color: T.text3, background: T.hover, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Pay as you go</span>}</td>
                      {/* A refunded or cancelled line has no tick to flip: it is not owed
                          either way, and un-ticking it used to make it look as if it were. */}
                      <td data-label="Paid" style={{ padding: '10px 10px' }}>{a && s !== 'void' && (payable || a.paid)
                        ? <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <button onClick={e => { e.stopPropagation(); togglePaid(a).catch(() => {}) }} title="Click to mark paid / unpaid" style={{ appearance: 'none', cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap', fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', padding: '3px 9px', borderRadius: 5, border: `1px solid ${a.paid ? T.good : T.warn}`, background: a.paid ? `${T.good}22` : 'transparent', color: a.paid ? T.good : T.warn }}>{a.paid ? '✓ Paid' : 'Mark paid'}</button>
                            {!a.paid && payConnected && payable && (
                              <button onClick={e => { e.stopPropagation(); setPay({ payment_id: a.id, amount: Number(a.amount) || undefined, description: (a.item ? `${a.item} — ${a.player_name || ''}` : `Tennis coaching — ${a.player_name || ''}`).trim(), player_name: a.player_name || undefined }) }} title="Take a card / Apple Pay payment — auto-marks this pack paid" style={{ appearance: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', padding: '3px 9px', borderRadius: 5, border: 0, background: accent.hex, color: T.btnText }}>💳 Collect</button>
                            )}
                          </div>
                        : <span style={{ fontSize: 12, color: T.text3 }}>—</span>}</td>
                      <td data-label="Due / renews" style={{ padding: '10px 10px', fontSize: 12, color: T.text2 }}>{a ? fmtD(a.renews_date || a.due_date) : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {runSheet && <PackageRunSheet T={T} accent={accent} row={runSheet}
        onClose={() => setRunSheet(null)}
        onTakePayment={() => { const r = runSheet; setRunSheet(null); setPay({ amount: Number(r.assign?.amount) || undefined, description: r.assign?.item ? `${r.assign.item} — ${r.name}` : `Tennis coaching — ${r.name}`, player_name: r.name }) }}
        onEditPlan={() => { const a = runSheet.assign; const pid = runSheet.playerId || null; setRunSheet(null); if (a) setEditPay(a); else { setAssignPrefill(pid); setEditPay('new') } }} />}
      {pay && <PayModal T={T} accent={accent} connected={payConnected} init={pay} onClose={() => setPay(null)} />}
      {editPkg && <PackageForm T={T} accent={accent} pkg={editPkg === 'new' ? null : editPkg} onClose={() => setEditPkg(null)} onSave={async v => { if (editPkg === 'new') await packages.add(v); else await packages.edit(editPkg.id, v); setEditPkg(null) }} />}
      {editPay && <AssignForm T={T} accent={accent} players={players} packages={packages.rows} pay={editPay === 'new' ? null : editPay} prefillPlayerId={assignPrefill}
        onClose={() => { setEditPay(null); setAssignPrefill(null) }}
        onDelete={editPay !== 'new' ? async () => { await payments.remove(editPay.id); setEditPay(null) } : undefined}
        onSave={async v => { if (editPay === 'new') await payments.add(v); else await payments.edit(editPay.id, v); setEditPay(null); setAssignPrefill(null) }} />}
    </div>
  )
}

const field = (T: ThemeTokens): CSSProperties => ({ width: '100%', background: T.panel2, color: T.text, border: `1px solid ${T.border}`, borderRadius: 9, padding: '9px 11px', fontSize: 13, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' })
const lab = (T: ThemeTokens): CSSProperties => ({ display: 'block', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: T.text3, margin: '0 0 5px' })
// What went wrong, directly under the field it is about.
const fieldErr = (T: ThemeTokens, msg?: string) => msg ? <div role="alert" style={{ fontSize: 11.5, color: T.bad, marginTop: 4, lineHeight: 1.4 }}>{msg}</div> : null
// Escape closes a dialog, the same as clicking outside it.
function useEscape(onClose: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
// "How many sessions": blank is allowed (not every plan counts sessions), but
// what is typed has to be a whole number. 2.5 used to reach the database, be
// refused there, and leave the form sitting open with no word of explanation.
function parseSessions(input: unknown): { ok: true; value: number | null } | { ok: false; error: string } {
  const t = String(input ?? '').trim()
  if (!t) return { ok: true, value: null }
  if (!/^\d+$/.test(t)) return { ok: false, error: 'Enter a whole number of sessions, for example 10.' }
  const n = Number(t)
  if (n < 1) return { ok: false, error: 'Enter at least 1 session, or leave this empty.' }
  if (n > 500) return { ok: false, error: 'That is more than 500 sessions. Check the number and try again.' }
  return { ok: true, value: n }
}
// A save the server turned down. The offline message is already written for a
// person; anything else is database wording, so it is replaced.
const saveProblem = (e: unknown) => {
  const m = e instanceof Error ? e.message : ''
  return /^That was not saved/.test(m) ? m : 'That could not be saved. Check the details and try again.'
}
// `snapshot` is everything a form holds, as one string. A form that passes it
// asks before a tap on the dark margin throws away what was typed (the same
// rule as Add player and Add booking); a dialog with nothing to lose does not.
function Shell({ T, title, onClose, children, footer, snapshot = '' }: { T: ThemeTokens; title: string; onClose: () => void; children: React.ReactNode; footer: React.ReactNode; snapshot?: string }) {
  useEscape(onClose)
  const closeOutside = useAskBeforeClose(snapshot, onClose)
  return (
    <div onClick={e => { if (e.target === e.currentTarget) closeOutside() }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, fontFamily: FONT, padding: '5vh 16px', overflowY: 'auto' }}>
      <div role="dialog" aria-modal="true" aria-label={title} style={{ width: '100%', maxWidth: 460, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 14 }}>{title}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18 }}>{footer}</div>
      </div>
    </div>
  )
}

function PackageForm({ T, accent, pkg, onClose, onSave }: { T: ThemeTokens; accent: AccentTokens; pkg: Pkg | null; onClose: () => void; onSave: (v: Record<string, any>) => Promise<void> }) {
  const [d, setD] = useState<Record<string, any>>({ name: pkg?.name || '', kind: pkg?.kind || 'Private', price: boxAmount(pkg?.price), sessions: pkg?.sessions ?? '', period: pkg?.period || 'per pack', description: pkg?.description || '', features: pkg?.features || '', equipment: (pkg as any)?.equipment || '' })
  const [saving, setSaving] = useState(false)
  const [errs, setErrs] = useState<{ name?: string; price?: string; sessions?: string; save?: string }>({})
  const set = (k: string, v: any) => { setD(p => ({ ...p, [k]: v })); setErrs(e => ({ ...e, [k]: undefined, save: undefined })) }
  const save = async () => {
    if (saving) return
    // A package can be free (a taster), so £0 is allowed here — but the price
    // has to be typed: it is the one thing a price list is for.
    const price = parseAmount(d.price, { allowZero: true })
    const sessions = parseSessions(d.sessions)
    const next = {
      name: String(d.name).trim() ? undefined : 'Give the package a name.',
      price: price.ok ? undefined : (String(d.price ?? '').trim() ? price.error : 'Enter a price, for example 40. Enter 0 if it is free.'),
      sessions: sessions.ok ? undefined : sessions.error,
    }
    setErrs(next)
    if (next.name || !price.ok || !sessions.ok) return
    setSaving(true)
    try {
      await onSave({ name: String(d.name).trim(), kind: d.kind, price: price.pounds, sessions: sessions.value, period: d.period, description: d.description, features: d.features, equipment: d.equipment })
      await pushEquipmentToKit(d.kind, d.equipment)
    } catch (e) { setErrs({ save: saveProblem(e) }) } finally { setSaving(false) }
  }
  return (
    <Shell T={T} title={pkg ? 'Edit package' : 'Add a package'} onClose={onClose} snapshot={JSON.stringify(d)}
      footer={<>
        <button onClick={onClose} style={{ marginLeft: 'auto', appearance: 'none', padding: '8px 14px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
        <button onClick={save} disabled={saving} style={{ appearance: 'none', border: 0, padding: '8px 16px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.5 : 1, fontFamily: FONT }}>{saving ? 'Saving…' : pkg ? 'Save' : '+ Add package'}</button>
      </>}>
      <div><label style={lab(T)}>Package name *</label><input value={d.name} onChange={e => set('name', e.target.value)} placeholder="e.g. 10-lesson private pack" style={field(T)} />{fieldErr(T, errs.name)}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div><label style={lab(T)}>Type</label><select value={d.kind} onChange={e => set('kind', e.target.value)} style={{ ...field(T), cursor: 'pointer' }}>{KINDS.map(k => <option key={k} value={k}>{k}</option>)}</select></div>
        <div><label style={lab(T)}>Sessions</label><input inputMode="numeric" value={d.sessions} onChange={e => set('sessions', e.target.value)} style={field(T)} />{fieldErr(T, errs.sessions)}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div><label style={lab(T)}>Price (£) *</label><input inputMode="decimal" value={d.price} onChange={e => set('price', e.target.value)} placeholder="e.g. 40 or 12.50" style={field(T)} />{fieldErr(T, errs.price)}</div>
        <div><label style={lab(T)}>Billing</label><select value={d.period} onChange={e => set('period', e.target.value)} style={{ ...field(T), cursor: 'pointer' }}>{['per pack', 'per month', 'per term'].map(p => <option key={p} value={p}>{p.replace('per ', 'Per ')}</option>)}</select></div>
      </div>
      <div><label style={lab(T)}>Description</label><input value={d.description} onChange={e => set('description', e.target.value)} placeholder="One line about this package" style={field(T)} /></div>
      <div><label style={lab(T)}>What’s included (one per line)</label><textarea value={d.features} onChange={e => set('features', e.target.value)} rows={4} style={{ ...field(T), resize: 'vertical' }} /></div>
      <div><label style={lab(T)}>Equipment needed per session (one per line)</label><textarea value={d.equipment} onChange={e => set('equipment', e.target.value)} rows={3} placeholder="Ball basket (60+)&#10;Cones ×8&#10;Target hoops" style={{ ...field(T), resize: 'vertical' }} /></div>
      <div style={{ fontSize: 11, color: T.text3 }}>Added to <strong style={{ color: T.text2 }}>Equipment &amp; Kit → {KIND_TO_SESSION[d.kind] || 'Private lesson'}</strong> so it’s on the grab-and-go checklist.</div>
      {fieldErr(T, errs.save)}
    </Shell>
  )
}

function AssignForm({ T, accent, players, packages, pay, prefillPlayerId, onClose, onSave, onDelete }: { T: ThemeTokens; accent: AccentTokens; players: Player[]; packages: Pkg[]; pay: Pay | null; prefillPlayerId?: string | null; onClose: () => void; onSave: (v: Record<string, any>) => Promise<void>; onDelete?: () => Promise<void> }) {
  // The player is chosen and saved by ID. Choosing by name could not tell two
  // players with the same name apart, and saved the line against neither.
  const sameName = (n?: string | null) => players.filter(p => p.name.trim().toLowerCase() === (n || '').trim().toLowerCase())
  const startPlayer = pay
    ? (pay.player_id && players.some(p => p.id === pay.player_id) ? pay.player_id : (!pay.player_id && sameName(pay.player_name).length === 1 ? sameName(pay.player_name)[0].id : ''))
    : (prefillPlayerId || '')
  // Likewise the package: two packages can share a name at different prices.
  const startPkg = pay?.item === PAYG ? PAYG : (packages.find(p => p.name === pay?.item && toPennies(p.price) === toPennies(pay?.amount)) || packages.find(p => p.name === pay?.item))?.id || ''
  const [d, setD] = useState<Record<string, any>>({ player_id: startPlayer, pkg: startPkg, item: pay?.item || '', amount: boxAmount(pay?.amount), sessions_total: pay?.sessions_total ?? '', status: pay?.status === 'overdue' ? 'overdue' : 'active', renews_date: pay?.renews_date || '', due_date: pay?.due_date || '' })
  const [saving, setSaving] = useState(false)
  const [errs, setErrs] = useState<{ player?: string; amount?: string; sessions?: string; save?: string }>({})
  const set = (k: string, v: any) => { setD(p => ({ ...p, [k]: v })); setErrs(e => ({ ...e, save: undefined, ...(k === 'amount' ? { amount: undefined } : k === 'sessions_total' ? { sessions: undefined } : k === 'player_id' ? { player: undefined } : {}) })) }
  const pickPackage = (id: string) => {
    setErrs(e => ({ ...e, amount: undefined, sessions: undefined }))
    if (id === PAYG) { setD(p => ({ ...p, pkg: PAYG, item: PAYG, sessions_total: '', amount: '' })); return }
    const pk = packages.find(p => p.id === id)
    setD(p => ({ ...p, pkg: id, item: pk?.name || '', ...(pk ? { amount: boxAmount(pk.price), sessions_total: pk.sessions ?? '' } : {}) }))
  }
  const payg = d.item === PAYG
  // Labels in the two lists say which is which when names repeat.
  const hints = tellApartHints(players)
  const playerLabel = (p: Player) => hints.get(p.id) ? `${p.name} — ${hints.get(p.id)}` : p.name
  const pkgLabel = (p: Pkg) => packages.filter(x => x.name === p.name).length < 2 ? p.name : `${p.name} — ${p.price == null ? 'no price' : formatPounds(p.price)}`
  const save = async () => {
    if (saving) return
    const player = players.find(p => p.id === d.player_id)
    // "Pay as you go" has nothing to pay up front, so it is the one plan that
    // may have no price. Everything else is an amount somebody owes.
    const blankOk = payg && !String(d.amount ?? '').trim()
    const amount = blankOk ? null : parseAmount(d.amount)
    const sessions = parseSessions(d.sessions_total)
    const next = {
      player: player ? undefined : 'Choose which player this is for.',
      amount: !amount || amount.ok ? undefined : amount.error,
      sessions: sessions.ok ? undefined : sessions.error,
    }
    setErrs(next)
    if (!player || (amount && !amount.ok) || !sessions.ok) return
    setSaving(true)
    try {
      await onSave({ player_id: player.id, player_name: player.name, item: d.item, amount: amount && amount.ok ? amount.pounds : null, sessions_total: sessions.value, status: d.status, renews_date: d.renews_date || null, due_date: d.due_date || null })
    } catch (e) { setErrs({ save: saveProblem(e) }) } finally { setSaving(false) }
  }
  // An invoice is not a package, and the dialog used to call both "package".
  const isInvoice = !!pay && !isPack(pay)
  return (
    <Shell T={T} title={pay ? (isInvoice ? 'Edit invoice' : 'Update package') : 'Assign package'} onClose={onClose} snapshot={JSON.stringify(d)}
      footer={<>
        {onDelete && <button onClick={async () => { if (confirm(isInvoice ? 'Delete this invoice?' : 'Remove this package?')) await onDelete() }} style={{ appearance: 'none', padding: '8px 12px', borderRadius: 9, background: 'transparent', color: T.bad, border: `1px solid ${T.border}`, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>Delete</button>}
        <button onClick={onClose} style={{ marginLeft: 'auto', appearance: 'none', padding: '8px 14px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
        <button onClick={save} disabled={saving} style={{ appearance: 'none', border: 0, padding: '8px 16px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.5 : 1, fontFamily: FONT }}>{saving ? 'Saving…' : 'Save'}</button>
      </>}>
      <div><label style={lab(T)}>Player *</label>
        <select value={d.player_id} onChange={e => set('player_id', e.target.value)} style={{ ...field(T), cursor: 'pointer' }}>
          <option value="">Choose a player…</option>
          {players.map(p => <option key={p.id} value={p.id}>{playerLabel(p)}</option>)}
        </select>
        {fieldErr(T, errs.player)}
      </div>
      <div><label style={lab(T)}>Plan</label>
        <select value={d.pkg} onChange={e => pickPackage(e.target.value)} style={{ ...field(T), cursor: 'pointer' }}>
          <option value="">{d.item && d.item !== PAYG && !d.pkg ? d.item : 'Choose a package…'}</option>
          <option value={PAYG}>Pay as you go (no package)</option>
          {packages.map(p => <option key={p.id} value={p.id}>{pkgLabel(p)}</option>)}
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div><label style={lab(T)}>Price £{payg ? '' : ' *'}</label><input inputMode="decimal" value={d.amount} onChange={e => set('amount', e.target.value)} placeholder={payg ? 'Nothing up front' : 'e.g. 40 or 12.50'} style={field(T)} />{fieldErr(T, errs.amount)}</div>
        <div><label style={lab(T)}>Total sessions</label><input inputMode="numeric" value={d.sessions_total} onChange={e => set('sessions_total', e.target.value)} style={field(T)} />{fieldErr(T, errs.sessions)}</div>
      </div>
      {/* minmax(0, …): a date box has its own minimum width, and at 360px two of
          them side by side pushed "Renews" out of the form. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 10 }}>
        <div><label style={lab(T)}>Payment due</label><input type="date" value={d.due_date} onChange={e => set('due_date', e.target.value)} style={{ ...field(T), minWidth: 0 }} /></div>
        <div><label style={lab(T)}>Renews</label><input type="date" value={d.renews_date} onChange={e => set('renews_date', e.target.value)} style={{ ...field(T), minWidth: 0 }} /></div>
      </div>
      {/* The status shown in the table is worked out from these dates: past
          its renewal is Expired, renewing within 14 days is Expiring, unpaid
          past its due date is Overdue. This is only for flagging a payment as
          late when there is no date to go by. */}
      <div><label style={lab(T)}>Chase this payment</label><select value={d.status} onChange={e => set('status', e.target.value)} style={{ ...field(T), cursor: 'pointer' }}>
        <option value="active">No — work the status out from the dates</option>
        <option value="overdue">Yes — show it as overdue until it is paid</option>
      </select></div>
      <div style={{ fontSize: 11, color: T.text3 }}>Sessions used tick off automatically as this player’s booked lessons take place (unless they are marked absent), starting from the day the package is added — no manual counting.</div>
      {fieldErr(T, errs.save)}
    </Shell>
  )
}

function PackageRunSheet({ T, accent, row, onClose, onEditPlan, onTakePayment }: { T: ThemeTokens; accent: AccentTokens; row: RosterRow; onClose: () => void; onEditPlan: () => void; onTakePayment: () => void }) {
  const a = row.assign
  const total = a?.sessions_total || 0
  const slots = total || row.sessions.length || 0
  const list = Array.from({ length: slots }, (_, i) => row.sessions[i] || null)
  useEscape(onClose)
  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, fontFamily: FONT, padding: '5vh 16px', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 460, background: T.panel, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{row.name}</div>
            {row.hint && <div style={{ fontSize: 11, color: T.text3, marginTop: 1 }}>{row.hint}</div>}
            <div style={{ fontSize: 12, color: T.text3, marginTop: 2 }}>{a?.item ? `${a.item}${a.renews_date ? ` · renews ${fmtD(a.renews_date)}` : ''}` : 'No plan — pay as you go'}</div>
          </div>
          <button onClick={onClose} style={{ appearance: 'none', border: 0, background: 'transparent', color: T.text3, cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>
        {total > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
          <div style={{ flex: 1, height: 6, borderRadius: 3, background: T.hover, overflow: 'hidden' }}><div style={{ width: `${Math.min(100, row.used / total * 100)}%`, height: '100%', background: accent.hex }} /></div>
          <span style={{ fontSize: 11, color: T.text3 }}>{Math.min(row.used, total)}/{total} used</span>
        </div>}
        {total > 0 && row.used >= total && <div style={{ fontSize: 11.5, color: T.warn, marginTop: 8 }}>This package is used up. Lessons from here on are not covered by it.</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 }}>
          {slots === 0 ? <div style={{ fontSize: 12.5, color: T.text3 }}>No lessons taken yet. Each booked lesson appears here once it has happened.</div> : list.map((s, i) => {
            const done = !!s
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: done ? accent.dim : T.panel2, border: `1px solid ${done ? accent.border : T.border}`, borderRadius: 9, padding: '9px 11px' }}>
                <span style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, display: 'grid', placeItems: 'center', background: done ? accent.hex : 'transparent', border: done ? 0 : `1.5px solid ${T.border}`, color: T.btnText, fontSize: 11, fontWeight: 700 }}>{done ? '✓' : ''}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: T.text }}>Session {i + 1}</div>
                  {done && <div style={{ fontSize: 10.5, color: T.text3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{[s!.session_date && fmtD(s!.session_date), s!.focus].filter(Boolean).join(' · ') || 'Lesson summary logged'}</div>}
                </div>
                {done && s!.written && <span style={{ fontSize: 9.5, fontWeight: 700, color: accent.hex }}>SUMMARY</span>}
              </div>
            )
          })}
        </div>
        <div style={{ fontSize: 10.5, color: T.text3, marginTop: 12, lineHeight: 1.5 }}>
          {total > 0
            ? `Lessons tick off automatically as they take place — you don’t mark these by hand; mark a player absent on their profile and that lesson is not counted. This package counts lessons from ${fmtD(soldOn(a!))}, the day it was added${a?.renews_date ? `, up to ${fmtD(a.renews_date)}` : ''}. Each lesson comes off one package only, the oldest first.`
            : 'Lessons taken that are not covered by a package. They appear automatically once each lesson has happened.'}
          {total > 0 && (row.loose || 0) > 0 ? ` ${row.loose} other lesson${row.loose === 1 ? ' is' : 's are'} not covered by a package.` : ''}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
          <button onClick={onClose} style={{ marginLeft: 'auto', appearance: 'none', padding: '8px 14px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>Close</button>
          <button onClick={onTakePayment} style={{ appearance: 'none', border: `1px solid ${accent.border}`, padding: '8px 14px', borderRadius: 9, background: accent.dim, color: accent.hex, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>💳 Take payment</button>
          <button onClick={onEditPlan} style={{ appearance: 'none', border: 0, padding: '8px 16px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}>{a ? 'Edit plan' : 'Assign a package'}</button>
        </div>
      </div>
    </div>
  )
}

export function PayModal({ T, accent, connected, init, onClose }: { T: ThemeTokens; accent: AccentTokens; connected: boolean | null; init: { amount?: number; description?: string; player_name?: string; payment_id?: string }; onClose: () => void }) {
  const [amount, setAmount] = useState(init.amount ? String(init.amount) : '')
  const [description, setDescription] = useState(init.description || '')
  const [playerName, setPlayerName] = useState(init.player_name || '')
  const [creating, setCreating] = useState(false)
  const [err, setErr] = useState('')
  const [amountErr, setAmountErr] = useState('')
  const [url, setUrl] = useState<string | null>(null)
  // Collecting a specific invoice takes exactly what is owed on it — the server
  // checks the same thing — so the amount and the player are not editable.
  const fixed = !!init.payment_id
  const create = async () => {
    const got = parseAmount(amount)
    if (!got.ok) { setAmountErr(got.error); return }
    if (got.pennies < 50) { setAmountErr('Enter an amount of at least £0.50.'); return }
    const amt = got.pounds
    setCreating(true); setErr(''); setAmountErr('')
    try {
      const r = await fetch('/api/coach/pay/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: amt, description: description || 'Tennis coaching', player_name: playerName || null, payment_id: init.payment_id ?? null, returnPath: window.location.pathname }) })
      const d = await r.json()
      if (d.url) { setUrl(d.url); window.open(d.url, '_blank') } else setErr(d.error || 'Could not start payment')
    } catch { setErr('Could not start payment') } finally { setCreating(false) }
  }

  // No bank connected means, in founders access, that card payments are not on
  // yet — and sending a coach to Settings to connect one would be sending them
  // to a dead end. Say what is actually true and what they can do instead.
  if (connected === false) {
    return (
      <Shell T={T} title="Take a payment" onClose={onClose} footer={<button onClick={onClose} style={{ marginLeft: 'auto', appearance: 'none', padding: '8px 16px', borderRadius: 9, background: accent.hex, color: T.btnText, border: 0, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>Got it</button>}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: accent.hex, background: accent.dim, border: `1px solid ${accent.border}`, borderRadius: 999, padding: '3px 9px' }}>{V2_LABEL}</span>
        </div>
        <div style={{ fontSize: 13, color: T.text2, lineHeight: 1.6 }}>{V2_NOTES.payments}</div>

        {/* What it will actually do. "Coming soon" with no detail is a shrug;
            this is the list a coach can decide whether they want. */}
        <div style={{ background: T.panel2, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 14px', marginTop: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.text3, marginBottom: 8 }}>What it will do</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {[
              ['💳', 'Take card, Apple Pay and Google Pay on the spot — a link and a QR code to scan courtside'],
              ['🏦', 'Money straight into your own bank, not ours — no card details ever touch Lumio'],
              ['📦', 'Sell a lesson pack and have the credits count themselves down as they are used'],
              ['🎾', 'Take a deposit or the full amount on a camp sign-up page'],
              ['✅', 'Mark a balance paid the moment the money lands, so nobody is chased twice'],
            ].map(([icon, text]) => (
              <div key={text} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 13, lineHeight: 1.4, flexShrink: 0 }}>{icon}</span>
                <span style={{ fontSize: 12.5, color: T.text2, lineHeight: 1.5 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 12.5, color: T.text3, lineHeight: 1.6, marginTop: 12 }}>
          Until then, take the money however you do today — bank transfer, cash, your own card reader — and record
          it here. Balances and what is outstanding work exactly as they will in V2.
        </div>
      </Shell>
    )
  }

  if (url) {
    const qr = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}`
    return (
      <Shell T={T} title="Payment ready" onClose={onClose} footer={<button onClick={onClose} style={{ marginLeft: 'auto', appearance: 'none', padding: '8px 16px', borderRadius: 9, background: accent.hex, color: T.btnText, border: 0, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>Done</button>}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12.5, color: T.text2, marginBottom: 10 }}>Scan to pay with Apple Pay, Google Pay or card — or send the link.</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="Payment QR" width={200} height={200} style={{ borderRadius: 12, background: '#fff', padding: 8 }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <a href={url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, textAlign: 'center', textDecoration: 'none', border: `1px solid ${accent.border}`, background: accent.dim, color: accent.hex, borderRadius: 9, padding: '8px', fontSize: 12.5, fontWeight: 700 }}>Open checkout ↗</a>
            <button onClick={() => { navigator.clipboard?.writeText(url).then(() => alert('Payment link copied — send it to the player or parent.')).catch(() => {}) }} style={{ flex: 1, appearance: 'none', border: `1px solid ${T.border}`, background: 'transparent', color: T.text2, borderRadius: 9, padding: '8px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>Copy link</button>
          </div>
        </div>
      </Shell>
    )
  }

  return (
    <Shell T={T} title="Take a payment" onClose={onClose}
      footer={<>
        <button onClick={onClose} style={{ marginLeft: 'auto', appearance: 'none', padding: '8px 14px', borderRadius: 9, background: 'transparent', color: T.text2, border: `1px solid ${T.border}`, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
        <button onClick={create} disabled={creating} style={{ appearance: 'none', border: 0, padding: '8px 16px', borderRadius: 9, background: accent.hex, color: T.btnText, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: creating ? 0.5 : 1, fontFamily: FONT }}>{creating ? 'Creating…' : 'Create payment'}</button>
      </>}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div><label style={lab(T)}>Amount (£) *</label><input inputMode="decimal" value={amount} readOnly={fixed} onChange={e => { setAmount(e.target.value); setAmountErr('') }} placeholder="e.g. 36 or 12.50" style={{ ...field(T), opacity: fixed ? 0.7 : 1 }} />{fieldErr(T, amountErr)}</div>
        <div><label style={lab(T)}>Player</label><input value={playerName} readOnly={fixed} onChange={e => setPlayerName(e.target.value)} placeholder="Optional" style={{ ...field(T), opacity: fixed ? 0.7 : 1 }} /></div>
      </div>
      <div><label style={lab(T)}>Description</label><input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. 10-lesson private pack" style={field(T)} /></div>
      <div style={{ fontSize: 11, color: T.text3 }}>Creates a Stripe checkout (card · Apple Pay · Google Pay). You’ll get a link + QR to scan in person — money goes straight to your bank.</div>
      {err && <div role="alert" style={{ fontSize: 12, color: T.bad }}>{err}</div>}
    </Shell>
  )
}
