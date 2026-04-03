import { NextRequest, NextResponse } from 'next/server'
export async function GET(req: NextRequest) {
  const teamId = req.nextUrl.searchParams.get('teamId')
  if (!teamId) return NextResponse.json({ error: 'teamId required' }, { status: 400 })
  const apiKey = process.env.FOOTBALL_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'no key' }, { status: 503 })
  const [teamRes, statsRes] = await Promise.all([
    fetch(`https://v3.football.api-sports.io/teams?id=${teamId}`, { headers: { 'x-apisports-key': apiKey }, next: { revalidate: 86400 } }),
    fetch(`https://v3.football.api-sports.io/teams/statistics?team=${teamId}&league=39&season=2025`, { headers: { 'x-apisports-key': apiKey }, next: { revalidate: 3600 } }),
  ])
  const [teamData, statsData] = await Promise.all([teamRes.json(), statsRes.json()])
  return NextResponse.json({ team: teamData, stats: statsData })
}
