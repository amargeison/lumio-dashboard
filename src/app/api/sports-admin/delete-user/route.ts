import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ADMIN_TOKEN = process.env.SPORTS_ADMIN_TOKEN || 'lumio-sports-admin-2026'

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-admin-token')
  if (token !== ADMIN_TOKEN) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  // Delete from sports_profiles first (FK constraint)
  await supabase.from('sports_profiles').delete().eq('id', userId)

  // Delete from Supabase auth
  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
