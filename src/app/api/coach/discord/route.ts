import { NextRequest, NextResponse } from 'next/server'
import { sessionCoachId, serviceClient, publicOrigin } from '@/lib/coach/oauth'
import { discordConfigured, botInviteUrl, listGuilds, listChannels, channelInfo } from '@/lib/coach/discord'
import { syncCamp, type CampChannel } from '@/lib/coach/discord-sync'

export const runtime = 'nodejs'
export const maxDuration = 60

// Camp ↔ Discord channels, for the coach's own camps only. A camp may link as
// many channels as its server has — #general, #important-info, #faqs — and each
// keeps its own place in the conversation.
//
//   GET    ?campId= [&guildId=]  → linked channels, plus servers/channels on offer
//   POST   { campId, … }         → link a channel, toggle its mirror, or sync now
//   DELETE ?campId=&channelId=   → unlink one channel (its messages stay)

async function ownCamp(coachId: string, campId: string) {
  const { data } = await serviceClient().from('coach_camps')
    .select('id, name').eq('id', campId).eq('coach_id', coachId).maybeSingle()
  return data as { id: string; name: string } | null
}

// The servers this coach may see — and nobody else's.
//
// The bot sits in every academy's server; listing all of them to every coach
// would let one club link another's channels and read their parents. So a
// server shows only if it is recorded against this coach.
//
// "Recorded" has two routes in. The proper one is the invite callback. The
// other is history: a server this coach was already linking channels from
// before ownership existed. Without that second route every coach who set
// Discord up before the ownership change lost their server from the list —
// channels still syncing, but "the bot isn't in your server" on screen — which
// is exactly what happened the first time this shipped. Those servers are
// claimed on sight, unless another coach already owns them.
async function ownGuildIds(coachId: string): Promise<Set<string>> {
  const db = serviceClient()
  const mine = new Set<string>()

  const { data: owned, error: ownErr } = await db.from('coach_discord_guilds').select('guild_id').eq('coach_id', coachId)
  for (const g of (owned as { guild_id: string }[] | null) ?? []) mine.add(g.guild_id)

  // Servers behind channels this coach has already linked. Old links may have
  // no server id stored; Discord can tell us which server a channel is in, and
  // the row is repaired so this only has to be asked once.
  const { data: links } = await db.from('coach_camp_channels').select('id, guild_id, channel_id').eq('coach_id', coachId)
  const fromLinks = new Set<string>()
  for (const l of (links as { id: string; guild_id: string | null; channel_id: string }[] | null) ?? []) {
    let gid = l.guild_id
    if (!gid) {
      gid = (await channelInfo(l.channel_id))?.guild_id ?? null
      if (gid) await db.from('coach_camp_channels').update({ guild_id: gid }).eq('id', l.id)
    }
    if (gid) fromLinks.add(gid)
  }

  for (const gid of fromLinks) {
    if (mine.has(gid)) continue
    if (ownErr) { mine.add(gid); continue }   // table not migrated yet — their own links are still theirs
    const { data: other } = await db.from('coach_discord_guilds').select('coach_id').eq('guild_id', gid).maybeSingle()
    if (other && (other as { coach_id: string }).coach_id !== coachId) continue   // someone else's server
    if (!other) await db.from('coach_discord_guilds').insert({ coach_id: coachId, guild_id: gid })
    mine.add(gid)
  }
  return mine
}

async function linked(coachId: string, campId: string) {
  const { data } = await serviceClient().from('coach_camp_channels')
    .select('id, coach_id, camp_id, guild_id, channel_id, channel_name, last_message_id, synced_at, mirror')
    .eq('coach_id', coachId).eq('camp_id', campId).order('created_at', { ascending: true })
  return (data ?? []) as (CampChannel & { guild_id: string | null; synced_at: string | null; mirror: boolean })[]
}

export async function GET(req: NextRequest) {
  const coachId = await sessionCoachId()
  if (!coachId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  if (!discordConfigured()) return NextResponse.json({ configured: false, invite: null, guilds: [], channels: [], linked: [] })

  const campId = req.nextUrl.searchParams.get('campId')
  const guildId = req.nextUrl.searchParams.get('guildId')
  const rows = campId ? await linked(coachId, campId) : []

  const mine = await ownGuildIds(coachId)
  const guilds = (await listGuilds()).filter(g => mine.has(g.id))
  // Only reach for channels once a server is chosen — and only a server that is
  // this coach's own.
  const channels = guildId && mine.has(guildId) ? await listChannels(guildId) : []

  // The invite goes out with a one-time state and comes back through our
  // callback, which is what ties the server to this coach.
  const state = crypto.randomUUID()
  const origin = publicOrigin(req.nextUrl.origin)
  const ret = req.nextUrl.searchParams.get('return') || '/'
  const res = NextResponse.json({
    configured: true,
    invite: botInviteUrl(`${origin}/api/coach/discord/callback`, state),
    guilds,
    channels,
    linked: rows.map(r => ({
      id: r.id, guildId: r.guild_id, channelId: r.channel_id, channelName: r.channel_name,
      syncedAt: r.synced_at, mirror: r.mirror,
    })),
  })
  const opts = { httpOnly: true, secure: req.nextUrl.protocol === 'https:', sameSite: 'lax' as const, maxAge: 900, path: '/' }
  res.cookies.set('lumio_discord_state', state, opts)
  res.cookies.set('lumio_discord_return', ret, opts)
  return res
}

export async function POST(req: NextRequest) {
  const coachId = await sessionCoachId()
  if (!coachId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const b = (await req.json().catch(() => ({}))) as {
    campId?: string; guildId?: string; channelId?: string; channelName?: string
    /** Link several at once — the "Add all channels" button. */
    channels?: { id: string; name: string }[]
    mirror?: boolean; sync?: boolean
  }
  if (!b.campId) return NextResponse.json({ error: 'campId is required' }, { status: 400 })
  const camp = await ownCamp(coachId, b.campId)
  if (!camp) return NextResponse.json({ error: 'Camp not found' }, { status: 404 })

  const db = serviceClient()

  // Link one channel, or several.
  const toLink = b.channels?.length
    ? b.channels
    : (b.channelId && b.mirror === undefined ? [{ id: b.channelId, name: b.channelName ?? '' }] : [])
  if (toLink.length) {
    // Only from a server this coach owns, and only channels that really are in
    // it — both checked against Discord, not taken from the request.
    const mine = await ownGuildIds(coachId)
    if (!b.guildId || !mine.has(b.guildId)) {
      return NextResponse.json({ error: 'That Discord server isn’t connected to your Lumio account. Add the bot from this page first.' }, { status: 403 })
    }
    const real = new Set((await listChannels(b.guildId)).map(c => c.id))
    if (toLink.some(c => !real.has(c.id))) {
      return NextResponse.json({ error: 'That channel isn’t in your server, or the bot can’t see it.' }, { status: 400 })
    }
    const existing = await linked(coachId, b.campId)
    const have = new Set(existing.map(c => c.channel_id))
    const fresh = toLink.filter(c => !have.has(c.id))
    if (!fresh.length && !b.channels) {
      return NextResponse.json({ error: 'That channel is already linked to this camp.' }, { status: 400 })
    }
    // Start from now, not from the beginning of time: a camp thread should open
    // with today's conversation, not four months of backlog nobody asked for.
    // A Discord snowflake is (ms since 2015-01-01) shifted left 22 bits, built
    // by multiplication because the build target has no BigInt literals.
    const from = (BigInt(Date.now() - 1420070400000) * BigInt(4194304)).toString()
    if (fresh.length) {
      const { error } = await db.from('coach_camp_channels').insert(fresh.map((c, i) => ({
        coach_id: coachId, camp_id: b.campId, guild_id: b.guildId ?? null,
        channel_id: c.id, channel_name: c.name || null,
        last_message_id: from,
        // The camp's default destination for "send to the whole camp" is the
        // first channel it ever links. The rest still read in, and still take
        // replies aimed at them — they are just not where a camp-wide message
        // goes by default.
        mirror: existing.length === 0 && i === 0,
      })))
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  // Toggle the mirror on one channel.
  if (b.channelId && typeof b.mirror === 'boolean') {
    const { error } = await db.from('coach_camp_channels').update({ mirror: b.mirror })
      .eq('coach_id', coachId).eq('camp_id', b.campId).eq('channel_id', b.channelId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const out = await syncCamp(b.campId, coachId)
  return NextResponse.json({ ok: true, added: out.added, error: out.errors[0] })
}

export async function DELETE(req: NextRequest) {
  const coachId = await sessionCoachId()
  if (!coachId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const campId = req.nextUrl.searchParams.get('campId')
  const channelId = req.nextUrl.searchParams.get('channelId')
  if (!campId) return NextResponse.json({ error: 'campId is required' }, { status: 400 })

  // Unlinking stops the sync and forgets the channel. Messages already pulled in
  // stay — they are part of the camp's record, and deleting a conversation
  // because an integration was switched off would be its own kind of bug.
  const db = serviceClient()
  let q = db.from('coach_camp_channels').delete().eq('coach_id', coachId).eq('camp_id', campId)
  if (channelId) q = q.eq('channel_id', channelId)
  const { error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
