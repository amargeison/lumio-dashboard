import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { buildDemoData, DEMO_TABLES } from '@/lib/demo-data'
import { getWorkspaceSession } from '@/lib/auth/workspace-auth'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  const session = await getWorkspaceSession(req)
  if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  const { business_id } = session

  const bid = business_id

  // Idempotent: clear any existing demo data first
  await Promise.all(
    DEMO_TABLES.map(t =>
      supabase.from(t).delete().eq('business_id', bid).eq('is_demo', true),
    ),
  )

  // Build fresh demo data
  const d = buildDemoData(bid)

  // Insert each table individually — one failure doesn't abort the rest
  const tableInserts: Array<{ table: string; data: unknown[] }> = [
    { table: 'business_employees', data: d.employees },
    { table: 'business_meetings', data: d.meetings },
    { table: 'business_finance_monthly', data: d.financeMonthly },
    { table: 'business_invoices', data: d.invoices },
    { table: 'business_tasks', data: d.tasks },
    { table: 'business_compliance_logs', data: d.complianceLogs },
    { table: 'hr_onboardings', data: d.onboardings },
    { table: 'hr_leave_requests', data: d.leaveRequests },
    { table: 'hr_performance_reviews', data: d.performanceReviews },
    { table: 'crm_deals', data: d.deals },
  ]

  const tablesWritten: string[] = []
  const errors: string[] = []

  for (const { table, data } of tableInserts) {
    try {
      if (!data || (Array.isArray(data) && data.length === 0)) {
        tablesWritten.push(table)
        continue
      }
      const { error } = await supabase.from(table).insert(data)
      if (error) {
        console.error(`[load-demo] ${table} failed:`, error.message)
        errors.push(`${table}: ${error.message}`)
      } else {
        tablesWritten.push(table)
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error(`[load-demo] ${table} exception:`, msg)
      errors.push(`${table}: ${msg}`)
    }
  }

  // Flip the flag regardless of partial failures
  await supabase
    .from('businesses')
    .update({ demo_data_active: true })
    .eq('id', bid)

  if (errors.length > 0) {
    console.error('[load-demo] Partial success. Errors:', errors)
  }

  return NextResponse.json({ success: true, tablesWritten, errors: errors.length > 0 ? errors : undefined })
}
