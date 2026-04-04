import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const SAMPLE_PUPILS = [
  { name: 'Olivia Henderson', attainment: 'High', effort: 'Outstanding' },
  { name: 'Jack Thompson', attainment: 'Expected', effort: 'Good' },
  { name: 'Amara Okafor', attainment: 'Expected+', effort: 'Very Good' },
  { name: 'Ethan Morris', attainment: 'Below Expected', effort: 'Improving' },
  { name: 'Sophie Williams', attainment: 'SEND Support', effort: 'Excellent (with support)' },
]

export async function POST(req: NextRequest) {
  const { reportType, yearGroup, subject, tone, wordLimit, themes } = await req.json()

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    // Template-based reports
    return NextResponse.json({
      reports: SAMPLE_PUPILS.map(p => ({
        pupil: p.name, attainment: p.attainment, effort: p.effort,
        comment: `${p.name} has made ${p.attainment === 'High' ? 'excellent' : p.attainment === 'Below Expected' ? 'steady' : 'good'} progress in ${subject || 'this subject'} this term. ${p.effort === 'Outstanding' ? 'Their enthusiasm and dedication are exemplary.' : p.effort === 'Improving' ? 'They are showing increased effort and engagement.' : 'They consistently work hard and participate well.'} Target for next term: ${p.attainment === 'High' ? 'continue to challenge themselves with extension work' : p.attainment === 'Below Expected' ? 'focus on core skills and seek support when needed' : 'build on current strengths and aim for greater depth'}.`,
      })),
    })
  }

  try {
    const client = new Anthropic({ apiKey })
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: `Write ${SAMPLE_PUPILS.length} UK school pupil reports for ${yearGroup} ${subject || 'all subjects'}. Report type: ${reportType}. Tone: ${tone}. Max ${wordLimit} words per pupil. Themes: ${(themes || []).join(', ')}. Pupils: ${SAMPLE_PUPILS.map(p => `${p.name} (${p.attainment}, effort: ${p.effort})`).join('; ')}. Return JSON array with keys: pupil, attainment, effort, comment.` }],
    })
    const text = message.content[0].type === 'text' ? message.content[0].text : ''
    try { return NextResponse.json({ reports: JSON.parse(text) }) } catch { return NextResponse.json({ reports: SAMPLE_PUPILS.map((p, i) => ({ pupil: p.name, attainment: p.attainment, effort: p.effort, comment: text.split('\n\n')[i] || `${p.name} has made good progress.` })) }) }
  } catch (err: any) {
    console.error('[report-writer] Anthropic error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
