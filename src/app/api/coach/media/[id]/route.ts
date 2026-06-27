import { NextRequest, NextResponse } from 'next/server'
import { sessionCoachId, serviceClient } from '@/lib/coach/oauth'

// GET    → a media item's status, transcript, AI summary + a short-lived signed
//          playback URL. The capture UI polls this until status is 'done'.
// DELETE → remove the file from storage and the row.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const coachId = await sessionCoachId()
  if (!coachId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const { id } = await params

  const sb = serviceClient()
  const { data: m } = await sb.from('coach_media')
    .select('id, kind, title, status, transcript, review, player_name, error, storage_path, created_at')
    .eq('id', id).eq('coach_id', coachId).maybeSingle()
  if (!m) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let url: string | null = null
  const signed = await sb.storage.from('coach-media').createSignedUrl(m.storage_path, 3600)
  if (!signed.error) url = signed.data.signedUrl

  return NextResponse.json({
    id: m.id, kind: m.kind, title: m.title, status: m.status,
    transcript: m.transcript, review: m.review, playerName: m.player_name,
    error: m.error, createdAt: m.created_at, url,
  })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const coachId = await sessionCoachId()
  if (!coachId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const { id } = await params

  const sb = serviceClient()
  const { data: m } = await sb.from('coach_media').select('storage_path').eq('id', id).eq('coach_id', coachId).maybeSingle()
  if (m?.storage_path) await sb.storage.from('coach-media').remove([m.storage_path]).catch(() => {})
  await sb.from('coach_media').delete().eq('id', id).eq('coach_id', coachId)
  return NextResponse.json({ ok: true })
}
