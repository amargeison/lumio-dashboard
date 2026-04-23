import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Retention: delete page_views rows older than 90 days.
// Invoke manually for now (curl -X POST /api/admin/analytics/cleanup
// with x-admin-token). Wiring a cron / systemd timer is a follow-up.

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function validateAdmin(req: NextRequest) {
  const token = req.headers.get('x-admin-token')
  if (!token) return null
  const supabase = getSupabase()
  const { data } = await supabase
    .from('admin_sessions')
    .select('admin_id')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()
  return data
}

export async function POST(req: NextRequest) {
  if (!await validateAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = getSupabase()

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 90)

  const { count: before } = await supabase
    .from('page_views')
    .select('*', { count: 'exact', head: true })
    .lt('created_at', cutoff.toISOString())

  const { error } = await supabase
    .from('page_views')
    .delete()
    .lt('created_at', cutoff.toISOString())

  if (error) {
    console.error('[admin/analytics/cleanup] delete error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ deleted: before || 0, cutoff: cutoff.toISOString() })
}
