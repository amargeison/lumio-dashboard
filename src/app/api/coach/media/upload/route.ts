import { NextRequest, NextResponse } from 'next/server'
import { isAcademyUser, notAnAcademy } from '@/lib/coach/academy-guard'
import { serviceClient } from '@/lib/coach/oauth'
import { coachGate } from '@/lib/coach/membership'
import { mediaKindOf, mediaSwitchedOn, ownPlayerForRecording, MEDIA_SWITCHED_OFF, NOT_A_RECORDING, RECORDING_NEEDS_OWN_PLAYER } from '@/lib/coach/media-rules'

export const maxDuration = 120

// Stores a recorded/uploaded lesson file in the private coach-media bucket and
// creates a coach_media row (status 'uploaded'). Transcription + AI review run
// separately via /api/coach/media/process. Auth = the coach's own session.
export async function POST(req: NextRequest) {
  // The academy whose portal the coach is in (coachGate), not the caller's own
  // user id — see the sign route.
  const who = await coachGate()
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: who.status })
  // A demo account is signed in too. Only a real academy may use this.
  if (!await isAcademyUser(who.userId)) return notAnAcademy()
  const coachId = who.seat.academyId
  const mine = who.seat.isHead ? null : who.seat.staffId   // an invited coach: their own coach record

  let form: FormData
  try {
    form = await req.formData()
  } catch (e) {
    console.error('[coach/media/upload] formData failed', e)
    return NextResponse.json({ error: 'That recording is too large to send this way. Add it from the Video & Audio page instead.' }, { status: 413 })
  }

  const file = form.get('file') as File | null
  if (!file || !file.size) return NextResponse.json({ error: 'No recording was chosen.' }, { status: 400 })

  const kindRaw = String(form.get('kind') || '')
  if (kindRaw !== 'audio' && kindRaw !== 'video') return NextResponse.json({ error: 'Choose an audio or a video recording to upload.' }, { status: 400 })
  const kind = kindRaw
  // The same rule as the sign route, with the file itself to go on here.
  if (mediaKindOf(file.name, file.type) !== kind) return NextResponse.json({ error: NOT_A_RECORDING[kind] }, { status: 400 })

  if (!await mediaSwitchedOn(serviceClient(), coachId, kind)) return NextResponse.json({ error: MEDIA_SWITCHED_OFF[kind] }, { status: 403 })

  const title = (form.get('title') as string | null)?.trim() || null
  const lessonId = (form.get('lessonId') as string | null)?.trim() || null
  let playerId = (form.get('playerId') as string | null)?.trim() || null
  let playerName = (form.get('playerName') as string | null)?.trim().slice(0, 120) || null
  // An invited coach records their own players, and the recording carries that
  // player's id — which is what lets the coach see it afterwards.
  if (mine) {
    const forPlayer = await ownPlayerForRecording(serviceClient(), coachId, mine, playerId, playerName)
    if (!forPlayer) return NextResponse.json({ error: RECORDING_NEEDS_OWN_PLAYER }, { status: 400 })
    playerId = forPlayer.id; playerName = forPlayer.name
  }

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
    return NextResponse.json({ error: 'The upload did not finish. Try again in a moment.' }, { status: 500 })
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
    return NextResponse.json({ error: 'The recording could not be saved. Try again in a moment.' }, { status: 500 })
  }

  return NextResponse.json({ id: data.id })
}
