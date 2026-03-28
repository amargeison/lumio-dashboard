import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

function buildSystemPrompt(crmContext: {
  userName?: string
  contacts?: unknown[]
  deals?: unknown[]
  totalPipelineValue?: number
  winRate?: number
  openDealsCount?: number
}): string {
  const userName = crmContext.userName || 'User'
  const contacts = crmContext.contacts || []
  const deals = crmContext.deals || []
  const totalPipelineValue = crmContext.totalPipelineValue || 0
  const winRate = crmContext.winRate || 0
  const openDealsCount = crmContext.openDealsCount || 0

  return `You are ARIA, the AI intelligence layer inside Lumio CRM — the world's most advanced AI-native CRM built in 2026. You are ${userName}'s personal CRM genius.

LIVE CRM DATA:
Contacts: ${JSON.stringify(contacts)}
Pipeline: ${JSON.stringify(deals)}
Total pipeline value: \u00A3${totalPipelineValue}
Win rate: ${winRate}%
Open deals: ${openDealsCount}

Be sharp, direct, and data-driven. Reference actual contact names and deal values in every response. Keep responses to 2-4 sentences unless the user asks for detail.`
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

    const { messages, crmContext } = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 })
    }

    const anthropic = new Anthropic()

    const systemPrompt = buildSystemPrompt(crmContext || {})

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages,
    })

    const textBlock = message.content.find((block) => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'No response from ARIA' }, { status: 500 })
    }

    return NextResponse.json({ content: textBlock.text })
  } catch (error: unknown) {
    console.error('ARIA API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
