import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { featuresForTier, type ClubTier } from '@/lib/feature-gates'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function GET(req: NextRequest) {
  try {
    const clubId = req.nextUrl.searchParams.get('clubId')
    if (!clubId) return NextResponse.json({ error: 'clubId required' }, { status: 400 })
    const supabase = getSupabase()
    if (!supabase) return NextResponse.json(null)

    const { data, error } = await supabase
      .from('football_clubs')
      .select('tier, tier_expires_at, trial_ends_at')
      .eq('id', clubId)
      .maybeSingle()

    if (error || !data) return NextResponse.json(null)
    const tier = (data.tier ?? 'starter') as ClubTier
    return NextResponse.json({
      tier,
      tierExpires: data.tier_expires_at,
      trialEnds: data.trial_ends_at,
      features: featuresForTier(tier),
    })
  } catch (err) {
    console.error('[tier GET]', err)
    return NextResponse.json(null)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body || !body.clubId || !body.newTier || !body.adminKey) {
      return NextResponse.json({ success: false, error: 'clubId, newTier and adminKey required' }, { status: 400 })
    }
    if (body.adminKey !== process.env.LUMIO_ADMIN_KEY) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const supabase = getSupabase()
    if (!supabase) return NextResponse.json({ success: false, error: 'Supabase not configured' }, { status: 503 })

    const { error } = await supabase
      .from('football_clubs')
      .update({ tier: body.newTier, tier_expires_at: body.expiresAt ?? null })
      .eq('id', body.clubId)

    if (error) return NextResponse.json({ success: false, error: 'Update failed' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[tier POST]', err)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
