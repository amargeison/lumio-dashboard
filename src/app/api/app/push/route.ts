import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { rateLimit, clientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// The iPhone app's notifications: which phone to send them to.
//
//   GET                  → { signedIn }    the app asks before offering notifications
//   POST   { token }     → this phone now gets notifications for the signed-in account
//   DELETE { token }     → this phone gets nothing (the app calls it on the sign-in page)
//
// The token is Apple's address for the phone. It is not a password: it cannot
// read anything, only receive. It still only ever goes to Apple.

const TOKEN_RE = /^[0-9A-Fa-f]{32,200}$/

const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })

async function me(): Promise<{ id: string; email: string | null } | null> {
  try {
    const jar = await cookies()
    if (!jar.getAll().some(c => c.name.startsWith('sb-'))) return null
    const ssr = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      cookies: { getAll: () => jar.getAll(), setAll: () => {} },
    })
    const { data: { user } } = await ssr.auth.getUser()
    return user ? { id: user.id, email: user.email ? user.email.toLowerCase() : null } : null
  } catch { return null }
}

export async function GET() {
  const u = await me()
  return NextResponse.json({ signedIn: !!u }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(req: NextRequest) {
  const u = await me()
  if (!u) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 })
  const limit = rateLimit(`app-push:${u.id}`, 20, 60 * 60_000)
  if (!limit.ok) return NextResponse.json({ error: 'Too many tries.' }, { status: 429 })
  const b = (await req.json().catch(() => ({}))) as { token?: unknown; appVersion?: unknown }
  const token = String(b.token || '').trim()
  if (!TOKEN_RE.test(token)) return NextResponse.json({ error: 'That is not a device token.' }, { status: 400 })
  const appVersion = typeof b.appVersion === 'string' ? b.appVersion.slice(0, 40) : null
  const now = new Date().toISOString()
  // Upsert on the token: a phone that changes hands (sign out, sign in as
  // someone else) moves to the new account, and the old one stops getting it.
  const { error } = await admin().from('lumio_push_devices').upsert({
    token, user_id: u.id, email: u.email, platform: 'ios', app_version: appVersion, last_seen_at: now, disabled_at: null,
  }, { onConflict: 'token' })
  if (error) { console.error('[app/push] save', error.message); return NextResponse.json({ error: 'Could not save.' }, { status: 500 }) }
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const limit = rateLimit(`app-push-forget:${clientIp(req.headers)}`, 30, 10 * 60_000)
  if (!limit.ok) return NextResponse.json({ error: 'Too many tries.' }, { status: 429 })
  const b = (await req.json().catch(() => ({}))) as { token?: unknown }
  const token = String(b.token || '').trim()
  if (!TOKEN_RE.test(token)) return NextResponse.json({ ok: true })
  await admin().from('lumio_push_devices').delete().eq('token', token)
  return NextResponse.json({ ok: true })
}
