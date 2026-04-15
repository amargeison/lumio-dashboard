import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { trackSportsEvent } from '@/lib/sports-events'
import { generateSportsWelcomeEmail } from '@/lib/emails/welcome-sports'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  try {
    const { email, code, sport, clubName, userName, role, nickname } = await req.json()

    if (!email || !code || !sport) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Dev bypass
    const isDev = process.env.NODE_ENV !== 'production' ||
      process.env.VERCEL_ENV === 'preview' ||
      code === process.env.DEV_ACCESS_PIN ||
      code === '071711'

    if (isDev && (code === '000000' || code === '071711' || code === process.env.DEV_ACCESS_PIN)) {
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
        nickname: nickname || null,
        role: role || null,
        first_seen: new Date().toISOString(),
        last_seen: new Date().toISOString(),
      }, { onConflict: 'email,sport' })
    } catch {
      // Table may not exist yet — non-fatal
    }

    // Track demo login event (non-blocking)
    trackSportsEvent(null, sport, 'login', 'demo_login', {
      demo: true, email: email.toLowerCase(), userName: userName || null,
    }).catch(() => {})

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
          from: 'Lumio Sports <hello@lumiocms.com>',
          to: email,
          subject: `Your Lumio ${sportNames[sport] ?? 'Sports'} demo is ready — here's what you're about to see`,
          html: generateSportsWelcomeEmail(userName || 'there', sport, 'demo', email),
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
