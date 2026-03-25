import { NextRequest, NextResponse } from 'next/server'
import { n8nWebhook } from '@/lib/n8n'

export async function POST(request: NextRequest) {
  const webhookUrl = n8nWebhook('performance-review')

  if (!webhookUrl) {
    return NextResponse.json({ status: 'mock' }, { status: 200 })
  }

  try {
    const body = await request.json()
    const upstream = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await upstream.json()
    return NextResponse.json(data, { status: upstream.status })
  } catch {
    return NextResponse.json({ error: 'Webhook unreachable' }, { status: 502 })
  }
}
