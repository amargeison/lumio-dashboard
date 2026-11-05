// Sport Network reference content — the facts behind the Impact portal's
// "PE & School Sport Partnerships Network" tab.
//   GET  → the stored copy if one exists and is newer than the baseline,
//          otherwise the verified baseline in src/data/impact/sport-network.ts
//   POST → "Update": the model reads gov.uk / DfE / Youth Sport Trust and cites
//          every item; lib/impact/sport-network-rules.ts fetches those pages
//          and keeps only what they support, then it's stored
//          (impact_reference_content, key 'sport_network'). The version it
//          replaces is kept under 'sport_network_previous'.
//   POST { "rollback": true } → swaps those two rows, so a bad refresh can be
//          reverted, and a rollback undone the same way.
//
// POST needs a signed-in Impact HQ: this is one record shared by every portal,
// and each refresh spends money. Mirrors /api/ai/impact for the other guards
// (IP rate limit, daily spend cap, pinned model). The search is fixed
// server-side — domains, tool and prompt are not taken from the browser. POST
// is behind IMPACT_SPORT_NETWORK_REFRESH=on and needs the
// impact_reference_content table (migration 210).

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getClientIp, checkRateLimit, checkDailyCap, recordSpend, rateLimitedResponse, capReachedResponse } from '@/lib/ai/guards'
import { ALLOWED_MODELS } from '@/lib/ai/body-guard'
import { SPORT_NETWORK_BASELINE, type SportNetworkContent } from '@/data/impact/sport-network'
import { impactHq } from '@/lib/impact/import-auth'
import { ALLOWED_DOMAINS, buildPanel, citedUrls, fetchPages, refreshPrompt, type RawPanel } from '@/lib/impact/sport-network-rules'
import { rateLimit } from '@/lib/rate-limit'

const KEY = 'sport_network'
const PREVIOUS_KEY = 'sport_network_previous'
// One refresh per cooldown regardless of who clicks — bounds search cost.
const COOLDOWN_MS = 6 * 60 * 60 * 1000
// The cooldown only starts on success, so failed attempts need their own limit.
const ATTEMPTS_PER_HOUR = 6
// The whole panel comes back as JSON, which doesn't fit the 1,500-token ceiling
// the chat routes use. Cut off part-way, it would fail validation every time.
const MAX_REFRESH_TOKENS = 12000
const UPSTREAM_TIMEOUT_MS = 280_000
// The API pauses long server-tool runs and expects the turn to be sent back.
const MAX_TURNS = 4
const KEEP_ALIVE_MS = 15_000

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

async function readStored(key = KEY): Promise<{ content: SportNetworkContent; updatedAt: string } | null> {
  const client = db()
  if (!client) return null
  const { data, error } = await client.from('impact_reference_content').select('content, updated_at').eq('key', key).maybeSingle()
  if (error || !data?.content) return null
  return { content: data.content as SportNetworkContent, updatedAt: data.updated_at as string }
}

function newest(stored: SportNetworkContent | null): SportNetworkContent {
  if (stored && stored.updatedAt >= SPORT_NETWORK_BASELINE.updatedAt) return stored
  return SPORT_NETWORK_BASELINE
}

// Every failed refresh answers the same way: the last good content, and why it's
// still showing, so the panel can never go blank. Sent as a 200 on purpose: the
// edge in front of the app swaps a 502 for its own HTML page, which would lose
// this message.
const keptLastGood = (current: SportNetworkContent) => ({
  refreshed: false,
  error: `Couldn’t refresh — still showing the version last updated ${new Date(current.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
  content: current,
})

export async function GET() {
  try {
    const stored = await readStored()
    const content = newest(stored?.content ?? null)
    return NextResponse.json({ content, source: content === SPORT_NETWORK_BASELINE ? 'baseline' : 'stored' })
  } catch {
    return NextResponse.json({ content: SPORT_NETWORK_BASELINE, source: 'baseline' })
  }
}

export async function POST(req: NextRequest) {
  if (process.env.IMPACT_SPORT_NETWORK_REFRESH !== 'on') {
    return NextResponse.json({
      error: 'Sport Network refresh is not enabled',
      needs: 'Set IMPACT_SPORT_NETWORK_REFRESH=on (uses the existing ANTHROPIC_API_KEY + SUPABASE_SERVICE_ROLE_KEY).',
    }, { status: 501 })
  }
  const auth = await impactHq('refresh the Sport Network')
  if (auth instanceof NextResponse) return auth
  const client = db()
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!client || !apiKey) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })

  const body = (await req.json().catch(() => ({}))) as { rollback?: unknown; force?: unknown }
  if (body.rollback === true) {
    const [now, before] = await Promise.all([readStored(), readStored(PREVIOUS_KEY)])
    if (!now || !before) return NextResponse.json({ error: 'There’s no earlier version to go back to.' }, { status: 409 })
    // One statement, so it can't stop half-way with the same version in both rows.
    const { error } = await client.from('impact_reference_content').upsert([
      { key: KEY, content: before.content, updated_at: before.updatedAt },
      { key: PREVIOUS_KEY, content: now.content, updated_at: now.updatedAt },
    ])
    if (error) return NextResponse.json(keptLastGood(newest(now.content)))
    console.log('[impact/sport-network] rolled back', JSON.stringify({ hq: auth.user.id, to: before.updatedAt }))
    return NextResponse.json({ content: newest(before.content), source: 'stored', rolledBack: true })
  }

  const stored = await readStored()
  const current = newest(stored?.content ?? null)
  // The cooldown override is for Lumio staff only: the ids are set on the server.
  const admins = (process.env.IMPACT_SPORT_NETWORK_ADMIN_IDS ?? '').split(',').map(s => s.trim())
  const forced = body.force === true && admins.includes(auth.user.id)
  if (!forced && stored && Date.now() - new Date(stored.updatedAt).getTime() < COOLDOWN_MS) {
    return NextResponse.json({ content: current, source: 'stored', refreshed: false, note: 'Checked recently — showing the latest stored update.' })
  }
  const attempts = rateLimit('impact-sport-network-refresh', ATTEMPTS_PER_HOUR, 60 * 60_000)
  if (!attempts.ok) return rateLimitedResponse(attempts.retryAfterSeconds)
  const rl = checkRateLimit(getClientIp(req))
  if (!rl.ok) return rateLimitedResponse(rl.retryInSec)
  const cap = checkDailyCap()
  if (!cap.ok) return capReachedResponse(cap.spent)

  // A refresh can outlast the edge's 100-second limit on a silent response.
  // Leading spaces keep it open and are still valid JSON when the body is read.
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(' '))
      const beat = setInterval(() => controller.enqueue(encoder.encode(' ')), KEEP_ALIVE_MS)
      const result = await refresh(client, apiKey, auth.user.id, stored?.updatedAt ?? null, current)
      clearInterval(beat)
      controller.enqueue(encoder.encode(JSON.stringify(result)))
      controller.close()
    },
  })
  return new Response(stream, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' } })
}

async function refresh(client: NonNullable<ReturnType<typeof db>>, apiKey: string, hqId: string, storedAt: string | null, current: SportNetworkContent) {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const signal = AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
    const messages: { role: string; content: unknown }[] = [{ role: 'user', content: refreshPrompt(today) }]
    let data: { content?: { type?: string; text?: string }[]; stop_reason?: string; usage?: { input_tokens?: number; output_tokens?: number }; model?: string; error?: { type?: string } } = {}
    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal,
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: [...ALLOWED_MODELS][0],
          max_tokens: MAX_REFRESH_TOKENS,
          tools: [
            // The basic versions: the _20260209 pair ran past four minutes here.
            { type: 'web_search_20250305', name: 'web_search', max_uses: 3, allowed_domains: ALLOWED_DOMAINS },
            { type: 'web_fetch_20250910', name: 'web_fetch', max_uses: 4, max_content_tokens: 12000, allowed_domains: ALLOWED_DOMAINS },
          ],
          messages,
        }),
      })
      data = await res.json()
      if (data?.usage?.input_tokens != null && data?.usage?.output_tokens != null) {
        recordSpend(data.usage.input_tokens, data.usage.output_tokens, data.model ?? '', 'impact')
      }
      if (!res.ok) {
        console.error('[impact/sport-network] upstream failed', res.status, data?.error?.type)
        return keptLastGood(current)
      }
      if (data.stop_reason !== 'pause_turn') break
      messages.push({ role: 'assistant', content: data.content })
    }

    const text = (data.content ?? []).filter(b => b.type === 'text').map(b => b.text ?? '').join('')
    let raw: RawPanel | null = null
    try { raw = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)) as RawPanel } catch { /* handled below */ }
    if (!raw || typeof raw !== 'object') {
      console.error('[impact/sport-network] unreadable model output', JSON.stringify({ stop: data?.stop_reason, chars: text.length }))
      return keptLastGood(current)
    }
    const pages = await fetchPages(citedUrls(raw))
    const { content: next, dropped } = buildPanel(raw, pages, current, today)
    if (!next) {
      console.error('[impact/sport-network] too little passed the source check', JSON.stringify({ pages: pages.size, dropped: dropped.length }))
      return { ...keptLastGood(current), dropped }
    }

    // Keep what's being replaced first: nothing is overwritten without a way back.
    const { error: keepError } = await client.from('impact_reference_content').upsert({
      key: PREVIOUS_KEY, content: current, updated_at: storedAt ?? new Date(current.updatedAt).toISOString(),
    })
    if (keepError) {
      console.error('[impact/sport-network] could not keep the previous version', keepError.message)
      return keptLastGood(current)
    }
    const { error } = await client.from('impact_reference_content').upsert({ key: KEY, content: next, updated_at: new Date().toISOString() })
    if (error) {
      console.error('[impact/sport-network] store failed', error.message)
      return keptLastGood(current)
    }
    console.log('[impact/sport-network] refreshed', JSON.stringify({ hq: hqId, from: current.updatedAt, to: next.updatedAt, pages: pages.size, dropped: dropped.length }))
    return { content: next, source: 'stored', refreshed: true, dropped }
  } catch (e) {
    console.error('[impact/sport-network] refresh failed', e instanceof Error ? e.message : e)
    return keptLastGood(current)
  }
}
