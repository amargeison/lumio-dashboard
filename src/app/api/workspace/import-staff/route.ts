import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { propagateAllStaff } from '@/lib/staff/propagate'
import { assignDepartments } from '@/lib/staff/departmentMatch'

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
    const validStaff = staff.filter(s => s.first_name || s.email)

    // Run department auto-assignment
    const deptResults = assignDepartments(validStaff.map(s => ({ department: s.department, job_title: s.job_title })))

    const rows = validStaff.map((s, i) => {
      const match = deptResults.results[i]?.matched
      return {
        business_id: session.business_id,
        first_name: s.first_name?.trim() || null,
        last_name: s.last_name?.trim() || null,
        email: s.email?.trim().toLowerCase() || null,
        job_title: s.job_title?.trim() || null,
        department: match ? match.label : (s.department?.trim() || null),
        phone: s.phone?.trim() || null,
        start_date: s.start_date?.trim() || null,
      }
    })

    if (!rows.length) {
      return NextResponse.json({ error: 'No valid staff rows (need First Name or Email)' }, { status: 400 })
    }

    // Upsert to avoid duplicates on reimport
    // NOTE: requires UNIQUE(business_id, email) constraint on workspace_staff
    // If missing, add migration: ALTER TABLE workspace_staff ADD CONSTRAINT workspace_staff_biz_email_unique UNIQUE(business_id, email);
    const withEmail = rows.filter(r => r.email)
    const withoutEmail = rows.filter(r => !r.email)
    let error = null
    if (withEmail.length) {
      const res = await supabase.from('workspace_staff').upsert(withEmail, { onConflict: 'business_id,email' })
      if (res.error) error = res.error
    }
    if (withoutEmail.length && !error) {
      const res = await supabase.from('workspace_staff').insert(withoutEmail)
      if (res.error) error = res.error
    }

    if (error) {
      console.error('[workspace/import-staff] Insert error:', error)
      return NextResponse.json({ error: 'Failed to import staff' }, { status: 500 })
    }

    // Propagate to payroll, IT assets, and onboarding checklist
    const validForPropagation = rows.filter(r => r.email).map(r => ({
      first_name: r.first_name || '',
      last_name: r.last_name || '',
      email: r.email!,
      job_title: r.job_title || '',
      department: r.department || '',
      phone: r.phone || undefined,
      start_date: r.start_date || undefined,
    }))
    if (validForPropagation.length) {
      propagateAllStaff(session.business_id, validForPropagation).catch(err =>
        console.error('[workspace/import-staff] Propagation error:', err)
      )
    }

    return NextResponse.json({
      success: true,
      imported: rows.length,
      departments_assigned: deptResults.assigned,
      departments_pending: deptResults.pending,
    })
  } catch (err) {
    console.error('[workspace/import-staff] Error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
