import { NextRequest, NextResponse } from 'next/server'
import { getSpendState, DAILY_CAP_USD, MODEL_RATES } from '@/lib/ai/guards'

const ADMIN_TOKEN = process.env.SPORTS_ADMIN_TOKEN || 'lumio-sports-admin-2026'

// Sports-admin view of the GLOBAL daily AI spend counter (same in-memory
// counter the CMS /api/admin/ai-spend reads). Gated by the static sports admin
// token. Counter resets at UTC midnight or on process restart.
export async function GET(req: NextRequest) {
  const token = req.headers.get('x-admin-token')
  if (token !== ADMIN_TOKEN) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const s = getSpendState()
  const bySport = Object.fromEntries(
    Object.entries(s.bySport).map(([k, v]) => [k, { spendUsd: Number(v.spendUsd.toFixed(4)), calls: v.calls }]),
  )

  return NextResponse.json({
    date: s.date,
    spendUsd: Number(s.spendUsd.toFixed(4)),
    capUsd: DAILY_CAP_USD,
    calls: s.calls,
    lastCallAt: s.lastCallAt ? new Date(s.lastCallAt).toISOString() : null,
    utilisation: Number(s.utilisation.toFixed(3)),
    remainingUsd: Number((DAILY_CAP_USD - s.spendUsd).toFixed(4)),
    bySport,
    modelRates: MODEL_RATES,
    storage: 'in-memory (resets on process restart)',
  })
}
