import { NextRequest, NextResponse } from 'next/server'

const RECS_SYSTEM = 'You are a fan engagement strategist for a football club. You give specific, actionable recommendations to improve attendance, NPS, social sentiment, and season ticket renewal. Always respond with valid JSON only — no preamble, no markdown.'
const NEWSLETTER_SYSTEM = 'You are the communications officer for a football club. You write warm, conversational fan newsletters that celebrate the team and engage supporters. Plain text only.'

function buildRecsPrompt(b: any): string {
  return `Based on this fan engagement data for ${b.clubName}:
- Average attendance: ${b.avgAttendance ?? 'unknown'} (trend ${b.attendanceTrend ?? 0}%)
- NPS score: ${b.nps ?? 'unknown'} (trend ${b.npsTrend ?? 0})
- Season ticket renewal: ${b.renewalRate ?? 'unknown'}%
- Social sentiment: ${b.sentiment ?? 'unknown'}

Give 5 specific, actionable recommendations to improve fan engagement.

Return ONLY a JSON object:
{
  "recommendations": [
    { "title": string, "action": string (2-3 sentence detailed action), "expectedImpact": string, "difficulty": "Easy" | "Medium" | "Hard", "timeline": "Weeks" | "Months" | "Season" }
  ]
}

Exactly 5 recommendations. No other text.`
}

function buildNewsletterPrompt(b: any): string {
  return `Draft a short fan newsletter intro for ${b.clubName}.
Context:
- Recent form: ${b.recentForm ?? 'mixed'}
- Attendance trend: ${b.attendanceTrend ?? 0}%
- Upcoming fixture: ${b.upcomingFixture ?? 'TBC'}

Write 3-4 short paragraphs in plain text. Warm, conversational, celebrating the supporters. No subject line, no sign-off — just the body. No markdown.`
}

function tryParseJson(text: string): any | null {
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
    if (!body || !body.clubName) return NextResponse.json({ error: 'clubName required' }, { status: 400 })

    const action = body.action ?? 'recommendations'
    const isNewsletter = action === 'newsletter-draft'
    const system = isNewsletter ? NEWSLETTER_SYSTEM : RECS_SYSTEM
    const prompt = isNewsletter ? buildNewsletterPrompt(body) : buildRecsPrompt(body)

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1200,
        system,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!res.ok) {
      console.error('[fan-insights] anthropic non-OK:', res.status)
      return NextResponse.json({ error: `Anthropic API error: ${res.status}` }, { status: 502 })
    }

    const data = await res.json()
    const text = data?.content?.[0]?.text ?? ''

    if (isNewsletter) {
      return NextResponse.json({ newsletter: text.trim() })
    }
    const parsed = tryParseJson(text)
    if (!parsed?.recommendations) return NextResponse.json({ error: 'Claude returned unparseable output' }, { status: 502 })
    return NextResponse.json({ recommendations: parsed.recommendations })
  } catch (err) {
    console.error('[fan-insights]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
