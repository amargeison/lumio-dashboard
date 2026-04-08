import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ targetId: string }> }) {
  try {
    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
    }
    const { targetId } = await params
    if (!targetId) {
      return NextResponse.json({ error: 'targetId required' }, { status: 400 })
    }

    const { data: existing, error: findErr } = await supabase
      .from('football_transfer_targets')
      .select('club_id, pipeline_stage')
      .eq('id', targetId)
      .single()
    if (findErr || !existing) {
      return NextResponse.json({ error: 'Target not found' }, { status: 404 })
    }

    const { error: updErr } = await supabase
      .from('football_transfer_targets')
      .update({ pipeline_added_at: null, pipeline_stage: 'Identified' })
      .eq('id', targetId)
    if (updErr) {
      console.error('[transfer-pipeline DELETE]', updErr)
      return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }

    await supabase.from('football_pipeline_activities').insert({
      target_id: targetId,
      club_id: existing.club_id,
      activity_type: 'stage_change',
      from_stage: existing.pipeline_stage ?? null,
      to_stage: null,
      note: 'Removed from pipeline',
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[transfer-pipeline DELETE]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
