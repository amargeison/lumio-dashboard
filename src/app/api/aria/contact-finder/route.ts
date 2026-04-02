import { NextRequest, NextResponse } from 'next/server'

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY

export async function POST(req: NextRequest) {
  try {
    const { company, role } = await req.json()
    if (!company) return NextResponse.json({ error: 'Company required' }, { status: 400 })

    if (!ANTHROPIC_KEY) {
      return NextResponse.json({ contacts: [] })
    }

    const roleFilter = role && role !== 'Any role' ? `Focus on people in ${role} roles.` : ''
    const prompt = `You are an AI contact finder for a CRM. Generate 8 realistic contacts at "${company}".
${roleFilter}

Return a JSON array of exactly 8 contacts. Each contact object must have:
- name: full name (string)
- title: job title (string)
- company: "${company}" (string)
- email: masked email like "r.fox@*****.edu" (string)
- linkedin: "Found" or "Not found" (string)
- phone: "Available" or "Unavailable" (string)
- score: ARIA match score 40-98 (number)
- active: last active description like "Active 2 days ago" (string)
- color: hex color (string, choose from #0D9488 #3B82F6 #8B5CF6 #F59E0B #22C55E #EC4899 #EF4444 #6D28D9)

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

    if (!res.ok) return NextResponse.json({ contacts: [] })

    const data = await res.json()
    const text = data.content?.[0]?.text || ''

    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      const contacts = jsonMatch ? JSON.parse(jsonMatch[0]) : []
      return NextResponse.json({ contacts })
    } catch {
      return NextResponse.json({ contacts: [] })
    }
  } catch {
    return NextResponse.json({ contacts: [] }, { status: 500 })
  }
}
