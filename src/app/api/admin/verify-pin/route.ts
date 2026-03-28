import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function POST(req: NextRequest) {
  const { code } = await req.json().catch(() => ({ code: '' }))
  if (!code || code.length < 6) {
    return NextResponse.json({ error: 'PIN required' }, { status: 400 })
  }

  // Dev bypass
  const isDev = process.env.NEXT_PUBLIC_ENV === 'dev' || process.env.NODE_ENV !== 'production'
  const pin = process.env.ADMIN_PIN || '291847'
  const valid = code === pin || (isDev && code === '000000')

  if (!valid) {
    return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
  }

  // Create session — look up first admin user or use generated UUID
  const supabase = getSupabase()
  const { data: admin } = await supabase.from('admin_users').select('id, name, email, role').limit(1).maybeSingle()
  const adminId = admin?.id || crypto.randomUUID()

  const token = crypto.randomUUID()
  const { error: sessionError } = await supabase.from('admin_sessions').insert({
    token,
    admin_id: adminId,
    email: admin?.email || 'admin@lumiocms.com',
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  })

  if (sessionError) {
    console.error('[admin/verify-pin] Session insert error:', sessionError)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    token,
    name: admin?.name || 'Admin',
    role: admin?.role || 'superadmin',
    email: admin?.email || 'admin@lumiocms.com',
  })
}
