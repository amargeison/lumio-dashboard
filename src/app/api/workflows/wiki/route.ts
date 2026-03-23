import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const webhookUrl = process.env.N8N_WIKI_WEBHOOK_URL

  if (!webhookUrl) {
    // No webhook configured — client uses mock data
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
