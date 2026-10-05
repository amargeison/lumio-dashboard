import { NextRequest, NextResponse } from 'next/server'
import { familyAccess, nameIsUnique, scopedDb, signAvatar, sendWelcomeMessage } from '@/lib/coach/membership'
import { familyLesson } from '@/lib/student/family-lesson'
import { bookById } from '@/lib/coach/books'
import { isLumioResource } from '@/lib/coach/lumio-resources-data'
import { resourceHref } from '@/lib/coach/resource-files'
import { buildNextSession } from '@/lib/student/next-session'

export const runtime = 'nodejs'

// Scoped data bundle for a student/parent portal. SECURITY: every query is bound
// to BOTH the membership's academy and the ONE player it is for. A parent can
// never read another family's child or another academy. If anything doesn't
// match the scope, it is not returned.
//
// Which child: `?player=<id>` — the one picked at the top of the page. It is
// checked, not trusted: familyAccess() only says yes when the caller holds an
// active membership for exactly that player.
//
// What leaves here is what the page shows and nothing else. Rows are never
// passed through whole (`select *`): that is how a recording's transcript, the
// coach's private note and the watch token all ended up in a parent's browser.
export async function GET(req: NextRequest) {
  const access = await familyAccess(req.nextUrl.searchParams.get('player'))
  if (!access.ok) return NextResponse.json({ error: access.error, code: access.code }, { status: access.status })
  const m = access.m

  const db = scopedDb()
  // The one player — must belong to this academy AND be the scoped player.
  const { data: player } = await db.from('coach_players')
    .select('id, name, nickname, racket_stage, level, goal, category, age, avatar_url, parent_name, parent_email, xp_total')
    .eq('id', m.scopePlayerId).eq('coach_id', m.academyId).maybeSingle()
  if (!player) return NextResponse.json({ error: 'This player is no longer on the academy\u2019s roster.', code: 'no_access' }, { status: 404 })

  const name = (player.name || '').trim()
  // Old rows carry only a name. They are this family's only if nobody else at
  // the academy has that name — see nameIsUnique().
  const soleName = await nameIsUnique(db, m.academyId, name)
  const safe = async (q: any) => { try { const { data } = await q; return data || [] } catch { return [] } }

  // ── Messages, whatever version of the database this is ────────────────────
  // The newer columns (to_name, reply_to, camp_id — migration 181) let a family
  // reply to a particular message, address a coach by name and hold a camp
  // conversation. Asking for a column PostgREST does not know about fails the
  // WHOLE select, and `safe` turns that into an empty array — so a portal
  // running ahead of its migration silently lost its Messages section
  // altogether. Ask for the full set, and fall back to the columns that have
  // always existed rather than hiding the conversation.
  const MSG_COLS = 'id, direction, from_name, subject, body, created_at, reaction, to_name, reply_to, camp_id, channels'
  const MSG_COLS_LEGACY = 'id, direction, from_name, subject, body, created_at, reaction'
  const msgSelect = async (build: (cols: string) => any) => {
    const { data, error } = await build(MSG_COLS)
    if (!error) return (data || []) as any[]
    console.warn('[portal/player] message columns missing — run migration 181', error.message)
    const { data: legacy } = await build(MSG_COLS_LEGACY)
    return (legacy || []) as any[]
  }

  // Scope a name-keyed table by the child's player_id (exact, secure) and fall
  // back to the legacy player_name ONLY for rows that never got a player_id
  // (pre-migration 146) AND only when the name is this player's alone. Two `.eq`
  // queries merged — no filter-string injection, and same-named children can't
  // collide: a name-only row that could be either child's is shown to neither.
  const scopedByPlayer = async (table: string, cols: string, order: { col: string; asc: boolean }, extra?: (q: any) => any) => {
    const base = () => { const q = db.from(table).select(cols).eq('coach_id', m.academyId); return extra ? extra(q) : q }
    const [byId, legacy] = await Promise.all([
      safe(base().eq('player_id', m.scopePlayerId).order(order.col, { ascending: order.asc }).limit(50)),
      soleName ? safe(base().is('player_id', null).eq('player_name', name).order(order.col, { ascending: order.asc }).limit(50)) : Promise.resolve([]),
    ])
    const seen = new Set((byId as any[]).map((r: any) => r.id))
    return [...(byId as any[]), ...(legacy as any[]).filter((r: any) => !seen.has(r.id))]
  }

  // Their thread. A conversation belongs to a PLAYER, not a name (migration
  // 194): rows carrying this player's id are theirs. Rows from before that
  // carry only the name — in thread_key, or in `recipients` for the oldest —
  // and are included only when the name is this player's alone; two children
  // called "Sam Twin" used to read each other's messages. Exact queries, never
  // a `like`: a pattern on a name would hand "Sophia Jones" her namesake's.
  const thread = async (limit: number) => {
    const base = (cols: string) => db.from('coach_messages').select(cols).eq('coach_id', m.academyId).is('camp_id', null)
    const [byId, byKey, byRecipient] = await Promise.all([
      msgSelect(cols => base(cols).eq('player_id', m.scopePlayerId).order('created_at', { ascending: false }).limit(limit)),
      soleName ? msgSelect(cols => base(cols).is('player_id', null).eq('thread_key', name).order('created_at', { ascending: false }).limit(limit)) : Promise.resolve([]),
      soleName ? msgSelect(cols => base(cols).is('player_id', null).is('thread_key', null).eq('recipients', name).order('created_at', { ascending: false }).limit(limit)) : Promise.resolve([]),
    ])
    return [...byId, ...byKey, ...byRecipient]
  }

  const [skills, lessonRows, voiceRows, messagesFound, watch] = await Promise.all([
    safe(db.from('coach_player_skills').select('skill, score').eq('player_id', m.scopePlayerId)),
    scopedByPlayer('coach_sessions', 'id, session_date, focus, summary, review_json, rating', { col: 'session_date', asc: false }),
    // Voice notes only, and only what the player needs to list and play one.
    // (The session recordings themselves, with their transcripts and reviews,
    // are the coach's.)
    scopedByPlayer('coach_media', 'id, kind, title, duration_seconds, storage_path, created_at', { col: 'created_at', asc: false }, q => q.is('clip_of', null).eq('kind', 'audio')),
    thread(50),
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
  let messagesAll = messagesFound as any[]
  if (!messagesAll.length) {
    try {
      await sendWelcomeMessage(db, m.academyId, m.scopePlayerId, m.role)
      messagesAll = await thread(5)
    } catch { /* a greeting must never break the page */ }
  }

  const messages = [...messagesAll]
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))

  // The lesson as the family is meant to see it — the coach's private note and
  // the raw review text stay behind. See familyLesson().
  const lessons = (lessonRows as any[]).map(familyLesson)

  // Voice notes need a playable link, and the media bucket is private — so the
  // audio recordings get the same short-lived signing the highlight clips get.
  // Without it the portal shows a coach's voice note it cannot play.
  // The storage path is used to sign and then left behind: the browser gets a
  // link that expires, not the address of the file.
  const mediaSigned = await Promise.all((voiceRows as any[]).map(async (mm) => {
    let url: string | null = null
    if (mm.storage_path) {
      try { const { data } = await db.storage.from('coach-media').createSignedUrl(mm.storage_path, 3600); url = data?.signedUrl ?? null } catch { /* skip */ }
    }
    return { id: mm.id, kind: mm.kind, title: mm.title, duration_seconds: mm.duration_seconds, created_at: mm.created_at, url }
  }))

  // Drills and guides for the racket they are on — a recommendation, never the
  // academy's whole library.
  const stage = (player.racket_stage || '') as string
  // A coach who has switched Lumio's starter library off sees only their own
  // resources, and so do their players.
  const lumioOff = await safe(db.from('coach_settings').select('data').eq('coach_id', m.academyId).limit(1))
    .then(r => ((r[0] as { data?: { resourcesPreloaded?: boolean } } | undefined)?.data?.resourcesPreloaded === false))
  const allRes = await safe(db.from('coach_resources')
    .select('id, title, category, format, racket, level, duration, notes, url, given_only')
    .eq('coach_id', m.academyId).limit(300))
  // Resources the coach gave to THIS player (Resource Centre → "Give to a
  // player"). They lead the list, and carry the coach's own note where there is
  // one — somebody picked them on purpose. A resource that has since been
  // deleted simply is not there to show.
  const givenRows = await safe(db.from('coach_player_resources')
    .select('ref_id, note, created_at')
    .eq('coach_id', m.academyId).eq('player_id', m.scopePlayerId).eq('kind', 'resource')
    .order('created_at', { ascending: false }).limit(9))
  const given = (givenRows as { ref_id?: string; note?: string | null }[])
    .map((g): Record<string, unknown> | null => { const r = (allRes as Record<string, unknown>[]).find(x => String(x.id) === String(g.ref_id)); return r ? { ...r, notes: g.note || r.notes } : null })
    .filter((r): r is Record<string, unknown> => !!r)
  const givenIds = new Set(given.map(r => String(r.id)))
  const resources = [...given, ...((allRes as any[]) as Record<string, unknown>[])
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
      .select('id, name, start_date, end_date, location, region, audience, board, daily_rhythm, description, intent, objectives, outcomes, itinerary, equipment, parent_brief, balance_link, overseas, trip, player_targets, coach_ids')
      .eq('coach_id', m.academyId).in('id', campIds))
    const byId = new Map((attendees as any[]).map(a => [a.camp_id, a]))
    const playerName = String(player?.name || '').trim().toLowerCase()
    camps = camps.map(c => {
      const a = byId.get(c.id)
      // player_targets holds a row PER ATTENDEE. The family gets their own row
      // and nobody else's — sending the whole array would hand one parent every
      // other child's assessment, which is a safeguarding failure, not a bug.
      // A row that carries a player id belongs to that player and nobody else
      // — which is what lets twins on one camp each see their own. Older rows
      // are keyed by NAME only, so they can only be told apart when the name is
      // this player's alone; otherwise the family gets none.
      const targets = Array.isArray(c.player_targets)
        ? (c.player_targets as any[]).filter(t => t?.player_id
            ? String(t.player_id) === String(m.scopePlayerId)
            : soleName && String(t?.player_name || '').trim().toLowerCase() === playerName)
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
  // Which modules this academy actually pays for. Without this the student app
  // showed the racket ladder to every family, including academies on a plan that
  // does not include Racket Progression — the coach could switch the module off
  // and the parent would carry on seeing it, because the flags lived in the
  // coach's own browser and nowhere else.
  let features: Record<string, boolean> | null = null
  try {
    const { data: cfg } = await db.from('coach_settings').select('data').eq('coach_id', m.academyId).maybeSingle()
    const d = (cfg?.data || {}) as Record<string, any>
    sectionsOff = Array.isArray(d?.sectionsOff?.student) ? d.sectionsOff.student : []
    if (typeof d?.awardThreshold === 'number') awardThreshold = d.awardThreshold
    if (d?.features && typeof d.features === 'object') features = d.features as Record<string, boolean>
  } catch { /* defaults are a complete page, not a broken one */ }

  // The `avatars` bucket is private — sign the child's photo for the parent/student
  // (they can't use the coach-side signing proxy). Handles a bare path or a legacy
  // full public URL; leaves data/external URLs alone.
  //
  // A photo held in our own store is served by /api/portal/avatar, which sends
  // it as an image and nothing else; the stamp on the end changes when the
  // photo does, so a new one shows straight away.
  const ownPhoto = !!player.avatar_url && !/^(https?:|data:|\/)/.test(String(player.avatar_url))
  const avatarUrl = ownPhoto
    ? `/api/portal/avatar?playerId=${encodeURIComponent(m.scopePlayerId)}&v=${encodeURIComponent(String(player.avatar_url).split('/').pop() || '')}`
    : await signAvatar(db, player.avatar_url, m.academyId)

  // The next lesson: when, where (with a map) and what the coach is planning.
  // Read here rather than derived in the browser because the venue and the plan
  // live in tables a family has no business querying — they get the one row
  // that is theirs, already resolved.
  // The name is only passed where it identifies them — it is the fallback for
  // bookings and plans that carry no player id.
  const nextSession = await buildNextSession(db, m.academyId, m.scopePlayerId, soleName ? name : '')

  // ── Who they can write to, and the camp conversations they are in ────────
  // A family messaging "the academy" is fine when there is one coach. With eight
  // it is a message nobody owns. And a camp is a group of people who need one
  // thread, not sixteen private ones — which is the gap that sends a trip to
  // WhatsApp within a day of landing.
  const staffRows = await safe(db.from('coach_staff')
    .select('id, name, role, avatar_url, is_head').eq('coach_id', m.academyId).limit(40))
  const coaches = await Promise.all((staffRows as any[])
    .filter(s2 => String(s2.name || '').trim())
    .map(async s2 => ({
      id: String(s2.id), name: String(s2.name), role: s2.role || (s2.is_head ? 'Head coach' : 'Coach'),
      avatar_url: await signAvatar(db, s2.avatar_url, m.academyId),
    })))

  const campThreads = await Promise.all((camps as any[]).map(async c => {
    // A camp thread only exists once migration 181 has run; until then this is
    // an empty list and the tab simply does not appear.
    //
    // discord_channel_name and results arrived with migration 184 — asked for
    // separately so a portal running ahead of that migration still renders the
    // thread rather than losing it to a failed select.
    // A camp message is found by its camp id OR by its camp thread key. Rows
    // have been written both ways over time — the Discord sync, the coach's
    // send, the family's reply — and a row carrying one but not the other
    // simply vanished from the family's side while the coach could see it.
    // Two exact queries, merged, rather than an .or() built from a string.
    const campRows = async (cols: string) => {
      const [byId, byKey] = await Promise.all([
        safe(db.from('coach_messages').select(cols).eq('coach_id', m.academyId).eq('camp_id', c.id)
          .order('created_at', { ascending: false }).limit(120)),
        safe(db.from('coach_messages').select(cols).eq('coach_id', m.academyId).eq('thread_key', `camp:${c.id}`)
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

    // Photos that came in from Discord live in a private bucket, so they are
    // signed here — the family has no session that could sign them itself.
    rows = await Promise.all((rows as any[]).map(async r => {
      const files = (r.results?.discord?.attachments ?? []) as { name: string; path: string }[]
      const photos = files.length ? (await Promise.all(files.map(async f => {
        try {
          const { data } = await db.storage.from('coach-media').createSignedUrl(f.path, 3600)
          return data?.signedUrl ? { name: f.name, url: data.signedUrl } : null
        } catch { return null }
      }))).filter(Boolean) : []
      const { results: _drop, discord_channel_name: chan, ...rest } = r
      void _drop
      return { ...rest, channel: chan ?? null, ...(photos.length ? { photos } : {}) }
    }))
    const { count } = await db.from('coach_camp_attendees')
      .select('id', { count: 'exact', head: true }).eq('camp_id', c.id).neq('status', 'cancelled')
    const coachCount = Array.isArray(c.coach_ids) ? (c.coach_ids as unknown[]).length : 0
        // Every linked channel, so each has a tab before anyone has posted in it.
    const linkedNames = ((await safe(db.from('coach_camp_channels')
      .select('channel_name, created_at').eq('coach_id', m.academyId).eq('camp_id', c.id)
      .order('created_at', { ascending: true }))) as { channel_name: string | null }[])
      .map(x => x.channel_name).filter(Boolean) as string[]
    return { campId: String(c.id), name: String(c.name || 'Camp'), people: (count ?? 0) + coachCount, messages: rows, channels: linkedNames }
  }))

  return NextResponse.json({
    coaches, campThreads,
    player: {
      id: player.id, name: player.name, nickname: player.nickname,
      racket_stage: player.racket_stage, level: player.level, goal: player.goal,
      category: player.category, age: player.age, avatar_url: avatarUrl,
      parent_name: player.parent_name, parent_email: player.parent_email,
      xp_total: player.xp_total,
    },
    skills, lessons, messages, watch, highlights, nextSession,
    media: mediaSigned, resources, books, camps, sectionsOff, awardThreshold, features,
  })
}
