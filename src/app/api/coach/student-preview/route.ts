import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { bookById } from '@/lib/coach/books'
import { buildNextSession } from '@/lib/student/next-session'

export const runtime = 'nodejs'

// The student page, assembled for a COACH previewing it.
//
// Deliberately a server route rather than a handful of client queries. It mints
// the short-lived signed URLs a clip needs (the media bucket is private and the
// browser has no business holding a service key), it answers in one round trip
// instead of seven, and — the part that matters — it applies the same scoping
// rule the portal does: an assistant coach can only preview a player who is
// actually theirs. Row level security would mostly cover that anyway; saying it
// out loud here means the answer doesn't depend on a policy staying correct.
//
// It returns exactly the shape /api/portal/player returns, so the one view can
// render either without knowing which side it is on.

type Member = { academyId: string; staffId: string | null; isHead: boolean }

async function resolveAcademy(admin: SupabaseClient, userId: string, email?: string | null): Promise<Member | null> {
  // Owning an academy is the strong case and is checked first, so a coach who
  // runs their own club AND helps at another lands in their own.
  const { data: own } = await admin.from('sports_profiles')
    .select('id, sport').eq('id', userId).maybeSingle()
  if (own && own.sport === 'coach') return { academyId: own.id, staffId: null, isHead: true }

  const { bindPendingInvites } = await import('@/lib/coach/membership')
  await bindPendingInvites(userId, email)

  const { data: rows } = await admin.from('coach_members')
    .select('academy_id, staff_id, role, status')
    .eq('member_user_id', userId).eq('status', 'active').eq('role', 'coach')
  const m = (rows || [])[0]
  if (!m) return null
  return { academyId: m.academy_id as string, staffId: (m.staff_id as string) ?? null, isHead: false }
}

export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const playerId = req.nextUrl.searchParams.get('playerId')
  if (!playerId) return NextResponse.json({ error: 'Missing player' }, { status: 400 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  const me = await resolveAcademy(admin, user.id, user.email)
  if (!me) return NextResponse.json({ error: 'No academy' }, { status: 403 })

  const { data: player } = await admin.from('coach_players')
    .select('id, name, nickname, age, category, level, racket_stage, goal, avatar_url, parent_name, parent_email, xp_total, staff_id')
    .eq('id', playerId).eq('coach_id', me.academyId).maybeSingle()
  if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

  // An assistant coach previews their own players and nobody else's — the same
  // boundary their portal already draws, restated where the service key is in
  // play and row level security is therefore not watching.
  if (!me.isHead && me.staffId && player.staff_id && player.staff_id !== me.staffId) {
    return NextResponse.json({ error: 'Not your player' }, { status: 403 })
  }

  const name = (player.name || '').trim()
  const safe = async (q: PromiseLike<{ data: unknown }>) => { try { const { data } = await q; return (data as Record<string, unknown>[]) || [] } catch { return [] } }

  // Lessons and media are keyed by player_id on anything written since migration
  // 146, and by player_name before it. Both are asked for and merged, so a
  // family's history does not start at whichever migration they happen to
  // straddle.
  const byPlayer = async (table: string, cols: string, orderCol: string, extra?: (q: any) => any) => {   // eslint-disable-line @typescript-eslint/no-explicit-any
    const base = () => { const q = admin.from(table).select(cols).eq('coach_id', me.academyId); return extra ? extra(q) : q }
    const [byId, legacy] = await Promise.all([
      safe(base().eq('player_id', playerId).order(orderCol, { ascending: false }).limit(50)),
      name ? safe(base().is('player_id', null).eq('player_name', name).order(orderCol, { ascending: false }).limit(50)) : Promise.resolve([]),
    ])
    const seen = new Set(byId.map(r => r.id as string))
    return [...byId, ...legacy.filter(r => !seen.has(r.id as string))]
  }

  const [skills, lessons, clipRows, voiceRows, watch, attendees] = await Promise.all([
    safe(admin.from('coach_player_skills').select('skill, score').eq('player_id', playerId)),
    byPlayer('coach_sessions', 'id, session_date, focus, summary, ai_review, review_json, rating', 'session_date'),
    byPlayer('coach_media', 'id, title, shot_type, duration_seconds, storage_path, created_at', 'created_at',
      q => q.not('clip_of', 'is', null).eq('shot_confirmed', true)),
    byPlayer('coach_media', 'id, title, duration_seconds, storage_path, created_at', 'created_at',
      q => q.eq('kind', 'audio').is('clip_of', null)),
    safe(admin.from('coach_watch_sessions')
      .select('started_at, duration_min, avg_hr, max_hr, distance_m, effort_score, movement_score, consistency_score, xp_awarded')
      .eq('coach_id', me.academyId).eq('player_id', playerId).eq('voided', false)
      .order('started_at', { ascending: false }).limit(50)),
    safe(admin.from('coach_camp_attendees')
      .select('camp_id, paid, status, room, arrival, camp_goal')
      .eq('coach_id', me.academyId).eq('player_id', playerId)),
  ])

  const sign = async (path: unknown): Promise<string | null> => {
    if (typeof path !== 'string' || !path) return null
    try {
      const { data } = await admin.storage.from('coach-media').createSignedUrl(path, 3600)
      return data?.signedUrl ?? null
    } catch { return null }
  }
  const clips = await Promise.all(clipRows.slice(0, 8).map(async c => ({
    id: c.id, title: c.title, shot_type: c.shot_type, duration_seconds: c.duration_seconds,
    created_at: c.created_at, url: await sign(c.storage_path),
  })))
  const voiceNotes = await Promise.all(voiceRows.slice(0, 5).map(async a => ({
    id: a.id, title: a.title, duration_seconds: a.duration_seconds,
    created_at: a.created_at, url: await sign(a.storage_path),
  })))

  // Resources for their racket, falling back to anything tagged for all levels.
  // Never the whole library — this is a recommendation, not the coach's shelf.
  const stage = (player.racket_stage as string) || ''
  const allRes = await safe(admin.from('coach_resources')
    .select('id, title, category, format, racket, level, duration, notes, url')
    .eq('coach_id', me.academyId).limit(300))
  const resources = allRes
    .filter(r => (stage && r.racket === stage) || (!r.racket && String(r.level || '').toLowerCase().startsWith('all')))
    .slice(0, 9)

  // Camps they actually hold a place on. A cancelled attendee row is not a camp,
  // and a camp with no record of them is somebody else's.
  const campIds = attendees.filter(a => (a.status || 'confirmed') !== 'cancelled').map(a => a.camp_id as string)
  let camps: Record<string, unknown>[] = []
  if (campIds.length) {
    camps = await safe(admin.from('coach_camps')
      .select('id, name, start_date, end_date, location, region, audience, board, daily_rhythm, description, intent, objectives, outcomes, itinerary, equipment, parent_brief, balance_link, overseas, trip, player_targets')
      .eq('coach_id', me.academyId).in('id', campIds))
    const statusOf = new Map(attendees.map(a => [a.camp_id as string, a]))
    const playerName = String(player.name || '').trim().toLowerCase()
    camps = camps.map(c => {
      const a = statusOf.get(c.id as string)
      // Same filter as the family's own route: the preview has to show what THEY
      // will see, and what they will see is their own child's targets and no
      // other child's. A preview that shows more than the real page is not a
      // preview, it is a leak the coach cannot see coming.
      const targets = Array.isArray(c.player_targets)
        ? (c.player_targets as Record<string, unknown>[]).filter(t => String(t?.player_name ?? '').trim().toLowerCase() === playerName)
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

  // Recommended books, and the conversation so far. The coach sees the thread
  // read-only here — this screen is a preview of the family's page, not a second
  // place to reply from.
  // Same fallback as the family's own route: asking for a column the database
  // does not have yet fails the whole select, and an empty thread hides the
  // Messages section entirely — which is what "the messages have vanished"
  // looks like when a deploy is ahead of its migration.
  const MSG_COLS = 'id, direction, from_name, subject, body, created_at, reaction, to_name, reply_to, camp_id'
  const MSG_COLS_LEGACY = 'id, direction, from_name, subject, body, created_at'
  const msgSelect = async (build: (cols: string) => any) => {   // eslint-disable-line @typescript-eslint/no-explicit-any
    const { data, error } = await build(MSG_COLS)
    if (!error) return (data || []) as Record<string, unknown>[]
    console.warn('[coach/student-preview] message columns missing — run migration 181', error.message)
    const { data: legacyRows } = await build(MSG_COLS_LEGACY)
    return (legacyRows || []) as Record<string, unknown>[]
  }

  const [bookRows, threaded, legacy] = await Promise.all([
    safe(admin.from('coach_player_resources')
      .select('id, ref_id, title, author, note, created_at')
      .eq('coach_id', me.academyId).eq('player_id', playerId).eq('kind', 'book')
      .order('created_at', { ascending: false }).limit(12)),
    // thread_key is the address; `recipients` is the legacy fallback for rows
    // written before sending threaded per person. TWO EXACT QUERIES, merged —
    // never one `.or()` with the name interpolated into a filter string, which
    // a name containing a comma or bracket would quietly rewrite.
    name ? msgSelect(cols => admin.from('coach_messages').select(cols)
      .eq('coach_id', me.academyId).eq('thread_key', name)
      .order('created_at', { ascending: false }).limit(20)) : Promise.resolve([]),
    name ? msgSelect(cols => admin.from('coach_messages').select(cols)
      .eq('coach_id', me.academyId).is('thread_key', null).eq('recipients', name)
      .order('created_at', { ascending: false }).limit(20)) : Promise.resolve([]),
  ])
  const messages = [...threaded, ...legacy]
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))

  const books = bookRows.map(b => {
    const shelf = bookById(String(b.ref_id))
    return { id: b.id, title: b.title, author: b.author, note: b.note, topic: shelf?.topic ?? null, spine: shelf?.spine ?? null }
  })

  // Same builder as the family's own route, so the preview cannot promise a
  // session, a venue or a plan that the real page does not show.
  const nextSession = await buildNextSession(admin, me.academyId, playerId, name)

  // The coaching team and the camp threads, so the preview shows the same
  // choices the family has — a preview that cannot see the camp conversation is
  // a preview of a different page.
  const staffRows = await safe(admin.from('coach_staff')
    .select('id, name, role, avatar_url, is_head').eq('coach_id', me.academyId).limit(40))
  const coaches = (staffRows as any[]).filter(s2 => String(s2.name || '').trim()).map(s2 => ({
    id: String(s2.id), name: String(s2.name), role: s2.role || (s2.is_head ? 'Head coach' : 'Coach'), avatar_url: null,
  }))
  const campThreads = await Promise.all((camps as any[]).map(async c => {
    const rows = await safe(admin.from('coach_messages')
      .select(MSG_COLS)
      .eq('coach_id', me.academyId).eq('camp_id', c.id)
      .order('created_at', { ascending: false }).limit(60))
    return { campId: String(c.id), name: String(c.name || 'Camp'), people: 0, messages: rows }
  }))

  return NextResponse.json({
    books, messages, nextSession, coaches, campThreads,
    player: {
      id: player.id, name: player.name, nickname: player.nickname, age: player.age,
      category: player.category, level: player.level, racket_stage: player.racket_stage,
      goal: player.goal, avatar_url: player.avatar_url, parent_name: player.parent_name,
      parent_email: player.parent_email, xp_total: player.xp_total,
    },
    skills, lessons, clips, voiceNotes, watch, resources, camps,
  })
}
