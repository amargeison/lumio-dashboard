import { NextRequest, NextResponse } from 'next/server'
import {
  getClientIp, checkRateLimit, checkDailyCap, rateLimitedResponse, capReachedResponse,
} from '@/lib/ai/guards'
import { sanitizeAiBody, AiBodyError } from '@/lib/ai/body-guard'

export async function POST(req: NextRequest) {
  try {
    // This route had no rate limit, no spend cap and no body validation at all —
    // the only one of the sport passthroughs with none of the three.
    const ip = getClientIp(req)
    const rl = checkRateLimit(ip)
    if (!rl.ok) return rateLimitedResponse(rl.retryInSec)
    const cap = checkDailyCap()
    if (!cap.ok) return capReachedResponse(cap.spent)

    const body = sanitizeAiBody(await req.json())
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
    return NextResponse.json(data)
  } catch (e) {
    if (e instanceof AiBodyError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: 'Failed to call AI' }, { status: 500 })
  }
}
