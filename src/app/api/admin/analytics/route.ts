import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function validateAdmin(req: NextRequest) {
  const token = req.headers.get('x-admin-token')
  if (!token) return null
  const supabase = getSupabase()
  const { data } = await supabase
    .from('admin_sessions')
    .select('admin_id')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()
  return data
}

type Row = {
  path: string
  session_hash: string
  created_at: string
  is_demo: boolean | null
  sport: string | null
  referrer_host: string | null
  country: string | null
  device_type: string | null
  browser: string | null
  bot: boolean
  full_url?: string | null
}

// Lumio Tennis Coach is a product of its own that happens to live under
// /tennis/coach (the portal) and /tennis-coach (its marketing page), so the
// `sport` column files all of it under "tennis". These two filters pull them
// apart by path — which also works for every page view already recorded.
//   tennis-coach → the coach product only
//   tennis       → the tennis pro portal, without the coach product
function applySport<Q>(q: Q, sport: string | null): Q {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b = q as any
  if (!sport || sport === 'all') return q
  if (sport === 'tennis-coach') return b.or('path.ilike./tennis/coach%,path.ilike./tennis-coach%')
  if (sport === 'tennis') return b.eq('sport', 'tennis').not('path', 'ilike', '/tennis/coach%')
  return b.eq('sport', sport)
}

/** "?utm_source=instagram&utm_campaign=launch" on the landing page → "instagram · launch". */
function taggedSource(fullUrl: string | null | undefined): string | null {
  if (!fullUrl || !fullUrl.includes('utm_')) return null
  try {
    const q = new URL(fullUrl).searchParams
    const src = (q.get('utm_source') || '').trim().toLowerCase().slice(0, 40)
    if (!src) return null
    const camp = (q.get('utm_campaign') || '').trim().toLowerCase().slice(0, 40)
    return camp ? `${src} · ${camp}` : src
  } catch { return null }
}

function resolvePeriod(period: string, startRaw: string | null, endRaw: string | null): { start: Date; end: Date } {
  const end = endRaw ? new Date(endRaw) : new Date()
  if (startRaw) return { start: new Date(startRaw), end }
  const start = new Date(end)
  switch (period) {
    case '1d':  start.setDate(start.getDate() - 1); break
    case '7d':  start.setDate(start.getDate() - 7); break
    case '30d': start.setDate(start.getDate() - 30); break
    case '90d': start.setDate(start.getDate() - 90); break
    default:    start.setDate(start.getDate() - 7)
  }
  return { start, end }
}

function topN<T extends string | null>(rows: Row[], getKey: (r: Row) => T, n = 10): { key: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const r of rows) {
    const k = getKey(r)
    if (!k) continue
    counts.set(k, (counts.get(k) || 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key, count]) => ({ key, count }))
}

function uniqueVisitors(rows: Row[]): number {
  // Session hashes rotate daily (daily salt), so "unique visitors" over a
  // multi-day window is really visitor-days. Good enough for v1.
  const s = new Set<string>()
  for (const r of rows) s.add(r.session_hash)
  return s.size
}

function summarise(rows: Row[]): { views: number; unique_visitors: number; demo_views: number; founder_views: number; top_sport: string | null } {
  const demo = rows.filter(r => r.is_demo === true).length
  // founder = sport portal views that are not demo (is_demo=false, sport set)
  const founder = rows.filter(r => r.sport && r.is_demo === false).length
  const sportCounts = topN(rows, r => r.sport, 1)
  return {
    views: rows.length,
    unique_visitors: uniqueVisitors(rows),
    demo_views: demo,
    founder_views: founder,
    top_sport: sportCounts[0]?.key || null,
  }
}

function filterInRange(rows: Row[], start: Date, end: Date): Row[] {
  const s = start.getTime(), e = end.getTime()
  return rows.filter(r => {
    const t = new Date(r.created_at).getTime()
    return t >= s && t <= e
  })
}

function dailySeries(rows: Row[], start: Date, end: Date): { day: string; views: number; unique_visitors: number }[] {
  // Bucket by UTC date. Pre-seed every day in the window so the chart has no gaps.
  const buckets = new Map<string, { views: number; sessions: Set<string> }>()
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()))
  const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()))
  while (cursor.getTime() <= last.getTime()) {
    buckets.set(cursor.toISOString().slice(0, 10), { views: 0, sessions: new Set() })
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  for (const r of rows) {
    const d = r.created_at.slice(0, 10)
    const b = buckets.get(d)
    if (!b) continue
    b.views++
    b.sessions.add(r.session_hash)
  }
  return [...buckets.entries()].map(([day, b]) => ({ day, views: b.views, unique_visitors: b.sessions.size }))
}

export async function GET(req: NextRequest) {
  if (!await validateAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const qs = req.nextUrl.searchParams
  const period = qs.get('period') || '7d'
  const sport = qs.get('sport')
  const excludeAdmin = qs.get('exclude_admin') !== '0'
  const excludeBots = qs.get('exclude_bots') !== '0'
  const { start, end } = resolvePeriod(period, qs.get('start'), qs.get('end'))

  const supabase = getSupabase()

  // Raw row fetch for the selected period (plus a 30-day trailing window so
  // we can compute today/yesterday/week/month tiles without a second query
  // when the selected period is shorter).
  const trailing = new Date(end)
  trailing.setDate(trailing.getDate() - 30)
  const windowStart = start.getTime() < trailing.getTime() ? start : trailing

  let q = supabase
    .from('page_views')
    .select('path, session_hash, created_at, is_demo, sport, referrer_host, country, device_type, browser, bot, full_url')
    .gte('created_at', windowStart.toISOString())
    .lte('created_at', end.toISOString())
    .order('created_at', { ascending: false })
    .limit(50000)

  q = applySport(q, sport)
  if (excludeBots) q = q.eq('bot', false)
  if (excludeAdmin) q = q.not('path', 'ilike', '/admin%').not('path', 'ilike', '/sports-admin%')

  const { data, error } = await q
  if (error) {
    console.error('[admin/analytics] query error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  const rows: Row[] = (data || []) as Row[]

  // All-time page views — cheap count, honoring the same filters.
  let totalCountQ = supabase.from('page_views').select('*', { count: 'exact', head: true })
  totalCountQ = applySport(totalCountQ, sport)
  if (excludeBots) totalCountQ = totalCountQ.eq('bot', false)
  if (excludeAdmin) totalCountQ = totalCountQ.not('path', 'ilike', '/admin%').not('path', 'ilike', '/sports-admin%')
  const { count: allTimeCount } = await totalCountQ

  // Tiles — rolling windows anchored to `end`.
  const now = end
  const todayStart = new Date(now); todayStart.setUTCHours(0, 0, 0, 0)
  const yesterdayStart = new Date(todayStart); yesterdayStart.setUTCDate(yesterdayStart.getUTCDate() - 1)
  const weekStart = new Date(now); weekStart.setDate(weekStart.getDate() - 7)
  const monthStart = new Date(now); monthStart.setDate(monthStart.getDate() - 30)

  const tiles = {
    today:     summarise(filterInRange(rows, todayStart, now)),
    yesterday: summarise(filterInRange(rows, yesterdayStart, todayStart)),
    week:      summarise(filterInRange(rows, weekStart, now)),
    month:     summarise(filterInRange(rows, monthStart, now)),
    all_time:  { views: allTimeCount || 0 },
  }

  // Period-scoped stats
  const periodRows = filterInRange(rows, start, end)
  const summary = summarise(periodRows)

  const daily = dailySeries(periodRows, start, end)

  const topPaths     = topN(periodRows, r => r.path, 10)
  const topReferrers = topN(periodRows, r => r.referrer_host || 'direct', 10)
  const topCountries = topN(periodRows, r => r.country, 10)
  // Visits that arrived on a link we tagged (an email button, a social post).
  const topSources   = topN(periodRows, r => taggedSource(r.full_url), 10)
  const devices      = topN(periodRows, r => r.device_type, 10)
  const browsers     = topN(periodRows, r => r.browser, 10)

  // Bot % — computed against a NO-bot-filter slice of the window, so the
  // percentage reflects reality rather than "0% because we filtered them out".
  let botSliceQ = supabase
    .from('page_views')
    .select('bot', { count: 'exact', head: true })
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())
    .eq('bot', true)
  botSliceQ = applySport(botSliceQ, sport)
  if (excludeAdmin) botSliceQ = botSliceQ.not('path', 'ilike', '/admin%').not('path', 'ilike', '/sports-admin%')
  const { count: botCount } = await botSliceQ

  let totalSliceQ = supabase
    .from('page_views')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString())
  totalSliceQ = applySport(totalSliceQ, sport)
  if (excludeAdmin) totalSliceQ = totalSliceQ.not('path', 'ilike', '/admin%').not('path', 'ilike', '/sports-admin%')
  const { count: totalSlice } = await totalSliceQ

  const botPct = totalSlice && totalSlice > 0 ? Math.round(1000 * (botCount || 0) / totalSlice) / 10 : 0

  return NextResponse.json({
    period: { start: start.toISOString(), end: end.toISOString() },
    filters: { sport: sport || 'all', exclude_admin: excludeAdmin, exclude_bots: excludeBots },
    summary,
    tiles,
    daily,
    topPaths,
    topReferrers,
    topCountries,
    topSources,
    devices,
    browsers,
    botPct,
    rowCapHit: rows.length >= 50000,
  })
}
