import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase()
  try {
    const body = await request.json()
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown'

    // Hash the IP — never store raw IPs (GDPR compliant)
    const ipHash = await hashString(ip)

    await supabase.from('cookie_consent_log').insert({
      essential: true,
      analytics: !!body.analytics,
      marketing: !!body.marketing,
      level: body.level,
      ip_hash: ipHash,
      user_agent: request.headers.get('user-agent')?.slice(0, 200) || null,
    })

    return NextResponse.json({ success: true })
  } catch {
    // Fail silently — consent logging should never block the user
    return NextResponse.json({ success: true })
  }
}

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}
