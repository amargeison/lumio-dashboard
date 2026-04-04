import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })

  try {
    const { industries, companySize, locations } = await req.json()

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: `You are a B2B research assistant. Find 15-20 real UK companies matching the given criteria. For each company find: company name, website, industry, size estimate, location, main product/service, why they might need this solution, key decision maker title (not name), Companies House number if UK registered. Return ONLY a JSON array, no markdown: [{ "company_name": "string", "website": "string", "industry": "string", "size": "string", "location": "string", "description": "string", "why_target": "string", "decision_maker_title": "string", "companies_house_number": "string or null", "confidence_score": number (0-100) }]`,
        messages: [{ role: 'user', content: `Find target companies.\nIndustries: ${(industries || []).join(', ') || 'Any'}\nCompany size: ${companySize || 'Any'}\nLocations: ${(locations || []).join(', ') || 'UK'}\n\nReturn JSON now.` }],
      }),
    })

    if (!response.ok) return NextResponse.json({ error: 'AI generation failed' }, { status: 502 })
    const data = await response.json()
    const text = data.content?.[0]?.text || '[]'
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return NextResponse.json({ error: 'Failed to parse' }, { status: 500 })

    return NextResponse.json({ companies: JSON.parse(jsonMatch[0]) })
  } catch (err) {
    console.error('[ai/discover-companies]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
