import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'node:crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Source = 'business' | 'schools'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const HASH_SALT = 'lumio-waitlist-v1'

// In-memory rate limit. Resets on cold start — acceptable for a low-volume
// waitlist. If we ever see abuse we swap to a Supabase-backed counter.
const rateBuckets = new Map<string, { count: number; windowStart: number }>()

function pickIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for') ?? ''
  const first = xff.split(',')[0]?.trim()
  if (first) return first
  return req.headers.get('x-real-ip')
    || req.headers.get('cf-connecting-ip')
    || 'unknown'
}

function hashIp(ip: string): string {
  return createHash('sha256').update(ip + HASH_SALT).digest('hex')
}

function rateLimited(ipHash: string): boolean {
  const now = Date.now()
  const bucket = rateBuckets.get(ipHash)
  if (!bucket || now - bucket.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateBuckets.set(ipHash, { count: 1, windowStart: now })
    return false
  }
  bucket.count += 1
  return bucket.count > RATE_LIMIT_MAX
}

async function sendConfirmationEmail(email: string, source: Source): Promise<void> {
  const key = process.env.RESEND_API_KEY
  if (!key) return
  const body = {
    from: 'Lumio <hello@lumiocms.com>',
    to: email,
    subject: source === 'schools'
      ? "You're on the Lumio Schools waitlist"
      : "You're on the Lumio Business waitlist",
    html: source === 'schools'
      ? `<p>Thanks for joining the Lumio Schools waitlist.</p>
         <p>We'll be in touch when founding schools open in late 2026.</p>
         <p>— The Lumio team</p>`
      : `<p>Thanks for joining the Lumio Business waitlist.</p>
         <p>We'll be in touch when founding customers open in late 2026.</p>
         <p>— The Lumio team</p>`,
  }
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  } catch {
    // Silent — confirmation email is best-effort, row is already saved.
  }
}

export async function POST(req: NextRequest) {
  let payload: Record<string, unknown>
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : ''
  const source = payload.source
  const name = typeof payload.name === 'string' ? payload.name.trim() : null
  const company = typeof payload.company === 'string' ? payload.company.trim() : null
  const role = typeof payload.role === 'string' ? payload.role.trim() : null
  const useCase = typeof payload.useCase === 'string' ? payload.useCase.trim() : null

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }
  if (source !== 'business' && source !== 'schools') {
    return NextResponse.json({ error: 'Invalid source' }, { status: 400 })
  }

  const ip = pickIp(req)
  const ipHash = hashIp(ip)
  if (rateLimited(ipHash)) {
    return NextResponse.json(
      { error: 'Too many requests. Try again in a few minutes.' },
      { status: 429 },
    )
  }

  const userAgent = req.headers.get('user-agent')?.slice(0, 512) ?? null

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    console.error('[waitlist] missing Supabase env vars')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { error } = await supabase.from('lumio_waitlist').insert({
    email,
    source,
    name: name || null,
    company: company || null,
    role: role || null,
    use_case: useCase || null,
    ip_hash: ipHash,
    user_agent: userAgent,
  })

  if (error) {
    // 23505 = unique_violation on (email, source). Treat as success so the
    // response never leaks whether the row already existed.
    if (error.code === '23505') {
      return NextResponse.json({ ok: true, message: "You're already on the list." })
    }
    console.error('[waitlist] insert failed:', error)
    return NextResponse.json({ error: 'Could not save. Please try again.' }, { status: 500 })
  }

  // Fire-and-forget confirmation email — don't block the response.
  void sendConfirmationEmail(email, source as Source)

  return NextResponse.json({ ok: true, message: "You're on the list." })
}
