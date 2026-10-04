import { NextRequest, NextResponse } from 'next/server'
import { spendGate } from '@/lib/ai/guards'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: NextRequest) {
  // Spends on our key and can be reached by anyone: limit it and count it.
  const overLimit = spendGate(req, { label: 'cms:wiki-builder', maxTokens: 2000 })
  if (overLimit) return overLimit
  try {
    const { title, type, fileCount } = await req.json()

    const client = new Anthropic()
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Create a well-structured internal wiki titled "${title}" of type "${type}". The user has uploaded ${fileCount || 0} documents. Generate 5 wiki sections, each with a heading, a summary paragraph, and 3 bullet points. Return as JSON array: [{ heading: string, content: string, bullets: string[] }]. Return ONLY the JSON array, no other text.`
      }]
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      return NextResponse.json({ sections: JSON.parse(jsonMatch[0]) })
    }
    return NextResponse.json({ sections: [] })
  } catch (err) {
    console.error('[wiki-builder]', err)
    return NextResponse.json({ sections: [] }, { status: 500 })
  }
}
