import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { sessionCoachId, serviceClient } from '@/lib/coach/oauth'
import { transcribeMedia } from '@/lib/coach/transcribe'

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

  // 1. Transcribe each file, in order, storing each part's transcript.
  const parts: string[] = []
  for (let i = 0; i < rows.length; i++) {
    const m = rows[i]
    const dl = await sb.storage.from('coach-media').download(m.storage_path)
    if (dl.error || !dl.data) throw new Error('Could not read an uploaded file: ' + (dl.error?.message || 'unknown'))
    const buf = Buffer.from(await dl.data.arrayBuffer())
    const t = await transcribeMedia(buf, m.mime_type || '', m.storage_path)
    parts.push(multi ? `--- Part ${i + 1} ---\n${t}` : t)
    await sb.from('coach_media').update({ transcript: t, updated_at: new Date().toISOString() }).eq('id', m.id)
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

  // 4. Mark all done; the combined review lives on the first row (which the UI polls).
  await sb.from('coach_media').update({ status: 'done', review, updated_at: new Date().toISOString() }).eq('id', rows[0].id)
  if (rows.length > 1) {
    await sb.from('coach_media').update({ status: 'done', updated_at: new Date().toISOString() }).in('id', rows.slice(1).map(r => r.id))
  }
}

// Turn a session transcript into the same shape the Lesson Summaries use.
async function buildLessonSummary(transcript: string, playerName: string | null) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('AI not configured (ANTHROPIC_API_KEY missing).')
  const client = new Anthropic({ apiKey })
  const res = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `You are an experienced LTA tennis coach. Below is the transcript of a coaching session${playerName ? ` with ${playerName}` : ''} (it may be in several parts that together cover the whole lesson). Write the single lesson summary that would be shared with the player/parent.

Return ONLY valid JSON (no markdown) in this exact shape:
{
  "focus": "the main theme of the session, one short line",
  "covered": ["3-6 concrete things worked on across the whole lesson"],
  "takeaways": ["2-4 key coaching points / what to remember"],
  "drills": ["named drills or exercises used, if any"],
  "homework": "what to practise before next time (or 'Not set')",
  "nextFocus": "what to work on next session",
  "coachNote": "2-3 sentence warm, specific note to the player",
  "rating": 4
}
- Infer everything from the transcript; be specific to what was actually said.
- "rating" is the session quality/effort 1-5 (integer).
- If the transcript is unclear or off-topic, still return the JSON with best-effort values.

TRANSCRIPT:
${transcript.slice(0, 180000)}`,
    }],
  })
  let txt = ''
  for (const b of res.content) if (b.type === 'text') txt += b.text
  const cleaned = txt.replace(/```json\s*/gi, '').replace(/```/g, '').trim()
  const m = cleaned.match(/\{[\s\S]*\}/)
  if (!m) throw new Error('The AI could not summarise this transcript.')
  try { return JSON.parse(m[0]) } catch { throw new Error('The AI summary could not be parsed.') }
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
