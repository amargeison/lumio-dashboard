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
    const {
      schoolName,
      schoolType,
      ofstedRating,
      pupilCount,
      staffCount,
      town,
      postcode,
      yourName,
      yourRole,
      yourEmail,
      yourPhone,
      plan,
    } = await req.json()

    // 1. Validate required fields
    if (!schoolName || !yourName || !yourEmail || !yourRole) {
      return NextResponse.json(
        { error: 'Missing required fields: schoolName, yourName, yourEmail, yourRole' },
        { status: 400 },
      )
    }

    // 2. Generate slug from school name
    let baseSlug = schoolName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')

    // Ensure uniqueness
    let slug = baseSlug
    let counter = 2
    while (true) {
      const { data: existing } = await supabase
        .from('schools')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()
      if (!existing) break
      slug = `${baseSlug}-${counter}`
      counter++
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lumiocms.com'

    // 3. Extract email domain for SSO matching
    const emailDomain = yourEmail.split('@')[1]?.toLowerCase() || null

    // 4. Create school record
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .insert({
        name: schoolName.trim(),
        slug,
        type: schoolType,
        ofsted_rating: ofstedRating,
        pupil_count: parseInt(pupilCount) || null,
        staff_count: parseInt(staffCount) || null,
        town,
        postcode,
        headteacher: yourRole === 'headteacher' ? yourName : null,
        plan,
        email_domain: emailDomain,
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        active: true,
        onboarded: false,
      })
      .select()
      .single()

    if (schoolError || !school) {
      console.error('[schools/register] school insert error', schoolError)
      return NextResponse.json({ error: 'Failed to create school record' }, { status: 500 })
    }

    // 4. Create school_user record
    const { error: userError } = await supabase.from('school_users').insert({
      school_id: school.id,
      name: yourName,
      email: yourEmail.toLowerCase(),
      role: yourRole,
    })

    if (userError) {
      console.error('[schools/register] school_user insert error', userError)
      // Don't abort — school exists; log and continue
    }

    // 5. Send welcome email
    const checklistItems = [
      'Log your first absence',
      'Set up your staff list',
      'Configure your departments',
      'Invite your team',
    ]

    await resend.emails.send({
      from: 'Lumio for Schools <schools@lumiocms.com>',
      to: [yourEmail],
      subject: `Welcome to Lumio, ${schoolName}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family:-apple-system,Arial,sans-serif;background:#050508;color:#fff;margin:0;padding:0;">
          <div style="max-width:600px;margin:40px auto;background:#0D1117;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
            <!-- Header -->
            <div style="background:linear-gradient(135deg,#0D9488,#0F766E);padding:32px;">
              <div style="font-size:22px;font-weight:900;letter-spacing:0.05em;color:white;">Lumio for Schools</div>
              <div style="font-size:14px;color:rgba(255,255,255,0.8);margin-top:4px;">${schoolName}</div>
            </div>
            <!-- Body -->
            <div style="padding:40px 32px;">
              <h2 style="color:white;margin:0 0 8px;font-size:24px;">Welcome to Lumio, ${schoolName}! 🎉</h2>
              <p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;margin:0 0 32px;">
                Hi ${yourName}, your school portal is set up and ready to go. Here's how to get started:
              </p>
              <!-- Checklist -->
              <div style="background:rgba(13,148,136,0.06);border:1px solid rgba(13,148,136,0.2);border-radius:12px;padding:24px;margin-bottom:32px;">
                <p style="color:#0D9488;font-size:12px;font-weight:700;letter-spacing:0.1em;margin:0 0 16px;">GETTING STARTED</p>
                ${checklistItems.map(item => `
                  <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                    <div style="width:20px;height:20px;background:rgba(13,148,136,0.2);border-radius:50%;border:2px solid #0D9488;flex-shrink:0;"></div>
                    <span style="color:rgba(255,255,255,0.8);font-size:14px;">${item}</span>
                  </div>
                `).join('')}
              </div>
              <!-- CTA -->
              <a href="${appUrl}/schools/${slug}" style="display:block;text-align:center;background:linear-gradient(135deg,#0D9488,#0F766E);color:white;text-decoration:none;padding:16px 24px;border-radius:12px;font-weight:700;font-size:16px;margin-bottom:24px;">
                Go to your portal →
              </a>
              <!-- Trial reminder -->
              <div style="text-align:center;padding:16px;background:rgba(255,255,255,0.03);border-radius:8px;">
                <p style="color:rgba(255,255,255,0.4);font-size:12px;margin:0;">
                  14-day free trial · No credit card needed · Cancel anytime
                </p>
              </div>
            </div>
            <!-- Footer -->
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

    // 6. Generate OTP and store in school_magic_links
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    // Invalidate any previous codes for this email
    await supabase
      .from('school_magic_links')
      .update({ used: true })
      .eq('email', yourEmail.toLowerCase())
      .eq('used', false)

    const { error: linkError } = await supabase.from('school_magic_links').insert({
      email: yourEmail.toLowerCase(),
      school_id: school.id,
      token: code,
      expires_at: expiresAt,
      used: false,
    })

    if (linkError) {
      console.error('[schools/register] magic_link insert error', linkError)
      return NextResponse.json({ error: 'Failed to generate sign-in code' }, { status: 500 })
    }

    // Send OTP email
    await resend.emails.send({
      from: 'Lumio for Schools <schools@lumiocms.com>',
      to: [yourEmail],
      subject: `Your Lumio for Schools sign-in code: ${code}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family:-apple-system,Arial,sans-serif;background:#050508;color:#fff;margin:0;padding:0;">
          <div style="max-width:480px;margin:40px auto;background:#0D1117;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
            <div style="background:linear-gradient(135deg,#0D9488,#0F766E);padding:24px 32px;">
              <div style="font-size:18px;font-weight:900;letter-spacing:0.05em;color:white;">Lumio for Schools</div>
              <div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:2px;">${schoolName}</div>
            </div>
            <div style="padding:32px;">
              <h2 style="color:white;margin:0 0 8px;font-size:20px;">Sign in to your school workspace</h2>
              <p style="color:rgba(255,255,255,0.5);font-size:14px;line-height:1.6;margin:0 0 24px;">
                Hi ${yourName}, enter this 6-digit code to access ${schoolName}. It expires in 10 minutes.
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

    // 7. Return success
    return NextResponse.json({ success: true, school_slug: slug })
  } catch (err) {
    console.error('[schools/register]', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
