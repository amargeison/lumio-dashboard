import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

export async function POST(req: NextRequest) {
  const { clubName, league } = await req.json();
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: `Return the current staff and board for ${clubName} (${league}) as of 2025-26 season.

Return ONLY a JSON object with no markdown:
{
  "coaching": [
    { "name": "Full name", "role": "Head Coach / Assistant Manager / Goalkeeping Coach / First Team Coach / Set Piece Coach / Analyst", "nationality": "Country", "since": "Year joined eg 2023", "photo": "" }
  ],
  "medical": [
    { "name": "Full name", "role": "Head Physio / Team Doctor / Sports Scientist / Strength & Conditioning Coach / Nutritionist", "nationality": "Country", "since": "" }
  ],
  "management": [
    { "name": "Full name", "role": "Director of Football / Sporting Director / Head of Recruitment / Chief Scout / Academy Director", "nationality": "Country", "since": "" }
  ],
  "board": [
    { "name": "Full name", "role": "Chairman / CEO / Chief Executive / Vice Chairman / Director / President / Owner", "nationality": "Country", "since": "", "background": "One sentence on their background eg Former banker, took over in 2019" }
  ],
  "commercial": [
    { "name": "Full name or Unknown", "role": "Commercial Director / Marketing Manager / Media Officer / Club Secretary", "nationality": "", "since": "" }
  ]
}

Use publicly available information only. If a name is not publicly known, use "Not publicly disclosed" for the name but still include the role. Include as many real names as you can find from Wikipedia, official club sites, and public records.`
    }]
  });
  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const clean = text.replace(/```json|```/g, '').trim();
  try {
    const data = JSON.parse(clean);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'parse failed' }, { status: 500 });
  }
}
