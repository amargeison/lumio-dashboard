import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// All sport IDs the picker exposes
const ALLOWED_SPORTS = new Set([
  'tennis','golf','darts','boxing','cricket','rugby','football','nonleague','grassroots','womens',
])

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Supabase service role credentials missing')
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function POST(req: NextRequest) {
  let createdUserId: string | null = null
  try {
    const body = await req.json()
    const {
      email,
      password,
      displayName,
      nickname,
      sport,
      brandName,
      avatarUrl,
      brandLogoUrl,
    } = body as Record<string, string | null | undefined>

    if (!email || !password || !displayName || !sport) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }
    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }
    if (!ALLOWED_SPORTS.has(sport)) {
      return NextResponse.json({ error: `Invalid sport: ${sport}` }, { status: 400 })
    }

    const supabase = getServiceClient()

    // 1. Create the auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName, sport, plan: 'founding' },
    })

    if (authError || !authData?.user) {
      return NextResponse.json(
        { error: authError?.message ?? 'Could not create account.' },
        { status: 400 },
      )
    }
    createdUserId = authData.user.id

    // 2. Insert the sports profile row
    const { error: profileError } = await supabase.from('sports_profiles').insert({
      id: authData.user.id,
      sport,
      display_name: displayName,
      nickname: nickname ?? null,
      avatar_url: avatarUrl ?? null,
      brand_name: brandName ?? null,
      brand_logo_url: brandLogoUrl ?? null,
      plan: 'founding',
    })

    if (profileError) {
      // Don't leave a zombie auth user behind
      console.error('[sports-auth] Profile insert failed, rolling back auth user:', profileError)
      try {
        await supabase.auth.admin.deleteUser(authData.user.id)
      } catch (cleanupErr) {
        console.error('[sports-auth] Could not delete orphan auth user:', cleanupErr)
      }
      return NextResponse.json(
        {
          error: `Could not create profile: ${profileError.message}`,
          hint: 'If this is a missing-table error, run migration 087_sports_auth.sql.',
        },
        { status: 500 },
      )
    }

    // Every sport's post-signup destination is /{sport}/app. The page itself
    // decides whether to render the live portal or the coming-soon placeholder.
    const redirectTo = `/${sport}/app`

    return NextResponse.json({
      success: true,
      userId: authData.user.id,
      sport,
      redirectTo,
    })
  } catch (err) {
    console.error('[sports-auth] Unexpected error:', err)
    // Best-effort cleanup if we created an auth user before crashing
    if (createdUserId) {
      try {
        const supabase = getServiceClient()
        await supabase.auth.admin.deleteUser(createdUserId)
      } catch { /* ignore */ }
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Signup failed' },
      { status: 500 },
    )
  }
}
