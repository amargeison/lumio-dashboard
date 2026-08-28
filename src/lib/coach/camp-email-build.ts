// ─────────────────────────────────────────────────────────────────────────────
// Building one camp countdown email.
//
// Shared deliberately. The coach's Preview must be the SAME email the cron will
// send, built by the same code from the same facts — a preview that is merely
// "representative" is worse than none, because it teaches a coach to trust
// something that isn't what goes out.
//
// So: this module turns (camp, attendee, stage) into the brief Lumio Coach is
// given, and turns his JSON back into finished HTML. The cron route runs it on a
// schedule; the preview route runs it on demand. Neither owns it.
// ─────────────────────────────────────────────────────────────────────────────

import { campEmailTask } from '@/lib/coach/agent-persona'
import { STAGES, type Stage, type StageId } from '@/lib/coach/camp-lifecycle'

export type Camp = Record<string, any>
export type Attendee = { id: string } & Record<string, any>
export type Player = Record<string, any>
export type Profile = {
  brand_name?: string | null; brand_logo_url?: string | null
  display_name?: string | null; contact_email?: string | null
} | null

// What Lumio Coach returns, and what a coach edits. Kept as structure rather
// than a blob of HTML: a coach editing paragraphs cannot break the layout, and
// the balance button and map link stay under our control rather than his.
export type Draft = {
  subject?: string
  preheader?: string
  paragraphs?: string[]
  bullets?: string[]
  cta?: string
}

export const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))

export const money = (n: number) => '£' + Number(n).toFixed(Number(n) % 1 ? 2 : 0)

export const longDate = (d?: string | null) => {
  if (!d) return ''
  const t = new Date(`${String(d).slice(0, 10)}T00:00:00`)
  return isNaN(t.getTime()) ? '' : t.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

// ── Who it goes to ───────────────────────────────────────────────────────────
// The public sign-up form asks for one address, labelled "your email", and
// stores it in parent_email — for a child that is the parent, for an adult it is
// the player. So parent_email is the booker's address, whoever booked, and it is
// always the first choice.
//
// Attendees the coach adds from the roster have no address of their own, only a
// player_id. For those we fall back to the roster row and apply the same rule the
// booking confirmations use: under-16 (or unknown age) is reached through the
// parent, 16+ direct.
export function recipientFor(a: Attendee, p?: Player | null): { to: string | null; toParent: boolean; greeting: string } {
  const age = a.player_age ?? p?.age
  const minor = age == null || Number(age) < 16

  const fromRoster = minor
    ? [p?.parent_email, p?.email, p?.contact_email]
    : [p?.email, p?.contact_email, p?.parent_email]
  const to = [a.parent_email, ...fromRoster]
    .map(v => String(v ?? '').trim())
    .find(v => v.includes('@')) || null

  const named = minor ? (a.parent_name || p?.parent_name || '') : (a.player_name || p?.name || '')
  const greeting = String(named || a.parent_name || a.player_name || '').trim().split(/\s+/)[0] || 'there'

  return { to, toParent: minor, greeting }
}

export function balanceOwed(camp: Camp, a: Attendee): number {
  const price = Number(camp.price) || 0
  if (!price) return 0
  if (a.paid) return 0
  const paidPennies = Number(a.amount_pennies) || 0
  const owed = price - paidPennies / 100
  return owed > 0.5 ? owed : 0
}

/** Is there anything for the "two weeks out" email to actually chase? */
export function chaseReasons(camp: Camp, a: Attendee): string[] {
  const out: string[] = []
  const owed = balanceOwed(camp, a)
  if (owed > 0) out.push(`Balance still to pay: ${money(owed)}${camp.balance_link ? '' : ' — the coach will be in touch about how to pay it'}`)
  if (!a.consent_photo) out.push('Photo consent has not been given yet')
  if (!a.consent_medical && a.medical_notes) out.push('Consent to hold their medical information has not been given yet')
  if (!a.emergency_contact) out.push('No emergency contact on file yet')
  if (camp.overseas) out.push('This trip is abroad — passport in date, and travel insurance sorted')
  return out
}

/** Only what the camp record actually holds. An absent field is an absent line. */
export function factsFor(camp: Camp, a: Attendee, stage: StageId): string[] {
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

/** The brief handed to Lumio Coach. Same one whether previewing or sending. */
export function buildTask(opts: {
  camp: Camp; attendee: Attendee; stage: Stage; profile: Profile
  greeting: string; toParent: boolean
  alreadySaid?: string[]
  note?: string | null
}): string {
  const { camp, attendee, stage, profile, greeting, toParent } = opts
  return campEmailTask({
    stage: stage.label,
    job: stage.job,
    academy: profile?.brand_name || 'Your academy',
    coachName: profile?.display_name || '',
    campName: camp.name || 'the camp',
    when: [longDate(camp.start_date), camp.end_date && camp.end_date !== camp.start_date ? longDate(camp.end_date) : '']
      .filter(Boolean).join(' – '),
    where: [camp.location, camp.region].filter(Boolean).join(', '),
    playerName: attendee.player_name || 'your player',
    greetingName: greeting,
    toParent,
    facts: [
      ...factsFor(camp, attendee, stage.id),
      // The coach's own line for this email. It goes in as a fact, not as a
      // replacement body — Lumio Coach still writes the email, so the voice and
      // the one-job rule hold.
      opts.note ? `The coach has asked for this to be included: ${String(opts.note).slice(0, 600)}` : '',
    ].filter(Boolean),
    alreadySaid: opts.alreadySaid || [],
  })
}

/** The jobs of the stages this attendee has already been sent. */
export function alreadySaidFor(done: Set<string>, attendeeId: string, exclude: StageId): string[] {
  return STAGES
    .filter(s => s.id !== exclude && done.has(`${attendeeId}:${s.id}`))
    .map(s => s.job)
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

/**
 * The draft, rendered as the email that actually goes out.
 *
 * The greeting, the balance button and the map link are added HERE rather than
 * being part of the draft, which is what makes a coach's edit safe: he changes
 * the words, and the per-attendee bits are still assembled from that attendee's
 * own record. It is also why an edited email still gets the right balance for
 * each family rather than the number that was on screen when he saved it.
 */
export function renderCampEmail(opts: {
  camp: Camp; attendee: Attendee; profile: Profile
  stageId: StageId; draft: Draft; greeting: string
  /** Appended after the draft's own bullets. Used when a saved draft replaces
   *  Lumio Coach on a conditional stage, so the per-family chase lines survive. */
  extraBullets?: string[]
}): { subject: string; html: string } {
  const { camp, attendee, profile, stageId, draft, greeting } = opts

  const paras = (draft.paragraphs || []).map(x => String(x || '').trim()).filter(Boolean)
  const bullets = [...(draft.bullets || []), ...(opts.extraBullets || [])]
    .map(x => String(x || '').trim()).filter(Boolean)
  const owed = balanceOwed(camp, attendee)

  const body = [
    paras.map(x => `<p style="margin:0 0 14px;font-size:15.5px;line-height:1.65;color:#374151">${esc(x)}</p>`).join(''),
    bullets.length
      ? `<ul style="margin:0 0 14px;padding-left:20px">${bullets.map(b => `<li style="font-size:15px;line-height:1.6;color:#374151;margin-bottom:5px">${esc(b)}</li>`).join('')}</ul>`
      : '',
    draft.cta ? `<p style="margin:0 0 14px;font-size:15.5px;line-height:1.6;color:#374151">${esc(draft.cta)}</p>` : '',
    // The balance link only appears where there is a balance AND the coach has
    // given somewhere to pay it.
    stageId === 'two_weeks' && owed > 0 && camp.balance_link
      ? `<div style="margin:18px 0"><a href="${esc(camp.balance_link)}" style="display:inline-block;background:#3A8EE0;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:12px 20px;border-radius:10px">Pay the ${money(owed)} balance</a></div>`
      : '',
    camp.location
      ? `<p style="margin:0;font-size:14px"><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([camp.location, camp.region].filter(Boolean).join(', '))}" style="color:#3A8EE0">Directions to ${esc(camp.location)}</a></p>`
      : '',
  ].join('')

  return {
    subject: String(draft.subject || `${camp.name} — an update`).slice(0, 150),
    html: shell(profile?.brand_logo_url ?? null, profile?.brand_name || 'Your academy', greeting, body, profile?.display_name || '', draft.preheader || ''),
  }
}

/** A saved draft is only usable if it actually says something. */
export function usableDraft(d?: Draft | null): d is Draft {
  return !!d && Array.isArray(d.paragraphs) && d.paragraphs.filter(Boolean).length > 0
}
