import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function validateAdmin(req: NextRequest) {
  const token = req.headers.get('x-admin-token')
  if (!token) return false
  const { data } = await getSupabase().from('admin_sessions').select('admin_id').eq('token', token).gt('expires_at', new Date().toISOString()).maybeSingle()
  return !!data
}

export async function POST(req: NextRequest) {
  if (!await validateAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { business_id, email } = await req.json()
  if (!business_id) return NextResponse.json({ error: 'business_id required' }, { status: 400 })

  const supabase = getSupabase()
  const sessionToken = crypto.randomUUID()

  await supabase.from('business_sessions').insert({
    token: sessionToken,
    business_id,
    email: email || 'admin@lumiocms.com',
    expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hour expiry for impersonation
  })

  return NextResponse.json({ session_token: sessionToken })
}
