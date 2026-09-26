// Pull a camp's Discord channel into its Lumio camp thread.
//
// Shared by the coach-triggered sync and the cron, because a camp that only
// updates when somebody happens to open the page is not a message feed.

import { serviceClient } from './oauth'
import { fetchMessages, displayName, botUserId, type DiscordMessage } from './discord'

// The service-role client is built here rather than passed in: threading a
// Supabase client through a type alias loses its row types, and the resulting
// `never` errors get "fixed" with casts that hide real mistakes.
type Db = ReturnType<typeof serviceClient>

export type SyncOutcome = { added: number; error?: string; lastId?: string | null }

// Attachments outlive the link they arrive on.
//
// Discord's file URLs are signed and expire within about a day, so a photo of
// the group on day two would be a dead image by day three. Images are copied
// into Lumio's own storage; anything else is named in the text but not fetched,
// because a camp thread does not need to become a file server.
async function rehostImages(db: Db, coachId: string, m: DiscordMessage): Promise<{ name: string; path: string }[]> {
  const images = (m.attachments || []).filter(a => (a.content_type || '').startsWith('image/') && a.size <= 10_000_000).slice(0, 4)
  const saved: { name: string; path: string }[] = []
  for (const a of images) {
    try {
      const res = await fetch(a.url)
      if (!res.ok) continue
      const buf = Buffer.from(await res.arrayBuffer())
      const safe = a.filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-60)
      const path = `discord/${coachId}/${m.id}-${safe}`
      const { error } = await db.storage.from('coach-media').upload(path, buf, {
        contentType: a.content_type || 'image/jpeg', upsert: true,
      })
      if (!error) saved.push({ name: a.filename, path })
    } catch { /* one lost photo must not fail the whole sync */ }
  }
  return saved
}

function bodyOf(m: DiscordMessage): string {
  const files = (m.attachments || []).map(a => `📎 ${a.filename}`)
  return [m.content?.trim(), ...files].filter(Boolean).join('\n').slice(0, 4000)
}

export type CampChannel = {
  id: string; coach_id: string; camp_id: string
  channel_id: string; channel_name: string | null; last_message_id: string | null
}

// One channel. The caller decides which ones to walk.
export async function syncChannel(ch: CampChannel): Promise<SyncOutcome> {
  const db = serviceClient()
  const r = await fetchMessages(ch.channel_id, ch.last_message_id)
  if (!r.ok) {
    // 403 = the bot was removed from the channel, 404 = the channel was deleted.
    // Both are things the coach did, and both need saying rather than retrying
    // every minute in silence.
    const why = r.status === 403 ? `Lumio’s bot can no longer see #${ch.channel_name || 'that channel'} — re-invite it or unlink it.`
      : r.status === 404 ? `#${ch.channel_name || 'That channel'} no longer exists in Discord.`
      : `Discord said no (${r.status}).`
    return { added: 0, error: why }
  }
  if (!r.messages.length) return { added: 0, lastId: ch.last_message_id }

  const me = botUserId()
  // Our own mirrored messages come back down the pipe; reading them in would
  // double every message the coach sends and, worse, mirror it out again.
  const fresh = r.messages.filter(m => !(m.author?.bot && m.author.id === me))

  // Known Discord accounts → roster players, so a message from a parent files
  // itself against the right player rather than under a gamertag.
  const { data: players } = await db.from('coach_players')
    .select('id, name, discord_user_id').eq('coach_id', ch.coach_id).not('discord_user_id', 'is', null)
  const byDiscord = new Map((players as { id: string; name: string; discord_user_id: string }[] | null ?? [])
    .map(p => [p.discord_user_id, p]))

  let added = 0
  for (const m of fresh) {
    const known = byDiscord.get(m.author.id)
    const files = await rehostImages(db, ch.coach_id, m)
    const { error } = await db.from('coach_messages').insert({
      coach_id: ch.coach_id,
      camp_id: ch.camp_id,
      direction: 'in',
      from_name: known?.name || displayName(m),
      recipients: 'Camp',
      thread_key: `camp:${ch.camp_id}`,
      body: bodyOf(m),
      channels: 'discord',
      status: 'received',
      external_id: `discord:${m.id}`,
      read: false,
      created_at: m.timestamp,
      discord_channel_id: ch.channel_id,
      discord_channel_name: ch.channel_name,
      ...(files.length ? { results: { discord: { attachments: files } } } : {}),
    })
    // 23505 = the unique index caught a message a parallel sync already stored.
    // Expected, not an error.
    if (!error) added++
    else if ((error as { code?: string }).code !== '23505') {
      console.error('[discord-sync] insert', error.message)
    }
  }

  const lastId = r.messages[r.messages.length - 1].id
  await db.from('coach_camp_channels').update({ last_message_id: lastId, synced_at: new Date().toISOString() }).eq('id', ch.id)
  return { added, lastId }
}

// Every channel linked to one camp. Errors are collected rather than thrown:
// one dead channel must not stop the other two syncing.
export async function syncCamp(campId: string, coachId?: string): Promise<{ added: number; errors: string[] }> {
  const db = serviceClient()
  let q = db.from('coach_camp_channels').select('id, coach_id, camp_id, channel_id, channel_name, last_message_id').eq('camp_id', campId)
  if (coachId) q = q.eq('coach_id', coachId)
  const { data } = await q
  const channels = (data as CampChannel[] | null) ?? []
  let added = 0
  const errors: string[] = []
  for (const ch of channels) {
    const out = await syncChannel(ch)
    added += out.added
    if (out.error) errors.push(out.error)
  }
  return { added, errors }
}
