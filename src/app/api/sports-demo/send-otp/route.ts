import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/emails/send'
import { otpEmail } from '@/lib/emails/otp'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  try {
    const { email, sport } = await req.json()
    if (!email || !sport) {
      return NextResponse.json({ success: false, error: 'Missing email or sport' })
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    // Invalidate previous unused codes
    await supabase
      .from('demo_magic_links')
      .update({ used: true })
      .eq('email', email.toLowerCase())
      .eq('slug', `sports-demo-${sport}`)
      .eq('used', false)

    // Insert new code
    const { error: insertErr } = await supabase.from('demo_magic_links').insert({
      email: email.toLowerCase(),
      slug: `sports-demo-${sport}`,
      token: code,
      expires_at: expiresAt,
      used: false,
    })

    if (insertErr) {
      console.error('[sports-demo/send-otp] Insert error:', insertErr)
      return NextResponse.json({ success: false, error: 'Failed to store code' })
    }

    const { error: emailErr } = await sendEmail({
      from: 'Lumio <hello@lumiocms.com>',
      to: [email],
      subject: `Your Lumio demo code: ${code}`,
      html: otpEmail({ name: email.split('@')[0], code }),
    })

    if (emailErr) {
      console.error('[sports-demo/send-otp] Email error:', emailErr)
      return NextResponse.json({ success: false, error: 'Failed to send code' })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[sports-demo/send-otp] Error:', err)
    return NextResponse.json({ success: false, error: 'Server error' })
  }
}
