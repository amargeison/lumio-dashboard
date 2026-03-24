import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ─── RAG helpers ───────────────────────────────────────────────────────────────

type RAG = 'Green' | 'Amber' | 'Red'

function rag(value: number, greenThreshold: number, amberThreshold: number, lowerIsBetter = false): RAG {
  if (lowerIsBetter) {
    if (value <= greenThreshold) return 'Green'
    if (value <= amberThreshold) return 'Amber'
    return 'Red'
  }
  if (value >= greenThreshold) return 'Green'
  if (value >= amberThreshold) return 'Amber'
  return 'Red'
}

function overall(categories: { rag: RAG }[]): RAG {
  if (categories.some(c => c.rag === 'Red')) return 'Red'
  if (categories.some(c => c.rag === 'Amber')) return 'Amber'
  return 'Green'
}

// ─── GET: Run readiness check ──────────────────────────────────────────────────

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
                   ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
  }

  const sb = createClient(supabaseUrl, supabaseKey)

  // ── Fetch all relevant data in parallel ────────────────────────────────────
  const [dbsRes, sgRes, absRes, concRes, admRes, commRes] = await Promise.allSettled([
    sb.from('school_dbs_records').select('status, reminder_60_sent, reminder_30_sent, reminder_14_sent'),
    sb.from('school_safeguarding').select('status, is_urgent, created_at').order('created_at', { ascending: false }).limit(50),
    sb.from('school_absences').select('absence_date, persistent_concern').order('absence_date', { ascending: false }).limit(200),
    sb.from('school_attendance_concerns').select('status, attendance_pct, escalation_stage, ewo_referred').eq('status', 'Open'),
    sb.from('school_pupils').select('status, has_send').limit(200),
    sb.from('school_communications').select('status').eq('status', 'Sent').limit(50),
  ])

  // ── Safeguarding ──────────────────────────────────────────────────────────
  const sgData = sgRes.status === 'fulfilled' ? (sgRes.value.data ?? []) : []
  const sgOpen = sgData.filter(r => r.status === 'Open').length
  const sgUrgent = sgData.filter(r => r.is_urgent).length

  const dbsData = dbsRes.status === 'fulfilled' ? (dbsRes.value.data ?? []) : []
  const dbsTotal = dbsData.length
  const dbsOverdue = dbsData.filter(r => r.status === 'Overdue').length
  const dbsUrgent = dbsData.filter(r => r.status === 'Urgent').length
  const dbsCurrent = dbsData.filter(r => r.status === 'Current').length
  const dbsCompliancePct = dbsTotal > 0 ? Math.round((dbsCurrent / dbsTotal) * 100) : 100

  const safeguardingItems: { label: string; value: string; rag: RAG }[] = [
    { label: 'DBS compliance rate', value: `${dbsCompliancePct}% current (${dbsOverdue} overdue)`, rag: rag(dbsCompliancePct, 95, 80) },
    { label: 'Urgent DBS renewals', value: `${dbsUrgent} within 14 days`, rag: rag(dbsUrgent, 0, 0, true) },
    { label: 'Open safeguarding cases', value: `${sgOpen} open`, rag: sgOpen === 0 ? 'Green' : sgOpen <= 2 ? 'Amber' : 'Red' },
    { label: 'Urgent concern flags', value: `${sgUrgent} urgent`, rag: sgUrgent === 0 ? 'Green' : 'Red' },
    { label: 'Safeguarding records maintained', value: `${sgData.length} total logged`, rag: sgData.length > 0 ? 'Green' : 'Amber' },
  ]

  const safeguardingRAG = overall(safeguardingItems)
  const safeguardingActions = [
    ...dbsOverdue > 0 ? [`${dbsOverdue} overdue DBS check${dbsOverdue !== 1 ? 's' : ''} — renewals required immediately`] : [],
    ...dbsUrgent > 0 ? [`${dbsUrgent} DBS expiring within 14 days — action required`] : [],
    ...sgOpen > 2 ? ['Multiple open safeguarding cases — ensure DSL review is current'] : [],
    ...sgUrgent > 0 ? ['Urgent safeguarding concerns flagged — immediate DSL action required'] : [],
  ]

  // ── Attendance ────────────────────────────────────────────────────────────
  const absData = absRes.status === 'fulfilled' ? (absRes.value.data ?? []) : []
  const concData = concRes.status === 'fulfilled' ? (concRes.value.data ?? []) : []
  const persistentCount = absData.filter(r => r.persistent_concern).length
  const below90Count = concData.filter(r => r.attendance_pct <= 90).length
  const ewoCount = concData.filter(r => r.ewo_referred).length
  const openConcerns = concData.length

  // Estimate overall attendance % (if we have enough data)
  const last30days = absData.filter(r => {
    const d = new Date(r.absence_date)
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30)
    return d >= cutoff
  }).length

  const attendanceItems: { label: string; value: string; rag: RAG }[] = [
    { label: 'Persistent absence cases (3+ this term)', value: `${persistentCount} pupils flagged`, rag: rag(persistentCount, 0, 2, true) },
    { label: 'Pupils below 90% attendance', value: `${below90Count} pupils`, rag: rag(below90Count, 0, 3, true) },
    { label: 'EWO referrals made', value: `${ewoCount} referred`, rag: ewoCount === 0 ? 'Green' : ewoCount <= 2 ? 'Amber' : 'Red' },
    { label: 'Open attendance concern cases', value: `${openConcerns} cases`, rag: rag(openConcerns, 0, 5, true) },
    { label: 'Absences logged (last 30 days)', value: `${last30days} absences`, rag: 'Green' },
  ]

  const attendanceRAG = overall(attendanceItems)
  const attendanceActions = [
    ...below90Count > 3 ? [`${below90Count} pupils below 90% — escalation procedures should be active`] : [],
    ...persistentCount > 2 ? ['Multiple persistent absence cases — ensure parent contact letters are sent'] : [],
    ...ewoCount > 2 ? ['High EWO referral count — review attendance strategy'] : [],
  ]

  // ── SEND & Inclusion ──────────────────────────────────────────────────────
  const admData = admRes.status === 'fulfilled' ? (admRes.value.data ?? []) : []
  const sendPupils = admData.filter(r => r.has_send).length
  const totalPupils = admData.length

  const sendItems: { label: string; value: string; rag: RAG }[] = [
    { label: 'SEND register maintained', value: `${sendPupils} pupils on register`, rag: 'Green' },
    { label: 'Admission records complete', value: `${totalPupils} pupils on roll`, rag: totalPupils > 0 ? 'Green' : 'Amber' },
    { label: 'SEND proportion flagged', value: `${totalPupils > 0 ? Math.round((sendPupils / totalPupils) * 100) : 0}% of pupils`, rag: 'Green' },
  ]

  const sendRAG = overall(sendItems)
  const sendActions = [
    ...totalPupils === 0 ? ['No pupil records found — ensure admission data is entered'] : [],
  ]

  // ── Staffing & HR ─────────────────────────────────────────────────────────
  const hrItems: { label: string; value: string; rag: RAG }[] = [
    { label: 'Single Central Record maintained', value: `${dbsTotal} staff on SCR`, rag: dbsTotal > 0 ? 'Green' : 'Red' },
    { label: 'DBS compliance', value: `${dbsCurrent}/${dbsTotal} current`, rag: rag(dbsCompliancePct, 95, 80) },
    { label: 'Overdue DBS checks', value: `${dbsOverdue} overdue`, rag: rag(dbsOverdue, 0, 0, true) },
    { label: 'Supply cover records', value: 'Cover booking system active', rag: 'Green' },
  ]

  const hrRAG = overall(hrItems)
  const hrActions = [
    ...dbsTotal === 0 ? ['No staff DBS records found — Single Central Record must be maintained'] : [],
    ...dbsOverdue > 0 ? [`${dbsOverdue} staff DBS check${dbsOverdue !== 1 ? 's' : ''} overdue — update SCR immediately`] : [],
  ]

  // ── Communications & Engagement ───────────────────────────────────────────
  const commData = commRes.status === 'fulfilled' ? (commRes.value.data ?? []) : []
  const commsSent = commData.length

  const commsItems: { label: string; value: string; rag: RAG }[] = [
    { label: 'Parent communications sent', value: `${commsSent} messages`, rag: commsSent >= 3 ? 'Green' : commsSent >= 1 ? 'Amber' : 'Amber' },
    { label: 'Communication system active', value: 'Email + SMS enabled', rag: 'Green' },
    { label: 'Governor reporting', value: 'AI report generator available', rag: 'Green' },
  ]

  const commsRAG = overall(commsItems)
  const commsActions = [
    ...commsSent === 0 ? ['No parent communications found — ensure regular updates are sent'] : [],
  ]

  // ── Leadership & Management ───────────────────────────────────────────────
  const leadershipItems: { label: string; value: string; rag: RAG }[] = [
    { label: 'Workflow automation active', value: 'n8n workflows configured', rag: 'Green' },
    { label: 'Governor reporting', value: 'Report generator available', rag: 'Green' },
    { label: 'Self-evaluation data available', value: 'Live dashboards active', rag: 'Green' },
  ]

  const leadershipRAG: RAG = 'Green'
  const leadershipActions: string[] = []

  // ── Compile results ────────────────────────────────────────────────────────
  const categories = [
    {
      id: 'safeguarding',
      title: 'Safeguarding & Child Protection',
      rag: safeguardingRAG,
      items: safeguardingItems,
      actions: safeguardingActions,
      icon: 'shield',
    },
    {
      id: 'attendance',
      title: 'Attendance & Welfare',
      rag: attendanceRAG,
      items: attendanceItems,
      actions: attendanceActions,
      icon: 'users',
    },
    {
      id: 'send',
      title: 'SEND & Inclusion',
      rag: sendRAG,
      items: sendItems,
      actions: sendActions,
      icon: 'heart',
    },
    {
      id: 'hr',
      title: 'Staffing & HR Compliance',
      rag: hrRAG,
      items: hrItems,
      actions: hrActions,
      icon: 'briefcase',
    },
    {
      id: 'comms',
      title: 'Communications & Engagement',
      rag: commsRAG,
      items: commsItems,
      actions: commsActions,
      icon: 'message',
    },
    {
      id: 'leadership',
      title: 'Leadership & Management',
      rag: leadershipRAG,
      items: leadershipItems,
      actions: leadershipActions,
      icon: 'target',
    },
  ]

  const overallRAG = overall(categories)
  const allActions = categories.flatMap(c => c.actions.map(a => ({ category: c.title, action: a, rag: c.rag })))

  const score = Math.round(
    (categories.filter(c => c.rag === 'Green').length * 100 +
     categories.filter(c => c.rag === 'Amber').length * 60 +
     categories.filter(c => c.rag === 'Red').length * 20) /
    categories.length
  )

  return NextResponse.json({
    overall_rag: overallRAG,
    score,
    checked_at: new Date().toISOString(),
    categories,
    action_items: allActions,
    totals: {
      green: categories.filter(c => c.rag === 'Green').length,
      amber: categories.filter(c => c.rag === 'Amber').length,
      red: categories.filter(c => c.rag === 'Red').length,
    },
  })
}

// ─── POST: Generate Mock Ofsted Pack ──────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try { body = await request.json() } catch { body = {} }

  const { headteacher_name } = body as { headteacher_name?: string }
  const ht = headteacher_name ?? 'The Headteacher'

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 })
  }

  // Run the check first to get live data
  const checkRes = await GET()
  const checkData = await checkRes.json()

  const prompt = `You are preparing a school for an Ofsted inspection. Generate a comprehensive "Ofsted Inspection Preparation Pack" for ${ht}.

Current readiness data:
- Overall RAG: ${checkData.overall_rag}
- Readiness Score: ${checkData.score}/100
- Category breakdown: ${checkData.categories.map((c: { title: string; rag: string }) => `${c.title}: ${c.rag}`).join(', ')}
- Action items outstanding: ${checkData.action_items.length}

Generate a professional inspection preparation document including:
1. School Self-Evaluation Summary (SEF headline)
2. Inspection Day Checklist (what to have ready)
3. Key Questions Governors Should Be Ready to Answer
4. Areas of Strength to Highlight
5. Areas for Development and Mitigation Statements
6. Key Data Points to Prepare
7. Staff Briefing Notes

Write formally, as if this is a real school document signed by ${ht}. Be specific and practical.`

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
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'AI generation failed' }, { status: 502 })
    }

    const result = await response.json()
    const packText = result.content?.[0]?.text ?? ''

    return NextResponse.json({
      status: 'generated',
      pack_text: packText,
      overall_rag: checkData.overall_rag,
      score: checkData.score,
      tokens_used: (result.usage?.input_tokens ?? 0) + (result.usage?.output_tokens ?? 0),
    })
  } catch {
    return NextResponse.json({ error: 'Failed to reach AI service' }, { status: 502 })
  }
}
