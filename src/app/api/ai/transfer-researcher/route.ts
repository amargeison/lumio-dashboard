import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface TransferTarget {
  name: string
  age: number
  nationality: string
  currentClub: string
  currentLeague: string
  position: string
  estimatedValue: string
  weeklyWageEstimate: string
  contractExpires: string
  strengths: string[]
  weaknesses: string[]
  lumioFitScore: number
  recommendation: string
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

const SYSTEM_PROMPT =
  "You are an elite football transfer scout and analyst with deep knowledge of players across all European leagues, including the EFL Championship, League One, League Two, and non-league football. " +
  "You identify realistic, attainable transfer targets that match the club's budget, league level, and tactical requirements. " +
  "Always respond with valid JSON only — no preamble, no markdown."

function buildUserPrompt(body: any, stricter: boolean): string {
  const { clubName, league, position, maxAge, maxBudget, playingStyle, currentSquadWeaknesses, nationality } = body
  const base = `Find 5 realistic transfer targets for ${clubName}, currently competing in ${league}.

Search criteria:
- Position needed: ${position}
- Maximum age: ${maxAge ?? 'no limit'}
- Budget: ${maxBudget ?? 'unspecified'}
- Playing style/requirements: ${playingStyle ?? 'not specified'}
- Current squad weakness to address: ${currentSquadWeaknesses ?? 'not specified'}
- Preferred nationality: ${nationality ?? 'any'}

For each target return a JSON object with exactly these fields:
{
  "name": string,
  "age": number,
  "nationality": string,
  "currentClub": string,
  "currentLeague": string,
  "position": string,
  "estimatedValue": string,
  "weeklyWageEstimate": string,
  "contractExpires": string,
  "strengths": string[] (3-5 items),
  "weaknesses": string[] (2-3 items),
  "lumioFitScore": number (0-100),
  "recommendation": string (2-3 sentences)
}

Return a JSON array of exactly 5 targets. No other text.`
  if (!stricter) return base
  return base + '\n\nIMPORTANT: Output ONLY the raw JSON array starting with [ and ending with ]. No markdown fences. No explanatory text. No trailing prose.'
}

async function callClaude(apiKey: string, userPrompt: string): Promise<string | null> {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })
    if (!res.ok) {
      console.error('[transfer-researcher] anthropic non-OK:', res.status, await res.text())
      return null
    }
    const data = await res.json()
    return data?.content?.[0]?.text ?? null
  } catch (err) {
    console.error('[transfer-researcher] anthropic fetch failed:', err)
    return null
  }
}

function tryParseTargets(text: string): TransferTarget[] | null {
  if (!text) return null
  try {
    // Strip markdown fences if Claude added them
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim()
    const parsed = JSON.parse(cleaned)
    if (!Array.isArray(parsed)) return null
    return parsed as TransferTarget[]
  } catch {
    // Try to find a JSON array substring
    const match = text.match(/\[[\s\S]*\]/)
    if (match) {
      try {
        const parsed = JSON.parse(match[0])
        if (Array.isArray(parsed)) return parsed as TransferTarget[]
      } catch {
        return null
      }
    }
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 })
    }

    const body = await req.json().catch(() => null)
    if (!body || !body.clubId || !body.position || !body.clubName) {
      return NextResponse.json({ error: 'clubId, clubName and position are required' }, { status: 400 })
    }

    // Insert search row (status pending → running)
    const supabase = getSupabase()
    let searchId: string | null = null
    if (supabase) {
      const { data: search, error: searchErr } = await supabase
        .from('football_transfer_searches')
        .insert({ club_id: body.clubId, criteria: body, status: 'running', results_count: 0 })
        .select('id')
        .single()
      if (searchErr) console.error('[transfer-researcher] search insert error:', searchErr)
      else searchId = search?.id ?? null
    }

    // First attempt
    let raw = await callClaude(apiKey, buildUserPrompt(body, false))
    let targets = raw ? tryParseTargets(raw) : null

    // Retry once with stricter prompt
    if (!targets) {
      raw = await callClaude(apiKey, buildUserPrompt(body, true))
      targets = raw ? tryParseTargets(raw) : null
    }

    if (!targets) {
      if (supabase && searchId) {
        await supabase
          .from('football_transfer_searches')
          .update({ status: 'error' })
          .eq('id', searchId)
      }
      return NextResponse.json({ error: 'Claude returned unparseable output' }, { status: 502 })
    }

    // Persist targets
    if (supabase && searchId) {
      const rows = targets.map((t) => ({
        search_id: searchId,
        club_id: body.clubId,
        name: t.name ?? '',
        age: typeof t.age === 'number' ? t.age : null,
        nationality: t.nationality ?? null,
        current_club: t.currentClub ?? null,
        current_league: t.currentLeague ?? null,
        position: t.position ?? body.position,
        estimated_value: t.estimatedValue ?? null,
        weekly_wage_estimate: t.weeklyWageEstimate ?? null,
        contract_expires: t.contractExpires ?? null,
        strengths: Array.isArray(t.strengths) ? t.strengths : [],
        weaknesses: Array.isArray(t.weaknesses) ? t.weaknesses : [],
        lumio_fit_score: typeof t.lumioFitScore === 'number' ? t.lumioFitScore : 0,
        recommendation: t.recommendation ?? '',
        source: 'claude-ai',
      }))
      const { error: insertErr } = await supabase.from('football_transfer_targets').insert(rows)
      if (insertErr) console.error('[transfer-researcher] target insert error:', insertErr)

      await supabase
        .from('football_transfer_searches')
        .update({ status: 'complete', results_count: targets.length })
        .eq('id', searchId)
    }

    return NextResponse.json({ searchId, targets })
  } catch (err) {
    console.error('[transfer-researcher]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
