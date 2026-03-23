import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)
const resend = new Resend(process.env.RESEND_API_KEY)

interface Invitee {
  name: string
  email: string
  jobTitle: string
  departments: string[]
}

export async function POST(req: NextRequest) {
  try {
    const { slug, invitees, inviterName, companyName } = await req.json() as {
      slug: string
      invitees: Invitee[]
      inviterName: string
      companyName: string
    }

    if (!slug || !invitees?.length) {
      return NextResponse.json({ error: 'Missing slug or invitees' }, { status: 400 })
    }

    // Verify the workspace exists
    const { data: tenant } = await supabase
      .from('demo_tenants')
      .select('id, company_name, status')
      .eq('slug', slug)
      .maybeSingle()

    if (!tenant || tenant.status === 'deleted') {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.lumiocms.com'
    const results: { email: string; ok: boolean }[] = []

    for (const invitee of invitees) {
      if (!invitee.email || !invitee.name) continue

      const email = invitee.email.toLowerCase()

      // Invalidate any previous unused codes for this email
      await supabase
        .from('demo_magic_links')
        .update({ used: true })
        .eq('email', email)
        .eq('used', false)

      // 6-digit OTP with 24-hour expiry (generous for invitees who may not check immediately)
      const code = Math.floor(100000 + Math.random() * 900000).toString()
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

      await supabase.from('demo_magic_links').insert({
        email,
        slug,
        token: code,
        expires_at: expires,
        used: false,
      })

      const deptList = invitee.departments.length
        ? invitee.departments.join(', ')
        : 'All departments'

      const { error: emailError } = await resend.emails.send({
        from: 'Lumio <hello@lumiocms.com>',
        to: [invitee.email],
        subject: `${inviterName} invited you to explore ${companyName}'s Lumio workspace`,
        html: `
          <!DOCTYPE html>
          <html>
          <body style="font-family:-apple-system,Arial,sans-serif;background:#050508;color:#fff;margin:0;padding:0;">
            <div style="max-width:480px;margin:40px auto;background:#1a1a2e;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);">
              <div style="background:#7C3AED;padding:24px 32px;">
                <div style="font-size:20px;font-weight:900;letter-spacing:0.1em;color:white;">LUMIO</div>
              </div>
              <div style="padding:32px;">
                <h2 style="color:white;margin:0 0 8px;font-size:22px;">You've been invited</h2>
                <p style="color:rgba(255,255,255,0.5);font-size:14px;line-height:1.6;margin:0 0 24px;">
                  Hi ${invitee.name}, <strong style="color:rgba(255,255,255,0.8);">${inviterName}</strong> has invited you to explore
                  <strong style="color:rgba(255,255,255,0.8);">${companyName}</strong>'s demo workspace on Lumio.
                </p>
                ${invitee.departments.length ? `
                <div style="background:rgba(13,148,136,0.1);border:1px solid rgba(13,148,136,0.3);border-radius:10px;padding:14px 18px;margin-bottom:20px;">
                  <p style="color:rgba(255,255,255,0.4);font-size:11px;font-weight:700;letter-spacing:0.1em;margin:0 0 6px;">YOUR FOCUS AREAS</p>
                  <p style="color:#0D9488;font-size:13px;margin:0;">${deptList}</p>
                </div>` : ''}
                <div style="background:rgba(124,58,237,0.15);border:2px solid #7C3AED;border-radius:16px;padding:24px;text-align:center;margin-bottom:20px;">
                  <p style="color:rgba(255,255,255,0.4);font-size:11px;font-weight:700;letter-spacing:0.15em;margin:0 0 8px;">YOUR ACCESS CODE</p>
                  <p style="color:white;font-size:40px;font-weight:900;letter-spacing:0.3em;margin:0;font-variant-numeric:tabular-nums;">${code}</p>
                </div>
                <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:16px;margin-bottom:20px;">
                  <p style="color:rgba(255,255,255,0.4);font-size:12px;font-weight:600;margin:0 0 6px;">HOW TO ACCESS YOUR WORKSPACE</p>
                  <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:0;line-height:1.6;">
                    Visit <a href="${appUrl}/demo" style="color:#A78BFA;text-decoration:none;font-weight:600;">${appUrl}/demo</a>
                    and enter the 6-digit code above when prompted.
                  </p>
                </div>
                <p style="color:rgba(255,255,255,0.3);font-size:12px;text-align:center;margin:0;">
                  This code expires in 24 hours. If you didn't expect this, you can safely ignore it.
                </p>
              </div>
              <div style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.07);">
                <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:0;text-align:center;">
                  Lumio Ltd · lumiocms.com · All demo data is fictional and auto-deleted.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      })

      results.push({ email: invitee.email, ok: !emailError })
      if (emailError) console.error('[demo/invite] email error for', invitee.email, emailError)
    }

    return NextResponse.json({ success: true, results })
  } catch (err) {
    console.error('[demo/invite] error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
