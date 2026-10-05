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
  /** The coach's PRIVATE note. Never part of a recap — a recap is for sharing. */
  coachNote?: string
  /** The note written to the player. Shared. */
  playerNote?: string
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

// A lesson's two text columns, with the coach's private note taken out.
//
// Summaries saved before the private note had its own field hold it inside
// `summary` (as the whole line) and at the end of `ai_review`. Anything that is
// about to leave the coach's side — a family's page, an email, or a prompt
// whose answer a family will read — takes the text from here, so the old rows
// are covered by one rule rather than by each caller remembering it. A summary
// that is (or contains) the note is dropped whole; the note is cut out of the
// review text, and if it cannot be found exactly the review text is dropped too.
export function sharedLessonText(s: { summary?: string | null; ai_review?: string | null; review_json?: { coachNote?: string } | null }): { summary: string; aiReview: string } {
  const flat = (x: string) => x.replace(/\s+/g, ' ').trim().toLowerCase()
  const note = String(s.review_json?.coachNote || '').trim()
  const priv = flat(note)
  let summary = String(s.summary || '').trim()
  let aiReview = String(s.ai_review || '').trim()
  if (priv) {
    if (flat(summary).includes(priv)) summary = ''
    if (flat(aiReview).includes(priv)) {
      aiReview = aiReview.split(note).join('').trim()
      if (flat(aiReview).includes(priv)) aiReview = ''
    }
  }
  return { summary, aiReview }
}

// Lower the first letter so a heading reads on inside a sentence ("Second
// serve" → "…focused on second serve") — but only when the first word is an
// ordinary capitalised word. An acronym or a mixed-case word ("FH", "LTA",
// "McEnroe") is left exactly as the coach typed it.
const lowerFirst = (x: string) => /^[A-Z][a-z]+(?![A-Za-z])/.test(x) ? x.charAt(0).toLowerCase() + x.slice(1) : x
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
  // After a colon the coach's own words stand as written.
  if (homework && homework.toLowerCase() !== 'not set') out.push(`To practise before next time: ${homework}.`)
  else if (next) out.push(`Next session: ${next}.`)

  const derived = out.join(' ').trim()
  if (derived) return { text: derived, source: 'derived' }

  // The recap is the paragraph a coach copies to a parent, so it is built only
  // from what is shared: the note to the player, then the summary line, then the
  // review text. Never the private coach note — and summaries saved before the
  // two notes were separated carry the private note inside `summary` and
  // `ai_review`, so anything containing it is passed over too.
  const flat = (x: string) => x.replace(/\s+/g, ' ').trim().toLowerCase()
  const priv = flat(r.coachNote || '')
  const fallback = [r.playerNote, s.summary, s.ai_review]
    .map(x => (x || '').trim())
    .find(x => x && !(priv && flat(x).includes(priv))) || ''
  return fallback
    ? { text: firstSentences(fallback, 3), source: 'derived' }
    : { text: '', source: 'none' }
}
