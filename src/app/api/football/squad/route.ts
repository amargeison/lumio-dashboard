import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const teamId = searchParams.get('teamId')
  const season = searchParams.get('season') || '2025'

  if (!teamId) return NextResponse.json({ error: 'teamId required' }, { status: 400 })

  const apiKey = process.env.FOOTBALL_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'no key' }, { status: 503 })

  try {
    const res = await fetch(
      `https://v3.football.api-sports.io/players/squads?team=${teamId}`,
      { headers: { 'x-apisports-key': apiKey }, next: { revalidate: 3600 } }
    )
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e) {
    console.error('[football/squad] API error:', e)
    return NextResponse.json({ error: 'API request failed' }, { status: 500 })
  }
}
