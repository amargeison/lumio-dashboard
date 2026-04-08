import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { POST_MATCH_SYSTEM_PROMPT, buildPostMatchUserPrompt, tryParsePostMatch } from '@/lib/post-match-prompt'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 })

    const body = await req.json().catch(() => null)
    if (!body || !body.clubName || !body.clubId || !body.opponent) {
      return NextResponse.json({ error: 'clubName, clubId and opponent are required' }, { status: 400 })
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2500,
        system: POST_MATCH_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildPostMatchUserPrompt(body) }],
      }),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      console.error('[post-match] anthropic non-OK:', res.status, errText)
      return NextResponse.json({ error: `Anthropic API error: ${res.status}` }, { status: 502 })
    }

    const data = await res.json()
    const text = data?.content?.[0]?.text ?? ''
    const report = tryParsePostMatch(text)
    if (!report) {
      return NextResponse.json({ error: 'Claude returned unparseable output' }, { status: 502 })
    }

    let reportId: string | null = null
    const supabase = getSupabase()
    if (supabase) {
      const { data: row, error: insertErr } = await supabase
        .from('football_match_reports')
        .insert({
          club_id: body.clubId,
          match_date: body.matchDate ?? new Date().toISOString().slice(0, 10),
          opponent: body.opponent,
          venue: body.venue,
          competition: body.competition,
          our_score: body.ourScore,
          opponent_score: body.opponentScore,
          our_formation: body.ourFormation,
          opponent_formation: body.opponentFormation ?? null,
          report_data: report,
          approved: false,
        })
        .select('id')
        .single()
      if (insertErr) console.error('[post-match] insert error:', insertErr)
      else reportId = row?.id ?? null
    }

    return NextResponse.json({ reportId, report })
  } catch (err) {
    console.error('[post-match]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
