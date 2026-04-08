import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const { playerId } = await params
    const clubId = req.nextUrl.searchParams.get('clubId')

    const supabase = getSupabase()
    if (!supabase) return NextResponse.json(null)

    // Resolve to a real player row by uuid OR by name+clubId fallback
    let player: any = null
    if (UUID_RE.test(playerId)) {
      const { data } = await supabase
        .from('football_players')
        .select('*')
        .eq('id', playerId)
        .maybeSingle()
      player = data
    }
    if (!player && clubId) {
      const decodedName = decodeURIComponent(playerId)
      const { data } = await supabase
        .from('football_players')
        .select('*')
        .eq('club_id', clubId)
        .ilike('name', decodedName)
        .maybeSingle()
      player = data
    }

    if (!player) {
      return NextResponse.json({
        player: null,
        contract: null,
        statsHistory: [],
        injuries: [],
        acwrScore: null,
        gpsHistory: [],
      })
    }

    // Parallel fetches keyed by player.id
    const [contractRes, statsRes, injuriesRes, acwrRes, gpsRes] = await Promise.all([
      supabase.from('football_contracts').select('*').eq('player_id', player.id).maybeSingle(),
      supabase.from('football_player_stats_history').select('*').eq('player_id', player.id).order('season', { ascending: false }),
      supabase.from('football_player_injuries').select('*').eq('player_id', player.id).order('occurred_date', { ascending: false }),
      supabase.from('football_acwr_scores').select('*').eq('club_id', player.club_id).eq('player_name', player.name).order('calculated_at', { ascending: false }).limit(1).maybeSingle(),
      supabase
        .from('gps_player_data')
        .select('total_distance, high_speed_distance, sprint_distance, max_speed, training_load, gps_sessions!inner(session_date, session_type, football_club_id)')
        .ilike('player_name', player.name)
        .eq('gps_sessions.football_club_id', player.club_id)
        .order('created_at', { ascending: false })
        .limit(8),
    ])

    return NextResponse.json({
      player,
      contract: contractRes.data ?? null,
      statsHistory: statsRes.data ?? [],
      injuries: injuriesRes.data ?? [],
      acwrScore: acwrRes.data ?? null,
      gpsHistory: gpsRes.data ?? [],
    })
  } catch (err) {
    console.error('[player profile]', err)
    return NextResponse.json(null)
  }
}
