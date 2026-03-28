import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function GET(req: NextRequest) {
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

    const tenantId = session.business_id

    const { data: deals } = await supabase
      .from('crm_deals')
      .select('*')
      .eq('tenant_id', tenantId)
      .or('won.is.null,won.eq.false')
      .is('closed_at', null)
      .order('value', { ascending: false })
      .limit(10)

    const { data: flaggedContacts } = await supabase
      .from('crm_contacts')
      .select('*')
      .eq('tenant_id', tenantId)
      .in('email_status', ['warning', 'bounced'])

    if (!deals || deals.length === 0) {
      return NextResponse.json({
        brief: 'Welcome to Lumio CRM. Add your first deals to see ARIA insights here.',
      })
    }

    const anthropic = new Anthropic()

    const totalValue = deals.reduce((sum, d) => sum + (d.value || 0), 0)

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: `You are ARIA, the AI briefing engine for Lumio CRM. Write a concise morning brief (3-5 sentences) summarising the user's pipeline health, top deals to focus on, and any contacts that need attention. Be specific — mention deal names, values, and contact names. Use a professional but energising tone.`,
      messages: [
        {
          role: 'user',
          content: `Generate my daily CRM brief.\n\nTop open deals (${deals.length}):\n${JSON.stringify(deals, null, 2)}\n\nTotal pipeline value: \u00A3${totalValue}\n\nFlagged contacts (${flaggedContacts?.length || 0}):\n${JSON.stringify(flaggedContacts || [], null, 2)}`,
        },
      ],
    })

    const textBlock = message.content.find((block) => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'No response from briefing engine' }, { status: 500 })
    }

    return NextResponse.json({ brief: textBlock.text })
  } catch (error: unknown) {
    console.error('Brief API error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
