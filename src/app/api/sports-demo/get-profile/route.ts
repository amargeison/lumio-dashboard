import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')
  const sport = searchParams.get('sport')

  if (!email || !sport) {
    return NextResponse.json({ profile: null })
  }

  try {
    const supabase = getSupabase()
    const { data } = await supabase
      .from('sports_demo_leads')
      .select('user_name, club_name, role')
      .eq('email', email.toLowerCase())
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
