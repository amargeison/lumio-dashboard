import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

const STATSPORTS_BASE = 'https://api.statsports.com/v1'

async function getStatsportsKey(supabase: ReturnType<typeof getSupabase>, clubId: string) {
  const { data } = await supabase
    .from('integration_tokens')
    .select('access_token')
    .eq('business_id', clubId)
    .eq('provider', 'statsports')
    .maybeSingle()
  return data?.access_token || null
}

export async function GET(req: NextRequest) {
  const supabase = getSupabase()
  const clubId = req.nextUrl.searchParams.get('club_id')
  if (!clubId) return NextResponse.json({ error: 'club_id required' }, { status: 400 })

  const apiKey = await getStatsportsKey(supabase, clubId)
  if (!apiKey) return NextResponse.json({ error: 'STATSports not connected', connected: false }, { status: 404 })

  const headers = { 'x-api-key': apiKey, Accept: 'application/json' }

  try {
    const res = await fetch(`${STATSPORTS_BASE}/sessions?limit=20&sort=-date`, { headers })
    if (!res.ok) return NextResponse.json({ error: 'STATSports API error', status: res.status }, { status: 502 })

    const data = await res.json()
    const sessions = (data.data || data.sessions || []).map((s: any) => ({
      id: s.id || s.session_id,
      name: s.name || s.session_name,
      date: s.date || s.session_date,
      session_type: s.type === 'match' || s.name?.toLowerCase().includes('match') ? 'match' : 'training',
      player_count: s.player_count || s.athletes?.length || 0,
    }))

    return NextResponse.json({ connected: true, provider: 'statsports', sessions })
  } catch (err) {
    console.error('[statsports/sessions]', err)
    return NextResponse.json({ error: 'Failed to fetch STATSports sessions', connected: true }, { status: 502 })
  }
}

// STATSports → Lumio metric name mapping
function mapStatsportsMetrics(athlete: any) {
  return {
    player_name: athlete.player_name || athlete.name || 'Unknown',
    player_id: String(athlete.player_id || athlete.id || ''),
    total_distance: athlete.total_distance_km ?? (athlete.total_distance != null ? Number((athlete.total_distance / 1000).toFixed(2)) : null),
    high_speed_distance: athlete.hsr_distance ?? athlete.high_speed_running ?? null,
    sprint_distance: athlete.sprint_distance ?? athlete.speed_zone_6 ?? null,
    max_speed: athlete.max_speed_kmh ?? athlete.max_speed ?? null,
    player_load: athlete.dynamic_stress_load ?? athlete.player_load ?? null,
    accelerations: athlete.high_accelerations ?? athlete.accel_count ?? null,
    decelerations: athlete.high_decelerations ?? athlete.decel_count ?? null,
    duration_mins: athlete.session_duration_mins ?? (athlete.duration != null ? Math.round(athlete.duration / 60) : null),
    heart_rate_avg: athlete.avg_hr ?? athlete.heart_rate_avg ?? null,
    heart_rate_max: athlete.max_hr ?? athlete.heart_rate_max ?? null,
  }
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  const body = await req.json()
  const { club_id, session_id } = body
  if (!club_id || !session_id) return NextResponse.json({ error: 'club_id and session_id required' }, { status: 400 })

  const apiKey = await getStatsportsKey(supabase, club_id)
  if (!apiKey) return NextResponse.json({ error: 'STATSports not connected' }, { status: 404 })

  const headers = { 'x-api-key': apiKey, Accept: 'application/json' }

  try {
    // Fetch session details
    const sessionRes = await fetch(`${STATSPORTS_BASE}/sessions/${session_id}`, { headers })
    if (!sessionRes.ok) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    const sessionData = await sessionRes.json()
    const session = sessionData.data || sessionData

    // Fetch per-player data
    const athleteRes = await fetch(`${STATSPORTS_BASE}/sessions/${session_id}/athletes`, { headers })
    if (!athleteRes.ok) return NextResponse.json({ error: 'Failed to fetch athlete data' }, { status: 502 })
    const athleteData = await athleteRes.json()
    const athletes = athleteData.data || athleteData.athletes || []

    const sessionType = session.type === 'match' || session.name?.toLowerCase().includes('match') ? 'match' : 'training'
    const sessionDate = session.date || session.session_date || new Date().toISOString().split('T')[0]

    // Insert session
    const { data: gpsSess, error: sessErr } = await supabase
      .from('gps_sessions')
      .insert({
        football_club_id: club_id,
        session_date: typeof sessionDate === 'string' && sessionDate.includes('T') ? sessionDate.split('T')[0] : sessionDate,
        session_type: sessionType,
        session_name: session.name || session.session_name || `Session ${session_id}`,
        provider: 'statsports',
        raw_data: session,
      })
      .select('id')
      .single()

    if (sessErr) return NextResponse.json({ error: 'Failed to store session', detail: sessErr.message }, { status: 500 })

    // Map and insert player data
    const playerRows = athletes.map((a: any) => ({
      session_id: gpsSess.id,
      ...mapStatsportsMetrics(a),
    }))

    if (playerRows.length > 0) {
      const { error: playerErr } = await supabase.from('gps_player_data').insert(playerRows)
      if (playerErr) console.error('[statsports/stats] player insert error:', playerErr)
    }

    return NextResponse.json({
      connected: true,
      provider: 'statsports',
      session_id: gpsSess.id,
      players_synced: playerRows.length,
      session_name: session.name || session.session_name,
      session_type: sessionType,
    })
  } catch (err) {
    console.error('[statsports/stats]', err)
    return NextResponse.json({ error: 'Failed to sync STATSports data', connected: true }, { status: 502 })
  }
}
