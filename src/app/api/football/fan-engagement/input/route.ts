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
    if (!body || !body.clubId || !body.metricType || body.value == null) {
      return NextResponse.json({ success: false, error: 'clubId, metricType and value required' }, { status: 400 })
    }
    const supabase = getSupabase()
    if (!supabase) return NextResponse.json({ success: false, error: 'Supabase not configured' }, { status: 503 })

    const { data, error } = await supabase
      .from('football_fan_metrics')
      .insert({
        club_id: body.clubId,
        metric_type: body.metricType,
        value: body.value,
        metric_date: body.metricDate ?? new Date().toISOString().slice(0, 10),
        notes: body.notes ?? null,
        source: 'manual',
      })
      .select('*')
      .single()

    if (error) {
      console.error('[fan-engagement input]', error)
      return NextResponse.json({ success: false, error: 'Insert failed' }, { status: 500 })
    }
    return NextResponse.json({ success: true, metric: data })
  } catch (err) {
    console.error('[fan-engagement input]', err)
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 })
  }
}
