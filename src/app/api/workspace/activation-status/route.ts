import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

/**
 * GET /api/workspace/activation-status
 * Returns activation status for the current workspace.
 */
export async function GET(req: NextRequest) {
  const token = req.headers.get('x-workspace-token')
  if (!token) {
    return NextResponse.json({ activated: true }) // no token = skip check
  }

  const supabase = getSupabase()

  // Find business via session token
  const { data: session } = await supabase
    .from('business_sessions')
    .select('business_id')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (!session) {
    return NextResponse.json({ activated: true }) // can't verify = don't block
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('activated_at, created_at, owner_email')
    .eq('id', session.business_id)
    .maybeSingle()

  if (!business) {
    return NextResponse.json({ activated: true })
  }

  // If activated_at is set, account is activated
  if (business.activated_at) {
    return NextResponse.json({ activated: true })
  }

  // Calculate account age in hours
  const createdAt = new Date(business.created_at)
  const ageMs = Date.now() - createdAt.getTime()
  const ageHours = Math.round(ageMs / (1000 * 60 * 60))

  return NextResponse.json({
    activated: false,
    accountAgeHours: ageHours,
    email: business.owner_email,
  })
}
