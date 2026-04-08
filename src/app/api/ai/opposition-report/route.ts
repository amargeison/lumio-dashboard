import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface KeyThreat {
  playerName: string
  position: string
  threat: string
  howToStop: string
}

interface TacticalSuggestion {
  phase: 'In Possession' | 'Out of Possession' | 'Set Pieces'
  suggestion: string
}

interface OppositionReport {
  opponentOverview: string
  likelyFormation: string
  keyThreats: KeyThreat[]
  teamStrengths: string[]
  teamWeaknesses: string[]
  tacticalSuggestions: TacticalSuggestion[]
  setPieceWarnings: string[]
  predictedLineup: string[]
  confidenceLevel: 'High' | 'Medium' | 'Low'
  analystNote: string
}

const SYSTEM_PROMPT =
  'You are an elite football analyst and opposition scout with deep knowledge of teams across all English football leagues including the Premier League, Championship, League One, League Two, and non-league. You produce detailed, actionable opposition reports for professional coaching staff. ' +
  'Always respond with valid JSON only — no preamble, no markdown.'

function buildUserPrompt(body: any): string {
  const {
    clubName,
    league,
    opponentName,
    matchDate,
    venue,
    competition,
    ourFormation,
    ourPlayingStyle,
  } = body

  return `Generate a detailed opposition scouting report for ${clubName} preparing to face ${opponentName} in ${competition ?? league}.

Match details:
- Venue: ${venue ?? 'unknown'}
- Date: ${matchDate ?? 'upcoming'}
- Our formation: ${ourFormation ?? 'not specified'}
- Our playing style: ${ourPlayingStyle ?? 'not specified'}

Return a JSON object with exactly this structure:
{
  "opponentOverview": string (2-3 sentences on their current form/season),
  "likelyFormation": string (e.g. "4-3-3"),
  "keyThreats": [
    {
      "playerName": string,
      "position": string,
      "threat": string (1-2 sentences),
      "howToStop": string (1-2 sentences)
    }
  ] (exactly 3 players),
  "teamStrengths": string[] (exactly 4 items),
  "teamWeaknesses": string[] (exactly 4 items),
  "tacticalSuggestions": [
    {
      "phase": "In Possession" | "Out of Possession" | "Set Pieces",
      "suggestion": string (2-3 sentences)
    }
  ] (exactly 3 items, one per phase),
  "setPieceWarnings": string[] (2-3 items about their set piece threats),
  "predictedLineup": string[] (11 player names in formation order),
  "confidenceLevel": "High" | "Medium" | "Low",
  "analystNote": string (1 sentence caveat about data recency)
}

No other text.`
}

function tryParseReport(text: string): OppositionReport | null {
  if (!text) return null
  try {
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim()
    const parsed = JSON.parse(cleaned)
    if (parsed && typeof parsed === 'object') return parsed as OppositionReport
  } catch {
    const m = text.match(/\{[\s\S]*\}/)
    if (m) {
      try {
        const parsed = JSON.parse(m[0])
        if (parsed && typeof parsed === 'object') return parsed as OppositionReport
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
    if (!body || !body.clubName || !body.opponentName) {
      return NextResponse.json({ error: 'clubName and opponentName required' }, { status: 400 })
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
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    }).catch((e) => {
      console.error('[opposition-report] fetch failed', e)
      return null
    })

    if (!res || !res.ok) {
      const status = res?.status ?? 500
      const errText = res ? await res.text().catch(() => '') : ''
      console.error('[opposition-report] anthropic non-OK:', status, errText)
      return NextResponse.json({ error: `Anthropic API error: ${status}` }, { status: 502 })
    }

    const data = await res.json().catch(() => null)
    const text = data?.content?.[0]?.text ?? ''
    const report = tryParseReport(text)
    if (!report) {
      return NextResponse.json({ error: 'Claude returned unparseable output' }, { status: 502 })
    }

    let reportId: string | null = null
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (supabaseUrl && supabaseKey && body.clubId) {
        const supabase = createClient(supabaseUrl, supabaseKey)
        const { data: inserted, error: insertErr } = await supabase
          .from('football_opposition_reports')
          .insert({
            club_id: body.clubId,
            opponent_name: body.opponentName,
            match_date: body.matchDate ?? null,
            competition: body.competition ?? null,
            venue: body.venue ?? null,
            report_data: report,
          })
          .select('id')
          .single()
        if (insertErr) {
          console.error('[opposition-report] supabase insert error', insertErr)
        } else {
          reportId = inserted?.id ?? null
        }
      }
    } catch (e) {
      console.error('[opposition-report] supabase save failed', e)
    }

    return NextResponse.json({ reportId, report })
  } catch (err) {
    console.error('[opposition-report]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
