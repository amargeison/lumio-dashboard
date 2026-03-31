import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

interface StaffRow {
  first_name?: string
  last_name?: string
  email?: string
  job_title?: string
  department?: string
  phone?: string
  start_date?: string
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  const token = req.headers.get('x-workspace-token')
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 })

  // Validate session
  const { data: session } = await supabase
    .from('business_sessions')
    .select('business_id')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  try {
    const { staff } = await req.json() as { staff: StaffRow[] }

    if (!Array.isArray(staff) || !staff.length) {
      return NextResponse.json({ error: 'No staff data provided' }, { status: 400 })
    }

    // Filter valid rows and prepare for upsert
    const rows = staff
      .filter(s => s.first_name || s.email)
      .map(s => ({
        business_id: session.business_id,
        first_name: s.first_name?.trim() || null,
        last_name: s.last_name?.trim() || null,
        email: s.email?.trim().toLowerCase() || null,
        job_title: s.job_title?.trim() || null,
        department: s.department?.trim() || null,
        phone: s.phone?.trim() || null,
        start_date: s.start_date?.trim() || null,
      }))

    if (!rows.length) {
      return NextResponse.json({ error: 'No valid staff rows (need First Name or Email)' }, { status: 400 })
    }

    const { error } = await supabase.from('workspace_staff').insert(rows)

    if (error) {
      console.error('[workspace/import-staff] Insert error:', error)
      return NextResponse.json({ error: 'Failed to import staff' }, { status: 500 })
    }

    return NextResponse.json({ success: true, imported: rows.length })
  } catch (err) {
    console.error('[workspace/import-staff] Error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
