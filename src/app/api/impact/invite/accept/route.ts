import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { hashInviteToken } from '@/lib/impact/invites'

export const dynamic = 'force-dynamic'

// The signed-in user exchanges their token for a membership. The database decides:
// single use, not expired, not revoked, and sent to this user's own address.
export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const db = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
  })
  const { data: { user } } = await db.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 })
  const { token } = (await req.json().catch(() => ({}))) as { token?: unknown }
  if (typeof token !== 'string' || !token) return NextResponse.json({ error: 'This invite isn’t valid. Ask for a new one.' }, { status: 400 })
  const { data, error } = await db.rpc('impact_accept_invite', { p_token_hash: hashInviteToken(token) })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
