import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

// Called nightly by n8n webhook — requires secret key
export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  const resend = new Resend(process.env.RESEND_API_KEY)
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CLEANUP_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const in2Days = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)

  // Find tenants expiring in ≤ 2 days who haven't been warned yet
  const { data: toWarn } = await supabase
    .from('demo_tenants')
    .select('id, owner_email, owner_name, company_name, slug, expires_at')
    .eq('status', 'active')
    .lte('expires_at', in2Days.toISOString())
    .is('warned_at', null)

  // Find expired tenants to delete
  const { data: toDelete } = await supabase
    .from('demo_tenants')
    .select('id, owner_email, owner_name, company_name, slug')
    .eq('status', 'active')
    .lte('expires_at', now.toISOString())

  let warned = 0
  let deleted = 0

  // Send day-12 warning emails
  if (toWarn?.length) {
    await Promise.allSettled(
      toWarn.map(async tenant => {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.lumiocms.com'
        await resend.emails.send({
          from: 'Lumio <hello@lumiocms.com>',
          to: [tenant.owner_email],
          subject: `⚠️ Your Lumio demo expires in 2 days`,
          html: `
            <!DOCTYPE html>
            <html>
            <body style="font-family:-apple-system,Arial,sans-serif;background:#050508;color:#fff;margin:0;padding:0;">
              <div style="max-width:480px;margin:40px auto;background:#1a1a2e;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);">
                <div style="background:#B45309;padding:24px 32px;">
                  <div style="font-size:20px;font-weight:900;letter-spacing:0.1em;color:white;">LUMIO</div>
                </div>
                <div style="padding:32px;">
                  <h2 style="color:white;margin:0 0 8px;">Your demo expires in 2 days</h2>
                  <p style="color:rgba(255,255,255,0.5);font-size:14px;line-height:1.6;margin:0 0 16px;">
                    Hi ${tenant.owner_name}, your <strong style="color:white;">${tenant.company_name}</strong> demo workspace
                    will be permanently deleted on ${new Date(tenant.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}.
                  </p>
                  <p style="color:rgba(255,255,255,0.5);font-size:14px;line-height:1.6;margin:0 0 24px;">
                    Upgrade to keep your workspace, workflows, and data — or book a call to see a full demo.
                  </p>
                  <a href="https://lumiocms.com/pricing"
                     style="display:block;text-align:center;background:#7C3AED;color:white;text-decoration:none;padding:14px 24px;border-radius:12px;font-weight:700;font-size:15px;margin-bottom:12px;">
                    Upgrade to Lumio →
                  </a>
                  <a href="${appUrl}/demo/${tenant.slug}"
                     style="display:block;text-align:center;border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.7);text-decoration:none;padding:12px 24px;border-radius:12px;font-size:14px;">
                    Return to my workspace
                  </a>
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
        await supabase
          .from('demo_tenants')
          .update({ warned_at: now.toISOString() })
          .eq('id', tenant.id)
      })
    )
    warned = toWarn.length
  }

  // Delete expired tenants
  if (toDelete?.length) {
    const ids = toDelete.map(t => t.id)

    // Delete child records first
    await supabase.from('demo_sessions').delete().in('tenant_id', ids)
    await supabase.from('demo_magic_links').delete().in('slug', toDelete.map(t => t.slug))

    // Mark tenants as deleted
    await supabase
      .from('demo_tenants')
      .update({ status: 'deleted', deleted_at: now.toISOString() })
      .in('id', ids)

    // Send deletion confirmation emails
    await Promise.allSettled(
      toDelete.map(tenant =>
        resend.emails.send({
          from: 'Lumio <hello@lumiocms.com>',
          to: [tenant.owner_email],
          subject: `Your Lumio demo workspace has been deleted`,
          html: `
            <p>Hi ${tenant.owner_name},</p>
            <p>Your <strong>${tenant.company_name}</strong> demo workspace and all associated data have been permanently deleted, as stated at signup.</p>
            <p>If you'd like to continue with Lumio, <a href="https://lumiocms.com/pricing">view our plans</a> or <a href="https://lumiocms.com/demo">book a call</a>.</p>
            <p style="color:#999;font-size:12px;">Lumio Ltd · privacy@lumiocms.com · UK GDPR compliant</p>
          `,
        })
      )
    )

    deleted = toDelete.length
  }

  return NextResponse.json({ success: true, warned, deleted })
}
