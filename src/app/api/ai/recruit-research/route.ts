import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 })

  try {
    const body = await req.json()
    const { action, jobTitle, level, location, salaryMin, salaryMax, sourcingPreference, mustHaves } = body

    let systemPrompt = ''
    let userPrompt = ''

    if (action === 'market-research') {
      systemPrompt = 'You are a recruitment intelligence agent. Return ONLY valid JSON, no markdown.'
      userPrompt = `Research the hiring market for: ${jobTitle} (${level}) at a company in ${location}. Salary range: £${salaryMin || '?'}-£${salaryMax || '?'}. Sourcing: ${sourcingPreference || 'Any'}.

Return ONLY JSON:
{
  "marketSalary": "Market rate range eg £45,000-£55,000",
  "salaryInsight": "One sentence on salary competitiveness",
  "candidatePool": "Size and quality of candidate pool",
  "timeToHire": "Realistic time to hire eg 6-10 weeks",
  "topSkills": ["skill 1", "skill 2", "skill 3", "skill 4", "skill 5"],
  "redFlags": ["flag 1", "flag 2"],
  "competitorActivity": "What competitors are doing in this hiring space",
  "sourcingTip": "Best sourcing strategy for this role",
  "interviewProcess": "Recommended interview process (stages)",
  "hiringRisk": "Low / Medium / High with reason"
}`
    } else if (action === 'job-description') {
      systemPrompt = 'You are an expert recruitment copywriter. Return ONLY valid JSON, no markdown.'
      userPrompt = `Write a compelling job description for: ${jobTitle} (${level}), ${location}, £${salaryMin || '?'}-£${salaryMax || '?'}. Company: a fast-growing B2B SaaS company. Requirements: ${mustHaves?.join(', ') || 'standard'}. Tone: professional but human.

Return ONLY JSON:
{
  "headline": "Punchy one-line headline",
  "aboutRole": "2 paragraph about the role",
  "whatYoullDo": ["responsibility 1", "responsibility 2", "responsibility 3", "responsibility 4", "responsibility 5"],
  "whatWeNeed": ["requirement 1", "requirement 2", "requirement 3", "requirement 4"],
  "whatWeOffer": ["benefit 1", "benefit 2", "benefit 3", "benefit 4"],
  "closingLine": "Compelling closing sentence"
}`
    } else if (action === 'candidate-personas') {
      systemPrompt = 'You are a recruitment intelligence agent. Return ONLY valid JSON, no markdown.'
      userPrompt = `Generate 5 realistic fictional candidate personas for a ${jobTitle} (${level}) role. These are illustrative examples only — not real people.

Return ONLY a JSON array:
[{
  "name": "Generic initial + surname eg A. Sharma",
  "currentRole": "Current job title",
  "currentCompany": "Type of company eg Series B SaaS startup",
  "yearsExp": "Years of experience",
  "keySkills": ["skill 1", "skill 2", "skill 3"],
  "standout": "What makes them interesting",
  "salaryExpectation": "Likely salary expectation",
  "availability": "Notice period eg 1 month",
  "fitScore": 8,
  "linkedinNote": "What their LinkedIn likely looks like"
}]`
    } else if (action === 'outreach') {
      systemPrompt = 'You are an expert recruitment outreach copywriter. Return ONLY valid JSON, no markdown.'
      userPrompt = `Write 3 recruitment outreach messages for ${jobTitle} at a fast-growing B2B SaaS company. Salary: £${salaryMin || '?'}-£${salaryMax || '?'}. Location: ${location}. Tone: professional but personable — not corporate.

Return ONLY JSON:
{
  "linkedinConnect": "Short LinkedIn connection message max 300 chars",
  "linkedinInmail": "Full LinkedIn InMail body",
  "emailSubject": "Email subject line",
  "emailBody": "Full email body"
}`
    } else if (action === 'interview-questions') {
      systemPrompt = 'You are an expert interviewer. Return ONLY valid JSON, no markdown.'
      userPrompt = `Generate 10 interview questions for ${jobTitle} (${level}). Mix of: competency, technical, situational, culture fit. Return ONLY a JSON array of strings.`
    } else {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      return NextResponse.json({ error: `Anthropic API error: ${res.status}`, details: errText }, { status: res.status })
    }

    const data = await res.json()
    const text = data.content?.[0]?.text || ''

    try {
      const parsed = JSON.parse(text)
      return NextResponse.json(parsed)
    } catch {
      return NextResponse.json({ raw: text }, { status: 200 })
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  }
}
