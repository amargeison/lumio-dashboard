import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

// GET — return today's actioned items
export async function GET() {
  try {
    const supabase = getSupabase()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from('briefing_actions')
      .select('item_type, item_ref, action_taken, actioned_at')
      .gte('actioned_at', today.toISOString())
      .order('actioned_at', { ascending: false })

    if (error) return NextResponse.json({ actions: [] })
    return NextResponse.json({ actions: data ?? [] })
  } catch {
    return NextResponse.json({ actions: [] })
  }
}

// POST — record an action taken
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase()
    let body: Record<string, string>
    try { body = await req.json() } catch { body = {} }

    const { item_type, item_ref, action_taken } = body
    if (!item_type || !item_ref || !action_taken) {
      return NextResponse.json({ error: 'Missing fields: item_type, item_ref, action_taken' }, { status: 400 })
    }

    const { error } = await supabase.from('briefing_actions').insert({ item_type, item_ref, action_taken })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ status: 'ok' })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
