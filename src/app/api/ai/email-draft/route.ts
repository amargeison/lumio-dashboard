import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })

  try {
    const { to, goal, context } = await req.json()

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: `You are a professional email writer for a UK business. Write a concise, professional email based on the goal and recipient context. Tone: warm but professional. UK spelling. No fluff. Max 150 words. Return JSON only: { "subject": "string", "body": "string", "suggestedFollowUpDate": "string or null" }`,
        messages: [{ role: 'user', content: `Draft an email.\nTo: ${to?.name || 'Contact'} (${to?.email || ''}) at ${to?.company || 'their company'}, ${to?.jobTitle || ''}.\nGoal: ${goal || 'Follow up'}\nFrom: ${context?.userName || 'User'} at ${context?.company || 'My Company'}\nPrevious interactions: ${context?.previousInteractions || 'None known'}\n\nReturn JSON now.` }],
      }),
    })

    if (!response.ok) return NextResponse.json({ error: 'AI generation failed' }, { status: 502 })
    const data = await response.json()
    const text = data.content?.[0]?.text || '{}'
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'Failed to parse' }, { status: 500 })

    return NextResponse.json(JSON.parse(jsonMatch[0]))
  } catch (err) {
    console.error('[ai/email-draft]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
