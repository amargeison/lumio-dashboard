import { NextRequest, NextResponse } from 'next/server'
import { POST as identify } from '@/app/api/sports-auth/identify-user/route'
import { POST as sendCode } from '@/app/api/sports-demo/send-otp/route'

export const runtime = 'nodejs'

// The iPhone app's sign-in, step one: who is this address, and send them a code.
//
//   POST { email } → { status: 'code_sent', kind: 'coach' | 'family' }
//                  | { status: 'unknown' }   no account: players and parents are invited by their coach
//                  | { status: 'demo' }      only ever tried the demo: offer the demo
//
// The same two steps the website's sign-in takes (identify-user, then
// send-otp), run here so the app needs only one call and the two cannot drift.

const sub = (req: NextRequest, path: string, body: unknown) =>
  new NextRequest(new URL(path, req.url), { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': req.headers.get('x-forwarded-for') || '', 'x-real-ip': req.headers.get('x-real-ip') || '' }, body: JSON.stringify(body) })

export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => ({}))) as { email?: unknown }
  const email = typeof b.email === 'string' ? b.email.trim() : ''
  if (!email) return NextResponse.json({ error: 'Enter your email address.' }, { status: 400 })

  const who = await identify(sub(req, '/api/sports-auth/identify-user', { email }))
  const w = (await who.json().catch(() => ({}))) as { type?: string; sport?: string; founderSport?: string; error?: string }
  if (!who.ok || !w.type) return NextResponse.json({ error: w.error || 'We could not check that address just now. Please try again.' }, { status: who.status >= 400 ? who.status : 502 })

  let body: Record<string, string> | null = null
  let kind: 'coach' | 'family' = 'coach'
  if (w.type === 'founder' || w.type === 'both') body = { email, sport: w.founderSport || w.sport || 'coach', purpose: 'founder' }
  else if (w.type === 'member') { body = { email, sport: 'coach', purpose: 'member' }; kind = 'family' }
  else if (w.type === 'demo') return NextResponse.json({ status: 'demo' })
  else return NextResponse.json({ status: 'unknown' })

  const sent = await sendCode(sub(req, '/api/sports-demo/send-otp', body))
  const s = (await sent.json().catch(() => ({}))) as { error?: string }
  if (!sent.ok || s.error) return NextResponse.json({ error: s.error || 'We could not send a code just now. Please try again.' }, { status: sent.status >= 400 ? sent.status : 502 })
  // "family" is only a hint for the wording: an invited member can be a coach too.
  return NextResponse.json({ status: 'code_sent', kind })
}
