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

  const supabase = getSupabase()

  // Try workspace_payroll first
  const { data: payrollData } = await supabase.from('workspace_payroll').select('*').eq('business_id', businessId).order('created_at')

  if (payrollData && payrollData.length > 0) {
    return NextResponse.json({ items: payrollData })
  }

  // Fallback: build payroll view from workspace_staff
  const { data: staffData } = await supabase.from('workspace_staff').select('first_name, last_name, email, job_title, department, start_date').eq('business_id', businessId).order('last_name')

  const items = (staffData || []).map(s => ({
    email: s.email,
    name: [s.first_name, s.last_name].filter(Boolean).join(' ') || s.email,
    job_title: s.job_title,
    department: s.department,
    start_date: s.start_date,
    salary: null,
    frequency: 'monthly',
    bank_transfer: true,
  }))

  return NextResponse.json({ items })
}

export async function PATCH(req: NextRequest) {
  const token = req.headers.get('x-workspace-token')
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 })
  const businessId = await getBusinessId(token)
  if (!businessId) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  const { email, ...fields } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const allowed: Record<string, unknown> = {}
  const ALLOWED_FIELDS = ['salary', 'pay_frequency', 'bank_details_pending', 'status']
  for (const key of ALLOWED_FIELDS) {
    if (key in fields) allowed[key] = fields[key]
  }

  if (!Object.keys(allowed).length) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { error } = await getSupabase()
    .from('workspace_payroll')
    .update(allowed)
    .eq('business_id', businessId)
    .eq('email', email)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
