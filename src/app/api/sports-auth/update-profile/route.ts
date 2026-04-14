import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase service role credentials missing')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

function getAnonClient(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const authHeader = req.headers.get('authorization')
  return { supabase: createClient(url, key, { global: { headers: authHeader ? { Authorization: authHeader } : {} } }), authHeader }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase: anonClient } = getAnonClient(req)
    const { data: { user }, error: authError } = await anonClient.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { display_name, nickname, avatar_url, brand_name, brand_logo_url } = body as Record<string, string | null | undefined>

    const updateObj: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (display_name !== undefined) updateObj.display_name = display_name
    if (nickname !== undefined) updateObj.nickname = nickname
    if (avatar_url !== undefined) updateObj.avatar_url = avatar_url
    if (brand_name !== undefined) updateObj.brand_name = brand_name
    if (brand_logo_url !== undefined) updateObj.brand_logo_url = brand_logo_url

    if (Object.keys(updateObj).length <= 1) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const serviceClient = getServiceClient()
    const { error } = await serviceClient.from('sports_profiles').update(updateObj).eq('id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Update failed' }, { status: 500 })
  }
}
