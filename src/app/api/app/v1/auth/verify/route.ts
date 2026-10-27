import { NextRequest, NextResponse } from 'next/server'
import { POST as identify } from '@/app/api/sports-auth/identify-user/route'
import { POST as verifyCode } from '@/app/api/sports-demo/verify-otp/route'
import { sessionFromCookies } from '@/lib/app/native-auth'

export const runtime = 'nodejs'

// The iPhone app's sign-in, step two: the six-digit code → the session.
//
//   POST { email, code } → { accessToken, refreshToken, expiresAt, user: { id, email } }
//
// The website's own code check (verify-otp) runs exactly as it does for a
// browser; the session it would have put in a cookie is handed to the app
// instead, which keeps it in the iPhone's Keychain. No cookie is set.

const sub = (req: NextRequest, path: string, body: unknown) =>
  new NextRequest(new URL(path, req.url), { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': req.headers.get('x-forwarded-for') || '', 'x-real-ip': req.headers.get('x-real-ip') || '' }, body: JSON.stringify(body) })

export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => ({}))) as { email?: unknown; code?: unknown }
  const email = typeof b.email === 'string' ? b.email.trim() : ''
  const code = typeof b.code === 'string' ? b.code.replace(/\D/g, '') : ''
  if (!email || code.length !== 6) return NextResponse.json({ error: 'Enter the 6-digit code from the email.' }, { status: 400 })

  const who = await identify(sub(req, '/api/sports-auth/identify-user', { email }))
  const w = (await who.json().catch(() => ({}))) as { type?: string; sport?: string; founderSport?: string; error?: string }
  if (!who.ok) return NextResponse.json({ error: w.error || 'Please try again.' }, { status: who.status })
  const body = w.type === 'founder' || w.type === 'both'
    ? { email, code, sport: w.founderSport || w.sport || 'coach', purpose: 'founder' }
    : w.type === 'member'
      ? { email, code, sport: 'coach', purpose: 'member' }
      : null
  if (!body) return NextResponse.json({ error: 'There is no Lumio Tennis Coach account for that address.' }, { status: 404 })

  const res = await verifyCode(sub(req, '/api/sports-demo/verify-otp', body))
  const d = (await res.json().catch(() => ({}))) as { verified?: boolean; success?: boolean; error?: string }
  if (!res.ok || !(d.verified || d.success)) return NextResponse.json({ error: d.error || 'That code is not right, or has expired.' }, { status: res.status >= 400 ? res.status : 401 })

  const session = sessionFromCookies((res as NextResponse).cookies.getAll())
  if (!session) {
    console.error('[app/auth/verify] code passed but no session was minted')
    return NextResponse.json({ error: 'Signed in, but the session could not be started. Please try again.' }, { status: 500 })
  }
  return NextResponse.json(session, { headers: { 'Cache-Control': 'no-store' } })
}
