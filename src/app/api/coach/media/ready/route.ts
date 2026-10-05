import { NextRequest, NextResponse } from 'next/server'
import { isAcademyUser, notAnAcademy } from '@/lib/coach/academy-guard'
import { serviceClient } from '@/lib/coach/oauth'
import { coachGate } from '@/lib/coach/membership'
import { coachPlayerIds } from '@/lib/coach/media-rules'

// Is the uploaded object actually readable back yet?
//
// Supabase Storage acknowledges the signed-URL PUT before the object is reliably
// retrievable through the service-role read path, so the browser posting to
// /api/coach/media/process the moment the PUT resolved was a race — and losing it
// produced "Could not read uploaded file: Object not found" plus a manual "Retry
// AI review" click. The client calls this on a short backoff first, and only
// starts processing once it says ready.
//
// It deliberately checks via the SAME read path the process route uses (a
// service-role signed URL), so a "ready" here means /process can genuinely open
// the file — not merely that a row exists.
export async function POST(req: NextRequest) {
  // The academy whose portal the coach is in; an invited coach, their own
  // players' recordings only (see media-rules.ts).
  const who = await coachGate()
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: who.status })
  // A demo account is signed in too. Only a real academy may use this.
  if (!await isAcademyUser(who.userId)) return notAnAcademy()
  const coachId = who.seat.academyId
  const mine = who.seat.isHead ? null : who.seat.staffId   // an invited coach: their own coach record

  const body = (await req.json().catch(() => ({}))) as { id?: string; ids?: string[] }
  const ids = (Array.isArray(body.ids) && body.ids.length ? body.ids : (body.id ? [body.id] : [])).filter(Boolean)
  if (!ids.length) return NextResponse.json({ error: 'Missing media id(s)' }, { status: 400 })

  const sb = serviceClient()
  const { data: found } = await sb.from('coach_media')
    .select('id, storage_path, player_id').in('id', ids).eq('coach_id', coachId)
  const theirs = mine ? await coachPlayerIds(sb, coachId, mine) : null
  const rows = (found || []).filter(r => !theirs || (!!r.player_id && theirs.has(r.player_id as string)))

  // A row we can't even see yet is "not ready" — never an error; the caller polls.
  if (rows.length !== ids.length) {
    return NextResponse.json({ ready: false, pending: ids })
  }

  const checks = await Promise.all(rows.map(async r => ({ id: r.id, ok: await readable(sb, r.storage_path) })))
  const pending = checks.filter(c => !c.ok).map(c => c.id)
  return NextResponse.json({ ready: pending.length === 0, pending })
}

async function readable(sb: ReturnType<typeof serviceClient>, path: string): Promise<boolean> {
  try {
    const signed = await sb.storage.from('coach-media').createSignedUrl(path, 60)
    if (signed.error || !signed.data?.signedUrl) return false
    // HEAD, so confirming a 400MB video costs nothing.
    const res = await fetch(signed.data.signedUrl, { method: 'HEAD', cache: 'no-store' })
    return res.ok
  } catch {
    return false
  }
}
