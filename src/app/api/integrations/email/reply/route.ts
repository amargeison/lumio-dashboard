import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'not_connected', message: 'Connect your email account to enable replies' }, { status: 503 })
  }

  let body: Record<string, string>
  try { body = await req.json() } catch { body = {} }

  const { to, subject, reply_body, from_name } = body as Record<string, string>
  if (!to || !reply_body) {
    return NextResponse.json({ error: 'Missing required fields: to, reply_body' }, { status: 400 })
  }

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from: `${from_name ?? 'Lumio'} <hello@lumiocms.com>`,
    to: [to],
    subject: subject ? `Re: ${subject}` : 'Reply from Lumio',
    html: `<p>${reply_body.replace(/\n/g, '<br>')}</p>`,
  })

  if (error) {
    console.error('[integrations/email/reply]', error)
    return NextResponse.json({ error: 'Failed to send reply' }, { status: 502 })
  }

  return NextResponse.json({ status: 'sent' })
}
