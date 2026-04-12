import { NextRequest, NextResponse } from 'next/server'
import { trackSportsEvent, trackSportsLogin } from '@/lib/sports-events'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, userId, sport, event_type, event_name, metadata, user_agent } = body

    if (type === 'login') {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || undefined
      await trackSportsLogin(userId || null, sport, ip, user_agent)
      return NextResponse.json({ ok: true })
    }

    if (type === 'event') {
      await trackSportsEvent(userId || null, sport, event_type, event_name, metadata)
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 })
  }
}
