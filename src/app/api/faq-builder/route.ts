import { NextRequest, NextResponse } from 'next/server'
import { spendGate } from '@/lib/ai/guards'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: NextRequest) {
  // Spends on our key and can be reached by anyone: limit it and count it.
  const overLimit = spendGate(req, { label: 'cms:faq-builder', maxTokens: 2000 })
  if (overLimit) return overLimit
  try {
    const { title, tone, maxQuestions } = await req.json()

    const client = new Anthropic()
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Create a customer FAQ titled "${title}" with a ${tone || 'friendly'} tone. Generate ${maxQuestions || 10} frequently asked questions with clear answers. Return as JSON array: [{ question: string, answer: string, category: string, tags: string[] }]. Categories should be: Account, Billing, Support, Technical. Return ONLY the JSON array, no other text.`
      }]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      return NextResponse.json({ questions: JSON.parse(jsonMatch[0]) })
    }
    return NextResponse.json({ questions: [] })
  } catch (err) {
    console.error('[faq-builder]', err)
    return NextResponse.json({ questions: [] }, { status: 500 })
  }
}
