import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-workspace-token')
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 })

  const supabase = getSupabase()

  // Validate session
  const { data: session } = await supabase
    .from('business_sessions')
    .select('business_id')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  const { data: business } = await supabase
    .from('businesses')
    .select('slug')
    .eq('id', session.business_id)
    .single()

  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  const body = await req.json()
  const { rows } = body as { rows: { name: string; email?: string; role?: string; department?: string; phone?: string; start_date?: string }[] }

  if (!rows?.length) return NextResponse.json({ error: 'No data to import' }, { status: 400 })

  // Ensure table exists (idempotent — Supabase ignores if exists)
  // Note: table should be pre-created via migration. This is a fallback insert.

  const insertRows = rows.map(r => ({
    business_id: session.business_id,
    first_name: r.name?.split(' ')[0] || '',
    last_name: r.name?.split(' ').slice(1).join(' ') || '',
    job_title: r.role || '',
    department: r.department || '',
    email: r.email || null,
    phone: r.phone || null,
    start_date: r.start_date || null,
    status: 'Active',
  }))

  const { error } = await supabase
    .from('business_employees')
    .insert(insertRows)

  if (error) {
    console.error('[import/staff] Insert failed:', error)
    return NextResponse.json({ error: 'Failed to save employees' }, { status: 500 })
  }

  return NextResponse.json({ success: true, imported: insertRows.length })
}
