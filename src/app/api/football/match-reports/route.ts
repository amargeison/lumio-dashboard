import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { POST_MATCH_SYSTEM_PROMPT, buildPostMatchUserPrompt, tryParsePostMatch } from '@/lib/post-match-prompt'
import { buildReportFromTemplate } from '@/lib/match-report-builder'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabase()
    if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
    const { searchParams } = new URL(req.url)
    const clubId = searchParams.get('clubId')
    if (!clubId) return NextResponse.json({ error: 'clubId required' }, { status: 400 })

    const { data, error } = await supabase
      .from('football_match_reports')
      .select('*, football_report_templates(template_name, template_type)')
      .eq('club_id', clubId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('[match-reports GET]', error)
      return NextResponse.json({ error: 'Query failed' }, { status: 500 })
    }
    return NextResponse.json({ reports: data ?? [] })
  } catch (err) {
    console.error('[match-reports GET]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 })

    const body = await req.json().catch(() => null)
    if (!body || !body.clubId || !body.opponent || !body.clubName) {
      return NextResponse.json({ error: 'clubId, clubName, opponent required' }, { status: 400 })
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
    }).catch((e) => { console.error('[match-reports POST fetch]', e); return null })

    if (!res || !res.ok) {
      const status = res?.status ?? 500
      console.error('[match-reports POST] anthropic non-OK:', status)
      return NextResponse.json({ error: `Anthropic API error: ${status}` }, { status: 502 })
    }

    const data = await res.json().catch(() => null)
    const text = data?.content?.[0]?.text ?? ''
    const report = tryParsePostMatch(text)
    if (!report) {
      return NextResponse.json({ error: 'Claude returned unparseable output' }, { status: 502 })
    }

    const supabase = getSupabase()
    let template: any = null
    let builtSections: any = null
    let wordCount = 0

    if (supabase && body.templateId) {
      const { data: tmpl } = await supabase
        .from('football_report_templates')
        .select('*')
        .eq('id', body.templateId)
        .single()
      template = tmpl
    }

    if (template) {
      const built = buildReportFromTemplate(template, report, body.clubName)
      builtSections = built.sections
      wordCount = built.wordCount
    }

    let reportId: string | null = null
    if (supabase) {
      const { data: row, error: insertErr } = await supabase
        .from('football_match_reports')
        .insert({
          club_id: body.clubId,
          fixture_id: body.fixtureId ?? null,
          match_date: body.matchDate ?? new Date().toISOString().slice(0, 10),
          opponent: body.opponent,
          venue: body.venue,
          competition: body.competition,
          our_score: body.ourScore,
          opponent_score: body.opponentScore,
          our_formation: body.ourFormation,
          opponent_formation: body.opponentFormation ?? null,
          report_data: report,
          edited_content: builtSections,
          template_id: body.templateId ?? null,
          word_count: wordCount,
          approved: false,
          version: 1,
        })
        .select('id')
        .single()
      if (insertErr) console.error('[match-reports POST insert]', insertErr)
      else reportId = row?.id ?? null
    }

    return NextResponse.json({ reportId, report, builtSections })
  } catch (err) {
    console.error('[match-reports POST]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
