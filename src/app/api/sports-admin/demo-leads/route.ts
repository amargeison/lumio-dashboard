import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_TOKEN = process.env.SPORTS_ADMIN_TOKEN || 'lumio-sports-admin-2026'

// Demo signups are captured in `sports_demo_leads` (separate from sports_profiles).
export async function GET(req: NextRequest) {
  const token = req.headers.get('x-admin-token')
  if (token !== ADMIN_TOKEN) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return NextResponse.json({ leads: [] })

  const supabase = createClient(url, key)
  try {
    const { data, error } = await supabase
      .from('sports_demo_leads')
      .select('*')
      .order('last_seen', { ascending: false })
    if (error) return NextResponse.json({ leads: [], error: error.message })
    return NextResponse.json({ leads: data || [], total: (data || []).length })
  } catch {
    // Table may not exist yet — return empty rather than erroring.
    return NextResponse.json({ leads: [] })
  }
}

// Remove a demo lead. The row is a lead-capture record, not an account — deleting
// it removes them from this list and nothing else. Their Supabase auth user (if
// they have one) and any real portal they own are untouched, which is the whole
// difference from the delete on the live accounts page.
//
// Keyed on email + sport because that is the pair the table is unique on: the
// same person trying the tennis demo and the coach demo is two leads, and
// deleting one must not silently take the other.
export async function DELETE(req: NextRequest) {
  const token = req.headers.get('x-admin-token')
  if (token !== ADMIN_TOKEN) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { email, sport, block, reason } = (await req.json().catch(() => ({}))) as
    { email?: string; sport?: string; block?: boolean; reason?: string }
  if (!email) return NextResponse.json({ error: 'email is required' }, { status: 400 })
  if (!block && !sport) return NextResponse.json({ error: 'sport is required' }, { status: 400 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  const supabase = createClient(url, key)
  const emailLc = email.toLowerCase()

  if (!block) {
    // Tidy the list. Keyed on email + sport because that is the pair the table is
    // unique on — trying the tennis demo and the coach demo is two leads.
    const { error } = await supabase.from('sports_demo_leads')
      .delete().eq('email', emailLc).eq('sport', sport!)
    if (error) {
      console.error('[sports-admin/demo-leads] delete', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true, blocked: false })
  }

  // ── Block: actually keep them out ──────────────────────────────────────────
  // ORDER MATTERS. The block goes down FIRST, before anything is deleted.
  // Deleting first leaves a window in which the account is gone but nothing
  // stops a fresh sign-up recreating it — and that window is exactly when a
  // competitor who has just been kicked out is most likely to try again.
  const { error: blockErr } = await supabase.from('sports_blocked_emails')
    .upsert({ email: emailLc, reason: reason || null, blocked_at: new Date().toISOString(), blocked_by: 'sports-admin' },
      { onConflict: 'email' })
  if (blockErr) {
    console.error('[sports-admin/demo-leads] block', blockErr.message)
    return NextResponse.json({ error: blockErr.message }, { status: 500 })
  }

  // Every lead row for the address, across every sport they tried.
  await supabase.from('sports_demo_leads').delete().eq('email', emailLc)

  // And the auth user, so any live session dies with it. On its own this would
  // achieve nothing — the next OTP would mint a new one — which is why the
  // block above is the part that does the work.
  let authDeleted = false
  try {
    const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 })
    const hit = list?.users?.find(u => (u.email || '').toLowerCase() === emailLc)
    if (hit) {
      const { error: delErr } = await supabase.auth.admin.deleteUser(hit.id)
      authDeleted = !delErr
      if (delErr) console.error('[sports-admin/demo-leads] auth delete', delErr.message)
    }
  } catch (e) { console.error('[sports-admin/demo-leads] auth delete', e) }

  return NextResponse.json({ ok: true, blocked: true, authDeleted })
}
