import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function POST(req: NextRequest) {
  try {
    const { email, sport, nickname, avatar_url, logo_url } = await req.json()
    if (!email || !sport) {
      return NextResponse.json({ error: 'Missing email or sport' }, { status: 400 })
    }
    const supabase = getSupabase()
    const updates: Record<string, string | null> = { last_seen: new Date().toISOString() }
    if (nickname !== undefined) updates.nickname = nickname
    if (avatar_url !== undefined) updates.avatar_url = avatar_url
    if (logo_url !== undefined) updates.logo_url = logo_url

    await supabase.from('sports_demo_leads')
      .update(updates)
      .eq('email', email.toLowerCase())
      .eq('sport', sport)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[sports-demo/update-lead]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
