import { NextResponse } from 'next/server';
export async function GET() {
  const apiKey = process.env.FOOTBALL_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'no key' }, { status: 503 });
  const res = await fetch('https://v3.football.api-sports.io/status', {
    headers: { 'x-apisports-key': apiKey },
    next: { revalidate: 60 }
  });
  const data = await res.json();
  return NextResponse.json(data);
}
