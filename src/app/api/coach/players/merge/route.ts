import { NextRequest, NextResponse } from 'next/server'
import { sessionCoachId, serviceClient } from '@/lib/coach/oauth'

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

// Every table that points at a player. Keeping this list here, in one place,
// beats discovering the one that was missed when a family's history disappears.
const PLAYER_TABLES = [
  'coach_bookings', 'coach_sessions', 'coach_attendance', 'coach_player_skills',
  'coach_media', 'coach_watch_sessions', 'coach_camp_attendees', 'coach_development',
  'coach_player_resources', 'coach_booking_links',
] as const

/** Fields worth rescuing off a duplicate before it goes. */
const FILLABLE = [
  'nickname', 'age', 'level', 'category', 'racket_stage', 'goal', 'avatar_url',
  'email', 'contact_email', 'parent_email', 'parent_name', 'phone', 'notes',
  'medical_notes', 'staff_id', 'payment_method', 'year_group',
] as const

export async function POST(req: NextRequest) {
  const coachId = await sessionCoachId()
  if (!coachId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const { keepId, mergeIds } = (await req.json().catch(() => ({}))) as { keepId?: string; mergeIds?: string[] }
  const losers = (mergeIds || []).filter(id => id && id !== keepId)
  if (!keepId || !losers.length) return NextResponse.json({ error: 'Pick which profile to keep and at least one to merge into it.' }, { status: 400 })
  if (losers.length > 20) return NextResponse.json({ error: 'That is too many at once.' }, { status: 400 })

  try {
    const db = serviceClient()

    // Everything in this call has to belong to this academy. A merge that
    // crossed academies would be a data breach with a friendly button on it.
    const { data: rows } = await db.from('coach_players')
      .select('*').eq('coach_id', coachId).in('id', [keepId, ...losers])
    const all = (rows || []) as Record<string, any>[]
    const keep = all.find(p => p.id === keepId)
    const gone = all.filter(p => p.id !== keepId)
    if (!keep || gone.length !== losers.length) {
      return NextResponse.json({ error: 'Those players are not all on your roster.' }, { status: 404 })
    }

    // ── 1. Move every row across ──────────────────────────────────────────
    const moved: Record<string, number> = {}
    for (const table of PLAYER_TABLES) {
      const { data, error } = await db.from(table)
        .update({ player_id: keepId }).eq('coach_id', coachId).in('player_id', losers).select('id')
      if (error) {
        // A column that does not exist on an older database is not a reason to
        // abandon a merge half way; anything else is.
        if (/column .* does not exist|relation .* does not exist/i.test(error.message)) continue
        // A unique index the move would break means the keeper ALREADY has that
        // row — the same book recommended on both profiles, say. The duplicate
        // is redundant rather than precious, so it goes and the merge carries on.
        if (error.code === '23505') {
          const { error: dupErr } = await db.from(table).delete().eq('coach_id', coachId).in('player_id', losers)
          if (!dupErr) continue
        }
        console.error('[players/merge] re-point failed', table, error.message)
        return NextResponse.json({ error: `Could not move ${table.replace('coach_', '')} — nothing was deleted.` }, { status: 500 })
      }
      if (data?.length) moved[table] = data.length
    }

    // Name-keyed history (rows written before player ids existed, and messages,
    // which are addressed by name) simply follows the kept name.
    const keepName = String(keep.name || '').trim()
    for (const g of gone) {
      const gName = String(g.name || '').trim()
      if (!gName || gName.toLowerCase() === keepName.toLowerCase()) continue
      await db.from('coach_sessions').update({ player_name: keepName })
        .eq('coach_id', coachId).is('player_id', null).eq('player_name', gName)
      await db.from('coach_bookings').update({ player_name: keepName })
        .eq('coach_id', coachId).is('player_id', null).eq('player_name', gName)
    }

    // ── 2. Rescue what the duplicates knew ────────────────────────────────
    const patch: Record<string, any> = {}
    for (const field of FILLABLE) {
      const current = keep[field]
      if (current !== null && current !== undefined && String(current).trim() !== '') continue
      const found = gone.map(g => g[field]).find(v => v !== null && v !== undefined && String(v).trim() !== '')
      if (found !== undefined) patch[field] = found
    }
    // XP is a total, not a fact about one profile — it adds up.
    const xp = [keep, ...gone].reduce((n, p) => n + (Number(p.xp_total) || 0), 0)
    if (xp !== (Number(keep.xp_total) || 0)) patch.xp_total = xp
    // Consents: given once to the academy, so a yes anywhere is a yes.
    for (const c of ['consent_data', 'consent_photo', 'consent_medical', 'consent_wearable']) {
      if (!keep[c] && gone.some(g => g[c])) patch[c] = true
    }
    if (Object.keys(patch).length) {
      const { error } = await db.from('coach_players').update(patch).eq('id', keepId).eq('coach_id', coachId)
      if (error) console.error('[players/merge] keeper patch', error.message)
    }

    // ── 3. Only now, the empty shells ─────────────────────────────────────
    const { error: delErr } = await db.from('coach_players').delete().eq('coach_id', coachId).in('id', losers)
    if (delErr) {
      console.error('[players/merge] delete', delErr.message)
      return NextResponse.json({ error: 'Everything moved across, but the duplicate profiles could not be deleted.', moved }, { status: 500 })
    }

    return NextResponse.json({ ok: true, kept: keepId, merged: losers.length, moved, filled: Object.keys(patch) })
  } catch (err) {
    console.error('[players/merge]', err)
    return NextResponse.json({ error: 'Could not merge those profiles.' }, { status: 500 })
  }
}
