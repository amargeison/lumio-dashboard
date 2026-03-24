import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ─── Term label helper ─────────────────────────────────────────────────────────

function periodLabel(period: string): string {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const termName = month >= 9 ? 'Autumn' : month <= 1 ? 'Autumn' : month <= 3 ? 'Spring' : 'Summer'
  const termYear = month <= 1 ? year - 1 : year
  if (period === 'Half term') return `${termName} Half Term ${termYear}`
  if (period === 'Term') return `${termName} Term ${termYear}`
  return `Academic Year ${termYear}/${String(termYear + 1).slice(2)}`
}

function periodStartDate(period: string): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth() + 1
  if (period === 'Full year') return `${y - 1}-09-01`
  if (period === 'Half term') {
    const sixWeeksAgo = new Date(now)
    sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42)
    return sixWeeksAgo.toISOString().slice(0, 10)
  }
  // Term: approximate start of current term
  if (m >= 9)  return `${y}-09-01`
  if (m <= 3)  return `${y}-01-06`
  return `${y}-04-14`
}

// ─── POST handler ──────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const {
    report_type,
    reporting_period,
    sections_included,
    headteacher_name,
  } = body as {
    report_type: string
    reporting_period: string
    sections_included: string[]
    headteacher_name: string
  }

  if (!report_type || !reporting_period || !headteacher_name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
                   ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const label = periodLabel(reporting_period)
  const since = periodStartDate(reporting_period)

  // ── Gather data from Supabase ────────────────────────────────────────────────
  interface DataSnapshot {
    period: string
    since: string
    absences: { total: number; no_contact: number; persistent: number }
    safeguarding: { total: number; open: number; urgent: number }
    cover: { total: number; internal: number; supply: number; estimated_cost: number }
    admissions: { total: number; pending: number; with_send: number; with_lac: number }
    dbs: { total: number; current: number; overdue: number; due_soon: number }
    attendance_concerns: { open: number; below_90: number; ewo_referred: number }
    communications: { sent: number }
    cover_work_generated: number
  }

  const snapshot: DataSnapshot = {
    period: label,
    since,
    absences: { total: 0, no_contact: 0, persistent: 0 },
    safeguarding: { total: 0, open: 0, urgent: 0 },
    cover: { total: 0, internal: 0, supply: 0, estimated_cost: 0 },
    admissions: { total: 0, pending: 0, with_send: 0, with_lac: 0 },
    dbs: { total: 0, current: 0, overdue: 0, due_soon: 0 },
    attendance_concerns: { open: 0, below_90: 0, ewo_referred: 0 },
    communications: { sent: 0 },
    cover_work_generated: 0,
  }

  if (supabaseUrl && supabaseKey) {
    const sb = createClient(supabaseUrl, supabaseKey)

    const [absRes, sgRes, coverRes, admRes, dbsRes, concRes, commRes, cwRes] = await Promise.allSettled([
      sb.from('school_absences').select('no_contact, persistent_concern').gte('created_at', since),
      sb.from('school_safeguarding').select('status, is_urgent').gte('created_at', since),
      sb.from('school_cover_bookings').select('cover_type, estimated_cost').gte('created_at', since),
      sb.from('school_pupils').select('status, has_send, is_lac').gte('created_at', since),
      sb.from('school_dbs_records').select('status'),
      sb.from('school_attendance_concerns').select('status, attendance_pct, ewo_referred').eq('status', 'Open'),
      sb.from('school_communications').select('status').eq('status', 'Sent').gte('created_at', since),
      sb.from('school_cover_work').select('id').gte('created_at', since),
    ])

    if (absRes.status === 'fulfilled' && absRes.value.data) {
      const d = absRes.value.data
      snapshot.absences = { total: d.length, no_contact: d.filter(r => r.no_contact).length, persistent: d.filter(r => r.persistent_concern).length }
    }
    if (sgRes.status === 'fulfilled' && sgRes.value.data) {
      const d = sgRes.value.data
      snapshot.safeguarding = { total: d.length, open: d.filter(r => r.status === 'Open').length, urgent: d.filter(r => r.is_urgent).length }
    }
    if (coverRes.status === 'fulfilled' && coverRes.value.data) {
      const d = coverRes.value.data
      snapshot.cover = {
        total: d.length,
        internal: d.filter(r => r.cover_type === 'Internal').length,
        supply: d.filter(r => r.cover_type !== 'Internal').length,
        estimated_cost: d.reduce((s, r) => s + (r.estimated_cost ?? 0), 0),
      }
    }
    if (admRes.status === 'fulfilled' && admRes.value.data) {
      const d = admRes.value.data
      snapshot.admissions = { total: d.length, pending: d.filter(r => r.status === 'Pending').length, with_send: d.filter(r => r.has_send).length, with_lac: d.filter(r => r.is_lac).length }
    }
    if (dbsRes.status === 'fulfilled' && dbsRes.value.data) {
      const d = dbsRes.value.data
      snapshot.dbs = { total: d.length, current: d.filter(r => r.status === 'Current').length, overdue: d.filter(r => r.status === 'Overdue').length, due_soon: d.filter(r => r.status === 'Due Soon' || r.status === 'Urgent').length }
    }
    if (concRes.status === 'fulfilled' && concRes.value.data) {
      const d = concRes.value.data
      snapshot.attendance_concerns = { open: d.length, below_90: d.filter(r => r.attendance_pct <= 90).length, ewo_referred: d.filter(r => r.ewo_referred).length }
    }
    if (commRes.status === 'fulfilled' && commRes.value.data) {
      snapshot.communications = { sent: commRes.value.data.length }
    }
    if (cwRes.status === 'fulfilled' && cwRes.value.data) {
      snapshot.cover_work_generated = cwRes.value.data.length
    }
  }

  // ── Build Claude prompt ──────────────────────────────────────────────────────
  const sectionsText = sections_included.length > 0
    ? `Include the following sections: ${sections_included.join(', ')}.`
    : 'Include all standard sections.'

  const dataSection = `
SCHOOL DATA FOR THIS PERIOD (${label}):

ATTENDANCE & ABSENCES:
- Total absences logged: ${snapshot.absences.total}
- No-contact cases: ${snapshot.absences.no_contact}
- Persistent absence flags: ${snapshot.absences.persistent}
- Pupils currently below 90% attendance (persistent absence concern): ${snapshot.attendance_concerns.below_90}
- Open persistent absence cases: ${snapshot.attendance_concerns.open}
- EWO referrals made: ${snapshot.attendance_concerns.ewo_referred}

SAFEGUARDING & WELFARE:
- Safeguarding concerns logged: ${snapshot.safeguarding.total}
- Open cases: ${snapshot.safeguarding.open}
- Urgent cases this period: ${snapshot.safeguarding.urgent}

STAFFING & COVER:
- Cover bookings this period: ${snapshot.cover.total}
- Resolved internally: ${snapshot.cover.internal}
- Supply agency used: ${snapshot.cover.supply}
- Estimated supply cost: £${snapshot.cover.estimated_cost.toLocaleString('en-GB')}
- DBS records on file: ${snapshot.dbs.total} (${snapshot.dbs.current} current, ${snapshot.dbs.overdue} overdue, ${snapshot.dbs.due_soon} due soon)

ADMISSIONS & PUPILS:
- New admissions this period: ${snapshot.admissions.total}
- Pending (not yet started): ${snapshot.admissions.pending}
- With SEND: ${snapshot.admissions.with_send}
- Looked After Children: ${snapshot.admissions.with_lac}

COMMUNICATIONS:
- Parent communications sent: ${snapshot.communications.sent}
- AI cover work packs generated: ${snapshot.cover_work_generated}
`

  const systemPrompt = `You are an experienced school business manager and governor report writer for UK maintained schools. Write formal, professional governor reports that comply with DfE guidance and are suitable for presenting to a Full Governing Body meeting.

Use clear, accessible language that is formal but not overly academic. Structure reports with numbered sections and subsections. Include an Executive Summary at the start. Flag any areas of concern clearly. Conclude with recommendations and next steps.

Where data shows positive outcomes, acknowledge them. Where data shows concerns (e.g. overdue DBS checks, safeguarding cases), address them directly and note what actions are being taken.

Format using markdown with ## for main sections and ### for subsections. Use bullet points for lists. Include a word count estimate at the end.`

  const userPrompt = `Please generate a ${report_type} for governors.

Reporting Period: ${label}
Headteacher: ${headteacher_name}
${sectionsText}

${dataSection}

Write a complete, professional report suitable for presenting to the Full Governing Body. The report should be comprehensive and use the data above. Where data is zero or low, provide appropriate reassurance or note this positively. Sign off the report in the name of ${headteacher_name}.`

  // ── Call Claude ──────────────────────────────────────────────────────────────
  let reportText = ''
  let promptTokens = 0
  let completionTokens = 0

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      console.error('[governor-report] Claude error:', err)
      return NextResponse.json({ error: 'AI generation failed.' }, { status: 502 })
    }

    const result = await response.json()
    reportText = result.content?.[0]?.text ?? ''
    promptTokens = result.usage?.input_tokens ?? 0
    completionTokens = result.usage?.output_tokens ?? 0
  } catch (err) {
    console.error('[governor-report] Fetch error:', err)
    return NextResponse.json({ error: 'Failed to reach AI service.' }, { status: 502 })
  }

  // ── Save to Supabase ─────────────────────────────────────────────────────────
  let savedId: string | null = null

  if (supabaseUrl && supabaseKey) {
    const sb = createClient(supabaseUrl, supabaseKey)
    const { data, error } = await sb
      .from('school_governor_reports')
      .insert({
        report_type,
        reporting_period,
        period_label: label,
        headteacher_name,
        sections_included,
        data_snapshot: snapshot,
        report_text: reportText,
        word_count: reportText.split(/\s+/).length,
        model_used: 'claude-sonnet-4-6',
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        status: 'Draft',
      })
      .select('id')
      .single()

    if (error) console.error('[governor-report] Supabase insert error:', error)
    else savedId = data?.id ?? null
  }

  return NextResponse.json({
    status: 'generated',
    id: savedId,
    report_type,
    period_label: label,
    headteacher_name,
    report_text: reportText,
    word_count: reportText.split(/\s+/).length,
    tokens_used: promptTokens + completionTokens,
    data_snapshot: snapshot,
  })
}

// ─── PATCH: update report (finalise, add email) ────────────────────────────────

export async function PATCH(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { id, report_text, status, emailed_to } = body as {
    id: string
    report_text?: string
    status?: string
    emailed_to?: string
  }

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })

  const sb = createClient(supabaseUrl, supabaseKey)

  const update: Record<string, unknown> = {}
  if (report_text !== undefined) { update.report_text = report_text; update.word_count = report_text.split(/\s+/).length }
  if (status) { update.status = status; if (status === 'Finalised') update.finalised_at = new Date().toISOString() }
  if (emailed_to) { update.emailed_to = emailed_to; update.emailed_at = new Date().toISOString(); update.status = 'Sent' }

  const { error } = await sb.from('school_governor_reports').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 })

  return NextResponse.json({ status: 'updated' })
}
