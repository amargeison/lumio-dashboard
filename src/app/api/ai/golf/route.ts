import { NextRequest, NextResponse } from 'next/server'
import { trackSportsEvent } from '@/lib/sports-events'
import {
  getClientIp,
  checkRateLimit,
  checkDailyCap,
  recordSpend,
  rateLimitedResponse,
  capReachedResponse,
} from '@/lib/ai/guards'
import { sanitizeAiBody, AiBodyError } from '@/lib/ai/body-guard'

// The system prompts these features use, held server-side so the browser names
// one instead of defining it. Moved here from three call sites in the golf
// portal when the passthrough stopped accepting a client-supplied system prompt.
const PRESETS: Record<string, string> = {
  'performance': 'You are Lumio AI, golf performance analyst for James Halton (#87 OWGR, DP World Tour). Be direct, data-driven, and specific. 2-3 sentences per section.',
  'career': 'You are Lumio AI, strategic golf career analyst. Be direct and specific — this player takes your recommendations seriously.',
  'agent-pitch': 'You are Sarah Mitchell, ISM sports agent, writing a sponsorship pitch on behalf of your client. Write in professional but warm agent voice. Be specific with stats.',
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const rl = checkRateLimit(ip)
    if (!rl.ok) return rateLimitedResponse(rl.retryInSec)
    const cap = checkDailyCap()
    if (!cap.ok) return capReachedResponse(cap.spent)

    // The browser does not get to choose what the model is — see body-guard.
    const body = sanitizeAiBody(await req.json(), { presets: PRESETS, allowWebSearch: true })
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
      recordSpend(data.usage.input_tokens, data.usage.output_tokens, data.model || body.model, 'golf')
    }
    trackSportsEvent(null, 'golf', 'ai_call', body.messages?.[0]?.content?.slice(0, 80) || 'ai_call', {
      model: body.model, tokens: data.usage?.output_tokens,
    }).catch(() => {})
    return NextResponse.json(data)
  } catch (e) {
    if (e instanceof AiBodyError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: 'Failed to call AI' }, { status: 500 })
  }
}
