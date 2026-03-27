import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function GET(req: NextRequest) {
  const supabase = getSupabase()
  const token = req.headers.get('x-demo-token')
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 })

  const { data: session } = await supabase
    .from('demo_sessions')
    .select('tenant_id')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  const { data: tenant } = await supabase
    .from('demo_tenants')
    .select('status, expires_at, company_name, owner_name, logo_url, workspace_type, live_workspace_id')
    .eq('id', session.tenant_id)
    .single()

  if (!tenant) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // If this trial has been converted, look up the live workspace slug
  let live_slug: string | null = null
  if (tenant.live_workspace_id) {
    const { data: live } = await supabase
      .from('demo_tenants')
      .select('slug')
      .eq('id', tenant.live_workspace_id)
      .single()
    if (live) live_slug = live.slug
  }

  return NextResponse.json({ ...tenant, live_slug })
}
