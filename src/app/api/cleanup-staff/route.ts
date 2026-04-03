import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const TENANT_ID = 'eb9a4f02-bc0a-4b2b-8d19-dd724b5cbae0'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  // Delete by full_name
  const { error: e1 } = await supabase
    .from('workspace_staff')
    .delete()
    .in('full_name', [
      'Andrew Mendoza', 'Hazel Carter', 'Jen Bishop', 'Christa Bryant',
      'Dawny Hill', 'Anne Penn Cox', 'Arron Margeison',
    ])

  // Delete by employee_id
  const { error: e2 } = await supabase
    .from('workspace_staff')
    .delete()
    .in('employee_id', ['LUM-001', 'LUM-002', 'LUM-003', 'LUM-004', 'LUM-005', 'LUM-006', 'LUM-007'])

  // Delete ALL staff for this specific tenant
  const { error: e3 } = await supabase
    .from('workspace_staff')
    .delete()
    .eq('business_id', TENANT_ID)

  // Verify
  const { data: remaining, error: e4 } = await supabase
    .from('workspace_staff')
    .select('id, full_name, employee_id')
    .eq('business_id', TENANT_ID)

  return NextResponse.json({
    deleted_by_name: e1 ? e1.message : 'ok',
    deleted_by_id: e2 ? e2.message : 'ok',
    deleted_by_tenant: e3 ? e3.message : 'ok',
    remaining_count: remaining?.length ?? 'error',
    remaining: remaining ?? [],
    verify_error: e4?.message ?? null,
  })
}
