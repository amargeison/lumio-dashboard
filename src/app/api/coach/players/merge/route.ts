import { NextRequest, NextResponse } from 'next/server'
import { serviceClient } from '@/lib/coach/oauth'
import { isUuid, coachGate } from '@/lib/coach/membership'

// Merging duplicate players.
//
// One person, four profiles: the camp on one, the XP on another, the lessons on
// a third, and a dropdown showing four identical names. It happens because a
// name typed into a booking, a summary or a recording used to create a player
// without checking properly — fixed at source in ensureRosterPlayer, but that
// does nothing for the duplicates already sitting in a coach's roster.
//
// The merge is a re-pointing, not a rewrite: every row that references a losing
// profile is moved to the one being kept, blanks on the keeper are filled in
// from the losers (a photo, an age, a colour — whichever profile happened to
// have it), XP is summed, and only then are the empty shells deleted. Nothing is
// merged across academies, and nothing is deleted before its rows have moved —
// if a re-point fails, the call stops and the coach still has both profiles.

export const runtime = 'nodejs'

// The moving itself is done by the database, in one step (lumio_merge_players,
// migration 200). It used to be done here, one table at a time: a clash on a
// single skill deleted every skill the merged profile had, and a failure half
// way left a player's history split across two profiles. The function either
// finishes or changes nothing. What it moves, and what it keeps when both
// profiles hold the same thing, is written at the top of that function.

export async function POST(req: NextRequest) {
  // The academy whose portal the coach is in (coachGate) — not the caller's own
  // user id, which is only the academy for a head coach at home. An invited
  // coach was offered "Merge them" for their own duplicates and always told the
  // players were not on their roster.
  const who = await coachGate()
  if (!who.ok) return NextResponse.json({ error: who.error }, { status: who.status })
  const coachId = who.seat.academyId

  const { keepId, mergeIds } = (await req.json().catch(() => ({}))) as { keepId?: string; mergeIds?: string[] }
  const losers = (mergeIds || []).filter(id => id && id !== keepId)
  if (!keepId || !losers.length) return NextResponse.json({ error: 'Pick which profile to keep and at least one to merge into it.' }, { status: 400 })
  if (losers.length > 20) return NextResponse.json({ error: 'That is too many at once.' }, { status: 400 })

  if (!isUuid(keepId) || !losers.every(isUuid)) return NextResponse.json({ error: 'Those players are not all on your roster.' }, { status: 404 })

  try {
    const db = serviceClient()
    // An invited coach merges their OWN players — the ones they can already edit
    // and delete. Every profile named has to be assigned to them.
    if (!who.seat.isHead) {
      const ids = [keepId, ...losers]
      const { data: own } = await db.from('coach_players').select('id')
        .eq('coach_id', coachId).eq('staff_id', who.seat.staffId as string).in('id', ids)
      if ((own || []).length !== new Set(ids).size) return NextResponse.json({ error: 'Those players are not all on your roster.' }, { status: 404 })
    }
    // The academy is passed from the session, never from the request: the
    // function refuses unless every profile named belongs to it. A merge that
    // crossed academies would be a data breach with a friendly button on it.
    const { data, error } = await db.rpc('lumio_merge_players', { p_academy: coachId, p_keep: keepId, p_merge: losers })
    if (error) {
      if (error.code === 'P0002') return NextResponse.json({ error: 'Those players are not all on your roster.' }, { status: 404 })
      console.error('[players/merge]', error.code, error.message)
      return NextResponse.json({ error: 'Those profiles could not be merged, so nothing was changed. Please try again.' }, { status: 500 })
    }
    const out = (data || {}) as { moved?: Record<string, number>; filled?: string[] }
    return NextResponse.json({ ok: true, kept: keepId, merged: losers.length, moved: out.moved || {}, filled: out.filled || [] })
  } catch (err) {
    console.error('[players/merge]', err)
    return NextResponse.json({ error: 'Those profiles could not be merged, so nothing was changed. Please try again.' }, { status: 500 })
  }
}
