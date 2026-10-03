import { NextRequest, NextResponse } from 'next/server'
import { spendGate, boundOpenBody, OpenBodyError } from '@/lib/ai/guards'

export async function POST(req: NextRequest) {
  // Spends on our key and can be reached by anyone: limit it and count it.
  const overLimit = spendGate(req, { label: 'cms:marketing', maxTokens: 4000 })
  if (overLimit) return overLimit
  try {
    // The browser does not get to choose the model, the length or the tools.
    const body = boundOpenBody(await req.json(), 4000)
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (e) {
    if (e instanceof OpenBodyError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: 'Failed to call AI' }, { status: 500 })
  }
}
