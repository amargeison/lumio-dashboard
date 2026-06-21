import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const ADMIN_TOKEN = process.env.SPORTS_ADMIN_TOKEN || 'lumio-sports-admin-2026'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// Mirrors /api/admin/research/[slug] but keyed to sports_profiles by id and
// gated by the static sports admin token. Cached in account_research with
// account_type = 'sports'.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.headers.get('x-admin-token')
  if (token !== ADMIN_TOKEN) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = getSupabase()

  const { data: profile } = await supabase.from('sports_profiles').select('*').eq('id', id).maybeSingle()
  if (!profile) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  // Subject of research: the club/brand if present, else the coach/athlete name.
  const companyName = profile.brand_name || profile.display_name || 'this account'
  const { data: authData } = await supabase.auth.admin.getUserById(id).catch(() => ({ data: null } as any))
  const email = authData?.user?.email || ''
  const domain = email.includes('@') ? email.split('@')[1] : ''

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Claude API not configured' }, { status: 500 })

  try {
    const client = new Anthropic({ apiKey })
    const sport = profile.sport === 'coach' ? 'tennis coaching' : profile.sport

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      tools: [{ type: 'web_search' as any, name: 'web_search' }] as any,
      messages: [{
        role: 'user',
        content: `Research "${companyName}" (a ${sport} club/coach/athlete${domain ? `, domain: ${domain}` : ''}). Return a detailed JSON object with:
- company_overview: { description, sport, level, location, founded, size_estimate, website, social_url }
- products_and_services: string[]
- key_people: [{ name, role }]
- recent_news: [{ headline, date, summary }]
- competitors: [{ name, description }]
- tech_stack_hints: string[]
- pain_points: string[]
- lumio_fit_score: number 1-10 with reasoning
- sales_talking_points: string[]
- risk_factors: string[]
Return ONLY valid JSON, no markdown wrapping.`
      }],
    })

    let researchText = ''
    for (const block of response.content) {
      if (block.type === 'text') researchText += block.text
    }

    let research: any = {}
    try {
      const jsonMatch = researchText.match(/\{[\s\S]*\}/)
      if (jsonMatch) research = JSON.parse(jsonMatch[0])
      else research = { raw: researchText }
    } catch {
      research = { raw: researchText }
    }

    await supabase.from('account_research').upsert({
      account_slug: id,
      account_type: 'sports',
      research,
      researched_at: new Date().toISOString(),
    }, { onConflict: 'account_slug,account_type' })

    return NextResponse.json({ research, researched_at: new Date().toISOString() })
  } catch (err) {
    console.error('[sports research]', err)
    return NextResponse.json({ error: 'Research failed' }, { status: 500 })
  }
}

// GET — fetch cached research
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.headers.get('x-admin-token')
  if (token !== ADMIN_TOKEN) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = getSupabase()
  try {
    const { data } = await supabase.from('account_research').select('*').eq('account_slug', id).eq('account_type', 'sports').maybeSingle()
    if (!data) return NextResponse.json({ research: null })
    return NextResponse.json({ research: data.research, researched_at: data.researched_at })
  } catch {
    return NextResponse.json({ research: null })
  }
}
