// A lesson summary, as the FAMILY is allowed to see it.
//
// A coach_sessions row holds two kinds of thing: what the lesson covered (shared
// with the player and parent — that is what the summary is for) and the coach's
// own note, which the lesson form labels "Coach note (private) — for your eyes
// only, not shared". The row was being sent to the family's page whole, so the
// private note went with it, three times over: as review_json.coachNote, copied
// into `summary`, and appended to the `ai_review` text.
//
// So the family's copy is built here, field by field, from a list of what the
// page shows. Anything not named below does not leave the server — which also
// covers whatever is added to the row in future. It is applied to every row,
// including the ones saved before this existed, by both doors to the page: the
// family's own portal and the coach's preview of it (a preview that showed the
// note would tell the coach the family can see it).

import type { StudentLesson, StudentReview } from './bundle'

type Row = Record<string, unknown>

const text = (v: unknown, max = 2000): string | undefined => {
  if (typeof v !== 'string') return undefined
  const s = v.trim()
  return s ? s.slice(0, max) : undefined
}
const list = (v: unknown): string[] | undefined => {
  if (!Array.isArray(v)) return undefined
  const out = v.map(x => text(x)).filter((x): x is string => !!x).slice(0, 12)
  return out.length ? out : undefined
}
const flat = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase()

export function familyLesson(row: Row): StudentLesson {
  const r = (row.review_json && typeof row.review_json === 'object' ? row.review_json : {}) as Row
  const privateNote = text(r.coachNote, 100_000) || ''

  // `summary` is shared when it is the lesson's own headline — but the form
  // saves the private note INTO it when there is one, so a summary that is (or
  // contains) the note is dropped rather than shown.
  let summary = text(row.summary, 4000) || null
  if (summary && privateNote && flat(summary).includes(flat(privateNote))) summary = null

  const review: StudentReview = {
    focus: text(r.focus, 300),
    type: text(r.type, 60),
    recap: text(r.recap),
    takeaways: list(r.takeaways),
    covered: list(r.covered),
    homework: text(r.homework),
    nextFocus: text(r.nextFocus),
    // The note written TO the player — its own field, separate from the private
    // `coachNote` above, which is still never sent. The lesson form's "Note to
    // the player (shared)" box and Lumio Coach's write-ups both save it here.
    playerNote: text(r.playerNote),
  }
  // The diagnosis leads the short version of an AI summary (see lessonRecap);
  // it is part of what the lesson covered, written for the player.
  const assessment = text(r.assessment)
  const shared = { ...review, ...(assessment ? { assessment } : {}) } as StudentReview

  return {
    id: String(row.id),
    session_date: (row.session_date as string) ?? null,
    focus: text(row.focus, 300) ?? null,
    summary,
    review_json: shared,
    rating: typeof row.rating === 'number' ? row.rating : null,
  }
}
