// The short version of a lesson.
//
// Two or three plain sentences that say what the session was about and what to
// do before the next one — the thing a parent reads in the doorway. Distinct
// from the full summary, which is for the coach and the record.
//
// Shared, because the same recap now appears in three places: under the
// homework on the coach's Lesson Summaries page, at the top of every lesson in
// the player's portal, and behind the Summary button. Three derivations of "the
// short version" would drift, and the parent would get a different sentence
// depending on which screen they happened to be on.
//
// No API call: AI summaries written since the diagnostic tuning carry a proper
// `recap`, and everything older is derived locally from what the summary
// already holds. Instant and free, wherever it renders.

export type RecapReview = {
  focus?: string
  covered?: string[]
  takeaways?: string[]
  homework?: string
  nextFocus?: string
  coachNote?: string
  assessment?: string
  recap?: string
}

export type RecapSession = {
  player_name?: string | null
  focus?: string | null
  summary?: string | null
  ai_review?: string | null
  review_json?: RecapReview | null
}

const lowerFirst = (x: string) => x.charAt(0).toLowerCase() + x.slice(1)
const stripEnd = (x: string) => x.replace(/\s*[.;,]+\s*$/, '')
const firstSentences = (text: string, n: number) =>
  (text.match(/[^.!?]+[.!?]+(\s|$)/g) || [text]).map(x => x.trim()).slice(0, n).join(' ').trim()

export function lessonRecap(s: RecapSession): { text: string; source: 'ai' | 'derived' | 'none' } {
  const r = s.review_json || {}
  if (r.recap?.trim()) return { text: r.recap.trim(), source: 'ai' }

  const first = (s.player_name || '').trim().split(/\s+/)[0]
  const focus = stripEnd((s.focus || r.focus || '').trim())
  const out: string[] = []
  if (focus) out.push(`${first ? `${first}'s session` : 'This session'} focused on ${lowerFirst(focus)}.`)
  // Where there is a diagnosis it IS the headline; otherwise the top takeaway.
  const lead = (r.assessment || r.takeaways?.[0] || r.covered?.[0] || '').trim()
  if (lead) out.push(firstSentences(`${stripEnd(lead)}.`, r.assessment ? 2 : 1))
  const homework = stripEnd((r.homework || '').trim())
  const next = stripEnd((r.nextFocus || '').trim())
  if (homework && homework.toLowerCase() !== 'not set') out.push(`To practise before next time: ${lowerFirst(homework)}.`)
  else if (next) out.push(`Next session: ${lowerFirst(next)}.`)

  const derived = out.join(' ').trim()
  if (derived) return { text: derived, source: 'derived' }

  const fallback = (r.coachNote || s.summary || s.ai_review || '').trim()
  return fallback
    ? { text: firstSentences(fallback, 3), source: 'derived' }
    : { text: '', source: 'none' }
}
