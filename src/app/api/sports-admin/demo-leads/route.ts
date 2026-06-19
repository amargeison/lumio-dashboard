import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_TOKEN = process.env.SPORTS_ADMIN_TOKEN || 'lumio-sports-admin-2026'

// Demo signups are captured in `sports_demo_leads` (separate from sports_profiles).
export async function GET(req: NextRequest) {
  const token = req.headers.get('x-admin-token')
  if (token !== ADMIN_TOKEN) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return NextResponse.json({ leads: [] })

  const supabase = createClient(url, key)
  try {
    const { data, error } = await supabase
      .from('sports_demo_leads')
      .select('*')
      .order('last_seen', { ascending: false })
    if (error) return NextResponse.json({ leads: [], error: error.message })
    return NextResponse.json({ leads: data || [], total: (data || []).length })
  } catch {
    // Table may not exist yet — return empty rather than erroring.
    return NextResponse.json({ leads: [] })
  }
}
