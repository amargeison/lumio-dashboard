import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const supabase = getSupabase()
  const token = req.headers.get('x-admin-token')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: session } = await supabase.from('admin_sessions').select('admin_id').eq('token', token).gt('expires_at', new Date().toISOString()).maybeSingle()
  if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  const { slug } = await params
  const { type } = await req.json().catch(() => ({ type: 'business' }))

  // Gather all data
  let account: any = null
  if (type === 'schools') {
    const { data } = await supabase.from('schools').select('*').eq('slug', slug).maybeSingle()
    account = data
  } else {
    const { data } = await supabase.from('businesses').select('*').eq('slug', slug).maybeSingle()
    account = data
  }
  if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: research } = await supabase.from('account_research').select('research').eq('account_slug', slug).eq('account_type', type).maybeSingle()
  const { data: activity } = await supabase.from('activity_log').select('action, department, created_at').eq('account_slug', slug).order('created_at', { ascending: false }).limit(100)

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Claude API not configured' }, { status: 500 })

  try {
    const client = new Anthropic({ apiKey })
    const companyName = account.company_name || account.name || slug

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `You are a customer success manager at Lumio, a UK SaaS platform for businesses and schools. Here is everything we know about the account "${companyName}":

Account data: ${JSON.stringify(account)}
Research: ${research ? JSON.stringify(research.research) : 'None available'}
Recent activity (last 100 events): ${JSON.stringify(activity || [])}

Write a detailed customer success report with these sections:
1. Executive Summary (2-3 sentences)
2. Account Health Assessment (detailed RAG analysis)
3. Key Observations (what they're doing well, what they're not using)
4. Immediate Actions (prioritised list of actions to take this week)
5. Growth Opportunities (upsell/expansion potential)
6. Churn Risk Assessment (specific risks and mitigations)
7. Recommended Message (draft a personalised outreach email to this customer)

Write in a professional but warm tone. Be specific — reference actual data points. Return as plain text with clear section headers.`
      }],
    })

    let report = ''
    for (const block of response.content) {
      if (block.type === 'text') report += block.text
    }

    return NextResponse.json({ report })
  } catch (err) {
    console.error('[insights]', err)
    return NextResponse.json({ error: 'Insights generation failed' }, { status: 500 })
  }
}
