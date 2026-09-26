import { NextRequest, NextResponse } from 'next/server'
import { sessionCoachId, serviceClient } from '@/lib/coach/oauth'
import { discordConfigured, botInviteUrl, listGuilds, listChannels } from '@/lib/coach/discord'
import { syncCampDiscord } from '@/lib/coach/discord-sync'

export const runtime = 'nodejs'
export const maxDuration = 60

// Camp ↔ Discord channel wiring, for the coach's own camps only.
//
//   GET  ?campId=          → what this camp is linked to, plus the servers and
//                            channels the bot can currently see
//   POST { campId, … }     → link a channel, change the mirror setting, or sync now
//   DELETE ?campId=        → unlink (messages already pulled in stay put)

async function ownedCamp(coachId: string, campId: string) {
  const db = serviceClient()
  const { data } = await db.from('coach_camps')
    .select('id, coach_id, name, discord_guild_id, discord_channel_id, discord_channel_name, discord_last_message_id, discord_synced_at, discord_mirror')
    .eq('id', campId).eq('coach_id', coachId).maybeSingle()
  return data as {
    id: string; coach_id: string; name: string
    discord_guild_id: string | null; discord_channel_id: string | null; discord_channel_name: string | null
    discord_last_message_id: string | null; discord_synced_at: string | null; discord_mirror: boolean | null
  } | null
}

export async function GET(req: NextRequest) {
  const coachId = await sessionCoachId()
  if (!coachId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  if (!discordConfigured()) return NextResponse.json({ configured: false, invite: null, guilds: [], camp: null })

  const campId = req.nextUrl.searchParams.get('campId')
  const guildId = req.nextUrl.searchParams.get('guildId')
  const camp = campId ? await ownedCamp(coachId, campId) : null

  // Only reach for channels once a server is chosen — listing every channel of
  // every server the bot has ever joined is slow and tells the coach nothing.
  const guilds = await listGuilds()
  const channels = guildId ? await listChannels(guildId) : []

  return NextResponse.json({
    configured: true,
    invite: botInviteUrl(),
    guilds,
    channels,
    camp: camp ? {
      guildId: camp.discord_guild_id, channelId: camp.discord_channel_id, channelName: camp.discord_channel_name,
      syncedAt: camp.discord_synced_at, mirror: camp.discord_mirror !== false,
    } : null,
  })
}

export async function POST(req: NextRequest) {
  const coachId = await sessionCoachId()
  if (!coachId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const b = (await req.json().catch(() => ({}))) as {
    campId?: string; guildId?: string; channelId?: string; channelName?: string; mirror?: boolean; sync?: boolean
  }
  if (!b.campId) return NextResponse.json({ error: 'campId is required' }, { status: 400 })
  const camp = await ownedCamp(coachId, b.campId)
  if (!camp) return NextResponse.json({ error: 'Camp not found' }, { status: 404 })

  const db = serviceClient()
  const patch: Record<string, unknown> = {}
  if (b.channelId) {
    patch.discord_channel_id = b.channelId
    patch.discord_guild_id = b.guildId ?? camp.discord_guild_id
    patch.discord_channel_name = b.channelName ?? null
    // A newly linked channel starts from now, not from the beginning of time: a
    // camp thread should open with today's conversation, not four months of
    // backlog nobody asked to import.
    if (b.channelId !== camp.discord_channel_id) {
      // A Discord snowflake is (ms since 2015-01-01) shifted left 22 bits. Built
      // with multiplication rather than a shift so it works on the build's ES
      // target, which has no BigInt literals.
      patch.discord_last_message_id = (BigInt(Date.now() - 1420070400000) * BigInt(4194304)).toString()
    }
  }
  if (typeof b.mirror === 'boolean') patch.discord_mirror = b.mirror
  if (Object.keys(patch).length) {
    const { error } = await db.from('coach_camps').update(patch).eq('id', camp.id).eq('coach_id', coachId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (b.sync || b.channelId) {
    const fresh = await ownedCamp(coachId, b.campId)
    if (fresh?.discord_channel_id) {
      const out = await syncCampDiscord(fresh)
      return NextResponse.json({ ok: true, ...out })
    }
  }
  return NextResponse.json({ ok: true, added: 0 })
}

export async function DELETE(req: NextRequest) {
  const coachId = await sessionCoachId()
  if (!coachId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const campId = req.nextUrl.searchParams.get('campId')
  if (!campId) return NextResponse.json({ error: 'campId is required' }, { status: 400 })
  const db = serviceClient()
  // Unlinking stops the sync and forgets the channel. Messages already pulled in
  // stay — they are part of the camp's record, and deleting a conversation
  // because an integration was switched off would be its own kind of bug.
  const { error } = await db.from('coach_camps').update({
    discord_channel_id: null, discord_channel_name: null, discord_guild_id: null, discord_last_message_id: null,
  }).eq('id', campId).eq('coach_id', coachId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
