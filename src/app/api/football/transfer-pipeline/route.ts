import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

const PIPELINE_FIELDS =
  'id, name, age, position, current_club, current_league, estimated_value, weekly_wage_estimate, contract_expires, lumio_fit_score, pipeline_stage, pipeline_notes, asking_price, agent_name, agent_contact, priority, deadline_date, pipeline_added_at, strengths, weaknesses, recommendation'

const PRIORITY_RANK: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 }
const STAGE_ORDER = ['Identified', 'Approached', 'Negotiating', 'Done', 'Failed']

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
    }
    const { searchParams } = new URL(req.url)
    const clubId = searchParams.get('clubId')
    if (!clubId) {
      return NextResponse.json({ error: 'clubId required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('football_transfer_targets')
      .select(PIPELINE_FIELDS)
      .eq('club_id', clubId)
      .not('pipeline_added_at', 'is', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[transfer-pipeline GET]', error)
      return NextResponse.json({ error: 'Query failed' }, { status: 500 })
    }

    const rows = (data ?? []).slice().sort((a: any, b: any) => {
      const sa = STAGE_ORDER.indexOf(a.pipeline_stage)
      const sb = STAGE_ORDER.indexOf(b.pipeline_stage)
      if (sa !== sb) return sa - sb
      const pa = PRIORITY_RANK[a.priority] ?? 0
      const pb = PRIORITY_RANK[b.priority] ?? 0
      return pb - pa
    })

    return NextResponse.json({ targets: rows })
  } catch (err) {
    console.error('[transfer-pipeline GET]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
    }
    const body = await req.json().catch(() => null)
    if (!body || !body.clubId) {
      return NextResponse.json({ error: 'clubId required' }, { status: 400 })
    }

    const stage = body.stage ?? 'Identified'
    const now = new Date().toISOString()

    let targetId: string | null = body.targetId ?? null
    let target: any = null

    if (targetId) {
      const { data: existing, error: findErr } = await supabase
        .from('football_transfer_targets')
        .select(PIPELINE_FIELDS)
        .eq('id', targetId)
        .single()
      if (findErr || !existing) {
        return NextResponse.json({ error: 'Target not found' }, { status: 404 })
      }
      const updates: Record<string, any> = {
        pipeline_stage: stage,
        pipeline_added_at: existing.pipeline_added_at ?? now,
      }
      if (body.notes !== undefined) updates.pipeline_notes = body.notes
      if (body.askingPrice !== undefined) updates.asking_price = body.askingPrice
      if (body.agentName !== undefined) updates.agent_name = body.agentName
      if (body.agentContact !== undefined) updates.agent_contact = body.agentContact
      if (body.priority !== undefined) updates.priority = body.priority
      if (body.deadlineDate !== undefined) updates.deadline_date = body.deadlineDate

      const { data: updated, error: updErr } = await supabase
        .from('football_transfer_targets')
        .update(updates)
        .eq('id', targetId)
        .select(PIPELINE_FIELDS)
        .single()
      if (updErr) {
        console.error('[transfer-pipeline POST update]', updErr)
        return NextResponse.json({ error: 'Update failed' }, { status: 500 })
      }
      target = updated
    } else if (body.target) {
      const t = body.target
      const insertRow = {
        club_id: body.clubId,
        name: t.name,
        age: t.age ?? null,
        nationality: t.nationality ?? null,
        current_club: t.currentClub ?? t.current_club ?? null,
        current_league: t.currentLeague ?? t.current_league ?? null,
        position: t.position,
        estimated_value: t.estimatedValue ?? t.estimated_value ?? null,
        weekly_wage_estimate: t.weeklyWageEstimate ?? t.weekly_wage_estimate ?? null,
        contract_expires: t.contractExpires ?? t.contract_expires ?? null,
        strengths: t.strengths ?? [],
        weaknesses: t.weaknesses ?? [],
        lumio_fit_score: t.lumioFitScore ?? t.lumio_fit_score ?? 0,
        recommendation: t.recommendation ?? null,
        source: t.source ?? 'manual',
        pipeline_stage: stage,
        pipeline_added_at: now,
        pipeline_notes: body.notes ?? null,
        asking_price: body.askingPrice ?? null,
        agent_name: body.agentName ?? null,
        agent_contact: body.agentContact ?? null,
        priority: body.priority ?? 'Medium',
        deadline_date: body.deadlineDate ?? null,
      }
      const { data: inserted, error: insErr } = await supabase
        .from('football_transfer_targets')
        .insert(insertRow)
        .select(PIPELINE_FIELDS)
        .single()
      if (insErr) {
        console.error('[transfer-pipeline POST insert]', insErr)
        return NextResponse.json({ error: 'Insert failed' }, { status: 500 })
      }
      target = inserted
      targetId = inserted?.id ?? null
    } else {
      return NextResponse.json({ error: 'targetId or target required' }, { status: 400 })
    }

    if (targetId) {
      await supabase.from('football_pipeline_activities').insert({
        target_id: targetId,
        club_id: body.clubId,
        activity_type: 'stage_change',
        from_stage: null,
        to_stage: stage,
        note: body.notes ?? null,
      })
    }

    return NextResponse.json({ success: true, target })
  } catch (err) {
    console.error('[transfer-pipeline POST]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = getSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
    }
    const body = await req.json().catch(() => null)
    if (!body || !body.targetId || !body.clubId || !body.stage) {
      return NextResponse.json({ error: 'targetId, clubId, stage required' }, { status: 400 })
    }

    const { data: existing, error: findErr } = await supabase
      .from('football_transfer_targets')
      .select('pipeline_stage')
      .eq('id', body.targetId)
      .single()
    if (findErr || !existing) {
      return NextResponse.json({ error: 'Target not found' }, { status: 404 })
    }

    const { error: updErr } = await supabase
      .from('football_transfer_targets')
      .update({ pipeline_stage: body.stage })
      .eq('id', body.targetId)
    if (updErr) {
      console.error('[transfer-pipeline PATCH]', updErr)
      return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }

    await supabase.from('football_pipeline_activities').insert({
      target_id: body.targetId,
      club_id: body.clubId,
      activity_type: 'stage_change',
      from_stage: existing.pipeline_stage ?? null,
      to_stage: body.stage,
      note: body.note ?? null,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[transfer-pipeline PATCH]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
