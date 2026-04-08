import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body || !body.clubId) {
      return NextResponse.json({ success: false, error: 'clubId required' }, { status: 400 })
    }
    const promoters = Number(body.promoters) || 0
    const passives = Number(body.passives) || 0
    const detractors = Number(body.detractors) || 0
    const total = promoters + passives + detractors
    const npsScore = total > 0 ? Math.round(((promoters - detractors) / total) * 100 * 10) / 10 : 0

    const supabase = getSupabase()
    if (!supabase) return NextResponse.json({ success: false, error: 'Supabase not configured' }, { status: 503 })

    const { error } = await supabase
      .from('football_nps_surveys')
      .insert({
        club_id: body.clubId,
        survey_date: body.surveyDate ?? new Date().toISOString().slice(0, 10),
        match_id: body.matchId ?? null,
        match_type: body.matchType ?? null,
        promoters,
        passives,
        detractors,
        total_responses: total,
        nps_score: npsScore,
        top_positive_themes: Array.isArray(body.topPositiveThemes) ? body.topPositiveThemes : [],
        top_negative_themes: Array.isArray(body.topNegativeThemes) ? body.topNegativeThemes : [],
        verbatim_comments: Array.isArray(body.verbatimComments) ? body.verbatimComments : [],
      })

    if (error) {
      console.error('[fan-engagement nps]', error)
      return NextResponse.json({ success: false, error: 'Insert failed' }, { status: 500 })
    }
    return NextResponse.json({ success: true, npsScore })
  } catch (err) {
    console.error('[fan-engagement nps]', err)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
