import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/emails/send'
import { activationEmail } from '@/lib/emails/activation'
import { logEmail } from '@/lib/emails/log'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

/**
 * POST /api/resend-activation
 * Generates a new activation token and resends the activation email.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body?.email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const supabase = getSupabase()

  // Find business by owner email
  const { data: business, error } = await supabase
    .from('businesses')
    .select('id, slug, owner_name, activated_at')
    .eq('owner_email', body.email)
    .maybeSingle()

  if (error || !business) {
    // Don't reveal whether the email exists
    return NextResponse.json({ success: true })
  }

  // Already activated — no need to resend
  if (business.activated_at) {
    return NextResponse.json({ success: true })
  }

  // Generate new token and expiry
  const newToken = crypto.randomUUID()
  const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  await supabase
    .from('businesses')
    .update({
      activation_token: newToken,
      activation_expires_at: newExpiry,
    })
    .eq('id', business.id)

  // Send new activation email
  const firstName = business.owner_name?.split(' ')[0] || 'there'
  sendEmail({
    from: 'Lumio <hello@lumiocms.com>',
    to: [body.email],
    subject: 'Welcome to Lumio — activate your account',
    html: activationEmail({ name: firstName, slug: business.slug, token: newToken }),
  }).catch(console.error)

  logEmail(business.id, 'activation_resend', body.email).catch(() => {})

  return NextResponse.json({ success: true })
}
