// Server-only Discord bot client for camp channels.
//
// One Lumio application, one bot, invited by each coach into their own server.
// There is no per-coach token and no OAuth dance: the coach adds the bot from a
// link, and from then on Lumio can see whatever channels the bot has been given
// access to. That is the whole point of a bot — the alternative, logging in as
// a person and reading their messages, is against Discord's terms and gets the
// account banned, so it is not an option however convenient it looks.
//
// Never import this from a client component: it reads the bot token.

const API = 'https://discord.com/api/v10'

export type DiscordChannel = { id: string; name: string; type: number; parentName?: string }
export type DiscordGuild = { id: string; name: string; icon?: string | null }
export type DiscordMessage = {
  id: string
  content: string
  timestamp: string
  author: { id: string; username: string; global_name?: string | null; bot?: boolean }
  member?: { nick?: string | null } | null
  attachments?: { id: string; filename: string; url: string; content_type?: string; size: number }[]
  referenced_message?: { id: string } | null
}

export function discordConfigured(): boolean {
  return !!process.env.DISCORD_BOT_TOKEN
}

// The link a coach clicks to put the bot in their server.
//
// Permissions, and only these: View Channels (1024), Send Messages (2048) and
// Read Message History (65536). No member management, no message deletion, no
// role changes — a coach handing an unknown app the keys to their community
// should be able to see from the consent screen that it cannot do damage.
export function botInviteUrl(): string | null {
  const id = process.env.DISCORD_CLIENT_ID
  if (!id) return null
  const params = new URLSearchParams({ client_id: id, scope: 'bot', permissions: '68608' })
  return `https://discord.com/oauth2/authorize?${params.toString()}`
}

type FetchResult<T> = { ok: true; data: T } | { ok: false; status: number; detail: string }

async function bot<T>(path: string, init?: RequestInit, retry = true): Promise<FetchResult<T>> {
  const token = process.env.DISCORD_BOT_TOKEN
  if (!token) return { ok: false, status: 0, detail: 'Discord is not configured on this server.' }
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bot ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'LumioCamps (https://lumiosports.com, 1.0)',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  })
  // Discord rate limits per route and tells you exactly how long to wait. One
  // honest retry beats a failed sync that silently drops a camp's messages.
  if (res.status === 429 && retry) {
    const j = await res.json().catch(() => ({} as { retry_after?: number }))
    const waitMs = Math.min(5000, Math.round((j.retry_after ?? 1) * 1000))
    await new Promise(r => setTimeout(r, waitMs))
    return bot<T>(path, init, false)
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    return { ok: false, status: res.status, detail: body.slice(0, 300) || `HTTP ${res.status}` }
  }
  if (res.status === 204) return { ok: true, data: undefined as T }
  return { ok: true, data: (await res.json()) as T }
}

// Servers the bot has been added to. This is how a coach picks theirs without
// having to find a guild id: they add the bot, come back, and it is in the list.
export async function listGuilds(): Promise<DiscordGuild[]> {
  const r = await bot<DiscordGuild[]>('/users/@me/guilds?limit=200')
  return r.ok ? r.data : []
}

// Text channels only (0 = text, 5 = announcement), each labelled with its
// category so "general" under "Spain 2026" is distinguishable from the other
// three "general"s a busy server has.
export async function listChannels(guildId: string): Promise<DiscordChannel[]> {
  const r = await bot<(DiscordChannel & { parent_id?: string | null })[]>(`/guilds/${guildId}/channels`)
  if (!r.ok) return []
  const byId = new Map(r.data.map(c => [c.id, c]))
  return r.data
    .filter(c => c.type === 0 || c.type === 5)
    .map(c => ({ id: c.id, name: c.name, type: c.type, parentName: c.parent_id ? byId.get(c.parent_id)?.name : undefined }))
    .sort((a, b) => `${a.parentName || ''}${a.name}`.localeCompare(`${b.parentName || ''}${b.name}`))
}

export async function channelInfo(channelId: string): Promise<DiscordChannel | null> {
  const r = await bot<DiscordChannel>(`/channels/${channelId}`)
  return r.ok ? r.data : null
}

// Everything posted since `afterId`, oldest first.
//
// Discord hands back at most 100 at a time and, whatever the docs imply, the
// order is not something to rely on — snowflake ids sort chronologically, so we
// sort by id ourselves. A camp channel that has been quiet for a week could have
// hundreds of messages waiting, hence the page loop with a hard ceiling: a first
// sync should not pull a year of history into a camp thread.
export async function fetchMessages(channelId: string, afterId?: string | null, maxPages = 5): Promise<
  { ok: true; messages: DiscordMessage[] } | { ok: false; status: number; detail: string }
> {
  const out: DiscordMessage[] = []
  let after = afterId || null
  for (let page = 0; page < maxPages; page++) {
    const q = new URLSearchParams({ limit: '100' })
    if (after) q.set('after', after)
    const r = await bot<DiscordMessage[]>(`/channels/${channelId}/messages?${q.toString()}`)
    if (!r.ok) return r
    if (!r.data.length) break
    const sorted = [...r.data].sort((a, b) => (BigInt(a.id) < BigInt(b.id) ? -1 : 1))
    out.push(...sorted)
    if (r.data.length < 100) break
    after = sorted[sorted.length - 1].id
  }
  return { ok: true, messages: out.sort((a, b) => (BigInt(a.id) < BigInt(b.id) ? -1 : 1)) }
}

// Post into the channel as the bot. `author` is prefixed rather than spoofed —
// a webhook could impersonate the coach, but a camp channel where messages can
// come from a name that is not really behind them is worse than one that says
// plainly who sent what.
export async function postMessage(channelId: string, content: string, author?: string): Promise<boolean> {
  const text = (author ? `**${author}**\n${content}` : content).slice(0, 1900)
  const r = await bot(`/channels/${channelId}/messages`, { method: 'POST', body: JSON.stringify({ content: text }) })
  return r.ok
}

// The display name a human would recognise: server nickname, then the account's
// display name, then the handle.
export function displayName(m: DiscordMessage): string {
  return (m.member?.nick || m.author.global_name || m.author.username || 'Someone').trim()
}

// The bot's own id, so a mirrored message is never read back in as an inbound
// one — which is how integrations end up talking to themselves forever.
export function botUserId(): string | null {
  return process.env.DISCORD_CLIENT_ID || null
}
