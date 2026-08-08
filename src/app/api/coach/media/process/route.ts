import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { sessionCoachId, serviceClient } from '@/lib/coach/oauth'
import { transcribeMediaTimed, type TranscriptSegment } from '@/lib/coach/transcribe'
import { COACH_AGENT_PERSONA, COACH_METHODOLOGY, COACH_DIAGNOSTIC_STANDARD } from '@/lib/coach/agent-persona'
import { parseShotMentions, planClips, cutClips, fuseWithNarration, SHOT_LABEL, type Mention } from '@/lib/coach/highlights'
import { getVisualShots, visualShotsConfigured } from '@/lib/coach/visual-shots'

export const maxDuration = 300

// Transcribes one OR several coach_media files (a coach may record a lesson in
// sections) and turns the combined transcript into a single AI lesson summary,
// which is also written as a coach_sessions row. Runs in the background; the
// client polls the first media id for status. Auth = the coach's session.
export async function POST(req: NextRequest) {
  const coachId = await sessionCoachId()
  if (!coachId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const body = (await req.json().catch(() => ({}))) as { id?: string; ids?: string[] }
  const idList = (Array.isArray(body.ids) && body.ids.length ? body.ids : (body.id ? [body.id] : [])).filter(Boolean)
  if (!idList.length) return NextResponse.json({ error: 'Missing media id(s)' }, { status: 400 })

  const sb = serviceClient()
  const { data: rows } = await sb.from('coach_media').select('*').in('id', idList).eq('coach_id', coachId)
  if (!rows?.length) return NextResponse.json({ error: 'Media not found' }, { status: 404 })

  // Keep the coach's upload order (rows come back unordered).
  const ordered = idList.map(id => rows.find(r => r.id === id)).filter(Boolean) as any[]

  await sb.from('coach_media').update({ status: 'processing', error: null, updated_at: new Date().toISOString() }).in('id', idList)

  void processGroup(coachId, ordered).catch(async (err: unknown) => {
    console.error('[coach/media/process]', err)
    await serviceClient().from('coach_media').update({
      status: 'error',
      error: (err instanceof Error ? err.message : String(err)).slice(0, 500),
      updated_at: new Date().toISOString(),
    }).in('id', idList)
  })

  return NextResponse.json({ status: 'processing', firstId: idList[0] })
}

async function processGroup(coachId: string, rows: any[]) {
  const sb = serviceClient()
  const multi = rows.length > 1

  // 1. Transcribe each file, in order, storing each part's transcript. We keep
  // the first video file's buffer + timestamped segments so we can cut per-shot
  // highlight clips from a single-video upload (the common case).
  const parts: string[] = []
  let clipSource: { buf: Buffer; ext: string; segments: TranscriptSegment[] } | null = null
  for (let i = 0; i < rows.length; i++) {
    const m = rows[i]
    const dl = await sb.storage.from('coach-media').download(m.storage_path)
    if (dl.error || !dl.data) throw new Error('Could not read an uploaded file: ' + (dl.error?.message || 'unknown'))
    const buf = Buffer.from(await dl.data.arrayBuffer())
    const { text: t, segments } = await transcribeMediaTimed(buf, m.mime_type || '', m.storage_path)
    parts.push(multi ? `--- Part ${i + 1} ---\n${t}` : t)
    await sb.from('coach_media').update({ transcript: t, updated_at: new Date().toISOString() }).eq('id', m.id)
    const isVideo = String(m.kind) === 'video' || String(m.mime_type || '').includes('video')
    if (!multi && isVideo) {
      const ext = (m.storage_path.match(/\.([a-z0-9]+)$/i)?.[1] || 'mp4').toLowerCase()
      clipSource = { buf, ext, segments }
    }
  }
  const transcript = parts.join('\n\n')
  if (!transcript.trim()) throw new Error('The recording(s) produced no speech to transcribe.')

  // 2. Resolve the player. Prefer the media row's id/name; on a UNIQUE name match
  // attach a real player_id (secure portal scope). If the coach didn't tag anyone
  // (a plain "Recorded session"), let the summary AI identify the player from the
  // roster — accepted ONLY on an exact, unique name match (never a loose AI guess).
  const roster = (await sb.from('coach_players').select('id, name').eq('coach_id', coachId)).data ?? []
  const matchRoster = (name?: string | null) => {
    const n = (name || '').trim().toLowerCase()
    if (!n) return null
    const hits = (roster as any[]).filter(p => (p.name || '').trim().toLowerCase() === n)
    return hits.length === 1 ? hits[0] : null
  }
  let playerName: string | null = rows[0]?.player_name ?? null
  let playerId: string | null = rows[0]?.player_id ?? null
  if (!playerId && playerName) {
    const hit = matchRoster(playerName)
    if (hit) playerId = hit.id
    else console.warn('[coach/media/process] tagged player name ambiguous/unknown — session kept on name-scoping only:', playerName)
  }
  const review = await buildLessonSummary(transcript, playerName, playerName ? null : (roster as any[]).map(p => p.name).filter(Boolean).slice(0, 200))
  // Untagged recording → adopt the AI's identification ONLY on an exact roster match
  // AND only if that name is actually spoken in the transcript — this blocks the AI
  // from emitting a real roster name that was never mentioned (a false attendance/label).
  if (!playerName && review?.player) {
    const hit = matchRoster(String(review.player))
    if (hit && nameInTranscript(transcript, hit.name)) { playerName = hit.name; playerId = hit.id }
  }

  // 3. Create the Lesson Summary (a coach_sessions row) — nothing for the coach to type.
  const { error: lessonErr } = await sb.from('coach_sessions').insert({
    coach_id: coachId,
    player_id: playerId,
    player_name: playerName || 'Recorded session',
    session_date: new Date().toISOString().slice(0, 10),
    focus: review.focus || 'Lesson summary',
    rating: typeof review.rating === 'number' ? review.rating : 3,
    summary: review.coachNote || '',
    ai_review: formatReview(review),
    review_json: review,
  })
  if (lessonErr) console.error('[coach/media/process] lesson row insert', lessonErr)

  // 3b. The session happened → auto-mark the player present today (idempotent).
  if (playerId) {
    try {
      const today = new Date().toISOString().slice(0, 10)
      const { data: ex } = await sb.from('coach_attendance').select('id').eq('coach_id', coachId).eq('player_id', playerId).eq('session_date', today).limit(1)
      if (!(ex as any)?.length) await sb.from('coach_attendance').insert({ coach_id: coachId, player_id: playerId, session_date: today, present: true })
    } catch (e) { console.warn('[coach/media/process] attendance', e) }
  }

  // 3c. Video highlights (V1) — cut per-shot clips from what the coach said.
  // Best-effort: never let a clip failure fail the whole summary.
  if (clipSource) {
    try {
      await buildHighlights(sb, coachId, rows[0], clipSource, playerId)
    } catch (e) { console.warn('[coach/media/process] highlights', e) }
  }

  // 4. Mark all done; the combined review lives on the first row (which the UI polls).
  await sb.from('coach_media').update({ status: 'done', review, updated_at: new Date().toISOString() }).eq('id', rows[0].id)
  if (rows.length > 1) {
    await sb.from('coach_media').update({ status: 'done', updated_at: new Date().toISOString() }).in('id', rows.slice(1).map(r => r.id))
  }
}

// Cut per-shot highlight clips from the source video and store each as its own
// coach_media row (clip_of = source), so they reuse storage, RLS and playback.
async function buildHighlights(
  sb: ReturnType<typeof serviceClient>,
  coachId: string,
  source: any,
  clipSource: { buf: Buffer; ext: string; segments: TranscriptSegment[] },
  playerId: string | null,
) {
  // Phase 1b + audio cross-check: visual detection finds the timing; when the
  // visual label is low-confidence or conflicts with what the coach said, the
  // narration at that moment corrects it. With no visual model configured, we
  // use narration alone (V1).
  const narration: Mention[] = parseShotMentions(clipSource.segments)
  let mentions: Mention[] = []
  if (visualShotsConfigured()) {
    try {
      const signed = await sb.storage.from('coach-media').createSignedUrl(source.storage_path, 1800)
      if (signed.data?.signedUrl) {
        const visual = await getVisualShots(signed.data.signedUrl)
        mentions = fuseWithNarration(visual, narration)
      }
    } catch (e) { console.warn('[highlights] visual detect', e) }
  }
  if (!mentions.length) mentions = narration
  if (!mentions.length) return
  const plan = planClips(mentions, Number(source.duration_seconds) || undefined)
  if (!plan.length) return
  const clips = await cutClips(clipSource.buf, clipSource.ext, plan)
  if (!clips.length) return

  const now = Date.now()
  for (let i = 0; i < clips.length; i++) {
    const c = clips[i]
    const storagePath = `${coachId}/clips/${source.id}/${c.shot}-${i}-${now}.mp4`
    const up = await sb.storage.from('coach-media').upload(storagePath, c.buffer, { contentType: 'video/mp4', upsert: true })
    if (up.error) { console.warn('[highlights] upload failed', up.error.message); continue }
    await sb.from('coach_media').insert({
      coach_id: coachId,
      player_id: playerId ?? source.player_id ?? null,
      player_name: source.player_name ?? null,
      kind: 'video',
      title: `${SHOT_LABEL[c.shot]} · highlight`,
      storage_path: storagePath,
      mime_type: 'video/mp4',
      duration_seconds: Math.round(c.end - c.start),
      status: 'done',
      clip_of: source.id,
      shot_type: c.shot,
      clip_start: c.start,
      clip_end: c.end,
    })
  }
}

// ── Lumio Master Coach — the consistent expert reviewer that turns a session
// transcript into the shared lesson summary. Two passes: a world-class coach
// drafts it, then a head-coach QA pass checks every claim against the transcript
// and tightens it. A fixed persona + hard anti-hallucination rule + gold examples
// keep the output consistent across coaches and sessions.

const MASTER_COACH_SYSTEM = `${COACH_AGENT_PERSONA}

${COACH_METHODOLOGY}

${COACH_DIAGNOSTIC_STANDARD}

For THIS task you are writing the lesson summary (shared with the player and their parent) from a session recording transcript. Your summaries are known for reading like a master coach's diagnosis and development plan, not like session notes.

Non-negotiable rules:
1. ONLY use what is actually in the transcript. Never invent drills, scores, numbers, shots, or outcomes that were not mentioned. An honest summary that only says what genuinely happened always beats an embellished one — but where the transcript DOES support depth, give that depth in full rather than flattening it to a label.
2. Be specific to THIS session: reference the actual cues, drills and moments from the transcript, not generic tennis advice.
3. Warm, plain English a parent understands; gloss any jargon in a few words.
4. "coachNote" is a personal 2–3 sentence note to the player — encouraging, honest and specific.
5. Before finalising, silently re-check every field against the transcript and remove anything not clearly supported.
6. "player": if (and only if) a roster is provided in the task, set this to the EXACT roster name of the person being coached, or null if you cannot tell confidently from the transcript. Never invent or guess a name.

Return ONLY valid JSON (no markdown, no commentary) in EXACTLY this shape:
{
  "player": "the player being coached — an exact name from the provided roster, or null",
  "focus": "the main theme of the session, one short line",
  "assessment": "YOUR DIAGNOSIS, 2-4 sentences, plain prose. Where this player is right now: the ONE highest-leverage thing to work on, why it matters, and what it is currently costing them. This is the first thing anyone reads — lead with judgement, not chronology. Place it in their stage/arc where the transcript supports it.",
  "covered": ["3-6 key points worked on. The important ones read diagnostically — the fault, why it matters, the cue or correction used, the drill that addressed it, and how the player knows they have got it. Not every point needs all five, but none should be a bare label where the transcript supports more."],
  "technique": ["how you coached it, where the transcript shows it — player self-articulation, contests or games used as teaching tools, analogies and images. Omit entirely if the transcript shows none."],
  "takeaways": ["2-4 key coaching points / what to remember"],
  "drills": ["named drills or exercises actually used (omit if none mentioned)"],
  "homework": "what to practise before next time (or 'Not set')",
  "nextFocus": "what to work on next session",
  "recap": "2-3 sentences of plain language — the headline of the session for someone who wants the gist in ten seconds. What we worked on, how it went, what happens next. No jargon.",
  "coachNote": "2-3 sentence warm, specific note to the player",
  "rating": 4
}
"rating" is the session quality/effort, an integer 1-5.`

// The QA pass is what actually SHIPS (its output replaces the draft below), so it
// runs as the SAME coach rather than an anonymous editor — otherwise the final
// wording loses the persona's voice and house style.
//
// ⚠ It tightens WORDING, never SUBSTANCE. A pass told simply to "tighten" will
// compress the diagnosis, the per-point depth and the success criteria straight
// back into flat one-line descriptions — which is exactly the gap this prompt
// pair exists to close. It therefore carries the same COACH_DIAGNOSTIC_STANDARD
// as the draft pass, plus an explicit do-not-flatten rule.
const MASTER_COACH_QA_SYSTEM = `${COACH_AGENT_PERSONA}

${COACH_DIAGNOSTIC_STANDARD}

For THIS task you are re-reading your own draft lesson summary before it goes to the player and (for juniors) their parent. You have the session transcript and the draft.

Your job is to tighten the WORDING, never the SUBSTANCE:
1. Check EVERY claim against the transcript. Remove or correct anything not clearly supported by it — never invent drills, numbers, scores, shots or outcomes. Cutting an unsupported claim is always right; cutting a supported one is not.
2. PRESERVE THE DEPTH. The draft's diagnosis ("assessment"), the fault → why → correction → drill → success-criterion depth inside "covered", the success criteria, and the coaching-craft captures in "technique" are the point of this summary. Keep every one of them that the transcript supports. Do NOT compress them back into flat one-line descriptions, do NOT merge diagnostic points into a single label, and do NOT delete "assessment", "technique" or "recap" because they make the summary longer. Length is not the metric — insight per sentence is.
3. What you SHOULD cut: padding, hedging, repetition, throat-clearing, and any sentence that would be true of any player in any session. Tighten the prose around the insight; never remove the insight to shorten the prose.
4. Rewrite anything that has drifted out of your voice: British English, plain prose (no headers, no bold, no bullet characters inside a field), warm, clear and professional. Concrete over generic.
5. Keep it specific to THIS session — the actual cues, drills and moments in the transcript, not generic tennis advice. Gloss any jargon a parent wouldn't know in a few words.
6. "assessment" must still LEAD with the one highest-leverage priority, why it matters and what it costs. "recap" stays 2–3 plain sentences. "coachNote" stays a personal 2–3 sentence note to the player.
7. Do NOT change the "player" field.

Keep EXACTLY the same JSON schema and field names as the draft:
{"player","focus","assessment","covered","technique","takeaways","drills","homework","nextFocus","recap","coachNote","rating"}
Every field present in the draft must be present in your output. "rating" stays an integer 1-5. Return ONLY the improved JSON (no markdown, no commentary).`

// One compact gold example anchors tone, depth and structure (the strongest
// consistency lever in the whole prompt — a flat example produces flat output,
// so this one is written to the diagnostic standard, and every claim in it is
// traceable to the snippet above it).
const GOLD_EXAMPLE = `EXAMPLE (style and DEPTH reference only — never copy its content):
Transcript snippet: "...right, big focus today on the second serve, we want that kick. Toss a little more over your head... good, brushing up 7 to 1 o'clock... when you rushed there the toss drifted forward and it went flat, and that's the one that gets attacked — you're handing them the point. Spin-only ladder, ten in a row, and I want to see it clearing the net by a metre... now tell me in your own words, why is the higher toss working? ...exactly, you've got the time to get up and through it. Think of it as a skipping rope going over the top, not a wall you're hitting through. Then second-serve-only points to eleven and you're not allowed to go flat. At green ball heading into county this is the shot that decides whether you hold serve at all. Homework, shadow serve, thirty a day, film a set..."
Good JSON:
{"focus":"Second serve — kick & reliability","assessment":"The one thing worth working on above everything else right now is the second serve under pressure. The kick action itself is sound, but the moment a point matters the toss drifts forward and the serve comes out flat — and a flat second serve is the ball that gets attacked. At green ball heading into county level this is what decides whether service games can be held at all, so it is worth more than any other technical work at the moment.","covered":["Toss placement on the second serve. When rushed, the toss drifted forward, the racket met the ball flat and the serve sat up — the ball that gets attacked and effectively hands the point over. Moving the toss slightly more over the head buys the time to get up and through the ball; the measure was the spin-only ladder, ten in a row clearing the net by a metre.","Brushing up the back of the ball 7 to 1 o'clock to produce the kick. The cue was up and over rather than through, and the shape that produces is what gives the margin — enough net clearance that the second serve can be hit with commitment instead of steered in.","Holding the action under pressure in second-serve-only points to eleven, with going flat not allowed. That is where the habit either survives or does not, and it was the real test of the session."],"technique":["Asked for the change in his own words — 'why is the higher toss working?' — so the reason is owned rather than remembered.","Skipping-rope image for brushing up and over the ball, rather than hitting through a wall.","Second-serve-only points to eleven turned the correction into a contest, so the pressure was real rather than simulated."],"takeaways":["Kick gives a much safer margin over the net, so the second serve can be hit with commitment","When rushed the toss drifts forward and the serve goes flat — that is the ball that gets attacked"],"drills":["Spin-only serve ladder (10 in a row, clearing the net by a metre)","Second-serve-only points to 11"],"homework":"Shadow-serve 30 reps a day; film one set.","nextFocus":"Carry the kick serve into serve+1 patterns","recap":"We spent the session on the second serve, getting a proper kick on it so it clears the net with room to spare. It is far more reliable now, but it still goes flat under pressure, which is the thing to keep an eye on. Homework is thirty shadow serves a day, and next time we take it into live points.","coachNote":"Really good progress on the second serve today — when you trust the higher toss it's a different shot. Keep the daily shadow serves going.","rating":4}`

// True if any distinctive part of the player's name (>= 2 chars) is actually spoken
// in the transcript — used to corroborate the AI's untagged-session identification.
function nameInTranscript(transcript: string, name: string): boolean {
  const tl = transcript.toLowerCase()
  return name.toLowerCase().split(/\s+/).filter(p => p.length >= 2)
    .some(p => new RegExp(`\\b${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(tl))
}

async function buildLessonSummary(transcript: string, playerName: string | null, rosterNames: string[] | null = null) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('AI not configured (ANTHROPIC_API_KEY missing).')
  const client = new Anthropic({ apiKey })
  const clipped = transcript.slice(0, 180000)

  // Pass 1 — draft. The diagnostic summary (assessment + per-point depth +
  // coaching technique) is materially longer than the old descriptive one, so the
  // ceiling has to allow for it — a truncated response yields unparseable JSON.
  const draftRes = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3500,
    temperature: 0.2,
    system: MASTER_COACH_SYSTEM,
    messages: [{
      role: 'user',
      content: `${GOLD_EXAMPLE}\n\nNow write the summary for this real session${playerName ? ` with ${playerName}` : ''} (it may be in several parts that together cover one lesson).${rosterNames && rosterNames.length ? `\n\nThe coach did NOT tag a player. If the transcript clearly names who is being coached, set "player" to the EXACT matching name from this roster (else null): ${rosterNames.join(', ')}.` : ''}\n\nTRANSCRIPT:\n${clipped}`,
    }],
  })
  const draft = extractReview(textOf(draftRes))
  if (!draft) throw new Error('The AI could not summarise this transcript.')

  // Pass 2 — QA in persona: verify every claim against the transcript, tighten the
  // wording, keep the schema AND the diagnostic depth. Best-effort: if it fails,
  // ship the (already good) draft.
  try {
    const qaRes = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3500,
      temperature: 0.1,
      system: MASTER_COACH_QA_SYSTEM,
      messages: [{
        role: 'user',
        content: `TRANSCRIPT:\n${clipped}\n\nDRAFT SUMMARY:\n${JSON.stringify(draft)}\n\nTighten the wording, verify every claim against the transcript, and return the same JSON with the diagnosis, the per-point depth, the success criteria and the coaching-technique captures intact.`,
      }],
    })
    const refined = extractReview(textOf(qaRes))
    // Identity comes from pass 1 — never let the prose-QA pass drop or change the player.
    if (refined) { refined.player = draft.player ?? null; return preserveDepth(draft, refined) }
  } catch (e) { console.warn('[coach/media/process] QA pass skipped', e) }
  return draft
}

// Belt-and-braces against the QA pass flattening the summary. The prompt tells it
// to preserve the diagnostic fields; this guarantees it. If pass 2 drops one of
// them outright, or collapses it to a fraction of the draft's substance, we keep
// pass 1's version of that field — every other QA improvement still lands.
const DEPTH_FIELDS = ['assessment', 'recap', 'homework', 'nextFocus', 'coachNote'] as const
const DEPTH_LISTS = ['covered', 'technique', 'takeaways', 'drills'] as const
function preserveDepth(draft: any, refined: any): any {
  const len = (v: unknown) => Array.isArray(v) ? v.join(' ').length : String(v ?? '').length
  for (const f of DEPTH_FIELDS) {
    if (len(draft[f]) && len(refined[f]) < len(draft[f]) * 0.5) {
      console.warn(`[coach/media/process] QA flattened "${f}" — keeping the draft's version`)
      refined[f] = draft[f]
    }
  }
  for (const f of DEPTH_LISTS) {
    const d = Array.isArray(draft[f]) ? draft[f] : []
    const r = Array.isArray(refined[f]) ? refined[f] : []
    // Dropping an unsupported item is legitimate QA; halving the substance is not.
    if (d.length && (!r.length || len(r) < len(d) * 0.5)) {
      console.warn(`[coach/media/process] QA flattened "${f}" — keeping the draft's version`)
      refined[f] = draft[f]
    }
  }
  return refined
}

function textOf(res: { content: Array<{ type: string; text?: string }> }): string {
  let t = ''
  for (const b of res.content) if (b.type === 'text' && b.text) t += b.text
  return t
}
function extractReview(txt: string): any | null {
  const cleaned = txt.replace(/```json\s*/gi, '').replace(/```/g, '').trim()
  const m = cleaned.match(/\{[\s\S]*\}/)
  if (!m) return null
  try { return JSON.parse(m[0]) } catch { return null }
}

function formatReview(r: { focus?: string; assessment?: string; covered?: string[]; technique?: string[]; takeaways?: string[]; drills?: string[]; homework?: string; nextFocus?: string; coachNote?: string }): string {
  const out: string[] = []
  if (r.focus) out.push(`Focus: ${r.focus}`)
  // The diagnosis leads — it is the first thing the coach, player and parent read.
  if (r.assessment) out.push('\nAssessment:\n' + r.assessment)
  if (r.covered?.length) out.push('\nWhat we covered:\n' + r.covered.map(x => `• ${x}`).join('\n'))
  if (r.technique?.length) out.push('\nHow we worked on it:\n' + r.technique.map(x => `• ${x}`).join('\n'))
  if (r.takeaways?.length) out.push('\nKey takeaways:\n' + r.takeaways.map(x => `• ${x}`).join('\n'))
  if (r.drills?.length) out.push('\nDrills: ' + r.drills.join(', '))
  if (r.homework) out.push('\nHomework: ' + r.homework)
  if (r.nextFocus) out.push('\nNext session focus: ' + r.nextFocus)
  if (r.coachNote) out.push('\n' + r.coachNote)
  return out.join('\n')
}
