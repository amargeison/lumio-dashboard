import { NextRequest, NextResponse } from 'next/server'
import { sessionCoachId, serviceClient } from '@/lib/coach/oauth'
import { discordConfigured, botInviteUrl, listGuilds, listChannels } from '@/lib/coach/discord'
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

  const guilds = await listGuilds()
  // Only reach for channels once a server is chosen — listing every channel of
  // every server the bot has joined is slow and tells the coach nothing.
  const channels = guildId ? await listChannels(guildId) : []

  return NextResponse.json({
    configured: true,
    invite: botInviteUrl(),
    guilds,
    channels,
    linked: rows.map(r => ({
      id: r.id, guildId: r.guild_id, channelId: r.channel_id, channelName: r.channel_name,
      syncedAt: r.synced_at, mirror: r.mirror,
    })),
  })
}

export async function POST(req: NextRequest) {
  const coachId = await sessionCoachId()
  if (!coachId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const b = (await req.json().catch(() => ({}))) as {
    campId?: string; guildId?: string; channelId?: string; channelName?: string
    mirror?: boolean; sync?: boolean
  }
  if (!b.campId) return NextResponse.json({ error: 'campId is required' }, { status: 400 })
  const camp = await ownCamp(coachId, b.campId)
  if (!camp) return NextResponse.json({ error: 'Camp not found' }, { status: 404 })

  const db = serviceClient()

  // Link a new channel.
  if (b.channelId && b.mirror === undefined) {
    const existing = await linked(coachId, b.campId)
    if (existing.some(c => c.channel_id === b.channelId)) {
      return NextResponse.json({ error: 'That channel is already linked to this camp.' }, { status: 400 })
    }
    // Start from now, not from the beginning of time: a camp thread should open
    // with today's conversation, not four months of backlog nobody asked for.
    // A Discord snowflake is (ms since 2015-01-01) shifted left 22 bits, built
    // by multiplication because the build target has no BigInt literals.
    const from = (BigInt(Date.now() - 1420070400000) * BigInt(4194304)).toString()
    const { error } = await db.from('coach_camp_channels').insert({
      coach_id: coachId, camp_id: b.campId, guild_id: b.guildId ?? null,
      channel_id: b.channelId, channel_name: b.channelName ?? null,
      last_message_id: from,
      // The first channel a camp links is the one Lumio posts back to; later
      // ones are read-only until the coach says otherwise.
      mirror: existing.length === 0,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
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
