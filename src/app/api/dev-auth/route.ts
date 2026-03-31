import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { pin } = await req.json().catch(() => ({ pin: '' }))
  const devPin = process.env.DEV_ACCESS_PIN

  if (!devPin || pin !== devPin) {
    return NextResponse.json({ error: 'Incorrect PIN' }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set('lumio_dev_access', devPin, {
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    httpOnly: false,
    sameSite: 'lax',
  })
  return response
}
