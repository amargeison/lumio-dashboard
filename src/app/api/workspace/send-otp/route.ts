import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/emails/send'
import { otpEmail } from '@/lib/emails/otp'
import { logEmail } from '@/lib/emails/log'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

/**
 * POST /api/workspace/send-otp
 * Generates a 6-digit OTP, stores it in workspace_otps, and emails it.
 * Body: { email: string }
 */
export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  const body = await req.json().catch(() => null)
  if (!body?.email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  const email = body.email.toLowerCase().trim()

  // Verify this email owns a workspace
  const { data: business } = await supabase
    .from('businesses')
    .select('slug, owner_name')
    .eq('owner_email', email)
    .eq('status', 'active')
    .maybeSingle()

  if (!business) {
    return NextResponse.json({ error: 'No workspace found for this email' }, { status: 404 })
  }

  // Generate 6-digit OTP
  const otp = String(Math.floor(100000 + Math.random() * 900000))

  // Invalidate any previous unused OTPs for this email
  await supabase
    .from('workspace_otps')
    .update({ used: true })
    .eq('email', email)
    .eq('used', false)

  // Store OTP (10-minute expiry)
  const { error: insertError } = await supabase.from('workspace_otps').insert({
    email,
    otp,
    slug: business.slug,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  })

  if (insertError) {
    console.error('[workspace/send-otp] Failed to store OTP:', insertError)
    return NextResponse.json({ error: 'Failed to generate code' }, { status: 500 })
  }

  // Send OTP email
  const firstName = business.owner_name?.split(' ')[0] || 'there'
  const { error: emailError } = await sendEmail({
    from: 'Lumio <hello@lumiocms.com>',
    to: [email],
    subject: `Your Lumio sign-in code: ${otp}`,
    html: otpEmail({ name: firstName, code: otp }),
  })

  if (emailError) {
    console.error('[workspace/send-otp] Email failed:', emailError)
  }

  logEmail(business.slug, 'workspace_otp', email).catch(() => {})

  return NextResponse.json({ success: true })
}
