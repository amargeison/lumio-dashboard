import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { propagateAllStaff } from '@/lib/staff/propagate'
import { assignDepartments } from '@/lib/staff/departmentMatch'
import { detectRole } from '@/lib/detect-role'

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
      const { role, role_level } = detectRole(s.job_title)
      return {
        business_id: session.business_id,
        first_name: s.first_name?.trim() || null,
        last_name: s.last_name?.trim() || null,
        email: s.email?.trim().toLowerCase() || null,
        job_title: s.job_title?.trim() || null,
        department: match ? match.label : (s.department?.trim() || null),
        phone: s.phone?.trim() || null,
        start_date: s.start_date?.trim() || null,
        role,
        role_level,
      }
    })

    if (!rows.length) {
      return NextResponse.json({ error: 'No valid staff rows (need First Name or Email)' }, { status: 400 })
    }

    // Insert staff — try upsert first, fall back to plain insert if unique constraint missing
    const withEmail = rows.filter(r => r.email)
    const withoutEmail = rows.filter(r => !r.email)
    let insertError = null

    if (withEmail.length) {
      // Try upsert first (requires UNIQUE constraint on business_id,email)
      const res = await supabase.from('workspace_staff').upsert(withEmail, { onConflict: 'business_id,email' })
      if (res.error) {
        console.warn('[workspace/import-staff] Upsert failed, falling back to insert:', res.error.message)
        // Fallback: delete existing by email then insert fresh
        for (const row of withEmail) {
          await supabase.from('workspace_staff').delete().eq('business_id', session.business_id).eq('email', row.email!)
        }
        const fallback = await supabase.from('workspace_staff').insert(withEmail)
        if (fallback.error) { insertError = fallback.error; console.error('[workspace/import-staff] Insert fallback error:', fallback.error) }
      }
    }
    if (withoutEmail.length && !insertError) {
      const res = await supabase.from('workspace_staff').insert(withoutEmail)
      if (res.error) { insertError = res.error; console.error('[workspace/import-staff] Insert (no email) error:', res.error) }
    }

    if (insertError) {
      console.error('[workspace/import-staff] Final insert error:', JSON.stringify(insertError))
      return NextResponse.json({ error: `Failed to import staff: ${insertError.message || 'unknown error'}` }, { status: 500 })
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
    console.error('[workspace/import-staff] Unhandled error:', err instanceof Error ? err.stack : err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Something went wrong' }, { status: 500 })
  }
}
