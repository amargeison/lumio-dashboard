import { NextRequest, NextResponse } from 'next/server'
import { serviceClient } from '@/lib/coach/oauth'
import { discordConfigured } from '@/lib/coach/discord'
import { syncChannel, type CampChannel } from '@/lib/coach/discord-sync'

export const runtime = 'nodejs'
export const maxDuration = 120

// Pulls every linked camp channel into Lumio. A system cron on the VPS:
//
//   * * * * * curl -sS -X POST http://127.0.0.1:3000/api/cron/discord-sync \
//     -H "Authorization: Bearer <CRON_SECRET>" > /dev/null
//
// Every minute, because this is a conversation — a parent asking what time the
// coach leaves the hotel is not something to deliver on the hour. It is cheap:
// one Discord call per linked channel, and nothing at all when none are linked.
//
// Localhost on purpose, like the camp-email cron: the public hostname is behind
// Cloudflare, which answers curl with a bot challenge.
//
// Safe to run twice over. The unique index on (coach_id, external_id) is what
// actually stops a message appearing in a camp thread twice.
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!discordConfigured()) return NextResponse.json({ ok: true, skipped: 'discord not configured' })

  const db = serviceClient()
  const { data: chans } = await db.from('coach_camp_channels')
    .select('id, coach_id, camp_id, channel_id, channel_name, last_message_id')
  const channels = (chans as CampChannel[] | null) ?? []
  if (!channels.length) return NextResponse.json({ ok: true, channels: 0, added: 0 })

  // Only camps that are actually happening — from two weeks before the first day
  // to a week after the last. A channel linked to a camp that finished in March
  // does not need polling every minute for the rest of the year; the coach can
  // still sync it by hand from the camp page.
  const { data: camps } = await db.from('coach_camps')
    .select('id, name, start_date, end_date').in('id', Array.from(new Set(channels.map(c => c.camp_id))))
  type Camp = { id: string; name: string; start_date: string | null; end_date: string | null }
  const live = new Map<string, string>()
  for (const c of ((camps as Camp[] | null) ?? [])) {
    const start = c.start_date ? new Date(`${c.start_date}T00:00:00`).getTime() : 0
    const end = new Date(`${c.end_date || c.start_date || '2999-12-31'}T23:59:59`).getTime()
    const now = Date.now()
    if (now >= start - 14 * 86_400_000 && now <= end + 7 * 86_400_000) live.set(c.id, c.name)
  }

  const results: { camp: string; channel: string | null; added: number; error?: string }[] = []
  for (const ch of channels.filter(c => live.has(c.camp_id))) {
    try {
      const out = await syncChannel(ch)
      results.push({ camp: live.get(ch.camp_id) || ch.camp_id, channel: ch.channel_name, added: out.added, ...(out.error ? { error: out.error } : {}) })
    } catch (e) {
      results.push({ camp: live.get(ch.camp_id) || ch.camp_id, channel: ch.channel_name, added: 0, error: e instanceof Error ? e.message : 'failed' })
    }
  }
  return NextResponse.json({ ok: true, channels: results.length, added: results.reduce((n, r) => n + r.added, 0), results })
}
