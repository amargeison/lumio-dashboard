import { NextRequest, NextResponse } from 'next/server'
import {
  getStandings,
  getLiveFixtures,
  getPlayerStats,
  getTeamInfo,
} from '@/lib/api-football'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ endpoint: string }> }
) {
  const { endpoint } = await params
  const sp = req.nextUrl.searchParams
  const leagueId = Number(sp.get('leagueId') ?? 0)
  const teamId = Number(sp.get('teamId') ?? 0)
  const season = Number(sp.get('season') ?? 2024)

  switch (endpoint) {
    case 'standings': {
      const data = await getStandings(leagueId, season)
      return NextResponse.json(data)
    }
    case 'fixtures': {
      const data = await getLiveFixtures(teamId, season)
      return NextResponse.json(data)
    }
    case 'players': {
      const data = await getPlayerStats(teamId, season)
      return NextResponse.json(data)
    }
    case 'team': {
      const data = await getTeamInfo(teamId)
      return NextResponse.json(data)
    }
    default:
      return NextResponse.json({ error: `Unknown endpoint: ${endpoint}` }, { status: 404 })
  }
}
