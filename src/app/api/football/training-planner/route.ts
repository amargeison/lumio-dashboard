import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function applyRiskLogic(acwr: number, chronic: number) {
  if (acwr > 1.5) {
    return {
      risk_flag: 'High Risk' as const,
      participation: 'Modified' as const,
      load_cap_au: chronic * 0.7,
      flag_reason: `ACWR ${acwr.toFixed(2)} — overload risk`,
    }
  }
  if (acwr >= 1.3) {
    return {
      risk_flag: 'Caution' as const,
      participation: 'Modified' as const,
      load_cap_au: chronic * 0.85,
      flag_reason: `ACWR ${acwr.toFixed(2)} — elevated risk`,
    }
  }
  if (acwr > 0 && acwr < 0.8) {
    return {
      risk_flag: 'Monitor' as const,
      participation: 'Full' as const,
      load_cap_au: null as number | null,
      flag_reason: 'Undertraining — consider load increase',
    }
  }
  return {
    risk_flag: 'None' as const,
    participation: 'Full' as const,
    load_cap_au: null as number | null,
    flag_reason: null as string | null,
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabase()
    if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })

    const { searchParams } = new URL(req.url)
    const clubId = searchParams.get('clubId')
    const weekStart = searchParams.get('weekStart')
    if (!clubId || !weekStart) {
      return NextResponse.json({ error: 'clubId and weekStart required' }, { status: 400 })
    }
    const weekEnd = addDays(weekStart, 6)

    const [sessionsRes, plansRes, acwrRes, fixturesRes] = await Promise.all([
      supabase
        .from('football_training_sessions')
        .select('*')
        .eq('club_id', clubId)
        .gte('session_date', weekStart)
        .lte('session_date', weekEnd)
        .order('session_date', { ascending: true }),
      supabase
        .from('football_training_player_plans')
        .select('*, football_players(name, position, status)')
        .eq('club_id', clubId),
      supabase
        .from('football_acwr_scores')
        .select('*')
        .eq('club_id', clubId),
      supabase
        .from('football_fixtures')
        .select('*')
        .eq('club_id', clubId)
        .gte('fixture_date', weekStart)
        .order('fixture_date', { ascending: true })
        .limit(2),
    ])

    if (sessionsRes.error) console.error('[training-planner GET sessions]', sessionsRes.error)

    return NextResponse.json({
      sessions: sessionsRes.data ?? [],
      playerPlans: plansRes.data ?? [],
      acwrScores: acwrRes.data ?? [],
      upcomingFixtures: fixturesRes.data ?? [],
    })
  } catch (err) {
    console.error('[training-planner GET]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase()
    if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })

    const body = await req.json().catch(() => null)
    if (!body || !body.clubId || !body.sessionDate || !body.sessionName || !body.sessionType) {
      return NextResponse.json({ error: 'clubId, sessionDate, sessionName, sessionType required' }, { status: 400 })
    }

    const { data: session, error: sessionErr } = await supabase
      .from('football_training_sessions')
      .insert({
        club_id: body.clubId,
        session_date: body.sessionDate,
        session_name: body.sessionName,
        session_type: body.sessionType,
        planned_duration_mins: body.plannedDurationMins ?? 90,
        planned_intensity: body.plannedIntensity ?? 'Medium',
        planned_load_au: body.plannedLoadAu ?? null,
        notes: body.notes ?? null,
        is_rest_day: body.isRestDay ?? false,
      })
      .select('*')
      .single()

    if (sessionErr || !session) {
      console.error('[training-planner POST session]', sessionErr)
      return NextResponse.json({ error: 'Insert failed' }, { status: 500 })
    }

    // Auto-generate player plans
    const { data: players } = await supabase
      .from('football_players')
      .select('id, name, status')
      .eq('club_id', body.clubId)

    const { data: acwrScores } = await supabase
      .from('football_acwr_scores')
      .select('player_id, player_name, acwr_ratio, chronic_load')
      .eq('club_id', body.clubId)

    const acwrByPlayerId = new Map<string, any>()
    const acwrByName = new Map<string, any>()
    for (const s of acwrScores ?? []) {
      if (s.player_id) acwrByPlayerId.set(s.player_id, s)
      if (s.player_name) acwrByName.set(s.player_name, s)
    }

    const planRows: any[] = []
    let flaggedCount = 0
    for (const p of players ?? []) {
      const isInjured = p.status === 'injured'
      let participation: string = 'Full'
      let load_cap_au: number | null = null
      let acwr_at_planning: number | null = null
      let risk_flag: string = 'None'
      let flag_reason: string | null = null

      if (isInjured) {
        participation = 'Unavailable'
        flag_reason = 'Injured'
      } else {
        const score = acwrByPlayerId.get(p.id) ?? acwrByName.get(p.name)
        if (score) {
          const acwr = Number(score.acwr_ratio) || 0
          const chronic = Number(score.chronic_load) || 0
          acwr_at_planning = acwr
          const r = applyRiskLogic(acwr, chronic)
          participation = r.participation
          load_cap_au = r.load_cap_au
          risk_flag = r.risk_flag
          flag_reason = r.flag_reason
          if (r.risk_flag !== 'None') flaggedCount++
        }
      }

      planRows.push({
        session_id: session.id,
        player_id: p.id,
        club_id: body.clubId,
        participation,
        load_cap_au,
        acwr_at_planning,
        risk_flag,
        flag_reason,
      })
    }

    let playerPlans: any[] = []
    if (planRows.length > 0) {
      const { data: inserted, error: planErr } = await supabase
        .from('football_training_player_plans')
        .insert(planRows)
        .select('*')
      if (planErr) console.error('[training-planner POST plans]', planErr)
      playerPlans = inserted ?? []
    }

    return NextResponse.json({ session, playerPlans, flaggedCount })
  } catch (err) {
    console.error('[training-planner POST]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = getSupabase()
    if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })

    const body = await req.json().catch(() => null)
    if (!body || !body.sessionId || !body.updates) {
      return NextResponse.json({ error: 'sessionId and updates required' }, { status: 400 })
    }

    const allowed = ['session_name','session_type','planned_duration_mins','planned_intensity','planned_load_au','notes','is_rest_day','session_date']
    const updates: Record<string, any> = {}
    for (const k of allowed) if (body.updates[k] !== undefined) updates[k] = body.updates[k]

    const { error } = await supabase
      .from('football_training_sessions')
      .update(updates)
      .eq('id', body.sessionId)
    if (error) {
      console.error('[training-planner PATCH]', error)
      return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[training-planner PATCH]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
