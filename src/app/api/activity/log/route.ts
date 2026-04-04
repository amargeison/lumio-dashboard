import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  try {
    const { account_slug, account_type, action, department, user_email, details } = await req.json()
    if (!account_slug || !account_type || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    await supabase.from('activity_log').insert({ account_slug, account_type, action, department, user_email, details: details || {} })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to log' }, { status: 500 })
  }
}

// GET — for admin activity log page
export async function GET(req: NextRequest) {
  const supabase = getSupabase()
  const token = req.headers.get('x-admin-token')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: session } = await supabase.from('admin_sessions').select('admin_id').eq('token', token).gt('expires_at', new Date().toISOString()).maybeSingle()
  if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  const slug = req.nextUrl.searchParams.get('slug')
  const page = parseInt(req.nextUrl.searchParams.get('page') || '0')
  const limit = 50

  let query = supabase.from('activity_log').select('*').order('created_at', { ascending: false }).range(page * limit, (page + 1) * limit - 1)
  if (slug) query = query.eq('account_slug', slug)

  const { data } = await query
  return NextResponse.json({ logs: data || [] })
}
