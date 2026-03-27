import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    const body = await req.json()
    const name             = body.name         || ''
    const email            = body.email        || ''
    const company_name     = body.company      || body.company_name || ''
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
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Lumio <hello@lumiocms.com>',
      to: [email],
      subject: `Your Lumio demo code: ${code}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family:-apple-system,Arial,sans-serif;background:#050508;color:#fff;margin:0;padding:0;">
          <div style="max-width:480px;margin:40px auto;background:#1a1a2e;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);">
            <div style="background:#7C3AED;padding:24px 32px;">
              <div style="font-size:20px;font-weight:900;letter-spacing:0.1em;color:white;">LUMIO</div>
            </div>
            <div style="padding:32px;">
              <h2 style="color:white;margin:0 0 8px;font-size:22px;">
                Your demo workspace is ready
              </h2>
              <p style="color:rgba(255,255,255,0.5);font-size:14px;line-height:1.6;margin:0 0 24px;">
                Hi ${name}, enter this 6-digit code to set up and enter your Lumio demo workspace. It expires in 10 minutes.
              </p>
              <div style="background:rgba(124,58,237,0.15);border:2px solid #7C3AED;border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
                <p style="color:rgba(255,255,255,0.4);font-size:11px;font-weight:700;letter-spacing:0.15em;margin:0 0 8px;">YOUR CODE</p>
                <p style="color:white;font-size:40px;font-weight:900;letter-spacing:0.3em;margin:0;font-variant-numeric:tabular-nums;">${code}</p>
              </div>
              <p style="color:rgba(255,255,255,0.3);font-size:12px;text-align:center;margin:0;">
                Expires in 10 minutes. If you didn't request this, you can safely ignore this email.
              </p>
              <div style="margin-top:24px;padding:16px;background:rgba(255,255,255,0.05);border-radius:12px;">
                <p style="color:rgba(255,255,255,0.4);font-size:12px;margin:0 0 8px;font-weight:600;">YOUR DEMO WORKSPACE</p>
                <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:0;">
                  Company: ${company_name}<br>
                  Expires: 14 days from activation<br>
                  All data is fictional and auto-deleted at expiry.
                </p>
              </div>
            </div>
            <div style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.07);">
              <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:0;text-align:center;">
                Lumio Ltd · lumiocms.com · privacy@lumiocms.com<br>
                UK GDPR compliant · Data stored in London (AWS eu-west-2)
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    if (emailError) {
      console.error('[demo/signup] Resend error:', emailError)
      return NextResponse.json({ error: 'Failed to send verification code — please try again.' }, { status: 500 })
    }
    return NextResponse.json({ success: true, slug, is_new: true })
  } catch (err) {
    console.error('Demo signup error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
