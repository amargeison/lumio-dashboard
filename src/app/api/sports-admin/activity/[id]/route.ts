import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_TOKEN = process.env.SPORTS_ADMIN_TOKEN || 'lumio-sports-admin-2026'

// Returns a unified activity feed for a sports account, shaped like the CMS
// activity_log ({ action, department, created_at }) so the shared intelligence
// UI can render it. Merges sports_logins (as 'login') with sports_events.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.headers.get('x-admin-token')
  if (token !== ADMIN_TOKEN) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return NextResponse.json({ activity: [] })

  const supabase = createClient(url, key)
  const activity: { action: string; department: string | null; created_at: string }[] = []

  // Logins
  try {
    const { data } = await supabase.from('sports_logins').select('created_at').eq('user_id', id).order('created_at', { ascending: false }).limit(200)
    data?.forEach(l => activity.push({ action: 'login', department: null, created_at: l.created_at }))
  } catch {}

  // Events
  try {
    const { data } = await supabase.from('sports_events').select('event_type, event_name, created_at').eq('user_id', id).order('created_at', { ascending: false }).limit(200)
    data?.forEach((e: any) => activity.push({ action: e.event_type || 'event', department: e.event_name || null, created_at: e.created_at }))
  } catch {}

  activity.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  return NextResponse.json({ activity })
}
