import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

// ─── GET: the caller's OWN demo profile ─────────────────────────────────────
// This route used to take an `email` query param and hand back that lead's
// name, club, role, nickname, avatar and logo — service-role, no auth, no rate
// limit. Anyone who could guess an email could read the person behind it.
//
// Identity now comes from the Supabase session cookie, never from the query
// string. verify-otp mints exactly that cookie once the 6-digit code is
// confirmed, so "has a session for this address" is the same proof of
// ownership the OTP already established. The `email` param is kept only so a
// mismatched caller is rejected outright rather than quietly served someone
// else's row — it is never what the query selects on.
//
// No session → nothing. Session for a different address → nothing.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')
  const sport = searchParams.get('sport')

  if (!sport) return NextResponse.json({ profile: null }, { status: 400 })

  // getUser() (not getSession()) — it validates the JWT against the auth
  // server rather than trusting whatever the cookie decodes to.
  let sessionEmail: string | null = null
  try {
    const cookieStore = await cookies()
    const ssr = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => { /* read-only route */ } } },
    )
    const { data } = await ssr.auth.getUser()
    sessionEmail = data.user?.email?.toLowerCase() ?? null
  } catch { /* treat as unauthenticated */ }

  if (!sessionEmail) return NextResponse.json({ profile: null }, { status: 401 })
  if (email && email.toLowerCase() !== sessionEmail) {
    return NextResponse.json({ profile: null }, { status: 403 })
  }

  try {
    const supabase = getSupabase()
    const { data } = await supabase
      .from('sports_demo_leads')
      .select('user_name, club_name, role, nickname, avatar_url, logo_url')
      // Scoped to the SESSION's address — this is what makes the service-role
      // key safe here: the query can only ever resolve to the caller's own row.
      .eq('email', sessionEmail)
      .eq('sport', sport)
      .maybeSingle()

    return NextResponse.json({ profile: data || null })
  } catch {
    return NextResponse.json({ profile: null })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, sport, userName, clubName, role } = await req.json()
    if (!email || !sport) return NextResponse.json({ ok: false })
    const supabase = getSupabase()
    await supabase.from('sports_demo_leads').upsert({
      email: email.toLowerCase(),
      sport,
      user_name: userName || null,
      club_name: clubName || null,
      role: role || null,
      last_seen: new Date().toISOString(),
    }, { onConflict: 'email,sport' })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
