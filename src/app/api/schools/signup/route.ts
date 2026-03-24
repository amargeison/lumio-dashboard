import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

    // Look up school_user by email
    const { data: schoolUser } = await supabase
      .from('school_users')
      .select('id, name, school_id, role, schools(id, name, slug, headteacher)')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (!schoolUser) {
      return NextResponse.json({ error: 'school_not_found' }, { status: 404 })
    }

    const school = Array.isArray(schoolUser.schools) ? schoolUser.schools[0] : schoolUser.schools as { id: string; name: string; slug: string; headteacher: string } | null
    if (!school) return NextResponse.json({ error: 'school_not_found' }, { status: 404 })

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    // Invalidate previous codes
    await supabase
      .from('school_magic_links')
      .update({ used: true })
      .eq('email', email.toLowerCase())
      .eq('used', false)

    await supabase.from('school_magic_links').insert({
      email: email.toLowerCase(),
      school_id: school.id,
      token: code,
      expires_at: expiresAt,
      used: false,
    })

    await resend.emails.send({
      from: 'Lumio for Schools <schools@lumiocms.com>',
      to: [email],
      subject: `Your Lumio for Schools sign-in code: ${code}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family:-apple-system,Arial,sans-serif;background:#050508;color:#fff;margin:0;padding:0;">
          <div style="max-width:480px;margin:40px auto;background:#0D1117;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
            <div style="background:linear-gradient(135deg,#0D9488,#0F766E);padding:24px 32px;">
              <div style="font-size:18px;font-weight:900;letter-spacing:0.05em;color:white;">Lumio for Schools</div>
              <div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:2px;">${school.name}</div>
            </div>
            <div style="padding:32px;">
              <h2 style="color:white;margin:0 0 8px;font-size:20px;">Sign in to your school workspace</h2>
              <p style="color:rgba(255,255,255,0.5);font-size:14px;line-height:1.6;margin:0 0 24px;">
                Hi ${schoolUser.name || 'there'}, enter this 6-digit code to access ${school.name}. It expires in 10 minutes.
              </p>
              <div style="background:rgba(13,148,136,0.12);border:2px solid #0D9488;border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
                <p style="color:rgba(255,255,255,0.4);font-size:11px;font-weight:700;letter-spacing:0.15em;margin:0 0 8px;">YOUR CODE</p>
                <p style="color:white;font-size:40px;font-weight:900;letter-spacing:0.3em;margin:0;font-variant-numeric:tabular-nums;">${code}</p>
              </div>
              <p style="color:rgba(255,255,255,0.3);font-size:12px;text-align:center;margin:0;">
                Expires in 10 minutes. If you didn't request this, you can safely ignore this email.
              </p>
            </div>
            <div style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="color:rgba(255,255,255,0.2);font-size:11px;margin:0;text-align:center;">
                Lumio Ltd · lumiocms.com · GDPR compliant · UK data centres
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    return NextResponse.json({ success: true, school_name: school.name })
  } catch (err) {
    console.error('[schools/signup]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
