import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

async function getBusinessId(token: string) {
  const { data } = await getSupabase()
    .from('business_sessions')
    .select('business_id')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()
  return data?.business_id || null
}

export async function GET(req: NextRequest) {
  const token = req.headers.get('x-workspace-token')
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 })
  const businessId = await getBusinessId(token)
  if (!businessId) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  const { data, error } = await getSupabase()
    .from('workspace_it_assets')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data || [] })
}

export async function PATCH(req: NextRequest) {
  const token = req.headers.get('x-workspace-token')
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 })
  const businessId = await getBusinessId(token)
  if (!businessId) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  const { email, ...fields } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const allowed: Record<string, unknown> = {}
  const ALLOWED_FIELDS = ['laptop_assigned', 'laptop_model', 'phone_assigned', 'phone_model', 'system_access', 'it_onboarding_complete', 'notes']
  for (const key of ALLOWED_FIELDS) {
    if (key in fields) allowed[key] = fields[key]
  }

  if (!Object.keys(allowed).length) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { error } = await getSupabase()
    .from('workspace_it_assets')
    .update(allowed)
    .eq('business_id', businessId)
    .eq('email', email)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
