import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET(req: NextRequest) {
  const supabase = getSupabase()
  const token = req.headers.get('x-admin-token')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Validate admin session
  const { data: session } = await supabase.from('admin_sessions').select('admin_id').eq('token', token).gt('expires_at', new Date().toISOString()).maybeSingle()
  if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  const type = req.nextUrl.searchParams.get('type') || 'business'
  const search = req.nextUrl.searchParams.get('search') || ''

  if (type === 'schools') {
    let query = supabase.from('schools').select('id, name, slug, plan, workspace_type, active, trial_ends_at, created_at, admin_notes, onboarded, billing_type')
    if (search) query = query.ilike('name', `%${search}%`)
    const { data } = await query.order('created_at', { ascending: false }).limit(100)
    return NextResponse.json({ accounts: data || [], type: 'schools' })
  }

  let query = supabase.from('businesses').select('id, company_name, slug, plan, status, onboarding_complete, demo_data_active, created_at, admin_notes, owner_email, billing_type')
  if (search) query = query.ilike('company_name', `%${search}%`)
  const { data } = await query.order('created_at', { ascending: false }).limit(100)
  return NextResponse.json({ accounts: data || [], type: 'business' })
}
