import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

/**
 * GET /api/activate?token=xxx
 * Validates activation token, marks account as activated, redirects to dashboard.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }

  const supabase = getSupabase()

  // Find business with this activation token
  const { data: business, error } = await supabase
    .from('businesses')
    .select('id, slug, activation_expires_at, activated_at')
    .eq('activation_token', token)
    .maybeSingle()

  if (error || !business) {
    return NextResponse.json({ error: 'Invalid or expired activation link', expired: true }, { status: 400 })
  }

  // Already activated
  if (business.activated_at) {
    return NextResponse.json({ success: true, slug: business.slug, already_activated: true })
  }

  // Check expiry
  if (business.activation_expires_at && new Date(business.activation_expires_at) < new Date()) {
    return NextResponse.json({ error: 'Activation link has expired', expired: true }, { status: 400 })
  }

  // Activate
  await supabase
    .from('businesses')
    .update({
      activated_at: new Date().toISOString(),
      activation_token: null,
    })
    .eq('id', business.id)

  return NextResponse.json({ success: true, slug: business.slug })
}
