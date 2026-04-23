import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'node:crypto'

const SPORT_ROOTS = new Set([
  'tennis', 'golf', 'darts', 'boxing', 'cricket', 'rugby',
  'football', 'nonleague', 'grassroots', 'womens',
])

const BOT_RE = /bot|crawler|spider|slurp|preview|headless|googlebot|bingbot|duckduckbot|yandex|baidu|facebookexternalhit|slackbot|twitterbot|linkedinbot|whatsapp|telegrambot|embedly|pingdom|uptime/i

// Rate limit: 60 inserts per session_hash per minute. In-memory (per-process);
// good enough for a single-VPS deployment. Rotates with a stale-entry sweep.
const RATE: Map<string, number[]> = new Map()
const RATE_LIMIT = 60
const RATE_WINDOW_MS = 60_000
function rateOk(key: string): boolean {
  const now = Date.now()
  const hits = (RATE.get(key) || []).filter(t => now - t < RATE_WINDOW_MS)
  if (hits.length >= RATE_LIMIT) {
    RATE.set(key, hits)
    return false
  }
  hits.push(now)
  RATE.set(key, hits)
  // Opportunistic sweep
  if (RATE.size > 5000) {
    for (const [k, v] of RATE) {
      const fresh = v.filter(t => now - t < RATE_WINDOW_MS)
      if (fresh.length === 0) RATE.delete(k)
      else RATE.set(k, fresh)
    }
  }
  return true
}

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

function dailySalt(): string {
  const today = new Date().toISOString().slice(0, 10)
  return createHash('sha256')
    .update(today + (process.env.ANALYTICS_SECRET || 'lumio-dev-salt-change-me'))
    .digest('hex')
    .slice(0, 16)
}

function hashSession(ip: string, userAgent: string): string {
  return createHash('sha256').update(ip + '|' + userAgent + '|' + dailySalt()).digest('hex').slice(0, 16)
}

function parseUA(ua: string): { browser: string; os: string; device_type: string } {
  const u = ua.toLowerCase()
  let browser = 'other'
  if (u.includes('edg/')) browser = 'edge'
  else if (u.includes('chrome/') && !u.includes('chromium')) browser = 'chrome'
  else if (u.includes('firefox/')) browser = 'firefox'
  else if (u.includes('safari/') && !u.includes('chrome')) browser = 'safari'
  else if (u.includes('opera') || u.includes('opr/')) browser = 'opera'

  let os = 'other'
  if (u.includes('windows')) os = 'windows'
  else if (u.includes('android')) os = 'android'
  else if (u.includes('iphone') || u.includes('ipad') || u.includes('ipod')) os = 'ios'
  else if (u.includes('mac os') || u.includes('macintosh')) os = 'macos'
  else if (u.includes('linux')) os = 'linux'

  let device_type: string = 'desktop'
  if (/ipad|tablet/.test(u)) device_type = 'tablet'
  else if (/mobi|iphone|android(?!.*tablet)/.test(u)) device_type = 'mobile'

  return { browser, os, device_type }
}

function parseSportSlug(path: string): { sport: string | null; slug: string | null; is_demo: boolean } {
  const parts = path.split('/').filter(Boolean)
  if (parts.length === 0) return { sport: null, slug: null, is_demo: false }

  // /demo/... or /demo/schools/... → demo landing
  if (parts[0] === 'demo') {
    // /demo/<slug>  or  /demo/schools/<slug>
    const slug = parts[1] === 'schools' ? (parts[2] || null) : (parts[1] || null)
    return { sport: null, slug, is_demo: true }
  }

  // /<sport>/...
  if (SPORT_ROOTS.has(parts[0])) {
    const sport = parts[0]
    const second = parts[1] || null
    // /<sport>/app/...  → founder portal app, not demo, no tenant slug here
    if (second === 'app') return { sport, slug: null, is_demo: false }
    // /<sport>/demo  → demo URL
    if (second === 'demo') return { sport, slug: 'demo', is_demo: true }
    // /<sport>/<tenant-slug> — tenant portal
    return { sport, slug: second, is_demo: false }
  }

  return { sport: null, slug: null, is_demo: false }
}

function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin')
  const host = req.headers.get('host')
  if (!origin) return true // sendBeacon / direct navigation often omit Origin on same-origin
  try {
    const o = new URL(origin).host
    return host != null && o === host
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) {
    return new NextResponse(null, { status: 403 })
  }

  // Body: sendBeacon arrives as text/plain by default; fetch path is JSON.
  let body: {
    path?: string
    fullUrl?: string
    referrer?: string
    screenSize?: string
    durationMs?: number
  }
  try {
    const raw = await req.text()
    body = raw ? JSON.parse(raw) : {}
  } catch {
    return new NextResponse(null, { status: 400 })
  }

  const path = typeof body.path === 'string' ? body.path : null
  if (!path) return new NextResponse(null, { status: 400 })

  const userAgent = req.headers.get('user-agent') || ''
  const xff = req.headers.get('x-forwarded-for') || ''
  const ip = xff.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown'

  const session_hash = hashSession(ip, userAgent)
  if (!rateOk(session_hash)) {
    return new NextResponse(null, { status: 429 })
  }

  const bot = BOT_RE.test(userAgent)
  const { browser, os, device_type } = parseUA(userAgent)
  const { sport, slug, is_demo } = parseSportSlug(path)

  const referrer = typeof body.referrer === 'string' && body.referrer ? body.referrer.slice(0, 2048) : null
  let referrer_host: string | null = null
  if (referrer) {
    try { referrer_host = new URL(referrer).host } catch { /* ignore */ }
  }

  const country = req.headers.get('cf-ipcountry') || req.headers.get('x-country') || null
  const region = req.headers.get('cf-region') || null

  const row = {
    path: path.slice(0, 2048),
    full_url: typeof body.fullUrl === 'string' ? body.fullUrl.slice(0, 2048) : null,
    referrer,
    referrer_host,
    session_hash,
    country,
    region,
    device_type,
    browser,
    os,
    bot,
    sport,
    slug,
    is_demo,
    duration_ms: typeof body.durationMs === 'number' && Number.isFinite(body.durationMs) ? Math.max(0, Math.floor(body.durationMs)) : null,
    screen_size: typeof body.screenSize === 'string' ? body.screenSize.slice(0, 32) : null,
  }

  const supabase = getSupabase()
  const { error } = await supabase.from('page_views').insert(row)
  if (error) {
    console.error('[analytics/pageview] insert error:', error.message)
    return new NextResponse(null, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
