import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function currentTerm(): string {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  if (month >= 9) return `Autumn ${year}`
  if (month <= 1) return `Autumn ${year - 1}`
  if (month <= 3) return `Spring ${year}`
  return `Summer ${year}`
}

function getEscalationStage(attendancePct: number): number {
  if (attendancePct <= 80) return 3
  if (attendancePct <= 85) return 2
  return 1
}

// POST: manually create/update a concern, or trigger a daily check
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const {
    action,
    pupil_name,
    year_group,
    class_name,
    attendance_pct,
    absences_count,
    total_sessions,
    contact_entry,
    concern_id,
  } = body as {
    action: 'create_concern' | 'log_contact' | 'resolve' | 'run_daily_check'
    pupil_name?: string
    year_group?: string
    class_name?: string
    attendance_pct?: number
    absences_count?: number
    total_sessions?: number
    contact_entry?: { method: string; outcome: string }
    concern_id?: string
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
                   ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const term = currentTerm()

  // ── Action: Create / update concern ─────────────────────────────────────────
  if (action === 'create_concern') {
    if (!pupil_name || !year_group || attendance_pct === undefined) {
      return NextResponse.json({ error: 'Missing fields for create_concern' }, { status: 400 })
    }

    const stage = getEscalationStage(attendance_pct)

    // Check if concern already exists for this pupil + term
    const { data: existing } = await supabase
      .from('school_attendance_concerns')
      .select('id, escalation_stage, contact_log')
      .eq('pupil_name', pupil_name)
      .eq('term', term)
      .eq('status', 'Open')
      .single()

    let savedId: string | null = null

    if (existing) {
      // Update if stage has escalated
      const updateData: Record<string, unknown> = {
        attendance_pct,
        absences_count: absences_count ?? 0,
        updated_at: new Date().toISOString(),
      }
      if (stage > existing.escalation_stage) {
        updateData.escalation_stage = stage
        updateData.stage_triggered_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('school_attendance_concerns')
        .update(updateData)
        .eq('id', existing.id)

      if (error) console.error('[attendance-concerns] Update error:', error)
      savedId = existing.id
    } else {
      const { data, error } = await supabase
        .from('school_attendance_concerns')
        .insert({
          pupil_name,
          year_group,
          class_name: class_name ?? null,
          attendance_pct,
          absences_count: absences_count ?? 0,
          total_sessions: total_sessions ?? 0,
          term,
          escalation_stage: stage,
          stage_triggered_at: new Date().toISOString(),
          contact_log: [],
          status: 'Open',
        })
        .select('id')
        .single()

      if (error) console.error('[attendance-concerns] Insert error:', error)
      savedId = data?.id ?? null
    }

    // Fire n8n webhook
    const webhookUrl = process.env.N8N_SCHOOL_ATTENDANCE_CONCERN_WEBHOOK_URL
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: savedId,
            pupil_name,
            year_group,
            attendance_pct,
            escalation_stage: stage,
            term,
            triggers: {
              notify_class_teacher: true,
              notify_attendance_officer: true,
              generate_letter: true,
              ewo_referral: stage === 3,
            },
          }),
        })
      } catch (err) {
        console.error('[attendance-concerns] Webhook error:', err)
      }
    }

    return NextResponse.json({
      status: 'concern_raised',
      id: savedId,
      pupil_name,
      attendance_pct,
      escalation_stage: stage,
      ewo_referral: stage === 3,
    })
  }

  // ── Action: Log contact attempt ──────────────────────────────────────────────
  if (action === 'log_contact') {
    if (!concern_id || !contact_entry) {
      return NextResponse.json({ error: 'Missing concern_id or contact_entry' }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('school_attendance_concerns')
      .select('contact_log')
      .eq('id', concern_id)
      .single()

    const log = (existing?.contact_log as object[]) ?? []
    const newEntry = { at: new Date().toISOString(), ...contact_entry }

    const { error } = await supabase
      .from('school_attendance_concerns')
      .update({ contact_log: [...log, newEntry], updated_at: new Date().toISOString() })
      .eq('id', concern_id)

    if (error) {
      console.error('[attendance-concerns] Log contact error:', error)
      return NextResponse.json({ error: 'Failed to log contact' }, { status: 500 })
    }

    return NextResponse.json({ status: 'contact_logged', entries: log.length + 1 })
  }

  // ── Action: Resolve concern ──────────────────────────────────────────────────
  if (action === 'resolve') {
    if (!concern_id) {
      return NextResponse.json({ error: 'Missing concern_id' }, { status: 400 })
    }

    const { error } = await supabase
      .from('school_attendance_concerns')
      .update({
        status: 'Resolved',
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', concern_id)

    if (error) return NextResponse.json({ error: 'Failed to resolve' }, { status: 500 })
    return NextResponse.json({ status: 'resolved' })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

// GET: summary stats
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
                   ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ below90: 0, below85: 0, below80: 0, open: 0 })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const term = currentTerm()

  const { data } = await supabase
    .from('school_attendance_concerns')
    .select('attendance_pct, escalation_stage, status')
    .eq('term', term)

  if (!data) return NextResponse.json({ below90: 0, below85: 0, below80: 0, open: 0 })

  return NextResponse.json({
    below90: data.filter(r => r.attendance_pct <= 90).length,
    below85: data.filter(r => r.attendance_pct <= 85).length,
    below80: data.filter(r => r.attendance_pct <= 80).length,
    open:    data.filter(r => r.status === 'Open').length,
  })
}
