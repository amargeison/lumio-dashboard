import { NextRequest, NextResponse } from 'next/server'
import { isAcademyUser, notAnAcademy } from '@/lib/coach/academy-guard'
import { coachGate, isUuid } from '@/lib/coach/membership'
import { serviceClient } from '@/lib/coach/oauth'
import { rainOffMessage } from '@/lib/coach/reminders'
import { familyAddress, fileInApp, sendFamilyEmail } from '@/lib/coach/family-mail'
import { addDaysIso, ukDate } from '@/lib/coach/uk-date'
import { academyMoney, refundCharge } from '../pay/_saved'
import { packCover } from '@/lib/coach/packs-server'

export const runtime = 'nodejs'

// The coach calls lessons off — rain, or they cannot coach — in one go.
//
// POST { bookingIds: string[], reason: 'weather' | 'coach', note?: string, tell?: boolean }
//
// For each lesson: it is cancelled and marked as the COACH's cancellation (so
// it is never charged as a late cancellation, and never comes off a lesson
// pack), any card payment taken for it is refunded in full — or, when the
// policy says "a credit", kept as a one-lesson credit on the Payments page — and — unless tell is false — the family is emailed and
// the message is filed in their conversation in the app. Each family is told
// once per lesson, however many times this is pressed.

const MAX = 40

function whenWords(date: string): string {
  const today = ukDate()
  if (date === today) return 'today'
  if (date === addDaysIso(today, 1)) return 'tomorrow'
  return `on ${new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })}`
}

export async function POST(req: NextRequest) {
  const who = await coachGate()
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: who.status })
  if (!await isAcademyUser(who.userId)) return notAnAcademy()
  const academyId = who.seat.academyId
  const mine = who.seat.isHead ? null : who.seat.staffId
  const b = (await req.json().catch(() => ({}))) as { bookingIds?: unknown; reason?: string; note?: string; tell?: boolean }
  const ids = Array.isArray(b.bookingIds) ? Array.from(new Set(b.bookingIds.filter(isUuid))).slice(0, MAX) : []
  if (!ids.length) return NextResponse.json({ error: 'Choose the lessons to call off.' }, { status: 400 })
  const reason: 'weather' | 'coach' = b.reason === 'coach' ? 'coach' : 'weather'
  const note = String(b.note || '').trim().slice(0, 500)
  const tell = b.tell !== false

  const db = serviceClient()
  let q = db.from('coach_bookings').select('*').eq('coach_id', academyId).in('id', ids)
  if (mine) q = q.eq('staff_id', mine)
  const { data: rows } = await q
  const m = await academyMoney(db, academyId)
  const { data: venues } = await db.from('coach_venues').select('id, name, is_home').eq('coach_id', academyId)
  const home = (venues || []).find(v => v.is_home) || null
  // Which of these lessons come off a pack, worked out before they are cancelled.
  const { cover } = await packCover(db, academyId, (rows || []).map(r => r.player_id as string).filter(Boolean), m.policy)

  const results: { bookingId: string; cancelled: boolean; refunded: number; credited: number; told: string | null; problem?: string }[] = []
  for (const bk of rows || []) {
    const r = { bookingId: bk.id as string, cancelled: false, refunded: 0, credited: 0, told: null as string | null, problem: undefined as string | undefined }
    if (bk.status !== 'cancelled') {
      const tag = reason === 'weather' ? 'Rained off' : 'Cancelled by coach'
      const { error } = await db.from('coach_bookings').update({
        status: 'cancelled', cancelled_by: 'coach',
        notes: [tag + (note ? `: ${note}` : ''), bk.notes].filter(Boolean).join('\n').slice(0, 2000),
      }).eq('id', bk.id).eq('coach_id', academyId)
      if (error) { r.problem = 'It could not be cancelled. Please try again.'; results.push(r); continue }
    }
    r.cancelled = true

    // Give back what was taken for it.
    const { data: charges } = await db.from('coach_charges').select('*').eq('booking_id', bk.id).eq('coach_id', academyId)
    const backTo = new Map<string, number>()   // a weekly group: refunded per answer
    let credited = 0
    for (const c of charges || []) {
      // "A credit": a one-to-one lesson's payment stays, as one lesson on the
      // Payments page that their next lesson comes off. Once per lesson, however
      // many times this is pressed. A weekly-group place is always refunded.
      if (m.policy.rainOff === 'credit' && c.kind !== 'group' && c.status === 'paid' && !c.refunded_pennies && bk.player_id) {
        const tag = `[credit for ${bk.id}]`
        const { data: had } = await db.from('coach_payments').select('id').eq('coach_id', academyId).eq('player_id', bk.player_id).like('notes', `%${tag}%`).limit(1)
        if (!had?.length) {
          const { data: pl } = await db.from('coach_players').select('name').eq('id', bk.player_id).maybeSingle()
          await db.from('coach_payments').insert({
            coach_id: academyId, player_id: bk.player_id, player_name: pl?.name || bk.player_name || null, item: 'Lesson credit', amount: 0, paid: true,
            sessions_total: 1, status: 'active', renews_date: addDaysIso(ukDate(), 182),
            notes: `${reason === 'weather' ? 'Rained off' : 'Called off'}: ${bk.booking_date} ${String(bk.start_time || '').slice(0, 5)}. £${(c.amount_pennies / 100).toFixed(2)} paid by card, kept as a credit. ${tag}`,
          })
        }
        credited += c.amount_pennies
        r.credited += c.amount_pennies
        continue
      }
      if (c.status === 'paid' && c.amount_pennies - (c.refunded_pennies || 0) > 0) {
        const rf = await refundCharge(db, m, academyId, c.id)
        if (rf.ok) { r.refunded += rf.refunded || 0; if (c.reply_id) backTo.set(c.reply_id, (backTo.get(c.reply_id) || 0) + (rf.refunded || 0)) }
        else r.problem = `The refund did not go through: ${rf.error}`
      } else if (c.status === 'processing') {
        r.problem = 'A Direct Debit for this lesson has not arrived yet. Refund it from the lesson once it shows as paid.'
      }
    }

    // A weekly group: the week is off, and everyone who said yes is told.
    const { data: week } = await db.from('coach_group_sessions').select('id').eq('booking_id', bk.id).maybeSingle()
    if (week) {
      await db.from('coach_group_sessions').update({ status: 'cancelled' }).eq('id', week.id)
      const { data: yes } = await db.from('coach_group_replies').select('id, player_id').eq('session_id', week.id).eq('answer', 'yes')
      const { data: people } = (yes || []).length ? await db.from('coach_players').select('id, name, email, parent_email, parent_name, contact_email').eq('coach_id', academyId).in('id', (yes || []).map(y => y.player_id)) : { data: [] }
      const venue = (venues || []).find(v => v.id === bk.venue_id) || (bk.venue_id ? null : home)
      let told = 0
      for (const y of tell ? yes || [] : []) {
        const player = (people || []).find(p => p.id === y.player_id)
        const addr = player ? familyAddress(player) : null
        if (!player || !addr) continue
        const kind = `rain_off:${y.id}`
        const { error: claimErr } = await db.from('coach_notices').insert({ coach_id: academyId, booking_id: bk.id, kind, status: 'sending', sent_to: addr.to })
        if (claimErr) continue
        const msg = rainOffMessage({
          hello: addr.hello, childFirst: addr.toParent ? String(player.name).split(/\s+/)[0] : null,
          academy: m.academy, coachName: m.coachName || null, time: String(bk.start_time || '').slice(0, 5),
          when: whenWords(bk.booking_date), venue: venue?.name || null, reason, refunded: backTo.get(y.id) || null, note,
        })
        const ok = await sendFamilyEmail(who.userId, { to: addr.to, subject: msg.subject, html: msg.html, replyTo: m.contactEmail, context: 'coach/rain-off group' })
        if (ok) {
          told++
          await db.from('coach_notices').update({ status: 'sent', updated_at: new Date().toISOString() }).eq('booking_id', bk.id).eq('kind', kind)
          await fileInApp(db, { coachId: academyId, player, subject: msg.subject, body: msg.text })
        } else {
          await db.from('coach_notices').delete().eq('booking_id', bk.id).eq('kind', kind).eq('status', 'sending')
          r.problem = r.problem || `The email to ${addr.to} did not send. Let them know yourself.`
        }
      }
      if (told) r.told = `${told} in the group`
    }

    // Tell the family, once.
    if (tell && bk.player_id) {
      const { data: player } = await db.from('coach_players').select('id, name, email, parent_email, parent_name, contact_email').eq('id', bk.player_id).eq('coach_id', academyId).maybeSingle()
      const addr = player ? familyAddress(player) : null
      if (player && addr) {
        const { error: claimErr } = await db.from('coach_notices').insert({ coach_id: academyId, booking_id: bk.id, kind: 'rain_off', status: 'sending', sent_to: addr.to })
        if (!claimErr) {
          const venue = (venues || []).find(v => v.id === bk.venue_id) || (bk.venue_id ? null : home)
          const msg = rainOffMessage({
            hello: addr.hello, childFirst: addr.toParent ? String(player.name).split(/\s+/)[0] : null,
            academy: m.academy, coachName: m.coachName || null, time: String(bk.start_time || '').slice(0, 5),
            when: whenWords(bk.booking_date), venue: venue?.name || null, reason, refunded: r.refunded || null, credited: credited || null, onPack: cover.has(bk.id), note,
          })
          const ok = await sendFamilyEmail(who.userId, { to: addr.to, subject: msg.subject, html: msg.html, replyTo: m.contactEmail, context: 'coach/rain-off' })
          if (ok) {
            await db.from('coach_notices').update({ status: 'sent', updated_at: new Date().toISOString() }).eq('booking_id', bk.id).eq('kind', 'rain_off')
            await fileInApp(db, { coachId: academyId, player, subject: msg.subject, body: msg.text })
            r.told = addr.to
          } else {
            await db.from('coach_notices').delete().eq('booking_id', bk.id).eq('kind', 'rain_off').eq('status', 'sending')
            r.problem = r.problem || `The email to ${addr.to} did not send. Let them know yourself.`
          }
        } else {
          r.told = 'already told'
        }
      } else if (player) {
        r.problem = r.problem || `There is no email address for ${player.name}. Let them know yourself.`
      }
    }
    results.push(r)
  }
  const missing = ids.length - (rows || []).length
  return NextResponse.json({ ok: true, results, ...(missing ? { missing } : {}) })
}
