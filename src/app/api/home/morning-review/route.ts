import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    items: [
      { source: 'email',    count: 12, urgent: true,  preview: ['Invoice overdue from Bramble Hill', 'New trial signup — Just wow Inc', 'Stripe payment confirmed — Oakridge'] },
      { source: 'slack',    count: 7,  urgent: false, preview: ['Charlotte: lead scored 87 in SA-02', 'HR-01 completed for new joiner', '3 workflow alerts cleared'] },
      { source: 'linkedin', count: 4,  urgent: false, preview: ['2 connection requests', 'Post got 47 reactions', 'Message from potential customer'] },
      { source: 'news',     count: 3,  urgent: false, preview: ['Zendesk confirms Aug 2027 Sell retirement', 'UK SMB automation market up 34% YoY', 'HMRC announces MTD changes for 2026'] },
      { source: 'notion',   count: 2,  urgent: false, preview: ['Testing guide updated — 2 items resolved', 'New note: competitor pricing change detected'] },
    ],
  })
}
