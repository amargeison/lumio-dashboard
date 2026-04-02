import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { DEMO_TABLES } from '@/lib/demo-data'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  const token = req.headers.get('x-workspace-token')
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 })

  const { data: session } = await supabase
    .from('business_sessions')
    .select('business_id')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  const bid = session.business_id

  // Delete all demo records from every table
  await Promise.all(
    DEMO_TABLES.map(t =>
      supabase.from(t).delete().eq('business_id', bid).eq('is_demo', true),
    ),
  )

  // Also clear workspace_staff for this business (imported staff gets re-imported by user)
  await supabase.from('workspace_staff').delete().eq('business_id', bid)

  // Set flag to false
  await supabase
    .from('businesses')
    .update({ demo_data_active: false })
    .eq('id', bid)

  return NextResponse.json({ success: true })
}
