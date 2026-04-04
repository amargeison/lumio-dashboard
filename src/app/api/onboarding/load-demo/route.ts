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

  // Insert all records in parallel
  const results = await Promise.all([
    supabase.from('business_employees').insert(d.employees),
    supabase.from('business_meetings').insert(d.meetings),
    supabase.from('business_finance_monthly').insert(d.financeMonthly),
    supabase.from('business_invoices').insert(d.invoices),
    supabase.from('business_tasks').insert(d.tasks),
    supabase.from('business_compliance_logs').insert(d.complianceLogs),
    supabase.from('hr_onboardings').insert(d.onboardings),
    supabase.from('hr_leave_requests').insert(d.leaveRequests),
    supabase.from('hr_performance_reviews').insert(d.performanceReviews),
    supabase.from('crm_deals').insert(d.deals),
  ])

  const errors = results.filter(r => r.error).map(r => r.error!.message)
  if (errors.length > 0) {
    console.error('[load-demo] Insert errors:', errors)
    return NextResponse.json({ error: 'Some inserts failed', details: errors }, { status: 500 })
  }

  // Flip the flag
  await supabase
    .from('businesses')
    .update({ demo_data_active: true })
    .eq('id', bid)

  return NextResponse.json({ success: true })
}
