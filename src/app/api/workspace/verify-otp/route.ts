import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const IS_PRODUCTION = process.env.NEXT_PUBLIC_ENV === 'production' || process.env.NODE_ENV === 'production'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

/**
 * POST /api/workspace/verify-otp
 * Verifies a 6-digit OTP and creates a workspace session.
 * Body: { email: string, otp: string }
 * Returns: { session_token, slug, company_name }
 */
export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  const body = await req.json().catch(() => null)
  if (!body?.email || !body?.otp) {
    return NextResponse.json({ error: 'Email and OTP required' }, { status: 400 })
  }

  const email = body.email.toLowerCase().trim()
  const otp = body.otp.trim()

  // Dev bypass: 000000
  if (!IS_PRODUCTION && otp === '000000') {
    return createSession(supabase, email)
  }

  // Look up the OTP
  const { data: otpRecord } = await supabase
    .from('workspace_otps')
    .select('id, slug')
    .eq('email', email)
    .eq('otp', otp)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!otpRecord) {
    return NextResponse.json({ error: 'Invalid or expired code' }, { status: 401 })
  }

  // Mark OTP as used
  await supabase
    .from('workspace_otps')
    .update({ used: true })
    .eq('id', otpRecord.id)

  return createSession(supabase, email)
}

async function createSession(supabase: ReturnType<typeof getSupabase>, email: string) {
  // Find the business
  const { data: business } = await supabase
    .from('businesses')
    .select('id, slug, company_name, owner_name, owner_email, logo_url, status, plan, onboarding_complete, onboarding_completed, demo_data_active')
    .eq('owner_email', email)
    .maybeSingle()

  if (!business) {
    return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
  }

  // Create session token (30-day expiry)
  const sessionToken = crypto.randomUUID()
  const { error: sessionError } = await supabase.from('business_sessions').insert({
    token: sessionToken,
    business_id: business.id,
    email,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  })

  if (sessionError) {
    console.error('[workspace/verify-otp] Failed to create session:', sessionError)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }

  return NextResponse.json({
    session_token: sessionToken,
    slug: business.slug,
    company_name: business.company_name,
    owner_name: business.owner_name,
    logo_url: business.logo_url,
  })
}
