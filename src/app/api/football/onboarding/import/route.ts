import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

interface ImportError { row: number; error: string }

async function importSquad(supabase: any, clubId: string, rows: any[]): Promise<{ succeeded: number; failed: number; errors: ImportError[] }> {
  let succeeded = 0
  let failed = 0
  const errors: ImportError[] = []
  for (const row of rows) {
    if (!row?.name || !row?.position) {
      failed++
      errors.push({ row: row?.rowIndex ?? 0, error: 'Missing name or position' })
      continue
    }
    // Find existing by name+club
    const { data: existing } = await supabase
      .from('football_players')
      .select('id')
      .eq('club_id', clubId)
      .eq('name', row.name)
      .maybeSingle()
    const payload = {
      club_id: clubId,
      name: row.name,
      position: row.position,
      squad_number: row.squadNumber ?? null,
      nationality: row.nationality ?? null,
      date_of_birth: row.dateOfBirth ?? null,
      photo_url: row.photoUrl ?? null,
      status: row.status ?? 'fit',
    }
    const result = existing
      ? await supabase.from('football_players').update(payload).eq('id', existing.id)
      : await supabase.from('football_players').insert(payload)
    if (result.error) {
      failed++
      errors.push({ row: row.rowIndex ?? 0, error: result.error.message })
    } else {
      succeeded++
    }
  }
  return { succeeded, failed, errors }
}

async function importContracts(supabase: any, clubId: string, rows: any[]): Promise<{ succeeded: number; failed: number; errors: ImportError[] }> {
  let succeeded = 0
  let failed = 0
  const errors: ImportError[] = []
  for (const row of rows) {
    if (!row?.playerName) {
      failed++
      errors.push({ row: row?.rowIndex ?? 0, error: 'Missing player name' })
      continue
    }
    const { data: player } = await supabase
      .from('football_players')
      .select('id')
      .eq('club_id', clubId)
      .eq('name', row.playerName)
      .maybeSingle()
    if (!player) {
      failed++
      errors.push({ row: row.rowIndex ?? 0, error: `Player "${row.playerName}" not found in squad — import squad first` })
      continue
    }
    const { data: existing } = await supabase
      .from('football_contracts')
      .select('id')
      .eq('player_id', player.id)
      .maybeSingle()
    const payload = {
      player_id: player.id,
      club_id: clubId,
      start_date: row.startDate ?? null,
      end_date: row.endDate ?? null,
      weekly_wage: row.weeklyWage ?? null,
      release_clause: row.releaseClause ?? null,
      option_to_extend: !!row.optionToExtend,
    }
    const result = existing
      ? await supabase.from('football_contracts').update(payload).eq('id', existing.id)
      : await supabase.from('football_contracts').insert(payload)
    if (result.error) {
      failed++
      errors.push({ row: row.rowIndex ?? 0, error: result.error.message })
    } else {
      succeeded++
    }
  }
  return { succeeded, failed, errors }
}

async function importFixtures(supabase: any, clubId: string, rows: any[]): Promise<{ succeeded: number; failed: number; errors: ImportError[] }> {
  let succeeded = 0
  let failed = 0
  const errors: ImportError[] = []
  for (const row of rows) {
    if (!row?.opponent) {
      failed++
      errors.push({ row: row?.rowIndex ?? 0, error: 'Missing opponent' })
      continue
    }
    const payload = {
      club_id: clubId,
      opponent: row.opponent,
      kickoff_time: row.kickoffTime ?? null,
      venue: row.venue ?? null,
      competition: row.competition ?? null,
      result_home: row.resultHome ?? null,
      result_away: row.resultAway ?? null,
    }
    const { data: existing } = await supabase
      .from('football_fixtures')
      .select('id')
      .eq('club_id', clubId)
      .eq('opponent', row.opponent)
      .eq('kickoff_time', row.kickoffTime ?? null)
      .maybeSingle()
    const result = existing
      ? await supabase.from('football_fixtures').update(payload).eq('id', existing.id)
      : await supabase.from('football_fixtures').insert(payload)
    if (result.error) {
      failed++
      errors.push({ row: row.rowIndex ?? 0, error: result.error.message })
    } else {
      succeeded++
    }
  }
  return { succeeded, failed, errors }
}

async function importClubInfo(supabase: any, clubId: string, rows: any[]): Promise<{ succeeded: number; failed: number; errors: ImportError[] }> {
  const info = rows[0] ?? {}
  const payload: Record<string, any> = {}
  if (info.name !== undefined) payload.name = info.name
  if (info.shortName !== undefined) payload.short_name = info.shortName
  if (info.league !== undefined) payload.league = info.league
  if (info.primaryColour !== undefined) payload.primary_colour = info.primaryColour
  if (info.secondaryColour !== undefined) payload.secondary_colour = info.secondaryColour
  if (info.logoUrl !== undefined) payload.logo_url = info.logoUrl

  if (Object.keys(payload).length === 0) {
    return { succeeded: 0, failed: 0, errors: [] }
  }

  const { error } = await supabase.from('football_clubs').update(payload).eq('id', clubId)
  if (error) {
    return { succeeded: 0, failed: 1, errors: [{ row: 1, error: error.message }] }
  }
  return { succeeded: 1, failed: 0, errors: [] }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase()
    if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
    const body = await req.json().catch(() => null)
    if (!body || !body.clubId || !body.sessionId || !body.importType || !Array.isArray(body.rows)) {
      return NextResponse.json({ error: 'clubId, sessionId, importType, rows[] required' }, { status: 400 })
    }

    const rowsAttempted = body.rows.length
    let result: { succeeded: number; failed: number; errors: ImportError[] }

    if (body.importType === 'squad') result = await importSquad(supabase, body.clubId, body.rows)
    else if (body.importType === 'contracts') result = await importContracts(supabase, body.clubId, body.rows)
    else if (body.importType === 'fixtures') result = await importFixtures(supabase, body.clubId, body.rows)
    else if (body.importType === 'club_info') result = await importClubInfo(supabase, body.clubId, body.rows)
    else return NextResponse.json({ error: 'Invalid importType' }, { status: 400 })

    // Log + bump session counters
    await supabase.from('football_import_logs').insert({
      club_id: body.clubId,
      onboarding_id: body.sessionId,
      import_type: body.importType,
      method: body.method ?? 'csv',
      rows_attempted: rowsAttempted,
      rows_succeeded: result.succeeded,
      rows_failed: result.failed,
      errors: result.errors.length > 0 ? result.errors : null,
    })

    if (body.importType === 'squad' || body.importType === 'contracts' || body.importType === 'fixtures') {
      const colMap: Record<string, string> = {
        squad: 'squad_import_count',
        contracts: 'contracts_import_count',
        fixtures: 'fixtures_import_count',
      }
      await supabase.from('football_onboarding_sessions').update({
        [colMap[body.importType]]: result.succeeded,
        import_method: body.method ?? 'csv',
      }).eq('id', body.sessionId)
    }

    return NextResponse.json({
      success: result.failed === 0,
      rowsAttempted,
      rowsSucceeded: result.succeeded,
      rowsFailed: result.failed,
      errors: result.errors,
    })
  } catch (err) {
    console.error('[onboarding import POST]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
