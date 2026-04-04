import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type');
  const matchId = req.nextUrl.searchParams.get('matchId');
  const compId = req.nextUrl.searchParams.get('compId');
  const seasonId = req.nextUrl.searchParams.get('seasonId');

  let url = '';
  if (type === 'competitions') url = 'https://raw.githubusercontent.com/statsbomb/open-data/master/data/competitions.json';
  if (type === 'matches') url = `https://raw.githubusercontent.com/statsbomb/open-data/master/data/matches/${compId}/${seasonId}.json`;
  if (type === 'events') url = `https://raw.githubusercontent.com/statsbomb/open-data/master/data/events/${matchId}.json`;
  if (type === 'lineups') url = `https://raw.githubusercontent.com/statsbomb/open-data/master/data/lineups/${matchId}.json`;

  if (!url) return NextResponse.json({ error: 'invalid type' }, { status: 400 });

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return NextResponse.json({ error: 'not found' }, { status: 404 });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'fetch failed' }, { status: 500 });
  }
}
