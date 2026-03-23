import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { name, email, company_name, gdpr_consent, marketing_consent } = await req.json()

    if (!name || !email || !company_name || !gdpr_consent) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check for existing demo tenant for this email
    const { data: existing } = await supabase
      .from('demo_tenants')
      .select('id, slug, status')
      .eq('owner_email', email.toLowerCase())
      .not('status', 'eq', 'deleted')
      .maybeSingle()

    let slug: string
    let isNew = true

    if (existing) {
      slug = existing.slug
      isNew = false
    } else {
      // Generate URL-safe slug
      const base = company_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      const suffix = Math.random().toString(36).slice(2, 6)
      slug = `${base}-${suffix}`

      const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

      const { error } = await supabase.from('demo_tenants').insert({
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

      if (error) {
        console.error('Tenant creation error:', error)
        return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 })
      }
    }

    // Create magic link token
    const token = crypto.randomUUID()
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour

    await supabase.from('demo_magic_links').insert({
      email: email.toLowerCase(),
      slug,
      token,
      expires_at: tokenExpiry,
      used: false,
    })

    const magicLinkUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.lumiocms.com'}/demo/auth?token=${token}`

    await resend.emails.send({
      from: 'Lumio <hello@lumiocms.com>',
      to: [email],
      subject: isNew
        ? `Your Lumio demo workspace is ready — click to enter`
        : `Sign back in to your Lumio demo`,
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
                ${isNew ? 'Your demo workspace is ready' : 'Sign back in to Lumio'}
              </h2>
              <p style="color:rgba(255,255,255,0.5);font-size:14px;line-height:1.6;margin:0 0 24px;">
                Hi ${name}, click the button below to ${isNew ? 'set up and enter' : 'enter'} your personalised Lumio demo workspace.
                This link expires in 1 hour.
              </p>
              <a href="${magicLinkUrl}"
                 style="display:block;text-align:center;background:#7C3AED;color:white;text-decoration:none;padding:14px 24px;border-radius:12px;font-weight:700;font-size:15px;margin-bottom:20px;">
                🚀 Enter My Demo Workspace
              </a>
              <p style="color:rgba(255,255,255,0.3);font-size:12px;text-align:center;margin:0;">
                This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
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

    return NextResponse.json({ success: true, slug, is_new: isNew })
  } catch (err) {
    console.error('Demo signup error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
