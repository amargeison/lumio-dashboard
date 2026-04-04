import { NextRequest, NextResponse } from 'next/server'
import { getBusinessId, getIntegrationToken, flagTokenExpired } from '@/lib/integrations/tokenHelper'

export async function GET(req: NextRequest) {
  const wsToken = req.headers.get('x-workspace-token')
  if (!wsToken) return NextResponse.json({ error: 'No token' }, { status: 401 })
  const businessId = await getBusinessId(wsToken)
  if (!businessId) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  const tokenData = await getIntegrationToken(businessId, ['freeagent'])
  if (!tokenData) return NextResponse.json({ error: 'FreeAgent not connected', code: 'NOT_CONNECTED', auth_required: true }, { status: 404 })

  const { access_token } = tokenData
  const headers = { Authorization: `Bearer ${access_token}` }

  try {
    const [invRes, billRes] = await Promise.all([
      fetch('https://api.freeagent.com/v2/invoices?view=outstanding', { headers }),
      fetch('https://api.freeagent.com/v2/bills?view=open', { headers }),
    ])

    if (invRes.status === 401 || billRes.status === 401) {
      await flagTokenExpired(businessId, ['freeagent']); return NextResponse.json({ error: 'Token expired', code: 'TOKEN_EXPIRED' }, { status: 401 })
    }

    const invData = invRes.ok ? await invRes.json() : { invoices: [] }
    const billData = billRes.ok ? await billRes.json() : { bills: [] }
    const invoices = (invData.invoices || []) as { due_value: number; due_date: string }[]
    const bills = (billData.bills || []) as { due_value: number; due_date: string }[]
    const today = new Date().toISOString().split('T')[0]

    return NextResponse.json({
      provider: 'freeagent',
      outstanding: invoices.reduce((s, i) => s + (i.due_value || 0), 0),
      billsDue: bills.reduce((s, i) => s + (i.due_value || 0), 0),
      overdueCount: invoices.filter(i => i.due_date && i.due_date < today).length + bills.filter(b => b.due_date && b.due_date < today).length,
      invoiceCount: invoices.length, billCount: bills.length,
    })
  } catch (err) { console.error('[freeagent/snapshot]', err); return NextResponse.json({ error: 'Something went wrong' }, { status: 500 }) }
}
