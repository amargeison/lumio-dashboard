import { NextRequest, NextResponse } from 'next/server'
import { sportsAdminOk } from '@/lib/sports-admin/auth'
import { rateLimit, clientIp } from '@/lib/rate-limit'

// Checks the sports admin password on the SERVER. The page used to compare it
// in the browser against a copy of the password shipped in its own code.
//
// POST { password }      -> signing in
// GET  x-admin-token     -> "is the password I saved still right?"
//
// Five wrong guesses in ten minutes locks that address out for the rest of the
// window, so the password cannot be found by trying.

function tooMany(req: NextRequest) {
  const v = rateLimit(`sports-admin-login:${clientIp(req.headers)}`, 5, 10 * 60_000)
  return v.ok ? null : NextResponse.json({ error: 'Too many attempts. Try again in a few minutes.' }, { status: 429 })
}

export async function POST(req: NextRequest) {
  const limited = tooMany(req)
  if (limited) return limited
  if (!process.env.SPORTS_ADMIN_TOKEN) {
    return NextResponse.json({ error: 'The admin password has not been set on the server.' }, { status: 503 })
  }
  const { password } = (await req.json().catch(() => ({}))) as { password?: string }
  if (!sportsAdminOk(password)) return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest) {
  if (sportsAdminOk(req.headers.get('x-admin-token'))) return NextResponse.json({ ok: true })
  const limited = tooMany(req)
  if (limited) return limited
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
