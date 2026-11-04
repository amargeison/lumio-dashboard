import { NextRequest, NextResponse } from 'next/server'
import { familyAccess, scopedDb } from '@/lib/coach/membership'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { actorName } from '@/lib/student/lesson-actions'

export const runtime = 'nodejs'

// The player app: the family's own choices, which until now only an email link
// or the welcome link could change.
//
//   POST { playerId, freeSlots?: boolean, recording?: boolean }
//
//   freeSlots — hear about free slots (the same switch as the stop link in
//               a free-slot email).
//   recording — agree to lessons being recorded, or take it back. Kept with
//               who changed it and when, as the welcome link keeps it; the
//               coach sees "Agreed by … in the app" on the player's card.
//
// familyAccess decides that this account may act for this player.

export async function POST(req: NextRequest) {
  const limit = rateLimit(`portal-prefs:${clientIp(req.headers)}`, 30, 10 * 60_000)
  if (!limit.ok) return NextResponse.json({ error: 'Too many tries. Please wait a few minutes.' }, { status: 429 })
  const b = (await req.json().catch(() => ({}))) as { playerId?: string; freeSlots?: unknown; recording?: unknown }
  const access = await familyAccess(b.playerId)
  if (!access.ok) return NextResponse.json({ error: access.error, code: access.code }, { status: access.status })
  const m = access.m
  const db = scopedDb()
  const now = new Date().toISOString()
  const row: Record<string, unknown> = {}
  if (typeof b.freeSlots === 'boolean') row.free_slot_pings = b.freeSlots
  if (typeof b.recording === 'boolean') {
    const by = await actorName(db, m.academyId, m.scopePlayerId, m.role, m.email)
    Object.assign(row, b.recording
      ? { consent_record: true, consent_record_at: now, consent_record_by: by, consent_record_how: 'app' }
      : { consent_record: false, consent_record_at: now, consent_record_by: by, consent_record_how: 'withdrawn' })
  }
  if (!Object.keys(row).length) return NextResponse.json({ error: 'Nothing to change.' }, { status: 400 })
  const { error } = await db.from('coach_players').update(row).eq('id', m.scopePlayerId).eq('coach_id', m.academyId)
  if (error) return NextResponse.json({ error: 'That was not saved. Please try again.' }, { status: 500 })
  const notice = typeof b.recording === 'boolean'
    ? (b.recording ? 'Thanks — your coach can now record your lessons.' : 'Done — your lessons will not be recorded.')
    : (b.freeSlots ? 'You will hear about free slots.' : 'You will not hear about free slots.')
  return NextResponse.json({ ok: true, notice })
}
