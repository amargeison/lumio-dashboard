import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { transcript, dept, company } = await req.json()

  if (!transcript) {
    return NextResponse.json({ error: 'No transcript provided' }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
  }

  const systemPrompt = `You are Lumio, an AI business operating system assistant. The user is in the "${dept}" department of "${company}".

When the user gives a voice command, respond with a JSON object (no markdown, no extra text) in this exact shape:
{
  "response": "A short, friendly confirmation of what you understood and will do (1-2 sentences)",
  "actions": [
    {
      "label": "Short action label (e.g. 'Cancel 11:00 meeting')",
      "requiresIntegration": true,
      "integrationNote": "Google Calendar"
    }
  ]
}

Rules:
- Always return valid JSON only — no markdown code fences
- Include 1-3 actions per command
- Set requiresIntegration: true when the action needs a real calendar, email, or CRM system
- integrationNote should name the specific tool (Google Calendar, Outlook, HubSpot, Slack, etc.)
- If an action can be done within Lumio itself (create a task, log a note, update a record), set requiresIntegration: false and omit integrationNote
- Keep action labels concise and actionable`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: 'user', content: transcript }],
    }),
  })

  if (!res.ok) {
    const errBody = await res.text()
    console.error('[voice-command] Anthropic error', res.status, errBody)
    return NextResponse.json({ error: 'Claude API error', status: res.status, detail: errBody }, { status: 500 })
  }

  const data = await res.json()
  const text = data.content?.[0]?.text ?? '{}'
  console.log('[voice-command] raw response:', text)

  try {
    const parsed = JSON.parse(text)
    return NextResponse.json(parsed)
  } catch (e) {
    console.error('[voice-command] JSON parse error:', e, 'raw:', text)
    return NextResponse.json({ error: 'Failed to parse response', raw: text }, { status: 500 })
  }
}
