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
    const { email, password, displayName, sport, brandName, avatarUrl, brandLogoUrl } = await req.json()
    const supabase = getSupabase()

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName, sport, plan: 'founding' }
    })

    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

    // Create sports profile
    const { error: profileError } = await supabase.from('sports_profiles').insert({
      id: authData.user.id,
      sport,
      display_name: displayName,
      avatar_url: avatarUrl || null,
      brand_name: brandName || null,
      brand_logo_url: brandLogoUrl || null,
      plan: 'founding',
    })

    if (profileError) {
      console.error('[sports-auth] Profile error:', profileError)
      // User created but profile failed — still return success, profile can be created later
    }

    return NextResponse.json({ success: true, userId: authData.user.id })
  } catch (err) {
    console.error('[sports-auth] Error:', err)
    return NextResponse.json({ error: 'Signup failed' }, { status: 500 })
  }
}
