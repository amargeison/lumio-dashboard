import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { sessionCoachId, serviceClient } from '@/lib/coach/oauth'
import { transcribeMedia } from '@/lib/coach/transcribe'

export const maxDuration = 300

// Transcribes a coach_media file (Whisper) and turns the transcript into a full
// AI lesson summary (Claude). Runs in the background so the request returns fast;
// the client polls the coach_media row for status. Auth = the coach's session.
export async function POST(req: NextRequest) {
  const coachId = await sessionCoachId()
  if (!coachId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const { id } = (await req.json().catch(() => ({}))) as { id?: string }
  if (!id) return NextResponse.json({ error: 'Missing media id' }, { status: 400 })

  const sb = serviceClient()
  const { data: media } = await sb.from('coach_media').select('*').eq('id', id).eq('coach_id', coachId).maybeSingle()
  if (!media) return NextResponse.json({ error: 'Media not found' }, { status: 404 })

  await sb.from('coach_media').update({ status: 'processing', error: null, updated_at: new Date().toISOString() }).eq('id', id)

  // Fire-and-forget: the VPS runs a persistent Node server, so this continues
  // after the response is sent; it writes the result back to the row.
  void processMedia(id, coachId, media).catch(async (err: unknown) => {
    console.error('[coach/media/process]', err)
    await serviceClient().from('coach_media').update({
      status: 'error',
      error: (err instanceof Error ? err.message : String(err)).slice(0, 500),
      updated_at: new Date().toISOString(),
    }).eq('id', id)
  })

  return NextResponse.json({ status: 'processing' })
}

async function processMedia(id: string, coachId: string, media: any) {
  const sb = serviceClient()

  // 1. Download the file from storage.
  const dl = await sb.storage.from('coach-media').download(media.storage_path)
  if (dl.error || !dl.data) throw new Error('Could not read the uploaded file: ' + (dl.error?.message || 'unknown'))
  const buf = Buffer.from(await dl.data.arrayBuffer())

  // 2. Transcribe (Whisper, with ffmpeg compression/chunking for big files).
  const transcript = await transcribeMedia(buf, media.mime_type || '', media.storage_path)
  if (!transcript) throw new Error('The recording produced no speech to transcribe.')
  await sb.from('coach_media').update({ transcript, updated_at: new Date().toISOString() }).eq('id', id)

  // 3. Build a lesson summary from the transcript (Claude).
  const review = await buildLessonSummary(transcript, media.player_name)

  await sb.from('coach_media').update({
    status: 'done',
    review,
    title: media.title || review.focus || 'Lesson summary',
    updated_at: new Date().toISOString(),
  }).eq('id', id)

  // Also create the Lesson Summary itself (a coach_sessions row) so it shows up in
  // Lesson Summaries with nothing for the coach to type.
  const { error: lessonErr } = await sb.from('coach_sessions').insert({
    coach_id: coachId,
    player_name: media.player_name || 'Recorded session',
    session_date: new Date().toISOString().slice(0, 10),
    focus: review.focus || 'Lesson summary',
    rating: typeof review.rating === 'number' ? review.rating : 3,
    summary: review.coachNote || '',
    ai_review: formatReview(review),
  })
  if (lessonErr) console.error('[coach/media/process] lesson row insert', lessonErr)
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

// Turn a session transcript into the same shape the Lesson Summaries use, so the
// UI can drop it straight into a new summary with nothing for the coach to type.
async function buildLessonSummary(transcript: string, playerName: string | null) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('AI not configured (ANTHROPIC_API_KEY missing).')
  const client = new Anthropic({ apiKey })
  const res = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `You are an experienced LTA tennis coach. Below is the transcript of a coaching session${playerName ? ` with ${playerName}` : ''}. Write the lesson summary that would be shared with the player/parent.

Return ONLY valid JSON (no markdown) in this exact shape:
{
  "focus": "the main theme of the session, one short line",
  "covered": ["3-6 concrete things worked on"],
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
${transcript.slice(0, 100000)}`,
    }],
  })
  let txt = ''
  for (const b of res.content) if (b.type === 'text') txt += b.text
  const cleaned = txt.replace(/```json\s*/gi, '').replace(/```/g, '').trim()
  const m = cleaned.match(/\{[\s\S]*\}/)
  if (!m) throw new Error('The AI could not summarise this transcript.')
  try { return JSON.parse(m[0]) } catch { throw new Error('The AI summary could not be parsed.') }
}
