import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

const WEAK_PINS = ['000000', '111111', '222222', '333333', '444444', '555555', '666666', '777777', '888888', '999999', '123456', '654321', '012345']

export async function POST(req: NextRequest) {
  const { email, pin, type } = await req.json().catch(() => ({ email: '', pin: '', type: 'business' }))

  if (!email || !pin) return NextResponse.json({ error: 'Email and PIN required' }, { status: 400 })
  if (!/^\d{6}$/.test(pin)) return NextResponse.json({ error: 'PIN must be exactly 6 digits' }, { status: 400 })
  if (WEAK_PINS.includes(pin)) return NextResponse.json({ error: 'PIN is too simple — choose something less obvious' }, { status: 400 })

  const supabase = getSupabase()
  const hash = await bcrypt.hash(pin, 10)

  if (type === 'school') {
    const { error } = await supabase.from('school_users')
      .update({ login_pin: hash, login_method: 'pin', pin_attempts: 0, pin_locked_until: null })
      .eq('email', email.toLowerCase())
    if (error) return NextResponse.json({ error: 'Failed to set PIN' }, { status: 500 })
  } else {
    const { error } = await supabase.from('demo_tenants')
      .update({ login_pin: hash, login_method: 'pin', pin_attempts: 0, pin_locked_until: null })
      .eq('owner_email', email.toLowerCase())
    if (error) return NextResponse.json({ error: 'Failed to set PIN' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
