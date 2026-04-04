import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('x-workspace-token')
    if (!token) {
      return NextResponse.json({ error: 'Missing workspace token' }, { status: 401 })
    }

    const supabase = getSupabase()
    const { data: session, error: sessionError } = await supabase
      .from('business_sessions')
      .select('business_id')
      .eq('token', token)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Invalid workspace token' }, { status: 401 })
    }

    const { name, email, company, role } = await req.json()

    if (!name && !email && !company) {
      return NextResponse.json({ error: 'At least one of name, email, or company is required' }, { status: 400 })
    }

    const anthropic = new Anthropic()

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: 'You are ARIA, Lumio CRM\'s AI enrichment engine. Generate a realistic enriched contact profile as JSON with exactly these fields: {"bio","location","companySize","companyRevenue","linkedinUrl","twitterHandle","emailStatus","companyStatus","enrichmentScore","buyingSignals"}. Return ONLY valid JSON. No markdown. No explanation.',
      messages: [
        {
          role: 'user',
          content: `Enrich: Name=${name || 'Unknown'}, Email=${email || 'Unknown'}, Company=${company || 'Unknown'}, Role=${role || 'Unknown'}`,
        },
      ],
    })

    const textBlock = message.content.find((block) => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'No response from enrichment engine' }, { status: 500 })
    }

    const enrichedData = JSON.parse(textBlock.text)

    return NextResponse.json(enrichedData)
  } catch (error: unknown) {
    console.error('Enrich API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
