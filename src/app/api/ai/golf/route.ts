import { NextRequest, NextResponse } from 'next/server'
import { trackSportsEvent } from '@/lib/sports-events'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    }

    // Add web search beta header if tools include web_search
    if (body.tools?.some((t: { type?: string }) => t.type?.includes('web_search'))) {
      headers['anthropic-beta'] = 'web-search-20250305'
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    const data = await response.json()
    trackSportsEvent(null, 'golf', 'ai_call', body.messages?.[0]?.content?.slice(0, 80) || 'ai_call', {
      model: body.model, tokens: data.usage?.output_tokens,
    }).catch(() => {})
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to call AI' }, { status: 500 })
  }
}
