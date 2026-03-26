import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  const token = req.headers.get('x-demo-token')
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 })

  const { data: session } = await supabase
    .from('demo_sessions')
    .select('tenant_id')
    .eq('token', token)
    .single()

  if (!session) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const { error } = await supabase
    .from('demo_tenants')
    .update({
      status: 'converted',
      expires_at: null,
      activated_at: new Date().toISOString(),
    })
    .eq('id', session.tenant_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
