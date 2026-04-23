import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSpendState, DAILY_CAP_USD, MODEL_RATES } from '@/lib/ai/guards'

// ──────────────────────────────────────────────────────────────────────────
// Admin-only read endpoint for the GLOBAL daily AI spend counter.
//
// Aggregate across all /api/ai/* routes that import from src/lib/ai/guards
// — today that means cricket/quick-action + the 7 sport generic proxies.
// Per-sport breakdown is included for the admin dashboard tile.
//
// Auth — either of:
//   (a) ADMIN_API_TOKEN env var via x-admin-token header (curl / CI access)
//   (b) a valid admin_sessions row via x-admin-token header (admin UI flow
//       that sets localStorage.admin_session_token on OTP login)
//
// Counter is in-memory; resets at UTC midnight or on process restart.
// ──────────────────────────────────────────────────────────────────────────

async function isAuthorised(req: NextRequest): Promise<boolean> {
  const token = req.headers.get('x-admin-token')
  if (!token) return false

  // (a) static env token — used by curl + VPS tooling
  const envToken = process.env.ADMIN_API_TOKEN
  if (envToken && token === envToken) return true

  // (b) admin_sessions row — used by the admin UI after OTP login
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return false
  try {
    const supabase = createClient(url, key)
    const { data } = await supabase
      .from('admin_sessions')
      .select('admin_id')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()
    return !!data
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  if (!(await isAuthorised(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const s = getSpendState()
  const bySport = Object.fromEntries(
    Object.entries(s.bySport).map(([k, v]) => [
      k,
      { spendUsd: Number(v.spendUsd.toFixed(4)), calls: v.calls },
    ]),
  )

  return NextResponse.json({
    date:         s.date,
    spendUsd:     Number(s.spendUsd.toFixed(4)),
    capUsd:       DAILY_CAP_USD,
    calls:        s.calls,
    lastCallAt:   s.lastCallAt ? new Date(s.lastCallAt).toISOString() : null,
    utilisation:  Number(s.utilisation.toFixed(3)),
    remainingUsd: Number((DAILY_CAP_USD - s.spendUsd).toFixed(4)),
    bySport,
    modelRates:   MODEL_RATES,
    storage:      'in-memory (resets on process restart)',
  })
}
