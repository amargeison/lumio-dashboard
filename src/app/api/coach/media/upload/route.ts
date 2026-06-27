import { NextRequest, NextResponse } from 'next/server'
import { sessionCoachId, serviceClient } from '@/lib/coach/oauth'

export const maxDuration = 120

// Stores a recorded/uploaded lesson file in the private coach-media bucket and
// creates a coach_media row (status 'uploaded'). Transcription + AI review run
// separately via /api/coach/media/process. Auth = the coach's own session.
export async function POST(req: NextRequest) {
  const coachId = await sessionCoachId()
  if (!coachId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  let form: FormData
  try { form = await req.formData() } catch { return NextResponse.json({ error: 'Invalid upload' }, { status: 400 }) }

  const file = form.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const kindRaw = String(form.get('kind') || '')
  const kind = kindRaw === 'video' ? 'video' : 'audio'
  const title = (form.get('title') as string | null)?.trim() || null
  const lessonId = (form.get('lessonId') as string | null)?.trim() || null
  const playerId = (form.get('playerId') as string | null)?.trim() || null
  const playerName = (form.get('playerName') as string | null)?.trim() || null

  const buf = Buffer.from(await file.arrayBuffer())
  const ext = (/\.([a-z0-9]+)$/i.exec(file.name || '')?.[1] || (kind === 'video' ? 'mp4' : 'm4a')).toLowerCase()
  const objectPath = `${coachId}/${crypto.randomUUID()}.${ext}`

  const sb = serviceClient()
  const up = await sb.storage.from('coach-media').upload(objectPath, buf, {
    contentType: file.type || (kind === 'video' ? 'video/mp4' : 'audio/mp4'),
    upsert: false,
  })
  if (up.error) {
    console.error('[coach/media/upload] storage', up.error)
    return NextResponse.json({ error: `Upload failed: ${up.error.message}` }, { status: 500 })
  }

  const { data, error } = await sb.from('coach_media').insert({
    coach_id: coachId,
    kind, title, lesson_id: lessonId, player_id: playerId, player_name: playerName,
    storage_path: objectPath,
    mime_type: file.type || null,
    size_bytes: buf.length,
    status: 'uploaded',
  }).select('id').single()
  if (error) {
    console.error('[coach/media/upload] insert', error)
    await sb.storage.from('coach-media').remove([objectPath]).catch(() => {})
    return NextResponse.json({ error: `Could not save media: ${error.message}` }, { status: 500 })
  }

  return NextResponse.json({ id: data.id })
}
