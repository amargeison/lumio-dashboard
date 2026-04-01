import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function validateAdmin(req: NextRequest) {
  const token = req.headers.get('x-admin-token')
  if (!token) return false
  const { data } = await getSupabase().from('admin_sessions').select('admin_id').eq('token', token).gt('expires_at', new Date().toISOString()).maybeSingle()
  return !!data
}

export async function GET(req: NextRequest) {
  if (!await validateAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const businessId = req.nextUrl.searchParams.get('business_id')
  if (!businessId) return NextResponse.json({ error: 'business_id required' }, { status: 400 })

  const { data } = await getSupabase()
    .from('workspace_staff')
    .select('first_name, last_name, email, job_title, department, role, role_level, start_date')
    .eq('business_id', businessId)
    .order('role_level', { ascending: true })
    .limit(50)

  return NextResponse.json({ staff: data || [] })
}
