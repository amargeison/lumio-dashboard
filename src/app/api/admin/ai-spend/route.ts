import { NextRequest, NextResponse } from 'next/server'
import { getSpendState, DAILY_CAP_USD, MODEL_RATES } from '@/lib/ai/guards'

// ──────────────────────────────────────────────────────────────────────────
// Admin-only read endpoint for the GLOBAL daily AI spend counter.
//
// Aggregate across all /api/ai/* routes that import from src/lib/ai/guards
// — today that means cricket/quick-action + the 7 sport generic proxies.
// Per-sport breakdown is included for the admin dashboard tile.
//
// Guard: ADMIN_API_TOKEN env var. Send as `x-admin-token` header. This is
// shared with the rest of the admin API surface.
//
// Counter is in-memory; resets at UTC midnight or on process restart.
// ──────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const token = req.headers.get('x-admin-token')
  const expected = process.env.ADMIN_API_TOKEN
  if (!expected) {
    return NextResponse.json({ error: 'ADMIN_API_TOKEN not configured on the server.' }, { status: 500 })
  }
  if (token !== expected) {
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
