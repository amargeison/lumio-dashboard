import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { readReminders, reminderMessage } from '@/lib/coach/reminders'
import { lessonWeather } from '@/lib/coach/weather'
import { venueForecast } from '@/lib/coach/weather-server'
import { familyAddress, fileInApp, sendFamilyEmail } from '@/lib/coach/family-mail'
import { sendSummary } from '@/lib/coach/summary-send'
import { ukLocalToMs } from '@/lib/coach/cancel-policy'
import { addDaysIso, ukDate, ukTime } from '@/lib/coach/uk-date'
import { runGroupAsks } from '@/lib/coach/groups-server'
import { publicSiteOrigin } from '@/lib/public-origin'

export const runtime = 'nodejs'
export const maxDuration = 300

// Messages Lumio sends for the coach on a timer. A system cron on the VPS hits
// this every 15 minutes, the same way as the camp emails:
//
//   */15 * * * * curl -sS -X POST http://127.0.0.1:3000/api/cron/reminders \
//     -H "Authorization: Bearer $CRON_SECRET" > /dev/null
//
//   1. Lesson summaries the coach approved "for tonight" whose time has come.
//   2. The day-before reminder, for academies that switched it on (Settings →
//      Reminders & summaries), once their chosen time has passed today: one
//      email per lesson tomorrow, with the forecast if there is one, saying it
//      is confirmed (and paid, when it is). Weekly groups too: everyone who
//      said yes to tomorrow's session.
//   3. Weekly groups: "are you coming?" for every group whose ask day has
//      come (six days before, by default), in the daytime only.
//
// Safe to run twice: each reminder is claimed in coach_notices (one per lesson)
// before it is sent, and a scheduled summary is claimed by clearing its time.
// A reminder that is not sent by 9pm is not sent at all — a reminder at
// midnight for a 9am lesson is worse than none.

const LATEST = '21:00'
const MAX_PER_RUN = 300

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
}

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const sb = db()
  const out = { summaries: 0, summaryFailed: 0, reminders: 0, reminderFailed: 0, skipped: 0, academies: 0, groupsAsked: 0, groupAskFailed: 0 }
  let budget = MAX_PER_RUN

  // ── 1. Scheduled summaries ──
  const { data: due } = await sb.from('coach_sessions').select('*')
    .lte('share_due_at', new Date().toISOString()).is('shared_at', null).limit(100)
  for (const s of due || []) {
    if (budget-- <= 0) break
    // Claim it: only the run that clears the time sends it.
    const { data: claimed } = await sb.from('coach_sessions').update({ share_due_at: null })
      .eq('id', s.id).eq('share_due_at', s.share_due_at).is('shared_at', null).select('id')
    if (!claimed?.length) continue
    const r = await sendSummary(sb, s.coach_id, s.coach_id, s)
    if (r.ok) out.summaries++; else out.summaryFailed++
  }

  // ── 2. Day-before reminders ──
  const now = ukTime()
  if (now <= LATEST) {
    const { data: on } = await sb.from('coach_settings').select('coach_id, data').eq('data->reminders->>dayBefore', 'true')
    const tomorrow = addDaysIso(ukDate(), 1)
    for (const row of on || []) {
      if (budget <= 0) break
      const cfg = readReminders((row.data as Record<string, unknown>)?.reminders)
      if (!cfg.dayBefore || now < cfg.at) continue
      const academyId = row.coach_id as string
      out.academies++
      const { data: oneToOne } = await sb.from('coach_bookings').select('*')
        .eq('coach_id', academyId).eq('booking_date', tomorrow).eq('status', 'confirmed').not('player_id', 'is', null)
      // Weekly groups: one reminder for each person who said yes, as if it were
      // their own booking. Claimed per answer ('reminder:<answer id>').
      const { data: weeks } = await sb.from('coach_group_sessions').select('id, booking_id').eq('coach_id', academyId).eq('session_date', tomorrow).eq('status', 'open')
      const groupBookings = (weeks || []).filter(w => w.booking_id)
      let groupLessons: Record<string, any>[] = []
      if (groupBookings.length) {
        const [{ data: gb }, { data: yes }] = await Promise.all([
          sb.from('coach_bookings').select('*').in('id', groupBookings.map(w => w.booking_id)).eq('status', 'confirmed'),
          sb.from('coach_group_replies').select('id, session_id, player_id').in('session_id', groupBookings.map(w => w.id)).eq('answer', 'yes'),
        ])
        for (const y of yes || []) {
          const w = groupBookings.find(x => x.id === y.session_id)
          const b = (gb || []).find(x => x.id === w?.booking_id)
          if (b) groupLessons.push({ ...b, player_id: y.player_id, _replyId: y.id })
        }
      }
      const lessons = [...(oneToOne || []), ...groupLessons]
      if (!lessons.length) continue
      const [{ data: prof }, { data: venues }, { data: players }, { data: paid }] = await Promise.all([
        sb.from('sports_profiles').select('brand_name, display_name, contact_email').eq('id', academyId).maybeSingle(),
        sb.from('coach_venues').select('id, coach_id, name, address, lat, lng, geocoded_at, is_home').eq('coach_id', academyId),
        sb.from('coach_players').select('id, name, email, parent_email, parent_name, contact_email').eq('coach_id', academyId).in('id', lessons.map(l => l.player_id)),
        sb.from('coach_charges').select('booking_id, reply_id').eq('coach_id', academyId).in('booking_id', lessons.map(l => l.id)).in('status', ['paid', 'processing']),
      ])
      const paidSet = new Set((paid || []).map(c => c.reply_id || c.booking_id))
      const home = (venues || []).find(v => v.is_home) || null
      const forecasts = new Map<string, Awaited<ReturnType<typeof venueForecast>>>()
      for (const b of lessons) {
        if (budget <= 0) break
        if (b.type === 'Block') continue
        const player = (players || []).find(p => p.id === b.player_id)
        const addr = player ? familyAddress(player) : null
        if (!player || !addr) { out.skipped++; continue }
        // Claim: one reminder per lesson, ever.
        const kind = b._replyId ? `reminder:${b._replyId}` : 'reminder'
        const { error: claimErr } = await sb.from('coach_notices').insert({ coach_id: academyId, booking_id: b.id, kind, status: 'sending', sent_to: addr.to })
        if (claimErr) continue
        budget--
        const venue = (venues || []).find(v => v.id === b.venue_id) || (b.venue_id ? null : home)
        let weather = null
        if (cfg.weather && venue) {
          if (!forecasts.has(venue.id)) forecasts.set(venue.id, await venueForecast(sb, venue))
          const series = forecasts.get(venue.id) || []
          weather = series.length ? lessonWeather(series, ukLocalToMs(b.booking_date, String(b.start_time || '00:00').slice(0, 5)), Number(b.duration_min) || 60, cfg) : null
        }
        const msg = reminderMessage({
          hello: addr.hello, childFirst: addr.toParent ? String(player.name).split(/\s+/)[0] : null,
          academy: (prof?.brand_name as string) || 'Your coach', coachName: (prof?.display_name as string) || null,
          time: String(b.start_time || '').slice(0, 5), durMin: Number(b.duration_min) || 60, type: b.type,
          venue: venue?.name || null, court: b.court || null, paid: paidSet.has(b._replyId || b.id), weather,
        })
        const ok = await sendFamilyEmail(academyId, { to: addr.to, subject: msg.subject, html: msg.html, replyTo: (prof?.contact_email as string) || null, context: 'coach/day-before reminder' })
        if (ok) {
          await sb.from('coach_notices').update({ status: 'sent', updated_at: new Date().toISOString(), detail: weather ? weather.words : null })
            .eq('booking_id', b.id).eq('kind', kind)
          out.reminders++
          await fileInApp(sb, { coachId: academyId, player, subject: msg.subject, body: msg.text })
        } else {
          // Nothing went out: let go of the claim so the next run tries again (until 9pm).
          await sb.from('coach_notices').delete().eq('booking_id', b.id).eq('kind', kind).eq('status', 'sending')
          out.reminderFailed++
        }
      }
    }
  }

  // ── 3. Weekly groups: who is coming? ──
  try {
    const g = await runGroupAsks(sb, publicSiteOrigin('https://www.lumiosports.com'), Math.max(0, budget))
    out.groupsAsked = g.asked; out.groupAskFailed = g.failed
  } catch (e) { console.error('[cron/reminders] groups', e) }
  return NextResponse.json({ ok: true, ...out })
}
