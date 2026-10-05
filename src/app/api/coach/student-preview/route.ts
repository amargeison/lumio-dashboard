import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { bookById } from '@/lib/coach/books'
import { isLumioResource } from '@/lib/coach/lumio-resources-data'
import { resourceHref } from '@/lib/coach/resource-files'
import { buildNextSession } from '@/lib/student/next-session'
import { familyLesson } from '@/lib/student/family-lesson'
import { nameIsUnique, coachSeats, pickSeat, requestedAcademy } from '@/lib/coach/membership'

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

async function resolveAcademy(userId: string, email?: string | null): Promise<Member | null> {
  // Owning an academy is the strong case and is checked first, so a coach who
  // runs their own club AND helps at another lands in their own.
  // …unless the portal says which academy it is showing: a coach at more than
  // one then previews the one they are in (see coachSeats / pickSeat).
  const m = pickSeat(await coachSeats(userId, email), await requestedAcademy())
  if (!m) return null
  return { academyId: m.academyId, staffId: m.staffId, isHead: m.isHead }
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

  const me = await resolveAcademy(user.id, user.email)
  if (!me) return NextResponse.json({ error: 'No academy' }, { status: 403 })

  const { data: player } = await admin.from('coach_players')
    .select('id, name, nickname, age, category, level, racket_stage, goal, avatar_url, parent_name, parent_email, xp_total, staff_id')
    .eq('id', playerId).eq('coach_id', me.academyId).maybeSingle()
  if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

  // An assistant coach previews their own players and nobody else's — the same
  // boundary their portal already draws, restated where the service key is in
  // play and row level security is therefore not watching.
  // Fails closed, matching the database rule (lumio_can_see): a coach with no
  // staff link, or a player assigned to nobody, is not "theirs".
  if (!me.isHead && (!me.staffId || player.staff_id !== me.staffId)) {
    return NextResponse.json({ error: 'Not your player' }, { status: 403 })
  }

  const name = (player.name || '').trim()
  // The same rule the family's own route applies: a row that carries only a
  // name is theirs only if nobody else at the academy has that name.
  const soleName = await nameIsUnique(admin, me.academyId, name)
  const safe = async (q: PromiseLike<{ data: unknown }>) => { try { const { data } = await q; return (data as Record<string, unknown>[]) || [] } catch { return [] } }

  // Lessons and media are keyed by player_id on anything written since migration
  // 146, and by player_name before it. Both are asked for and merged, so a
  // family's history does not start at whichever migration they happen to
  // straddle.
  const byPlayer = async (table: string, cols: string, orderCol: string, extra?: (q: any) => any) => {   // eslint-disable-line @typescript-eslint/no-explicit-any
    const base = () => { const q = admin.from(table).select(cols).eq('coach_id', me.academyId); return extra ? extra(q) : q }
    const [byId, legacy] = await Promise.all([
      safe(base().eq('player_id', playerId).order(orderCol, { ascending: false }).limit(50)),
      soleName ? safe(base().is('player_id', null).eq('player_name', name).order(orderCol, { ascending: false }).limit(50)) : Promise.resolve([]),
    ])
    const seen = new Set(byId.map(r => r.id as string))
    return [...byId, ...legacy.filter(r => !seen.has(r.id as string))]
  }

  const [skills, lessonRows, clipRows, voiceRows, watch, attendees] = await Promise.all([
    safe(admin.from('coach_player_skills').select('skill, score').eq('player_id', playerId)),
    byPlayer('coach_sessions', 'id, session_date, focus, summary, review_json, rating', 'session_date'),
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

  // Exactly what the family gets: the private coach note and the raw review text
  // are left out here too. A preview that showed them would tell the coach the
  // family can see them.
  const lessons = lessonRows.map(familyLesson)

  const sign = async (path: unknown): Promise<string | null> => {
    if (typeof path !== 'string' || !path) return null
    try {
      const { data } = await admin.storage.from('coach-media').createSignedUrl(path, 3600)
      return data?.signedUrl ?? null
    } catch { return null }
  }
  const clips = await Promise.all(clipRows.map(async c => ({
    id: c.id, title: c.title, shot_type: c.shot_type, duration_seconds: c.duration_seconds,
    created_at: c.created_at, url: await sign(c.storage_path),
  })))
  const voiceNotes = await Promise.all(voiceRows.map(async a => ({
    id: a.id, title: a.title, duration_seconds: a.duration_seconds,
    created_at: a.created_at, url: await sign(a.storage_path),
  })))

  // Resources for their racket, falling back to anything tagged for all levels.
  // Never the whole library — this is a recommendation, not the coach's shelf.
  const stage = (player.racket_stage as string) || ''
  // A coach who has switched Lumio's starter library off sees only their own
  // resources, and so do their players.
  const lumioOff = await safe(admin.from('coach_settings').select('data').eq('coach_id', me.academyId).limit(1))
    .then(r => ((r[0] as { data?: { resourcesPreloaded?: boolean } } | undefined)?.data?.resourcesPreloaded === false))
  const allRes = await safe(admin.from('coach_resources')
    .select('id, title, category, format, racket, level, duration, notes, url, given_only')
    .eq('coach_id', me.academyId).limit(300))
  // Resources the coach gave to THIS player (Resource Centre → "Give to a
  // player"). They lead the list, and carry the coach's own note where there is
  // one — somebody picked them on purpose. A resource that has since been
  // deleted simply is not there to show.
  const givenRows = await safe(admin.from('coach_player_resources')
    .select('ref_id, note, created_at')
    .eq('coach_id', me.academyId).eq('player_id', playerId).eq('kind', 'resource')
    .order('created_at', { ascending: false }).limit(9))
  const given = (givenRows as { ref_id?: string; note?: string | null }[])
    .map((g): Record<string, unknown> | null => { const r = (allRes as Record<string, unknown>[]).find(x => String(x.id) === String(g.ref_id)); return r ? { ...r, notes: g.note || r.notes } : null })
    .filter((r): r is Record<string, unknown> => !!r)
  const givenIds = new Set(given.map(r => String(r.id)))
  const resources = [...given, ...(allRes as Record<string, unknown>[])
    .filter(r => !givenIds.has(String(r.id)))
    // Kept for the players it was given to (Resource Centre → Give to a player,
    // migration 207): it is on nobody else's page, whatever its level says.
    .filter(r => !r.given_only)
    .filter(r => !(lumioOff && isLumioResource(r as { title?: string | null })))
    .filter(r => (stage && r.racket === stage) || (!r.racket && String(r.level || '').toLowerCase().startsWith('all')))]
    .slice(0, 9)
    // A coach's own uploaded file opens through the checked, signed route; a
    // "link" that is not a web address (a filename typed into an import) is
    // dropped rather than shown as a link that goes nowhere. Lumio printables
    // keep their lumio: address for the app to open.
    .map(r => ({ ...r, url: String(r.url || '').startsWith('lumio:') ? r.url : resourceHref(r.url as string | null) }))

  // Camps they actually hold a place on. A cancelled attendee row is not a camp,
  // and a camp with no record of them is somebody else's.
  const campIds = attendees.filter(a => (a.status || 'confirmed') !== 'cancelled').map(a => a.camp_id as string)
  let camps: Record<string, unknown>[] = []
  if (campIds.length) {
    camps = await safe(admin.from('coach_camps')
      .select('id, name, start_date, end_date, location, region, audience, board, daily_rhythm, description, intent, objectives, outcomes, itinerary, equipment, parent_brief, balance_link, overseas, trip, player_targets, coach_ids')
      .eq('coach_id', me.academyId).in('id', campIds))
    const statusOf = new Map(attendees.map(a => [a.camp_id as string, a]))
    const playerName = String(player.name || '').trim().toLowerCase()
    camps = camps.map(c => {
      const a = statusOf.get(c.id as string)
      // Same filter as the family's own route: the preview has to show what THEY
      // will see, and what they will see is their own child's targets and no
      // other child's. A preview that shows more than the real page is not a
      // preview, it is a leak the coach cannot see coming.
      // (A row with a player id is that player's; a name-only row counts only
      // when the name is theirs alone — exactly as the family's route does.)
      const targets = Array.isArray(c.player_targets)
        ? (c.player_targets as Record<string, unknown>[]).filter(t => t?.player_id
            ? String(t.player_id) === String(playerId)
            : soleName && String(t?.player_name ?? '').trim().toLowerCase() === playerName)
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
  const MSG_COLS = 'id, direction, from_name, subject, body, created_at, reaction, to_name, reply_to, camp_id, channels'
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
    // The player's own thread, found the way the family's route finds it: by
    // player id, plus rows from before messages carried one (name in
    // thread_key, or in `recipients` for the oldest) ONLY when the name is this
    // player's alone. EXACT QUERIES, merged — never one `.or()` with the name
    // interpolated into a filter string, which a name containing a comma or
    // bracket would quietly rewrite.
    msgSelect(cols => admin.from('coach_messages').select(cols)
      .eq('coach_id', me.academyId).is('camp_id', null).eq('player_id', playerId)
      .order('created_at', { ascending: false }).limit(50)),
    soleName ? Promise.all([
      msgSelect(cols => admin.from('coach_messages').select(cols)
        .eq('coach_id', me.academyId).is('camp_id', null).is('player_id', null).eq('thread_key', name)
        .order('created_at', { ascending: false }).limit(50)),
      msgSelect(cols => admin.from('coach_messages').select(cols)
        .eq('coach_id', me.academyId).is('camp_id', null).is('player_id', null).is('thread_key', null).eq('recipients', name)
        .order('created_at', { ascending: false }).limit(50)),
    ]).then(([a, b]) => [...a, ...b]) : Promise.resolve([]),
  ])
  const messages = [...threaded, ...legacy]
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))

  const books = bookRows.map(b => {
    const shelf = bookById(String(b.ref_id))
    return { id: b.id, title: b.title, author: b.author, note: b.note, topic: shelf?.topic ?? null, spine: shelf?.spine ?? null }
  })

  // Same builder as the family's own route, so the preview cannot promise a
  // session, a venue or a plan that the real page does not show.
  const nextSession = await buildNextSession(admin, me.academyId, playerId, soleName ? name : '')

  // The coaching team and the camp threads, so the preview shows the same
  // choices the family has — a preview that cannot see the camp conversation is
  // a preview of a different page.
  const staffRows = await safe(admin.from('coach_staff')
    .select('id, name, role, avatar_url, is_head').eq('coach_id', me.academyId).limit(40))
  const coaches = (staffRows as any[]).filter(s2 => String(s2.name || '').trim()).map(s2 => ({
    id: String(s2.id), name: String(s2.name), role: s2.role || (s2.is_head ? 'Head coach' : 'Coach'), avatar_url: null,
  }))
  const campThreads = await Promise.all((camps as any[]).map(async c => {
    // The preview has to show what the family sees, Discord channels and photos
    // included — a preview that quietly drops half a thread is worse than none,
    // because the coach trusts it.
    // A camp message is found by its camp id OR by its camp thread key. Rows
    // have been written both ways over time — the Discord sync, the coach's
    // send, the family's reply — and a row carrying one but not the other
    // simply vanished from the family's side while the coach could see it.
    // Two exact queries, merged, rather than an .or() built from a string.
    const campRows = async (cols: string) => {
      const [byId, byKey] = await Promise.all([
        safe(admin.from('coach_messages').select(cols).eq('coach_id', me.academyId).eq('camp_id', c.id)
          .order('created_at', { ascending: false }).limit(120)),
        safe(admin.from('coach_messages').select(cols).eq('coach_id', me.academyId).eq('thread_key', `camp:${c.id}`)
          .order('created_at', { ascending: false }).limit(120)),
      ])
      const seen = new Set<string>()
      return ([...(byId as any[]), ...(byKey as any[])])   // eslint-disable-line @typescript-eslint/no-explicit-any
        .filter(r => r?.id && !seen.has(r.id) && (seen.add(r.id), true))
        .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
        .slice(0, 120)
    }
    let rows = await campRows(`${MSG_COLS}, discord_channel_name, results`)
    if (!rows.length) rows = await campRows(MSG_COLS)
    rows = await Promise.all((rows as any[]).map(async r => {
      const files = (r.results?.discord?.attachments ?? []) as { name: string; path: string }[]
      const photos = files.length ? (await Promise.all(files.map(async f => {
        try {
          const { data } = await admin.storage.from('coach-media').createSignedUrl(f.path, 3600)
          return data?.signedUrl ? { name: f.name, url: data.signedUrl } : null
        } catch { return null }
      }))).filter(Boolean) : []
      const { results: _drop, discord_channel_name: chan, ...rest } = r
      void _drop
      return { ...rest, channel: chan ?? null, ...(photos.length ? { photos } : {}) }
    }))
        // Every linked channel, so each has a tab before anyone has posted in it.
    const linkedNames = ((await safe(admin.from('coach_camp_channels')
      .select('channel_name, created_at').eq('coach_id', me.academyId).eq('camp_id', c.id)
      .order('created_at', { ascending: true }))) as { channel_name: string | null }[])
      .map(x => x.channel_name).filter(Boolean) as string[]
    // Counted the way the family's route counts it, so the tab reads the same.
    const { count } = await admin.from('coach_camp_attendees')
      .select('id', { count: 'exact', head: true }).eq('camp_id', c.id).neq('status', 'cancelled')
    const coachCount = Array.isArray(c.coach_ids) ? (c.coach_ids as unknown[]).length : 0
    return { campId: String(c.id), name: String(c.name || 'Camp'), people: (count ?? 0) + coachCount, messages: rows, channels: linkedNames }
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
