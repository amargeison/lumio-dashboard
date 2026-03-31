import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

/**
 * POST /api/workspace/session
 * Exchanges a Supabase auth email for a workspace session token.
 * Called when a user logs in via OTP/SSO and lands on the portal
 * without a workspace_session_token in localStorage.
 *
 * Body: { email: string, slug: string }
 * Returns: { session_token: string, business: { id, slug, company_name, ... } }
 */
export async function POST(req: NextRequest) {
  const supabase = getSupabase()

  try {
    const { email, slug } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    // Find the business by slug or owner email
    let business = null
    if (slug) {
      const { data } = await supabase
        .from('businesses')
        .select('id, slug, company_name, owner_name, owner_email, logo_url, status, plan, onboarding_complete, onboarding_completed, demo_data_active')
        .eq('slug', slug)
        .maybeSingle()
      business = data
    }
    if (!business) {
      const { data } = await supabase
        .from('businesses')
        .select('id, slug, company_name, owner_name, owner_email, logo_url, status, plan, onboarding_complete, onboarding_completed, demo_data_active')
        .eq('owner_email', email.toLowerCase())
        .maybeSingle()
      business = data
    }

    if (!business) {
      return NextResponse.json({ error: 'No workspace found for this account' }, { status: 404 })
    }

    // Check for existing valid session
    const { data: existingSession } = await supabase
      .from('business_sessions')
      .select('token')
      .eq('business_id', business.id)
      .eq('email', email.toLowerCase())
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingSession) {
      return NextResponse.json({ session_token: existingSession.token, business })
    }

    // Create new session
    const sessionToken = crypto.randomUUID()
    const { error: sessionError } = await supabase.from('business_sessions').insert({
      token: sessionToken,
      business_id: business.id,
      email: email.toLowerCase(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })

    if (sessionError) {
      console.error('[workspace/session] Failed to create session:', sessionError)
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }

    return NextResponse.json({ session_token: sessionToken, business })
  } catch (err) {
    console.error('[workspace/session] Error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
