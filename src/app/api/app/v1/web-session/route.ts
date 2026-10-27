import { NextRequest, NextResponse } from 'next/server'
import { sessionUser } from '@/lib/coach/membership'
import { signWebTicket, safeSitePath } from '@/lib/app/native-auth'

export const runtime = 'nodejs'

// The iPhone app shows the less-used parts of Lumio (settings, camps, leads…)
// as the website inside the app. This gives it a one-minute, one-use address
// that opens that page already signed in.
//
//   POST { path: '/tennis/coach/pg-tennis?tab=camps' } → { url }

export async function POST(req: NextRequest) {
  const user = await sessionUser()
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 })
  const b = (await req.json().catch(() => ({}))) as { path?: unknown }
  const path = safeSitePath(b.path) || '/app'
  const ticket = signWebTicket(user.id, path)
  return NextResponse.json({ url: `/api/app/v1/web-session/open?t=${encodeURIComponent(ticket)}` }, { headers: { 'Cache-Control': 'no-store' } })
}
