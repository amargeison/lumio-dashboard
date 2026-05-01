import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Johan Sports — Lumio's named GPS-vest partner. Real OAuth + session sync
// pipeline lives in the same `integration_tokens` / `gps_sessions` /
// `gps_player_data` tables previously used for legacy vendors. Endpoint
// shape: POST { club_id, api_key } stores credentials; subsequent ingestion
// runs via the per-club sync job.

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export async function GET(req: NextRequest) {
  const supabase = getSupabase()
  const clubId = req.nextUrl.searchParams.get('club_id')
  if (!clubId) return NextResponse.json({ error: 'club_id required' }, { status: 400 })

  const { data } = await supabase
    .from('integration_tokens')
    .select('access_token')
    .eq('business_id', clubId)
    .eq('provider', 'johansports')
    .maybeSingle()

  return NextResponse.json({ connected: !!data?.access_token, provider: 'johansports' })
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'invalid body' }, { status: 400 })
  const { club_id, api_key } = body
  if (!club_id || !api_key) return NextResponse.json({ error: 'club_id and api_key required' }, { status: 400 })

  const { error } = await supabase
    .from('integration_tokens')
    .upsert({ business_id: club_id, provider: 'johansports', access_token: api_key }, { onConflict: 'business_id,provider' })

  if (error) return NextResponse.json({ error: 'Failed to store credentials', detail: error.message }, { status: 500 })
  return NextResponse.json({ connected: true, provider: 'johansports' })
}
