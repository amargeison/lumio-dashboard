import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { toNative } from '@/lib/app/native-auth'

export const runtime = 'nodejs'

// The iPhone app swaps its refresh token for a fresh session before the access
// token runs out (an hour). Supabase rotates the refresh token every time, so
// the app keeps the new one and forgets the old.
//
//   POST { refreshToken } → { accessToken, refreshToken, expiresAt, user } | 401 (sign in again)

export async function POST(req: NextRequest) {
  if (!rateLimit(`app-refresh:${clientIp(req.headers)}`, 60, 10 * 60_000).ok) {
    return NextResponse.json({ error: 'Too many tries.' }, { status: 429 })
  }
  const b = (await req.json().catch(() => ({}))) as { refreshToken?: unknown }
  const refresh_token = typeof b.refreshToken === 'string' ? b.refreshToken : ''
  if (!refresh_token || refresh_token.length > 500) return NextResponse.json({ error: 'Sign in again.' }, { status: 401 })
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await anon.auth.refreshSession({ refresh_token })
  const s = toNative(data?.session ?? null)
  if (error || !s) return NextResponse.json({ error: 'Sign in again.' }, { status: 401 })
  return NextResponse.json(s, { headers: { 'Cache-Control': 'no-store' } })
}
