import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/emails/send'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase()
  try {
    const { email, slug, type = 'demo' } = await request.json()

    const token = crypto.randomUUID()
    const expires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    await supabase.from('demo_magic_links').insert({
      email,
      slug,
      token,
      expires_at: expires.toISOString(),
      used: false,
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.lumiocms.com'
    const magicLinkUrl = `${appUrl}/demo/auth?token=${token}&slug=${slug}`

    await sendEmail({
      from: 'Lumio <hello@lumiocms.com>',
      to: [email],
      subject: type === 'demo'
        ? `Your Lumio demo workspace is ready — click to enter`
        : `Sign in to Lumio`,
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
                ${type === 'demo' ? 'Your demo workspace is ready' : 'Sign in to Lumio'}
              </h2>
              <p style="color:rgba(255,255,255,0.5);font-size:14px;line-height:1.6;margin:0 0 24px;">
                ${type === 'demo'
                  ? 'Click the button below to enter your personalised Lumio demo workspace. This link expires in 10 minutes.'
                  : 'Click the button below to sign in to your Lumio dashboard. This link expires in 10 minutes.'}
              </p>
              <a href="${magicLinkUrl}"
                 style="display:block;text-align:center;background:#7C3AED;color:white;text-decoration:none;padding:14px 24px;border-radius:12px;font-weight:700;font-size:15px;margin-bottom:20px;">
                ${type === 'demo' ? '🚀 Enter My Demo Workspace' : '→ Sign in to Lumio'}
              </a>
              <p style="color:rgba(255,255,255,0.3);font-size:12px;text-align:center;margin:0;">
                This link expires in 10 minutes. If you didn't request this, you can safely ignore this email.
              </p>
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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Magic link error:', error)
    return NextResponse.json({ success: false, error: 'Failed to send magic link' }, { status: 500 })
  }
}
