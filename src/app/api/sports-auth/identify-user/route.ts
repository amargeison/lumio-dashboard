import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 })

    const normalised = email.toLowerCase().trim()

    // Check 1: Is this a founding member? (exists in auth.users + sports_profiles)
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const authUser = authUsers?.users?.find(u => u.email === normalised)

    let founderSport: string | null = null
    if (authUser) {
      const { data: profile } = await supabase
        .from('sports_profiles')
        .select('sport')
        .eq('id', authUser.id)
        .maybeSingle()
      if (profile) founderSport = profile.sport
    }

    // Check 2: Is this a demo user? (exists in sports_demo_leads)
    const { data: demoLead } = await supabase
      .from('sports_demo_leads')
      .select('sport, user_name, club_name, role')
      .eq('email', normalised)
      .order('last_seen', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Both accounts exist
    if (founderSport && demoLead) {
      return NextResponse.json({
        type: 'both',
        founderSport,
        demoSport: demoLead.sport,
        userName: demoLead.user_name,
        clubName: demoLead.club_name,
        role: demoLead.role,
      })
    }

    if (founderSport) {
      return NextResponse.json({ type: 'founder', sport: founderSport })
    }

    if (demoLead) {
      return NextResponse.json({
        type: 'demo',
        sport: demoLead.sport,
        userName: demoLead.user_name,
        clubName: demoLead.club_name,
        role: demoLead.role,
      })
    }

    // Unknown — not registered
    return NextResponse.json({ type: 'unknown' })
  } catch {
    return NextResponse.json({ error: 'Failed to identify user' }, { status: 500 })
  }
}
