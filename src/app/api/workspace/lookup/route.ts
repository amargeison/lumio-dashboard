import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

/**
 * POST /api/workspace/lookup
 * Looks up which business workspace belongs to an email address.
 * Returns { slug, company_name } or 404 if not found.
 */
export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  const body = await req.json().catch(() => null)
  if (!body?.email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('slug, company_name, owner_name')
    .eq('owner_email', body.email.toLowerCase().trim())
    .eq('status', 'active')
    .maybeSingle()

  if (!business) {
    return NextResponse.json({ error: 'No workspace found for this email' }, { status: 404 })
  }

  return NextResponse.json({
    slug: business.slug,
    company_name: business.company_name,
    owner_name: business.owner_name,
  })
}
