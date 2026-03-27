import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  const { email, code } = await req.json()

  if (!email || !code) return NextResponse.json({ error: 'Email and code required' }, { status: 400 })

  // Dev bypass
  const isDev = process.env.NEXT_PUBLIC_ENV === 'dev' || process.env.NODE_ENV !== 'production'
  if (isDev && code === '000000') {
    const { data: admin } = await supabase.from('admin_users').select('*').eq('email', email.toLowerCase()).maybeSingle()
    if (!admin) return NextResponse.json({ error: 'Not authorised' }, { status: 403 })
    const token = crypto.randomUUID()
    await supabase.from('admin_sessions').insert({ token, admin_id: admin.id, email: email.toLowerCase(), expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() })
    await supabase.from('admin_users').update({ last_login: new Date().toISOString() }).eq('id', admin.id)
    return NextResponse.json({ session_token: token, admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role } })
  }

  const { data: link } = await supabase
    .from('admin_magic_links')
    .select('*')
    .eq('email', email.toLowerCase())
    .eq('token', code)
    .eq('used', false)
    .maybeSingle()

  if (!link) return NextResponse.json({ error: 'Invalid or expired code' }, { status: 401 })
  if (new Date(link.expires_at) < new Date()) return NextResponse.json({ error: 'Code expired' }, { status: 401 })

  await supabase.from('admin_magic_links').update({ used: true }).eq('id', link.id)

  const { data: admin } = await supabase.from('admin_users').select('*').eq('email', email.toLowerCase()).maybeSingle()
  if (!admin) return NextResponse.json({ error: 'Not authorised' }, { status: 403 })

  const token = crypto.randomUUID()
  await supabase.from('admin_sessions').insert({
    token, admin_id: admin.id, email: email.toLowerCase(),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  })
  await supabase.from('admin_users').update({ last_login: new Date().toISOString() }).eq('id', admin.id)

  return NextResponse.json({ session_token: token, admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role } })
}
