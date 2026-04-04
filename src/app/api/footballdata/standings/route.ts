import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const key = process.env.FOOTBALL_DATA_KEY;
  if (!key) return NextResponse.json({ error: 'FOOTBALL_DATA_KEY not configured' }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const competition = searchParams.get('competition') || 'EL1'; // EFL League One

  try {
    const res = await fetch(`https://api.football-data.org/v4/competitions/${competition}/standings`, {
      headers: { 'X-Auth-Token': key },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Football-Data API error: ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to fetch standings' }, { status: 500 });
  }
}
