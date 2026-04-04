import { NextRequest, NextResponse } from 'next/server';
export async function GET(req: NextRequest) {
  const teamId = req.nextUrl.searchParams.get('teamId');
  if (!teamId) return NextResponse.json({ error: 'teamId required' }, { status: 400 });
  const apiKey = process.env.FOOTBALL_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'no key' }, { status: 503 });
  const res = await fetch(
    `https://v3.football.api-sports.io/coachs?team=${teamId}`,
    { headers: { 'x-apisports-key': apiKey }, next: { revalidate: 86400 } }
  );
  const data = await res.json();
  return NextResponse.json(data);
}
