import { NextRequest, NextResponse } from 'next/server'

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY

interface VerifyResult {
  verdict: 'same' | 'different' | 'uncertain'
  confidence: number
  reasoning: string
  recommendedAction: 'merge' | 'keep_separate' | 'manual_review'
  suggestedWinner: 'a' | 'b' | null
  mergeNotes: string
}

const TIMEOUT_RESULT: VerifyResult = {
  verdict: 'uncertain',
  confidence: 0,
  reasoning: 'Verification timed out',
  recommendedAction: 'manual_review',
  suggestedWinner: null,
  mergeNotes: '',
}

async function fetchPageSnippet(url: string): Promise<string> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 4000)
    const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'Lumio CRM Dedupe/1.0' } })
    clearTimeout(timer)
    if (!res.ok) return ''
    const html = await res.text()
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : ''
    const bodyText = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500)
    return `Title: ${title}\nContent: ${bodyText}`
  } catch {
    return ''
  }
}

function deriveWebsite(record: Record<string, unknown>): string | null {
  if (record.website) return String(record.website)
  const email = String(record.email || '')
  const domain = email.includes('@') ? email.split('@')[1] : null
  if (domain && !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'].includes(domain)) {
    return `https://${domain}`
  }
  return null
}

export async function POST(req: NextRequest) {
  try {
    const { type, recordA, recordB } = await req.json() as {
      type: 'contact' | 'company'
      recordA: Record<string, unknown>
      recordB: Record<string, unknown>
      slug: string
    }

    if (!type || !recordA || !recordB) {
      return NextResponse.json({ error: 'type, recordA, and recordB are required' }, { status: 400 })
    }

    if (!ANTHROPIC_KEY) {
      return NextResponse.json({ ...TIMEOUT_RESULT, reasoning: 'Anthropic API key not configured' })
    }

    // Gather supplementary evidence
    let evidence = ''
    if (type === 'company') {
      const urlA = deriveWebsite(recordA)
      const urlB = deriveWebsite(recordB)
      if (urlA) evidence += `\nWebsite A: ${urlA}\n${await fetchPageSnippet(urlA)}`
      if (urlB) evidence += `\nWebsite B: ${urlB}\n${await fetchPageSnippet(urlB)}`
    } else {
      const linkedinA = String(recordA.linkedin_url || '')
      const linkedinB = String(recordB.linkedin_url || '')
      if (linkedinA) evidence += `\nLinkedIn A: ${linkedinA}`
      if (linkedinB) evidence += `\nLinkedIn B: ${linkedinB}`
    }

    const systemPrompt = 'You are a data quality specialist. Analyse two CRM records and determine if they represent the same real-world entity. Be precise and return only JSON.'
    const userPrompt = `Compare these two ${type} records and determine if they are the same entity.

Record A:
${JSON.stringify(recordA, null, 2)}

Record B:
${JSON.stringify(recordB, null, 2)}
${evidence ? `\nSupplementary evidence:\n${evidence}` : ''}

Return ONLY valid JSON with this exact structure:
{
  "verdict": "same" | "different" | "uncertain",
  "confidence": 0-100,
  "reasoning": "explanation string",
  "recommendedAction": "merge" | "keep_separate" | "manual_review",
  "suggestedWinner": "a" | "b" | null,
  "mergeNotes": "what fields should be preserved from the loser"
}`

    // 8-second timeout
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    clearTimeout(timer)

    if (!res.ok) {
      console.error('[dedupe/verify] Anthropic API error:', res.status)
      return NextResponse.json({ ...TIMEOUT_RESULT, reasoning: `Anthropic API returned ${res.status}` })
    }

    const data = await res.json()
    const text: string = data.content?.[0]?.text || ''

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      const result: VerifyResult = jsonMatch ? JSON.parse(jsonMatch[0]) : TIMEOUT_RESULT
      return NextResponse.json(result)
    } catch {
      return NextResponse.json({ ...TIMEOUT_RESULT, reasoning: 'Failed to parse Claude response' })
    }
  } catch (e: unknown) {
    if (e instanceof Error && e.name === 'AbortError') {
      return NextResponse.json(TIMEOUT_RESULT)
    }
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[dedupe/verify] Error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
