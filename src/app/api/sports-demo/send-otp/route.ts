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
    const { email, sport, clubName } = await req.json()

    if (!email || !sport) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Generate 6-digit OTP (dev always returns 000000 for bypass)
    const code = process.env.NODE_ENV !== 'production'
      ? '000000'
      : Math.floor(100000 + Math.random() * 900000).toString()

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    // Invalidate previous unused codes
    await supabase
      .from('demo_magic_links')
      .update({ used: true })
      .eq('email', email.toLowerCase())
      .eq('slug', `sports-demo-${sport}`)
      .eq('used', false)

    // Insert new code
    const { error: insertErr } = await supabase.from('demo_magic_links').insert({
      email: email.toLowerCase(),
      slug: `sports-demo-${sport}`,
      token: code,
      expires_at: expiresAt,
      used: false,
    })

    if (insertErr) {
      console.error('[sports-demo/send-otp] Insert error:', insertErr)
      return NextResponse.json({ error: 'Failed to store code' }, { status: 500 })
    }

    // Sport-specific branding
    const sportConfig: Record<string, { emoji: string; name: string; color: string }> = {
      rugby:      { emoji: '🏉', name: 'Lumio Rugby',       color: '#7C3AED' },
      football:   { emoji: '⚽', name: 'Lumio Football',    color: '#1d4ed8' },
      nonleague:  { emoji: '⚽', name: 'Lumio Non League',  color: '#D97706' },
      grassroots: { emoji: '⚽', name: 'Lumio Grassroots',  color: '#16a34a' },
      womens:     { emoji: '⚽', name: "Lumio Women's FC",  color: '#DB2777' },
      golf:       { emoji: '⛳', name: 'Lumio Golf',        color: '#15803D' },
      tennis:     { emoji: '🎾', name: 'Lumio Tennis',      color: '#0ea5e9' },
      cricket:    { emoji: '🏏', name: 'Lumio Cricket',     color: '#b45309' },
      darts:      { emoji: '🎯', name: 'Lumio Darts',       color: '#dc2626' },
    }
    const cfg = sportConfig[sport] ?? { emoji: '🏟️', name: 'Lumio Sports', color: '#7C3AED' }

    // Send OTP email via Resend
    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'Lumio <hello@lumiocms.com>',
        to: email,
        subject: `Your ${cfg.name} demo code — ${code}`,
        html: `<!DOCTYPE html><html><body style="background:#07080F;font-family:DM Sans,Arial,sans-serif;margin:0;padding:40px 20px;">
          <div style="max-width:480px;margin:0 auto;background:#0d1117;border:1px solid #1f2937;border-radius:16px;padding:40px;">
            <div style="text-align:center;margin-bottom:32px;">
              <div style="font-size:48px;margin-bottom:12px;">${cfg.emoji}</div>
              <div style="font-size:20px;font-weight:700;color:#ffffff;">${cfg.name}</div>
              <div style="font-size:13px;color:#6b7280;margin-top:4px;">Demo access</div>
            </div>
            <p style="color:#9ca3af;font-size:14px;margin-bottom:24px;text-align:center;">
              Your verification code for ${clubName ? `<strong style="color:#fff">${clubName}</strong>` : 'the demo'} is:
            </p>
            <div style="background:#0a0b12;border:2px solid ${cfg.color}40;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
              <div style="font-size:40px;font-weight:800;letter-spacing:12px;color:${cfg.color};">${code}</div>
            </div>
            <p style="color:#6b7280;font-size:12px;text-align:center;margin:0;">Valid for 10 minutes. Don't share this code.</p>
          </div>
        </body></html>`,
      })
    } else {
      console.log(`[EMAIL SUPPRESSED — dev] To: ${email} | Code: ${code} | Sport: ${sport}`)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[sports-demo/send-otp] Error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
