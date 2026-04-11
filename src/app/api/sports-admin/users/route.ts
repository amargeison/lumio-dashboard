import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_TOKEN = process.env.SPORTS_ADMIN_TOKEN || 'lumio-sports-admin-2026'

export async function GET(req: NextRequest) {
  const token = req.headers.get('x-admin-token')
  if (token !== ADMIN_TOKEN) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { searchParams } = new URL(req.url)
  const sport = searchParams.get('sport') || 'all'
  const search = searchParams.get('search') || ''

  let query = supabase.from('sports_profiles').select('*').order('created_at', { ascending: false })
  if (sport !== 'all') query = query.eq('sport', sport)
  if (search) query = query.ilike('display_name', `%${search}%`)

  const { data: profiles, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: authData } = await supabase.auth.admin.listUsers()
  const authMap = new Map(authData?.users?.map(u => [u.id, u]) || [])

  // Login counts (graceful if table doesn't exist yet)
  const loginCountMap = new Map<string, number>()
  try {
    const { data: loginCounts } = await supabase.from('sports_logins').select('user_id')
    loginCounts?.forEach(l => { loginCountMap.set(l.user_id, (loginCountMap.get(l.user_id) || 0) + 1) })
  } catch {}

  // Event counts (graceful if table doesn't exist yet)
  const eventMap = new Map<string, { ai_calls: number; quick_actions: number; total: number }>()
  try {
    const { data: eventCounts } = await supabase.from('sports_events').select('user_id, event_type')
    eventCounts?.forEach(e => {
      if (!eventMap.has(e.user_id)) eventMap.set(e.user_id, { ai_calls: 0, quick_actions: 0, total: 0 })
      const m = eventMap.get(e.user_id)!
      m.total++
      if (e.event_type === 'ai_call') m.ai_calls++
      if (e.event_type === 'quick_action') m.quick_actions++
    })
  } catch {}

  const users = profiles?.map(p => {
    const auth = authMap.get(p.id)
    const events = eventMap.get(p.id) || { ai_calls: 0, quick_actions: 0, total: 0 }
    return {
      id: p.id,
      email: auth?.email || '—',
      display_name: p.display_name,
      nickname: p.nickname,
      sport: p.sport,
      plan: p.plan,
      created_at: p.created_at,
      last_login: auth?.last_sign_in_at || null,
      login_count: loginCountMap.get(p.id) || 0,
      ai_calls: events.ai_calls,
      quick_actions: events.quick_actions,
      total_events: events.total,
      has_photo: !!p.avatar_url,
      has_brand: !!p.brand_name,
    }
  }) || []

  return NextResponse.json({ users, total: users.length })
}
