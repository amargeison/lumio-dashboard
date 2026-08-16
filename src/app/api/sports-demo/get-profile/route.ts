import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

import { resolveCaller } from '@/lib/sports-demo-auth'

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
// string (see @/lib/sports-demo-auth). The `email` param is kept only so a
// mismatched caller is rejected outright rather than quietly served someone
// else's row — it is never what the query selects on.
//
// No session → nothing. Session for a different address → nothing.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sport = searchParams.get('sport')
  if (!sport) return NextResponse.json({ profile: null }, { status: 400 })

  const caller = await resolveCaller(searchParams.get('email'))
  if (!caller.ok) return NextResponse.json({ profile: null }, { status: caller.status })

  try {
    const { data } = await getSupabase()
      .from('sports_demo_leads')
      .select('user_name, club_name, role, nickname, avatar_url, logo_url')
      // Scoped to the SESSION's address — this is what makes the service-role
      // key safe here: the query can only ever resolve to the caller's own row.
      .eq('email', caller.email)
      .eq('sport', sport)
      .maybeSingle()

    return NextResponse.json({ profile: data || null })
  } catch {
    return NextResponse.json({ profile: null })
  }
}

// ─── POST: write the caller's OWN demo profile ──────────────────────────────
// Same exposure the GET had, in the other direction: this used to take an
// arbitrary `email` in the body and upsert that lead's name / club / role on the
// service-role key with no auth, so anyone could overwrite (or mass-create) rows
// belonging to addresses they don't own. Now scoped to the session address.
//
// Safe to gate: the only caller is SportsDemoGate's finaliseSession(), which
// runs after verify-otp has already minted the session cookie.
export async function POST(req: NextRequest) {
  try {
    const { email, sport, userName, clubName, role } = await req.json()
    if (!sport) return NextResponse.json({ ok: false }, { status: 400 })

    const caller = await resolveCaller(email)
    if (!caller.ok) return NextResponse.json({ ok: false }, { status: caller.status })

    await getSupabase().from('sports_demo_leads').upsert({
      email: caller.email,
      sport,
      user_name: userName || null,
      club_name: clubName || null,
      role: role || null,
      last_seen: new Date().toISOString(),
    }, { onConflict: 'email,sport' })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
