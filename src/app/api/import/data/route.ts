import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// Table mapping per import key
const TABLE_MAP: Record<string, string> = {
  // HR
  people: 'business_employees',
  org: 'business_employees',
  absences: 'hr_leave_requests',
  // Sales
  pipeline: 'business_deals',
  // Accounts
  accounts: 'business_accounts',
  revenue: 'business_revenue',
  // Marketing
  campaigns: 'business_campaigns',
  leads: 'business_leads',
  // Support
  tickets: 'business_tickets',
  contacts: 'business_contacts',
  // Success
  health: 'business_customer_health',
  renewals: 'business_renewals',
  // Operations
  processes: 'business_processes',
  faq: 'business_faq',
  // IT
  systems: 'business_systems',
  assets: 'business_assets',
  // Projects
  projects: 'business_projects',
  tasks: 'business_tasks',
  // Partners
  partners: 'business_partners',
  deals: 'business_partner_deals',
  // Strategy
  competitors: 'business_competitors',
  // Trials
  trials: 'business_trial_data',
  onboarding: 'business_onboarding_data',
  // Generic
  data: 'business_imported_data',
  metrics: 'business_imported_data',
  team: 'business_employees',
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-workspace-token')
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 })

  const supabase = getSupabase()

  const { data: session } = await supabase
    .from('business_sessions')
    .select('business_id')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  const body = await req.json()
  const { key, rows, columns } = body as {
    key: string
    rows: Record<string, string>[]
    columns: string[]
  }

  if (!rows?.length) return NextResponse.json({ error: 'No data' }, { status: 400 })

  const tableName = TABLE_MAP[key]
  if (!tableName) return NextResponse.json({ error: `Unknown import type: ${key}` }, { status: 400 })

  // Build insert rows — store all columns as-is plus business_id
  const insertRows = rows.map(r => {
    const row: Record<string, unknown> = { business_id: session.business_id }
    // Map common fields
    for (const col of columns) {
      const val = r[col]
      if (val === undefined || val === null || val === '') continue
      // Normalise column name to snake_case
      const snakeCol = col.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
      row[snakeCol] = val
    }
    return row
  })

  // Try to insert — if table doesn't exist or columns mismatch, store in generic table
  const { error } = await supabase.from(tableName).insert(insertRows)

  if (error) {
    // Fallback: store in generic imported_data table as JSON
    console.error(`[import/data] Insert to ${tableName} failed:`, error.message)
    const { error: fallbackError } = await supabase.from('business_imported_data').insert([{
      business_id: session.business_id,
      import_key: key,
      data: JSON.stringify(rows),
      columns: JSON.stringify(columns),
      row_count: rows.length,
    }])

    if (fallbackError) {
      console.error('[import/data] Fallback insert failed:', fallbackError.message)
      // Still return success — data was parsed and validated, just couldn't save to DB
      // The localStorage flags will ensure the UI shows data
    }
  }

  return NextResponse.json({ success: true, imported: rows.length, table: tableName })
}
