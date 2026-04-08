import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getStandings } from '@/lib/api-football'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const clubId = sp.get('clubId')
    const leagueId = Number(sp.get('leagueId') ?? 40)
    const season = Number(sp.get('season') ?? 2024)
    if (!clubId) return NextResponse.json(null)

    const supabase = getSupabase()
    if (!supabase) return NextResponse.json(null)

    const [{ data: benchmarks }, { data: comparisons }] = await Promise.all([
      supabase.from('football_comparison_benchmarks').select('*').eq('league_id', leagueId).eq('season', season).maybeSingle(),
      supabase.from('football_club_comparison_data').select('*').eq('club_id', clubId).order('created_at', { ascending: false }),
    ])

    const standings = await getStandings(leagueId, season)

    return NextResponse.json({
      benchmarks: benchmarks ?? null,
      comparisons: comparisons ?? [],
      standings: standings ?? [],
    })
  } catch (err) {
    console.error('[comparison GET]', err)
    return NextResponse.json(null)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body || !body.clubId || !body.teamId || !body.teamName) {
      return NextResponse.json({ success: false, error: 'clubId, teamId and teamName required' }, { status: 400 })
    }
    const supabase = getSupabase()
    if (!supabase) return NextResponse.json({ success: false, error: 'Supabase not configured' }, { status: 503 })

    const leagueId = Number(body.leagueId ?? 40)
    const season = Number(body.season ?? 2024)
    const standings = await getStandings(leagueId, season)
    const teamRow = (standings ?? []).find((r) => r.teamId === Number(body.teamId))

    const row = {
      club_id: body.clubId,
      compared_team_id: Number(body.teamId),
      compared_team_name: body.teamName,
      compared_team_logo: teamRow?.teamLogo ?? null,
      season,
      league_id: leagueId,
      rank: teamRow?.rank ?? null,
      points: teamRow?.points ?? null,
      played: teamRow?.played ?? null,
      won: teamRow?.won ?? null,
      drawn: teamRow?.drawn ?? null,
      lost: teamRow?.lost ?? null,
      goals_for: teamRow?.goalsFor ?? null,
      goals_against: teamRow?.goalsAgainst ?? null,
      goal_difference: teamRow?.gd ?? null,
      form: teamRow?.form ?? null,
      home_won: teamRow?.homeWon ?? null,
      away_won: teamRow?.awayWon ?? null,
      clean_sheets: teamRow?.cleanSheets ?? null,
      fetched_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('football_club_comparison_data')
      .upsert(row, { onConflict: 'club_id,compared_team_id' })
      .select('*')
      .single()

    if (error) {
      console.error('[comparison POST]', error)
      return NextResponse.json({ success: false, error: 'Upsert failed' }, { status: 500 })
    }
    return NextResponse.json({ success: true, comparisonData: data })
  } catch (err) {
    console.error('[comparison POST]', err)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body || !body.clubId || !body.comparedTeamId) {
      return NextResponse.json({ success: false, error: 'clubId and comparedTeamId required' }, { status: 400 })
    }
    const supabase = getSupabase()
    if (!supabase) return NextResponse.json({ success: false, error: 'Supabase not configured' }, { status: 503 })

    const { error } = await supabase
      .from('football_club_comparison_data')
      .delete()
      .eq('club_id', body.clubId)
      .eq('compared_team_id', Number(body.comparedTeamId))

    if (error) return NextResponse.json({ success: false, error: 'Delete failed' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[comparison DELETE]', err)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
