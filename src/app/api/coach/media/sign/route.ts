import { NextRequest, NextResponse } from 'next/server'
import { isAcademyUser, notAnAcademy } from '@/lib/coach/academy-guard'
import { serviceClient } from '@/lib/coach/oauth'
import { isUuid, coachGate } from '@/lib/coach/membership'
import { mediaNameProblem, mediaSwitchedOn, ownPlayerForRecording, MEDIA_SWITCHED_OFF, RECORDING_NEEDS_OWN_PLAYER, type MediaKind } from '@/lib/coach/media-rules'

// Mints a one-time signed upload URL so the browser can PUT a (potentially large)
// recording straight to Supabase Storage — the bytes never pass through this Next
// server or any proxy body-size limit. Also creates the coach_media row up-front.
export async function POST(req: NextRequest) {
  // The academy whose portal the coach is in (coachGate). A recording is the
  // academy's: it used to be filed under the caller's own user id, so a head
  // coach helping at a second academy filed that club's lesson under their own.
  const who = await coachGate()
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: who.status })
  // A demo account is signed in too. Only a real academy may use this.
  if (!await isAcademyUser(who.userId)) return notAnAcademy()
  const academyId = who.seat.academyId
  const mine = who.seat.isHead ? null : who.seat.staffId   // an invited coach: their own coach record

  const { kind, playerName, playerId, fileName } = (await req.json().catch(() => ({}))) as
    { kind?: string; playerName?: string; playerId?: string | null; fileName?: string }
  // Anything that is not plainly audio or video is refused. It used to be
  // quietly filed as audio, which is how a PDF became an "audio recording".
  if (kind !== 'audio' && kind !== 'video') return NextResponse.json({ error: 'Choose an audio or a video recording to upload.' }, { status: 400 })
  const k: MediaKind = kind
  const wrongType = mediaNameProblem(k, fileName)
  if (wrongType) return NextResponse.json({ error: wrongType }, { status: 400 })

  const sb = serviceClient()
  // The academy's own switch (Settings → Plan & features), checked here because
  // hiding the page in the portal stops nobody who calls this address directly.
  if (!await mediaSwitchedOn(sb, academyId, k)) return NextResponse.json({ error: MEDIA_SWITCHED_OFF[k] }, { status: 403 })

  // Which player, by id when the caller knows it. A name cannot tell two
  // players called "Sam Twin" apart, and a recording filed by name alone landed
  // on neither. The id has to be a player of THIS academy — anything else is
  // refused rather than filed against a stranger.
  let player: { id: string; name: string } | null = null
  if (playerId) {
    const { data: p } = isUuid(playerId)
      ? await sb.from('coach_players').select('id, name').eq('id', playerId).eq('coach_id', academyId).maybeSingle()
      : { data: null }
    if (!p) return NextResponse.json({ error: 'That player is not on your roster. Choose the player again and retry.' }, { status: 400 })
    player = p as { id: string; name: string }
  }
  // An invited coach records their own players, and the recording carries that
  // player's id — which is what lets the coach see it afterwards.
  if (mine) {
    player = await ownPlayerForRecording(sb, academyId, mine, player?.id, playerName)
    if (!player) return NextResponse.json({ error: RECORDING_NEEDS_OWN_PLAYER }, { status: 400 })
  }

  const ext = (/\.([a-z0-9]+)$/i.exec(fileName || '')?.[1] || '').toLowerCase()
  const objectPath = `${academyId}/${crypto.randomUUID()}.${ext}`

  const signed = await sb.storage.from('coach-media').createSignedUploadUrl(objectPath)
  if (signed.error) {
    console.error('[coach/media/sign] signed url', signed.error)
    return NextResponse.json({ error: 'The upload could not be started. Try again in a moment.' }, { status: 500 })
  }

  const { data, error } = await sb.from('coach_media').insert({
    coach_id: academyId,
    kind: k,
    // A name, not an essay: longer than any real name and it is cut.
    player_id: player?.id ?? null,
    player_name: player ? player.name : (playerName || '').trim().slice(0, 120) || null,
    storage_path: objectPath,
    status: 'uploaded',
  }).select('id').single()
  if (error) {
    console.error('[coach/media/sign] insert', error)
    await sb.storage.from('coach-media').remove([objectPath]).catch(() => {})
    return NextResponse.json({ error: 'The recording could not be saved. Try again in a moment.' }, { status: 500 })
  }

  // `signedUrl` lets the browser PUT the bytes over XHR instead of supabase-js, so
  // the upload reports real byte progress (see _lib/media-upload.ts). The client
  // falls back to `path` + `token` via supabase-js if that ever fails.
  return NextResponse.json({ id: data.id, path: objectPath, token: signed.data.token, signedUrl: signed.data.signedUrl })
}
