import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { verifyWebTicket } from '@/lib/app/native-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Opened by the iPhone app's in-app web view: checks the one-minute ticket from
// POST /api/app/v1/web-session, signs the web view in as that account (its own
// session, separate from the app's), then goes to the page.
//
// Already signed in as the same account in this web view → straight to the
// page, no new session. Anything wrong → the page anyway; at worst it asks the
// person to sign in.

const used = new Map<string, number>()

function origin(req: NextRequest): string {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host')
  return host ? `${req.headers.get('x-forwarded-proto') || 'https'}://${host}` : new URL(req.url).origin
}

export async function GET(req: NextRequest) {
  const t = verifyWebTicket(req.nextUrl.searchParams.get('t') || '')
  const site = origin(req)
  if (!t) return NextResponse.redirect(new URL('/app', site))
  const target = new URL(t.path, site)

  const now = Math.floor(Date.now() / 1000)
  for (const [k, exp] of used) if (exp < now) used.delete(k)
  if (used.has(t.jti)) return NextResponse.redirect(target)
  used.set(t.jti, t.exp)

  const jar = await cookies()
  const out = NextResponse.redirect(target)
  const ssr = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: toSet => toSet.forEach(({ name, value, options }) => out.cookies.set(name, value, { ...(options ?? {}), secure: true, sameSite: 'lax', path: '/' })),
    },
  })

  // Same person already signed in here: nothing to do.
  if (jar.getAll().some(c => c.name.startsWith('sb-'))) {
    const { data } = await ssr.auth.getUser()
    if (data.user?.id === t.sub) return out
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: owner } = await admin.auth.admin.getUserById(t.sub)
  const email = owner?.user?.email
  if (!email) return NextResponse.redirect(target)
  const link = await admin.auth.admin.generateLink({ type: 'magiclink', email })
  const hash = link.data?.properties?.hashed_token
  if (link.error || !hash || link.data?.user?.id !== t.sub) return NextResponse.redirect(target)
  const { error } = await ssr.auth.verifyOtp({ token_hash: hash, type: 'magiclink' })
  if (error) { console.warn('[app/web-session] session mint failed'); return NextResponse.redirect(target) }
  return out
}
