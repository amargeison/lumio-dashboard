import { NextRequest, NextResponse } from 'next/server'

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY

export async function POST(req: NextRequest) {
  try {
    const { query, filters } = await req.json()
    if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 })

    if (!ANTHROPIC_KEY) {
      // Fallback: return demo results when no API key configured
      return NextResponse.json({ companies: [] })
    }

    const filterStr = filters?.length ? `Filters: ${filters.join(', ')}` : ''
    const prompt = `You are an AI company finder for a CRM. Given this search query, generate 6 realistic UK companies that match.

Query: "${query}"
${filterStr}

Return a JSON array of exactly 6 companies. Each company object must have:
- name: company name (string)
- industry: sector (string)
- location: UK city (string)
- size: description like "2,400 pupils" or "150 employees" (string)
- website: realistic domain (string)
- match: match score 80-98 (number)
- color: hex color for the brand (string, choose from #0D9488 #3B82F6 #8B5CF6 #F59E0B #22C55E #EC4899)
- reasons: array of exactly 3 strings explaining why this company matches

Return ONLY valid JSON, no markdown or explanation.`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!res.ok) return NextResponse.json({ companies: [] })

    const data = await res.json()
    const text = data.content?.[0]?.text || ''

    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      const companies = jsonMatch ? JSON.parse(jsonMatch[0]) : []
      return NextResponse.json({ companies })
    } catch {
      return NextResponse.json({ companies: [] })
    }
  } catch {
    return NextResponse.json({ companies: [] }, { status: 500 })
  }
}
