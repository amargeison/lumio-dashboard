import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  try {
    const { email, code, sport, clubName, userName, role } = await req.json()

    if (!email || !code || !sport) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Dev bypass
    if (process.env.NODE_ENV !== 'production' && code === '000000') {
      await supabase.from('demo_magic_links').update({ used: true })
        .eq('email', email.toLowerCase()).eq('slug', `sports-demo-${sport}`)
      return NextResponse.json({ success: true, verified: true })
    }

    // Verify OTP
    const { data: link, error } = await supabase
      .from('demo_magic_links')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('slug', `sports-demo-${sport}`)
      .eq('token', code.toString())
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (error || !link) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 })
    }

    // Mark used
    await supabase.from('demo_magic_links')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('id', link.id)

    // Log sports demo lead (upsert — table may not exist yet, fail silently)
    try {
      await supabase.from('sports_demo_leads').upsert({
        email: email.toLowerCase(),
        sport,
        club_name: clubName || null,
        user_name: userName || null,
        role: role || null,
        first_seen: new Date().toISOString(),
        last_seen: new Date().toISOString(),
      }, { onConflict: 'email,sport' })
    } catch {
      // Table may not exist yet — non-fatal
    }

    // Send welcome email
    const sportNames: Record<string, string> = {
      rugby: 'Rugby', football: 'Football', nonleague: 'Non League',
      grassroots: 'Grassroots', womens: "Women's FC",
      golf: 'Golf', tennis: 'Tennis', cricket: 'Cricket', darts: 'Darts',
    }

    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        await resend.emails.send({
          from: 'Lumio <hello@lumiocms.com>',
          to: email,
          subject: `Welcome to your Lumio ${sportNames[sport] ?? 'Sports'} demo`,
          html: `<!DOCTYPE html><html><body style="background:#07080F;font-family:DM Sans,Arial,sans-serif;margin:0;padding:40px 20px;">
            <div style="max-width:480px;margin:0 auto;background:#0d1117;border:1px solid #1f2937;border-radius:16px;padding:40px;">
              <p style="color:#9ca3af;font-size:15px;line-height:1.6;">
                Hi ${userName ?? 'there'},<br/><br/>
                Your <strong style="color:#fff">Lumio ${sportNames[sport] ?? 'Sports'}</strong> demo is ready.
                ${clubName ? `We've set it up as <strong style="color:#fff">${clubName}</strong>.` : ''}
                <br/><br/>
                Explore everything — GPS, AI briefings, analytics, and more.
                When you're ready to build your real portal, reply to this email.
                <br/><br/>
                — The Lumio team
              </p>
            </div>
          </body></html>`,
        })
      } catch (emailErr) {
        console.error('[sports-demo/verify-otp] Welcome email error:', emailErr)
      }
    }

    return NextResponse.json({ success: true, verified: true })
  } catch (err) {
    console.error('[sports-demo/verify-otp] Error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
