import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function currentTerm(): string {
  const now = new Date()
  const m = now.getMonth() + 1 // 1-12
  const y = now.getFullYear()
  if (m >= 9 || m <= 1) return `Autumn ${m >= 9 ? y : y - 1}`
  if (m >= 2 && m <= 5)  return `Spring ${y}`
  return `Summer ${y}`
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const {
    pupil_name,
    year_group,
    absence_date,
    absence_type,
    reported_by,
    notes,
  } = body as {
    pupil_name: string
    year_group: string
    absence_date: string
    absence_type: string
    reported_by: string
    notes?: string
  }

  if (!pupil_name || !year_group || !absence_date || !absence_type || !reported_by) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const noContact = reported_by === 'No Contact'
  const term = currentTerm()

  // ── Supabase ──────────────────────────────────────────────────────────────
  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
                    ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  let persistentConcern = false
  let savedId: string | null = null

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Count absences this term for this pupil (before inserting)
    const { count } = await supabase
      .from('school_absences')
      .select('id', { count: 'exact', head: true })
      .eq('pupil_name', pupil_name)
      .eq('term', term)

    persistentConcern = (count ?? 0) >= 2 // 3rd absence (0-indexed: ≥2 existing → this is 3rd)

    const { data, error } = await supabase
      .from('school_absences')
      .insert({
        pupil_name,
        year_group,
        absence_date,
        absence_type,
        reported_by,
        notes: notes ?? null,
        no_contact: noContact,
        persistent_concern: persistentConcern,
        term,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[school/absence] Supabase insert error:', error)
      // Continue — still fire webhook
    } else {
      savedId = data?.id ?? null
    }
  }

  // ── n8n webhook ───────────────────────────────────────────────────────────
  const webhookUrl = process.env.N8N_SCHOOL_ABSENCE_WEBHOOK_URL

  const webhookPayload = {
    id: savedId,
    pupil_name,
    year_group,
    absence_date,
    absence_type,
    reported_by,
    notes: notes ?? null,
    no_contact: noContact,
    persistent_concern: persistentConcern,
    term,
    triggers: {
      send_parent_chase: noContact,
      flag_persistent_absence: persistentConcern,
    },
  }

  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload),
      })
    } catch (err) {
      console.error('[school/absence] Webhook error:', err)
      // Non-fatal — absence already saved to Supabase
    }
  }

  return NextResponse.json({
    status: 'logged',
    id: savedId,
    no_contact: noContact,
    persistent_concern: persistentConcern,
    parent_chase_triggered: noContact && !!webhookUrl,
  })
}
