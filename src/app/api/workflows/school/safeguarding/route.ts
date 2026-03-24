import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateRef(supabase: any): Promise<string> {
  const year = new Date().getFullYear()
  // Count existing records this year for sequential numbering
  const { count } = await supabase
    .from('school_safeguarding')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', `${year}-01-01`)
  const seq = ((count ?? 0) + 1).toString().padStart(3, '0')
  return `SG-${year}-${seq}`
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
    incident_at,
    concern_type,
    description,
    reported_by,
    witnessed,
    action_taken,
    is_urgent,
  } = body as {
    pupil_name: string
    year_group: string
    incident_at: string
    concern_type: string
    description: string
    reported_by: string
    witnessed: boolean
    action_taken?: string
    is_urgent: boolean
  }

  if (!pupil_name || !year_group || !incident_at || !concern_type || !description || !reported_by) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
                   ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  let savedId: string | null = null
  let refNumber = `SG-${new Date().getFullYear()}-001`

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey)
    refNumber = await generateRef(supabase)

    const { data, error } = await supabase
      .from('school_safeguarding')
      .insert({
        ref_number: refNumber,
        pupil_name,
        year_group,
        incident_at,
        concern_type,
        description,
        reported_by,
        witnessed: witnessed ?? false,
        action_taken: action_taken ?? null,
        is_urgent: is_urgent ?? false,
        status: 'Open',
      })
      .select('id')
      .single()

    if (error) {
      console.error('[school/safeguarding] Supabase insert error:', error)
    } else {
      savedId = data?.id ?? null
    }
  }

  // ── n8n webhook ─────────────────────────────────────────────────────────────
  const webhookUrl = process.env.N8N_SCHOOL_SAFEGUARDING_WEBHOOK_URL

  const webhookPayload = {
    id: savedId,
    ref_number: refNumber,
    pupil_name,
    year_group,
    incident_at,
    concern_type,
    description,
    reported_by,
    witnessed,
    action_taken,
    is_urgent,
    triggers: {
      notify_dsl: true,       // always notify DSL
      urgent_slt_banner: is_urgent,
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
      console.error('[school/safeguarding] Webhook error:', err)
    }
  }

  return NextResponse.json({
    status: 'logged',
    id: savedId,
    ref_number: refNumber,
    is_urgent,
    dsl_notified: !!webhookUrl,
  })
}
