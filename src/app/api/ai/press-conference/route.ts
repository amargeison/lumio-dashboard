import { NextRequest, NextResponse } from 'next/server'

interface PressQuestion {
  question: string
  suggestedResponse: string
  topic: 'result' | 'injury' | 'opponent' | 'form' | 'transfer' | 'general'
  sensitivity: 'low' | 'medium' | 'high'
}

const SYSTEM_PROMPT =
  'You are a media relations expert for a professional football club. ' +
  'You prepare managers for press conferences by anticipating journalist questions and drafting measured, professional responses. ' +
  'Always respond with valid JSON only — no preamble, no markdown.'

function buildUserPrompt(body: any): string {
  const {
    clubName,
    league,
    leaguePosition,
    lastResult,
    upcomingOpponent,
    injuredPlayers,
    suspendedPlayers,
  } = body

  const lastResultLine = lastResult
    ? `${lastResult.venue} vs ${lastResult.opponent} — ${lastResult.homeScore ?? '?'}-${lastResult.awayScore ?? '?'} (${lastResult.competition})`
    : 'No recent result'

  const injured = Array.isArray(injuredPlayers) && injuredPlayers.length > 0 ? injuredPlayers.join(', ') : 'None'
  const suspended = Array.isArray(suspendedPlayers) && suspendedPlayers.length > 0 ? suspendedPlayers.join(', ') : 'None'

  return `Prepare a press conference briefing for the manager of ${clubName}.

Context:
- League: ${league}
- League position: ${leaguePosition ?? 'unknown'}
- Last result: ${lastResultLine}
- Next opponent: ${upcomingOpponent ?? 'TBC'}
- Injured players: ${injured}
- Suspended players: ${suspended}

Generate exactly 5 likely press conference questions with suggested manager responses. For each return:
{
  "question": string,
  "suggestedResponse": string,
  "topic": "result" | "injury" | "opponent" | "form" | "transfer" | "general",
  "sensitivity": "low" | "medium" | "high"
}

Return a JSON array of exactly 5 objects. No other text.`
}

function tryParseQuestions(text: string): PressQuestion[] | null {
  if (!text) return null
  try {
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim()
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed)) return parsed as PressQuestion[]
  } catch {
    const m = text.match(/\[[\s\S]*\]/)
    if (m) {
      try {
        const parsed = JSON.parse(m[0])
        if (Array.isArray(parsed)) return parsed as PressQuestion[]
      } catch { /* fall through */ }
    }
  }
  return null
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 })
    }

    const body = await req.json().catch(() => null)
    if (!body || !body.clubName) {
      return NextResponse.json({ error: 'clubName required' }, { status: 400 })
    }

    const userPrompt = buildUserPrompt(body)

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      console.error('[press-conference] anthropic non-OK:', res.status, errText)
      return NextResponse.json({ error: `Anthropic API error: ${res.status}` }, { status: 502 })
    }

    const data = await res.json()
    const text = data?.content?.[0]?.text ?? ''
    const questions = tryParseQuestions(text)
    if (!questions) {
      return NextResponse.json({ error: 'Claude returned unparseable output' }, { status: 502 })
    }

    return NextResponse.json({ questions })
  } catch (err) {
    console.error('[press-conference]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
