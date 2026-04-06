import { NextRequest, NextResponse } from 'next/server';
export async function GET(req: NextRequest) {
  const playerId = req.nextUrl.searchParams.get('playerId');
  const season = req.nextUrl.searchParams.get('season') || '2025';
  if (!playerId) return NextResponse.json({ error: 'playerId required' }, { status: 400 });
  const apiKey = process.env.FOOTBALL_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'no key' }, { status: 503 });
  const res = await fetch(
    `https://v3.football.api-sports.io/players?id=${playerId}&season=${season}`,
    { headers: { 'x-apisports-key': apiKey }, next: { revalidate: 3600 } }
  );
  const data = await res.json();
  return NextResponse.json(data);
}
