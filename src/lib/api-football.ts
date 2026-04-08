// ═══════════════════════════════════════════════════════════════════════════════
// API-Football (api-sports.io v3) client with Supabase-backed cache.
// All exported functions return null on any error — never throw.
// API key is read from process.env and is server-side only.
// ═══════════════════════════════════════════════════════════════════════════════

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LeagueTable {
  rank: number
  teamId: number
  teamName: string
  teamLogo: string
  played: number
  won: number
  drawn: number
  lost: number
  gd: number
  points: number
  form: string
  goalsFor: number
  goalsAgainst: number
  homeWon: number
  awayWon: number
  cleanSheets: number
}

export interface ApiFixture {
  id: number
  date: string
  time: string
  homeTeam: string
  awayTeam: string
  homeLogo: string
  awayLogo: string
  venue: string
  status: string
  homeScore: number | null
  awayScore: number | null
  competition: string
}

export interface ApiPlayer {
  id: number
  name: string
  position: string
  photo: string
  goals: number
  assists: number
  rating: number | null
  appearances: number
  nationality: string
}

export interface ApiTeam {
  id: number
  name: string
  logo: string
  venue: string
  country: string
}

// ─── Supabase cache helpers ──────────────────────────────────────────────────

function getSupabase(): SupabaseClient | null {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return null
    return createClient(url, key)
  } catch {
    return null
  }
}

async function readCache<T>(cacheKey: string): Promise<T | null> {
  const supabase = getSupabase()
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from('football_api_cache')
      .select('data, fetched_at, ttl_seconds')
      .eq('cache_key', cacheKey)
      .maybeSingle()
    if (error || !data) return null
    const ageSec = (Date.now() - new Date(data.fetched_at).getTime()) / 1000
    if (ageSec > (data.ttl_seconds ?? 3600)) return null
    return data.data as T
  } catch {
    return null
  }
}

async function writeCache(cacheKey: string, data: unknown, ttlSeconds: number): Promise<void> {
  const supabase = getSupabase()
  if (!supabase) return
  try {
    await supabase
      .from('football_api_cache')
      .upsert(
        { cache_key: cacheKey, data, fetched_at: new Date().toISOString(), ttl_seconds: ttlSeconds },
        { onConflict: 'cache_key' }
      )
  } catch {
    // swallow — cache write failures must not break callers
  }
}

// ─── Raw API fetch helper ────────────────────────────────────────────────────

async function apiFetch(path: string): Promise<any | null> {
  const key = process.env.API_FOOTBALL_KEY
  const base = process.env.API_FOOTBALL_BASE || 'https://v3.football.api-sports.io'
  if (!key) return null
  try {
    const res = await fetch(`${base}${path}`, {
      headers: { 'x-apisports-key': key },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const json = await res.json()
    return json?.response ?? null
  } catch {
    return null
  }
}

// ─── Public functions ────────────────────────────────────────────────────────

export async function getStandings(
  leagueId: number,
  season: number
): Promise<LeagueTable[] | null> {
  const cacheKey = `standings_${leagueId}_${season}`
  try {
    const cached = await readCache<LeagueTable[]>(cacheKey)
    if (cached) return cached

    const raw = await apiFetch(`/standings?league=${leagueId}&season=${season}`)
    if (!raw || !Array.isArray(raw) || raw.length === 0) return null

    const standingsArr: any[] = raw[0]?.league?.standings?.[0] ?? []
    const table: LeagueTable[] = standingsArr.map((row: any) => ({
      rank: row.rank ?? 0,
      teamId: row.team?.id ?? 0,
      teamName: row.team?.name ?? '',
      teamLogo: row.team?.logo ?? '',
      played: row.all?.played ?? 0,
      won: row.all?.win ?? 0,
      drawn: row.all?.draw ?? 0,
      lost: row.all?.lose ?? 0,
      gd: row.goalsDiff ?? 0,
      points: row.points ?? 0,
      form: row.form ?? '',
      goalsFor: row.all?.goals?.for ?? 0,
      goalsAgainst: row.all?.goals?.against ?? 0,
      homeWon: row.home?.win ?? 0,
      awayWon: row.away?.win ?? 0,
      cleanSheets: 0,
    }))

    await writeCache(cacheKey, table, 3600)
    return table
  } catch (err) {
    console.error(`[api-football] getStandings ${cacheKey} failed:`, err)
    return null
  }
}

export async function getLiveFixtures(
  teamId: number,
  season: number
): Promise<ApiFixture[] | null> {
  const cacheKey = `fixtures_${teamId}_${season}`
  try {
    const cached = await readCache<ApiFixture[]>(cacheKey)
    if (cached) return cached

    const [next, last] = await Promise.all([
      apiFetch(`/fixtures?team=${teamId}&season=${season}&next=10`),
      apiFetch(`/fixtures?team=${teamId}&season=${season}&last=5`),
    ])
    const merged: any[] = [...(Array.isArray(next) ? next : []), ...(Array.isArray(last) ? last : [])]
    if (merged.length === 0) return null

    const seen = new Set<number>()
    const fixtures: ApiFixture[] = []
    for (const f of merged) {
      const id = f.fixture?.id
      if (!id || seen.has(id)) continue
      seen.add(id)
      const iso: string = f.fixture?.date ?? ''
      const [date, timeWithZone] = iso.split('T')
      const time = (timeWithZone ?? '').slice(0, 5)
      fixtures.push({
        id,
        date: date ?? '',
        time,
        homeTeam: f.teams?.home?.name ?? '',
        awayTeam: f.teams?.away?.name ?? '',
        homeLogo: f.teams?.home?.logo ?? '',
        awayLogo: f.teams?.away?.logo ?? '',
        venue: f.fixture?.venue?.name ?? '',
        status: f.fixture?.status?.short ?? '',
        homeScore: f.goals?.home ?? null,
        awayScore: f.goals?.away ?? null,
        competition: f.league?.name ?? '',
      })
    }
    fixtures.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))

    await writeCache(cacheKey, fixtures, 1800)
    return fixtures
  } catch (err) {
    console.error(`[api-football] getLiveFixtures ${cacheKey} failed:`, err)
    return null
  }
}

export async function getPlayerStats(
  teamId: number,
  season: number
): Promise<ApiPlayer[] | null> {
  const cacheKey = `players_${teamId}_${season}`
  try {
    const cached = await readCache<ApiPlayer[]>(cacheKey)
    if (cached) return cached

    const raw = await apiFetch(`/players?team=${teamId}&season=${season}`)
    if (!raw || !Array.isArray(raw)) return null

    const players: ApiPlayer[] = raw.map((entry: any) => {
      const p = entry.player ?? {}
      const stats = entry.statistics?.[0] ?? {}
      const ratingStr = stats.games?.rating
      return {
        id: p.id ?? 0,
        name: p.name ?? '',
        position: stats.games?.position ?? '',
        photo: p.photo ?? '',
        goals: stats.goals?.total ?? 0,
        assists: stats.goals?.assists ?? 0,
        rating: ratingStr ? Number(ratingStr) : null,
        appearances: stats.games?.appearences ?? 0,
        nationality: p.nationality ?? '',
      }
    })

    await writeCache(cacheKey, players, 86400)
    return players
  } catch (err) {
    console.error(`[api-football] getPlayerStats ${cacheKey} failed:`, err)
    return null
  }
}

export async function getTeamInfo(teamId: number): Promise<ApiTeam | null> {
  const cacheKey = `team_${teamId}`
  try {
    const cached = await readCache<ApiTeam>(cacheKey)
    if (cached) return cached

    const raw = await apiFetch(`/teams?id=${teamId}`)
    if (!raw || !Array.isArray(raw) || raw.length === 0) return null

    const entry = raw[0]
    const team: ApiTeam = {
      id: entry.team?.id ?? teamId,
      name: entry.team?.name ?? '',
      logo: entry.team?.logo ?? '',
      venue: entry.venue?.name ?? '',
      country: entry.team?.country ?? '',
    }

    await writeCache(cacheKey, team, 604800)
    return team
  } catch (err) {
    console.error(`[api-football] getTeamInfo ${cacheKey} failed:`, err)
    return null
  }
}
