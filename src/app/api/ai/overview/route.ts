import { NextRequest, NextResponse } from 'next/server'

type TabType = 'quick-wins' | 'daily-tasks' | 'insights' | 'dont-miss' | 'team'

interface OverviewContext {
  userName: string
  company: string
  role: string
  department: string
  timeOfDay: string
  dayOfWeek: string
  connectedIntegrations: string[]
  importedData: {
    hasStaff: boolean
    hasContacts: boolean
    hasAccounts: boolean
  }
}

const SYSTEM_PROMPTS: Record<TabType, string> = {
  'quick-wins': `You are Lumio, an AI business assistant. Generate 4-5 high-impact, low-effort quick wins for this user right now. Each should be completable in under 5 minutes. Base them on their role, department, time of day, and any connected data. If no integrations are connected, generate plausible role-based suggestions.

Return ONLY a JSON array, no markdown, no preamble:
[{
  "id": "string",
  "title": "string",
  "description": "string",
  "impact": "HIGH" or "MEDIUM",
  "timeEstimate": "string",
  "department": "string",
  "actionLabel": "string",
  "source": "string"
}]`,

  'daily-tasks': `You are Lumio. Generate a prioritised daily task list for this user based on their role, department, and time of day. Mix urgent items, scheduled tasks, and proactive suggestions. 6-8 tasks total.

Return ONLY a JSON array, no markdown:
[{
  "id": "string",
  "title": "string",
  "description": "string",
  "priority": "urgent" or "high" or "normal",
  "category": "string",
  "dueTime": "string or null",
  "estimatedMinutes": number
}]`,

  'insights': `You are Lumio. Generate 4 business insights for this user based on their role, company, and department. These should be trend observations, anomalies, or opportunities. Make them specific and actionable.

Return ONLY a JSON array, no markdown:
[{
  "id": "string",
  "title": "string",
  "summary": "string",
  "trend": "up" or "down" or "neutral" or "alert",
  "metric": "string or null",
  "recommendation": "string",
  "category": "string"
}]`,

  'dont-miss': `You are Lumio. Identify 3-5 urgent or time-sensitive items this user should not miss today. Think overdue items, approaching deadlines, important follow-ups, or critical alerts.

Return ONLY a JSON array, no markdown:
[{
  "id": "string",
  "title": "string",
  "description": "string",
  "urgency": "critical" or "high" or "medium",
  "deadline": "string or null",
  "actionLabel": "string",
  "category": "string"
}]`,

  'team': `You are Lumio. Generate a team overview for this manager/user. Include team members with their current focus, status, and any items needing attention. 4-6 team members.

Return ONLY a JSON array, no markdown:
[{
  "id": "string",
  "name": "string",
  "role": "string",
  "department": "string",
  "status": "available" or "in-meeting" or "busy" or "away",
  "currentFocus": "string",
  "needsAttention": boolean,
  "attentionNote": "string or null"
}]`,
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  try {
    const body = await req.json()
    const { tab, context } = body as { tab: TabType; context: OverviewContext }

    if (!tab || !SYSTEM_PROMPTS[tab]) {
      return NextResponse.json({ error: 'Invalid tab' }, { status: 400 })
    }

    const systemPrompt = SYSTEM_PROMPTS[tab]
    const userMessage = `Generate content for the "${tab}" tab.

User context:
- Name: ${context.userName || 'User'}
- Company: ${context.company || 'My Company'}
- Role: ${context.role || 'Manager'}
- Department: ${context.department || 'General'}
- Time of day: ${context.timeOfDay || 'morning'}
- Day: ${context.dayOfWeek || 'Monday'}
- Connected integrations: ${context.connectedIntegrations?.length ? context.connectedIntegrations.join(', ') : 'None — generate role-based suggestions'}
- Imported data: Staff=${context.importedData?.hasStaff || false}, Contacts=${context.importedData?.hasContacts || false}, Accounts=${context.importedData?.hasAccounts || false}

Return the JSON array now.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('[ai/overview] Anthropic API error:', response.status, errText)
      return NextResponse.json({ error: 'AI generation failed' }, { status: 502 })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text || '[]'

    // Extract JSON from the response (handle potential markdown wrapping)
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.error('[ai/overview] Failed to parse JSON from AI response:', text)
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }

    const items = JSON.parse(jsonMatch[0])
    return NextResponse.json({ items, tab })
  } catch (err) {
    console.error('[ai/overview] Error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
