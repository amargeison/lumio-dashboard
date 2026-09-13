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

// Remove a demo lead. The row is a lead-capture record, not an account — deleting
// it removes them from this list and nothing else. Their Supabase auth user (if
// they have one) and any real portal they own are untouched, which is the whole
// difference from the delete on the live accounts page.
//
// Keyed on email + sport because that is the pair the table is unique on: the
// same person trying the tennis demo and the coach demo is two leads, and
// deleting one must not silently take the other.
export async function DELETE(req: NextRequest) {
  const token = req.headers.get('x-admin-token')
  if (token !== ADMIN_TOKEN) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { email, sport } = (await req.json().catch(() => ({}))) as { email?: string; sport?: string }
  if (!email || !sport) return NextResponse.json({ error: 'email and sport are required' }, { status: 400 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  const supabase = createClient(url, key)
  const { error } = await supabase.from('sports_demo_leads')
    .delete()
    .eq('email', email.toLowerCase())
    .eq('sport', sport)
  if (error) {
    console.error('[sports-admin/demo-leads] delete', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
