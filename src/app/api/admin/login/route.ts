import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/emails/send'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  // Check admin_users
  const { data: admin } = await supabase
    .from('admin_users')
    .select('id, name, role')
    .eq('email', email.toLowerCase())
    .maybeSingle()

  if (!admin) return NextResponse.json({ error: 'Not authorised' }, { status: 403 })

  // Generate OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  await supabase.from('admin_magic_links').insert({
    email: email.toLowerCase(),
    token: code,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  })

  await sendEmail({
    from: 'Lumio Admin <hello@lumiocms.com>',
    to: [email],
    subject: `Lumio Admin login code: ${code}`,
    html: `<p>Your admin login code is: <strong>${code}</strong></p><p>Expires in 10 minutes.</p>`,
  })

  return NextResponse.json({ success: true })
}
