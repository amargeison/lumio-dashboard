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

const VALID_FIELDS = new Set([
  'hr_contract_sent', 'hr_handbook_sent', 'hr_induction_booked',
  'accounts_bank_details', 'accounts_payroll_set_up',
  'it_laptop_assigned', 'it_accounts_created', 'it_access_granted', 'it_equipment_delivered',
  'completed',
])

export async function GET(req: NextRequest) {
  const token = req.headers.get('x-workspace-token')
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 })
  const businessId = await getBusinessId(token)
  if (!businessId) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  const { data, error } = await getSupabase()
    .from('workspace_employee_checklist')
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

  const { email, field, value } = await req.json()
  if (!email || !field || !VALID_FIELDS.has(field)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { error } = await getSupabase()
    .from('workspace_employee_checklist')
    .update({ [field]: value })
    .eq('business_id', businessId)
    .eq('email', email)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
