import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { STAGES, STAGE_BY_ID, decide, dueAt, logOutOfDate, type StageId } from '@/lib/coach/camp-lifecycle'
import { publicSiteOrigin } from '@/lib/public-origin'
import {
  chaseReasons, alreadySaidFor,
  type Camp, type Attendee, type Player, type Draft,
} from '@/lib/coach/camp-email-build'
import { sendCampStage, claimFirst, claimRetry, dropClaim, recordRetry, releaseStuck, MAX_ATTEMPTS, PLAYER_COLUMNS } from '@/lib/coach/camp-email-send'

export const runtime = 'nodejs'
export const maxDuration = 300

// The camp countdown runner. A system cron on the VPS hits this hourly:
//
//   17 * * * * curl -sS -X POST http://127.0.0.1:3000/api/cron/camp-emails \
//     -H "Authorization: Bearer $CRON_SECRET" > /dev/null
//
// Localhost on purpose: the public hostname sits behind Cloudflare, which serves
// curl a bot challenge instead of the app.
//
// Everything here is built to be safe to run twice. The unique index on
// (attendee_id, stage) in coach_camp_emails is the real guarantee: each email
// is CLAIMED there before it is sent (see claimFirst / claimRetry), so of two
// runs that overlap only one sends. With auto-send, emailing a family the same
// thing twice is the failure that would cost a coach trust in the whole feature.
//
// Two things a log row does NOT settle:
//   • A send that FAILED is tried again on later runs, MAX_ATTEMPTS times in
//     all, and after that it waits for the coach to press "Send again". One bad
//     reply from Lumio Coach used to cost a family their night-before email.
//   • A skip or failure decided for the camp's OLD dates (the coach has since
//     moved it) is removed, so that email is decided again for the new dates.
//     An email that was SENT is never removed and never sent again. See
//     logOutOfDate in camp-lifecycle.ts.

const DAY = 86_400_000
// How late a stage may still go out. If the cron has been off for a week we do
// NOT want to discover that by sending a fortnight of backlog to every parent.
const STALE_AFTER = 3 * DAY

type Override = { skip?: boolean; note?: string; draft?: Draft }

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
}

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Lumio Coach is not configured' }, { status: 503 })

  const sb = db()
  const now = Date.now()
  // The cron calls this on localhost (Cloudflare challenges curl on the public
  // host), so the request origin is 127.0.0.1 and useless in an email. The
  // configured public URL is the only thing that works in somebody's inbox.
  const origin = publicSiteOrigin(new URL(req.url).origin)
  const result = { considered: 0, sent: 0, skipped: 0, failed: 0, notes: [] as string[] }

  try {
    // Only camps that could plausibly have something due: starting within the
    // next month, and either started or ENDED within the last three weeks. The
    // end date matters because "How it went" is counted from the last day — a
    // three-week residential would otherwise drop out before it was written to.
    const from = new Date(now - 21 * DAY).toISOString().slice(0, 10)
    const to = new Date(now + 40 * DAY).toISOString().slice(0, 10)
    const { data: camps } = await sb.from('coach_camps').select('*')
      .not('start_date', 'is', null).lte('start_date', to)
      .or(`start_date.gte.${from},end_date.gte.${from}`)

    for (const camp of (camps ?? []) as Camp[]) {
      const { data: attendees } = await sb.from('coach_camp_attendees').select('*').eq('camp_id', camp.id)
      if (!attendees?.length) continue

      // Roster rows for coach-added attendees, who carry no contact details of
      // their own. One query per camp rather than one per attendee.
      const playerIds = [...new Set((attendees as Attendee[]).map(a => a.player_id).filter(Boolean))]
      const players = new Map<string, Player>()
      if (playerIds.length) {
        const { data: rows } = await sb.from('coach_players')
          // This academy's players only (an attendee row can point at any id).
          .select(PLAYER_COLUMNS).in('id', playerIds).eq('coach_id', camp.coach_id)
        for (const r of (rows ?? []) as unknown as Player[]) players.set(String(r.id), r)
      }

      // A send that died half way is handed to the coach before anything is read.
      await releaseStuck(sb, camp.id)
      const { data: logs } = await sb.from('coach_camp_emails')
        .select('id, attendee_id, stage, status, attempts, sent_at, due_at').eq('camp_id', camp.id)

      // The camp's dates were moved. A skip or failure decided for the OLD
      // dates — "the camp has already started", "too late to be useful" — is
      // cleared, so that email is decided again for the new date. An email that
      // was sent is left exactly as it is, and is not sent again.
      const stale = new Set((logs ?? []).filter(l => {
        const st = STAGE_BY_ID[l.stage as StageId]
        return !!st && logOutOfDate(l, st, camp.start_date, camp.end_date)
      }).map(l => l.id as string))
      if (stale.size) await sb.from('coach_camp_emails').delete().in('id', [...stale]).in('status', ['skipped', 'failed'])

      // `done` = settled, do not touch again. A failed send with attempts left
      // is not settled: it is kept aside to be tried again below.
      const done = new Set<string>()
      const retry = new Map<string, { id: string; attempts: number }>()
      for (const l of logs ?? []) {
        if (stale.has(l.id)) continue
        const key = `${l.attendee_id}:${l.stage}`
        if (l.status === 'failed') retry.set(key, { id: l.id, attempts: Number(l.attempts) || 1 })
        if (l.status !== 'failed' || (Number(l.attempts) || 1) >= MAX_ATTEMPTS) done.add(key)
      }

      const { data: profile } = await sb.from('sports_profiles')
        .select('brand_name, brand_logo_url, display_name, contact_email').eq('id', camp.coach_id).maybeSingle()
      const overrides = (camp.email_overrides || {}) as Record<string, Override>

      for (const a of attendees as Attendee[]) {
        for (const stage of STAGES) {
          if (stage.id === 'signup') continue   // sent by the sign-up route itself
          result.considered++

          const key = `${a.id}:${stage.id}`
          // A failed row from an earlier run, if this is a second or third try.
          const again = retry.get(key)

          // Kept on every row written below, so a later change of dates can be
          // told apart from a decision that still stands.
          const dueIso = (() => { const t = dueAt(stage, camp.start_date, camp.end_date); return t == null ? null : new Date(t).toISOString() })()

          const d = decide({
            stage, now, campStart: camp.start_date, campEnd: camp.end_date, attendee: a,
            paused: camp.emails_paused,
            alreadyLogged: done.has(key),
            overrideSkip: !!overrides[stage.id]?.skip,
            hasReason: stage.conditional ? chaseReasons(camp, a).length > 0 : true,
          })

          if (d.action === 'wait') continue
          if (d.action === 'skip') {
            // Only terminal skips are written. A pause can be lifted and an
            // unpaid balance can be settled, so those are re-decided next run
            // rather than being recorded as a decision forever.
            // A failed row is left as 'failed' when its moment has passed —
            // the coach should see that it never went, not a neat "skipped".
            if (d.terminal && !done.has(key) && !again) {
              await sb.from('coach_camp_emails').insert({
                coach_id: camp.coach_id, camp_id: camp.id, attendee_id: a.id,
                stage: stage.id, status: 'skipped', error: d.reason, due_at: dueIso,
              })
              done.add(key)
            }
            result.skipped++
            continue
          }

          const due = dueAt(stage, camp.start_date, camp.end_date)
          if (due != null && now - due > STALE_AFTER) {
            if (!again) await sb.from('coach_camp_emails').insert({
              coach_id: camp.coach_id, camp_id: camp.id, attendee_id: a.id,
              stage: stage.id, status: 'skipped', error: 'too late to be useful', due_at: dueIso,
            })
            done.add(key)
            result.skipped++
            continue
          }

          // Claimed before it is sent, and only one run can win the claim: a
          // retry by taking the failed row, a first attempt by being the one
          // insert the unique key lets through.
          let claimId: string
          if (again) {
            if (!await claimRetry(sb, again)) { result.skipped++; continue }
            claimId = again.id
          } else {
            const got = await claimFirst(sb, { coach_id: camp.coach_id, camp_id: camp.id, attendee_id: a.id, stage: stage.id, due_at: dueIso })
            if (!got) { done.add(key); result.skipped++; continue }
            claimId = got
          }

          const r = await sendCampStage({
            apiKey, camp, attendee: a, player: a.player_id ? players.get(String(a.player_id)) : null,
            profile: profile ?? null, stage, origin,
            alreadySaid: alreadySaidFor(done, a.id, stage.id),
          })

          if (!r.ok && r.noAddress) {
            // Worth surfacing: a coach who adds their roster to a camp and has
            // never filled in contact details would otherwise see "0 sent" with
            // no explanation.
            // Nothing was sent, so nothing is recorded: the claim is given back
            // and the email is looked at again once there is an address.
            if (again) await recordRetry(sb, claimId, r); else await dropClaim(sb, claimId)
            result.skipped++
            if (result.notes.length < 20) result.notes.push(`No email address for ${a.player_name || 'an attendee'} on ${camp.name || 'a camp'}`)
            continue
          }

          // The outcome goes on the claimed row. A failure is visible in the
          // Emails tab, NOT as 'sent', and is tried again on the next runs (see
          // MAX_ATTEMPTS).
          await recordRetry(sb, claimId, r)
          if (r.ok) { done.add(key); result.sent++ } else result.failed++
        }
      }
    }

    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error('[cron/camp-emails]', err)
    return NextResponse.json({ error: 'Run failed', ...result }, { status: 500 })
  }
}
