import { NextResponse } from 'next/server'
import { getMembership, scopedDb, signAvatar } from '@/lib/coach/membership'

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

  const [skills, lessons, bookings, media, messages, watch] = await Promise.all([
    safe(db.from('coach_player_skills').select('skill, score').eq('player_id', m.scopePlayerId)),
    scopedByPlayer('coach_sessions', 'id, session_date, focus, summary, ai_review, review_json, rating', { col: 'session_date', asc: false }),
    scopedByPlayer('coach_bookings', 'id, booking_date, start_time, court, type, status', { col: 'booking_date', asc: true }),
    scopedByPlayer('coach_media', '*', { col: 'created_at', asc: false }, q => q.is('clip_of', null)),
    safe(db.from('coach_messages').select('id, direction, from_name, recipients, subject, body, created_at, reaction').eq('coach_id', m.academyId).eq('recipients', name).order('created_at', { ascending: false }).limit(50)),
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

  // The `avatars` bucket is private — sign the child's photo for the parent/student
  // (they can't use the coach-side signing proxy). Handles a bare path or a legacy
  // full public URL; leaves data/external URLs alone.
  const avatarUrl = await signAvatar(db, player.avatar_url)

  return NextResponse.json({
    player: { id: player.id, name: player.name, racket_stage: player.racket_stage, level: player.level, goal: player.goal, category: player.category, age: player.age, avatar_url: avatarUrl, watch_token: player.watch_token },
    skills, lessons, bookings, media, messages, watch, highlights,
  })
}
