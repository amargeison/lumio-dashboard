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

  // Create session
  const supabase = getSupabase()
  const token = crypto.randomUUID()
  await supabase.from('admin_sessions').insert({
    token,
    admin_id: 'admin',
    email: 'admin@lumiocms.com',
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  })

  return NextResponse.json({
    success: true,
    token,
    name: 'Admin',
    role: 'superadmin',
  })
}
