// ─────────────────────────────────────────────────────────────────────────────
// The camp countdown — which email is due, for whom, and when.
//
// Deliberately free of Supabase, Anthropic and email transport so the timing
// rules can be reasoned about (and tested) on their own. The cron route supplies
// rows; this decides what should happen to them.
//
// Built generic on purpose: STAGES is a list of offsets against an anchor date.
// Lesson packages later become a second list against a different anchor (pack
// expiry rather than camp start) using the same runner.
// ─────────────────────────────────────────────────────────────────────────────

export type StageId = 'signup' | 'details' | 'two_weeks' | 'one_week' | 'tomorrow' | 'after'

export type Stage = {
  id: StageId
  label: string
  // Days relative to the camp START date (or to its last day, see `from`).
  // Negative is before, positive after. `null` means "not on the clock" — it
  // fires from an event instead.
  offsetDays: number | null
  // 'end' counts from the camp's LAST day instead of its first. "How it went"
  // is the only one: counted from the start it arrived on day three of a
  // five-day camp, while the children were still on court.
  from?: 'end'
  // What this email is for, in the coach's language. Shown in the Emails tab
  // and given to Lumio Coach as the brief.
  job: string
  // A late sign-up should not receive a burst of stages whose dates have passed.
  // Stages marked `catchUp` are folded into the confirmation instead of skipped
  // silently — the details email is genuinely needed however late you book.
  catchUp?: boolean
  // Stages that only send when there is a reason to.
  conditional?: boolean
  // Exempt from the late sign-up rule. A parent who books the day before still
  // needs to be told where to be at nine tomorrow morning — that email is
  // logistics, not anticipation, so it goes out however late they booked.
  lateStill?: boolean
}

export const STAGES: Stage[] = [
  { id: 'signup', label: 'You’re in', offsetDays: null,
    job: 'Confirm the place and give them a receipt they can find again.' },
  { id: 'details', label: 'Everything you need', offsetDays: -21, catchUp: true,
    job: 'The long one: kit, the shape of a day, travel and accommodation. Sent once, referred back to often.' },
  { id: 'two_weeks', label: 'Two weeks out', offsetDays: -14, conditional: true,
    job: 'The only email that asks for something — an unpaid balance, a missing consent, passport and insurance for a trip abroad.' },
  { id: 'one_week', label: 'A week to go', offsetDays: -7,
    job: 'Turn admin into anticipation: what day one looks like and what they will work on first.' },
  { id: 'tomorrow', label: 'See you tomorrow', offsetDays: -1, lateStill: true,
    job: 'Short. Time, address, map, the coach’s number, and three things to pack tonight.' },
  { id: 'after', label: 'How it went', offsetDays: 2, from: 'end',
    job: 'Their report and certificate, what to keep working on, and the next camp if one is open.' },
]

export const STAGE_BY_ID: Record<StageId, Stage> =
  Object.fromEntries(STAGES.map(s => [s.id, s])) as Record<StageId, Stage>

const DAY = 86_400_000

/** Midnight UTC for a YYYY-MM-DD date string, or null if unusable. */
export function dayStart(iso?: string | null): number | null {
  if (!iso) return null
  const t = Date.parse(`${String(iso).slice(0, 10)}T00:00:00Z`)
  return Number.isNaN(t) ? null : t
}

/**
 * When a stage is due for a camp, or null if it has no clock / no start date.
 * A camp with no end date (or one typed before its start) is a one-day camp,
 * so its last day is its first.
 */
export function dueAt(stage: Stage, campStart?: string | null, campEnd?: string | null): number | null {
  if (stage.offsetDays == null) return null
  const start = dayStart(campStart)
  if (start == null) return null
  const end = dayStart(campEnd)
  const anchor = stage.from === 'end' && end != null && end > start ? end : start
  return anchor + stage.offsetDays * DAY
}

export type Attendee = {
  id: string
  signed_up_at?: string | null
  /** When the row was made — the joining time of a child the coach added by hand. */
  created_at?: string | null
  status?: string | null
}

export type Decision =
  | { action: 'send'; stage: StageId }
  // `terminal` says whether this decision can ever change. A pause can be lifted
  // and a balance can be settled, so those are re-decided on the next run; a date
  // that has passed cannot come back. Only terminal skips are written to the log
  // — which is also what stops them being reconsidered forever. This is a flag
  // rather than the caller pattern-matching the reason text, because a reason is
  // prose written for a coach to read and will get reworded.
  | { action: 'skip'; stage: StageId; reason: string; terminal: boolean }
  | { action: 'wait'; stage: StageId }

/**
 * What should happen to one stage, for one attendee, right now.
 *
 * The ordering of these checks matters. Cancelled and paused come first because
 * they beat everything. The late sign-up rule comes before the due check, so a
 * stage that passed *before they booked* is never treated as merely overdue.
 */
export function decide(opts: {
  stage: Stage
  now: number
  campStart?: string | null
  campEnd?: string | null
  attendee: Attendee
  paused?: boolean | null
  alreadyLogged: boolean
  overrideSkip?: boolean
  /** For conditional stages: is there actually anything to say? */
  hasReason?: boolean
}): Decision {
  const { stage, now, campStart, campEnd, attendee, paused, alreadyLogged, overrideSkip, hasReason } = opts
  const id = stage.id

  if (alreadyLogged) return { action: 'skip', stage: id, reason: 'already handled', terminal: false }
  // NOT terminal. "Don't send this one" is a switch the coach can turn back
  // off, so it is re-read on every run like the pause below it. Written to the
  // log as a decision, it was recorded for everybody at the next hourly run —
  // weeks before the email was due — and unticking it then changed nothing.
  if (overrideSkip) return { action: 'skip', stage: id, reason: 'skipped by the coach', terminal: false }
  if (paused) return { action: 'skip', stage: id, reason: 'emails paused for this camp', terminal: false }
  if ((attendee.status || '') === 'cancelled') return { action: 'skip', stage: id, reason: 'attendee cancelled', terminal: false }

  // An unpaid place is still a place, so the sequence runs — except the emails
  // that assume they are coming. Chasing a balance is exactly what two_weeks is
  // for, so that one still goes.
  if ((attendee.status || '') === 'pending' && (id === 'one_week' || id === 'tomorrow' || id === 'after')) {
    return { action: 'skip', stage: id, reason: 'payment still outstanding', terminal: false }
  }

  const due = dueAt(stage, campStart, campEnd)
  if (due == null) return { action: 'skip', stage: id, reason: 'camp has no start date', terminal: false }

  // ── The late sign-up rule ──────────────────────────────────────────────────
  // If the stage was already due when they signed up, it is not overdue — it
  // was never theirs. Sending it now produces the burst of three emails that
  // reads as broken software.
  // "See you tomorrow" stops being true the moment the camp starts. This applies
  // to everyone, not only late sign-ups — a cron that was down for two days must
  // not send it on the morning of day two.
  if (stage.lateStill) {
    const start = dayStart(campStart)
    if (start != null && now >= start) {
      return { action: 'skip', stage: id, reason: 'the camp has already started', terminal: true }
    }
  }

  // When they joined the camp: the sign-up time, or — for a child the coach
  // added from the roster, which has no sign-up time — when that place was made.
  // Without the second, a child added by the coach was sent a stage that two
  // families who signed up online the same evening were (rightly) not.
  const joined = attendee.signed_up_at || attendee.created_at
  const signedUp = joined ? Date.parse(joined) : null
  if (signedUp != null && !Number.isNaN(signedUp) && due < signedUp && !stage.lateStill) {
    return {
      action: 'skip', stage: id,
      reason: stage.catchUp
        ? 'signed up late — folded into their confirmation'
        : 'signed up after this was due',
      terminal: true,
    }
  }

  if (now < due) return { action: 'wait', stage: id }
  // Terminal on purpose. Once the due date arrives with nothing to chase, there
  // is nothing to chase — and the coach seeing "nothing outstanding" against this
  // stage is more useful than a blank that could mean anything.
  if (stage.conditional && !hasReason) return { action: 'skip', stage: id, reason: 'nothing outstanding', terminal: true }
  return { action: 'send', stage: id }
}

/**
 * Which stages a late sign-up missed and should therefore have folded into their
 * confirmation email. Only `catchUp` stages qualify: the countdown emails are
 * about anticipation and are worthless after the fact, but the details are not.
 */
export function foldedIntoConfirmation(campStart: string | null | undefined, signedUpAt: number): StageId[] {
  return STAGES
    .filter(s => s.catchUp)
    .filter(s => { const d = dueAt(s, campStart); return d != null && d < signedUpAt })
    .map(s => s.id)
}

/**
 * Is this log row left over from the camp's OLD dates?
 *
 * A row records a decision — sent, skipped, failed — and a coach can move the
 * camp afterwards. Two rules, and the first always wins:
 *
 *   • An email that was SENT stays sent, wherever the camp moves. It is a
 *     record of something a family received: it is never removed, never
 *     rewritten, and that email is never sent to them again for this camp.
 *     (It used to be discarded whenever it had been written before the NEW
 *     due date — which is every email already sent, the moment a camp is
 *     postponed by a day. "A week to go" then went out twice and the older
 *     ones were re-recorded as "skipped — too late to be useful".)
 *   • A skip or a failure was a judgement about a particular date ("the camp
 *     has already started", "too late to be useful"). If the date it was made
 *     for is not the date now, it is made again. Rows from before the due date
 *     was recorded are judged on when they were written.
 */
export function logOutOfDate(
  row: { status?: string | null; sent_at?: string | null; due_at?: string | null },
  stage: Stage, campStart?: string | null, campEnd?: string | null,
): boolean {
  // Sent, or being sent this minute: settled.
  if (row.status === 'sent' || row.status === 'sending') return false
  const due = dueAt(stage, campStart, campEnd)
  if (due == null) return false
  const dueThen = row.due_at ? Date.parse(row.due_at) : NaN
  if (!Number.isNaN(dueThen)) return dueThen !== due
  const written = row.sent_at ? Date.parse(row.sent_at) : NaN
  return !Number.isNaN(written) && written < due
}

/** Human-readable due date for the coach's Emails tab. */
export function dueLabel(stage: Stage, campStart?: string | null, campEnd?: string | null): string {
  if (stage.offsetDays == null) return 'On sign-up'
  const due = dueAt(stage, campStart, campEnd)
  if (due == null) return 'Needs a start date'
  return new Date(due).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
