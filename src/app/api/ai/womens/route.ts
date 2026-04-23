import { NextRequest, NextResponse } from 'next/server'
import {
  getClientIp,
  checkRateLimit,
  checkDailyCap,
  recordSpend,
  rateLimitedResponse,
  capReachedResponse,
} from '@/lib/ai/guards'

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const rl = checkRateLimit(ip)
    if (!rl.ok) return rateLimitedResponse(rl.retryInSec)
    const cap = checkDailyCap()
    if (!cap.ok) return capReachedResponse(cap.spent)

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
    if (data?.usage?.input_tokens != null && data?.usage?.output_tokens != null) {
      recordSpend(data.usage.input_tokens, data.usage.output_tokens, data.model || body.model, 'womens')
    }
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to call AI' }, { status: 500 })
  }
}
