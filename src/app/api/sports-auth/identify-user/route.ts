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
    let founderProfile: { sport: string; portal_slug: string | null; brand_name: string | null; display_name: string | null } | null = null
    if (authUser) {
      const { data: profile } = await supabase
        .from('sports_profiles')
        .select('sport, portal_slug, brand_name, display_name')
        .eq('id', authUser.id)
        .maybeSingle()
      if (profile) { founderSport = profile.sport; founderProfile = profile }
    }
    const founderFields = founderProfile ? {
      founderSlug: founderProfile.portal_slug,
      founderBrand: founderProfile.brand_name,
      founderDisplayName: founderProfile.display_name,
    } : {}

    // Check 2: Is this an invited portal member? A coach, parent or student the
    // head coach added. They have no sports_profiles row of their own, so
    // without this they identify as 'unknown' and the sign-in dead-ends.
    //
    // Checked BEFORE the demo lead so somebody who once poked at a demo and was
    // later invited as a real coach is treated as the coach.
    const { data: member } = await supabase
      .from('coach_members')
      .select('role, status, academy_id')
      .ilike('email', normalised)
      .neq('status', 'revoked')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Check 3: Is this a demo user? (exists in sports_demo_leads)
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
        ...founderFields,
        demoSport: demoLead.sport,
        userName: demoLead.user_name,
        clubName: demoLead.club_name,
        role: demoLead.role,
      })
    }

    // A founder owns their own academy, which is the stronger identity — a head
    // coach invited to somebody else's academy still lands in their own portal.
    if (founderSport) {
      return NextResponse.json({ type: 'founder', sport: founderSport, ...founderFields })
    }

    if (member) {
      const { data: academy } = await supabase
        .from('sports_profiles').select('brand_name').eq('id', member.academy_id).maybeSingle()
      return NextResponse.json({
        type: 'member',
        sport: 'coach',
        memberRole: member.role,
        clubName: academy?.brand_name || null,
      })
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
