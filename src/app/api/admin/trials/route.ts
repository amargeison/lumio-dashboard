import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function validateAdmin(req: NextRequest) {
  const supabase = getSupabase()
  const token = req.headers.get('x-admin-token')
  if (!token) return null
  const { data } = await supabase.from('admin_sessions').select('admin_id').eq('token', token).gt('expires_at', new Date().toISOString()).maybeSingle()
  return data
}

export async function GET(req: NextRequest) {
  if (!await validateAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = getSupabase()

  // Business trials from demo_tenants
  const { data: demos, error: demosErr } = await supabase
    .from('demo_tenants')
    .select('id, company_name, slug, owner_email, owner_name, created_at, expires_at, status, converted_at, business_id')
    .order('created_at', { ascending: false })

  if (demosErr) console.error('[admin/trials] demo_tenants error:', demosErr)

  // School trials
  const { data: schools, error: schoolsErr } = await supabase
    .from('schools')
    .select('id, name, slug, email, created_at, trial_ends_at, active')
    .order('created_at', { ascending: false })

  if (schoolsErr) console.error('[admin/trials] schools error:', schoolsErr)

  return NextResponse.json({
    business: demos || [],
    schools: schools || [],
  })
}

export async function POST(req: NextRequest) {
  if (!await validateAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = getSupabase()
  const { action, id, type } = await req.json()

  if (action === 'extend') {
    if (type === 'school') {
      const { data } = await supabase.from('schools').select('trial_ends_at').eq('id', id).single()
      const newExpiry = new Date((data?.trial_ends_at ? new Date(data.trial_ends_at) : new Date()).getTime() + 14 * 86400000).toISOString()
      await supabase.from('schools').update({ trial_ends_at: newExpiry }).eq('id', id)
    } else {
      const { data } = await supabase.from('demo_tenants').select('expires_at').eq('id', id).single()
      const newExpiry = new Date((data?.expires_at ? new Date(data.expires_at) : new Date()).getTime() + 14 * 86400000).toISOString()
      await supabase.from('demo_tenants').update({ expires_at: newExpiry }).eq('id', id)
    }
    return NextResponse.json({ success: true })
  }

  if (action === 'delete') {
    if (type === 'school') {
      await supabase.from('school_users').delete().eq('school_id', id)
      await supabase.from('schools').delete().eq('id', id)
    } else {
      await supabase.from('demo_sessions').delete().eq('tenant_id', id)
      await supabase.from('demo_tenants').delete().eq('id', id)
    }
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
