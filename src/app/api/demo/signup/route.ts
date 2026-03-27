import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { otpEmail } from '@/lib/emails/otp'
import { logEmail } from '@/lib/emails/log'
import { sendEmail } from '@/lib/emails/send'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  try {
    const body = await req.json()
    const name             = body.name         || ''
    const email            = body.email        || ''
    const company_name     = (body.company || body.company_name || '').trim()
    const gdpr_consent     = body.gdpr         || body.gdpr_consent || false
    const marketing_consent = body.marketing_consent || false

    if (!name || !email || !company_name || !gdpr_consent) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check for existing demo tenant for this email
    const { data: existing } = await supabase
      .from('demo_tenants')
      .select('id, slug, status, company_name')
      .eq('owner_email', email.toLowerCase())
      .not('status', 'eq', 'deleted')
      .maybeSingle()

    if (existing) {
      return NextResponse.json({
        success: false,
        already_exists: true,
        slug: existing.slug,
        company_name: existing.company_name,
      }, { status: 200 })
    }

    // Generate clean URL slug — lowercase alphanumeric only, no random suffix
    const base = company_name.toLowerCase().replace(/[^a-z0-9]/g, '')
    let slug = base
    // Check for collisions and append a number if needed
    for (let attempt = 0; attempt < 20; attempt++) {
      const candidate = attempt === 0 ? base : `${base}${attempt + 1}`
      const { data: clash } = await supabase
        .from('demo_tenants')
        .select('id')
        .eq('slug', candidate)
        .maybeSingle()
      if (!clash) { slug = candidate; break }
    }

    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

    const { error: insertError } = await supabase.from('demo_tenants').insert({
      slug,
      company_name,
      owner_email: email.toLowerCase(),
      owner_name: name,
      gdpr_consent: true,
      marketing_consent: !!marketing_consent,
      gdpr_consent_at: new Date().toISOString(),
      expires_at: expiresAt,
      status: 'pending_onboarding',
    })

    if (insertError) {
      console.error('Tenant creation error:', insertError)
      return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 })
    }

    // Generate 6-digit OTP code (10-minute expiry)
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const tokenExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    // Invalidate any previous unused codes for this email
    const { error: invalidateError } = await supabase
      .from('demo_magic_links')
      .update({ used: true })
      .eq('email', email.toLowerCase())
      .eq('used', false)
    if (invalidateError) console.warn('[demo/signup] invalidate error (non-fatal):', invalidateError)

    const { error: otpInsertError } = await supabase.from('demo_magic_links').insert({
      email: email.toLowerCase(),
      slug,
      token: code,
      expires_at: tokenExpiry,
      used: false,
    })
    if (otpInsertError) {
      console.error('[demo/signup] FAILED to insert OTP code:', otpInsertError)
      return NextResponse.json({ error: 'Failed to store verification code — please try again.' }, { status: 500 })
    }
    const { error: emailError } = await sendEmail({
      from: 'Lumio <hello@lumiocms.com>',
      to: [email],
      subject: `Your Lumio sign-in code: ${code}`,
      html: otpEmail({ name, code }),
    })

    if (emailError) {
      console.error('[demo/signup] Resend error:', emailError)
      return NextResponse.json({ error: 'Failed to send verification code — please try again.' }, { status: 500 })
    }

    logEmail(slug, 'otp', email).catch(() => {})
    return NextResponse.json({ success: true, slug, is_new: true })
  } catch (err) {
    console.error('Demo signup error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
