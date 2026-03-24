import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const {
    subject,
    body: messageBody,
    template_id,
    audience,
    audience_filter,
    send_email,
    send_sms,
    send_at,
    attachments,
    created_by,
  } = body as {
    subject: string
    body: string
    template_id?: string
    audience: string
    audience_filter?: string
    send_email?: boolean
    send_sms?: boolean
    send_at?: string
    attachments?: string[]
    created_by?: string
  }

  if (!subject || !messageBody || !audience) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
                   ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const isImmediate = !send_at
  const status = isImmediate ? 'Sent' : 'Scheduled'

  let savedId: string | null = null

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data, error } = await supabase
      .from('school_communications')
      .insert({
        subject,
        body: messageBody,
        template_id: template_id ?? null,
        audience,
        audience_filter: audience_filter ?? null,
        send_email: send_email ?? true,
        send_sms: send_sms ?? false,
        send_at: send_at ?? null,
        sent_at: isImmediate ? new Date().toISOString() : null,
        attachments: attachments ?? [],
        status,
        created_by: created_by ?? null,
        n8n_fired: false,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[school/communication] Supabase insert error:', error)
    } else {
      savedId = data?.id ?? null
    }
  }

  // Fire n8n webhook for email (via Resend) and/or SMS
  const emailWebhookUrl = process.env.N8N_SCHOOL_COMMS_EMAIL_WEBHOOK_URL
  const smsWebhookUrl   = process.env.N8N_SCHOOL_COMMS_SMS_WEBHOOK_URL

  const webhookPayload = {
    id: savedId,
    subject,
    body: messageBody,
    audience,
    audience_filter,
    send_email,
    send_sms,
    send_at,
    attachments,
    is_immediate: isImmediate,
  }

  const firedChannels: string[] = []

  if ((send_email ?? true) && emailWebhookUrl) {
    try {
      await fetch(emailWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload),
      })
      firedChannels.push('email')
    } catch (err) {
      console.error('[school/communication] Email webhook error:', err)
    }
  }

  if (send_sms && smsWebhookUrl) {
    try {
      await fetch(smsWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload),
      })
      firedChannels.push('sms')
    } catch (err) {
      console.error('[school/communication] SMS webhook error:', err)
    }
  }

  return NextResponse.json({
    status: isImmediate ? 'sent' : 'scheduled',
    id: savedId,
    audience,
    channels_fired: firedChannels,
    scheduled_for: send_at ?? null,
  })
}
