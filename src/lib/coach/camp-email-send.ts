// ─────────────────────────────────────────────────────────────────────────────
// Sending one camp countdown email to one attendee.
//
// Its own module because two things send: the hourly job, and the coach pressing
// "Send again" on an email that failed. Both must build the same email from the
// same facts and record it the same way — a resend that took a different route
// from the original would be a second version of the email nobody had previewed.
//
// Server only (it holds the mail transport and the model call).
// ─────────────────────────────────────────────────────────────────────────────

import type { SupabaseClient } from '@supabase/supabase-js'
import { runCoachAgent, extractJson } from '@/lib/coach/agent'
import { sendAsCoach } from '@/lib/coach/mail'
import { sendEmail } from '@/lib/emails/send'
import type { Stage } from '@/lib/coach/camp-lifecycle'
import {
  recipientFor, chaseReasons, buildTask, renderCampEmail, usableDraft,
  type Camp, type Attendee, type Player, type Profile, type Draft,
} from '@/lib/coach/camp-email-build'

/** How many times the hourly job tries one email before leaving it to the coach. */
export const MAX_ATTEMPTS = 3

/** The roster columns recipientFor needs. One list, so no caller forgets one. */
export const PLAYER_COLUMNS = 'id, name, age, category, parent_name, email, contact_email, parent_email'

type Override = { skip?: boolean; note?: string; draft?: Draft }

export type SendResult =
  | { ok: true; to: string; subject: string }
  // `noAddress` is not a failure of the send — there is nobody to send to.
  | { ok: false; error: string; noAddress?: boolean }

/**
 * Build and send one stage to one attendee. Never throws: whatever goes wrong
 * comes back as a reason a coach can read.
 */
export async function sendCampStage(opts: {
  apiKey: string
  camp: Camp; attendee: Attendee; player?: Player | null; profile: Profile
  stage: Stage
  /** Absolute public origin, so links work in an inbox. */
  origin: string
  alreadySaid?: string[]
}): Promise<SendResult> {
  const { camp, attendee: a, stage, profile } = opts
  const rec = recipientFor(camp, a, opts.player)
  if (!rec.to) return { ok: false, noAddress: true, error: 'no email address on file' }

  try {
    const override = ((camp.email_overrides || {}) as Record<string, Override>)[stage.id]
    const saved = override?.draft
    let draft: Draft
    let extraBullets: string[] = []

    if (usableDraft(saved)) {
      // The coach previewed this one, edited it and approved it. His words go
      // out verbatim — no model call, and no chance of the email differing from
      // what he signed off.
      draft = saved
      // Except the per-family part. He approved wording, not Sophie's
      // outstanding £150, so a conditional stage still carries each family's
      // own chase lines underneath.
      if (stage.conditional) extraBullets = chaseReasons(camp, a)
    } else {
      const task = buildTask({
        camp, attendee: a, stage, profile,
        greeting: rec.greeting, toParent: rec.toParent,
        alreadySaid: opts.alreadySaid || [],
        note: override?.note,
      })
      const { text } = await runCoachAgent({ apiKey: opts.apiKey, task, maxTokens: 1200 })
      draft = extractJson<Draft>(text, {})
      if (!(draft.paragraphs || []).filter(Boolean).length) {
        return { ok: false, error: 'Lumio Coach could not write this email' }
      }
    }

    const { subject, html } = renderCampEmail({
      camp, attendee: a, profile, stageId: stage.id, draft,
      greeting: rec.greeting, toParent: rec.toParent, extraBullets, origin: opts.origin,
    })

    const sent = await sendAsCoach(camp.coach_id, { to: rec.to, subject, html })
    if (!sent.ok) {
      const fb = await sendEmail({
        context: 'camp-emails reminder',
        from: 'Lumio Tennis <noreply@lumiosports.com>', to: [rec.to], subject, html,
        replyTo: profile?.contact_email || undefined,
      })
      // sendEmail resolves with { data, error } rather than throwing, so a
      // refused send has to be read off the result — otherwise it is recorded
      // as delivered.
      if (fb.error) return { ok: false, error: `the email could not be delivered (${String(fb.error.message || 'refused').slice(0, 200)})` }
    }
    return { ok: true, to: rec.to, subject }
  } catch (e) {
    return { ok: false, error: (e instanceof Error ? e.message : 'unknown error').slice(0, 300) }
  }
}

// ── One sender per email ─────────────────────────────────────────────────────
// Whoever is about to send an email first takes it IN THE DATABASE, by putting
// its log row into the 'sending' state, and only the caller the database says
// yes to goes on to send. Checking the log and then sending was not enough: two
// runs of the hourly job at the same moment (or two "Send again" requests) both
// saw "not sent yet", both sent, and the family got the email two or three
// times with one log row to show for it.

/**
 * Take an email that has never been tried. The unique key on (attendee, stage)
 * lets exactly one insert through; everybody else gets null and must not send.
 */
export async function claimFirst(sb: SupabaseClient, row: {
  coach_id: string; camp_id: string; attendee_id: string; stage: string; due_at: string | null
}): Promise<string | null> {
  const { data, error } = await sb.from('coach_camp_emails')
    .insert({ ...row, status: 'sending' }).select('id')
  if (error || !data?.length) return null
  return data[0].id as string
}

/**
 * Take a failed email for one more try. The row leaves 'failed' in the same
 * statement that counts the attempt, so a second caller — an overlapping run,
 * or a second press of "Send again" while the first is still sending — finds
 * nothing to take. False means somebody else has it (or it has since gone).
 */
export async function claimRetry(sb: SupabaseClient, row: { id: string; attempts?: number | null }): Promise<boolean> {
  const seen = Number(row.attempts) || 1
  const { data } = await sb.from('coach_camp_emails')
    .update({ attempts: seen + 1, status: 'sending', sent_at: new Date().toISOString() })
    .eq('id', row.id).eq('status', 'failed').eq('attempts', seen)
    .select('id')
  return !!data?.length
}

/** Give up a claim without a result — there was nobody to send to. */
export async function dropClaim(sb: SupabaseClient, id: string) {
  await sb.from('coach_camp_emails').delete().eq('id', id).eq('status', 'sending')
}

// A send takes seconds. A row still 'sending' after this long belongs to a run
// that died half way, and nobody can know whether the email left. It is handed
// to the coach as a failure with that said, and NOT retried automatically:
// sending it again by itself could be the duplicate this whole scheme prevents.
const STUCK_AFTER_MS = 15 * 60_000
export async function releaseStuck(sb: SupabaseClient, campId: string) {
  await sb.from('coach_camp_emails')
    .update({ status: 'failed', attempts: MAX_ATTEMPTS, error: 'the send was interrupted, so it may not have gone. Check with the family before sending it again' })
    .eq('camp_id', campId).eq('status', 'sending')
    .lt('sent_at', new Date(Date.now() - STUCK_AFTER_MS).toISOString())
}

/** Write the outcome of a send back onto the row that was claimed for it. */
export async function recordRetry(sb: SupabaseClient, id: string, r: SendResult) {
  await sb.from('coach_camp_emails')
    .update(r.ok
      ? { status: 'sent', subject: r.subject, error: null, sent_at: new Date().toISOString() }
      : { status: 'failed', error: r.error })
    .eq('id', id)
}
