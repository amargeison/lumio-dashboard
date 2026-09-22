import { NextResponse } from 'next/server'
import { getMembership, scopedDb, signAvatar, sendWelcomeMessage } from '@/lib/coach/membership'
import { bookById } from '@/lib/coach/books'
import { buildNextSession } from '@/lib/student/next-session'

export const runtime = 'nodejs'

// Scoped data bundle for a student/parent portal. SECURITY: every query is bound
// to BOTH the membership's academy and its ONE allowed player. A parent can never
// read another child or another academy. If anything doesn't match the scope, it
// is not returned.
export async function GET() {
  const m = await getMembership()
  if (!m) return NextResponse.json({ error: 'No access' }, { status: 403 })
  if (m.role !== 'parent' && m.role !== 'student') return NextResponse.json({ error: 'Wrong portal' }, { status: 403 })
  if (!m.scopePlayerId) return NextResponse.json({ error: 'No player assigned' }, { status: 403 })

  const db = scopedDb()
  // The one player — must belong to this academy AND be the scoped player.
  const { data: player } = await db.from('coach_players')
    .select('*').eq('id', m.scopePlayerId).eq('coach_id', m.academyId).maybeSingle()
  if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

  const name = (player.name || '').trim()
  const safe = async (q: any) => { try { const { data } = await q; return data || [] } catch { return [] } }

  // Scope a name-keyed table by the child's player_id (exact, secure) and fall
  // back to the legacy player_name ONLY for rows that never got a player_id
  // (pre-migration 146). Two `.eq` queries merged — no filter-string injection,
  // and same-named children can't collide on any row that carries an id.
  const scopedByPlayer = async (table: string, cols: string, order: { col: string; asc: boolean }, extra?: (q: any) => any) => {
    const base = () => { const q = db.from(table).select(cols).eq('coach_id', m.academyId); return extra ? extra(q) : q }
    const [byId, legacy] = await Promise.all([
      safe(base().eq('player_id', m.scopePlayerId).order(order.col, { ascending: order.asc }).limit(50)),
      safe(base().is('player_id', null).eq('player_name', name).order(order.col, { ascending: order.asc }).limit(50)),
    ])
    const seen = new Set((byId as any[]).map((r: any) => r.id))
    return [...(byId as any[]), ...(legacy as any[]).filter((r: any) => !seen.has(r.id))]
  }

  const [skills, lessons, bookings, media, messagesThreaded, messagesLegacy, watch] = await Promise.all([
    safe(db.from('coach_player_skills').select('skill, score').eq('player_id', m.scopePlayerId)),
    scopedByPlayer('coach_sessions', 'id, session_date, focus, summary, ai_review, review_json, rating', { col: 'session_date', asc: false }),
    scopedByPlayer('coach_bookings', 'id, booking_date, start_time, court, type, status', { col: 'booking_date', asc: true }),
    scopedByPlayer('coach_media', '*', { col: 'created_at', asc: false }, q => q.is('clip_of', null)),
    // Their thread. Matched on thread_key first — the column every inbound path
    // sets — falling back to `recipients` for rows written before sending
    // threaded properly. Two exact queries rather than one fuzzy match: a
    // `like` on a name would hand "Sophia Jones" her namesake's messages.
    safe(db.from('coach_messages').select('id, direction, from_name, recipients, subject, body, created_at, reaction').eq('coach_id', m.academyId).eq('thread_key', name).order('created_at', { ascending: false }).limit(50)),
    safe(db.from('coach_messages').select('id, direction, from_name, recipients, subject, body, created_at, reaction').eq('coach_id', m.academyId).is('thread_key', null).eq('recipients', name).order('created_at', { ascending: false }).limit(50)),
    safe(db.from('coach_watch_sessions').select('started_at, duration_min, avg_hr, max_hr, distance_m, effort_score, movement_score, consistency_score, xp_awarded').eq('coach_id', m.academyId).eq('player_id', m.scopePlayerId).eq('voided', false).order('started_at', { ascending: false }).limit(50)),
  ])

  // Per-shot highlight clips (AI-cut from session videos). Each is a coach_media
  // row with clip_of set. Mint a short-lived signed URL so the player can watch.
  // Only clips the coach has CONFIRMED (published) reach the player/parent — so a
  // mislabelled auto-clip never shows until the coach has approved its shot tag.
  const clipRows = await scopedByPlayer(
    'coach_media', 'id, title, shot_type, duration_seconds, clip_start, storage_path, created_at',
    { col: 'created_at', asc: false }, q => q.not('clip_of', 'is', null).eq('shot_confirmed', true),
  )
  const highlights = await Promise.all((clipRows as any[]).map(async (c) => {
    let url: string | null = null
    try { const { data } = await db.storage.from('coach-media').createSignedUrl(c.storage_path, 3600); url = data?.signedUrl ?? null } catch { /* skip */ }
    return { id: c.id, title: c.title, shot_type: c.shot_type, duration_seconds: c.duration_seconds, clip_start: c.clip_start, created_at: c.created_at, url }
  }))

  // Catch-up greeting. The welcome is written when an invite binds, which never
  // happened for anyone who signed in before that code shipped — they would open
  // a portal with an empty Messages panel for ever. Deduped on the subject, so
  // this is a no-op for everybody else and runs before the thread is read.
  if (!messagesThreaded.length && !messagesLegacy.length) {
    try {
      await sendWelcomeMessage(db, m.academyId, m.scopePlayerId, m.role as 'parent' | 'student')
      const { data: fresh } = await db.from('coach_messages')
        .select('id, direction, from_name, recipients, subject, body, created_at, reaction')
        .eq('coach_id', m.academyId).eq('thread_key', name).order('created_at', { ascending: false }).limit(5)
      if (fresh?.length) (messagesThreaded as any[]).push(...fresh)
    } catch { /* a greeting must never break the page */ }
  }

  const messages = [...(messagesThreaded as any[]), ...(messagesLegacy as any[])]
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))

  // Voice notes need a playable link, and the media bucket is private — so the
  // audio recordings get the same short-lived signing the highlight clips get.
  // Without it the portal shows a coach's voice note it cannot play.
  const mediaSigned = await Promise.all((media as any[]).map(async (mm) => {
    if (mm.kind !== 'audio' || !mm.storage_path) return mm
    let url: string | null = null
    try { const { data } = await db.storage.from('coach-media').createSignedUrl(mm.storage_path, 3600); url = data?.signedUrl ?? null } catch { /* skip */ }
    return { ...mm, url }
  }))

  // Drills and guides for the racket they are on — a recommendation, never the
  // academy's whole library.
  const stage = (player.racket_stage || '') as string
  const allRes = await safe(db.from('coach_resources')
    .select('id, title, category, format, racket, level, duration, notes, url')
    .eq('coach_id', m.academyId).limit(300))
  const resources = (allRes as any[])
    .filter(r => (stage && r.racket === stage) || (!r.racket && String(r.level || '').toLowerCase().startsWith('all')))
    .slice(0, 9)

  // Books the coach put in this player's hands. The shelf lives in code, so the
  // row's own title/author is trusted and only the cover colour is looked up —
  // a book recommended last year still reads correctly if the shelf changes.
  const bookRows = await safe(db.from('coach_player_resources')
    .select('id, ref_id, title, author, note, created_at')
    .eq('coach_id', m.academyId).eq('player_id', m.scopePlayerId).eq('kind', 'book')
    .order('created_at', { ascending: false }).limit(12))
  const books = (bookRows as any[]).map(b => {
    const shelf = bookById(String(b.ref_id))
    return { id: b.id, title: b.title, author: b.author, note: b.note, topic: shelf?.topic ?? null, spine: shelf?.spine ?? null }
  })

  // Camps the child actually holds a place on, and the coach's own display
  // choices. Both are read with the SAME academy scope as everything above:
  // a camp is only theirs if an attendee row ties this player to it, and the
  // settings come from the academy this membership belongs to and no other.
  const attendees = await safe(db.from('coach_camp_attendees')
    .select('camp_id, paid, status, room, arrival, camp_goal').eq('coach_id', m.academyId).eq('player_id', m.scopePlayerId))
  const campIds = (attendees as any[]).filter(a => (a.status || 'confirmed') !== 'cancelled').map(a => a.camp_id)
  let camps: any[] = []
  if (campIds.length) {
    camps = await safe(db.from('coach_camps')
      .select('id, name, start_date, end_date, location, region, audience, board, daily_rhythm, description, intent, objectives, outcomes, itinerary, equipment, parent_brief, balance_link, overseas, trip, player_targets')
      .eq('coach_id', m.academyId).in('id', campIds))
    const byId = new Map((attendees as any[]).map(a => [a.camp_id, a]))
    const playerName = String(player?.name || '').trim().toLowerCase()
    camps = camps.map(c => {
      const a = byId.get(c.id)
      // player_targets holds a row PER ATTENDEE. The family gets their own row
      // and nobody else's — sending the whole array would hand one parent every
      // other child's assessment, which is a safeguarding failure, not a bug.
      const targets = Array.isArray(c.player_targets)
        ? (c.player_targets as any[]).filter(t => String(t?.player_name || '').trim().toLowerCase() === playerName)
        : []
      return {
        ...c,
        player_targets: targets,
        paid: a?.paid ?? null,
        status: a?.status ?? 'confirmed',
        room: a?.room ?? null,
        arrival: a?.arrival ?? null,
        camp_goal: a?.camp_goal ?? null,
      }
    })
  }

  // Which sections this academy shows a family, and what counts as a mastered
  // skill. The parent's browser has none of the coach's settings, so they have
  // to travel with the bundle or the toggles would silently do nothing here.
  let sectionsOff: string[] = []
  let awardThreshold = 3
  try {
    const { data: cfg } = await db.from('coach_settings').select('data').eq('coach_id', m.academyId).maybeSingle()
    const d = (cfg?.data || {}) as Record<string, any>
    sectionsOff = Array.isArray(d?.sectionsOff?.student) ? d.sectionsOff.student : []
    if (typeof d?.awardThreshold === 'number') awardThreshold = d.awardThreshold
  } catch { /* defaults are a complete page, not a broken one */ }

  // The `avatars` bucket is private — sign the child's photo for the parent/student
  // (they can't use the coach-side signing proxy). Handles a bare path or a legacy
  // full public URL; leaves data/external URLs alone.
  const avatarUrl = await signAvatar(db, player.avatar_url, m.academyId)

  // The next lesson: when, where (with a map) and what the coach is planning.
  // Read here rather than derived in the browser because the venue and the plan
  // live in tables a family has no business querying — they get the one row
  // that is theirs, already resolved.
  const nextSession = await buildNextSession(db, m.academyId, m.scopePlayerId, name)

  return NextResponse.json({
    player: {
      id: player.id, name: player.name, nickname: player.nickname,
      racket_stage: player.racket_stage, level: player.level, goal: player.goal,
      category: player.category, age: player.age, avatar_url: avatarUrl,
      parent_name: player.parent_name, parent_email: player.parent_email,
      xp_total: player.xp_total, watch_token: player.watch_token,
    },
    skills, lessons, bookings, messages, watch, highlights, nextSession,
    media: mediaSigned, resources, books, camps, sectionsOff, awardThreshold,
  })
}
