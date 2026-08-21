import { NextRequest, NextResponse } from 'next/server'
import {
  getClientIp,
  checkRateLimit,
  checkDailyCap,
  recordSpend,
  rateLimitedResponse,
  capReachedResponse,
} from '@/lib/ai/guards'
import { sanitizeAiBody, AiBodyError } from '@/lib/ai/body-guard'

// Held server-side so the browser names a preset instead of defining what the
// model is. Moved here from two call sites in the cricket portal.
const PRESETS: Record<string, string> = {
  'ecb-compliance': 'You are an ECB compliance expert helping a County Championship club. Be direct and specific. The club is Oakridge CC, CPA completion 73%, 3 DBS issues, safeguarding incidents pending. Answer questions about County Partnership Agreement requirements, ECB standards, and deadlines.',
  'match-report': 'You are the media officer for Oakridge CC. Write match reports in a professional but warm style for club communications.',
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const rl = checkRateLimit(ip)
    if (!rl.ok) return rateLimitedResponse(rl.retryInSec)
    const cap = checkDailyCap()
    if (!cap.ok) return capReachedResponse(cap.spent)

    // The browser does not get to choose what the model is — see body-guard.
    const body = sanitizeAiBody(await req.json(), { presets: PRESETS })
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
      recordSpend(data.usage.input_tokens, data.usage.output_tokens, data.model || body.model, 'cricket')
    }
    return NextResponse.json(data)
  } catch (e) {
    if (e instanceof AiBodyError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: 'Failed to call AI' }, { status: 500 })
  }
}
