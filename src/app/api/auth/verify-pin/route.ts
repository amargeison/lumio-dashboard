import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

const MAX_ATTEMPTS = 5
const LOCK_MINUTES = 15

export async function POST(req: NextRequest) {
  const { email, pin, type } = await req.json().catch(() => ({ email: '', pin: '', type: 'business' }))
  if (!email || !pin) return NextResponse.json({ error: 'Email and PIN required' }, { status: 400 })

  const supabase = getSupabase()

  if (type === 'school') {
    // School PIN login
    const { data: user } = await supabase.from('school_users')
      .select('id, school_id, name, email, role, login_pin, pin_attempts, pin_locked_until')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (!user || !user.login_pin) return NextResponse.json({ error: 'No PIN set for this account' }, { status: 401 })

    // Check lock
    if (user.pin_locked_until && new Date(user.pin_locked_until) > new Date()) {
      const remaining = Math.ceil((new Date(user.pin_locked_until).getTime() - Date.now()) / 60000)
      return NextResponse.json({ error: `Too many attempts — try again in ${remaining} minute${remaining > 1 ? 's' : ''}`, locked: true, minutes_remaining: remaining }, { status: 429 })
    }

    // Verify PIN
    const valid = await bcrypt.compare(pin, user.login_pin)
    if (!valid) {
      const attempts = (user.pin_attempts || 0) + 1
      const update: Record<string, any> = { pin_attempts: attempts }
      if (attempts >= MAX_ATTEMPTS) update.pin_locked_until = new Date(Date.now() + LOCK_MINUTES * 60000).toISOString()
      await supabase.from('school_users').update(update).eq('id', user.id)
      return NextResponse.json({ error: `Invalid PIN (${MAX_ATTEMPTS - attempts} attempts remaining)`, attempts_remaining: MAX_ATTEMPTS - attempts }, { status: 401 })
    }

    // Reset attempts
    await supabase.from('school_users').update({ pin_attempts: 0, pin_locked_until: null }).eq('id', user.id)

    // Get school info
    const { data: school } = await supabase.from('schools').select('slug, name').eq('id', user.school_id).single()

    // Create session
    const token = crypto.randomUUID()
    await supabase.from('school_sessions').insert({
      token, school_id: user.school_id, email: user.email,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })

    return NextResponse.json({
      success: true,
      session_token: token,
      school_slug: school?.slug,
      school_name: school?.name,
      user: { name: user.name, email: user.email, role: user.role },
    })
  }

  // Business PIN login
  const { data: tenant } = await supabase.from('demo_tenants')
    .select('id, slug, company_name, owner_email, owner_name, login_pin, pin_attempts, pin_locked_until, status')
    .eq('owner_email', email.toLowerCase())
    .order('created_at', { ascending: false })
    .maybeSingle()

  if (!tenant || !tenant.login_pin) return NextResponse.json({ error: 'No PIN set for this account' }, { status: 401 })

  // Check lock
  if (tenant.pin_locked_until && new Date(tenant.pin_locked_until) > new Date()) {
    const remaining = Math.ceil((new Date(tenant.pin_locked_until).getTime() - Date.now()) / 60000)
    return NextResponse.json({ error: `Too many attempts — try again in ${remaining} minute${remaining > 1 ? 's' : ''}`, locked: true, minutes_remaining: remaining }, { status: 429 })
  }

  // Verify PIN
  const valid = await bcrypt.compare(pin, tenant.login_pin)
  if (!valid) {
    const attempts = (tenant.pin_attempts || 0) + 1
    const update: Record<string, any> = { pin_attempts: attempts }
    if (attempts >= MAX_ATTEMPTS) update.pin_locked_until = new Date(Date.now() + LOCK_MINUTES * 60000).toISOString()
    await supabase.from('demo_tenants').update(update).eq('id', tenant.id)
    return NextResponse.json({ error: `Invalid PIN (${MAX_ATTEMPTS - attempts} attempts remaining)`, attempts_remaining: MAX_ATTEMPTS - attempts }, { status: 401 })
  }

  // Reset attempts
  await supabase.from('demo_tenants').update({ pin_attempts: 0, pin_locked_until: null }).eq('id', tenant.id)

  // Create session
  const token = crypto.randomUUID()
  await supabase.from('demo_sessions').insert({
    token, tenant_id: tenant.id, email: tenant.owner_email,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  })

  return NextResponse.json({
    success: true,
    session_token: token,
    company: { id: tenant.id, name: tenant.company_name, slug: tenant.slug },
    user: { name: tenant.owner_name, email: tenant.owner_email },
    redirect_to: `/demo/${tenant.slug}`,
  })
}
