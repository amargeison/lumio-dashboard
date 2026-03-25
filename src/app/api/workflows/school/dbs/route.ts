import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { n8nWebhook } from '@/lib/n8n'

function computeStatus(renewalDueDate: string): string {
  const now = new Date()
  const due = new Date(renewalDueDate)
  const daysUntil = Math.ceil((due.getTime() - now.getTime()) / 86400000)

  if (daysUntil < 0)   return 'Overdue'
  if (daysUntil <= 14) return 'Urgent'
  if (daysUntil <= 60) return 'Due Soon'
  return 'Current'
}

function addYears(date: string, years: number): string {
  const d = new Date(date)
  d.setFullYear(d.getFullYear() + years)
  return d.toISOString().slice(0, 10)
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const {
    staff_name,
    staff_email,
    staff_role,
    certificate_number,
    check_type,
    issue_date,
    renewal_due_date: providedDueDate,
    certificate_url,
    notes,
  } = body as {
    staff_name: string
    staff_email?: string
    staff_role?: string
    certificate_number?: string
    check_type: string
    issue_date: string
    renewal_due_date?: string
    certificate_url?: string
    notes?: string
  }

  if (!staff_name || !issue_date || !check_type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Auto-calculate renewal if not provided (3 years from issue)
  const renewal_due_date = providedDueDate || addYears(issue_date, 3)
  const status = computeStatus(renewal_due_date)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
                   ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  let savedId: string | null = null

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data, error } = await supabase
      .from('school_dbs_records')
      .insert({
        staff_name,
        staff_email: staff_email ?? null,
        staff_role: staff_role ?? null,
        certificate_number: certificate_number ?? null,
        check_type,
        issue_date,
        renewal_due_date,
        certificate_url: certificate_url ?? null,
        notes: notes ?? null,
        status,
        reminder_60_sent: false,
        reminder_30_sent: false,
        reminder_14_sent: false,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[school/dbs] Supabase insert error:', error)
    } else {
      savedId = data?.id ?? null
    }
  }

  // Fire n8n reminder scheduler
  const webhookUrl = n8nWebhook('school-dbs')
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: savedId,
          staff_name,
          staff_email,
          check_type,
          renewal_due_date,
          status,
          schedule_reminders: {
            days_60: true,
            days_30: true,
            days_14: true,
          },
        }),
      })
    } catch (err) {
      console.error('[school/dbs] Webhook error:', err)
    }
  }

  return NextResponse.json({
    status: 'saved',
    id: savedId,
    staff_name,
    renewal_due_date,
    dbs_status: status,
    reminders_scheduled: !!webhookUrl,
  })
}
