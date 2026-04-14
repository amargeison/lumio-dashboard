import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { emailLayout, ctaButton } from '@/lib/emails/layout'

const ADMIN_TOKEN = process.env.SPORTS_ADMIN_TOKEN || 'lumio-sports-admin-2026'

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-admin-token')
  if (token !== ADMIN_TOKEN) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, email, display_name, sport, portal_slug } = await req.json()
  if (!id || !email || !sport || !portal_slug) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // Mark setup complete
  await supabase.from('sports_profiles').update({ setup_complete: true, updated_at: new Date().toISOString() }).eq('id', id)

  // Send email
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const portalUrl = `https://www.lumiosports.com/${sport}/${portal_slug}`
      const firstName = (display_name || 'there').split(' ')[0]
      const sportLabel = sport.charAt(0).toUpperCase() + sport.slice(1)

      await resend.emails.send({
        from: 'Lumio Sports <hello@lumiocms.com>',
        to: email,
        subject: `Your Lumio ${sportLabel} portal is ready 🎯`,
        html: emailLayout({
          preheader: `Your ${sportLabel} portal is configured and ready to use.`,
          body: `
<h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#ffffff;">Your portal is ready, ${firstName}.</h1>
<p style="margin:0 0 24px;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;">
  Your Lumio ${sportLabel} portal has been configured and is ready to use. Everything is set up — sign in any time.
</p>

${ctaButton('Open my portal &rarr;', portalUrl)}

<p style="margin:24px 0 0;font-size:13px;color:rgba(255,255,255,0.5);line-height:1.6;">
  <strong style="color:#9CA3AF;">Bookmark this link</strong> &mdash; it&rsquo;s your permanent portal address:<br/>
  <a href="${portalUrl}" style="color:#22c55e;text-decoration:none;font-family:monospace;font-size:12px;">${portalUrl}</a>
</p>

<p style="margin:20px 0 0;font-size:13px;color:rgba(255,255,255,0.4);line-height:1.6;">
  Reply to this email if you need anything. We&rsquo;re here.
</p>`,
        }),
      })
    } catch (e) {
      console.error('[send-portal-ready] Email error:', e)
    }
  }

  return NextResponse.json({ ok: true })
}
