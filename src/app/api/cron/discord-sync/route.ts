import { NextRequest, NextResponse } from 'next/server'
import { serviceClient } from '@/lib/coach/oauth'
import { discordConfigured } from '@/lib/coach/discord'
import { syncCampDiscord } from '@/lib/coach/discord-sync'

export const runtime = 'nodejs'
export const maxDuration = 120

// Pulls every linked camp channel into Lumio. A system cron on the VPS:
//
//   * * * * * curl -sS -X POST http://127.0.0.1:3000/api/cron/discord-sync \
//     -H "Authorization: Bearer $CRON_SECRET" > /dev/null
//
// Every minute, because this is a conversation — a parent asking what time the
// coach leaves the hotel is not something to deliver on the hour. It is cheap:
// one Discord call per linked camp, and nothing at all when no camp is linked.
//
// Localhost on purpose, like the camp-email cron: the public hostname is behind
// Cloudflare, which answers curl with a bot challenge.
//
// Safe to run twice over. The unique index on (coach_id, external_id) is what
// actually stops a message appearing in a camp thread twice; this route only
// has to not fall over.
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!discordConfigured()) return NextResponse.json({ ok: true, skipped: 'discord not configured' })

  const db = serviceClient()
  // Only camps that are actually happening. A channel linked to a camp that
  // finished in March does not need polling every minute for the rest of the
  // year — the coach can still sync it by hand from the camp page.
  const today = new Date().toISOString().slice(0, 10)
  const horizon = new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10)
  const { data } = await db.from('coach_camps')
    .select('id, coach_id, name, discord_channel_id, discord_last_message_id, start_date, end_date')
    .not('discord_channel_id', 'is', null)

  type Row = { id: string; coach_id: string; name: string; discord_channel_id: string | null; discord_last_message_id: string | null; start_date: string | null; end_date: string | null }
  const live = ((data as Row[] | null) ?? []).filter(c => {
    const start = c.start_date || '0000-00-00'
    const end = c.end_date || c.start_date || '9999-12-31'
    // From two weeks before the first day to a week after the last: the busiest
    // chatter is the run-up and the immediate aftermath.
    const after = new Date(`${end}T00:00:00`).getTime() + 7 * 86_400_000
    return start <= horizon && Date.now() <= after && end >= '0000-00-00' && today <= new Date(after).toISOString().slice(0, 10)
  })

  const results: { camp: string; added: number; error?: string }[] = []
  for (const c of live) {
    try {
      const out = await syncCampDiscord(c)
      results.push({ camp: c.name, added: out.added, ...(out.error ? { error: out.error } : {}) })
    } catch (e) {
      results.push({ camp: c.name, added: 0, error: e instanceof Error ? e.message : 'failed' })
    }
  }
  return NextResponse.json({ ok: true, camps: results.length, added: results.reduce((n, r) => n + r.added, 0), results })
}
