import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

// Known column header patterns per provider
const CATAPULT_HEADERS = ['player load', 'total player load', 'velocity band', 'max_vel', 'openfield']
const STATSPORTS_HEADERS = ['dynamic stress load', 'hsr distance', 'speed zone', 'sonra', 'statsports']

function detectProvider(headers: string[]): 'catapult' | 'statsports' | 'unknown' {
  const joined = headers.join(' ').toLowerCase()
  if (CATAPULT_HEADERS.some(h => joined.includes(h))) return 'catapult'
  if (STATSPORTS_HEADERS.some(h => joined.includes(h))) return 'statsports'
  return 'unknown'
}

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return { headers: [], rows: [] }

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  const rows = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = values[i] || '' })
    return row
  })

  return { headers, rows }
}

function findCol(row: Record<string, string>, ...candidates: string[]): string | null {
  for (const c of candidates) {
    const key = Object.keys(row).find(k => k.toLowerCase().includes(c.toLowerCase()))
    if (key && row[key]) return row[key]
  }
  return null
}

function num(val: string | null): number | null {
  if (!val) return null
  const n = parseFloat(val)
  return isNaN(n) ? null : n
}

function int(val: string | null): number | null {
  if (!val) return null
  const n = parseInt(val, 10)
  return isNaN(n) ? null : n
}

function mapCatapultRow(row: Record<string, string>) {
  return {
    player_name: findCol(row, 'athlete', 'player', 'name') || 'Unknown',
    player_id: findCol(row, 'athlete_id', 'player_id') || '',
    total_distance: num(findCol(row, 'total_distance', 'distance')),
    high_speed_distance: num(findCol(row, 'velocity_band6', 'high_speed', 'hsr')),
    sprint_distance: num(findCol(row, 'velocity_band5', 'sprint_distance')),
    max_speed: num(findCol(row, 'max_vel', 'max_speed', 'top_speed')),
    player_load: num(findCol(row, 'total_player_load', 'player_load')),
    accelerations: int(findCol(row, 'accel', 'acceleration')),
    decelerations: int(findCol(row, 'decel', 'deceleration')),
    duration_mins: int(findCol(row, 'duration', 'total_duration')),
    heart_rate_avg: int(findCol(row, 'heart_rate_avg', 'avg_hr', 'avg_heart')),
    heart_rate_max: int(findCol(row, 'heart_rate_max', 'max_hr', 'max_heart')),
  }
}

function mapStatsportsRow(row: Record<string, string>) {
  return {
    player_name: findCol(row, 'player', 'athlete', 'name') || 'Unknown',
    player_id: findCol(row, 'player_id', 'athlete_id') || '',
    total_distance: num(findCol(row, 'total_distance', 'distance_km')),
    high_speed_distance: num(findCol(row, 'hsr_distance', 'high_speed', 'speed_zone_5')),
    sprint_distance: num(findCol(row, 'sprint_distance', 'speed_zone_6')),
    max_speed: num(findCol(row, 'max_speed', 'top_speed')),
    player_load: num(findCol(row, 'dynamic_stress_load', 'player_load', 'dsl')),
    accelerations: int(findCol(row, 'high_accel', 'accelerations')),
    decelerations: int(findCol(row, 'high_decel', 'decelerations')),
    duration_mins: int(findCol(row, 'duration', 'session_duration')),
    heart_rate_avg: int(findCol(row, 'avg_hr', 'heart_rate_avg')),
    heart_rate_max: int(findCol(row, 'max_hr', 'heart_rate_max')),
  }
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase()

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const clubId = formData.get('club_id') as string | null
  const sessionName = formData.get('session_name') as string | null
  const sessionType = (formData.get('session_type') as string | null) || 'training'
  const sessionDate = (formData.get('session_date') as string | null) || new Date().toISOString().split('T')[0]

  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
  if (!clubId) return NextResponse.json({ error: 'club_id required' }, { status: 400 })

  try {
    const text = await file.text()
    const { headers, rows } = parseCSV(text)

    if (rows.length === 0) return NextResponse.json({ error: 'CSV is empty or has no data rows' }, { status: 400 })

    const provider = detectProvider(headers)
    const mapRow = provider === 'catapult' ? mapCatapultRow : mapStatsportsRow

    // Insert session
    const { data: session, error: sessErr } = await supabase
      .from('gps_sessions')
      .insert({
        football_club_id: clubId,
        session_date: sessionDate,
        session_type: sessionType,
        session_name: sessionName || file.name.replace(/\.csv$/i, ''),
        provider: 'csv',
        raw_data: { source_provider: provider, columns: headers, row_count: rows.length },
      })
      .select('id')
      .single()

    if (sessErr) return NextResponse.json({ error: 'Failed to store session', detail: sessErr.message }, { status: 500 })

    // Map and insert player data
    const playerRows = rows.map(row => ({
      session_id: session.id,
      ...mapRow(row),
    }))

    const { error: playerErr } = await supabase.from('gps_player_data').insert(playerRows)
    if (playerErr) console.error('[upload-gps] player insert error:', playerErr)

    return NextResponse.json({
      success: true,
      session_id: session.id,
      provider_detected: provider,
      players_imported: playerRows.length,
      session_name: sessionName || file.name,
    })
  } catch (err) {
    console.error('[upload-gps]', err)
    return NextResponse.json({ error: 'Failed to parse CSV' }, { status: 500 })
  }
}
