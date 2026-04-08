import { NextRequest, NextResponse } from 'next/server'

const SYSTEM = 'You are a professional football analyst. Always respond with valid JSON only.'

function tryParse(text: string): any | null {
  if (!text) return null
  try {
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
    return JSON.parse(cleaned)
  } catch {
    const m = text.match(/\{[\s\S]*\}/)
    if (m) { try { return JSON.parse(m[0]) } catch { return null } }
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 })

    const body = await req.json().catch(() => null)
    if (!body || !body.ourClub || !body.comparedClub) {
      return NextResponse.json({ error: 'ourClub and comparedClub required' }, { status: 400 })
    }

    const userPrompt = `Analyse this comparison for ${body.ourClub} vs ${body.comparedClub} in ${body.division ?? 'this division'}.
Our stats: ${JSON.stringify(body.ourStats ?? {})}
Their stats: ${JSON.stringify(body.comparedStats ?? {})}
Division benchmarks: ${JSON.stringify(body.benchmarks ?? {})}

Return JSON:
{
  "summary": string (3-4 sentences),
  "keyAdvantages": string[] (3 items),
  "keyThreats": string[] (3 items),
  "tacticalRecommendation": string (2-3 sentences),
  "predictionNextMeeting": string (1 sentence)
}

No other text.`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        system: SYSTEM,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!res.ok) {
      console.error('[comparison ai] anthropic non-OK:', res.status)
      return NextResponse.json({ error: `Anthropic API error: ${res.status}` }, { status: 502 })
    }

    const data = await res.json()
    const text = data?.content?.[0]?.text ?? ''
    const parsed = tryParse(text)
    if (!parsed) return NextResponse.json({ error: 'Claude returned unparseable output' }, { status: 502 })
    return NextResponse.json(parsed)
  } catch (err) {
    console.error('[comparison ai]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
