import { NextRequest, NextResponse } from 'next/server'
export async function GET(req: NextRequest) {
  const leagueId = req.nextUrl.searchParams.get('leagueId')
  const teamId = req.nextUrl.searchParams.get('teamId')
  const season = req.nextUrl.searchParams.get('season') || '2025'
  const next = req.nextUrl.searchParams.get('next')
  const last = req.nextUrl.searchParams.get('last')
  const apiKey = process.env.FOOTBALL_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'no key' }, { status: 503 })
  let url = `https://v3.football.api-sports.io/fixtures?season=${season}`
  if (leagueId) url += `&league=${leagueId}`
  if (teamId) url += `&team=${teamId}`
  if (next) url += `&next=${next}`
  if (last) url += `&last=${last}`
  const res = await fetch(url, {
    headers: { 'x-apisports-key': apiKey }, next: { revalidate: 300 }
  })
  const data = await res.json()
  return NextResponse.json(data)
}
