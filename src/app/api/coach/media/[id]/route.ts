import { NextRequest, NextResponse } from 'next/server'
import { serviceClient } from '@/lib/coach/oauth'
import { coachGate, type CoachSeat } from '@/lib/coach/membership'

// GET    → a media item's status, transcript, AI summary + a short-lived signed
//          playback URL. The capture UI polls this until status is 'done'.
// DELETE → remove the row, its highlight clips and their files; with ?discard=1
//          also the lesson summary and attendance mark its AI review created.
//
// WHOSE recording: the academy whose portal the coach is in (coachGate), never
// the caller's own user id — an invited coach was shown their players' clips
// and then told "Not found" when they pressed play.

// An invited coach reaches the recordings of the players assigned to them, as
// the database rule for them says (migration 166). The head coach, all of them.
async function mayUse(sb: ReturnType<typeof serviceClient>, seat: CoachSeat, playerId: string | null): Promise<boolean> {
  if (seat.isHead) return true
  if (!playerId || !seat.staffId) return false
  const { data } = await sb.from('coach_players').select('id')
    .eq('id', playerId).eq('coach_id', seat.academyId).eq('staff_id', seat.staffId).maybeSingle()
  return !!data
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const who = await coachGate()
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: who.status })
  const coachId = who.seat.academyId
  const { id } = await params

  const sb = serviceClient()
  const { data: m } = await sb.from('coach_media')
    .select('id, kind, title, status, transcript, review, player_name, player_id, error, storage_path, created_at')
    .eq('id', id).eq('coach_id', coachId).maybeSingle()
  if (!m || !await mayUse(sb, who.seat, m.player_id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

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
  const who = await coachGate()
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: who.status })
  const coachId = who.seat.academyId
  const { id } = await params
  // ?discard=1 is the "Discard" button on a finished AI review: besides the
  // recording it takes back the lesson summary and the attendance mark that
  // review created. A plain delete (the bin on the Video & Audio page) leaves
  // the summary alone — the coach is removing a file, not a lesson.
  const discard = req.nextUrl.searchParams.get('discard') === '1'

  const sb = serviceClient()
  const { data: m } = await sb.from('coach_media')
    .select('id, storage_path, session_id, attendance_id, player_id').eq('id', id).eq('coach_id', coachId).maybeSingle()
  // Said plainly. This used to answer "ok" whether or not anything was
  // deleted, so the page could never tell a coach that a delete had failed.
  if (!m || !await mayUse(sb, who.seat, m.player_id)) return NextResponse.json({ error: 'That recording was not found. It may already have been deleted.' }, { status: 404 })

  // Highlight clips cut from this recording go with it. They used to be left
  // behind, pointing at a recording that no longer existed.
  const { data: clips } = await sb.from('coach_media').select('id, storage_path').eq('clip_of', id).eq('coach_id', coachId)
  const clipRows = (clips ?? []) as { id: string; storage_path: string | null }[]

  let summary = false, attendance = false
  if (discard) {
    if (m.session_id) {
      const { data, error } = await sb.from('coach_sessions').delete().eq('id', m.session_id).eq('coach_id', coachId).select('id')
      if (error) { console.error('[coach/media/delete] summary', error); return NextResponse.json({ error: 'That could not be discarded. Try again.' }, { status: 500 }) }
      summary = !!data?.length
    }
    if (m.attendance_id) {
      const { data, error } = await sb.from('coach_attendance').delete().eq('id', m.attendance_id).eq('coach_id', coachId).select('id')
      if (error) { console.error('[coach/media/delete] attendance', error); return NextResponse.json({ error: 'That could not be discarded. Try again.' }, { status: 500 }) }
      attendance = !!data?.length
    }
  }

  // Rows first, files second: if the rows cannot be deleted nothing has been
  // lost and the coach is told; a file left behind after its row has gone is
  // invisible to everyone and only logged.
  const { data: gone, error } = await sb.from('coach_media').delete()
    .in('id', [id, ...clipRows.map(c => c.id)]).eq('coach_id', coachId).select('id')
  if (error || !gone?.some(r => r.id === id)) {
    console.error('[coach/media/delete] rows', error)
    return NextResponse.json({ error: 'That recording could not be deleted. Try again.' }, { status: 500 })
  }
  const paths = [m.storage_path, ...clipRows.map(c => c.storage_path)].filter((p): p is string => !!p)
  if (paths.length) {
    const rm = await sb.storage.from('coach-media').remove(paths)
    if (rm.error) console.error('[coach/media/delete] files left in storage', paths, rm.error.message)
  }
  return NextResponse.json({ ok: true, clips: clipRows.length, summary, attendance })
}
