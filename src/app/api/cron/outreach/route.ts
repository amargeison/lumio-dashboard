import { NextRequest, NextResponse } from 'next/server'
import { runBatch, getSettings, todaysLimit } from '@/lib/outreach/core'

export const runtime = 'nodejs'
export const maxDuration = 120

// The outreach drip. A system cron on the VPS hits this every ten minutes:
//
//   */10 * * * * curl -sS -X POST http://127.0.0.1:3000/api/cron/outreach \
//     -H "Authorization: Bearer $CRON_SECRET" > /dev/null
//
// A few per run, spread across the working day — never the whole day's
// allowance at once. There are 48 ten-minute runs between 9am and 5pm, so each
// run sends today's limit divided by 48 (rounded up, at most 8): one at a time
// for a limit of 30, five or six for 250, each a few seconds apart. Hundreds of
// emails leaving one mailbox in the same minute is what a spam run looks like.
// Sending hours, the daily limit, warm-up and the pause switch are all enforced
// inside runBatch, so the cron line can stay "every ten minutes, always".
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const perRun = Math.max(1, Math.min(8, Math.ceil(await todaysLimit(await getSettings()) / 48)))
  const result = await runBatch({ max: perRun, reqOrigin: new URL(req.url).origin, respectHours: true })
  return NextResponse.json(result)
}
