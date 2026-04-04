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

  // Get account info
  let companyName = ''
  let domain = ''

  if (type === 'schools') {
    const { data } = await supabase.from('schools').select('name, email').eq('slug', slug).maybeSingle()
    if (data) { companyName = data.name; domain = data.email?.split('@')[1] || '' }
  } else {
    const { data } = await supabase.from('businesses').select('company_name, owner_email').eq('slug', slug).maybeSingle()
    if (data) { companyName = data.company_name; domain = data.owner_email?.split('@')[1] || '' }
  }

  if (!companyName) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Claude API not configured' }, { status: 500 })

  try {
    const client = new Anthropic({ apiKey })

    const schoolExtra = type === 'schools' ? `
Also include:
- ofsted: { rating, last_inspection_date, key_findings }
- school_type: primary/secondary/MAT etc.
- pupil_numbers, staff_count, local_authority
- performance_data: { attendance_rate, progress_scores, any_notable_metrics }` : ''

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      tools: [{ type: 'web_search' as any, name: 'web_search' }] as any,
      messages: [{
        role: 'user',
        content: `Research the company "${companyName}" (domain: ${domain || 'unknown'}). Return a detailed JSON object with:
- company_overview: { description, industry, founded, size_estimate, headquarters, website, linkedin_url }
- products_and_services: string[]
- key_people: [{ name, role }]
- recent_news: [{ headline, date, summary }]
- competitors: [{ name, description }]
- tech_stack_hints: string[]
- pain_points: string[]
- lumio_fit_score: number 1-10 with reasoning
- sales_talking_points: string[]
- risk_factors: string[]
${schoolExtra}
Return ONLY valid JSON, no markdown wrapping.`
      }],
    })

    // Extract text from response
    let researchText = ''
    for (const block of response.content) {
      if (block.type === 'text') researchText += block.text
    }

    let research: any = {}
    try {
      // Try to parse JSON from the response, handling possible markdown wrapping
      const jsonMatch = researchText.match(/\{[\s\S]*\}/)
      if (jsonMatch) research = JSON.parse(jsonMatch[0])
      else research = { raw: researchText }
    } catch {
      research = { raw: researchText }
    }

    // Upsert to account_research
    await supabase.from('account_research').upsert({
      account_slug: slug,
      account_type: type,
      research,
      researched_at: new Date().toISOString(),
    }, { onConflict: 'account_slug,account_type' })

    return NextResponse.json({ research, researched_at: new Date().toISOString() })
  } catch (err) {
    console.error('[research]', err)
    return NextResponse.json({ error: 'Research failed' }, { status: 500 })
  }
}

// GET — fetch cached research
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const supabase = getSupabase()
  const token = req.headers.get('x-admin-token')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params
  const type = req.nextUrl.searchParams.get('type') || 'business'

  const { data } = await supabase.from('account_research').select('*').eq('account_slug', slug).eq('account_type', type).maybeSingle()
  if (!data) return NextResponse.json({ research: null })
  return NextResponse.json({ research: data.research, researched_at: data.researched_at })
}
