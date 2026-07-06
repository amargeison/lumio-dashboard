import { NextResponse } from 'next/server'
import { getMembership, scopedDb, signAvatar } from '@/lib/coach/membership'

export const runtime = 'nodejs'

// Scoped data bundle for a sub-coach portal. SECURITY: bound to the membership's
// academy AND to rows assigned to THIS coach only (assigned_coach). A sub-coach
// never sees other coaches, other coaches' players, payments or academy admin.
export async function GET() {
  const m = await getMembership()
  if (!m || m.role !== 'coach') return NextResponse.json({ error: 'No access' }, { status: 403 })
  if (!m.scopeCoachName) return NextResponse.json({ error: 'No coach scope' }, { status: 403 })

  const db = scopedDb()
  const coach = m.scopeCoachName
  const safe = async (q: any) => { try { const { data } = await q; return data || [] } catch { return [] } }

  // Only this coach's assigned players + bookings.
  const players = await safe(db.from('coach_players').select('id, name, racket_stage, level, goal, category, age, avatar_url').eq('coach_id', m.academyId).eq('assigned_coach', coach).order('name'))
  const names = players.map((p: any) => p.name).filter(Boolean)

  const today = new Date().toLocaleDateString('en-CA')
  const [bookings, sessions, skills] = await Promise.all([
    safe(db.from('coach_bookings').select('id, player_name, booking_date, start_time, court, type, status').eq('coach_id', m.academyId).eq('assigned_coach', coach).gte('booking_date', today).order('booking_date')),
    names.length ? safe(db.from('coach_sessions').select('id, player_name, session_date, focus, rating, review_json').eq('coach_id', m.academyId).in('player_name', names).order('session_date', { ascending: false }).limit(30)) : [],
    names.length ? safe(db.from('coach_player_skills').select('player_id, skill, score').in('player_id', players.map((p: any) => p.id))) : [],
  ])

  // Sign each child's photo (private avatars bucket) for the sub-coach viewer.
  const signedPlayers = await Promise.all((players as any[]).map(async (p: any) => ({ ...p, avatar_url: await signAvatar(db, p.avatar_url, m.academyId) })))

  return NextResponse.json({ coachName: coach, players: signedPlayers, bookings, sessions, skills })
}
