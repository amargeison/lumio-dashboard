import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { to } = await req.json().catch(() => ({ to: '' }))
  if (!to) return NextResponse.json({ error: 'Phone number required' }, { status: 400 })

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !authToken || !from || accountSid === 'your_account_sid_here') {
    return NextResponse.json({ error: 'Twilio not configured', fallback: true, tel: to }, { status: 503 })
  }

  try {
    const twilio = (await import('twilio')).default
    const client = twilio(accountSid, authToken)
    const call = await client.calls.create({
      to,
      from,
      twiml: '<Response><Say voice="alice">Connecting your call via Lumio. Please hold.</Say><Dial>' + to + '</Dial></Response>',
    })
    return NextResponse.json({ success: true, callSid: call.sid })
  } catch (err: any) {
    console.error('[phone/call] Twilio error:', err.message)
    return NextResponse.json({ error: err.message, fallback: true, tel: to }, { status: 500 })
  }
}
