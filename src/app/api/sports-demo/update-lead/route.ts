import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

import { resolveCaller } from '@/lib/sports-demo-auth'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

// Persist the caller's OWN nickname / avatar / logo to sports_demo_leads so the
// demo profile survives a device change.
//
// This ran unauthenticated on the service-role key: an arbitrary `email` in the
// body selected the row to update, so anyone could overwrite a stranger's
// nickname — and point avatar_url / logo_url at any URL they liked, which the
// portal then renders. Identity now comes from the session cookie only; the body
// `email` is a mismatch guard, never the selector.
//
// Safe to gate: the only caller is SportsDemoGate's finaliseSession(), which
// runs after verify-otp has already minted the session cookie.
export async function POST(req: NextRequest) {
  try {
    const { email, sport, nickname, avatar_url, logo_url } = await req.json()
    if (!sport) return NextResponse.json({ error: 'Missing sport' }, { status: 400 })

    const caller = await resolveCaller(email)
    if (!caller.ok) return NextResponse.json({ error: 'Not permitted' }, { status: caller.status })

    const updates: Record<string, string | null> = { last_seen: new Date().toISOString() }
    if (nickname !== undefined) updates.nickname = nickname
    if (avatar_url !== undefined) updates.avatar_url = avatar_url
    if (logo_url !== undefined) updates.logo_url = logo_url

    await getSupabase().from('sports_demo_leads')
      .update(updates)
      .eq('email', caller.email)
      .eq('sport', sport)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[sports-demo/update-lead]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
