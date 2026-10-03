import { NextRequest, NextResponse } from 'next/server'
import { runBatch, getSettings, todaysLimit, syncInbox } from '@/lib/outreach/core'

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
  // Read the answers three times a day — 7am, 4pm and 11pm UK — rather than on
  // every run. This route is hit every ten minutes, so "the first run of that
  // hour" is the one whose minute is under ten. The 7am read comes before the
  // day's sending starts at nine, so anyone who bounced or asked to stop
  // overnight is off the list first. Never allowed to stop the sending.
  // ("Check now" on the Outreach page reads the mailbox on demand.)
  const uk = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date())
  const hour = Number(uk.find(p => p.type === 'hour')?.value) % 24, minute = Number(uk.find(p => p.type === 'minute')?.value)
  const inbox = [7, 16, 23].includes(hour) && minute < 10
    ? await syncInbox().catch(e => ({ ok: false, error: e instanceof Error ? e.message : 'inbox check failed' }))
    : null
  const perRun = Math.max(1, Math.min(8, Math.ceil(await todaysLimit(await getSettings()) / 48)))
  const result = await runBatch({ max: perRun, reqOrigin: new URL(req.url).origin, respectHours: true })
  return NextResponse.json({ ...result, inbox })
}
