import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { type, query } = await req.json()
    if (!query?.trim()) return NextResponse.json({ error: 'No query' }, { status: 400 })

    const prompt = type === 'club'
      ? `You are a football club intelligence tool. Research the football club: "${query}".
Return ONLY a JSON object with these fields:
{"name":"","league":"","country":"","founded":"","stadium":"","capacity":"","manager":"","ownerType":"","revenue":"","wageBill":"","transferBudget":"","recentForm":"W-W-D-L-W format","leaguePos":"","avgAttendance":"","keyPlayers":["Player (pos)","Player (pos)","Player (pos)"],"academyRating":"","psr":"","strengthsWeaknesses":"","lumioFit":"","contactRoute":"","summary":""}`
      : `You are a football player intelligence tool for AFC Wimbledon (League One). Research the professional footballer: "${query}".
Return ONLY a JSON object with these fields:
{"name":"","age":"","nationality":"","position":"","currentClub":"","league":"","contractUntil":"","marketValue":"","agent":"","agencyName":"","goals":"","assists":"","apps":"","rating":"","strengths":["","",""],"weaknesses":["",""],"previousClubs":["","",""],"internationalCaps":"","transferStatus":"","askingPrice":"","fitForWimbledon":"","approachRoute":"","psrImpact":"","summary":""}`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content.find((b: { type: string }) => b.type === 'text') as { text: string } | undefined
    if (!text) return NextResponse.json({ error: 'No response' }, { status: 500 })

    const clean = text.text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return NextResponse.json({ result: parsed })
  } catch (e) {
    console.error('[football-search] Error:', e)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
