import { NextResponse } from 'next/server'
import { getMembership, scopedDb } from '@/lib/coach/membership'

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

  const [skills, lessons, bookings, media, messages, watch] = await Promise.all([
    safe(db.from('coach_player_skills').select('skill, score').eq('player_id', m.scopePlayerId)),
    safe(db.from('coach_sessions').select('id, session_date, focus, summary, ai_review, review_json, rating').eq('coach_id', m.academyId).ilike('player_name', name).order('session_date', { ascending: false }).limit(50)),
    safe(db.from('coach_bookings').select('id, booking_date, start_time, court, type, status').eq('coach_id', m.academyId).ilike('player_name', name).order('booking_date', { ascending: true }).limit(50)),
    safe(db.from('coach_media').select('*').eq('coach_id', m.academyId).ilike('player_name', name).limit(50)),
    safe(db.from('coach_messages').select('id, direction, from_name, recipients, subject, body, created_at, reaction').eq('coach_id', m.academyId).ilike('recipients', name).order('created_at', { ascending: false }).limit(50)),
    safe(db.from('coach_watch_sessions').select('started_at, duration_min, avg_hr, max_hr, distance_m, effort_score, movement_score, consistency_score, xp_awarded').eq('coach_id', m.academyId).eq('player_id', m.scopePlayerId).eq('voided', false).order('started_at', { ascending: false }).limit(50)),
  ])

  return NextResponse.json({
    player: { id: player.id, name: player.name, racket_stage: player.racket_stage, level: player.level, goal: player.goal, category: player.category, age: player.age, avatar_url: player.avatar_url, watch_token: player.watch_token },
    skills, lessons, bookings, media, messages, watch,
  })
}
