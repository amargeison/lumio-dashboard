import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { runCoachAgent, extractJson } from '@/lib/coach/agent'
import { sendAsCoach } from '@/lib/coach/mail'
import { sendEmail } from '@/lib/emails/send'
import { STAGES, decide, dueAt } from '@/lib/coach/camp-lifecycle'
import { publicSiteOrigin } from '@/lib/public-origin'
import {
  recipientFor, chaseReasons, buildTask, alreadySaidFor,
  renderCampEmail, usableDraft,
  type Camp, type Attendee, type Player, type Draft,
} from '@/lib/coach/camp-email-build'

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
// (attendee_id, stage) in coach_camp_emails is the real guarantee — this route
// checks the log first, but the database is what actually stops a duplicate if
// two runs overlap. With auto-send, emailing a family the same thing twice is
// the failure that would cost a coach trust in the whole feature.

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
    // Only camps that could plausibly have something due: started within the
    // last fortnight, or starting within the next month.
    const from = new Date(now - 21 * DAY).toISOString().slice(0, 10)
    const to = new Date(now + 40 * DAY).toISOString().slice(0, 10)
    const { data: camps } = await sb.from('coach_camps').select('*')
      .not('start_date', 'is', null).gte('start_date', from).lte('start_date', to)

    for (const camp of (camps ?? []) as Camp[]) {
      const { data: attendees } = await sb.from('coach_camp_attendees').select('*').eq('camp_id', camp.id)
      if (!attendees?.length) continue

      // Roster rows for coach-added attendees, who carry no contact details of
      // their own. One query per camp rather than one per attendee.
      const playerIds = [...new Set((attendees as Attendee[]).map(a => a.player_id).filter(Boolean))]
      const players = new Map<string, Player>()
      if (playerIds.length) {
        const { data: rows } = await sb.from('coach_players')
          .select('id, name, age, parent_name, email, contact_email, parent_email').in('id', playerIds)
        for (const r of (rows ?? []) as Player[]) players.set(String(r.id), r)
      }

      const { data: logs } = await sb.from('coach_camp_emails')
        .select('attendee_id, stage').eq('camp_id', camp.id)
      const done = new Set((logs ?? []).map(l => `${l.attendee_id}:${l.stage}`))

      const { data: profile } = await sb.from('sports_profiles')
        .select('brand_name, brand_logo_url, display_name, contact_email').eq('id', camp.coach_id).maybeSingle()
      const overrides = (camp.email_overrides || {}) as Record<string, Override>

      for (const a of attendees as Attendee[]) {
        for (const stage of STAGES) {
          if (stage.id === 'signup') continue   // sent by the sign-up route itself
          result.considered++

          const d = decide({
            stage, now, campStart: camp.start_date, attendee: a,
            paused: camp.emails_paused,
            alreadyLogged: done.has(`${a.id}:${stage.id}`),
            overrideSkip: !!overrides[stage.id]?.skip,
            hasReason: stage.conditional ? chaseReasons(camp, a).length > 0 : true,
          })

          if (d.action === 'wait') continue
          if (d.action === 'skip') {
            // Only terminal skips are written. A pause can be lifted and an
            // unpaid balance can be settled, so those are re-decided next run
            // rather than being recorded as a decision forever.
            if (d.terminal && !done.has(`${a.id}:${stage.id}`)) {
              await sb.from('coach_camp_emails').insert({
                coach_id: camp.coach_id, camp_id: camp.id, attendee_id: a.id,
                stage: stage.id, status: 'skipped', error: d.reason,
              })
              done.add(`${a.id}:${stage.id}`)
            }
            result.skipped++
            continue
          }

          const due = dueAt(stage, camp.start_date)
          if (due != null && now - due > STALE_AFTER) {
            await sb.from('coach_camp_emails').insert({
              coach_id: camp.coach_id, camp_id: camp.id, attendee_id: a.id,
              stage: stage.id, status: 'skipped', error: 'too late to be useful',
            })
            result.skipped++
            continue
          }

          const rec = recipientFor(camp, a, a.player_id ? players.get(String(a.player_id)) : null)
          if (!rec.to) {
            // Worth surfacing: a coach who adds their roster to a camp and has
            // never filled in contact details would otherwise see "0 sent" with
            // no explanation.
            result.skipped++
            if (result.notes.length < 20) result.notes.push(`No email address for ${a.player_name || 'an attendee'} on ${camp.name || 'a camp'}`)
            continue
          }

          try {
            const saved = overrides[stage.id]?.draft
            let draft: Draft
            let extraBullets: string[] = []

            if (usableDraft(saved)) {
              // The coach previewed this one, edited it and approved it. His
              // words go out verbatim — no model call, and no chance of the
              // email differing from what he signed off.
              draft = saved
              // Except the per-family part. He approved wording, not Sophie's
              // outstanding £150, so a conditional stage still carries each
              // family's own chase lines underneath.
              if (stage.conditional) extraBullets = chaseReasons(camp, a)
            } else {
              const task = buildTask({
                camp, attendee: a, stage, profile: profile ?? null,
                greeting: rec.greeting, toParent: rec.toParent,
                alreadySaid: alreadySaidFor(done, a.id, stage.id),
                note: overrides[stage.id]?.note,
              })
              const { text } = await runCoachAgent({ apiKey, task, maxTokens: 1200 })
              draft = extractJson<Draft>(text, {})
              if (!(draft.paragraphs || []).filter(Boolean).length) throw new Error('empty email')
            }

            const { subject, html } = renderCampEmail({
              camp, attendee: a, profile: profile ?? null,
              stageId: stage.id, draft, greeting: rec.greeting, extraBullets,
              origin,
            })

            const sent = await sendAsCoach(camp.coach_id, { to: rec.to, subject, html })
            if (!sent.ok) {
              await sendEmail({
                from: 'Lumio Tennis <noreply@lumiosports.com>', to: [rec.to], subject, html,
                replyTo: profile?.contact_email || undefined,
              })
            }

            await sb.from('coach_camp_emails').insert({
              coach_id: camp.coach_id, camp_id: camp.id, attendee_id: a.id,
              stage: stage.id, status: 'sent', subject,
            })
            done.add(`${a.id}:${stage.id}`)
            result.sent++
          } catch (e) {
            // A failure is logged so it is visible in the Emails tab, but NOT as
            // 'sent' — the unique index means it will not be retried, which is
            // the right trade: a coach seeing "failed" can resend deliberately,
            // whereas an automatic retry loop could mail someone repeatedly.
            await sb.from('coach_camp_emails').insert({
              coach_id: camp.coach_id, camp_id: camp.id, attendee_id: a.id,
              stage: stage.id, status: 'failed',
              error: (e instanceof Error ? e.message : 'unknown').slice(0, 300),
            }).then(() => {}, () => {})
            done.add(`${a.id}:${stage.id}`)
            result.failed++
          }
        }
      }
    }

    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error('[cron/camp-emails]', err)
    return NextResponse.json({ error: 'Run failed', ...result }, { status: 500 })
  }
}
