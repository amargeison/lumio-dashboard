import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })

  try {
    const { duration, meetingType, attendee } = await req.json()
    const now = new Date()

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: `You are a smart scheduling assistant. Generate 5 available meeting slot suggestions for a UK business person based on: current time and day, meeting duration requested, standard UK business hours (9am-5:30pm Mon-Fri), avoid Mondays before 10am and Fridays after 3pm, space slots across the next 5 business days, prefer mid-morning (10-11am) and mid-afternoon (2-3pm). Return JSON only: [{ "date": "string", "time": "string", "duration": "string", "label": "string" }]`,
        messages: [{ role: 'user', content: `Find slots.\nCurrent: ${now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} ${now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}\nDuration: ${duration || '30 min'}\nType: ${meetingType || 'Meeting'}\nAttendee: ${attendee || 'Contact'}\n\nReturn JSON now.` }],
      }),
    })

    if (!response.ok) return NextResponse.json({ error: 'AI generation failed' }, { status: 502 })
    const data = await response.json()
    const text = data.content?.[0]?.text || '[]'
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return NextResponse.json({ error: 'Failed to parse' }, { status: 500 })

    return NextResponse.json({ slots: JSON.parse(jsonMatch[0]) })
  } catch (err) {
    console.error('[ai/meeting-slots]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
