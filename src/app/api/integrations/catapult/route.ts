import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

const CATAPULT_BASE = 'https://connect.catapultsports.com/api/v6'

async function getCatapultToken(supabase: ReturnType<typeof getSupabase>, clubId: string) {
  const { data } = await supabase
    .from('integration_tokens')
    .select('access_token')
    .eq('business_id', clubId)
    .eq('provider', 'catapult')
    .maybeSingle()
  return data?.access_token || null
}

export async function GET(req: NextRequest) {
  const supabase = getSupabase()
  const clubId = req.nextUrl.searchParams.get('club_id')
  if (!clubId) return NextResponse.json({ error: 'club_id required' }, { status: 400 })

  const token = await getCatapultToken(supabase, clubId)
  if (!token) return NextResponse.json({ error: 'Catapult not connected', connected: false }, { status: 404 })

  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' }

  try {
    const res = await fetch(`${CATAPULT_BASE}/activities?limit=20&order=desc`, { headers })
    if (!res.ok) return NextResponse.json({ error: 'Catapult API error', status: res.status }, { status: 502 })

    const data = await res.json()
    const activities = (data.data || data.activities || []).map((a: any) => ({
      id: a.id,
      name: a.name,
      start_time: a.start_time,
      end_time: a.end_time,
      activity_type: a.tags?.includes('match') || a.name?.toLowerCase().includes('match') ? 'match' : 'training',
      athlete_count: a.athlete_count || 0,
    }))

    return NextResponse.json({ connected: true, provider: 'catapult', activities })
  } catch (err) {
    console.error('[catapult/activities]', err)
    return NextResponse.json({ error: 'Failed to fetch Catapult activities', connected: true }, { status: 502 })
  }
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  const body = await req.json()
  const { club_id, activity_id } = body
  if (!club_id || !activity_id) return NextResponse.json({ error: 'club_id and activity_id required' }, { status: 400 })

  const token = await getCatapultToken(supabase, club_id)
  if (!token) return NextResponse.json({ error: 'Catapult not connected' }, { status: 404 })

  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' }

  try {
    // Fetch activity details
    const activityRes = await fetch(`${CATAPULT_BASE}/activities/${activity_id}`, { headers })
    if (!activityRes.ok) return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    const activityData = await activityRes.json()
    const activity = activityData.data || activityData

    // Fetch per-athlete stats for this activity
    const statsRes = await fetch(`${CATAPULT_BASE}/activities/${activity_id}/stats/athletes`, { headers })
    if (!statsRes.ok) return NextResponse.json({ error: 'Failed to fetch athlete stats' }, { status: 502 })
    const statsData = await statsRes.json()
    const athletes = statsData.data || statsData.athletes || []

    const sessionType = activity.tags?.includes('match') || activity.name?.toLowerCase().includes('match') ? 'match' : 'training'

    // Insert session
    const { data: session, error: sessionErr } = await supabase
      .from('gps_sessions')
      .insert({
        football_club_id: club_id,
        session_date: activity.start_time ? new Date(activity.start_time).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        session_type: sessionType,
        session_name: activity.name || `Session ${activity_id}`,
        provider: 'catapult',
        raw_data: activity,
      })
      .select('id')
      .single()

    if (sessionErr) return NextResponse.json({ error: 'Failed to store session', detail: sessionErr.message }, { status: 500 })

    // Map and insert player data
    const playerRows = athletes.map((a: any) => ({
      session_id: session.id,
      player_name: a.athlete_name || a.name || 'Unknown',
      player_id: String(a.athlete_id || a.id || ''),
      total_distance: a.total_distance != null ? Number((a.total_distance / 1000).toFixed(2)) : null,
      high_speed_distance: a.velocity_band6_total_distance != null ? Number(a.velocity_band6_total_distance.toFixed(0)) : null,
      sprint_distance: a.velocity_band5_total_distance != null ? Number(a.velocity_band5_total_distance.toFixed(0)) : null,
      max_speed: a.max_vel != null ? Number((a.max_vel * 3.6).toFixed(1)) : null, // m/s → km/h
      player_load: a.total_player_load != null ? Number(a.total_player_load.toFixed(1)) : null,
      accelerations: a.accel_efforts ?? a.acceleration_efforts ?? null,
      decelerations: a.decel_efforts ?? a.deceleration_efforts ?? null,
      duration_mins: a.total_duration != null ? Math.round(a.total_duration / 60) : null,
      heart_rate_avg: a.heart_rate_avg ?? null,
      heart_rate_max: a.heart_rate_max ?? null,
    }))

    if (playerRows.length > 0) {
      const { error: playerErr } = await supabase.from('gps_player_data').insert(playerRows)
      if (playerErr) console.error('[catapult/stats] player insert error:', playerErr)
    }

    return NextResponse.json({
      connected: true,
      provider: 'catapult',
      session_id: session.id,
      players_synced: playerRows.length,
      session_name: activity.name,
      session_type: sessionType,
    })
  } catch (err) {
    console.error('[catapult/stats]', err)
    return NextResponse.json({ error: 'Failed to sync Catapult data', connected: true }, { status: 502 })
  }
}
