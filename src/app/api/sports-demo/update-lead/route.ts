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

    // The photo and logo arrive as base64 images (often 100KB+ each) and this
    // runs on every demo sign-in. Writing them back unchanged every time was
    // the single biggest source of database writes in the whole project, so
    // they are only written when they have actually changed.
    const db = getSupabase()
    const { data: current } = await db.from('sports_demo_leads')
      .select('nickname, avatar_url, logo_url')
      .eq('email', caller.email).eq('sport', sport).maybeSingle()

    const updates: Record<string, string | null> = { last_seen: new Date().toISOString() }
    if (nickname !== undefined && nickname !== current?.nickname) updates.nickname = nickname
    if (avatar_url !== undefined && avatar_url !== current?.avatar_url) updates.avatar_url = avatar_url
    if (logo_url !== undefined && logo_url !== current?.logo_url) updates.logo_url = logo_url

    await db.from('sports_demo_leads')
      .update(updates)
      .eq('email', caller.email)
      .eq('sport', sport)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[sports-demo/update-lead]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
