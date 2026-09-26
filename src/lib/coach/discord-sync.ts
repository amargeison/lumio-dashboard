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

export async function syncCampDiscord(camp: {
  id: string; coach_id: string; discord_channel_id: string | null; discord_last_message_id: string | null
}): Promise<SyncOutcome> {
  if (!camp.discord_channel_id) return { added: 0 }
  const db = serviceClient()

  const r = await fetchMessages(camp.discord_channel_id, camp.discord_last_message_id)
  if (!r.ok) {
    // 403 = the bot was removed from the channel, 404 = the channel was deleted.
    // Both are things the coach did, and both need saying rather than retrying
    // every minute in silence.
    const why = r.status === 403 ? 'Lumio’s bot can no longer see that channel — re-invite it or pick another.'
      : r.status === 404 ? 'That Discord channel no longer exists.'
      : `Discord said no (${r.status}).`
    return { added: 0, error: why }
  }

  const me = botUserId()
  // Our own mirrored messages come back down the pipe; reading them in would
  // double every message the coach sends and, worse, mirror it out again.
  const fresh = r.messages.filter(m => !(m.author?.bot && m.author.id === me))
  if (!r.messages.length) return { added: 0, lastId: camp.discord_last_message_id }

  // Known Discord accounts → roster players, so a message from a parent files
  // itself against the right player rather than under a gamertag.
  const { data: players } = await db.from('coach_players')
    .select('id, name, discord_user_id').eq('coach_id', camp.coach_id).not('discord_user_id', 'is', null)
  const byDiscord = new Map((players as { id: string; name: string; discord_user_id: string }[] | null ?? [])
    .map(p => [p.discord_user_id, p]))

  let added = 0
  for (const m of fresh) {
    const known = byDiscord.get(m.author.id)
    const files = await rehostImages(db, camp.coach_id, m)
    const { error } = await db.from('coach_messages').insert({
      coach_id: camp.coach_id,
      camp_id: camp.id,
      direction: 'in',
      from_name: known?.name || displayName(m),
      recipients: 'Camp',
      thread_key: `camp:${camp.id}`,
      body: bodyOf(m),
      channels: 'discord',
      status: 'received',
      external_id: `discord:${m.id}`,
      read: false,
      created_at: m.timestamp,
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
  await db.from('coach_camps').update({
    discord_last_message_id: lastId,
    discord_synced_at: new Date().toISOString(),
  }).eq('id', camp.id)

  return { added, lastId }
}
