import { NextRequest, NextResponse } from 'next/server'
import { familyAccess, nameIsUnique, scopedDb } from '@/lib/coach/membership'

export const runtime = 'nodejs'

// The family's side of the conversation.
//
// It used to do one thing: post a line into the coach's inbox. A family could
// not answer a particular message, could not say which coach they meant, could
// not react, and a camp had no shared thread — so anything that needed a real
// back-and-forth moved to WhatsApp, which is precisely what the player app
// exists to stop.
//
// Everything here stays scope-locked: the sender can only write into their own
// academy, under their own player's conversation, or into a camp their player
// actually holds a place on. None of those is taken on trust from the request.
//
// Which child they are acting for comes with the request (`playerId`, the one
// picked at the top of the page) and is checked by familyAccess(): the caller
// must hold an active membership for exactly that player.
//
// A conversation belongs to a PLAYER, not a name (migration 194). Every row
// written here carries player_id and the ACADEMY's id. thread_key still holds
// the name as well, because the coach's inbox groups on it.

type MsgRow = { id: string; player_id?: string | null; thread_key?: string | null; recipients?: string | null; camp_id?: string | null }

// Is this message part of THIS player's one-to-one conversation? By id; or, for
// a row written before messages carried one, by name — but only when the name
// is this player's alone, so two children who share a name can never reach
// each other's thread.
const inThread = (msg: MsgRow, playerId: string, name: string, soleName: boolean) =>
  msg.player_id === playerId ||
  (!msg.player_id && !msg.camp_id && soleName && !!name &&
    (msg.thread_key === name || (!msg.thread_key && (msg.recipients || '').trim() === name)))

const clean = (v: unknown, max = 4000) => String(v ?? '').trim().slice(0, max)
const REACTIONS = ['👍', '❤️', '😄', '✅', '🎾', '🙌']

export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => ({}))) as {
    body?: string; toName?: string; replyTo?: string; campId?: string; channel?: string; playerId?: string
  }
  const access = await familyAccess(b.playerId)
  if (!access.ok) return NextResponse.json({ error: access.error, code: access.code }, { status: access.status })
  const m = access.m
  const body = clean(b.body)
  if (!body) return NextResponse.json({ error: 'Message is empty' }, { status: 400 })

  const db = scopedDb()
  const { data: player } = await db.from('coach_players')
    .select('name').eq('id', m.scopePlayerId).eq('coach_id', m.academyId).maybeSingle()
  if (!player) return NextResponse.json({ error: 'This player is no longer on the academy\u2019s roster.' }, { status: 404 })

  const conv = (player.name || '').trim()

  // A named coach has to be a coach at THIS academy. Anything else is dropped
  // back to the academy inbox rather than refused — a stale name in a browser
  // should not eat somebody's message.
  let toName: string | null = null
  const wanted = clean(b.toName, 80)
  if (wanted) {
    const { data: staff } = await db.from('coach_staff')
      .select('name').eq('coach_id', m.academyId).ilike('name', wanted).limit(1)
    toName = (staff as any)?.[0]?.name ?? null
  }

  // A camp message is only allowed from somebody actually on that camp.
  let campId: string | null = null
  let campName = ''
  if (b.campId) {
    const { data: place } = await db.from('coach_camp_attendees')
      .select('id, status').eq('coach_id', m.academyId).eq('camp_id', b.campId)
      .eq('player_id', m.scopePlayerId).limit(1)
    const row = (place as any)?.[0]
    if (!row || String(row.status || 'confirmed') === 'cancelled') {
      return NextResponse.json({ error: 'You are not on that camp.' }, { status: 403 })
    }
    const { data: camp } = await db.from('coach_camps')
      .select('name').eq('id', b.campId).eq('coach_id', m.academyId).maybeSingle()
    campId = b.campId
    campName = String(camp?.name || 'Camp')
  }

  // Replying to something has to be replying to something they can see: their
  // own thread, or a camp thread they are part of.
  let replyTo: string | null = null
  if (b.replyTo) {
    const { data: parent } = await db.from('coach_messages')
      .select('id, player_id, thread_key, recipients, camp_id').eq('id', b.replyTo).eq('coach_id', m.academyId).maybeSingle()
    const ok = parent && (campId
      ? parent.camp_id === campId
      : inThread(parent as MsgRow, m.scopePlayerId, conv, await nameIsUnique(db, m.academyId, conv)))
    replyTo = ok ? (parent!.id as string) : null
  }

  // Which Discord channel this answers.
  //
  // A parent reading #faqs and typing a reply means it to appear in #faqs, not
  // wherever the coach happened to tick first. So the channel they are looking
  // at comes with the message; with no channel chosen ("All"), it goes to the
  // camp's default channels — the ones marked "Post Lumio messages here".
  let targets: { channel_id: string; channel_name: string | null }[] = []
  if (campId) {
    const { data: chans } = await db.from('coach_camp_channels')
      .select('channel_id, channel_name, mirror').eq('coach_id', m.academyId).eq('camp_id', campId)
    const all = (chans as { channel_id: string; channel_name: string | null; mirror: boolean }[] | null) ?? []
    const wantedChannel = clean(b.channel, 100)
    // The channel they were reading wins even when it is not one of the camp's
    // defaults — they chose it by being in it.
    const picked = wantedChannel ? all.find(c => c.channel_name === wantedChannel) : null
    targets = picked ? [picked] : all.filter(c => c.mirror)
  }
  // Stamp the row only when there is one destination — a message that went to
  // three channels belongs to none of them, and should sit under "All".
  const stamp = targets.length === 1 ? targets[0].channel_name : null

  const { data: row, error } = await db.from('coach_messages').insert({
    coach_id: m.academyId,
    player_id: m.scopePlayerId,
    direction: 'in',
    from_name: conv,
    recipients: campId ? `Camp · ${campName}` : conv,
    thread_key: campId ? `camp:${campId}` : conv,
    to_name: toName,
    reply_to: replyTo,
    camp_id: campId,
    body,
    channels: 'portal',
    status: 'received',
    ...(stamp ? { discord_channel_name: stamp } : {}),
    read: false,
    created_at: new Date().toISOString(),
  }).select('id, created_at').single()
  if (error) { console.error('[portal/message] insert', error.message); return NextResponse.json({ error: 'Your message could not be sent. Please try again.' }, { status: 500 }) }

  // …and out to Discord, if the camp's channels are mirrored.
  //
  // This is the half that makes the camp thread a conversation rather than a
  // noticeboard. Without it a parent answers in the app, forty people in
  // Discord never see it, and the parent concludes the app does not work —
  // which is worse than never having offered them the box to type in.
  //
  // The message goes out under the player's name, because a line appearing in a
  // camp channel from nobody in particular is how a group chat stops trusting
  // what it reads. Only channels the coach ticked, so a reply cannot land three
  // times across the server.
  if (targets.length) {
    try {
      const { postMessage } = await import('@/lib/coach/discord')
      for (const t of targets) await postMessage(t.channel_id, body, conv)
    } catch (e) {
      // A Discord outage must not lose the message: it is already saved, and the
      // coach will see it in the app either way.
      console.error('[portal/message] discord mirror', e)
    }
  }

  return NextResponse.json({ ok: true, id: row?.id, to: toName, campId })
}

// A reaction. Same four-plus emoji the coach's inbox uses, so a thumbs-up means
// the same thing on both sides of it.
export async function PATCH(req: NextRequest) {
  const { id, reaction, playerId } = (await req.json().catch(() => ({}))) as { id?: string; reaction?: string | null; playerId?: string }
  const access = await familyAccess(playerId)
  if (!access.ok) return NextResponse.json({ error: access.error, code: access.code }, { status: access.status })
  const m = access.m
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
  const emoji = reaction ? clean(reaction, 8) : null
  if (emoji && !REACTIONS.includes(emoji)) return NextResponse.json({ error: 'Unknown reaction' }, { status: 400 })

  const db = scopedDb()
  const { data: player } = await db.from('coach_players')
    .select('name').eq('id', m.scopePlayerId).eq('coach_id', m.academyId).maybeSingle()
  const conv = (player?.name || '').trim()

  // Only inside a conversation they are part of.
  const { data: msg } = await db.from('coach_messages')
    .select('id, player_id, thread_key, recipients, camp_id').eq('id', id).eq('coach_id', m.academyId).maybeSingle()
  if (!msg) return NextResponse.json({ error: 'Message not found' }, { status: 404 })
  let allowed = inThread(msg as MsgRow, m.scopePlayerId, conv, await nameIsUnique(db, m.academyId, conv))
  if (!allowed && msg.camp_id) {
    const { data: place } = await db.from('coach_camp_attendees')
      .select('id').eq('coach_id', m.academyId).eq('camp_id', msg.camp_id)
      .eq('player_id', m.scopePlayerId).neq('status', 'cancelled').limit(1)
    allowed = !!(place as any)?.length
  }
  if (!allowed) return NextResponse.json({ error: 'Not your message' }, { status: 403 })

  const { error } = await db.from('coach_messages').update({ reaction: emoji }).eq('id', id).eq('coach_id', m.academyId)
  if (error) { console.error('[portal/message] react', error.message); return NextResponse.json({ error: 'That could not be saved. Please try again.' }, { status: 500 }) }
  return NextResponse.json({ ok: true })
}
