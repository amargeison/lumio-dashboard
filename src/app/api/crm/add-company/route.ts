import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  const token = req.headers.get('x-workspace-token')
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 })

  const { data: session } = await supabase.from('business_sessions').select('business_id').eq('token', token).gt('expires_at', new Date().toISOString()).maybeSingle()
  if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  const body = await req.json()
  const { error } = await supabase.from('crm_companies').insert({
    tenant_id: session.business_id,
    name: body.name,
    domain: body.website || null,
    industry: body.industry || null,
    size: body.size || null,
    location: body.location || null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
