import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: NextRequest) {
  const { subject, yearGroup, topic, duration, objective, priorKnowledge, sendConsiderations, resources } = await req.json()

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    // Return template-based plan if no API key
    return NextResponse.json({
      starter: `Starter (5 mins): Quick-fire recall quiz on previous ${subject} learning. Pupils discuss with talk partners what they already know about ${topic}.`,
      main: `Main Activity (${duration}):\n• Introduction (10 mins): Teacher models key concept — ${objective}\n• Independent Practice (15 mins): Pupils work through guided examples\n• Group Task (10 mins): Collaborative problem-solving activity\n• Mini-Plenary: Quick check — thumbs up/down understanding`,
      plenary: `Plenary (5 mins): Exit ticket — 3 key things learned today. Share one thing that surprised you about ${topic}.`,
      differentiation: `Support: Pre-prepared scaffolds, visual aids, adult support for key vocabulary\nCore: Independent application of ${topic} concepts\nExtension: Challenge cards requiring deeper reasoning and application to unfamiliar contexts`,
      assessment: `• Formative: Questioning during main activity, mini-plenary responses\n• Exit ticket analysis to inform next lesson\n• Peer assessment during group task`,
      resources: `${(resources || []).join(', ') || 'Whiteboard, worksheets'}, lesson slides, timer display`,
    })
  }

  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: `Generate a detailed lesson plan for a UK ${yearGroup} ${subject} lesson on "${topic}". Duration: ${duration}. Learning objective: ${objective}. ${priorKnowledge ? `Prior knowledge: ${priorKnowledge}` : ''} ${sendConsiderations ? `SEND considerations: ${sendConsiderations}` : ''} Available resources: ${(resources || []).join(', ')}. Format as JSON with keys: starter, main, plenary, differentiation, assessment, resources. Each should be a detailed paragraph.` }],
    })
    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    try { return NextResponse.json(JSON.parse(text)) } catch { return NextResponse.json({ starter: text.slice(0, 300), main: text.slice(300, 800), plenary: text.slice(800, 1100), differentiation: 'Support/Core/Extension differentiation included.', assessment: 'Formative assessment throughout.', resources: (resources || []).join(', ') }) }
  } catch (err: any) {
    console.error('[lesson-plan] Anthropic error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
