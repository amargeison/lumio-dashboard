import { NextRequest, NextResponse } from 'next/server'
import { sessionCoachId, serviceClient } from '@/lib/coach/oauth'

// Mints a one-time signed upload URL so the browser can PUT a (potentially large)
// recording straight to Supabase Storage — the bytes never pass through this Next
// server or any proxy body-size limit. Also creates the coach_media row up-front.
export async function POST(req: NextRequest) {
  const coachId = await sessionCoachId()
  if (!coachId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const { kind, playerName, fileName } = (await req.json().catch(() => ({}))) as
    { kind?: string; playerName?: string; fileName?: string }
  const k = kind === 'video' ? 'video' : 'audio'
  const ext = (/\.([a-z0-9]+)$/i.exec(fileName || '')?.[1] || (k === 'video' ? 'mp4' : 'm4a')).toLowerCase()
  const objectPath = `${coachId}/${crypto.randomUUID()}.${ext}`

  const sb = serviceClient()
  const signed = await sb.storage.from('coach-media').createSignedUploadUrl(objectPath)
  if (signed.error) {
    console.error('[coach/media/sign] signed url', signed.error)
    return NextResponse.json({ error: `Could not start upload: ${signed.error.message}` }, { status: 500 })
  }

  const { data, error } = await sb.from('coach_media').insert({
    coach_id: coachId,
    kind: k,
    player_name: (playerName || '').trim() || null,
    storage_path: objectPath,
    status: 'uploaded',
  }).select('id').single()
  if (error) {
    console.error('[coach/media/sign] insert', error)
    await sb.storage.from('coach-media').remove([objectPath]).catch(() => {})
    return NextResponse.json({ error: `Could not save media: ${error.message}` }, { status: 500 })
  }

  return NextResponse.json({ id: data.id, path: objectPath, token: signed.data.token })
}
