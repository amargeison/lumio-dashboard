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
    const supabase = getSupabase()
    if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
    const body = await req.json().catch(() => null)
    if (!body || !body.clubId) return NextResponse.json({ error: 'clubId required' }, { status: 400 })

    const { data: existing } = await supabase
      .from('football_onboarding_sessions')
      .select('*')
      .eq('club_id', body.clubId)
      .is('completed_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ sessionId: existing.id, session: existing })
    }

    const { data: created, error } = await supabase
      .from('football_onboarding_sessions')
      .insert({ club_id: body.clubId, current_step: 1 })
      .select('*')
      .single()

    if (error || !created) {
      console.error('[onboarding POST]', error)
      return NextResponse.json({ error: 'Insert failed' }, { status: 500 })
    }
    return NextResponse.json({ sessionId: created.id, session: created })
  } catch (err) {
    console.error('[onboarding POST]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = getSupabase()
    if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
    const body = await req.json().catch(() => null)
    if (!body || !body.sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })

    const { data: existing, error: getErr } = await supabase
      .from('football_onboarding_sessions')
      .select('steps_completed')
      .eq('id', body.sessionId)
      .single()
    if (getErr || !existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const updates: Record<string, any> = {}
    if (typeof body.currentStep === 'number') updates.current_step = body.currentStep
    if (body.stepCompleted) {
      const merged = Array.from(new Set([...(existing.steps_completed ?? []), body.stepCompleted]))
      updates.steps_completed = merged
    }
    if (typeof body.currentStep === 'number' && body.currentStep >= 6) {
      updates.completed_at = new Date().toISOString()
    }

    const { error: updErr } = await supabase
      .from('football_onboarding_sessions')
      .update(updates)
      .eq('id', body.sessionId)
    if (updErr) {
      console.error('[onboarding PATCH]', updErr)
      return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[onboarding PATCH]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
