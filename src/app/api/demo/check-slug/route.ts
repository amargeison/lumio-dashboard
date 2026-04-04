import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ exists: false })

  const supabase = getSupabase()

  // Check demo_tenants table
  const { data: demoTenant } = await supabase
    .from('demo_tenants')
    .select('slug, tenant_type, company_name, owner_name, logo_url')
    .eq('slug', slug)
    .not('status', 'eq', 'deleted')
    .maybeSingle()

  if (demoTenant) {
    return NextResponse.json({
      exists: true,
      tenant_type: demoTenant.tenant_type || 'business',
      company_name: demoTenant.company_name || null,
      owner_name: demoTenant.owner_name || null,
      logo_url: demoTenant.logo_url || null,
    })
  }

  // Check schools table
  const { data: school } = await supabase
    .from('schools')
    .select('slug')
    .eq('slug', slug)
    .maybeSingle()

  if (school) {
    return NextResponse.json({
      exists: true,
      tenant_type: 'schools',
    })
  }

  return NextResponse.json({ exists: false })
}
