import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { sessionCoachId, serviceClient } from '@/lib/coach/oauth'
import { transcribeMediaTimed, type TranscriptSegment } from '@/lib/coach/transcribe'
import { COACH_AGENT_PERSONA } from '@/lib/coach/agent-persona'
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

  // 2. One combined lesson summary.
  const playerName = rows[0]?.player_name ?? null
  const review = await buildLessonSummary(transcript, playerName)

  // 3. Create the Lesson Summary (a coach_sessions row) — nothing for the coach to type.
  const { error: lessonErr } = await sb.from('coach_sessions').insert({
    coach_id: coachId,
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
  if (playerName) {
    try {
      const today = new Date().toISOString().slice(0, 10)
      const { data: pl } = await sb.from('coach_players').select('id').eq('coach_id', coachId).ilike('name', playerName.trim()).limit(1)
      const pid = (pl as any)?.[0]?.id
      if (pid) {
        const { data: ex } = await sb.from('coach_attendance').select('id').eq('coach_id', coachId).eq('player_id', pid).eq('session_date', today).limit(1)
        if (!(ex as any)?.length) await sb.from('coach_attendance').insert({ coach_id: coachId, player_id: pid, session_date: today, present: true })
      }
    } catch (e) { console.warn('[coach/media/process] attendance', e) }
  }

  // 3c. Video highlights (V1) — cut per-shot clips from what the coach said.
  // Best-effort: never let a clip failure fail the whole summary.
  if (clipSource) {
    try {
      await buildHighlights(sb, coachId, rows[0], clipSource)
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
      player_id: source.player_id ?? null,
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

For THIS task you are writing the lesson summary (shared with the player and their parent) from a session recording transcript. Your summaries are known for being specific, encouraging and genuinely useful.

Non-negotiable rules:
1. ONLY use what is actually in the transcript. Never invent drills, scores, numbers, shots, or outcomes that were not mentioned. If something wasn't covered, leave it out — a shorter honest summary always beats an embellished one.
2. Be specific to THIS session: reference the actual cues, drills and moments from the transcript, not generic tennis advice.
3. Warm, plain English a parent understands; gloss any jargon in a few words.
4. "coachNote" is a personal 2–3 sentence note to the player — encouraging, honest and specific.
5. Before finalising, silently re-check every field against the transcript and remove anything not clearly supported.

Return ONLY valid JSON (no markdown, no commentary) in EXACTLY this shape:
{
  "focus": "the main theme of the session, one short line",
  "covered": ["3-6 concrete things worked on across the whole lesson"],
  "takeaways": ["2-4 key coaching points / what to remember"],
  "drills": ["named drills or exercises actually used (omit if none mentioned)"],
  "homework": "what to practise before next time (or 'Not set')",
  "nextFocus": "what to work on next session",
  "coachNote": "2-3 sentence warm, specific note to the player",
  "rating": 4
}
"rating" is the session quality/effort, an integer 1-5.`

// One compact gold example anchors tone, length and structure (consistency lever).
const GOLD_EXAMPLE = `EXAMPLE (style reference only — never copy its content):
Transcript snippet: "...right, big focus today on the second serve, we want that kick. Toss a little more over your head... good, brushing up 7 to 1 o'clock... when you rushed there the toss drifted forward and it went flat. Let's do the spin-only ladder, ten in a row... then second-serve-only points to eleven. Homework, shadow serve, thirty a day, film a set..."
Good JSON:
{"focus":"Second serve — kick & reliability","covered":["Toss height — slightly more over the head for the kick","Brushing up the back of the ball 7→1 o'clock","Live points starting from second serve only"],"takeaways":["Kick gives a much safer margin over the net","When rushed the toss drifts forward and the serve goes flat"],"drills":["Spin-only serve ladder (10 in a row)","Second-serve-only points to 11"],"homework":"Shadow-serve 30 reps a day; film one set.","nextFocus":"Carry the kick serve into serve+1 patterns","coachNote":"Really good progress on the second serve today — when you trust the higher toss it's a different shot. Keep the daily shadow serves going.","rating":4}`

async function buildLessonSummary(transcript: string, playerName: string | null) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('AI not configured (ANTHROPIC_API_KEY missing).')
  const client = new Anthropic({ apiKey })
  const clipped = transcript.slice(0, 180000)

  // Pass 1 — draft.
  const draftRes = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    temperature: 0.2,
    system: MASTER_COACH_SYSTEM,
    messages: [{
      role: 'user',
      content: `${GOLD_EXAMPLE}\n\nNow write the summary for this real session${playerName ? ` with ${playerName}` : ''} (it may be in several parts that together cover one lesson).\n\nTRANSCRIPT:\n${clipped}`,
    }],
  })
  const draft = extractReview(textOf(draftRes))
  if (!draft) throw new Error('The AI could not summarise this transcript.')

  // Pass 2 — head-coach QA: verify every claim against the transcript, tighten,
  // keep the schema. Best-effort: if it fails, ship the (already good) draft.
  try {
    const qaRes = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      temperature: 0.1,
      system: `You are Lumio's Head Coach doing a final QA on a lesson summary a coach has drafted. Check EVERY claim against the transcript and remove or correct anything not clearly supported by it (no invented drills, numbers or outcomes). Tighten the wording, keep it specific and warm, and keep EXACTLY the same JSON schema and field names. Return ONLY the improved JSON.`,
      messages: [{
        role: 'user',
        content: `TRANSCRIPT:\n${clipped}\n\nDRAFT SUMMARY:\n${JSON.stringify(draft)}`,
      }],
    })
    const refined = extractReview(textOf(qaRes))
    if (refined) return refined
  } catch (e) { console.warn('[coach/media/process] QA pass skipped', e) }
  return draft
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

function formatReview(r: { focus?: string; covered?: string[]; takeaways?: string[]; drills?: string[]; homework?: string; nextFocus?: string; coachNote?: string }): string {
  const out: string[] = []
  if (r.focus) out.push(`Focus: ${r.focus}`)
  if (r.covered?.length) out.push('\nWhat we covered:\n' + r.covered.map(x => `• ${x}`).join('\n'))
  if (r.takeaways?.length) out.push('\nKey takeaways:\n' + r.takeaways.map(x => `• ${x}`).join('\n'))
  if (r.drills?.length) out.push('\nDrills: ' + r.drills.join(', '))
  if (r.homework) out.push('\nHomework: ' + r.homework)
  if (r.nextFocus) out.push('\nNext session focus: ' + r.nextFocus)
  if (r.coachNote) out.push('\n' + r.coachNote)
  return out.join('\n')
}
