// Sport Network reference content — the facts behind the Impact portal's
// "PE & School Sport Partnerships Network" tab.
//   GET  → the stored copy if one exists and is newer than the baseline,
//          otherwise the verified baseline in src/data/impact/sport-network.ts
//   POST → "Update": web-searches gov.uk / DfE / Youth Sport Trust, has the
//          model summarise what's current into the same shape, validates it
//          and stores it (impact_reference_content, key 'sport_network').
//
// Mirrors /api/ai/impact for the guards (IP rate limit, daily spend cap,
// pinned model). The search is fixed server-side — domains, tool and prompt
// are not taken from the browser. POST is behind IMPACT_SPORT_NETWORK_REFRESH=on
// and needs the impact_reference_content table (supabase/drafts/210_*.sql).

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getClientIp, checkRateLimit, checkDailyCap, recordSpend, rateLimitedResponse, capReachedResponse } from '@/lib/ai/guards'
import { ALLOWED_MODELS, MAX_OUTPUT_TOKENS } from '@/lib/ai/body-guard'
import { SPORT_NETWORK_BASELINE, type SportNetworkContent } from '@/data/impact/sport-network'

const KEY = 'sport_network'
const ALLOWED_DOMAINS = ['gov.uk', 'youthsporttrust.org']
// One refresh per cooldown regardless of who clicks — bounds search cost.
const COOLDOWN_MS = 6 * 60 * 60 * 1000

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

async function readStored(): Promise<{ content: SportNetworkContent; updatedAt: string } | null> {
  const client = db()
  if (!client) return null
  const { data, error } = await client.from('impact_reference_content').select('content, updated_at').eq('key', KEY).maybeSingle()
  if (error || !data?.content) return null
  return { content: data.content as SportNetworkContent, updatedAt: data.updated_at as string }
}

function newest(stored: SportNetworkContent | null): SportNetworkContent {
  if (stored && stored.updatedAt >= SPORT_NETWORK_BASELINE.updatedAt) return stored
  return SPORT_NETWORK_BASELINE
}

export async function GET() {
  try {
    const stored = await readStored()
    const content = newest(stored?.content ?? null)
    return NextResponse.json({ content, source: content === SPORT_NETWORK_BASELINE ? 'baseline' : 'stored' })
  } catch {
    return NextResponse.json({ content: SPORT_NETWORK_BASELINE, source: 'baseline' })
  }
}

// ─── Validation — only accept the exact shape, plain strings, allowed links ──
const str = (v: unknown, max = 600) => typeof v === 'string' && v.trim().length > 0 && v.length <= max
const okUrl = (v: unknown) => {
  if (typeof v !== 'string') return false
  try {
    const u = new URL(v)
    return u.protocol === 'https:' && ALLOWED_DOMAINS.some(d => u.hostname === d || u.hostname.endsWith(`.${d}`))
  } catch { return false }
}

function validate(x: unknown): SportNetworkContent | null {
  const c = x as SportNetworkContent
  if (!c || typeof c !== 'object') return null
  if (!c.hero || !str(c.hero.kicker, 80) || !str(c.hero.title, 160) || !str(c.hero.body, 700)) return null
  if (!Array.isArray(c.keyFacts) || c.keyFacts.length < 1 || c.keyFacts.length > 8 || !c.keyFacts.every(f => str(f?.title, 120) && str(f?.body, 500))) return null
  if (!c.premium || !str(c.premium.title, 120) || !Array.isArray(c.premium.rows) || c.premium.rows.length > 12 || !c.premium.rows.every(r => Array.isArray(r) && r.length === 2 && str(r[0], 120) && str(r[1], 160))) return null
  if (!Array.isArray(c.timeline) || c.timeline.length > 10 || !c.timeline.every(t => str(t?.when, 40) && str(t?.label, 200) && typeof t?.done === 'boolean')) return null
  if (!Array.isArray(c.guidance) || c.guidance.length > 8 || !c.guidance.every(g => str(g?.title, 200) && str(g?.source, 80) && str(g?.date, 40) && okUrl(g?.url))) return null
  if (!str(c.footnote, 500)) return null
  if (!Array.isArray(c.sources) || c.sources.length < 1 || !c.sources.every(s => str(s?.title, 200) && okUrl(s?.url))) return null
  return {
    updatedAt: new Date().toISOString().slice(0, 10),
    hero: c.hero, keyFacts: c.keyFacts, premium: c.premium, timeline: c.timeline,
    guidance: c.guidance, footnote: c.footnote, sources: c.sources,
  }
}

export async function POST(req: NextRequest) {
  if (process.env.IMPACT_SPORT_NETWORK_REFRESH !== 'on') {
    return NextResponse.json({
      error: 'Sport Network refresh is not enabled',
      needs: 'Apply supabase/drafts/210_impact_reference_content.sql, then set IMPACT_SPORT_NETWORK_REFRESH=on (uses the existing ANTHROPIC_API_KEY + SUPABASE_SERVICE_ROLE_KEY).',
    }, { status: 501 })
  }
  const client = db()
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!client || !apiKey) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })

  try {
    const stored = await readStored()
    if (stored && Date.now() - new Date(stored.updatedAt).getTime() < COOLDOWN_MS) {
      return NextResponse.json({ content: newest(stored.content), source: 'stored', refreshed: false, note: 'Checked recently — showing the latest stored update.' })
    }

    const ip = getClientIp(req)
    const rl = checkRateLimit(ip)
    if (!rl.ok) return rateLimitedResponse(rl.retryInSec)
    const cap = checkDailyCap()
    if (!cap.ok) return capReachedResponse(cap.spent)

    const current = newest(stored?.content ?? null)
    const today = new Date().toISOString().slice(0, 10)
    const prompt = `Today is ${today}. You maintain a factual reference panel for English primary/secondary schools about the PE & School Sport Partnerships Network and the PE & Sport Premium.

Search GOV.UK (DfE: PE and sport premium conditions of grant, PE and School Sport Partnerships Network announcements) and the Youth Sport Trust for the CURRENT position. Then return the panel below, corrected and updated to what is current today. Keep every statement factual and sourced; do not speculate; remove anything no longer true; keep the same tone (short, plain English, UK spelling, £ amounts as written by DfE).

Current panel (JSON):
${JSON.stringify(current)}

Return ONLY a JSON object with exactly these keys: hero {kicker,title,body}, keyFacts [{title,body}] (3-6 items), premium {title, rows [[label,value]]}, timeline [{when,label,done}] (done = date has passed), guidance [{title,source,date,url}], footnote, sources [{title,url}]. Every url must be https on gov.uk or youthsporttrust.org. No markdown, no commentary — JSON only.`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-beta': 'web-search-20250305' },
      body: JSON.stringify({
        model: [...ALLOWED_MODELS][0],
        max_tokens: MAX_OUTPUT_TOKENS,
        tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 4, allowed_domains: ALLOWED_DOMAINS }],
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    const data = await res.json()
    if (data?.usage?.input_tokens != null && data?.usage?.output_tokens != null) {
      recordSpend(data.usage.input_tokens, data.usage.output_tokens, data.model, 'impact')
    }
    if (!res.ok) return NextResponse.json({ error: 'Update failed — showing the last verified content', content: current }, { status: 502 })

    const text: string = (data.content ?? []).filter((b: { type?: string }) => b.type === 'text').map((b: { text?: string }) => b.text ?? '').join('')
    const json = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)
    let parsed: unknown = null
    try { parsed = JSON.parse(json) } catch { /* handled below */ }
    const next = validate(parsed)
    if (!next) return NextResponse.json({ error: 'Update returned an unexpected format — kept the last verified content', content: current }, { status: 502 })

    const { error } = await client.from('impact_reference_content').upsert({ key: KEY, content: next, updated_at: new Date().toISOString() })
    if (error) return NextResponse.json({ error: 'Could not store the update', content: next }, { status: 500 })
    return NextResponse.json({ content: next, source: 'stored', refreshed: true })
  } catch {
    return NextResponse.json({ error: 'Update failed', content: SPORT_NETWORK_BASELINE }, { status: 500 })
  }
}
