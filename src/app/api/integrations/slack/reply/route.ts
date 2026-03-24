import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) {
    return NextResponse.json({ error: 'not_connected', message: 'Connect your Slack account to enable replies' }, { status: 503 })
  }

  let body: Record<string, string>
  try { body = await req.json() } catch { body = {} }

  const { channel, message } = body as Record<string, string>
  if (!channel || !message) {
    return NextResponse.json({ error: 'Missing required fields: channel, message' }, { status: 400 })
  }

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: message, channel }),
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to send Slack message' }, { status: 502 })
  }

  return NextResponse.json({ status: 'sent' })
}
