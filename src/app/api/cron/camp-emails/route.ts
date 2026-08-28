import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { runCoachAgent, extractJson } from '@/lib/coach/agent'
import { campEmailTask } from '@/lib/coach/agent-persona'
import { sendAsCoach } from '@/lib/coach/mail'
import { sendEmail } from '@/lib/emails/send'
import { STAGES, decide, dueAt, type StageId } from '@/lib/coach/camp-lifecycle'

export const runtime = 'nodejs'
export const maxDuration = 300

// The camp countdown runner. A system cron on the VPS hits this hourly:
//
//   17 * * * * curl -sS -X POST https://www.lumiosports.com/api/cron/camp-emails \
//     -H "Authorization: Bearer $CRON_SECRET" > /dev/null
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

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
}

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))
const money = (n: number) => '£' + Number(n).toFixed(Number(n) % 1 ? 2 : 0)
const longDate = (d?: string | null) => {
  if (!d) return ''
  const t = new Date(`${String(d).slice(0, 10)}T00:00:00`)
  return isNaN(t.getTime()) ? '' : t.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

type Camp = Record<string, any>
type Attendee = { id: string } & Record<string, any>
type Player = Record<string, any>

// Who this email actually goes to.
//
// The public sign-up form asks for one address, labelled "your email", and
// stores it in parent_email — for a child that is the parent, for an adult it is
// the player. So parent_email is the booker's address, whoever booked, and it is
// always the first choice.
//
// Attendees the coach adds from the roster have no address of their own, only a
// player_id. For those we fall back to the roster row and apply the same rule
// the booking confirmations use: under-16 (or unknown age) is reached through the
// parent, 16+ direct. Nothing to write to means nothing gets sent, which is
// reported rather than guessed at.
function recipientFor(a: Attendee, p?: Player | null): { to: string | null; toParent: boolean; greeting: string } {
  const age = a.player_age ?? p?.age
  const minor = age == null || Number(age) < 16

  const fromRoster = minor
    ? [p?.parent_email, p?.email, p?.contact_email]
    : [p?.email, p?.contact_email, p?.parent_email]
  const to = [a.parent_email, ...fromRoster]
    .map(v => String(v ?? '').trim())
    .find(v => v.includes('@')) || null

  // A minor's email is addressed to whoever is reading it, so use the parent's
  // name if we have one. An adult is greeted by their own.
  const named = minor
    ? (a.parent_name || p?.parent_name || '')
    : (a.player_name || p?.name || '')
  const greeting = String(named || a.parent_name || a.player_name || '').trim().split(/\s+/)[0] || 'there'

  return { to, toParent: minor, greeting }
}

/** Is there anything for the "two weeks out" email to actually chase? */
function chaseReasons(camp: Camp, a: Attendee): string[] {
  const out: string[] = []
  const owed = balanceOwed(camp, a)
  if (owed > 0) out.push(`Balance still to pay: ${money(owed)}${camp.balance_link ? '' : ' — the coach will be in touch about how to pay it'}`)
  if (!a.consent_photo) out.push('Photo consent has not been given yet')
  if (!a.consent_medical && a.medical_notes) out.push('Consent to hold their medical information has not been given yet')
  if (!a.emergency_contact) out.push('No emergency contact on file yet')
  if (camp.overseas) out.push('This trip is abroad — passport in date, and travel insurance sorted')
  return out
}

function balanceOwed(camp: Camp, a: Attendee): number {
  const price = Number(camp.price) || 0
  if (!price) return 0
  if (a.paid) return 0
  const paidPennies = Number(a.amount_pennies) || 0
  const owed = price - paidPennies / 100
  return owed > 0.5 ? owed : 0
}

/** Only what the camp record actually holds. An absent field is an absent line. */
function factsFor(camp: Camp, a: Attendee, stage: StageId): string[] {
  const brief = camp.parent_brief || {}
  const f: string[] = []
  const push = (v: unknown, label: string) => { if (v && String(v).trim()) f.push(`${label}: ${String(v).trim()}`) }

  push(camp.location && [camp.location, camp.region].filter(Boolean).join(', '), 'Venue')
  push(camp.ages, 'Ages')
  push(camp.surface, 'Surface')
  push(brief.dailyShape || camp.daily_rhythm, 'What a typical day looks like')
  if (Array.isArray(brief.whatToBring) && brief.whatToBring.length) f.push(`What to bring: ${brief.whatToBring.join(', ')}`)
  if (Array.isArray(brief.whatTheyWorkOn) && brief.whatTheyWorkOn.length) f.push(`What they work on: ${brief.whatTheyWorkOn.join('; ')}`)
  if (Array.isArray(brief.whatTheyLeaveWith) && brief.whatTheyLeaveWith.length) f.push(`What they leave with: ${brief.whatTheyLeaveWith.join('; ')}`)
  push(camp.signup_note, 'The coach’s own note')
  push(camp.board, 'Board')

  // Day one is what the "week to go" email is built around, so it only earns a
  // line there. The night before, the day's shape is the whole email.
  if (stage === 'one_week' && Array.isArray(camp.itinerary) && camp.itinerary[0]) {
    push(camp.itinerary[0].theme || camp.itinerary[0].focus, 'Day one')
    push(camp.itinerary[0].coachFocus, 'What the coaches are looking at on day one')
  }
  if (stage === 'two_weeks') for (const r of chaseReasons(camp, a)) f.push(r)
  if (stage === 'tomorrow') push(camp.daily_rhythm, 'How the day runs')
  if (camp.overseas) f.push('This camp is abroad')
  return f
}

function shell(logoUrl: string | null, academy: string, greeting: string, body: string, coachName: string, preheader = '') {
  return `<!doctype html><html><body style="margin:0;padding:24px 12px;background:#eef0f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;height:0;width:0">${esc(preheader)}</div>` : ''}
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(20,25,40,.07)">
  <div style="background:linear-gradient(135deg,#3A8EE0,#3A8EE0bb);padding:22px;text-align:center;color:#fff">
    ${logoUrl ? `<img src="${esc(logoUrl)}" alt="" style="height:42px;max-width:150px;background:#fff;border-radius:10px;padding:7px;margin-bottom:9px">` : ''}
    <div style="font-size:11px;letter-spacing:.22em;text-transform:uppercase;opacity:.9">${esc(academy)}</div>
  </div>
  <div style="padding:24px 22px">
    <p style="margin:0 0 14px;font-size:15.5px;color:#374151">Hi ${esc(greeting)},</p>
    ${body}
    <p style="margin:22px 0 0;font-size:15px;color:#374151">${esc(coachName)}</p>
  </div>
</div>
</body></html>`
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
      const academy = profile?.brand_name || 'Your academy'
      const coachName = profile?.display_name || ''
      const overrides = (camp.email_overrides || {}) as Record<string, { skip?: boolean; note?: string }>

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

          const rec = recipientFor(a, a.player_id ? players.get(String(a.player_id)) : null)
          if (!rec.to) {
            // Worth surfacing: a coach who adds their roster to a camp and has
            // never filled in contact details would otherwise see "0 sent" with
            // no explanation.
            result.skipped++
            if (result.notes.length < 20) result.notes.push(`No email address for ${a.player_name || 'an attendee'} on ${camp.name || 'a camp'}`)
            continue
          }

          try {
            const alreadySaid = STAGES
              .filter(s => s.id !== stage.id && done.has(`${a.id}:${s.id}`))
              .map(s => s.job)

            const task = campEmailTask({
              stage: stage.label, job: stage.job,
              academy, coachName,
              campName: camp.name || 'the camp',
              when: [longDate(camp.start_date), camp.end_date && camp.end_date !== camp.start_date ? longDate(camp.end_date) : ''].filter(Boolean).join(' – '),
              where: [camp.location, camp.region].filter(Boolean).join(', '),
              playerName: a.player_name || 'your player',
              greetingName: rec.greeting, toParent: rec.toParent,
              facts: [
                ...factsFor(camp, a, stage.id),
                // The coach's own line for this email. It goes in as a fact, not
                // as a replacement body — Lumio Coach still writes the email, so
                // the voice and the one-job rule hold.
                overrides[stage.id]?.note ? `The coach has asked for this to be included: ${String(overrides[stage.id]!.note).slice(0, 600)}` : '',
              ].filter(Boolean),
              alreadySaid,
            })

            const { text } = await runCoachAgent({ apiKey, task, maxTokens: 1200 })
            const w = extractJson<{ subject?: string; preheader?: string; paragraphs?: string[]; bullets?: string[]; cta?: string }>(text, {})
            const paras = (w.paragraphs || []).filter(Boolean)
            if (!paras.length) throw new Error('empty email')

            const owed = balanceOwed(camp, a)
            const bullets = (w.bullets || []).filter(Boolean)
            const body = [
              paras.map(x => `<p style="margin:0 0 14px;font-size:15.5px;line-height:1.65;color:#374151">${esc(x)}</p>`).join(''),
              bullets.length ? `<ul style="margin:0 0 14px;padding-left:20px">${bullets.map(b => `<li style="font-size:15px;line-height:1.6;color:#374151;margin-bottom:5px">${esc(b)}</li>`).join('')}</ul>` : '',
              w.cta ? `<p style="margin:0 0 14px;font-size:15.5px;line-height:1.6;color:#374151">${esc(w.cta)}</p>` : '',
              // The balance link only appears where there is a balance AND the
              // coach has given somewhere to pay it.
              stage.id === 'two_weeks' && owed > 0 && camp.balance_link
                ? `<div style="margin:18px 0"><a href="${esc(camp.balance_link)}" style="display:inline-block;background:#3A8EE0;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:12px 20px;border-radius:10px">Pay the ${money(owed)} balance</a></div>`
                : '',
              camp.location
                ? `<p style="margin:0;font-size:14px"><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([camp.location, camp.region].filter(Boolean).join(', '))}" style="color:#3A8EE0">Directions to ${esc(camp.location)}</a></p>`
                : '',
            ].join('')

            const subject = String(w.subject || `${camp.name} — an update`).slice(0, 150)
            const html = shell(profile?.brand_logo_url ?? null, academy, rec.greeting, body, coachName, w.preheader || '')

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
