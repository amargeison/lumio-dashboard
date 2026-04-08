import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parseCSV, type ParsedPlayerLoad } from '@/lib/gps-parser'
import { calculateACWR, type ACWRResult } from '@/lib/acwr-calculator'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase()

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const clubId = (formData.get('clubId') ?? formData.get('club_id')) as string | null
    const sessionTypeOverride = formData.get('sessionType') as string | null
    const uploadedBy = formData.get('uploadedBy') as string | null

    if (!file) return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 })
    if (!clubId) return NextResponse.json({ success: false, error: 'clubId required' }, { status: 400 })

    const text = await file.text()
    const parsed = parseCSV(text)
    if (!parsed) {
      return NextResponse.json({ success: false, error: 'Failed to parse CSV' }, { status: 400 })
    }

    const sessionType = sessionTypeOverride || parsed.sessionType || 'Training'

    // Insert session row
    const { data: session, error: sessErr } = await supabase
      .from('gps_sessions')
      .insert({
        football_club_id: clubId,
        session_date: parsed.sessionDate,
        session_type: sessionType,
        session_name: file.name.replace(/\.csv$/i, ''),
        provider: parsed.source.toLowerCase(),
        raw_data: { source: parsed.source, row_count: parsed.rows.length },
      })
      .select('id')
      .single()

    if (sessErr || !session) {
      console.error('[upload-gps] session insert error:', sessErr)
      return NextResponse.json({ success: false, error: 'Failed to store session' }, { status: 500 })
    }

    // Look up squad for player matching
    const { data: squad } = await supabase
      .from('football_players')
      .select('id, name')
      .eq('club_id', clubId)

    const matchPlayerId = (rawName: string): string | null => {
      if (!squad) return null
      const target = rawName.toLowerCase().trim()
      const hit = squad.find((p) => {
        const n = (p.name || '').toLowerCase().trim()
        return n === target || n.includes(target) || target.includes(n)
      })
      return hit?.id ?? null
    }

    // Insert per-player loads
    const playerRows = parsed.rows.map((r: ParsedPlayerLoad) => ({
      session_id: session.id,
      player_name: r.playerName,
      player_id: matchPlayerId(r.playerName),
      total_distance: r.totalDistanceM,
      high_speed_distance: r.highSpeedDistanceM,
      high_speed_distance_m: r.highSpeedDistanceM,
      sprint_distance: r.sprintDistanceM,
      sprint_distance_m: r.sprintDistanceM,
      max_speed: r.maxSpeedMs,
      training_load: r.trainingLoad,
    }))

    const { error: playerErr } = await supabase.from('gps_player_data').insert(playerRows)
    if (playerErr) console.error('[upload-gps] player insert error:', playerErr)

    // For each player, fetch last 28 days of training_load and compute ACWR
    const cutoff = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const flagged: ACWRResult[] = []
    const allResults: ACWRResult[] = []

    for (const r of parsed.rows) {
      const { data: history } = await supabase
        .from('gps_player_data')
        .select('training_load, gps_sessions!inner(session_date, football_club_id)')
        .eq('player_name', r.playerName)
        .gte('gps_sessions.session_date', cutoff)
        .eq('gps_sessions.football_club_id', clubId)

      const recentSessions =
        (history ?? []).map((row: any) => ({
          session_date: row.gps_sessions?.session_date,
          training_load: Number(row.training_load) || 0,
        })) ?? []

      const acwr = calculateACWR(r.playerName, clubId, recentSessions)
      allResults.push(acwr)
      if (acwr.flagged) flagged.push(acwr)

      // Upsert ACWR score
      const { error: upsertErr } = await supabase
        .from('football_acwr_scores')
        .upsert(
          {
            club_id: clubId,
            player_id: matchPlayerId(r.playerName),
            player_name: r.playerName,
            acute_load: acwr.acuteLoad,
            chronic_load: acwr.chronicLoad,
            acwr_ratio: acwr.acwrRatio,
            risk_level: acwr.riskLevel,
            flagged: acwr.flagged,
            calculated_at: new Date().toISOString(),
          },
          { onConflict: 'club_id,player_name' }
        )
      if (upsertErr) console.error('[upload-gps] acwr upsert error:', upsertErr)
    }

    void uploadedBy
    return NextResponse.json({
      success: true,
      sessionId: session.id,
      playersProcessed: parsed.rows.length,
      results: allResults,
      flagged,
    })
  } catch (err) {
    console.error('[upload-gps]', err)
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 })
  }
}
