import { NextRequest, NextResponse } from 'next/server'
import { familyAccess, scopedDb } from '@/lib/coach/membership'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { confirmLesson, cancelLesson, actorName } from '@/lib/student/lesson-actions'

export const runtime = 'nodejs'

// The player app: "I'll be there" and "Cancel" on one of their own lessons.
//
//   POST { playerId, bookingId, action: 'confirm' | 'cancel' }
//
// familyAccess decides that this account may act for this player; the lesson
// must then belong to this player at this academy (lesson-actions.ts).

export async function POST(req: NextRequest) {
  const limit = rateLimit(`portal-lesson:${clientIp(req.headers)}`, 30, 10 * 60_000)
  if (!limit.ok) return NextResponse.json({ error: 'Too many tries. Please wait a few minutes.' }, { status: 429 })
  const b = (await req.json().catch(() => ({}))) as { playerId?: string; bookingId?: string; action?: string }
  const access = await familyAccess(b.playerId)
  if (!access.ok) return NextResponse.json({ error: access.error, code: access.code }, { status: access.status })
  const m = access.m
  const db = scopedDb()
  const by = await actorName(db, m.academyId, m.scopePlayerId, m.role, m.email)
  const id = String(b.bookingId || '')
  if (b.action === 'confirm') {
    const r = await confirmLesson(db, m.academyId, m.scopePlayerId, id, by)
    return r.ok ? NextResponse.json({ ok: true, notice: 'Thanks, your coach can see you will be there.' }) : NextResponse.json({ error: r.error }, { status: 400 })
  }
  if (b.action === 'cancel') {
    const r = await cancelLesson(db, m.academyId, m.scopePlayerId, id, by)
    return r.ok ? NextResponse.json({ ok: true, notice: r.words }) : NextResponse.json({ error: r.error }, { status: 400 })
  }
  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
}
