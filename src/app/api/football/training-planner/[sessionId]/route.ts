import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function DELETE(_req: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const supabase = getSupabase()
    if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
    const { sessionId } = params
    if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })

    await supabase.from('football_training_player_plans').delete().eq('session_id', sessionId)
    const { error } = await supabase.from('football_training_sessions').delete().eq('id', sessionId)
    if (error) {
      console.error('[training-planner DELETE]', error)
      return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[training-planner DELETE]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const supabase = getSupabase()
    if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
    const body = await req.json().catch(() => null)
    if (!body || !body.planId) {
      return NextResponse.json({ error: 'planId required' }, { status: 400 })
    }
    void params

    const updates: Record<string, any> = {}
    if (body.participation !== undefined) updates.participation = body.participation
    if (body.loadCapAu !== undefined) updates.load_cap_au = body.loadCapAu
    if (body.notes !== undefined) updates.flag_reason = body.notes

    const { error } = await supabase
      .from('football_training_player_plans')
      .update(updates)
      .eq('id', body.planId)
    if (error) {
      console.error('[training-planner plan PATCH]', error)
      return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[training-planner plan PATCH]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
