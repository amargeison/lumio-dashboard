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
      : type === 'squad'
      ? `You are a football database. Return the current first-team squad for ${query}, 2025-26 season.
Return ONLY a valid JSON object:
{"club":"${query.split('|')[0]}","league":"${query.split('|')[1] || ''}","manager":"","stadium":"","leaguePos":"","avgRating":"","topScorer":"","recentForm":"W-L-D-W-W","season":"2025-26","players":[{"name":"","number":"","pos":"GK/CB/LB/RB/CDM/CM/CAM/LW/RW/ST","age":"","nationality":"","goals":"","assists":"","apps":"","rating":"","contract":"","value":"","status":"fit or injured or suspended"}]}
Include all first-team players (18-25). Use real publicly available data.`
      : `You are a football player intelligence tool for AFC Wimbledon (League One). Research the professional footballer: "${query}".
Return ONLY a JSON object with these fields:
{"name":"","age":"","nationality":"","position":"","currentClub":"","league":"","contractUntil":"","marketValue":"","agent":"","agencyName":"","goals":"","assists":"","apps":"","rating":"","strengths":["","",""],"weaknesses":["",""],"previousClubs":["","",""],"internationalCaps":"","transferStatus":"","askingPrice":"","fitForWimbledon":"","approachRoute":"","psrImpact":"","summary":""}`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: type === 'squad' ? 2000 : 1000,
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
