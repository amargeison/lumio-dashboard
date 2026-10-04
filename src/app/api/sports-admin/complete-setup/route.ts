import { NextRequest, NextResponse } from 'next/server'
import { sportsAdminOk } from '@/lib/sports-admin/auth'
import { createClient } from '@supabase/supabase-js'


export async function POST(req: NextRequest) {
  const token = req.headers.get('x-admin-token')
  if (!sportsAdminOk(token)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { error } = await supabase.from('sports_profiles').update({ setup_complete: true }).eq('id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
