import { NextRequest, NextResponse } from 'next/server'
import { getSpendState, DEMO_AI_DAILY_CAP_USD, MODEL_RATES } from '@/app/api/ai/cricket/quick-action/route'

// ──────────────────────────────────────────────────────────────────────────
// Admin-only read endpoint for the cricket demo daily AI spend counter.
//
// Guard: ADMIN_API_TOKEN env var. Send as `x-admin-token` header. Not
// meant to be bulletproof auth — good enough to keep the counter out of
// public view. When we have a proper admin auth stack wired, swap to it.
//
// Counter is in-memory (per route.ts). Resets at UTC midnight or on
// process restart. GET-only.
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
  const utilisation = s.spendUsd / DEMO_AI_DAILY_CAP_USD
  return NextResponse.json({
    date:         s.date,
    spendUsd:     Number(s.spendUsd.toFixed(4)),
    capUsd:       DEMO_AI_DAILY_CAP_USD,
    calls:        s.calls,
    lastCallAt:   s.lastCallAt ? new Date(s.lastCallAt).toISOString() : null,
    utilisation:  Number(utilisation.toFixed(3)),
    remainingUsd: Number((DEMO_AI_DAILY_CAP_USD - s.spendUsd).toFixed(4)),
    modelRates:   MODEL_RATES,
    storage:      'in-memory (resets on process restart)',
  })
}
