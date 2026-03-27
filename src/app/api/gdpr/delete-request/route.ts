import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase()
  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    const body = await request.json()
    const { requestType, email, details, submittedAt } = body

    const reference = `GDPR-${Date.now().toString(36).toUpperCase()}`
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB')

    await supabase.from('gdpr_requests').insert({
      reference,
      request_type: requestType,
      email,
      details,
      status: 'received',
      submitted_at: submittedAt,
      due_by: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })

    // Auto-handle demo deletion immediately
    if (requestType === 'delete_demo') {
      const { data: tenant } = await supabase
        .from('demo_tenants')
        .select('id, slug')
        .eq('owner_email', email.toLowerCase())
        .neq('status', 'deleted')
        .maybeSingle()

      if (tenant) {
        await supabase
          .from('demo_tenants')
          .update({ status: 'deleted', deleted_at: new Date().toISOString() })
          .eq('id', tenant.id)
        await supabase.from('demo_sessions').delete().eq('tenant_id', tenant.id)
      }
    }

    // Send confirmation to requester
    await resend.emails.send({
      from: 'Lumio Privacy <privacy@lumiocms.com>',
      to: [email],
      subject: `Data request received — Reference ${reference}`,
      html: `
        <p>We&apos;ve received your data request (<strong>${reference}</strong>) and will respond within 30 calendar days.</p>
        <p>Request type: ${requestType.replace(/_/g, ' ')}</p>
        <p>Response due by: ${dueDate}</p>
        <p>If you have questions, reply to this email or contact <a href="mailto:privacy@lumiocms.com">privacy@lumiocms.com</a>.</p>
        <p style="color:#999;font-size:12px;">Lumio Ltd · UK GDPR compliant</p>
      `,
    })

    // Notify DPO
    await resend.emails.send({
      from: 'Lumio System <privacy@lumiocms.com>',
      to: ['privacy@lumiocms.com'],
      subject: `[GDPR] ${reference} — ${requestType} — ${email}`,
      html: `
        <p><strong>Reference:</strong> ${reference}</p>
        <p><strong>Type:</strong> ${requestType}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Details:</strong> ${details || 'None provided'}</p>
        <p><strong>Due by:</strong> ${dueDate}</p>
      `,
    })

    return NextResponse.json({ success: true, reference })
  } catch (error) {
    console.error('GDPR request error:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
