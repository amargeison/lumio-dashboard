import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { impactHq } from '@/lib/impact/import-auth'
import { publicSiteOrigin } from '@/lib/public-origin'

export const runtime = 'nodejs'

// The org's private address for leads sent in by an automation: Meta lead ads
// through Zapier or Make, a website form, anything that can POST.
//
//   GET   the address, if there is one, and when it was last used
//   POST  make one, or { rotate: true } to replace it (the old one stops working)
//
// HQ only. Browser sessions can't write tokens (224 revokes it), so writes use
// the service key, here on the server, after the HQ check.

const address = (req: NextRequest, token: string) => `${publicSiteOrigin(new URL(req.url).origin)}/api/impact/leads/in/${token}`
const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })

export async function GET(req: NextRequest) {
  const who = await impactHq('see the leads address')
  if (who instanceof NextResponse) return who
  const { data } = await who.db.from('impact_lead_hooks').select('token, last_used_at').eq('hq_id', who.user.id).maybeSingle()
  return NextResponse.json({ url: data ? address(req, data.token as string) : null, lastUsedAt: data?.last_used_at || null })
}

export async function POST(req: NextRequest) {
  const who = await impactHq('make a leads address')
  if (who instanceof NextResponse) return who
  const { rotate } = (await req.json().catch(() => ({}))) as { rotate?: boolean }
  const db = admin()
  const { data: had } = await db.from('impact_lead_hooks').select('token, last_used_at').eq('hq_id', who.user.id).maybeSingle()
  let token = had?.token as string | undefined
  if (!token || rotate) {
    token = randomBytes(18).toString('base64url')
    const { error } = await db.from('impact_lead_hooks').upsert({ hq_id: who.user.id, token, last_used_at: null, created_at: new Date().toISOString() })
    if (error) return NextResponse.json({ error: 'The address could not be made. Please try again.' }, { status: 500 })
  }
  return NextResponse.json({ url: address(req, token), lastUsedAt: !rotate && had?.token === token ? had?.last_used_at || null : null })
}
