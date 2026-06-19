import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const ADMIN_TOKEN = process.env.SPORTS_ADMIN_TOKEN || 'lumio-sports-admin-2026'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// Mirrors /api/admin/insights/[slug] but for sports accounts (keyed by id).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.headers.get('x-admin-token')
  if (token !== ADMIN_TOKEN) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = getSupabase()

  const { data: account } = await supabase.from('sports_profiles').select('*').eq('id', id).maybeSingle()
  if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: research } = await supabase.from('account_research').select('research').eq('account_slug', id).eq('account_type', 'sports').maybeSingle()

  // Activity: merge logins + events
  const activity: any[] = []
  try {
    const { data } = await supabase.from('sports_logins').select('created_at').eq('user_id', id).order('created_at', { ascending: false }).limit(100)
    data?.forEach(l => activity.push({ action: 'login', created_at: l.created_at }))
  } catch {}
  try {
    const { data } = await supabase.from('sports_events').select('event_type, event_name, created_at').eq('user_id', id).order('created_at', { ascending: false }).limit(100)
    data?.forEach((e: any) => activity.push({ action: e.event_type, department: e.event_name, created_at: e.created_at }))
  } catch {}

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Claude API not configured' }, { status: 500 })

  try {
    const client = new Anthropic({ apiKey })
    const companyName = account.brand_name || account.display_name || id
    const sport = account.sport === 'coach' ? 'tennis coaching' : account.sport

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `You are a customer success manager at Lumio Sports, a UK SaaS platform for ${sport} clubs, coaches and athletes. Here is everything we know about the account "${companyName}":

Account data: ${JSON.stringify(account)}
Research: ${research ? JSON.stringify(research.research) : 'None available'}
Recent activity (last 100 events): ${JSON.stringify(activity)}

Write a detailed customer success report with these sections:
1. Executive Summary (2-3 sentences)
2. Account Health Assessment (detailed RAG analysis)
3. Key Observations (what they're doing well, what they're not using)
4. Immediate Actions (prioritised list of actions to take this week)
5. Growth Opportunities (upsell/expansion potential — e.g. plan tier, kit, Racket reward system)
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
    console.error('[sports insights]', err)
    return NextResponse.json({ error: 'Insights generation failed' }, { status: 500 })
  }
}
